'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from 'framer-motion';
import dynamic from 'next/dynamic';
import Header from '../components/Header';
import {
  Download,
  Share2,
  Edit3,
  MapPin,
  Clock,
  DollarSign,
  Sparkles,
  Bookmark,
  X,
  Compass,
  Printer,
  ChevronDown,
  ChevronUp,
  Info,
  Calendar,
  AlertCircle,
  HelpCircle,
  Footprints,
  Sun,
  Sunset,
  Layers,
  ArrowRight,
  Check,
  Ticket,
  ExternalLink,
  Utensils
} from 'lucide-react';
import {
  getActivityThumbnail,
  getTransportBetweenStops,
  getActivityRating,
  getCategoryStyling,
  getIconBadges,
  getAiInsight,
  formatCost,
  getDaySummary
} from '../components/itineraryHelpers';

// Dynamically import map components to avoid SSR/window issues
const ItineraryMapModal = dynamic(() => import('../components/ItineraryMapModal'), { ssr: false });
const TicketPassModal = dynamic(() => import('../components/TicketPassModal'), { ssr: false });
import InlineDiningReservation from '../components/InlineDiningReservation';

const toRomanNumeral = (num) => {
  const romanMap = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X' };
  return romanMap[num] || String(num);
};

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 600;
  const cleaned = timeStr.trim().toLowerCase();
  const match = cleaned.match(/(\d+):(\d+)\s*(am|pm)?/);
  if (!match) return 600;
  
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3];
  
  if (ampm === 'pm' && hours < 12) hours += 12;
  if (ampm === 'am' && hours === 12) hours = 0;
  
  return hours * 60 + minutes;
};

const getDaylightPercentage = (timeStr) => {
  const mins = parseTimeToMinutes(timeStr);
  const start = 8 * 60;
  const end = 22 * 60;
  const pct = ((mins - start) / (end - start)) * 100;
  return Math.min(Math.max(pct, 0), 100);
};

const getStopEndTimeMinutes = (timeStr, durationStr) => {
  const startMins = parseTimeToMinutes(timeStr);
  let durationMins = 90;
  if (durationStr) {
    const hoursMatch = durationStr.match(/(\d+)\s*hr/i);
    const minsMatch = durationStr.match(/(\d+)\s*min/i);
    let h = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
    let m = minsMatch ? parseInt(minsMatch[1], 10) : 0;
    if (!hoursMatch && !minsMatch) {
      const floatVal = parseFloat(durationStr);
      if (!isNaN(floatVal)) h = floatVal;
    }
    durationMins = h * 60 + m;
  }
  return startMins + durationMins;
};

const getDayNarrativeTitle = (dayNum, destinationName) => {
  const narratives = [
    `Arrival, Settling In & First Impressions of ${destinationName}`,
    `Into the Ancient Heart & Historical Legacy`,
    `Cultural Synthesis, Culinary Journeys & Farewells`,
    `Wandering the Secondary Paths & Scenic Vistas`,
    `The Final Epilogue of Scenic Exploration`
  ];
  return narratives[(dayNum - 1) % narratives.length];
};

const getAlternativeSuggestions = (act, idx) => {
  const category = (act.category || '').toLowerCase();
  if (category.includes('din') || category.includes('food') || category.includes('rest')) {
    return [
      { title: "Trattoria da Enzo al 29", desc: "A cozy, legendary Trastevere kitchen serving classic carbonara in a rustic Roman setting." },
      { title: "Emma Pizza", desc: "Crispy thin Roman pizza topped with artisanal local ingredients and premium olive oils." }
    ];
  }
  if (category.includes('cafe') || category.includes('gelat') || category.includes('coffee')) {
    return [
      { title: "Sant' Eustachio il Caffè", desc: "Famous since 1938 for its secret wood-roasting process and signature frothy espresso." },
      { title: "Frigidarium Gelato", desc: "Handcrafted Roman gelato dipped in a signature dark or white chocolate shell." }
    ];
  }
  return [
    { title: "Villa Borghese Gardens", desc: "Lush landscape park featuring quiet walkways, rowboats, and beautiful panoramic city vistas." },
    { title: "Palazzo Altemps", desc: "Serene Renaissance palace housing classical Roman sculptures without the Vatican crowds." }
  ];
};

const Sparkline = () => (
  <svg className="w-14 h-4 text-[#BA5536] inline-block mr-1.5 align-middle" viewBox="0 0 50 15" fill="none">
    <path 
      d="M0 10 C10 15, 12 2, 20 8 C28 14, 35 1, 50 6" 
      stroke="currentColor" 
      strokeWidth="1.8" 
      strokeLinecap="round" 
    />
  </svg>
);

const getContextAwareTip = (act, idx) => {
  const title = (act.title || '').toLowerCase();
  const timeMins = parseTimeToMinutes(act.time);
  
  let crowdNote = "Visiting before peak tour bus hours. Enjoy a calmer atmosphere.";
  if (timeMins >= 660 && timeMins <= 840) {
    crowdNote = "Peak midday tourist congestion. Staying hydrated and booking online in advance is highly advised.";
  } else if (timeMins > 840) {
    crowdNote = "Fewer crowds and softer lighting, ideal for photography and tranquil exploring.";
  }

  let weatherNote = "Expected mild temperatures. Ideal walking conditions.";
  if (title.includes('colosseum') || title.includes('forum') || title.includes('ruin') || title.includes('plaza')) {
    weatherNote = "Open historic ruins with high sun exposure. We strongly recommend hats and sunscreen before 1:00 PM.";
  } else if (title.includes('restaurant') || title.includes('indoor') || title.includes('vatican') || title.includes('museum')) {
    weatherNote = "Indoor climate-controlled site. A great option if outside heat rises.";
  }

  return { crowdNote, weatherNote };
};

export default function ItineraryPage() {
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Navigation & Modal State
  const [activeDay, setActiveDay] = useState(1); // Active Day or 'epilogue'
  const [activeModalDay, setActiveModalDay] = useState(null);
  // Delay-mount Leaflet map until AFTER modal spring animation settles (prevents tile jitter)
  const [mapMounted, setMapMounted] = useState(false);
  const mapModalRef = useRef(null);

  useEffect(() => {
    if (activeModalDay !== null) {
      // Wait for the modal spring animation to settle (~280ms) then mount the map
      const t = setTimeout(() => setMapMounted(true), 300);
      return () => clearTimeout(t);
    } else {
      setMapMounted(false);
    }
  }, [activeModalDay]);

  // Stop Detail States
  const [expandedStops, setExpandedStops] = useState({});
  const [showAlternatives, setShowAlternatives] = useState({});
  const [savedStops, setSavedStops] = useState({});
  const [shareCopied, setShareCopied] = useState(false);
  const [activePassModal, setActivePassModal] = useState(null);

  // Dining Reservations Rollup State & Refresh
  const [diningTick, setDiningTick] = useState(0);
  const handleDiningBookingsChange = () => {
    setDiningTick(prev => prev + 1);
  };

  // Compute Trip-Level and Day-Level Dining Reservation Rollups
  const computeDiningRollup = (dayFilterNum = null) => {
    if (!itinerary || !itinerary.days) return { total: 0, confirmed: 0, firstUnbooked: null };
    let total = 0;
    let confirmed = 0;
    let firstUnbooked = null;

    itinerary.days.forEach((d, dIdx) => {
      const dNum = dIdx + 1;
      if (dayFilterNum !== null && dNum !== dayFilterNum) return;
      const acts = d.activities || [];
      acts.forEach((a, aIdx) => {
        const catLower = (a.category || a.type || '').toLowerCase();
        const titleLower = (a.title || '').toLowerCase();
        const isDining = catLower.includes('din') || catLower.includes('food') || catLower.includes('rest') || catLower.includes('cafe') || catLower.includes('bar') || catLower.includes('lunch') || catLower.includes('dinner') || catLower.includes('breakfast') || titleLower.includes('osteria') || titleLower.includes('trattoria') || titleLower.includes('restaurant') || titleLower.includes('cafe') || titleLower.includes('bistro') || titleLower.includes('gelat') || titleLower.includes('pizzeria') || titleLower.includes('tavern');
        if (isDining) {
          total++;
          const stopNum = aIdx + 1;
          const storageKey = `tw_dining_res_${itinerary.destinationName || 'Destination'}_d${dNum}_s${stopNum}`;
          let isConf = false;
          try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed && (parsed.status === 'marked_reserved' || parsed.status === 'confirmed')) {
                isConf = true;
              }
            }
          } catch (e) {}

          if (isConf) {
            confirmed++;
          } else if (!firstUnbooked) {
            firstUnbooked = { dayNum: dNum, stopNum: stopNum };
          }
        }
      });
    });

    return { total, markedReserved: confirmed, confirmed, firstUnbooked };
  };

  const scrollToFirstUnbookedDining = (firstUnbooked) => {
    if (!firstUnbooked) return;
    if (activeDay !== firstUnbooked.dayNum) {
      setActiveDay(firstUnbooked.dayNum);
      setTimeout(() => {
        const el = document.getElementById(`dining-stop-${firstUnbooked.dayNum}-${firstUnbooked.stopNum}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 350);
    } else {
      const el = document.getElementById(`dining-stop-${firstUnbooked.dayNum}-${firstUnbooked.stopNum}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Parallax Scroll Tracking Refs
  // Window scroll position tracking for parallax (no target ref needed to avoid hydration error)
  const { scrollY } = useScroll();

  // Spring-smoothed scroll progress bar (top of screen)
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // Parallax offset mappings based on scroll position in pixels (0 to 600px)
  const bgY = useTransform(scrollY, [0, 600], ["0%", "28%"]);
  const midY = useTransform(scrollY, [0, 600], ["0%", "14%"]);
  const foreY = useTransform(scrollY, [0, 600], ["0%", "4%"]);
  const foreScale = useTransform(scrollY, [0, 600], [1, 1.04]);
  const heroOpacity = useTransform(scrollY, [0, 600], [1, 0]);

  // Motion accessibility check
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReduceMotion(mediaQuery.matches);
      const listener = (e) => setReduceMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Fetch itinerary from localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('tripwise_itinerary');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setItinerary(parsed);
          } catch (err) {
            console.error("Failed to parse stored itinerary:", err);
          }
        }
        setLoading(false);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleExpandStop = (stopKey) => {
    setExpandedStops(prev => ({ ...prev, [stopKey]: !prev[stopKey] }));
  };

  const toggleAlternatives = (stopKey) => {
    setShowAlternatives(prev => ({ ...prev, [stopKey]: !prev[stopKey] }));
  };

  const toggleSaveStop = (stopKey) => {
    setSavedStops(prev => ({ ...prev, [stopKey]: !prev[stopKey] }));
  };

  const handleShareDossier = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    }
  };

  const handlePrintOrDownload = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] text-[#1E1C1A] flex flex-col items-center justify-center font-serif">
        <div className="w-10 h-10 rounded-full border-2 border-[#BA5536] border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-serif italic text-[#7A7268] tracking-wide">Assembling your custom Trip Dossier...</p>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] text-[#1E1C1A] flex flex-col justify-between font-sans selection:bg-[#BA5536]/15">
        <Header />
        <div className="max-w-xl mx-auto px-6 py-32 text-center my-auto">
          <div className="w-16 h-16 rounded-full border border-[#E6DFD5] bg-[#F5F0E8] text-[#BA5536] flex items-center justify-center mx-auto mb-6 text-2xl font-serif italic shadow-2xs">
            I
          </div>
          <h1 className="text-4xl font-serif font-black tracking-tight mb-3 text-[#1E1C1A]">No Dossier Found</h1>
          <p className="text-base font-serif italic text-[#7A7268] leading-relaxed mb-8">
            Your travel dossier has not been generated yet. Please head to the AI Planner to build an interactive trip schedule.
          </p>
          <a
            href="/ai-planner"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-sans text-xs font-bold uppercase tracking-wider bg-[#1E1C1A] text-[#FAF6F0] hover:bg-[#BA5536] transition-all duration-300 shadow-md"
          >
            <span>Create Itinerary in Planner →</span>
          </a>
        </div>
        <footer className="py-8 text-center text-xs font-serif italic text-[#7A7268] border-t border-[#E6DFD5]/60">
          TripWise Private Travel Concierge · Published Dossier Guide
        </footer>
      </div>
    );
  }

  const days = itinerary.days || [];
  const totalStopsCount = days.reduce((acc, d) => acc + (d.activities?.length || 0), 0);
  
  const totalDistanceEst = days.reduce((acc, d, i) => {
    const summary = getDaySummary(d, i, days);
    const num = parseFloat(summary?.stats?.distance || '3');
    return acc + (isNaN(num) ? 3 : num);
  }, 0).toFixed(1);

  const preBookedItems = [
    { item: "Basecamp Hotel Accommodation", status: "Pre-booked", code: "TW-98231A" },
    { item: "Vatican Museum Fast-Track Passes", status: "Action Needed", link: "Vatican Ticketing Portal" }
  ];

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#1E1C1A] flex flex-col font-sans selection:bg-[#BA5536]/15">
      {/* Scroll Progress Bar at the top of the page */}
      <motion.div 
        style={{ scaleX }} 
        className="fixed top-0 left-0 right-0 h-0.75 bg-[#BA5536] origin-left z-60 pointer-events-none"
      />

      <Header />

      {/* HERO SECTION: Scroll-Driven Layered Parallax (Accesses Requirement 1) */}
      <section 
        className="relative w-full min-h-165 md:min-h-180 pt-32 pb-20 px-6 flex flex-col justify-end overflow-hidden border-b border-[#E6DFD5]"
      >
        {/* Layer 1: Parallax Background (Image Layer - Moves slowest: 0.2x speed) */}
        <motion.div 
          style={{ translateY: reduceMotion ? "0%" : bgY, opacity: reduceMotion ? 1 : heroOpacity }}
          className="absolute inset-0 z-0"
        >
          <img
            src={itinerary.heroImage || "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=2000&q=85"}
            alt={itinerary.destinationName || 'Destination'}
            className="w-full h-full object-cover object-center transform scale-105"
          />
        </motion.div>

        {/* Layer 2: Parallax Midground (Landmark silhouette overlay / Atmospheric color wash - Moves at 0.5x speed) */}
        <motion.div
          style={{ translateY: reduceMotion ? "0%" : midY, opacity: reduceMotion ? 1 : heroOpacity }}
          className="absolute inset-0 z-10 pointer-events-none bg-linear-to-t from-[#FAF6F0] via-[#FAF6F0]/65 to-black/25"
        />

        {/* Layer 3: Foreground content (Title, Subtitle & Meta - Stays nearly fixed with subtle scaling) */}
        <motion.div 
          style={{ 
            translateY: reduceMotion ? "0%" : foreY, 
            scale: reduceMotion ? 1 : foreScale, 
            opacity: reduceMotion ? 1 : heroOpacity 
          }}
          className="max-w-5xl mx-auto w-full relative z-20 flex flex-col gap-6 pt-16"
        >
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1 rounded-full border border-[#BA5536]/40 bg-[#FAF6F0]/90 backdrop-blur-sm text-[#BA5536] font-mono text-[10px] font-bold tracking-widest uppercase shadow-2xs">
              Curated Travel Guide
            </span>
            <span className="text-xs font-serif italic text-[#4A443E]/85">
              Refined by TripWise Private Concierge
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-serif font-black tracking-tight text-[#1E1C1A] leading-[1.04]">
            {itinerary.destinationName || 'Your Custom Journey'}
          </h1>

          <p className="text-xl sm:text-2xl font-serif italic text-[#4A443E] max-w-3xl leading-relaxed">
            “{itinerary.tagline || 'An immersive, thoughtfully paced exploration tailored to your unique architectural, culinary, and cultural preferences.'}”
          </p>

          <div className="pt-4 border-t border-[#E6DFD5]/80 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm font-sans tracking-wide text-[#5F5E5A] uppercase">
            <span className="font-bold text-[#1E1C1A]">{days.length} Daily Chapters</span>
            <span className="text-[#BA5536] font-serif">•</span>
            <span>{totalStopsCount} Curated Stops</span>
            <span className="text-[#BA5536] font-serif">•</span>
            <span>Est. Budget: <strong className="text-[#1E1C1A]">{itinerary.estimatedCost || '$1,450'}</strong></span>
            <span className="text-[#BA5536] font-serif">•</span>
            <span>Pacing: <strong className="text-[#1E1C1A]">Immersive &amp; Fluid</strong></span>
          </div>
        </motion.div>
      </section>

      {/* STICKY JUMP BAR & UTILITY STRIP */}
      <div className="sticky top-16 sm:top-18 z-40 bg-[#FAF6F0]/95 backdrop-blur-md border-b border-[#E6DFD5] py-3.5 px-6 shadow-2xs transition-all">
        <div className="max-w-5xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Chapter Links */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
            <span className="text-[11px] font-serif italic text-[#7A7268] mr-1.5 hidden md:inline">Jump to:</span>
            {days.map((day, dIdx) => {
              const dayNum = day.dayNumber || dIdx + 1;
              const isSelected = activeDay === dayNum;
              return (
                <button
                  key={dayNum}
                  onClick={() => setActiveDay(dayNum)}
                  className={`px-3.5 py-1.5 rounded-full border text-xs font-serif font-bold transition-all duration-200 shrink-0 cursor-pointer shadow-2xs ${
                    isSelected 
                      ? 'bg-[#1E1C1A] text-[#FAF6F0] border-[#1E1C1A]' 
                      : 'bg-white/80 hover:bg-[#1E1C1A] hover:text-[#FAF6F0] hover:border-[#1E1C1A] text-[#1E1C1A] border-[#E6DFD5]'
                  }`}
                >
                  Day {toRomanNumeral(dayNum)}
                </button>
              );
            })}
            <button
              onClick={() => setActiveDay('epilogue')}
              className={`px-3.5 py-1.5 rounded-full border text-xs font-serif italic transition-all duration-200 shrink-0 cursor-pointer shadow-2xs ${
                activeDay === 'epilogue'
                  ? 'bg-[#BA5536] text-white border-[#BA5536]'
                  : 'bg-[#F5F0E8] hover:bg-[#BA5536] hover:text-white text-[#4A443E] border-[#E6DFD5]'
              }`}
            >
              Epilogue
            </button>
          </div>

          {/* Action Set */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={handlePrintOrDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#E6DFD5] bg-white text-xs font-sans font-bold text-[#1E1C1A] hover:bg-[#F5F0E8] transition-all cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-[#BA5536]" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={handleShareDossier}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#E6DFD5] bg-white text-xs font-sans font-bold text-[#1E1C1A] hover:bg-[#F5F0E8] transition-all cursor-pointer shadow-2xs"
            >
              {shareCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[#BA5536]" />
                  <span>Share Dossier</span>
                </>
              )}
            </button>

            <a
              href="/ai-planner"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#BA5536] bg-[#BA5536]/10 text-xs font-sans font-bold text-[#BA5536] hover:bg-[#BA5536] hover:text-white transition-all cursor-pointer shadow-2xs ml-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit in Planner</span>
            </a>
          </div>
        </div>
      </div>

      {/* DOSSIER BODY CONTENT */}
      <main className="max-w-5xl mx-auto px-6 py-12 w-full flex flex-col gap-16">
        
        {/* THE DOSSIER INDEX (Overview List) */}
        {activeDay !== 'epilogue' && (
          <section className="bg-white rounded-3xl border border-[#E6DFD5] p-8 sm:p-10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-[#BA5536]/5 via-transparent to-transparent pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E6DFD5]">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-[#BA5536] font-bold block mb-1">
                  The Dossier Index
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#1E1C1A] tracking-tight">
                  Curated Chapters
                </h2>
              </div>
              <p className="text-xs font-serif italic text-[#7A7268] max-w-xs">
                Chronologically mapped daily schedules. Select a card below or use the jump links to page-turn chapters in 3D.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
              {days.map((day, idx) => {
                const dayNum = day.dayNumber || idx + 1;
                const summary = getDaySummary(day, idx, days);
                return (
                  <div
                    key={dayNum}
                    onClick={() => setActiveDay(dayNum)}
                    className="flex flex-col justify-between p-6 rounded-2xl bg-[#FAF6F0] border border-[#E6DFD5]/80 hover:border-[#BA5536]/60 transition-all duration-300 group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-0.5 rounded-md bg-[#1E1C1A] text-[#FAF6F0] font-serif text-xs font-bold tracking-wider">
                          Day {toRomanNumeral(dayNum)}
                        </span>
                        <span className="text-xs font-sans text-[#7A7268] font-semibold">
                          Chapter {dayNum}
                        </span>
                      </div>
                      <h3 className="text-lg font-serif font-bold text-[#1E1C1A] leading-snug group-hover:text-[#BA5536] transition-colors">
                        {getDayNarrativeTitle(dayNum, itinerary.destinationName || 'Destination')}
                      </h3>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#E6DFD5] flex items-center justify-between text-[11px] font-sans text-[#5F5E5A]">
                      <span>{day.activities?.length || 0} Curated Stops</span>
                      <span className="font-bold text-[#1E1C1A]">{summary?.stats?.hours || '6.5 Hours'}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveModalDay(dayNum);
                      }}
                      className="mt-4 w-full py-2 px-3 rounded-xl border border-[#E6DFD5] bg-white hover:bg-[#BA5536] hover:border-[#BA5536] hover:text-white text-[#1E1C1A] font-sans text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5 text-[#BA5536] group-hover:text-white" />
                      <span>View Day {toRomanNumeral(dayNum)} Map Overlay</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* NARRATIVE CHAPTERS WITH 3D DEPTH SWAP TRANSITION (Accesses Requirement 2) */}
        <div style={{ perspective: 1200 }} className="relative min-h-125">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDay}
              initial={reduceMotion ? { opacity: 0 } : { rotateY: 8, translateZ: -100, opacity: 0 }}
              animate={reduceMotion ? { opacity: 1 } : { rotateY: 0, translateZ: 0, opacity: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { rotateY: -8, translateZ: -100, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformStyle: "preserve-3d" }}
              className="w-full"
            >
              {activeDay === 'epilogue' ? (() => {
                const tripDiningRollup = computeDiningRollup(null);
                return (
                  /* SECTION 3: THE EPILOGUE & 3D STAMP FLOURISH (Accesses Requirement 4) */
                  <section className="scroll-mt-32 flex flex-col gap-10">
                    <div className="text-center max-w-2xl mx-auto">
                      <span className="text-xs font-mono uppercase tracking-widest text-[#BA5536] font-bold block mb-1">
                        THE EPILOGUE  —  DOSSIER SUMMARY
                      </span>
                      <h2 className="text-3xl sm:text-5xl font-serif font-black text-[#1E1C1A] tracking-tight leading-tight">
                        Trip Epilogue &amp; Statistics
                      </h2>
                    </div>

                    {/* Visual 3D stamp flourish loop trigger when scrolled into view */}
                    <div className="flex flex-col items-center justify-center py-6">
                      <motion.div
                        initial={{ scale: 1.8, rotate: -45, opacity: 0 }}
                        whileInView={{ scale: 1, rotate: -12, opacity: 1 }}
                        viewport={{ once: true, margin: "-120px" }}
                        transition={{ type: "spring", damping: 12, stiffness: 90, delay: 0.2 }}
                        className="w-44 h-44 rounded-full border-4 border-dashed border-[#BA5536]/80 text-[#BA5536] flex flex-col items-center justify-center font-serif uppercase text-center relative z-10 shadow-xs select-none"
                      >
                        <span className="text-[10px] tracking-widest font-bold">Approved</span>
                        <span className="text-lg font-black tracking-tight my-0.5">TripWise</span>
                        <span className="text-[8px] tracking-[0.2em] font-extrabold text-[#7A7268]">Concierge</span>
                        
                        {/* Innermost ink circle stamp details */}
                        <div className="absolute inset-1 border border-solid border-[#BA5536]/25 rounded-full pointer-events-none" />
                        <div className="absolute bottom-2 text-[7px] text-[#7A7268] tracking-widest font-sans font-bold">Ref: TW-Stamp</div>
                      </motion.div>

                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.7 }}
                        className="text-xs font-serif italic text-[#7A7268] mt-3"
                      >
                        ✓ Verification stamp locked down successfully.
                      </motion.div>
                    </div>

                    {/* Grid stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 p-8 rounded-3xl bg-white border border-[#E6DFD5] text-center shadow-xs">
                      <div className="flex flex-col gap-1 border-r border-[#E6DFD5] last:border-r-0">
                        <span className="text-xs font-sans uppercase tracking-widest text-[#7A7268]">Total Duration</span>
                        <span className="text-2xl sm:text-3xl font-serif font-black text-[#1E1C1A]">{days.length} Days</span>
                      </div>
                      <div className="flex flex-col gap-1 border-r border-[#E6DFD5] last:border-r-0">
                        <span className="text-xs font-sans uppercase tracking-widest text-[#7A7268]">Experiences Plotted</span>
                        <span className="text-2xl sm:text-3xl font-serif font-black text-[#1E1C1A]">{totalStopsCount} Stops</span>
                      </div>
                      <div className="flex flex-col gap-1 border-r border-[#E6DFD5] last:border-r-0">
                        <span className="text-xs font-sans uppercase tracking-widest text-[#7A7268]">Walking Distance</span>
                        <span className="text-2xl sm:text-3xl font-serif font-black text-[#1E1C1A]">~{totalDistanceEst} km</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-sans uppercase tracking-widest text-[#7A7268]">Estimated Cost</span>
                        <span className="text-2xl sm:text-3xl font-serif font-black text-[#BA5536]">{itinerary.estimatedCost || '$1,450'}</span>
                      </div>
                    </div>

                    {/* Trip-Level Dining Rollup Banner */}
                    {tripDiningRollup.total > 0 && (
                      <div className="p-6 rounded-3xl bg-[#FAF6F0] border border-[#BA5536]/30 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-[#BA5536]/10 border border-[#BA5536]/25 flex items-center justify-center text-[#BA5536] shrink-0">
                            <Utensils className="w-6 h-6 stroke-[2.2]" />
                          </div>
                          <div>
                            <h4 className="font-serif font-bold text-lg text-[#1E1C1A] leading-tight">
                              Trip-Level Dining Concierge Rollup
                            </h4>
                            <p className="text-xs sm:text-sm font-sans text-[#5F5E5A] mt-1">
                              {tripDiningRollup.markedReserved === tripDiningRollup.total ? 'All dining reservations across your itinerary are marked as booked!' : `${tripDiningRollup.markedReserved} of ${tripDiningRollup.total} dining reservations marked as booked.`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
                          <span className="px-3.5 py-1.5 rounded-full bg-[#BA5536]/15 border border-[#BA5536]/30 text-[#BA5536] font-mono text-xs font-extrabold tracking-wider">
                            {tripDiningRollup.markedReserved} / {tripDiningRollup.total} MARKED AS BOOKED
                          </span>
                          {tripDiningRollup.firstUnbooked && (
                            <button
                              type="button"
                              onClick={() => scrollToFirstUnbookedDining(tripDiningRollup.firstUnbooked)}
                              className="px-4 py-2 rounded-xl bg-[#1E1C1A] text-white hover:bg-[#BA5536] font-sans text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                            >
                              <span>Mark Day {tripDiningRollup.firstUnbooked.dayNum} Table →</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Reminders grids */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-2xl border border-[#E6DFD5] shadow-2xs">
                      <h3 className="text-sm font-sans font-bold uppercase tracking-widest text-[#BA5536] border-b border-[#E6DFD5] pb-2.5 mb-3.5 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Concierge Packing &amp; Prep Reminders</span>
                      </h3>
                      <ul className="text-xs font-serif text-[#4A443E] leading-relaxed flex flex-col gap-2.5 list-disc pl-4">
                        <li>
                          <strong>Comfortable Footwear:</strong> Walk sparklines denote approx. {totalDistanceEst} km. Wear robust walking shoes suited for old city cobblestones.
                        </li>
                        <li>
                          <strong>Church/Cultural Sites:</strong> Several scheduled historical landmarks require covered shoulders and knees to enter.
                        </li>
                        <li>
                          <strong>Reusable Flasks:</strong> Rome features free historic drinking fountains (Nasoni) across streets—highly recommended for daylight walking segments.
                        </li>
                      </ul>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-[#E6DFD5] shadow-2xs">
                      <h3 className="text-sm font-sans font-bold uppercase tracking-widest text-[#BA5536] border-b border-[#E6DFD5] pb-2.5 mb-3.5 flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        <span>Booking &amp; Tickets Status Overview</span>
                      </h3>
                      <div className="flex flex-col gap-3">
                        {preBookedItems.map((item, keyIdx) => (
                          <div key={keyIdx} className="flex items-center justify-between text-xs border-b border-[#FAF6F0] pb-2 last:border-b-0 last:pb-0">
                            <div>
                              <strong className="block text-[#1E1C1A]">{item.item}</strong>
                              <span className="text-[10px] text-[#7A7268]">{item.code || 'Instant access link available'}</span>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'Pre-booked' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-600/10 text-amber-700'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Closing signature and bottom page-turns */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-[#E6DFD5]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1E1C1A] text-[#FAF6F0] flex items-center justify-center font-serif italic text-lg font-bold">
                        T
                      </div>
                      <div>
                        <h4 className="text-sm font-serif font-bold text-[#1E1C1A]">TripWise Travel Concierge</h4>
                        <p className="text-xs font-sans text-[#7A7268]">Dossier Lock Verified • Ref: TW-3129841</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap justify-center">
                      <button
                        onClick={() => setActiveDay(1)}
                        className="px-5 py-2.5 rounded-full border border-[#E6DFD5] bg-white text-xs font-sans font-bold uppercase tracking-wider text-[#1E1C1A] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
                      >
                        ← Start Over (Day I)
                      </button>

                      <button
                        type="button"
                        onClick={handlePrintOrDownload}
                        className="px-6 py-3 rounded-full border border-[#1E1C1A] bg-[#1E1C1A] text-[#FAF6F0] hover:bg-[#BA5536] hover:border-[#BA5536] text-xs font-sans font-bold uppercase tracking-wider transition-all duration-300 shadow-md cursor-pointer flex items-center gap-2"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Print Dossier Booklet</span>
                      </button>
                    </div>
                  </div>
                </section>
              ); })() : (
                /* ACTIVE CHAPTER VIEW */
                (() => {
                  const dayIdx = activeDay - 1;
                  const day = days[dayIdx] || days[0];
                  const summary = getDaySummary(day, dayIdx, days);
                  const activities = day.activities || [];
                  const dayDiningRollup = computeDiningRollup(activeDay);

                  return (
                    <div className="flex flex-col">
                      {/* Chapter Header Card & daylight pacing gradient */}
                      <div className="border-b-2 border-[#1E1C1A] pb-6 mb-8 flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <span className="text-xs font-mono uppercase tracking-widest text-[#BA5536] font-extrabold">
                            CHAPTER {toRomanNumeral(activeDay)}  —  DAY {activeDay}
                          </span>
                          
                          {/* Visual distance sparkline next to distance stats & dining rollup */}
                          <div className="flex items-center gap-3 text-xs font-sans font-semibold text-[#5F5E5A] tracking-wide flex-wrap">
                            <span>{activities.length} Stops</span>
                            <span className="text-[#E6DFD5] font-serif">•</span>
                            <span>{summary?.stats?.hours || '6.5 hrs'}</span>
                            <span className="text-[#E6DFD5] font-serif">•</span>
                            <span className="inline-flex items-center">
                              <Sparkline />
                              <span>{summary?.stats?.distance || '3.2 km'}</span>
                            </span>
                            <span className="text-[#E6DFD5] font-serif">•</span>
                            <span className="text-[#1E1C1A] font-bold">{summary?.stats?.cost || 'Est. €85'}</span>
                            {dayDiningRollup.total > 0 && (
                              <>
                                <span className="text-[#E6DFD5] font-serif">•</span>
                                <button
                                  type="button"
                                  onClick={() => scrollToFirstUnbookedDining(dayDiningRollup.firstUnbooked)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#BA5536]/30 bg-[#BA5536]/10 text-[#BA5536] font-sans text-xs font-bold hover:bg-[#BA5536]/20 transition-all cursor-pointer shadow-2xs"
                                  title="Tap to jump to first unbooked dining stop"
                                >
                                  <Utensils className="w-3.5 h-3.5 shrink-0" />
                                  <span>{dayDiningRollup.markedReserved} of {dayDiningRollup.total} reservations marked as booked</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <h2 className="text-3xl sm:text-5xl font-serif font-black text-[#1E1C1A] tracking-tight leading-tight">
                          {getDayNarrativeTitle(activeDay, itinerary.destinationName || 'Destination')}
                        </h2>

                        {/* Day pacing narrator intro */}
                        <p className="text-lg sm:text-xl font-serif italic text-[#4A443E] leading-relaxed max-w-4xl">
                          “We have structured this day's pacing with early morning historical wonders, leading to quiet lunch breaks and open afternoon blocks for leisurely independent wandering.”
                        </p>

                        {/* DAYLIGHT PACE GRADIENT BAR: Plotting times visually (Accesses Requirement 3 daylight track) */}
                        <div className="my-4">
                          <div className="flex items-center justify-between text-[10px] font-sans uppercase tracking-widest text-[#7A7268] mb-1.5 font-bold">
                            <span className="flex items-center gap-1"><Sun className="w-3 h-3 text-amber-500" /> Morning Pacing (8 AM)</span>
                            <span className="flex items-center gap-1">Afternoon (2 PM)</span>
                            <span className="flex items-center gap-1"><Sunset className="w-3 h-3 text-indigo-700" /> Evening (10 PM)</span>
                          </div>
                          
                          {/* Sunrise-to-sunset gradient track */}
                          <div className="relative w-full h-3 rounded-full bg-linear-to-r from-amber-100 via-orange-200 to-indigo-950 border border-[#E6DFD5]/40 shadow-inner">
                            {activities.map((act, idx) => {
                              const pct = getDaylightPercentage(act.time);
                              return (
                                <div
                                  key={idx}
                                  style={{ left: `${pct}%` }}
                                  className="absolute -top-1 -translate-x-1/2 group/marker z-20 cursor-pointer"
                                  title={`${act.time}: ${act.title}`}
                                >
                                  {/* Pin dot */}
                                  <div className="w-5 h-5 rounded-full border border-white bg-[#BA5536] shadow-xs flex items-center justify-center text-[9px] font-bold text-white transition-all group-hover/marker:scale-125 group-hover/marker:bg-[#1E1C1A]">
                                    {idx + 1}
                                  </div>
                                  
                                  {/* Floating tooltip */}
                                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden group-hover/marker:flex flex-col items-center bg-[#1E1C1A] text-white text-[10px] font-sans px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-md z-30">
                                    <span className="font-bold text-[#F5F0E8]">{act.time}</span>
                                    <span className="text-[9px] text-[#E6DFD5]">{act.title}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="pt-2 flex items-center">
                          <button
                            type="button"
                            onClick={() => setActiveModalDay(activeDay)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#1E1C1A] bg-white hover:bg-[#1E1C1A] hover:text-white text-xs font-sans font-bold uppercase tracking-wider text-[#1E1C1A] transition-all duration-300 shadow-2xs cursor-pointer"
                          >
                            <Compass className="w-4 h-4 text-[#BA5536]" />
                            <span>Explore Day {toRomanNumeral(activeDay)} Overlay Map →</span>
                          </button>
                        </div>
                      </div>

                      {/* Stops layout for current day */}
                      <div className="relative flex flex-col">
                        {activities.map((act, idx) => {
                          const stopNum = idx + 1;
                          const isEven = idx % 2 === 0;
                          const ratingData = getActivityRating(act, idx);
                          const costInfo = formatCost(act);
                          const aiInsightText = getAiInsight(act, idx);
                          const transport = getTransportBetweenStops(activities[idx - 1], act, idx);
                          
                          const stopKey = `${activeDay}-${stopNum}`;
                          const isExpanded = !!expandedStops[stopKey];
                          const isSaved = !!savedStops[stopKey];
                          const showsAlts = !!showAlternatives[stopKey];
                          const alternatives = getAlternativeSuggestions(act, idx);
                          
                          const { crowdNote, weatherNote } = getContextAwareTip(act, idx);
                          const categoryStyle = getCategoryStyling(act);

                          // Category Classification for Dynamic Concierge Ribbon
                          const catLower = (act.category || act.type || '').toLowerCase();
                          const titleLower = (act.title || '').toLowerCase();
                          const isDining = catLower.includes('din') || catLower.includes('food') || catLower.includes('rest') || catLower.includes('cafe') || catLower.includes('bar') || catLower.includes('lunch') || catLower.includes('dinner') || catLower.includes('breakfast') || titleLower.includes('osteria') || titleLower.includes('trattoria') || titleLower.includes('restaurant') || titleLower.includes('cafe') || titleLower.includes('bistro') || titleLower.includes('gelat') || titleLower.includes('pizzeria') || titleLower.includes('tavern');
                          const isNature = !isDining && (catLower.includes('park') || catLower.includes('nature') || catLower.includes('garden') || catLower.includes('beach') || catLower.includes('walk') || catLower.includes('view') || catLower.includes('scenic') || titleLower.includes('park') || titleLower.includes('garden') || titleLower.includes('fountain') || titleLower.includes('plaza') || titleLower.includes('piazza') || titleLower.includes('villa borghese') || titleLower.includes('spanish steps'));

                          const ribbonTitle = isDining ? 'Table Reservation & Dining Guide' : (isNature ? 'Public Access & Visitor Guide' : 'Official Admission & Gateways');
                          const ribbonBadge = isDining ? '🍽️ Table Check' : (isNature ? '🌿 Open Access' : '⚡ Verified');
                          const ribbonEstLabel = isDining ? 'Est. Spend Range:' : (isNature ? 'Admission Status:' : 'Est. Rate:');
                          const ribbonEstValue = isNature && (costInfo.title.includes('Check') || costInfo.title === 'Free' || costInfo.title === '$0') ? 'Free Public Entry' : costInfo.title;
                          const ribbonSubtext = isDining ? 'Table reservations & menu recommendations' : (isNature ? 'Best visiting times & walking directions' : 'Skip-the-line options available');
                          
                          const ribbonBtnText = isDining ? 'Compare Table Gateways' : (isNature ? 'Visitor Access Gateways' : 'Compare 4 Gateways');
                          const ribbonActionLabel = isDining ? 'Reserve Table Online' : (isNature ? 'Google Maps View' : 'Check Viator Passes');
                          
                          // Clean venue/restaurant name extraction for accurate inline search queries
                          let cleanName = (act.title || '').trim();
                          const atMatch = cleanName.match(/\s(?:at|@|inside)\s+(.+)$/i);
                          if (atMatch && atMatch[1]) {
                            cleanName = atMatch[1].trim();
                          } else {
                            const verbMatch = cleanName.match(/^(?:visit|tour|guided tour|exploration|stroll|walk|sunset walk|afternoon|morning|evening|dinner|lunch|breakfast|drinks|cocktails|coffee|gelato|tasting|shopping)\s+(?:to|of|around|at|in)\s+(.+)$/i);
                            if (verbMatch && verbMatch[1]) {
                              cleanName = verbMatch[1].trim();
                            }
                          }
                          cleanName = cleanName
                            .replace(/\b(?:VIP|Fast-Track|Skip-the-Line|Priority|Exclusive|Guided|Tour|Exploration|Experience|Admission|Entry|Pass|Passes|Access)\b/gi, '')
                            .replace(/\s+/g, ' ')
                            .trim();
                          if (!cleanName || cleanName.length < 2) {
                            cleanName = (act.title || '').trim();
                          }
                          const cleanDest = itinerary?.destinationName ? itinerary.destinationName.split(',')[0].trim() : '';
                          const cleanSearchQuery = `${cleanName} ${cleanDest}`.trim();

                          const ribbonActionUrl = isDining
                            ? `https://www.google.com/search?q=${encodeURIComponent(`${cleanSearchQuery} reserve table`)}`
                            : (isNature 
                                ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanSearchQuery)}`
                                : `https://www.viator.com/searchResults/all?text=${encodeURIComponent(cleanSearchQuery)}`);


                          // Check for intentional pacing gaps (greater than 1 hour / 60 minutes)
                          let gapElement = null;
                          if (idx > 0) {
                            const prevStop = activities[idx - 1];
                            const prevEnd = getStopEndTimeMinutes(prevStop.time, prevStop.duration);
                            const currentStart = parseTimeToMinutes(act.time);
                            const diffMins = currentStart - prevEnd;
                            
                            if (diffMins > 60) {
                              const gapHours = (diffMins / 60).toFixed(1);
                              gapElement = (
                                <div className="my-6 py-5 px-6 rounded-2xl border border-dashed border-[#E6DFD5] bg-[#FDFBF7] text-center max-w-xl mx-auto relative z-10">
                                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#BA5536] font-bold block mb-1">
                                    Intentional Intermission
                                  </span>
                                  <p className="font-serif italic text-sm text-[#7A7268] leading-relaxed">
                                    “A quiet pacing break of {gapHours} hours. We recommend visiting a local espresso bar, resting at your hotel, or exploring the surrounding streets at your own leisure.”
                                  </p>
                                </div>
                              );
                            }
                          }

                          return (
                            <React.Fragment key={`${activeDay}-${idx}`}>
                              {/* Render Pacing Gap if applicable */}
                              {gapElement}

                              {/* Quiet Typographic Transit Line */}
                              {idx > 0 && transport && (
                                <div className="py-6 flex items-center justify-center gap-4 text-[#7A7268] relative z-10">
                                  <div className="h-px w-12 sm:w-24 bg-[#E6DFD5]" />
                                  <span className="font-serif italic text-xs sm:text-sm tracking-wide px-3 bg-[#FAF6F0] text-center">
                                    {transport.icon} {transport.text} between stops
                                  </span>
                                  <div className="h-px w-12 sm:w-24 bg-[#E6DFD5]" />
                                </div>
                              )}

                              {/* Large Editorial Spread Stops (Alternating Left/Right) */}
                              <motion.div 
                                id={`dining-stop-${activeDay}-${stopNum}`}
                                className={`py-12 sm:py-16 flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-8 lg:gap-12 relative z-10 border-b border-[#E6DFD5]/50 last:border-b-0`}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-80px" }}
                                transition={{ type: "spring", damping: 20, stiffness: 100 }}
                              >
                                {/* Timeline Spine badge */}
                                <div className="absolute left-6 sm:left-1/2 -top-5 -translate-x-1/2 w-10 h-10 rounded-full border border-[#1E1C1A] bg-[#FAF6F0] text-[#1E1C1A] font-serif text-xs font-bold flex items-center justify-center shadow-xs z-20 transition-all duration-300">
                                  {stopNum}
                                </div>

                                {/* Image Side Spread with subtle hover scale drift + Secondary detail box on wide viewports below image (Requirement 6) */}
                                <div className="w-full lg:w-1/2 flex flex-col gap-4 shrink-0">
                                  <div className="w-full h-80 sm:h-100 rounded-3xl overflow-hidden border border-[#E6DFD5] shadow-md relative group">
                                    <motion.img
                                      src={getActivityThumbnail(act, idx)}
                                      alt={act.title}
                                      className="w-full h-full object-cover object-center"
                                      whileHover={{ scale: 1.04 }}
                                      transition={{ duration: 0.6, ease: 'easeOut' }}
                                    />
                                    
                                    {/* Daylight time tag with Planned vs Booked check (Requirement 4) */}
                                    <div className="absolute top-4 left-4 px-3.5 py-1.5 rounded-full bg-[#1E1C1A]/85 backdrop-blur-sm text-white font-mono text-xs font-bold tracking-wider shadow-sm">
                                      {(() => {
                                        if (isDining) {
                                          try {
                                            const stored = localStorage.getItem(`tw_dining_res_${itinerary?.destinationName || 'Destination'}_d${activeDay}_s${stopNum}`);
                                            if (stored) {
                                              const parsed = JSON.parse(stored);
                                              if (parsed && (parsed.status === 'marked_reserved' || parsed.status === 'confirmed') && parsed.time && parsed.time !== act.time) {
                                                return `Planned ${act.time || '10:00 AM'}`;
                                              }
                                            }
                                          } catch (e) {}
                                        }
                                        return act.time || '10:00 AM';
                                      })()}
                                    </div>

                                    {/* Distinct Category stamp visual style */}
                                    <div className="absolute bottom-4 right-4 px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-xs text-[#1E1C1A] font-serif italic text-xs font-bold shadow-xs border border-[#E6DFD5]">
                                      {categoryStyle.icon} {categoryStyle.name}
                                    </div>
                                  </div>

                                  {/* Secondary detail card underneath image on wide viewports to balance column heights (`hidden lg:flex`) */}
                                  <div className="hidden lg:flex items-start gap-3.5 p-4 rounded-2xl border border-[#E6DFD5] bg-[#FAF6F0]/70 text-xs font-sans text-[#5F5E5A] shadow-2xs">
                                    <div className="w-9 h-9 rounded-xl bg-white border border-[#E6DFD5] flex items-center justify-center text-[#BA5536] shrink-0 mt-0.5 shadow-2xs">
                                      <MapPin className="w-4 h-4 stroke-[2.2]" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between gap-2 border-b border-[#E6DFD5]/60 pb-1.5 mb-1.5">
                                        <strong className="font-serif font-bold text-[#1E1C1A] text-sm tracking-tight">Getting There &amp; Local Note</strong>
                                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#7A7268] bg-white px-2 py-0.5 rounded-md border border-[#E6DFD5]">
                                          Stop #{stopNum} Pin
                                        </span>
                                      </div>
                                      <p className="font-serif text-xs text-[#4A443E] leading-relaxed">
                                        {act.location || `${cleanName}, ${cleanDest}`} — easily reached on foot or short local transit from the previous itinerary chapter stop.
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Editorial details side spread */}
                                <div className="w-full lg:w-1/2 flex flex-col justify-center px-2 lg:px-6">
                                  <div className="flex items-center justify-between gap-3 mb-2">
                                    <div className="flex items-center gap-2 text-xs font-sans tracking-widest uppercase text-[#7A7268] font-bold">
                                      <span>{act.time || '10:00 AM'}</span>
                                      <span className="text-[#BA5536] font-serif">•</span>
                                      
                                      {/* Micro-loop 3D hover rotating icon (Accesses Requirement 5) */}
                                      <motion.span
                                        whileHover={{ rotateY: 180, scale: 1.15 }}
                                        transition={{ type: "spring", stiffness: 150, damping: 10 }}
                                        className="inline-block cursor-pointer"
                                      >
                                        {categoryStyle.icon}
                                      </motion.span>
                                      
                                      <span>{categoryStyle.name}</span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => toggleSaveStop(stopKey)}
                                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-sans font-bold transition-all cursor-pointer ${
                                        isSaved
                                          ? 'border-[#BA5536] bg-[#BA5536]/10 text-[#BA5536]'
                                          : 'border-[#E6DFD5] bg-white text-[#7A7268] hover:border-[#1E1C1A]'
                                      }`}
                                    >
                                      <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-[#BA5536]' : ''}`} />
                                      <span>{isSaved ? 'Saved' : 'Bookmark'}</span>
                                    </button>
                                  </div>

                                  <h3 className="text-2xl sm:text-4xl font-serif font-black text-[#1E1C1A] tracking-tight leading-snug mb-3">
                                    {act.title}
                                  </h3>

                                  {/* Clean stats row (Requirement 5: fix duplicate reviews word) */}
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm font-sans font-medium text-[#5F5E5A] mb-3">
                                    <span className="text-amber-600 font-bold">★★★★★ {ratingData.rating}</span>
                                    <span>({String(ratingData?.reviews || '12k').replace(/\s*reviews?\s*/i, '').trim()} reviews)</span>
                                    <span className="text-[#E6DFD5] font-serif">•</span>
                                    <span className="font-bold text-[#1E1C1A]">{costInfo.title}</span>
                                    {act.duration && (
                                      <>
                                        <span className="text-[#E6DFD5] font-serif">•</span>
                                        <span>Duration: <strong>{act.duration}</strong></span>
                                      </>
                                    )}
                                  </div>

                                  {/* Highlight: "Why this was chosen" */}
                                  <div className="text-xs font-sans italic text-[#BA5536] mb-4 bg-[#BA5536]/5 px-3 py-1.5 rounded-lg border-l border-[#BA5536]">
                                    ✓ Chosen for: High local authenticity, scenic context, and balanced timing pacing.
                                  </div>

                                  {/* One-Line Hook Description */}
                                  <p className="text-base sm:text-lg font-serif text-[#4A443E] leading-relaxed mb-4">
                                    {act.description?.split('.')[0] || 'Explore the breathtaking landscapes and cultural history at this custom stop.'}.
                                  </p>

                                  {/* OPTION 1: Ultra-Premium Editorial Admission & Ticket Ribbon OR Inline Dining Reservation */}
                                  {isDining ? (
                                    <div className="mb-5">
                                      <InlineDiningReservation
                                        activity={act}
                                        destinationName={itinerary?.destinationName || 'Destination'}
                                        dayNumber={activeDay}
                                        stopNumber={stopNum}
                                        onStatusChange={handleDiningBookingsChange}
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-full rounded-2xl border border-[#E6DFD5] bg-[#FAF6F0]/80 p-4 sm:p-5 mb-5 shadow-2xs hover:border-[#BA5536]/40 transition-all duration-300 relative overflow-hidden group">
                                      {/* Decorative subtle terracotta glow */}
                                      <div className="absolute -right-12 -top-12 w-36 h-36 bg-[#BA5536]/10 rounded-full blur-2xl pointer-events-none group-hover:bg-[#BA5536]/15 transition-all duration-500" />
                                      
                                      {/* Top Row: Icon + Title + Est Rate */}
                                      <div className="flex items-start justify-between gap-3 relative z-10 mb-3.5 pb-3.5 border-b border-[#E6DFD5]/70">
                                        <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-xl bg-white border border-[#E6DFD5] shadow-2xs flex items-center justify-center text-[#BA5536] shrink-0 group-hover:scale-105 transition-transform duration-300">
                                            {isNature ? <MapPin className="w-5 h-5 stroke-[2.2]" /> : <Ticket className="w-5 h-5 stroke-[2.2]" />}
                                          </div>
                                          <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <h4 className="font-serif font-bold text-sm sm:text-base text-[#1E1C1A] tracking-tight leading-none">
                                                {ribbonTitle}
                                              </h4>
                                              <span className="px-2 py-0.5 rounded-full bg-[#BA5536]/10 border border-[#BA5536]/25 text-[#BA5536] font-mono text-[9px] font-bold tracking-wider uppercase">
                                                {ribbonBadge}
                                              </span>
                                            </div>
                                            <p className="text-xs font-sans text-[#5F5E5A] mt-1 flex items-center gap-1.5 flex-wrap">
                                              <span>{ribbonEstLabel} <strong className="text-[#1E1C1A]">{ribbonEstValue}</strong></span>
                                              <span className="text-[#C8BFB2] font-serif">•</span>
                                              <span>{ribbonSubtext}</span>
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Bottom Row: 2 Clean Buttons in an even grid */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 relative z-10">
                                        <button
                                          type="button"
                                          onClick={() => setActivePassModal({ activity: act, stopNum: stopNum })}
                                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E1C1A] hover:bg-[#2A2623] text-white text-xs font-sans font-bold shadow-sm transition-all duration-200 cursor-pointer hover:scale-[1.01] active:scale-95"
                                        >
                                          {isNature ? <MapPin className="w-3.5 h-3.5 text-[#BA5536] shrink-0" /> : <Ticket className="w-3.5 h-3.5 text-[#BA5536] shrink-0" />}
                                          <span>{ribbonBtnText}</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            window.open(ribbonActionUrl, '_blank', 'noopener,noreferrer');
                                          }}
                                          className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E6DFD5] hover:border-[#BA5536] bg-white text-[#1E1C1A] hover:text-[#BA5536] text-xs font-sans font-bold shadow-2xs transition-all duration-200 cursor-pointer group/btn"
                                          title={ribbonActionLabel}
                                        >
                                          <span>{ribbonActionLabel}</span>
                                          <ExternalLink className="w-3.5 h-3.5 text-[#7A7268] group-hover/btn:text-[#BA5536] shrink-0 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* PROGRESSIVE DISCLOSURE ACTIONS */}
                                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() => toggleExpandStop(stopKey)}
                                      className="inline-flex items-center gap-1 px-4 py-2 rounded-full border border-[#1E1C1A] hover:bg-[#1E1C1A] hover:text-[#FAF6F0] bg-white text-xs font-sans font-bold uppercase tracking-wider text-[#1E1C1A] transition-all cursor-pointer shadow-2xs"
                                    >
                                      <span>{isExpanded ? 'Hide Dossier Details' : 'Read Detailed Dossier Notes'}</span>
                                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => toggleAlternatives(stopKey)}
                                      className="inline-flex items-center gap-1 px-4 py-2 rounded-full border border-[#E6DFD5] hover:border-[#BA5536] hover:text-[#BA5536] bg-white text-xs font-sans text-[#7A7268] transition-all cursor-pointer"
                                    >
                                      <span>Alternatives</span>
                                      {showsAlts ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>

                                  {/* Collapsible Dossier Details Panel (Smooth Framer Motion) */}
                                  <AnimatePresence initial={false}>
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden w-full mt-4"
                                      >
                                        <div className="pt-3 pb-4 border-t border-[#E6DFD5] flex flex-col gap-4 text-sm text-[#4A443E]">
                                          
                                          <p className="font-serif leading-relaxed text-base">
                                            {act.description || 'Detailed historical context and neighborhood guide maps.'}
                                          </p>

                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/70 p-4 rounded-2xl border border-[#E6DFD5]">
                                            <div className="flex items-start gap-2">
                                              <Info className="w-4 h-4 text-[#BA5536] shrink-0 mt-0.5" />
                                              <div>
                                                <strong className="block text-xs font-sans uppercase tracking-wider text-[#7A7268]">Concierge Crowd Tip</strong>
                                                <p className="text-xs font-serif italic text-[#5F5E5A] mt-0.5">{crowdNote}</p>
                                              </div>
                                            </div>
                                            
                                            <div className="flex items-start gap-2">
                                              <Sun className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                              <div>
                                                <strong className="block text-xs font-sans uppercase tracking-wider text-[#7A7268]">Daylight &amp; Weather Alert</strong>
                                                <p className="text-xs font-serif italic text-[#5F5E5A] mt-0.5">{weatherNote}</p>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Concierge handwritten notes */}
                                          <div className="p-5 sm:p-6 rounded-2xl bg-[#F3EFEA] border-l-2 border-[#BA5536] relative shadow-2xs">
                                            <span className="font-serif text-3xl text-[#BA5536] absolute top-1.5 left-4 leading-none select-none">“</span>
                                            <p className="font-serif italic text-sm sm:text-base text-[#3E3A36] pl-5 leading-relaxed">
                                              {aiInsightText}
                                            </p>
                                            <span className="block text-[10px] font-sans uppercase tracking-widest text-[#7A7268] pl-5 pt-3 font-bold">
                                              — TripWise Concierge Custom Insight
                                            </span>
                                          </div>

                                          <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-[#E6DFD5] text-xs font-sans">
                                            <span className="text-[#7A7268]">Reservation Booking Details:</span>
                                            <strong className="text-[#1E1C1A]">Reservation: Not Required (Walk-in Accepted)</strong>
                                          </div>

                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>

                                  {/* Alternatives Toggle Section */}
                                  <AnimatePresence>
                                    {showsAlts && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden w-full mt-3"
                                      >
                                        <div className="p-4 rounded-2xl bg-white border border-[#E6DFD5] flex flex-col gap-3.5">
                                          <h4 className="text-xs font-sans font-bold uppercase tracking-widest text-[#BA5536] border-b border-[#E6DFD5] pb-2">
                                            Nearby Alternatives (Dossier Backup Choices)
                                          </h4>
                                          {alternatives.map((alt, altIdx) => (
                                            <div key={altIdx} className="text-xs">
                                              <strong className="block text-[#1E1C1A] text-sm font-serif">{alt.title}</strong>
                                              <p className="text-[#5F5E5A] font-serif italic mt-0.5 leading-relaxed">{alt.desc}</p>
                                            </div>
                                          ))}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>

                              </motion.div>
                            </React.Fragment>
                          );
                        })}
                      </div>

                      {/* Day navigation footer pagination & Dining status rollup */}
                      <div className="mt-12 pt-6 border-t border-[#E6DFD5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs font-sans text-[#7A7268] font-medium">
                            End of Chapter {toRomanNumeral(activeDay)}
                          </span>
                          {dayDiningRollup.total > 0 && (
                            <button
                              type="button"
                              onClick={() => scrollToFirstUnbookedDining(dayDiningRollup.firstUnbooked)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#BA5536]/30 bg-[#BA5536]/10 text-[#BA5536] font-sans text-xs font-bold hover:bg-[#BA5536]/20 transition-all cursor-pointer shadow-2xs"
                            >
                              <Utensils className="w-3.5 h-3.5 shrink-0" />
                              <span>{dayDiningRollup.confirmed} of {dayDiningRollup.total} table reservations confirmed</span>
                            </button>
                          )}
                        </div>
                        
                        <button
                          onClick={() => {
                            if (activeDay < days.length) {
                              setActiveDay(activeDay + 1);
                            } else {
                              setActiveDay('epilogue');
                            }
                            if (typeof window !== 'undefined') {
                              window.scrollTo({ top: 380, behavior: 'smooth' });
                            }
                          }}
                          className="px-5 py-2.5 rounded-full bg-[#1E1C1A] text-white hover:bg-[#BA5536] text-xs font-sans font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
                        >
                          <span>{activeDay < days.length ? `Next Chapter (Day ${toRomanNumeral(activeDay + 1)})` : "Go to Epilogue"}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })()
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </main>

      {/* OVERLAY MAP MODAL (InteractiveRouteMap - Itinerary View) */}
      <AnimatePresence>
        {activeModalDay !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
            onClick={() => setActiveModalDay(null)}
          >
            <motion.div
              ref={mapModalRef}
              initial={{ scale: 0.96, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 16 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
              className="bg-[#FAF6F0] w-full max-w-5xl h-[85vh] rounded-3xl overflow-hidden shadow-2xl border border-[#E6DFD5] flex flex-col relative"
              style={{ willChange: 'transform, opacity' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6DFD5] shrink-0 bg-[#FAF6F0]">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-[#1E1C1A]">
                    Day {activeModalDay} · Route Map
                  </h3>
                  <p className="text-xs text-[#7A7268] mt-0.5">
                    {days.find(d => (d.dayNumber || 1) === activeModalDay)?.title || itinerary.destinationName}
                  </p>
                </div>
                <button
                  onClick={() => setActiveModalDay(null)}
                  className="w-8 h-8 rounded-full bg-[#F0EBE4] hover:bg-[#E6DFD5] text-[#7A7268] hover:text-[#1E1C1A] flex items-center justify-center transition-all duration-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Map fills remaining height — mounted after modal animation settles */}
              <div className="flex-1 min-h-0">
                {mapMounted && (
                  <ItineraryMapModal
                    activities={days.find(d => (d.dayNumber || 1) === activeModalDay)?.activities || days[activeModalDay - 1]?.activities || []}
                    coordinates={itinerary.coordinates || { lat: 41.9028, lng: 12.4964 }}
                    destinationName={itinerary.destinationName || 'Destination'}
                  />
                )}
                {!mapMounted && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#FAF6F0]">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-[#BA5536]/30 border-t-[#BA5536] animate-spin" />
                      <span className="text-xs font-serif text-[#7A7268]">Loading map…</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dossier VIP Ticket & Admission Pass Modal (Option 2) */}
      <TicketPassModal
        isOpen={Boolean(activePassModal)}
        onClose={() => setActivePassModal(null)}
        activity={activePassModal?.activity}
        destinationName={itinerary?.destinationName || 'Destination'}
        dayNumber={activeDay === 'epilogue' ? 1 : activeDay}
        stopNumber={activePassModal?.stopNum || 1}
      />

      <footer className="py-12 text-center text-xs font-serif italic text-[#7A7268] border-t border-[#E6DFD5] bg-white mt-auto">
        TripWise Private Travel Concierge · Published Dossier Guide · Powered by Google Gemini
      </footer>
    </div>
  );
}
