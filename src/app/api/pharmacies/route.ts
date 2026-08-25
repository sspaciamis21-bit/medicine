import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/pharmacies
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const householdId = searchParams.get('householdId');

    const whereClause: any = {};
    if (householdId) whereClause.householdId = householdId;

    const pharmacies = await prisma.pharmacy.findMany({
      where: whereClause,
      orderBy: { isDefault: 'desc' },
    });

    return NextResponse.json({ success: true, pharmacies });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/pharmacies
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { householdId, name, contactPerson, phoneNumber, whatsappNumber, address, isDefault, notes } = body;

    // If marked default, unset other defaults
    if (isDefault) {
      await prisma.pharmacy.updateMany({
        where: { householdId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const pharmacy = await prisma.pharmacy.create({
      data: {
        householdId,
        name,
        contactPerson,
        phoneNumber,
        whatsappNumber: whatsappNumber || phoneNumber,
        address,
        isDefault: Boolean(isDefault),
        notes,
      },
    });

    return NextResponse.json({ success: true, pharmacy });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
