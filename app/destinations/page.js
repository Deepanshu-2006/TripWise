'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import OrigamiFilterBar from '../components/OrigamiFilterBar';
import BentoShowcase from '../components/BentoShowcase';
import AtlasRadarMap from '../components/AtlasRadarMap';
import { DESTINATIONS } from '../../lib/destinations';

// ─── Icon Components (match PlannerSidebar exactly) ────────────────────────
const FoodieIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
    <path d="M7 2v20" />
    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
  </svg>
);

const HistoryIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 22h18" />
    <path d="M6 18v-7" /><path d="M10 18v-7" /><path d="M14 18v-7" /><path d="M18 18v-7" />
    <path d="M12 2 2 7h20L12 2Z" />
  </svg>
);

const NatureIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.4 19 2c1 2 2 4.1 2 11.5a8.5 8.5 0 0 1-10 6.5Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

const NightlifeIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 22h8" /><path d="M12 11v11" /><path d="m19 3-7 8-7-8Z" />
  </svg>
);

const ArtIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2Z" />
  </svg>
);

const ShoppingIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="10" width="12" height="11" rx="2" />
    <path d="M10 10V6a2 2 0 0 1 4 0v4" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);

const StarIcon = ({ filled }) => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={filled ? '#FF6B2C' : 'none'} stroke="#FF6B2C" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
  </svg>
);

const GlobeIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

// ─── Filter Data ────────────────────────────────────────────────────────────
const VIBE_FILTERS = [
  { id: 'foodie',    label: 'Foodie',    icon: <FoodieIcon /> },
  { id: 'history',   label: 'History',   icon: <HistoryIcon /> },
  { id: 'nature',    label: 'Nature',    icon: <NatureIcon /> },
  { id: 'nightlife', label: 'Nightlife', icon: <NightlifeIcon /> },
  { id: 'art',       label: 'Art',       icon: <ArtIcon /> },
  { id: 'shopping',  label: 'Shopping',  icon: <ShoppingIcon /> },
];

const BUDGET_FILTERS = [
  { id: 'economy',  label: 'Economy' },
  { id: 'standard', label: 'Standard' },
  { id: 'premium',  label: 'Premium' },
];

const REGION_FILTERS = [
  { id: 'europe',   label: 'Europe' },
  { id: 'asia',     label: 'Asia' },
  { id: 'americas', label: 'Americas' },
  { id: 'africa',   label: 'Africa' },
  { id: 'oceania',  label: 'Oceania' },
];

// ─── Destination Data Imported from lib/destinations.js ─────────

const TRENDING_IDS = ['kyoto', 'new-york', 'barcelona', 'queenstown'];

function CustomAIPlanConsole() {
  const [promptText, setPromptText] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const samplePrompts = [
    { label: '🇮🇹 Amalfi Coast', prompt: '7 Days in Amalfi Coast with sunset boat tour, lemon grove walks & luxury pasta masterclasses' },
    { label: '🌸 Spring in Kyoto', prompt: '5 Days in Kyoto during Cherry Blossom season with tea ceremonies & bamboo forest' },
    { label: '❄️ Iceland Lights', prompt: '6 Days in Iceland for Northern Lights, Blue Lagoon geothermal spa & glacier hikes' },
    { label: '🍷 Tuscan Wine', prompt: '4 Days in Tuscany with wine tasting, truffle hunting & villa stay' },
  ];

  const placeholderPhrases = [
    'e.g. 5 days in Tokyo with Shibuya crossing & sushi masterclass...',
    'e.g. 7 days in Amalfi Coast with sunset sailboat tour & wine tasting...',
    'e.g. 6 days in Iceland for Northern Lights & geothermal spas...',
    'e.g. 4 days in Tuscany for vineyard tours & cooking masterclasses...'
  ];

  // Auto-typing placeholder effect
  useEffect(() => {
    if (promptText) return; // don't animate if user typed text
    const currentPhrase = placeholderPhrases[placeholderIndex];
    
    let timer;
    if (!isDeleting && displayedText.length < currentPhrase.length) {
      timer = setTimeout(() => {
        setDisplayedText(currentPhrase.slice(0, displayedText.length + 1));
      }, 45);
    } else if (!isDeleting && displayedText.length === currentPhrase.length) {
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, 2200);
    } else if (isDeleting && displayedText.length > 0) {
      timer = setTimeout(() => {
        setDisplayedText(currentPhrase.slice(0, displayedText.length - 1));
      }, 25);
    } else if (isDeleting && displayedText.length === 0) {
      setIsDeleting(false);
      setPlaceholderIndex((prev) => (prev + 1) % placeholderPhrases.length);
    }

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, placeholderIndex, promptText]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const finalPrompt = promptText.trim() || displayedText || 'A dream trip';
    window.location.href = `/ai-planner?prompt=${encodeURIComponent(finalPrompt)}`;
  };

  return (
    <section className="rounded-3xl bg-[#121214] border border-stone-800 p-8 sm:p-12 shadow-2xl relative overflow-hidden">
      {/* Clean Architectural Compass Grid (Zero planes/rockets) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 select-none" viewBox="0 0 1000 360" preserveAspectRatio="none">
        {/* Subdued Coordinate Grid Lines */}
        <g stroke="#71717a" strokeWidth="0.75" fill="none" opacity="0.35">
          <line x1="0" y1="90" x2="1000" y2="90" strokeDasharray="4 8" />
          <line x1="0" y1="180" x2="1000" y2="180" strokeDasharray="4 8" />
          <line x1="0" y1="270" x2="1000" y2="270" strokeDasharray="4 8" />
          <line x1="250" y1="0" x2="250" y2="360" strokeDasharray="4 8" />
          <line x1="500" y1="0" x2="500" y2="360" strokeDasharray="4 8" />
          <line x1="750" y1="0" x2="750" y2="360" strokeDasharray="4 8" />
        </g>

        {/* Subtle Slow Rotating Compass Scope */}
        <motion.g
          transform="translate(500, 180)"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        >
          <circle r="160" fill="none" stroke="#71717a" strokeWidth="0.75" strokeDasharray="3 8" opacity="0.4" />
          <circle r="90" fill="none" stroke="#52525b" strokeWidth="0.75" strokeDasharray="2 6" opacity="0.3" />
        </motion.g>
      </svg>

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center">
        {/* Headline */}
        <h3 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight font-serif tracking-tight">
          Don&apos;t see your dream trip?
        </h3>
        
        <p className="text-stone-400 text-sm sm:text-base mt-2.5 max-w-2xl font-medium leading-relaxed">
          Describe any city, vibe, or budget in natural language and let TripWise AI craft your entire custom itinerary — stops, timings, budget, and flights included.
        </p>

        {/* Interactive Prompt Console Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mt-8 flex flex-col sm:flex-row items-center gap-3 bg-[#1C1B1B] border border-stone-700 p-2.5 rounded-2xl sm:rounded-full shadow-2xl transition-all hover:border-[#FF5B1D]/60 focus-within:border-[#FF5B1D] focus-within:ring-2 focus-within:ring-[#FF5B1D]/30">
          <div className="flex items-center gap-3 pl-4 flex-1 w-full text-left">
            <span className="text-lg animate-bounce">✨</span>
            <input
              type="text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder={displayedText || "e.g. 5 days in Tokyo on standard budget..."}
              className="w-full bg-transparent text-white text-sm placeholder:text-stone-400 focus:outline-none font-sans font-medium"
            />
          </div>

          {/* Jet Takeoff Button */}
          <button
            type="submit"
            className="group relative overflow-hidden shrink-0 w-full sm:w-auto flex items-center justify-center gap-2.5 rounded-full text-white font-extrabold text-xs px-6 py-3.5 cursor-pointer tracking-wider uppercase font-mono transition-all duration-300 bg-gradient-to-r from-[#FF5B1D] via-[#FE6B25] to-[#FF5B1D] shadow-[0_6px_25px_rgba(255,91,29,0.45)] hover:shadow-[0_10px_35px_rgba(255,91,29,0.75)] hover:-translate-y-0.5 border border-white/20"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-[#FF5B1D] via-[#FE7717] to-[#FF5B1D] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0" />
            <span className="relative z-10 flex items-center justify-center gap-2 group-hover:tracking-widest transition-all duration-300">
              <span>Generate Trip</span>
            </span>
            <div className="relative z-10 w-4 h-4 overflow-hidden flex items-center justify-center shrink-0">
              <span className="inline-block transform rotate-45 group-hover:translate-x-6 group-hover:-translate-y-6 transition-all duration-300 ease-in text-white">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                </svg>
              </span>
              <span className="absolute inline-block transform rotate-45 -translate-x-6 translate-y-6 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300 ease-out text-white delay-75">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                </svg>
              </span>
            </div>
          </button>
        </form>

        {/* Quick Sample Prompt Chips with Micro-Hover Lift */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider font-semibold mr-1">Popular Prompts:</span>
          {samplePrompts.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setPromptText(item.prompt);
              }}
              className="text-[11px] font-medium text-stone-300 bg-stone-900/90 hover:bg-[#FF5B1D] hover:text-white border border-stone-800 hover:border-[#FF5B1D] px-3.5 py-1.5 rounded-full transition-all duration-200 cursor-pointer shadow-xs hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(255,91,29,0.3)]"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stars({ rating }) {
  const full = Math.floor(rating);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <StarIcon key={n} filled={n <= full} />
      ))}
    </div>
  );
}

function FilterPill({ label, icon, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm transition-all duration-200 ease-out cursor-pointer whitespace-nowrap select-none ${
        active
          ? 'bg-[#FF5B1D] text-white border-2 border-[#FF5B1D] font-extrabold shadow-[0_6px_20px_rgba(255,91,29,0.35)] -translate-y-0.5'
          : 'bg-white border border-stone-200/90 text-stone-700 font-semibold hover:border-[#FF5B1D]/60 hover:text-[#FF5B1D] hover:bg-[#FF5B1D]/[0.05] hover:shadow-[0_6px_16px_rgba(255,91,29,0.15)] hover:-translate-y-0.5 active:scale-95'
      }`}
    >
      {icon && (
        <span className={`transition-transform duration-200 ${
          active 
            ? 'text-white scale-110' 
            : 'text-stone-400 group-hover:text-[#FF5B1D] group-hover:scale-110'
        }`}>
          {icon}
        </span>
      )}
      <span>{label}</span>

      {/* Active Dot Indicator */}
      {active && (
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse ml-0.5" />
      )}
    </button>
  );
}

function DestCard({ dest, onClick, isHighlighted }) {
  const minBudget = dest.budget.includes('economy') ? 'Economy' : dest.budget.includes('standard') ? 'Standard' : 'Premium';
  const budgetStr = minBudget === 'Economy' ? '$ Economy' : minBudget === 'Standard' ? '$$ Standard' : '$$$ Premium';

  const [isHovered, setIsHovered] = useState(false);
  const [isZooming, setIsZooming] = useState(false);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const handleClick = () => {
    setIsZooming(true);
    setTimeout(() => {
      onClick(dest);
    }, 800);
  };

  return (
    <motion.div 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-full cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.div
        className="w-full h-full relative"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ 
          rotateY: isZooming ? 180 : 0
        }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
      >
        {/* FRONT FACE */}
        <div className="w-full h-full" style={{ backfaceVisibility: 'hidden' }}>
          <div
            id={`dest-card-${dest.id}`}
            onClick={handleClick}
            className={`group rounded-2xl overflow-hidden bg-white border ${
              isHighlighted ? 'border-[#FF5B1D] ring-2 ring-[#FF5B1D]/40' : 'border-stone-200/80'
            } shadow-xs hover:border-[#FF5B1D]/50 hover:shadow-[0_20px_45px_-10px_rgba(255,91,29,0.2)] flex flex-col relative h-full transition-all duration-300 ease-out z-10 hover:-translate-y-1.5`}
          >

            {/* Card Hero Image Header */}
            <div className="relative h-44 overflow-hidden" style={{ backgroundColor: dest.bgColor }}>
              {/* Flight path dotted curve animation */}
              <motion.svg 
                className="absolute top-0 left-0 w-full h-8 z-10 pointer-events-none" 
                viewBox="0 0 100 10" preserveAspectRatio="none"
              >
                <motion.path 
                  d="M 0 5 Q 50 -2 100 5" 
                  fill="transparent" 
                  stroke="rgba(255,255,255,0.7)" 
                  strokeWidth="0.75" 
                  strokeDasharray="3 3"
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  viewport={{ once: false }}
                />
              </motion.svg>
              
              {/* Animated Cover Photo (Continuous Slow Pan & Scale Drift on Hover) */}
              <div className="absolute inset-0 overflow-hidden">
                {dest.imageUrl && (
                  <motion.img 
                    src={dest.imageUrl} 
                    alt={dest.name} 
                    className="w-full h-full object-cover origin-center"
                    animate={isHovered ? {
                      scale: 1.12,
                      x: [0, -5, 5, 0],
                      y: [0, -3, 3, 0],
                      filter: 'brightness(1.08) saturate(1.12)'
                    } : {
                      scale: 1,
                      x: 0,
                      y: 0,
                      filter: 'brightness(1) saturate(1)'
                    }}
                    transition={isHovered ? {
                      scale: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
                      x: { duration: 5, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
                      y: { duration: 7, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
                      filter: { duration: 0.4 }
                    } : {
                      duration: 0.5,
                      ease: "easeOut"
                    }}
                  />
                )}
                {/* Contrast Vignette Overlay for Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1C1B1B]/95 via-[#1C1B1B]/30 to-[#1C1B1B]/35 transition-opacity duration-500 group-hover:opacity-85 pointer-events-none" />
              </div>
              
              {/* Top Info Bar: Category Badge (Left) & Duration Pill (Right) */}
              <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between gap-1.5 pointer-events-none">
                <span className="text-[9px] font-mono font-black uppercase tracking-wider px-2.5 py-1 rounded-full text-white bg-[#1C1B1B]/75 backdrop-blur-md border border-white/20 shadow-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[65%] leading-none group-hover:border-white/40 transition-colors">
                  {dest.badge}
                </span>
                <span className="text-[9px] font-mono font-black text-white px-2.5 py-1 rounded-full bg-[#1C1B1B]/75 backdrop-blur-md border border-white/20 shadow-xs whitespace-nowrap shrink-0 tracking-wider leading-none group-hover:border-white/40 transition-colors">
                  {dest.duration}
                </span>
              </div>
            </div>

            {/* Perforated Ticket Seam Divider */}
            <div className="relative w-full h-px bg-stone-200 border-b border-dashed border-stone-300/80 z-20">
              <div className="absolute -left-2 -top-2 w-4 h-4 rounded-full bg-[#FFF8F5] border-r border-stone-300/50" />
              <div className="absolute -right-2 -top-2 w-4 h-4 rounded-full bg-[#FFF8F5] border-l border-stone-300/50" />
            </div>

            {/* Card Body Details */}
            <div className="flex flex-col p-4 flex-1 bg-white justify-between relative z-10">
              <div>
                {/* Upper Meta Row: Budget Tier (Left) & Star Rating (Right) */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[9px] font-mono font-extrabold text-stone-700 bg-stone-100/90 px-2.5 py-1 rounded-full border border-stone-200/80 uppercase tracking-wider whitespace-nowrap shrink-0 group-hover:bg-stone-200/80 transition-colors">
                    {budgetStr}
                  </span>

                  {/* Rating Badge */}
                  <div className="flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 whitespace-nowrap shrink-0 group-hover:bg-amber-500/15 transition-colors">
                    <span className="text-amber-500 text-xs">★</span>
                    <span className="text-[10px] font-black text-amber-950 font-mono">
                      {dest.rating.toFixed(1)}
                    </span>
                    <span className="text-[8px] font-bold text-amber-900/60 ml-0.5">({dest.reviews >= 1000 ? `${(dest.reviews / 1000).toFixed(1)}k` : dest.reviews})</span>
                  </div>
                </div>

                {/* Destination Title with Country Name on the Side */}
                <div className="flex items-center gap-2 truncate mb-0.5">
                  <h3 className="font-serif font-extrabold text-[#1C1B1B] text-xl tracking-tight leading-tight group-hover:text-[#FF5B1D] transition-colors truncate">
                    {dest.name}
                  </h3>
                  <span className="text-[9px] font-mono font-black text-[#FF5B1D] bg-[#FF5B1D]/10 border border-[#FF5B1D]/20 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 group-hover:bg-[#FF5B1D] group-hover:text-white group-hover:border-[#FF5B1D] transition-all">
                    {dest.country}
                  </span>
                </div>
                
                {/* Weather & Tagline Row */}
                <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500 font-medium">
                  {dest.weather && (
                    <span className="font-mono font-bold text-stone-700 shrink-0">
                      {dest.weather.split('•')[0]}
                    </span>
                  )}
                  {dest.weather && <span className="text-stone-300">•</span>}
                  <span className="truncate italic group-hover:text-stone-700 transition-colors">{dest.tagline}</span>
                </div>
              </div>

              {/* Compact AI Prompt Preview Box */}
              {dest.prompt && (
                <div className="mt-2.5 mb-2.5 rounded-xl p-2.5 bg-stone-50/80 border border-stone-200/80 flex flex-col gap-1 shadow-2xs group-hover:border-[#FF5B1D]/35 group-hover:bg-[#FF5B1D]/[0.04] transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#FF5B1D] text-white flex items-center justify-center text-[8px] font-black shadow-xs">✨</span>
                      <span className="text-[8px] font-mono font-black text-[#FF5B1D] uppercase tracking-wider">AI PREVIEW</span>
                    </div>
                  </div>
                  <p className="text-[10px] font-semibold text-stone-700 leading-snug line-clamp-2">
                    "{dest.prompt}"
                  </p>
                </div>
              )}

              {/* Primary Crazy Jet Takeoff CTA Button */}
              <div className="mt-auto pt-0.5">
                <button
                  type="button"
                  className="relative w-full overflow-hidden flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-[#1C1B1B] text-white border border-stone-800 group-hover:border-[#FF5B1D] font-extrabold text-[10px] cursor-pointer tracking-wider uppercase font-mono transition-all duration-300 group-hover:shadow-[0_8px_30px_rgba(255,91,29,0.45)]"
                >
                  {/* Liquid Orange Jet Fuel Morph Layer */}
                  <span className="absolute inset-0 bg-gradient-to-r from-[#FF5B1D] via-[#FE7717] to-[#FF5B1D] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0" />

                  {/* Button Text */}
                  <span className="relative z-10 flex items-center justify-center gap-2 group-hover:tracking-widest transition-all duration-300">
                    <span>Plan Trip to {dest.name.split(',')[0]}</span>
                  </span>

                  {/* Vector SVG Jet Flight Loop Animation */}
                  <div className="relative z-10 w-4 h-4 overflow-hidden flex items-center justify-center shrink-0">
                    <span className="inline-block transform rotate-45 group-hover:translate-x-6 group-hover:-translate-y-6 transition-all duration-300 ease-in text-white">
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                      </svg>
                    </span>
                    <span className="absolute inline-block transform rotate-45 -translate-x-6 translate-y-6 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300 ease-out text-white delay-75">
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                      </svg>
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BACK FACE */}
        <div 
          className="absolute inset-0 rounded-2xl bg-stone-900 border border-stone-800 shadow-2xl flex flex-col items-center justify-center overflow-hidden pointer-events-none"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,107,44,0.15),transparent_70%)]" />
          <svg className="w-10 h-10 text-[#FF6B2C] animate-spin mb-4 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          <h4 className="text-white font-serif font-bold text-xl mb-1 relative z-10">Plotting course...</h4>
          <p className="text-stone-400 text-xs relative z-10">Generating {dest.name.split(',')[0]} itinerary</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function TrendingCard({ dest, onClick, isHighlighted }) {
  const minBudget = dest.budget.includes('economy') ? 'Economy' : dest.budget.includes('standard') ? 'Standard' : 'Premium';
  const budgetStr = minBudget === 'Economy' ? '$ Economy' : minBudget === 'Standard' ? '$$ Standard' : '$$$ Premium';

  const [isZooming, setIsZooming] = useState(false);

  const handleClick = () => {
    setIsZooming(true);
    setTimeout(() => {
      onClick(dest);
    }, 800);
  };

  return (
    <motion.div 
      className="relative shrink-0 w-64 h-full"
      style={{ perspective: 1200 }}
      initial={{ opacity: 0, rotateX: -40, y: 40 }}
      whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, type: "spring", bounce: 0.4 }}
    >
      <motion.div
        className="w-full h-full relative"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isZooming ? 180 : 0 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
      >
        {/* FRONT FACE */}
        <div className="w-full h-full" style={{ backfaceVisibility: 'hidden' }}>
          <div
            id={`dest-card-${dest.id}`}
            onClick={handleClick}
            className={`group cursor-pointer rounded-2xl overflow-hidden border ${isHighlighted ? 'border-[#FF6B2C]' : 'border-stone-200/50'} shadow-sm hover:border-[#FF6B2C]/30 hover:shadow-[0_20px_50px_rgba(255,107,44,0.2)] bg-white flex flex-col relative h-full transition-all duration-300 ease-out z-10 hover:-translate-y-1.5`}
            style={{ 
              boxShadow: isHighlighted ? '0 0 0 2px #FF6B2C, 0 0 30px rgba(255,107,44,0.4)' : undefined
            }}
          >
            <div className="relative h-44 overflow-hidden group-hover:scale-[1.02] transition-transform duration-500 ease-out" style={{ backgroundColor: dest.bgColor }}>
          <motion.svg 
            className="absolute top-0 left-0 w-full h-8 z-10 pointer-events-none" 
            viewBox="0 0 100 10" preserveAspectRatio="none"
          >
            <motion.path 
              d="M 0 5 Q 50 -2 100 5" 
              fill="transparent" 
              stroke="white" 
              strokeWidth="0.5" 
              strokeDasharray="2 2"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: [0, 0.8, 0] }}
              transition={{ duration: 1.2, ease: "easeOut", times: [0, 0.3, 1] }}
              viewport={{ once: false, margin: "-50px" }}
            />
          </motion.svg>
        {dest.imageUrl && (
          <img src={dest.imageUrl} alt={dest.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        )}
        <div className={`absolute inset-0 bg-linear-to-t ${dest.gradient}`} />
        <div className="absolute bottom-0 left-0 right-0 p-4 pt-8 bg-linear-to-t from-black/80 via-black/30 to-transparent">
          <p className="text-white font-serif font-bold text-2xl drop-shadow-lg group-hover:text-[#FF6B2C] transition-colors">{dest.name}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-white/90 text-xs font-bold tracking-wide uppercase">{dest.country}</p>
            <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-md border border-white/20 shadow-sm">
              From {budgetStr}
            </span>
          </div>
        </div>
        <div className="absolute top-2.5 right-2.5 z-10 flex flex-col items-end gap-1 transition-transform duration-500 ease-out group-hover:scale-105 group-hover:-translate-y-1 origin-top">
          <span
            className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white backdrop-blur-sm shadow-xs"
            style={{ 
              backgroundColor: dest.badgeColor + 'dd',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 4px rgba(0,0,0,0.15)'
            }}
          >
            {dest.badge.split(' ').slice(1).join(' ')}
          </span>
          {dest.weather && (
            <span className="text-[8px] font-semibold bg-black/60 text-white px-1.5 py-0.5 rounded-full backdrop-blur-md border border-white/10">
              {dest.weather.split('•')[0]}
            </span>
          )}
        </div>
        {dest.crowdLevel && (
          <div className="absolute top-2.5 left-2.5 z-10 transition-transform duration-500 ease-out group-hover:scale-105 group-hover:-translate-y-1 origin-top">
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-md border ${
              dest.crowdLevel.includes('Low') 
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' 
                : dest.crowdLevel.includes('Moderate') 
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/40' 
                : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
            }`}>
              {dest.crowdLevel}
            </span>
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-2 flex-1 justify-between">
        <div>
          <div className="flex items-center justify-between">
            <Stars rating={dest.rating} />
            <span className="text-[10px] text-stone-400">{dest.reviews.toLocaleString()} trips</span>
          </div>
          {dest.aiTip && (
            <p className="text-[10px] text-stone-500 italic mt-1 truncate">
              {dest.aiTip.replace('💡 AI Verdict: ', '')}
            </p>
          )}
        </div>
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-stone-100/50 border border-transparent hover:bg-stone-200/50 text-stone-600 group-hover:bg-[#FF6B2C] group-hover:text-white font-bold text-xs transition-all duration-300 group-hover:shadow-[0_8px_20px_rgba(255,107,44,0.25)] mt-auto"
        >
          <span className="uppercase tracking-wider text-[10px]">Plan trip</span>
          <span className="group-hover:translate-x-1 transition-transform duration-200">
            <ArrowRightIcon />
          </span>
        </button>
      </div>
      </div>
      </div>

        {/* BACK FACE */}
        <div 
          className="absolute inset-0 rounded-2xl bg-stone-900 border border-stone-800 shadow-2xl flex flex-col items-center justify-center overflow-hidden pointer-events-none"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,107,44,0.15),transparent_70%)]" />
          <svg className="w-10 h-10 text-[#FF6B2C] animate-spin mb-4 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          <h4 className="text-white font-serif font-bold text-xl mb-1 relative z-10">Plotting course...</h4>
          <p className="text-stone-400 text-xs relative z-10">Generating {dest.name.split(',')[0]} itinerary</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

const HERO_IMAGES = [
  { 
    url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600&auto=format&fit=crop&q=80', 
    name: 'Kyoto', country: 'Japan', destId: 'kyoto-1', 
    tip: '💡 AI Tip: Peak cherry blossom season starts in two weeks.',
    tickers: ['🌸 Cherry blossoms peaking now', '🔥 1,245 trips planned this month']
  },
  { 
    url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&auto=format&fit=crop&q=80', 
    name: 'Paris', country: 'France', destId: 'paris-1', 
    tip: '💡 AI Tip: Ideal for urban nightlife & cultural discovery.',
    tickers: ['✨ #1 trending for August', '☀️ Perfect 24°C patio weather']
  },
  {
    url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1600&auto=format&fit=crop&q=80', 
    name: 'Rome', country: 'Italy', destId: 'rome-1', 
    tip: '💡 AI Tip: Perfect 3-day historic itinerary available.',
    tickers: ['🏛️ Avoid crowds: Book Colosseum early', '🍝 34 Michelin starred restaurants']
  },
  { 
    url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600&auto=format&fit=crop&q=80', 
    name: 'Bali', country: 'Indonesia', destId: 'bali-1', 
    tip: '💡 AI Tip: Best value destination for digital nomads right now.',
    tickers: ['🏄‍♂️ Peak surf season in Uluwatu', '📉 Flights down 12% this week']
  }
];

const FloatingEmbers = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[#FAF8F5]">
      {/* Dynamic Background Embers */}
      {Array.from({ length: 15 }).map((_, i) => {
        const size = Math.random() * 80 + 20;
        const startX = Math.random() * 100;
        const duration = Math.random() * 15 + 10;
        const delay = Math.random() * 10;
        const blur = Math.random() * 20 + 10;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              left: `${startX}%`,
              bottom: -150,
              background: `radial-gradient(circle, rgba(255,107,44,0.15) 0%, rgba(255,107,44,0) 70%)`,
              filter: `blur(${blur}px)`,
            }}
            animate={{
              y: [0, -window.innerHeight - 300],
              x: [0, (Math.random() - 0.5) * 200],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: duration,
              repeat: Infinity,
              delay: delay,
              ease: "linear"
            }}
          />
        );
      })}
    </div>
  );
};

export default function DestinationsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVibes, setActiveVibes] = useState([]);
  const [activeBudgets, setActiveBudgets] = useState([]);
  const [activeRegions, setActiveRegions] = useState([]);
  const [sortOption, setSortOption] = useState('Most Popular');
  const [visibleCount, setVisibleCount] = useState(8);
  const [highlightedDestId, setHighlightedDestId] = useState(null);
  const [viewMode, setViewMode] = useState('bento');
  const [hoverMode, setHoverMode] = useState(null);
  const [bgIndex, setBgIndex] = useState(0);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isScrolledPastHero, setIsScrolledPastHero] = useState(false);
  const resultsRef = useRef(null);

  const scrollToResults = () => {
    if (resultsRef.current) {
      if (resultsRef.current.getBoundingClientRect().top > 150) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const heroHeight = window.innerWidth >= 768 ? 650 : 550;
          setIsScrolledPastHero(window.scrollY >= heroHeight - 10);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    const bgInterval = setInterval(() => {
      setBgIndex((prev) => {
        setTickerIndex(0);
        return (prev + 1) % HERO_IMAGES.length;
      });
    }, 8000);
    
    const tickerInterval = setInterval(() => {
      setTickerIndex((prev) => prev === 0 ? 1 : 0);
    }, 4000);

    return () => {
      clearInterval(bgInterval);
      clearInterval(tickerInterval);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);


  const toggleFilter = (id, setter) => {
    setter(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    setVisibleCount(8); // reset pagination on filter
    scrollToResults();
  };

  const clearAll = () => {
    setActiveVibes([]); setActiveBudgets([]); setActiveRegions([]); setSearchQuery('');
    setSortOption('Most Popular');
    setVisibleCount(8);
    scrollToResults();
  };

  const removeFilter = (id, category) => {
    if (category === 'vibe') setActiveVibes(prev => prev.filter(x => x !== id));
    if (category === 'budget') setActiveBudgets(prev => prev.filter(x => x !== id));
    if (category === 'region') setActiveRegions(prev => prev.filter(x => x !== id));
    setVisibleCount(8);
    scrollToResults();
  };

  const hasFilters = activeVibes.length > 0 || activeBudgets.length > 0 || activeRegions.length > 0 || searchQuery.trim();

  const filteredDests = useMemo(() => {
    let list = DESTINATIONS;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.country.toLowerCase().includes(q) ||
        d.tagline.toLowerCase().includes(q) ||
        d.vibes.some(v => v.includes(q))
      );
    }
    if (activeVibes.length > 0) {
      list = list.filter(d => activeVibes.some(v => d.vibes.includes(v)));
    }
    if (activeBudgets.length > 0) {
      list = list.filter(d => activeBudgets.some(b => d.budget.includes(b)));
    }
    if (activeRegions.length > 0) {
      list = list.filter(d => activeRegions.includes(d.region));
    }
    
    // Sort logic
    list = [...list].sort((a, b) => {
      if (sortOption === 'Highest Rated') return b.rating - a.rating;
      if (sortOption === 'Most Affordable') {
        const costA = a.budget.includes('economy') ? 1 : a.budget.includes('standard') ? 2 : 3;
        const costB = b.budget.includes('economy') ? 1 : b.budget.includes('standard') ? 2 : 3;
        return costA - costB;
      }
      if (sortOption === 'Newest') return a.name.localeCompare(b.name); // Using name as fallback for 'newest' since there's no date
      // Default: Most Popular
      return b.reviews - a.reviews;
    });

    // If no filters are active, exclude trending destinations from the main grid to avoid duplicates
    if (!hasFilters) {
      list = list.filter(d => !TRENDING_IDS.includes(d.id));
    }
    return list;
  }, [searchQuery, activeVibes, activeBudgets, activeRegions, sortOption, hasFilters]);

  const trendingDests = DESTINATIONS.filter(d => TRENDING_IDS.includes(d.id));

  // Get labels for active chips
  const activeChips = [
    ...activeVibes.map(v => ({ id: v, label: VIBE_FILTERS.find(f => f.id === v)?.label, type: 'vibe' })),
    ...activeBudgets.map(b => ({ id: b, label: BUDGET_FILTERS.find(f => f.id === b)?.label, type: 'budget' })),
    ...activeRegions.map(r => ({ id: r, label: REGION_FILTERS.find(f => f.id === r)?.label, type: 'region' }))
  ];

  const handleUseTemplate = (dest) => {
    router.push(`/ai-planner?prompt=${encodeURIComponent(dest.prompt)}`);
  };

  const handleGlobePinClick = (id) => {
    const el = document.getElementById(`dest-card-${id}`);
    if (el) {
      // Add slight offset for the sticky header
      const y = el.getBoundingClientRect().top + window.scrollY - 180;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setHighlightedDestId(id);
      setTimeout(() => setHighlightedDestId(null), 1200);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1F1F1F]">
      {/* Solid background mask to hide scrolling content behind the floating nav pill and the filter deck gap */}
      <div 
        className={`fixed top-0 left-0 right-0 h-24 bg-[#FAF8F5] z-49 transition-opacity duration-500 pointer-events-none ${
          isScrolledPastHero ? 'opacity-100' : 'opacity-0'
        }`} 
      />
      <Header />

      {/* Hero */}
      <section className="relative w-full h-137.5 md:h-162.5 bg-[#111] overflow-hidden flex items-center pt-17">
        {/* Background Images Cross-Fade */}
        <AnimatePresence>
          <motion.img
            key={bgIndex}
            src={HERO_IMAGES[bgIndex].url}
            alt="Hero Background"
            className="absolute inset-0 w-full h-full object-cover origin-center will-change-transform"
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: 1, scale: 1.15 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 1.5 },
              scale: { duration: 10, ease: "linear" }
            }}
          />
        </AnimatePresence>
        
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/50 to-transparent" />
        
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 md:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column: Text & Search */}
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="text-[10px] font-bold text-[#FF6B2C] uppercase tracking-[0.2em]">ISSUE — JULY 2026 • AI ATLAS</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.08] text-white mb-6">
              Find your next <br />
              <span className="text-[#FF6B2C]">adventure</span>
            </h1>
            
            {/* Live Data Ticker */}
            <div className="flex items-center overflow-hidden mb-8 w-full max-w-md border-l-2 border-[#FF6B2C] pl-4 h-6">
              <AnimatePresence mode="wait">
                <motion.p
                  key={`${bgIndex}-${tickerIndex}`}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-white/80 text-sm font-medium tracking-wide whitespace-nowrap"
                >
                  {HERO_IMAGES[bgIndex].tickers[tickerIndex % HERO_IMAGES[bgIndex].tickers.length]}
                </motion.p>
              </AnimatePresence>
            </div>
            
            <div className="relative max-w-xl">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none z-10">
                <SearchIcon />
              </div>
              <input
                id="destinations-search"
                type="text"
                value={searchQuery}
                onFocus={() => setShowSearchDropdown(true)}
                onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search destinations, cities, or vibes..."
                className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl text-white text-sm placeholder:text-white/50 focus:outline-none focus:border-[#FF6B2C]/60 focus:bg-white/20 transition-all duration-200"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors text-lg leading-none z-10">×</button>
              )}
              
              {/* Autocomplete Dropdown */}
              <AnimatePresence>
                {showSearchDropdown && searchQuery.trim() && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden z-50 max-h-75 overflow-y-auto"
                  >
                    {filteredDests.length > 0 ? (
                      filteredDests.slice(0, 5).map(dest => (
                        <div 
                          key={dest.id}
                          onClick={() => {
                            setSearchQuery(dest.name);
                            setShowSearchDropdown(false);
                            handleGlobePinClick(dest.id);
                          }}
                          className="flex items-center gap-3 p-3 hover:bg-stone-50 cursor-pointer transition-colors border-b border-stone-100 last:border-0"
                        >
                          <img src={dest.imageUrl} alt={dest.name} className="w-10 h-10 rounded-lg object-cover" />
                          <div>
                            <h4 className="text-sm font-bold text-[#1F1F1F]">{dest.name}, {dest.country}</h4>
                            <p className="text-xs text-stone-500 truncate">{dest.tagline}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-sm text-stone-500 text-center">No destinations found.</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {/* Right Column: Featured Destination Mini-Card */}
          <div className="hidden lg:block relative justify-self-end w-full max-w-[320px]">
            <motion.div
              key={bgIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.8 }}
              onClick={() => handleGlobePinClick(HERO_IMAGES[bgIndex].destId)}
              className="group cursor-pointer relative w-full h-100 rounded-3xl overflow-hidden bg-stone-900 shadow-[0_16px_48px_rgba(0,0,0,0.5)] border border-white/20 flex flex-col justify-between p-5"
            >
              <img src={HERO_IMAGES[bgIndex].url} alt="Featured" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
              <div className="absolute inset-0 bg-linear-to-t from-stone-950 via-stone-900/40 to-black/20" />
              
              <div className="relative z-10 self-start bg-[#FF6B2C] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                Featured Cover
              </div>
              
              <div className="relative z-10 mt-auto">
                <p className="text-white/80 text-[11px] font-semibold uppercase tracking-widest">{HERO_IMAGES[bgIndex].country}</p>
                <h3 className="text-3xl font-extrabold text-white group-hover:text-[#FF6B2C] transition-colors">{HERO_IMAGES[bgIndex].name}</h3>
                <div className="mt-3 bg-black/60 backdrop-blur-md border border-white/15 rounded-xl p-3 text-xs text-white/90 italic leading-relaxed">
                  {HERO_IMAGES[bgIndex].tip}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Filter Bar - Floating Control Deck */}
      {viewMode === 'bento' && (
        <div className="sticky top-24 z-40">
          <OrigamiFilterBar>
            <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 -mt-8 mb-8">
              {/* Solid sharp-cornered mask to hide scrolling content that peeks through the rounded corners */}
              <div className={`absolute top-0 bottom-0 left-4 right-4 sm:left-6 sm:right-6 bg-[#FAF8F5] -z-10 transition-opacity duration-500 ${isScrolledPastHero ? 'opacity-100' : 'opacity-0'}`} />
              <div 
                className="bg-white/90 backdrop-blur-md rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-[#ECE8E2]/80 flex flex-col transition-shadow hover:shadow-[0_16px_50px_rgba(0,0,0,0.12)]"
              >
              <div className="px-5 pt-4 pb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                <div className="flex flex-wrap items-center gap-y-3 gap-x-2 min-w-max md:min-w-0">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest shrink-0 mr-1">Vibe</span>
                  {VIBE_FILTERS.map(f => (
                    <FilterPill key={f.id} label={f.label} icon={f.icon} active={activeVibes.includes(f.id)} onClick={() => toggleFilter(f.id, setActiveVibes)} />
                  ))}
                <div className="hidden md:block h-6 w-px bg-stone-200 mx-2 shrink-0" />
                
                <div className="w-full md:hidden" /> {/* Force wrap on mobile */}
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest shrink-0 mr-1">Budget</span>
                {BUDGET_FILTERS.map(f => (
                  <FilterPill key={f.id} label={f.label} active={activeBudgets.includes(f.id)} onClick={() => toggleFilter(f.id, setActiveBudgets)} />
                ))}
                <div className="hidden md:block h-6 w-px bg-stone-200 mx-2 shrink-0" />
                
                <div className="w-full md:hidden" /> {/* Force wrap on mobile */}
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest shrink-0 mr-1">Region</span>
                {REGION_FILTERS.map(f => (
                  <FilterPill key={f.id} label={f.label} active={activeRegions.includes(f.id)} onClick={() => toggleFilter(f.id, setActiveRegions)} />
                ))}
                {hasFilters && (
                  <>
                    <div className="h-6 w-px bg-stone-200 mx-2 shrink-0" />
                    <button 
                      type="button" 
                      onClick={clearAll} 
                      className="text-[11px] font-mono font-bold text-stone-400 hover:text-[#FF5B1D] hover:bg-[#FF5B1D]/10 px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Clear all ×
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Active Chips & Sort Row */}
            <div className="px-5 py-3 flex items-center justify-between border-t border-stone-100 bg-[#FAF8F5]/50 rounded-b-2xl">
              <div className="flex items-center gap-2 overflow-x-auto flex-1 pr-4" style={{ scrollbarWidth: 'none' }}>
                {hasFilters ? (
                  <span className="text-[11px] font-bold text-[#FF5B1D] shrink-0">{filteredDests.length} destinations match</span>
                ) : (
                  <span className="text-[11px] font-bold text-stone-400 shrink-0">Filter your perfect trip</span>
                )}
                {activeChips.length > 0 && <div className="h-3 w-px bg-stone-300 mx-1 shrink-0" />}
                {activeChips.map(chip => (
                  <button
                    key={chip.id}
                    onClick={() => removeFilter(chip.id, chip.type)}
                    className="flex items-center gap-1.5 bg-[#FF5B1D]/10 border border-[#FF5B1D]/25 text-[#FF5B1D] px-2.5 py-1 rounded-full text-[10px] font-bold hover:bg-[#FF5B1D] hover:text-white hover:border-[#FF5B1D] hover:shadow-[0_4px_12px_rgba(255,91,29,0.25)] hover:-translate-y-0.5 transition-all duration-200 shrink-0 group cursor-pointer"
                  >
                    {chip.label} <span className="text-[#FF5B1D]/60 text-xs leading-none font-normal group-hover:text-white transition-colors">×</span>
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest hidden sm:inline">Sort</span>
                <div className="relative group">
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="appearance-none bg-white border border-stone-200 text-stone-700 text-xs font-bold py-1.5 pl-3 pr-8 rounded-full shadow-2xs hover:border-[#FF5B1D]/60 hover:text-[#FF5B1D] hover:bg-[#FF5B1D]/[0.03] hover:shadow-[0_4px_14px_rgba(255,91,29,0.15)] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#FF5B1D]/20 transition-all duration-200 cursor-pointer"
                  >
                    <option>Most Popular</option>
                    <option>Highest Rated</option>
                    <option>Most Affordable</option>
                    <option>Newest</option>
                  </select>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400 group-hover:text-stone-600 transition-colors">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </section>
        </OrigamiFilterBar>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-12">
        {/* View Mode Toggle & Command Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 hover:relative hover:z-50">
          <div className="relative flex items-center bg-stone-200/50 p-1 rounded-full border border-stone-200/80 shadow-inner hover:z-50">
            {['bento', 'atlas'].map((mode) => (
              <div
                key={mode}
                role="button"
                tabIndex={0}
                onMouseEnter={() => setHoverMode(mode)}
                onMouseLeave={() => setHoverMode(null)}
                onClick={() => setViewMode(mode)}
                className={`relative z-10 cursor-pointer flex items-center gap-2 px-5 py-2 rounded-full text-[11px] font-bold transition-colors ${
                  viewMode === mode ? 'text-white font-bold' : 'text-stone-500 hover:text-[#fe7717]'
                }`}
                title={mode === 'bento' ? 'Magazine Bento & Grid' : 'AI Atlas & Radar Mode'}
              >
                {viewMode === mode && (
                  <motion.div
                    layoutId="view-toggle"
                    className="absolute inset-0 bg-[#fe7717] rounded-full shadow-xs border border-stone-200/50"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10">{mode === 'bento' ? '▦' : '◉'}</span>
                <span className="relative z-10 uppercase tracking-widest">{mode === 'bento' ? 'Magazine View' : 'Radar View'}</span>
                
                {/* Hover Preview Thumbnail */}
                <AnimatePresence>
                  {hoverMode === mode && viewMode !== mode && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-stone-900 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-stone-200/20 overflow-hidden pointer-events-none z-50"
                      style={{ width: 320, height: mode === 'bento' ? 240 : 200 }}
                    >
                      {mode === 'bento' ? (
                        <div style={{ width: 1024, height: 768, transform: 'scale(0.3125)', transformOrigin: 'top left' }} className="absolute top-0 left-0 bg-white pt-8 px-6">
                          <BentoShowcase destinations={trendingDests} onCardClick={() => {}} />
                        </div>
                      ) : (
                        <div style={{ width: 1024, height: 640, transform: 'scale(0.3125)', transformOrigin: 'top left' }} className="absolute top-0 left-0 bg-[#0a0a0a] p-8">
                          <AtlasRadarMap destinations={filteredDests} onCardClick={() => {}} />
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-500 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="transition-all duration-300">{viewMode === 'bento' ? 'Editorial High-Contrast Showcase' : 'Dark-Mode Telemetry Feed'}</span>
          </div>
        </div>

        <div ref={resultsRef} className="scroll-mt-48">
          <AnimatePresence mode="wait">
          {viewMode === 'atlas' ? (
            <motion.section 
              key="atlas"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="pt-2"
            >
              <AtlasRadarMap destinations={filteredDests} onCardClick={handleUseTemplate} />
            </motion.section>
          ) : (
            <motion.div 
              key="bento"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-12"
            >
              {/* Bento Showcase for Trending */}
              {!hasFilters && (
                <section>
                  <hr className="border-stone-300 mb-6" />
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-sm font-bold text-[#FF6B2C] uppercase tracking-[0.2em] flex items-center gap-2">
                        <span>FEATURED — ISSUE 47</span>
                        <span className="text-[10px] font-mono font-bold bg-[#FF6B2C]/15 text-[#FF6B2C] px-2 py-0.5 rounded-full border border-[#FF6B2C]/30">Trending This Month</span>
                      </h2>
                      <p className="text-xl font-extrabold text-[#1F1F1F] mt-1 tracking-tight">Top-selected AI destinations</p>
                    </div>
                    <a href="#all-destinations" className="text-xs font-bold text-[#FF6B2C] hover:underline">Browse all below ↓</a>
                  </div>
                  <BentoShowcase destinations={DESTINATIONS} onCardClick={handleUseTemplate} />
                </section>
              )}

              {/* All destinations grid */}
              <section id="all-destinations" className="pt-4">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-xl font-extrabold text-[#1F1F1F] tracking-tight">
                      {hasFilters
                        ? `${filteredDests.length} destination${filteredDests.length !== 1 ? 's' : ''} found`
                        : "✈️ Editor's Picks"}
                    </h2>
                    {!hasFilters && <p className="text-sm text-stone-500 mt-0.5">Curated itinerary templates, ready to customize</p>}
                  </div>
                </div>

                {filteredDests.length === 0 ? (
                  <div className="text-center py-24 px-4 bg-white border border-dashed border-stone-200 rounded-3xl shadow-sm max-w-2xl mx-auto">
                    <span className="text-5xl block mb-4">🏜️</span>
                    <h3 className="text-xl font-bold text-[#1F1F1F] mb-2">Can't find your match?</h3>
                    <p className="text-sm text-stone-500 mb-6 max-w-md mx-auto">Let our AI build something custom. Describe your dream destination, vibe, and budget, and we'll craft the perfect itinerary.</p>
                    <a href="/ai-planner" className="inline-block px-6 py-3 bg-[#FF6B2C] text-white font-bold text-sm rounded-full hover:bg-[#E55A20] transition-colors shadow-md hover:shadow-[0_6px_20px_rgba(255,107,44,0.3)] hover:scale-105 active:scale-95">
                      Go to AI Planner ✨
                    </a>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pt-2">
                      <AnimatePresence mode="popLayout">
                        {filteredDests.slice(0, visibleCount).map(dest => (
                          <motion.div
                            key={dest.id}
                            layout
                            initial={{ opacity: 0, rotateX: -90, scale: 0.8 }}
                            animate={{ opacity: 1, rotateX: 0, scale: 1 }}
                            exit={{ opacity: 0, rotateX: 90, scale: 0.8 }}
                            transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
                          >
                            <DestCard dest={dest} onClick={handleUseTemplate} isHighlighted={highlightedDestId === dest.id} />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                    
                    {visibleCount < filteredDests.length && (
                      <div className="pt-10 flex justify-center">
                        <button
                          onClick={() => setVisibleCount(prev => prev + 8)}
                          className="px-6 py-2.5 bg-white border border-stone-200 text-stone-700 font-bold text-sm rounded-full shadow-sm hover:border-stone-300 hover:bg-stone-50 transition-all hover:-translate-y-0.5 active:scale-95"
                        >
                          Load More Destinations ↓
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        {/* Bottom Custom AI Planning Console */}
        <CustomAIPlanConsole />
      </div>

      <div className="h-16" />
    </div>
  );
}
