import prisma from '../utils/prisma.js';
import { contactScopeFilter } from '../utils/access.js';

export async function getLeadSources(_req, res) {
  try {
    const sources = await prisma.leadSource.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
    });
    res.json(sources);
  } catch (err) {
    console.error('Get lead sources error:', err);
    res.status(500).json({ error: 'Failed to fetch lead sources' });
  }
}

export async function getAllLeadSources(_req, res) {
  try {
    const sources = await prisma.leadSource.findMany({ orderBy: { orderIndex: 'asc' } });
    res.json(sources);
  } catch (err) {
    console.error('Get all lead sources error:', err);
    res.status(500).json({ error: 'Failed to fetch lead sources' });
  }
}

export async function createLeadSource(req, res) {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const maxOrder = await prisma.leadSource.aggregate({ _max: { orderIndex: true } });
    const source = await prisma.leadSource.create({
      data: { name: name.trim(), orderIndex: (maxOrder._max.orderIndex ?? -1) + 1 },
    });

    res.status(201).json(source);
  } catch (err) {
    console.error('Create lead source error:', err);
    res.status(500).json({ error: 'Failed to create lead source' });
  }
}

export async function updateLeadSource(req, res) {
  try {
    const { id } = req.params;
    const { name, isActive } = req.body;

    const source = await prisma.leadSource.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json(source);
  } catch (err) {
    console.error('Update lead source error:', err);
    res.status(500).json({ error: 'Failed to update lead source' });
  }
}

export async function deleteLeadSource(req, res) {
  try {
    const { id } = req.params;
    const count = await prisma.contact.count({ where: { leadSourceId: id } });
    if (count > 0) {
      await prisma.leadSource.update({ where: { id }, data: { isActive: false } });
      return res.json({ message: 'Lead source deactivated (contacts still reference it)' });
    }
    await prisma.leadSource.delete({ where: { id } });
    res.json({ message: 'Lead source deleted' });
  } catch (err) {
    console.error('Delete lead source error:', err);
    res.status(500).json({ error: 'Failed to delete lead source' });
  }
}

export async function getLeadSourceAnalytics(req, res) {
  try {
    const filter = contactScopeFilter(req.user, req.dataScope);

    const sources = await prisma.leadSource.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
    });

    const wonStage = await prisma.pipelineStage.findFirst({ where: { isWonStage: true } });
    const lostStage = await prisma.pipelineStage.findFirst({ where: { isLostStage: true } });

    const breakdown = await Promise.all(
      sources.map(async (source) => {
        const contacts = await prisma.contact.findMany({
          where: { ...filter, leadSourceId: source.id },
          include: {
            deals: { include: { stage: true } },
          },
        });

        const wonDeals = contacts.flatMap((c) =>
          c.deals.filter((d) => d.stageId === wonStage?.id)
        );
        const lostDeals = contacts.flatMap((c) =>
          c.deals.filter((d) => d.stageId === lostStage?.id)
        );
        const closed = wonDeals.length + lostDeals.length;

        return {
          sourceId: source.id,
          sourceName: source.name,
          contactCount: contacts.length,
          wonDeals: wonDeals.length,
          revenue: Math.round(wonDeals.reduce((sum, d) => sum + d.value, 0)),
          winRate: closed > 0 ? Math.round((wonDeals.length / closed) * 100) : 0,
        };
      })
    );

    res.json(breakdown.filter((b) => b.contactCount > 0));
  } catch (err) {
    console.error('Lead source analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch lead source analytics' });
  }
}
