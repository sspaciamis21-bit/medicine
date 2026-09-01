import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import webpush from '@/lib/vapidKeys';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { householdId, username, subscription, sendWelcome } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { success: false, error: 'Valid PushSubscription is required' },
        { status: 400 }
      );
    }

    const subString = typeof subscription === 'string' ? subscription : JSON.stringify(subscription);

    // Update user subscription in database
    if (username) {
      await prisma.user.updateMany({
        where: { username },
        data: { pushSubscription: subString },
      });
    } else if (householdId) {
      await prisma.user.updateMany({
        where: { householdId },
        data: { pushSubscription: subString },
      });
    }

    // Optionally send immediate test push confirmation
    if (sendWelcome) {
      try {
        const payload = JSON.stringify({
          title: '🔔 Notifications Active!',
          body: 'Medicine reminders will now wake up your device on time, even when Chrome is closed.',
          medicine: 'Family Medicine Reminder',
          dose: 'Setup Complete',
          mealContext: 'Active',
        });

        await webpush.sendNotification(subscription, payload);
      } catch (pushErr: any) {
        console.warn('Welcome push warning (non-fatal):', pushErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Push subscription registered successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
