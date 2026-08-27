import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Verified working database connection for Hostinger production and local dev
const workingDbUrl =
  'mysql://u434618106_family_medi:5n8znLXFw$xBbgX@srv2088.hstgr.io:3306/u434618106_medicine?connection_limit=10&connect_timeout=15&pool_timeout=15';

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: workingDbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
