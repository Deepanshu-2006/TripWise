'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import Header from '../components/Header';
import { Navigation, Ticket, Heart, Sparkles, MapPin, Clock, DollarSign, ChevronRight, Plus, ArrowUpDown, MoreHorizontal, CloudSun } from 'lucide-react';
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

export default function ItineraryPage() {
  const [itinerary, setItinerary] = useState(null);
  const [activeDay, setActiveDay] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hoveredStopIdx, setHoveredStopIdx] = useState(null);
  const [selectedStopIdx, setSelectedStopIdx] = useState(null);
  const [savedStops, setSavedStops] = useState({});

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('tripwise_itinerary');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setItinerary(parsed);
            if (parsed.days && parsed.days.length > 0) {
              setActiveDay(parsed.days[0].dayNumber || 1);
            }
          } catch (err) {
            console.error("Failed to parse stored itinerary:", err);
          }
        }
        setLoading(false);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleSaveStop = (stopNum) => {
    setSavedStops(prev => ({ ...prev, [stopNum]: !prev[stopNum] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F5] text-[#1C1B1B] flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 rounded-full border-4 border-[#EC6735] border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-bold text-[#5F5E5A] uppercase tracking-wider">Loading your AI Itinerary...</p>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="min-h-screen bg-[#FFF8F5] text-[#1C1B1B] flex flex-col justify-between font-sans">
        <Header />
        <div className="max-w-xl mx-auto px-6 py-32 text-center my-auto">
          <div className="w-16 h-16 rounded-2xl bg-[#FCE8E1] text-[#EC6735] flex items-center justify-center mx-auto mb-6 text-2xl shadow-sm">
            🗺️
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-3">No Itinerary Found</h1>
          <p className="text-sm text-[#5F5E5A] leading-relaxed mb-8">
            You haven&apos;t generated a custom trip yet! Head over to the AI Planner to craft your dream journey with Gemini 2.0 Flash.
          </p>
          <a
            href="/ai-planner"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-[#EC6735] text-white hover:opacity-90 transition-all shadow-md shadow-[#EC6735]/20"
          >
            <span>Plan My Trip with AI →</span>
          </a>
        </div>
        <footer className="py-6 text-center text-xs text-[#5F5E5A] border-t border-[rgba(28,27,27,0.08)]">
          Powered by TripWise AI &amp; Google Gemini
        </footer>
      </div>
    );
  }

  const currentDayData = itinerary.days?.find((d) => (d.dayNumber || 1) === activeDay) || itinerary.days?.[0];
  const currentDaySummary = getDaySummary(currentDayData, (activeDay || 1) - 1, itinerary.days || []);

  return (
    <div className="min-h-screen bg-[#FFF8F5] text-[#1C1B1B] flex flex-col font-sans selection:bg-[#EC6735]/20">
      <Header />

      {/* Hero Banner */}
      <section className="pt-28 pb-10 px-6 border-b border-[rgba(28,27,27,0.08)] bg-linear-to-b from-[#FFF2EA] to-[#FFF8F5] relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <a
              href="/ai-planner"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#EC6735] hover:underline uppercase tracking-wider"
            >
              ← Back to AI Planner
            </a>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#E1EEEB] text-[#0F6E56] text-xs font-bold font-mono uppercase tracking-wider shadow-2xs">
                ⚡ Gemini 2.0 Flash
              </span>
              <span className="px-3 py-1 rounded-full bg-[#FCE8E1] text-[#EC6735] text-xs font-bold font-mono uppercase tracking-wider shadow-2xs">
                Est. Cost: {itinerary.estimatedCost || 'Standard'}
              </span>
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-[#180F0F] leading-none mb-3">
            {itinerary.destinationName || 'Your Custom Journey'}
          </h1>
          <p className="text-base md:text-lg text-[#5F5E5A] font-medium max-w-2xl leading-relaxed">
            ✨ {itinerary.tagline || 'Tailored to your exact vibe, budget, and travel pace.'}
          </p>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="max-w-6xl mx-auto px-6 py-10 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Day Selector & GeoEngine Route Map */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Premium Animated Segmented Control Day Navigation (Apple iOS / Arc / Linear inspired) */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[rgba(28,27,27,0.08)] shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#5F5E5A] mb-3 flex items-center justify-between">
              <span>Select Day</span>
              <span className="text-[10px] text-[#EC6735] font-extrabold">{itinerary.days?.length || 1} Days Total</span>
            </h3>
            {itinerary.days && itinerary.days.length > 0 && (
              <div className="inline-flex items-center bg-[#F7F5F2] p-1 rounded-[22px] border border-[#ECE8E2] w-full relative select-none shadow-inner">
                {itinerary.days.map((day, idx) => {
                  const dayNum = day.dayNumber || idx + 1;
                  const isSelected = activeDay === dayNum;
                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => {
                        setActiveDay(dayNum);
                        setSelectedStopIdx(null);
                      }}
                      className="relative py-2.5 text-sm font-medium transition-colors duration-200 cursor-pointer flex items-center justify-center flex-1 whitespace-nowrap rounded-[18px] hover:bg-white/40 focus:outline-hidden z-10"
                    >
                      {isSelected && (
                        <motion.span
                          layoutId="activeDayItinerarySegmentedTab"
                          className="absolute inset-0 rounded-[18px] bg-[#EC6735] shadow-[0_2px_8px_rgba(236,103,53,0.28)] -z-10"
                          transition={{
                            layout: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
                          }}
                        />
                      )}
                      <span className={`relative transition-colors duration-300 font-medium ${
                        isSelected ? 'text-white' : 'text-[#5F5E5A] hover:text-[#1C1B1B]'
                      }`}>
                        Day {dayNum}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Live GeoEngine Route Map */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[rgba(28,27,27,0.08)] shadow-sm sticky top-28">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#5F5E5A] mb-2 flex items-center justify-between">
              <span>GeoEngine Route Map</span>
              <span className="text-[10px] text-[#EC6735] font-black">⚡ Live Sync</span>
            </h3>
            <p className="text-xs font-mono text-[#5F5E5A] mb-3">
              Center: {itinerary.coordinates?.lat?.toFixed(4) || '41.9028'}° N, {itinerary.coordinates?.lng?.toFixed(4) || '12.4964'}° E
            </p>
            <div className="w-full h-120 sm:h-130 rounded-2xl border border-[rgba(28,27,27,0.08)] overflow-hidden relative shadow-inner">
              <InteractiveRouteMap
                activities={currentDayData?.activities || []}
                allDays={itinerary.days || []}
                selectedDayIndex={(activeDay || 1) - 1}
                destinationName={itinerary.destinationName || 'Your Journey'}
                coordinates={itinerary.coordinates || { lat: 41.9028, lng: 12.4964 }}
                hoveredStopIdx={hoveredStopIdx || selectedStopIdx}
                onHoverStop={setHoveredStopIdx}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Day Overview Card & Connected Timeline */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Compact Floating Trip Summary Header (Inspired by Apple Maps, Airbnb, Arc, Linear) */}
          <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-[20px] border border-[#ECE8E2] shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col gap-2.5 transition-all duration-300">
            {/* Row 1: Destination Title & Weather Chip */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="w-4.5 h-4.5 text-[#EC6735] shrink-0 fill-[#EC6735]/15" />
                <h2 className="text-[18px] sm:text-[20px] font-bold text-[#1C1B1B] tracking-tight truncate">
                  {itinerary.destinationName || 'Rome, Italy'}
                </h2>
              </div>
              <div className="flex items-center gap-1 text-[12px] font-semibold text-[#5F5E5A] bg-[#F7F5F2] px-2.5 py-1 rounded-full border border-[#ECE8E2] shrink-0 select-none">
                <CloudSun className="w-3.5 h-3.5 text-[#EC6735]" />
                <span>{currentDaySummary.stats.weather || '☀ 32°'}</span>
              </div>
            </div>

            {/* Row 2 / Day Subtitle & Row 3 / Inline Stats & Right-side Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-[#ECE8E2]/60 text-[13px] font-medium text-[#5F5E5A]">
              {/* Left: Inline Stats with small icons (Plain text instead of pills!) */}
              <div className="flex items-center flex-wrap gap-x-3 gap-y-1 min-w-0">
                <span className="text-[#1C1B1B] font-semibold flex items-center gap-1.5">
                  <span>{currentDaySummary.titleLabel} • {currentDaySummary.themeTitle} • Demo</span>
                  <span className="text-[#ECE8E2] font-light">•</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[#1C1B1B] font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[#6B6B6B]" />
                  <span>{currentDaySummary.stats.stops}</span>
                </span>
                <span className="text-[#ECE8E2] font-light">•</span>
                <span className="inline-flex items-center gap-1 text-[#1C1B1B] font-medium">
                  <Clock className="w-3.5 h-3.5 text-[#6B6B6B]" />
                  <span>{currentDaySummary.stats.hours}</span>
                </span>
                <span className="text-[#ECE8E2] font-light">•</span>
                <span className="inline-flex items-center gap-1 text-[#1C1B1B] font-medium">
                  <Navigation className="w-3.5 h-3.5 text-[#6B6B6B]" />
                  <span>{currentDaySummary.stats.distance}</span>
                </span>
                <span className="text-[#ECE8E2] font-light">•</span>
                <span className="inline-flex items-center gap-1 text-[#15803D] font-semibold">
                  <DollarSign className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>{currentDaySummary.stats.cost}</span>
                </span>
              </div>

              {/* Right side: Lightweight Toolbar Buttons (Optimize colored, rest ghost) */}
              <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => alert("✨ AI Copilot: Optimizing day route geometry & pacing right now...")}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-[#EC6735] text-white hover:bg-[#D95524] text-xs font-semibold shadow-[0_2px_8px_rgba(236,103,53,0.25)] transition-all cursor-pointer hover:-translate-y-0.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Optimize</span>
                </button>
                <button
                  type="button"
                  onClick={() => alert("➕ Add Stop modal: Search attractions or drop custom pins.")}
                  className="inline-flex items-center gap-1 h-8 px-2.5 rounded-xl bg-transparent hover:bg-[#F7F5F2] text-[#1C1B1B] text-xs font-semibold transition-all cursor-pointer"
                  title="Add Stop"
                >
                  <Plus className="w-3.5 h-3.5 text-[#6B6B6B]" />
                  <span>Add</span>
                </button>
                <button
                  type="button"
                  onClick={() => alert("↕ Reorder mode enabled. Drag and drop cards along timeline.")}
                  className="inline-flex items-center gap-1 h-8 px-2.5 rounded-xl bg-transparent hover:bg-[#F7F5F2] text-[#1C1B1B] text-xs font-semibold transition-all cursor-pointer"
                  title="Reorder"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#6B6B6B]" />
                  <span>Reorder</span>
                </button>
                <button
                  type="button"
                  onClick={() => alert("⋯ More Day Options: Export PDF, Sync to Google Calendar, Share Link.")}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-transparent hover:bg-[#F7F5F2] text-[#1C1B1B] text-xs font-semibold transition-all cursor-pointer"
                  title="More Actions"
                >
                  <MoreHorizontal className="w-4 h-4 text-[#6B6B6B]" />
                </button>
              </div>
            </div>
          </div>

          {/* Point 1: Connected Timeline Activities List */}
          <div className="relative pl-6 sm:pl-8 flex flex-col pb-4 min-h-[420px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeDay}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } }}
                className="relative flex flex-col w-full"
              >
                {/* Continuous Vertical Timeline Line */}
                <div className="absolute left-3.75 sm:left-4.75 top-6 bottom-10 w-0.5 bg-linear-to-b from-[#EC6735] via-[#EC6735]/60 to-[#EC6735]/20 z-0 pointer-events-none" />

                {currentDayData?.activities?.map((act, idx) => {
              const stopNum = idx + 1;
              const isHovered = hoveredStopIdx === stopNum;
              const isActive = selectedStopIdx === stopNum;
              const isSaved = !!savedStops[stopNum];

              const categoryStyle = getCategoryStyling(act);
              const ratingData = getActivityRating(act, idx);
              const costInfo = formatCost(act);
              const iconBadges = getIconBadges(act, idx);
              const aiInsightText = getAiInsight(act, idx);
              const transport = getTransportBetweenStops(currentDayData?.activities?.[idx - 1], act, idx);

              return (
                <div key={idx} className="flex flex-col">
                  {/* Point 1 & Point 10: Transport Connector Between Stops */}
                  {idx > 0 && transport && (
                    <div className="relative pl-8 sm:pl-10 py-3 flex items-center">
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#FFF8F5] hover:bg-[#FFF2EA] border border-[#ECE8E2] rounded-full text-xs font-bold text-[#5F5E5A] shadow-2xs transition-all duration-200 relative z-10 group/connector">
                        <span className="text-sm">{transport.icon}</span>
                        <span className="tracking-tight text-[#1C1B1B] font-semibold">{transport.text}</span>
                      </div>
                    </div>
                  )}

                  {/* Activity Card Container with Timeline Node */}
                  <div className="relative pb-6">
                    {/* Point 1 & Point 8: Timeline Node Circle */}
                    <div
                      onClick={() => setSelectedStopIdx(selectedStopIdx === stopNum ? null : stopNum)}
                      className={`absolute -left-6 sm:-left-8 top-6 w-8 sm:w-10 h-8 sm:h-10 rounded-full border-2 flex items-center justify-center z-20 text-xs sm:text-sm font-black cursor-pointer transition-all duration-300 ${
                        isActive || isHovered
                          ? 'bg-[#EC6735] text-white border-[#EC6735] scale-110 shadow-lg shadow-[#EC6735]/35'
                          : 'bg-white text-[#EC6735] border-[#EC6735] shadow-sm hover:scale-105'
                      }`}
                    >
                      {stopNum}
                    </div>

                    {/* Point 7, 8 & 16: Interactive Card Container */}
                    <div
                      onMouseEnter={() => setHoveredStopIdx(stopNum)}
                      onMouseLeave={() => setHoveredStopIdx(null)}
                      onClick={() => setSelectedStopIdx(selectedStopIdx === stopNum ? null : stopNum)}
                      className={`relative ml-6 sm:ml-8 p-5 sm:p-6 rounded-3xl border transition-all duration-300 ease-out group/card cursor-pointer select-none ${
                        isActive
                          ? 'bg-[#FFF8F5] border-l-4 border-l-[#EC6735] border-[#EC6735] shadow-xl shadow-[#EC6735]/15 -translate-y-1 z-10'
                          : isHovered
                          ? 'bg-white border-[#EC6735] shadow-xl shadow-[0_16px_36px_rgba(236,103,53,0.14)] -translate-y-1.5 z-10'
                          : 'bg-white border-[rgba(28,27,27,0.08)] shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-lg hover:border-[#EC6735]/60'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                        {/* Point 2: Activity Thumbnail (80-100px rounded image) */}
                        <div className="relative w-full sm:w-24 h-44 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-[rgba(28,27,27,0.08)] shadow-sm group-hover/card:shadow-md transition-shadow">
                          <img
                            src={getActivityThumbnail(act, idx)}
                            alt={act.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
                            loading="lazy"
                          />
                          <div className="absolute top-2.5 left-2.5 sm:hidden px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-xs text-white font-mono text-xs font-bold">
                            {act.time || '10:00'}
                          </div>
                        </div>

                        {/* Point 3: Information Hierarchy */}
                        <div className="flex-1 min-w-0 flex flex-col gap-1.5 w-full">
                          {/* 1. Time & Category Pill (Point 3 & 15) */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-mono font-extrabold text-[#EC6735] tracking-tight">
                                {act.time || '10:00 AM'}
                              </span>
                              <span className="text-[#ECE8E2] font-black">•</span>
                              <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-lg border ${categoryStyle.badgeClass}`}>
                                <span>{categoryStyle.icon}</span> <span>{categoryStyle.name}</span>
                              </span>
                            </div>

                            {/* Point 6: Quick Actions (Navigate, Book, Save icon-only buttons with hover animations) */}
                            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${act.title} ${itinerary.destinationName || ''}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Navigate in Google Maps"
                                className="w-8 h-8 rounded-xl bg-[#FFF8F5] hover:bg-[#EC6735] text-[#1C1B1B] hover:text-white border border-[rgba(28,27,27,0.08)] hover:border-[#EC6735] flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-2xs"
                              >
                                <Navigation size={14} strokeWidth={2.2} />
                              </a>
                              <a
                                href={`https://www.google.com/search?q=${encodeURIComponent(`Book tickets ${act.title} ${itinerary.destinationName || ''}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Book Tickets / Reservation"
                                className="w-8 h-8 rounded-xl bg-[#FFF8F5] hover:bg-[#EC6735] text-[#1C1B1B] hover:text-white border border-[rgba(28,27,27,0.08)] hover:border-[#EC6735] flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-2xs"
                              >
                                <Ticket size={14} strokeWidth={2.2} />
                              </a>
                              <button
                                type="button"
                                onClick={() => toggleSaveStop(stopNum)}
                                title={isSaved ? "Saved to favorites" : "Save stop"}
                                className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-2xs ${
                                  isSaved
                                    ? 'bg-[#FCE8E1] text-[#EC6735] border-[#EC6735]/40 fill-[#EC6735]'
                                    : 'bg-[#FFF8F5] hover:bg-[#EC6735] text-[#1C1B1B] hover:text-white border-[rgba(28,27,27,0.08)] hover:border-[#EC6735]'
                                }`}
                              >
                                <Heart size={14} strokeWidth={2.2} className={isSaved ? "fill-[#EC6735] text-[#EC6735]" : ""} />
                              </button>
                            </div>
                          </div>

                          {/* 2. Title (Point 3 & Point 14 Better Typography) */}
                          <h4 className="text-lg sm:text-xl font-black text-[#1C1B1B] leading-snug tracking-tight group-hover/card:text-[#EC6735] transition-colors">
                            {act.title}
                          </h4>

                          {/* 3. Rating + Reviews (Point 3) */}
                          <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#1C1B1B]">
                            <span className="text-amber-500 text-sm">★★★★★</span>
                            <span>{ratingData.rating}</span>
                            <span className="text-[#5F5E5A] font-medium">({ratingData.reviews})</span>
                          </div>

                          {/* 4. Duration • Cost (Point 3 & Point 9 Improved Cost Display) */}
                          <div className="flex items-center flex-wrap gap-2 pt-1">
                            {act.duration && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FFF8F5] border border-[rgba(28,27,27,0.08)] text-xs font-bold text-[#5F5E5A]">
                                <span>⏱️</span> <span>{act.duration}</span>
                              </div>
                            )}
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0D9488]/10 border border-[#0D9488]/20 text-xs font-bold text-[#0D9488]">
                              <span>{costInfo.title}</span>
                              <span className="text-[11px] font-semibold text-[#0D9488]/85 border-l border-[#0D9488]/30 pl-1.5 ml-0.5">
                                {costInfo.subtitle}
                              </span>
                            </div>
                          </div>

                          {/* 5. Short Description (line-clamp-2) (Point 3 & 14) */}
                          <p className="text-xs sm:text-sm text-[#5F5E5A] leading-relaxed font-normal line-clamp-2 pt-1">
                            {act.description}
                          </p>

                          {/* 6. Icon Badges (Point 4) */}
                          <div className="flex items-center flex-wrap gap-1.5 pt-2">
                            {iconBadges.map((badge, bIdx) => (
                              <span
                                key={bIdx}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-extrabold tracking-tight shadow-2xs ${badge.colorClass}`}
                              >
                                <span className="text-xs">{badge.icon}</span>
                                <span>{badge.text}</span>
                              </span>
                            ))}
                          </div>

                          {/* 7. Collapsible AI Insight (Point 5) */}
                          <div className="mt-3 pt-2.5 border-t border-[rgba(28,27,27,0.06)] w-full" onClick={(e) => e.stopPropagation()}>
                            <details className="group/tip cursor-pointer">
                              <summary className="inline-flex items-center gap-1.5 text-xs font-bold text-[#EC6735] hover:text-[#D95524] select-none py-1">
                                <span className="w-5 h-5 rounded-md bg-[#FFF2EA] text-[#EC6735] flex items-center justify-center text-xs shadow-2xs group-open/tip:bg-[#EC6735] group-open/tip:text-white transition-colors">
                                  💡
                                </span>
                                <span>AI Insight &amp; Smart Tip</span>
                                <span className="text-[10px] opacity-70 group-open/tip:rotate-180 transition-transform ml-0.5">▼</span>
                              </summary>
                              <div className="mt-2.5 p-3.5 rounded-2xl bg-linear-to-r from-[#FFF8F5] to-[#FFF2EA]/60 border border-[#EC6735]/20 text-xs text-[#1C1B1B] font-medium leading-relaxed shadow-2xs">
                                <div className="flex items-start gap-2">
                                  <span className="text-base leading-none">✨</span>
                                  <p className="flex-1">{aiInsightText}</p>
                                </div>
                              </div>
                            </details>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-[#5F5E5A] border-t border-[rgba(28,27,27,0.08)] bg-white mt-auto">
        TripWise AI Planner · Powered by Google Gemini 2.0 Flash
      </footer>
    </div>
  );
}
