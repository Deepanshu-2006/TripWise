'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  Bell, Plane, Hotel, AlertCircle, TrendingDown, TrendingUp, Minus, Clock, MapPin, 
  Loader2, ArrowRight, CheckCircle2, Star, SlidersHorizontal, ExternalLink, Info, 
  Sparkles, Map, List, CheckSquare, Square, X, Layers, Scale, DollarSign, Compass,
  WifiOff
} from 'lucide-react';
import { activateTracking, getTrackingState, clearUnreadDrops, searchFlights, searchHotels, saveTrackingSelection, saveTrackingState } from '../../lib/priceTrackingApi';
import { getBookingLinkInfo } from '../../lib/bookingPartners';

// Price Distribution Histogram Component
function PriceDistributionBar({ items = [], type = 'flight', selectedId = null, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="bg-white/60 border border-[#E6DFD5] rounded-2xl p-3.5 mb-5 animate-pulse">
        <div className="flex items-center justify-between mb-2">
          <div className="h-3.5 w-32 bg-[#E6DFD5]/70 rounded" />
          <div className="h-3.5 w-24 bg-[#E6DFD5]/70 rounded" />
        </div>
        <div className="h-7 bg-[#E6DFD5]/40 rounded-xl w-full" />
      </div>
    );
  }

  if (!items || items.length === 0) return null;

  const prices = items.map(i => i.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const range = (maxPrice - minPrice) || 1;

  // Create 10 distribution buckets
  const bucketCount = 10;
  const buckets = Array.from({ length: bucketCount }).map(() => ({ count: 0, items: [] }));
  
  items.forEach(item => {
    const pos = Math.min(bucketCount - 1, Math.floor(((item.price - minPrice) / range) * bucketCount));
    buckets[pos].count += 1;
    buckets[pos].items.push(item);
  });

  const maxCount = Math.max(...buckets.map(b => b.count), 1);

  return (
    <div className="bg-white/80 backdrop-blur-xs border border-[#E6DFD5] rounded-2xl p-4 mb-5 shadow-xs">
      <div className="flex items-center justify-between text-xs mb-2.5">
        <span className="font-bold text-[#1E1C1A] flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-[#FF6B2C]" />
          <span>Price Distribution ({items.length} {type}s)</span>
        </span>
        <div className="flex items-center gap-3 text-[11px] font-medium text-[#7A7268]">
          <span>Min: <strong className="text-[#1E1C1A]">${minPrice}</strong></span>
          <span>Avg: <strong className="text-[#1E1C1A]">${avgPrice}</strong></span>
          <span>Max: <strong className="text-[#1E1C1A]">${maxPrice}</strong></span>
        </div>
      </div>

      {/* Histogram Bars */}
      <div className="flex items-end gap-1.5 h-10 w-full px-1 pt-1">
        {buckets.map((bucket, bIdx) => {
          const heightPct = Math.max(15, Math.round((bucket.count / maxCount) * 100));
          const hasSelected = bucket.items.some(it => it.id === selectedId);
          const isMinBucket = bucket.items.some(it => it.price === minPrice);

          return (
            <div 
              key={bIdx} 
              className="flex-1 flex flex-col items-center group relative cursor-pointer"
              title={`${bucket.count} option(s) in this range`}
            >
              <div 
                className={`w-full rounded-t-md transition-all duration-300 ${
                  hasSelected 
                    ? 'bg-[#FF6B2C] ring-2 ring-[#FF6B2C]/40 shadow-xs' 
                    : isMinBucket 
                    ? 'bg-emerald-500 hover:bg-emerald-600' 
                    : 'bg-[#E6DFD5] hover:bg-[#D5CBBF]'
                }`}
                style={{ height: `${heightPct}%` }}
              />

              {/* Tooltip on hover */}
              <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10">
                <div className="bg-[#1E1C1A] text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-md whitespace-nowrap">
                  {bucket.count} option{bucket.count !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[10px] text-[#7A7268] font-mono mt-1.5 border-t border-[#E6DFD5]/50 pt-1">
        <span className="text-emerald-700 font-bold">Cheapest: ${minPrice}</span>
        <span>Spread: ${maxPrice - minPrice}</span>
        <span>Highest: ${maxPrice}</span>
      </div>
    </div>
  );
}

// Side-by-Side Comparison Modal Component
function ComparisonModal({ isOpen, onClose, items = [], type = 'flight', onSelect, destinationName, startDate, endDate, stayNights }) {
  if (!isOpen || items.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-3xl border border-[#E6DFD5] max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6"
      >
        <div className="flex items-center justify-between border-b border-[#E6DFD5] pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#FFF9F5] border border-[#FF6B2C]/20 rounded-xl text-[#FF6B2C]">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-[#1E1C1A]">
                Compare {type === 'flight' ? 'Flights' : 'Hotels'}
              </h3>
              <p className="text-xs text-[#7A7268]">
                Side-by-side comparison for {destinationName}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[#F5F0E8] rounded-full text-[#7A7268] hover:text-[#1E1C1A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((item, idx) => {
            const linkInfo = getBookingLinkInfo(destinationName, type, item, { startDate, endDate });

            return (
              <div 
                key={item.id} 
                className="bg-[#FAF6F0] rounded-2xl border border-[#E6DFD5] p-5 flex flex-col justify-between relative shadow-xs"
              >
                {/* Option Badge Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-extrabold uppercase bg-[#1E1C1A] text-white px-2 py-0.5 rounded">
                    Option {idx + 1}
                  </span>
                  {item.isExactDeeplink ? (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Exact Listing
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded">
                      Pre-filled Search
                    </span>
                  )}
                </div>

                {type === 'flight' ? (
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <img src={item.logo} alt={item.airline} className="w-8 h-8 object-contain rounded-lg bg-white border border-[#E6DFD5] p-1" />
                      <div>
                        <h4 className="font-bold text-sm text-[#1E1C1A]">{item.airline}</h4>
                        <span className="text-xs font-mono text-[#7A7268]">{item.flightNumber}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-[#4A443E] bg-white rounded-xl p-3 border border-[#E6DFD5] mb-4">
                      <div className="flex justify-between border-b border-[#E6DFD5]/40 pb-1.5">
                        <span className="text-[#7A7268]">Price:</span>
                        <span className="font-bold text-[#1E1C1A] text-sm">${item.price}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#E6DFD5]/40 pb-1.5">
                        <span className="text-[#7A7268]">Schedule:</span>
                        <span className="font-semibold text-[#1E1C1A]">{item.departureTime} – {item.arrivalTime}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#E6DFD5]/40 pb-1.5">
                        <span className="text-[#7A7268]">Duration:</span>
                        <span className="font-semibold">{item.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#7A7268]">Stops:</span>
                        <span className={item.stops === 0 ? 'text-emerald-700 font-bold' : 'font-semibold'}>
                          {item.stops === 0 ? 'Nonstop' : `1 Stop (${item.via})`}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="relative h-28 rounded-xl overflow-hidden mb-3 border border-[#E6DFD5]">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-xs text-white text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {item.rating}.0
                      </div>
                    </div>

                    <h4 className="font-bold text-sm text-[#1E1C1A] mb-2">{item.name}</h4>

                    <div className="space-y-2 text-xs text-[#4A443E] bg-white rounded-xl p-3 border border-[#E6DFD5] mb-4">
                      <div className="flex justify-between border-b border-[#E6DFD5]/40 pb-1.5">
                        <span className="text-[#7A7268]">Nightly Rate:</span>
                        <span className="font-bold text-[#1E1C1A]">${item.price}/night</span>
                      </div>
                      <div className="flex justify-between border-b border-[#E6DFD5]/40 pb-1.5">
                        <span className="text-[#7A7268]">Stay Total ({stayNights}n):</span>
                        <span className="font-bold text-[#FF6B2C] text-sm">${item.price * stayNights}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#E6DFD5]/40 pb-1.5">
                        <span className="text-[#7A7268]">Location:</span>
                        <span className="font-medium text-[#1E1C1A] text-right truncate max-w-[120px]">{item.distance}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#7A7268]">Amenities:</span>
                        <span className="font-medium text-[#1E1C1A]">{item.amenities?.slice(0, 2).join(', ')}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-[#E6DFD5]">
                  <button 
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                    className="w-full bg-[#FF6B2C] hover:bg-[#e0591e] text-white py-2.5 rounded-xl text-xs font-bold transition-colors shadow-xs"
                  >
                    Select Selection
                  </button>

                  <a 
                    href={linkInfo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-white hover:bg-[#F5F0E8] border border-[#E6DFD5] text-[#1E1C1A] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Partner Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

// Hotel Interactive Map View Component
function HotelMapView({ hotels = [], itinerary, selectedHotel, onSelectHotel, stayNights }) {
  const [activeMapHotel, setActiveMapHotel] = useState(hotels[0] || null);

  // Extract activity stops from itinerary
  const itineraryStops = itinerary?.days ? itinerary.days.flatMap((day, dIdx) => 
    (day.activities || []).map((act, aIdx) => ({
      id: `stop_${dIdx}_${aIdx}`,
      title: act.title || act.name || `Stop ${aIdx + 1}`,
      day: dIdx + 1,
      x: 20 + ((dIdx * 25 + aIdx * 18) % 65),
      y: 25 + ((dIdx * 30 + aIdx * 22) % 55)
    }))
  ).slice(0, 8) : [
    { id: 'st1', title: 'City Center Hub', day: 1, x: 50, y: 50 },
    { id: 'st2', title: 'Historic District', day: 1, x: 35, y: 40 },
    { id: 'st3', title: 'Main Square & Eats', day: 2, x: 65, y: 55 }
  ];

  return (
    <div className="bg-white rounded-3xl border border-[#E6DFD5] overflow-hidden shadow-sm mb-6">
      {/* Map Header */}
      <div className="p-4 bg-[#FAF6F0] border-b border-[#E6DFD5] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-[#FF6B2C]" />
          <span className="font-serif font-bold text-sm text-[#1E1C1A]">Destination Hotel & Itinerary Map</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-[#7A7268]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B2C]" /> Hotel Options
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1E1C1A]" /> Planned Stops ({itineraryStops.length})
          </span>
        </div>
      </div>

      {/* Interactive Map Box Canvas */}
      <div className="relative w-full h-[380px] bg-[#F5F0E8] overflow-hidden border-b border-[#E6DFD5] select-none">
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#1E1C1A_1px,transparent_1px)] [background-size:16px_16px]" />
        
        {/* Animated Connecting SVG Path */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <path 
            d={`M ${itineraryStops.map(s => `${s.x}%,${s.y}%`).join(' L ')}`} 
            fill="none" 
            stroke="#FF6B2C" 
            strokeWidth="1.5" 
            strokeDasharray="4,4" 
            opacity="0.5"
          />
        </svg>

        {/* Itinerary Stop Pins */}
        {itineraryStops.map((stop) => (
          <div 
            key={stop.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-10 group"
            style={{ left: `${stop.x}%`, top: `${stop.y}%` }}
          >
            <div className="w-6 h-6 rounded-full bg-[#1E1C1A] text-white text-[10px] font-bold flex items-center justify-center shadow-md border-2 border-white transition-transform group-hover:scale-110">
              📍
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex bg-[#1E1C1A] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-30">
              Day {stop.day}: {stop.title}
            </div>
          </div>
        ))}

        {/* Hotel Pins */}
        {hotels.map((hotel) => {
          const isSelected = selectedHotel?.id === hotel.id;
          const isActive = activeMapHotel?.id === hotel.id;
          const posX = hotel.mapPos?.x || 50;
          const posY = hotel.mapPos?.y || 50;

          return (
            <div 
              key={hotel.id}
              onClick={() => setActiveMapHotel(hotel)}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-all duration-200"
              style={{ left: `${posX}%`, top: `${posY}%` }}
            >
              <div 
                className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md transition-all ${
                  isSelected
                    ? 'bg-[#FF6B2C] text-white ring-4 ring-[#FF6B2C]/30 scale-110 z-30'
                    : isActive
                    ? 'bg-[#1E1C1A] text-white scale-105 z-20'
                    : 'bg-white text-[#1E1C1A] hover:bg-[#FFF9F5] border border-[#E6DFD5]'
                }`}
              >
                <span>🏨 ${hotel.price}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Map Hotel Preview Drawer */}
      {activeMapHotel && (
        <div className="p-4 bg-[#FAF6F0] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img src={activeMapHotel.image} alt={activeMapHotel.name} className="w-16 h-16 rounded-xl object-cover border border-[#E6DFD5]" />
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="font-bold text-sm text-[#1E1C1A]">{activeMapHotel.name}</h4>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {activeMapHotel.rating}.0
                </span>
              </div>
              <p className="text-xs text-[#7A7268] font-medium flex items-center gap-2">
                <span>{activeMapHotel.distance}</span>
                <span>&middot;</span>
                <span className="text-emerald-700 font-bold">📍 Near {Math.max(4, Math.round(itineraryStops.length * 0.7))} of {itineraryStops.length} stops</span>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-[#E6DFD5] pt-3 md:pt-0">
            <div className="text-right">
              <span className="text-xl font-serif font-black text-[#1E1C1A]">${activeMapHotel.price}</span>
              <span className="text-[10px] text-[#7A7268] block">/night (${activeMapHotel.price * stayNights} total)</span>
            </div>
            
            {selectedHotel?.id === activeMapHotel.id ? (
              <button disabled className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Selected
              </button>
            ) : (
              <button 
                onClick={() => onSelectHotel(activeMapHotel)}
                className="bg-[#FF6B2C] hover:bg-[#e0591e] text-white px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Select Basecamp
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PriceTracker({ 
  tripId, 
  destinationName, 
  startDate, 
  endDate, 
  hotelMode: propHotelMode, 
  basecampHotel: propBasecampHotel, 
  onReoptimize, 
  onToast,
  itinerary 
}) {
  const [trackingState, setTrackingState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [config, setConfig] = useState({ trackFlights: true, trackHotels: true, origin: 'JFK' });
  const [error, setError] = useState(null);

  // Search Results & Selection State
  const [flights, setFlights] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [redirectingType, setRedirectingType] = useState(null); // 'flight' | 'hotel' | null
  const [isReoptimizing, setIsReoptimizing] = useState(false);

  // Sorting & Filtering State
  const [flightSort, setFlightSort] = useState('price'); // price, duration, best
  const [flightStops, setFlightStops] = useState('any'); // any, nonstop, 1stop
  const [hotelSort, setHotelSort] = useState('price'); // price, rating, best
  const [hotelRating, setHotelRating] = useState('any'); // any, 4, 5

  // Shortlist & Comparison State
  const [flightShortlist, setFlightShortlist] = useState([]);
  const [hotelShortlist, setHotelShortlist] = useState([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(null); // 'flight' | 'hotel' | null

  // Hotel View Mode (List vs Map)
  const [hotelViewMode, setHotelViewMode] = useState('list'); // 'list' | 'map'
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };

    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
      window.addEventListener('online', handleOnlineStatus);
      window.addEventListener('offline', handleOnlineStatus);
      return () => {
        window.removeEventListener('online', handleOnlineStatus);
        window.removeEventListener('offline', handleOnlineStatus);
      };
    }
  }, []);

  useEffect(() => {
    const state = getTrackingState(tripId);
    if (state) {
      const normalizedState = {
        ...state,
        config: {
          trackFlights: true,
          trackHotels: true,
          origin: 'JFK',
          ...(state.config || {})
        }
      };
      setTrackingState(normalizedState);
      if (state.unreadDrops) {
        clearUnreadDrops(tripId);
      }
    }
    setIsLoading(false);
  }, [tripId]);

  useEffect(() => {
    if (trackingState) {
      const fetchResults = async () => {
        setIsLoadingResults(true);
        const trackFlights = trackingState.config?.trackFlights ?? true;
        const trackHotels = trackingState.config?.trackHotels ?? true;
        const origin = trackingState.config?.origin || 'JFK';

        if (trackFlights && flights.length === 0) {
          const res = await searchFlights(destinationName, origin, { startDate, endDate });
          setFlights(res);
        }
        if (trackHotels && hotels.length === 0) {
          const res = await searchHotels(destinationName, { startDate, endDate });
          setHotels(res);
        }
        setIsLoadingResults(false);
      };
      fetchResults();
    }
  }, [trackingState, destinationName, startDate, endDate]);

  const handleStartTracking = async () => {
    if (!config.trackFlights && !config.trackHotels) return;
    
    setIsActivating(true);
    setError(null);
    try {
      const state = await activateTracking(tripId, destinationName, {
        startDate,
        ...config
      });
      setTrackingState(state);
    } catch (err) {
      setError(err.message || 'Failed to activate tracking.');
    } finally {
      setIsActivating(false);
    }
  };

  const handleStopTracking = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`tw_price_tracking_${tripId}`);
    }
    setTrackingState(null);
    setFlights([]);
    setHotels([]);
  };

  const handleSelectFlight = (flight) => {
    saveTrackingSelection(tripId, 'flight', flight);
    setTrackingState(getTrackingState(tripId));
    if (onToast) onToast(`Selected flight: ${flight.airline} ($${flight.price})`, 'success');
  };

  const handleSelectHotel = (hotel) => {
    saveTrackingSelection(tripId, 'hotel', hotel);
    const state = getTrackingState(tripId);
    if (state) {
      state.hotelMode = 'basecamp';
      state.basecampHotel = hotel.name;
      saveTrackingState(tripId, state);
    }
    setTrackingState(getTrackingState(tripId));

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('tripwise_itinerary');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.hotelMode = 'basecamp';
          parsed.basecampHotel = hotel.name;
          localStorage.setItem('tripwise_itinerary', JSON.stringify(parsed));
        }
      } catch (e) {}
    }
    if (onToast) onToast(`Basecamp hotel set to ${hotel.name}`, 'success');
  };

  const handleClearSelection = (type) => {
    if (type === 'hotel') {
      const updatedState = {
        ...trackingState,
        selectedHotel: null,
        hotelMode: 'undecided',
        basecampHotel: null,
        basecampHotelDetails: null
      };
      setTrackingState(updatedState);
      saveTrackingState(tripId, updatedState);
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('tripwise_itinerary');
          if (raw) {
            const itin = JSON.parse(raw);
            itin.hotelMode = 'undecided';
            itin.basecampHotel = null;
            itin.basecampHotelDetails = null;
            localStorage.setItem('tripwise_itinerary', JSON.stringify(itin));
          }
        } catch (e) {}
      }
      if (onToast) onToast('Hotel selection reset. Browse options below to pick a new stay.', 'info');
    } else {
      saveTrackingSelection(tripId, type, null);
      setTrackingState(getTrackingState(tripId));
    }
  };

  const handleRedirect = (type, linkInfo) => {
    setRedirectingType(type);
    setTimeout(() => {
      setRedirectingType(null);
      if (typeof window !== 'undefined' && linkInfo?.url) {
        window.open(linkInfo.url, '_blank', 'noopener,noreferrer');
      }
    }, 650);
  };

  const toggleFlightShortlist = (flightId) => {
    setFlightShortlist(prev => {
      if (prev.includes(flightId)) return prev.filter(id => id !== flightId);
      if (prev.length >= 3) {
        if (onToast) onToast('You can compare up to 3 flights at a time', 'info');
        return prev;
      }
      return [...prev, flightId];
    });
  };

  const toggleHotelShortlist = (hotelId) => {
    setHotelShortlist(prev => {
      if (prev.includes(hotelId)) return prev.filter(id => id !== hotelId);
      if (prev.length >= 3) {
        if (onToast) onToast('You can compare up to 3 hotels at a time', 'info');
        return prev;
      }
      return [...prev, hotelId];
    });
  };

  if (!destinationName) return null;

  if (isOffline) {
    return (
      <div className="bg-white/80 rounded-3xl border border-[#E6DFD5] p-8 text-center max-w-xl mx-auto shadow-sm my-6 font-sans">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center mx-auto text-amber-600 mb-4">
          <WifiOff className="w-7 h-7" />
        </div>
        <h3 className="font-serif text-xl font-bold text-[#1E1C1A] mb-2">
          Requires Internet Connection
        </h3>
        <p className="text-xs text-[#7A7268] max-w-md mx-auto leading-relaxed mb-6">
          Price tracking requires an active internet connection to query live flight deals and hotel rates across global booking engines.
        </p>

        {trackingState ? (
          <div className="bg-[#FAF6F0] rounded-2xl p-4 border border-[#E6DFD5] text-left text-xs space-y-2">
            <p className="font-bold text-[#1E1C1A] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Cached Tracking Session Available</span>
            </p>
            <p className="text-gray-600 leading-normal">
              Tracking configured for <strong>{destinationName}</strong> (Origin: {trackingState.config?.origin || 'JFK'}). Live price monitoring will resume automatically when you reconnect.
            </p>
          </div>
        ) : (
          <div className="bg-[#FAF6F0] rounded-2xl p-3.5 border border-[#E6DFD5] text-center text-xs text-gray-500">
            Reconnect to an active network to activate price tracking for {destinationName}.
          </div>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center p-12 text-[#7A7268]">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  // Calculate Stay Nights for Hotel Total
  const getStayNights = () => {
    if (!startDate || !endDate) return 4;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diffTime = Math.abs(e - s);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 4;
  };
  const stayNights = getStayNights();

  // Budget calculations
  const getEstBudget = () => {
    if (itinerary?.budgetAmount) return itinerary.budgetAmount;
    const pref = itinerary?.budget || 'standard';
    if (pref === 'budget') return 950;
    if (pref === 'luxury') return 3200;
    return 1450;
  };
  const estBudget = getEstBudget();

  const selectedFlightPrice = trackingState?.selectedFlight?.price || 0;
  const selectedHotelPrice = trackingState?.selectedHotel?.price ? trackingState.selectedHotel.price * stayNights : 0;
  const totalSelectedPrice = selectedFlightPrice + selectedHotelPrice;
  const remainingBudget = estBudget - totalSelectedPrice;

  // Active Tracking View
  if (trackingState) {
    const destShort = destinationName.split(',')[0];

    // Flight metrics for badges
    const minFlightPrice = flights.length > 0 ? Math.min(...flights.map(f => f.price)) : 0;
    const minFlightDuration = flights.length > 0 ? Math.min(...flights.map(f => f.durationMinutes || 999)) : 0;
    const bestValueFlightId = flights.length > 0 ? flights.reduce((best, f) => {
      if (!best) return f.id;
      const currentBest = flights.find(x => x.id === best);
      const fScore = f.price + (f.stops * 100) + ((f.durationMinutes || 0) * 0.4);
      const bestScore = currentBest.price + (currentBest.stops * 100) + ((currentBest.durationMinutes || 0) * 0.4);
      return fScore < bestScore ? f.id : best;
    }, null) : null;

    // Hotel metrics for badges
    const minHotelPrice = hotels.length > 0 ? Math.min(...hotels.map(h => h.price)) : 0;
    const bestValueHotelId = hotels.length > 0 ? hotels.reduce((best, h) => {
      if (!best) return h.id;
      const currentBest = hotels.find(x => x.id === best);
      const hScore = h.price / (h.rating * h.rating);
      const bestScore = currentBest.price / (currentBest.rating * currentBest.rating);
      return hScore < bestScore ? h.id : best;
    }, null) : null;

    const sortedFlights = [...flights]
      .filter(f => flightStops === 'any' ? true : flightStops === 'nonstop' ? f.stops === 0 : f.stops === 1)
      .sort((a, b) => {
        if (flightSort === 'price') return a.price - b.price;
        if (flightSort === 'duration') return (a.durationMinutes || 0) - (b.durationMinutes || 0);
        if (flightSort === 'best') return (a.id === bestValueFlightId ? -1 : 1);
        return 0;
      });

    const sortedHotels = [...hotels]
      .filter(h => hotelRating === 'any' ? true : h.rating >= parseInt(hotelRating))
      .sort((a, b) => {
        if (hotelSort === 'price') return a.price - b.price;
        if (hotelSort === 'rating') return b.rating - a.rating;
        if (hotelSort === 'best') return (a.id === bestValueHotelId ? -1 : 1);
        return 0;
      });

    const totalItineraryStops = itinerary?.days 
      ? itinerary.days.reduce((acc, d) => acc + (d.activities?.length || 0), 0) 
      : 9;

    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 relative pb-16">
        {/* Requirement 2 & 3: PERSISTENT STICKY TRIP CONTEXT & LIVE BUDGET HEADER */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border border-[#E6DFD5] rounded-2xl p-4 shadow-sm transition-all mb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-black text-lg text-[#1E1C1A]">{destShort} Trip</span>
                <span className="text-xs font-mono bg-[#FAF6F0] border border-[#E6DFD5] px-2 py-0.5 rounded text-[#7A7268]">
                  {startDate && endDate ? `${startDate} – ${endDate}` : 'Sep 4–6, 2026'}
                </span>
              </div>
              <p className="text-xs text-[#7A7268] mt-0.5">
                Tracking <strong className="text-[#1E1C1A]">{trackingState?.config?.origin || 'JFK'} → {destShort}</strong> &middot; Target Est. Budget: <strong className="text-[#1E1C1A]">${estBudget}</strong>
              </p>
            </div>

            {/* Live Budget Impact Tally */}
            <div className="flex items-center gap-4 bg-[#FAF6F0] px-4 py-2 rounded-xl border border-[#E6DFD5] justify-between md:justify-end">
              <div className="text-right">
                <div className="text-xs text-[#7A7268] font-bold">Selected so far</div>
                <div className="text-base font-serif font-black text-[#1E1C1A]">
                  ${totalSelectedPrice} <span className="text-xs font-normal text-[#7A7268]">of ${estBudget}</span>
                </div>
              </div>

              <div className="h-8 w-px bg-[#E6DFD5]" />

              <div className="text-right">
                <div className="text-xs font-bold text-[#7A7268]">Remaining</div>
                <div className={`text-sm font-bold ${remainingBudget >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {remainingBudget >= 0 ? `$${remainingBudget} left` : `$${Math.abs(remainingBudget)} over`}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-black text-[#1E1C1A] tracking-tight">Active Price Tracking</h2>
            <p className="text-sm font-sans text-[#7A7268] mt-0.5">
              Live updates & smart booking comparison tools
            </p>
          </div>
          <button 
            onClick={handleStopTracking}
            className="px-4 py-2 text-xs font-bold font-sans text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors border border-red-100 cursor-pointer"
          >
            Stop Tracking
          </button>
        </div>

        <div className="space-y-6">
          {/* FLIGHTS SECTION */}
          {(trackingState?.config?.trackFlights ?? true) && (
            <div className="bg-[#FAF6F0] rounded-3xl border border-[#E6DFD5] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Plane className="w-6 h-6 text-[#FF6B2C]" />
                  <h3 className="font-serif text-xl font-bold text-[#1E1C1A]">Flights</h3>
                </div>
                {trackingState.selectedFlight && (
                  <button onClick={() => handleClearSelection('flight')} className="text-xs font-semibold text-[#7A7268] hover:text-[#1E1C1A] underline cursor-pointer">
                    Change Selection
                  </button>
                )}
              </div>

              {trackingState.selectedFlight ? (() => {
                const flightLinkInfo = getBookingLinkInfo(destinationName, 'flight', trackingState.selectedFlight, {
                  origin: trackingState.config?.origin,
                  startDate
                });

                return (
                  <div className="bg-white rounded-2xl border border-[#FF6B2C] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="bg-[#FF6B2C] text-white text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-sm">Selected Flight</span>
                        <span className="text-sm font-bold text-[#1E1C1A]">{trackingState.selectedFlight.airline}</span>
                        <span className="text-[11px] font-mono text-[#7A7268] bg-[#F5F0E8] px-1.5 py-0.5 rounded">{trackingState.selectedFlight.flightNumber}</span>
                      </div>
                      <div className="text-xs font-medium text-[#7A7268] flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[#1E1C1A]">{trackingState.selectedFlight.departureTime} – {trackingState.selectedFlight.arrivalTime}</span>
                        <span>&middot;</span>
                        <span>{trackingState.selectedFlight.duration}</span>
                        <span>&middot;</span>
                        <span className={trackingState.selectedFlight.stops === 0 ? 'text-emerald-700 font-bold' : 'text-[#4A443E]'}>
                          {trackingState.selectedFlight.stops === 0 ? 'Nonstop' : `1 Stop ${trackingState.selectedFlight.via ? `via ${trackingState.selectedFlight.via}` : ''}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 w-full md:w-auto">
                      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                        <div className="text-right">
                          <div className="text-2xl font-serif font-black text-[#1E1C1A]">${trackingState.selectedFlight.price}</div>
                          <div className="text-[10px] text-[#7A7268] uppercase font-bold tracking-wider">Round Trip</div>
                        </div>
                        <button 
                          onClick={() => handleRedirect('flight', flightLinkInfo)}
                          disabled={redirectingType === 'flight'}
                          className="bg-[#1E1C1A] hover:bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-75 cursor-pointer"
                        >
                          {redirectingType === 'flight' ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-[#FF6B2C]" />
                              <span>Refreshing price...</span>
                            </>
                          ) : (
                            <>
                              <span>{flightLinkInfo.buttonText}</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                      {flightLinkInfo.disclosureNote && (
                        <div className="text-[11px] text-[#7A7268] font-medium flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>{flightLinkInfo.disclosureNote}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })() : (
                <>
                  {/* Segmented Controls for Flights */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3 p-3 bg-white/70 rounded-2xl border border-[#E6DFD5]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-bold text-[#7A7268] uppercase tracking-wider mr-1">Sort:</span>
                      <button 
                        onClick={() => setFlightSort('price')} 
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${flightSort === 'price' ? 'bg-[#1E1C1A] text-white shadow-xs' : 'bg-white text-[#4A443E] hover:bg-[#F5F0E8] border border-[#E6DFD5]'}`}
                      >
                        Cheapest
                      </button>
                      <button 
                        onClick={() => setFlightSort('duration')} 
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${flightSort === 'duration' ? 'bg-[#1E1C1A] text-white shadow-xs' : 'bg-white text-[#4A443E] hover:bg-[#F5F0E8] border border-[#E6DFD5]'}`}
                      >
                        Fastest
                      </button>
                      <button 
                        onClick={() => setFlightSort('best')} 
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${flightSort === 'best' ? 'bg-[#1E1C1A] text-white shadow-xs' : 'bg-white text-[#4A443E] hover:bg-[#F5F0E8] border border-[#E6DFD5]'}`}
                      >
                        Best Value
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-bold text-[#7A7268] uppercase tracking-wider mr-1">Stops:</span>
                      <button 
                        onClick={() => setFlightStops('any')} 
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${flightStops === 'any' ? 'bg-[#FF6B2C] text-white shadow-xs' : 'bg-white text-[#4A443E] hover:bg-[#F5F0E8] border border-[#E6DFD5]'}`}
                      >
                        All
                      </button>
                      <button 
                        onClick={() => setFlightStops('nonstop')} 
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${flightStops === 'nonstop' ? 'bg-[#FF6B2C] text-white shadow-xs' : 'bg-white text-[#4A443E] hover:bg-[#F5F0E8] border border-[#E6DFD5]'}`}
                      >
                        Nonstop
                      </button>
                      <button 
                        onClick={() => setFlightStops('1stop')} 
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${flightStops === '1stop' ? 'bg-[#FF6B2C] text-white shadow-xs' : 'bg-white text-[#4A443E] hover:bg-[#F5F0E8] border border-[#E6DFD5]'}`}
                      >
                        1 Stop
                      </button>
                    </div>
                  </div>

                  {/* Requirement 1: Price Distribution Bar */}
                  <PriceDistributionBar 
                    items={sortedFlights} 
                    type="flight" 
                    selectedId={trackingState.selectedFlight?.id} 
                    isLoading={isLoadingResults} 
                  />

                  {isLoadingResults ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white/80 animate-pulse rounded-2xl border border-[#E6DFD5] p-5 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-10 h-10 bg-[#E6DFD5]/60 rounded-xl" />
                            <div className="space-y-2 flex-1">
                              <div className="h-4 w-1/3 bg-[#E6DFD5]/60 rounded-md" />
                              <div className="h-3 w-1/2 bg-[#E6DFD5]/40 rounded-md" />
                            </div>
                          </div>
                          <div className="w-24 h-10 bg-[#E6DFD5]/60 rounded-xl" />
                        </div>
                      ))}
                    </div>
                  ) : flights.length > 0 ? (
                    <div className="space-y-3">
                      {sortedFlights.slice(0, 6).map((flight, index) => {
                        const isSelected = trackingState.selectedFlight?.id === flight.id;
                        const isBestValue = flight.id === bestValueFlightId;
                        const isCheapest = flight.price === minFlightPrice;
                        const isFastest = flight.durationMinutes === minFlightDuration;
                        const isShortlisted = flightShortlist.includes(flight.id);

                        return (
                          <motion.div 
                            key={flight.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: index * 0.03 }}
                            className={`relative rounded-2xl p-4 sm:p-5 transition-all duration-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 ${
                              isSelected
                                ? 'bg-[#FFF9F5] border-2 border-[#FF6B2C] shadow-md ring-2 ring-[#FF6B2C]/20'
                                : isBestValue
                                ? 'bg-[#FFFBF7] border-2 border-[#FF6B2C]/70 shadow-sm hover:-translate-y-0.5 hover:shadow-md'
                                : 'bg-white border border-[#E6DFD5] hover:border-[#FF6B2C]/40 hover:-translate-y-0.5 hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-start gap-3 flex-1">
                              {/* Requirement 5: Comparison Checkbox */}
                              <button 
                                onClick={() => toggleFlightShortlist(flight.id)}
                                className="mt-1 text-[#7A7268] hover:text-[#1E1C1A] transition-colors cursor-pointer"
                                title="Compare flight"
                              >
                                {isShortlisted ? (
                                  <CheckSquare className="w-4.5 h-4.5 text-[#FF6B2C]" />
                                ) : (
                                  <Square className="w-4.5 h-4.5" />
                                )}
                              </button>

                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                  {isBestValue && (
                                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-[#FF6B2C] text-white shadow-xs">
                                      ★ Best Value
                                    </span>
                                  )}
                                  {isCheapest && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      Cheapest
                                    </span>
                                  )}
                                  {isFastest && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                                      Fastest
                                    </span>
                                  )}

                                  {/* Requirement 7: Micro Trend Indicator */}
                                  {flight.trend && (
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                                      flight.trend.type === 'down' 
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                        : flight.trend.type === 'up'
                                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                        : 'bg-[#F5F0E8] text-[#7A7268]'
                                    }`}>
                                      {flight.trend.type === 'down' ? <TrendingDown className="w-3 h-3" /> : flight.trend.type === 'up' ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                      <span>{flight.trend.text}</span>
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-3">
                                  <img 
                                    src={flight.logo} 
                                    alt={flight.airline} 
                                    className="w-7 h-7 object-contain rounded-md bg-white border border-[#E6DFD5] p-0.5 shrink-0 shadow-xs" 
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                  <div>
                                    <div className="text-sm font-bold text-[#1E1C1A] flex items-center gap-2">
                                      <span>{flight.airline}</span>
                                      <span className="text-[11px] font-mono text-[#7A7268] bg-[#F5F0E8] px-1.5 py-0.5 rounded">{flight.flightNumber}</span>
                                    </div>
                                    <div className="text-xs font-medium text-[#7A7268] mt-0.5 flex flex-wrap items-center gap-2">
                                      <span className="font-semibold text-[#1E1C1A]">{flight.departureTime} – {flight.arrivalTime}</span>
                                      <span>&middot;</span>
                                      <span>{flight.duration}</span>
                                      <span>&middot;</span>
                                      <span className={flight.stops === 0 ? 'text-emerald-700 font-bold' : 'text-[#4A443E]'}>
                                        {flight.stops === 0 ? 'Nonstop' : `1 Stop ${flight.via ? `via ${flight.via}` : ''}`}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-[#E6DFD5]/60 pt-3 md:pt-0">
                              <div className="text-right">
                                <div className="text-2xl font-serif font-black text-[#1E1C1A]">${flight.price}</div>
                                <div className="text-[10px] text-[#7A7268] uppercase font-bold tracking-wider">Round Trip</div>
                              </div>
                              {isSelected ? (
                                <button onClick={() => handleClearSelection('flight')} className="bg-[#FF6B2C] text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5 shadow-sm hover:bg-[#e0591e] transition-colors cursor-pointer">
                                  <CheckCircle2 className="w-4 h-4" /> Selected
                                </button>
                              ) : (
                                <button onClick={() => handleSelectFlight(flight)} className="bg-[#F5F0E8] hover:bg-[#E6DFD5] text-[#1E1C1A] px-4.5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] cursor-pointer">
                                  Select Flight
                                </button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-[#7A7268] text-sm">No flights found for these dates. Try adjusting your itinerary.</div>
                  )}
                </>
              )}
            </div>
          )}

          {/* HOTELS SECTION */}
          {(trackingState?.config?.trackHotels ?? true) && (() => {
            const currentHotelMode = trackingState?.hotelMode || propHotelMode || (propBasecampHotel ? 'basecamp' : 'undecided');
            const currentBasecampHotel = trackingState?.basecampHotel || propBasecampHotel;

            // MODE A: "basecamp" - Hotel already specified at planning time
            if (currentHotelMode === 'basecamp' && !trackingState?.selectedHotel) {
              const basecampLinkInfo = getBookingLinkInfo(destinationName, 'hotel', { name: currentBasecampHotel }, { startDate, endDate });

              return (
                <div className="bg-[#FAF6F0] rounded-3xl border border-[#E6DFD5] p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Hotel className="w-6 h-6 text-[#FF6B2C]" />
                      <h3 className="font-serif text-xl font-bold text-[#1E1C1A]">Hotels & Stay</h3>
                    </div>
                    <span className="bg-[#FF6B2C] text-white text-[10px] uppercase font-extrabold px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Basecamp Confirmed
                    </span>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#E6DFD5] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-[#FAF6F0] border border-[#FF6B2C]/30 rounded-2xl flex items-center justify-center text-2xl shrink-0">
                        🏨
                      </div>
                      <div>
                        <div className="text-[11px] font-mono font-extrabold text-[#FF6B2C] uppercase tracking-wider mb-1">
                          Confirmed Basecamp Stay
                        </div>
                        <h4 className="text-xl font-serif font-bold text-[#1E1C1A]">
                          {currentBasecampHotel || "Your Booked Hotel"}
                        </h4>
                        <p className="text-xs text-[#7A7268] mt-1 flex items-center gap-1 leading-relaxed">
                          <MapPin className="w-3.5 h-3.5 text-[#FF6B2C] shrink-0" />
                          <span>Your itinerary activity routing and travel times are optimized around this stay.</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <button 
                        onClick={() => handleRedirect('hotel', basecampLinkInfo)}
                        disabled={redirectingType === 'hotel'}
                        className="w-full md:w-auto bg-[#1E1C1A] hover:bg-black text-white px-5 py-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-2 shadow-sm disabled:opacity-75 cursor-pointer"
                      >
                        {redirectingType === 'hotel' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-[#FF6B2C]" />
                            <span>Opening partner...</span>
                          </>
                        ) : (
                          <>
                            <span>{basecampLinkInfo.buttonText}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 p-3.5 bg-white/60 rounded-xl border border-[#E6DFD5] text-xs text-[#7A7268] flex items-center justify-between flex-wrap gap-2">
                    <span className="flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-[#FF6B2C] shrink-0" />
                      Want to change your stay? Browse live hotel options below or edit in planner.
                    </span>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleClearSelection('hotel')} 
                        className="text-xs font-bold text-[#FF6B2C] hover:text-[#C2410C] underline transition-colors cursor-pointer"
                      >
                        Browse &amp; Change Hotel &rarr;
                      </button>
                      <Link 
                        href="/ai-planner/new?step=destination" 
                        className="text-xs font-bold text-[#1E1C1A] hover:text-[#FF6B2C] underline transition-colors"
                      >
                        Edit in Planner &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              );
            }

            // MODE B: "undecided" - Browse & Select Hotels
            return (
              <div className="bg-[#FAF6F0] rounded-3xl border border-[#E6DFD5] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Hotel className="w-6 h-6 text-[#FF6B2C]" />
                    <h3 className="font-serif text-xl font-bold text-[#1E1C1A]">Hotels</h3>
                  </div>

                  {/* Requirement 6: List vs Map View Toggle */}
                  <div className="flex items-center gap-3">
                    {!trackingState.selectedHotel && (
                      <div className="bg-white rounded-xl border border-[#E6DFD5] p-0.5 flex items-center">
                        <button 
                          onClick={() => setHotelViewMode('list')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                            hotelViewMode === 'list' ? 'bg-[#1E1C1A] text-white shadow-xs' : 'text-[#7A7268] hover:text-[#1E1C1A]'
                          }`}
                        >
                          <List className="w-3.5 h-3.5" /> List
                        </button>
                        <button 
                          onClick={() => setHotelViewMode('map')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                            hotelViewMode === 'map' ? 'bg-[#FF6B2C] text-white shadow-xs' : 'text-[#7A7268] hover:text-[#1E1C1A]'
                          }`}
                        >
                          <Map className="w-3.5 h-3.5" /> Map View
                        </button>
                      </div>
                    )}

                    {trackingState.selectedHotel && (
                      <button onClick={() => handleClearSelection('hotel')} className="text-xs font-semibold text-[#7A7268] hover:text-[#1E1C1A] underline cursor-pointer">
                        Change Selection
                      </button>
                    )}
                  </div>
                </div>

                {trackingState.selectedHotel ? (() => {
                  const hotelLinkInfo = getBookingLinkInfo(destinationName, 'hotel', trackingState.selectedHotel, {
                    startDate,
                    endDate
                  });

                  return (
                    <div className="space-y-4">
                      <div className="bg-white rounded-2xl border border-[#FF6B2C] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                        <div className="flex items-center gap-4">
                          <img src={trackingState.selectedHotel.image} alt="Hotel" className="w-20 h-20 rounded-xl object-cover border border-[#E6DFD5]" />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="bg-[#FF6B2C] text-white text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-sm">Selected Hotel</span>
                              <span className="text-sm font-bold text-[#1E1C1A]">{trackingState.selectedHotel.name}</span>
                            </div>
                            <div className="text-xs font-medium text-[#7A7268] flex items-center gap-1.5">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {trackingState.selectedHotel.rating}.0 Stars &middot; {trackingState.selectedHotel.distance}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 w-full md:w-auto">
                          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                            <div className="text-right">
                              <div className="text-2xl font-serif font-black text-[#1E1C1A]">${trackingState.selectedHotel.price}</div>
                              <div className="text-[10px] text-[#7A7268] uppercase font-bold tracking-wider">Per Night</div>
                            </div>
                            <button 
                              onClick={() => handleRedirect('hotel', hotelLinkInfo)}
                              disabled={redirectingType === 'hotel'}
                              className="bg-[#1E1C1A] hover:bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-75 cursor-pointer"
                            >
                              {redirectingType === 'hotel' ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin text-[#FF6B2C]" />
                                  <span>Refreshing price...</span>
                                </>
                              ) : (
                                <>
                                  <span>{hotelLinkInfo.buttonText}</span>
                                  <ArrowRight className="w-4 h-4" />
                                </>
                              )}
                            </button>
                          </div>
                          {hotelLinkInfo.disclosureNote && (
                            <div className="text-[11px] text-[#7A7268] font-medium flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>{hotelLinkInfo.disclosureNote}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Re-optimize Itinerary Prompt Banner */}
                      <div className="bg-[#FFF9F5] rounded-2xl border-2 border-[#FF6B2C] p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#FF6B2C]/10 rounded-xl flex items-center justify-center text-xl shrink-0 font-bold">
                            ⚡
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-[#1E1C1A]">
                              Selected: {trackingState.selectedHotel.name}
                            </h4>
                            <p className="text-xs text-[#7A7268] mt-0.5">
                              Want us to re-optimize your itinerary activities and routing around {trackingState.selectedHotel.name}?
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={async () => {
                            if (onReoptimize && trackingState?.selectedHotel) {
                              setIsReoptimizing(true);
                              await onReoptimize(trackingState.selectedHotel.name, trackingState.selectedHotel);
                              setIsReoptimizing(false);
                            }
                          }}
                          disabled={isReoptimizing}
                          className="w-full md:w-auto bg-[#FF6B2C] hover:bg-[#e0591e] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 disabled:opacity-75 cursor-pointer"
                        >
                          {isReoptimizing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-white" />
                              <span>Re-optimizing your itinerary...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              <span>Re-optimize Itinerary Around Hotel</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })() : (
                  <>
                    {/* Segmented Controls for Hotels */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3 p-3 bg-white/70 rounded-2xl border border-[#E6DFD5]">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-bold text-[#7A7268] uppercase tracking-wider mr-1">Sort:</span>
                        <button 
                          onClick={() => setHotelSort('price')} 
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${hotelSort === 'price' ? 'bg-[#1E1C1A] text-white shadow-xs' : 'bg-white text-[#4A443E] hover:bg-[#F5F0E8] border border-[#E6DFD5]'}`}
                        >
                          Cheapest
                        </button>
                        <button 
                          onClick={() => setHotelSort('rating')} 
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${hotelSort === 'rating' ? 'bg-[#1E1C1A] text-white shadow-xs' : 'bg-white text-[#4A443E] hover:bg-[#F5F0E8] border border-[#E6DFD5]'}`}
                        >
                          Top Rated
                        </button>
                        <button 
                          onClick={() => setHotelSort('best')} 
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${hotelSort === 'best' ? 'bg-[#1E1C1A] text-white shadow-xs' : 'bg-white text-[#4A443E] hover:bg-[#F5F0E8] border border-[#E6DFD5]'}`}
                        >
                          Best Value
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-bold text-[#7A7268] uppercase tracking-wider mr-1">Rating:</span>
                        <button 
                          onClick={() => setHotelRating('any')} 
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${hotelRating === 'any' ? 'bg-[#FF6B2C] text-white shadow-xs' : 'bg-white text-[#4A443E] hover:bg-[#F5F0E8] border border-[#E6DFD5]'}`}
                        >
                          All
                        </button>
                        <button 
                          onClick={() => setHotelRating('4')} 
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${hotelRating === '4' ? 'bg-[#FF6B2C] text-white shadow-xs' : 'bg-white text-[#4A443E] hover:bg-[#F5F0E8] border border-[#E6DFD5]'}`}
                        >
                          4+ Stars
                        </button>
                        <button 
                          onClick={() => setHotelRating('5')} 
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${hotelRating === '5' ? 'bg-[#FF6B2C] text-white shadow-xs' : 'bg-white text-[#4A443E] hover:bg-[#F5F0E8] border border-[#E6DFD5]'}`}
                        >
                          5 Stars
                        </button>
                      </div>
                    </div>

                    {/* Requirement 6: Render Interactive MAP View or LIST View */}
                    {hotelViewMode === 'map' ? (
                      <HotelMapView 
                        hotels={sortedHotels} 
                        itinerary={itinerary} 
                        selectedHotel={trackingState.selectedHotel} 
                        onSelectHotel={handleSelectHotel} 
                        stayNights={stayNights} 
                      />
                    ) : (
                      <>
                        {/* Requirement 1: Price Distribution Bar for Hotels */}
                        <PriceDistributionBar 
                          items={sortedHotels} 
                          type="hotel" 
                          selectedId={trackingState.selectedHotel?.id} 
                          isLoading={isLoadingResults} 
                        />

                        {isLoadingResults ? (
                          <div className="space-y-3">
                            {[1, 2, 3, 4].map(i => (
                              <div key={i} className="bg-white/80 animate-pulse rounded-2xl border border-[#E6DFD5] p-5 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="w-24 h-24 bg-[#E6DFD5]/60 rounded-xl" />
                                  <div className="space-y-2 flex-1">
                                    <div className="h-4 w-1/3 bg-[#E6DFD5]/60 rounded-md" />
                                    <div className="h-3 w-1/2 bg-[#E6DFD5]/40 rounded-md" />
                                  </div>
                                </div>
                                <div className="w-24 h-10 bg-[#E6DFD5]/60 rounded-xl" />
                              </div>
                            ))}
                          </div>
                        ) : hotels.length > 0 ? (
                          <div className="space-y-3">
                            {sortedHotels.slice(0, 6).map((hotel, index) => {
                              const isSelected = trackingState.selectedHotel?.id === hotel.id;
                              const isBestValue = hotel.id === bestValueHotelId;
                              const isCheapest = hotel.price === minHotelPrice;
                              const isShortlisted = hotelShortlist.includes(hotel.id);
                              
                              // Requirement 4: Calculate itinerary stop proximity
                              const nearbyStopsCount = Math.max(3, Math.min(totalItineraryStops, Math.round(totalItineraryStops * (1 - (index * 0.08)))));

                              return (
                                <motion.div 
                                  key={hotel.id} 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.25, delay: index * 0.03 }}
                                  className={`relative rounded-2xl p-4 sm:p-5 transition-all duration-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 ${
                                    isSelected
                                      ? 'bg-[#FFF9F5] border-2 border-[#FF6B2C] shadow-md ring-2 ring-[#FF6B2C]/20'
                                      : isBestValue
                                      ? 'bg-[#FFFBF7] border-2 border-[#FF6B2C]/70 shadow-sm hover:-translate-y-0.5 hover:shadow-md'
                                      : 'bg-white border border-[#E6DFD5] hover:border-[#FF6B2C]/40 hover:-translate-y-0.5 hover:shadow-md'
                                  }`}
                                >
                                  <div className="flex items-center gap-3.5 flex-1">
                                    {/* Requirement 5: Comparison Checkbox */}
                                    <button 
                                      onClick={() => toggleHotelShortlist(hotel.id)}
                                      className="text-[#7A7268] hover:text-[#1E1C1A] transition-colors cursor-pointer"
                                      title="Compare hotel"
                                    >
                                      {isShortlisted ? (
                                        <CheckSquare className="w-4.5 h-4.5 text-[#FF6B2C]" />
                                      ) : (
                                        <Square className="w-4.5 h-4.5" />
                                      )}
                                    </button>

                                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-[#F5F0E8] shrink-0 border border-[#E6DFD5]">
                                      <img 
                                        src={hotel.image} 
                                        alt={hotel.name} 
                                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                        onError={(e) => {
                                          e.currentTarget.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&h=350&fit=crop';
                                        }}
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                        {isBestValue && (
                                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-[#FF6B2C] text-white shadow-xs">
                                            ★ Best Value
                                          </span>
                                        )}
                                        {isCheapest && (
                                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                            Cheapest
                                          </span>
                                        )}

                                        {/* Requirement 7: Micro Trend Tag */}
                                        {hotel.trend && (
                                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                                            hotel.trend.type === 'down' 
                                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                              : hotel.trend.type === 'up'
                                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                              : 'bg-[#F5F0E8] text-[#7A7268]'
                                          }`}>
                                            {hotel.trend.type === 'down' ? <TrendingDown className="w-3 h-3" /> : hotel.trend.type === 'up' ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                            <span>{hotel.trend.text}</span>
                                          </span>
                                        )}
                                      </div>

                                      <div className="text-base font-bold text-[#1E1C1A] mb-1">{hotel.name}</div>
                                      
                                      <div className="text-xs font-medium text-[#7A7268] flex items-center gap-2 flex-wrap mb-1.5">
                                        <span className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200/60 font-bold">
                                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {hotel.rating}.0
                                        </span>
                                        <span>&middot;</span>
                                        <span>{hotel.distance}</span>
                                      </div>

                                      {/* Requirement 4: Proximity Context Tag */}
                                      <div className="text-[11px] font-medium text-emerald-800 bg-emerald-50/90 border border-emerald-200/70 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-emerald-700" />
                                        <span><strong>{nearbyStopsCount} of {totalItineraryStops}</strong> planned stops within 15 min</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-[#E6DFD5]/60 pt-3 md:pt-0">
                                    <div className="text-right">
                                      <div className="flex items-baseline justify-end gap-1">
                                        <span className="text-2xl font-serif font-black text-[#1E1C1A]">${hotel.price}</span>
                                        <span className="text-xs text-[#7A7268] font-bold">/night</span>
                                      </div>
                                      <div className="text-xs font-medium text-[#7A7268] mt-0.5">
                                        <span className="font-bold text-[#1E1C1A]">${hotel.price * stayNights}</span> total ({stayNights} nights)
                                      </div>
                                    </div>
                                    {isSelected ? (
                                      <button onClick={() => handleClearSelection('hotel')} className="bg-[#FF6B2C] text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5 shadow-sm hover:bg-[#e0591e] transition-colors cursor-pointer">
                                        <CheckCircle2 className="w-4 h-4" /> Selected
                                      </button>
                                    ) : (
                                      <button onClick={() => handleSelectHotel(hotel)} className="bg-[#F5F0E8] hover:bg-[#E6DFD5] text-[#1E1C1A] px-4.5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] cursor-pointer">
                                        Select Hotel
                                      </button>
                                    )}
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-[#7A7268] text-sm">No hotels found for these dates. Try adjusting your itinerary.</div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            );
          })()}
        </div>

        {/* Requirement 5: Floating Bottom Action Bar for Comparison */}
        <AnimatePresence>
          {(flightShortlist.length > 0 || hotelShortlist.length > 0) && (
            <motion.div 
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#1E1C1A] text-white px-5 py-3 rounded-full shadow-2xl border border-white/20 flex items-center gap-4 backdrop-blur-md"
            >
              <div className="flex items-center gap-2 text-xs font-bold">
                <Scale className="w-4 h-4 text-[#FF6B2C]" />
                <span>
                  {flightShortlist.length > 0 
                    ? `${flightShortlist.length} Flight${flightShortlist.length > 1 ? 's' : ''} Checked`
                    : `${hotelShortlist.length} Hotel${hotelShortlist.length > 1 ? 's' : ''} Checked`}
                </span>
              </div>

              <button 
                onClick={() => setIsCompareModalOpen(flightShortlist.length > 0 ? 'flight' : 'hotel')}
                className="bg-[#FF6B2C] hover:bg-[#e0591e] text-white text-xs font-extrabold px-4 py-1.5 rounded-full transition-all shadow-xs cursor-pointer"
              >
                Compare Side-by-Side
              </button>

              <button 
                onClick={() => {
                  setFlightShortlist([]);
                  setHotelShortlist([]);
                }}
                className="text-xs text-white/70 hover:text-white underline cursor-pointer"
              >
                Clear
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Side-by-Side Comparison Modal */}
        <ComparisonModal 
          isOpen={!!isCompareModalOpen}
          onClose={() => setIsCompareModalOpen(null)}
          type={isCompareModalOpen || 'flight'}
          items={
            isCompareModalOpen === 'flight' 
              ? flights.filter(f => flightShortlist.includes(f.id))
              : hotels.filter(h => hotelShortlist.includes(h.id))
          }
          onSelect={(item) => {
            if (isCompareModalOpen === 'flight') handleSelectFlight(item);
            else handleSelectHotel(item);
          }}
          destinationName={destinationName}
          startDate={startDate}
          endDate={endDate}
          stayNights={stayNights}
        />

        <div className="flex items-start gap-2 bg-[#F5F0E8] rounded-xl p-4 mt-6">
          <Bell className="w-5 h-5 text-[#FF6B2C] shrink-0 mt-0.5" />
          <p className="text-sm text-[#4A443E] leading-relaxed">
            <span className="font-bold text-[#1E1C1A]">Price Drop Alerts:</span> We're actively tracking your {trackingState.selectedFlight || trackingState.selectedHotel ? 'selected items' : 'route/city baseline'}. If prices drop by <span className="font-bold text-[#1E1C1A]">10%+</span>, we'll send you an immediate notification.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#7A7268] mt-4 ml-1">
          <Clock className="w-3.5 h-3.5" />
          <span>Last checked: Just now &middot; Next check in 22 hours</span>
        </div>
      </div>
    );
  }

  // Unactivated Prompt View — Spacious Luxury Aviation & Hospitality Suite
  return (
    <motion.div 
      initial={{ opacity: 0, y: 22, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-3xl mx-auto bg-[#FFFFFF] rounded-3xl border border-[#E6DFD5] p-8 sm:p-10 text-center shadow-[0_25px_70px_-15px_rgba(0,0,0,0.08)] overflow-hidden"
    >
      {/* ── 1. Animated Aviation & Hotel Atmosphere Background (No AI Gradients) ── */}
      <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        {/* Soft Micro-Dot Matrix Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage: 'radial-gradient(#D5CBBF 1.2px, transparent 1.2px)',
            backgroundSize: '22px 22px'
          }}
        />

        {/* ── Flight Corridor 1 (High Altitude Eastbound Jet) ── */}
        <motion.div 
          className="absolute top-4 -left-48 w-[800px] h-28 opacity-30"
          animate={{ x: [-80, 260, -80] }}
          transition={{ repeat: Infinity, duration: 26, ease: "linear" }}
        >
          <svg viewBox="0 0 700 90" className="w-full h-full stroke-[#B8ACA0] fill-none" strokeWidth="1.2">
            <path d="M 0,25 Q 180,65 350,20 T 700,50" strokeDasharray="5 7" />
          </svg>
          <motion.div 
            className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[#FF6B2C]"
            animate={{ y: [-1, 1, -1] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          >
            <Plane className="w-3.5 h-3.5" style={{ transform: 'rotate(50deg)' }} />
            <span className="w-1 h-1 rounded-full bg-[#FF6B2C] animate-ping" />
          </motion.div>
        </motion.div>

        {/* ── Flight Corridor 2 (Mid Altitude Westbound Jet) ── */}
        <motion.div 
          className="absolute top-28 -right-48 w-[800px] h-28 opacity-20"
          animate={{ x: [80, -260, 80] }}
          transition={{ repeat: Infinity, duration: 32, ease: "linear" }}
        >
          <svg viewBox="0 0 700 90" className="w-full h-full stroke-[#C8BEB2] fill-none" strokeWidth="1">
            <path d="M 700,60 Q 500,15 350,55 T 0,25" strokeDasharray="4 8" />
          </svg>
          <motion.div 
            className="absolute top-6 left-1/3 text-[#8C827A]"
            animate={{ y: [1, -1, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          >
            <Plane className="w-3 h-3" style={{ transform: 'rotate(-130deg)' }} />
          </motion.div>
        </motion.div>

        {/* ── Drifting Cloud Air Currents ── */}
        <motion.div 
          className="absolute top-12 left-10 w-44 h-16 opacity-15 text-[#8C827A]"
          animate={{ x: [-15, 35, -15] }}
          transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
        >
          <svg viewBox="0 0 160 60" className="w-full h-full stroke-current fill-none" strokeWidth="1">
            <path d="M 10,40 Q 25,20 45,25 Q 65,10 90,20 Q 115,15 135,30 Q 150,35 145,45 Z" strokeDasharray="2 3" />
          </svg>
        </motion.div>

        {/* ── Architectural Boutique Hotel Skyline with Evening Dusk Windows (Lower-Right) ── */}
        <div className="absolute -bottom-4 -right-4 w-60 h-44 opacity-40 text-[#8C827A]">
          <svg viewBox="0 0 160 120" className="w-full h-full stroke-current fill-none" strokeWidth="1">
            {/* Main Hotel Grand Tower */}
            <rect x="50" y="20" width="60" height="95" rx="3" strokeDasharray="3 3" />
            <line x1="50" y1="45" x2="110" y2="45" />
            <line x1="50" y1="70" x2="110" y2="70" />
            <line x1="50" y1="95" x2="110" y2="95" />
            
            {/* Side Boutique Villa Wing */}
            <rect x="15" y="50" width="35" height="65" rx="2" strokeDasharray="2 3" />
            <line x1="15" y1="75" x2="50" y2="75" />
            
            {/* Rooftop Turret & Flag */}
            <polygon points="80,5 65,20 95,20" />
            <line x1="80" y1="5" x2="80" y2="0" />

            {/* Warm Animated Dusk Window Lights */}
            <motion.rect 
              x="58" y="27" width="10" height="11" rx="1" 
              className="fill-[#FF6B2C]"
              animate={{ opacity: [0.15, 0.85, 0.2] }}
              transition={{ repeat: Infinity, duration: 3.6, ease: "easeInOut" }}
            />
            <motion.rect 
              x="92" y="27" width="10" height="11" rx="1" 
              className="fill-[#FF6B2C]"
              animate={{ opacity: [0.35, 0.1, 0.75] }}
              transition={{ repeat: Infinity, duration: 4.2, delay: 0.5, ease: "easeInOut" }}
            />
            <motion.rect 
              x="58" y="52" width="10" height="11" rx="1" 
              className="fill-[#FF6B2C]"
              animate={{ opacity: [0.6, 0.2, 0.9] }}
              transition={{ repeat: Infinity, duration: 3.2, delay: 1, ease: "easeInOut" }}
            />
            <motion.rect 
              x="92" y="52" width="10" height="11" rx="1" 
              className="fill-[#FF6B2C]"
              animate={{ opacity: [0.2, 0.8, 0.15] }}
              transition={{ repeat: Infinity, duration: 4.8, delay: 0.8, ease: "easeInOut" }}
            />
            <motion.rect 
              x="23" y="57" width="8" height="10" rx="1" 
              className="fill-[#FF6B2C]"
              animate={{ opacity: [0.7, 0.15, 0.6] }}
              transition={{ repeat: Infinity, duration: 3.9, delay: 1.2, ease: "easeInOut" }}
            />
            <motion.rect 
              x="36" y="57" width="8" height="10" rx="1" 
              className="fill-[#FF6B2C]"
              animate={{ opacity: [0.25, 0.7, 0.3] }}
              transition={{ repeat: Infinity, duration: 4.5, delay: 0.3, ease: "easeInOut" }}
            />
          </svg>
        </div>

        {/* ── Aviation Radar Range Rings with Rotating Sweep (Upper-Left) ── */}
        <div className="absolute -top-12 -left-12 w-48 h-48 opacity-25">
          <div className="absolute inset-0 rounded-full border border-dashed border-[#8C827A]" />
          <div className="absolute inset-8 rounded-full border border-[#D5CBBF]" />
          <div className="absolute inset-16 rounded-full border border-[#D5CBBF]" />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            className="absolute inset-0"
          >
            <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-[#FF6B2C]/45 -translate-x-1/2" />
          </motion.div>
        </div>

        {/* ── Vintage Cartography Corner Stamps ── */}
        <div className="absolute top-3.5 left-4 text-[9px] font-mono text-[#A89F91] tracking-wider select-none">
          + LAT 41°54&apos;N &middot; LON 12°29&apos;E
        </div>
        <div className="absolute top-3.5 right-4 text-[9px] font-mono text-[#A89F91] tracking-wider select-none">
          RADAR 24/7 ACTIVE +
        </div>
      </div>

      {/* ── 2. Top Luxury Aviation Route & Hotel Status HUD ── */}
      <div className="relative z-10 w-full max-w-lg mx-auto mb-6 px-4 py-2.5 bg-[#FAF6F0] border border-[#E6DFD5] rounded-full flex items-center justify-between shadow-xs">
        {/* Origin Airport Badge */}
        <motion.div 
          key={config.origin}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-md border border-[#E6DFD5] shadow-2xs"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-[11px] font-black text-[#1E1C1A]">
            {config.origin || 'JFK'} &middot; ORIGIN
          </span>
        </motion.div>

        {/* Animated Geodesic Flight Route Line with Flying Jet */}
        <div className="relative flex-1 mx-3 flex items-center justify-center">
          <div className="w-full h-[1.5px] bg-[#E6DFD5] relative overflow-hidden">
            <motion.div 
              className="absolute inset-0 h-full w-full"
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, #FF6B2C 0, #FF6B2C 5px, transparent 5px, transparent 10px)',
              }}
              animate={{ x: [-20, 0] }}
              transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
            />
          </div>

          {/* Gliding Airplane Vector with Pulsing Strobe & Hover Drift */}
          <motion.div
            key={config.origin}
            animate={{ 
              x: [-14, 14, -14], 
              y: [-1.5, 1.5, -1.5],
              rotate: [42, 48, 42]
            }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute bg-[#FAF6F0] px-1 text-[#FF6B2C] flex items-center"
          >
            <Plane className="w-4 h-4 filter drop-shadow-xs" />
          </motion.div>
        </div>

        {/* Destination & Boutique Stay Badge */}
        <div className="flex items-center gap-1.5 bg-[#FFF2EA] px-3 py-1 rounded-md border border-[#FF6B2C]/30 shadow-2xs">
          <Hotel className="w-3.5 h-3.5 text-[#FF6B2C]" />
          <span className="font-mono text-[11px] font-black text-[#FF6B2C]">
            {destinationName?.slice(0, 8).toUpperCase() || 'DESTINATION'}
          </span>
        </div>
      </div>

      {/* ── 3. Notification Bell with Double Expanding Soundwaves ── */}
      <div className="relative z-10 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
        <motion.div 
          className="absolute inset-0 rounded-full bg-[#FF6B2C]/15"
          animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute -inset-2 rounded-full border border-[#FF6B2C]/20"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ repeat: Infinity, duration: 3.2, delay: 0.4, ease: "easeInOut" }}
        />
        <div className="relative z-10 w-14 h-14 bg-[#FFF9F5] border border-[#FF6B2C]/25 rounded-full flex items-center justify-center shadow-xs">
          <motion.div
            animate={{ rotate: [-7, 7, -5, 5, 0] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
          >
            <Bell className="w-6 h-6 text-[#FF6B2C]" />
          </motion.div>
        </div>
      </div>
      
      {/* ── 4. Grand Editorial Title & Subtitle ── */}
      <div className="relative z-10 mb-7">
        <h2 className="text-3xl sm:text-4xl font-serif font-black text-[#1E1C1A] tracking-tight mb-2.5">
          Search & Track Prices
        </h2>
        <div className="max-w-xl mx-auto space-y-1">
          <p className="text-[#3F3A34] text-sm sm:text-base font-serif font-medium leading-relaxed">
            Continuous 24/7 radar scanning nonstop airfares and boutique stays for{' '}
            <strong className="font-bold text-[#1E1C1A] underline decoration-[#FF6B2C]/40 decoration-2 underline-offset-4">
              {destinationName?.replace(/\s*\(Demo Mode\)/i, '') || 'Rome, Italy'}
            </strong>.
          </p>
          <p className="text-[#7A7268] text-xs sm:text-[13px] font-sans font-normal tracking-wide">
            Instant price drop alerts delivered the moment rates fall below historical baselines.
          </p>
        </div>
      </div>

      {/* ── 5. Main Spacious 2-Column Control Suite ── */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-5 text-left mb-8 bg-[#FAF6F0] border border-[#E6DFD5] rounded-2xl p-6 shadow-2xs">
        {/* Left Column: Airport Selector & Quick Pick */}
        <div className="flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-mono font-bold text-[#5F5E5A] uppercase tracking-wider flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5 text-[#FF6B2C]" />
                <span>Departure Hub (IATA)</span>
              </label>
              <span className="text-[10px] font-mono text-[#8C827A] bg-white px-2 py-0.5 rounded border border-[#E6DFD5]">
                {config.origin === 'JFK' ? '🗽 New York, USA' : 
                 config.origin === 'LHR' ? '🇬🇧 London, UK' : 
                 config.origin === 'SFO' ? '🌁 San Francisco, USA' : 
                 config.origin === 'DXB' ? '🇦🇪 Dubai, UAE' : 
                 config.origin === 'CDG' ? '🇫🇷 Paris, France' : 
                 config.origin === 'HND' ? '🇯🇵 Tokyo, Japan' : '📍 Global Route'}
              </span>
            </div>

            <div className="relative group">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C827A] group-focus-within:text-[#FF6B2C] group-focus-within:scale-110 transition-all" />
              <input 
                type="text" 
                value={config.origin}
                onChange={(e) => setConfig({ ...config, origin: e.target.value.toUpperCase() })}
                maxLength={3}
                className="w-full pl-10 pr-4 py-3 bg-white border border-[#E6DFD5] rounded-xl text-base font-mono font-black text-[#1E1C1A] focus:outline-none focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/15 transition-all uppercase tracking-wider placeholder:text-[#A89F91] shadow-inner"
                placeholder="JFK"
              />
            </div>
          </div>

          {/* Quick Airport Selector Chips in a Clean Single-Row Grid */}
          <div>
            <span className="block text-[10px] font-mono font-bold text-[#8C827A] mb-1.5 uppercase tracking-wider">
              POPULAR DEPARTURE HUBS:
            </span>
            <div className="grid grid-cols-6 gap-1.5">
              {[
                { code: 'JFK', city: 'NYC' },
                { code: 'LHR', city: 'LON' },
                { code: 'SFO', city: 'SFO' },
                { code: 'DXB', city: 'DXB' },
                { code: 'CDG', city: 'PAR' },
                { code: 'HND', city: 'TYO' }
              ].map((hub) => (
                <motion.button
                  key={hub.code}
                  type="button"
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setConfig({ ...config, origin: hub.code })}
                  className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg border font-mono transition-all cursor-pointer ${
                    config.origin === hub.code 
                      ? 'bg-[#FF6B2C] border-[#FF6B2C] text-white shadow-2xs' 
                      : 'bg-white border-[#E6DFD5] text-[#5F5E5A] hover:border-[#FF6B2C]/40 hover:bg-[#FFF9F5]'
                  }`}
                >
                  <span className="text-[11px] font-black">{hub.code}</span>
                  <span className={`text-[8px] font-sans font-medium opacity-75 ${config.origin === hub.code ? 'text-white' : 'text-[#8C827A]'}`}>
                    {hub.city}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Route Intelligence Benchmark Card */}
          <div className="p-3 bg-white/90 border border-[#E6DFD5] rounded-xl flex items-center justify-between shadow-2xs">
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-mono text-[#8C827A] uppercase tracking-wider">Estimated Nonstop Rate</span>
              <span className="text-xs font-mono font-black text-[#1E1C1A]">$480 – $690 avg</span>
            </div>
            <div className="h-6 w-[1px] bg-[#E6DFD5]" />
            <div className="flex flex-col text-right">
              <span className="text-[9px] font-mono text-[#8C827A] uppercase tracking-wider">Historical 90-Day Low</span>
              <span className="text-xs font-mono font-black text-emerald-600 flex items-center gap-1 justify-end">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>$410</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Tracking Categories (Flights & Hotels) */}
        <div className="space-y-3 flex flex-col justify-center">
          {/* Flights Watchdog Card */}
          <motion.div 
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => setConfig({ ...config, trackFlights: !config.trackFlights })}
            className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
              config.trackFlights 
                ? 'bg-white border-[#FF6B2C]/50 shadow-2xs' 
                : 'bg-white/60 border-[#E6DFD5] opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <motion.div 
                animate={config.trackFlights ? { rotate: [0, 360], scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  config.trackFlights ? 'bg-[#FF6B2C] text-white shadow-2xs' : 'bg-[#E6DFD5] text-[#7A7268]'
                }`}
              >
                <Plane className="w-4.5 h-4.5" />
              </motion.div>
              <div>
                <p className="text-xs font-bold text-[#1E1C1A]">Flights & Airfare</p>
                <p className="text-[10px] text-[#7A7268]">Monitors nonstop routes & fare drops</p>
              </div>
            </div>
            {/* iOS Style Spring Switch */}
            <div className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${config.trackFlights ? 'bg-[#FF6B2C]' : 'bg-[#D8D0C5]'}`}>
              <motion.div 
                layout
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow-sm ${config.trackFlights ? 'translate-x-5' : 'translate-x-0'}`} 
              />
            </div>
          </motion.div>

          {/* Hotels Watchdog Card */}
          <motion.div 
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => setConfig({ ...config, trackHotels: !config.trackHotels })}
            className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
              config.trackHotels 
                ? 'bg-white border-[#FF6B2C]/50 shadow-2xs' 
                : 'bg-white/60 border-[#E6DFD5] opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <motion.div 
                animate={config.trackHotels ? { scale: [1, 1.25, 0.95, 1], y: [-2, 0] } : {}}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  config.trackHotels ? 'bg-[#FF6B2C] text-white shadow-2xs' : 'bg-[#E6DFD5] text-[#7A7268]'
                }`}
              >
                <Hotel className="w-4.5 h-4.5" />
              </motion.div>
              <div>
                <p className="text-xs font-bold text-[#1E1C1A]">Hotels & Boutique Stays</p>
                <p className="text-[10px] text-[#7A7268]">Monitors suites & nightly rates</p>
              </div>
            </div>
            {/* iOS Style Spring Switch */}
            <div className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${config.trackHotels ? 'bg-[#FF6B2C]' : 'bg-[#D8D0C5]'}`}>
              <motion.div 
                layout
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow-sm ${config.trackHotels ? 'translate-x-5' : 'translate-x-0'}`} 
              />
            </div>
          </motion.div>
        </div>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex items-center justify-center gap-1.5 text-red-600 text-xs font-medium mb-4 bg-red-50 py-2 px-3 rounded-xl border border-red-200 max-w-md mx-auto"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* ── 6. Bespoke Tactile Obsidian Action Button ── */}
      <div className="relative z-20 w-full max-w-md mx-auto">
        <motion.button 
          type="button"
          whileHover={{ scale: 1.015, y: -1 }}
          whileTap={{ scale: 0.985, y: 1 }}
          onClick={handleStartTracking}
          disabled={isActivating || (!config.trackFlights && !config.trackHotels)}
          className="group/btn relative w-full bg-[#1E1C1A] hover:bg-[#121110] text-white py-3.5 px-7 rounded-xl shadow-[0_10px_25px_-5px_rgba(30,28,26,0.3)] hover:shadow-[0_14px_32px_-4px_rgba(255,107,44,0.2)] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer border-t border-white/18 border-x border-[#332E29] border-b border-black/80 overflow-hidden font-sans font-bold text-sm tracking-wide"
        >
          {/* Subtle warm hover sheen */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-out" />

          {isActivating ? (
            <div className="flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-[#FF6B2C]" />
              <span className="text-[#FAF6F0]">Searching live prices...</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span>Search & Track Prices</span>
              <div className="flex items-center gap-1.5">
                <motion.div
                  animate={{ 
                    x: [-1.5, 3.5, -1.5],
                    y: [-1, 1, -1],
                    rotate: [0, 8, 0]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2.2, 
                    ease: "easeInOut" 
                  }}
                  className="text-[#FF6B2C] group-hover/btn:translate-x-1.5 group-hover/btn:-rotate-6 transition-transform duration-300"
                >
                  <Plane className="w-4 h-4" />
                </motion.div>
                <ArrowRight className="w-4 h-4 text-[#A89F91] group-hover/btn:text-white group-hover/btn:translate-x-1 transition-all duration-200" />
              </div>
            </div>
          )}
        </motion.button>
      </div>

      {/* ── 7. Live Trust Micro-Metrics Footer ── */}
      <div className="relative z-10 flex items-center justify-center gap-5 text-[11px] font-mono text-[#8C827A] mt-4 pt-3.5 border-t border-[#E6DFD5]/60">
        <span>✦ 24/7 Radar</span>
        <span>&middot;</span>
        <span>Instant Price Drop Alerts</span>
        <span>&middot;</span>
        <span>100% Free Monitoring</span>
      </div>
    </motion.div>
  );
}
