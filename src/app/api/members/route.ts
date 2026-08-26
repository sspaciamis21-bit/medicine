import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/members?householdId=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const householdId = searchParams.get('householdId');

    if (!householdId) {
      return NextResponse.json({ success: true, members: [] });
    }

    const members = await prisma.familyMember.findMany({
      where: { householdId },
      include: {
        medicines: {
          include: {
            schedules: true,
          },
        },
        doseHistory: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
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

    if (!householdId || !name) {
      return NextResponse.json({ success: false, error: 'Household ID and Name are required' }, { status: 400 });
    }

    const member = await prisma.familyMember.create({
      data: {
        householdId,
        name,
        relationship: relationship || 'Other',
        avatar: avatar || '👤',
        color: color || 'bg-[#10847e]/10 text-[#10847e] border border-[#10847e]/20',
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

// PUT /api/members - Edit existing family member
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, relationship, avatar, color, age, gender, notes } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Member ID is required' }, { status: 400 });
    }

    const member = await prisma.familyMember.update({
      where: { id },
      data: {
        name,
        relationship,
        avatar,
        color,
        age: age !== undefined ? (age ? Number(age) : null) : undefined,
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
