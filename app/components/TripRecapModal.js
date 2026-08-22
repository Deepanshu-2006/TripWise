'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Download, MapPin, Map, Star, Calendar, 
  Camera, Sparkles, Award, Compass, Heart, Film, 
  ArrowRight, RotateCcw, Play, Pause, ChevronLeft, ChevronRight, Check,
  Utensils, Landmark, ShoppingBag, Palmtree, Clock, Ticket, Plane
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
    return <ShoppingBag className="w-4 h-4 text-amber-600" />;
  }
  if (cat.includes('sight') || cat.includes('monument') || cat.includes('cultur') || cat.includes('temple') || cat.includes('fort')) {
    return <Landmark className="w-4 h-4 text-emerald-600" />;
  }
  return <Palmtree className="w-4 h-4 text-[#FF6B2C]" />;
};

// --- Destination Code Helper (e.g. New Delhi -> DEL) ---
const getDestinationCode = (name = '') => {
  if (!name) return 'TW';
  const clean = name.trim().toUpperCase().replace(/[^A-Z]/g, '');
  if (clean.length >= 3) return clean.slice(0, 3);
  return (clean + 'XX').slice(0, 3);
};

// --- Authentic Customs Rubber Stamp Badge ---
const CustomsStamp = ({ city = 'TRIPWISE', year = '2026', rotation = '-6deg' }) => (
  <div 
    style={{ transform: `rotate(${rotation})` }}
    className="inline-flex flex-col items-center justify-center p-2 rounded-2xl border-2 border-dashed border-[#FF6B2C]/70 text-[#FF6B2C] select-none pointer-events-none bg-[#FFF5EE]"
  >
    <div className="text-[7.5px] font-mono tracking-[0.2em] font-black uppercase">
      ★ CUSTOMS DEPARTURE ★
    </div>
    <div className="text-[12px] font-serif font-black tracking-widest my-0.5 uppercase">
      {city}
    </div>
    <div className="text-[8px] font-mono font-bold tracking-wider">
      VERIFIED • {year}
    </div>
  </div>
);

// --- Story Card Components (Warm Editorial Linen Theme) ---

// 1. Cinematic Intro Cover (The Editorial Magazine Cover)
const IntroCard = ({ itinerary, heroPhoto }) => {
  const startDateStr = itinerary?.startDate ? new Date(itinerary.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;
  const endDateStr = itinerary?.endDate ? new Date(itinerary.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;
  const dateRange = startDateStr && endDateStr ? `${startDateStr} – ${endDateStr}` : `${itinerary?.days?.length || 1} Days Trip`;
  const totalStops = itinerary?.days?.reduce((acc, d) => acc + (d.activities?.length || 0), 0) || 0;

  return (
    <div className="w-full h-full relative flex flex-col justify-between pt-20 sm:pt-22 pb-7 px-5 sm:px-7 bg-[#FAF8F5] overflow-hidden select-none text-[#1E1C1A]">
      {/* Top Header Controls Area */}
      <div className="relative z-10 flex items-start justify-between">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E8E2D9] text-[#7A7268] text-[10px] font-mono uppercase tracking-widest font-bold shadow-2xs"
        >
          <Sparkles className="w-3 h-3 text-[#FF6B2C]" />
          <span>Retrospective • {new Date().getFullYear()}</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, type: "spring" }}
        >
          <CustomsStamp city={getDestinationCode(itinerary?.destinationName)} year={new Date().getFullYear()} rotation="-6deg" />
        </motion.div>
      </div>

      {/* Center Framed Hero Photo with Ken Burns Motion */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 350, damping: 25 }}
        className="my-auto relative z-10 w-full bg-white p-2.5 sm:p-3 pb-3.5 sm:pb-4 rounded-3xl border border-[#E8E2D9] shadow-md"
      >
        <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden relative bg-stone-100 border border-stone-200">
          {heroPhoto && (
            <motion.div 
              initial={{ scale: 1 }}
              animate={{ scale: 1.06 }}
              transition={{ duration: 7, ease: "easeOut" }}
              className="w-full h-full"
            >
              <img src={heroPhoto} alt="Hero" className="w-full h-full object-cover" />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Bottom Editorial Content */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 25, delay: 0.2 }}
        className="relative z-10"
      >
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-full bg-[#FFF0E8] border border-[#FF6B2C]/25 text-[#FF6B2C] text-[10px] font-mono uppercase font-bold tracking-wider">
            {itinerary?.days?.length || 1} Days
          </span>
          <span className="text-xs font-sans font-semibold text-[#7A7268]">
            {totalStops} Curated Places • {dateRange}
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-serif font-black tracking-tight leading-[1.05] mb-1.5 text-[#1E1C1A]">
          {itinerary?.destinationName || 'Your Journey'}
        </h2>

        <p className="text-xs font-sans text-[#7A7268] max-w-sm leading-relaxed mb-3 font-light">
          An authentic retrospective of iconic sights, culinary stops, and memorable moments.
        </p>

        <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-[#FF6B2C] font-bold">
          <span>Tap right to begin story</span>
          <ArrowRight className="w-3.5 h-3.5" />
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

  let peakDayNum = 1;
  let maxStops = 0;
  itinerary?.days?.forEach((d, i) => {
    if ((d.activities?.length || 0) > maxStops) {
      maxStops = d.activities.length;
      peakDayNum = i + 1;
    }
  });

  return (
    <div className="w-full h-full relative pt-20 sm:pt-22 pb-7 px-5 sm:px-7 bg-[#FAF8F5] flex flex-col justify-between text-[#1E1C1A] overflow-hidden select-none">
      {/* Top Header */}
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF6B2C] font-bold block mb-1">
            EXPEDITION TIMELINE
          </span>
          <h3 className="text-2xl sm:text-3xl font-serif font-black text-[#1E1C1A] tracking-tight leading-tight">
            The Journey Route
          </h3>
          <p className="text-xs font-sans text-[#7A7268] mt-0.5">
            Curated waypoints explored across {itinerary?.destinationName || 'your trip'}.
          </p>
        </div>

        {maxStops > 0 && (
          <div className="hidden sm:block px-2.5 py-1 rounded-xl bg-white border border-[#E8E2D9] text-right shadow-2xs">
            <span className="text-[8px] font-mono uppercase text-[#7A7268] font-bold block">Peak Exploration</span>
            <span className="text-xs font-serif font-black text-[#FF6B2C]">Day {peakDayNum} ({maxStops} stops)</span>
          </div>
        )}
      </div>

      {/* Timeline List */}
      <div className="relative my-auto py-2">
        <div className="absolute left-[20px] top-6 bottom-6 w-0.5 bg-[#E8E2D9]" />

        <div className="space-y-2.5 relative z-10">
          {allStops.map((stop, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 + idx * 0.06, type: "spring", stiffness: 350, damping: 25 }}
              className="flex items-center gap-3 bg-white p-2.5 pr-3.5 rounded-2xl border border-[#E8E2D9] shadow-xs group hover:border-[#FF6B2C] transition-all"
            >
              {stop.image ? (
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                  <img src={stop.image} alt={stop.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[#FAF6F0] border border-[#E8E2D9] flex items-center justify-center shrink-0">
                  {getCategoryIcon(stop.category)}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-[13px] font-sans font-bold text-[#1E1C1A] truncate leading-tight">
                  {stop.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9.5px] font-mono text-[#FF6B2C] font-bold uppercase tracking-wider">
                    Day {stop.day}
                  </span>
                  {stop.category && (
                    <>
                      <span className="text-stone-300">•</span>
                      <span className="text-[10px] font-sans text-[#7A7268] capitalize truncate">
                        {stop.category}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="w-6 h-6 rounded-full bg-[#FAF6F0] border border-[#E8E2D9] flex items-center justify-center text-[10px] font-mono font-bold text-[#1E1C1A] shrink-0">
                #{idx + 1}
              </div>
            </motion.div>
          ))}
          {allStops.length === 0 && (
            <div className="text-center text-[#7A7268] text-sm py-8 font-serif italic">
              No stops logged for this itinerary.
            </div>
          )}
        </div>
      </div>

      {/* Footer Status */}
      <div className="relative z-10 pt-2 border-t border-[#E8E2D9] flex items-center justify-between text-[10.5px] font-mono text-[#7A7268]">
        <span>{allStops.length} Highlighted Waypoints</span>
        <span className="text-[#FF6B2C] font-bold">100% Curated</span>
      </div>
    </div>
  );
};

// 3. Stats & Deep Travel Narrative (Warm Editorial White Grid)
const StatsCard = ({ stats, itinerary }) => {
  const categories = itinerary?.days?.flatMap(d => d.activities?.map(a => a.category?.toLowerCase())).filter(Boolean) || [];
  const totalCatCount = categories.length || 1;
  const foodCount = categories.filter(c => c?.includes('food') || c?.includes('din') || c?.includes('culinary') || c?.includes('lunch')).length;
  const cultureCount = categories.filter(c => c?.includes('sight') || c?.includes('cultur') || c?.includes('histor') || c?.includes('museum') || c?.includes('temple')).length;
  const shopCount = categories.filter(c => c?.includes('shop') || c?.includes('market')).length;
  
  const foodPct = Math.round((foodCount / totalCatCount) * 100);
  const culturePct = Math.round((cultureCount / totalCatCount) * 100);
  const shopPct = Math.round((shopCount / totalCatCount) * 100);
  const otherPct = Math.max(0, 100 - (foodPct + culturePct + shopPct));

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
    <div className="w-full h-full relative pt-20 sm:pt-22 pb-8 px-5 sm:px-7 bg-[#FAF8F5] flex flex-col justify-between text-[#1E1C1A] overflow-hidden select-none">
      {/* Header */}
      <div className="relative z-10">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF6B2C] font-bold block mb-1">
          EXPEDITION METRICS
        </span>
        <h3 className="text-2xl sm:text-3xl font-serif font-black tracking-tight leading-tight">
          By The Numbers
        </h3>
        <p className="text-xs font-sans text-[#7A7268] mt-0.5">
          Travel footprint across {itinerary?.destinationName || 'your destination'}.
        </p>
      </div>

      {/* Balanced 4-Metric Grid */}
      <div className="grid grid-cols-2 gap-2.5 my-auto relative z-10">
        {/* Metric 1: Days Journeyed */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08, type: "spring", stiffness: 350 }}
          className="bg-white rounded-2xl p-3 sm:p-3.5 border border-[#E8E2D9] shadow-xs flex flex-col justify-between"
        >
          <div className="w-6.5 h-6.5 rounded-xl bg-[#FFF0E8] border border-[#FF6B2C]/25 flex items-center justify-center text-[#FF6B2C] mb-1.5">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-serif font-black text-[#1E1C1A] leading-none mb-0.5">
              {daysCount}
            </div>
            <div className="text-[9px] font-mono uppercase tracking-wider text-[#7A7268] font-bold">
              Days Journeyed
            </div>
          </div>
        </motion.div>

        {/* Metric 2: Curated Stops */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.14, type: "spring", stiffness: 350 }}
          className="bg-white rounded-2xl p-3 sm:p-3.5 border border-[#E8E2D9] shadow-xs flex flex-col justify-between"
        >
          <div className="w-6.5 h-6.5 rounded-xl bg-[#FAF6F0] border border-[#E8E2D9] flex items-center justify-center text-amber-600 mb-1.5">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-serif font-black text-[#1E1C1A] leading-none mb-0.5">
              {totalStops}
            </div>
            <div className="text-[9px] font-mono uppercase tracking-wider text-[#7A7268] font-bold">
              Curated Stops
            </div>
          </div>
        </motion.div>

        {/* Metric 3: Daily Pacing */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 350 }}
          className="bg-white rounded-2xl p-3 sm:p-3.5 border border-[#E8E2D9] shadow-xs flex flex-col justify-between"
        >
          <div className="w-6.5 h-6.5 rounded-xl bg-[#FAF6F0] border border-[#E8E2D9] flex items-center justify-center text-emerald-600 mb-1.5">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-serif font-black text-[#1E1C1A] leading-none mb-0.5">
              ~{avgStopsPerDay}
            </div>
            <div className="text-[9px] font-mono uppercase tracking-wider text-[#7A7268] font-bold">
              Stops / Day
            </div>
          </div>
        </motion.div>

        {/* Metric 4: Pacing Status */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.26, type: "spring", stiffness: 350 }}
          className="bg-white rounded-2xl p-3 sm:p-3.5 border border-[#E8E2D9] shadow-xs flex flex-col justify-between"
        >
          <div className="w-6.5 h-6.5 rounded-xl bg-[#FFF0E8] border border-[#FF6B2C]/25 flex items-center justify-center text-[#FF6B2C] mb-1.5">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-serif font-black text-[#FF6B2C] leading-none mb-0.5">
              Fluid
            </div>
            <div className="text-[9px] font-mono uppercase tracking-wider text-[#7A7268] font-bold">
              Pacing Rate
            </div>
          </div>
        </motion.div>
      </div>

      {/* Travel Rhythm Category Distribution Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: "spring" }}
        className="relative z-10 bg-white p-3 rounded-2xl border border-[#E8E2D9] shadow-xs mb-2"
      >
        <div className="flex items-center justify-between text-[9px] font-mono uppercase font-bold text-[#7A7268] mb-1.5">
          <span>Travel Rhythm Breakdown</span>
          <span className="text-[#FF6B2C]">Exploration Footprint</span>
        </div>

        {/* Segmented Bar */}
        <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden flex gap-0.5 border border-stone-200">
          {culturePct > 0 && <div style={{ width: `${culturePct}%` }} className="h-full bg-emerald-500 rounded-sm" title="Culture" />}
          {foodPct > 0 && <div style={{ width: `${foodPct}%` }} className="h-full bg-[#FF6B2C] rounded-sm" title="Dining" />}
          {shopPct > 0 && <div style={{ width: `${shopPct}%` }} className="h-full bg-amber-500 rounded-sm" title="Shopping" />}
          {otherPct > 0 && <div style={{ width: `${otherPct}%` }} className="h-full bg-stone-400 rounded-sm" title="Leisure" />}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[9px] font-sans font-semibold text-[#7A7268] mt-1.5">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Sights</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2C]" /> Dining</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Markets</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-stone-400" /> Leisure</span>
        </div>
      </motion.div>

      {/* Solid Archetype Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, type: "spring" }}
        className="relative z-10 p-3 rounded-2xl bg-[#1E1C1A] text-white flex items-center gap-3 shadow-sm border border-stone-800"
      >
        <div className="w-9 h-9 rounded-xl bg-[#FF6B2C] text-white flex items-center justify-center shrink-0">
          <Award className="w-4.5 h-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[8.5px] font-mono uppercase tracking-widest text-[#FF6B2C] font-bold block">
            Traveler Archetype
          </span>
          <h4 className="text-xs font-serif font-bold text-white leading-tight truncate">
            {archetype}
          </h4>
          <p className="text-[9.5px] font-sans text-stone-300 truncate mt-0.5">
            {archetypedesc}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// 4. Standout Memory Highlight (Warm Polaroid)
const HighlightCard = ({ item }) => (
  <div className="w-full h-full relative pt-20 sm:pt-22 pb-8 px-5 sm:px-7 bg-[#FAF8F5] flex flex-col justify-between text-[#1E1C1A] overflow-hidden select-none">
    {/* Header */}
    <div className="relative z-10 flex items-center justify-between">
      <div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF6B2C] font-bold block mb-0.5">
          CAPTURED HIGHLIGHT
        </span>
        <h4 className="text-lg sm:text-xl font-serif font-black text-[#1E1C1A] leading-tight">
          Standout Memory
        </h4>
      </div>
      <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-full border border-[#E8E2D9] shadow-2xs">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-3.5 h-3.5 ${i < (item.rating || 5) ? 'fill-[#FF6B2C] text-[#FF6B2C]' : 'fill-transparent text-stone-300'}`} 
          />
        ))}
      </div>
    </div>

    {/* Polaroid Frame */}
    <motion.div 
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 350, damping: 25, delay: 0.12 }}
      className="relative z-10 my-auto mx-auto w-full max-w-[270px] bg-white p-3 pb-4.5 rounded-2xl shadow-md border border-[#E8E2D9] text-[#1E1C1A]"
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
        <div className="bg-white p-3 rounded-2xl border border-[#E8E2D9] shadow-2xs">
          <p className="text-xs font-serif italic text-[#1E1C1A] leading-relaxed line-clamp-3">
            &ldquo;{item.note}&rdquo;
          </p>
        </div>
      ) : (
        <p className="text-xs font-serif italic text-[#7A7268] text-center">
          One of the standout recorded stops from your expedition.
        </p>
      )}
    </motion.div>
  </div>
);

// 5. Perforated Master Boarding Pass & Finale (The Tactile Travel Ticket)
const OutroCard = ({ itinerary, heroPhoto, onDownload, isDownloading, onReplay }) => {
  const startDateStr = itinerary?.startDate ? new Date(itinerary.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
  const endDateStr = itinerary?.endDate ? new Date(itinerary.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const dateRange = startDateStr && endDateStr ? `${startDateStr} – ${endDateStr}` : `${itinerary?.days?.length || 1} Days Expedition`;
  const totalStops = itinerary?.days?.reduce((acc, d) => acc + (d.activities?.length || 0), 0) || 0;
  const destCode = getDestinationCode(itinerary?.destinationName);

  return (
    <div className="w-full h-full relative pt-20 sm:pt-22 pb-8 px-5 sm:px-7 bg-[#FAF8F5] flex flex-col justify-between overflow-hidden select-none text-[#1E1C1A]">
      {/* Header */}
      <div className="relative z-10 text-center">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF6B2C] font-bold block mb-0.5">
          EXPEDITION PASSPORT
        </span>
        <h3 className="text-2xl sm:text-3xl font-serif font-black text-[#1E1C1A] tracking-tight leading-tight">
          Your Keepsake Pass
        </h3>
      </div>

      {/* Official Perforated Boarding Pass Ticket */}
      <motion.div 
        id="recap-outro-card"
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 25, delay: 0.12 }}
        className="relative z-10 my-auto mx-auto w-full max-w-[310px] bg-white rounded-3xl p-4 sm:p-5 shadow-xl border border-[#E8E2D9] text-[#1E1C1A] overflow-hidden"
      >
        {/* Left & Right Authentic Semicircular Ticket Notches */}
        <div className="absolute -left-3.5 top-[68%] w-6 h-6 rounded-full bg-[#FAF8F5] border border-[#E8E2D9]" />
        <div className="absolute -right-3.5 top-[68%] w-6 h-6 rounded-full bg-[#FAF8F5] border border-[#E8E2D9]" />

        {/* Top Ticket Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9] mb-3">
          <div className="flex items-center gap-1.5">
            <Ticket className="w-4 h-4 text-[#FF6B2C]" />
            <span className="text-[9.5px] font-mono uppercase font-black tracking-widest text-[#1E1C1A]">
              BOARDING PASS
            </span>
          </div>
          <div className="px-2 py-0.5 rounded bg-[#1E1C1A] text-white text-[9px] font-mono font-bold tracking-wider">
            {destCode} ➔ EXP
          </div>
        </div>

        {/* Center Passport Portrait & Details */}
        <div className="flex items-center gap-3.5 mb-3.5">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#E8E2D9] shadow-xs bg-stone-100 relative shrink-0">
            <img src={heroPhoto} alt="Hero" className="w-full h-full object-cover" />
          </div>

          <div className="min-w-0 flex-1">
            <span className="text-[8.5px] font-mono uppercase tracking-widest text-[#FF6B2C] font-bold block">
              OFFICIAL TRAVEL DOSSIER
            </span>
            <h4 className="text-lg sm:text-xl font-serif font-black text-[#1E1C1A] tracking-tight leading-tight truncate">
              {itinerary?.destinationName || 'Destination'}
            </h4>
            <p className="text-[10px] text-[#7A7268] font-sans font-medium mt-0.5 truncate">
              {dateRange}
            </p>
          </div>
        </div>

        {/* Perforation Divider Line */}
        <div className="border-b-2 border-dashed border-[#E8E2D9] my-2" />

        {/* Barcode & Archival Stamp Footer */}
        <div className="pt-2 flex items-center justify-between">
          <div>
            <div className="text-[8px] font-mono text-[#7A7268] tracking-wider mb-0.5">
              TICKET NO. TW-8042
            </div>
            {/* Monospace Visual Barcode */}
            <div className="text-[12px] font-mono font-black tracking-widest text-[#1E1C1A] select-none">
              ||| | || ||| | ||| || |
            </div>
          </div>

          <div className="px-2.5 py-1 rounded-xl bg-[#FAF6F0] border border-[#E6DFD5] text-[8.5px] font-mono uppercase tracking-wider font-bold text-[#7A7268] text-right">
            ARCHIVED • {new Date().getFullYear()}
          </div>
        </div>
      </motion.div>

      {/* High-Priority Clickable Action Buttons */}
      <div className="relative z-50 flex flex-col gap-2 w-full max-w-[310px] mx-auto pointer-events-auto" data-html2canvas-ignore="true">
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
          <span>{isDownloading ? 'Saving Keepsake...' : 'Save Keepsake Boarding Pass'}</span>
        </motion.button>

        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            onReplay();
          }}
          className="w-full py-2.5 rounded-2xl bg-white hover:bg-[#F2ECE4] text-[#1E1C1A] font-sans font-bold text-xs flex items-center justify-center gap-2 border border-[#E8E2D9] transition-colors cursor-pointer shadow-2xs"
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
      link.download = `TripWise-BoardingPass-${itinerary?.destinationName || 'Trip'}.png`;
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
        <div className="fixed inset-0 z-[110000] flex items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4">
          
          {/* Backdrop Dismiss */}
          <div className="absolute inset-0" onClick={onClose} />

          {/* Desktop Left/Right Navigation Chevrons */}
          <div className="hidden lg:flex absolute inset-x-8 top-1/2 -translate-y-1/2 justify-between pointer-events-none z-50">
            <button
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              disabled={currentSlide === 0}
              className="w-12 h-12 rounded-full bg-white hover:bg-[#F2ECE4] text-[#1E1C1A] flex items-center justify-center border border-[#E8E2D9] transition-all disabled:opacity-20 cursor-pointer pointer-events-auto shadow-lg"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              disabled={isLastSlide}
              className="w-12 h-12 rounded-full bg-white hover:bg-[#F2ECE4] text-[#1E1C1A] flex items-center justify-center border border-[#E8E2D9] transition-all disabled:opacity-20 cursor-pointer pointer-events-auto shadow-lg"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Story Container - Warm Luxury Editorial Paper */}
          <div 
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
            className="relative w-full h-full sm:max-w-[420px] sm:max-h-[760px] bg-[#FAF8F5] overflow-hidden sm:rounded-[36px] sm:border border-[#E8E2D9] shadow-2xl flex flex-col z-10"
          >
            {/* Top Control Bar with Segmented Progress */}
            <div className="absolute top-0 left-0 right-0 p-4 pt-3.5 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E8E2D9]/80 pointer-events-none">
              
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
                      <div key={idx} className="h-1 flex-1 bg-[#E5DFD5] rounded-full overflow-hidden">
                        <div className="h-full w-full bg-[#1E1C1A]" />
                      </div>
                    );
                  }
                  if (idx > currentSlide) {
                    return (
                      <div key={idx} className="h-1 flex-1 bg-[#E5DFD5] rounded-full overflow-hidden">
                        <div className="h-full w-0 bg-[#1E1C1A]" />
                      </div>
                    );
                  }
                  return (
                    <div key={idx} className="h-1 flex-1 bg-[#E5DFD5] rounded-full overflow-hidden">
                      <div
                        key={`active-bar-${currentSlide}`}
                        className="h-full w-full bg-[#1E1C1A] origin-left"
                        style={{
                          transform: isLastSlide ? 'scaleX(1)' : 'scaleX(0)',
                          animation: !isLastSlide ? `storyProgress 5.5s linear forwards` : 'none',
                          animationPlayState: isPaused ? 'paused' : 'running'
                        }}
                        onAnimationEnd={() => {
                          if (!isLastSlide && !isPaused) {
                            handleNext();
                          }
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Story Header Controls */}
              <div className="flex items-center justify-between pointer-events-auto">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-serif font-black text-[#1E1C1A] truncate max-w-[160px]">
                    {itinerary?.destinationName || 'Trip'}
                  </span>
                  <span className="text-[9.5px] font-mono text-[#7A7268] bg-[#EFEAE2] border border-[#E0D8CC] px-2 py-0.5 rounded-full font-bold">
                    {String(currentSlide + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); setIsPaused(p => !p); }}
                    className="w-8 h-8 rounded-full bg-white hover:bg-[#F2ECE4] flex items-center justify-center text-[#1E1C1A] border border-[#E8E2D9] transition-colors cursor-pointer shadow-2xs"
                    title={isPaused ? "Resume" : "Pause"}
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5 fill-[#1E1C1A] ml-0.5" /> : <Pause className="w-3.5 h-3.5" />}
                  </button>

                  <button 
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-white hover:bg-[#F2ECE4] flex items-center justify-center text-[#1E1C1A] border border-[#E8E2D9] transition-colors cursor-pointer shadow-2xs"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tap Navigation Zones */}
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
