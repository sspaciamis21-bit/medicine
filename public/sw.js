// Service Worker Self-Purge & Unregister Script
// Unregisters legacy service workers and purges all stale caches across all client browsers

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.claim())
      .then(() => {
        return self.clients.matchAll({ type: 'window' }).then((clients) => {
          clients.forEach((client) => {
            if ('navigate' in client) {
              client.navigate(client.url);
            }
          });
        });
      })
  );
});
