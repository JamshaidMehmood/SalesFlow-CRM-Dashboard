import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import { recalculateContactScore } from '../src/services/leadScoring.js';

const prisma = new PrismaClient();

const STATUSES = ['lead', 'prospect', 'customer', 'inactive'];
const ACTIVITY_TYPES = ['call', 'email', 'meeting', 'note'];
const LOST_REASONS = ['price_too_high', 'bad_timing', 'chose_competitor', 'no_budget', 'no_response', 'other'];

const STATUS_WEIGHTS = [
  { status: 'lead', weight: 30 },
  { status: 'prospect', weight: 28 },
  { status: 'customer', weight: 28 },
  { status: 'inactive', weight: 14 },
];

function randomBetween(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function monthsAgo(months) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  d.setHours(0, 0, 0, 0);
  return d;
}

function monthRange(monthsBack) {
  const start = new Date();
  start.setMonth(start.getMonth() - monthsBack, 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function pickWeighted(items, key) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item[key];
  }
  return items[items.length - 1][key];
}

function activityContent(type, contact) {
  const templates = {
    call: () =>
      `Called ${contact.firstName} to discuss ${faker.commerce.product()}. Duration: ${faker.number.int({ min: 5, max: 45 })} min.`,
    email: () => `Sent follow-up email regarding ${faker.lorem.sentence()}`,
    meeting: () => `Demo meeting at ${contact.company || faker.company.name()}.`,
    note: () => faker.lorem.paragraph(),
  };
  return templates[type]();
}

async function main() {
  console.log('🌱 Seeding database...');

  await prisma.task.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.contactMergeLog.deleteMany();
  await prisma.contactTag.deleteMany();
  await prisma.contactCustomValue.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.note.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.territory.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.customFieldDefinition.deleteMany();
  await prisma.leadSource.deleteMany();
  await prisma.quota.deleteMany();
  await prisma.pipelineStage.deleteMany();
  await prisma.user.updateMany({ data: { teamId: null } });
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);
  const now = new Date();

  const stages = await Promise.all([
    prisma.pipelineStage.create({ data: { name: 'New', orderIndex: 0, isWonStage: false, isLostStage: false, winProbability: 10 } }),
    prisma.pipelineStage.create({ data: { name: 'Qualified', orderIndex: 1, isWonStage: false, isLostStage: false, winProbability: 25 } }),
    prisma.pipelineStage.create({ data: { name: 'Proposal', orderIndex: 2, isWonStage: false, isLostStage: false, winProbability: 60 } }),
    prisma.pipelineStage.create({ data: { name: 'Won', orderIndex: 3, isWonStage: true, isLostStage: false, winProbability: 100 } }),
    prisma.pipelineStage.create({ data: { name: 'Lost', orderIndex: 4, isWonStage: false, isLostStage: true, winProbability: 0 } }),
  ]);

  const stageMap = {
    new: stages[0],
    qualified: stages[1],
    proposal: stages[2],
    won: stages[3],
    lost: stages[4],
  };

  console.log(`✅ Created ${stages.length} pipeline stages`);

  await prisma.user.create({
    data: { name: 'Admin User', email: 'admin@example.com', passwordHash, role: 'admin', createdAt: monthsAgo(14) },
  });

  const admin = await prisma.user.findUnique({ where: { email: 'admin@example.com' } });

  const leadSourceNames = ['Referral', 'Website Form', 'Ad Campaign', 'Cold Outreach', 'Event', 'Other'];
  const leadSources = await Promise.all(
    leadSourceNames.map((name, i) => prisma.leadSource.create({ data: { name, orderIndex: i } }))
  );

  const tagDefs = [
    { name: 'VIP', color: '#ff7a59' },
    { name: 'Referral', color: '#0091ae' },
    { name: 'Cold Lead', color: '#7c98b6' },
  ];
  const tags = await Promise.all(
    tagDefs.map((t) => prisma.tag.create({ data: { ...t, createdBy: admin.id } }))
  );

  console.log(`✅ Created ${leadSources.length} lead sources and ${tags.length} tags`);

  const territories = await Promise.all([
    prisma.territory.create({ data: { name: 'West Coast', description: 'CA, OR, WA accounts' } }),
    prisma.territory.create({ data: { name: 'Enterprise', description: 'Large account segment' } }),
    prisma.territory.create({ data: { name: 'EMEA', description: 'Europe, Middle East, Africa' } }),
  ]);

  const salesTeam = await prisma.team.create({
    data: { name: 'Inside Sales', managerId: null },
  });

  console.log(`✅ Created ${territories.length} territories and 1 team`);

  const salesReps = await Promise.all(
    Array.from({ length: 4 }, (_, i) =>
      prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: `sales${i + 1}@example.com`,
          passwordHash,
          role: 'sales_rep',
          createdAt: randomBetween(monthsAgo(12), monthsAgo(3)),
        },
      })
    )
  );

  const salesRep = await prisma.user.create({
    data: { name: 'Sales Rep', email: 'sales@example.com', passwordHash, role: 'sales_rep', createdAt: monthsAgo(10) },
  });

  const salesOnly = [...salesReps, salesRep];

  await prisma.team.update({
    where: { id: salesTeam.id },
    data: { managerId: salesReps[0].id },
  });

  await prisma.user.updateMany({
    where: { id: { in: salesOnly.map((u) => u.id) } },
    data: { teamId: salesTeam.id },
  });

  console.log(`✅ Created ${salesOnly.length + 1} users (team: Inside Sales)`);

  const contacts = [];
  for (let i = 0; i < 50; i++) {
    const owner = faker.helpers.arrayElement(salesOnly);
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const monthsBack = faker.helpers.weightedArrayElement([
      { value: 1, weight: 18 }, { value: 2, weight: 16 }, { value: 3, weight: 14 },
      { value: 4, weight: 12 }, { value: 6, weight: 10 }, { value: 12, weight: 6 },
    ]);
    const { start, end } = monthRange(monthsBack);
    const createdAt = randomBetween(start, end);

    contacts.push(
      await prisma.contact.create({
        data: {
          firstName,
          lastName,
          email: faker.internet.email({ firstName, lastName }).toLowerCase(),
          phone: faker.phone.number({ style: 'national' }),
          company: faker.company.name(),
          jobTitle: faker.person.jobTitle(),
          status: pickWeighted(STATUS_WEIGHTS, 'status'),
          leadSourceId: faker.helpers.arrayElement(leadSources).id,
          territoryId: faker.helpers.arrayElement(territories).id,
          ownerId: owner.id,
          createdAt,
          updatedAt: randomBetween(createdAt, now),
        },
      })
    );
  }
  console.log(`✅ Created ${contacts.length} contacts`);

  for (const contact of contacts) {
    const selectedTags = faker.helpers.arrayElements(tags, faker.number.int({ min: 0, max: 2 }));
    for (const tag of selectedTags) {
      await prisma.contactTag.create({ data: { contactId: contact.id, tagId: tag.id } });
    }
  }

  const wonCloseDates = [];
  for (let m = 5; m >= 0; m--) {
    const { start, end } = monthRange(m);
    for (let i = 0; i < faker.number.int({ min: 4, max: 9 }); i++) {
      wonCloseDates.push(randomBetween(start, end));
    }
  }

  const stageKeys = ['new', 'qualified', 'proposal', 'won', 'lost'];
  const stageWeights = [22, 20, 18, 22, 18];
  let dealCount = 0;
  let wonIndex = 0;

  const pickStage = () => {
    const roll = faker.number.int({ min: 1, max: 100 });
    let cumulative = 0;
    for (let i = 0; i < stageKeys.length; i++) {
      cumulative += stageWeights[i];
      if (roll <= cumulative) return stageKeys[i];
    }
    return 'new';
  };

  for (const contact of contacts) {
    for (let d = 0; d < faker.number.int({ min: 1, max: 3 }); d++) {
      let stageKey = pickStage();

      if (stageKey === 'won' && wonIndex < wonCloseDates.length) {
        const closedAt = wonCloseDates[wonIndex++];
        await prisma.deal.create({
          data: {
            title: `${contact.company || contact.lastName} - ${faker.commerce.productName()}`,
            contactId: contact.id,
            ownerId: contact.ownerId,
            stageId: stageMap.won.id,
            value: faker.number.float({ min: 5000, max: 95000, fractionDigits: 0 }),
            expectedCloseDate: closedAt,
            createdAt: randomBetween(contact.createdAt, closedAt),
            updatedAt: closedAt,
          },
        });
      } else if (stageKey === 'lost') {
        const closedAt = randomBetween(contact.createdAt, now);
        await prisma.deal.create({
          data: {
            title: `${contact.company || contact.lastName} - ${faker.commerce.productName()}`,
            contactId: contact.id,
            ownerId: contact.ownerId,
            stageId: stageMap.lost.id,
            value: faker.number.float({ min: 2000, max: 60000, fractionDigits: 0 }),
            lostReason: faker.helpers.arrayElement(LOST_REASONS),
            lostReasonNote: faker.lorem.sentence(),
            expectedCloseDate: closedAt,
            createdAt: randomBetween(contact.createdAt, closedAt),
            updatedAt: closedAt,
          },
        });
      } else {
        const createdAt = randomBetween(contact.createdAt, now);
        await prisma.deal.create({
          data: {
            title: `${contact.company || contact.lastName} - ${faker.commerce.productName()}`,
            contactId: contact.id,
            ownerId: contact.ownerId,
            stageId: stageMap[stageKey].id,
            value: faker.number.float({ min: 3000, max: 120000, fractionDigits: 0 }),
            expectedCloseDate: faker.date.future({ years: 0.4, refDate: now }),
            createdAt,
            updatedAt: randomBetween(createdAt, now),
          },
        });
      }
      dealCount++;
    }
  }

  while (wonIndex < wonCloseDates.length) {
    const contact = faker.helpers.arrayElement(contacts);
    const closedAt = wonCloseDates[wonIndex++];
    await prisma.deal.create({
      data: {
        title: `${contact.company || contact.lastName} - ${faker.commerce.productName()}`,
        contactId: contact.id,
        ownerId: contact.ownerId,
        stageId: stageMap.won.id,
        value: faker.number.float({ min: 8000, max: 85000, fractionDigits: 0 }),
        createdAt: randomBetween(contact.createdAt, closedAt),
        updatedAt: closedAt,
      },
    });
    dealCount++;
  }
  console.log(`✅ Created ${dealCount} deals`);

  let activityCount = 0;
  for (const contact of contacts) {
    for (let a = 0; a < faker.number.int({ min: 3, max: 10 }); a++) {
      await prisma.activity.create({
        data: {
          contactId: contact.id,
          userId: contact.ownerId,
          type: faker.helpers.arrayElement(ACTIVITY_TYPES),
          content: activityContent(faker.helpers.arrayElement(ACTIVITY_TYPES), contact),
          createdAt: randomBetween(contact.createdAt, now),
        },
      });
      activityCount++;
    }
  }
  console.log(`✅ Created ${activityCount} activities`);

  let noteCount = 0;
  for (const contact of contacts) {
    for (let n = 0; n < faker.number.int({ min: 0, max: 4 }); n++) {
      await prisma.note.create({
        data: {
          contactId: contact.id,
          createdBy: contact.ownerId,
          content: faker.lorem.paragraph(),
          createdAt: randomBetween(contact.createdAt, now),
        },
      });
      noteCount++;
    }
  }
  console.log(`✅ Created ${noteCount} notes`);

  let taskCount = 0;
  for (const contact of contacts.slice(0, 35)) {
    for (let t = 0; t < faker.number.int({ min: 0, max: 2 }); t++) {
      const daysOffset = faker.helpers.arrayElement([-2, -1, 0, 1, 3, 7, 14]);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + daysOffset);
      await prisma.task.create({
        data: {
          contactId: contact.id,
          ownerId: contact.ownerId,
          title: faker.helpers.arrayElement([
            `Follow up with ${contact.firstName}`,
            'Send proposal',
            'Schedule demo call',
            'Check in on budget',
          ]),
          dueDate,
          status: faker.helpers.arrayElement(['pending', 'pending', 'pending', 'done']),
        },
      });
      taskCount++;
    }
  }
  console.log(`✅ Created ${taskCount} tasks`);

  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  for (const rep of salesOnly) {
    await prisma.quota.create({
      data: {
        userId: rep.id,
        month: currentMonth,
        year: currentYear,
        targetAmount: faker.number.float({ min: 50000, max: 150000, fractionDigits: 0 }),
      },
    });
  }
  console.log(`✅ Created quotas for ${salesOnly.length} reps`);

  for (const contact of contacts) {
    await recalculateContactScore(contact.id);
  }
  console.log('✅ Recalculated lead scores');

  console.log('\n🎉 Seed complete!');
  console.log('  Admin: admin@example.com / password123');
  console.log('  Sales: sales@example.com / password123');
}

export { main };

// Only auto-run the full (destructive) seed when this file is executed directly
// (e.g. `npm run db:seed`). When imported (see seed-if-empty.js) it stays inert.
const invokedDirectly = process.argv[1]?.endsWith('seed.js');
if (invokedDirectly) {
  main()
    .catch((e) => {
      console.error('Seed failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
