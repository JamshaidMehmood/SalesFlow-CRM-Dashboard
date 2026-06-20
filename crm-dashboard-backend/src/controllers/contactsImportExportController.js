import { stringify } from 'csv-stringify/sync';
import { parse } from 'csv-parse/sync';
import prisma from '../utils/prisma.js';
import { contactScopeFilter } from '../utils/access.js';
import {
  contactListInclude,
  serializeContact,
} from '../utils/contactIncludes.js';
import {
  syncContactTags,
  syncCustomFieldValues,
  validateRequiredCustomFields,
} from '../utils/contactPayload.js';
import { findDuplicateContacts } from '../utils/duplicates.js';

const SORT_FIELDS = ['firstName', 'lastName', 'email', 'company', 'status', 'createdAt', 'score', 'scoreTier'];

function buildContactWhere(req) {
  const { search, status, scoreTier, tags, leadSourceId, territoryId } = req.query;
  const filter = contactScopeFilter(req.user, req.dataScope);
  const where = { ...filter };

  if (status) where.status = status;
  if (scoreTier) where.scoreTier = scoreTier;
  if (leadSourceId) where.leadSourceId = leadSourceId;
  if (territoryId) where.territoryId = territoryId;

  if (tags) {
    const tagIds = tags.split(',').filter(Boolean);
    if (tagIds.length) {
      where.tags = { some: { tagId: { in: tagIds } } };
    }
  }

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
    ];
  }

  return where;
}

function buildContactOrder(req) {
  const { sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
  const orderDir = sortOrder === 'asc' ? 'asc' : 'desc';

  if (sortBy === 'owner') {
    return { owner: { name: orderDir } };
  }

  const orderField = SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
  return { [orderField]: orderDir };
}

async function resolveLeadSourceId(value) {
  if (!value?.trim()) return null;
  const source = await prisma.leadSource.findFirst({
    where: { name: { equals: value.trim(), mode: 'insensitive' } },
  });
  return source?.id || null;
}

export async function exportContacts(req, res) {
  try {
    const where = buildContactWhere(req);
    const orderBy = buildContactOrder(req);

    const [contacts, customFields] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy,
        include: {
          owner: { select: { name: true } },
          leadSource: { select: { name: true } },
          tags: { include: { tag: true } },
          customValues: { include: { fieldDefinition: true } },
        },
      }),
      prisma.customFieldDefinition.findMany({
        where: { deletedAt: null },
        orderBy: { orderIndex: 'asc' },
      }),
    ]);

    const headers = [
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Company',
      'Job Title',
      'Status',
      'Lead Source',
      'Tags',
      'Owner',
      ...customFields.map((f) => f.label),
    ];

    const rows = contacts.map((contact) => {
      const customMap = Object.fromEntries(
        contact.customValues.map((cv) => [cv.fieldDefinitionId, cv.value])
      );

      return [
        contact.firstName,
        contact.lastName,
        contact.email,
        contact.phone || '',
        contact.company || '',
        contact.jobTitle || '',
        contact.status,
        contact.leadSource?.name || '',
        contact.tags.map((t) => t.tag.name).join('; '),
        contact.owner?.name || '',
        ...customFields.map((f) => customMap[f.id] || ''),
      ];
    });

    const csv = stringify([headers, ...rows]);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="contacts-export.csv"');
    res.send(csv);
  } catch (err) {
    console.error('Export contacts error:', err);
    res.status(500).json({ error: 'Failed to export contacts' });
  }
}

export async function importContacts(req, res) {
  try {
    let rows;
    let mapping;
    let mappedOwnerId;

    if (req.file) {
      try {
        mapping = JSON.parse(req.body.mapping || '{}');
      } catch {
        return res.status(400).json({ error: 'Invalid mapping JSON' });
      }
      mappedOwnerId = req.body.ownerId;
      rows = parse(req.file.buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      });
    } else {
      ({ rows, mapping, ownerId: mappedOwnerId } = req.body);
    }

    if (!Array.isArray(rows) || !mapping || typeof mapping !== 'object') {
      return res.status(400).json({ error: 'CSV file and mapping are required' });
    }

    if (rows.length === 0) {
      return res.status(400).json({ error: 'CSV file has no data rows' });
    }

    const ownerId =
      req.user.role === 'admin' && mappedOwnerId ? mappedOwnerId : req.user.id;

    const customFields = await prisma.customFieldDefinition.findMany({
      where: { deletedAt: null },
    });

    let successCount = 0;
    const failures = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const getVal = (key) => (mapping[key] ? row[mapping[key]]?.trim?.() : '');

        const firstName = getVal('firstName');
        const lastName = getVal('lastName');
        const email = getVal('email');

        if (!firstName || !lastName || !email) {
          throw new Error('Missing required field: first name, last name, or email');
        }

        const leadSourceName = getVal('leadSource');
        const leadSourceId = leadSourceName ? await resolveLeadSourceId(leadSourceName) : null;

        const customFieldValues = {};
        for (const field of customFields) {
          const mapKey = `custom_${field.id}`;
          if (mapping[mapKey] && row[mapping[mapKey]]) {
            customFieldValues[field.id] = row[mapping[mapKey]].trim();
          }
        }

        await validateRequiredCustomFields(customFieldValues);

        const tagNames = getVal('tags')
          ? getVal('tags').split(/[;,]/).map((t) => t.trim()).filter(Boolean)
          : [];

        const contact = await prisma.contact.create({
          data: {
            firstName,
            lastName,
            email,
            phone: getVal('phone') || null,
            company: getVal('company') || null,
            jobTitle: getVal('jobTitle') || null,
            status: getVal('status') || 'lead',
            leadSourceId,
            ownerId,
          },
        });

        await syncContactTags(contact.id, [], tagNames, req.user.id);
        await syncCustomFieldValues(contact.id, customFieldValues);

        successCount += 1;
      } catch (err) {
        failures.push({ row: i + 1, reason: err.message });
      }
    }

    res.json({ successCount, failureCount: failures.length, failures });
  } catch (err) {
    console.error('Import contacts error:', err);
    res.status(500).json({ error: 'Failed to import contacts' });
  }
}

export { buildContactWhere, buildContactOrder, findDuplicateContacts, serializeContact };
