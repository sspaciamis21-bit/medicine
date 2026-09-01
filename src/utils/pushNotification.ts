// Client-Side Push Notification Registration & Subscription Manager
// Supports Android, iOS, Windows, Mac Chrome/Edge/Safari Web Push

import { VAPID_PUBLIC_KEY } from '@/lib/vapidConfig';

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
): Promise<{ success: boolean; message?: string; error?: string; subscription?: any }> {
  if (!isPushNotificationSupported()) {
    return { success: false, error: 'Web Push is not supported in this browser mode' };
  }

  try {
    // 1. Request notification permission
    let permission = Notification.permission;
    if (permission !== 'granted') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      return { 
        success: false, 
        error: 'Notification permission was denied. Please tap the lock icon 🔒 next to the website URL in Chrome and enable Notifications.' 
      };
    }

    // 2. Fetch active public VAPID key from server to guarantee sync
    let activeVapidKey = VAPID_PUBLIC_KEY;
    try {
      const keyRes = await fetch('/api/push/vapid-key');
      const keyData = await keyRes.json();
      if (keyData.success && keyData.publicKey) {
        activeVapidKey = keyData.publicKey;
      }
    } catch (e) {}

    // 3. Ensure service worker registration is ready
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      registration = await navigator.serviceWorker.register('/sw.js');
    }
    await navigator.serviceWorker.ready;

    // 4. Check existing subscription
    let subscription = await registration.pushManager.getSubscription();

    // If subscription exists, verify or refresh it
    if (subscription) {
      try {
        // Send existing subscription to server
        const res = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            householdId,
            username,
            subscription: subscription.toJSON(),
            sendWelcome: false,
          }),
        });
        const data = await res.json();
        if (data.success) {
          return { success: true, message: 'Device push subscription active', subscription: subscription.toJSON() };
        }
      } catch (e) {}

      // If refresh needed, unsubscribe and recreate
      try {
        await subscription.unsubscribe();
        subscription = null;
      } catch (e) {}
    }

    // 5. Create new subscription with current VAPID key
    const convertedVapidKey = urlBase64ToUint8Array(activeVapidKey);
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey as any,
    });

    const subJson = subscription.toJSON();

    // 6. Save subscription to database
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        householdId,
        username,
        subscription: subJson,
        sendWelcome,
      }),
    });

    const data = await res.json();
    return { ...data, subscription: subJson };
  } catch (err: any) {
    console.error('Failed to subscribe to push:', err);
    return { success: false, error: err.message || 'Push subscription failed' };
  }
}
