'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((registration) => {
            console.log('TripWise SW registered successfully with scope:', registration.scope);
          })
          .catch((err) => {
            console.warn('TripWise SW registration failed:', err);
          });
      });
    }
  }, []);

  return null;
}
