import prisma from '../utils/prisma.js';
import { contactScopeFilter, dealScopeFilter } from '../utils/access.js';

export async function getDashboardStats(req, res) {
  try {
    const contactFilter = contactScopeFilter(req.user, req.dataScope);
    const dealFilter = dealScopeFilter(req.user, req.dataScope);
    const taskFilter = req.user.role === 'admin' ? {} : { ownerId: req.user.id };

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [totalLeads, deals, stages, recentActivities, pendingTasks, lostDeals] = await Promise.all([
      prisma.contact.count({ where: contactFilter }),
      prisma.deal.findMany({
        where: dealFilter,
        include: { stage: true },
      }),
      prisma.pipelineStage.findMany({ orderBy: { orderIndex: 'asc' } }),
      prisma.activity.findMany({
        where: req.user.role === 'admin'
          ? {}
          : { contact: { ownerId: req.user.id } },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          contact: { select: { id: true, firstName: true, lastName: true } },
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.task.findMany({
        where: { ...taskFilter, status: 'pending' },
        orderBy: { dueDate: 'asc' },
        include: {
          contact: { select: { id: true, firstName: true, lastName: true, company: true } },
          owner: { select: { id: true, name: true } },
        },
      }),
      prisma.deal.findMany({
        where: {
          ...dealFilter,
          lostReason: { not: null },
        },
        select: { lostReason: true, value: true },
      }),
    ]);

    const wonStage = stages.find((s) => s.isWonStage);
    const openDeals = deals.filter((d) => !d.stage.isWonStage && !d.stage.isLostStage);
    const wonDeals = wonStage ? deals.filter((d) => d.stageId === wonStage.id) : [];
    const totalRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
    const conversionRate = deals.length > 0
      ? Math.round((wonDeals.length / deals.length) * 100)
      : 0;

    const stageBreakdown = stages.map((stage) => ({
      stageId: stage.id,
      stage: stage.name,
      count: deals.filter((d) => d.stageId === stage.id).length,
      value: deals.filter((d) => d.stageId === stage.id).reduce((sum, d) => sum + d.value, 0),
    }));

    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthLabel = date.toLocaleString('default', { month: 'short' });

      const revenue = wonDeals
        .filter((d) => {
          const closeDate = d.updatedAt;
          return closeDate >= date && closeDate <= monthEnd;
        })
        .reduce((sum, d) => sum + d.value, 0);

      monthlyRevenue.push({ month: monthLabel, revenue: Math.round(revenue) });
    }

    const lostReasonBreakdown = {};
    for (const deal of lostDeals) {
      const reason = deal.lostReason;
      if (!lostReasonBreakdown[reason]) {
        lostReasonBreakdown[reason] = { reason, count: 0, value: 0 };
      }
      lostReasonBreakdown[reason].count += 1;
      lostReasonBreakdown[reason].value += deal.value;
    }

    const groupedTasks = {
      overdue: pendingTasks.filter((t) => new Date(t.dueDate) < todayStart),
      today: pendingTasks.filter((t) => {
        const d = new Date(t.dueDate);
        return d >= todayStart && d <= todayEnd;
      }),
      upcoming: pendingTasks.filter((t) => new Date(t.dueDate) > todayEnd),
    };

    res.json({
      kpis: {
        totalLeads,
        totalRevenue: Math.round(totalRevenue),
        conversionRate,
        openDeals: openDeals.length,
      },
      stageBreakdown,
      monthlyRevenue,
      recentActivities,
      tasks: groupedTasks,
      lostReasonBreakdown: Object.values(lostReasonBreakdown),
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
}
