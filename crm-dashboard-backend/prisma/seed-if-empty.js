// Seeds the demo dataset (admin user, sales rep, contacts, deals, etc.) ONLY
// when the database has no users yet. Used by the Render build so the first
// deploy gets the same seeded state as localhost, while later redeploys keep
// any data you've created. To force a full reset, run `npm run db:seed`.
import { PrismaClient } from '@prisma/client';
import { main as seed } from './seed.js';

const prisma = new PrismaClient();

async function run() {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log(`Seed skipped: database already has ${userCount} user(s).`);
    return;
  }
  console.log('Empty database detected — seeding demo data...');
  await seed();
}

run()
  .catch((e) => {
    console.error('Conditional seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
