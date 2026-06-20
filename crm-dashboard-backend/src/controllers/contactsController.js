import prisma from '../utils/prisma.js';
import { contactScopeFilter } from '../utils/access.js';
import { recordAudit } from '../utils/audit.js';
import { completeOnboardingStep, ONBOARDING_STEPS } from '../utils/onboarding.js';
import {
  contactListInclude,
  contactDetailInclude,
  serializeContact,
} from '../utils/contactIncludes.js';
import {
  syncContactTags,
  syncCustomFieldValues,
  validateRequiredCustomFields,
} from '../utils/contactPayload.js';
import { findDuplicateContacts } from '../utils/duplicates.js';
import { buildContactWhere, buildContactOrder } from './contactsImportExportController.js';

const SORT_FIELDS = ['firstName', 'lastName', 'email', 'company', 'status', 'createdAt', 'score', 'scoreTier'];

export async function getContacts(req, res) {
  try {
    const where = buildContactWhere(req);
    const orderBy = buildContactOrder(req);

    const contacts = await prisma.contact.findMany({
      where,
      orderBy,
      include: contactListInclude,
    });

    res.json(contacts.map(serializeContact));
  } catch (err) {
    console.error('Get contacts error:', err);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
}

export async function getContact(req, res) {
  try {
    const { id } = req.params;
    const filter = contactScopeFilter(req.user, req.dataScope);

    const contact = await prisma.contact.findFirst({
      where: { id, ...filter },
      include: contactDetailInclude,
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(serializeContact(contact));
  } catch (err) {
    console.error('Get contact error:', err);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
}

export async function createContact(req, res) {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      jobTitle,
      status,
      leadSourceId,
      territoryId,
      tagIds,
      tagNames,
      customFields,
    } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'First name, last name, and email are required' });
    }

    if (!leadSourceId) {
      return res.status(400).json({ error: 'Lead source is required' });
    }

    await validateRequiredCustomFields(customFields || {});

    const ownerId = req.user.role === 'admin' && req.body.ownerId ? req.body.ownerId : req.user.id;

    const owner = await prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner) {
      return res.status(401).json({
        error: 'Session expired. Please sign in again.',
        code: 'SESSION_EXPIRED',
      });
    }

    const duplicates = await findDuplicateContacts({
      email,
      phone,
      ownerFilter: req.user.role === 'admin' ? {} : contactScopeFilter(req.user, req.dataScope),
    });

    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        company,
        jobTitle,
        status: status || 'lead',
        leadSourceId,
        territoryId: territoryId || null,
        ownerId,
      },
      include: contactDetailInclude,
    });

    await syncContactTags(contact.id, tagIds, tagNames, req.user.id);
    await syncCustomFieldValues(contact.id, customFields || {});

    await recordAudit({
      actorId: req.user.id,
      entityType: 'contact',
      entityId: contact.id,
      action: 'create',
      after: { firstName, lastName, email, status: status || 'lead' },
    });
    await completeOnboardingStep(req.user.id, ONBOARDING_STEPS.FIRST_CONTACT);

    const full = await prisma.contact.findUnique({
      where: { id: contact.id },
      include: contactDetailInclude,
    });

    res.status(201).json({
      contact: serializeContact(full),
      duplicateWarning:
        duplicates.length > 0
          ? {
              message: `This may be a duplicate of existing contact(s).`,
              duplicates,
            }
          : null,
    });
  } catch (err) {
    console.error('Create contact error:', err);
    if (err.message?.includes('Custom field')) {
      return res.status(400).json({ error: err.message });
    }
    if (err.code === 'P2003') {
      return res.status(401).json({
        error: 'Session expired. Please sign in again.',
        code: 'SESSION_EXPIRED',
      });
    }
    res.status(500).json({ error: 'Failed to create contact' });
  }
}

export async function updateContact(req, res) {
  try {
    const { id } = req.params;
    const filter = contactScopeFilter(req.user, req.dataScope);

    const existing = await prisma.contact.findFirst({ where: { id, ...filter } });
    if (!existing) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      jobTitle,
      status,
      leadSourceId,
      territoryId,
      ownerId,
      tagIds,
      tagNames,
      customFields,
    } = req.body;

    if (customFields) {
      await validateRequiredCustomFields(customFields);
    }

    const duplicates = await findDuplicateContacts({
      email: email ?? existing.email,
      phone: phone ?? existing.phone,
      excludeId: id,
      ownerFilter: req.user.role === 'admin' ? {} : filter,
    });

    await prisma.contact.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(company !== undefined && { company }),
        ...(jobTitle !== undefined && { jobTitle }),
        ...(status !== undefined && { status }),
        ...(leadSourceId !== undefined && { leadSourceId }),
        ...(territoryId !== undefined && { territoryId: territoryId || null }),
        ...(ownerId !== undefined && req.user.role === 'admin' && { ownerId }),
      },
    });

    await recordAudit({
      actorId: req.user.id,
      entityType: 'contact',
      entityId: id,
      action:
        ownerId !== undefined && ownerId !== existing.ownerId ? 'reassign' : 'update',
      before: existing,
      after: {
        status: status ?? existing.status,
        ownerId: ownerId ?? existing.ownerId,
        territoryId: territoryId ?? existing.territoryId,
      },
    });

    if (tagIds !== undefined || tagNames !== undefined) {
      await syncContactTags(id, tagIds, tagNames, req.user.id);
    }

    if (customFields !== undefined) {
      await syncCustomFieldValues(id, customFields);
    }

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: contactDetailInclude,
    });

    res.json({
      contact: serializeContact(contact),
      duplicateWarning:
        duplicates.length > 0
          ? {
              message: `This may be a duplicate of existing contact(s).`,
              duplicates,
            }
          : null,
    });
  } catch (err) {
    console.error('Update contact error:', err);
    if (err.message?.includes('Custom field')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to update contact' });
  }
}

export async function deleteContact(req, res) {
  try {
    const { id } = req.params;
    const filter = contactScopeFilter(req.user, req.dataScope);

    const existing = await prisma.contact.findFirst({ where: { id, ...filter } });
    if (!existing) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    await recordAudit({
      actorId: req.user.id,
      entityType: 'contact',
      entityId: id,
      action: 'delete',
      before: existing,
    });

    await prisma.contact.delete({ where: { id } });
    res.json({ message: 'Contact deleted' });
  } catch (err) {
    console.error('Delete contact error:', err);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
}

export { SORT_FIELDS };
