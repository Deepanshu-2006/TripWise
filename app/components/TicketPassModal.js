'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Ticket, Clock, AlertCircle, Check, Landmark, Sparkles, FileText, Utensils, MapPin, Trees, Bike, Camera, Compass } from 'lucide-react';
import { formatCost } from './itineraryHelpers';

// Helper to ensure modal "Est. Rate" matches stop card and explicitly caveats if variable
function getModalRateDisplay(activity, costInfo) {
  const raw = activity?.cost || activity?.price || costInfo?.title || '';
  if (!raw || raw.toLowerCase().includes('free') || raw === '$0' || raw === '€0' || raw.includes('Free Public Entry')) {
    return {
      rate: 'Free Public Entry',
      caveat: 'No general admission fee required'
    };
  }
  
  let clean = raw.replace(/^💰\s*/, '').trim();
  if (clean.includes('Check') || !clean) {
    return {
      rate: 'Check venue rate — may vary by provider',
      caveat: 'Live rate depends on season, date, and ticket tier'
    };
  }

  // Ensure "From" and caveat are present
  if (!clean.toLowerCase().startsWith('from')) {
    clean = `From ${clean}`;
  }
  if (!clean.includes('may vary')) {
    clean = `${clean} — may vary by provider`;
  }

  return {
    rate: clean,
    caveat: 'Live pricing depends on selected date, time slot, and ticket type'
  };
}

export default function TicketPassModal({
  isOpen,
  onClose,
  activity,
  destinationName = 'Destination',
  dayNumber = 1,
  stopNumber = 1,
  onStatusChange
}) {
  const [savedNote, setSavedNote] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Reset expanded state and load personal note when modal opens
  useEffect(() => {
    if (activity && isOpen) {
      setShowMoreOptions(false);
      const key = `tw_ticket_note_${destinationName}_day${dayNumber}_stop${stopNumber}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        setSavedNote(stored);
      } else {
        setSavedNote('');
      }
      setIsSaved(false);
    }
  }, [activity, isOpen, destinationName, dayNumber, stopNumber]);

  if (!isOpen || !activity) return null;

  const title = activity.title || 'Featured Stop';
  const time = activity.time || '10:00 AM';
  const rawCat = activity.category || activity.type || 'Attraction';
  const category = rawCat.toUpperCase();
  const cleanDest = destinationName ? destinationName.split(',')[0].trim() : '';

  // Category Detection
  const catLower = rawCat.toLowerCase();
  const titleLower = title.toLowerCase();
  const isDining = catLower.includes('din') || catLower.includes('food') || catLower.includes('rest') || catLower.includes('cafe') || catLower.includes('bar') || catLower.includes('lunch') || catLower.includes('dinner') || catLower.includes('breakfast') || titleLower.includes('osteria') || titleLower.includes('trattoria') || titleLower.includes('restaurant') || titleLower.includes('cafe') || titleLower.includes('bistro') || titleLower.includes('gelat') || titleLower.includes('pizzeria') || titleLower.includes('tavern');
  const isNature = !isDining && (catLower.includes('park') || catLower.includes('nature') || catLower.includes('garden') || catLower.includes('beach') || catLower.includes('walk') || catLower.includes('view') || catLower.includes('scenic') || titleLower.includes('park') || titleLower.includes('garden') || titleLower.includes('fountain') || titleLower.includes('plaza') || titleLower.includes('piazza') || titleLower.includes('villa borghese') || titleLower.includes('spanish steps'));

  // Header and grid labels tailored to category
  const headerSubtitle = isDining 
    ? 'TABLE RESERVATION & DINING CONCIERGE' 
    : (isNature ? 'PUBLIC ACCESS & VISITOR GUIDE' : 'TICKET & BOOKING CONCIERGE');
  
  const rateLabel = isDining ? 'Est. Spend Range' : 'Est. Rate';
  const timeLabel = isDining ? 'Seating Window' : (isNature ? 'Best Visiting Time' : 'Itinerary Time');
  const timeSub = isDining ? '(Recommended reserve early)' : '(Arrive 15m early)';

  // Calculate synchronized rate display with caveat (Requirement 1)
  const costInfo = formatCost(activity);
  const rateDisplay = getModalRateDisplay(activity, costInfo);

  // Clean name extraction for accurate direct provider searches
  let cleanName = title.trim();
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
    cleanName = title.trim();
  }

  const cleanSearchQuery = `${cleanName} ${cleanDest}`.trim();

  // Curate 1 Recommended Gateway + 3 Secondary Options (Requirement 2 & 3)
  let recommendedGateway = {};
  let recommendedReason = '';
  let secondaryGateways = [];

  if (isDining) {
    const opentableQuery = encodeURIComponent(cleanName);
    const theforkQuery = encodeURIComponent(cleanName);
    const mapsQuery = encodeURIComponent(cleanSearchQuery);
    const googleReserveQuery = encodeURIComponent(`${cleanSearchQuery} reserve table`);

    recommendedGateway = {
      name: 'OpenTable Table Reservation',
      icon: <Utensils className="w-5 h-5 text-[#FF6B2C]" />,
      url: `https://www.opentable.com/s?term=${opentableQuery}`,
      desc: `Search real-time table availability and instant online seating confirmation for ${cleanName}.`
    };
    recommendedReason = 'Recommended — Official Partner Portal, instant confirmation without fees';

    secondaryGateways = [
      {
        name: 'Check Seating on TheFork',
        icon: <Utensils className="w-4 h-4 text-[#FF6B2C]" />,
        url: `https://www.thefork.com/search?q=${theforkQuery}`,
        desc: `Compare dining time slots, special chef tasting menus, and table offers for ${cleanName}.`
      },
      {
        name: 'Google Reserve Table Check',
        icon: <Utensils className="w-4 h-4 text-[#FF6B2C]" />,
        url: `https://www.google.com/search?q=${googleReserveQuery}`,
        desc: `Universal check across OpenTable, Resy, and direct restaurant desk reservation windows.`
      },
      {
        name: 'Google Maps Desk & Menu Photos',
        icon: <MapPin className="w-4 h-4 text-[#FF6B2C]" />,
        url: `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`,
        desc: `Check exact location, phone desk contact, peak crowd wait times, and customer menu photos.`
      }
    ];
  } else if (isNature) {
    const mapsQuery = encodeURIComponent(cleanSearchQuery);
    const infoQuery = encodeURIComponent(`${cleanSearchQuery} official opening hours visitor information`);
    const viatorQuery = encodeURIComponent(cleanSearchQuery);
    const photoQuery = encodeURIComponent(`${cleanSearchQuery} best photography spots tips`);

    recommendedGateway = {
      name: 'Google Maps Navigation & Entrance Points',
      icon: <MapPin className="w-5 h-5 text-[#FF6B2C]" />,
      url: `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`,
      desc: `Get direct walking directions, exact entrance gate coordinates, and real-time crowd conditions for ${cleanName}.`
    };
    recommendedReason = 'Recommended — Direct walking directions, live entrance coordinates & crowd metrics';

    secondaryGateways = [
      {
        name: 'Official Park / Site Visitor Info',
        icon: <Trees className="w-4 h-4 text-[#FF6B2C]" />,
        url: `https://www.google.com/search?q=${infoQuery}`,
        desc: `Check seasonal opening hours, public events schedules, and park access maps.`
      },
      {
        name: 'Guided Walking & Bike Tours on Viator',
        icon: <Bike className="w-4 h-4 text-[#FF6B2C]" />,
        url: `https://www.viator.com/searchResults/all?text=${viatorQuery}`,
        desc: `Explore optional guided Segway, e-bike, and historical storytelling walking passes.`
      },
      {
        name: 'Top Photography Angles & Tips',
        icon: <Camera className="w-4 h-4 text-[#FF6B2C]" />,
        url: `https://www.google.com/search?q=${photoQuery}`,
        desc: `Check traveler tips for the best sunset viewing angles and quiet pathways around ${cleanName}.`
      }
    ];
  } else {
    // Standard Sightseeing / Attraction Gateways
    const officialQuery = encodeURIComponent(`${cleanSearchQuery} official tickets site box office`);
    const viatorQuery = encodeURIComponent(cleanSearchQuery);
    const gygQuery = encodeURIComponent(cleanSearchQuery);
    const tiqetsQuery = encodeURIComponent(cleanSearchQuery);

    recommendedGateway = {
      name: 'Official Venue Ticket Gateway',
      icon: <Landmark className="w-5 h-5 text-[#FF6B2C]" />,
      url: `https://www.google.com/search?q=${officialQuery}`,
      desc: `Search official venue box office releases and direct general admission tickets for ${cleanName}.`
    };
    recommendedReason = 'Recommended — Official Venue Gateway, direct admission with zero markup';

    secondaryGateways = [
      {
        name: 'Viator Skip-the-Line Passes',
        icon: <Ticket className="w-4 h-4 text-[#FF6B2C]" />,
        url: `https://www.viator.com/searchResults/all?text=${viatorQuery}`,
        desc: `Compare priority skip-the-line passes, reserved time slots, and VIP guided entry.`
      },
      {
        name: 'GetYourGuide Tours & Passes',
        icon: <Compass className="w-4 h-4 text-[#FF6B2C]" />,
        url: `https://www.getyourguide.com/s/?q=${gygQuery}`,
        desc: `Explore instant mobile passes, audio guides, and flexible cancellation options.`
      },
      {
        name: 'Tiqets Instant Mobile Entry',
        icon: <Ticket className="w-4 h-4 text-[#FF6B2C]" />,
        url: `https://www.tiqets.com/en/search/?q=${tiqetsQuery}`,
        desc: `Instant mobile delivery passes and multi-attraction city bundle combinations.`
      }
    ];
  }

  const handleSaveNote = () => {
    const key = `tw_ticket_note_${destinationName}_day${dayNumber}_stop${stopNumber}`;
    localStorage.setItem(key, savedNote);
    setIsSaved(true);
    if (onStatusChange) {
      onStatusChange();
    }
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#1E1C1A]/80 backdrop-blur-md"
          />

          {/* Modal Container — Warm Editorial Dossier Styling with Generous Spacing (Point 1) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-xl my-auto z-10"
          >
            {/* Close Button Top Right (Desktop outside, Mobile inside modal header) */}
            <button
              onClick={onClose}
              className="absolute -top-12 right-0 hidden sm:flex w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center transition-all cursor-pointer border border-white/15"
              aria-label="Close ticket modal"
            >
              <X className="w-5 h-5" />
            </button>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 sm:hidden z-50 w-8 h-8 rounded-full bg-[#1E1C1A]/10 hover:bg-[#1E1C1A]/20 text-[#1E1C1A] flex items-center justify-center transition-all cursor-pointer"
              aria-label="Close ticket modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* ── EDITORIAL DOSSIER PASS CARD ── */}
            <div className="w-full bg-[#FAF6F0] rounded-3xl shadow-2xl overflow-hidden border border-[#E6DFD5] text-[#1E1C1A] relative">
              
              {/* TOP HEADER — Warm Editorial Spacing & Serif Display Font (Point 1) */}
              <div className="bg-[#FAF6F0] p-6 sm:p-8 pb-6 relative overflow-hidden border-b border-[#E6DFD5]">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-[#FF6B2C] flex items-center justify-center text-white font-serif font-black text-xs shadow-2xs">
                      TW
                    </span>
                    <span className="font-mono text-xs tracking-widest uppercase text-[#FF6B2C] font-bold">
                      {headerSubtitle}
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-white border border-[#E6DFD5] text-[#1E1C1A] font-mono text-[11px] font-bold tracking-wider uppercase shadow-2xs">
                    Day {dayNumber} • Stop #{stopNumber}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="text-xs font-sans font-bold uppercase tracking-widest text-[#7A7268] mb-1.5">
                    {cleanDest} • {category}
                  </div>
                  {/* Same Serif Display Font as Main Stop Cards (Point 1) */}
                  <h2 className="text-2xl sm:text-4xl font-serif font-black text-[#1E1C1A] tracking-tight leading-snug">
                    {title}
                  </h2>
                </div>
              </div>

              {/* MAIN DOSSIER PASS DETAILS — Generous Whitespace (`space-y-8`) */}
              <div className="p-6 sm:p-8 sm:pb-10 space-y-8 bg-[#FAF6F0] max-h-[75vh] overflow-y-auto">
                
                {/* Expected Cost & Arrival Quick Grid using Standard Label Style (Point 1) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 p-5 sm:p-6 bg-white rounded-2xl border border-[#E6DFD5] shadow-2xs">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF6F0] border border-[#E6DFD5] flex items-center justify-center shrink-0 mt-0.5">
                      {isDining ? <Utensils className="w-4.5 h-4.5 text-[#FF6B2C]" /> : (isNature ? <MapPin className="w-4.5 h-4.5 text-[#FF6B2C]" /> : <Ticket className="w-4.5 h-4.5 text-[#FF6B2C]" />)}
                    </div>
                    <div>
                      <div className="text-xs font-sans tracking-widest uppercase text-[#7A7268] font-bold">{rateLabel}</div>
                      <div className="text-base sm:text-lg font-serif font-bold text-[#1E1C1A] mt-1">{rateDisplay.rate}</div>
                      <div className="text-xs font-sans text-[#7A7268] mt-1 leading-normal">{rateDisplay.caveat}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 sm:border-l sm:border-[#E6DFD5] sm:pl-6 pt-4 sm:pt-0 border-t sm:border-t-0 border-[#E6DFD5]/60">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF6F0] border border-[#E6DFD5] flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-4.5 h-4.5 text-[#FF6B2C]" />
                    </div>
                    <div>
                      <div className="text-xs font-sans tracking-widest uppercase text-[#7A7268] font-bold">{timeLabel}</div>
                      <div className="text-base sm:text-lg font-serif font-bold text-[#1E1C1A] mt-1">{time}</div>
                      <div className="text-xs font-sans text-[#7A7268] mt-1">{timeSub}</div>
                    </div>
                  </div>
                </div>

                {/* ── CURATED BOOKING GATEWAYS (Point 2: Single Framing without redundant header) ── */}
                <div className="space-y-4">
                  {/* Recommended Gateway Box */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-[#FF6B2C]/40 shadow-sm relative overflow-hidden transition-all hover:border-[#FF6B2C]">
                    <div className="flex items-center justify-between gap-2 flex-wrap border-b border-[#E6DFD5]/60 pb-3.5 mb-4">
                      <div className="flex items-center gap-2 text-xs font-sans font-bold text-[#FF6B2C]">
                        <Sparkles className="w-4 h-4 shrink-0" />
                        <span>{recommendedReason}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wider bg-[#FAF6F0] border border-[#E6DFD5] text-[#5F5E5A] shrink-0">
                        Verified Direct Link
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-[#FAF6F0] border border-[#E6DFD5] shrink-0 mt-0.5">
                          {recommendedGateway.icon}
                        </div>
                        <div>
                          <h3 className="font-serif font-bold text-lg sm:text-xl text-[#1E1C1A]">
                            {recommendedGateway.name}
                          </h3>
                          <p className="text-xs sm:text-sm font-sans text-[#4A443E] mt-1.5 leading-relaxed">
                            {recommendedGateway.desc}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-[#E6DFD5]/60 flex justify-end">
                      <a
                        href={recommendedGateway.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#FF6B2C] hover:bg-[#A3482D] text-white text-xs font-sans font-bold shadow-xs transition-all w-full sm:w-auto cursor-pointer"
                      >
                        <span>Check Official Gateway ↗</span>
                      </a>
                    </div>
                  </div>

                  {/* Collapsible Secondary Gateways */}
                  {secondaryGateways.length > 0 && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setShowMoreOptions(!showMoreOptions)}
                        aria-expanded={showMoreOptions}
                        className="w-full py-3.5 px-5 rounded-xl border border-[#E6DFD5] bg-white hover:bg-[#FAF6F0] text-xs font-sans font-bold text-[#1E1C1A] flex items-center justify-between transition-all cursor-pointer shadow-2xs"
                      >
                        <span className="flex items-center gap-2">
                          <span>See {secondaryGateways.length} more booking options</span>
                          <span className="text-[10px] font-mono font-normal text-[#7A7268] bg-[#FAF6F0] px-2 py-0.5 rounded border border-[#E6DFD5]">
                            Partner Gateways
                          </span>
                        </span>
                        <span className={`text-[#FF6B2C] transition-transform duration-200 font-bold ${showMoreOptions ? 'rotate-180' : ''}`}>
                          ▾
                        </span>
                      </button>

                      <AnimatePresence>
                        {showMoreOptions && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="overflow-hidden mt-3 space-y-3"
                          >
                            {secondaryGateways.map((gw, idx) => (
                              <a
                                key={idx}
                                href={gw.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-4 sm:p-5 rounded-2xl border border-[#E6DFD5] hover:border-[#FF6B2C]/60 bg-white transition-all duration-200 cursor-pointer shadow-2xs group"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-[#FAF6F0] border border-[#E6DFD5] flex items-center justify-center shrink-0 mt-0.5 text-[#FF6B2C] group-hover:scale-105 transition-transform">
                                      {gw.icon}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-serif font-bold text-base text-[#1E1C1A] group-hover:text-[#FF6B2C] transition-colors">
                                          {gw.name}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-medium tracking-wider bg-[#FAF6F0] border border-[#E6DFD5] text-[#5F5E5A]">
                                          Verified Direct Link
                                        </span>
                                      </div>
                                      <p className="text-xs sm:text-sm font-sans text-[#5F5E5A] mt-1 leading-relaxed">
                                        {gw.desc}
                                      </p>
                                    </div>
                                  </div>
                                  <ExternalLink className="w-4 h-4 text-[#7A7268] group-hover:text-[#FF6B2C] shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 mt-1" />
                                </div>
                              </a>
                            ))}

                            {/* High-Contrast Legible Affiliate Disclosure (Point 5) */}
                            <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-[#FAF6F0] border border-[#E6DFD5] text-xs font-sans text-[#4A443E] flex items-start gap-3.5 shadow-2xs">
                              <span className="text-base leading-none shrink-0 mt-0.5">ℹ️</span>
                              <div className="leading-relaxed font-medium">
                                <strong className="text-[#1E1C1A] font-bold">Partner Disclosure:</strong> We route you directly to official box offices whenever possible. When selecting secondary partner gateways above (such as Viator or GetYourGuide), TripWise may earn a small referral commission at <span className="underline underline-offset-2 decoration-[#FF6B2C]">zero extra cost to you</span>. This helps support our independent curation without display ads.
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Important Booking Advisory using Page Standard Label Style */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E6DFD5] shadow-2xs flex items-start gap-4">
                  <AlertCircle className="w-5 h-5 text-[#FF6B2C] shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm font-sans text-[#4A443E] leading-relaxed space-y-1.5">
                    <div className="text-xs font-sans tracking-widest uppercase text-[#1E1C1A] font-bold">
                      Important Booking Advisory
                    </div>
                    <p>
                      TripWise acts solely as a curated routing concierge connecting you to official venue box offices and verified booking platforms. We do not process payments, hold tickets, or guarantee live pricing and slot availability shown. All transactions and ticket reservations occur directly on the chosen provider’s secure gateway.
                    </p>
                  </div>
                </div>

                {/* ── PERSONAL BOOKING CONFIRMATION POCKET ── */}
                <div className="pt-5 border-t border-[#E6DFD5] space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label htmlFor="ticket-note" className="text-xs font-sans font-bold uppercase tracking-wider text-[#1E1C1A] flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#FF6B2C]" />
                      <span>Attach Real Confirmation / Reference Note</span>
                    </label>
                    <span className="text-xs font-sans italic text-[#7A7268]">Saved privately to your device</span>
                  </div>

                  <div className="relative">
                    <textarea
                      id="ticket-note"
                      rows="3"
                      value={savedNote}
                      onChange={(e) => setSavedNote(e.target.value)}
                      placeholder="Once you purchase tickets online, paste your confirmation code, entry gate, or reservation reference here (e.g. #849204 - 9:30 AM Gate B)..."
                      className="w-full p-4 rounded-2xl bg-white border border-[#E6DFD5] focus:border-[#FF6B2C] focus:outline-hidden text-xs sm:text-sm font-sans text-[#1E1C1A] placeholder-[#A89F91] resize-none shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={handleSaveNote}
                      className={`absolute bottom-3 right-3 px-4 py-1.5 rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                        isSaved
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#1E1C1A] hover:bg-[#2A2623] text-white'
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Saved Reference ✓</span>
                        </>
                      ) : (
                        <span>Save Note</span>
                      )}
                    </button>
                  </div>
                </div>

              </div>

              {/* FOOTER */}
              <div className="p-4 bg-white border-t border-[#E6DFD5] flex items-center justify-between text-xs font-serif italic text-[#7A7268] px-6 sm:px-8">
                <span>TripWise Curated Ticket Concierge</span>
                <span>Verified Direct Gateways</span>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
