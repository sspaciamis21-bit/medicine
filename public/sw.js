// Service Worker for Family Medicine Tracker PWA
// Supports offline app shell, background push reminders, lock screen persistence, and audio

const CACHE_NAME = 'medifamily-app-v7';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/medicines',
  '/reminders',
  '/insulin',
  '/stock',
  '/pharmacy',
  '/expenses',
  '/history',
  '/settings',
  '/icon.svg',
  '/alarm.wav',
  '/manifest.json',
];

// Install: Cache static assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Pre-cache error (ignorable):', err);
      });
    })
  );
});

// Activate: Purge old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-First strategy
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/webpack-hmr')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && event.request.url.startsWith(self.location.origin)) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone).catch(() => {});
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;
        if (event.request.mode === 'navigate') {
          const fallback = await caches.match('/dashboard') || await caches.match('/');
          if (fallback) return fallback;
        }
        return new Response('Offline - Reconnect to internet to sync.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' },
        });
      })
  );
});

// Push notification receiver (Persistent Lock Screen Alert)
self.addEventListener('push', (event) => {
  let data = {
    title: '🔔 Medicine Reminder',
    body: 'Time to take your scheduled dose!',
    medicine: 'Medicine',
    dose: '1 Dose',
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || `Time to take ${data.medicine}`,
    icon: '/icon.svg',
    badge: '/icon.svg',
    sound: '/alarm.wav',
    silent: false,
    vibrate: [500, 200, 500, 200, 500, 200, 1000],
    tag: 'medicine-reminder-' + (data.id || Date.now()),
    renotify: true,
    requireInteraction: true, // Prevents automatic dismissal; keeps notification pinned
    actions: [
      { action: 'taken', title: '✅ Mark Taken' },
      { action: 'snooze', title: '⏰ Snooze 10m' },
      { action: 'skip', title: '⏭️ Skip' },
    ],
    data: data,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '🔔 Medicine Reminder', options)
  );
});

// Notification click & action handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;
  const data = event.notification.data || {};
  const urlToOpen = '/reminders';

  // Handle action buttons directly in background
  if (action === 'taken' && data.id) {
    event.waitUntil(
      fetch('/api/dose-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicineId: data.id,
          memberId: data.memberId,
          scheduledDateTime: new Date().toISOString(),
          status: 'taken',
        }),
      }).catch(() => {})
    );
  }

  // Open or focus app window and auto-play alarm chime
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus().then((focusedClient) => {
            focusedClient.postMessage({
              type: 'NOTIFICATION_OPENED',
              action: action,
              data: data,
            });
          });
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
