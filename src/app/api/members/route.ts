import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/members?householdId=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const householdId = searchParams.get('householdId');

    const whereClause: any = {};
    if (householdId) whereClause.householdId = householdId;

    const members = await prisma.familyMember.findMany({
      where: whereClause,
      include: {
        medicines: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ success: true, members });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/members - Add a new family member
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { householdId, name, relationship, avatar, color, age, gender, notes } = body;

    const member = await prisma.familyMember.create({
      data: {
        householdId,
        name,
        relationship: relationship || 'Other',
        avatar: avatar || '👤',
        color: color || 'bg-teal-50 text-teal-700 border border-teal-200',
        age: age ? Number(age) : null,
        gender,
        notes,
      },
    });

    return NextResponse.json({ success: true, member });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/members?id=...
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: 'Member ID required' }, { status: 400 });

    await prisma.familyMember.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Member removed' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
