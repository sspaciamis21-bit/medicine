import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/reorders - Get reorder lists
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const householdId = searchParams.get('householdId');

    const whereClause: any = {};
    if (householdId) whereClause.householdId = householdId;

    const reorders = await prisma.reorderList.findMany({
      where: whereClause,
      include: {
        pharmacy: true,
        items: {
          include: {
            medicine: {
              include: {
                member: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, reorders });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/reorders - Create a reorder list
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { householdId, pharmacyId, medicineIds, notes } = body;

    let targetHouseholdId = householdId;
    if (!targetHouseholdId) {
      const firstH = await prisma.household.findFirst();
      if (firstH) targetHouseholdId = firstH.id;
    }

    if (!targetHouseholdId || !medicineIds || !Array.isArray(medicineIds) || medicineIds.length === 0) {
      return NextResponse.json({ success: false, error: 'Household and medicine selections are required' }, { status: 400 });
    }

    const reorder = await prisma.reorderList.create({
      data: {
        householdId: targetHouseholdId,
        pharmacyId: pharmacyId || null,
        status: 'ordered',
        notes,
        items: {
          create: medicineIds.map((medId: string) => ({
            medicineId: medId,
            quantityNeeded: 1,
            status: 'ordered',
          })),
        },
      },
      include: {
        pharmacy: true,
        items: {
          include: {
            medicine: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, reorder });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/reorders - Update status (e.g. ordered -> received)
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id) return NextResponse.json({ success: false, error: 'Reorder ID required' }, { status: 400 });

    const reorder = await prisma.reorderList.update({
      where: { id },
      data: { status },
      include: {
        items: true,
      },
    });

    return NextResponse.json({ success: true, reorder });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
