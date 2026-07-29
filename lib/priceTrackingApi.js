import { buildSkyscannerFlightUrl } from './iataCodes.js';

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
          percentageSaved: Math.round(dropPercent * 100),
          item: currentTrackingState.selectedFlight ? `${currentTrackingState.selectedFlight.airline} Flight` : 'Flights'
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
          percentageSaved: Math.round(dropPercent * 100),
          item: currentTrackingState.selectedHotel ? currentTrackingState.selectedHotel.name : 'Hotels'
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

export const searchFlights = async (destinationName, origin, dates) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const basePrice = getRegionMock(destinationName).flight;
      const airlineData = [
        { code: 'DL', airline: 'Delta Air Lines', logo: 'https://images.kiwi.com/airlines/64/DL.png' },
        { code: 'AA', airline: 'American Airlines', logo: 'https://images.kiwi.com/airlines/64/AA.png' },
        { code: 'UA', airline: 'United Airlines', logo: 'https://images.kiwi.com/airlines/64/UA.png' },
        { code: 'AF', airline: 'Air France', logo: 'https://images.kiwi.com/airlines/64/AF.png' },
        { code: 'LH', airline: 'Lufthansa', logo: 'https://images.kiwi.com/airlines/64/LH.png' },
        { code: 'BA', airline: 'British Airways', logo: 'https://images.kiwi.com/airlines/64/BA.png' },
        { code: 'EK', airline: 'Emirates', logo: 'https://images.kiwi.com/airlines/64/EK.png' },
        { code: 'QR', airline: 'Qatar Airways', logo: 'https://images.kiwi.com/airlines/64/QR.png' }
      ];

      const layovers = ['JFK', 'ORD', 'FRA', 'CDG', 'LHR', 'AMS', 'DXB', 'MUC'];

      // Pre-defined realistic 12-hour formatted time pairs
      const timeSlots = [
        { dep: '06:15 AM', arr: '02:45 PM' },
        { dep: '08:30 AM', arr: '04:15 PM' },
        { dep: '10:45 AM', arr: '07:20 PM' },
        { dep: '01:15 PM', arr: '09:50 PM' },
        { dep: '03:40 PM', arr: '11:10 PM' },
        { dep: '06:20 PM', arr: '06:45 AM (+1)' },
        { dep: '08:50 PM', arr: '09:15 AM (+1)' },
        { dep: '11:10 PM', arr: '12:30 PM (+1)' }
      ];

      const results = Array.from({ length: 8 }).map((_, i) => {
        const carrier = airlineData[i % airlineData.length];
        const slot = timeSlots[i % timeSlots.length];
        const isNonstop = i % 3 !== 0; // Create a mix of nonstop & 1-stop
        const durationHours = isNonstop ? (7 + (i % 4)) : (11 + (i % 5));
        const durationMins = (i * 15) % 60;
        const flightNum = `${carrier.code} ${200 + i * 47}`;
        const layover = isNonstop ? null : layovers[i % layovers.length];

        // 60% of results have an exact listing deep-link, remainder fallback to pre-filled route search
        const hasExactLink = i % 3 !== 1;
        const flightUrlInfo = buildSkyscannerFlightUrl({
          origin,
          destination: destinationName,
          date: dates?.startDate || '2026-09-15',
          flightId: `${carrier.code}_${200 + i * 47}`
        });

        const deeplink = hasExactLink ? flightUrlInfo.url : null;

        return {
          id: `f_${i}`,
          code: carrier.code,
          airline: carrier.airline,
          logo: carrier.logo,
          flightNumber: flightNum,
          departureTime: slot.dep,
          arrivalTime: slot.arr,
          duration: `${durationHours}h ${durationMins}m`,
          durationMinutes: durationHours * 60 + durationMins,
          stops: isNonstop ? 0 : 1,
          via: layover,
          price: Math.round(basePrice * (0.75 + (i * 0.08) - (isNonstop ? 0 : 0.12))),
          deeplink,
          isExactDeeplink: hasExactLink
        };
      });

      resolve(results);
    }, 1000);
  });
};

export const searchHotels = async (destinationName, dates) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const basePrice = getRegionMock(destinationName).hotel;
      const prefixes = ['The', 'Hotel', 'Grand', 'Boutique', 'Royal'];
      const suffixes = ['Palace', 'Resort', 'Suites', 'Inn', 'Plaza', 'Center'];
      const destShort = destinationName ? destinationName.split(',')[0].trim() : 'Destination';

      // Highly reliable Unsplash hotel photography
      const images = [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&h=350&fit=crop',
        'https://images.unsplash.com/photo-1551882547-ff40c0d509af?w=500&h=350&fit=crop',
        'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=500&h=350&fit=crop',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500&h=350&fit=crop',
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=500&h=350&fit=crop',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500&h=350&fit=crop'
      ];
      
      const results = Array.from({ length: 8 }).map((_, i) => {
        const rating = 3 + (i % 3); // 3, 4, 5
        const pIndex = i % prefixes.length;
        const sIndex = i % suffixes.length;
        const name = `${prefixes[pIndex]} ${destShort} ${suffixes[sIndex]}`;
        const distanceVal = (0.2 + i * 0.4).toFixed(1);
        
        // 75% of hotels have exact property-level deep-links on Booking.com
        const hasExactLink = i % 4 !== 2;
        const hotelSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const deeplink = hasExactLink 
          ? `https://www.booking.com/hotel/it/${hotelSlug}.html?checkin=2026-09-15&checkout=2026-09-19&exact=true`
          : null;

        return {
          id: `h_${i}`,
          name,
          rating,
          distance: `${distanceVal} mi from city center`,
          price: Math.round(basePrice * (0.65 + (i * 0.07))),
          image: images[i % images.length],
          deeplink,
          isExactDeeplink: hasExactLink
        };
      });
      resolve(results);
    }, 1000);
  });
};

export const saveTrackingSelection = (tripId, type, selection) => {
  const state = getTrackingState(tripId);
  if (state) {
    if (type === 'flight') {
      state.selectedFlight = selection;
      if (selection) {
        state.baseline.flight = selection.price;
        state.current.flight = selection.price;
      }
    } else if (type === 'hotel') {
      state.selectedHotel = selection;
      if (selection) {
        state.baseline.hotel = selection.price;
        state.current.hotel = selection.price;
      }
    }
    saveTrackingState(tripId, state);
  }
};
