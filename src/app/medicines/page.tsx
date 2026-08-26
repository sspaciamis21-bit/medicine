'use client';

import React, { useState, useEffect } from 'react';
import { Pill, Plus, X, Pencil, Trash2, RefreshCw, Package, AlertTriangle, Syringe } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';

export default function MedicinesPage() {
  const { user, selectedMember } = useAuth();
  const [medicines, setMedicines] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const defaultForm = {
    name: '', brandName: '', genericName: '', formType: 'Tablet', strength: '', unit: 'Tablets',
    memberId: '', currentQuantity: 10, quantityPurchased: 20, lowStockThreshold: 5, doseAmount: 1,
    scheduleTime: '08:00 AM', mealRelation: 'After Food', mealType: 'Breakfast', offsetMinutes: 15,
    expiryDate: '', expiryAlertDays: 30, doctorName: '', prescriptionDate: '', duration: '', instructions: '',
    isInsulin: false, insulinType: 'Long-Acting', penOrVial: 'Pen', insulinStorageNote: 'Store in refrigerator (2°C–8°C)',
  };
  const [form, setForm] = useState(defaultForm);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const loadData = async () => {
    try {
      const [medRes, memRes] = await Promise.all([
        fetch(`/api/medicines${user?.householdId ? `?householdId=${user.householdId}` : ''}`),
        fetch(`/api/members${user?.householdId ? `?householdId=${user.householdId}` : ''}`),
      ]);
      const medData = await medRes.json();
      const memData = await memRes.json();
      if (medData.success) setMedicines(medData.medicines || []);
      if (memData.success) setMembers(memData.members || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadData(); }, [user]);

  const filtered = selectedMember === 'all' ? medicines : medicines.filter((m) => m.memberId === selectedMember);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { showToast('⚠️ Medicine name required'); return; }
    const memberId = form.memberId || members[0]?.id;
    if (!memberId) { showToast('⚠️ Add a family member first'); return; }

    const method = editingId ? 'PUT' : 'POST';
    const body = editingId
      ? { id: editingId, ...form, memberId, schedules: [{ frequencyType: 'daily', specificTime: form.scheduleTime, mealRelation: form.mealRelation, mealType: form.mealType, offsetMinutes: form.offsetMinutes, doseAmount: form.doseAmount }] }
      : { householdId: user?.householdId, ...form, memberId, schedules: [{ frequencyType: 'daily', specificTime: form.scheduleTime, mealRelation: form.mealRelation, mealType: form.mealType, offsetMinutes: form.offsetMinutes, doseAmount: form.doseAmount }] };

    try {
      const res = await fetch('/api/medicines', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) {
        showToast(editingId ? `✅ ${form.name} updated!` : `✅ ${form.name} added!`);
        setShowAddModal(false); setEditingId(null); setForm({ ...defaultForm, memberId: members[0]?.id || '' }); loadData();
      } else { showToast(`⚠️ ${data.error}`); }
    } catch (e) { showToast('Error saving'); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This removes all its schedules and history.`)) return;
    try {
      const res = await fetch(`/api/medicines?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { showToast(`🗑️ ${name} deleted.`); loadData(); }
    } catch (e) { showToast('Error'); }
  };

  const openEdit = (m: any) => {
    const sched = m.schedules?.[0] || {};
    setEditingId(m.id);
    setForm({
      name: m.name, brandName: m.brandName || '', genericName: m.genericName || '', formType: m.formType,
      strength: m.strength || '', unit: m.unit, memberId: m.memberId, currentQuantity: m.currentQuantity,
      quantityPurchased: m.quantityPurchased || 0, lowStockThreshold: m.lowStockThreshold, doseAmount: sched.doseAmount || 1,
      scheduleTime: sched.specificTime || '08:00 AM', mealRelation: sched.mealRelation || 'After Food',
      mealType: sched.mealType || 'Breakfast', offsetMinutes: sched.offsetMinutes || 0,
      expiryDate: m.expiryDate || '', expiryAlertDays: m.expiryAlertDays || 30,
      doctorName: m.doctorName || '', prescriptionDate: m.prescriptionDate || '', duration: m.duration || '',
      instructions: m.instructions || '', isInsulin: m.isInsulin, insulinType: m.insulinType || 'Long-Acting',
      penOrVial: m.penOrVial || 'Pen', insulinStorageNote: m.insulinStorageNote || '',
    });
    setShowAddModal(true);
  };

  const handleAdjustStock = async (id: string, delta: number) => {
    const med = medicines.find(m => m.id === id);
    if (!med) return;
    const newQty = Math.max(0, med.currentQuantity + delta);
    try {
      await fetch('/api/medicines', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, currentQuantity: newQty }) });
      showToast(`📦 Stock adjusted: ${med.name} → ${newQty} ${med.unit}`);
      loadData();
    } catch (e) {}
  };

  return (
    <AppLayout>
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-11/12 bg-[#1c2a38] text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold animate-bounce">{toast}</div>}

      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-[#e2e8f0]">
          <div>
            <h1 className="text-xl font-black text-[#1c2a38] flex items-center gap-2"><Pill className="w-5 h-5 text-[#10847e]" /> Medicine Master & Inventory</h1>
            <p className="text-xs text-[#6b7280] mt-0.5">{filtered.length} medicines tracked{selectedMember !== 'all' ? ' for selected member' : ''}</p>
          </div>
          <button onClick={() => { setEditingId(null); setForm({ ...defaultForm, memberId: members[0]?.id || '' }); setShowAddModal(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#ef4f5f] hover:bg-[#dc3545] text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95">
            <Plus className="w-4 h-4" /> Add Medicine
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="medical-card p-10 bg-white text-center space-y-3">
            <Pill className="w-14 h-14 text-slate-300 mx-auto" />
            <h3 className="font-bold text-[#1c2a38]">No Medicines Added Yet</h3>
            <p className="text-xs text-[#6b7280] max-w-sm mx-auto">Add medicines with dosage, schedule, stock, expiry, and prescription details for each family member.</p>
            <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-[#10847e] text-white font-bold text-xs rounded-xl"><Plus className="w-4 h-4 inline mr-1" /> Add Medicine</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((med) => {
              const isLow = med.currentQuantity <= med.lowStockThreshold;
              const daysLeft = med.daysRemaining ?? Math.floor(med.currentQuantity / (med.schedules?.[0]?.doseAmount || 1));
              const stockPct = Math.min(100, (med.currentQuantity / Math.max(med.lowStockThreshold * 3, 15)) * 100);
              return (
                <div key={med.id} className="medical-card p-5 bg-white space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${med.isInsulin ? 'bg-violet-100 text-violet-700' : 'bg-[#10847e]/10 text-[#10847e]'}`}>
                        {med.isInsulin ? <Syringe className="w-5 h-5" /> : <Pill className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-[#1c2a38]">{med.name}</h3>
                          {isLow && <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-md">Low Stock</span>}
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{med.formType}</span>
                        </div>
                        <p className="text-xs text-[#6b7280] mt-0.5">{med.brandName ? `${med.brandName} • ` : ''}{med.strength ? `${med.strength} • ` : ''}For: <strong className="text-[#1c2a38]">{med.member?.name || 'Family Member'}</strong></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(med)} className="p-1.5 text-slate-400 hover:text-[#10847e] hover:bg-slate-100 rounded-lg transition"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(med.id, med.name)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>

                  {/* Stock Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-[#6b7280]">Stock:</span>
                      <span className={`font-bold ${isLow ? 'text-amber-600' : 'text-[#10847e]'}`}>{med.currentQuantity} {med.unit} ({daysLeft} days supply)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${isLow ? 'bg-amber-500' : 'bg-[#10847e]'}`} style={{ width: `${stockPct}%` }} />
                    </div>
                  </div>

                  {/* Schedule & Expiry Info */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#6b7280]">
                    <span className="font-semibold">Schedule: {med.schedules?.[0]?.specificTime || 'N/A'} ({med.schedules?.[0]?.mealRelation || 'N/A'})</span>
                    <span>•</span>
                    <span>Expiry: <strong className="text-[#1c2a38]">{med.expiryDate || 'N/A'}</strong></span>
                    {med.doctorName && <><span>•</span><span>Dr. {med.doctorName}</span></>}
                  </div>

                  {/* Stock Adjust Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleAdjustStock(med.id, -1)} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg">−1</button>
                      <button onClick={() => handleAdjustStock(med.id, 1)} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg">+1</button>
                      <button onClick={() => handleAdjustStock(med.id, 10)} className="px-2.5 py-1 bg-[#10847e]/10 hover:bg-[#10847e]/20 text-[#10847e] text-xs font-bold rounded-lg flex items-center gap-1"><RefreshCw className="w-3 h-3" /> +10 Restock</button>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">Threshold: {med.lowStockThreshold}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-[#e2e8f0] my-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg text-[#1c2a38]">{editingId ? 'Edit Medicine' : 'Add New Medicine'}</h3>
              <button onClick={() => { setShowAddModal(false); setEditingId(null); }} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              {/* §4.1 Basic Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="font-bold text-[#374151] block mb-1">Medicine Name *</label>
                  <input type="text" required placeholder="Enter medicine name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 text-[#1c2a38] font-medium focus:border-[#10847e] outline-hidden text-sm" />
                </div>
                <div>
                  <label className="font-bold text-[#374151] block mb-1">Brand Name</label>
                  <input type="text" placeholder="Brand name (optional)" value={form.brandName} onChange={(e) => setForm({ ...form, brandName: e.target.value })} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 text-[#1c2a38] focus:border-[#10847e] outline-hidden text-sm" />
                </div>
                <div>
                  <label className="font-bold text-[#374151] block mb-1">Generic Name</label>
                  <input type="text" placeholder="Generic name (optional)" value={form.genericName} onChange={(e) => setForm({ ...form, genericName: e.target.value })} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 text-[#1c2a38] focus:border-[#10847e] outline-hidden text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-[#374151] block mb-1">Type</label>
                  <select value={form.formType} onChange={(e) => { const isIns = e.target.value === 'Insulin'; setForm({ ...form, formType: e.target.value, isInsulin: isIns, unit: isIns ? 'Pens' : 'Tablets' }); }} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 text-[#1c2a38] font-medium focus:border-[#10847e] outline-hidden text-sm">
                    {['Tablet','Capsule','Syrup','Insulin','Injection','Drops','Cream','Other'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className="font-bold text-[#374151] block mb-1">Strength</label><input type="text" placeholder="e.g. 500 mg" value={form.strength} onChange={(e) => setForm({ ...form, strength: e.target.value })} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 text-[#1c2a38] focus:border-[#10847e] outline-hidden text-sm" /></div>
                <div><label className="font-bold text-[#374151] block mb-1">Unit</label><input type="text" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 text-[#1c2a38] focus:border-[#10847e] outline-hidden text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="font-bold text-[#374151] block mb-1">Family Member *</label>
                  <select value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 text-[#1c2a38] font-medium focus:border-[#10847e] outline-hidden text-sm">
                    {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.relationship})</option>)}
                  </select>
                </div>
                <div><label className="font-bold text-[#374151] block mb-1">Dose per Take</label><input type="number" value={form.doseAmount} onChange={(e) => setForm({ ...form, doseAmount: Number(e.target.value) })} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 text-[#1c2a38] font-bold focus:border-[#10847e] outline-hidden text-sm" /></div>
              </div>
              {/* Stock & Expiry */}
              <div className="grid grid-cols-3 gap-3">
                <div><label className="font-bold text-[#374151] block mb-1">Current Qty</label><input type="number" value={form.currentQuantity} onChange={(e) => setForm({ ...form, currentQuantity: Number(e.target.value) })} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-bold focus:border-[#10847e] outline-hidden text-sm" /></div>
                <div><label className="font-bold text-[#374151] block mb-1">Low Alert At</label><input type="number" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: Number(e.target.value) })} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-amber-600 focus:border-[#10847e] outline-hidden text-sm" /></div>
                <div><label className="font-bold text-[#374151] block mb-1">Expiry Date</label><input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-2 py-2.5 focus:border-[#10847e] outline-hidden text-sm" /></div>
              </div>
              {/* §4.2 Prescription Info */}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="font-bold text-[#374151] block mb-1">Doctor Name</label><input type="text" placeholder="Doctor name" value={form.doctorName} onChange={(e) => setForm({ ...form, doctorName: e.target.value })} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 focus:border-[#10847e] outline-hidden text-sm" /></div>
                <div><label className="font-bold text-[#374151] block mb-1">Prescription Date</label><input type="date" value={form.prescriptionDate} onChange={(e) => setForm({ ...form, prescriptionDate: e.target.value })} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-2 py-2.5 focus:border-[#10847e] outline-hidden text-sm" /></div>
              </div>
              <div><label className="font-bold text-[#374151] block mb-1">Doctor's Instructions / Notes</label><textarea placeholder="Usage instructions, precautions, or meal notes" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 focus:border-[#10847e] outline-hidden h-14 resize-none text-sm" /></div>
              {/* Schedule (§5 & §6) */}
              <div className="p-3 bg-[#10847e]/5 rounded-2xl border border-[#10847e]/20 space-y-2">
                <span className="font-extrabold text-[#10847e] text-xs">⏰ Meal-Linked Reminder Schedule</span>
                <div className="grid grid-cols-3 gap-2">
                  <div><label className="font-medium text-slate-600 block mb-1">Relation</label><select value={form.mealRelation} onChange={(e) => setForm({ ...form, mealRelation: e.target.value })} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:border-[#10847e] outline-hidden">
                    {['Before Food','After Food','With Food','Empty Stomach'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select></div>
                  <div><label className="font-medium text-slate-600 block mb-1">Meal</label><select value={form.mealType} onChange={(e) => setForm({ ...form, mealType: e.target.value })} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:border-[#10847e] outline-hidden">
                    {['Breakfast','Lunch','Dinner'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select></div>
                  <div><label className="font-medium text-slate-600 block mb-1">Offset</label><select value={form.offsetMinutes} onChange={(e) => setForm({ ...form, offsetMinutes: Number(e.target.value) })} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:border-[#10847e] outline-hidden">
                    {[{v:0,l:'Immediately'},{v:5,l:'5 min'},{v:10,l:'10 min'},{v:15,l:'15 min'},{v:30,l:'30 min'}].map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select></div>
                </div>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => { setShowAddModal(false); setEditingId(null); }} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl active:scale-95 transition">Cancel</button>
                <button type="submit" className="flex-[2] py-3 bg-[#10847e] hover:bg-[#0d6e69] text-white font-black rounded-xl shadow-md transition active:scale-95">{editingId ? 'Save Changes' : 'Add Medicine'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
