import prisma from '../utils/prisma.js';
import { activityScopeFilter, contactScopeFilter } from '../utils/access.js';
import { completeOnboardingStep, ONBOARDING_STEPS } from '../utils/onboarding.js';
import { recalculateContactScore } from '../services/leadScoring.js';

export async function getActivities(req, res) {
  try {
    const { contactId, type } = req.query;
    const filter = activityScopeFilter(req.user, req.dataScope);

    const where = { ...filter };
    if (contactId) where.contactId = contactId;
    if (type) where.type = type;

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        contact: {
          select: { id: true, firstName: true, lastName: true, company: true },
        },
        user: { select: { id: true, name: true } },
      },
    });

    res.json(activities);
  } catch (err) {
    console.error('Get activities error:', err);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
}

export async function createActivity(req, res) {
  try {
    const { contactId, type, content } = req.body;

    if (!contactId || !type || !content) {
      return res.status(400).json({ error: 'contactId, type, and content are required' });
    }

    const contactFilter = contactScopeFilter(req.user, req.dataScope);
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, ...contactFilter },
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }


    const activity = await prisma.activity.create({
      data: {
        contactId,
        userId: req.user.id,
        type,
        content,
      },
      include: {
        contact: {
          select: { id: true, firstName: true, lastName: true, company: true },
        },
        user: { select: { id: true, name: true } },
      },
    });

    await recalculateContactScore(contactId);
    await completeOnboardingStep(req.user.id, ONBOARDING_STEPS.FIRST_ACTIVITY);

    res.status(201).json(activity);
  } catch (err) {
    console.error('Create activity error:', err);
    res.status(500).json({ error: 'Failed to create activity' });
  }
}

export async function deleteActivity(req, res) {
  try {
    const { id } = req.params;
    const filter = activityScopeFilter(req.user, req.dataScope);

    const existing = await prisma.activity.findFirst({ where: { id, ...filter } });
    if (!existing) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    await prisma.activity.delete({ where: { id } });
    res.json({ message: 'Activity deleted' });
  } catch (err) {
    console.error('Delete activity error:', err);
    res.status(500).json({ error: 'Failed to delete activity' });
  }
}
