'use client';

import React, { useState, useEffect } from 'react';
import { Phone, Plus, X, Pencil, Trash2, MessageCircle, PhoneCall, ShoppingCart, Check, Star } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';

export default function PharmacyPage() {
  const { user } = useAuth();
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [lowStockMeds, setLowStockMeds] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState<string | null>(null);
  const [selectedMeds, setSelectedMeds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', contactPerson: '', phoneNumber: '', whatsappNumber: '', address: '', notes: '', isDefault: false });
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const loadData = async () => {
    try {
      const [phRes, medRes] = await Promise.all([
        fetch(`/api/pharmacies${user?.householdId ? `?householdId=${user.householdId}` : ''}`),
        fetch(`/api/medicines${user?.householdId ? `?householdId=${user.householdId}` : ''}`),
      ]);
      const phData = await phRes.json();
      const medData = await medRes.json();
      if (phData.success) setPharmacies(phData.pharmacies || []);
      if (medData.success) setLowStockMeds((medData.medicines || []).filter((m: any) => m.currentQuantity <= m.lowStockThreshold));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadData(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phoneNumber) { showToast('⚠️ Name and phone are required'); return; }
    const method = editingId ? 'PUT' : 'POST';
    const body = editingId ? { id: editingId, householdId: user?.householdId, ...form } : { householdId: user?.householdId, ...form };
    try {
      const res = await fetch('/api/pharmacies', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) { showToast(editingId ? '✅ Pharmacy updated!' : '✅ Pharmacy added!'); setShowAddModal(false); setEditingId(null); setForm({ name: '', contactPerson: '', phoneNumber: '', whatsappNumber: '', address: '', notes: '', isDefault: false }); loadData(); }
    } catch (e) { showToast('Error saving'); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name}?`)) return;
    try { await fetch(`/api/pharmacies?id=${id}`, { method: 'DELETE' }); showToast(`🗑️ ${name} removed.`); loadData(); } catch (e) {}
  };

  const handleReorder = async () => {
    if (!selectedPharmacy || selectedMeds.length === 0) { showToast('⚠️ Select pharmacy and medicines'); return; }
    const pharmacy = pharmacies.find(p => p.id === selectedPharmacy);
    const medNames = lowStockMeds.filter(m => selectedMeds.includes(m.id)).map(m => `• ${m.name} (${m.strength || ''}) — ${m.currentQuantity} ${m.unit} left`);
    const message = `Hello, I need to reorder medicines:\n${medNames.join('\n')}\nPlease confirm availability. Thank you!`;

    try {
      await fetch('/api/reorders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ householdId: user?.householdId, pharmacyId: selectedPharmacy, medicineIds: selectedMeds, notes: message }) });

      const waNumber = (pharmacy?.whatsappNumber || pharmacy?.phoneNumber || '').replace(/[^0-9]/g, '');
      if (waNumber) {
        window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
      }

      showToast(`✅ Reorder dispatched to ${pharmacy?.name}!`);
      setShowReorderModal(false);
      setSelectedMeds([]);
    } catch (e) { showToast('Error'); }
  };

  return (
    <AppLayout>
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-11/12 bg-[#1c2a38] text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold animate-bounce">{toast}</div>}

      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-[#e2e8f0]">
          <div>
            <h1 className="text-xl font-black text-[#1c2a38] flex items-center gap-2"><Phone className="w-5 h-5 text-[#10847e]" /> Pharmacies & Reorder</h1>
            <p className="text-xs text-[#6b7280] mt-0.5">{pharmacies.length} saved stores • {lowStockMeds.length} medicines need refill</p>
          </div>
          <div className="flex items-center gap-2">
            {lowStockMeds.length > 0 && (
              <button onClick={() => { setSelectedMeds(lowStockMeds.map(m => m.id)); setSelectedPharmacy(pharmacies.find(p => p.isDefault)?.id || pharmacies[0]?.id || null); setShowReorderModal(true); }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#ef4f5f] hover:bg-[#dc3545] text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95">
                <ShoppingCart className="w-4 h-4" /> 1-Tap Reorder ({lowStockMeds.length})
              </button>
            )}
            <button onClick={() => { setEditingId(null); setForm({ name: '', contactPerson: '', phoneNumber: '', whatsappNumber: '', address: '', notes: '', isDefault: false }); setShowAddModal(true); }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#10847e] hover:bg-[#0d6e69] text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95">
              <Plus className="w-4 h-4" /> Add Pharmacy
            </button>
          </div>
        </div>

        {pharmacies.length === 0 ? (
          <div className="medical-card p-10 bg-white text-center space-y-3">
            <Phone className="w-14 h-14 text-slate-300 mx-auto" />
            <h3 className="font-bold text-[#1c2a38]">No Pharmacies Saved</h3>
            <p className="text-xs text-[#6b7280] max-w-sm mx-auto">Save your local medical store contacts to quickly call, WhatsApp, or reorder medicines when stock runs low.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pharmacies.map(ph => (
              <div key={ph.id} className={`medical-card p-5 bg-white space-y-3 ${ph.isDefault ? 'border-[#10847e] ring-1 ring-[#10847e]/20' : ''}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-[#1c2a38] text-base">{ph.name}</h3>
                      {ph.isDefault && <span className="flex items-center gap-0.5 px-2 py-0.5 bg-[#10847e]/10 text-[#10847e] text-[10px] font-bold rounded-md"><Star className="w-3 h-3" /> Default</span>}
                    </div>
                    {ph.contactPerson && <p className="text-xs text-[#6b7280] mt-0.5">Contact: {ph.contactPerson}</p>}
                    {ph.address && <p className="text-xs text-[#6b7280]">📍 {ph.address}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditingId(ph.id); setForm({ name: ph.name, contactPerson: ph.contactPerson || '', phoneNumber: ph.phoneNumber, whatsappNumber: ph.whatsappNumber || '', address: ph.address || '', notes: ph.notes || '', isDefault: ph.isDefault }); setShowAddModal(true); }} className="p-1.5 text-slate-400 hover:text-[#10847e] hover:bg-slate-100 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(ph.id, ph.name)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <a href={`tel:${ph.phoneNumber}`} className="flex-1 py-2.5 bg-[#10847e] hover:bg-[#0d6e69] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95"><PhoneCall className="w-4 h-4" /> Call Store</a>
                  <a href={`https://wa.me/${(ph.whatsappNumber || ph.phoneNumber).replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hello, I would like to place a medicine order.')}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95"><MessageCircle className="w-4 h-4" /> WhatsApp</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Pharmacy Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-[#e2e8f0] space-y-4">
            <div className="flex items-center justify-between"><h3 className="font-black text-lg text-[#1c2a38]">{editingId ? 'Edit Pharmacy' : 'Add Pharmacy'}</h3><button onClick={() => { setShowAddModal(false); setEditingId(null); }} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div><label className="font-bold text-[#374151] block mb-1">Store Name *</label><input type="text" required placeholder="Enter pharmacy / store name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:border-[#10847e] outline-hidden text-sm" /></div>
              <div><label className="font-bold text-[#374151] block mb-1">Contact Person</label><input type="text" placeholder="Contact person / chemist name (optional)" value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value})} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 focus:border-[#10847e] outline-hidden text-sm" /></div>
              <div><label className="font-bold text-[#374151] block mb-1">Phone Number *</label><input type="tel" required value={form.phoneNumber} onChange={e => setForm({...form, phoneNumber: e.target.value})} placeholder="Phone number (e.g. +91 98765 43210)" className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:border-[#10847e] outline-hidden text-sm" /></div>
              <div><label className="font-bold text-[#374151] block mb-1">WhatsApp Number</label><input type="tel" value={form.whatsappNumber} onChange={e => setForm({...form, whatsappNumber: e.target.value})} placeholder="WhatsApp number (optional)" className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 focus:border-[#10847e] outline-hidden text-sm" /></div>
              <div><label className="font-bold text-[#374151] block mb-1">Address</label><textarea placeholder="Store address or location notes (optional)" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 focus:border-[#10847e] outline-hidden h-14 resize-none text-sm" /></div>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isDefault} onChange={e => setForm({...form, isDefault: e.target.checked})} className="accent-[#10847e] w-4 h-4" /><span className="font-bold text-[#374151]">Set as Default Pharmacy</span></label>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setShowAddModal(false); setEditingId(null); }} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl active:scale-95 transition">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-[#10847e] hover:bg-[#0d6e69] text-white font-extrabold rounded-xl transition active:scale-95">{editingId ? 'Save' : 'Add Pharmacy'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reorder Modal (Spec §12) */}
      {showReorderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#e2e8f0] space-y-4">
            <div className="flex items-center justify-between"><h3 className="font-black text-lg text-[#1c2a38]">🛒 Reorder Low-Stock Medicines</h3><button onClick={() => setShowReorderModal(false)} className="p-1 text-slate-400"><X className="w-5 h-5" /></button></div>
            <div className="space-y-2 text-xs max-h-48 overflow-y-auto">
              {lowStockMeds.map(m => (
                <label key={m.id} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                  <input type="checkbox" checked={selectedMeds.includes(m.id)} onChange={e => { if (e.target.checked) setSelectedMeds([...selectedMeds, m.id]); else setSelectedMeds(selectedMeds.filter(x => x !== m.id)); }} className="accent-[#10847e]" />
                  <span className="font-bold">{m.name}</span><span className="text-[#6b7280]">({m.currentQuantity} left)</span>
                </label>
              ))}
            </div>
            <div className="text-xs"><label className="font-bold text-[#374151] block mb-1">Send to Pharmacy:</label>
              <select value={selectedPharmacy || ''} onChange={e => setSelectedPharmacy(e.target.value)} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:border-[#10847e] outline-hidden">
                {pharmacies.map(p => <option key={p.id} value={p.id}>{p.name}{p.isDefault ? ' ⭐' : ''}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowReorderModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl">Cancel</button>
              <button onClick={handleReorder} className="flex-[2] py-2.5 bg-[#ef4f5f] hover:bg-[#dc3545] text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition"><MessageCircle className="w-4 h-4" /> Send via WhatsApp</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
