'use client';

import React, { useState, useEffect } from 'react';
import { Syringe, ShieldAlert, Check, Plus, Clock, Package } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';

export default function InsulinPage() {
  const { user } = useAuth();
  const [insulinMeds, setInsulinMeds] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const loadData = async () => {
    try {
      const res = await fetch(`/api/medicines${user?.householdId ? `?householdId=${user.householdId}` : ''}`);
      const data = await res.json();
      if (data.success) setInsulinMeds((data.medicines || []).filter((m: any) => m.isInsulin));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadData(); }, [user]);

  const handleRecordDose = async (med: any) => {
    try {
      await fetch('/api/dose-history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ medicineId: med.id, memberId: med.memberId, scheduledDateTime: new Date().toISOString(), status: 'taken' }) });
      await fetch('/api/medicines', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: med.id, currentQuantity: Math.max(0, med.currentQuantity - 1) }) });
      showToast(`✅ Insulin dose recorded for ${med.member?.name || 'patient'}.`);
      loadData();
    } catch (e) { showToast('Error recording dose'); }
  };

  const getOpenedDaysAgo = (openedDate: string | null) => {
    if (!openedDate) return null;
    return Math.floor((Date.now() - new Date(openedDate).getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <AppLayout>
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-11/12 bg-[#1c2a38] text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold animate-bounce">{toast}</div>}

      <div className="space-y-5">
        {/* Safety Banner (Spec §7 & §27) */}
        <div className="p-4 bg-violet-50 border border-violet-200 rounded-2xl flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-violet-700 shrink-0 mt-0.5" />
          <div className="text-xs text-violet-900 space-y-1">
            <h4 className="font-extrabold text-sm">⚕️ Safety & Medical Protocol Notice</h4>
            <p>This system <strong>only records and reminds</strong> for already-prescribed insulin doses. It does <strong>NOT</strong> independently recommend, increase, decrease, or change insulin dosage. Always follow your endocrinologist's exact prescription.</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0]">
          <h1 className="text-xl font-black text-[#1c2a38] flex items-center gap-2"><Syringe className="w-5 h-5 text-violet-700" /> Dedicated Insulin Module</h1>
          <p className="text-xs text-[#6b7280] mt-0.5">{insulinMeds.length} insulin record(s) being tracked</p>
        </div>

        {insulinMeds.length === 0 ? (
          <div className="medical-card p-10 bg-white text-center space-y-3">
            <Syringe className="w-14 h-14 text-slate-300 mx-auto" />
            <h3 className="font-bold text-[#1c2a38]">No Insulin Records</h3>
            <p className="text-xs text-[#6b7280] max-w-sm mx-auto">Add insulin from the Medicines page (set Type to "Insulin") to track pens, units, opened date, and storage.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {insulinMeds.map((ins) => {
              const openedDays = getOpenedDaysAgo(ins.openedDate);
              const isExpiredPen = openedDays !== null && openedDays > 28;
              const sched = ins.schedules?.[0] || {};
              return (
                <div key={ins.id} className="medical-card p-5 bg-white border-violet-200 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="p-2.5 rounded-2xl bg-violet-100 text-violet-700"><Syringe className="w-6 h-6" /></span>
                      <div>
                        <h3 className="text-lg font-black text-[#1c2a38]">{ins.name}</h3>
                        <p className="text-xs text-[#6b7280]">{ins.insulinType || 'Insulin'} • {ins.penOrVial || 'Pen'} • For: {ins.member?.name}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-violet-100 text-violet-800 text-xs font-bold rounded-lg">{ins.strength}</span>
                  </div>

                  {/* Key metrics grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[#6b7280] block text-[11px] font-medium">Prescribed Dose</span>
                      <span className="font-black text-[#10847e] text-sm">{sched.doseAmount || ins.doseAmount || '—'} Units</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[#6b7280] block text-[11px] font-medium">Stock Remaining</span>
                      <span className={`font-black text-sm ${ins.currentQuantity <= ins.lowStockThreshold ? 'text-amber-600' : 'text-[#1c2a38]'}`}>{ins.currentQuantity} {ins.unit}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[#6b7280] block text-[11px] font-medium">Opened Date</span>
                      <span className="font-bold text-[#1c2a38] text-sm">{ins.openedDate || 'Not set'}</span>
                      {openedDays !== null && <span className={`text-[10px] block mt-0.5 font-bold ${isExpiredPen ? 'text-red-600' : 'text-[#10847e]'}`}>{openedDays} days ago {isExpiredPen ? '⚠️ DISCARD (>28 days)' : ''}</span>}
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[#6b7280] block text-[11px] font-medium">Meal / Time Link</span>
                      <span className="font-bold text-[#1c2a38] text-sm">{sched.mealRelation || 'N/A'} ({sched.mealType || 'N/A'})</span>
                    </div>
                  </div>

                  {/* Storage Note */}
                  {ins.insulinStorageNote && (
                    <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-200 text-xs text-cyan-900">
                      <strong>🧊 Storage:</strong> {ins.insulinStorageNote}
                    </div>
                  )}

                  {/* Expiry Info */}
                  <div className="text-xs text-[#6b7280]">
                    Expiry: <strong className="text-[#1c2a38]">{ins.expiryDate || 'N/A'}</strong>
                    {ins.doctorName && <> • Prescribed by: <strong className="text-[#1c2a38]">Dr. {ins.doctorName}</strong></>}
                  </div>

                  {/* Action */}
                  <button onClick={() => handleRecordDose(ins)} className="w-full py-3 bg-[#10847e] hover:bg-[#0d6e69] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95">
                    <Check className="w-4 h-4 stroke-[3]" /> Record Insulin Dose Administered
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
