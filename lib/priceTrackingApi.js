/**
 * Mock API for Flight and Hotel Price Tracking
 * Simulates interactions with external providers like Amadeus or Skyscanner.
 */

// Simulated baseline prices for various regions (to make the mock feel realistic)
const REGION_PRICES = {
  europe: { flight: 850, hotel: 220 },
  asia: { flight: 1100, hotel: 130 },
  americas: { flight: 400, hotel: 180 },
  default: { flight: 600, hotel: 150 }
};

const getRegionMock = (destinationName = '') => {
  const dest = destinationName.toLowerCase();
  if (dest.includes('rome') || dest.includes('paris') || dest.includes('london') || dest.includes('europe')) {
    return REGION_PRICES.europe;
  }
  if (dest.includes('tokyo') || dest.includes('kyoto') || dest.includes('japan') || dest.includes('asia') || dest.includes('bangkok')) {
    return REGION_PRICES.asia;
  }
  if (dest.includes('york') || dest.includes('america') || dest.includes('cancun')) {
    return REGION_PRICES.americas;
  }
  return REGION_PRICES.default;
};

// Storage Helpers
export const getTrackingState = (tripId) => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(`tw_price_tracking_${tripId}`);
  return stored ? JSON.parse(stored) : null;
};

export const saveTrackingState = (tripId, state) => {
  if (typeof window === 'undefined') return;
  if (!state) {
    localStorage.removeItem(`tw_price_tracking_${tripId}`);
  } else {
    localStorage.setItem(`tw_price_tracking_${tripId}`, JSON.stringify(state));
  }
};

export const clearUnreadDrops = (tripId) => {
  const state = getTrackingState(tripId);
  if (state) {
    state.unreadDrops = false;
    saveTrackingState(tripId, state);
  }
};

// Simulates fetching baseline prices when tracking is activated
export const activateTracking = async (tripId, destinationName, params) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const regionPrices = getRegionMock(destinationName);
      
      const baseline = {};
      if (params.trackFlights) {
        baseline.flight = Math.round(regionPrices.flight * (0.9 + Math.random() * 0.2));
      }
      if (params.trackHotels) {
        baseline.hotel = Math.round(regionPrices.hotel * (0.9 + Math.random() * 0.2));
      }

      const state = {
        success: true,
        tripId,
        config: params,
        baseline,
        current: { ...baseline },
        activatedAt: new Date().toISOString(),
        unreadDrops: false,
        recentDrops: null
      };
      
      saveTrackingState(tripId, state);
      resolve(state);
    }, 800); // 800ms mock delay
  });
};

/**
 * Simulates checking for price drops.
 * Updates localStorage if a drop is found.
 */
export const pollForPriceDrops = async (tripId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const currentTrackingState = getTrackingState(tripId);
      if (!currentTrackingState || !currentTrackingState.baseline) {
        return resolve(null);
      }

      const result = { flight: null, hotel: null };
      const baseline = currentTrackingState.baseline;
      
      // We will force a mock drop 15% of the time per polling cycle to make the demo interactive
      const dropChance = 0.15; 
      let hasDrops = false;
      
      if (baseline.flight && Math.random() < dropChance) {
        const dropPercent = 0.10 + (Math.random() * 0.15);
        const newPrice = Math.round(baseline.flight * (1 - dropPercent));
        result.flight = {
          oldPrice: currentTrackingState.current.flight || baseline.flight,
          newPrice,
          percentageSaved: Math.round(dropPercent * 100)
        };
        currentTrackingState.current.flight = newPrice;
        hasDrops = true;
      }

      if (baseline.hotel && Math.random() < dropChance) {
        const dropPercent = 0.10 + (Math.random() * 0.15);
        const newPrice = Math.round(baseline.hotel * (1 - dropPercent));
        result.hotel = {
          oldPrice: currentTrackingState.current.hotel || baseline.hotel,
          newPrice,
          percentageSaved: Math.round(dropPercent * 100)
        };
        currentTrackingState.current.hotel = newPrice;
        hasDrops = true;
      }

      if (hasDrops) {
        currentTrackingState.unreadDrops = true;
        currentTrackingState.recentDrops = result;
        saveTrackingState(tripId, currentTrackingState);
      }

      resolve({
        hasDrops,
        drops: result,
        state: currentTrackingState,
        timestamp: new Date().toISOString()
      });
    }, 400);
  });
};
