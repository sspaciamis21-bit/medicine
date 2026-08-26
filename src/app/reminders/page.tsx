'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Check, X, Bell, Pill, Syringe, Calendar } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import AlarmModal from '@/components/medicine/AlarmModal';
import { useAuth } from '@/context/AuthContext';
import { alarmEngine } from '@/utils/audioAlarm';

export default function RemindersPage() {
  const { user, selectedMember } = useAuth();
  const [medicines, setMedicines] = useState<any[]>([]);
  const [mealTimes, setMealTimes] = useState({ breakfast: '08:00 AM', lunch: '01:30 PM', dinner: '08:30 PM' });
  const [alarmActive, setAlarmActive] = useState(false);
  const [activeAlarmMed, setActiveAlarmMed] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const loadData = async () => {
    try {
      const [hRes, medRes] = await Promise.all([
        fetch(`/api/household${user?.householdId ? `?id=${user.householdId}` : ''}`),
        fetch(`/api/medicines${user?.householdId ? `?householdId=${user.householdId}` : ''}`),
      ]);
      const hData = await hRes.json();
      const medData = await medRes.json();
      if (hData.success && hData.household?.mealSettings) {
        setMealTimes({ breakfast: hData.household.mealSettings.breakfastTime, lunch: hData.household.mealSettings.lunchTime, dinner: hData.household.mealSettings.dinnerTime });
      }
      if (medData.success) {
        setMedicines((medData.medicines || []).map((m: any) => ({
          ...m, status: 'pending',
          scheduleTime: m.schedules?.[0]?.specificTime || '08:00 AM',
          mealRelation: m.schedules?.[0]?.mealRelation || 'After Food',
          mealType: m.schedules?.[0]?.mealType || 'Breakfast',
          doseAmount: m.schedules?.[0]?.doseAmount || 1,
          offsetMinutes: m.schedules?.[0]?.offsetMinutes || 0,
        })));
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadData(); }, [user]);

  const filtered = selectedMember === 'all' ? medicines : medicines.filter(m => m.memberId === selectedMember);
  const pendingCount = filtered.filter(m => m.status === 'pending').length;
  const takenCount = filtered.filter(m => m.status === 'taken').length;

  const handleMarkTaken = async (medId: string) => {
    const t = medicines.find(m => m.id === medId);
    if (!t) return;
    setMedicines(prev => prev.map(m => m.id === medId ? { ...m, status: 'taken', currentQuantity: Math.max(0, m.currentQuantity - (m.isInsulin ? 1 : m.doseAmount)), takenAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : m));
    setAlarmActive(false); alarmEngine.stopAlarmLoop(); alarmEngine.playLoudChime(1046.5, 0.3, 1.8);
    showToast(`✅ ${t.name} marked TAKEN. Stock decremented.`);
    try { await fetch('/api/dose-history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ medicineId: t.id, memberId: t.memberId, scheduledDateTime: new Date().toISOString(), status: 'taken' }) }); } catch (e) {}
  };

  const handleSnooze = (min = 10) => { setAlarmActive(false); alarmEngine.stopAlarmLoop(); showToast(`⏰ Snoozed for ${min} minutes.`); };
  const handleSkip = async (medId: string) => {
    const t = medicines.find(m => m.id === medId);
    if (!t) return;
    setMedicines(prev => prev.map(m => m.id === medId ? { ...m, status: 'skipped' } : m));
    setAlarmActive(false); alarmEngine.stopAlarmLoop(); showToast(`⏭️ Skipped ${t.name}. Stock unchanged.`);
    try { await fetch('/api/dose-history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ medicineId: t.id, memberId: t.memberId, scheduledDateTime: new Date().toISOString(), status: 'skipped' }) }); } catch (e) {}
  };

  return (
    <AppLayout>
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-11/12 bg-[#1c2a38] text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold animate-bounce">{toast}</div>}
      <AlarmModal isOpen={alarmActive} medicine={activeAlarmMed} onTake={handleMarkTaken} onSnooze={handleSnooze} onSkip={handleSkip} onDismiss={() => { setAlarmActive(false); alarmEngine.stopAlarmLoop(); }} />

      <div className="space-y-5">
        <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0]">
          <h1 className="text-xl font-black text-[#1c2a38] flex items-center gap-2"><Clock className="w-5 h-5 text-[#10847e]" /> Today's Medicine Schedule & Reminders</h1>
          <p className="text-xs text-[#6b7280] mt-1">Breakfast: <strong>{mealTimes.breakfast}</strong> • Lunch: <strong>{mealTimes.lunch}</strong> • Dinner: <strong>{mealTimes.dinner}</strong></p>
          <div className="flex items-center gap-4 mt-3 text-xs font-bold">
            <span className="text-[#10847e]">✅ {takenCount} Taken</span>
            <span className="text-amber-600">⏳ {pendingCount} Pending</span>
            <span className="text-slate-500">Total {filtered.length} doses scheduled</span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="medical-card p-10 bg-white text-center space-y-3">
            <Calendar className="w-14 h-14 text-slate-300 mx-auto" />
            <h3 className="font-bold text-[#1c2a38]">No Reminders Scheduled</h3>
            <p className="text-xs text-[#6b7280]">Add medicines with meal-linked schedules to see today's reminder timeline here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((med) => {
              const isTaken = med.status === 'taken';
              const isSkipped = med.status === 'skipped';
              return (
                <div key={med.id} className={`medical-card p-4 bg-white ${isTaken ? 'opacity-70' : isSkipped ? 'bg-rose-50/30' : 'hover:border-[#10847e]/30'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${med.isInsulin ? 'bg-violet-100 text-violet-700' : 'bg-[#10847e]/10 text-[#10847e]'}`}>
                        {med.isInsulin ? <Syringe className="w-6 h-6" /> : <Pill className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-[#1c2a38] text-base">{med.name}</h3>
                        <p className="text-xs text-[#6b7280]">{med.strength} • Dose: <strong>{med.doseAmount} {med.unit}</strong> • For: <strong>{med.member?.name}</strong></p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#10847e]/10 text-[#10847e] text-xs font-bold border border-[#10847e]/20">
                            <Clock className="w-3.5 h-3.5" /> {med.scheduleTime} ({med.mealRelation})
                          </span>
                          <span className="text-[11px] text-slate-500">{med.offsetMinutes}m {med.mealRelation.toLowerCase().includes('before') ? 'before' : 'after'} {med.mealType}</span>
                          <span className="text-[11px] text-slate-500">Stock: <strong className={med.currentQuantity <= med.lowStockThreshold ? 'text-amber-600' : ''}>{med.currentQuantity}</strong></span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {isTaken ? (
                        <div className="flex items-center gap-1 text-[#10847e] text-xs font-black bg-[#10847e]/10 px-3.5 py-2 rounded-xl border border-[#10847e]/30"><Check className="w-4 h-4 stroke-[3]" /> Done {med.takenAt}</div>
                      ) : isSkipped ? (
                        <div className="text-xs font-bold text-rose-700 bg-rose-100 px-3 py-1.5 rounded-xl">Skipped</div>
                      ) : (
                        <>
                          <button onClick={() => { setActiveAlarmMed(med); setAlarmActive(true); alarmEngine.startAlarmLoop(); }} className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"><Bell className="w-4 h-4" /></button>
                          <button onClick={() => handleSkip(med.id)} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl">Skip</button>
                          <button onClick={() => handleMarkTaken(med.id)} className="px-4 py-2.5 bg-[#10847e] hover:bg-[#0d6e69] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition active:scale-95"><Check className="w-4 h-4 stroke-[3]" /> Take</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
