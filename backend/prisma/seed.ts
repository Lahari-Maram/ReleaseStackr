import { PrismaClient } from '@prisma/client';
import { FIXED_CHECKLIST_STEPS } from '../src/constants/steps';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with initial release data...');

  await prisma.release.deleteMany({});

  const allStepIds = FIXED_CHECKLIST_STEPS.map((s) => s.id);

  // 1. Planned Release (0 completed steps)
  await prisma.release.create({
    data: {
      name: 'v2.4.0 — Security Hardening & Zero-Trust Auth',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // In 7 days
      additionalInfo: 'Planned security patch including TLS 1.3 enforcement and token rotation policy update.',
      completedSteps: [],
    },
  });

  // 2. Ongoing Release (Partial completed steps)
  await prisma.release.create({
    data: {
      name: 'v2.3.0 — High-Throughput GraphQL Engine',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // In 2 days
      additionalInfo: 'Migrating resolvers to batch dataloaders and indexing checklist step fields.',
      completedSteps: [
        'code-freeze',
        'automated-tests',
        'security-scan',
        'staging-smoke-test',
      ],
    },
  });

  // 3. Done Release (All completed steps)
  await prisma.release.create({
    data: {
      name: 'v2.2.0 — PostgreSQL Connection Pool Optimization',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      additionalInfo: 'Successfully rolled out PgBouncer pool sizing and Prisma client connection tuning to production.',
      completedSteps: allStepIds,
    },
  });

  console.log('✅ Seed completed successfully with 3 releases (Planned, Ongoing, Done).');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
