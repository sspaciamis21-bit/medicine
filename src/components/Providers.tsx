'use client';

import React, { useEffect } from 'react';
import { AuthProvider } from '@/context/AuthContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Force purge ALL browser CacheStorage to eliminate stale cached HTML
      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => {
            caches.delete(key);
          });
        });
      }

      // 2. Unregister any lingering service workers (do NOT re-register)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          regs.forEach((reg) => reg.unregister());
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
          if (!lastReload || now - Number(lastReload) > 5000) {
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
