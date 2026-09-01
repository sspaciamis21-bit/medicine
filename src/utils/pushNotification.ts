// Client-Side Push Notification Registration & Subscription Manager

import { VAPID_PUBLIC_KEY } from '@/lib/vapidKeys';

export function isPushNotificationSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPushNotifications(
  householdId?: string,
  username?: string,
  sendWelcome: boolean = true
): Promise<{ success: boolean; message?: string; error?: string }> {
  if (!isPushNotificationSupported()) {
    return { success: false, error: 'Push notifications not supported on this browser' };
  }

  try {
    // 1. Request user permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Notification permission was denied' };
    }

    // 2. Ensure service worker is ready
    const registration = await navigator.serviceWorker.ready;

    // 3. Check existing subscription or create new
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as any,
      });
    }

    // 4. Send subscription to server
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        householdId,
        username,
        subscription: subscription.toJSON(),
        sendWelcome,
      }),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('Failed to subscribe to push:', err);
    return { success: false, error: err.message };
  }
}
