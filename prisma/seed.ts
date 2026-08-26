// Clean database seed - No dummy data. Real users register their own household.
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Database is ready for clean production use.');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
