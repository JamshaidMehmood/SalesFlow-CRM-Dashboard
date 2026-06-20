import prisma from '../utils/prisma.js';

export async function getLeaderboard(req, res) {
  try {
    const metric = req.query.metric === 'deals' ? 'deals' : 'revenue';
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const wonStage = await prisma.pipelineStage.findFirst({ where: { isWonStage: true } });

    if (!wonStage) {
      return res.json({ metric, entries: [] });
    }

    const wonDeals = await prisma.deal.findMany({
      where: {
        stageId: wonStage.id,
        updatedAt: { gte: monthStart, lte: monthEnd },
      },
      select: { ownerId: true, value: true, owner: { select: { id: true, name: true } } },
    });

    const repStats = {};

    for (const deal of wonDeals) {
      if (!repStats[deal.ownerId]) {
        repStats[deal.ownerId] = {
          userId: deal.ownerId,
          name: deal.owner.name,
          dealsClosed: 0,
          revenue: 0,
        };
      }
      repStats[deal.ownerId].dealsClosed += 1;
      repStats[deal.ownerId].revenue += deal.value;
    }

    const salesReps = await prisma.user.findMany({
      where: { role: 'sales_rep' },
      select: { id: true, name: true },
    });

    for (const rep of salesReps) {
      if (!repStats[rep.id]) {
        repStats[rep.id] = { userId: rep.id, name: rep.name, dealsClosed: 0, revenue: 0 };
      }
    }

    const entries = Object.values(repStats)
      .map((entry) => ({
        userId: entry.userId,
        name: entry.name,
        value: metric === 'deals' ? entry.dealsClosed : Math.round(entry.revenue),
        dealsClosed: entry.dealsClosed,
        revenue: Math.round(entry.revenue),
      }))
      .sort((a, b) => b.value - a.value)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    res.json({ metric, entries, currentUserId: req.user.id });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
}
