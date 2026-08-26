'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, X, Receipt, TrendingUp, Users, Pill } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';

export default function ExpensesPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({ thisWeekSpend: 0, thisMonthSpend: 0, lastMonthSpend: 0, threeMonthSpend: 0, weeklyAvg: 0, monthlyAvg: 0 });
  const [memberBreakdown, setMemberBreakdown] = useState<any[]>([]);
  const [medicineBreakdown, setMedicineBreakdown] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const [form, setForm] = useState({ memberId: '', medicineId: '', pharmacyId: '', medicineName: '', quantity: 1, unitPrice: 0, discount: 0, totalAmount: 0, paymentMode: 'UPI', purchaseDate: new Date().toISOString().split('T')[0] });

  const loadData = async () => {
    try {
      const [expRes, purchRes, medRes, memRes, phRes] = await Promise.all([
        fetch(`/api/expenses${user?.householdId ? `?householdId=${user.householdId}` : ''}`),
        fetch(`/api/purchases${user?.householdId ? `?householdId=${user.householdId}` : ''}`),
        fetch(`/api/medicines${user?.householdId ? `?householdId=${user.householdId}` : ''}`),
        fetch(`/api/members${user?.householdId ? `?householdId=${user.householdId}` : ''}`),
        fetch(`/api/pharmacies${user?.householdId ? `?householdId=${user.householdId}` : ''}`),
      ]);
      const expData = await expRes.json();
      const purchData = await purchRes.json();
      const medData = await medRes.json();
      const memData = await memRes.json();
      const phData = await phRes.json();
      if (expData.success) { setMetrics(expData.metrics || {}); setMemberBreakdown(expData.memberBreakdown || []); setMedicineBreakdown(expData.medicineBreakdown || []); }
      if (purchData.success) setPurchases(purchData.purchases || []);
      if (medData.success) setMedicines(medData.medicines || []);
      if (memData.success) setMembers(memData.members || []);
      if (phData.success) setPharmacies(phData.pharmacies || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadData(); }, [user]);

  // Auto-calculate total
  const calcTotal = () => {
    const gross = Number(form.quantity || 0) * Number(form.unitPrice || 0);
    return Math.max(0, gross - Number(form.discount || 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = calcTotal();
    const selectedMed = medicines.find(m => m.id === form.medicineId);
    const body = { householdId: user?.householdId, memberId: form.memberId || null, medicineId: form.medicineId || null, pharmacyId: form.pharmacyId || null, medicineName: form.medicineName || selectedMed?.name || 'Medicine', quantity: Number(form.quantity), unitPrice: Number(form.unitPrice), discount: Number(form.discount), totalAmount: total, paymentMode: form.paymentMode, purchaseDate: form.purchaseDate };

    try {
      const res = await fetch('/api/purchases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ Purchase ₹${total} recorded! Stock updated.`);
        setShowAddModal(false);
        setForm({ memberId: '', medicineId: '', pharmacyId: '', medicineName: '', quantity: 1, unitPrice: 0, discount: 0, totalAmount: 0, paymentMode: 'UPI', purchaseDate: new Date().toISOString().split('T')[0] });
        loadData();
      }
    } catch (e) { showToast('Error'); }
  };

  const maxMemberSpend = Math.max(...memberBreakdown.map(m => m.amount), 1);

  return (
    <AppLayout>
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-11/12 bg-[#1c2a38] text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold animate-bounce">{toast}</div>}

      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-[#e2e8f0]">
          <div>
            <h1 className="text-xl font-black text-[#1c2a38] flex items-center gap-2"><DollarSign className="w-5 h-5 text-[#10847e]" /> Purchase & Expense Tracking</h1>
            <p className="text-xs text-[#6b7280] mt-0.5">{purchases.length} purchase records • Track weekly/monthly spend</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-[#ef4f5f] hover:bg-[#dc3545] text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95"><Plus className="w-4 h-4" /> Record Purchase</button>
        </div>

        {/* KPI Cards (Spec §14) */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="medical-card p-4 bg-white"><span className="text-xs text-[#6b7280] font-semibold">This Week</span><p className="text-2xl font-black text-[#10847e] mt-1">₹ {metrics.thisWeekSpend || 0}</p></div>
          <div className="medical-card p-4 bg-white"><span className="text-xs text-[#6b7280] font-semibold">This Month</span><p className="text-2xl font-black text-[#1c2a38] mt-1">₹ {metrics.thisMonthSpend || 0}</p></div>
          <div className="medical-card p-4 bg-white"><span className="text-xs text-[#6b7280] font-semibold">Last Month</span><p className="text-2xl font-black text-[#1c2a38] mt-1">₹ {metrics.lastMonthSpend || 0}</p></div>
          <div className="medical-card p-4 bg-white"><span className="text-xs text-[#6b7280] font-semibold">Last 3 Months</span><p className="text-2xl font-black text-[#1c2a38] mt-1">₹ {metrics.threeMonthSpend || 0}</p></div>
          <div className="medical-card p-4 bg-white"><span className="text-xs text-[#6b7280] font-semibold">Weekly Average</span><p className="text-2xl font-black text-[#10847e] mt-1">₹ {metrics.weeklyAvg || 0}</p></div>
          <div className="medical-card p-4 bg-white"><span className="text-xs text-[#6b7280] font-semibold">Monthly Average</span><p className="text-2xl font-black text-[#10847e] mt-1">₹ {metrics.monthlyAvg || 0}</p></div>
        </div>

        {/* Breakdown by Family Member */}
        {memberBreakdown.length > 0 && (
          <div className="medical-card p-5 bg-white space-y-3">
            <h3 className="font-black text-[#1c2a38] text-sm flex items-center gap-2"><Users className="w-4 h-4 text-[#10847e]" /> Spending by Family Member</h3>
            <div className="space-y-2">
              {memberBreakdown.map((m, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className="w-28 font-bold text-[#1c2a38] truncate">{m.name}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden"><div className="h-full bg-[#10847e] rounded-full" style={{ width: `${(m.amount / maxMemberSpend) * 100}%` }} /></div>
                  <span className="font-black text-[#10847e] w-20 text-right">₹ {m.amount}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Breakdown by Medicine */}
        {medicineBreakdown.length > 0 && (
          <div className="medical-card p-5 bg-white space-y-3">
            <h3 className="font-black text-[#1c2a38] text-sm flex items-center gap-2"><Pill className="w-4 h-4 text-[#10847e]" /> Spending by Medicine</h3>
            <div className="space-y-2">
              {medicineBreakdown.map((m, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-2.5 bg-slate-50 rounded-xl">
                  <span className="font-bold text-[#1c2a38]">{m.name}</span>
                  <span className="font-black text-[#10847e]">₹ {m.amount}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Purchase History Table */}
        <div className="medical-card bg-white overflow-hidden">
          <div className="p-4 border-b border-slate-100"><h3 className="font-black text-[#1c2a38] text-sm">Recent Purchase History</h3></div>
          {purchases.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6b7280]">No purchases recorded yet. Click "Record Purchase" to track medicine expenses.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="bg-slate-50 text-left text-[#6b7280]"><th className="px-4 py-2.5 font-bold">Date</th><th className="px-4 py-2.5 font-bold">Medicine</th><th className="px-4 py-2.5 font-bold">For</th><th className="px-4 py-2.5 font-bold">Qty</th><th className="px-4 py-2.5 font-bold">Amount</th><th className="px-4 py-2.5 font-bold">Mode</th></tr></thead>
                <tbody>
                  {purchases.slice(0, 20).map(p => (
                    <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-medium">{p.purchaseDate}</td>
                      <td className="px-4 py-2.5 font-bold text-[#1c2a38]">{p.medicineName}</td>
                      <td className="px-4 py-2.5">{p.member?.name || '—'}</td>
                      <td className="px-4 py-2.5">{p.quantity}</td>
                      <td className="px-4 py-2.5 font-bold text-[#10847e]">₹ {p.totalAmount}</td>
                      <td className="px-4 py-2.5"><span className="px-2 py-0.5 bg-slate-100 rounded-md font-bold">{p.paymentMode}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Record Purchase Modal (Spec §13) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#e2e8f0] my-8 space-y-4">
            <div className="flex items-center justify-between"><h3 className="font-black text-lg text-[#1c2a38]">Record Medicine Purchase</h3><button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div><label className="font-bold text-[#374151] block mb-1">Purchase Date</label><input type="date" value={form.purchaseDate} onChange={e => setForm({...form, purchaseDate: e.target.value})} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 focus:border-[#10847e] outline-hidden text-sm" /></div>
              <div><label className="font-bold text-[#374151] block mb-1">Medicine (link to existing)</label>
                <select value={form.medicineId} onChange={e => { const med = medicines.find(m => m.id === e.target.value); setForm({...form, medicineId: e.target.value, medicineName: med?.name || form.medicineName, memberId: med?.memberId || form.memberId}); }} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:border-[#10847e] outline-hidden text-sm">
                  <option value="">— Select from tracked medicines or type below —</option>
                  {medicines.map(m => <option key={m.id} value={m.id}>{m.name} ({m.member?.name})</option>)}
                </select>
              </div>
              <div><label className="font-bold text-[#374151] block mb-1">Or Medicine Name</label><input type="text" value={form.medicineName} onChange={e => setForm({...form, medicineName: e.target.value})} placeholder="Enter medicine name" className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 focus:border-[#10847e] outline-hidden text-sm" /></div>
              <div className="grid grid-cols-3 gap-2.5">
                <div><label className="font-bold text-[#374151] block mb-1">Qty</label><input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: Number(e.target.value)})} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-bold focus:border-[#10847e] outline-hidden text-sm" /></div>
                <div><label className="font-bold text-[#374151] block mb-1">Unit Price ₹</label><input type="number" value={form.unitPrice} onChange={e => setForm({...form, unitPrice: Number(e.target.value)})} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-bold focus:border-[#10847e] outline-hidden text-sm" /></div>
                <div><label className="font-bold text-[#374151] block mb-1">Discount ₹</label><input type="number" value={form.discount} onChange={e => setForm({...form, discount: Number(e.target.value)})} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-bold focus:border-[#10847e] outline-hidden text-sm" /></div>
              </div>
              <div className="p-3 bg-[#10847e]/5 rounded-xl border border-[#10847e]/20 flex justify-between items-center"><span className="font-bold text-[#10847e]">Total Amount:</span><span className="text-xl font-black text-[#10847e]">₹ {calcTotal()}</span></div>
              <div className="grid grid-cols-2 gap-2.5">
                <div><label className="font-bold text-[#374151] block mb-1">Pharmacy</label>
                  <select value={form.pharmacyId} onChange={e => setForm({...form, pharmacyId: e.target.value})} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:border-[#10847e] outline-hidden text-sm">
                    <option value="">— Select store —</option>
                    {pharmacies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div><label className="font-bold text-[#374151] block mb-1">Payment Mode</label>
                  <select value={form.paymentMode} onChange={e => setForm({...form, paymentMode: e.target.value})} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:border-[#10847e] outline-hidden text-sm">
                    {['Cash','UPI','Card','Insurance'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl active:scale-95 transition">Cancel</button>
                <button type="submit" className="flex-[2] py-3 bg-[#10847e] hover:bg-[#0d6e69] text-white font-black rounded-xl shadow-md transition active:scale-95">Record Purchase</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
