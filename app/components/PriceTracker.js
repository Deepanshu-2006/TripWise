'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plane, Hotel, AlertCircle, TrendingDown, Clock, MapPin, Loader2, ArrowRight } from 'lucide-react';
import { activateTracking, getTrackingState, clearUnreadDrops } from '../../lib/priceTrackingApi';
import { getAffiliateBookingLink } from '../../lib/bookingPartners';

export default function PriceTracker({ tripId, destinationName, startDate, endDate }) {
  const [trackingState, setTrackingState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [config, setConfig] = useState({ trackFlights: true, trackHotels: true, origin: 'JFK' });
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load tracking state on mount
    const state = getTrackingState(tripId);
    if (state) {
      setTrackingState(state);
      if (state.unreadDrops) {
        // Clear unread drops since user is now viewing them
        clearUnreadDrops(tripId);
      }
    }
    setIsLoading(false);
  }, [tripId]);

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
    // We could clear from local storage here if desired. 
    // Or just mark as disabled. Let's just remove it.
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`tw_price_tracking_${tripId}`);
    }
    setTrackingState(null);
  };

  if (!destinationName) return null; // Requires at least a confirmed destination

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center p-12 text-[#7A7268]">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  // Active Tracking View
  if (trackingState) {
    const flightPriceDrop = trackingState.baseline?.flight ? Math.round((1 - (trackingState.current.flight / trackingState.baseline.flight)) * 100) : 0;
    const hotelPriceDrop = trackingState.baseline?.hotel ? Math.round((1 - (trackingState.current.hotel / trackingState.baseline.hotel)) * 100) : 0;

    const formatDates = (start, end) => {
      if (!start) return 'Dates pending';
      const s = new Date(start);
      if (!end) return s.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const e = new Date(end);
      if (s.getMonth() === e.getMonth()) {
        return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${e.getDate()}, ${e.getFullYear()}`;
      }
      return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    };

    const destShort = destinationName.split(',')[0];

    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-black text-[#1E1C1A] tracking-tight">Active Price Tracking</h2>
            <p className="text-sm font-sans text-[#7A7268] mt-1">
              Tracking <span className="font-semibold text-[#1E1C1A]">{trackingState.config.origin} <ArrowRight className="w-3 h-3 inline mx-1" /> {destShort}</span> &middot; {formatDates(startDate, endDate)}
            </p>
          </div>
          <button 
            onClick={handleStopTracking}
            className="px-4 py-2 text-xs font-bold font-sans text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors border border-red-100"
          >
            Stop Tracking
          </button>
        </div>

        <div className="bg-[#FAF6F0] rounded-3xl border border-[#E6DFD5] p-2 flex flex-col md:flex-row gap-2">
          {/* Flights Card */}
          {trackingState.baseline?.flight && (
            <div className="flex-1 bg-white rounded-2xl border border-[#E6DFD5] p-6 shadow-sm flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E6DFD5]/60">
                  <div className="flex items-center gap-2">
                    <Plane className="w-5 h-5 text-[#FF6B2C]" />
                    <span className="font-mono text-xs font-bold text-[#1E1C1A] uppercase tracking-widest">Flights</span>
                  </div>
                  <span className="text-xs font-medium text-[#7A7268] bg-[#F5F0E8] px-2.5 py-1 rounded-md">{trackingState.config.origin} to {destShort}</span>
                </div>
                
                {/* Price Comparison */}
                <div className="flex items-end justify-between mb-6">
                  <div>
                    <div className="text-sm text-[#7A7268] mb-1 font-medium">Current Best Price</div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-serif font-black text-[#1E1C1A]">
                        ${trackingState.current.flight}
                      </span>
                      {trackingState.current.flight !== trackingState.baseline.flight && (
                        <span className="text-lg font-serif font-medium text-[#A39C93] line-through">
                          ${trackingState.baseline.flight}
                        </span>
                      )}
                    </div>
                  </div>
                  {flightPriceDrop > 0 ? (
                    <div className="bg-emerald-100 text-emerald-800 px-2.5 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 border border-emerald-200">
                      <TrendingDown className="w-4 h-4" />
                      -{flightPriceDrop}%
                    </div>
                  ) : (
                    flightPriceDrop < 0 && (
                      <div className="bg-red-50 text-red-700 px-2.5 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 border border-red-100">
                        +{Math.abs(flightPriceDrop)}%
                      </div>
                    )
                  )}
                </div>
                
                {/* Sparkline */}
                <div className="h-12 w-full mb-4">
                  <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <path d="M0,15 L20,12 L40,18 L60,10 L80,22 L100,5" fill="none" stroke="#FF6B2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M0,30 L0,15 L20,12 L40,18 L60,10 L80,22 L100,5 L100,30 Z" fill="url(#flightGrad)" opacity="0.2" />
                    <defs>
                      <linearGradient id="flightGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF6B2C" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                
                {/* Alert Note */}
                <div className="flex items-start gap-2 bg-[#F5F0E8] rounded-xl p-3 mb-6">
                  <Bell className="w-4 h-4 text-[#FF6B2C] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#4A443E] leading-relaxed">
                    We'll notify you if this drops another <span className="font-bold text-[#1E1C1A]">10%+</span> from the current price.
                  </p>
                </div>
              </div>
              
              <a 
                href={getAffiliateBookingLink(destinationName, 'flight')}
                target="_blank" rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-[#1E1C1A] hover:bg-black text-white text-sm font-bold py-3.5 rounded-xl transition-colors shadow-sm"
              >
                View on Skyscanner <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Hotels Card */}
          {trackingState.baseline?.hotel && (
            <div className="flex-1 bg-white rounded-2xl border border-[#E6DFD5] p-6 shadow-sm flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E6DFD5]/60">
                  <div className="flex items-center gap-2">
                    <Hotel className="w-5 h-5 text-[#FF6B2C]" />
                    <span className="font-mono text-xs font-bold text-[#1E1C1A] uppercase tracking-widest">Hotels</span>
                  </div>
                  <span className="text-xs font-medium text-[#7A7268] bg-[#F5F0E8] px-2.5 py-1 rounded-md">In {destShort}</span>
                </div>
                
                {/* Price Comparison */}
                <div className="flex items-end justify-between mb-6">
                  <div>
                    <div className="text-sm text-[#7A7268] mb-1 font-medium">Current Best Price / Night</div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-serif font-black text-[#1E1C1A]">
                        ${trackingState.current.hotel}
                      </span>
                      {trackingState.current.hotel !== trackingState.baseline.hotel && (
                        <span className="text-lg font-serif font-medium text-[#A39C93] line-through">
                          ${trackingState.baseline.hotel}
                        </span>
                      )}
                    </div>
                  </div>
                  {hotelPriceDrop > 0 ? (
                    <div className="bg-emerald-100 text-emerald-800 px-2.5 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 border border-emerald-200">
                      <TrendingDown className="w-4 h-4" />
                      -{hotelPriceDrop}%
                    </div>
                  ) : (
                    hotelPriceDrop < 0 && (
                      <div className="bg-red-50 text-red-700 px-2.5 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 border border-red-100">
                        +{Math.abs(hotelPriceDrop)}%
                      </div>
                    )
                  )}
                </div>
                
                {/* Sparkline */}
                <div className="h-12 w-full mb-4">
                  <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <path d="M0,20 L20,18 L40,22 L60,15 L80,19 L100,8" fill="none" stroke="#FF6B2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M0,30 L0,20 L20,18 L40,22 L60,15 L80,19 L100,8 L100,30 Z" fill="url(#hotelGrad)" opacity="0.2" />
                    <defs>
                      <linearGradient id="hotelGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF6B2C" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                
                {/* Alert Note */}
                <div className="flex items-start gap-2 bg-[#F5F0E8] rounded-xl p-3 mb-6">
                  <Bell className="w-4 h-4 text-[#FF6B2C] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#4A443E] leading-relaxed">
                    We'll notify you if this drops another <span className="font-bold text-[#1E1C1A]">10%+</span> from the current price.
                  </p>
                </div>
              </div>
              
              <a 
                href={getAffiliateBookingLink(destinationName, 'hotel')}
                target="_blank" rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-[#1E1C1A] hover:bg-black text-white text-sm font-bold py-3.5 rounded-xl transition-colors shadow-sm"
              >
                View on Booking.com <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-[#7A7268] mt-4 ml-1">
          <Clock className="w-3.5 h-3.5" />
          <span>Last checked: 2 hours ago &middot; Next check in 22 hours</span>
        </div>
      </div>
    );
  }

  // Unactivated Prompt View
  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl border border-[#E6DFD5] p-8 text-center shadow-xs">
      <div className="w-16 h-16 bg-[#FAF6F0] border border-[#FF6B2C]/20 rounded-full flex items-center justify-center mx-auto mb-5">
        <Bell className="w-8 h-8 text-[#FF6B2C]" />
      </div>
      
      <h2 className="text-2xl font-serif font-black text-[#1E1C1A] mb-3">Track Prices for This Trip</h2>
      <p className="text-[#7A7268] mb-8 font-sans max-w-md mx-auto">
        Activate price tracking to automatically monitor flights and hotels for your trip to {destinationName}. We'll notify you when prices drop.
      </p>

      <div className="max-w-xs mx-auto text-left space-y-4 mb-8">
        <div>
          <label className="block text-xs font-bold text-[#4A443E] uppercase tracking-wider mb-1.5">Origin Airport</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A7268]" />
            <input 
              type="text" 
              value={config.origin}
              onChange={(e) => setConfig({ ...config, origin: e.target.value.toUpperCase() })}
              maxLength={3}
              className="w-full pl-9 pr-3 py-2.5 bg-[#F5F0E8] border border-[#E6DFD5] rounded-xl text-sm font-mono font-bold focus:outline-none focus:border-[#FF6B2C] transition-colors"
              placeholder="JFK"
            />
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-2 text-[#4A443E] group-hover:text-[#1E1C1A] transition-colors">
              <Plane className="w-4 h-4" />
              <span className="text-sm font-semibold">Track Flights</span>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors relative ${config.trackFlights ? 'bg-[#FF6B2C]' : 'bg-[#E6DFD5]'}`}>
              <input type="checkbox" className="sr-only" checked={config.trackFlights} onChange={() => setConfig({ ...config, trackFlights: !config.trackFlights })} />
              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${config.trackFlights ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </label>

          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-2 text-[#4A443E] group-hover:text-[#1E1C1A] transition-colors">
              <Hotel className="w-4 h-4" />
              <span className="text-sm font-semibold">Track Hotels</span>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors relative ${config.trackHotels ? 'bg-[#FF6B2C]' : 'bg-[#E6DFD5]'}`}>
              <input type="checkbox" className="sr-only" checked={config.trackHotels} onChange={() => setConfig({ ...config, trackHotels: !config.trackHotels })} />
              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${config.trackHotels ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </label>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-center gap-1.5 text-red-600 text-xs mb-4">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <button 
        onClick={handleStartTracking}
        disabled={isActivating || (!config.trackFlights && !config.trackHotels)}
        className="w-full max-w-xs mx-auto bg-[#1E1C1A] text-white font-bold py-3 px-6 rounded-xl hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
      >
        {isActivating ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Activating...</>
        ) : (
          'Activate Tracking'
        )}
      </button>
    </div>
  );
}
