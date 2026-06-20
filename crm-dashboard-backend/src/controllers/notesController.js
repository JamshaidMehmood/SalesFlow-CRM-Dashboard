import prisma from '../utils/prisma.js';
import { contactScopeFilter } from '../utils/access.js';

export async function getNotes(req, res) {
  try {
    const { contactId } = req.params;
    const filter = contactScopeFilter(req.user, req.dataScope);

    const contact = await prisma.contact.findFirst({
      where: { id: contactId, ...filter },
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const notes = await prisma.note.findMany({
      where: { contactId },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { id: true, name: true } } },
    });

    res.json(notes);
  } catch (err) {
    console.error('Get notes error:', err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
}

export async function createNote(req, res) {
  try {
    const { contactId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const filter = contactScopeFilter(req.user, req.dataScope);
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, ...filter },
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const note = await prisma.note.create({
      data: {
        contactId,
        createdBy: req.user.id,
        content,
      },
      include: { author: { select: { id: true, name: true } } },
    });

    res.status(201).json(note);
  } catch (err) {
    console.error('Create note error:', err);
    res.status(500).json({ error: 'Failed to create note' });
  }
}

export async function deleteNote(req, res) {
  try {
    const { contactId, id } = req.params;
    const filter = contactScopeFilter(req.user, req.dataScope);

    const contact = await prisma.contact.findFirst({
      where: { id: contactId, ...filter },
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    await prisma.note.delete({ where: { id } });
    res.json({ message: 'Note deleted' });
  } catch (err) {
    console.error('Delete note error:', err);
    res.status(500).json({ error: 'Failed to delete note' });
  }
}
