/**
 * Price Tracking API Service
 * Handles live search simulation and mock data for Flights & Hotels price tracking.
 */

import { buildSkyscannerFlightUrl } from './iataCodes.js';
import { fetchRealHotels } from '../app/actions/hotels';

// Cache helper for tracking state per trip
const STORAGE_PREFIX = 'tw_price_tracking_';

export const getTrackingState = (tripId) => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${tripId}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const saveTrackingState = (tripId, state) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${tripId}`, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save price tracking state:', e);
  }
};

export const activateTracking = (tripId, preferences = {}) => {
  if (typeof window === 'undefined') return null;
  const existing = getTrackingState(tripId) || {};
  const updated = {
    ...existing,
    tripId,
    active: true,
    config: {
      trackFlights: true,
      trackHotels: true,
      origin: preferences.origin || existing.config?.origin || 'JFK',
      ...(existing.config || {}),
      ...(preferences.config || {})
    },
    hotelMode: preferences.hotelMode || existing.hotelMode || 'undecided',
    basecampHotel: preferences.basecampHotel || existing.basecampHotel || null,
    basecampHotelDetails: preferences.basecampHotelDetails || existing.basecampHotelDetails || null,
    lastChecked: new Date().toISOString(),
    unreadDrops: 0
  };
  saveTrackingState(tripId, updated);
  return updated;
};

export const clearUnreadDrops = (tripId) => {
  const state = getTrackingState(tripId);
  if (state) {
    state.unreadDrops = 0;
    saveTrackingState(tripId, state);
  }
};

export const saveTrackingSelection = (tripId, type, item) => {
  const state = getTrackingState(tripId) || {};
  if (type === 'flight') {
    state.selectedFlight = item;
  } else if (type === 'hotel') {
    state.selectedHotel = item;
    if (item) {
      state.hotelMode = 'basecamp';
      state.basecampHotel = typeof item === 'string' ? item : item.name;
      state.basecampHotelDetails = typeof item === 'object' ? item : null;
    } else {
      state.hotelMode = 'undecided';
      state.basecampHotel = null;
      state.basecampHotelDetails = null;
    }
  }
  saveTrackingState(tripId, state);
  return state;
};

export const pollForPriceDrops = async (tripId) => {
  return getTrackingState(tripId);
};

// Realistic baseline prices by destination region
const getRegionMock = (destinationName = '') => {
  const dest = destinationName.toLowerCase();
  if (dest.includes('tokyo') || dest.includes('japan') || dest.includes('bali') || dest.includes('bangkok')) {
    return { flight: 850, hotel: 160, currency: '$' };
  }
  if (dest.includes('paris') || dest.includes('london') || dest.includes('rome') || dest.includes('barcelona') || dest.includes('italy')) {
    return { flight: 620, hotel: 195, currency: '$' };
  }
  if (dest.includes('york') || dest.includes('angeles') || dest.includes('miami') || dest.includes('chicago')) {
    return { flight: 280, hotel: 220, currency: '$' };
  }
  return { flight: 490, hotel: 175, currency: '$' };
};

export const fetchPriceTrackerData = async (destinationName, config = {}) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mock = getRegionMock(destinationName);
      
      const flightHistory = Array.from({ length: 14 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        const dayStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const variance = Math.sin(i * 0.8) * 45 + (Math.random() * 20 - 10);
        return {
          date: dayStr,
          price: Math.round(mock.flight + variance)
        };
      });

      const hotelHistory = Array.from({ length: 14 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        const dayStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const variance = Math.cos(i * 0.7) * 25 + (Math.random() * 15 - 7);
        return {
          date: dayStr,
          price: Math.round(mock.hotel + variance)
        };
      });

      const currentFlight = flightHistory[flightHistory.length - 1].price;
      const prevFlight = flightHistory[flightHistory.length - 2].price;
      const flightDiff = currentFlight - prevFlight;

      const currentHotel = hotelHistory[hotelHistory.length - 1].price;
      const prevHotel = hotelHistory[hotelHistory.length - 2].price;
      const hotelDiff = currentHotel - prevHotel;

      resolve({
        destination: destinationName || 'Destination',
        flight: {
          currentPrice: currentFlight,
          currency: '$',
          priceChange: flightDiff,
          recommendation: flightDiff <= 0 ? 'Buy Now — Lowest in 14 days' : 'Wait — Price fluctuating',
          confidence: 88,
          history: flightHistory,
          cheapestAirline: 'Delta Air Lines'
        },
        hotel: {
          currentPrice: currentHotel,
          currency: '$',
          priceChange: hotelDiff,
          recommendation: hotelDiff <= 0 ? 'Good Deal — Below average' : 'Track — Steady rates',
          confidence: 84,
          history: hotelHistory,
          bestArea: 'City Center'
        }
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
        const isNonstop = i % 3 !== 0;
        const durationHours = isNonstop ? (7 + (i % 4)) : (11 + (i % 5));
        const durationMins = (i * 15) % 60;
        const flightNum = `${carrier.code} ${200 + i * 47}`;
        const layover = isNonstop ? null : layovers[i % layovers.length];

        // Construct 100% reliable Skyscanner search URL (no fabricated 404 flight_id parameters)
        const flightUrlInfo = buildSkyscannerFlightUrl({
          origin,
          destination: destinationName,
          date: dates?.startDate || '2026-09-15',
          stops: isNonstop ? 0 : 1
        });

        const trend = i % 3 === 0 
          ? { type: 'down', text: '↓ Dropped 8% today' } 
          : i % 3 === 1 
          ? { type: 'stable', text: '→ Stable price' } 
          : { type: 'up', text: '↑ 4% higher than avg' };

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
          deeplink: flightUrlInfo.url,
          isExactDeeplink: false,
          isDemo: true,
          trend
        };
      });

      resolve(results);
    }, 800);
  });
};

// Real destination hotel inventory to guarantee zero 404s on Booking.com search
const REAL_DESTINATION_HOTELS = {
  rome: [
    { name: 'Hotel Artemide', rating: 4, distance: '0.4 mi from city center', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&h=350&fit=crop' },
    { name: 'Rome Cavalieri, A Waldorf Astoria Hotel', rating: 5, distance: '1.8 mi from city center', image: 'https://images.unsplash.com/photo-1551882547-ff40c0d509af?w=500&h=350&fit=crop' },
    { name: 'Hotel Eden - Dorchester Collection', rating: 5, distance: '0.6 mi from city center', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500&h=350&fit=crop' },
    { name: 'Singer Palace Hotel', rating: 5, distance: '0.2 mi from city center', image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=500&h=350&fit=crop' },
    { name: 'NH Collection Roma Fori Imperiali', rating: 4, distance: '0.3 mi from city center', image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500&h=350&fit=crop' },
    { name: 'Palazzo Manfredi - Small Luxury Hotels', rating: 5, distance: '0.5 mi from city center', image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=500&h=350&fit=crop' },
    { name: 'The Inn at the Roman Forum', rating: 4, distance: '0.3 mi from city center', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&h=350&fit=crop' },
    { name: 'Hotel Hassler Roma', rating: 5, distance: '0.7 mi from city center', image: 'https://images.unsplash.com/photo-1551882547-ff40c0d509af?w=500&h=350&fit=crop' }
  ],
  paris: [
    { name: 'Hôtel Plaza Athénée', rating: 5, distance: '0.8 mi from city center', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&h=350&fit=crop' },
    { name: 'Le Meurice - Dorchester Collection', rating: 5, distance: '0.4 mi from city center', image: 'https://images.unsplash.com/photo-1551882547-ff40c0d509af?w=500&h=350&fit=crop' },
    { name: 'Hôtel Ritz Paris', rating: 5, distance: '0.3 mi from city center', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500&h=350&fit=crop' },
    { name: 'Le Royal Monceau Raffles Paris', rating: 5, distance: '1.2 mi from city center', image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=500&h=350&fit=crop' },
    { name: 'Hôtel Madame Rêve', rating: 4, distance: '0.2 mi from city center', image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500&h=350&fit=crop' },
    { name: 'Shangri-La Hotel Paris', rating: 5, distance: '1.5 mi from city center', image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=500&h=350&fit=crop' },
    { name: 'Pullman Paris Tour Eiffel', rating: 4, distance: '1.8 mi from city center', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&h=350&fit=crop' },
    { name: 'Hôtel Lutetia', rating: 5, distance: '0.9 mi from city center', image: 'https://images.unsplash.com/photo-1551882547-ff40c0d509af?w=500&h=350&fit=crop' }
  ],
  tokyo: [
    { name: 'The Tokyo Station Hotel', rating: 5, distance: '0.1 mi from city center', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&h=350&fit=crop' },
    { name: 'Park Hyatt Tokyo', rating: 5, distance: '1.4 mi from city center', image: 'https://images.unsplash.com/photo-1551882547-ff40c0d509af?w=500&h=350&fit=crop' },
    { name: 'Aman Tokyo', rating: 5, distance: '0.3 mi from city center', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500&h=350&fit=crop' },
    { name: 'The Capitol Hotel Tokyu', rating: 5, distance: '0.8 mi from city center', image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=500&h=350&fit=crop' },
    { name: 'Hotel Gracery Shinjuku', rating: 4, distance: '1.6 mi from city center', image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500&h=350&fit=crop' },
    { name: 'Palace Hotel Tokyo', rating: 5, distance: '0.4 mi from city center', image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=500&h=350&fit=crop' },
    { name: 'Hoshinoya Tokyo', rating: 5, distance: '0.5 mi from city center', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&h=350&fit=crop' },
    { name: 'Trunk Hotel Yoyogi Park', rating: 4, distance: '2.1 mi from city center', image: 'https://images.unsplash.com/photo-1551882547-ff40c0d509af?w=500&h=350&fit=crop' }
  ]
};

export const searchHotels = async (destinationName, dates) => {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const basePrice = getRegionMock(destinationName).hotel;
      const destShort = destinationName ? destinationName.split(',')[0].trim() : 'Destination';
      const destKey = destShort.toLowerCase();

      const mapCoords = [
        { x: 38, y: 42 },
        { x: 55, y: 35 },
        { x: 28, y: 58 },
        { x: 68, y: 62 },
        { x: 45, y: 72 },
        { x: 75, y: 40 },
        { x: 22, y: 30 },
        { x: 60, y: 80 }
      ];

      const checkin = dates?.startDate || '2026-09-15';
      const checkout = dates?.endDate || '2026-09-19';

      let hotelList = [];
      
      try {
        const data = await fetchRealHotels(destinationName || 'Destination');
        if (data && data.hotels && data.hotels.length > 0) {
          hotelList = data.hotels.map((h, i) => ({
            ...h,
            distance: `0.${3 + (i % 5)} mi from city center`
          }));
        }
      } catch (e) {
        console.error("Failed to fetch real hotels via Server Action", e);
      }

      if (hotelList.length === 0) {
        hotelList = REAL_DESTINATION_HOTELS[destKey] || [
          { name: `Grand ${destShort} Palace`, rating: 5, distance: '0.3 mi from city center', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&h=350&fit=crop' },
          { name: `${destShort} Boutique Hotel`, rating: 4, distance: '0.5 mi from city center', image: 'https://images.unsplash.com/photo-1551882547-ff40c0d509af?w=500&h=350&fit=crop' },
          { name: `The Heritage ${destShort} Suites`, rating: 5, distance: '0.8 mi from city center', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500&h=350&fit=crop' },
          { name: `Royal ${destShort} Plaza`, rating: 4, distance: '0.4 mi from city center', image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=500&h=350&fit=crop' },
          { name: `Continental ${destShort} Resort`, rating: 5, distance: '1.2 mi from city center', image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500&h=350&fit=crop' },
          { name: `The Inn at ${destShort}`, rating: 4, distance: '0.6 mi from city center', image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=500&h=350&fit=crop' },
          { name: `Crown ${destShort} Center Hotel`, rating: 4, distance: '1.0 mi from city center', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&h=350&fit=crop' },
          { name: `Apex ${destShort} Vista Inn`, rating: 4, distance: '1.4 mi from city center', image: 'https://images.unsplash.com/photo-1551882547-ff40c0d509af?w=500&h=350&fit=crop' }
        ];
      }

      const results = await Promise.all(hotelList.map(async (hotel, i) => {
        const hotelQuery = encodeURIComponent(`${hotel.name} ${destShort}`);
        const fallbackSearchUrl = `https://www.booking.com/searchresults.html?ss=${hotelQuery}&checkin=${checkin}&checkout=${checkout}`;

        let realPhoto = hotel.image; // Use fetched image if available
        if (!realPhoto) {
          try {
            // Fetch real photo from Google Places API route if missing
            const imgRes = await fetch(`/api/images?q=${hotelQuery}&count=1`);
            if (imgRes.ok) {
              const data = await imgRes.json();
              if (data.images && data.images.length > 0) {
                realPhoto = data.images[0];
              }
            }
          } catch (e) {
            console.error("Failed to fetch real hotel photo", e);
          }
        }

        const trend = i % 4 === 0 
          ? { type: 'down', text: '↓ Dropped 12% today' } 
          : i % 4 === 1 
          ? { type: 'stable', text: '→ Stable price' } 
          : i % 4 === 2 
          ? { type: 'down', text: '↓ Great Rate' } 
          : { type: 'up', text: '↑ High demand' };

        return {
          id: `h_${i}`,
          name: hotel.name,
          rating: hotel.rating,
          distance: hotel.distance,
          price: Math.round(basePrice * (0.65 + (i * 0.07))),
          image: realPhoto,
          deeplink: fallbackSearchUrl,
          isExactDeeplink: false,
          isDemo: true,
          trend,
          mapPos: mapCoords[i % mapCoords.length],
          amenities: ['Free WiFi', 'Breakfast Included', 'Pool', 'Fitness Center', 'Air Conditioning'].slice(0, 3 + (i % 3)),
          coordinates: hotel.coordinates,
          address: hotel.address
        };
      }));
      resolve(results);
    }, 800);
  });
};
