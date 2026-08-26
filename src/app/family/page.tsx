'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, UserPlus, Pencil, Trash2, X, Check, Pill, Clock } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';

export default function FamilyPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', relationship: 'Father', avatar: '👨', age: '', notes: '' });
  const [toast, setToast] = useState<string | null>(null);

  const avatarMap: Record<string, string> = {
    Grandparent: '👴', Father: '👨', Mother: '👩', Self: '🧑', Child: '👧', Other: '👤',
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const loadMembers = async () => {
    try {
      const res = await fetch(`/api/members${user?.householdId ? `?householdId=${user.householdId}` : ''}`);
      const data = await res.json();
      if (data.success) setMembers(data.members || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadMembers(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { showToast('⚠️ Name is required'); return; }

    const endpoint = '/api/members';
    const method = editingId ? 'PUT' : 'POST';
    const body = editingId
      ? { id: editingId, name: form.name, relationship: form.relationship, avatar: form.avatar, age: form.age, notes: form.notes }
      : { householdId: user?.householdId, name: form.name, relationship: form.relationship, avatar: form.avatar, age: form.age, notes: form.notes };

    try {
      const res = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) {
        showToast(editingId ? `✅ ${form.name} updated!` : `✅ ${form.name} added to family!`);
        setShowAddModal(false);
        setEditingId(null);
        setForm({ name: '', relationship: 'Father', avatar: '👨', age: '', notes: '' });
        loadMembers();
      } else { showToast(`⚠️ ${data.error}`); }
    } catch (e) { showToast('Error saving member'); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from the family? This will also delete their medicines and history.`)) return;
    try {
      const res = await fetch(`/api/members?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { showToast(`🗑️ ${name} removed from family.`); loadMembers(); }
    } catch (e) { showToast('Error removing member'); }
  };

  const openEdit = (m: any) => {
    setEditingId(m.id);
    setForm({ name: m.name, relationship: m.relationship, avatar: m.avatar || '👤', age: m.age?.toString() || '', notes: m.notes || '' });
    setShowAddModal(true);
  };

  return (
    <AppLayout>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-11/12 bg-[#1c2a38] text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold animate-bounce">
          {toast}
        </div>
      )}

      <div className="space-y-5">
        <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-[#e2e8f0]">
          <div>
            <h1 className="text-xl font-black text-[#1c2a38] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#10847e]" />
              Family Members
            </h1>
            <p className="text-xs text-[#6b7280] mt-0.5">{members.length} members in {user?.householdName || 'your household'}</p>
          </div>
          <button
            onClick={() => { setEditingId(null); setForm({ name: '', relationship: 'Father', avatar: '👨', age: '', notes: '' }); setShowAddModal(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#10847e] hover:bg-[#0d6e69] text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95"
          >
            <UserPlus className="w-4 h-4" /> Add Member
          </button>
        </div>

        {members.length === 0 ? (
          <div className="medical-card p-10 bg-white text-center space-y-3">
            <Users className="w-14 h-14 text-slate-300 mx-auto" />
            <h3 className="font-bold text-[#1c2a38]">No Family Members Yet</h3>
            <p className="text-xs text-[#6b7280] max-w-sm mx-auto">Add your family members to track separate medicine schedules, stock, and health records for each person.</p>
            <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-[#10847e] text-white font-bold text-xs rounded-xl">
              <Plus className="w-4 h-4 inline mr-1" /> Add First Family Member
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((m) => (
              <div key={m.id} className="medical-card p-5 bg-white space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{m.avatar || '👤'}</span>
                    <div>
                      <h3 className="font-extrabold text-[#1c2a38] text-base">{m.name}</h3>
                      <p className="text-xs text-[#6b7280]">{m.relationship}{m.age ? ` • Age ${m.age}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(m)} className="p-1.5 text-slate-400 hover:text-[#10847e] hover:bg-slate-100 rounded-lg transition" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(m.id, m.name)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Remove"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                {m.notes && <p className="text-xs text-[#6b7280] bg-slate-50 p-2.5 rounded-xl border border-slate-100">{m.notes}</p>}
                <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-xs text-[#6b7280]">
                  <span className="flex items-center gap-1"><Pill className="w-3.5 h-3.5 text-[#10847e]" /> {m.medicines?.length || 0} medicines</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-600" /> {m.doseHistory?.length || 0} recent doses</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-[#e2e8f0] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg text-[#1c2a38]">{editingId ? 'Edit Member' : 'Add Family Member'}</h3>
              <button onClick={() => { setShowAddModal(false); setEditingId(null); }} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#374151] block mb-1">Name *</label>
                <input type="text" required placeholder="Enter member name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 text-[#1c2a38] font-medium focus:border-[#10847e] outline-hidden text-sm" />
              </div>
              <div>
                <label className="font-bold text-[#374151] block mb-1">Relationship</label>
                <select value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value, avatar: avatarMap[e.target.value] || '👤' })} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 text-[#1c2a38] font-medium focus:border-[#10847e] outline-hidden text-sm">
                  {Object.keys(avatarMap).map((r) => <option key={r} value={r}>{r} {avatarMap[r]}</option>)}
                </select>
              </div>
              <div>
                <label className="font-bold text-[#374151] block mb-1">Age (Optional)</label>
                <input type="number" placeholder="Age in years" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 text-[#1c2a38] font-medium focus:border-[#10847e] outline-hidden text-sm" />
              </div>
              <div>
                <label className="font-bold text-[#374151] block mb-1">Health Notes (Optional)</label>
                <textarea placeholder="Health conditions, allergies, or doctor notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 text-[#1c2a38] font-medium focus:border-[#10847e] outline-hidden h-16 resize-none text-sm" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setShowAddModal(false); setEditingId(null); }} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl active:scale-95 transition">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-[#10847e] hover:bg-[#0d6e69] text-white font-extrabold rounded-xl transition active:scale-95">{editingId ? 'Save Changes' : 'Add Member'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
