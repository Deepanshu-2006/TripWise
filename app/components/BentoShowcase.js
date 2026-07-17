'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Star rating helper
function Stars({ rating }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.3;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`text-xs ${
            i < full
              ? 'text-amber-400 font-bold'
              : i === full && hasHalf
              ? 'text-amber-300 font-bold'
              : 'text-stone-300'
          }`}
        >
          ★
        </span>
      ))}
      <span className="text-xs font-extrabold text-[#1F1F1F] ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function BentoShowcase({ destinations, onCardClick }) {
  const [zoomingId, setZoomingId] = useState(null);

  if (!destinations || destinations.length < 4) return null;

  const heroDest = destinations[0]; // e.g., Kyoto
  const verticalDest = destinations[1]; // e.g., New York
  const topSquareDest = destinations[2]; // e.g., Barcelona
  const bottomSquareDest = destinations[3]; // e.g., Queenstown

  const handleClick = (dest) => {
    setZoomingId(dest.id);
    setTimeout(() => {
      onCardClick(dest);
    }, 450);
  };

  const getCrowdBadgeStyle = (crowd) => {
    if (!crowd) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    if (crowd.includes('Low')) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    if (crowd.includes('Moderate')) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
  };

  const formatBudget = (budgetArr) => {
    if (!budgetArr) return '$$ Standard';
    if (budgetArr.includes('economy')) return '$ Economy';
    if (budgetArr.includes('standard')) return '$$ Standard';
    return '$$$ Premium';
  };

  return (
    <div className="w-full">
      <AnimatePresence>
        {zoomingId && (
          <motion.div 
            className="fixed inset-0 bg-white z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5 auto-rows-[240px] md:auto-rows-[260px]">
        {/* ─── HERO BENTO CARD (2x2 Span) ─── */}
        <motion.div
          onClick={() => handleClick(heroDest)}
          whileHover={{ y: -4 }}
          className="group relative md:col-span-2 md:row-span-2 rounded-3xl overflow-hidden bg-stone-900 cursor-pointer shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-[#ECE8E2]/60 flex flex-col justify-between p-6"
        >
          {heroDest.imageUrl && (
            <img 
              src={heroDest.imageUrl} 
              alt={heroDest.name} 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-stone-950 via-stone-900/40 to-black/20" />

          {/* Top Badges */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span 
                className="text-xs font-bold px-3 py-1 rounded-full text-white backdrop-blur-md border border-white/20 shadow-sm"
                style={{ 
                  backgroundColor: (heroDest.badgeColor || '#FF6B2C') + 'dd',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                {heroDest.badge}
              </span>
              {heroDest.weather && (
                <span className="text-xs font-semibold bg-black/50 text-white/90 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                  {heroDest.weather}
                </span>
              )}
            </div>
            {heroDest.crowdLevel && (
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border backdrop-blur-md ${getCrowdBadgeStyle(heroDest.crowdLevel)}`}>
                {heroDest.crowdLevel}
              </span>
            )}
          </div>

          {/* Bottom Content & Telemetry Strip */}
          <div className="relative z-10 mt-auto flex flex-col gap-3 pt-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">
                  <span>{heroDest.country}</span>
                  <span>•</span>
                  <span>{heroDest.duration}</span>
                </div>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight group-hover:text-[#FF6B2C] transition-colors">
                  {heroDest.name}
                </h3>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <div className="bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg mb-1 shadow-xs">
                  <Stars rating={heroDest.rating} />
                </div>
                <span className="text-xs font-medium text-white/80 bg-black/40 px-2 py-0.5 rounded-md border border-white/10">
                  From {formatBudget(heroDest.budget)}
                </span>
              </div>
            </div>

            {/* AI Verdict Strip */}
            <div className="bg-black/60 backdrop-blur-xl border border-white/15 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#FF6B2C]/20 border border-[#FF6B2C]/40 flex items-center justify-center shrink-0 text-sm">
                  💡
                </div>
                <p className="text-xs text-white/90 font-medium truncate sm:whitespace-normal sm:line-clamp-2">
                  {heroDest.aiTip || `AI Tip: Perfect 5-day itinerary available with optimized day-by-day pacing.`}
                </p>
              </div>
              <button 
                type="button"
                className="shrink-0 bg-[#FF6B2C] group-hover:bg-[#ff7b42] text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-[0_4px_16px_rgba(255,107,44,0.3)] flex items-center gap-1.5"
              >
                <span>Build Trip</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* ─── VERTICAL BENTO CARD (1x2 Span) ─── */}
        <motion.div
          onClick={() => handleClick(verticalDest)}
          whileHover={{ y: -4 }}
          className="group relative md:col-span-1 md:row-span-2 rounded-3xl overflow-hidden bg-stone-900 cursor-pointer shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-[#ECE8E2]/60 flex flex-col justify-between p-5"
        >
          {verticalDest.imageUrl && (
            <img 
              src={verticalDest.imageUrl} 
              alt={verticalDest.name} 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-stone-950 via-stone-900/50 to-black/30" />

          {/* Top Badges */}
          <div className="relative z-10 flex flex-col items-start gap-1.5">
            <span 
              className="text-[11px] font-bold px-2.5 py-1 rounded-full text-white backdrop-blur-md border border-white/20 shadow-sm"
              style={{ 
                backgroundColor: (verticalDest.badgeColor || '#3B82F6') + 'dd',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              {verticalDest.badge}
            </span>
            {verticalDest.weather && (
              <span className="text-[10px] font-semibold bg-black/50 text-white/90 px-2 py-0.5 rounded-full backdrop-blur-md border border-white/10">
                {verticalDest.weather}
              </span>
            )}
          </div>

          {/* Bottom Content */}
          <div className="relative z-10 mt-auto flex flex-col gap-2.5">
            <div>
              <p className="text-white/80 text-[11px] font-semibold uppercase tracking-wider">{verticalDest.country}</p>
              <h3 className="text-2xl font-extrabold text-white group-hover:text-[#FF6B2C] transition-colors">
                {verticalDest.name}
              </h3>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-white/15 pt-2.5">
              <div className="bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-md">
                <Stars rating={verticalDest.rating} />
              </div>
              <span className="text-[11px] font-semibold text-white/90 bg-black/40 px-2 py-0.5 rounded-md border border-white/10">
                {formatBudget(verticalDest.budget)}
              </span>
            </div>
            <div className="bg-black/60 backdrop-blur-md border border-white/15 rounded-xl p-2.5 text-[11px] text-white/80 italic leading-snug">
              {verticalDest.aiTip || '💡 AI Tip: Ideal for urban nightlife & cultural discovery.'}
            </div>
          </div>
        </motion.div>

        {/* ─── TOP RIGHT SQUARE BENTO CARD ─── */}
        <motion.div
          onClick={() => handleClick(topSquareDest)}
          whileHover={{ y: -3 }}
          className="group relative md:col-span-1 md:row-span-1 rounded-3xl overflow-hidden bg-stone-900 cursor-pointer shadow-[0_12px_32px_rgba(0,0,0,0.1)] border border-[#ECE8E2]/60 flex flex-col justify-between p-4.5"
        >
          {topSquareDest.imageUrl && (
            <img 
              src={topSquareDest.imageUrl} 
              alt={topSquareDest.name} 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-stone-950 via-stone-900/40 to-black/20" />

          <div className="relative z-10 flex items-center justify-between gap-1">
            <span 
              className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white backdrop-blur-md border border-white/20 shadow-sm"
              style={{ 
                backgroundColor: (topSquareDest.badgeColor || '#10B981') + 'dd',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              {topSquareDest.badge.split(' ').slice(1).join(' ')}
            </span>
            {topSquareDest.weather && (
              <span className="text-[9px] font-semibold bg-black/50 text-white px-2 py-0.5 rounded-full backdrop-blur-md border border-white/10">
                {topSquareDest.weather.split('•')[0]}
              </span>
            )}
          </div>

          <div className="relative z-10 mt-auto">
            <p className="text-white/80 text-[10px] font-semibold uppercase">{topSquareDest.country}</p>
            <div className="flex items-center justify-between gap-1">
              <h3 className="text-xl font-extrabold text-white group-hover:text-[#FF6B2C] transition-colors">
                {topSquareDest.name}
              </h3>
              <span className="text-[10px] font-bold text-white/90 bg-black/50 px-2 py-0.5 rounded-md border border-white/10">
                ★ {topSquareDest.rating}
              </span>
            </div>
            <p className="text-[11px] text-white/75 truncate mt-1">
              {topSquareDest.aiTip ? topSquareDest.aiTip.replace('💡 AI Verdict: ', '') : topSquareDest.tagline}
            </p>
          </div>
        </motion.div>

        {/* ─── BOTTOM RIGHT SQUARE BENTO CARD ─── */}
        <motion.div
          onClick={() => handleClick(bottomSquareDest)}
          whileHover={{ y: -3 }}
          className="group relative md:col-span-1 md:row-span-1 rounded-3xl overflow-hidden bg-stone-900 cursor-pointer shadow-[0_12px_32px_rgba(0,0,0,0.1)] border border-[#ECE8E2]/60 flex flex-col justify-between p-4.5"
        >
          {bottomSquareDest.imageUrl && (
            <img 
              src={bottomSquareDest.imageUrl} 
              alt={bottomSquareDest.name} 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-stone-950 via-stone-900/40 to-black/20" />

          <div className="relative z-10 flex items-center justify-between gap-1">
            <span 
              className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white backdrop-blur-md border border-white/20 shadow-sm"
              style={{ 
                backgroundColor: (bottomSquareDest.badgeColor || '#F59E0B') + 'dd',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              {bottomSquareDest.badge.split(' ').slice(1).join(' ')}
            </span>
            {bottomSquareDest.weather && (
              <span className="text-[9px] font-semibold bg-black/50 text-white px-2 py-0.5 rounded-full backdrop-blur-md border border-white/10">
                {bottomSquareDest.weather.split('•')[0]}
              </span>
            )}
          </div>

          <div className="relative z-10 mt-auto">
            <p className="text-white/80 text-[10px] font-semibold uppercase">{bottomSquareDest.country}</p>
            <div className="flex items-center justify-between gap-1">
              <h3 className="text-xl font-extrabold text-white group-hover:text-[#FF6B2C] transition-colors">
                {bottomSquareDest.name}
              </h3>
              <span className="text-[10px] font-bold text-white/90 bg-black/50 px-2 py-0.5 rounded-md border border-white/10">
                ★ {bottomSquareDest.rating}
              </span>
            </div>
            <p className="text-[11px] text-white/75 truncate mt-1">
              {bottomSquareDest.aiTip ? bottomSquareDest.aiTip.replace('💡 AI Verdict: ', '') : bottomSquareDest.tagline}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
