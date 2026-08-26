import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/household?id=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id') || searchParams.get('householdId');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Household ID required' }, { status: 400 });
    }

    const household = await prisma.household.findUnique({
      where: { id },
      include: {
        members: true,
        mealSettings: true,
        pharmacies: true,
      },
    });

    if (!household) {
      return NextResponse.json({ success: false, error: 'Household not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, household });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/household - Update household or meal settings
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, householdId, name, mealSettings } = body;
    const targetId = id || householdId;

    if (!targetId) {
      return NextResponse.json({ success: false, error: 'Household ID required' }, { status: 400 });
    }

    if (name) {
      await prisma.household.update({
        where: { id: targetId },
        data: { name },
      });
    }

    if (mealSettings) {
      await prisma.mealSettings.upsert({
        where: { householdId: targetId },
        update: {
          breakfastTime: mealSettings.breakfastTime,
          lunchTime: mealSettings.lunchTime,
          dinnerTime: mealSettings.dinnerTime,
          defaultBeforeOffset: Number(mealSettings.defaultBeforeOffset ?? 30),
          defaultAfterOffset: Number(mealSettings.defaultAfterOffset ?? 15),
        },
        create: {
          householdId: targetId,
          breakfastTime: mealSettings.breakfastTime || '08:00 AM',
          lunchTime: mealSettings.lunchTime || '01:30 PM',
          dinnerTime: mealSettings.dinnerTime || '08:30 PM',
          defaultBeforeOffset: Number(mealSettings.defaultBeforeOffset ?? 30),
          defaultAfterOffset: Number(mealSettings.defaultAfterOffset ?? 15),
        },
      });
    }

    return NextResponse.json({ success: true, message: 'Settings updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
