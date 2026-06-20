import prisma from '../utils/prisma.js';
import { contactScopeFilter, dealScopeFilter } from '../utils/access.js';
import { recordAudit } from '../utils/audit.js';
import {
  saveUploadedFile,
  deleteStoredFile,
  getStoredFilePath,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} from '../utils/storage.js';

async function canAccessContact(user, scope, contactId) {
  const filter = contactScopeFilter(user, scope);
  return prisma.contact.findFirst({ where: { id: contactId, ...filter } });
}

async function canAccessDeal(user, scope, dealId) {
  const filter = dealScopeFilter(user, scope);
  return prisma.deal.findFirst({ where: { id: dealId, ...filter } });
}

export async function getAttachments(req, res) {
  try {
    const { contactId, dealId } = req.query;

    if (!contactId && !dealId) {
      return res.status(400).json({ error: 'contactId or dealId is required' });
    }

    if (contactId) {
      const contact = await canAccessContact(req.user, req.dataScope, contactId);
      if (!contact) return res.status(404).json({ error: 'Contact not found' });
    }

    if (dealId) {
      const deal = await canAccessDeal(req.user, req.dataScope, dealId);
      if (!deal) return res.status(404).json({ error: 'Deal not found' });
    }

    const attachments = await prisma.attachment.findMany({
      where: {
        ...(contactId && { contactId }),
        ...(dealId && { dealId }),
      },
      orderBy: { uploadedAt: 'desc' },
      include: { uploader: { select: { id: true, name: true } } },
    });

    res.json(attachments);
  } catch (err) {
    console.error('Get attachments error:', err);
    res.status(500).json({ error: 'Failed to fetch attachments' });
  }
}

export async function uploadAttachment(req, res) {
  try {
    const { contactId, dealId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!contactId && !dealId) {
      return res.status(400).json({ error: 'contactId or dealId is required' });
    }

    if (file.size > MAX_FILE_SIZE) {
      return res.status(400).json({ error: 'File exceeds 10MB limit' });
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return res.status(400).json({ error: 'File type not allowed. Use PDF, DOCX, PNG, or JPG.' });
    }

    if (contactId) {
      const contact = await canAccessContact(req.user, req.dataScope, contactId);
      if (!contact) return res.status(404).json({ error: 'Contact not found' });
    }

    if (dealId) {
      const deal = await canAccessDeal(req.user, req.dataScope, dealId);
      if (!deal) return res.status(404).json({ error: 'Deal not found' });
    }

    const { storageKey } = await saveUploadedFile(file.buffer, file.originalname);

    const attachment = await prisma.attachment.create({
      data: {
        contactId: contactId || null,
        dealId: dealId || null,
        filename: file.originalname,
        fileUrl: '',
        storageKey,
        mimeType: file.mimetype,
        fileSize: file.size,
        uploadedBy: req.user.id,
      },
      include: { uploader: { select: { id: true, name: true } } },
    });

    const updated = await prisma.attachment.update({
      where: { id: attachment.id },
      data: { fileUrl: `/api/attachments/${attachment.id}/download` },
    });

    res.status(201).json(updated);
  } catch (err) {
    console.error('Upload attachment error:', err);
    res.status(500).json({ error: 'Failed to upload attachment' });
  }
}

export async function downloadAttachment(req, res) {
  try {
    const { id } = req.params;
    const attachment = await prisma.attachment.findUnique({ where: { id } });

    if (!attachment) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (attachment.contactId) {
      const contact = await canAccessContact(req.user, req.dataScope, attachment.contactId);
      if (!contact) return res.status(403).json({ error: 'Access denied' });
    }

    if (attachment.dealId) {
      const deal = await canAccessDeal(req.user, req.dataScope, attachment.dealId);
      if (!deal) return res.status(403).json({ error: 'Access denied' });
    }

    res.download(getStoredFilePath(attachment.storageKey), attachment.filename);
  } catch (err) {
    console.error('Download attachment error:', err);
    res.status(500).json({ error: 'Failed to download file' });
  }
}

export async function deleteAttachment(req, res) {
  try {
    const { id } = req.params;
    const attachment = await prisma.attachment.findUnique({ where: { id } });

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    if (attachment.contactId) {
      const contact = await canAccessContact(req.user, req.dataScope, attachment.contactId);
      if (!contact) return res.status(403).json({ error: 'Access denied' });
    }

    if (attachment.dealId) {
      const deal = await canAccessDeal(req.user, req.dataScope, attachment.dealId);
      if (!deal) return res.status(403).json({ error: 'Access denied' });
    }

    await recordAudit({
      actorId: req.user.id,
      entityType: 'attachment',
      entityId: id,
      action: 'delete',
      before: { filename: attachment.filename, contactId: attachment.contactId, dealId: attachment.dealId },
    });

    await deleteStoredFile(attachment.storageKey);
    await prisma.attachment.delete({ where: { id } });

    res.json({ message: 'Attachment deleted' });
  } catch (err) {
    console.error('Delete attachment error:', err);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
}
