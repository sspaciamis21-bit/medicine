import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/auth/register - Register a new user & create household
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, email, phone, password, householdName, adminMemberName, adminName } = body;

    const trimmedUsername = (username || '').trim();
    if (!trimmedUsername || !password) {
      return NextResponse.json({ success: false, error: 'Username and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ success: false, error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json({ success: false, error: 'Password must contain both letters and numbers' }, { status: 400 });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email address' }, { status: 400 });
    }

    if (phone) {
      const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '').slice(-10);
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        return NextResponse.json({ success: false, error: 'Please enter a valid 10-digit mobile number' }, { status: 400 });
      }
    }

    const existing = await prisma.user.findUnique({ where: { username: trimmedUsername } });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Username already taken. Please choose another username.' }, { status: 400 });
    }

    // Create Household + Admin User + Default Admin Member + Default Meal Settings
    const household = await prisma.household.create({
      data: {
        name: householdName || `${trimmedUsername}'s Family`,
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
            username: trimmedUsername,
            email: email ? email.trim() : '',
            passwordHash: password,
            role: 'admin',
          },
        },
        members: {
          create: [
            {
              name: adminMemberName || adminName || trimmedUsername,
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
