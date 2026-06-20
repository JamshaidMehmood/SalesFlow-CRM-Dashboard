import prisma from '../utils/prisma.js';
import { contactScopeFilter } from '../utils/access.js';
import { recordAudit } from '../utils/audit.js';
import { getDuplicateGroups, findDuplicateContacts } from '../utils/duplicates.js';
import {
  contactDetailInclude,
  serializeContact,
} from '../utils/contactIncludes.js';
import { syncContactTags, syncCustomFieldValues } from '../utils/contactPayload.js';

export async function checkDuplicates(req, res) {
  try {
    const { email, phone, excludeId } = req.body;
    const filter = contactScopeFilter(req.user, req.dataScope);
    const duplicates = await findDuplicateContacts({ email, phone, excludeId, ownerFilter: filter });
    res.json({ duplicates });
  } catch (err) {
    console.error('Check duplicates error:', err);
    res.status(500).json({ error: 'Failed to check duplicates' });
  }
}

export async function listDuplicateGroups(req, res) {
  try {
    const filter = req.user.role === 'admin' ? {} : contactScopeFilter(req.user, req.dataScope);
    const groups = await getDuplicateGroups(filter);
    res.json(groups);
  } catch (err) {
    console.error('List duplicate groups error:', err);
    res.status(500).json({ error: 'Failed to fetch duplicate groups' });
  }
}

export async function getMergePreview(req, res) {
  try {
    const { survivorId, mergedId } = req.query;
    const filter = contactScopeFilter(req.user, req.dataScope);

    const [survivor, merged] = await Promise.all([
      prisma.contact.findFirst({ where: { id: survivorId, ...filter }, include: contactDetailInclude }),
      prisma.contact.findFirst({ where: { id: mergedId, ...filter }, include: contactDetailInclude }),
    ]);

    if (!survivor || !merged) {
      return res.status(404).json({ error: 'One or both contacts not found' });
    }

    res.json({
      survivor: serializeContact(survivor),
      merged: serializeContact(merged),
      fields: [
        'firstName',
        'lastName',
        'email',
        'phone',
        'company',
        'jobTitle',
        'status',
        'leadSourceId',
      ],
    });
  } catch (err) {
    console.error('Merge preview error:', err);
    res.status(500).json({ error: 'Failed to load merge preview' });
  }
}

export async function mergeContacts(req, res) {
  try {
    const { survivorId, mergedId, fieldChoices = {} } = req.body;

    if (!survivorId || !mergedId || survivorId === mergedId) {
      return res.status(400).json({ error: 'Valid survivorId and mergedId are required' });
    }

    const filter = contactScopeFilter(req.user, req.dataScope);

    const [survivor, merged] = await Promise.all([
      prisma.contact.findFirst({ where: { id: survivorId, ...filter }, include: contactDetailInclude }),
      prisma.contact.findFirst({ where: { id: mergedId, ...filter }, include: contactDetailInclude }),
    ]);

    if (!survivor || !merged) {
      return res.status(404).json({ error: 'One or both contacts not found' });
    }

    const pick = (field) => {
      const choice = fieldChoices[field] || 'survivor';
      if (choice === 'merged') return merged[field];
      if (choice === 'newest') {
        return new Date(merged.updatedAt) > new Date(survivor.updatedAt)
          ? merged[field]
          : survivor[field];
      }
      return survivor[field];
    };

    const result = await prisma.$transaction(async (tx) => {
      await tx.deal.updateMany({ where: { contactId: mergedId }, data: { contactId: survivorId } });
      await tx.activity.updateMany({ where: { contactId: mergedId }, data: { contactId: survivorId } });
      await tx.note.updateMany({ where: { contactId: mergedId }, data: { contactId: survivorId } });
      await tx.task.updateMany({ where: { contactId: mergedId }, data: { contactId: survivorId } });
      await tx.attachment.updateMany({ where: { contactId: mergedId }, data: { contactId: survivorId } });

      const mergedTags = await tx.contactTag.findMany({ where: { contactId: mergedId } });
      for (const ct of mergedTags) {
        await tx.contactTag.upsert({
          where: { contactId_tagId: { contactId: survivorId, tagId: ct.tagId } },
          create: { contactId: survivorId, tagId: ct.tagId },
          update: {},
        });
      }

      const mergedCustom = await tx.contactCustomValue.findMany({ where: { contactId: mergedId } });
      for (const cv of mergedCustom) {
        const existing = await tx.contactCustomValue.findUnique({
          where: {
            contactId_fieldDefinitionId: {
              contactId: survivorId,
              fieldDefinitionId: cv.fieldDefinitionId,
            },
          },
        });
        if (!existing) {
          await tx.contactCustomValue.create({
            data: {
              contactId: survivorId,
              fieldDefinitionId: cv.fieldDefinitionId,
              value: cv.value,
            },
          });
        }
      }

      const updated = await tx.contact.update({
        where: { id: survivorId },
        data: {
          firstName: pick('firstName'),
          lastName: pick('lastName'),
          email: pick('email'),
          phone: pick('phone'),
          company: pick('company'),
          jobTitle: pick('jobTitle'),
          status: pick('status'),
          leadSourceId: fieldChoices.leadSourceId === 'merged' ? merged.leadSourceId : survivor.leadSourceId,
        },
      });

      await tx.contactMergeLog.create({
        data: {
          mergedBy: req.user.id,
          survivorId,
          mergedContactId: mergedId,
          mergedSnapshot: merged,
        },
      });

      await tx.contactTag.deleteMany({ where: { contactId: mergedId } });
      await tx.contactCustomValue.deleteMany({ where: { contactId: mergedId } });
      await tx.contact.delete({ where: { id: mergedId } });

      return updated;
    });

    const contact = await prisma.contact.findUnique({
      where: { id: result.id },
      include: contactDetailInclude,
    });

    await recordAudit({
      actorId: req.user.id,
      entityType: 'contact',
      entityId: survivorId,
      action: 'merge',
      changes: { mergedContactId: mergedId, mergedSnapshot: { email: merged.email } },
    });

    res.json(serializeContact(contact));
  } catch (err) {
    console.error('Merge contacts error:', err);
    res.status(500).json({ error: 'Failed to merge contacts' });
  }
}
