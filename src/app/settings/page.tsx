'use client';

import React, { useState, useEffect } from 'react';
import { Sliders, Clock, Bell, Home, Shield, Save, Volume2, AlertTriangle, Users, Phone, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { alarmEngine } from '@/utils/audioAlarm';

export default function SettingsPage() {
  const { user } = useAuth();
  const [householdName, setHouseholdName] = useState('');
  const [breakfastTime, setBreakfastTime] = useState('08:00 AM');
  const [lunchTime, setLunchTime] = useState('01:30 PM');
  const [dinnerTime, setDinnerTime] = useState('08:30 PM');
  const [defaultBeforeOffset, setDefaultBeforeOffset] = useState(30);
  const [defaultAfterOffset, setDefaultAfterOffset] = useState(15);
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [defaultPharmacyId, setDefaultPharmacyId] = useState('');
  const [audioVolume, setAudioVolume] = useState('loud');
  const [snoozeMinutes, setSnoozeMinutes] = useState(10);
  const [expiryAlertWindow, setExpiryAlertWindow] = useState(30);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };
  const setToastMessage = (msg: string | null) => setToast(msg);

  const loadData = async () => {
    try {
      const [hRes, phRes] = await Promise.all([
        fetch(`/api/household${user?.householdId ? `?id=${user.householdId}` : ''}`),
        fetch(`/api/pharmacies${user?.householdId ? `?householdId=${user.householdId}` : ''}`),
      ]);

      const hData = await hRes.json();
      const phData = await phRes.json();

      if (hData.success && hData.household) {
        setHouseholdName(hData.household.name || '');
        if (hData.household.mealSettings) {
          setBreakfastTime(hData.household.mealSettings.breakfastTime || '08:00 AM');
          setLunchTime(hData.household.mealSettings.lunchTime || '01:30 PM');
          setDinnerTime(hData.household.mealSettings.dinnerTime || '08:30 PM');
          setDefaultBeforeOffset(hData.household.mealSettings.defaultBeforeOffset ?? 30);
          setDefaultAfterOffset(hData.household.mealSettings.defaultAfterOffset ?? 15);
        }
      }

      if (phData.success) {
        const phList = phData.pharmacies || [];
        setPharmacies(phList);
        const def = phList.find((p: any) => p.isDefault);
        if (def) setDefaultPharmacyId(def.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/household', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user?.householdId,
          name: householdName,
          mealSettings: {
            breakfastTime,
            lunchTime,
            dinnerTime,
            defaultBeforeOffset,
            defaultAfterOffset,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        // If default pharmacy was selected, update it
        if (defaultPharmacyId) {
          await fetch('/api/pharmacies', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: defaultPharmacyId,
              householdId: user?.householdId,
              isDefault: true,
            }),
          });
        }

        showToast('✅ Settings & Meal Timings saved successfully!');
      } else {
        showToast('⚠️ Error updating settings');
      }
    } catch (e) {
      showToast('⚠️ Network error saving settings');
    }
  };

  const handleTestAlarm = () => {
    alarmEngine.playMedicalChimeSequence();
    showToast('🔊 Playing professional acoustic medical chime');
  };

  return (
    <AppLayout>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-11/12 bg-[#1c2a38] text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold animate-bounce flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#10847e]" />
          <span>{toast}</span>
        </div>
      )}

      <div className="space-y-5">
        <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0]">
          <h1 className="text-xl font-black text-[#1c2a38] flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#10847e]" /> Application & Household Settings
          </h1>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Configure meal schedules, alarm volume, notification preferences, and default pharmacy (Spec §20)
          </p>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-5">
          {/* Household Profile */}
          <div className="medical-card p-5 bg-white space-y-4">
            <h3 className="font-black text-[#1c2a38] text-sm flex items-center gap-2">
              <Home className="w-4 h-4 text-[#10847e]" /> Household Profile
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-[#374151] block mb-1">Household / Family Name</label>
                <input
                  type="text"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-bold focus:border-[#10847e] outline-hidden"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="font-bold text-[#1c2a38] block">Family Members</span>
                  <span className="text-[11px] text-[#6b7280]">Manage profiles, relationships & health notes</span>
                </div>
                <Link
                  href="/family"
                  className="px-3 py-1.5 bg-[#10847e] text-white text-xs font-bold rounded-lg flex items-center gap-1"
                >
                  <Users className="w-3.5 h-3.5" /> Manage
                </Link>
              </div>
            </div>
          </div>

          {/* Meal Timings Configuration (Spec §6 & §20) */}
          <div className="medical-card p-5 bg-white space-y-4">
            <h3 className="font-black text-[#1c2a38] text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#10847e]" /> Household Meal Timings (Anchor for Dose Schedules)
            </h3>
            <p className="text-xs text-[#6b7280]">
              Medicines scheduled as "Before Food" or "After Food" calculate their exact notification time based on these family meal anchors.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-bold text-[#374151] block mb-1">🍳 Breakfast Time</label>
                <input
                  type="text"
                  value={breakfastTime}
                  onChange={(e) => setBreakfastTime(e.target.value)}
                  placeholder="08:00 AM"
                  className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-bold focus:border-[#10847e] outline-hidden"
                />
              </div>
              <div>
                <label className="font-bold text-[#374151] block mb-1">🍲 Lunch Time</label>
                <input
                  type="text"
                  value={lunchTime}
                  onChange={(e) => setLunchTime(e.target.value)}
                  placeholder="01:30 PM"
                  className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-bold focus:border-[#10847e] outline-hidden"
                />
              </div>
              <div>
                <label className="font-bold text-[#374151] block mb-1">🍛 Dinner Time</label>
                <input
                  type="text"
                  value={dinnerTime}
                  onChange={(e) => setDinnerTime(e.target.value)}
                  placeholder="08:30 PM"
                  className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-bold focus:border-[#10847e] outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
              <div>
                <label className="font-bold text-[#374151] block mb-1">Default "Before Food" Offset (Minutes)</label>
                <select
                  value={defaultBeforeOffset}
                  onChange={(e) => setDefaultBeforeOffset(Number(e.target.value))}
                  className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:border-[#10847e] outline-hidden"
                >
                  {[15, 30, 45, 60].map((m) => (
                    <option key={m} value={m}>
                      {m} Minutes before meal
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-[#374151] block mb-1">Default "After Food" Offset (Minutes)</label>
                <select
                  value={defaultAfterOffset}
                  onChange={(e) => setDefaultAfterOffset(Number(e.target.value))}
                  className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:border-[#10847e] outline-hidden"
                >
                  {[0, 5, 10, 15, 30].map((m) => (
                    <option key={m} value={m}>
                      {m === 0 ? 'Immediately after meal' : `${m} Minutes after meal`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Alarm & Notification Settings (Spec §17) */}
          <div className="medical-card p-5 bg-white space-y-4">
            <h3 className="font-black text-[#1c2a38] text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#10847e]" /> Alarm & Loud Volume Reminders (Web Audio Engine)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-[#374151] block mb-1">Snooze Duration</label>
                <select
                  value={snoozeMinutes}
                  onChange={(e) => setSnoozeMinutes(Number(e.target.value))}
                  className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:border-[#10847e] outline-hidden"
                >
                  {[5, 10, 15, 20, 30].map((min) => (
                    <option key={min} value={min}>
                      {min} Minutes
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#374151] block mb-1">Expiry Alert Advance Notice</label>
                <select
                  value={expiryAlertWindow}
                  onChange={(e) => setExpiryAlertWindow(Number(e.target.value))}
                  className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:border-[#10847e] outline-hidden"
                >
                  {[7, 15, 30, 60].map((days) => (
                    <option key={days} value={days}>
                      {days} Days before expiration date
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-5 h-5 text-[#ef4f5f]" />
                <div>
                  <span className="font-bold text-[#1c2a38] text-xs block">High-Gain Medical Alarm Chime</span>
                  <span className="text-[11px] text-[#6b7280]">Gain booster with 2.0x gain multiplier for maximum audibility</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleTestAlarm}
                className="px-3 py-1.5 bg-[#ef4f5f] hover:bg-[#dc3545] text-white text-xs font-bold rounded-lg transition active:scale-95"
              >
                Test Sound
              </button>
            </div>
          </div>

          {/* Pharmacy & Reorder Settings (Spec §10 & §20) */}
          <div className="medical-card p-5 bg-white space-y-4">
            <h3 className="font-black text-[#1c2a38] text-sm flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#10847e]" /> Default Pharmacy & Reorder Preferences
            </h3>

            <div className="text-xs">
              <label className="font-bold text-[#374151] block mb-1">Default Medical Store for 1-Tap Refills</label>
              <select
                value={defaultPharmacyId}
                onChange={(e) => setDefaultPharmacyId(e.target.value)}
                className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:border-[#10847e] outline-hidden"
              >
                <option value="">— Select default store —</option>
                {pharmacies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.phoneNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-3 bg-[#10847e] hover:bg-[#0d6e69] text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save All Settings
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
