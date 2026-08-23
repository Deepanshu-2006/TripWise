import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MapPin, CheckCircle2, ChevronRight, Navigation, Clock, Sun, Book, Info } from "lucide-react";

export const toRomanNumeral = (num) => {
  const romanMap = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X' };
  return romanMap[num] || String(num);
};

export const parseTimeToMinutes = (timeStr) => {
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

export const getDaylightPercentage = (timeStr) => {
  const mins = parseTimeToMinutes(timeStr);
  const start = 8 * 60;
  const end = 22 * 60;
  const pct = ((mins - start) / (end - start)) * 100;
  const clamped = Math.min(Math.max(pct, 0), 100);
  return Math.round(clamped * 10) / 10;
};

export const getPacingLabel = (activities = []) => {
  const count = activities.length;
  if (count <= 3) return 'Relaxed Pacing (Optimal Daylight Balance)';
  if (count <= 5) return 'Moderate Pacing (Balanced Daylight Schedule)';
  return 'Active Pacing (Comprehensive Daylight Exploration)';
};

// Removed parseEstimatedCostSafe, using getConvertedEstimatedCost from expenseApi

export const getStopEndTimeMinutes = (timeStr, durationStr) => {
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

export const getPackingItemEmoji = (text = '', category = '') => {
  const lower = text.toLowerCase();
  if (lower.includes('shirt') || lower.includes('top') || lower.includes('t-shirt')) return '👔';
  if (lower.includes('sock')) return '🧦';
  if (lower.includes('pant') || lower.includes('short') || lower.includes('jean') || lower.includes('trouser')) return '👖';
  if (lower.includes('jacket') || lower.includes('coat') || lower.includes('layer') || lower.includes('sweater')) return '🧥';
  if (lower.includes('shoe') || lower.includes('boot') || lower.includes('sneaker') || lower.includes('footwear')) return '👟';
  if (lower.includes('passport') || lower.includes('visa') || lower.includes('document') || lower.includes('id')) return '🛂';
  if (lower.includes('charger') || lower.includes('phone') || lower.includes('cable') || lower.includes('adapter')) return '🔌';
  if (lower.includes('toiletr') || lower.includes('soap') || lower.includes('shampoo') || lower.includes('brush') || lower.includes('cream')) return '🧴';
  if (lower.includes('under') || lower.includes('brief')) return '🩲';
  if (lower.includes('hat') || lower.includes('cap') || lower.includes('sunglasses')) return '🕶️';
  if (category.toLowerCase().includes('document')) return '📄';
  if (category.toLowerCase().includes('electronic')) return '💻';
  return '📦';
};

export const AnimatedSuitcaseIcon = ({ isAnimated, actionType, checkedItems, totalItems, size = 'large', flyingEmoji }) => {
  const isLarge = size === 'large';
  const isMedium = size === 'medium' || size === 'pill';
  const isComplete = checkedItems === totalItems && totalItems > 0;

  const containerClass = isLarge ? 'w-14 h-14' : isMedium ? 'w-11 h-11' : 'w-7 h-7';
  const svgSuitcaseClass = isLarge ? 'w-7 h-7' : isMedium ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <div className={`relative flex items-center justify-center ${containerClass}`}>
      {/* 1. Celebratory Confetti Burst when 100% Packed */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-30"
          >
            {[
              { x: isLarge ? -32 : -22, y: isLarge ? -32 : -22, icon: '🎉', delay: 0 },
              { x: 0, y: isLarge ? -40 : -28, icon: '⭐', delay: 0.04 },
              { x: isLarge ? 32 : 22, y: isLarge ? -32 : -22, icon: '✨', delay: 0.08 },
              { x: isLarge ? 38 : 26, y: 0, icon: '💚', delay: 0.02 },
              { x: isLarge ? 30 : 20, y: isLarge ? 30 : 20, icon: '🏆', delay: 0.06 },
              { x: 0, y: isLarge ? 38 : 26, icon: '🎉', delay: 0.03 },
              { x: isLarge ? -30 : -20, y: isLarge ? 30 : 20, icon: '✨', delay: 0.07 },
              { x: isLarge ? -38 : -26, y: 0, icon: '⭐', delay: 0.01 }
            ].map((sparkle, idx) => (
              <motion.span
                key={`complete-confetti-${idx}`}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{
                  x: sparkle.x,
                  y: sparkle.y,
                  scale: [0, isLarge ? 1.4 : 1.1, 0],
                  opacity: [1, 1, 0]
                }}
                transition={{ duration: 0.85, delay: sparkle.delay, ease: [0.22, 1, 0.36, 1] }}
                className={`absolute inset-0 flex items-center justify-center pointer-events-none ${isLarge ? 'text-sm' : 'text-xs'} select-none`}
              >
                {sparkle.icon}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Circular Progress Ring Arc */}
      {isLarge ? (
        <svg className="absolute inset-0 w-full h-full pointer-events-none -rotate-90 overflow-visible" viewBox="0 0 44 44">
          <circle
            cx="22"
            cy="22"
            r="19"
            className="stroke-[#E6DFD5]/40 fill-none"
            strokeWidth="2"
          />
          <motion.circle
            cx="22"
            cy="22"
            r="19"
            className={isComplete ? "stroke-emerald-500 fill-none" : "stroke-[#FF6B2C] fill-none"}
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ strokeDasharray: "119.38", strokeDashoffset: "119.38" }}
            animate={{
              strokeDashoffset: totalItems > 0 ? 119.38 - (119.38 * (checkedItems / totalItems)) : 119.38
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </svg>
      ) : isMedium ? (
        <svg className="absolute inset-0 w-full h-full pointer-events-none -rotate-90 overflow-visible" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r="15"
            className="stroke-white/20 fill-none"
            strokeWidth="2.5"
          />
          <motion.circle
            cx="18"
            cy="18"
            r="15"
            className={isComplete ? "stroke-emerald-400 fill-none" : "stroke-[#FF6B2C] fill-none"}
            strokeWidth="2.8"
            strokeLinecap="round"
            initial={{ strokeDasharray: "94.25", strokeDashoffset: "94.25" }}
            animate={{
              strokeDashoffset: totalItems > 0 ? 94.25 - (94.25 * (checkedItems / totalItems)) : 94.25
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </svg>
      ) : null}

      {/* 1. Context-Aware Mini Item Particle Flying into Suitcase */}
      <AnimatePresence>
        {isAnimated && actionType === 'add' && (
          <motion.div
            key="flying-parcel"
            initial={{
              y: isLarge ? -32 : -24,
              x: isLarge ? -20 : -14,
              scale: isLarge ? 1.6 : 1.2,
              opacity: 0,
              rotate: -25
            }}
            animate={{
              y: isLarge ? [-32, -14, 4] : [-24, -10, 2],
              x: isLarge ? [-20, -5, 0] : [-14, -3, 0],
              scale: isLarge ? [1.6, 1.2, 0.2, 0] : [1.2, 0.9, 0.2, 0],
              opacity: [0, 1, 1, 0],
              rotate: [-25, 12, 0]
            }}
            transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
            className={`absolute z-30 pointer-events-none flex items-center justify-center ${isLarge ? '-top-2' : '-top-1'}`}
          >
            <div className={`${isLarge ? 'w-5 h-5 rounded-xl text-xs' : 'w-4 h-4 rounded-lg text-[10px]'} bg-gradient-to-tr from-[#FF6B2C] to-[#E55A1C] text-white flex items-center justify-center shadow-lg shadow-[#FF6B2C]/50 font-bold border border-white/80`}>
              {flyingEmoji || '📦'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Dual Radial Shockwave Aura Rings */}
      <AnimatePresence>
        {isAnimated && (
          <>
            <motion.span
              key="absorb-ring-1"
              initial={{ scale: 0.4, opacity: 1 }}
              animate={{ scale: isLarge ? 2.4 : isMedium ? 1.9 : 1.6, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={`absolute inset-0 rounded-full pointer-events-none ${
                actionType === 'add' ? 'bg-gradient-to-r from-[#FF6B2C]/60 via-amber-400/40 to-transparent' : 'bg-gray-400/30'
              }`}
            />
            <motion.span
              key="absorb-ring-2"
              initial={{ scale: 0.3, opacity: 0.8 }}
              animate={{ scale: isLarge ? 1.8 : isMedium ? 1.5 : 1.3, opacity: 0 }}
              transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
              className="absolute inset-0 rounded-full pointer-events-none bg-amber-400/30"
            />
          </>
        )}
      </AnimatePresence>

      {/* 3. Vector Suitcase with Opening Top Flap & Physics Bounce */}
      <motion.div
        animate={isAnimated || isComplete ? {
          scaleY: isComplete ? [1, 1.35, 0.85, 1.15, 1] : [1, 1.42, 0.74, 1.22, 0.9, 1.04, 1],
          scaleX: isComplete ? [1, 0.85, 1.15, 0.95, 1] : [1, 0.74, 1.26, 0.88, 1.08, 0.96, 1],
          rotate: isComplete ? [0, -10, 10, 0] : [0, -14, 14, -7, 4, -2, 0],
          y: [0, -6, 5, -3, 1, 0]
        } : {}}
        transition={{ duration: 0.7, ease: [0.175, 0.885, 0.32, 1.275] }}
        className="relative flex items-center justify-center"
      >
        <div className="relative flex items-center justify-center">
          <svg
            className={`${svgSuitcaseClass} ${isLarge ? 'text-[#FF6B2C]' : isMedium ? 'text-white' : 'text-current'} ${isComplete ? (isMedium ? 'text-emerald-300' : 'text-emerald-600') : ''} stroke-[2.2] fill-none stroke-current transition-colors duration-500`}
            viewBox="0 0 24 24"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Suitcase Handle */}
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />

            {/* Glowing Open Interior Core Light */}
            {isAnimated && actionType === 'add' && (
              <motion.circle
                cx="12"
                cy="11"
                r="5"
                fill="#FFD700"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1.7, 0] }}
                transition={{ duration: 0.48 }}
                stroke="none"
              />
            )}

            {/* Suitcase Main Body Box */}
            <rect x="3" y="6" width="18" height="15" rx="3" />

            {/* Front Straps */}
            <path d="M8 6v15M16 6v15" strokeOpacity="0.4" />

            {/* Animated Top Lid Flap */}
            <motion.path
              d="M3 6h18"
              animate={isAnimated && actionType === 'add' ? {
                d: [
                  "M3 6h18",
                  "M3 6l9-6 9 6",
                  "M3 6h18"
                ]
              } : {}}
              transition={{ duration: 0.52, ease: "easeInOut" }}
              strokeWidth="2.8"
              stroke={isComplete ? (isMedium ? "#6ee7b7" : "#059669") : "currentColor"}
            />
          </svg>
          {isComplete && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: "backOut" }}
              className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-md z-20"
            >
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 fill-emerald-500 text-white" />
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export const getDayNarrativeTitle = (dayNum, destinationName) => {
  const narratives = [
    `Arrival, Settling In & First Impressions of ${destinationName}`,
    `Into the Ancient Heart & Historical Legacy`,
    `Cultural Synthesis, Culinary Journeys & Farewells`,
    `Wandering the Secondary Paths & Scenic Vistas`,
    `The Final Epilogue of Scenic Exploration`
  ];
  return narratives[(dayNum - 1) % narratives.length];
};

export const getAlternativeSuggestions = (act, idx = 0) => {
  if (act?.alternatives && Array.isArray(act.alternatives) && act.alternatives.length > 0) {
    return act.alternatives.map(a => ({
      title: a.title || a.name || 'Nearby Alternative',
      desc: a.desc || a.description || a.reason || a.note || 'Recommended nearby backup option.'
    }));
  }

  const category = (act?.category || '').toLowerCase();
  const title = (act?.title || '').toLowerCase();
  const locationStr = typeof act?.location === 'object' ? act.location?.name : act?.location;
  const location = (locationStr || '').toLowerCase();
  const stopIndex = typeof idx === 'number' ? idx : 0;
  const dayIndex = act?.dayNumber || 1;
  const hash = (stopIndex + dayIndex * 2) % 4;

  if (category.includes('din') || category.includes('food') || category.includes('rest') || category.includes('lunch') || category.includes('dinner') || title.includes('trattoria') || title.includes('osteria') || title.includes('restaurant')) {
    const diningPool = [
      [
        { title: "Trattoria da Enzo al 29", desc: "A cozy, legendary Trastevere kitchen serving classic carbonara in a rustic Roman setting." },
        { title: "Emma Pizza & Pizzeria", desc: "Crispy thin Roman pizza topped with artisanal local ingredients and premium olive oils." }
      ],
      [
        { title: "Pianostrada Laboratorio di Cucina", desc: "Chic open kitchen across the Tiber famous for gourmet foccacine and fresh handmade pasta." },
        { title: "Salumeria Roscioli", desc: "Legendary salumeria and wine bar featuring over 300 artisanal cheeses and master-level carbonara." }
      ],
      [
        { title: "Armando al Pantheon", desc: "Historic family-run trattoria steps from the Pantheon specializing in authentic Roman classics." },
        { title: "Osteria da Fortunata", desc: "Watch hand-rolled strozzapreti and tagliolini made fresh right in the front window near Campo de' Fiori." }
      ],
      [
        { title: "Colline Emiliane", desc: "Refined trattoria near Piazza Barberini renowned for hand-spun tortellini in brodo and pumpkin tortelli." },
        { title: "Supplizio", desc: "Artisanal street food haven crafted by Chef Arcangelo Dandini, serving the crispiest gourmet supplì in Rome." }
      ]
    ];
    return diningPool[hash];
  }

  if (category.includes('cafe') || category.includes('gelat') || category.includes('coffee') || title.includes('caff') || title.includes('gelat')) {
    const cafePool = [
      [
        { title: "Sant'Eustachio il Caffè", desc: "Famous since 1938 for its secret wood-roasting process and signature frothy espresso." },
        { title: "Frigidarium Gelato", desc: "Handcrafted Roman gelato dipped in a signature dark or white chocolate shell." }
      ],
      [
        { title: "Antico Caffè Greco", desc: "Rome's oldest historic coffeehouse on Via Condotti frequented by writers and artists since 1760." },
        { title: "Giolitti Artisanal Gelato", desc: "Beloved historic gelateria near Piazza Colonna offering dozens of flavors and classic table service." }
      ],
      [
        { title: "Caffè Tazza d'Oro", desc: "Iconic coffee bar right by the Pantheon famous for its granita di caffè con panna." },
        { title: "Gelateria del Teatro", desc: "All-natural gelato made with organic Sicilian lemons and Bronte pistachios on a charming cobblestone alleyway." }
      ],
      [
        { title: "Otello Gelateria", desc: "Delightful neighborhood gelateria near Trastevere crafting seasonal fruit sorbets daily." },
        { title: "Faro - Luminaries of Coffee", desc: "Modern specialty coffee roaster serving pour-overs, flat whites, and artisanal pastries near Piazza Fiume." }
      ]
    ];
    return cafePool[hash];
  }

  if (title.includes('colosseum') || title.includes('forum') || title.includes('palatine')) {
    return [
      { title: "Clementine Monti Kitchen", desc: "Intimate neighborhood trattoria in Monti serving organic Roman classics just 5 minutes from the Forum." },
      { title: "Piazza della Madonna dei Monti", desc: "Vibrant neighborhood piazza surrounded by artisan wine bars and shaded stone benches." }
    ];
  }

  if (title.includes('vatican') || title.includes('sistine') || title.includes('st. peter')) {
    return [
      { title: "Mercato Trionfale Gourmet Stalls", desc: "One of Rome's largest indoor food markets offering fresh porchetta sandwiches and local cheeses in Prati." },
      { title: "Castel Sant'Angelo Ramparts", desc: "Open-air fortress walk with sweeping panoramic views over the Tiber River and St. Peter's dome." }
    ];
  }

  if (title.includes('pantheon') || title.includes('navona') || title.includes('trevi') || location.includes('centro')) {
    return [
      { title: "Palazzo Altemps & Courtyard", desc: "Serene Renaissance palace housing classical Roman sculptures right near Piazza Navona without the crowds." },
      { title: "Chiostro del Bramante Cafe", desc: "Peaceful 16th-century monastery cloister serving coffee and pastries overlooking Bramante's architecture." }
    ];
  }

  const generalPool = [
    [
      { title: "Villa Borghese Gardens", desc: "Lush landscape park featuring quiet walkways, rowboats, and beautiful panoramic city vistas." },
      { title: "Palazzo Doria Pamphilj", desc: "Private baroque palazzo featuring masterpieces by Velázquez and Caravaggio with zero ticket lines." }
    ],
    [
      { title: "Orto Botanico di Roma", desc: "Lush 30-acre botanical garden in Trastevere featuring bamboo groves and quiet shaded pathways." },
      { title: "Piazza di Santa Maria in Trastevere", desc: "Historic neighborhood heart lined with outdoor cafes and the oldest golden mosaics in Rome." }
    ],
    [
      { title: "Terme di Caracalla Ruins", desc: "Monumental ancient Roman public baths set among grand umbrella pines with vast open lawns." },
      { title: "Giardino degli Aranci (Orange Garden)", desc: "Romantic Aventine Hill terrace overlooking St. Peter's Basilica framed by fragrant orange trees." }
    ],
    [
      { title: "Piazza del Popolo & Pincio Terrace", desc: "Grand elliptical piazza leading to the Pincio overlook for breathtaking sunset views over Rome." },
      { title: "Museo Nazionale Romano at Baths of Diocletian", desc: "Massive ancient thermal complex transformed by Michelangelo into a tranquil sculptural cloister." }
    ]
  ];
  return generalPool[hash];
};

export const Sparkline = () => (
  <svg className="w-14 h-4 text-[#FF6B2C] inline-block mr-1.5 align-middle" viewBox="0 0 50 15" fill="none">
    <path
      d="M0 10 C10 15, 12 2, 20 8 C28 14, 35 1, 50 6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

export const getContextAwareTip = (act, idx, summary) => {
  const title = (act?.title || '').toLowerCase();
  const locationStr = typeof act?.location === 'object' ? act.location?.name : act?.location;

  // Non-overlapping logistics advice instead of repeating crowd timing (which lives in custom insight)
  let logisticsNote = locationStr ? `Main entry via ${locationStr}. Walk-ins & digital passes verified at express security check.` : `Easily reached on foot or short local transit from previous stop. Walk-ins accepted; verify ticket barcode before security scan.`;

  if (title.includes('colosseum') || title.includes('forum') || title.includes('vatican') || title.includes('temple') || title.includes('castle') || title.includes('museum')) {
    logisticsNote = `Main gate entry at ${locationStr || 'Central Security Checkpoint'}. Present digital barcode or mobile reservation directly at priority turnstile.`;
  }

  // Pull exact forecast from trip data (e.g. 32°C 🌤 or 31°C ☀️)
  const forecastStr = summary?.stats?.weather || '32°C 🌤';
  let weatherNote = `Forecast: ${forecastStr}. Expected comfortable temperatures and ideal walking conditions for exploring.`;
  if (title.includes('colosseum') || title.includes('forum') || title.includes('ruin') || title.includes('plaza') || title.includes('park') || title.includes('garden') || title.includes('beach') || title.includes('walk') || title.includes('terrace')) {
    weatherNote = `Forecast: ${forecastStr}. Open outdoor site with high UV exposure—we strongly recommend hats, sunglasses, and water before 1:00 PM.`;
  } else if (title.includes('restaurant') || title.includes('indoor') || title.includes('vatican') || title.includes('museum') || title.includes('gallery') || title.includes('church') || title.includes('cathedral') || title.includes('palace') || title.includes('cafe')) {
    weatherNote = `Forecast: ${forecastStr}. Climate-controlled indoor sanctuary—a great cool escape during warm midday hours.`;
  }

  return { logisticsNote, weatherNote };
};

import { getPlaceDetails } from '@/app/actions/hotels';
import NoDossierState from '../components/NoDossierState';
import { supabase } from '../../lib/supabase';

export const getDayDateString = (startDateStr, dayIndex) => {
  if (!startDateStr) return null;
  const [year, month, day] = startDateStr.split('-');
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + dayIndex);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

