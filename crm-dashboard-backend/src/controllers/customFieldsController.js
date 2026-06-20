import prisma from '../utils/prisma.js';
import { recordAudit } from '../utils/audit.js';

export async function getCustomFields(_req, res) {
  try {
    const fields = await prisma.customFieldDefinition.findMany({
      where: { deletedAt: null },
      orderBy: { orderIndex: 'asc' },
    });
    res.json(fields);
  } catch (err) {
    console.error('Get custom fields error:', err);
    res.status(500).json({ error: 'Failed to fetch custom fields' });
  }
}

export async function createCustomField(req, res) {
  try {
    const { label, fieldType, options, isRequired } = req.body;
    if (!label?.trim() || !fieldType) {
      return res.status(400).json({ error: 'Label and fieldType are required' });
    }

    const maxOrder = await prisma.customFieldDefinition.aggregate({
      where: { deletedAt: null },
      _max: { orderIndex: true },
    });

    const field = await prisma.customFieldDefinition.create({
      data: {
        label: label.trim(),
        fieldType,
        options: options || null,
        isRequired: !!isRequired,
        orderIndex: (maxOrder._max.orderIndex ?? -1) + 1,
      },
    });

    await recordAudit({
      actorId: req.user.id,
      entityType: 'custom_field',
      entityId: field.id,
      action: 'create',
      after: { label: field.label, fieldType: field.fieldType },
    });

    res.status(201).json(field);
  } catch (err) {
    console.error('Create custom field error:', err);
    res.status(500).json({ error: 'Failed to create custom field' });
  }
}

export async function updateCustomField(req, res) {
  try {
    const { id } = req.params;
    const { label, fieldType, options, isRequired } = req.body;

    const field = await prisma.customFieldDefinition.update({
      where: { id },
      data: {
        ...(label !== undefined && { label: label.trim() }),
        ...(fieldType !== undefined && { fieldType }),
        ...(options !== undefined && { options }),
        ...(isRequired !== undefined && { isRequired }),
      },
    });

    res.json(field);
  } catch (err) {
    console.error('Update custom field error:', err);
    res.status(500).json({ error: 'Failed to update custom field' });
  }
}

export async function deleteCustomField(req, res) {
  try {
    const { id } = req.params;
    const existing = await prisma.customFieldDefinition.findUnique({ where: { id } });

    await recordAudit({
      actorId: req.user.id,
      entityType: 'custom_field',
      entityId: id,
      action: 'delete',
      before: existing ? { label: existing.label } : undefined,
    });

    await prisma.customFieldDefinition.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    res.json({ message: 'Custom field archived. Existing values are preserved.' });
  } catch (err) {
    console.error('Delete custom field error:', err);
    res.status(500).json({ error: 'Failed to delete custom field' });
  }
}

export async function reorderCustomFields(req, res) {
  try {
    const { fieldIds } = req.body;
    if (!Array.isArray(fieldIds)) {
      return res.status(400).json({ error: 'fieldIds array is required' });
    }

    await prisma.$transaction(
      fieldIds.map((id, index) =>
        prisma.customFieldDefinition.update({
          where: { id },
          data: { orderIndex: index },
        })
      )
    );

    const fields = await prisma.customFieldDefinition.findMany({
      where: { deletedAt: null },
      orderBy: { orderIndex: 'asc' },
    });

    res.json(fields);
  } catch (err) {
    console.error('Reorder custom fields error:', err);
    res.status(500).json({ error: 'Failed to reorder custom fields' });
  }
}
