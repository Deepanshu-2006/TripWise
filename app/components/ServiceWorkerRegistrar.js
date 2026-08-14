'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'development') {
        // Unregister service workers in development to prevent aggressive caching
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (let registration of registrations) {
            registration.unregister();
            console.log('TripWise SW unregistered in development mode.');
          }
        });
      } else {
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
    }
  }, []);

  return null;
}
