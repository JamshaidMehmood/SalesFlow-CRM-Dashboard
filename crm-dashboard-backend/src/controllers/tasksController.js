import prisma from '../utils/prisma.js';
import { contactScopeFilter } from '../utils/access.js';

export async function getTasks(req, res) {
  try {
    const { status, contactId } = req.query;
    const filter = req.user.role === 'admin' ? {} : { ownerId: req.user.id };

    const where = { ...filter };
    if (status) where.status = status;
    if (contactId) where.contactId = contactId;

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      include: {
        contact: {
          select: { id: true, firstName: true, lastName: true, company: true },
        },
        owner: { select: { id: true, name: true } },
      },
    });

    res.json(tasks);
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
}

export async function createTask(req, res) {
  try {
    const { contactId, title, dueDate } = req.body;

    if (!contactId || !title || !dueDate) {
      return res.status(400).json({ error: 'contactId, title, and dueDate are required' });
    }

    const contactFilter = contactScopeFilter(req.user, req.dataScope);
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, ...contactFilter },
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const task = await prisma.task.create({
      data: {
        contactId,
        ownerId: req.user.id,
        title,
        dueDate: new Date(dueDate),
      },
      include: {
        contact: {
          select: { id: true, firstName: true, lastName: true, company: true },
        },
        owner: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(task);
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
}

export async function updateTask(req, res) {
  try {
    const { id } = req.params;
    const filter = req.user.role === 'admin' ? {} : { ownerId: req.user.id };

    const existing = await prisma.task.findFirst({ where: { id, ...filter } });
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { title, dueDate, status } = req.body;

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
        ...(status !== undefined && { status }),
      },
      include: {
        contact: {
          select: { id: true, firstName: true, lastName: true, company: true },
        },
        owner: { select: { id: true, name: true } },
      },
    });

    res.json(task);
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
}

export async function deleteTask(req, res) {
  try {
    const { id } = req.params;
    const filter = req.user.role === 'admin' ? {} : { ownerId: req.user.id };

    const existing = await prisma.task.findFirst({ where: { id, ...filter } });
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await prisma.task.delete({ where: { id } });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
}
