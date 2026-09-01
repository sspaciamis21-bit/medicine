'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Clock, 
  Bell, 
  Home, 
  Save, 
  Volume2, 
  Users, 
  Phone, 
  CheckCircle2, 
  Smartphone, 
  Play, 
  Music, 
  Download, 
  Sparkles,
  Send,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { alarmEngine, AVAILABLE_CHIME_TONES, ChimeToneId } from '@/utils/audioAlarm';
import { subscribeToPushNotifications } from '@/utils/pushNotification';

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
  const [selectedTone, setSelectedTone] = useState<ChimeToneId>('hospital_bell');
  const [snoozeMinutes, setSnoozeMinutes] = useState(10);
  const [expiryAlertWindow, setExpiryAlertWindow] = useState(30);
  const [toast, setToast] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [testingPush, setTestingPush] = useState(false);
  const [pushStatus, setPushStatus] = useState<string>('checking');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    try {
      setSelectedTone(alarmEngine.getSelectedTone());

      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPushStatus(Notification.permission);
      }

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

    if (typeof window !== 'undefined') {
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
        setIsInstalled(true);
      }

      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }
  }, [user]);

  const handleSelectTone = (toneId: ChimeToneId) => {
    setSelectedTone(toneId);
    alarmEngine.setSelectedTone(toneId);
    alarmEngine.playTone(toneId);
    const toneInfo = AVAILABLE_CHIME_TONES.find((t) => t.id === toneId);
    showToast(`🎵 Selected Tone: ${toneInfo?.name}`);
  };

  const handlePreviewTone = (e: React.MouseEvent, toneId: ChimeToneId) => {
    e.stopPropagation();
    alarmEngine.playTone(toneId);
  };

  const handleEnablePush = async () => {
    if (!user) return;
    showToast('⏳ Registering device for lock-screen push...');
    const res = await subscribeToPushNotifications(user.householdId, user.username, true);
    if (res.success) {
      setPushStatus('granted');
      showToast('🎉 Push Notifications enabled! A welcome push was sent to this device.');
    } else {
      showToast('⚠️ ' + (res.error || 'Failed to enable push notifications'));
    }
  };

  const handleSendTestPush = async () => {
    if (!user) return;
    setTestingPush(true);
    showToast('🚀 Registering device & sending test push...');

    try {
      // 1. First ensure push subscription is active on server
      const subRes = await subscribeToPushNotifications(user.householdId, user.username, false);
      if (!subRes.success) {
        showToast('⚠️ Could not register device: ' + (subRes.error || 'Permission issue'));
        setTestingPush(false);
        return;
      }

      // 2. Trigger test push endpoint
      const res = await fetch('/api/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, householdId: user.householdId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ Push sent! Lock your phone now to see the notification banner.');
      } else {
        showToast('⚠️ ' + (data.error || 'Could not send test push'));
      }
    } catch (e: any) {
      showToast('⚠️ Error sending test push: ' + e.message);
    } finally {
      setTestingPush(false);
    }
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        showToast('🎉 App installed successfully to your home screen!');
      }
      setDeferredPrompt(null);
    } else {
      showToast('💡 On Chrome: Tap browser menu (⋮) → "Install app" or "Add to Home screen"');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      alarmEngine.setSelectedTone(selectedTone);

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

        showToast('✅ Settings & Reminder Preferences Saved!');
      } else {
        showToast('⚠️ Error updating settings');
      }
    } catch (e) {
      showToast('⚠️ Network error saving settings');
    }
  };

  return (
    <AppLayout>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-11/12 bg-[#1c2a38] text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold animate-bounce flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#10847e] shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="space-y-5 max-w-4xl mx-auto">
        {/* Page Title */}
        <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0]">
          <h1 className="text-xl font-black text-[#1c2a38] flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#10847e]" /> Application & Household Settings
          </h1>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Configure meal schedules, choose reminder chime voices, enable lock-screen push notifications, and manage the app.
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
                  className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-bold focus:border-[#10847e] outline-hidden text-sm"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="font-bold text-[#1c2a38] block">Family Members</span>
                  <span className="text-[11px] text-[#6b7280]">Manage patient profiles & relations</span>
                </div>
                <Link
                  href="/family"
                  className="px-3.5 py-2 bg-[#10847e] hover:bg-[#0d6e69] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-xs"
                >
                  <Users className="w-3.5 h-3.5" /> Manage
                </Link>
              </div>
            </div>
          </div>

          {/* 4 Reminder Chime Tones / Voices */}
          <div className="medical-card p-5 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-[#1c2a38] text-sm flex items-center gap-2">
                  <Music className="w-4 h-4 text-[#10847e]" /> Reminder Sound & Chime Tone (4 Voices)
                </h3>
                <p className="text-xs text-[#6b7280] mt-0.5">
                  Choose your family&apos;s preferred acoustic tone for medicine reminders. Tap any tone to listen.
                </p>
              </div>
              <span className="px-2.5 py-1 bg-[#10847e]/10 text-[#10847e] text-[11px] font-extrabold rounded-full hidden sm:inline">
                Acoustic Synthesizer
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AVAILABLE_CHIME_TONES.map((tone) => {
                const isSelected = selectedTone === tone.id;
                return (
                  <div
                    key={tone.id}
                    onClick={() => handleSelectTone(tone.id)}
                    className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'border-[#10847e] bg-[#10847e]/5 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{tone.icon}</span>
                        <h4 className="font-extrabold text-xs text-[#1c2a38]">{tone.name}</h4>
                        {isSelected && (
                          <span className="px-1.5 py-0.5 bg-[#10847e] text-white text-[9px] font-black rounded-md">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#6b7280] leading-relaxed pr-2">
                        {tone.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handlePreviewTone(e, tone.id)}
                      className="p-2 bg-white hover:bg-[#10847e] text-[#10847e] hover:text-white border border-slate-200 rounded-xl transition shrink-0 active:scale-95 shadow-xs"
                      title="Preview Sound"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 🔔 Lock-Screen Push Notifications (When Chrome is Closed) */}
          <div className="medical-card p-5 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-[#1c2a38] text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#10847e]" /> Lock-Screen Push Reminders (When Chrome is Closed)
              </h3>
              {pushStatus === 'granted' ? (
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Push Active
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                  Permission Required
                </span>
              )}
            </div>

            <p className="text-xs text-[#6b7280]">
              Server-side Web Push sends reminder alerts directly to your phone/PC notification tray and lock screen (just like WhatsApp) even when Chrome is completely closed.
            </p>

            <div className="p-4 bg-linear-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1 text-xs">
                <p className="font-extrabold text-blue-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" /> Test Lock-Screen Push Notification
                </p>
                <p className="text-blue-700 text-[11px]">
                  Click the button below, then immediately minimize or close Chrome to see the notification drop down!
                </p>
              </div>

              <div className="flex items-center gap-2">
                {pushStatus !== 'granted' && (
                  <button
                    type="button"
                    onClick={handleEnablePush}
                    className="px-4 py-2.5 bg-[#10847e] hover:bg-[#0d6e69] text-white font-extrabold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    Enable Push
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSendTestPush}
                  disabled={testingPush}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  {testingPush ? 'Sending...' : 'Send Test Push'}
                </button>
              </div>
            </div>
          </div>

          {/* Meal Timings Configuration */}
          <div className="medical-card p-5 bg-white space-y-4">
            <h3 className="font-black text-[#1c2a38] text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#10847e]" /> Family Meal Timings (Routine Anchors)
            </h3>
            <p className="text-xs text-[#6b7280]">
              Medicines scheduled as &quot;Before Food&quot; or &quot;After Food&quot; calculate exact reminder times based on your household&apos;s daily meal routine.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-bold text-[#374151] block mb-1">🍳 Breakfast Time</label>
                <input
                  type="text"
                  value={breakfastTime}
                  onChange={(e) => setBreakfastTime(e.target.value)}
                  placeholder="08:00 AM"
                  className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-bold focus:border-[#10847e] outline-hidden text-sm"
                />
              </div>
              <div>
                <label className="font-bold text-[#374151] block mb-1">🍲 Lunch Time</label>
                <input
                  type="text"
                  value={lunchTime}
                  onChange={(e) => setLunchTime(e.target.value)}
                  placeholder="01:30 PM"
                  className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-bold focus:border-[#10847e] outline-hidden text-sm"
                />
              </div>
              <div>
                <label className="font-bold text-[#374151] block mb-1">🍛 Dinner Time</label>
                <input
                  type="text"
                  value={dinnerTime}
                  onChange={(e) => setDinnerTime(e.target.value)}
                  placeholder="08:30 PM"
                  className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-bold focus:border-[#10847e] outline-hidden text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
              <div>
                <label className="font-bold text-[#374151] block mb-1">Default &quot;Before Food&quot; Offset</label>
                <select
                  value={defaultBeforeOffset}
                  onChange={(e) => setDefaultBeforeOffset(Number(e.target.value))}
                  className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:border-[#10847e] outline-hidden text-sm"
                >
                  {[15, 30, 45, 60].map((m) => (
                    <option key={m} value={m}>
                      {m} Minutes before meal
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-[#374151] block mb-1">Default &quot;After Food&quot; Offset</label>
                <select
                  value={defaultAfterOffset}
                  onChange={(e) => setDefaultAfterOffset(Number(e.target.value))}
                  className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:border-[#10847e] outline-hidden text-sm"
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

          {/* Alarm & Snooze Settings */}
          <div className="medical-card p-5 bg-white space-y-4">
            <h3 className="font-black text-[#1c2a38] text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#10847e]" /> Alarm Snooze & Expiry Warnings
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-[#374151] block mb-1">Snooze Duration</label>
                <select
                  value={snoozeMinutes}
                  onChange={(e) => setSnoozeMinutes(Number(e.target.value))}
                  className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:border-[#10847e] outline-hidden text-sm"
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
                  className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:border-[#10847e] outline-hidden text-sm"
                >
                  {[7, 15, 30, 60].map((days) => (
                    <option key={days} value={days}>
                      {days} Days before expiration date
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pharmacy & Reorder Settings */}
          <div className="medical-card p-5 bg-white space-y-4">
            <h3 className="font-black text-[#1c2a38] text-sm flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#10847e]" /> Default Medical Store for 1-Tap Refills
            </h3>

            <div className="text-xs">
              <label className="font-bold text-[#374151] block mb-1">Medical Store for WhatsApp Orders</label>
              <select
                value={defaultPharmacyId}
                onChange={(e) => setDefaultPharmacyId(e.target.value)}
                className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:border-[#10847e] outline-hidden text-sm"
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

          {/* PWA & Mobile Home Screen Installation */}
          <div className="medical-card p-5 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-[#1c2a38] text-sm flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#10847e]" /> Mobile App & Home Screen Installation
              </h3>
              {isInstalled && (
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Installed on Device
                </span>
              )}
            </div>

            <div className="p-4 bg-linear-to-r from-teal-50 to-emerald-50 rounded-2xl border border-teal-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1 text-xs">
                <p className="font-extrabold text-[#1c2a38] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#10847e]" /> Install as Native Standalone App
                </p>
                <p className="text-[#4b5563]">
                  Get full-screen tracking, lock-screen notifications with action buttons (Mark Taken, Snooze), and 1-tap launch without opening Chrome.
                </p>
                <div className="text-[11px] text-[#10847e] font-semibold pt-1.5 space-y-0.5">
                  <p>📱 <strong>Android / Chrome:</strong> Tap the &quot;Install App Now&quot; button below, or tap browser menu (⋮) → &quot;Install App&quot;.</p>
                  <p>🍏 <strong>iPhone / iOS Safari:</strong> Tap the Share button (⎋) at the bottom → tap &quot;Add to Home Screen&quot; (+).</p>
                </div>
              </div>

              {!isInstalled && (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="px-4 py-2.5 bg-[#10847e] hover:bg-[#0d6e69] text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Install App Now
                </button>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3.5 bg-[#10847e] hover:bg-[#0d6e69] text-white font-black text-xs rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save All Settings & Tone
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
