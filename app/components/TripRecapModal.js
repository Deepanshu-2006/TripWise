'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Download, MapPin, Map, Star, Calendar, 
  Camera, Sparkles, Award, Compass, Heart, Film, 
  ArrowRight, RotateCcw, Play, Pause, ChevronLeft, ChevronRight, Check,
  Utensils, Landmark, ShoppingBag, Palmtree, Clock
} from 'lucide-react';
import { getTripJournalEntries } from '../../lib/journalApi';
import { getTripExpenses, convertCurrency, getUserDisplayCurrency, formatCurrency } from '../../lib/expenseApi';
import { toPng } from 'html-to-image';

// --- Category Icon Helper ---
const getCategoryIcon = (category = '') => {
  const cat = category.toLowerCase();
  if (cat.includes('food') || cat.includes('din') || cat.includes('culinary') || cat.includes('lunch') || cat.includes('dinner')) {
    return <Utensils className="w-4 h-4 text-[#FF6B2C]" />;
  }
  if (cat.includes('shop') || cat.includes('market') || cat.includes('retail')) {
    return <ShoppingBag className="w-4 h-4 text-amber-400" />;
  }
  if (cat.includes('sight') || cat.includes('monument') || cat.includes('cultur') || cat.includes('temple') || cat.includes('fort')) {
    return <Landmark className="w-4 h-4 text-emerald-400" />;
  }
  return <Palmtree className="w-4 h-4 text-[#FF6B2C]" />;
};

// --- Story Card Components (Clean, Solid, Cohesive Noir Theme) ---

// 1. Cinematic Intro Cover
const IntroCard = ({ itinerary, heroPhoto }) => {
  const startDateStr = itinerary?.startDate ? new Date(itinerary.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;
  const endDateStr = itinerary?.endDate ? new Date(itinerary.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;
  const dateRange = startDateStr && endDateStr ? `${startDateStr} – ${endDateStr}` : `${itinerary?.days?.length || 1} Days Trip`;
  const totalStops = itinerary?.days?.reduce((acc, d) => acc + (d.activities?.length || 0), 0) || 0;

  return (
    <div className="w-full h-full relative flex flex-col justify-between pt-20 sm:pt-24 pb-8 px-6 sm:px-8 bg-[#12100E] overflow-hidden select-none">
      {/* Hero Photo with Scrim */}
      {heroPhoto && (
        <div className="absolute inset-0 w-full h-full">
          <img src={heroPhoto} alt="Hero" className="w-full h-full object-cover opacity-55" />
        </div>
      )}
      
      {/* Solid Scrim Overlay */}
      <div className="absolute inset-0 bg-[#12100E]/75" />

      {/* Top Label */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative z-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E1C1A] border border-stone-700 text-stone-200 text-[10px] font-mono uppercase tracking-widest font-bold shadow-sm">
          <Sparkles className="w-3 h-3 text-[#FF6B2C]" />
          <span>TripWise Retrospective • {new Date().getFullYear()}</span>
        </div>
      </motion.div>

      {/* Bottom Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 25, delay: 0.1 }}
        className="relative z-10 text-white"
      >
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-full bg-[#FF6B2C] text-white text-[10px] font-mono uppercase font-bold tracking-wider">
            {itinerary?.days?.length || 1} Days
          </span>
          <span className="text-xs font-sans font-semibold text-stone-300">
            {totalStops} Curated Places • {dateRange}
          </span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-serif font-black tracking-tight leading-[1.05] mb-2 text-white">
          {itinerary?.destinationName || 'Your Journey'}
        </h2>

        <p className="text-xs sm:text-sm font-sans text-stone-300 max-w-sm leading-relaxed mb-6 font-light">
          An authentic retrospective of iconic sights, culinary stops, and memorable moments.
        </p>

        <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-stone-400">
          <span>Tap right to explore</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#FF6B2C]" />
        </div>
      </motion.div>
    </div>
  );
};

// 2. The Route Timeline
const RouteMapCard = ({ itinerary }) => {
  const allStops = itinerary?.days?.flatMap((d, i) => 
    d.activities.map(a => ({ ...a, day: i + 1 }))
  ).filter(a => a.location || a.title).slice(0, 5) || [];

  return (
    <div className="w-full h-full relative pt-20 sm:pt-22 pb-7 px-5 sm:px-7 bg-[#12100E] flex flex-col justify-between text-white overflow-hidden select-none">
      {/* Top Header */}
      <div className="relative z-10">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF6B2C] font-bold block mb-1">
          EXPEDITION TIMELINE
        </span>
        <h3 className="text-2xl sm:text-3xl font-serif font-black text-white tracking-tight leading-tight">
          The Journey Route
        </h3>
        <p className="text-xs font-sans text-stone-400 mt-0.5">
          Curated waypoints explored across {itinerary?.destinationName || 'your trip'}.
        </p>
      </div>

      {/* Timeline List */}
      <div className="relative my-auto py-2">
        <div className="absolute left-[20px] top-6 bottom-6 w-0.5 bg-stone-800" />

        <div className="space-y-2.5 relative z-10">
          {allStops.map((stop, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 + idx * 0.06, type: "spring", stiffness: 350, damping: 25 }}
              className="flex items-center gap-3 bg-[#1A1816] p-2.5 pr-3.5 rounded-2xl border border-stone-800 shadow-sm"
            >
              {stop.image ? (
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-stone-900 shrink-0 border border-stone-800">
                  <img src={stop.image} alt={stop.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[#24201D] border border-stone-800 flex items-center justify-center shrink-0">
                  {getCategoryIcon(stop.category)}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-[13px] font-sans font-bold text-white truncate leading-tight">
                  {stop.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9.5px] font-mono text-[#FF6B2C] font-bold uppercase tracking-wider">
                    Day {stop.day}
                  </span>
                  {stop.category && (
                    <>
                      <span className="text-stone-600">•</span>
                      <span className="text-[10px] font-sans text-stone-400 capitalize truncate">
                        {stop.category}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="w-6 h-6 rounded-full bg-[#24201D] border border-stone-800 flex items-center justify-center text-[10px] font-mono font-bold text-stone-300 shrink-0">
                #{idx + 1}
              </div>
            </motion.div>
          ))}
          {allStops.length === 0 && (
            <div className="text-center text-stone-400 text-sm py-8 font-serif italic">
              No stops logged for this itinerary.
            </div>
          )}
        </div>
      </div>

      {/* Footer Status */}
      <div className="relative z-10 pt-2 border-t border-stone-800 flex items-center justify-between text-[10.5px] font-mono text-stone-400">
        <span>{allStops.length} Highlighted Waypoints</span>
        <span className="text-[#FF6B2C] font-bold">100% Curated</span>
      </div>
    </div>
  );
};

// 3. Stats & Traveler Archetype (Unified Solid Noir Grid)
const StatsCard = ({ stats, itinerary }) => {
  const categories = itinerary?.days?.flatMap(d => d.activities?.map(a => a.category?.toLowerCase())).filter(Boolean) || [];
  const foodCount = categories.filter(c => c?.includes('food') || c?.includes('din') || c?.includes('culinary')).length;
  const cultureCount = categories.filter(c => c?.includes('sight') || c?.includes('cultur') || c?.includes('histor') || c?.includes('museum')).length;
  
  let archetype = "The Modern Wanderer";
  let archetypedesc = "Curator of authentic sights, relaxed pacing, and vibrant local gems.";
  if (foodCount > cultureCount && foodCount >= 2) {
    archetype = "The Epicurean Explorer";
    archetypedesc = "Guided by taste, culinary heritage, and unforgettable flavors.";
  } else if (cultureCount >= 2) {
    archetype = "The Cultural Connoisseur";
    archetypedesc = "Deeply immersed in historic architecture, museums, and local stories.";
  }

  const daysCount = itinerary?.days?.length || 1;
  const totalStops = itinerary?.days?.reduce((acc, d) => acc + (d.activities?.length || 0), 0) || 0;
  const avgStopsPerDay = (totalStops / daysCount).toFixed(1);

  return (
    <div className="w-full h-full relative pt-20 sm:pt-22 pb-10 sm:pb-8 px-5 sm:px-7 bg-[#12100E] flex flex-col justify-between text-white overflow-hidden select-none">
      {/* Header */}
      <div className="relative z-10">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF6B2C] font-bold block mb-1">
          EXPEDITION METRICS
        </span>
        <h3 className="text-2xl sm:text-3xl font-serif font-black text-white tracking-tight leading-tight">
          By The Numbers
        </h3>
        <p className="text-xs font-sans text-stone-400 mt-0.5">
          Travel footprint across {itinerary?.destinationName || 'your destination'}.
        </p>
      </div>

      {/* Balanced 4-Metric Grid */}
      <div className="grid grid-cols-2 gap-3 my-auto relative z-10">
        {/* Metric 1: Days Journeyed */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08, type: "spring", stiffness: 350 }}
          className="bg-[#1A1816] rounded-2xl p-3.5 sm:p-4 border border-stone-800 shadow-sm flex flex-col justify-between"
        >
          <div className="w-7 h-7 rounded-xl bg-[#24201D] border border-stone-700 flex items-center justify-center text-[#FF6B2C] mb-2">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-serif font-black text-white leading-none mb-1">
              {daysCount}
            </div>
            <div className="text-[9.5px] font-mono uppercase tracking-wider text-stone-400 font-bold">
              Days Journeyed
            </div>
          </div>
        </motion.div>

        {/* Metric 2: Curated Stops */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.14, type: "spring", stiffness: 350 }}
          className="bg-[#1A1816] rounded-2xl p-3.5 sm:p-4 border border-stone-800 shadow-sm flex flex-col justify-between"
        >
          <div className="w-7 h-7 rounded-xl bg-[#24201D] border border-stone-700 flex items-center justify-center text-amber-400 mb-2">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-serif font-black text-white leading-none mb-1">
              {totalStops}
            </div>
            <div className="text-[9.5px] font-mono uppercase tracking-wider text-stone-400 font-bold">
              Curated Stops
            </div>
          </div>
        </motion.div>

        {/* Metric 3: Daily Pacing */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 350 }}
          className="bg-[#1A1816] rounded-2xl p-3.5 sm:p-4 border border-stone-800 shadow-sm flex flex-col justify-between"
        >
          <div className="w-7 h-7 rounded-xl bg-[#24201D] border border-stone-700 flex items-center justify-center text-emerald-400 mb-2">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-serif font-black text-white leading-none mb-1">
              ~{avgStopsPerDay}
            </div>
            <div className="text-[9.5px] font-mono uppercase tracking-wider text-stone-400 font-bold">
              Stops / Day
            </div>
          </div>
        </motion.div>

        {/* Metric 4: Pacing Status */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.26, type: "spring", stiffness: 350 }}
          className="bg-[#1A1816] rounded-2xl p-3.5 sm:p-4 border border-stone-800 shadow-sm flex flex-col justify-between"
        >
          <div className="w-7 h-7 rounded-xl bg-[#24201D] border border-stone-700 flex items-center justify-center text-[#FF6B2C] mb-2">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-serif font-black text-[#FF8A4C] leading-none mb-1">
              Fluid
            </div>
            <div className="text-[9.5px] font-mono uppercase tracking-wider text-stone-400 font-bold">
              Pacing Rate
            </div>
          </div>
        </motion.div>
      </div>

      {/* Solid Archetype Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32, type: "spring" }}
        className="relative z-10 p-3.5 rounded-2xl bg-[#1A1816] border border-stone-800 text-white flex items-center gap-3 shadow-sm"
      >
        <div className="w-10 h-10 rounded-xl bg-[#FF6B2C] text-white flex items-center justify-center shrink-0">
          <Award className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[9px] font-mono uppercase tracking-widest text-[#FF6B2C] font-bold block">
            Traveler Archetype
          </span>
          <h4 className="text-xs sm:text-sm font-serif font-bold text-white leading-tight truncate">
            {archetype}
          </h4>
          <p className="text-[10px] font-sans text-stone-300 truncate mt-0.5">
            {archetypedesc}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// 4. Standout Memory Highlight (Solid Polaroid)
const HighlightCard = ({ item }) => (
  <div className="w-full h-full relative pt-20 sm:pt-22 pb-8 px-5 sm:px-7 bg-[#12100E] flex flex-col justify-between text-white overflow-hidden select-none">
    {/* Header */}
    <div className="relative z-10 flex items-center justify-between">
      <div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF6B2C] font-bold block mb-0.5">
          CAPTURED HIGHLIGHT
        </span>
        <h4 className="text-lg sm:text-xl font-serif font-black text-white leading-tight">
          Standout Memory
        </h4>
      </div>
      <div className="flex items-center gap-1 bg-[#1A1816] px-2.5 py-1 rounded-full border border-stone-800 shadow-sm">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-3.5 h-3.5 ${i < (item.rating || 5) ? 'fill-[#FF6B2C] text-[#FF6B2C]' : 'fill-transparent text-stone-600'}`} 
          />
        ))}
      </div>
    </div>

    {/* Polaroid Frame */}
    <motion.div 
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 350, damping: 25, delay: 0.12 }}
      className="relative z-10 my-auto mx-auto w-full max-w-[270px] bg-white p-3 pb-4.5 rounded-2xl shadow-xl border border-stone-300 text-[#1E1C1A]"
    >
      <div className="aspect-[4/3] rounded-xl overflow-hidden bg-stone-100 mb-2.5 relative border border-stone-200">
        {item.photo ? (
          <img src={item.photo} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-stone-100 text-[#7A7268]">
            <Camera className="w-7 h-7 mb-1 text-[#FF6B2C]" />
            <span className="text-[9.5px] font-sans font-bold uppercase tracking-wider">Captured Stop</span>
          </div>
        )}
      </div>

      <h4 className="text-xs sm:text-sm font-serif font-black text-[#1E1C1A] leading-snug truncate">
        {item.title}
      </h4>
      <p className="text-[9.5px] font-mono uppercase tracking-widest text-[#7A7268] mt-0.5">
        Personal Retrospective Log
      </p>
    </motion.div>

    {/* Note quote */}
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="relative z-10"
    >
      {item.note ? (
        <div className="bg-[#1A1816] p-3 rounded-2xl border border-stone-800 shadow-sm">
          <p className="text-xs font-serif italic text-stone-200 leading-relaxed line-clamp-3">
            &ldquo;{item.note}&rdquo;
          </p>
        </div>
      ) : (
        <p className="text-xs font-serif italic text-stone-400 text-center">
          One of the standout recorded stops from your expedition.
        </p>
      )}
    </motion.div>
  </div>
);

// 5. Keepsake Boarding Pass Finale (Solid Dark Charcoal)
const OutroCard = ({ itinerary, heroPhoto, onDownload, isDownloading, onReplay }) => {
  const startDateStr = itinerary?.startDate ? new Date(itinerary.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
  const endDateStr = itinerary?.endDate ? new Date(itinerary.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const dateRange = startDateStr && endDateStr ? `${startDateStr} – ${endDateStr}` : `${itinerary?.days?.length || 1} Days Expedition`;
  const totalStops = itinerary?.days?.reduce((acc, d) => acc + (d.activities?.length || 0), 0) || 0;

  return (
    <div className="w-full h-full relative pt-20 sm:pt-22 pb-8 px-5 sm:px-7 bg-[#12100E] flex flex-col justify-between overflow-hidden select-none text-white">
      {/* Header */}
      <div className="relative z-10 text-center">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF6B2C] font-bold block mb-1">
          EXPEDITION PASSPORT
        </span>
        <h3 className="text-2xl sm:text-3xl font-serif font-black text-white tracking-tight leading-tight">
          Your Keepsake Pass
        </h3>
      </div>

      {/* Boarding Pass Ticket */}
      <motion.div 
        id="recap-outro-card"
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 25, delay: 0.12 }}
        className="relative z-10 my-auto mx-auto w-full max-w-[300px] bg-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-stone-200 text-[#1E1C1A] flex flex-col items-center text-center"
      >
        {/* Destination Portrait */}
        <div className="w-18 h-18 rounded-2xl overflow-hidden border-2 border-stone-200 shadow-sm mb-2.5 -mt-8 bg-stone-100 relative shrink-0">
          <img src={heroPhoto} alt="Hero" className="w-full h-full object-cover" />
        </div>

        <span className="text-[9px] font-mono uppercase tracking-widest text-[#FF6B2C] font-bold block mb-0.5">
          OFFICIAL TRAVEL DOSSIER
        </span>
        <h4 className="text-xl sm:text-2xl font-serif font-black text-[#1E1C1A] tracking-tight leading-tight mb-1">
          {itinerary?.destinationName || 'Destination'}
        </h4>
        <p className="text-[10.5px] text-[#7A7268] font-sans font-medium mb-3.5">
          {dateRange} • {totalStops} Curated Places
        </p>

        {/* Footer Seal */}
        <div className="w-full pt-3 border-t border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-serif font-black text-[#1E1C1A]">
            <Map className="w-3.5 h-3.5 text-[#FF6B2C]" />
            <span>TripWise</span>
          </div>
          <div className="px-2 py-0.5 rounded bg-[#FAF6F0] border border-[#E6DFD5] text-[8.5px] font-mono uppercase tracking-wider font-bold text-[#7A7268]">
            ARCHIVED • {new Date().getFullYear()}
          </div>
        </div>
      </motion.div>

      {/* High-Priority Clickable Action Buttons */}
      <div className="relative z-50 flex flex-col gap-2 w-full max-w-[300px] mx-auto pointer-events-auto" data-html2canvas-ignore="true">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          disabled={isDownloading}
          className="w-full py-3.5 rounded-2xl bg-[#FF6B2C] hover:bg-[#E55A1C] text-white font-sans font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-60 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>{isDownloading ? 'Saving Image...' : 'Save Keepsake Image'}</span>
        </motion.button>

        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            onReplay();
          }}
          className="w-full py-2.5 rounded-2xl bg-[#1A1816] hover:bg-[#24201D] text-stone-300 hover:text-white font-sans font-bold text-xs flex items-center justify-center gap-2 border border-stone-800 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Replay Story</span>
        </motion.button>
      </div>
    </div>
  );
};


export default function TripRecapModal({ isOpen, onClose, itinerary, estBudget }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && itinerary) {
      const tripId = itinerary.id || itinerary.db_id || 'shared-trip';
      const journals = getTripJournalEntries(tripId);
      const expenses = getTripExpenses(tripId);

      const totalStops = itinerary.days?.reduce((acc, day) => acc + (day.activities?.length || 0), 0) || 0;
      const userCurr = getUserDisplayCurrency();
      const totalSpentBase = expenses.reduce((acc, exp) => acc + convertCurrency(exp.amount, exp.currency, userCurr), 0);
      
      const stats = {
        duration: itinerary.days?.length || 0,
        stops: totalStops,
        spent: totalSpentBase
      };

      let heroPhoto = itinerary?.destinationImage || itinerary?.image || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80';
      const photoEntries = journals.filter(j => j.photoUrls && j.photoUrls.length > 0);
      if (photoEntries.length > 0) {
        photoEntries.sort((a, b) => (b.personalRating || 0) - (a.personalRating || 0));
        heroPhoto = photoEntries[0].photoUrls[0];
      } else {
        const actWithPhoto = itinerary.days?.flatMap(d => d.activities).find(a => a.image);
        if (actWithPhoto) heroPhoto = actWithPhoto.image;
      }

      // Build Slides
      const newSlides = [
        { type: 'intro', data: { heroPhoto, itinerary } },
        { type: 'map', data: { itinerary } },
        { type: 'stats', data: { stats, itinerary } }
      ];

      // Add Highlights if available
      const topJournals = [...journals]
        .filter(j => j.personalRating >= 4 || j.photoUrls?.length > 0)
        .sort((a, b) => (b.personalRating || 0) - (a.personalRating || 0))
        .slice(0, 2);

      topJournals.forEach(j => {
        let actTitle = 'Memorable Stop';
        if (j.activityId) {
          const [dStr, sStr] = j.activityId.split('-');
          const dIdx = parseInt(dStr, 10) - 1;
          const sIdx = parseInt(sStr, 10) - 1;
          const act = itinerary.days?.[dIdx]?.activities?.[sIdx];
          if (act?.title) actTitle = act.title;
        }

        newSlides.push({
          type: 'highlight',
          data: {
            title: actTitle,
            note: j.note,
            photo: j.photoUrls?.[0],
            rating: j.personalRating
          }
        });
      });

      // Outro Slide
      newSlides.push({ type: 'outro', data: { heroPhoto, itinerary } });

      setSlides(newSlides);
      setCurrentSlide(0);
      setIsPaused(false);
    }
  }, [isOpen, itinerary]);

  // Auto-advance progress
  useEffect(() => {
    if (!isOpen || slides.length === 0 || isPaused) return;
    
    if (currentSlide === slides.length - 1) return;

    const timer = setTimeout(() => {
      setCurrentSlide(prev => (prev < slides.length - 1 ? prev + 1 : prev));
    }, 5500);

    return () => clearTimeout(timer);
  }, [currentSlide, isOpen, slides.length, isPaused]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const handleReplay = () => {
    setCurrentSlide(0);
    setIsPaused(false);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const node = document.getElementById('recap-outro-card');
      if (!node) {
        alert('Passport element not found');
        return;
      }
      const dataUrl = await toPng(node, { 
        quality: 0.98,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#FFFFFF',
        filter: (el) => {
          if (el.getAttribute && el.getAttribute('data-html2canvas-ignore') === 'true') {
            return false;
          }
          return true;
        }
      });
      
      const link = document.createElement('a');
      link.download = `TripWise-Passport-${itinerary?.destinationName || 'Trip'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
      alert('Could not save image directly. Taking screenshot is recommended!');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isMounted) return null;

  const isLastSlide = currentSlide === slides.length - 1;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110000] flex items-center justify-center bg-black/90 backdrop-blur-md p-0 sm:p-4">
          
          {/* Backdrop Dismiss */}
          <div className="absolute inset-0" onClick={onClose} />

          {/* Desktop Left/Right Navigation Chevrons */}
          <div className="hidden lg:flex absolute inset-x-8 top-1/2 -translate-y-1/2 justify-between pointer-events-none z-50">
            <button
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              disabled={currentSlide === 0}
              className="w-12 h-12 rounded-full bg-[#1E1C1A] hover:bg-[#2C2824] text-white flex items-center justify-center border border-stone-750 transition-all disabled:opacity-20 cursor-pointer pointer-events-auto shadow-lg"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              disabled={isLastSlide}
              className="w-12 h-12 rounded-full bg-[#1E1C1A] hover:bg-[#2C2824] text-white flex items-center justify-center border border-stone-750 transition-all disabled:opacity-20 cursor-pointer pointer-events-auto shadow-lg"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Story Container */}
          <div 
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
            className="relative w-full h-full sm:max-w-[420px] sm:max-h-[760px] bg-[#12100E] overflow-hidden sm:rounded-[32px] sm:border border-stone-800 shadow-2xl flex flex-col z-10"
          >
            {/* Top Control Bar with Segmented Progress */}
            <div className="absolute top-0 left-0 right-0 p-4 pt-3.5 z-40 bg-[#12100E] pointer-events-none">
              
              {/* Segmented Progress Bars */}
              <div className="flex gap-1.5 mb-2.5">
                <style>{`
                  @keyframes storyProgress {
                    from { transform: scaleX(0); }
                    to { transform: scaleX(1); }
                  }
                `}</style>
                {slides.map((_, idx) => {
                  if (idx < currentSlide) {
                    return (
                      <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full w-full bg-white" />
                      </div>
                    );
                  }
                  if (idx > currentSlide) {
                    return (
                      <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full w-0 bg-white" />
                      </div>
                    );
                  }
                  // Active Slide
                  return (
                    <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                      <div
                        key={`active-bar-${currentSlide}`}
                        className="h-full w-full bg-white origin-left"
                        style={{
                          transform: isLastSlide ? 'scaleX(1)' : 'scaleX(0)',
                          animation: !isLastSlide ? `storyProgress 5.5s linear forwards` : 'none',
                          animationPlayState: isPaused ? 'paused' : 'running'
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Story Header Controls */}
              <div className="flex items-center justify-between pointer-events-auto">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-serif font-black text-white truncate max-w-[160px]">
                    {itinerary?.destinationName || 'Trip'}
                  </span>
                  <span className="text-[9.5px] font-mono text-white/70 bg-white/10 px-2 py-0.5 rounded-full">
                    {String(currentSlide + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white border border-white/15 transition-colors cursor-pointer"
                    title={isPaused ? "Resume" : "Pause"}
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5 fill-white ml-0.5" /> : <Pause className="w-3.5 h-3.5" />}
                  </button>

                  <button 
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white border border-white/15 transition-colors cursor-pointer"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tap Navigation Zones (Middle area only so top controls and bottom action buttons are never blocked) */}
            {!isLastSlide ? (
              <div className="absolute top-18 bottom-20 inset-x-0 z-20 flex">
                <div className="w-[35%] h-full cursor-pointer" onClick={handlePrev} />
                <div className="w-[65%] h-full cursor-pointer" onClick={handleNext} />
              </div>
            ) : (
              <div className="absolute top-18 bottom-36 inset-x-0 z-20 flex">
                <div className="w-[35%] h-full cursor-pointer" onClick={handlePrev} />
                <div className="w-[65%] h-full cursor-pointer" />
              </div>
            )}

            {/* Slide Content */}
            <div className="relative w-full h-full z-10">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.01 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="absolute inset-0"
                >
                  {slides[currentSlide]?.type === 'intro' && (
                    <IntroCard {...slides[currentSlide].data} />
                  )}
                  {slides[currentSlide]?.type === 'map' && (
                    <RouteMapCard {...slides[currentSlide].data} />
                  )}
                  {slides[currentSlide]?.type === 'stats' && (
                    <StatsCard {...slides[currentSlide].data} />
                  )}
                  {slides[currentSlide]?.type === 'highlight' && (
                    <HighlightCard item={slides[currentSlide].data} />
                  )}
                  {slides[currentSlide]?.type === 'outro' && (
                    <OutroCard 
                      {...slides[currentSlide].data} 
                      onDownload={handleDownload} 
                      isDownloading={isDownloading}
                      onReplay={handleReplay}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
