'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import OrigamiFilterBar from '../components/OrigamiFilterBar';
import BentoShowcase from '../components/BentoShowcase';
import AtlasRadarMap from '../components/AtlasRadarMap';
import { DESTINATIONS } from '../../lib/destinations';
import {
  ForkKnife,
  Bank,
  Tree,
  Martini,
  Palette,
  ShoppingBag,
  MagnifyingGlass,
  Star,
  ArrowRight,
  Globe,
  Sparkle,
  AirplaneTilt,
  MapPin,
  FlowerLotus,
  Snowflake,
  Wine,
  Faders
} from '@phosphor-icons/react';

// ─── Icon Components (match PlannerSidebar exactly) ────────────────────────
const FoodieIcon = () => <ForkKnife className="w-3.5 h-3.5" weight="duotone" />;
const HistoryIcon = () => <Bank className="w-3.5 h-3.5" weight="duotone" />;
const NatureIcon = () => <Tree className="w-3.5 h-3.5" weight="duotone" />;
const NightlifeIcon = () => <Martini className="w-3.5 h-3.5" weight="duotone" />;
const ArtIcon = () => <Palette className="w-3.5 h-3.5" weight="duotone" />;
const ShoppingIcon = () => <ShoppingBag className="w-3.5 h-3.5" weight="duotone" />;
const SearchIcon = () => <MagnifyingGlass className="w-5 h-5" weight="bold" />;
const StarIcon = ({ filled }) => <Star className="w-3.5 h-3.5 text-[#FF6B2C]" weight={filled ? "fill" : "bold"} />;
const ArrowRightIcon = () => <ArrowRight className="w-3.5 h-3.5" weight="bold" />;
const GlobeIcon = () => <Globe className="w-3.5 h-3.5" weight="duotone" />;

const renderHighlightedText = (text, highlight) => {
  if (!highlight || !highlight.trim() || !text) return <>{text}</>;
  const safeHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${safeHighlight})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="text-[#FF6B2C] font-black bg-[#FF6B2C]/10 rounded-[3px] px-[2px]">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

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
    { label: 'Amalfi Coast', icon: <MapPin weight="duotone" className="w-3.5 h-3.5 text-emerald-500" />, prompt: '7 Days in Amalfi Coast with sunset boat tour, lemon grove walks & luxury pasta masterclasses' },
    { label: 'Spring in Kyoto', icon: <FlowerLotus weight="duotone" className="w-3.5 h-3.5 text-pink-400" />, prompt: '5 Days in Kyoto during Cherry Blossom season with tea ceremonies & bamboo forest' },
    { label: 'Iceland Lights', icon: <Snowflake weight="duotone" className="w-3.5 h-3.5 text-sky-400" />, prompt: '6 Days in Iceland for Northern Lights, Blue Lagoon geothermal spa & glacier hikes' },
    { label: 'Tuscan Wine', icon: <Wine weight="duotone" className="w-3.5 h-3.5 text-red-500" />, prompt: '4 Days in Tuscany with wine tasting, truffle hunting & villa stay' },
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
    window.location.href = `/ai-planner/new?prompt=${encodeURIComponent(finalPrompt)}`;
  };

  return (
    <section className="rounded-3xl bg-[#141416] border border-stone-800 px-6 py-12 sm:p-12 shadow-2xl relative overflow-hidden">
      {/* Background Marquee of Trip Cards for Mobile */}
      <div 
        className="absolute inset-0 flex sm:hidden justify-center gap-4 opacity-[0.4] pointer-events-none overflow-hidden select-none px-4 blur-[1px]"
        style={{ 
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
          maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)' 
        }}
      >
        {/* Left Column: Top to Bottom (Down) */}
        <div className="flex animate-marquee-down gap-4 pb-4 w-1/2 max-w-[140px]" style={{ animationDuration: '45s' }}>
          {[...DESTINATIONS, ...DESTINATIONS].map((dest, i) => (
            <div key={`bg-card-mob-1-${i}`} className="w-full h-40 bg-[#1A1A1A] rounded-2xl overflow-hidden border border-white/10 shrink-0 shadow-2xl flex flex-col">
              <div className="h-24 bg-stone-900 relative">
                <Image src={dest.imageUrl} alt="" fill className="object-cover opacity-80" sizes="(max-width: 768px) 100vw, 50vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent" />
              </div>
              <div className="p-3 flex-1 flex flex-col justify-end bg-[#1A1A1A]">
                <div className="text-white font-serif font-bold mb-0.5 truncate text-sm tracking-wide">{dest.name}</div>
                <div className="text-[#FF5B1D] text-[8px] font-mono tracking-widest uppercase font-semibold">{dest.country}</div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Right Column: Bottom to Top (Up) */}
        <div className="flex animate-marquee-up gap-4 pb-4 w-1/2 max-w-[140px] mt-16" style={{ animationDuration: '65s' }}>
          {[...DESTINATIONS].reverse().concat([...DESTINATIONS].reverse()).map((dest, i) => (
            <div key={`bg-card-mob-2-${i}`} className="w-full h-40 bg-[#1A1A1A] rounded-2xl overflow-hidden border border-white/10 shrink-0 shadow-2xl flex flex-col">
              <div className="h-24 bg-stone-900 relative">
                <Image src={dest.imageUrl} alt="" fill className="object-cover opacity-80" sizes="(max-width: 768px) 100vw, 50vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent" />
              </div>
              <div className="p-3 flex-1 flex flex-col justify-end bg-[#1A1A1A]">
                <div className="text-white font-serif font-bold mb-0.5 truncate text-sm tracking-wide">{dest.name}</div>
                <div className="text-[#FF5B1D] text-[8px] font-mono tracking-widest uppercase font-semibold">{dest.country}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Background Marquee of Trip Cards for Desktop */}
      <div 
        className="absolute -inset-12 hidden sm:flex flex-col justify-center gap-8 opacity-[0.4] pointer-events-none overflow-hidden select-none -rotate-2 scale-[1.02] blur-[1px]"
        style={{ 
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
          maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' 
        }}
      >
        {/* Top Row: Left to Right */}
        <div className="flex animate-marquee-right gap-6 pr-6" style={{ animationDuration: '65s' }}>
          {[...DESTINATIONS, ...DESTINATIONS].map((dest, i) => (
            <div key={`bg-card-1-${i}`} className="w-48 h-56 bg-[#1A1A1A] rounded-3xl overflow-hidden border border-white/10 shrink-0 shadow-2xl flex flex-col">
              <div className="h-32 bg-stone-900 relative">
                <Image src={dest.imageUrl} alt="" fill className="object-cover opacity-80" sizes="(max-width: 768px) 100vw, 50vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent" />
              </div>
              <div className="p-4 flex-1 flex flex-col justify-end bg-[#1A1A1A]">
                <div className="text-white font-serif font-bold mb-0.5 truncate text-lg tracking-wide">{dest.name}</div>
                <div className="text-[#FF5B1D] text-[9px] font-mono tracking-widest uppercase font-semibold">{dest.country}</div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Bottom Row: Right to Left */}
        <div className="flex animate-marquee-left gap-6 pr-6 ml-16" style={{ animationDuration: '45s' }}>
          {[...DESTINATIONS].reverse().concat([...DESTINATIONS].reverse()).map((dest, i) => (
            <div key={`bg-card-2-${i}`} className="w-48 h-56 bg-[#1A1A1A] rounded-3xl overflow-hidden border border-white/10 shrink-0 shadow-2xl flex flex-col">
              <div className="h-32 bg-stone-900 relative">
                <Image src={dest.imageUrl} alt="" fill className="object-cover opacity-80" sizes="(max-width: 768px) 100vw, 50vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent" />
              </div>
              <div className="p-4 flex-1 flex flex-col justify-end bg-[#1A1A1A]">
                <div className="text-white font-serif font-bold mb-0.5 truncate text-lg tracking-wide">{dest.name}</div>
                <div className="text-[#FF5B1D] text-[9px] font-mono tracking-widest uppercase font-semibold">{dest.country}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Perforated Ticket Side Notches */}
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#FAF8F5] border-r border-stone-800 z-20 pointer-events-none" />
      <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#FAF8F5] border-l border-stone-800 z-20 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center">
        {/* Headline */}
        <h3 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight font-serif tracking-tight">
          Don&apos;t see your dream trip?
        </h3>
        
        <p className="text-stone-400 text-sm sm:text-base mt-2.5 max-w-2xl font-medium leading-relaxed">
          Describe any city, vibe, or budget in natural language and let TripWise AI craft your entire custom itinerary — stops, timings, budget, and flights included.
        </p>

        {/* Interactive Prompt Console Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mt-7 flex flex-col sm:flex-row items-center gap-3 bg-[#1C1B1B] border border-stone-700 p-2.5 rounded-2xl sm:rounded-full shadow-2xl transition-all hover:border-[#FF5B1D]/60 focus-within:border-[#FF5B1D] focus-within:ring-2 focus-within:ring-[#FF5B1D]/30">
          <div className="flex items-center gap-3 pl-4 py-2 sm:py-0 flex-1 w-full text-left">
            <span className="text-xl text-[#FF5B1D] animate-bounce"><Sparkle weight="fill" /></span>
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
            className="group relative overflow-hidden shrink-0 w-full sm:w-auto flex items-center justify-center gap-2.5 rounded-full text-white font-extrabold text-xs px-6 py-3.5 cursor-pointer tracking-wider uppercase font-mono transition-all duration-300 bg-[#FF5B1D] hover:bg-[#E04D15] shadow-lg border border-white/20"
          >
            <span className="relative z-10 flex items-center justify-center gap-2 group-hover:tracking-widest transition-all duration-300">
              <span>Generate Trip</span>
            </span>
            <div className="relative z-10 w-4 h-4 overflow-hidden flex items-center justify-center shrink-0">
              <span className="inline-block transform group-hover:translate-x-6 group-hover:-translate-y-6 transition-all duration-300 ease-in text-white">
                <AirplaneTilt weight="fill" className="w-4 h-4" />
              </span>
              <span className="absolute inline-block transform -translate-x-6 translate-y-6 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300 ease-out text-white delay-75">
                <AirplaneTilt weight="fill" className="w-4 h-4" />
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
              className="text-[11px] font-medium text-stone-300 bg-stone-900/90 hover:bg-[#FF5B1D] hover:text-white border border-stone-800 hover:border-[#FF5B1D] px-3.5 py-1.5 rounded-full transition-all duration-200 cursor-pointer shadow-xs hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(255,91,29,0.3)] flex items-center gap-1.5 group"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Live TripWise AI Telemetry Bar */}
        <div className="mt-6 pt-4 border-t border-stone-800/80 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[8px] sm:text-[9px] font-mono text-stone-500">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ENGINE: TRIPWISE V4.2
          </span>
          <span>•</span>
          <span>LATENCY: &lt;1.2s</span>
          <span>•</span>
          <span>FLIGHT MATRIX: ACTIVE</span>
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

function SortDropdown({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = ['Most Popular', 'Highest Rated', 'Most Affordable', 'Newest'];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all duration-200 ease-out cursor-pointer whitespace-nowrap select-none ${
          isOpen 
            ? 'bg-[#FF5B1D]/10 text-[#FF5B1D]' 
            : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900'
        }`}
      >
        <svg className={`w-3.5 h-3.5 ${isOpen ? 'text-[#FF5B1D]' : 'text-stone-400 group-hover:text-stone-600 transition-colors'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="6" x2="20" y2="6"></line>
          <line x1="4" y1="12" x2="14" y2="12"></line>
          <line x1="4" y1="18" x2="8" y2="18"></line>
        </svg>
        <span>{value}</span>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#FF5B1D]' : 'text-stone-400 group-hover:text-stone-600'
          }`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 z-50 w-44 rounded-xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.15)] border border-stone-200/80 overflow-hidden"
          >
            <div className="py-1.5">
              {options.map((opt) => {
                const isActive = value === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => {
                      onChange(opt);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-stone-50 transition-colors text-left text-xs font-semibold ${
                      isActive ? 'text-[#FF5B1D] bg-[#FF5B1D]/[0.02]' : 'text-stone-600'
                    }`}
                  >
                    <span>{opt}</span>
                    {isActive && (
                      <svg className="w-3.5 h-3.5 text-[#FF5B1D]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterDropdown({ label, options, activeOptions, onToggle, dropdownPosition = 'left' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeCount = activeOptions.length;

  return (
    <div className="relative flex-1 sm:flex-none inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-sm font-semibold transition-all duration-200 ease-out cursor-pointer whitespace-nowrap select-none flex-1 sm:flex-initial w-full ${
          isOpen || activeCount > 0
            ? 'bg-[#FF5B1D] text-white border-2 border-[#FF5B1D] shadow-[0_6px_20px_rgba(255,91,29,0.35)] -translate-y-0.5'
            : 'bg-white border border-stone-200/90 text-stone-700 hover:border-[#FF5B1D]/60 hover:text-[#FF5B1D] hover:bg-[#FF5B1D]/[0.05] hover:shadow-[0_6px_16px_rgba(255,91,29,0.15)] hover:-translate-y-0.5'
        }`}
      >
        <span>{label}</span>
        {activeCount > 0 && (
          <span className="flex items-center justify-center bg-white text-[#FF5B1D] w-5 h-5 rounded-full text-[10px] font-black">
            {activeCount}
          </span>
        )}
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute ${
              dropdownPosition === 'right' ? 'right-0 sm:left-0' : dropdownPosition === 'center' ? 'left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-0' : 'left-0'
            } z-50 mt-2 w-48 rounded-2xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-stone-200/80 overflow-hidden`}
          >
            <div className="py-2 max-h-72 overflow-y-auto">
              {options.map((opt) => {
                const isActive = activeOptions.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => onToggle(opt.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50 transition-colors text-left"
                  >
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      isActive 
                        ? 'bg-[#FF5B1D] border-[#FF5B1D] text-white' 
                        : 'border-stone-300 bg-white'
                    }`}>
                      {isActive && (
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    {opt.icon && <span className={isActive ? 'text-[#FF5B1D]' : 'text-stone-500'}>{opt.icon}</span>}
                    <span className={`text-sm font-semibold flex-1 ${isActive ? 'text-stone-900' : 'text-stone-600'}`}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
          <Image src={dest.imageUrl} alt={dest.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="(max-width: 768px) 100vw, 33vw" />
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
  const [isMobile, setIsMobile] = useState(false);
  const [mobileFilterExpanded, setMobileFilterExpanded] = useState(false);
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
          const isPast = window.scrollY >= heroHeight - 10;
          setIsScrolledPastHero(prev => (prev !== isPast ? isPast : prev));
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

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize(); // initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isScrolledPastHero) {
      setMobileFilterExpanded(false);
    }
  }, [isScrolledPastHero]);


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
    router.push(`/ai-planner/new?prompt=${encodeURIComponent(dest.prompt)}`);
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
      <section className="relative w-full h-[550px] md:h-[650px] bg-[#111] overflow-hidden flex items-center pt-[68px]">
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
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden z-[100] max-h-[300px] overflow-y-auto"
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
                          <Image src={dest.imageUrl} alt={dest.name} width={40} height={40} className="rounded-lg object-cover" />
                          <div>
                            <h4 className="text-sm font-bold text-[#1F1F1F]">
                              {renderHighlightedText(`${dest.name}, ${dest.country}`, searchQuery)}
                            </h4>
                            <p className="text-xs text-stone-500 truncate">
                              {renderHighlightedText(dest.tagline, searchQuery)}
                            </p>
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
              <Image src={HERO_IMAGES[bgIndex].url} alt="Featured" fill className="object-cover group-hover:scale-105 transition-transform duration-1000" sizes="100vw" priority />
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
            <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 -mt-8 mb-8 min-h-[180px] sm:min-h-[100px] relative pointer-events-none">
              {/* Solid sharp-cornered mask to hide scrolling content that peeks through the rounded corners */}
              <div className={`absolute top-0 bottom-0 left-4 right-4 sm:left-6 sm:right-6 bg-[#FAF8F5] -z-10 transition-opacity duration-500 ${isScrolledPastHero ? 'opacity-100' : 'opacity-0'} sm:block hidden`} />
              
              <AnimatePresence>
                {isMobile && isScrolledPastHero && !mobileFilterExpanded ? (
                  <motion.div
                    key="filter-pill"
                    layoutId="filter-bar-morph"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    className="mx-auto bg-white/90 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-[#ECE8E2]/80 hover:shadow-[0_16px_50px_rgba(0,0,0,0.12)] flex items-center justify-center gap-2 cursor-pointer overflow-hidden absolute left-0 right-0 pointer-events-auto"
                    style={{ width: 140, height: 44, borderRadius: 9999, top: 12 }}
                    onClick={() => setMobileFilterExpanded(true)}
                  >
                    <motion.div 
                      layoutId="filter-content-morph"
                      className="flex items-center gap-2 w-full h-full justify-center"
                    >
                      <Faders className="w-4 h-4 text-[#FF5B1D]" weight="bold" />
                      <span className="text-xs font-bold text-stone-700 whitespace-nowrap">
                        {activeVibes.length + activeBudgets.length + activeRegions.length > 0 ? `${activeVibes.length + activeBudgets.length + activeRegions.length} Filters` : 'Filters & Sort'}
                      </span>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="filter-full"
                    layoutId="filter-bar-morph"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    className="w-full mx-auto absolute left-0 right-0 bg-white/90 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-[#ECE8E2]/80 flex flex-col pointer-events-auto"
                    style={{ borderRadius: 16, top: 0 }}
                  >
                    <motion.div 
                      layoutId="filter-content-morph"
                      className="flex flex-col w-full origin-top"
                    >
                      <div className="px-3 sm:px-5 pt-4 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-3 w-full sm:w-auto">
                          <FilterDropdown 
                            label="Vibes" 
                            options={VIBE_FILTERS} 
                            activeOptions={activeVibes} 
                            onToggle={(id) => toggleFilter(id, setActiveVibes)} 
                            dropdownPosition="left"
                          />
                          <FilterDropdown 
                            label="Budget" 
                            options={BUDGET_FILTERS} 
                            activeOptions={activeBudgets} 
                            onToggle={(id) => toggleFilter(id, setActiveBudgets)} 
                            dropdownPosition="center"
                          />
                          <FilterDropdown 
                            label="Region" 
                            options={REGION_FILTERS} 
                            activeOptions={activeRegions} 
                            onToggle={(id) => toggleFilter(id, setActiveRegions)} 
                            dropdownPosition="right"
                          />
                          
                          {(activeVibes.length > 0 || activeBudgets.length > 0 || activeRegions.length > 0) && (
                            <>
                              <div className="h-6 w-px bg-stone-200 mx-1 shrink-0 hidden sm:block" />
                              <button 
                                type="button" 
                                onClick={clearAll} 
                                className="text-[11px] font-mono font-bold text-stone-400 hover:text-[#FF5B1D] hover:bg-[#FF5B1D]/10 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 hidden sm:block"
                              >
                                Clear all filters ×
                              </button>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto -mt-1 sm:mt-0">
                          {isMobile && isScrolledPastHero && mobileFilterExpanded && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMobileFilterExpanded(false);
                              }}
                              className="w-7 h-7 sm:hidden rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                          <div className="hidden sm:flex items-center gap-3">
                            <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">Sort by</span>
                            <SortDropdown value={sortOption} onChange={setSortOption} />
                          </div>
                        </div>
                      </div>
                    
                      {/* Active Chips & Mobile Sort Row */}
                      <div className={`py-3 flex items-center justify-between border-t border-stone-100 bg-[#FAF8F5]/50 rounded-b-2xl ${!(activeVibes.length > 0 || activeBudgets.length > 0 || activeRegions.length > 0) ? 'sm:hidden' : ''}`}>
                        <div className="flex items-center gap-2 overflow-x-auto flex-1 pl-5 pr-2 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                          {(activeVibes.length > 0 || activeBudgets.length > 0 || activeRegions.length > 0) ? (
                            <span className="text-[11px] font-bold text-[#FF5B1D] shrink-0">Filtered destinations</span>
                          ) : (
                            <span className="text-[11px] font-bold text-stone-400 shrink-0">Filter your perfect trip</span>
                          )}
                          {(activeVibes.length > 0 || activeBudgets.length > 0 || activeRegions.length > 0) && <div className="h-3 w-px bg-stone-300 mx-1 shrink-0" />}
                          {[...activeVibes.map(id => ({ id, label: VIBE_FILTERS.find(f => f.id === id)?.label, category: 'vibe' })), ...activeBudgets.map(id => ({ id, label: BUDGET_FILTERS.find(f => f.id === id)?.label, category: 'budget' })), ...activeRegions.map(id => ({ id, label: REGION_FILTERS.find(f => f.id === id)?.label, category: 'region' }))].map(chip => (
                            <button
                              key={chip.id}
                              onClick={() => removeFilter(chip.id, chip.category)}
                              className="flex items-center gap-1.5 bg-[#FF5B1D]/10 border border-[#FF5B1D]/25 text-[#FF5B1D] px-2.5 py-1 rounded-full text-[10px] font-bold hover:bg-[#FF5B1D] hover:text-white hover:border-[#FF5B1D] hover:shadow-[0_4px_12px_rgba(255,91,29,0.25)] hover:-translate-y-0.5 transition-all duration-200 shrink-0 group cursor-pointer"
                            >
                              {chip.label} <span className="text-[#FF5B1D]/60 text-xs leading-none font-normal group-hover:text-white transition-colors">×</span>
                            </button>
                          ))}
                        </div>
                        
                        <div className="flex items-center shrink-0 pr-5 pl-2 sm:hidden">
                          <SortDropdown value={sortOption} onChange={setSortOption} />
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </OrigamiFilterBar>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 sm:space-y-12">
        {/* View Mode Toggle & Command Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-stone-200 hover:relative hover:z-50">
          <div className="relative flex items-center bg-stone-200/50 p-1 rounded-full border border-stone-200/80 shadow-inner hover:z-50 w-full sm:w-auto">
            {['bento', 'atlas'].map((mode) => (
              <div
                key={mode}
                role="button"
                tabIndex={0}
                onMouseEnter={() => setHoverMode(mode)}
                onMouseLeave={() => setHoverMode(null)}
                onClick={() => setViewMode(mode)}
                className={`relative z-10 cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 rounded-full text-[10px] sm:text-[11px] font-bold transition-colors flex-1 sm:flex-initial whitespace-nowrap ${
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
                
                {/* Hover Preview Thumbnail (Desktop Only) */}
                <AnimatePresence>
                  {hoverMode === mode && viewMode !== mode && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="hidden sm:block absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-stone-900 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-stone-200/20 overflow-hidden pointer-events-none z-50"
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
          <div className="flex items-center gap-2 text-[11px] sm:text-xs text-stone-500 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
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
                  <div className="w-full border-t border-stone-300 mb-6"></div>
                  <div className="flex flex-col md:flex-row md:items-center items-start justify-between gap-4 md:gap-0 mb-5">
                    <div>
                      <h2 className="text-sm font-bold text-[#FF6B2C] uppercase tracking-[0.2em] flex flex-wrap items-center gap-2">
                        <span>FEATURED — ISSUE 47</span>
                        <span className="text-[10px] font-mono font-bold bg-[#FF6B2C]/15 text-[#FF6B2C] px-2 py-0.5 rounded-full border border-[#FF6B2C]/30 mt-1 sm:mt-0">Trending This Month</span>
                      </h2>
                      <p className="text-lg md:text-xl font-extrabold text-[#1F1F1F] mt-1.5 tracking-tight">Top-selected AI destinations</p>
                    </div>
                    <a href="#all-destinations" className="text-xs font-bold text-[#FF6B2C] hover:underline self-start md:self-auto mt-1 md:mt-0">Browse all below ↓</a>
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
