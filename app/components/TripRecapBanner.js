'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ChevronRight } from 'lucide-react';

export default function TripRecapBanner({ itinerary, onLaunchRecap }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!itinerary || !itinerary.endDate) return;

    // Check if the trip is in the past
    const end = new Date(itinerary.endDate);
    const today = new Date();
    
    // We assume recap is ready the day after the end date
    // Set hours to 0 for a clean date comparison
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
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
        className="mx-auto max-w-4xl px-4 sm:px-6 mb-6"
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#FF6B2C] to-amber-500 shadow-md">
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_50%,_white_0%,_transparent_50%)]"></div>
          
          <div className="relative p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-serif font-bold text-lg leading-tight shadow-sm">
                  Your {itinerary?.destinationName || 'Trip'} Recap is Ready ✨
                </h4>
                <p className="text-white/90 text-xs font-sans mt-0.5">
                  A story-style summary of your journey, memories, and stats.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onLaunchRecap}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[#FF6B2C] text-xs font-bold rounded-xl hover:scale-105 transition-transform shadow-sm"
              >
                <span>View Recap</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDismiss}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
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
