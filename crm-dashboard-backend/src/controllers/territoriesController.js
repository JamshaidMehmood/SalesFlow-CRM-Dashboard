import prisma from '../utils/prisma.js';

export async function getTerritories(_req, res) {
  try {
    const territories = await prisma.territory.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { contacts: true } } },
    });
    res.json(territories);
  } catch (err) {
    console.error('Get territories error:', err);
    res.status(500).json({ error: 'Failed to fetch territories' });
  }
}

export async function createTerritory(req, res) {
  try {
    const { name, description } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Territory name is required' });

    const territory = await prisma.territory.create({
      data: { name: name.trim(), description: description?.trim() || null },
    });

    res.status(201).json(territory);
  } catch (err) {
    console.error('Create territory error:', err);
    res.status(500).json({ error: 'Failed to create territory' });
  }
}

export async function updateTerritory(req, res) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const territory = await prisma.territory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
      },
    });

    res.json(territory);
  } catch (err) {
    console.error('Update territory error:', err);
    res.status(500).json({ error: 'Failed to update territory' });
  }
}

export async function deleteTerritory(req, res) {
  try {
    const { id } = req.params;
    await prisma.contact.updateMany({ where: { territoryId: id }, data: { territoryId: null } });
    await prisma.territory.delete({ where: { id } });
    res.json({ message: 'Territory deleted' });
  } catch (err) {
    console.error('Delete territory error:', err);
    res.status(500).json({ error: 'Failed to delete territory' });
  }
}
