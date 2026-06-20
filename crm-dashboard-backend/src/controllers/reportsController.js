import prisma from '../utils/prisma.js';
import { dealScopeFilter, contactScopeFilter } from '../utils/access.js';
import { parseReportDateRange, getPreviousPeriod } from '../utils/dateRanges.js';

function calcTrend(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function computeMetrics(deals, wonStageId, lostStageId) {
  const won = deals.filter((d) => d.stageId === wonStageId);
  const lost = deals.filter((d) => d.stageId === lostStageId);
  const closed = won.length + lost.length;

  const winRate = closed > 0 ? Math.round((won.length / closed) * 100) : 0;
  const avgDealSize =
    won.length > 0 ? Math.round(won.reduce((sum, d) => sum + d.value, 0) / won.length) : 0;

  const cycleDeals = [...won, ...lost];
  const salesCycleLength =
    cycleDeals.length > 0
      ? Math.round(
          cycleDeals.reduce(
            (sum, d) => sum + (new Date(d.updatedAt) - new Date(d.createdAt)) / 86400000,
            0
          ) / cycleDeals.length
        )
      : 0;

  return { winRate, avgDealSize, salesCycleLength, closedCount: closed };
}

function computeRepComparison(deals, wonStageId, lostStageId, users) {
  return users.map((user) => {
    const userDeals = deals.filter((d) => d.ownerId === user.id);
    const won = userDeals.filter((d) => d.stageId === wonStageId);
    const lost = userDeals.filter((d) => d.stageId === lostStageId);
    const closed = won.length + lost.length;

    return {
      userId: user.id,
      name: user.name,
      dealsClosed: won.length,
      revenue: Math.round(won.reduce((sum, d) => sum + d.value, 0)),
      winRate: closed > 0 ? Math.round((won.length / closed) * 100) : 0,
    };
  });
}

async function getClosedDealsInRange(dealFilter, from, to, wonStageId, lostStageId) {
  const stageIds = [wonStageId, lostStageId].filter(Boolean);
  if (!stageIds.length) return [];

  return prisma.deal.findMany({
    where: {
      ...dealFilter,
      updatedAt: { gte: from, lte: to },
      stageId: { in: stageIds },
    },
    include: {
      stage: true,
      owner: { select: { id: true, name: true } },
    },
  });
}

export async function getReports(req, res) {
  try {
    const { from, to, preset } = parseReportDateRange(req.query);
    const previous = getPreviousPeriod(from, to);
    const dealFilter = dealScopeFilter(req.user, req.dataScope);
    const isAdmin = req.user.role === 'admin';

    const [wonStage, lostStage] = await Promise.all([
      prisma.pipelineStage.findFirst({ where: { isWonStage: true } }),
      prisma.pipelineStage.findFirst({ where: { isLostStage: true } }),
    ]);

    const [currentDeals, previousDeals, users] = await Promise.all([
      getClosedDealsInRange(dealFilter, from, to, wonStage?.id, lostStage?.id),
      getClosedDealsInRange(dealFilter, previous.from, previous.to, wonStage?.id, lostStage?.id),
      prisma.user.findMany({
        where: isAdmin ? { role: 'sales_rep' } : { id: req.user.id },
        select: { id: true, name: true },
      }),
    ]);

    const current = computeMetrics(currentDeals, wonStage?.id, lostStage?.id);
    const prev = computeMetrics(previousDeals, wonStage?.id, lostStage?.id);

    const repComparison = computeRepComparison(
      currentDeals,
      wonStage?.id,
      lostStage?.id,
      users
    ).sort((a, b) => b.revenue - a.revenue);

    const hasData = current.closedCount > 0;

    let teamComparison = [];
    let territoryComparison = [];

    if (isAdmin) {
      const [teams, territories] = await Promise.all([
        prisma.team.findMany({
          include: { members: { select: { id: true } } },
        }),
        prisma.territory.findMany(),
      ]);

      teamComparison = teams.map((team) => {
        const memberIds = team.members.map((m) => m.id);
        const teamDeals = currentDeals.filter((d) => memberIds.includes(d.ownerId));
        const won = teamDeals.filter((d) => d.stageId === wonStage?.id);
        const lost = teamDeals.filter((d) => d.stageId === lostStage?.id);
        const closed = won.length + lost.length;
        return {
          teamId: team.id,
          name: team.name,
          dealsClosed: won.length,
          revenue: Math.round(won.reduce((sum, d) => sum + d.value, 0)),
          winRate: closed > 0 ? Math.round((won.length / closed) * 100) : 0,
        };
      });

      territoryComparison = await Promise.all(
        territories.map(async (territory) => {
          const territoryContactIds = (
            await prisma.contact.findMany({
              where: { territoryId: territory.id },
              select: { id: true },
            })
          ).map((c) => c.id);
          const territoryDeals = currentDeals.filter((d) =>
            territoryContactIds.includes(d.contactId)
          );
          const won = territoryDeals.filter((d) => d.stageId === wonStage?.id);
          const lost = territoryDeals.filter((d) => d.stageId === lostStage?.id);
          const closed = won.length + lost.length;
          return {
            territoryId: territory.id,
            name: territory.name,
            dealsClosed: won.length,
            revenue: Math.round(won.reduce((sum, d) => sum + d.value, 0)),
            winRate: closed > 0 ? Math.round((won.length / closed) * 100) : 0,
          };
        })
      );
    }

    res.json({
      preset,
      from: from.toISOString(),
      to: to.toISOString(),
      hasData,
      metrics: {
        winRate: {
          value: current.winRate,
          trend: calcTrend(current.winRate, prev.winRate),
        },
        avgDealSize: {
          value: current.avgDealSize,
          trend: calcTrend(current.avgDealSize, prev.avgDealSize),
        },
        salesCycleLength: {
          value: current.salesCycleLength,
          trend: calcTrend(current.salesCycleLength, prev.salesCycleLength),
        },
      },
      repComparison,
      teamComparison,
      territoryComparison,
    });
  } catch (err) {
    console.error('Reports error:', err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
}
