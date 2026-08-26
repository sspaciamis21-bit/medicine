'use client';

import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, AlertCircle, RefreshCw, Pill, Syringe, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';

export default function StockPage() {
  const { user, selectedMember } = useAuth();
  const [medicines, setMedicines] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const loadData = async () => {
    try {
      const res = await fetch(`/api/medicines${user?.householdId ? `?householdId=${user.householdId}` : ''}`);
      const data = await res.json();
      if (data.success) setMedicines(data.medicines || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadData(); }, [user]);

  const filtered = selectedMember === 'all' ? medicines : medicines.filter(m => m.memberId === selectedMember);
  const lowStock = filtered.filter(m => m.currentQuantity <= m.lowStockThreshold);
  const expiringSoon = filtered.filter(m => {
    if (!m.expiryDate) return false;
    const days = Math.ceil((new Date(m.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 && days <= (m.expiryAlertDays || 30);
  });
  const expired = filtered.filter(m => {
    if (!m.expiryDate) return false;
    return new Date(m.expiryDate).getTime() < Date.now();
  });

  const handleAdjust = async (id: string, delta: number) => {
    const med = medicines.find(m => m.id === id);
    if (!med) return;
    const newQty = Math.max(0, med.currentQuantity + delta);
    try {
      await fetch('/api/medicines', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, currentQuantity: newQty }) });
      showToast(`📦 ${med.name}: ${newQty} ${med.unit}`);
      loadData();
    } catch (e) {}
  };

  return (
    <AppLayout>
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-11/12 bg-[#1c2a38] text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold animate-bounce">{toast}</div>}

      <div className="space-y-5">
        <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0]">
          <h1 className="text-xl font-black text-[#1c2a38] flex items-center gap-2"><Package className="w-5 h-5 text-[#10847e]" /> Stock Management & Alerts</h1>
          <p className="text-xs text-[#6b7280] mt-0.5">Monitor stock levels, low-stock alerts, and expiry warnings for {filtered.length} medicines</p>
        </div>

        {/* Alert Summaries */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`medical-card p-4 bg-white ${lowStock.length > 0 ? 'border-amber-300' : ''}`}>
            <div className="flex items-center gap-2"><AlertTriangle className={`w-5 h-5 ${lowStock.length > 0 ? 'text-amber-600 animate-pulse' : 'text-slate-300'}`} /><span className="text-xs font-bold text-[#6b7280]">Low Stock</span></div>
            <p className="text-2xl font-black mt-1 text-amber-600">{lowStock.length}</p>
            <span className="text-[11px] text-[#6b7280]">Below reorder threshold</span>
          </div>
          <div className={`medical-card p-4 bg-white ${expiringSoon.length > 0 ? 'border-orange-300' : ''}`}>
            <div className="flex items-center gap-2"><AlertCircle className={`w-5 h-5 ${expiringSoon.length > 0 ? 'text-orange-600' : 'text-slate-300'}`} /><span className="text-xs font-bold text-[#6b7280]">Expiring Soon</span></div>
            <p className="text-2xl font-black mt-1 text-orange-600">{expiringSoon.length}</p>
            <span className="text-[11px] text-[#6b7280]">Within alert window</span>
          </div>
          <div className={`medical-card p-4 bg-white ${expired.length > 0 ? 'border-red-300' : ''}`}>
            <div className="flex items-center gap-2"><AlertCircle className={`w-5 h-5 ${expired.length > 0 ? 'text-red-600' : 'text-slate-300'}`} /><span className="text-xs font-bold text-[#6b7280]">Expired</span></div>
            <p className="text-2xl font-black mt-1 text-red-600">{expired.length}</p>
            <span className="text-[11px] text-[#6b7280]">Past expiry date</span>
          </div>
        </div>

        {/* Low Stock Alert Banner (Spec §9) */}
        {lowStock.length > 0 && (
          <div className="p-4 bg-[#fff8e6] border border-[#ffe082] rounded-2xl space-y-3">
            <div className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-700" /><h3 className="font-black text-amber-900 text-xs uppercase tracking-wide">Low Stock Alert — Action Required</h3></div>
            <div className="space-y-2">
              {lowStock.map(m => (
                <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white rounded-xl border border-amber-200 text-xs">
                  <div>
                    <span className="font-bold text-[#1c2a38]">{m.name}</span>
                    <span className="text-[#6b7280] ml-2">({m.member?.name})</span>
                    <span className="text-amber-700 ml-2 font-bold">{m.currentQuantity} {m.unit} left • ~{m.daysRemaining || 0} days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href="/pharmacy" className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg flex items-center gap-1"><ShoppingCart className="w-3 h-3" /> Reorder</Link>
                    <button onClick={() => handleAdjust(m.id, 10)} className="px-3 py-1.5 bg-[#10847e]/10 text-[#10847e] font-bold rounded-lg flex items-center gap-1"><RefreshCw className="w-3 h-3" /> +10</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expiry Alerts (Spec §18) */}
        {(expiringSoon.length > 0 || expired.length > 0) && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
            <div className="flex items-center gap-2"><AlertCircle className="w-5 h-5 text-rose-700" /><h3 className="font-black text-rose-900 text-xs uppercase tracking-wide">Medicine Expiry Warnings</h3></div>
            <div className="space-y-2">
              {[...expired, ...expiringSoon].map(m => {
                const diffDays = Math.ceil((new Date(m.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const isExp = diffDays <= 0;
                return (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-rose-200 text-xs">
                    <div>
                      <span className="font-bold text-[#1c2a38]">{m.name}</span>
                      <span className="text-[#6b7280] ml-2">({m.member?.name}) • Stock: {m.currentQuantity}</span>
                    </div>
                    <span className={`font-bold ${isExp ? 'text-red-700' : 'text-orange-700'}`}>{isExp ? `EXPIRED (${m.expiryDate})` : `Expires in ${diffDays} days`}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Full Stock Table */}
        <div className="space-y-3">
          <h2 className="font-black text-[#1c2a38] text-base">All Medicine Stock Levels</h2>
          {filtered.map(med => {
            const isLow = med.currentQuantity <= med.lowStockThreshold;
            const daysLeft = med.daysRemaining ?? Math.floor(med.currentQuantity / (med.schedules?.[0]?.doseAmount || 1));
            const pct = Math.min(100, (med.currentQuantity / Math.max(med.lowStockThreshold * 3, 15)) * 100);
            return (
              <div key={med.id} className="medical-card p-4 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${med.isInsulin ? 'bg-violet-100 text-violet-700' : 'bg-[#10847e]/10 text-[#10847e]'}`}>
                      {med.isInsulin ? <Syringe className="w-4 h-4" /> : <Pill className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1c2a38] text-sm">{med.name} <span className="text-xs text-[#6b7280] font-normal">({med.member?.name})</span></h4>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="w-32 bg-slate-100 rounded-full h-2"><div className={`h-full rounded-full ${isLow ? 'bg-amber-500' : 'bg-[#10847e]'}`} style={{ width: `${pct}%` }} /></div>
                        <span className={`text-xs font-bold ${isLow ? 'text-amber-600' : 'text-[#10847e]'}`}>{med.currentQuantity} {med.unit} ({daysLeft}d)</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handleAdjust(med.id, -1)} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg">−1</button>
                    <button onClick={() => handleAdjust(med.id, 1)} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg">+1</button>
                    <button onClick={() => handleAdjust(med.id, 10)} className="px-2.5 py-1 bg-[#10847e]/10 text-[#10847e] text-xs font-bold rounded-lg">+10</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
