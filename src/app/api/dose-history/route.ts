import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/dose-history - Log dose action (taken, snoozed, skipped)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      scheduleId,
      medicineId,
      memberId,
      scheduledDateTime,
      status, // 'taken' | 'snoozed' | 'skipped' | 'missed'
      snoozeUntil,
      skipReason,
      notes,
    } = body;

    const actualDateTime = new Date().toISOString();

    // 1. Create Dose History Record
    const doseLog = await prisma.doseHistory.create({
      data: {
        scheduleId,
        medicineId,
        memberId,
        scheduledDateTime: scheduledDateTime || actualDateTime,
        actualDateTime,
        status,
        snoozeUntil,
        skipReason,
        notes,
      },
    });

    // 2. If Dose was TAKEN, automatically decrement medicine stock
    let updatedMedicine = null;
    if (status === 'taken') {
      const med = await prisma.medicine.findUnique({
        where: { id: medicineId },
        include: { schedules: true },
      });

      if (med) {
        // Determine dose decrement amount
        let doseDecrement = 1;
        if (scheduleId) {
          const schedule = med.schedules.find((s) => s.id === scheduleId);
          if (schedule) doseDecrement = schedule.doseAmount || 1;
        }

        const newStock = Math.max(0, med.currentQuantity - (med.isInsulin ? 1 : doseDecrement));
        updatedMedicine = await prisma.medicine.update({
          where: { id: medicineId },
          data: { currentQuantity: newStock },
        });
      }
    }

    return NextResponse.json({
      success: true,
      doseLog,
      updatedStock: updatedMedicine?.currentQuantity,
      isLowStock: updatedMedicine ? updatedMedicine.currentQuantity <= updatedMedicine.lowStockThreshold : false,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// GET /api/dose-history?householdId=... - Fetch adherence logs strictly for this household
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const householdId = searchParams.get('householdId');
    const memberId = searchParams.get('memberId');
    const medicineId = searchParams.get('medicineId');
    const limit = Number(searchParams.get('limit') || 100);

    const whereClause: any = {};
    if (householdId) {
      whereClause.medicine = { householdId };
    }
    if (memberId && memberId !== 'all') whereClause.memberId = memberId;
    if (medicineId) whereClause.medicineId = medicineId;

    const history = await prisma.doseHistory.findMany({
      where: whereClause,
      include: {
        medicine: true,
        member: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ success: true, history });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
