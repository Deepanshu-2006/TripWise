'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Play, Film } from 'lucide-react';

export default function TripRecapBanner({ itinerary, onLaunchRecap }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!itinerary || !itinerary.endDate) return;

    // Check if the trip is in the past
    const end = new Date(itinerary.endDate);
    const today = new Date();
    
    // We assume recap is ready the day after the end date
    end.setHours(0,0,0,0);
    today.setHours(0,0,0,0);

    const isPast = today > end;
    
    if (isPast) {
      // Check if user has dismissed it permanently for this trip
      const tripId = itinerary.id || itinerary.db_id || 'shared-trip';
      const dismissed = localStorage.getItem(`tripwise_recap_dismissed_${tripId}`);
      if (!dismissed) {
        setIsVisible(true);
      }
    }
  }, [itinerary]);

  const handleDismiss = () => {
    setIsVisible(false);
    const tripId = itinerary.id || itinerary.db_id || 'shared-trip';
    localStorage.setItem(`tripwise_recap_dismissed_${tripId}`, 'true');
  };

  if (!isVisible) return null;

  const heroPhoto = itinerary?.destinationImage || 
    itinerary?.image || 
    itinerary?.days?.[0]?.activities?.[0]?.image || 
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80';

  const totalDays = itinerary?.days?.length || 0;
  const totalStops = itinerary?.days?.reduce((acc, d) => acc + (d.activities?.length || 0), 0) || 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, height: 0, overflow: 'hidden', transition: { duration: 0.3 } }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="mx-auto max-w-5xl px-4 sm:px-6 mb-6 relative z-30"
      >
        {/* Luxury Editorial Retrospective Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-white/95 backdrop-blur-xl border border-[#E6DFD5] shadow-[0_20px_45px_-12px_rgba(30,28,26,0.12),0_0_0_1px_rgba(255,255,255,0.8)_inset] p-4.5 sm:p-6 group">
          
          {/* Subtle Decorative Postal Seal Watermark */}
          <div className="absolute -right-6 -bottom-6 w-44 h-44 rounded-full border-2 border-dashed border-[#E6DFD5]/70 pointer-events-none flex items-center justify-center -rotate-12 select-none">
            <span className="text-[9.5px] font-mono uppercase tracking-widest text-[#C8BFB2] font-black">
              TripWise • Retrospective
            </span>
          </div>

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
            
            {/* Left Section: Polaroid Preview + Storybook Title */}
            <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
              
              {/* Layered Travel Polaroid Mini-Card */}
              <div className="relative shrink-0 hidden sm:block">
                <div className="w-16 h-20 sm:w-20 sm:h-24 bg-white p-1.5 pb-4 sm:pb-5 rounded-xl shadow-sm border border-[#E6DFD5] -rotate-3 group-hover:rotate-0 transition-transform duration-300">
                  <div className="w-full h-full rounded-lg overflow-hidden relative bg-stone-100">
                    <img 
                      src={heroPhoto} 
                      alt={itinerary?.destinationName || 'Trip'} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-black/5" />
                  </div>
                </div>
                {/* Micro badge */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#FF6B2C] text-white flex items-center justify-center shadow-xs">
                  <Film className="w-3 h-3 stroke-[2.5]" />
                </div>
              </div>

              {/* Text Details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFF0E8] border border-[#FF6B2C]/25 text-[#FF6B2C] text-[10px] font-mono uppercase font-bold tracking-wider">
                    <Sparkles className="w-2.5 h-2.5" />
                    Story Recap Ready
                  </span>
                  {totalDays > 0 && (
                    <span className="text-[11px] font-sans font-bold text-[#7A7268]">
                      {totalDays} {totalDays === 1 ? 'Day' : 'Days'} • {totalStops} Stops
                    </span>
                  )}
                </div>

                <h3 className="text-lg sm:text-2xl font-serif font-black text-[#1E1C1A] leading-tight tracking-tight">
                  Your {itinerary?.destinationName || 'Trip'} Retrospective
                </h3>
                <p className="text-xs sm:text-sm font-sans text-[#7A7268] mt-1 max-w-lg leading-snug">
                  Relive your journey with an interactive story of your favorite stops, places, and memories.
                </p>
              </div>
            </div>

            {/* Right Section: Action Buttons */}
            <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-between md:justify-end border-t md:border-t-0 border-[#E6DFD5]/70 pt-3 md:pt-0">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.94 }}
                onClick={onLaunchRecap}
                className="relative inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-[#FF6B2C] hover:bg-[#E55A1C] text-white text-xs sm:text-sm font-sans font-bold shadow-sm transition-all cursor-pointer flex-1 md:flex-initial"
              >
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white shrink-0" />
                <span>Play Story Recap</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleDismiss}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#FAF6F0] hover:bg-[#F5F0E8] border border-[#E6DFD5] flex items-center justify-center text-[#7A7268] hover:text-[#1E1C1A] transition-colors shadow-2xs cursor-pointer shrink-0"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
