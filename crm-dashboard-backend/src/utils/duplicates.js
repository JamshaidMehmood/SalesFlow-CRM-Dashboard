import prisma from './prisma.js';

export async function findDuplicateContacts({ email, phone, excludeId, ownerFilter = {} }) {
  const conditions = [];

  if (email?.trim()) {
    conditions.push({ email: { equals: email.trim(), mode: 'insensitive' } });
  }

  if (phone?.trim()) {
    const normalized = phone.replace(/\D/g, '');
    if (normalized.length >= 7) {
      conditions.push({ phone: { contains: normalized.slice(-7) } });
    }
  }

  if (!conditions.length) return [];

  return prisma.contact.findMany({
    where: {
      ...ownerFilter,
      OR: conditions,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    include: {
      owner: { select: { id: true, name: true } },
      leadSource: { select: { id: true, name: true } },
    },
    take: 5,
  });
}

export async function getDuplicateGroups(ownerFilter = {}) {
  const contacts = await prisma.contact.findMany({
    where: ownerFilter,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      updatedAt: true,
      owner: { select: { id: true, name: true } },
    },
  });

  const groups = [];
  const groupedIds = new Set();

  const addGroup = (matchType, matchValue, members) => {
    if (members.length < 2) return;
    const key = members.map((m) => m.id).sort().join('|');
    if (groupedIds.has(key)) return;
    groupedIds.add(key);
    groups.push({ matchType, matchValue, contacts: members });
  };

  const byEmail = {};
  for (const contact of contacts) {
    const key = contact.email?.toLowerCase().trim();
    if (!key) continue;
    if (!byEmail[key]) byEmail[key] = [];
    byEmail[key].push(contact);
  }
  for (const [email, members] of Object.entries(byEmail)) {
    addGroup('email', email, members);
  }

  const byPhone = {};
  for (const contact of contacts) {
    const key = contact.phone?.replace(/\D/g, '');
    if (!key || key.length < 7) continue;
    if (!byPhone[key]) byPhone[key] = [];
    byPhone[key].push(contact);
  }
  for (const [phone, members] of Object.entries(byPhone)) {
    addGroup('phone', members[0].phone, members);
  }

  return groups;
}
