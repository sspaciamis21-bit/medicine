import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import webpush from '@/lib/vapidKeys';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, householdId } = body;

    let users: any[] = [];
    if (username) {
      users = await prisma.user.findMany({ where: { username } });
    } else if (householdId) {
      users = await prisma.user.findMany({ where: { householdId } });
    }

    const subscribers = users.filter((u) => u.pushSubscription);
    if (subscribers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No registered push subscriptions found. Please enable notifications on this device first.',
        },
        { status: 404 }
      );
    }

    const results = [];
    for (const user of subscribers) {
      try {
        const sub = JSON.parse(user.pushSubscription);
        const payload = JSON.stringify({
          title: '🔔 Test Medicine Reminder',
          body: '👤 Patient: Test Family Member\n💊 Medicine: Paracetamol 500mg\n⏰ Time: Just Now\n🥄 Dose: 1 Tablet',
          medicine: 'Paracetamol 500mg',
          dose: '1 Tablet',
          mealContext: 'After Food',
          id: 'test-' + Date.now(),
        });

        await webpush.sendNotification(sub, payload);
        results.push({ username: user.username, success: true });
      } catch (err: any) {
        results.push({ username: user.username, success: false, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Test push sent to ${results.filter((r) => r.success).length} devices`,
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
