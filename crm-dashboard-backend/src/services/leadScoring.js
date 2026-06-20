import prisma from '../utils/prisma.js';

export async function recalculateContactScore(contactId) {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: {
      activities: { orderBy: { createdAt: 'desc' }, take: 1 },
      _count: { select: { activities: true } },
      deals: { select: { value: true } },
    },
  });

  if (!contact) return;

  const maxDealValue = contact.deals.length
    ? Math.max(...contact.deals.map((d) => d.value))
    : 0;
  const activityCount = contact._count.activities;

  const daysSinceLastActivity = contact.activities[0]
    ? (Date.now() - new Date(contact.activities[0].createdAt).getTime()) / (1000 * 60 * 60 * 24)
    : 365;

  const recencyScore = Math.max(0, 40 - daysSinceLastActivity * 1.5);
  const activityScore = Math.min(30, activityCount * 4);
  const dealScore = Math.min(30, (maxDealValue / 100000) * 30);

  const score = Math.round(recencyScore + activityScore + dealScore);
  const scoreTier = score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold';

  await prisma.contact.update({
    where: { id: contactId },
    data: { score, scoreTier },
  });

  return { score, scoreTier };
}

export async function recalculateAllContactScores() {
  const contacts = await prisma.contact.findMany({ select: { id: true } });
  for (const { id } of contacts) {
    await recalculateContactScore(id);
  }
}
