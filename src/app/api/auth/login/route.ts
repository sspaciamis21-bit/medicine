import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/auth/login - Login user and return household data
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Username and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username: username.trim() },
      include: {
        household: {
          include: {
            members: true,
            mealSettings: true,
            pharmacies: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'No account found with this username. Please click "Register Family" to create an account.',
      }, { status: 404 });
    }

    if (user.passwordHash !== password) {
      return NextResponse.json({
        success: false,
        error: 'Incorrect password. Please try again.',
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        householdId: user.householdId,
      },
      household: user.household,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
