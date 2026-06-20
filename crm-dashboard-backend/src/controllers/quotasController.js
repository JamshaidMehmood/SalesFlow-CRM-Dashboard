import prisma from '../utils/prisma.js';

function getMonthBounds(month, year) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

async function getWonProgress(userId, month, year) {
  const { start, end } = getMonthBounds(month, year);
  const wonStage = await prisma.pipelineStage.findFirst({ where: { isWonStage: true } });

  if (!wonStage) return 0;

  const deals = await prisma.deal.findMany({
    where: {
      ownerId: userId,
      stageId: wonStage.id,
      updatedAt: { gte: start, lte: end },
    },
    select: { value: true },
  });

  return deals.reduce((sum, d) => sum + d.value, 0);
}

export async function getQuotas(req, res) {
  try {
    const now = new Date();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
    const year = parseInt(req.query.year, 10) || now.getFullYear();

    const quotas = await prisma.quota.findMany({
      where: { month, year },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });

    res.json(quotas);
  } catch (err) {
    console.error('Get quotas error:', err);
    res.status(500).json({ error: 'Failed to fetch quotas' });
  }
}

export async function getQuotaProgress(req, res) {
  try {
    const now = new Date();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
    const year = parseInt(req.query.year, 10) || now.getFullYear();

    const isAdmin = req.user.role === 'admin';
    const users = await prisma.user.findMany({
      where: isAdmin ? { role: 'sales_rep' } : { id: req.user.id },
      select: { id: true, name: true, email: true },
    });

    const quotas = await prisma.quota.findMany({
      where: {
        month,
        year,
        userId: { in: users.map((u) => u.id) },
      },
    });

    const quotaMap = Object.fromEntries(quotas.map((q) => [q.userId, q]));

    const progress = await Promise.all(
      users.map(async (user) => {
        const current = await getWonProgress(user.id, month, year);
        const quota = quotaMap[user.id];
        return {
          userId: user.id,
          name: user.name,
          targetAmount: quota?.targetAmount ?? 0,
          currentAmount: Math.round(current),
          month,
          year,
        };
      })
    );

    if (!isAdmin) {
      return res.json(progress[0] || { userId: req.user.id, targetAmount: 0, currentAmount: 0, month, year });
    }

    res.json(progress);
  } catch (err) {
    console.error('Get quota progress error:', err);
    res.status(500).json({ error: 'Failed to fetch quota progress' });
  }
}

export async function upsertQuota(req, res) {
  try {
    const { userId, month, year, targetAmount } = req.body;

    if (!userId || !month || !year || targetAmount === undefined) {
      return res.status(400).json({ error: 'userId, month, year, and targetAmount are required' });
    }

    const quota = await prisma.quota.upsert({
      where: { userId_month_year: { userId, month, year } },
      create: { userId, month, year, targetAmount },
      update: { targetAmount },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.json(quota);
  } catch (err) {
    console.error('Upsert quota error:', err);
    res.status(500).json({ error: 'Failed to save quota' });
  }
}

export async function deleteQuota(req, res) {
  try {
    const { id } = req.params;
    await prisma.quota.delete({ where: { id } });
    res.json({ message: 'Quota deleted' });
  } catch (err) {
    console.error('Delete quota error:', err);
    res.status(500).json({ error: 'Failed to delete quota' });
  }
}
