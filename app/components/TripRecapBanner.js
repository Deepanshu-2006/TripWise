'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ChevronRight, Play } from 'lucide-react';

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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, height: 0, overflow: 'hidden', transition: { duration: 0.3 } }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="mx-auto max-w-4xl px-4 sm:px-6 mb-8 relative z-40"
      >
        {/* Premium Banner Container */}
        <div className="relative overflow-hidden rounded-[24px] bg-[#1E1C1A] border border-stone-800/80 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] group">
          
          {/* Animated Background Glow */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#FF6B2C]/20 rounded-full blur-[100px] opacity-40 group-hover:opacity-60 transition-opacity duration-1000 mix-blend-screen pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-[80px] opacity-30 mix-blend-screen pointer-events-none" />
          
          {/* Subtle noise texture */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
          
          {/* Light Sweep Animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[200%] group-hover:animate-[sweep_2s_ease-in-out_infinite] pointer-events-none" />

          <div className="relative p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            
            {/* Left Content */}
            <div className="flex items-center gap-4">
              {/* Icon Container */}
              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B2C] to-amber-400 rounded-full blur-md opacity-40 animate-pulse" />
                <div className="w-12 h-12 rounded-full bg-gradient-to-b from-stone-800 to-stone-900 border border-stone-700/50 flex items-center justify-center text-white relative z-10 shadow-inner">
                  <Sparkles className="w-5 h-5 text-[#FF6B2C]" />
                </div>
              </div>
              
              {/* Text */}
              <div>
                <h4 className="text-white font-serif font-medium text-xl sm:text-2xl leading-tight tracking-tight flex items-center gap-2">
                  Your {itinerary?.destinationName || 'Trip'} Recap
                  <span className="inline-flex px-2 py-0.5 rounded-md bg-[#FF6B2C]/10 border border-[#FF6B2C]/20 text-[#FF6B2C] text-[10px] uppercase font-sans font-bold tracking-wider align-middle ml-1">
                    Ready
                  </span>
                </h4>
                <p className="text-stone-400 text-sm font-sans mt-1 max-w-md">
                  A personalized, story-style retrospective of your journey, memories, and travel stats.
                </p>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={onLaunchRecap}
                className="group/btn relative overflow-hidden flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-[#1E1C1A] text-sm font-sans font-bold rounded-full hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,107,44,0.3)] active:scale-95"
              >
                <span className="relative z-10">Play Recap</span>
                <Play className="w-4 h-4 relative z-10 fill-[#1E1C1A] group-hover/btn:translate-x-0.5 transition-transform" />
                
                {/* Button Hover Gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-white via-orange-50 to-[#FFD8C4] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
              </button>
              
              <button
                onClick={handleDismiss}
                className="w-10 h-10 shrink-0 rounded-full bg-stone-800/50 border border-stone-700/50 hover:bg-stone-800 hover:border-stone-600 flex items-center justify-center text-stone-400 hover:text-white transition-all duration-200"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
