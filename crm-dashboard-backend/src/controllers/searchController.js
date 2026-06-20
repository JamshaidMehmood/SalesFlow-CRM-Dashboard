import prisma from '../utils/prisma.js';
import { contactScopeFilter, dealScopeFilter, activityScopeFilter } from '../utils/access.js';

const RESULT_LIMIT = 5;

function buildContactWhere(user, scope, q) {
  return {
    ...contactScopeFilter(user, scope),
    OR: [
      { firstName: { contains: q, mode: 'insensitive' } },
      { lastName: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { company: { contains: q, mode: 'insensitive' } },
    ],
  };
}

function buildDealWhere(user, scope, q) {
  return {
    ...dealScopeFilter(user, scope),
    title: { contains: q, mode: 'insensitive' },
  };
}

function buildActivityWhere(user, scope, q) {
  return {
    ...activityScopeFilter(user, scope),
    content: { contains: q, mode: 'insensitive' },
  };
}

export async function globalSearch(req, res) {
  try {
    const q = req.query.q?.trim();

    if (!q || q.length < 2) {
      return res.json({
        query: q || '',
        contacts: [],
        deals: [],
        activities: [],
        totals: { contacts: 0, deals: 0, activities: 0 },
      });
    }

    const contactWhere = buildContactWhere(req.user, req.dataScope, q);
    const dealWhere = buildDealWhere(req.user, req.dataScope, q);
    const activityWhere = buildActivityWhere(req.user, req.dataScope, q);

    const [contacts, contactTotal, deals, dealTotal, activities, activityTotal] =
      await Promise.all([
        prisma.contact.findMany({
          where: contactWhere,
          take: RESULT_LIMIT,
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            company: true,
          },
        }),
        prisma.contact.count({ where: contactWhere }),
        prisma.deal.findMany({
          where: dealWhere,
          take: RESULT_LIMIT,
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            title: true,
            value: true,
            contactId: true,
            contact: { select: { firstName: true, lastName: true } },
          },
        }),
        prisma.deal.count({ where: dealWhere }),
        prisma.activity.findMany({
          where: activityWhere,
          take: RESULT_LIMIT,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            content: true,
            contactId: true,
            contact: { select: { firstName: true, lastName: true } },
          },
        }),
        prisma.activity.count({ where: activityWhere }),
      ]);

    res.json({
      query: q,
      contacts,
      deals,
      activities,
      totals: {
        contacts: contactTotal,
        deals: dealTotal,
        activities: activityTotal,
      },
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
}
