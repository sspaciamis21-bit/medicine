'use client';

import React, { useEffect } from 'react';
import { AuthProvider } from '@/context/AuthContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Register & auto-update Service Worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            reg.update();
          })
          .catch((err) => {
            console.warn('Service worker registration failed:', err);
          });
      }

      // 2. Auto-recover from deployment ChunkLoadError
      const handleChunkError = (event: ErrorEvent) => {
        const msg = event.message || '';
        const isChunkError =
          msg.includes('Loading chunk') ||
          msg.includes('ChunkLoadError') ||
          msg.includes('Failed to fetch dynamically imported module');

        if (isChunkError) {
          const lastReload = sessionStorage.getItem('last_chunk_reload');
          const now = Date.now();
          if (!lastReload || now - Number(lastReload) > 8000) {
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
