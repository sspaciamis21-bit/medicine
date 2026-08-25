import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/purchases - Fetch purchase history
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const householdId = searchParams.get('householdId');
    const memberId = searchParams.get('memberId');

    const whereClause: any = {};
    if (householdId) whereClause.householdId = householdId;
    if (memberId && memberId !== 'all') whereClause.memberId = memberId;

    const purchases = await prisma.purchase.findMany({
      where: whereClause,
      include: {
        member: true,
        pharmacy: true,
        medicine: true,
      },
      orderBy: { purchaseDate: 'desc' },
    });

    return NextResponse.json({ success: true, purchases });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/purchases - Record a purchase & auto-increment medicine stock
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      householdId,
      memberId,
      medicineId,
      pharmacyId,
      medicineName,
      quantity,
      unitPrice,
      discount,
      totalAmount,
      paymentMode,
      purchaseDate,
      invoiceUrl,
    } = body;

    const computedTotal = totalAmount ?? Number(quantity || 0) * Number(unitPrice || 0) - Number(discount || 0);

    const purchase = await prisma.purchase.create({
      data: {
        householdId,
        memberId,
        medicineId,
        pharmacyId,
        medicineName,
        quantity: Number(quantity || 1),
        unitPrice: Number(unitPrice || 0),
        discount: Number(discount || 0),
        totalAmount: Number(computedTotal),
        paymentMode: paymentMode || 'Cash',
        purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
        invoiceUrl,
      },
    });

    // If linked to an existing medicine, increment stock
    if (medicineId) {
      await prisma.medicine.update({
        where: { id: medicineId },
        data: {
          currentQuantity: {
            increment: Number(quantity || 0),
          },
        },
      });
    }

    return NextResponse.json({ success: true, purchase });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
