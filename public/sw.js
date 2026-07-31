/**
 * TripWise Progressive Web App (PWA) Service Worker
 * Serves app shell, itinerary data, emergency info, and map/media assets offline.
 */

const CACHE_VERSION = 'tripwise-v1';
const STATIC_CACHE = `tw-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `tw-dynamic-${CACHE_VERSION}`;
const MEDIA_CACHE = 'tripwise-media-v1';
const TILE_CACHE = 'tripwise-tiles-v1';

// Essential static app shell assets to precache immediately
const PRECACHE_ASSETS = [
  '/',
  '/itinerary',
  '/community',
  '/destinations',
  '/manifest.json',
  '/logo.png',
  '/favicon.ico'
];

// Install Event — Precache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[TripWise SW] Precaching app shell assets');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[TripWise SW] Pre-cache partial failure:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event — Clean up old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => {
          return key.startsWith('tw-') && key !== STATIC_CACHE && key !== DYNAMIC_CACHE;
        }).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event — Offline Caching Strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests or browser extensions
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) return;

  // 1. Price Tracker / Generation APIs — Network Only (No Cache)
  if (url.pathname.includes('/api/price') || url.pathname.includes('/api/generate-trip') || url.pathname.includes('/api/refine-day')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ offline: true, error: 'Price tracking and AI generation require an active internet connection.' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // 1b. Clerk Auth Scripts — StaleWhileRevalidate with offline fallback JS
  if (url.hostname.includes('clerk') || url.pathname.includes('clerk')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            if (cachedResponse) return cachedResponse;
            // Return dummy JS so Clerk script load doesn't crash dev/prod UI when offline
            return new Response(
              'console.warn("[TripWise PWA] Offline mode active: Clerk auth operating in offline guest state."); window.__clerk_offline = true;',
              { headers: { 'Content-Type': 'application/javascript' } }
            );
          });
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // 2. OpenStreetMap / Leaflet Tiles — CacheFirst (Cache viewed tiles for offline navigation)
  if (url.hostname.includes('tile.openstreetmap.org') || url.hostname.includes('mapbox')) {
    event.respondWith(
      caches.open(TILE_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Return fallback empty tile if completely offline
            return new Response('', { status: 404 });
          });
        });
      })
    );
    return;
  }

  // 3. Media / Destination Images — CacheFirst
  if (request.destination === 'image' || url.hostname.includes('unsplash') || url.hostname.includes('googleusercontent')) {
    event.respondWith(
      caches.open(MEDIA_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            return cache.match('/logo.png');
          });
        });
      })
    );
    return;
  }

  // 4. HTML Navigation Pages & Scripts — NetworkFirst with Cache Fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse.ok) {
          const responseToCache = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        console.log(`[TripWise SW] Network failed, serving cached fallback for: ${request.url}`);
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // Fallback to cached itinerary page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/itinerary') || caches.match('/');
          }
          return new Response('Offline content unavailable', { status: 503 });
        });
      })
  );
});
