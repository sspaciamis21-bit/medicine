'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  Check, 
  X, 
  AlertTriangle, 
  Pill, 
  Syringe, 
  Plus, 
  ShoppingCart, 
  TrendingUp, 
  Bell, 
  DollarSign, 
  Phone, 
  Receipt,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import AlarmModal from '@/components/medicine/AlarmModal';
import { useAuth } from '@/context/AuthContext';
import { alarmEngine } from '@/utils/audioAlarm';

export default function DashboardPage() {
  const { user, selectedMember } = useAuth();

  const [medicines, setMedicines] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any>({ thisWeekSpend: 0, thisMonthSpend: 0, monthlyAvg: 0 });
  const [mealTimes, setMealTimes] = useState({ breakfast: '08:00 AM', lunch: '01:30 PM', dinner: '08:30 PM' });
  const [loading, setLoading] = useState(true);

  // Alarm modal state
  const [alarmActive, setAlarmActive] = useState<boolean>(false);
  const [activeAlarmMed, setActiveAlarmMed] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch Household & Meal Times
      const hRes = await fetch(`/api/household${user?.householdId ? `?id=${user.householdId}` : ''}`);
      const hData = await hRes.json();
      if (hData.success && hData.household) {
        if (hData.household.mealSettings) {
          setMealTimes({
            breakfast: hData.household.mealSettings.breakfastTime || '08:00 AM',
            lunch: hData.household.mealSettings.lunchTime || '01:30 PM',
            dinner: hData.household.mealSettings.dinnerTime || '08:30 PM',
          });
        }
      }

      // Fetch Members
      const mRes = await fetch(`/api/members${user?.householdId ? `?householdId=${user.householdId}` : ''}`);
      const mData = await mRes.json();
      if (mData.success) {
        setMembers(mData.members || []);
      }

      // Fetch Medicines
      const medRes = await fetch(`/api/medicines${user?.householdId ? `?householdId=${user.householdId}` : ''}`);
      const medData = await medRes.json();
      if (medData.success) {
        setMedicines(
          (medData.medicines || []).map((m: any) => ({
            ...m,
            status: m.status || 'pending',
            scheduleTime: m.schedules?.[0]?.specificTime || '08:00 AM',
            mealRelation: m.schedules?.[0]?.mealRelation || 'After Food',
            mealType: m.schedules?.[0]?.mealType || 'Breakfast',
            doseAmount: m.schedules?.[0]?.doseAmount || 1,
            offsetMinutes: m.schedules?.[0]?.offsetMinutes || 0,
          }))
        );
      }

      // Fetch Expenses
      const expRes = await fetch(`/api/expenses${user?.householdId ? `?householdId=${user.householdId}` : ''}`);
      const expData = await expRes.json();
      if (expData.success && expData.metrics) {
        setExpenses(expData.metrics);
      }
    } catch (e) {
      console.error('Error loading dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Filter medicines by selected family member
  const filteredMedicines = selectedMember === 'all'
    ? medicines
    : medicines.filter((m) => m.memberId === selectedMember);

  const lowStockMedicines = medicines.filter((m) => m.currentQuantity <= m.lowStockThreshold);

  // Check medicines expiring soon (within 30 days)
  const expiringSoonMedicines = medicines.filter((m) => {
    if (!m.expiryDate) return false;
    const diffDays = Math.ceil((new Date(m.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= (m.expiryAlertDays || 30);
  });

  // Handle Mark as Taken
  const handleMarkTaken = async (medId: string) => {
    const target = medicines.find((m) => m.id === medId);
    if (!target) return;

    // Optimistic stock update
    setMedicines((prev) =>
      prev.map((m) =>
        m.id === medId
          ? {
              ...m,
              status: 'taken',
              currentQuantity: Math.max(0, m.currentQuantity - (m.isInsulin ? 1 : m.doseAmount)),
              takenAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          : m
      )
    );

    setAlarmActive(false);
    alarmEngine.stopAlarmLoop();
    alarmEngine.playLoudChime(1046.5, 0.3, 1.8);
    showToast(`✅ Marked as TAKEN: ${target.name} stock updated!`);

    try {
      await fetch('/api/dose-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicineId: target.id,
          memberId: target.memberId,
          scheduledDateTime: new Date().toISOString(),
          status: 'taken',
        }),
      });
      loadData();
    } catch (e) {}
  };

  // Handle Snooze
  const handleSnooze = (minutes: number = 10) => {
    setAlarmActive(false);
    alarmEngine.stopAlarmLoop();
    showToast(`⏰ Alarm snoozed for ${minutes} minutes. Will alert loudly again.`);
  };

  // Handle Skip
  const handleSkip = async (medId: string) => {
    const target = medicines.find((m) => m.id === medId);
    if (!target) return;

    setMedicines((prev) =>
      prev.map((m) => (m.id === medId ? { ...m, status: 'skipped' } : m))
    );
    setAlarmActive(false);
    alarmEngine.stopAlarmLoop();
    showToast(`⏭️ Skipped dose for ${target.name}. Stock unchanged.`);

    try {
      await fetch('/api/dose-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicineId: target.id,
          memberId: target.memberId,
          scheduledDateTime: new Date().toISOString(),
          status: 'skipped',
        }),
      });
    } catch (e) {}
  };

  const triggerAlarm = (med: any) => {
    setActiveAlarmMed(med);
    setAlarmActive(true);
    alarmEngine.startAlarmLoop();
  };

  return (
    <AppLayout>
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-11/12 bg-[#1c2a38] text-white px-4 py-3 rounded-2xl shadow-2xl border border-[#10847e]/50 flex items-center gap-2.5 text-xs font-bold animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Alarm Modal */}
      <AlarmModal
        isOpen={alarmActive}
        medicine={activeAlarmMed}
        onTake={handleMarkTaken}
        onSnooze={handleSnooze}
        onSkip={handleSkip}
        onDismiss={() => {
          setAlarmActive(false);
          alarmEngine.stopAlarmLoop();
        }}
      />

      <div className="space-y-5">
        {/* Top Welcome & Quick Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-[#e2e8f0]">
          <div>
            <h1 className="text-xl font-black text-[#1c2a38] tracking-tight">
              {user?.householdName ? `${user.householdName}` : 'Family Medicine Dashboard'}
            </h1>
            <p className="text-xs text-[#6b7280] font-medium mt-0.5">
              Household meal times: Breakfast ({mealTimes.breakfast}) • Lunch ({mealTimes.lunch}) • Dinner ({mealTimes.dinner})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/medicines"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#10847e] hover:bg-[#0d6e69] text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Medicine</span>
            </Link>
            <Link
              href="/expenses"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#f4f1eb] hover:bg-slate-200 text-[#1c2a38] text-xs font-bold rounded-xl border border-slate-300 transition"
            >
              <Receipt className="w-4 h-4" />
              <span>Record Purchase</span>
            </Link>
          </div>
        </div>

        {/* LOW STOCK BANNER ALERT (Spec §9 & §12) */}
        {lowStockMedicines.length > 0 && (
          <div className="p-4 bg-[#fff8e6] border border-[#ffe082] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ffe082]/60 text-amber-800 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-black text-amber-900 uppercase tracking-wide">
                  Low Stock Alert ({lowStockMedicines.length} Medicines Need Refill)
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  {lowStockMedicines
                    .map((m) => `${m.name} (${m.currentQuantity} ${m.unit || 'units'} left • ~${m.daysRemaining || 0} days)`)
                    .join(', ')}
                </p>
              </div>
            </div>
            <Link
              href="/pharmacy"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shrink-0 flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              1-Tap Reorder Now
            </Link>
          </div>
        )}

        {/* EXPIRY ALERT BANNER (Spec §18) */}
        {expiringSoonMedicines.length > 0 && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-rose-900 uppercase tracking-wide">
                  Medicines Expiring Soon ({expiringSoonMedicines.length})
                </h4>
                <p className="text-xs text-rose-800 mt-0.5">
                  {expiringSoonMedicines.map((m) => `${m.name} (Exp: ${m.expiryDate})`).join(', ')}
                </p>
              </div>
            </div>
            <Link
              href="/stock"
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
            >
              Check Expiry
            </Link>
          </div>
        )}

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="medical-card p-4 bg-white">
            <span className="text-xs font-semibold text-[#6b7280]">Scheduled Today</span>
            <p className="text-2xl font-black text-[#1c2a38] mt-1">{filteredMedicines.length} Doses</p>
            <span className="text-[11px] text-[#10847e] font-bold mt-1 block">Active prescriptions</span>
          </div>

          <div className="medical-card p-4 bg-white">
            <span className="text-xs font-semibold text-[#10847e]">Taken So Far</span>
            <p className="text-2xl font-black text-[#10847e] mt-1">
              {filteredMedicines.filter((m) => m.status === 'taken').length} Done
            </p>
            <span className="text-[11px] text-slate-500 mt-1 block">Adherence recorded</span>
          </div>

          <div className="medical-card p-4 bg-white">
            <span className="text-xs font-semibold text-amber-700">Pending Doses</span>
            <p className="text-2xl font-black text-amber-600 mt-1">
              {filteredMedicines.filter((m) => m.status === 'pending').length} Left
            </p>
            <span className="text-[11px] text-amber-700 mt-1 block">Due for today</span>
          </div>

          <div className="medical-card p-4 bg-white">
            <span className="text-xs font-semibold text-[#6b7280]">This Month's Spend</span>
            <p className="text-2xl font-black text-[#1c2a38] mt-1">₹ {expenses.thisMonthSpend || 0}</p>
            <span className="text-[11px] text-[#6b7280] mt-1 block">Avg ₹ {expenses.monthlyAvg || 0}/mo</span>
          </div>
        </div>

        {/* Today's Medicine Timeline & Reminders (Spec §5 & §15) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-[#1c2a38] text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#10847e]" />
              Today's Medicine Schedule & Meal Reminders
            </h2>
            <Link href="/reminders" className="text-xs font-bold text-[#10847e] hover:underline">
              View Full Schedule →
            </Link>
          </div>

          {filteredMedicines.length === 0 ? (
            <div className="medical-card p-8 bg-white text-center space-y-3">
              <Pill className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-[#1c2a38] text-sm">No Medicines Scheduled</h3>
              <p className="text-xs text-[#6b7280] max-w-sm mx-auto">
                Add your family members' daily medicines, tablets, syrups, or insulin to organize schedules and stock alerts.
              </p>
              <Link
                href="/medicines"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#10847e] text-white font-bold text-xs rounded-xl"
              >
                <Plus className="w-4 h-4" />
                Add Your First Medicine
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMedicines.map((med) => {
                const isTaken = med.status === 'taken';
                const isSkipped = med.status === 'skipped';
                return (
                  <div
                    key={med.id}
                    className={`medical-card p-4.5 bg-white ${
                      isTaken ? 'bg-slate-50/80 opacity-75' : isSkipped ? 'bg-rose-50/50' : 'hover:border-[#10847e]/40'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                            med.isInsulin
                              ? 'bg-violet-100 text-violet-700'
                              : 'bg-[#10847e]/10 text-[#10847e]'
                          }`}
                        >
                          {med.isInsulin ? <Syringe className="w-6 h-6" /> : <Pill className="w-6 h-6" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-extrabold text-[#1c2a38] text-base">{med.name}</h3>
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              {med.member?.name || med.memberName || 'Family Member'}
                            </span>
                            {med.isInsulin && (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-violet-100 text-violet-800">
                                Insulin ({med.insulinType || 'Dose'})
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-[#6b7280] mt-0.5">
                            {med.strength ? `${med.strength} • ` : ''}Dose: <strong className="text-[#1c2a38]">{med.doseAmount} {med.unit || 'Tablets'}</strong>
                          </p>

                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#10847e]/10 text-[#10847e] text-xs font-bold border border-[#10847e]/20">
                              <Clock className="w-3.5 h-3.5" />
                              {med.scheduleTime} ({med.mealRelation})
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Stock: <strong className={med.currentQuantity <= med.lowStockThreshold ? 'text-amber-600' : 'text-[#1c2a38]'}>{med.currentQuantity} {med.unit}</strong> remaining
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {isTaken ? (
                          <div className="flex items-center gap-1 text-[#10847e] text-xs font-black bg-[#10847e]/10 px-3.5 py-2 rounded-xl border border-[#10847e]/30">
                            <Check className="w-4 h-4 stroke-[3]" /> Done at {med.takenAt || '08:00 AM'}
                          </div>
                        ) : isSkipped ? (
                          <div className="text-xs font-bold text-rose-700 bg-rose-100 px-3 py-1.5 rounded-xl">
                            Skipped
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => triggerAlarm(med)}
                              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                              title="Trigger Alarm Sound"
                            >
                              <Bell className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleSkip(med.id)}
                              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl"
                            >
                              Skip
                            </button>
                            <button
                              onClick={() => handleMarkTaken(med.id)}
                              className="px-4 py-2.5 bg-[#10847e] hover:bg-[#0d6e69] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition active:scale-95"
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                              Mark Taken
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
