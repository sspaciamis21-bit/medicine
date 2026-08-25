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
  TrendingUp,
  MapPin,
  Check,
  X,
  UserPlus,
  ShoppingCart,
  Receipt,
  History,
  LogIn,
  LogOut,
  User,
  Trash2,
  ExternalLink,
  ChevronDown,
  Moon,
  Sun,
  ShieldCheck,
  Building2,
  FileText
} from 'lucide-react';
import { alarmEngine } from '@/utils/audioAlarm';

interface MedicineItem {
  id: string;
  householdId?: string;
  memberId: string;
  memberName?: string;
  name: string;
  brandName?: string;
  genericName?: string;
  formType: string;
  strength: string;
  unit: string;
  quantityPurchased?: number;
  currentQuantity: number;
  lowStockThreshold: number;
  doseAmount: number;
  doseUnit?: string;
  scheduleTime?: string;
  mealRelation?: string;
  mealType?: string;
  offsetMinutes?: number;
  offsetText?: string;
  expiryDate?: string;
  doctorName?: string;
  prescriptionDate?: string;
  instructions?: string;
  isInsulin: boolean;
  insulinType?: string;
  penOrVial?: string;
  insulinStorageNote?: string;
  openedDate?: string;
  status: 'pending' | 'taken' | 'skipped';
  takenAt?: string;
}

interface FamilyMemberItem {
  id: string;
  name: string;
  relationship: string;
  avatar: string;
  color: string;
  age?: number;
  notes?: string;
}

interface PharmacyItem {
  id: string;
  name: string;
  contactPerson?: string;
  phoneNumber: string;
  whatsappNumber?: string;
  address?: string;
  isDefault: boolean;
  notes?: string;
}

interface DoseHistoryItem {
  id: string;
  medicineName: string;
  memberName: string;
  scheduledDateTime: string;
  actualDateTime?: string;
  status: string;
  notes?: string;
}

interface PurchaseItem {
  id: string;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalAmount: number;
  paymentMode: string;
  purchaseDate: string;
  pharmacyName?: string;
  memberName?: string;
}

export default function FamilyMedicineApp() {
  // Theme & App State
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'today' | 'medicines' | 'insulin' | 'pharmacy' | 'expenses' | 'history' | 'settings'>('today');
  const [selectedMember, setSelectedMember] = useState<string>('all');
  
  // Auth state
  const [user, setUser] = useState<{ id: string; username: string; householdName: string } | null>({
    id: 'usr-1',
    username: 'Rajesh',
    householdName: 'Sharma Household',
  });
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ username: '', password: '', householdName: '', email: '' });

  // Data Collections
  const [household, setHousehold] = useState<any>(null);
  const [members, setMembers] = useState<FamilyMemberItem[]>([]);
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  const [pharmacies, setPharmacies] = useState<PharmacyItem[]>([]);
  const [doseHistory, setDoseHistory] = useState<DoseHistoryItem[]>([]);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [expenses, setExpenses] = useState<{
    thisWeekSpend: number;
    thisMonthSpend: number;
    lastMonthSpend: number;
    weeklyAvg: number;
    monthlyAvg: number;
  }>({
    thisWeekSpend: 2130,
    thisMonthSpend: 4280,
    lastMonthSpend: 3950,
    weeklyAvg: 1850,
    monthlyAvg: 4100,
  });

  // Modals state
  const [showAddMedModal, setShowAddMedModal] = useState<boolean>(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState<boolean>(false);
  const [showAddPharmacyModal, setShowAddPharmacyModal] = useState<boolean>(false);
  const [showReorderModal, setShowReorderModal] = useState<boolean>(false);
  const [showRecordPurchaseModal, setShowRecordPurchaseModal] = useState<boolean>(false);
  const [selectedReorderMeds, setSelectedReorderMeds] = useState<string[]>([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>('');

  // Audio Alarm State
  const [alarmActive, setAlarmActive] = useState<boolean>(false);
  const [activeAlarmMedicine, setActiveAlarmMedicine] = useState<MedicineItem | null>(null);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Household Meal Times
  const [mealTimes, setMealTimes] = useState({
    breakfast: '08:00 AM',
    lunch: '01:30 PM',
    dinner: '08:30 PM',
  });

  // Forms state
  const [newMed, setNewMed] = useState({
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
    doseAmount: 1,
    scheduleTime: '08:00 AM',
    mealRelation: 'After Food',
    mealType: 'Breakfast',
    offsetMinutes: 15,
    expiryDate: '',
    doctorName: '',
    prescriptionDate: '',
    instructions: '',
    isInsulin: false,
    insulinType: 'Long-Acting',
    penOrVial: 'Pen',
    insulinStorageNote: 'Store in refrigerator (2°C–8°C)',
  });

  const [newMember, setNewMember] = useState({
    name: '',
    relationship: 'Father',
    avatar: '👨',
    age: '',
    notes: '',
  });

  const [newPharmacy, setNewPharmacy] = useState({
    name: '',
    contactPerson: '',
    phoneNumber: '',
    whatsappNumber: '',
    address: '',
    isDefault: false,
    notes: '',
  });

  const [newPurchase, setNewPurchase] = useState({
    medicineName: '',
    medicineId: '',
    memberId: '',
    pharmacyId: '',
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    paymentMode: 'UPI',
    purchaseDate: new Date().toISOString().split('T')[0],
  });

  // Show Toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Load live data from MySQL API
  const loadData = async () => {
    try {
      // 1. Fetch Household & Members & Meal settings
      const resHousehold = await fetch('/api/household');
      const dataHousehold = await resHousehold.json();
      if (dataHousehold.success && dataHousehold.household) {
        setHousehold(dataHousehold.household);
        if (dataHousehold.household.members) {
          setMembers(
            dataHousehold.household.members.map((m: any) => ({
              id: m.id,
              name: m.name,
              relationship: m.relationship,
              avatar: m.avatar || '👤',
              color: m.color || 'bg-teal-50 text-teal-700 border border-teal-200',
              age: m.age,
              notes: m.notes,
            }))
          );
        }
        if (dataHousehold.household.mealSettings) {
          setMealTimes({
            breakfast: dataHousehold.household.mealSettings.breakfastTime || '08:00 AM',
            lunch: dataHousehold.household.mealSettings.lunchTime || '01:30 PM',
            dinner: dataHousehold.household.mealSettings.dinnerTime || '08:30 PM',
          });
        }
      }

      // 2. Fetch Medicines
      const resMeds = await fetch('/api/medicines');
      const dataMeds = await resMeds.json();
      if (dataMeds.success && dataMeds.medicines && dataMeds.medicines.length > 0) {
        setMedicines(
          dataMeds.medicines.map((m: any) => {
            const sched = m.schedules && m.schedules[0] ? m.schedules[0] : null;
            return {
              id: m.id,
              householdId: m.householdId,
              memberId: m.memberId,
              memberName: m.member?.name || 'General',
              name: m.name,
              brandName: m.brandName,
              genericName: m.genericName,
              formType: m.formType,
              strength: m.strength,
              unit: m.unit,
              currentQuantity: m.currentQuantity,
              lowStockThreshold: m.lowStockThreshold,
              doseAmount: sched ? sched.doseAmount : 1,
              scheduleTime: sched?.specificTime || '08:00 AM',
              mealRelation: sched?.mealRelation || 'After Food',
              mealType: sched?.mealType || 'Breakfast',
              offsetMinutes: sched?.offsetMinutes || 0,
              offsetText: sched ? `${sched.offsetMinutes}m ${sched.mealRelation}` : 'After Breakfast',
              expiryDate: m.expiryDate || '2027-06-30',
              doctorName: m.doctorName,
              prescriptionDate: m.prescriptionDate,
              instructions: m.instructions,
              isInsulin: m.isInsulin,
              insulinType: m.insulinType,
              penOrVial: m.penOrVial,
              insulinStorageNote: m.insulinStorageNote,
              openedDate: m.openedDate,
              status: 'pending',
            };
          })
        );
      }

      // 3. Fetch Pharmacies
      const resPharm = await fetch('/api/pharmacies');
      const dataPharm = await resPharm.json();
      if (dataPharm.success && dataPharm.pharmacies && dataPharm.pharmacies.length > 0) {
        setPharmacies(dataPharm.pharmacies);
        const defaultP = dataPharm.pharmacies.find((p: any) => p.isDefault) || dataPharm.pharmacies[0];
        if (defaultP) setSelectedPharmacyId(defaultP.id);
      }

      // 4. Fetch Dose History
      const resHist = await fetch('/api/dose-history');
      const dataHist = await resHist.json();
      if (dataHist.success && dataHist.history) {
        setDoseHistory(
          dataHist.history.map((h: any) => ({
            id: h.id,
            medicineName: h.medicine?.name || 'Medicine',
            memberName: h.member?.name || 'Family Member',
            scheduledDateTime: h.scheduledDateTime,
            actualDateTime: h.actualDateTime,
            status: h.status,
            notes: h.notes,
          }))
        );
      }

      // 5. Fetch Purchases & Expenses
      const resPurchases = await fetch('/api/purchases');
      const dataPurchases = await resPurchases.json();
      if (dataPurchases.success && dataPurchases.purchases) {
        setPurchases(
          dataPurchases.purchases.map((p: any) => ({
            id: p.id,
            medicineName: p.medicineName,
            quantity: p.quantity,
            unitPrice: p.unitPrice,
            discount: p.discount,
            totalAmount: p.totalAmount,
            paymentMode: p.paymentMode,
            purchaseDate: p.purchaseDate,
            pharmacyName: p.pharmacy?.name,
            memberName: p.member?.name,
          }))
        );
      }

      const resExp = await fetch('/api/expenses');
      const dataExp = await resExp.json();
      if (dataExp.success && dataExp.metrics) {
        setExpenses(dataExp.metrics);
      }
    } catch (e) {
      console.log('API sync notice:', e);
    }
  };

  useEffect(() => {
    loadData();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => console.log('SW:', err));
    }
  }, []);

  // Trigger high-volume alarm test or real reminder
  const triggerAlarm = (med?: MedicineItem) => {
    const target = med || medicines[0];
    if (!target) return;
    setActiveAlarmMedicine(target);
    setAlarmActive(true);
    if (alarmEngine && audioEnabled) {
      alarmEngine.startAlarmLoop();
    }
  };

  // Dismiss / stop alarm
  const dismissAlarm = () => {
    setAlarmActive(false);
    if (alarmEngine) {
      alarmEngine.stopAlarmLoop();
    }
  };

  // Mark as Taken
  const handleMarkTaken = async (medId: string) => {
    const targetMed = medicines.find((m) => m.id === medId);
    if (!targetMed) return;

    // Optimistic UI update
    setMedicines((prev) =>
      prev.map((m) => {
        if (m.id === medId) {
          const newQty = Math.max(0, m.currentQuantity - (m.isInsulin ? 1 : m.doseAmount));
          return {
            ...m,
            currentQuantity: newQty,
            status: 'taken',
            takenAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        }
        return m;
      })
    );

    // Play affirmation sound
    if (alarmEngine && audioEnabled) {
      alarmEngine.playLoudChime(1046.5, 0.3, 1.6);
    }

    dismissAlarm();
    showToast(`✅ Dose marked as TAKEN! ${targetMed.name} stock decremented.`);

    // Persist to MySQL via API
    try {
      await fetch('/api/dose-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicineId: targetMed.id,
          memberId: targetMed.memberId,
          scheduledDateTime: new Date().toISOString(),
          status: 'taken',
        }),
      });
      loadData();
    } catch (e) {
      console.log('Error logging dose:', e);
    }
  };

  // Handle Snooze
  const handleSnooze = (minutes: number = 10) => {
    dismissAlarm();
    showToast(`⏰ Alarm snoozed for ${minutes} minutes. Will ring loudly again!`);
  };

  // Handle Skip
  const handleSkip = async (medId: string) => {
    const targetMed = medicines.find((m) => m.id === medId);
    if (!targetMed) return;

    setMedicines((prev) =>
      prev.map((m) => (m.id === medId ? { ...m, status: 'skipped' } : m))
    );
    dismissAlarm();
    showToast('⏭️ Dose marked as SKIPPED. Stock remains unchanged.');

    try {
      await fetch('/api/dose-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicineId: targetMed.id,
          memberId: targetMed.memberId,
          scheduledDateTime: new Date().toISOString(),
          status: 'skipped',
        }),
      });
    } catch (e) {}
  };

  // Handle Add Medicine Submit
  const handleAddMedicineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMed.name) {
      showToast('⚠️ Please enter medicine name');
      return;
    }
    const targetMemberId = newMed.memberId || (members[0] ? members[0].id : 'general');
    const targetHouseholdId = household?.id || 'household-1';

    try {
      const res = await fetch('/api/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          householdId: targetHouseholdId,
          memberId: targetMemberId,
          name: newMed.name,
          brandName: newMed.brandName,
          genericName: newMed.genericName,
          formType: newMed.formType,
          strength: newMed.strength || '500 mg',
          unit: newMed.unit,
          quantityPurchased: newMed.quantityPurchased,
          currentQuantity: newMed.currentQuantity,
          lowStockThreshold: newMed.lowStockThreshold,
          expiryDate: newMed.expiryDate || '2027-12-31',
          doctorName: newMed.doctorName,
          prescriptionDate: newMed.prescriptionDate,
          instructions: newMed.instructions,
          isInsulin: newMed.isInsulin,
          insulinType: newMed.insulinType,
          penOrVial: newMed.penOrVial,
          insulinStorageNote: newMed.insulinStorageNote,
          schedules: [
            {
              frequencyType: 'daily',
              specificTime: newMed.scheduleTime,
              mealRelation: newMed.mealRelation,
              mealType: newMed.mealType,
              offsetMinutes: newMed.offsetMinutes,
              doseAmount: newMed.doseAmount,
            },
          ],
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`🎉 Medicine "${newMed.name}" added successfully!`);
        setShowAddMedModal(false);
        setNewMed({
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
          doseAmount: 1,
          scheduleTime: '08:00 AM',
          mealRelation: 'After Food',
          mealType: 'Breakfast',
          offsetMinutes: 15,
          expiryDate: '',
          doctorName: '',
          prescriptionDate: '',
          instructions: '',
          isInsulin: false,
          insulinType: 'Long-Acting',
          penOrVial: 'Pen',
          insulinStorageNote: 'Store in refrigerator (2°C–8°C)',
        });
        loadData();
      } else {
        showToast(`⚠️ ${data.error}`);
      }
    } catch (err: any) {
      showToast('Error saving medicine');
    }
  };

  // Handle Add Member Submit
  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name) {
      showToast('⚠️ Please enter member name');
      return;
    }
    const targetHouseholdId = household?.id || 'household-1';

    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          householdId: targetHouseholdId,
          name: newMember.name,
          relationship: newMember.relationship,
          avatar: newMember.avatar,
          age: newMember.age,
          notes: newMember.notes,
          color: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`👤 Family member "${newMember.name}" added!`);
        setShowAddMemberModal(false);
        setNewMember({ name: '', relationship: 'Father', avatar: '👨', age: '', notes: '' });
        loadData();
      }
    } catch (e) {
      showToast('Error adding member');
    }
  };

  // Handle Add Pharmacy Submit
  const handleAddPharmacySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPharmacy.name || !newPharmacy.phoneNumber) {
      showToast('⚠️ Name and phone number are required');
      return;
    }
    const targetHouseholdId = household?.id || 'household-1';

    try {
      const res = await fetch('/api/pharmacies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          householdId: targetHouseholdId,
          ...newPharmacy,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`🏥 Pharmacy "${newPharmacy.name}" added!`);
        setShowAddPharmacyModal(false);
        setNewPharmacy({ name: '', contactPerson: '', phoneNumber: '', whatsappNumber: '', address: '', isDefault: false, notes: '' });
        loadData();
      }
    } catch (e) {
      showToast('Error adding pharmacy');
    }
  };

  // Handle Record Purchase Submit
  const handleRecordPurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPurchase.medicineName || !newPurchase.unitPrice) {
      showToast('⚠️ Please provide medicine name and price');
      return;
    }
    const targetHouseholdId = household?.id || 'household-1';

    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          householdId: targetHouseholdId,
          ...newPurchase,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`💰 Purchase recorded & stock updated!`);
        setShowRecordPurchaseModal(false);
        loadData();
      }
    } catch (e) {
      showToast('Error recording purchase');
    }
  };

  // Filtered lists
  const filteredMedicines = selectedMember === 'all'
    ? medicines
    : medicines.filter((m) => m.memberId === selectedMember);

  const lowStockMedicines = medicines.filter((m) => m.currentQuantity <= m.lowStockThreshold);

  // Generate WhatsApp message for Reorder
  const getSelectedPharmacy = () => {
    return pharmacies.find((p) => p.id === selectedPharmacyId) || pharmacies[0] || {
      name: 'Local Pharmacy',
      phoneNumber: '+919876543210',
      whatsappNumber: '+919876543210',
    };
  };

  const getWhatsAppReorderUrl = () => {
    const store = getSelectedPharmacy();
    const targetMeds = selectedReorderMeds.length > 0
      ? medicines.filter((m) => selectedReorderMeds.includes(m.id))
      : lowStockMedicines;

    const itemsText = targetMeds
      .map((m, idx) => `${idx + 1}. *${m.name}* (${m.brandName || m.strength}) - Need: 2 Packs [Patient: ${m.memberName}]`)
      .join('%0A');

    const message = `Hello ${store.name},%0APlease prepare a medicine refill for ${user?.householdName || 'our family'}:%0A%0A${itemsText}%0A%0APlease confirm delivery time. Thank you!`;
    const cleanPhone = (store.whatsappNumber || store.phoneNumber || '').replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}?text=${message}`;
  };

  return (
    <div className={`flex flex-col min-h-screen ${darkMode ? 'dark bg-[#0b1120] text-slate-100' : 'bg-slate-50 text-slate-900'} pb-24 transition-colors`}>
      
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* LOUD AUDIO ALARM FULLSCREEN MODAL */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {alarmActive && activeAlarmMedicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border-2 border-red-500 rounded-3xl p-6 shadow-2xl text-center animate-pulse-alarm">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-500/40 mb-3 mx-auto animate-bounce">
              <BellRing className="w-10 h-10" />
            </div>

            <div className="inline-block px-3 py-1 bg-red-100 dark:bg-red-500/30 text-red-700 dark:text-red-300 text-xs font-black rounded-full uppercase tracking-wider mb-2">
              🔊 High Volume Medicine Alarm
            </div>

            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {activeAlarmMedicine.name}
            </h2>
            <p className="text-teal-600 dark:text-teal-400 font-bold text-sm mt-0.5">
              {activeAlarmMedicine.memberName} • {activeAlarmMedicine.doseAmount} {activeAlarmMedicine.unit}
            </p>

            <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-left text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Meal Timing:</span>
                <span className="font-bold text-teal-700 dark:text-teal-300">{activeAlarmMedicine.mealRelation} ({activeAlarmMedicine.offsetText || 'Meal offset'})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Current Stock:</span>
                <span className={`font-bold ${activeAlarmMedicine.currentQuantity <= activeAlarmMedicine.lowStockThreshold ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}`}>
                  {activeAlarmMedicine.currentQuantity} {activeAlarmMedicine.unit} remaining
                </span>
              </div>
              {activeAlarmMedicine.instructions && (
                <div className="pt-1 text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-700">
                  <strong className="text-slate-700 dark:text-slate-200">Doctor's Note:</strong> {activeAlarmMedicine.instructions}
                </div>
              )}
            </div>

            <div className="mt-5 space-y-2.5">
              <button
                onClick={() => handleMarkTaken(activeAlarmMedicine.id)}
                className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-black text-lg rounded-2xl shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2 transition active:scale-95"
              >
                <CheckCircle2 className="w-6 h-6" />
                MARK AS TAKEN (Dose Done)
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleSnooze(10)}
                  className="py-3 bg-amber-50 dark:bg-slate-800 hover:bg-amber-100 text-amber-800 dark:text-amber-300 font-bold text-xs rounded-xl border border-amber-300 dark:border-amber-500/30 flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <Clock className="w-4 h-4" />
                  Snooze 10 Mins
                </button>
                <button
                  onClick={() => handleSkip(activeAlarmMedicine.id)}
                  className="py-3 bg-rose-50 dark:bg-slate-800 hover:bg-rose-100 text-rose-800 dark:text-rose-300 font-bold text-xs rounded-xl border border-rose-300 dark:border-rose-500/30 flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <X className="w-4 h-4" />
                  Skip Dose
                </button>
              </div>

              <button onClick={dismissAlarm} className="w-full text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 py-1">
                Stop Audio Chime & Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-11/12 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-teal-500/50 flex items-center gap-2.5 text-sm font-semibold animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* TOP HEADER & BRAND BAR */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 py-3 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center shadow-md shadow-teal-600/20 text-white">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-xl tracking-tight text-slate-900 dark:text-white">MediFamily</h1>
                <span className="px-2 py-0.5 bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 text-[10px] font-extrabold rounded-md border border-teal-200 dark:border-teal-700/50 uppercase tracking-wider">
                  PWA Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {user ? `${user.householdName || 'Sharma Household'} • ${members.length} Members` : 'Welcome to MediFamily'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition"
              title="Toggle Light/Dark Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => {
                const next = !audioEnabled;
                setAudioEnabled(next);
                showToast(next ? '🔊 Loud Audio Alarms Enabled' : '🔇 Audio Muted');
              }}
              className={`p-2.5 rounded-xl border transition ${
                audioEnabled
                  ? 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800'
                  : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
              }`}
              title="Audio Chime Setting"
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Test Alarm Button */}
            <button
              onClick={() => triggerAlarm(medicines[0])}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md shadow-red-600/20 transition active:scale-95"
            >
              <BellRing className="w-3.5 h-3.5 animate-pulse" />
              <span>Test Alarm</span>
            </button>

            {/* Auth / Login Button */}
            {user ? (
              <button
                onClick={() => {
                  setUser(null);
                  showToast('👋 Logged out successfully');
                }}
                className="p-2 rounded-xl text-slate-500 hover:text-red-600 dark:text-slate-400 transition"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1 px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                Login
              </button>
            )}
          </div>
        </div>

        {/* Family Member Switcher Pill Bar */}
        <div className="max-w-5xl mx-auto mt-3 overflow-x-auto hide-scrollbar flex items-center gap-2 pb-1">
          <button
            onClick={() => setSelectedMember('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition ${
              selectedMember === 'all'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <span>👨‍👩‍👧‍👦</span>
            <span>All Members ({medicines.length})</span>
          </button>

          {members.map((member) => {
            const isSelected = selectedMember === member.id;
            const medCount = medicines.filter((m) => m.memberId === member.id).length;
            return (
              <button
                key={member.id}
                onClick={() => setSelectedMember(member.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>{member.avatar}</span>
                <span>{member.name}</span>
                <span className="text-[10px] opacity-80">({medCount})</span>
              </button>
            );
          })}

          <button
            onClick={() => setShowAddMemberModal(true)}
            className="px-3 py-1.5 rounded-full text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 border border-dashed border-teal-400 flex items-center gap-1 shrink-0 hover:bg-teal-100 transition"
          >
            <Plus className="w-3 h-3" />
            <span>Add Member</span>
          </button>
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MAIN BODY CONTENT */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <main className="max-w-5xl w-full mx-auto px-4 pt-4 flex-1 space-y-4">
        
        {/* LOW STOCK BANNER ALERT (Sections 9 & 12 Spec) */}
        {lowStockMedicines.length > 0 && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                  Low Stock Alert ({lowStockMedicines.length} Medicines Need Refill)
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                  {lowStockMedicines.map((m) => `${m.name} (${m.currentQuantity} ${m.unit} left)`).join(', ')}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedReorderMeds(lowStockMedicines.map((m) => m.id));
                setShowReorderModal(true);
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shrink-0 flex items-center gap-1.5 shadow-sm transition active:scale-95"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              1-Tap Reorder
            </button>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────────── */}
        {/* TAB 1: TODAY'S DOSE TIMELINE & MEAL TIMINGS (Sections 5, 6, 15 Spec) */}
        {/* ─────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'today' && (
          <div className="space-y-4">
            {/* Quick KPI Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="medical-card p-3.5 rounded-2xl dark:bg-slate-900 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Scheduled Today</span>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{filteredMedicines.length} Doses</p>
              </div>
              <div className="medical-card p-3.5 rounded-2xl dark:bg-slate-900 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-400">Taken So Far</span>
                <p className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-0.5">
                  {filteredMedicines.filter((m) => m.status === 'taken').length} Done
                </p>
              </div>
              <div className="medical-card p-3.5 rounded-2xl dark:bg-slate-900 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">Pending Doses</span>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                  {filteredMedicines.filter((m) => m.status === 'pending').length} Left
                </p>
              </div>
            </div>

            {/* Schedule Section */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  Today's Medicine Schedule & Meal Links
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Breakfast: <strong>{mealTimes.breakfast}</strong> • Lunch: <strong>{mealTimes.lunch}</strong> • Dinner: <strong>{mealTimes.dinner}</strong>
                </span>
              </div>

              {filteredMedicines.map((med) => {
                const isTaken = med.status === 'taken';
                return (
                  <div
                    key={med.id}
                    className={`medical-card p-4 rounded-2xl dark:bg-slate-900 dark:border-slate-800 ${
                      isTaken ? 'bg-slate-50/70 dark:bg-slate-950/40 opacity-75' : 'hover:border-teal-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                          med.isInsulin
                            ? 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300'
                            : 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300'
                        }`}>
                          {med.isInsulin ? <Syringe className="w-5 h-5" /> : <Pill className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-slate-900 dark:text-white text-base">{med.name}</h4>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {med.memberName}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {med.strength} • Dose: <strong className="text-slate-800 dark:text-slate-200">{med.doseAmount} {med.unit}</strong>
                          </p>

                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-bold">
                              <Clock className="w-3 h-3" />
                              {med.scheduleTime} ({med.mealRelation})
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {med.offsetText || `${med.offsetMinutes}m offset`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {isTaken ? (
                          <div className="flex items-center gap-1 text-teal-700 dark:text-teal-400 text-xs font-bold bg-teal-50 dark:bg-teal-950/50 px-3 py-1.5 rounded-full border border-teal-200 dark:border-teal-800">
                            <Check className="w-3.5 h-3.5 stroke-[3]" /> Done at {med.takenAt || '08:00 AM'}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => triggerAlarm(med)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                              title="Ring Alarm"
                            >
                              <Bell className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleMarkTaken(med.id)}
                              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition active:scale-95"
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
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
        {/* TAB 2: MEDICINE MASTER & INVENTORY (Section 4 & 8 Spec) */}
        {/* ─────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'medicines' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <Pill className="w-5 h-5 text-teal-600" />
                  Medicine Master & Inventory Stock
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total {medicines.length} medicines tracked</p>
              </div>

              <button
                onClick={() => setShowAddMedModal(true)}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Add Medicine
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredMedicines.map((med) => {
                const isLow = med.currentQuantity <= med.lowStockThreshold;
                const estimatedDays = Math.floor(med.currentQuantity / (med.doseAmount || 1));

                return (
                  <div key={med.id} className="medical-card p-4 rounded-2xl dark:bg-slate-900 dark:border-slate-800 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 dark:text-white text-base">{med.name}</h4>
                          {isLow && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 text-[10px] font-black rounded-md">
                              Low Stock
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {med.brandName ? `${med.brandName} • ` : ''}Assigned to: <strong className="text-slate-700 dark:text-slate-200">{med.memberName}</strong>
                        </p>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {med.formType}
                      </span>
                    </div>

                    {/* Stock Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-500 dark:text-slate-400">Current Stock:</span>
                        <span className={`font-bold ${isLow ? 'text-amber-600 dark:text-amber-400' : 'text-teal-700 dark:text-teal-400'}`}>
                          {med.currentQuantity} {med.unit} ({estimatedDays} days supply left)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isLow ? 'bg-amber-500' : 'bg-teal-600'
                          }`}
                          style={{ width: `${Math.min(100, (med.currentQuantity / (med.lowStockThreshold * 3 || 15)) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>Expiry: <strong className="text-slate-700 dark:text-slate-200">{med.expiryDate || 'N/A'}</strong></span>
                      <button
                        onClick={() => {
                          setMedicines((prev) =>
                            prev.map((m) => (m.id === med.id ? { ...m, currentQuantity: m.currentQuantity + 10 } : m))
                          );
                          showToast(`📦 Restocked +10 units to ${med.name}`);
                        }}
                        className="text-teal-700 dark:text-teal-400 hover:underline font-bold flex items-center gap-1"
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
        {/* TAB 3: DEDICATED INSULIN MODULE (Section 7 Spec) */}
        {/* ─────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'insulin' && (
          <div className="space-y-4">
            {/* Safety Protocol Banner */}
            <div className="p-4 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/50 rounded-2xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-violet-700 dark:text-violet-400 shrink-0 mt-0.5" />
              <div className="text-xs text-violet-900 dark:text-violet-200 space-y-1">
                <h4 className="font-extrabold">Safety & Medical Protocol Notice</h4>
                <p className="text-violet-800 dark:text-violet-300">
                  This system only records and reminds for prescribed insulin doses. It never alters, increases, or recommends changing your insulin units. Always follow your endocrinologist's exact prescription.
                </p>
              </div>
            </div>

            {medicines.filter((m) => m.isInsulin).length === 0 ? (
              <div className="medical-card p-8 rounded-2xl text-center space-y-3 dark:bg-slate-900 dark:border-slate-800">
                <Syringe className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No active insulin records found</p>
                <button
                  onClick={() => {
                    setNewMed({ ...newMed, isInsulin: true, formType: 'Insulin' });
                    setShowAddMedModal(true);
                  }}
                  className="px-4 py-2 bg-violet-600 text-white font-bold text-xs rounded-xl"
                >
                  + Add Insulin Record
                </button>
              </div>
            ) : (
              medicines
                .filter((m) => m.isInsulin)
                .map((ins) => (
                  <div key={ins.id} className="medical-card p-5 rounded-2xl border-violet-200 dark:border-violet-800/50 dark:bg-slate-900 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="p-2.5 rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
                          <Syringe className="w-6 h-6" />
                        </span>
                        <div>
                          <h4 className="text-lg font-black text-slate-900 dark:text-white">{ins.name}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{ins.insulinType || 'Insulin'} • {ins.memberName}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300 text-xs font-bold rounded-lg">
                        {ins.strength}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium">Prescribed Dose</span>
                        <span className="font-black text-teal-700 dark:text-teal-400 text-sm">{ins.doseAmount} Units</span>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium">Current Stock</span>
                        <span className="font-black text-amber-700 dark:text-amber-400 text-sm">{ins.currentQuantity} Pens left</span>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium">Opened Date</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{ins.openedDate || 'Active'}</span>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium">Meal Link</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{ins.mealRelation}</span>
                      </div>
                    </div>

                    {ins.insulinStorageNote && (
                      <div className="p-3 bg-cyan-50 dark:bg-cyan-950/30 rounded-xl border border-cyan-200 dark:border-cyan-800/50 text-xs text-cyan-900 dark:text-cyan-200">
                        <strong>Storage Instruction:</strong> {ins.insulinStorageNote}
                      </div>
                    )}

                    <div className="flex gap-2.5">
                      <button
                        onClick={() => handleMarkTaken(ins.id)}
                        className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                      >
                        <Check className="w-4 h-4 stroke-[3]" /> Record Insulin Injected
                      </button>
                      <button
                        onClick={() => triggerAlarm(ins)}
                        className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition"
                      >
                        Test Alert
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────────── */}
        {/* TAB 4: PHARMACIES & 1-TAP CALL / REORDER (Sections 10, 11, 12 Spec) */}
        {/* ─────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'pharmacy' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <Phone className="w-5 h-5 text-teal-600" />
                  Medical Stores & 1-Tap Pharmacy Dial
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Save pharmacy contacts and dispatch WhatsApp refill lists</p>
              </div>

              <button
                onClick={() => setShowAddPharmacyModal(true)}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                Add Store
              </button>
            </div>

            <div className="space-y-3.5">
              {pharmacies.map((store) => (
                <div key={store.id} className="medical-card p-4 rounded-2xl dark:bg-slate-900 dark:border-slate-800 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base">{store.name}</h4>
                        {store.isDefault && (
                          <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 text-[10px] font-bold rounded-md border border-teal-200 dark:border-teal-800">
                            Preferred Pharmacy
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Contact Person: <strong className="text-slate-700 dark:text-slate-200">{store.contactPerson || 'Chemist'}</strong>
                      </p>
                      {store.address && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{store.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <a
                      href={`tel:${store.phoneNumber}`}
                      className="py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                    >
                      <Phone className="w-4 h-4" />
                      Call Store
                    </a>

                    <button
                      onClick={() => {
                        setSelectedPharmacyId(store.id);
                        setSelectedReorderMeds(lowStockMedicines.map((m) => m.id));
                        setShowReorderModal(true);
                      }}
                      className="py-3 bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp Reorder
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────────── */}
        {/* TAB 5: EXPENSE & MONTHLY ANALYTICS (Sections 13, 14 Spec) */}
        {/* ─────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-teal-600" />
                  Medicine Spending & Expense Dashboard
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Track weekly, monthly, and family member healthcare costs</p>
              </div>

              <button
                onClick={() => setShowRecordPurchaseModal(true)}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition"
              >
                <Receipt className="w-4 h-4" />
                Record Purchase
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="medical-card p-4 rounded-2xl dark:bg-slate-900 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">This Week</span>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">₹ {expenses.thisWeekSpend}</p>
                <span className="text-[10px] text-teal-600 font-bold flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" /> -8% vs last week
                </span>
              </div>
              <div className="medical-card p-4 rounded-2xl dark:bg-slate-900 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">This Month</span>
                <p className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">₹ {expenses.thisMonthSpend}</p>
                <span className="text-[10px] text-slate-500 mt-1 block font-medium">Monthly budget: ₹ 6,000</span>
              </div>
              <div className="medical-card p-4 rounded-2xl col-span-2 sm:col-span-1 dark:bg-slate-900 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Monthly Average</span>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">₹ {expenses.monthlyAvg}</p>
                <span className="text-[10px] text-slate-500 mt-1 block font-medium">Across {members.length} members</span>
              </div>
            </div>

            {/* Member Expense Breakdown */}
            <div className="medical-card p-5 rounded-2xl dark:bg-slate-900 dark:border-slate-800 space-y-3">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Expense Breakdown by Member</h4>
              <div className="space-y-2.5">
                {[
                  { name: 'Grandpa (Ramesh)', amount: '₹ 1,850', pct: 43, color: 'bg-amber-500' },
                  { name: 'Father (Rajesh)', amount: '₹ 1,280', pct: 30, color: 'bg-teal-600' },
                  { name: 'Mother (Sunita)', amount: '₹ 750', pct: 18, color: 'bg-violet-600' },
                  { name: 'Self (Aarav)', amount: '₹ 400', pct: 9, color: 'bg-cyan-600' },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                      <span className="text-slate-900 dark:text-white">{item.amount} ({item.pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Purchases List */}
            <div className="medical-card p-5 rounded-2xl dark:bg-slate-900 dark:border-slate-800 space-y-3">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Recent Purchases & Refill History</h4>
              <div className="space-y-2">
                {purchases.map((p) => (
                  <div key={p.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{p.medicineName}</span>
                      <p className="text-[11px] text-slate-500">{p.purchaseDate} • {p.paymentMode}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-teal-700 dark:text-teal-400">₹ {p.totalAmount}</span>
                      <p className="text-[10px] text-slate-400">Qty: {p.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────────── */}
        {/* TAB 6: MEDICINE HISTORY / ADHERENCE LOG (Section 16 Spec) */}
        {/* ─────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-teal-600" />
                Medicine Adherence & Dose History Log
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Full audit log of taken, missed, and skipped doses</p>
            </div>

            <div className="medical-card rounded-2xl overflow-hidden dark:bg-slate-900 dark:border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3.5">Medicine</th>
                      <th className="p-3.5">Family Member</th>
                      <th className="p-3.5">Scheduled / Actual Time</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {doseHistory.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-slate-400">
                          No dose history recorded yet. Doses will appear here when marked as Taken.
                        </td>
                      </tr>
                    ) : (
                      doseHistory.map((h) => (
                        <tr key={h.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          <td className="p-3.5 font-bold text-slate-900 dark:text-white">{h.medicineName}</td>
                          <td className="p-3.5 text-slate-600 dark:text-slate-300">{h.memberName}</td>
                          <td className="p-3.5 text-slate-500">{new Date(h.scheduledDateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              h.status === 'taken'
                                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                : h.status === 'skipped'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {h.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────────── */}
        {/* TAB 7: SETTINGS & MEAL TIMINGS (Sections 6, 20 Spec) */}
        {/* ─────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <h3 className="font-black text-slate-900 dark:text-white text-lg flex items-center gap-2">
              <Sliders className="w-5 h-5 text-teal-600" />
              Settings & Household Meal Timings
            </h3>

            {/* Meal Times Configuration */}
            <div className="medical-card p-5 rounded-2xl dark:bg-slate-900 dark:border-slate-800 space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Central Household Meal Timings</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Reminders configured as 'Before Breakfast' or 'After Dinner' automatically update when these values change.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">Breakfast Time</label>
                  <input
                    type="text"
                    value={mealTimes.breakfast}
                    onChange={(e) => setMealTimes({ ...mealTimes, breakfast: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-extrabold text-slate-900 dark:text-white"
                  />
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">Lunch Time</label>
                  <input
                    type="text"
                    value={mealTimes.lunch}
                    onChange={(e) => setMealTimes({ ...mealTimes, lunch: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-extrabold text-slate-900 dark:text-white"
                  />
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">Dinner Time</label>
                  <input
                    type="text"
                    value={mealTimes.dinner}
                    onChange={(e) => setMealTimes({ ...mealTimes, dinner: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-extrabold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                onClick={async () => {
                  try {
                    await fetch('/api/household', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        householdId: household?.id,
                        mealSettings: {
                          breakfastTime: mealTimes.breakfast,
                          lunchTime: mealTimes.lunch,
                          dinnerTime: mealTimes.dinner,
                        },
                      }),
                    });
                    showToast('💾 Household meal times saved! Schedules updated.');
                  } catch (e) {
                    showToast('Saved locally');
                  }
                }}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition active:scale-95"
              >
                Save Household Meal Timings
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* ADD MEDICINE FULL MODAL (Sections 4.1 & 4.2 Spec) */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {showAddMedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Pill className="w-5 h-5 text-teal-600" />
                Add New Medicine
              </h3>
              <button onClick={() => setShowAddMedModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMedicineSubmit} className="mt-4 space-y-4 text-xs">
              {/* Basic Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Medicine Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Metformin, Paracetamol, Lantus"
                    value={newMed.name}
                    onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Brand Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Glycomet SR, Calpol"
                    value={newMed.brandName}
                    onChange={(e) => setNewMed({ ...newMed, brandName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Family Member *</label>
                  <select
                    value={newMed.memberId}
                    onChange={(e) => setNewMed({ ...newMed, memberId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.relationship})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Form & Strength */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Form Type</label>
                  <select
                    value={newMed.formType}
                    onChange={(e) => {
                      const isIns = e.target.value === 'Insulin';
                      setNewMed({ ...newMed, formType: e.target.value, isInsulin: isIns, unit: isIns ? 'Pens' : 'Tablets' });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Insulin">Insulin</option>
                    <option value="Injection">Injection</option>
                    <option value="Drops">Drops</option>
                    <option value="Cream">Cream</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Strength</label>
                  <input
                    type="text"
                    placeholder="e.g. 500 mg, 100 IU"
                    value={newMed.strength}
                    onChange={(e) => setNewMed({ ...newMed, strength: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Unit</label>
                  <input
                    type="text"
                    value={newMed.unit}
                    onChange={(e) => setNewMed({ ...newMed, unit: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Stock & Threshold */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Current Stock</label>
                  <input
                    type="number"
                    value={newMed.currentQuantity}
                    onChange={(e) => setNewMed({ ...newMed, currentQuantity: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Low Alert At</label>
                  <input
                    type="number"
                    value={newMed.lowStockThreshold}
                    onChange={(e) => setNewMed({ ...newMed, lowStockThreshold: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold text-amber-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={newMed.expiryDate}
                    onChange={(e) => setNewMed({ ...newMed, expiryDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Meal & Schedule */}
              <div className="p-3 bg-teal-50/70 dark:bg-teal-950/40 rounded-2xl border border-teal-200 dark:border-teal-800/60 space-y-3">
                <span className="font-extrabold text-teal-900 dark:text-teal-200 block text-xs">
                  ⏰ Meal-Linked Reminder Schedule
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-medium text-slate-600 dark:text-slate-400 block mb-1">Relation</label>
                    <select
                      value={newMed.mealRelation}
                      onChange={(e) => setNewMed({ ...newMed, mealRelation: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs font-semibold"
                    >
                      <option value="Before Food">Before Food</option>
                      <option value="After Food">After Food</option>
                      <option value="With Food">With Food</option>
                      <option value="Empty Stomach">Empty Stomach</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-medium text-slate-600 dark:text-slate-400 block mb-1">Meal</label>
                    <select
                      value={newMed.mealType}
                      onChange={(e) => setNewMed({ ...newMed, mealType: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs font-semibold"
                    >
                      <option value="Breakfast">Breakfast</option>
                      <option value="Lunch">Lunch</option>
                      <option value="Dinner">Dinner</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-medium text-slate-600 dark:text-slate-400 block mb-1">Offset (Mins)</label>
                    <select
                      value={newMed.offsetMinutes}
                      onChange={(e) => setNewMed({ ...newMed, offsetMinutes: Number(e.target.value) })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs font-semibold"
                    >
                      <option value={0}>Immediately</option>
                      <option value={5}>5 mins</option>
                      <option value={10}>10 mins</option>
                      <option value={15}>15 mins</option>
                      <option value={30}>30 mins</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMedModal(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-2 py-3 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl shadow-md transition active:scale-95"
                >
                  Save Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* ADD MEMBER MODAL (Section 3 Spec) */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-black text-lg text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-teal-600" />
              Add Family Member
            </h3>

            <form onSubmit={handleAddMemberSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Member Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh, Sunita, Aarav"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Relationship</label>
                <select
                  value={newMember.relationship}
                  onChange={(e) => {
                    const rel = e.target.value;
                    let av = '👤';
                    if (rel === 'Grandparent') av = '👴';
                    if (rel === 'Father') av = '👨';
                    if (rel === 'Mother') av = '👩';
                    if (rel === 'Child') av = '👧';
                    if (rel === 'Self') av = '🧑';
                    setNewMember({ ...newMember, relationship: rel, avatar: av });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
                >
                  <option value="Grandparent">Grandparent 👴</option>
                  <option value="Father">Father 👨</option>
                  <option value="Mother">Mother 👩</option>
                  <option value="Self">Self 🧑</option>
                  <option value="Child">Child 👧</option>
                  <option value="Other">Other 👤</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Age (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 72"
                  value={newMember.age}
                  onChange={(e) => setNewMember({ ...newMember, age: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* REORDER WORKFLOW MODAL (Section 12 Spec) */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {showReorderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-600" />
                Pharmacy Refill & Reorder
              </h3>
              <button onClick={() => setShowReorderModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Select Pharmacy</label>
                <select
                  value={selectedPharmacyId}
                  onChange={(e) => setSelectedPharmacyId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold"
                >
                  {pharmacies.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.phoneNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Medicines to Reorder</label>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 border border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto">
                  {medicines.map((m) => {
                    const isChecked = selectedReorderMeds.includes(m.id);
                    return (
                      <label key={m.id} className="flex items-center gap-2 text-slate-800 dark:text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) setSelectedReorderMeds(selectedReorderMeds.filter((id) => id !== m.id));
                            else setSelectedReorderMeds([...selectedReorderMeds, m.id]);
                          }}
                          className="rounded text-teal-600"
                        />
                        <span className="font-semibold">{m.name}</span>
                        <span className="text-slate-400 text-[10px]">({m.currentQuantity} left)</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons: 1-Tap Call and WhatsApp */}
              <div className="space-y-2 pt-2">
                <a
                  href={getWhatsAppReorderUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-black rounded-xl flex items-center justify-center gap-2 shadow-sm transition active:scale-95 text-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  Send WhatsApp Reorder List
                </a>

                <a
                  href={`tel:${getSelectedPharmacy().phoneNumber}`}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-sm transition text-xs"
                >
                  <Phone className="w-4 h-4" />
                  Call Chemist Directly
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* RECORD PURCHASE MODAL (Section 13 Spec) */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {showRecordPurchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-black text-lg text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-teal-600" />
              Record Medicine Purchase
            </h3>

            <form onSubmit={handleRecordPurchaseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Medicine Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metformin 500mg"
                  value={newPurchase.medicineName}
                  onChange={(e) => setNewPurchase({ ...newPurchase, medicineName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Quantity</label>
                  <input
                    type="number"
                    value={newPurchase.quantity}
                    onChange={(e) => setNewPurchase({ ...newPurchase, quantity: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Total Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newPurchase.unitPrice}
                    onChange={(e) => setNewPurchase({ ...newPurchase, unitPrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold text-teal-700"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Payment Mode</label>
                <select
                  value={newPurchase.paymentMode}
                  onChange={(e) => setNewPurchase({ ...newPurchase, paymentMode: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
                >
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit/Debit Card">Credit/Debit Card</option>
                  <option value="Insurance">Insurance Claim</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRecordPurchaseModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl"
                >
                  Save & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MOBILE BOTTOM NAVIGATION BAR */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-3 py-2 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex flex-col items-center gap-1 transition ${
              activeTab === 'today' ? 'text-teal-700 dark:text-teal-400 font-black' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-[10px]">Today</span>
          </button>

          <button
            onClick={() => setActiveTab('medicines')}
            className={`flex flex-col items-center gap-1 transition ${
              activeTab === 'medicines' ? 'text-teal-700 dark:text-teal-400 font-black' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Pill className="w-5 h-5" />
            <span className="text-[10px]">Medicines</span>
          </button>

          <button
            onClick={() => setActiveTab('insulin')}
            className={`flex flex-col items-center gap-1 transition ${
              activeTab === 'insulin' ? 'text-violet-700 dark:text-violet-400 font-black' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Syringe className="w-5 h-5" />
            <span className="text-[10px]">Insulin</span>
          </button>

          <button
            onClick={() => setActiveTab('pharmacy')}
            className={`flex flex-col items-center gap-1 transition ${
              activeTab === 'pharmacy' ? 'text-teal-700 dark:text-teal-400 font-black' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Phone className="w-5 h-5" />
            <span className="text-[10px]">Pharmacies</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex flex-col items-center gap-1 transition ${
              activeTab === 'expenses' ? 'text-teal-700 dark:text-teal-400 font-black' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            <span className="text-[10px]">Expenses</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center gap-1 transition ${
              activeTab === 'history' ? 'text-teal-700 dark:text-teal-400 font-black' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="text-[10px]">History</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1 transition ${
              activeTab === 'settings' ? 'text-teal-700 dark:text-teal-400 font-black' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
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
