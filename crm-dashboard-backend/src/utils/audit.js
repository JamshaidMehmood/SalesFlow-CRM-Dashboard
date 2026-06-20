import prisma from './prisma.js';

const TRACKED_FIELDS = {
  contact: ['status', 'ownerId', 'territoryId', 'firstName', 'lastName', 'email', 'phone', 'company'],
  deal: ['stageId', 'ownerId', 'value', 'title', 'lostReason'],
};

export function buildDiff(before, after, entityType) {
  const fields = TRACKED_FIELDS[entityType] || Object.keys(after || {});
  const changes = {};

  for (const field of fields) {
    const b = before?.[field];
    const a = after?.[field];
    if (b !== a) {
      changes[field] = { before: b ?? null, after: a ?? null };
    }
  }

  return Object.keys(changes).length ? changes : null;
}

export async function recordAudit({ actorId, entityType, entityId, action, changes, before, after }) {
  const diff = changes || buildDiff(before, after, entityType);

  if (action === 'update' && !diff) return null;

  return prisma.auditLog.create({
    data: {
      actorId,
      entityType,
      entityId,
      action,
      changes: diff || {},
    },
  });
}

export function summarizeAuditEntry(log) {
  const changes = log.changes || {};
  const keys = Object.keys(changes);

  if (log.action === 'create') return `Created ${log.entityType}`;
  if (log.action === 'delete') return `Deleted ${log.entityType}`;
  if (log.action === 'merge') return `Merged ${log.entityType}`;

  if (keys.includes('status')) {
    return `Status: ${changes.status.before} → ${changes.status.after}`;
  }
  if (keys.includes('stageId')) {
    return `Stage changed`;
  }
  if (keys.includes('ownerId')) {
    return `Ownership reassigned`;
  }
  if (keys.includes('territoryId')) {
    return `Territory updated`;
  }

  return keys.length ? keys.join(', ') + ' updated' : `${log.action} ${log.entityType}`;
}
