'use client';

import React, { useState, useEffect, useRef } from 'react';
import AlarmModal from './AlarmModal';
import { useAuth } from '@/context/AuthContext';
import { alarmEngine } from '@/utils/audioAlarm';

export default function GlobalReminderDaemon() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<any[]>([]);
  const [activeAlarmMed, setActiveAlarmMed] = useState<any>(null);
  const [isAlarmOpen, setIsAlarmOpen] = useState(false);

  // Track fired dose keys today
  const firedKeysRef = useRef<Set<string>>(new Set());
  const snoozedUntilRef = useRef<Map<string, number>>(new Map());

  // Listen for service worker notification click messages
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'NOTIFICATION_OPENED') {
          const medData = event.data.data;
          if (medData) {
            setActiveAlarmMed({
              id: medData.id,
              name: medData.medicine || 'Scheduled Medicine',
              doseAmount: 1,
              unit: 'Tablets',
              member: { name: medData.memberName || 'Family Member' },
              specificTime: medData.time,
              currentQuantity: 10,
            });
            setIsAlarmOpen(true);
            alarmEngine.startAlarmLoop();
          }
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);
      return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
    }
  }, []);

  // Request browser notification permission once on user gesture
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        const handleInteraction = () => {
          Notification.requestPermission();
          window.removeEventListener('click', handleInteraction);
        };
        window.addEventListener('click', handleInteraction);
      }
    }
  }, []);

  // Fetch medicines for current household
  const fetchMedicines = async () => {
    if (!user?.householdId) return;
    try {
      const res = await fetch(`/api/medicines?householdId=${user.householdId}`);
      const data = await res.json();
      if (data.success && data.medicines) {
        setMedicines(data.medicines);
      }
    } catch (e) {
      console.warn('Daemon fetch error:', e);
    }
  };

  useEffect(() => {
    fetchMedicines();
    const pollInterval = setInterval(fetchMedicines, 20000);
    return () => clearInterval(pollInterval);
  }, [user?.householdId]);

  const parseTimeToMinutes = (timeStr: string): number => {
    if (!timeStr) return -1;
    const clean = timeStr.trim();
    const match12 = clean.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match12) return -1;

    let h = parseInt(match12[1]);
    const m = parseInt(match12[2]);
    const ampm = match12[3] ? match12[3].toUpperCase() : null;

    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;

    return h * 60 + m;
  };

  // Check every 2 seconds for due reminders
  useEffect(() => {
    const checkSchedule = () => {
      if (isAlarmOpen || medicines.length === 0) return;

      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTotalMin = currentHours * 60 + currentMinutes;
      const todayDateStr = now.toISOString().split('T')[0];

      for (const med of medicines) {
        if (med.courseStartDate && todayDateStr < med.courseStartDate) continue;
        if (med.courseEndDate && todayDateStr > med.courseEndDate) continue;

        const schedules = med.schedules || [];
        for (const s of schedules) {
          const targetMin = parseTimeToMinutes(s.specificTime);
          if (targetMin < 0) continue;

          const doseKey = `${med.id}-${s.id || s.specificTime}-${todayDateStr}-${targetMin}`;

          const snoozeExpiry = snoozedUntilRef.current.get(med.id);
          if (snoozeExpiry && Date.now() < snoozeExpiry) {
            continue;
          }

          if (currentTotalMin === targetMin && !firedKeysRef.current.has(doseKey)) {
            firedKeysRef.current.add(doseKey);

            const memberName = med.member?.name || 'Family Member';
            const memberRelation = med.member?.relationship ? ` (${med.member.relationship})` : '';

            const alarmPayload = {
              id: med.id,
              name: med.name,
              strength: med.strength,
              specificTime: s.specificTime,
              doseAmount: s.doseAmount || 1,
              unit: med.unit || 'Tablets',
              member: med.member || { name: memberName, relationship: med.member?.relationship },
              mealRelation: s.mealRelation || 'Scheduled',
              mealType: s.mealType || 'Time',
              currentQuantity: med.currentQuantity,
              lowStockThreshold: med.lowStockThreshold || 5,
              instructions: med.instructions,
            };

            setActiveAlarmMed(alarmPayload);
            setIsAlarmOpen(true);

            // 1. Start synthesized alarm loop
            alarmEngine.startAlarmLoop();

            // 2. Fire system notification
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification(`🔔 Medicine Reminder: ${med.name}`, {
                  body: `👤 Patient: ${memberName}${memberRelation}\n💊 Medicine: ${med.name}${med.strength ? ' (' + med.strength + ')' : ''}\n⏰ Scheduled Time: ${s.specificTime}\n🥄 Dose: ${s.doseAmount || 1} ${med.unit || 'Tablets'}`,
                  icon: '/icon.svg',
                  badge: '/icon.svg',
                  tag: doseKey,
                  requireInteraction: true,
                });
              } catch (e) {}
            }

            break;
          }
        }
      }
    };

    const interval = setInterval(checkSchedule, 2000);
    return () => clearInterval(interval);
  }, [medicines, isAlarmOpen]);

  const handleTake = async (medId: string) => {
    setIsAlarmOpen(false);
    alarmEngine.stopAlarmLoop();
    alarmEngine.playLoudChime(1046.5, 0.3, 1.8);

    const med = medicines.find((m) => m.id === medId);
    if (!med) return;

    const newQty = Math.max(0, med.currentQuantity - (activeAlarmMed?.doseAmount || 1));
    try {
      await fetch('/api/medicines', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: medId, currentQuantity: newQty }),
      });

      await fetch('/api/dose-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicineId: medId,
          memberId: med.memberId,
          scheduledDateTime: new Date().toISOString(),
          status: 'taken',
        }),
      });
    } catch (e) {
      console.warn(e);
    }

    fetchMedicines();
  };

  const handleSnooze = (minutes = 10) => {
    setIsAlarmOpen(false);
    alarmEngine.stopAlarmLoop();
    if (activeAlarmMed) {
      snoozedUntilRef.current.set(activeAlarmMed.id, Date.now() + minutes * 60 * 1000);
    }
  };

  const handleSkip = async (medId: string) => {
    setIsAlarmOpen(false);
    alarmEngine.stopAlarmLoop();

    const med = medicines.find((m) => m.id === medId);
    if (!med) return;

    try {
      await fetch('/api/dose-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicineId: medId,
          memberId: med.memberId,
          scheduledDateTime: new Date().toISOString(),
          status: 'skipped',
        }),
      });
    } catch (e) {}
  };

  const handleDismiss = () => {
    setIsAlarmOpen(false);
    alarmEngine.stopAlarmLoop();
  };

  return (
    <AlarmModal
      isOpen={isAlarmOpen}
      medicine={activeAlarmMed}
      onTake={handleTake}
      onSnooze={handleSnooze}
      onSkip={handleSkip}
      onDismiss={handleDismiss}
    />
  );
}
