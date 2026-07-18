'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

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
              : 'text-stone-400'
          }`}
        >
          ★
        </span>
      ))}
      <span className="text-[10px] font-extrabold text-[#1F1F1F] ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

function HandDrawnAnnotations({ destId }) {
  if (destId !== 'queenstown') return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {/* Milford Sound Pointer */}
      <svg className="absolute bottom-[30%] left-[20%] w-30 h-20 overflow-visible drop-shadow-md">
        <path d="M 10 70 Q 50 10 110 30" fill="transparent" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" />
        <circle cx="110" cy="30" r="4" fill="#FF6B2C" />
        <text x="15" y="85" fill="white" fontSize="11" fontWeight="bold" className="font-mono tracking-widest drop-shadow-sm uppercase">Milford Sound</text>
      </svg>
      
      {/* Ski Area Circle */}
      <svg className="absolute top-[25%] right-[25%] w-25 h-25 overflow-visible drop-shadow-md">
        <path d="M 50 10 C 80 10 90 40 80 70 C 70 100 30 90 20 60 C 10 30 20 10 50 10" fill="transparent" stroke="rgba(255,107,44,0.9)" strokeWidth="2.5" strokeDasharray="6 4" strokeLinecap="round" />
        <text x="80" y="20" fill="#FF6B2C" fontSize="10" fontWeight="bold" className="font-mono tracking-widest drop-shadow-sm uppercase">Ski Area</text>
      </svg>
    </div>
  );
}

export default function BentoShowcase({ destinations, onCardClick }) {
  const [zoomingId, setZoomingId] = useState(null);
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  const yParallax = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  // Mega Card Rotation State
  const [megaIndex, setMegaIndex] = useState(0);

  if (!destinations || destinations.length < 4) return null;

  // Standardize sizing: sort by rating descending so the highest rated is the cover story
  const sortedDests = [...destinations].sort((a, b) => b.rating - a.rating);
  
  const coverDest = sortedDests[0]; // Kyoto (highest rated)
  
  // The rest go into the mega rotating slot or the bottom duo
  const remainingDests = sortedDests.slice(1);
  const megaOptions = remainingDests.slice(0, 3); // Rotating Queenstown, etc.
  const duoDest1 = remainingDests[remainingDests.length - 2];
  const duoDest2 = remainingDests[remainingDests.length - 1];
  
  const activeMegaDest = megaOptions[megaIndex % megaOptions.length];

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const int = setInterval(() => {
      setMegaIndex(prev => prev + 1);
    }, 7000);
    return () => clearInterval(int);
  }, []);

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
    <div className="w-full relative" ref={containerRef}>
      <AnimatePresence>
        {zoomingId && (
          <motion.div 
            className="fixed inset-0 bg-white z-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>

      {/* True Editorial Masonry Layout */}
      <div className="flex flex-col lg:flex-row gap-5 h-auto lg:h-175">
        
        {/* ─── LEFT: COVER STORY (Full Height) ─── */}
        <motion.div
          onClick={() => handleClick(coverDest)}
          whileHover="hover"
          className="group relative w-full lg:w-5/12 h-125 lg:h-full rounded-3xl overflow-hidden bg-stone-900 cursor-pointer shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-[#ECE8E2]/60 flex flex-col p-6 lg:p-8"
        >
          {coverDest.imageUrl && (
            <motion.div className="absolute inset-[-10%] w-[120%] h-[120%]" style={{ y: yParallax }}>
              <img 
                src={coverDest.imageUrl} 
                alt={coverDest.name} 
                className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-[1.03]"
              />
            </motion.div>
          )}
          {/* Default Gradient */}
          <motion.div 
            className="absolute inset-0 bg-linear-to-t from-stone-950 via-stone-950/40 to-black/20"
            variants={{ hover: { opacity: 0 } }}
            transition={{ duration: 0.4 }}
          />
          {/* Hover Darken Gradient */}
          <motion.div 
            className="absolute inset-0 bg-black/75"
            initial={{ opacity: 0 }}
            variants={{ hover: { opacity: 1 } }}
            transition={{ duration: 0.4 }}
          />

          {/* Interactive "Flip to Verdict" Overlay */}
          <motion.div 
            className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 pointer-events-none"
            initial={{ opacity: 0, y: 10 }}
            variants={{ hover: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <p className="text-white text-3xl md:text-4xl leading-tight font-serif italic text-center drop-shadow-xl">
              "{coverDest.aiTip ? coverDest.aiTip.replace('💡 AI Tip: ', '').replace('💡 AI Verdict: ', '') : coverDest.tagline}"
            </p>
            <div className="mt-8 text-[#FF6B2C] text-sm font-bold tracking-[0.2em] uppercase font-mono border-b border-[#FF6B2C] pb-1">
              AI Verdict
            </div>
          </motion.div>

          {/* Top Badges (Hide on hover) */}
          <motion.div 
            className="relative z-10 flex flex-col items-start gap-2"
            variants={{ hover: { opacity: 0, y: -10 } }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white bg-black/40 backdrop-blur-md border border-white/20 shadow-sm">
              ★ TOP RATED
            </span>
            <div className="flex gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/30 text-white bg-black/40 backdrop-blur-md uppercase tracking-wider">
                {coverDest.badge}
              </span>
            </div>
          </motion.div>

          {/* Bottom Content (Hide on hover) */}
          <motion.div 
            className="relative z-10 mt-auto flex flex-col gap-2"
            variants={{ hover: { opacity: 0, y: 10 } }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-white/80 text-xs font-bold uppercase tracking-[0.2em]">{coverDest.country} • {coverDest.duration}</p>
            <h3 className="text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-none mb-1">
              {coverDest.name}
            </h3>
            <div className="flex flex-wrap items-center gap-3 border-t border-white/20 pt-4 mt-2">
              <div className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg">
                <Stars rating={coverDest.rating} />
              </div>
              <span className="text-xs font-bold text-white/90 bg-black/50 px-3 py-1 rounded-lg border border-white/15">
                From {formatBudget(coverDest.budget)}
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* ─── RIGHT SIDE ─── */}
        <div className="flex flex-col gap-5 w-full lg:w-7/12 h-full">
          
          {/* ─── ROTATING MEGA CARD (Top Right) ─── */}
          <motion.div
            onClick={() => handleClick(activeMegaDest)}
            whileHover="hover"
            className="group relative w-full h-95 lg:h-100 rounded-3xl overflow-hidden bg-stone-900 cursor-pointer shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-[#ECE8E2]/60 flex flex-col p-6"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMegaDest.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2 }}
                className="absolute inset-[-10%] w-[120%] h-[120%]"
                style={{ y: yParallax }}
              >
                <img 
                  src={activeMegaDest.imageUrl} 
                  alt={activeMegaDest.name} 
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </AnimatePresence>
            
            <div className="absolute inset-0 bg-linear-to-t from-stone-950 via-stone-900/30 to-black/20 pointer-events-none" />
            <motion.div 
              className="absolute inset-0 bg-black/60 pointer-events-none"
              initial={{ opacity: 0 }}
              variants={{ hover: { opacity: 1 } }}
              transition={{ duration: 0.4 }}
            />

            <HandDrawnAnnotations destId={activeMegaDest.id} />

            {/* Interactive Verdict Overlay */}
            <motion.div 
              className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 pointer-events-none"
              initial={{ opacity: 0, y: 10 }}
              variants={{ hover: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <p className="text-white text-2xl leading-tight font-serif italic text-center drop-shadow-xl max-w-sm">
                "{activeMegaDest.aiTip ? activeMegaDest.aiTip.replace('💡 AI Tip: ', '').replace('💡 AI Verdict: ', '') : activeMegaDest.tagline}"
              </p>
            </motion.div>

            <motion.div 
              className="relative z-10 flex items-center justify-between"
              variants={{ hover: { opacity: 0, y: -10 } }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-[11px] font-bold px-3 py-1 rounded-full text-white bg-black/40 backdrop-blur-md border border-white/20 uppercase tracking-widest shadow-sm">
                EDITOR'S PICK
              </span>
              {activeMegaDest.crowdLevel && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-md ${getCrowdBadgeStyle(activeMegaDest.crowdLevel)}`}>
                  {activeMegaDest.crowdLevel}
                </span>
              )}
            </motion.div>

            <motion.div 
              className="relative z-10 mt-auto flex flex-col gap-1"
              variants={{ hover: { opacity: 0, y: 10 } }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-white/80 text-[11px] font-semibold uppercase tracking-wider">{activeMegaDest.country}</p>
              <div className="flex items-end justify-between">
                <h3 className="text-3xl font-extrabold text-white tracking-tight">{activeMegaDest.name}</h3>
                <div className="bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-md shadow-xs mb-1 border border-stone-200/50">
                  <Stars rating={activeMegaDest.rating} />
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* ─── HORIZONTAL DUO (Bottom Right) ─── */}
          <div className="flex flex-col sm:flex-row gap-5 h-full">
            {[duoDest1, duoDest2].map((dest, idx) => {
              if (!dest) return null;
              return (
                <motion.div
                  key={dest.id}
                  onClick={() => handleClick(dest)}
                  whileHover="hover"
                  className="group relative w-full h-62.5 sm:h-full rounded-3xl overflow-hidden bg-stone-900 cursor-pointer shadow-[0_12px_32px_rgba(0,0,0,0.1)] border border-[#ECE8E2]/60 flex flex-col p-5"
                >
                  {dest.imageUrl && (
                    <motion.div className="absolute inset-[-10%] w-[120%] h-[120%]" style={{ y: yParallax }}>
                      <img 
                        src={dest.imageUrl} 
                        alt={dest.name} 
                        className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-[1.04]"
                      />
                    </motion.div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-stone-950 via-stone-900/40 to-black/20 pointer-events-none" />
                  <motion.div 
                    className="absolute inset-0 bg-black/65 pointer-events-none"
                    initial={{ opacity: 0 }}
                    variants={{ hover: { opacity: 1 } }}
                    transition={{ duration: 0.4 }}
                  />

                  {/* Interactive Verdict Overlay */}
                  <motion.div 
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 pointer-events-none"
                    initial={{ opacity: 0, y: 10 }}
                    variants={{ hover: { opacity: 1, y: 0 } }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <p className="text-white text-base leading-snug font-serif italic text-center drop-shadow-xl">
                      "{dest.aiTip ? dest.aiTip.replace('💡 AI Tip: ', '').replace('💡 AI Verdict: ', '') : dest.tagline}"
                    </p>
                  </motion.div>

                  <motion.div 
                    className="relative z-10 flex items-center justify-between"
                    variants={{ hover: { opacity: 0, y: -5 } }}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white bg-black/40 backdrop-blur-md border border-white/20 shadow-sm tracking-wider uppercase">
                      {dest.badge.replace(/[^\x00-\x7F]/g, '')} {/* Remove emoji for space */}
                    </span>
                    {dest.weather && (
                      <span className="text-[9px] font-semibold bg-black/50 text-white px-2 py-0.5 rounded-full backdrop-blur-md border border-white/10">
                        {dest.weather.split('•')[0]}
                      </span>
                    )}
                  </motion.div>

                  <motion.div 
                    className="relative z-10 mt-auto"
                    variants={{ hover: { opacity: 0, y: 10 } }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider">{dest.country}</p>
                    <h3 className="text-2xl font-extrabold text-white tracking-tight">{dest.name}</h3>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
          
        </div>
      </div>
    </div>
  );
}
