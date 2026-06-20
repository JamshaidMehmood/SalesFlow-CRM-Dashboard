import prisma from '../utils/prisma.js';
import { dealScopeFilter } from '../utils/access.js';

export async function getForecast(req, res) {
  try {
    const period = req.query.period === 'quarter' ? 'quarter' : 'month';
    const dealFilter = dealScopeFilter(req.user, req.dataScope);
    const now = new Date();
    const isAdmin = req.user.role === 'admin';

    const [stages, deals] = await Promise.all([
      prisma.pipelineStage.findMany({ orderBy: { orderIndex: 'asc' } }),
      prisma.deal.findMany({
        where: dealFilter,
        include: { stage: true },
      }),
    ]);

    const openDeals = deals.filter((d) => !d.stage.isWonStage && !d.stage.isLostStage);

    const stageBreakdown = stages
      .filter((s) => !s.isWonStage && !s.isLostStage)
      .map((stage) => {
        const stageDeals = openDeals.filter((d) => d.stageId === stage.id);
        const rawValue = stageDeals.reduce((sum, d) => sum + d.value, 0);
        const forecastedValue = stageDeals.reduce(
          (sum, d) => sum + d.value * ((Number(stage.winProbability) || 0) / 100),
          0
        );

        return {
          stageId: stage.id,
          stageName: stage.name,
          winProbability: stage.winProbability,
          dealCount: stageDeals.length,
          rawValue: Math.round(rawValue),
          forecastedValue: Math.round(forecastedValue),
        };
      });

    const totalForecast = stageBreakdown.reduce((sum, s) => sum + s.forecastedValue, 0);
    const totalRaw = stageBreakdown.reduce((sum, s) => sum + s.rawValue, 0);

    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    let quotaTarget = 0;
    if (isAdmin) {
      const quotas = await prisma.quota.findMany({ where: { month, year } });
      quotaTarget = quotas.reduce((sum, q) => sum + q.targetAmount, 0);
    } else {
      const quota = await prisma.quota.findUnique({
        where: { userId_month_year: { userId: req.user.id, month, year } },
      });
      quotaTarget = quota?.targetAmount ?? 0;
    }

    let quotaStatus = 'no_quota';
    if (quotaTarget > 0) {
      quotaStatus = totalForecast >= quotaTarget ? 'on_track' : 'behind';
    }

    res.json({
      period,
      totalForecast: Math.round(totalForecast),
      totalRaw: Math.round(totalRaw),
      stageBreakdown,
      quotaTarget: Math.round(quotaTarget),
      quotaStatus,
      quotaProgressPct: quotaTarget > 0 ? Math.round((totalForecast / quotaTarget) * 100) : 0,
    });
  } catch (err) {
    console.error('Forecast error:', err);
    res.status(500).json({ error: 'Failed to fetch forecast' });
  }
}
