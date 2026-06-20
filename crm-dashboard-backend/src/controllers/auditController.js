import prisma from '../utils/prisma.js';
import { summarizeAuditEntry } from '../utils/audit.js';
import { contactScopeFilter, dealScopeFilter } from '../utils/access.js';

async function canViewEntityAudit(user, scope, entityType, entityId) {
  if (user.role === 'admin') return true;

  if (entityType === 'contact') {
    const filter = contactScopeFilter(user, scope);
    const contact = await prisma.contact.findFirst({ where: { id: entityId, ...filter } });
    return !!contact;
  }

  if (entityType === 'deal') {
    const filter = dealScopeFilter(user, scope);
    const deal = await prisma.deal.findFirst({ where: { id: entityId, ...filter } });
    return !!deal;
  }

  return false;
}

export async function getAuditLogs(req, res) {
  try {
    const {
      entityType,
      actorId,
      from,
      to,
      page = '1',
      pageSize = '20',
    } = req.query;

    const where = {};

    if (entityType) where.entityType = entityType;
    if (actorId) where.actorId = actorId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const take = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
    const skip = (Math.max(1, parseInt(page, 10) || 1) - 1) * take;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { actor: { select: { id: true, name: true, email: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs: logs.map((log) => ({
        ...log,
        summary: summarizeAuditEntry(log),
      })),
      total,
      page: parseInt(page, 10) || 1,
      pageSize: take,
    });
  } catch (err) {
    console.error('Get audit logs error:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
}

export async function getEntityAuditLogs(req, res) {
  try {
    const { entityType, entityId } = req.params;

    const allowed = await canViewEntityAudit(req.user, req.dataScope, entityType, entityId);
    if (!allowed) {
      return res.status(404).json({ error: 'Record not found' });
    }

    const logs = await prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { actor: { select: { id: true, name: true } } },
    });

    res.json(
      logs.map((log) => ({
        ...log,
        summary: summarizeAuditEntry(log),
      }))
    );
  } catch (err) {
    console.error('Get entity audit logs error:', err);
    res.status(500).json({ error: 'Failed to fetch entity history' });
  }
}
