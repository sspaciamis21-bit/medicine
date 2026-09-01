// Server-Side Reminder Notification Dispatcher
// Evaluates scheduled doses and sends Web Push packets to user devices

import { prisma } from './prisma';
import webpush from './vapidKeys';

// Helper to convert time string (e.g., "06:48 PM", "08:00 AM") to total minutes from midnight
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return -1;
  const clean = timeStr.trim();
  const match12 = clean.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match12) return -1;

  let h = parseInt(match12[1]);
  const m = parseInt(match12[2]);
  const ampm = match12[3] ? match12[3].toUpperCase() : null;

  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;

  return h * 60 + m;
}

export async function checkAndDispatchDueReminders(targetMinutesOverride?: number) {
  try {
    const now = new Date();
    const istTimeStr = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(now);

    const [istH, istM] = istTimeStr.split(':').map(Number);
    const currentTotalMin =
      targetMinutesOverride !== undefined ? targetMinutesOverride : istH * 60 + istM;

    const todayDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
    }).format(now); // YYYY-MM-DD

    // Fetch all active medicines with schedules, members, and household users
    const medicines = await prisma.medicine.findMany({
      where: { status: 'active' },
      include: {
        member: true,
        schedules: { where: { isActive: true } },
        household: {
          include: {
            users: {
              where: {
                pushSubscription: { not: null },
              },
            },
          },
        },
      },
    });

    const dispatched: any[] = [];

    for (const med of medicines) {
      const medAny = med as any;
      if (medAny.courseStartDate && todayDateStr < medAny.courseStartDate) continue;
      if (medAny.courseEndDate && todayDateStr > medAny.courseEndDate) continue;

      const users = med.household?.users || [];
      if (users.length === 0) continue;

      for (const schedule of med.schedules) {
        const scheduledMin = parseTimeToMinutes(schedule.specificTime || '');
        if (scheduledMin < 0) continue;

        // Match current minute window
        if (scheduledMin === currentTotalMin) {
          const memberName = med.member?.name || 'Family Member';
          const memberRelation = med.member?.relationship ? ` (${med.member.relationship})` : '';

          const payload = JSON.stringify({
            title: `🔔 Medicine Reminder: ${med.name}`,
            body: `👤 Patient: ${memberName}${memberRelation}\n💊 Medicine: ${med.name}${med.strength ? ' (' + med.strength + ')' : ''}\n⏰ Time: ${schedule.specificTime}\n🥄 Dose: ${schedule.doseAmount || 1} ${med.unit || 'Tablets'}`,
            medicine: med.name,
            strength: med.strength,
            memberName: memberName,
            time: schedule.specificTime,
            dose: `${schedule.doseAmount || 1} ${med.unit || 'Tablets'}`,
            id: med.id,
            scheduleId: schedule.id,
          });

          for (const user of users) {
            if (!user.pushSubscription) continue;
            try {
              const sub = JSON.parse(user.pushSubscription);
              await webpush.sendNotification(sub, payload);
              dispatched.push({
                medicine: med.name,
                user: user.username,
                time: schedule.specificTime,
                success: true,
              });
            } catch (err: any) {
              console.warn(`Push delivery error for ${user.username}:`, err.message);
              if (err.statusCode === 410 || err.statusCode === 404) {
                await prisma.user.update({
                  where: { id: user.id },
                  data: { pushSubscription: null },
                });
              }
              dispatched.push({
                medicine: med.name,
                user: user.username,
                time: schedule.specificTime,
                success: false,
                error: err.message,
              });
            }
          }
        }
      }
    }

    return {
      success: true,
      currentMinute: currentTotalMin,
      istTimeStr,
      todayDateStr,
      dispatchedCount: dispatched.filter((d) => d.success).length,
      dispatched,
    };
  } catch (error: any) {
    console.error('checkAndDispatchDueReminders error:', error);
    return { success: false, error: error.message };
  }
}
