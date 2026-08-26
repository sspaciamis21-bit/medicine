import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const householdId = searchParams.get('householdId');

    if (!householdId) {
      return NextResponse.json({
        success: true,
        metrics: { thisWeekSpend: 0, thisMonthSpend: 0, lastMonthSpend: 0, threeMonthSpend: 0, weeklyAvg: 0, monthlyAvg: 0 },
        memberBreakdown: [],
        medicineBreakdown: [],
      });
    }

    const purchases = await prisma.purchase.findMany({
      where: { householdId },
      include: {
        member: true,
        medicine: true,
      },
    });

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfThreeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    let thisWeekSpend = 0;
    let thisMonthSpend = 0;
    let lastMonthSpend = 0;
    let threeMonthSpend = 0;
    const memberSpendMap: Record<string, { name: string; amount: number }> = {};
    const medicineSpendMap: Record<string, { name: string; amount: number }> = {};

    purchases.forEach((p) => {
      const pDate = new Date(p.purchaseDate);
      const amt = p.totalAmount || 0;

      if (pDate >= startOfWeek) thisWeekSpend += amt;
      if (pDate >= startOfMonth) thisMonthSpend += amt;
      if (pDate >= startOfLastMonth && pDate <= endOfLastMonth) lastMonthSpend += amt;
      if (pDate >= startOfThreeMonthsAgo) threeMonthSpend += amt;

      // Member breakdown
      const memberName = p.member?.name || 'General Household';
      if (!memberSpendMap[memberName]) memberSpendMap[memberName] = { name: memberName, amount: 0 };
      memberSpendMap[memberName].amount += amt;

      // Medicine breakdown
      const medName = p.medicineName || 'Other';
      if (!medicineSpendMap[medName]) medicineSpendMap[medName] = { name: medName, amount: 0 };
      medicineSpendMap[medName].amount += amt;
    });

    const weeklyAvg = Number((threeMonthSpend / 12).toFixed(2));
    const monthlyAvg = Number((threeMonthSpend / 3).toFixed(2));

    return NextResponse.json({
      success: true,
      metrics: {
        thisWeekSpend,
        thisMonthSpend,
        lastMonthSpend,
        threeMonthSpend,
        weeklyAvg: weeklyAvg || thisWeekSpend,
        monthlyAvg: monthlyAvg || thisMonthSpend,
      },
      memberBreakdown: Object.values(memberSpendMap),
      medicineBreakdown: Object.values(medicineSpendMap),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
