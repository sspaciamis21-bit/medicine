import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/medicines - Fetch all medicines with schedules and member details
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('memberId');
    const householdId = searchParams.get('householdId');

    const whereClause: any = {};
    if (memberId && memberId !== 'all') whereClause.memberId = memberId;
    if (householdId) whereClause.householdId = householdId;

    const medicines = await prisma.medicine.findMany({
      where: whereClause,
      include: {
        member: true,
        schedules: {
          where: { isActive: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute low stock status and estimated days remaining
    const enriched = medicines.map((med) => {
      const dailyConsumption = med.schedules.reduce((acc, s) => acc + (s.doseAmount || 1), 0) || 1;
      const daysRemaining = Math.max(0, Math.floor(med.currentQuantity / dailyConsumption));
      const isLowStock = med.currentQuantity <= med.lowStockThreshold;

      return {
        ...med,
        dailyConsumption,
        daysRemaining,
        isLowStock,
      };
    });

    return NextResponse.json({ success: true, medicines: enriched });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/medicines - Add a new medicine
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      householdId,
      memberId,
      name,
      brandName,
      genericName,
      formType,
      strength,
      unit,
      quantityPurchased,
      currentQuantity,
      lowStockThreshold,
      expiryDate,
      isInsulin,
      insulinType,
      penOrVial,
      insulinStorageNote,
      openedDate,
      doctorName,
      prescriptionDate,
      instructions,
      schedules, // Array of { frequencyType, specificTime, mealRelation, mealType, offsetMinutes, doseAmount }
    } = body;

    const medicine = await prisma.medicine.create({
      data: {
        householdId,
        memberId,
        name,
        brandName,
        genericName,
        formType: formType || 'Tablet',
        strength,
        unit: unit || 'Tablets',
        quantityPurchased: Number(quantityPurchased || currentQuantity || 0),
        currentQuantity: Number(currentQuantity || 0),
        lowStockThreshold: Number(lowStockThreshold || 5),
        expiryDate,
        isInsulin: Boolean(isInsulin),
        insulinType,
        penOrVial,
        insulinStorageNote,
        openedDate,
        doctorName,
        prescriptionDate,
        instructions,
        schedules: {
          create: (schedules || []).map((s: any) => ({
            frequencyType: s.frequencyType || 'daily',
            specificTime: s.specificTime,
            mealRelation: s.mealRelation || 'After Food',
            mealType: s.mealType || 'Breakfast',
            offsetMinutes: Number(s.offsetMinutes || 0),
            doseAmount: Number(s.doseAmount || 1),
            doseUnit: s.doseUnit || unit,
            isActive: true,
          })),
        },
      },
      include: {
        schedules: true,
        member: true,
      },
    });

    return NextResponse.json({ success: true, medicine });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
