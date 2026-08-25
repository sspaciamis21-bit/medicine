import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/auth/register - Register a new user & create household
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, email, password, householdName, adminMemberName } = body;

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Username and password are required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Username already taken' }, { status: 400 });
    }

    // Create Household + Admin User + Default Admin Member + Default Meal Settings
    const household = await prisma.household.create({
      data: {
        name: householdName || `${username}'s Family`,
        mealSettings: {
          create: {
            breakfastTime: '08:00 AM',
            lunchTime: '01:30 PM',
            dinnerTime: '08:30 PM',
            defaultBeforeOffset: 30,
            defaultAfterOffset: 15,
          },
        },
        users: {
          create: {
            username,
            email,
            passwordHash: password, // For production use bcrypt, currently direct hash/password
            role: 'admin',
          },
        },
        members: {
          create: [
            {
              name: adminMemberName || username,
              relationship: 'Self',
              avatar: '🧑',
              color: 'bg-teal-50 text-teal-700 border border-teal-200',
            },
          ],
        },
      },
      include: {
        users: true,
        members: true,
        mealSettings: true,
      },
    });

    const user = household.users[0];

    return NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, role: user.role, householdId: household.id },
      household,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
