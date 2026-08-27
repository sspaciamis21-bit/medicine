'use client';

import React, { useEffect } from 'react';
import { AuthProvider } from '@/context/AuthContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Force purge any legacy service worker caches (e.g. medifamily-cache-v1)
      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => {
            if (key !== 'medifamily-cache-v4') {
              caches.delete(key);
            }
          });
        });
      }

      // 2. Register & update Service Worker with cache busting
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .register('/sw.js?v=4')
          .then((reg) => {
            reg.update();
          })
          .catch((err) => {
            console.warn('Service worker registration error:', err);
          });
      }

      // 3. Auto-recover from deployment ChunkLoadError
      const handleChunkError = (event: ErrorEvent) => {
        const msg = event.message || '';
        const isChunkError =
          msg.includes('Loading chunk') ||
          msg.includes('ChunkLoadError') ||
          msg.includes('Failed to fetch dynamically imported module');

        if (isChunkError) {
          const lastReload = sessionStorage.getItem('last_chunk_reload');
          const now = Date.now();
          if (!lastReload || now - Number(lastReload) > 6000) {
            sessionStorage.setItem('last_chunk_reload', String(now));
            window.location.reload();
          }
        }
      };

      window.addEventListener('error', handleChunkError);
      return () => window.removeEventListener('error', handleChunkError);
    }
  }, []);

  return <AuthProvider>{children}</AuthProvider>;
}
