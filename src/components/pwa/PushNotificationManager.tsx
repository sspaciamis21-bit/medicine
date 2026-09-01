'use client';

import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Sparkles, X, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { isPushNotificationSupported, subscribeToPushNotifications } from '@/utils/pushNotification';

export default function PushNotificationManager() {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (!isPushNotificationSupported() || !user) return;

    if (Notification.permission === 'granted') {
      // Quietly ensure active push subscription on server
      subscribeToPushNotifications(user.householdId, user.username, false)
        .then((res) => {
          if (res.success) setSubscribed(true);
        })
        .catch(() => {});
    } else if (Notification.permission === 'default') {
      // Check if user dismissed previously in this session
      const dismissed = sessionStorage.getItem('medifamily_push_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    }
  }, [user]);

  const handleEnablePush = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await subscribeToPushNotifications(user.householdId, user.username, true);
      if (result.success) {
        setSubscribed(true);
        setShowPrompt(false);
      } else {
        alert(result.error || 'Failed to enable push notifications');
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('medifamily_push_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="bg-linear-to-r from-teal-700 via-[#10847e] to-emerald-700 text-white px-4 py-2.5 shadow-md relative z-30 animate-fadeIn">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-white/20 rounded-xl shrink-0">
            <Bell className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <p className="font-extrabold flex items-center gap-1.5">
              Enable Phone & Lock-Screen Reminders
            </p>
            <p className="text-teal-100 text-[11px]">
              Receive medicine alarms directly on your device even when Chrome and the website are closed.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            onClick={handleEnablePush}
            disabled={loading}
            className="px-3.5 py-1.5 bg-white hover:bg-teal-50 text-[#10847e] font-black text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {loading ? 'Enabling...' : 'Enable Reminders'}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 text-teal-200 hover:text-white rounded-lg cursor-pointer"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
