import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initializing database...');

  // Clean out any transient demo records to maintain a clean production state
  await prisma.release.deleteMany({});

  console.log('✅ Database initialized successfully. Ready for user release creation.');
}

main()
  .catch((e) => {
    console.error('❌ Error during database initialization:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
