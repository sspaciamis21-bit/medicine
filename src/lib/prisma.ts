import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const defaultDbUrl =
  'mysql://u434618106_family_medi:5n8znLXFw$xBbgX@srv2088.hstgr.io:3306/u434618106_medicine?connection_limit=10&connect_timeout=15&pool_timeout=15';

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || defaultDbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
