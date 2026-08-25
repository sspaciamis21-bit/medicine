import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/household - Fetch or auto-seed initial household with members & meal settings
export async function GET() {
  try {
    let household = await prisma.household.findFirst({
      include: {
        members: true,
        mealSettings: true,
        pharmacies: true,
      },
    });

    // Auto-initialize default household if first run
    if (!household) {
      household = await prisma.household.create({
        data: {
          name: 'Our Family',
          mealSettings: {
            create: {
              breakfastTime: '08:00 AM',
              lunchTime: '01:30 PM',
              dinnerTime: '08:30 PM',
              defaultBeforeOffset: 30,
              defaultAfterOffset: 15,
            },
          },
          members: {
            create: [
              { name: 'Grandpa', relationship: 'Grandparent', avatar: '👴', color: 'amber' },
              { name: 'Father', relationship: 'Father', avatar: '👨', color: 'emerald' },
              { name: 'Mother', relationship: 'Mother', avatar: '👩', color: 'violet' },
              { name: 'Self', relationship: 'Self', avatar: '🧑', color: 'cyan' },
            ],
          },
          pharmacies: {
            create: [
              {
                name: 'Apollo 24/7 Pharmacy',
                contactPerson: 'Mr. Rakesh',
                phoneNumber: '+919876543210',
                whatsappNumber: '+919876543210',
                address: 'Shop 12, Central Market, Green Park',
                isDefault: true,
              },
            ],
          },
        },
        include: {
          members: true,
          mealSettings: true,
          pharmacies: true,
        },
      });
    }

    return NextResponse.json({ success: true, household });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/household - Update household or meal settings
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { householdId, name, mealSettings } = body;

    if (name) {
      await prisma.household.update({
        where: { id: householdId },
        data: { name },
      });
    }

    if (mealSettings) {
      await prisma.mealSettings.upsert({
        where: { householdId },
        update: {
          breakfastTime: mealSettings.breakfastTime,
          lunchTime: mealSettings.lunchTime,
          dinnerTime: mealSettings.dinnerTime,
          defaultBeforeOffset: mealSettings.defaultBeforeOffset ?? 30,
          defaultAfterOffset: mealSettings.defaultAfterOffset ?? 15,
        },
        create: {
          householdId,
          breakfastTime: mealSettings.breakfastTime || '08:00 AM',
          lunchTime: mealSettings.lunchTime || '01:30 PM',
          dinnerTime: mealSettings.dinnerTime || '08:30 PM',
        },
      });
    }

    return NextResponse.json({ success: true, message: 'Settings updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
