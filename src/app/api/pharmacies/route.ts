import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/pharmacies?householdId=... - Fetch pharmacies strictly for this household
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const householdId = searchParams.get('householdId');

    if (!householdId) {
      return NextResponse.json({ success: true, pharmacies: [] });
    }

    const pharmacies = await prisma.pharmacy.findMany({
      where: { householdId },
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

    if (!householdId || !name || !phoneNumber) {
      return NextResponse.json({ success: false, error: 'Household, Name and Phone are required' }, { status: 400 });
    }

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

// PUT /api/pharmacies
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, householdId, name, contactPerson, phoneNumber, whatsappNumber, address, isDefault, notes } = body;

    if (!id) return NextResponse.json({ success: false, error: 'Pharmacy ID required' }, { status: 400 });

    if (isDefault && householdId) {
      await prisma.pharmacy.updateMany({
        where: { householdId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const pharmacy = await prisma.pharmacy.update({
      where: { id },
      data: {
        name,
        contactPerson,
        phoneNumber,
        whatsappNumber,
        address,
        isDefault: isDefault !== undefined ? Boolean(isDefault) : undefined,
        notes,
      },
    });

    return NextResponse.json({ success: true, pharmacy });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/pharmacies?id=...
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: 'Pharmacy ID required' }, { status: 400 });

    await prisma.pharmacy.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Pharmacy deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
