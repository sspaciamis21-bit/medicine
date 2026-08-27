import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const configs = [
    {
      name: 'srv2088_raw_dollar',
      url: 'mysql://u434618106_family_medi:5n8znLXFw$xBbgX@srv2088.hstgr.io:3306/u434618106_medicine?connect_timeout=5',
    },
    {
      name: 'srv2088_encoded_dollar',
      url: 'mysql://u434618106_family_medi:5n8znLXFw%24xBbgX@srv2088.hstgr.io:3306/u434618106_medicine?connect_timeout=5',
    },
    {
      name: 'localhost_raw_dollar',
      url: 'mysql://u434618106_family_medi:5n8znLXFw$xBbgX@localhost:3306/u434618106_medicine?connect_timeout=5',
    },
    {
      name: 'localhost_encoded_dollar',
      url: 'mysql://u434618106_family_medi:5n8znLXFw%24xBbgX@localhost:3306/u434618106_medicine?connect_timeout=5',
    },
    {
      name: 'loopback_127_raw_dollar',
      url: 'mysql://u434618106_family_medi:5n8znLXFw$xBbgX@127.0.0.1:3306/u434618106_medicine?connect_timeout=5',
    },
    {
      name: 'env_DATABASE_URL',
      url: process.env.DATABASE_URL || 'NOT_SET',
    },
  ];

  const results: Record<string, any> = {};

  for (const config of configs) {
    if (config.url === 'NOT_SET') {
      results[config.name] = { success: false, error: 'process.env.DATABASE_URL is not set' };
      continue;
    }

    const client = new PrismaClient({
      datasources: {
        db: {
          url: config.url,
        },
      },
    });

    try {
      const count = await client.user.count();
      results[config.name] = { success: true, count };
    } catch (err: any) {
      results[config.name] = { success: false, error: err.message?.split('\n').filter(Boolean).pop() || err.message };
    } finally {
      await client.$disconnect().catch(() => {});
    }
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    results,
  });
}
