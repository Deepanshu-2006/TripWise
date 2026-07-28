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
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-black text-[#1E1C1A] tracking-tight">Active Price Tracking</h2>
            <p className="text-sm font-sans text-[#7A7268] mt-1">Monitoring live prices for your upcoming trip to {destinationName}.</p>
          </div>
          <button 
            onClick={handleStopTracking}
            className="px-4 py-2 text-xs font-bold font-sans text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors border border-red-100"
          >
            Stop Tracking
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Flights Card */}
          {trackingState.baseline?.flight && (
            <div className="bg-white rounded-2xl border border-[#E6DFD5] p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Plane className="w-5 h-5 text-[#FF6B2C]" />
                    <span className="font-mono text-xs font-bold text-[#FF6B2C] uppercase tracking-widest">Flights</span>
                  </div>
                  <span className="text-xs font-medium text-[#7A7268]">From {trackingState.config.origin}</span>
                </div>
                
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-sm text-[#7A7268] mb-1">Current Best Price</div>
                    <div className="text-4xl font-serif font-black text-[#1E1C1A]">
                      ${trackingState.current.flight}
                    </div>
                  </div>
                  {trackingState.current.flight < trackingState.baseline.flight && (
                    <div className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md text-sm font-bold flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5" />
                      -{Math.round((1 - (trackingState.current.flight / trackingState.baseline.flight)) * 100)}%
                    </div>
                  )}
                </div>
                
                {trackingState.current.flight !== trackingState.baseline.flight && (
                  <div className="text-xs text-[#7A7268] mt-2 italic">
                    Down from baseline ${trackingState.baseline.flight}
                  </div>
                )}
              </div>
              
              <a 
                href={getAffiliateBookingLink(destinationName, 'flight')}
                target="_blank" rel="noopener noreferrer"
                className="mt-6 flex items-center justify-center w-full gap-2 bg-[#FAF6F0] hover:bg-[#F5F0E8] border border-[#E6DFD5] text-[#1E1C1A] text-sm font-bold py-2.5 rounded-xl transition-colors"
              >
                Search Flights <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Hotels Card */}
          {trackingState.baseline?.hotel && (
            <div className="bg-white rounded-2xl border border-[#E6DFD5] p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Hotel className="w-5 h-5 text-[#FF6B2C]" />
                    <span className="font-mono text-xs font-bold text-[#FF6B2C] uppercase tracking-widest">Hotels</span>
                  </div>
                  <span className="text-xs font-medium text-[#7A7268]">In {destinationName.split(',')[0]}</span>
                </div>
                
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-sm text-[#7A7268] mb-1">Current Best Price / Night</div>
                    <div className="text-4xl font-serif font-black text-[#1E1C1A]">
                      ${trackingState.current.hotel}
                    </div>
                  </div>
                  {trackingState.current.hotel < trackingState.baseline.hotel && (
                    <div className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md text-sm font-bold flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5" />
                      -{Math.round((1 - (trackingState.current.hotel / trackingState.baseline.hotel)) * 100)}%
                    </div>
                  )}
                </div>
                
                {trackingState.current.hotel !== trackingState.baseline.hotel && (
                  <div className="text-xs text-[#7A7268] mt-2 italic">
                    Down from baseline ${trackingState.baseline.hotel}
                  </div>
                )}
              </div>
              
              <a 
                href={getAffiliateBookingLink(destinationName, 'hotel')}
                target="_blank" rel="noopener noreferrer"
                className="mt-6 flex items-center justify-center w-full gap-2 bg-[#FAF6F0] hover:bg-[#F5F0E8] border border-[#E6DFD5] text-[#1E1C1A] text-sm font-bold py-2.5 rounded-xl transition-colors"
              >
                Search Hotels <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-[#7A7268] mt-4">
          <Clock className="w-3.5 h-3.5" />
          <span>Last checked: Just now (Simulated live connection)</span>
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
