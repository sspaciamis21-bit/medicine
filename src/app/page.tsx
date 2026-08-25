'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  Plus, 
  Phone, 
  MessageCircle, 
  Pill, 
  Syringe, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  DollarSign, 
  Users, 
  Sliders, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  ShieldAlert, 
  ChevronRight,
  TrendingUp,
  MapPin,
  Flame,
  Check,
  X,
  RotateCcw
} from 'lucide-react';
import { alarmEngine } from '@/utils/audioAlarm';

interface MedicineItem {
  id: string;
  memberId: string;
  memberName: string;
  name: string;
  brand: string;
  type: string;
  strength: string;
  unit: string;
  currentQty: number;
  threshold: number;
  doseAmount: number;
  doseUnit?: string;
  scheduleTime: string;
  mealRelation: string;
  offset: string;
  expiryDate: string;
  doctor?: string;
  isInsulin: boolean;
  insulinType?: string;
  storageNote?: string;
  openedDate?: string;
  status: 'pending' | 'taken' | 'skipped';
  takenAt?: string;
}

// Initial Mock Data representing a realistic multi-member household
const INITIAL_MEMBERS = [
  { id: 'all', name: 'All Members', avatar: '👨‍👩‍👧‍👦', color: 'bg-slate-700 text-white' },
  { id: 'm1', name: 'Grandpa (Ramesh)', relation: 'Grandparent', avatar: '👴', color: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
  { id: 'm2', name: 'Father (Rajesh)', relation: 'Father', avatar: '👨', color: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
  { id: 'm3', name: 'Mother (Sunita)', relation: 'Mother', avatar: '👩', color: 'bg-violet-500/20 text-violet-400 border border-violet-500/30' },
  { id: 'm4', name: 'Self (Aarav)', relation: 'Self', avatar: '🧑', color: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' },
];

const INITIAL_MEDICINES: MedicineItem[] = [
  {
    id: 'med-1',
    memberId: 'm2',
    memberName: 'Father (Rajesh)',
    name: 'Metformin 500mg',
    brand: 'Glycomet SR',
    type: 'Tablet',
    strength: '500 mg',
    unit: 'Tablets',
    currentQty: 6,
    threshold: 10,
    doseAmount: 1,
    scheduleTime: '08:00 AM',
    mealRelation: 'Before Breakfast',
    offset: '30 mins before',
    expiryDate: '2027-04-15',
    doctor: 'Dr. V. Sharma (Endocrinologist)',
    isInsulin: false,
    status: 'pending',
  },
  {
    id: 'med-2',
    memberId: 'm1',
    memberName: 'Grandpa (Ramesh)',
    name: 'Lantus Solostar Insulin',
    brand: 'Sanofi',
    type: 'Insulin',
    strength: '100 IU/ml',
    unit: 'Pens',
    currentQty: 1,
    threshold: 2,
    doseAmount: 14,
    doseUnit: 'Units',
    scheduleTime: '08:30 PM',
    mealRelation: 'Before Dinner',
    offset: '15 mins before',
    openedDate: '2026-08-05',
    expiryDate: '2027-01-20',
    doctor: 'Dr. Mehta (Diabetologist)',
    isInsulin: true,
    insulinType: 'Long-Acting (Glargine)',
    storageNote: 'Store unopened pens in fridge (2°C–8°C). Keep active pen at room temperature (<30°C). Discard 28 days after opening.',
    status: 'pending',
  },
  {
    id: 'med-3',
    memberId: 'm3',
    memberName: 'Mother (Sunita)',
    name: 'Thyronorm 75mcg',
    brand: 'Abbott',
    type: 'Tablet',
    strength: '75 mcg',
    unit: 'Tablets',
    currentQty: 24,
    threshold: 10,
    doseAmount: 1,
    scheduleTime: '07:30 AM',
    mealRelation: 'Empty Stomach',
    offset: '30 mins before breakfast',
    expiryDate: '2027-08-10',
    doctor: 'Dr. Kapoor (Physician)',
    isInsulin: false,
    status: 'taken',
    takenAt: '07:35 AM',
  },
  {
    id: 'med-4',
    memberId: 'm1',
    memberName: 'Grandpa (Ramesh)',
    name: 'Telmisartan 40mg',
    brand: 'Telma 40',
    type: 'Tablet',
    strength: '40 mg',
    unit: 'Tablets',
    currentQty: 18,
    threshold: 8,
    doseAmount: 1,
    scheduleTime: '01:30 PM',
    mealRelation: 'After Lunch',
    offset: 'Immediately after',
    expiryDate: '2026-11-30',
    doctor: 'Dr. Mehta (Cardiologist)',
    isInsulin: false,
    status: 'pending',
  },
  {
    id: 'med-5',
    memberId: 'm4',
    memberName: 'Self (Aarav)',
    name: 'Vitamin D3 60K',
    brand: 'Calcirol Sachet',
    type: 'Syrup / Powder',
    strength: '60,000 IU',
    unit: 'Sachets',
    currentQty: 3,
    threshold: 2,
    doseAmount: 1,
    scheduleTime: '02:00 PM',
    mealRelation: 'With Milk / Lunch',
    offset: 'Once a week',
    expiryDate: '2027-05-18',
    doctor: 'Dr. V. Sharma',
    isInsulin: false,
    status: 'pending',
  },
];

const INITIAL_PHARMACIES = [
  {
    id: 'ph-1',
    name: 'Apollo 24/7 Pharmacy',
    contact: 'Mr. Rakesh (Chemist)',
    phone: '+919876543210',
    whatsapp: '+919876543210',
    address: 'Shop 12, Central Market, Green Park',
    isDefault: true,
    deliveryAvailable: true,
  },
  {
    id: 'ph-2',
    name: 'MedPlus Chemist & Druggist',
    contact: 'Counter Support',
    phone: '+919812345678',
    whatsapp: '+919812345678',
    address: 'Near Metro Station Gate 2',
    isDefault: false,
    deliveryAvailable: true,
  },
];

export default function FamilyMedicineApp() {
  const [activeTab, setActiveTab] = useState<'today' | 'medicines' | 'insulin' | 'pharmacy' | 'expenses' | 'settings'>('today');
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [medicines, setMedicines] = useState(INITIAL_MEDICINES);
  const [alarmActive, setAlarmActive] = useState<boolean>(false);
  const [activeAlarmMedicine, setActiveAlarmMedicine] = useState<any>(null);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Household Meal Times
  const [mealTimes, setMealTimes] = useState({
    breakfast: '08:00 AM',
    lunch: '01:30 PM',
    dinner: '08:30 PM',
  });

  // Register Service Worker on client mount
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.log('SW Registration notice:', err);
      });
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Trigger high-volume alarm test or real reminder
  const triggerAlarm = (med?: any) => {
    const target = med || medicines[0];
    setActiveAlarmMedicine(target);
    setAlarmActive(true);
    if (alarmEngine && audioEnabled) {
      alarmEngine.startAlarmLoop();
    }
  };

  // Stop alarm
  const dismissAlarm = () => {
    setAlarmActive(false);
    if (alarmEngine) {
      alarmEngine.stopAlarmLoop();
    }
  };

  // Handle Mark as Taken
  const handleMarkTaken = (medId: string) => {
    setMedicines((prev) =>
      prev.map((m) => {
        if (m.id === medId) {
          const newQty = Math.max(0, m.currentQty - (m.isInsulin ? 1 : m.doseAmount));
          return {
            ...m,
            currentQty: newQty,
            status: 'taken',
            takenAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        }
        return m;
      })
    );

    // Play quick positive affirmation chime
    if (alarmEngine && audioEnabled) {
      alarmEngine.playLoudChime(1046.5, 0.25, 1.5); // C6 tone
    }

    dismissAlarm();
    showToast('✅ Dose marked as TAKEN! Inventory stock automatically updated.');
  };

  // Handle Snooze
  const handleSnooze = (minutes: number = 10) => {
    dismissAlarm();
    showToast(`⏰ Snoozed for ${minutes} minutes. Alarm will ring loudly again.`);
  };

  // Handle Skip
  const handleSkip = (medId: string) => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === medId ? { ...m, status: 'skipped' } : m))
    );
    dismissAlarm();
    showToast('⏭️ Dose marked as SKIPPED. Stock remains unchanged.');
  };

  // Filter medicines by family member
  const filteredMedicines = selectedMember === 'all'
    ? medicines
    : medicines.filter((m) => m.memberId === selectedMember);

  const lowStockMedicines = medicines.filter((m) => m.currentQty <= m.threshold);

  // Generate WhatsApp Reorder Message with low stock items
  const generateWhatsAppReorder = (store: typeof INITIAL_PHARMACIES[0]) => {
    const itemsText = lowStockMedicines
      .map((m, idx) => `${idx + 1}. *${m.name}* (${m.brand}) - Need: 2 Packs [Patient: ${m.memberName}]`)
      .join('%0A');

    const message = `Hello ${store.name},%0APlease prepare a refill order for our family:%0A%0A${itemsText}%0A%0APlease confirm delivery time. Thank you!`;
    return `https://wa.me/${store.whatsapp.replace('+', '')}?text=${message}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#090d16] text-slate-100 pb-20">
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* LOUD AUDIO ALARM FULLSCREEN MODAL */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {alarmActive && activeAlarmMedicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border-2 border-red-500/80 rounded-3xl p-6 shadow-2xl shadow-red-950/80 text-center animate-pulse-alarm">
            {/* Pulsing Alert Badge */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 mb-4 mx-auto animate-bounce">
              <BellRing className="w-10 h-10" />
            </div>

            <div className="inline-block px-3 py-1 bg-red-500/30 text-red-300 text-xs font-bold rounded-full uppercase tracking-wider mb-2">
              🔊 High Volume Medicine Alarm
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight">
              {activeAlarmMedicine.name}
            </h2>
            <p className="text-emerald-400 font-semibold text-sm mt-1">
              {activeAlarmMedicine.memberName} • {activeAlarmMedicine.doseAmount} {activeAlarmMedicine.unit || 'Dose'}
            </p>

            <div className="mt-4 p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 text-left text-sm space-y-1.5">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" /> Meal Relation:
                </span>
                <span className="font-semibold text-emerald-300">{activeAlarmMedicine.mealRelation} ({activeAlarmMedicine.offset})</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-xs text-slate-400">Current Stock:</span>
                <span className={`font-bold ${activeAlarmMedicine.currentQty <= activeAlarmMedicine.threshold ? 'text-amber-400' : 'text-slate-200'}`}>
                  {activeAlarmMedicine.currentQty} {activeAlarmMedicine.unit} left
                </span>
              </div>
              {activeAlarmMedicine.doctor && (
                <div className="text-xs text-slate-400 pt-1 border-t border-slate-700/50">
                  Prescribed by: <span className="text-slate-300">{activeAlarmMedicine.doctor}</span>
                </div>
              )}
            </div>

            {/* Alarm Action Buttons */}
            <div className="mt-6 space-y-2.5">
              <button
                onClick={() => handleMarkTaken(activeAlarmMedicine.id)}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-lg rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition active:scale-95"
              >
                <CheckCircle2 className="w-6 h-6" />
                MARK AS TAKEN (Dose Done)
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleSnooze(10)}
                  className="py-3 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-sm rounded-xl border border-amber-500/30 flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <Clock className="w-4 h-4" />
                  Snooze 10 Mins
                </button>
                <button
                  onClick={() => handleSkip(activeAlarmMedicine.id)}
                  className="py-3 bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold text-sm rounded-xl border border-rose-500/30 flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <X className="w-4 h-4" />
                  Skip Dose
                </button>
              </div>

              <button
                onClick={dismissAlarm}
                className="w-full text-xs text-slate-400 hover:text-slate-200 py-1"
              >
                Stop Sound & Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-11/12 bg-slate-800/95 border border-emerald-500/40 text-white px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md flex items-center gap-2 text-sm font-medium animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* TOP HEADER & APP BAR */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[#090d16]/90 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Pill className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-lg text-white tracking-tight">MediFamily</h1>
                <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-md border border-emerald-500/30">PWA</span>
              </div>
              <p className="text-xs text-slate-400">Sharma Household • 4 Members</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = !audioEnabled;
                setAudioEnabled(next);
                showToast(next ? '🔊 Loud Audio Alarms Enabled' : '🔇 Audio Muted');
              }}
              className={`p-2.5 rounded-xl border transition ${audioEnabled ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
              title="Toggle Loud Audio Alarm"
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={() => triggerAlarm(medicines[0])}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-md shadow-red-950/50 transition active:scale-95"
            >
              <BellRing className="w-3.5 h-3.5 animate-pulse" />
              <span>Test Alarm</span>
            </button>
          </div>
        </div>

        {/* Family Member Switcher Pill Bar */}
        <div className="max-w-4xl mx-auto mt-3 overflow-x-auto hide-scrollbar flex items-center gap-2 pb-1">
          {INITIAL_MEMBERS.map((member) => {
            const isSelected = selectedMember === member.id;
            return (
              <button
                key={member.id}
                onClick={() => setSelectedMember(member.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                    : 'bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:bg-slate-800'
                }`}
              >
                <span>{member.avatar}</span>
                <span>{member.name}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MAIN CONTENT CONTAINER */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <main className="max-w-4xl w-full mx-auto px-4 pt-4 flex-1 space-y-4">
        
        {/* LOW STOCK BANNER ALERT (If any medicine <= threshold) */}
        {lowStockMedicines.length > 0 && (
          <div className="p-3.5 bg-gradient-to-r from-amber-950/40 via-red-950/30 to-amber-950/40 border border-amber-500/40 rounded-2xl flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                  Low Stock Alert ({lowStockMedicines.length} Items)
                </h4>
                <p className="text-xs text-slate-300">
                  {lowStockMedicines.map((m) => `${m.name} (${m.currentQty} left)`).join(', ')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('pharmacy')}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shrink-0 flex items-center gap-1 transition"
            >
              <Phone className="w-3 h-3" />
              Reorder
            </button>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────────── */}
        {/* TAB 1: TODAY'S DOSE TIMELINE */}
        {/* ─────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'today' && (
          <div className="space-y-4">
            {/* Quick Stats Bar */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="glass-card p-3 rounded-2xl border border-slate-800">
                <span className="text-[11px] text-slate-400 font-medium">Scheduled Today</span>
                <p className="text-xl font-extrabold text-white mt-0.5">{filteredMedicines.length} Doses</p>
              </div>
              <div className="glass-card p-3 rounded-2xl border border-slate-800">
                <span className="text-[11px] text-emerald-400 font-medium">Taken So Far</span>
                <p className="text-xl font-extrabold text-emerald-400 mt-0.5">
                  {filteredMedicines.filter((m) => m.status === 'taken').length} Done
                </p>
              </div>
              <div className="glass-card p-3 rounded-2xl border border-slate-800">
                <span className="text-[11px] text-amber-400 font-medium">Pending Doses</span>
                <p className="text-xl font-extrabold text-amber-300 mt-0.5">
                  {filteredMedicines.filter((m) => m.status === 'pending').length} Left
                </p>
              </div>
            </div>

            {/* Timeline Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  Today's Schedule & Meal Timings
                </h3>
                <span className="text-xs text-slate-400">
                  Breakfast: {mealTimes.breakfast} • Lunch: {mealTimes.lunch} • Dinner: {mealTimes.dinner}
                </span>
              </div>

              {filteredMedicines.map((med) => {
                const isTaken = med.status === 'taken';
                return (
                  <div
                    key={med.id}
                    className={`glass-card p-4 rounded-2xl border transition ${
                      isTaken ? 'border-emerald-500/20 bg-slate-900/40 opacity-75' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                          med.isInsulin ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {med.isInsulin ? <Syringe className="w-5 h-5" /> : <Pill className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-base">{med.name}</h4>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                              {med.memberName}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {med.strength} • Dose: <strong className="text-slate-200">{med.doseAmount} {med.unit || 'Dose'}</strong>
                          </p>

                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                              <Clock className="w-3 h-3" />
                              {med.scheduleTime} ({med.mealRelation})
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {med.offset}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {isTaken ? (
                          <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                            <Check className="w-3.5 h-3.5" /> Taken at {med.takenAt}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => triggerAlarm(med)}
                              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-700 transition"
                              title="Preview Alarm"
                            >
                              <Bell className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleMarkTaken(med.id)}
                              className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 flex items-center gap-1 transition active:scale-95"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              Take
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────────── */}
        {/* TAB 2: ALL MEDICINES & STOCK MANAGEMENT */}
        {/* ─────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'medicines' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-emerald-400" />
                Medicine Master & Inventory Stock
              </h3>
              <button
                onClick={() => showToast('💡 Add Medicine modal ready for database linkage!')}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 shadow-md shadow-emerald-500/20 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Medicine
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredMedicines.map((med) => {
                const isLow = med.currentQty <= med.threshold;
                const estimatedDays = Math.floor(med.currentQty / (med.doseAmount || 1));

                return (
                  <div key={med.id} className="glass-card p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-base">{med.name}</h4>
                          {isLow && (
                            <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded border border-amber-500/30">
                              Low Stock
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          {med.brand} • Assigned to: <strong className="text-slate-300">{med.memberName}</strong>
                        </p>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                        {med.type}
                      </span>
                    </div>

                    {/* Stock Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Current Stock:</span>
                        <span className={`font-bold ${isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {med.currentQty} {med.unit} ({estimatedDays} days left)
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isLow ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, (med.currentQty / (med.threshold * 3)) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                      <span>Expiry: <strong className="text-slate-300">{med.expiryDate}</strong></span>
                      <button
                        onClick={() => {
                          setMedicines((prev) =>
                            prev.map((m) => (m.id === med.id ? { ...m, currentQty: m.currentQty + 10 } : m))
                          );
                          showToast(`📦 Restocked +10 units to ${med.name}`);
                        }}
                        className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Restock (+10)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────────── */}
        {/* TAB 3: SPECIALIZED INSULIN MODULE */}
        {/* ─────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'insulin' && (
          <div className="space-y-4">
            {/* Safety Disclaimer Banner */}
            <div className="p-3.5 bg-violet-950/40 border border-violet-500/40 rounded-2xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 space-y-1">
                <h4 className="font-bold text-violet-300">Safety & Medical Protocol Notice</h4>
                <p>
                  This module only tracks and reminds for already prescribed insulin doses. It never alters, increases, or recommends insulin dosage. Always follow your endocrinologist's exact prescription.
                </p>
              </div>
            </div>

            {medicines
              .filter((m) => m.isInsulin)
              .map((ins) => (
                <div key={ins.id} className="glass-card p-5 rounded-2xl border border-violet-500/30 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-violet-500/20 text-violet-400">
                          <Syringe className="w-5 h-5" />
                        </span>
                        <div>
                          <h4 className="text-lg font-bold text-white">{ins.name}</h4>
                          <p className="text-xs text-slate-400">{ins.insulinType} • {ins.memberName}</p>
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-violet-500/20 text-violet-300 text-xs font-bold rounded-lg border border-violet-500/30">
                      {ins.strength}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50">
                      <span className="text-slate-400 block text-[11px]">Prescribed Dose</span>
                      <span className="font-bold text-emerald-400 text-sm">{ins.doseAmount} Units</span>
                    </div>
                    <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50">
                      <span className="text-slate-400 block text-[11px]">Active Pen Stock</span>
                      <span className="font-bold text-amber-300 text-sm">{ins.currentQty} Pens left</span>
                    </div>
                    <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50">
                      <span className="text-slate-400 block text-[11px]">Opened Date</span>
                      <span className="font-semibold text-slate-200 text-sm">{ins.openedDate}</span>
                    </div>
                    <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50">
                      <span className="text-slate-400 block text-[11px]">Meal Relation</span>
                      <span className="font-semibold text-slate-200 text-sm">{ins.mealRelation}</span>
                    </div>
                  </div>

                  {ins.storageNote && (
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-300">
                      <strong className="text-cyan-400">Storage Note:</strong> {ins.storageNote}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMarkTaken(ins.id)}
                      className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                    >
                      <Check className="w-4 h-4" /> Record Insulin Injected
                    </button>
                    <button
                      onClick={() => triggerAlarm(ins)}
                      className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
                    >
                      Test Alert
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────────── */}
        {/* TAB 4: PHARMACY DIRECTORY & 1-TAP REORDER */}
        {/* ─────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'pharmacy' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-400" />
                Medical Stores & Instant Dial / WhatsApp
              </h3>
              <button
                onClick={() => showToast('💡 Add Medical Store modal ready!')}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 shadow-md shadow-emerald-500/20 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Store
              </button>
            </div>

            <div className="space-y-3">
              {INITIAL_PHARMACIES.map((store) => (
                <div key={store.id} className="glass-card p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-base">{store.name}</h4>
                        {store.isDefault && (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-md border border-emerald-500/30">
                            Default Pharmacy
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Contact: <strong className="text-slate-300">{store.contact}</strong>
                      </p>
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{store.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: 1-Tap Call & WhatsApp */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                    <a
                      href={`tel:${store.phone}`}
                      className="py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition active:scale-95"
                    >
                      <Phone className="w-4 h-4" />
                      Call Store ({store.phone})
                    </a>

                    <a
                      href={generateWhatsAppReorder(store)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-green-900/30 transition active:scale-95"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp Reorder
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────────── */}
        {/* TAB 5: EXPENSE & MONTHLY ANALYTICS */}
        {/* ─────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Medicine Expense Monitor & Trends
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="glass-card p-4 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400">This Week</span>
                <p className="text-2xl font-extrabold text-white mt-1">₹ 850</p>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" /> -12% vs last week
                </span>
              </div>
              <div className="glass-card p-4 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400">This Month</span>
                <p className="text-2xl font-extrabold text-emerald-400 mt-1">₹ 3,420</p>
                <span className="text-[10px] text-slate-400 mt-1 block">Monthly Budget: ₹ 5,000</span>
              </div>
              <div className="glass-card p-4 rounded-2xl border border-slate-800 col-span-2 sm:col-span-1">
                <span className="text-xs text-slate-400">Monthly Average</span>
                <p className="text-2xl font-extrabold text-cyan-400 mt-1">₹ 3,150</p>
                <span className="text-[10px] text-slate-400 mt-1 block">Across 4 members</span>
              </div>
            </div>

            {/* Member Wise Expense Breakdown */}
            <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-sm font-bold text-slate-200">Expense Breakdown by Family Member</h4>
              <div className="space-y-2">
                {[
                  { name: 'Grandpa (Ramesh)', amount: '₹ 1,850', pct: 54, color: 'bg-amber-500' },
                  { name: 'Father (Rajesh)', amount: '₹ 820', pct: 24, color: 'bg-emerald-500' },
                  { name: 'Mother (Sunita)', amount: '₹ 450', pct: 13, color: 'bg-violet-500' },
                  { name: 'Self (Aarav)', amount: '₹ 300', pct: 9, color: 'bg-cyan-500' },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">{item.name}</span>
                      <span className="font-bold text-white">{item.amount} ({item.pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────────── */}
        {/* TAB 6: SETTINGS & MEAL TIMINGS */}
        {/* ─────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Household Meal Timings & Settings
            </h3>

            <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white">Central Meal Timings</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Reminders configured as 'Before Breakfast' or 'After Dinner' dynamically adjust from these values.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1">
                  <label className="text-xs text-slate-400 block font-medium">Breakfast Time</label>
                  <input
                    type="text"
                    value={mealTimes.breakfast}
                    onChange={(e) => setMealTimes({ ...mealTimes, breakfast: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-bold text-white"
                  />
                </div>
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1">
                  <label className="text-xs text-slate-400 block font-medium">Lunch Time</label>
                  <input
                    type="text"
                    value={mealTimes.lunch}
                    onChange={(e) => setMealTimes({ ...mealTimes, lunch: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-bold text-white"
                  />
                </div>
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1">
                  <label className="text-xs text-slate-400 block font-medium">Dinner Time</label>
                  <input
                    type="text"
                    value={mealTimes.dinner}
                    onChange={(e) => setMealTimes({ ...mealTimes, dinner: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-bold text-white"
                  />
                </div>
              </div>

              <button
                onClick={() => showToast('💾 Meal times updated! All meal-linked schedules recomputed.')}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition"
              >
                Save Household Meal Timings
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MOBILE BOTTOM NAVIGATION BAR */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#090d16]/95 backdrop-blur-xl border-t border-slate-800/90 px-3 py-2">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex flex-col items-center gap-1 transition ${
              activeTab === 'today' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-[10px]">Today</span>
          </button>

          <button
            onClick={() => setActiveTab('medicines')}
            className={`flex flex-col items-center gap-1 transition ${
              activeTab === 'medicines' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Pill className="w-5 h-5" />
            <span className="text-[10px]">Medicines</span>
          </button>

          <button
            onClick={() => setActiveTab('insulin')}
            className={`flex flex-col items-center gap-1 transition ${
              activeTab === 'insulin' ? 'text-violet-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Syringe className="w-5 h-5" />
            <span className="text-[10px]">Insulin</span>
          </button>

          <button
            onClick={() => setActiveTab('pharmacy')}
            className={`flex flex-col items-center gap-1 transition ${
              activeTab === 'pharmacy' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Phone className="w-5 h-5" />
            <span className="text-[10px]">Pharmacies</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex flex-col items-center gap-1 transition ${
              activeTab === 'expenses' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            <span className="text-[10px]">Expenses</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1 transition ${
              activeTab === 'settings' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-5 h-5" />
            <span className="text-[10px]">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
