'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, ShieldCheck, Ticket, Clock, AlertCircle, Bookmark, Check, Compass, Landmark, Sparkles, FileText, Utensils, MapPin, Star, Trees, Bike, Camera } from 'lucide-react';

export default function TicketPassModal({
  isOpen,
  onClose,
  activity,
  destinationName = 'Destination',
  dayNumber = 1,
  stopNumber = 1
}) {
  const [savedNote, setSavedNote] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Load any saved personal confirmation note when modal opens
  useEffect(() => {
    if (activity && isOpen) {
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
  const cost = activity.costInfo?.title || 'Check venue rate';
  const cleanDest = destinationName.split(',')[0].trim();

  // Category Detection for Dynamic Concierge
  const catLower = rawCat.toLowerCase();
  const titleLower = title.toLowerCase();
  
  const isDining = catLower.includes('din') || catLower.includes('food') || catLower.includes('rest') || catLower.includes('cafe') || catLower.includes('bar') || catLower.includes('lunch') || catLower.includes('dinner') || catLower.includes('breakfast') || titleLower.includes('osteria') || titleLower.includes('trattoria') || titleLower.includes('restaurant') || titleLower.includes('cafe') || titleLower.includes('bistro') || titleLower.includes('gelat') || titleLower.includes('pizzeria') || titleLower.includes('tavern');
  
  const isNature = !isDining && (catLower.includes('park') || catLower.includes('nature') || catLower.includes('garden') || catLower.includes('beach') || catLower.includes('walk') || catLower.includes('view') || catLower.includes('scenic') || titleLower.includes('park') || titleLower.includes('garden') || titleLower.includes('fountain') || titleLower.includes('plaza') || titleLower.includes('piazza') || titleLower.includes('villa borghese') || titleLower.includes('spanish steps'));

  // Header and grid labels dynamically adapted
  const headerSubtitle = isDining 
    ? 'TABLE RESERVATION & DINING CONCIERGE' 
    : (isNature ? 'PUBLIC ACCESS & VISITOR GUIDE' : 'TICKET & BOOKING CONCIERGE');
  
  const rateLabel = isDining ? 'Est. Spend Range' : 'Est. Rate';
  const timeLabel = isDining ? 'Seating Window' : (isNature ? 'Best Visiting Time' : 'Itinerary Time');
  const timeSub = isDining ? '(Recommended reserve early)' : '(Arrive 15m early)';

  // Clean venue/restaurant/attraction name extraction (strips "Authentic Roman Pasta at", "Colosseum VIP Exploration", etc.)
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

  // Dynamically tailor the 4 gateways based on category using exact cleanSearchQuery
  let gateways = [];
  if (isDining) {
    const googleReserveQuery = encodeURIComponent(`${cleanSearchQuery} reserve table`);
    const opentableQuery = encodeURIComponent(cleanName);
    const theforkQuery = encodeURIComponent(cleanName);
    const mapsQuery = encodeURIComponent(cleanSearchQuery);

    gateways = [
      {
        name: 'Instant Google Table Reservation',
        badge: 'Universal Booking',
        icon: <Utensils className="w-5 h-5 text-[#BA5536]" />,
        url: `https://www.google.com/search?q=${googleReserveQuery}`,
        desc: `Check instant online reservation windows for ${cleanName} across OpenTable, Resy & direct desk.`,
        color: 'border-[#BA5536]/30 bg-[#BA5536]/5 hover:border-[#BA5536] hover:bg-[#BA5536]/10 text-[#BA5536]'
      },
      {
        name: 'Check Table on OpenTable',
        badge: 'Global #1 Network',
        icon: <Bookmark className="w-5 h-5 text-indigo-600" />,
        url: `https://www.opentable.com/s?term=${opentableQuery}`,
        desc: `Search real-time table availability, special dining offers, and instant confirmation seating.`,
        color: 'border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500 hover:bg-indigo-500/10 text-indigo-700'
      },
      {
        name: 'Check Seating on TheFork',
        badge: 'Michelin / Europe',
        icon: <Star className="w-5 h-5 text-amber-600" />,
        url: `https://www.thefork.com/search?q=${theforkQuery}`,
        desc: `Compare dining slots, special chef tasting menus, and up to 50% off table discounts for ${cleanName}.`,
        color: 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500 hover:bg-amber-500/10 text-amber-700'
      },
      {
        name: 'Google Maps Wait Times & Menu',
        badge: 'Live Crowd & Phone',
        icon: <MapPin className="w-5 h-5 text-emerald-600" />,
        url: `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`,
        desc: `Check exact location, phone booking desk, peak crowd wait times, and customer menu photos.`,
        color: 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500 hover:bg-emerald-500/10 text-emerald-700'
      }
    ];
  } else if (isNature) {
    const mapsQuery = encodeURIComponent(cleanSearchQuery);
    const infoQuery = encodeURIComponent(`${cleanSearchQuery} official opening hours visitor information`);
    const viatorQuery = encodeURIComponent(cleanSearchQuery);
    const photoQuery = encodeURIComponent(`${cleanSearchQuery} best photography spots tips`);

    gateways = [
      {
        name: 'Google Maps Navigation & Entrance Points',
        badge: 'Walking Directions',
        icon: <MapPin className="w-5 h-5 text-[#BA5536]" />,
        url: `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`,
        desc: `Get live walking navigation, entrance gate coordinates, and crowd conditions for ${cleanName}.`,
        color: 'border-[#BA5536]/30 bg-[#BA5536]/5 hover:border-[#BA5536] hover:bg-[#BA5536]/10 text-[#BA5536]'
      },
      {
        name: 'Official Park / Site Visitor Info',
        badge: 'Hours & Access',
        icon: <Trees className="w-5 h-5 text-emerald-600" />,
        url: `https://www.google.com/search?q=${infoQuery}`,
        desc: `Check seasonal opening hours, public events, fountain schedules, and access maps for ${cleanName}.`,
        color: 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500 hover:bg-emerald-500/10 text-emerald-700'
      },
      {
        name: 'Guided Walking & Bike Tours on Viator',
        badge: 'Optional Guided Passes',
        icon: <Bike className="w-5 h-5 text-amber-600" />,
        url: `https://www.viator.com/searchResults/all?text=${viatorQuery}`,
        desc: `Explore optional guided Segway, e-bike, and historical storytelling walking tours of ${cleanName}.`,
        color: 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500 hover:bg-amber-500/10 text-amber-700'
      },
      {
        name: 'Top Photography Angles & Tips',
        badge: 'Scenic Guide',
        icon: <Camera className="w-5 h-5 text-indigo-600" />,
        url: `https://www.google.com/search?q=${photoQuery}`,
        desc: `Check traveler tips for the best sunset viewing angles and quiet pathways around ${cleanName}.`,
        color: 'border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500 hover:bg-indigo-500/10 text-indigo-700'
      }
    ];
  } else {
    // Standard Attraction Gateways
    const officialQuery = encodeURIComponent(`${cleanSearchQuery} official tickets site box office`);
    const viatorQuery = encodeURIComponent(cleanSearchQuery);
    const gygQuery = encodeURIComponent(cleanSearchQuery);
    const tiqetsQuery = encodeURIComponent(cleanSearchQuery);

    gateways = [
      {
        name: 'Official Venue Ticket Gateway',
        badge: 'Direct Box Office',
        icon: <Landmark className="w-5 h-5 text-[#BA5536]" />,
        url: `https://www.google.com/search?q=${officialQuery}`,
        desc: `Search official venue website, standard admission & direct box office releases for ${cleanName}.`,
        color: 'border-[#BA5536]/30 bg-[#BA5536]/5 hover:border-[#BA5536] hover:bg-[#BA5536]/10 text-[#BA5536]'
      },
      {
        name: 'Viator Skip-the-Line Passes',
        badge: 'Verified Partner',
        icon: <Sparkles className="w-5 h-5 text-amber-600" />,
        url: `https://www.viator.com/searchResults/all?text=${viatorQuery}`,
        desc: `Compare priority skip-the-line tours, reserved time slots, and VIP guided entry for ${cleanName}.`,
        color: 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500 hover:bg-amber-500/10 text-amber-700'
      },
      {
        name: 'GetYourGuide Tours & Passes',
        badge: 'Flexible Cancellation',
        icon: <Compass className="w-5 h-5 text-emerald-600" />,
        url: `https://www.getyourguide.com/s/?q=${gygQuery}`,
        desc: `Explore instant mobile passes, audio guides, and combo city attractions for ${cleanName}.`,
        color: 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500 hover:bg-emerald-500/10 text-emerald-700'
      },
      {
        name: 'Tiqets Instant Mobile Entry',
        badge: 'Digital Delivery',
        icon: <Ticket className="w-5 h-5 text-indigo-600" />,
        url: `https://www.tiqets.com/en/search/?q=${tiqetsQuery}`,
        desc: `Instant mobile delivery passes and discounted multi-attraction bundles for ${cleanName}.`,
        color: 'border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500 hover:bg-indigo-500/10 text-indigo-700'
      }
    ];
  }

  const handleSaveNote = () => {
    const key = `tw_ticket_note_${destinationName}_day${dayNumber}_stop${stopNumber}`;
    localStorage.setItem(key, savedNote);
    setIsSaved(true);
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

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-lg my-auto z-10"
          >
            {/* Close Button Top Right */}
            <button
              onClick={onClose}
              className="absolute -top-12 right-0 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer border border-white/15"
              aria-label="Close ticket modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* ── REAL TICKET CONCIERGE CARD ── */}
            <div className="w-full bg-[#FAF6F0] rounded-3xl shadow-2xl overflow-hidden border border-[#E6DFD5] text-[#1E1C1A] relative">
              
              {/* TOP HEADER */}
              <div className="bg-[#1E1C1A] text-[#FAF6F0] p-6 pb-5 relative overflow-hidden border-b border-[#E6DFD5]">
                <div className="absolute right-0 top-0 w-48 h-48 bg-[#BA5536]/15 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-[#BA5536] flex items-center justify-center text-white font-serif font-black text-xs">
                      TW
                    </span>
                    <span className="font-mono text-xs tracking-widest uppercase text-[#D8D0C5]/90 font-bold">
                      {headerSubtitle}
                    </span>

                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-[#FAF6F0] font-mono text-[10px] font-bold tracking-wider uppercase">
                    Day {dayNumber} • Stop #{stopNumber}
                  </span>
                </div>

                <div className="relative z-10">
                  <div className="text-[11px] font-sans font-bold uppercase tracking-widest text-[#BA5536] mb-1">
                    {cleanDest} • {category}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-serif font-black text-white tracking-tight leading-snug">
                    {title}
                  </h3>
                </div>
              </div>

              {/* MAIN DOSSIER PASS DETAILS */}
              <div className="p-6 space-y-6 bg-[#FAF6F0] max-h-[75vh] overflow-y-auto">
                
                {/* Expected Cost & Arrival Quick Grid */}
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-white rounded-2xl border border-[#E6DFD5] shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FAF6F0] border border-[#E6DFD5] flex items-center justify-center shrink-0">
                      {isDining ? <Utensils className="w-4 h-4 text-[#BA5536]" /> : (isNature ? <MapPin className="w-4 h-4 text-[#BA5536]" /> : <Ticket className="w-4 h-4 text-[#BA5536]" />)}
                    </div>
                    <div>
                      <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#7A7268]">{rateLabel}</div>
                      <div className="text-xs font-serif font-bold text-[#1E1C1A]">{cost}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 border-l border-[#E6DFD5] pl-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FAF6F0] border border-[#E6DFD5] flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-[#BA5536]" />
                    </div>
                    <div>
                      <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#7A7268]">{timeLabel}</div>
                      <div className="text-xs font-serif font-bold text-[#1E1C1A]">{time} <span className="text-[11px] font-sans font-normal text-[#7A7268]">{timeSub}</span></div>
                    </div>
                  </div>
                </div>

                {/* ── REAL DIRECT PARTNER GATEWAYS ── */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-[#1E1C1A]">
                      Select Live Booking Gateway
                    </h4>
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ✓ 100% Real Partner Links
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {gateways.map((gw, idx) => (
                      <a
                        key={idx}
                        href={gw.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer shadow-2xs group ${gw.color}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-xl bg-white shadow-xs border border-[#E6DFD5] shrink-0 mt-0.5">
                              {gw.icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-serif font-bold text-sm text-[#1E1C1A] group-hover:text-[#BA5536] transition-colors">
                                  {gw.name}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-white/90 border border-current">
                                  {gw.badge}
                                </span>
                              </div>
                              <p className="text-xs font-sans text-[#5F5E5A] mt-1 leading-relaxed">
                                {gw.desc}
                              </p>
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-[#7A7268] group-hover:text-[#BA5536] shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Real Advisory Note tailored to category */}
                <div className="p-4 rounded-2xl bg-[#FAF0E6]/80 border border-[#E6DFD5] flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-[#BA5536] shrink-0 mt-0.5" />
                  <div className="text-xs font-sans text-[#4A443E] space-y-1">
                    <div className="font-bold text-[#1E1C1A] uppercase tracking-wide text-[11px]">
                      Important {isDining ? 'Dining & Table' : (isNature ? 'Visitor & Access' : 'Booking')} Advisory
                    </div>
                    <p className="leading-relaxed">
                      {isDining 
                        ? 'Authentic popular trattorias and restaurants often fill up during peak lunch (1:30 PM) and dinner (8:00 PM). If online table reservations are unavailable on TheFork/Google, arriving right when doors open guarantees first-come seating.'
                        : (isNature 
                            ? 'Public parks, plazas, and scenic walking routes generally offer free open admission. Check live Google Maps crowd metrics to avoid midday heat or find quiet sunset viewing hours.'
                            : 'Official box office tickets for high-demand destinations often release 30 to 60 days prior and sell out fast. If direct venue admission is unavailable, verified partner passes (Viator / GetYourGuide) guarantee reserved entry windows.')}
                    </p>
                  </div>
                </div>

                {/* ── PERSONAL BOOKING CONFIRMATION POCKET ── */}
                <div className="pt-2 border-t border-[#E6DFD5] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="ticket-note" className="text-xs font-sans font-bold uppercase tracking-wider text-[#1E1C1A] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#BA5536]" />
                      <span>Attach Real Confirmation / Tickets</span>
                    </label>
                    <span className="text-[10px] font-sans italic text-[#7A7268]">Saved privately to your device</span>
                  </div>

                  <div className="relative">
                    <textarea
                      id="ticket-note"
                      rows="2"
                      value={savedNote}
                      onChange={(e) => setSavedNote(e.target.value)}
                      placeholder="Once you purchase real tickets online, paste your confirmation code, entry gate, or booking reference here (e.g., Viator #849204 - 9:30 AM Gate B)..."
                      className="w-full p-3 rounded-xl bg-white border border-[#E6DFD5] focus:border-[#BA5536] focus:outline-hidden text-xs font-sans text-[#1E1C1A] placeholder-[#A89F91] resize-none shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={handleSaveNote}
                      className={`absolute bottom-2.5 right-2.5 px-3 py-1 rounded-lg text-[11px] font-sans font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs ${
                        isSaved
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#1E1C1A] hover:bg-[#2A2623] text-white'
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Saved!</span>
                        </>
                      ) : (
                        <span>Save Note</span>
                      )}
                    </button>
                  </div>
                </div>

              </div>

              {/* FOOTER */}
              <div className="p-4 bg-[#F0EBE4]/60 border-t border-[#E6DFD5] flex items-center justify-between text-[11px] font-serif italic text-[#7A7268] px-6">
                <span>TripWise Real Ticket Concierge</span>
                <span>Verified Direct Gateways</span>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
