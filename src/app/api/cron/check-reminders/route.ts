import { NextResponse } from 'next/server';
import { checkAndDispatchDueReminders } from '@/lib/pushSender';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET or POST /api/cron/check-reminders
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const minuteOverride = searchParams.get('minute');
  const targetMinute = minuteOverride ? parseInt(minuteOverride) : undefined;

  const result = await checkAndDispatchDueReminders(targetMinute);
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const result = await checkAndDispatchDueReminders();
  return NextResponse.json(result);
}
