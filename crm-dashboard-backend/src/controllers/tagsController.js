import prisma from '../utils/prisma.js';
import { recordAudit } from '../utils/audit.js';

const TAG_COLORS = ['#0091ae', '#ff7a59', '#00bda5', '#7c98b6', '#f2545b', '#6366f1'];

export async function getTags(_req, res) {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: { creator: { select: { id: true, name: true } } },
    });
    res.json(tags);
  } catch (err) {
    console.error('Get tags error:', err);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
}

export async function createTag(req, res) {
  try {
    const { name, color } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    const existing = await prisma.tag.findFirst({
      where: { name: { equals: name.trim(), mode: 'insensitive' } },
    });
    if (existing) {
      return res.json(existing);
    }

    const tag = await prisma.tag.create({
      data: {
        name: name.trim(),
        color: color || TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)],
        createdBy: req.user.id,
      },
    });

    await recordAudit({
      actorId: req.user.id,
      entityType: 'tag',
      entityId: tag.id,
      action: 'create',
      after: { name: tag.name },
    });

    res.status(201).json(tag);
  } catch (err) {
    console.error('Create tag error:', err);
    res.status(500).json({ error: 'Failed to create tag' });
  }
}

export async function deleteTag(req, res) {
  try {
    const { id } = req.params;
    const existing = await prisma.tag.findUnique({ where: { id } });

    await recordAudit({
      actorId: req.user.id,
      entityType: 'tag',
      entityId: id,
      action: 'delete',
      before: existing ? { name: existing.name } : undefined,
    });

    await prisma.contactTag.deleteMany({ where: { tagId: id } });
    await prisma.tag.delete({ where: { id } });
    res.json({ message: 'Tag deleted' });
  } catch (err) {
    console.error('Delete tag error:', err);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
}
