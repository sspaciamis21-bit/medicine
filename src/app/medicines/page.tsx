'use client';

import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  Plus, 
  X, 
  Pencil, 
  Trash2, 
  RefreshCw, 
  Syringe, 
  Clock, 
  Bell, 
  CalendarDays, 
  Play, 
  Music, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { alarmEngine, AVAILABLE_CHIME_TONES, ChimeToneId } from '@/utils/audioAlarm';

interface ScheduleEntry {
  mealRelation: string;
  mealType: string;
  offsetMinutes: number;
  doseAmount: number;
  specificTime: string;
  frequencyType: string;
  useExactTime: boolean;
}

const newScheduleEntry = (meal?: string): ScheduleEntry => ({
  mealRelation: 'After Food',
  mealType: meal || 'Breakfast',
  offsetMinutes: 15,
  doseAmount: 1,
  specificTime: meal === 'Lunch' ? '01:30 PM' : meal === 'Dinner' ? '08:30 PM' : '08:00 AM',
  frequencyType: 'daily',
  useExactTime: false,
});

export default function MedicinesPage() {
  const { user, selectedMember } = useAuth();
  const [medicines, setMedicines] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [justAddedName, setJustAddedName] = useState<string | null>(null);
  const [lastMemberId, setLastMemberId] = useState<string>('');

  // Base household meal times (configurable in Settings or inline)
  const [mealTimes, setMealTimes] = useState({
    breakfast: '08:00 AM',
    lunch: '01:30 PM',
    dinner: '08:30 PM',
  });

  // Selected tone for this medicine
  const [selectedTone, setSelectedTone] = useState<ChimeToneId>('hospital_bell');

  const defaultForm = {
    name: '', 
    brandName: '', 
    genericName: '', 
    formType: 'Tablet', 
    strength: '', 
    unit: 'Tablets',
    memberId: '', 
    currentQuantity: 10, 
    quantityPurchased: 20, 
    lowStockThreshold: 5,
    expiryDate: '', 
    expiryAlertDays: 30, 
    doctorName: '', 
    prescriptionDate: '', 
    duration: '', 
    instructions: '',
    isInsulin: false, 
    insulinType: 'Long-Acting', 
    penOrVial: 'Pen', 
    insulinStorageNote: 'Store in refrigerator (2°C–8°C)',
    courseStartDate: '', 
    courseEndDate: '',
  };

  const [form, setForm] = useState(defaultForm);
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([newScheduleEntry()]);

  const showToast = (msg: string) => { 
    setToast(msg); 
    setTimeout(() => setToast(null), 3500); 
  };

  const loadData = async () => {
    try {
      setSelectedTone(alarmEngine.getSelectedTone());

      const [medRes, memRes, hRes] = await Promise.all([
        fetch(`/api/medicines${user?.householdId ? `?householdId=${user.householdId}` : ''}`),
        fetch(`/api/members${user?.householdId ? `?householdId=${user.householdId}` : ''}`),
        fetch(`/api/household${user?.householdId ? `?id=${user.householdId}` : ''}`),
      ]);

      const medData = await medRes.json();
      const memData = await memRes.json();
      const hData = await hRes.json();

      if (medData.success) setMedicines(medData.medicines || []);
      if (memData.success) setMembers(memData.members || []);
      if (hData.success && hData.household?.mealSettings) {
        setMealTimes({
          breakfast: hData.household.mealSettings.breakfastTime || '08:00 AM',
          lunch: hData.household.mealSettings.lunchTime || '01:30 PM',
          dinner: hData.household.mealSettings.dinnerTime || '08:30 PM',
        });
      }
    } catch (e) { 
      console.error(e); 
    }
  };

  useEffect(() => { 
    loadData(); 
  }, [user]);

  const filtered = selectedMember === 'all' ? medicines : medicines.filter((m) => m.memberId === selectedMember);

  // Time conversion helpers
  const parseTimeToMinutes = (timeStr: string): number => {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return 8 * 60;
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };

  const minutesToTimeStr = (totalMin: number): string => {
    let normalized = ((totalMin % 1440) + 1440) % 1440;
    let h = Math.floor(normalized / 60);
    let m = normalized % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12 || 12;
    return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  // Calculate exact time for a meal-linked schedule
  const calculateMealTime = (mealType: string, relation: string, offsetMin: number): string => {
    let baseTime = mealTimes.breakfast;
    if (mealType === 'Lunch') baseTime = mealTimes.lunch;
    if (mealType === 'Dinner') baseTime = mealTimes.dinner;

    const baseMin = parseTimeToMinutes(baseTime);
    let calculatedMin = baseMin;

    if (relation === 'Before Food' || relation === 'Empty Stomach') {
      calculatedMin = baseMin - offsetMin;
    } else if (relation === 'After Food') {
      calculatedMin = baseMin + offsetMin;
    }

    return minutesToTimeStr(calculatedMin);
  };

  // Convert 24h input value to 12h display
  const to12h = (time24: string): string => {
    if (!time24) return '08:00 AM';
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  // Convert 12h display to 24h input value
  const to24h = (time12: string): string => {
    const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return '08:00';
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { 
      showToast('⚠️ Medicine name is required'); 
      return; 
    }
    const memberId = form.memberId || members[0]?.id;
    if (!memberId) { 
      showToast('⚠️ Please add a family member first in the Family section'); 
      return; 
    }
    if (schedules.length === 0) { 
      showToast('⚠️ At least 1 reminder time is required'); 
      return; 
    }

    // Save tone preference
    alarmEngine.setSelectedTone(selectedTone);

    // Compute specific times for all schedules before saving
    const computedSchedules = schedules.map((s) => {
      const computedTime = s.useExactTime 
        ? s.specificTime 
        : calculateMealTime(s.mealType, s.mealRelation, s.offsetMinutes);
      return {
        ...s,
        specificTime: computedTime,
      };
    });

    const method = editingId ? 'PUT' : 'POST';
    const body = editingId
      ? { id: editingId, ...form, memberId, schedules: computedSchedules }
      : { householdId: user?.householdId, ...form, memberId, schedules: computedSchedules };

    try {
      const res = await fetch('/api/medicines', { 
        method, 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(body) 
      });
      const data = await res.json();
      if (data.success) {
        const addedName = form.name;
        setJustAddedName(addedName);
        setLastMemberId(memberId);
        showToast(editingId ? `✅ ${addedName} updated!` : `✅ ${addedName} added with ${schedules.length} reminder(s)!`);
        setEditingId(null);
        if (!editingId) {
          setForm({ ...defaultForm, memberId });
          setSchedules([newScheduleEntry()]);
        } else {
          setShowAddModal(false);
          setJustAddedName(null);
        }
        loadData();
      } else { 
        showToast(`⚠️ ${data.error}`); 
      }
    } catch (e) { 
      showToast('Error saving medicine'); 
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This removes all its schedules and dose history.`)) return;
    try {
      const res = await fetch(`/api/medicines?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { 
        showToast(`🗑️ ${name} deleted.`); 
        loadData(); 
      }
    } catch (e) { 
      showToast('Error'); 
    }
  };

  const openEdit = (m: any) => {
    setEditingId(m.id);
    setJustAddedName(null);
    setForm({
      name: m.name, 
      brandName: m.brandName || '', 
      genericName: m.genericName || '', 
      formType: m.formType,
      strength: m.strength || '', 
      unit: m.unit, 
      memberId: m.memberId, 
      currentQuantity: m.currentQuantity,
      quantityPurchased: m.quantityPurchased || 0, 
      lowStockThreshold: m.lowStockThreshold,
      expiryDate: m.expiryDate || '', 
      expiryAlertDays: m.expiryAlertDays || 30,
      doctorName: m.doctorName || '', 
      prescriptionDate: m.prescriptionDate || '', 
      duration: m.duration || '',
      instructions: m.instructions || '', 
      isInsulin: m.isInsulin, 
      insulinType: m.insulinType || 'Long-Acting',
      penOrVial: m.penOrVial || 'Pen', 
      insulinStorageNote: m.insulinStorageNote || '',
      courseStartDate: m.courseStartDate || '', 
      courseEndDate: m.courseEndDate || '',
    });

    if (m.schedules && m.schedules.length > 0) {
      setSchedules(m.schedules.map((s: any) => ({
        mealRelation: s.mealRelation || 'After Food',
        mealType: s.mealType || 'Breakfast',
        offsetMinutes: s.offsetMinutes || 0,
        doseAmount: s.doseAmount || 1,
        specificTime: s.specificTime || '08:00 AM',
        frequencyType: s.frequencyType || 'daily',
        useExactTime: s.mealRelation === 'Exact Time',
      })));
    } else {
      setSchedules([newScheduleEntry()]);
    }
    setShowAddModal(true);
  };

  const openAdd = () => {
    setEditingId(null);
    setJustAddedName(null);
    setForm({ ...defaultForm, memberId: members[0]?.id || '' });
    setSchedules([newScheduleEntry()]);
    setShowAddModal(true);
  };

  const handleAdjustStock = async (id: string, delta: number) => {
    const med = medicines.find(m => m.id === id);
    if (!med) return;
    const newQty = Math.max(0, med.currentQuantity + delta);
    try {
      await fetch('/api/medicines', { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ id, currentQuantity: newQty }) 
      });
      showToast(`📦 Stock adjusted: ${med.name} → ${newQty} ${med.unit}`);
      loadData();
    } catch (e) {}
  };

  // Schedule helpers
  const addScheduleSlot = () => {
    const nextMeals = ['Breakfast', 'Lunch', 'Dinner'];
    const usedMeals = schedules.map(s => s.mealType);
    const nextMeal = nextMeals.find(m => !usedMeals.includes(m)) || 'Breakfast';
    setSchedules([...schedules, newScheduleEntry(nextMeal)]);
  };

  const removeScheduleSlot = (idx: number) => {
    if (schedules.length <= 1) { 
      showToast('⚠️ At least 1 reminder is required'); 
      return; 
    }
    setSchedules(schedules.filter((_, i) => i !== idx));
  };

  const updateScheduleSlot = (idx: number, field: string, value: any) => {
    setSchedules(schedules.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const setScheduleMode = (idx: number, useExact: boolean) => {
    setSchedules(schedules.map((s, i) => {
      if (i !== idx) return s;
      if (useExact) {
        return { ...s, useExactTime: true, mealRelation: 'Exact Time' };
      } else {
        return { ...s, useExactTime: false, mealRelation: 'After Food' };
      }
    }));
  };

  // Quick presets
  const applyQuickPreset = (preset: string) => {
    switch (preset) {
      case 'once_morning':
        setSchedules([newScheduleEntry('Breakfast')]);
        break;
      case 'twice':
        setSchedules([newScheduleEntry('Breakfast'), newScheduleEntry('Dinner')]);
        break;
      case 'thrice':
        setSchedules([newScheduleEntry('Breakfast'), newScheduleEntry('Lunch'), newScheduleEntry('Dinner')]);
        break;
      case 'empty_stomach':
        setSchedules([{ ...newScheduleEntry('Breakfast'), mealRelation: 'Empty Stomach', offsetMinutes: 30 }]);
        break;
    }
  };

  const getMealEmoji = (meal: string) => {
    switch (meal) {
      case 'Breakfast': return '🌅';
      case 'Lunch': return '☀️';
      case 'Dinner': return '🌙';
      default: return '⏰';
    }
  };

  const getMemberName = (id: string) => {
    const m = members.find(m => m.id === id);
    return m ? m.name : 'Member';
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
              <Pill className="w-5 h-5 text-[#10847e]" /> Medicine Master & Inventory
            </h1>
            <p className="text-xs text-[#6b7280] mt-0.5">{filtered.length} medicines tracked{selectedMember !== 'all' ? ' for selected member' : ''}</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#ef4f5f] hover:bg-[#dc3545] text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Medicine
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="medical-card p-10 bg-white text-center space-y-3">
            <Pill className="w-14 h-14 text-slate-300 mx-auto" />
            <h3 className="font-bold text-[#1c2a38]">No Medicines Added Yet</h3>
            <p className="text-xs text-[#6b7280] max-w-sm mx-auto">Add medicines with dosage, exact reminder times, voice tune, stock, expiry, and prescription details for each family member.</p>
            <button onClick={openAdd} className="px-4 py-2.5 bg-[#10847e] text-white font-bold text-xs rounded-xl cursor-pointer transition active:scale-95"><Plus className="w-4 h-4 inline mr-1" /> Add Medicine</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((med) => {
              const isLow = med.currentQuantity <= med.lowStockThreshold;
              const totalDailyDose = med.schedules?.reduce((a: number, s: any) => a + (s.doseAmount || 1), 0) || 1;
              const daysLeft = med.daysRemaining ?? Math.floor(med.currentQuantity / totalDailyDose);
              const stockPct = Math.min(100, (med.currentQuantity / Math.max(med.lowStockThreshold * 3, 15)) * 100);
              return (
                <div key={med.id} className="medical-card p-5 bg-white space-y-3 border border-[#e2e8f0] rounded-2xl hover:border-[#10847e]/30 transition">
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
                        <p className="text-xs text-[#6b7280] mt-0.5">
                          {med.brandName ? `${med.brandName} • ` : ''}{med.strength ? `${med.strength} • ` : ''}For: <strong className="text-[#1c2a38]">{med.member?.name || 'Member'}</strong>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(med)} className="p-2 text-slate-400 hover:text-[#10847e] hover:bg-slate-100 rounded-xl transition cursor-pointer" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(med.id, med.name)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
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

                  {/* All Schedules */}
                  <div className="space-y-1">
                    {(med.schedules || []).map((s: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-[#6b7280]">
                        <span>{getMealEmoji(s.mealType)}</span>
                        <span className="font-bold text-[#10847e]">⏰ {s.specificTime}</span>
                        {s.mealRelation !== 'Exact Time' && (
                          <span className="text-slate-500">({s.mealType} • {s.mealRelation})</span>
                        )}
                        <span>• {s.doseAmount || 1} dose</span>
                      </div>
                    ))}
                  </div>

                  {/* Expiry & Course */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#6b7280]">
                    <span>Expiry: <strong className="text-[#1c2a38]">{med.expiryDate || 'N/A'}</strong></span>
                    {med.courseStartDate && (
                      <>
                        <span>•</span>
                        <span>Course: <strong>{med.courseStartDate} → {med.courseEndDate || 'Ongoing'}</strong></span>
                      </>
                    )}
                    {med.doctorName && <><span>•</span><span>Dr. {med.doctorName}</span></>}
                  </div>

                  {/* Stock Adjust Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleAdjustStock(med.id, -1)} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer">−1</button>
                      <button onClick={() => handleAdjustStock(med.id, 1)} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer">+1</button>
                      <button onClick={() => handleAdjustStock(med.id, 10)} className="px-2.5 py-1 bg-[#10847e]/10 hover:bg-[#10847e]/20 text-[#10847e] text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"><RefreshCw className="w-3 h-3" /> +10</button>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">Alert at: {med.lowStockThreshold}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============ ADD / EDIT MEDICINE MODAL ============ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-[#e2e8f0] my-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg text-[#1c2a38]">{editingId ? 'Edit Medicine' : 'Add New Medicine'}</h3>
              <button onClick={() => { setShowAddModal(false); setEditingId(null); setJustAddedName(null); }} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            {/* ✅ SUCCESS BANNER — "Add Another Medicine" */}
            {justAddedName && !editingId && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                <p className="text-xs font-extrabold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> &quot;{justAddedName}&quot; has been saved for {getMemberName(lastMemberId)}!
                </p>
                <p className="text-[11px] text-emerald-700">
                  You can now add another medicine for the same person below, or click &quot;Done&quot; to close.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setJustAddedName(null);
                      setForm({ ...defaultForm, memberId: lastMemberId });
                      setSchedules([newScheduleEntry()]);
                    }}
                    className="flex-[2] py-2 bg-[#10847e] hover:bg-[#0d6e69] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Medicine for {getMemberName(lastMemberId)}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddModal(false); setJustAddedName(null); }}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition active:scale-95 cursor-pointer"
                  >
                    Done ✓
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* ──── Medicine Details ──── */}
              <div className="space-y-3">
                <div>
                  <label className="font-bold text-[#374151] block mb-1">Medicine Name *</label>
                  <input type="text" required placeholder="e.g. Metformin, Amlodipine, Crocin" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 text-[#1c2a38] font-bold focus:border-[#10847e] outline-hidden text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-[#374151] block mb-1">Brand Name</label>
                    <input type="text" placeholder="Brand (optional)" value={form.brandName} onChange={(e) => setForm({ ...form, brandName: e.target.value })} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 focus:border-[#10847e] outline-hidden text-sm" />
                  </div>
                  <div>
                    <label className="font-bold text-[#374151] block mb-1">Generic Name</label>
                    <input type="text" placeholder="Generic (optional)" value={form.genericName} onChange={(e) => setForm({ ...form, genericName: e.target.value })} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 focus:border-[#10847e] outline-hidden text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-[#374151] block mb-1">Type</label>
                    <select value={form.formType} onChange={(e) => { const isIns = e.target.value === 'Insulin'; setForm({ ...form, formType: e.target.value, isInsulin: isIns, unit: isIns ? 'Pens' : 'Tablets' }); }} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:border-[#10847e] outline-hidden text-sm">
                      {['Tablet','Capsule','Syrup','Insulin','Injection','Drops','Cream','Other'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div><label className="font-bold text-[#374151] block mb-1">Strength</label><input type="text" placeholder="500 mg" value={form.strength} onChange={(e) => setForm({ ...form, strength: e.target.value })} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 focus:border-[#10847e] outline-hidden text-sm" /></div>
                  <div><label className="font-bold text-[#374151] block mb-1">Unit</label><input type="text" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 focus:border-[#10847e] outline-hidden text-sm" /></div>
                </div>
              </div>

              {/* ──── For Whom ──── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#374151] block mb-1">Family Member *</label>
                  <select value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:border-[#10847e] outline-hidden text-sm">
                    {members.length === 0 && <option value="">— Add in Family section —</option>}
                    {members.map(m => <option key={m.id} value={m.id}>{m.avatar || '👤'} {m.name} ({m.relationship})</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[#374151] block mb-1">Dose per Take</label>
                  <input type="number" min="0.5" step="0.5" value={schedules[0]?.doseAmount || 1} onChange={(e) => {
                    const val = Number(e.target.value);
                    setSchedules(schedules.map(s => ({ ...s, doseAmount: val })));
                  }} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-bold focus:border-[#10847e] outline-hidden text-sm" />
                </div>
              </div>

              {/* ──── Stock & Expiry ──── */}
              <div className="grid grid-cols-3 gap-3">
                <div><label className="font-bold text-[#374151] block mb-1">Current Qty</label><input type="number" value={form.currentQuantity} onChange={(e) => setForm({ ...form, currentQuantity: Number(e.target.value) })} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-bold focus:border-[#10847e] outline-hidden text-sm" /></div>
                <div><label className="font-bold text-[#374151] block mb-1">Low Alert At</label><input type="number" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: Number(e.target.value) })} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-amber-600 focus:border-[#10847e] outline-hidden text-sm" /></div>
                <div><label className="font-bold text-[#374151] block mb-1">Expiry Date</label><input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-2 py-2.5 focus:border-[#10847e] outline-hidden text-sm" /></div>
              </div>

              {/* ──── Reminder Active Period (Course Start & End Dates) ──── */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-[#1c2a38] flex items-center gap-1.5 text-xs">
                  <CalendarDays className="w-4 h-4 text-[#10847e]" /> Reminder Active Period (Course Duration)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1 text-[11px]">Start Reminder From</label>
                    <input type="date" value={form.courseStartDate} onChange={(e) => setForm({ ...form, courseStartDate: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 focus:border-[#10847e] outline-hidden text-xs" />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1 text-[11px]">Stop Reminder On (End Date)</label>
                    <input type="date" value={form.courseEndDate} onChange={(e) => setForm({ ...form, courseEndDate: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 focus:border-[#10847e] outline-hidden text-xs" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">Leave End Date empty for long-term / chronic daily prescriptions.</p>
              </div>

              {/* ──── Reminder Chime Tone Selector ──── */}
              <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1c2a38] flex items-center gap-1.5 text-xs">
                    <Music className="w-4 h-4 text-amber-600" /> Reminder Alarm Voice / Tune
                  </span>
                  <span className="text-[10px] text-slate-500">Tap ▶️ to test sound</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_CHIME_TONES.map((tone) => {
                    const isSelected = selectedTone === tone.id;
                    return (
                      <div
                        key={tone.id}
                        onClick={() => {
                          setSelectedTone(tone.id);
                          alarmEngine.playTone(tone.id);
                        }}
                        className={`p-2 rounded-xl border transition cursor-pointer flex items-center justify-between gap-1.5 ${
                          isSelected
                            ? 'bg-[#10847e] text-white border-[#10847e] shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span>{tone.icon}</span>
                          <span className="font-bold text-[11px] truncate">{tone.name.split('(')[0]}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            alarmEngine.playTone(tone.id);
                          }}
                          className={`p-1 rounded-md shrink-0 transition ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 hover:bg-[#10847e] hover:text-white'
                          }`}
                          title="Preview Tune"
                        >
                          <Play className="w-3 h-3 fill-current" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ════════════ REMINDER SCHEDULES (TIMINGS & OFFSETS) ════════════ */}
              <div className="p-4 bg-[#10847e]/5 rounded-2xl border border-[#10847e]/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#10847e]" />
                    <span className="font-extrabold text-[#10847e] text-xs">Dose Timings ({schedules.length}x per day)</span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] font-bold text-[#6b7280] py-1 pr-1">Quick:</span>
                  {[
                    { key: 'once_morning', label: '1x Morning', check: () => schedules.length === 1 && schedules[0].mealType === 'Breakfast' && !schedules[0].useExactTime },
                    { key: 'twice', label: '2x (Morning+Dinner)', check: () => schedules.length === 2 },
                    { key: 'thrice', label: '3x (Breakfast+Lunch+Dinner)', check: () => schedules.length === 3 },
                    { key: 'empty_stomach', label: 'Empty Stomach', check: () => schedules.length === 1 && schedules[0].mealRelation === 'Empty Stomach' },
                  ].map(p => (
                    <button key={p.key} type="button" onClick={() => applyQuickPreset(p.key)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${p.check() ? 'bg-[#10847e] text-white' : 'bg-white text-[#6b7280] border border-slate-200 hover:border-[#10847e]'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Individual Schedule Slots */}
                {schedules.map((sched, idx) => {
                  const calculatedTime = calculateMealTime(sched.mealType, sched.mealRelation, sched.offsetMinutes);
                  const baseMealTime = sched.mealType === 'Lunch' ? mealTimes.lunch : sched.mealType === 'Dinner' ? mealTimes.dinner : mealTimes.breakfast;

                  return (
                    <div key={idx} className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2.5 shadow-xs">
                      {/* Top Bar: Title & Mode Switcher */}
                      <div className="flex items-center justify-between">
                        <span className="font-black text-[#1c2a38] text-xs flex items-center gap-1.5">
                          {sched.useExactTime ? '⏰' : getMealEmoji(sched.mealType)} Reminder #{idx + 1}
                        </span>

                        <div className="flex items-center gap-1">
                          {/* Mode Toggle Buttons */}
                          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
                            <button
                              type="button"
                              onClick={() => setScheduleMode(idx, false)}
                              className={`px-2 py-1 rounded-md transition cursor-pointer ${
                                !sched.useExactTime
                                  ? 'bg-[#10847e] text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              🍽️ Meal-Linked
                            </button>
                            <button
                              type="button"
                              onClick={() => setScheduleMode(idx, true)}
                              className={`px-2 py-1 rounded-md transition cursor-pointer ${
                                sched.useExactTime
                                  ? 'bg-[#10847e] text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              ⏰ Exact Clock Time
                            </button>
                          </div>

                          {schedules.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => removeScheduleSlot(idx)} 
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer" 
                              title="Remove this reminder"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {sched.useExactTime ? (
                        /* ── OPTION A: EXACT CLOCK TIME PICKER ── */
                        <div className="space-y-1.5 p-2.5 bg-blue-50/50 rounded-xl border border-blue-100">
                          <label className="font-bold text-blue-900 block text-[11px]">Set Exact Reminder Ring Time (e.g. 09:03 AM)</label>
                          <input
                            type="time"
                            value={to24h(sched.specificTime)}
                            onChange={(e) => updateScheduleSlot(idx, 'specificTime', to12h(e.target.value))}
                            className="w-full bg-white border border-blue-300 rounded-xl px-3 py-2 text-base font-extrabold text-[#1c2a38] focus:ring-2 focus:ring-blue-500 outline-hidden"
                          />
                          <p className="text-[11px] text-blue-700 font-bold flex items-center gap-1">
                            🔔 Alarm will ring at exactly: <strong>{sched.specificTime}</strong>
                          </p>
                        </div>
                      ) : (
                        /* ── OPTION B: MEAL-LINKED PICKER (WITH LIVE CALCULATED TIME) ── */
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="font-medium text-slate-600 block mb-0.5 text-[10px]">When</label>
                              <select 
                                value={sched.mealRelation} 
                                onChange={(e) => updateScheduleSlot(idx, 'mealRelation', e.target.value)} 
                                className="w-full bg-[#fbf9f5] border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:border-[#10847e] outline-hidden"
                              >
                                {['Before Food','After Food','With Food','Empty Stomach'].map(o => <option key={o} value={o}>{o}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="font-medium text-slate-600 block mb-0.5 text-[10px]">Meal</label>
                              <select 
                                value={sched.mealType} 
                                onChange={(e) => updateScheduleSlot(idx, 'mealType', e.target.value)} 
                                className="w-full bg-[#fbf9f5] border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:border-[#10847e] outline-hidden"
                              >
                                <option value="Breakfast">Breakfast ({mealTimes.breakfast})</option>
                                <option value="Lunch">Lunch ({mealTimes.lunch})</option>
                                <option value="Dinner">Dinner ({mealTimes.dinner})</option>
                              </select>
                            </div>
                            <div>
                              <label className="font-medium text-slate-600 block mb-0.5 text-[10px]">Offset</label>
                              <select 
                                value={sched.offsetMinutes} 
                                onChange={(e) => updateScheduleSlot(idx, 'offsetMinutes', Number(e.target.value))} 
                                className="w-full bg-[#fbf9f5] border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:border-[#10847e] outline-hidden"
                              >
                                {[
                                  {v:0,l:'Immediately'},
                                  {v:5,l:'5 min'},
                                  {v:10,l:'10 min'},
                                  {v:15,l:'15 min'},
                                  {v:30,l:'30 min'},
                                  {v:45,l:'45 min'},
                                  {v:60,l:'1 hour'}
                                ].map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                              </select>
                            </div>
                          </div>

                          {/* Calculated Exact Ring Time Badge */}
                          <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                            <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                              🔔 Alarm Rings At: <strong className="text-emerald-700 text-sm font-black">{calculatedTime}</strong>
                            </span>
                            <span className="text-[10px] text-emerald-700 font-medium">
                              ({sched.mealType}: {baseMealTime})
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* + Add Another Reminder Time */}
                <button
                  type="button"
                  onClick={addScheduleSlot}
                  className="w-full py-2.5 border-2 border-dashed border-[#10847e]/30 text-[#10847e] hover:bg-[#10847e]/5 hover:border-[#10847e]/50 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Another Reminder Time (e.g. Lunch, Dinner, Night)
                </button>
              </div>

              {/* ──── Doctor & Notes ──── */}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="font-bold text-[#374151] block mb-1">Doctor Name</label><input type="text" placeholder="Dr. name" value={form.doctorName} onChange={(e) => setForm({ ...form, doctorName: e.target.value })} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 focus:border-[#10847e] outline-hidden text-sm" /></div>
                <div><label className="font-bold text-[#374151] block mb-1">Prescription Date</label><input type="date" value={form.prescriptionDate} onChange={(e) => setForm({ ...form, prescriptionDate: e.target.value })} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-2 py-2.5 focus:border-[#10847e] outline-hidden text-sm" /></div>
              </div>

              <div>
                <label className="font-bold text-[#374151] block mb-1">Doctor&apos;s Instructions / Notes</label>
                <textarea placeholder="Usage instructions, precautions, meal notes" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 focus:border-[#10847e] outline-hidden h-14 resize-none text-sm" />
              </div>

              {/* ──── SUBMIT ──── */}
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => { setShowAddModal(false); setEditingId(null); setJustAddedName(null); }} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl active:scale-95 transition cursor-pointer">Cancel</button>
                <button type="submit" className="flex-[2] py-3 bg-[#10847e] hover:bg-[#0d6e69] text-white font-black rounded-xl shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-2">
                  <Pill className="w-4 h-4" /> {editingId ? 'Save Changes' : `Add Medicine (${schedules.length} Reminder${schedules.length > 1 ? 's' : ''})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
