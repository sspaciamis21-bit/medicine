'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, UserPlus, Pencil, Trash2, X, Pill, Clock, Heart, Sparkles } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';

const PRESET_RELATIONS = [
  { label: 'Father', avatar: '👨' },
  { label: 'Mother', avatar: '👩' },
  { label: 'Grandfather (Dada/Nana)', avatar: '👴' },
  { label: 'Grandmother (Dadi/Nani)', avatar: '👵' },
  { label: 'Self', avatar: '🧑' },
  { label: 'Spouse (Husband/Wife)', avatar: '💍' },
  { label: 'Son', avatar: '👦' },
  { label: 'Daughter', avatar: '👧' },
  { label: 'Brother', avatar: '👦' },
  { label: 'Sister', avatar: '👧' },
  { label: 'Father-in-law', avatar: '👴' },
  { label: 'Mother-in-law', avatar: '👵' },
  { label: 'Uncle (Chacha/Mama)', avatar: '👨' },
  { label: 'Aunt (Chachi/Mami)', avatar: '👩' },
  { label: 'Grandson / Granddaughter', avatar: '👶' },
  { label: 'Caregiver / Nurse', avatar: '🩺' },
  { label: 'Custom (Type any relation)', avatar: '👤' },
];

const AVAILABLE_AVATARS = ['👨', '👩', '👴', '👵', '🧑', '👦', '👧', '👶', '💍', '🩺', '👤', '🐕', '🐱'];

export default function FamilyPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCustomRelation, setIsCustomRelation] = useState(false);
  const [customRelationText, setCustomRelationText] = useState('');
  const [form, setForm] = useState({ name: '', relationship: 'Father', avatar: '👨', age: '', notes: '' });
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { 
    setToast(msg); 
    setTimeout(() => setToast(null), 3500); 
  };

  const loadMembers = async () => {
    try {
      const res = await fetch(`/api/members${user?.householdId ? `?householdId=${user.householdId}` : ''}`);
      const data = await res.json();
      if (data.success) setMembers(data.members || []);
    } catch (e) { 
      console.error(e); 
    }
  };

  useEffect(() => { 
    loadMembers(); 
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { 
      showToast('⚠️ Member name is required'); 
      return; 
    }

    const relationshipValue = isCustomRelation 
      ? (customRelationText.trim() || 'Family Member')
      : form.relationship;

    const endpoint = '/api/members';
    const method = editingId ? 'PUT' : 'POST';
    const body = editingId
      ? { id: editingId, name: form.name.trim(), relationship: relationshipValue, avatar: form.avatar, age: form.age ? Number(form.age) : null, notes: form.notes }
      : { householdId: user?.householdId, name: form.name.trim(), relationship: relationshipValue, avatar: form.avatar, age: form.age ? Number(form.age) : null, notes: form.notes };

    try {
      const res = await fetch(endpoint, { 
        method, 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(body) 
      });
      const data = await res.json();
      if (data.success) {
        showToast(editingId ? `✅ ${form.name} updated!` : `✅ ${form.name} added to family!`);
        setShowAddModal(false);
        setEditingId(null);
        setIsCustomRelation(false);
        setCustomRelationText('');
        setForm({ name: '', relationship: 'Father', avatar: '👨', age: '', notes: '' });
        loadMembers();
      } else { 
        showToast(`⚠️ ${data.error}`); 
      }
    } catch (e) { 
      showToast('Error saving member'); 
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from the family? This will also delete their medicines and history.`)) return;
    try {
      const res = await fetch(`/api/members?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { 
        showToast(`🗑️ ${name} removed from family.`); 
        loadMembers(); 
      }
    } catch (e) { 
      showToast('Error removing member'); 
    }
  };

  const openEdit = (m: any) => {
    setEditingId(m.id);
    const isPreset = PRESET_RELATIONS.some(p => p.label === m.relationship);
    if (isPreset) {
      setIsCustomRelation(false);
      setCustomRelationText('');
      setForm({ name: m.name, relationship: m.relationship, avatar: m.avatar || '👤', age: m.age?.toString() || '', notes: m.notes || '' });
    } else {
      setIsCustomRelation(true);
      setCustomRelationText(m.relationship || '');
      setForm({ name: m.name, relationship: m.relationship || '', avatar: m.avatar || '👤', age: m.age?.toString() || '', notes: m.notes || '' });
    }
    setShowAddModal(true);
  };

  const openAdd = () => {
    setEditingId(null);
    setIsCustomRelation(false);
    setCustomRelationText('');
    setForm({ name: '', relationship: 'Father', avatar: '👨', age: '', notes: '' });
    setShowAddModal(true);
  };

  return (
    <AppLayout>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-11/12 bg-[#1c2a38] text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold animate-bounce flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#10847e]" />
          <span>{toast}</span>
        </div>
      )}

      <div className="space-y-5 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-[#e2e8f0]">
          <div>
            <h1 className="text-xl font-black text-[#1c2a38] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#10847e]" />
              Family Members
            </h1>
            <p className="text-xs text-[#6b7280] mt-0.5">{members.length} members in {user?.householdName || 'your household'}</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#10847e] hover:bg-[#0d6e69] text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Add Family Member
          </button>
        </div>

        {members.length === 0 ? (
          <div className="medical-card p-10 bg-white text-center space-y-3">
            <Users className="w-14 h-14 text-slate-300 mx-auto" />
            <h3 className="font-bold text-[#1c2a38]">No Family Members Added Yet</h3>
            <p className="text-xs text-[#6b7280] max-w-sm mx-auto">
              Add your family members (Parents, Spouse, Children, In-laws, or Caregivers) to track their individual medicine schedules and reminders.
            </p>
            <button 
              onClick={openAdd} 
              className="px-5 py-2.5 bg-[#10847e] hover:bg-[#0d6e69] text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 inline mr-1" /> Add First Family Member
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((m) => (
              <div key={m.id} className="medical-card p-5 bg-white space-y-3 border border-[#e2e8f0] rounded-2xl hover:border-[#10847e]/30 transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2 bg-[#f4f1eb] rounded-2xl shrink-0">{m.avatar || '👤'}</span>
                    <div>
                      <h3 className="font-extrabold text-[#1c2a38] text-base">{m.name}</h3>
                      <p className="text-xs font-semibold text-[#10847e]">{m.relationship}{m.age ? ` • Age ${m.age}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => openEdit(m)} 
                      className="p-2 text-slate-400 hover:text-[#10847e] hover:bg-slate-100 rounded-xl transition cursor-pointer" 
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(m.id, m.name)} 
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer" 
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {m.notes && (
                  <p className="text-xs text-[#6b7280] bg-[#fbf9f5] p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                    {m.notes}
                  </p>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-[#6b7280]">
                  <span className="flex items-center gap-1 font-semibold text-[#10847e]">
                    <Pill className="w-3.5 h-3.5" /> {m.medicines?.length || 0} medicines
                  </span>
                  <span className="flex items-center gap-1 font-medium text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> {m.doseHistory?.length || 0} logged doses
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Family Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#e2e8f0] my-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg text-[#1c2a38]">
                {editingId ? 'Edit Family Member' : 'Add Family Member'}
              </h3>
              <button 
                onClick={() => { setShowAddModal(false); setEditingId(null); }} 
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#374151] block mb-1">Full Name *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Ramesh Sharma" 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 text-[#1c2a38] font-bold focus:border-[#10847e] outline-hidden text-sm" 
                />
              </div>

              {/* Relationship Dropdown */}
              <div>
                <label className="font-bold text-[#374151] block mb-1">Relationship</label>
                <select 
                  value={isCustomRelation ? 'Custom' : form.relationship} 
                  onChange={(e) => {
                    if (e.target.value === 'Custom') {
                      setIsCustomRelation(true);
                      setCustomRelationText(form.relationship === 'Father' ? '' : form.relationship);
                    } else {
                      setIsCustomRelation(false);
                      setCustomRelationText('');
                      const preset = PRESET_RELATIONS.find(p => p.label === e.target.value);
                      setForm({ ...form, relationship: e.target.value, avatar: preset?.avatar || '👤' });
                    }
                  }} 
                  className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 text-[#1c2a38] font-semibold focus:border-[#10847e] outline-hidden text-sm"
                >
                  {PRESET_RELATIONS.map((r) => (
                    <option key={r.label} value={r.label.startsWith('Custom') ? 'Custom' : r.label}>
                      {r.avatar} {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Relationship Free Text Field */}
              {isCustomRelation && (
                <div className="p-3 bg-[#10847e]/5 rounded-2xl border border-[#10847e]/20 space-y-1">
                  <label className="font-bold text-[#10847e] block">Type Custom Relationship *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Father-in-law, Aunt, Guardian, Caregiver, Cousin, Pet" 
                    value={customRelationText} 
                    onChange={(e) => {
                      setCustomRelationText(e.target.value);
                      setForm({ ...form, relationship: e.target.value });
                    }} 
                    className="w-full bg-white border border-[#10847e] rounded-xl px-3 py-2 text-[#1c2a38] font-bold focus:ring-1 focus:ring-[#10847e] outline-hidden text-sm" 
                  />
                  <p className="text-[10px] text-[#6b7280]">You can type any custom relationship name you want.</p>
                </div>
              )}

              {/* Emoji Icon Picker */}
              <div>
                <label className="font-bold text-[#374151] block mb-1">Choose Profile Icon</label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-[#fbf9f5] rounded-xl border border-slate-200">
                  {AVAILABLE_AVATARS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setForm({ ...form, avatar: emoji })}
                      className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition cursor-pointer ${
                        form.avatar === emoji ? 'bg-[#10847e] text-white shadow-xs scale-110' : 'hover:bg-slate-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-[#374151] block mb-1">Age in Years (Optional)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 72" 
                  value={form.age} 
                  onChange={(e) => setForm({ ...form, age: e.target.value })} 
                  className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 text-[#1c2a38] font-medium focus:border-[#10847e] outline-hidden text-sm" 
                />
              </div>

              <div>
                <label className="font-bold text-[#374151] block mb-1">Health Notes / Medical Conditions (Optional)</label>
                <textarea 
                  placeholder="e.g. Type-2 Diabetes, Hypertension, BP monitoring, Penicillin allergy" 
                  value={form.notes} 
                  onChange={(e) => setForm({ ...form, notes: e.target.value })} 
                  className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 text-[#1c2a38] font-medium focus:border-[#10847e] outline-hidden h-16 resize-none text-sm" 
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button 
                  type="button" 
                  onClick={() => { setShowAddModal(false); setEditingId(null); }} 
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl active:scale-95 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] py-3 bg-[#10847e] hover:bg-[#0d6e69] text-white font-extrabold rounded-xl shadow-md transition active:scale-95 cursor-pointer"
                >
                  {editingId ? 'Save Changes' : 'Add to Family'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
