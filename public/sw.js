// Service Worker for Family Medicine Tracker (Network-First Strategy)
const CACHE_NAME = 'medifamily-cache-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          // Delete ALL old caches
          return caches.delete(cache);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-First strategy ensures the latest deployed UI and live data are always fetched
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Skip caching for API requests and Next.js HMR
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/webpack-hmr')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match('/');
        });
      })
  );
});

// Push notification receiver for mobile lock screen & status tray
self.addEventListener('push', (event) => {
  let data = {
    title: 'Medicine Reminder',
    body: 'Time to take your scheduled dose!',
    medicine: 'Medicine',
    dose: '1 Dose',
    mealContext: 'Scheduled'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: `${data.body || 'Time for ' + data.medicine}\n${data.dose || ''} • ${data.mealContext || ''}`,
    icon: '/icon.svg',
    badge: '/icon.svg',
    vibrate: [400, 200, 400, 200, 800],
    tag: 'medicine-reminder-' + (data.id || Date.now()),
    renotify: true,
    requireInteraction: true,
    actions: [
      { action: 'taken', title: '✅ Mark as Taken' },
      { action: 'snooze', title: '⏰ Snooze 10m' },
      { action: 'skip', title: '❌ Skip' }
    ],
    data: data
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '🔔 Medicine Reminder', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;
  const urlToOpen = '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus().then((focusedClient) => {
            if (action) {
              focusedClient.postMessage({
                type: 'NOTIFICATION_ACTION',
                action: action,
                data: event.notification.data
              });
            }
          });
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
