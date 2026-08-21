'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register SW in both dev and prod so push notifications & offline features work everywhere.
      // In dev, the SW uses NetworkFirst so caching never interferes with hot-reload.
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((registration) => {
            console.log('TripWise SW registered with scope:', registration.scope);
          })
          .catch((err) => {
            console.warn('TripWise SW registration failed:', err);
          });
      });
    }
  }, []);

  return null;
}
