/**
 * TripWise Offline Data Manager
 * 
 * Manages full trip offline packs including structured itinerary, emergency info,
 * packing list, visa requirements, expenses, and pre-cached image/photo assets in Cache Storage.
 */

export const OFFLINE_PACK_PREFIX = 'tw_offline_pack_';
export const CACHE_NAME_MEDIA = 'tripwise-media-v1';
export const CACHE_NAME_PAGES = 'tripwise-pages-v1';

/**
 * Get cached offline pack for a trip
 */
export function getOfflinePack(tripId = 'default_trip') {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${OFFLINE_PACK_PREFIX}${tripId}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Error reading offline pack:', e);
    return null;
  }
}

/**
 * Save offline pack for a trip
 */
export function saveOfflinePack(tripId = 'default_trip', pack) {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(`${OFFLINE_PACK_PREFIX}${tripId}`, JSON.stringify(pack));
    return true;
  } catch (e) {
    console.error('Error saving offline pack:', e);
    return false;
  }
}

/**
 * Remove cached offline pack
 */
export function removeOfflinePack(tripId = 'default_trip') {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`${OFFLINE_PACK_PREFIX}${tripId}`);
  } catch (e) {
    console.error('Error deleting offline pack:', e);
  }
}

/**
 * Check if offline pack is older than specified hours (default 24h)
 */
export function isOfflinePackStale(tripId = 'default_trip', maxAgeHours = 24) {
  const pack = getOfflinePack(tripId);
  if (!pack || !pack.cachedAt) return true;
  const elapsedMs = Date.now() - new Date(pack.cachedAt).getTime();
  const maxMs = maxAgeHours * 60 * 60 * 1000;
  return elapsedMs > maxMs;
}

/**
 * Estimate storage size of an itinerary (structured data + photos + tile assets)
 */
export function estimatePackSize(itinerary) {
  let photoCount = 0;

  if (itinerary && itinerary.days) {
    itinerary.days.forEach(day => {
      if (day.activities) {
        photoCount += day.activities.length;
      }
    });
  }

  // Base structured data (~2MB) + map tiles area (~25MB) + photos (~1.2MB per image)
  const estimatedMB = Math.max(12, Math.round(2 + 20 + photoCount * 1.5));
  return `~${estimatedMB}MB — includes maps, photos & itinerary`;
}

/**
 * Collect all image URLs present in an itinerary for pre-caching
 */
export function extractItineraryMediaUrls(itinerary) {
  const urls = new Set();

  if (!itinerary) return [];

  if (itinerary.heroPhoto) urls.add(itinerary.heroPhoto);

  if (itinerary.days) {
    itinerary.days.forEach(day => {
      if (day.activities) {
        day.activities.forEach(act => {
          if (act.photo) urls.add(act.photo);
          if (act.thumbnail) urls.add(act.thumbnail);
          if (act.image) urls.add(act.image);
        });
      }
    });
  }

  return Array.from(urls).filter(u => typeof u === 'string' && u.startsWith('http'));
}

/**
 * Pre-cache all itinerary media URLs into Cache Storage
 */
export async function preCacheTripMedia(urls = [], onProgress = () => {}) {
  if (typeof window === 'undefined' || !('caches' in window)) return;

  try {
    const cache = await caches.open(CACHE_NAME_MEDIA);
    let completed = 0;
    const total = urls.length || 1;

    for (const url of urls) {
      try {
        const response = await fetch(url, { mode: 'cors' });
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch (err) {
        console.warn(`Failed to pre-cache media: ${url}`, err);
      }
      completed++;
      onProgress(Math.round((completed / total) * 100));
    }
  } catch (err) {
    console.error('Error pre-caching media:', err);
  }
}

/**
 * Assemble and store complete offline trip pack
 */
export async function buildAndSaveOfflinePack({
  tripId = 'default_trip',
  itinerary,
  expenses = [],
  emergencyData = null,
  packingList = null,
  visaReqs = null,
  onProgress = () => {}
}) {
  onProgress(10); // Start

  // 1. Collect media URLs
  const mediaUrls = extractItineraryMediaUrls(itinerary);
  onProgress(25);

  // 2. Pre-cache images in Cache Storage
  if (mediaUrls.length > 0) {
    await preCacheTripMedia(mediaUrls, (mediaProgress) => {
      onProgress(25 + Math.round(mediaProgress * 0.6)); // 25% -> 85%
    });
  } else {
    onProgress(85);
  }

  // 3. Assemble structured data payload
  const pack = {
    tripId,
    cachedAt: new Date().toISOString(),
    lastUpdated: itinerary?.updatedAt || new Date().toISOString(),
    isAvailableOffline: true,
    data: {
      itinerary: {
        ...itinerary,
        // Mark critical offline flag for AI insights & reasoning
        criticalForOffline: true
      },
      expenses,
      emergencyData: emergencyData ? {
        ...emergencyData,
        criticalForOffline: true
      } : null,
      packingList,
      visaReqs
    }
  };

  // 4. Save to localStorage
  saveOfflinePack(tripId, pack);
  onProgress(100);

  return pack;
}

/**
 * Auto-refresh offline data in background if connected and >24 hours old
 */
export async function autoRefreshOfflinePackIfStale(tripId, fetchFreshDataFn) {
  if (typeof window === 'undefined' || !navigator.onLine) return;

  if (isOfflinePackStale(tripId, 24)) {
    try {
      console.log('TripWise PWA: Background syncing offline pack (data > 24h old)...');
      const freshData = await fetchFreshDataFn();
      if (freshData) {
        await buildAndSaveOfflinePack({
          tripId,
          ...freshData,
          onProgress: () => {}
        });
        console.log('TripWise PWA: Background offline sync complete.');
      }
    } catch (e) {
      console.warn('TripWise PWA: Background sync failed:', e);
    }
  }
}
