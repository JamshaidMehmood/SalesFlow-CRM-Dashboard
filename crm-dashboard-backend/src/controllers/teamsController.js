import prisma from '../utils/prisma.js';

export async function getTeams(_req, res) {
  try {
    const teams = await prisma.team.findMany({
      orderBy: { name: 'asc' },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        members: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { members: true } },
      },
    });
    res.json(teams);
  } catch (err) {
    console.error('Get teams error:', err);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
}

export async function createTeam(req, res) {
  try {
    const { name, managerId } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Team name is required' });

    const team = await prisma.team.create({
      data: { name: name.trim(), managerId: managerId || null },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        members: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json(team);
  } catch (err) {
    console.error('Create team error:', err);
    res.status(500).json({ error: 'Failed to create team' });
  }
}

export async function updateTeam(req, res) {
  try {
    const { id } = req.params;
    const { name, managerId } = req.body;

    const team = await prisma.team.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(managerId !== undefined && { managerId: managerId || null }),
      },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        members: { select: { id: true, name: true, email: true } },
      },
    });

    res.json(team);
  } catch (err) {
    console.error('Update team error:', err);
    res.status(500).json({ error: 'Failed to update team' });
  }
}

export async function deleteTeam(req, res) {
  try {
    const { id } = req.params;
    await prisma.user.updateMany({ where: { teamId: id }, data: { teamId: null } });
    await prisma.team.delete({ where: { id } });
    res.json({ message: 'Team deleted' });
  } catch (err) {
    console.error('Delete team error:', err);
    res.status(500).json({ error: 'Failed to delete team' });
  }
}

export async function addTeamMember(req, res) {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    await prisma.user.update({ where: { id: userId }, data: { teamId: id } });
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        members: { select: { id: true, name: true, email: true } },
      },
    });

    res.json(team);
  } catch (err) {
    console.error('Add team member error:', err);
    res.status(500).json({ error: 'Failed to add team member' });
  }
}

export async function removeTeamMember(req, res) {
  try {
    const { id, userId } = req.params;
    const user = await prisma.user.findFirst({ where: { id: userId, teamId: id } });
    if (!user) return res.status(404).json({ error: 'Member not found on this team' });

    await prisma.user.update({ where: { id: userId }, data: { teamId: null } });
    res.json({ message: 'Member removed from team' });
  } catch (err) {
    console.error('Remove team member error:', err);
    res.status(500).json({ error: 'Failed to remove team member' });
  }
}

export async function getReps(_req, res) {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'sales_rep' },
      select: { id: true, name: true, email: true, teamId: true },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (err) {
    console.error('Get reps error:', err);
    res.status(500).json({ error: 'Failed to fetch reps' });
  }
}
