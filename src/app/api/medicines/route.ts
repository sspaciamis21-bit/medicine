import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/medicines?householdId=... - Fetch all medicines with schedules and member details
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('memberId');
    const householdId = searchParams.get('householdId');

    if (!householdId) {
      return NextResponse.json({ success: true, medicines: [] });
    }

    const whereClause: any = { householdId };
    if (memberId && memberId !== 'all') whereClause.memberId = memberId;

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
      expiryAlertDays,
      isInsulin,
      insulinType,
      penOrVial,
      insulinStorageNote,
      openedDate,
      doctorName,
      prescriptionDate,
      duration,
      instructions,
      schedules,
    } = body;

    if (!householdId || !memberId || !name) {
      return NextResponse.json({ success: false, error: 'Household, Member and Medicine name are required' }, { status: 400 });
    }

    const medicine = await prisma.medicine.create({
      data: {
        householdId,
        memberId,
        name,
        brandName,
        genericName,
        formType: formType || 'Tablet',
        strength: strength || '',
        unit: unit || 'Tablets',
        quantityPurchased: Number(quantityPurchased || currentQuantity || 0),
        currentQuantity: Number(currentQuantity || 0),
        lowStockThreshold: Number(lowStockThreshold || 5),
        expiryDate,
        expiryAlertDays: Number(expiryAlertDays || 30),
        isInsulin: Boolean(isInsulin),
        insulinType,
        penOrVial,
        insulinStorageNote,
        openedDate,
        doctorName,
        prescriptionDate,
        duration,
        instructions,
        schedules: {
          create: (schedules && schedules.length > 0
            ? schedules
            : [
                {
                  frequencyType: 'daily',
                  specificTime: '08:00 AM',
                  mealRelation: 'After Food',
                  mealType: 'Breakfast',
                  offsetMinutes: 15,
                  doseAmount: 1,
                  doseUnit: unit || 'Tablets',
                },
              ]
          ).map((s: any) => ({
            frequencyType: s.frequencyType || 'daily',
            specificTime: s.specificTime || '08:00 AM',
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

// PUT /api/medicines - Update medicine or adjust stock
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      brandName,
      genericName,
      formType,
      strength,
      unit,
      currentQuantity,
      lowStockThreshold,
      expiryDate,
      expiryAlertDays,
      isInsulin,
      insulinType,
      penOrVial,
      insulinStorageNote,
      openedDate,
      doctorName,
      prescriptionDate,
      duration,
      instructions,
      schedules,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Medicine ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (brandName !== undefined) updateData.brandName = brandName;
    if (genericName !== undefined) updateData.genericName = genericName;
    if (formType !== undefined) updateData.formType = formType;
    if (strength !== undefined) updateData.strength = strength;
    if (unit !== undefined) updateData.unit = unit;
    if (currentQuantity !== undefined) updateData.currentQuantity = Number(currentQuantity);
    if (lowStockThreshold !== undefined) updateData.lowStockThreshold = Number(lowStockThreshold);
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate;
    if (expiryAlertDays !== undefined) updateData.expiryAlertDays = Number(expiryAlertDays);
    if (isInsulin !== undefined) updateData.isInsulin = Boolean(isInsulin);
    if (insulinType !== undefined) updateData.insulinType = insulinType;
    if (penOrVial !== undefined) updateData.penOrVial = penOrVial;
    if (insulinStorageNote !== undefined) updateData.insulinStorageNote = insulinStorageNote;
    if (openedDate !== undefined) updateData.openedDate = openedDate;
    if (doctorName !== undefined) updateData.doctorName = doctorName;
    if (prescriptionDate !== undefined) updateData.prescriptionDate = prescriptionDate;
    if (duration !== undefined) updateData.duration = duration;
    if (instructions !== undefined) updateData.instructions = instructions;

    if (schedules && Array.isArray(schedules)) {
      await prisma.medicineSchedule.deleteMany({ where: { medicineId: id } });
      await prisma.medicineSchedule.createMany({
        data: schedules.map((s: any) => ({
          medicineId: id,
          frequencyType: s.frequencyType || 'daily',
          specificTime: s.specificTime || '08:00 AM',
          mealRelation: s.mealRelation || 'After Food',
          mealType: s.mealType || 'Breakfast',
          offsetMinutes: Number(s.offsetMinutes || 0),
          doseAmount: Number(s.doseAmount || 1),
          doseUnit: s.doseUnit || unit,
          isActive: true,
        })),
      });
    }

    const medicine = await prisma.medicine.update({
      where: { id },
      data: updateData,
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

// DELETE /api/medicines?id=...
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: 'Medicine ID is required' }, { status: 400 });

    await prisma.medicine.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Medicine deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
