'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronRight,
  Compass,
  Calendar,
  ArrowUpRight,
  Check,
  Printer
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

const InteractiveRouteMap = dynamic(() => import('../components/InteractiveRouteMap'), { ssr: false });

// Helper to convert day numbers to Roman Numerals for editorial chapter headings
const toRomanNumeral = (num) => {
  const romanMap = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X' };
  return romanMap[num] || String(num);
};

export default function ItineraryPage() {
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeModalDay, setActiveModalDay] = useState(null); // When !== null, shows modal map overlay for that day
  const [hoveredStopIdx, setHoveredStopIdx] = useState(null);
  const [selectedStopIdx, setSelectedStopIdx] = useState(null);
  const [savedStops, setSavedStops] = useState({});
  const [shareCopied, setShareCopied] = useState(false);

  // Load itinerary from localStorage on mount
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
        <p className="text-sm font-serif italic text-[#7A7268] tracking-wide">Assembling your private travel dossier...</p>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] text-[#1E1C1A] flex flex-col justify-between font-sans selection:bg-[#BA5536]/15">
        <Header />
        <div className="max-w-xl mx-auto px-6 py-32 text-center my-auto">
          <div className="w-16 h-16 rounded-full border border-[#E6DFD5] bg-[#F5F0E8] text-[#BA5536] flex items-center justify-center mx-auto mb-6 text-2xl shadow-xs font-serif italic">
            I
          </div>
          <h1 className="text-4xl font-serif font-black tracking-tight mb-3 text-[#1E1C1A]">No Dossier Found</h1>
          <p className="text-base font-serif italic text-[#7A7268] leading-relaxed mb-8">
            Your private itinerary has not been assembled yet. Return to the AI Planner to craft your customized itinerary with our intelligent concierge.
          </p>
          <a
            href="/ai-planner"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-sans text-xs font-bold uppercase tracking-wider bg-[#1E1C1A] text-[#FAF6F0] hover:bg-[#BA5536] transition-all duration-300 shadow-md"
          >
            <span>Create Itinerary in Planner →</span>
          </a>
        </div>
        <footer className="py-8 text-center text-xs font-serif italic text-[#7A7268] border-t border-[#E6DFD5]/60">
          TripWise Private Travel Concierge · Typeset Dossier Guide
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

  const totalHoursEst = days.reduce((acc, d, i) => {
    const summary = getDaySummary(d, i, days);
    const num = parseFloat(summary?.stats?.hours || '6');
    return acc + (isNaN(num) ? 6 : num);
  }, 0).toFixed(1);

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#1E1C1A] flex flex-col font-sans selection:bg-[#BA5536]/15">
      <Header />

      {/* HERO SECTION: Full-Bleed Destination Image with Editorial Display Typography */}
      <section className="relative w-full min-h-[620px] md:min-h-[700px] pt-32 pb-16 px-6 flex flex-col justify-end overflow-hidden border-b border-[#E6DFD5]">
        {/* Full-bleed background image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={itinerary.heroImage || "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=2000&q=85"}
            alt={itinerary.destinationName || 'Destination'}
            className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-linear-to-t from-[#FAF6F0] via-[#FAF6F0]/75 to-black/45" />
          <div className="absolute inset-0 bg-radial from-transparent via-transparent to-[#1E1C1A]/20 pointer-events-none" />
        </div>

        {/* Editorial Dossier Header Content */}
        <div className="max-w-5xl mx-auto w-full relative z-10 flex flex-col gap-5 pt-12">
          {/* Subtle Top Dossier Stamp */}
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1 rounded-full border border-[#BA5536]/40 bg-[#FAF6F0]/90 backdrop-blur-sm text-[#BA5536] font-mono text-[11px] font-bold tracking-widest uppercase shadow-2xs">
              Private Travel Dossier
            </span>
            <span className="text-xs font-serif italic text-[#4A443E]/90 hidden sm:inline">
              Verified &amp; Typeset by TripWise Concierge
            </span>
          </div>

          {/* Editorial Serif Display Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-black tracking-tight text-[#1E1C1A] leading-[1.06] drop-shadow-xs">
            {itinerary.destinationName || 'Curated Journey'}
          </h1>

          {/* One-line Vibe Subtitle */}
          <p className="text-lg sm:text-2xl font-serif italic text-[#4A443E] max-w-3xl leading-relaxed">
            “{itinerary.tagline || 'An immersive, thoughtfully paced exploration tailored to your unique architectural, culinary, and cultural preferences.'}”
          </p>

          {/* Minimal Trip Meta as Understated Typographic Text (NO Boxed Pill Buttons!) */}
          <div className="pt-3 border-t border-[#E6DFD5]/80 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm font-sans tracking-wide text-[#5F5E5A] uppercase">
            <span className="font-bold text-[#1E1C1A]">{days.length} Day Chapter{days.length > 1 ? 's' : ''}</span>
            <span className="text-[#BA5536] font-serif">•</span>
            <span>{totalStopsCount} Curated Experiences</span>
            <span className="text-[#BA5536] font-serif">•</span>
            <span>Est. Budget: <strong className="text-[#1E1C1A]">{itinerary.estimatedCost || '$1,450'}</strong></span>
            <span className="text-[#BA5536] font-serif">•</span>
            <span>Pacing: <strong className="text-[#1E1C1A]">Relaxed &amp; Immersive</strong></span>
          </div>
        </div>
      </section>

      {/* STICKY CHAPTER NAVIGATION & DOSSIER ACTION BAR */}
      <div className="sticky top-16 sm:top-18 z-40 bg-[#FAF6F0]/95 backdrop-blur-md border-b border-[#E6DFD5] py-3.5 px-6 shadow-xs transition-all">
        <div className="max-w-5xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left: Quick Chapter Jump Strip */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
            <span className="text-[11px] font-serif italic text-[#7A7268] mr-1 hidden md:inline">Jump to Chapter:</span>
            {days.map((day, dIdx) => {
              const dayNum = day.dayNumber || dIdx + 1;
              return (
                <a
                  key={dayNum}
                  href={`#chapter-day-${dayNum}`}
                  className="px-3.5 py-1.5 rounded-full border border-[#E6DFD5] bg-white/80 hover:bg-[#1E1C1A] hover:text-[#FAF6F0] hover:border-[#1E1C1A] text-xs font-serif font-semibold text-[#1E1C1A] transition-all duration-200 shrink-0 select-none shadow-2xs"
                >
                  Day {toRomanNumeral(dayNum)}
                </a>
              );
            })}
            <a
              href="#chapter-epilogue"
              className="px-3.5 py-1.5 rounded-full border border-[#E6DFD5] bg-[#F5F0E8] hover:bg-[#BA5536] hover:text-white text-xs font-serif italic text-[#4A443E] transition-all duration-200 shrink-0 select-none shadow-2xs"
            >
              Epilogue
            </a>
          </div>

          {/* Right: Persistent But Unobtrusive Action Bar */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {/* Download PDF button */}
            <button
              type="button"
              onClick={handlePrintOrDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#E6DFD5] bg-white text-xs font-sans font-bold text-[#1E1C1A] hover:bg-[#F5F0E8] transition-all cursor-pointer shadow-2xs"
              title="Download or Print Dossier"
            >
              <Printer className="w-3.5 h-3.5 text-[#BA5536]" />
              <span>Download PDF</span>
            </button>

            {/* Share button */}
            <button
              type="button"
              onClick={handleShareDossier}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#E6DFD5] bg-white text-xs font-sans font-bold text-[#1E1C1A] hover:bg-[#F5F0E8] transition-all cursor-pointer shadow-2xs"
            >
              {shareCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied Link!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[#BA5536]" />
                  <span>Share Dossier</span>
                </>
              )}
            </button>

            {/* Single Subtle Editing Affordance Allowed */}
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

      {/* MAIN DOSSIER CONTENT CONTAINER */}
      <main className="max-w-5xl mx-auto px-6 py-12 w-full flex flex-col gap-20">
        
        {/* SECTION 1: DOSSIER AT A GLANCE (Overview Index Table of Contents) */}
        <section className="bg-white rounded-3xl border border-[#E6DFD5] p-8 sm:p-10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-[#BA5536]/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E6DFD5]">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#BA5536] font-bold block mb-1">
                Table of Contents
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#1E1C1A] tracking-tight">
                The Dossier at a Glance
              </h2>
            </div>
            <p className="text-xs font-serif italic text-[#7A7268] max-w-xs">
              A chronological overview of daily themes and territorial foci before diving into full spreads.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
            {days.map((day, idx) => {
              const dayNum = day.dayNumber || idx + 1;
              const summary = getDaySummary(day, idx, days);
              return (
                <div
                  key={dayNum}
                  className="flex flex-col justify-between p-6 rounded-2xl bg-[#FAF6F0] border border-[#E6DFD5]/80 hover:border-[#BA5536]/60 transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 rounded-md bg-[#1E1C1A] text-[#FAF6F0] font-serif text-xs font-bold tracking-wider">
                        Chapter {toRomanNumeral(dayNum)}
                      </span>
                      <span className="text-xs font-sans text-[#7A7268] font-semibold">
                        Day {dayNum}
                      </span>
                    </div>
                    <h3 className="text-lg font-serif font-bold text-[#1E1C1A] leading-snug group-hover:text-[#BA5536] transition-colors">
                      {day.title || `Day ${dayNum} Exploration`}
                    </h3>
                    <p className="text-xs font-serif italic text-[#7A7268] mt-2 line-clamp-2 leading-relaxed">
                      {day.activities?.[0]?.description || 'Architectural landmarks, hidden quarters, and acclaimed local dining.'}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#E6DFD5] flex items-center justify-between text-[11px] font-sans text-[#5F5E5A]">
                    <span>{day.activities?.length || 0} Curated Stops</span>
                    <span>{summary?.stats?.hours || '6.5h'}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveModalDay(dayNum)}
                    className="mt-4 w-full py-2 px-3 rounded-xl border border-[#E6DFD5] bg-white hover:bg-[#BA5536] hover:border-[#BA5536] hover:text-white text-[#1E1C1A] font-sans text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#BA5536] group-hover:text-white" />
                    <span>View Day {toRomanNumeral(dayNum)} Map Overlay</span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: THE EDITORIAL CHAPTERS (Day 1, Day 2, Day 3...) */}
        <div className="flex flex-col gap-28">
          {days.map((day, dIdx) => {
            const dayNum = day.dayNumber || dIdx + 1;
            const summary = getDaySummary(day, dIdx, days);
            const activities = day.activities || [];

            return (
              <section
                key={dayNum}
                id={`chapter-day-${dayNum}`}
                className="scroll-mt-32 flex flex-col pt-4"
              >
                {/* Chapter Header Banner */}
                <div className="border-b-2 border-[#1E1C1A] pb-8 mb-12 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs font-mono uppercase tracking-widest text-[#BA5536] font-extrabold">
                      CHAPTER {toRomanNumeral(dayNum)}  —  DAY {dayNum}
                    </span>
                    
                    {/* Clean Typographic Summary Stats (NO Icon-Badge Rows!) */}
                    <div className="flex items-center gap-2 text-xs font-sans font-semibold text-[#5F5E5A] tracking-wide">
                      <span>{activities.length} Stops</span>
                      <span className="text-[#BA5536] font-serif">•</span>
                      <span>{summary?.stats?.hours || '6.5 Hours Total'}</span>
                      <span className="text-[#BA5536] font-serif">•</span>
                      <span>{summary?.stats?.distance || '3.2 km On Foot'}</span>
                      <span className="text-[#BA5536] font-serif">•</span>
                      <span className="text-[#1E1C1A] font-bold">{summary?.stats?.cost || 'Est. €85'}</span>
                    </div>
                  </div>

                  <h2 className="text-3xl sm:text-5xl font-serif font-black text-[#1E1C1A] tracking-tight leading-tight">
                    {day.title || `Day ${dayNum} Exploration`}
                  </h2>

                  {/* Short Narrative Intro Line */}
                  <p className="text-lg sm:text-xl font-serif italic text-[#4A443E] leading-relaxed max-w-4xl">
                    {activities.length > 0
                      ? `“We begin our morning traversing the architectural marvel of ${activities[0].title}, winding through historic boulevards before concluding with evening gastronomy at ${activities[activities.length - 1].title}.”`
                      : `“A carefully sequenced day exploring historical highlights and authentic neighborhood culture.”`
                    }
                  </p>

                  {/* Optional Map Overlay Button Trigger for this Chapter */}
                  <div className="pt-2 flex items-center">
                    <button
                      type="button"
                      onClick={() => setActiveModalDay(dayNum)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#1E1C1A] bg-white hover:bg-[#1E1C1A] hover:text-white text-xs font-sans font-bold uppercase tracking-wider text-[#1E1C1A] transition-all duration-300 shadow-2xs cursor-pointer"
                    >
                      <Compass className="w-4 h-4 text-[#BA5536]" />
                      <span>Explore Chapter {toRomanNumeral(dayNum)} Route Map Overlay →</span>
                    </button>
                  </div>
                </div>

                {/* Chapter Stops Spreads with Timeline Spine */}
                <div className="relative flex flex-col">
                  {/* Subtle color-shifting timeline spine connecting stops within the day */}
                  <div className="absolute left-6 sm:left-1/2 top-12 bottom-12 w-px bg-linear-to-b from-[#C5A059] via-[#BA5536] to-[#4A3E4D] hidden sm:block pointer-events-none opacity-40" />

                  {activities.map((act, idx) => {
                    const stopNum = idx + 1;
                    const isEven = idx % 2 === 0;
                    const ratingData = getActivityRating(act, idx);
                    const costInfo = formatCost(act);
                    const aiInsightText = getAiInsight(act, idx);
                    const transport = getTransportBetweenStops(activities[idx - 1], act, idx);
                    const stopKey = `${dayNum}-${stopNum}`;
                    const isSaved = !!savedStops[stopKey];

                    return (
                      <React.Fragment key={`${dayNum}-${idx}`}>
                        {/* Quiet Typographic Transit Connector Between Stops (NO Boxed Chips!) */}
                        {idx > 0 && transport && (
                          <div className="py-8 my-2 flex items-center justify-center gap-4 text-[#7A7268] relative z-10">
                            <div className="h-px w-12 sm:w-24 bg-[#E6DFD5]" />
                            <span className="font-serif italic text-xs sm:text-sm tracking-wide px-3 bg-[#FAF6F0] text-center">
                              {transport.icon} {transport.text} between stops
                            </span>
                            <div className="h-px w-12 sm:w-24 bg-[#E6DFD5]" />
                          </div>
                        )}

                        {/* Large Editorial Spread (Alternating Image-Left / Image-Right) */}
                        <div className={`py-12 sm:py-16 flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-8 lg:gap-12 relative z-10 border-b border-[#E6DFD5]/50 last:border-b-0`}>
                          
                          {/* Timeline Spine Node Stamp */}
                          <div className="absolute left-6 sm:left-1/2 -top-4 sm:-top-5 -translate-x-1/2 w-9 h-9 rounded-full border border-[#1E1C1A] bg-[#FAF6F0] text-[#1E1C1A] font-serif text-xs font-bold flex items-center justify-center shadow-xs z-20">
                            {stopNum}
                          </div>

                          {/* Spread Imagery Column */}
                          <div className="w-full lg:w-1/2 h-72 sm:h-96 rounded-3xl overflow-hidden border border-[#E6DFD5] shadow-md relative group shrink-0">
                            <img
                              src={getActivityThumbnail(act, idx)}
                              alt={act.title}
                              className="w-full h-full object-cover object-center transform transition-transform duration-700 ease-out group-hover:scale-105"
                              loading="lazy"
                            />
                            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-[#1E1C1A]/85 backdrop-blur-sm text-white font-mono text-xs font-bold tracking-wider">
                              {act.time || '10:00 AM'}
                            </div>
                            <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-[#1E1C1A] font-serif italic text-xs font-bold shadow-xs">
                              Stop {stopNum} of {activities.length}
                            </div>
                          </div>

                          {/* Spread Editorial Typography Column */}
                          <div className="w-full lg:w-1/2 flex flex-col justify-center px-2 lg:px-6">
                            {/* Metadata & Category Header */}
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2 text-xs font-sans tracking-widest uppercase text-[#7A7268] font-bold">
                                <span>{act.time || '10:00 AM'}</span>
                                <span className="text-[#BA5536] font-serif">•</span>
                                <span>{act.category || 'Curated Stop'}</span>
                              </div>

                              {/* Save Bookmark button */}
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
                                <span>{isSaved ? 'Bookmarked' : 'Bookmark'}</span>
                              </button>
                            </div>

                            {/* Stop Title */}
                            <h3 className="text-2xl sm:text-4xl font-serif font-black text-[#1E1C1A] tracking-tight leading-snug mb-3">
                              {act.title}
                            </h3>

                            {/* Rating, Price & Duration as Understated Text */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm font-sans font-medium text-[#5F5E5A] mb-4">
                              <span className="text-amber-600 font-bold">★★★★★ {ratingData.rating}</span>
                              <span>({ratingData.reviews} verified reviews)</span>
                              <span className="text-[#BA5536] font-serif">•</span>
                              <span className="font-bold text-[#1E1C1A]">{costInfo.title}</span>
                              {act.duration && (
                                <>
                                  <span className="text-[#BA5536] font-serif">•</span>
                                  <span>Allocated: <strong>{act.duration}</strong></span>
                                </>
                              )}
                            </div>

                            {/* Description Copy */}
                            <p className="text-base sm:text-lg font-serif text-[#4A443E] leading-relaxed font-normal">
                              {act.description}
                            </p>

                            {/* AI Insight Styled as a Concierge's Handwritten Note */}
                            <div className="mt-6 p-6 rounded-2xl bg-[#F3EFEA] border-l-2 border-[#BA5536] relative shadow-2xs">
                              <span className="font-serif text-4xl text-[#BA5536] absolute top-2 left-4 leading-none select-none">
                                “
                              </span>
                              <p className="font-serif italic text-sm sm:text-base text-[#3E3A36] pl-6 leading-relaxed">
                                {aiInsightText}
                              </p>
                              <span className="block text-[11px] font-sans uppercase tracking-widest text-[#7A7268] pl-6 pt-3 font-semibold">
                                — TripWise Private Concierge Note
                              </span>
                            </div>
                          </div>

                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* SECTION 3: THE EPILOGUE (End-of-Trip Summary Block) */}
        <section id="chapter-epilogue" className="scroll-mt-32 mt-16 pt-16 border-t-2 border-[#1E1C1A] flex flex-col gap-10">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-mono uppercase tracking-widest text-[#BA5536] font-extrabold block mb-2">
              THE EPILOGUE  —  DOSSIER CONCLUSION
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif font-black text-[#1E1C1A] tracking-tight leading-tight mb-4">
              Your Journey at a Glance
            </h2>
            <p className="text-base sm:text-lg font-serif italic text-[#4A443E] leading-relaxed">
              “From ancient monuments to intimate evening dining, this itinerary represents an ideal synthesis of cultural depth, culinary excellence, and comfortable transit pacing across {itinerary.destinationName || 'your destination'}.”
            </p>
          </div>

          {/* Clean Typographic Stats Block (NO Icon-Badge Rows!) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 p-8 rounded-3xl bg-[#FAF6F0] border border-[#E6DFD5] text-center">
            <div className="flex flex-col gap-1 border-r border-[#E6DFD5] last:border-r-0">
              <span className="text-xs font-sans uppercase tracking-widest text-[#7A7268]">Total Duration</span>
              <span className="text-2xl sm:text-3xl font-serif font-black text-[#1E1C1A]">{days.length} Days</span>
            </div>
            <div className="flex flex-col gap-1 border-r border-[#E6DFD5] last:border-r-0">
              <span className="text-xs font-sans uppercase tracking-widest text-[#7A7268]">Curated Stops</span>
              <span className="text-2xl sm:text-3xl font-serif font-black text-[#1E1C1A]">{totalStopsCount} Stops</span>
            </div>
            <div className="flex flex-col gap-1 border-r border-[#E6DFD5] last:border-r-0">
              <span className="text-xs font-sans uppercase tracking-widest text-[#7A7268]">Walking Distance</span>
              <span className="text-2xl sm:text-3xl font-serif font-black text-[#1E1C1A]">~{totalDistanceEst} km</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-sans uppercase tracking-widest text-[#7A7268]">Estimated Budget</span>
              <span className="text-2xl sm:text-3xl font-serif font-black text-[#BA5536]">{itinerary.estimatedCost || '$1,450'}</span>
            </div>
          </div>

          {/* Final Action Bar & Concierge Stamp */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-[#E6DFD5]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1E1C1A] text-[#FAF6F0] flex items-center justify-center font-serif italic text-lg font-bold">
                T
              </div>
              <div>
                <h4 className="text-sm font-serif font-bold text-[#1E1C1A]">TripWise Private Concierge</h4>
                <p className="text-xs font-sans text-[#7A7268]">Dossier Ref: TW-{Math.floor(100000 + Math.random() * 900000)} • Document Locked</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap justify-center">
              <button
                type="button"
                onClick={handlePrintOrDownload}
                className="px-6 py-3 rounded-full border border-[#1E1C1A] bg-[#1E1C1A] text-[#FAF6F0] hover:bg-[#BA5536] hover:border-[#BA5536] text-xs font-sans font-bold uppercase tracking-wider transition-all duration-300 shadow-md cursor-pointer flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Download Dossier PDF</span>
              </button>
              <a
                href="/ai-planner"
                className="px-6 py-3 rounded-full border border-[#E6DFD5] bg-white text-[#1E1C1A] hover:border-[#BA5536] hover:text-[#BA5536] text-xs font-sans font-bold uppercase tracking-wider transition-all duration-300 shadow-2xs flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit in Planner →</span>
              </a>
            </div>
          </div>
        </section>

      </main>

      {/* OPTIONAL ROUTE MAP OVERLAY (NEVER A FIXED 50/50 SPLIT!) */}
      <AnimatePresence>
        {activeModalDay !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
            onClick={() => setActiveModalDay(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#FAF6F0] w-full max-w-5xl h-[85vh] rounded-3xl overflow-hidden shadow-2xl border border-[#E6DFD5] flex flex-col"
            >
              {/* Modal Overlay Header */}
              <div className="px-6 py-4 border-b border-[#E6DFD5] bg-white flex items-center justify-between shrink-0">
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-[#BA5536] font-bold block">
                    INTERACTIVE OVERLAY MAP
                  </span>
                  <h3 className="text-lg sm:text-xl font-serif font-black text-[#1E1C1A]">
                    Chapter {toRomanNumeral(activeModalDay)} — Day {activeModalDay} Route Dossier
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveModalDay(null)}
                  className="px-4 py-2 rounded-full border border-[#E6DFD5] bg-[#FAF6F0] hover:bg-[#1E1C1A] hover:text-white text-xs font-sans font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <X className="w-4 h-4" />
                  <span>Close Map Overlay</span>
                </button>
              </div>

              {/* Modal Body with GeoEngine InteractiveRouteMap */}
              <div className="flex-1 w-full relative bg-stone-100 overflow-hidden">
                <InteractiveRouteMap
                  activities={days.find(d => (d.dayNumber || 1) === activeModalDay)?.activities || days[activeModalDay - 1]?.activities || []}
                  allDays={days}
                  selectedDayIndex={activeModalDay - 1}
                  destinationName={itinerary.destinationName || 'Destination'}
                  coordinates={itinerary.coordinates || { lat: 41.9028, lng: 12.4964 }}
                  hoveredStopIdx={hoveredStopIdx}
                  onHoverStop={setHoveredStopIdx}
                  selectedStopIdx={selectedStopIdx}
                  onSelectStop={setSelectedStopIdx}
                />
              </div>

              {/* Modal Overlay Footer */}
              <div className="px-6 py-3 border-t border-[#E6DFD5] bg-white flex items-center justify-between text-xs font-sans text-[#7A7268] shrink-0">
                <span>Click pins or cards above to preview stop photography and walk trajectories.</span>
                <span className="font-bold text-[#1E1C1A]">TripWise GeoEngine Overlay</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="py-12 text-center text-xs font-serif italic text-[#7A7268] border-t border-[#E6DFD5] bg-white mt-auto">
        TripWise Private Travel Concierge · Published Dossier Guide · Powered by Google Gemini
      </footer>
    </div>
  );
}
