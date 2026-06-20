import prisma from '../utils/prisma.js';
import { dealScopeFilter, contactScopeFilter } from '../utils/access.js';
import { recordAudit } from '../utils/audit.js';
import { completeOnboardingStep, ONBOARDING_STEPS } from '../utils/onboarding.js';
import { recalculateContactScore } from '../services/leadScoring.js';

const dealInclude = {
  contact: {
    select: { id: true, firstName: true, lastName: true, company: true, email: true },
  },
  owner: { select: { id: true, name: true } },
  stage: true,
};

export async function getDeals(req, res) {
  try {
    const filter = dealScopeFilter(req.user, req.dataScope);
    const { territoryId } = req.query;

    const deals = await prisma.deal.findMany({
      where: {
        ...filter,
        ...(territoryId && { contact: { territoryId } }),
      },
      orderBy: { updatedAt: 'desc' },
      include: dealInclude,
    });

    res.json(deals);
  } catch (err) {
    console.error('Get deals error:', err);
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
}

export async function createDeal(req, res) {
  try {
    const { title, contactId, stageId, value, expectedCloseDate } = req.body;

    if (!title || !contactId) {
      return res.status(400).json({ error: 'Title and contactId are required' });
    }

    const contactFilter = contactScopeFilter(req.user, req.dataScope);
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, ...contactFilter },
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    let resolvedStageId = stageId;
    if (!resolvedStageId) {
      const firstStage = await prisma.pipelineStage.findFirst({ orderBy: { orderIndex: 'asc' } });
      resolvedStageId = firstStage?.id;
    }

    if (!resolvedStageId) {
      return res.status(400).json({ error: 'No pipeline stages configured' });
    }

    const deal = await prisma.deal.create({
      data: {
        title,
        contactId,
        ownerId: contact.ownerId,
        stageId: resolvedStageId,
        value: value || 0,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
      },
      include: dealInclude,
    });

    await recalculateContactScore(contactId);
    await recordAudit({
      actorId: req.user.id,
      entityType: 'deal',
      entityId: deal.id,
      action: 'create',
      after: { title, stageId: resolvedStageId, value: value || 0 },
    });
    await completeOnboardingStep(req.user.id, ONBOARDING_STEPS.FIRST_DEAL);
    res.status(201).json(deal);
  } catch (err) {
    console.error('Create deal error:', err);
    res.status(500).json({ error: 'Failed to create deal' });
  }
}

export async function updateDeal(req, res) {
  try {
    const { id } = req.params;
    const filter = dealScopeFilter(req.user, req.dataScope);

    const existing = await prisma.deal.findFirst({ where: { id, ...filter } });
    if (!existing) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const { title, stageId, value, expectedCloseDate, lostReason, lostReasonNote } = req.body;

    if (stageId) {
      const targetStage = await prisma.pipelineStage.findUnique({ where: { id: stageId } });
      if (targetStage?.isLostStage && !lostReason) {
        return res.status(400).json({
          error: 'Lost reason is required when moving deal to Lost stage',
          requiresLostReason: true,
        });
      }
    }

    const deal = await prisma.deal.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(stageId !== undefined && { stageId }),
        ...(value !== undefined && { value }),
        ...(expectedCloseDate !== undefined && {
          expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        }),
        ...(lostReason !== undefined && { lostReason }),
        ...(lostReasonNote !== undefined && { lostReasonNote }),
      },
      include: dealInclude,
    });

    await recalculateContactScore(existing.contactId);

    await recordAudit({
      actorId: req.user.id,
      entityType: 'deal',
      entityId: id,
      action: stageId !== undefined && stageId !== existing.stageId ? 'update' : 'update',
      before: { stageId: existing.stageId, value: existing.value, title: existing.title },
      after: { stageId: deal.stageId, value: deal.value, title: deal.title },
    });

    res.json(deal);
  } catch (err) {
    console.error('Update deal error:', err);
    res.status(500).json({ error: 'Failed to update deal' });
  }
}

export async function deleteDeal(req, res) {
  try {
    const { id } = req.params;
    const filter = dealScopeFilter(req.user, req.dataScope);

    const existing = await prisma.deal.findFirst({ where: { id, ...filter } });
    if (!existing) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    await recordAudit({
      actorId: req.user.id,
      entityType: 'deal',
      entityId: id,
      action: 'delete',
      before: existing,
    });

    await prisma.deal.delete({ where: { id } });
    await recalculateContactScore(existing.contactId);
    res.json({ message: 'Deal deleted' });
  } catch (err) {
    console.error('Delete deal error:', err);
    res.status(500).json({ error: 'Failed to delete deal' });
  }
}
