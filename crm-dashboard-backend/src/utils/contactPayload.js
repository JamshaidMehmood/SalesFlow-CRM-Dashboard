import prisma from './prisma.js';

const TAG_COLORS = ['#0091ae', '#ff7a59', '#00bda5', '#7c98b6', '#f2545b', '#6366f1'];

export async function syncContactTags(contactId, tagIds = [], tagNames = [], userId) {
  const resolvedTagIds = [...new Set(tagIds.filter(Boolean))];

  for (const name of tagNames.filter(Boolean)) {
    const trimmed = name.trim();
    if (!trimmed) continue;

    let tag = await prisma.tag.findFirst({
      where: { name: { equals: trimmed, mode: 'insensitive' } },
    });

    if (!tag) {
      const color = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
      tag = await prisma.tag.create({
        data: { name: trimmed, color, createdBy: userId },
      });
    }

    resolvedTagIds.push(tag.id);
  }

  const uniqueIds = [...new Set(resolvedTagIds)];

  await prisma.contactTag.deleteMany({ where: { contactId } });
  if (uniqueIds.length) {
    await prisma.contactTag.createMany({
      data: uniqueIds.map((tagId) => ({ contactId, tagId })),
      skipDuplicates: true,
    });
  }
}

export async function syncCustomFieldValues(contactId, customFields = {}) {
  const definitions = await prisma.customFieldDefinition.findMany({
    where: { deletedAt: null },
  });

  for (const def of definitions) {
    const value = customFields[def.id];
    if (value === undefined || value === null || value === '') {
      if (def.isRequired) {
        throw new Error(`Custom field "${def.label}" is required`);
      }
      await prisma.contactCustomValue.deleteMany({
        where: { contactId, fieldDefinitionId: def.id },
      });
      continue;
    }

    await prisma.contactCustomValue.upsert({
      where: {
        contactId_fieldDefinitionId: { contactId, fieldDefinitionId: def.id },
      },
      create: { contactId, fieldDefinitionId: def.id, value: String(value) },
      update: { value: String(value) },
    });
  }
}

export async function validateRequiredCustomFields(customFields = {}) {
  const required = await prisma.customFieldDefinition.findMany({
    where: { deletedAt: null, isRequired: true },
  });

  for (const def of required) {
    const value = customFields[def.id];
    if (value === undefined || value === null || String(value).trim() === '') {
      throw new Error(`Custom field "${def.label}" is required`);
    }
  }
}
