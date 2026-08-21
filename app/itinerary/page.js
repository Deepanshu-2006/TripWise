'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useTransform, useMotionValue } from 'framer-motion';
import dynamic from 'next/dynamic';
import Header from '../components/Header';
import ImageCarousel from '../components/ImageCarousel';
import InviteModal from '../components/InviteModal';
import { generatePackingList } from '../../lib/packingListLogic';
import { fetchVisaRequirements } from '../../lib/visaApi';
import { updateTrip } from '../actions/trips';
const ExpenseTrackerView = dynamic(() => import('../components/ExpenseTrackerView'));
import { useLiveAssistant } from '../hooks/useLiveAssistant';
import LiveAssistantNudge from '../components/LiveAssistantNudge';
import WeatherNudge from '../components/WeatherNudge';
const LiveAssistantProposalModal = dynamic(() => import('../components/LiveAssistantProposalModal'));
import { usePreferenceEngine } from '../hooks/usePreferenceEngine';
import { getTripExpenses, convertCurrency, getUserDisplayCurrency, formatCurrency, fetchExchangeRates, getConvertedEstimatedCost } from '../../lib/expenseApi';
import Link from 'next/link';
import {
  Download,
  Share2,
  Bell,
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
  Utensils,
  CheckSquare,
  Square,
  Trash2,
  Plus,
  RefreshCw,
  Shirt,
  Briefcase,
  Smartphone,
  Droplets,
  CheckCircle2,
  XCircle,
  Book,
  AlertTriangle,
  Menu,
  FileText,
  ShieldAlert,
  Plane,
  Luggage,
  CloudOff,
  PenLine,
  BookOpen,
  Save,
  FastForward,
  ChevronRight,
  Receipt
} from 'lucide-react';
import {
  getActivityThumbnail,
  getTransportBetweenStops,
  getActivityRating,
  getCategoryStyling,
  getIconBadges,
  getAiInsight,
  formatCost,
  getDaySummary,
  formatReviewCount,
  getGooglePlacesQuery
} from '../components/itineraryHelpers';

// Dynamically import map components to avoid SSR/window issues
const ItineraryMapModal = dynamic(() => import('../components/ItineraryMapModal'), { ssr: false });
const TicketPassModal = dynamic(() => import('../components/TicketPassModal'), { ssr: false });
import InlineDiningReservation from '../components/InlineDiningReservation';
import PriceTracker from '../components/PriceTracker';
import { getTrackingState, saveTrackingState } from '../../lib/priceTrackingApi';
const EmergencyInfoView = dynamic(() => import('../components/EmergencyInfoView'));
const EmergencyModal = dynamic(() => import('../components/EmergencyModal'));
import OfflineTripManager from '../components/OfflineTripManager';
const JournalView = dynamic(() => import('../components/JournalView'));
const JournalEntryModal = dynamic(() => import('../components/JournalEntryModal'));
import TripRecapBanner from '../components/TripRecapBanner';
const TripRecapModal = dynamic(() => import('../components/TripRecapModal'));
import { getTripJournalEntries, saveTripJournalEntries, addJournalEntry } from '../../lib/journalApi';

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
  const clamped = Math.min(Math.max(pct, 0), 100);
  return Math.round(clamped * 10) / 10;
};

const getPacingLabel = (activities = []) => {
  const count = activities.length;
  if (count <= 3) return 'Relaxed Pacing (Optimal Daylight Balance)';
  if (count <= 5) return 'Moderate Pacing (Balanced Daylight Schedule)';
  return 'Active Pacing (Comprehensive Daylight Exploration)';
};

// Removed parseEstimatedCostSafe, using getConvertedEstimatedCost from expenseApi

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

const getPackingItemEmoji = (text = '', category = '') => {
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

const AnimatedSuitcaseIcon = ({ isAnimated, actionType, checkedItems, totalItems, size = 'large', flyingEmoji }) => {
  const isLarge = size === 'large';
  const isComplete = checkedItems === totalItems && totalItems > 0;

  return (
    <div className={`relative flex items-center justify-center ${isLarge ? 'w-14 h-14' : 'w-7 h-7'}`}>
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
              { x: -32, y: -32, icon: '🎉', delay: 0 },
              { x: 0, y: -40, icon: '⭐', delay: 0.04 },
              { x: 32, y: -32, icon: '✨', delay: 0.08 },
              { x: 38, y: 0, icon: '💚', delay: 0.02 },
              { x: 30, y: 30, icon: '🏆', delay: 0.06 },
              { x: 0, y: 38, icon: '🎉', delay: 0.03 },
              { x: -30, y: 30, icon: '✨', delay: 0.07 },
              { x: -38, y: 0, icon: '⭐', delay: 0.01 }
            ].map((sparkle, idx) => (
              <motion.span
                key={`complete-confetti-${idx}`}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{
                  x: sparkle.x,
                  y: sparkle.y,
                  scale: [0, 1.4, 0],
                  opacity: [1, 1, 0]
                }}
                transition={{ duration: 0.85, delay: sparkle.delay, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none text-sm select-none"
              >
                {sparkle.icon}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Dynamic Circular Progress Ring Arc */}
      {isLarge && (
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
      )}

      {/* 1. Context-Aware Mini Item Particle Flying into Suitcase */}
      <AnimatePresence>
        {isAnimated && actionType === 'add' && (
          <motion.div
            key="flying-parcel"
            initial={{
              y: -32,
              x: -20,
              scale: 1.6,
              opacity: 0,
              rotate: -25
            }}
            animate={{
              y: [-32, -14, 4],
              x: [-20, -5, 0],
              scale: [1.6, 1.2, 0.2, 0],
              opacity: [0, 1, 1, 0],
              rotate: [-25, 12, 0]
            }}
            transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
            className="absolute z-30 pointer-events-none flex items-center justify-center -top-2"
          >
            <div className="w-5 h-5 rounded-xl bg-gradient-to-tr from-[#FF6B2C] to-[#E55A1C] text-white flex items-center justify-center text-xs shadow-lg shadow-[#FF6B2C]/50 font-bold border border-white/80">
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
              animate={{ scale: isLarge ? 2.4 : 1.8, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={`absolute inset-0 rounded-full pointer-events-none ${
                actionType === 'add' ? 'bg-gradient-to-r from-[#FF6B2C]/60 via-amber-400/40 to-transparent' : 'bg-gray-400/30'
              }`}
            />
            <motion.span
              key="absorb-ring-2"
              initial={{ scale: 0.3, opacity: 0.8 }}
              animate={{ scale: isLarge ? 1.8 : 1.4, opacity: 0 }}
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
            className={`${isLarge ? 'w-7 h-7 text-[#FF6B2C]' : 'w-4 h-4 text-current'} ${isComplete ? 'text-emerald-600' : ''} stroke-[2.2] fill-none stroke-current transition-colors duration-500`}
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
              stroke={isComplete ? "#059669" : "currentColor"}
            />
          </svg>
          {isComplete && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: "backOut" }}
              className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-md z-20"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500 text-white" />
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
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

const getAlternativeSuggestions = (act, idx = 0) => {
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

const Sparkline = () => (
  <svg className="w-14 h-4 text-[#FF6B2C] inline-block mr-1.5 align-middle" viewBox="0 0 50 15" fill="none">
    <path
      d="M0 10 C10 15, 12 2, 20 8 C28 14, 35 1, 50 6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const getContextAwareTip = (act, idx, summary) => {
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

const getDistanceAndProximity = (p1, p2, basecampName = 'Basecamp') => {
  if (!p1 || !p2 || !p1.lat || !p2.lat) {
    return { label: `10 min walk from ${basecampName}`, distKm: '0.8' };
  }
  const R = 6371; // km
  const dLat = (p2.lat - p1.lat) * (Math.PI / 180);
  const dLng = (p2.lng - p1.lng) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(p1.lat * (Math.PI / 180)) * Math.cos(p2.lat * (Math.PI / 180)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distKm = (R * c).toFixed(1);
  const distMeters = R * c * 1000;

  if (distMeters < 1200) {
    const mins = Math.max(3, Math.round(distMeters / 80));
    return { label: `${mins} min walk from ${basecampName}`, distKm };
  }
  if (distMeters < 8000) {
    const mins = Math.max(6, Math.round(distMeters / 350 + 2));
    return { label: `${mins} min taxi from ${basecampName}`, distKm };
  }
  const mins = Math.max(15, Math.round(distMeters / 600 + 5));
  return { label: `${mins} min transit from ${basecampName}`, distKm };
};
const HiddenGemsWall = dynamic(() => import('../components/HiddenGemsWall'));
const FeaturesSelection = dynamic(() => import('../components/FeaturesSelection'));
const SavedPlacesModal = dynamic(() => import('../components/SavedPlacesModal'));
import { getPlaceDetails } from '@/app/actions/hotels';
import NoDossierState from '../components/NoDossierState';
import { supabase } from '../../lib/supabase';

const getDayDateString = (startDateStr, dayIndex) => {
  if (!startDateStr) return null;
  const [year, month, day] = startDateStr.split('-');
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + dayIndex);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function ItineraryPage() {
  const [loading, setLoading] = useState(true);
  const [activeTripId, setActiveTripId] = useState(null);
  const [itinerary, setItinerary] = useState(null);
  const [userCurrency, setUserCurrency] = useState('USD');
  const [ratesReady, setRatesReady] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  useEffect(() => {
    setUserCurrency(getUserDisplayCurrency());
    fetchExchangeRates().then(() => setRatesReady(true));
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('tripwise_trip_id');
      if (storedId) setActiveTripId(storedId);
    }
  }, []);

  // Navigation & Modal State
  const [activeDay, setActiveDay] = useState(1); 
  const [activeModalDay, setActiveModalDay] = useState(null);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isSavedPlacesModalOpen, setIsSavedPlacesModalOpen] = useState(false);
  const [isRecapModalOpen, setIsRecapModalOpen] = useState(false);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);

  // Preference Engine State
  const { recordSkip, recordTripSignals, profile } = usePreferenceEngine();
  const [activityRatings, setActivityRatings] = useState({});
  
  // Journal & Skip State
  const [journalEntries, setJournalEntries] = useState([]);
  const [journalModalOpen, setJournalModalOpen] = useState(false);
  const [journalModalActivity, setJournalModalActivity] = useState(null);
  const [journalSuccessMessage, setJournalSuccessMessage] = useState(null);
  const [skipConfirmation, setSkipConfirmation] = useState(null);
  const [lastSkippedStop, setLastSkippedStop] = useState(null);

  useEffect(() => {
    if (journalSuccessMessage) {
      const timer = setTimeout(() => {
        setJournalSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [journalSuccessMessage]);

  const handleRatingChange = (actKey, activity, rating) => {
    setActivityRatings(prev => ({
      ...prev,
      [actKey]: { activity, rating }
    }));
  };

  const handleCompleteTrip = () => {
    if (!itinerary || !itinerary.days) return;
    
    const allStops = [];
    itinerary.days.forEach((day, dayIdx) => {
      if (day.activities) {
        day.activities.forEach((act, stopIdx) => {
          allStops.push({ ...act, _dayIdx: dayIdx, _stopIdx: stopIdx });
        });
      }
    });

    const bookedStops = allStops.filter(act => {
      const stopKey = `tw_day${act._dayIdx}_stop${act._stopIdx}`;
      return savedStops[stopKey];
    });

    const engagedStops = allStops.filter(act => {
      const stopKey = `tw_day${act._dayIdx}_stop${act._stopIdx}`;
      return expandedStops[stopKey];
    });

    recordTripSignals(activityRatings, bookedStops, engagedStops);
    alert("Trip complete! Your travel preferences have been updated.");
  };

  // Live Assistant State
  const activeDayData = typeof activeDay === 'number' && itinerary?.days ? itinerary.days[activeDay - 1] : null;
  const { showNudge, weatherNudge, snoozeNudges, dismissNudge, dismissWeatherNudge } = useLiveAssistant(
    activeDayData,
    typeof activeDay === 'number' ? activeDay - 1 : 0,
    itinerary?.startDate,
    itinerary?.coordinates
  );
  const [liveAssistantProposal, setLiveAssistantProposal] = useState(null);
  const [isApplyingProposal, setIsApplyingProposal] = useState(false);

  const handleWeatherSwap = async () => {
    if (!activeDayData || !weatherNudge) return;
    try {
      dismissWeatherNudge();
      const res = await fetch('/api/refine-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: "Please swap this activity for an indoor alternative due to weather.",
          currentDay: activeDayData,
          destinationName: itinerary?.destinationName,
          dayIndex: activeDay - 1,
          reason: "weather_swap",
          activityToSwap: weatherNudge.activity,
          userPreferences: profile
        }),
      });
      const data = await res.json();
      if (data.updatedDay) {
        setLiveAssistantProposal(data);
      }
    } catch (e) {
      console.error("Failed to get weather swap proposal", e);
    }
  };

  const handleLiveAssistantAdjust = async () => {
    if (!activeDayData) return;
    try {
      dismissNudge();
      const res = await fetch('/api/refine-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: "The user is running behind schedule by >15 minutes. Please intelligently skip or condense the remaining stops to keep their evening plans on track without feeling rushed.",
          currentDay: activeDayData,
          destinationName: itinerary?.destinationName,
          dayIndex: activeDay - 1,
          reason: "running_late"
        }),
      });
      const data = await res.json();
      if (data.updatedDay) {
        setLiveAssistantProposal(data);
      }
    } catch (e) {
      console.error("Failed to get live assistant proposal", e);
    }
  };

  const applyLiveAssistantProposal = () => {
    setIsApplyingProposal(true);
    setTimeout(() => {
      if (liveAssistantProposal?.updatedDay) {
        const newDays = [...(itinerary.days || [])];
        newDays[activeDay - 1] = liveAssistantProposal.updatedDay;
        const newItinerary = { ...itinerary, days: newDays };
        setItinerary(newItinerary);
        localStorage.setItem('tripwise_itinerary', JSON.stringify(newItinerary));
      }
      setIsApplyingProposal(false);
      setLiveAssistantProposal(null);
    }, 600);
  };

  // Packing List State
  const [packingList, setPackingList] = useState(null);
  const [customInputs, setCustomInputs] = useState({});
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [isPackingIconAnimated, setIsPackingIconAnimated] = useState(false);
  const [packingActionType, setPackingActionType] = useState('add');
  const [flyingItemEmoji, setFlyingItemEmoji] = useState('📦');
  const [expandedPackingCategories, setExpandedPackingCategories] = useState({
    Clothing: true,
    Documents: true,
    Electronics: true,
    Toiletries: true,
    ActivitySpecific: true
  });

  const triggerPackingAnimation = (actionType = 'add') => {
    setPackingActionType(actionType);
    setIsPackingIconAnimated(true);
    setTimeout(() => setIsPackingIconAnimated(false), 650);
  };

  // Visa & Docs State
  const [visaReqs, setVisaReqs] = useState(null);
  const [visaLoading, setVisaLoading] = useState(false);
  const [visaError, setVisaError] = useState(false);
  const [passportNationality, setPassportNationality] = useState(null);
  const [visaChecklist, setVisaChecklist] = useState(null);
  const [customVisaInput, setCustomVisaInput] = useState('');

  useEffect(() => {
    if (itinerary) {
      const tripId = activeTripId || itinerary?.id || itinerary?.db_id || 'shared-trip';
      const storageKey = `tw_packing_${tripId}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          setPackingList(JSON.parse(stored));
        } catch (e) {
          const newList = generatePackingList(itinerary);
          setPackingList(newList);
        }
      } else {
        const newList = generatePackingList(itinerary);
        setPackingList(newList);
        try {
          localStorage.setItem(storageKey, JSON.stringify(newList));
        } catch (e) { }
      }
    }
  }, [itinerary, activeTripId]);

  // Load Journal Entries
  useEffect(() => {
    if (itinerary) {
      const tripId = activeTripId || itinerary?.id || itinerary?.db_id || 'shared-trip';
      const loadedEntries = getTripJournalEntries(tripId);
      setJournalEntries(loadedEntries);
    }
  }, [itinerary, activeTripId]);

  const savePackingList = (newList) => {
    setPackingList(newList);
    const tripId = activeTripId || itinerary?.id || itinerary?.db_id || 'shared-trip';
    try {
      localStorage.setItem(`tw_packing_${tripId}`, JSON.stringify(newList));
    } catch (e) { }
  };

  const togglePackingItem = (category, itemId) => {
    if (!packingList) return;
    const target = packingList[category]?.find(i => i.id === itemId);
    const isAdding = target ? !target.checked : true;
    if (target) {
      setFlyingItemEmoji(getPackingItemEmoji(target.text, category));
    }

    const newList = { ...packingList };
    newList[category] = newList[category].map(item =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    savePackingList(newList);
    triggerPackingAnimation(isAdding ? 'add' : 'remove');
  };

  const addCustomPackingItem = (category) => {
    const text = customInputs[category]?.trim();
    if (!text || !packingList) return;
    const newList = { ...packingList };
    newList[category] = [...newList[category], {
      id: `custom-${Date.now()}`,
      text,
      checked: false,
      generated: false
    }];
    savePackingList(newList);
    setCustomInputs(prev => ({ ...prev, [category]: '' }));
  };

  const removePackingItem = (category, itemId) => {
    if (!packingList) return;
    const newList = { ...packingList };
    newList[category] = newList[category].filter(item => item.id !== itemId);
    savePackingList(newList);
  };

  const handleRegeneratePackingList = () => {
    if (!itinerary) return;
    const generatedList = generatePackingList(itinerary);
    const newList = { ...packingList };

    // For each category, keep custom items, replace generated items
    Object.keys(generatedList).forEach(cat => {
      const customItems = (newList[cat] || []).filter(i => !i.generated);
      newList[cat] = [...generatedList[cat], ...customItems];
    });

    savePackingList(newList);
    setShowRegenerateConfirm(false);
  };

  const togglePackingCategory = (category) => {
    setExpandedPackingCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const checkAllItems = () => {
    if (!packingList) return;
    const newList = { ...packingList };
    Object.keys(newList).forEach(cat => {
      newList[cat] = newList[cat].map(item => ({ ...item, checked: true }));
    });
    savePackingList(newList);
    triggerPackingAnimation('add');
  };

  const uncheckAllItems = () => {
    if (!packingList) return;
    const newList = { ...packingList };
    Object.keys(newList).forEach(cat => {
      newList[cat] = newList[cat].map(item => ({ ...item, checked: false }));
    });
    savePackingList(newList);
    triggerPackingAnimation('remove');
  };

  // Visa & Docs Logic
  useEffect(() => {
    const nat = localStorage.getItem('tripwise_passport_nationality');
    setPassportNationality(nat);
  }, []);

  useEffect(() => {
    if (activeDay === 'visa' && itinerary?.destinationName && passportNationality) {
      setVisaLoading(true);
      setVisaError(false);
      fetchVisaRequirements(passportNationality, itinerary.destinationName)
        .then(res => {
          if (res.coverage) {
            setVisaReqs(res.data);
          } else {
            setVisaError(true);
          }
        })
        .catch(() => setVisaError(true))
        .finally(() => setVisaLoading(false));
    }
  }, [activeDay, itinerary?.destinationName, passportNationality]);

  useEffect(() => {
    if (itinerary) {
      const tripId = activeTripId || itinerary?.id || itinerary?.db_id || 'shared-trip';
      const storageKey = `tw_visa_${tripId}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          setVisaChecklist(JSON.parse(stored));
        } catch (e) { }
      } else {
        const defaultChecklist = {
          'v-1': { id: 'v-1', text: 'Passport valid for 6+ months', checked: false },
          'v-2': { id: 'v-2', text: 'Visa application submitted', checked: false },
          'v-3': { id: 'v-3', text: 'Travel insurance purchased', checked: false },
          'v-4': { id: 'v-4', text: 'Flight & accommodation proof ready', checked: false }
        };
        setVisaChecklist(defaultChecklist);
      }
    }
  }, [itinerary, activeTripId]);

  const saveVisaChecklist = (newList) => {
    setVisaChecklist(newList);
    const tripId = activeTripId || itinerary?.id || itinerary?.db_id || 'shared-trip';
    try {
      localStorage.setItem(`tw_visa_${tripId}`, JSON.stringify(newList));
    } catch (e) { }
  };

  const toggleVisaItem = (itemId) => {
    if (!visaChecklist) return;
    const newList = { ...visaChecklist };
    if (newList[itemId]) {
      newList[itemId].checked = !newList[itemId].checked;
    }
    saveVisaChecklist(newList);
  };

  const addCustomVisaItem = () => {
    const text = customVisaInput?.trim();
    if (!text || !visaChecklist) return;
    const newList = { ...visaChecklist };
    const id = `custom-v-${Date.now()}`;
    newList[id] = { id, text, checked: false };
    saveVisaChecklist(newList);
    setCustomVisaInput('');
  };

  const removeVisaItem = (itemId) => {
    if (!visaChecklist) return;
    const newList = { ...visaChecklist };
    delete newList[itemId];
    saveVisaChecklist(newList);
  };

  // Publish to Community State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [publishForm, setPublishForm] = useState({ title: '', tags: '', coverPhoto: '' });
  const [isPublished, setIsPublished] = useState(false);

  const handlePublishPhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPublishForm(prev => ({ ...prev, coverPhoto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublishSubmit = () => {
    // In a real app, send to database.
    setIsPublished(true);
    setTimeout(() => {
      setIsPublishModalOpen(false);
    }, 2000);
  };
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

  // Print Mode Full-Mount State (Priority 1: Ensures 100% of DOM is rendered & mounted before window.print())
  const [isPrinting, setIsPrinting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = 'success', icon = 'Bell', action = null) => {
    setToastMessage({ message, type, icon, action });
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleBeforePrint = () => setIsPrinting(true);
      const handleAfterPrint = () => setIsPrinting(false);
      window.addEventListener('beforeprint', handleBeforePrint);
      window.addEventListener('afterprint', handleAfterPrint);
      return () => {
        window.removeEventListener('beforeprint', handleBeforePrint);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
    }
  }, []);

  // Stop Detail States
  const [expandedStops, setExpandedStops] = useState({});
  const [showAlternatives, setShowAlternatives] = useState({});
  const [savedStops, setSavedStops] = useState({});

  // Load saved stops on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tripwise_saved_stops');
      if (stored) {
        try {
          setSavedStops(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse saved stops", e);
        }
      }
    }
  }, []);
  const [shareCopied, setShareCopied] = useState(false);
  const [activePassModal, setActivePassModal] = useState(null);
  const [stampInView, setStampInView] = useState(false);

  useEffect(() => {
    if (activeDay !== 'epilogue') {
      setStampInView(false);
    }
  }, [activeDay]);

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
          } catch (e) { }

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

  const scrollToStopCard = (dayNum, stopNum) => {
    if (!dayNum || !stopNum) return;
    if (activeDay !== dayNum) {
      setActiveDay(dayNum);
      setTimeout(() => {
        const el = document.getElementById(`stop-card-${dayNum}-${stopNum}`) || document.getElementById(`dining-stop-${dayNum}-${stopNum}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 350);
    } else {
      const el = document.getElementById(`stop-card-${dayNum}-${stopNum}`) || document.getElementById(`dining-stop-${dayNum}-${stopNum}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const scrollToFirstUnbookedDining = (firstUnbooked) => {
    if (!firstUnbooked) return;
    scrollToStopCard(firstUnbooked.dayNum, firstUnbooked.stopNum);
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
  const maskOpacity = useTransform(scrollY, [450, 550], [0, 1]);



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

  const [isHeroHovered, setIsHeroHovered] = useState(false);

  // Fetch itinerary from URL param, trip_id, or localStorage
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const dossierParam = params.get('dossier');
        const tripIdParam = params.get('trip_id');
        let loadedFromUrl = false;

        if (tripIdParam) {
          try {
            const { data: tripRow, error } = await supabase
              .from('trips')
              .select('*')
              .eq('id', tripIdParam)
              .maybeSingle();

            if (!error && tripRow && tripRow.itinerary_data && isMounted) {
              let parsedData = tripRow.itinerary_data;
              if (typeof parsedData === 'string') {
                try { parsedData = JSON.parse(parsedData); } catch(e) {}
              }
              if (typeof parsedData === 'string') {
                try { parsedData = JSON.parse(parsedData); } catch(e) {}
              }
              setItinerary(parsedData);
              setActiveTripId(tripIdParam);
              localStorage.setItem('tripwise_itinerary', JSON.stringify(parsedData));
              localStorage.setItem('tripwise_trip_id', tripIdParam);
              loadedFromUrl = true;
            }
          } catch (e) {
            console.warn("Failed to fetch trip by trip_id:", e);
          }
        }

        if (!loadedFromUrl && dossierParam) {
          try {
            let rawJsonStr = dossierParam;
            if (rawJsonStr.startsWith('%') || rawJsonStr.includes('%22') || rawJsonStr.includes('%7B')) {
              try {
                rawJsonStr = decodeURIComponent(rawJsonStr);
              } catch (e) { }
            }
            let parsed = JSON.parse(rawJsonStr);
            if (typeof parsed === 'string') {
              try { parsed = JSON.parse(parsed); } catch(e) {}
            }
            if (parsed && parsed.days && isMounted) {
              setItinerary(parsed);
              localStorage.setItem('tripwise_itinerary', JSON.stringify(parsed));
              loadedFromUrl = true;
            }
          } catch (err) {
            console.error("Failed to parse dossier from URL:", err);
          }
        }

        if (!loadedFromUrl) {
          const stored = localStorage.getItem('tripwise_itinerary');
          if (stored && isMounted) {
            try {
              let parsed = JSON.parse(stored);
              if (typeof parsed === 'string') {
                try { parsed = JSON.parse(parsed); } catch(e) {}
              }
              setItinerary(parsed);
            } catch (err) {
              console.error("Failed to parse stored itinerary:", err);
            }
          }
        }

        const tabParam = params.get('tab');
        if (tabParam && isMounted) {
          if (!isNaN(parseInt(tabParam))) {
            setActiveDay(parseInt(tabParam));
          } else {
            setActiveDay(tabParam);
          }
        }

        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, []);

  const toggleExpandStop = (stopKey) => {
    setExpandedStops(prev => ({ ...prev, [stopKey]: !prev[stopKey] }));
  };

  const toggleAlternatives = (stopKey) => {
    setShowAlternatives(prev => ({ ...prev, [stopKey]: !prev[stopKey] }));
  };

  const toggleSaveStop = (stopKey) => {
    const isCurrentlySaved = savedStops[stopKey];
    
    if (isCurrentlySaved) {
      showToast('Removed from your curated collection', 'info', 'Bookmark');
    } else {
      showToast('Pinned to your TripWise Dossier', 'success', 'Bookmark');
    }

    setSavedStops(prev => {
      const newState = { ...prev, [stopKey]: !prev[stopKey] };
      if (typeof window !== 'undefined') {
        localStorage.setItem('tripwise_saved_stops', JSON.stringify(newState));
      }
      return newState;
    });
  };

  const handleRequestSkip = (dayNum, stopNum, category, title) => {
    setSkipConfirmation({
      dayNum,
      stopNum,
      category,
      title: title || `Stop ${stopNum}`
    });
  };

  const handleConfirmSkip = () => {
    if (!skipConfirmation) return;
    const { dayNum, stopNum, category, title } = skipConfirmation;
    recordSkip(category);
    const newDays = [...(itinerary.days || [])];
    const dayIdx = dayNum - 1;
    if (newDays[dayIdx] && newDays[dayIdx].activities) {
      const skippedActivity = newDays[dayIdx].activities[stopNum - 1];
      setLastSkippedStop({ activity: skippedActivity, dayNum, stopNum });
      newDays[dayIdx].activities = newDays[dayIdx].activities.filter((_, idx) => idx !== (stopNum - 1));
      const newItinerary = { ...itinerary, days: newDays };
      setItinerary(newItinerary);
      if (typeof window !== 'undefined') {
        localStorage.setItem('tripwise_itinerary', JSON.stringify(newItinerary));
      }
      setJournalSuccessMessage({
        isSkip: true,
        title: skippedActivity ? skippedActivity.title : title || 'Activity'
      });
    }
    setSkipConfirmation(null);
  };

  const handleUndoSkip = () => {
    if (!lastSkippedStop) return;
    const { activity, dayNum, stopNum } = lastSkippedStop;
    const newDays = [...(itinerary.days || [])];
    const dayIdx = dayNum - 1;
    if (newDays[dayIdx] && newDays[dayIdx].activities) {
      newDays[dayIdx].activities.splice(stopNum - 1, 0, activity);
      const newItinerary = { ...itinerary, days: newDays };
      setItinerary(newItinerary);
      if (typeof window !== 'undefined') {
        localStorage.setItem('tripwise_itinerary', JSON.stringify(newItinerary));
      }
    }
    setLastSkippedStop(null);
    setJournalSuccessMessage(null);
  };

  const handleShareDossier = () => {
    setIsInviteModalOpen(true);
  };

  const handlePrintOrDownload = () => {
    if (typeof window !== 'undefined') {
      setIsPrinting(true);
      setTimeout(() => {
        window.print();
        setTimeout(() => setIsPrinting(false), 500);
      }, 150);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] text-[#1E1C1A] flex flex-col items-center justify-center font-serif">
        <div className="w-10 h-10 rounded-full border-2 border-[#FF6B2C] border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-serif italic text-[#7A7268] tracking-wide">Assembling your custom Trip Dossier...</p>
      </div>
    );
  }

  if (!itinerary) {
    return <NoDossierState />;
  }

  const rawDest = itinerary.destinationName || 'Your Custom Journey';
  const hasDemo = rawDest.toLowerCase().includes('demo mode');
  const destinationNameClean = rawDest.replace(/\s*\(demo mode\)/i, '').trim();

  const days = itinerary.days || [];
  const totalStopsCount = days.reduce((acc, d) => acc + (d.activities?.length || 0), 0);

  const totalDistanceEst = days.reduce((acc, d, i) => {
    const summary = getDaySummary(d, i, days);
    const num = parseFloat(summary?.stats?.distance || '3');
    return acc + (isNaN(num) ? 3 : num);
  }, 0).toFixed(1);

  const preBookedItems = days.reduce((acc, d, dIdx) => {
    const dNum = dIdx + 1;
    const dest = itinerary.destinationName || 'Destination';
    (d.activities || []).forEach((a, aIdx) => {
      const stopNum = aIdx + 1;
      const catLower = (a.category || a.type || '').toLowerCase();
      const titleLower = (a.title || '').toLowerCase();
      const isDining = catLower.includes('din') || catLower.includes('food') || catLower.includes('rest') || catLower.includes('cafe') || catLower.includes('bar') || catLower.includes('lunch') || catLower.includes('dinner') || catLower.includes('breakfast') || titleLower.includes('osteria') || titleLower.includes('trattoria') || titleLower.includes('restaurant') || titleLower.includes('cafe') || titleLower.includes('bistro') || titleLower.includes('gelat') || titleLower.includes('pizzeria') || titleLower.includes('tavern');
      const isNature = !isDining && (catLower.includes('park') || catLower.includes('nature') || catLower.includes('garden') || catLower.includes('beach') || catLower.includes('walk') || catLower.includes('view') || catLower.includes('scenic') || titleLower.includes('park') || titleLower.includes('garden') || titleLower.includes('fountain') || titleLower.includes('plaza') || titleLower.includes('piazza') || titleLower.includes('villa borghese') || titleLower.includes('spanish steps'));

      if (isDining) {
        const storageKey = `tw_dining_res_${dest}_d${dNum}_s${stopNum}`;
        let isConf = false;
        let confCode = 'Table Marked Reserved';
        try {
          if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed && (parsed.status === 'marked_reserved' || parsed.status === 'confirmed')) {
                isConf = true;
                if (parsed.confNum) confCode = `Ref: ${parsed.confNum}`;
              }
            }
          }
        } catch (e) { }

        acc.push({
          item: `${a.title || 'Restaurant'} (Day ${dNum})`,
          status: isConf ? 'Pre-booked' : 'Action Needed',
          code: isConf ? confCode : 'Table Reservation Required / Recommended',
          dayNum: dNum,
          stopNum: stopNum,
          isPrebooked: isConf
        });
      } else {
        const ticketKey = `tw_ticket_note_${dest}_day${dNum}_stop${stopNum}`;
        let ticketNote = '';
        try {
          if (typeof window !== 'undefined') {
            ticketNote = localStorage.getItem(ticketKey) || '';
          }
        } catch (e) { }

        if (ticketNote.trim()) {
          acc.push({
            item: `${a.title || 'Attraction'} (Day ${dNum})`,
            status: 'Pre-booked',
            code: `Ref: ${ticketNote.trim()}`,
            dayNum: dNum,
            stopNum: stopNum,
            isPrebooked: true
          });
        } else if (!isNature) {
          acc.push({
            item: `${a.title || 'Attraction'} (Day ${dNum})`,
            status: 'Action Needed',
            code: 'Ticket Pass / Time Slot Gateway',
            dayNum: dNum,
            stopNum: stopNum,
            isPrebooked: false
          });
        } else {
          acc.push({
            item: `${a.title || 'Park & Scenic Site'} (Day ${dNum})`,
            status: 'Open Access',
            code: 'No Ticket Required (Public Entry)',
            dayNum: dNum,
            stopNum: stopNum,
            isPrebooked: true
          });
        }
      }
    });
    return acc;
  }, []);

  const tripDiningRollup = computeDiningRollup(null);

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#1E1C1A] flex flex-col font-sans selection:bg-[#FF6B2C]/15">
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-0.75 bg-[#FF6B2C] origin-left z-60 pointer-events-none print:hidden"
      />

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30, x: '-50%', scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
            exit={{ opacity: 0, y: 20, x: '-50%', scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 450, damping: 25 }}
            className="fixed bottom-20 sm:bottom-10 left-1/2 z-[99999] pointer-events-auto w-[92%] sm:w-auto max-w-md select-none"
          >
            <div className={`relative overflow-hidden flex items-center justify-between gap-2.5 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl shadow-2xl border backdrop-blur-md ${toastMessage.type === 'success' ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900' :
                toastMessage.type === 'error' ? 'bg-red-50/95 border-red-200 text-red-900' :
                  toastMessage.type === 'expense' ? 'bg-orange-50/95 border-orange-200 text-[#E55A1C]' :
                    'bg-white/95 border-[#E6DFD5] text-[#1E1C1A]'
              }`}>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {toastMessage.icon === 'Bell' && <Bell className="w-4 h-4 shrink-0" />}
                {toastMessage.icon === 'CheckCircle2' && (
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.05 }}
                    className="shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </motion.div>
                )}
                {toastMessage.icon === 'Trash2' && (
                  <motion.div
                    initial={{ y: -15, opacity: 0, rotate: 15 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 12, delay: 0.05 }}
                    className="shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.div>
                )}
                {toastMessage.icon === 'Receipt' && (
                  <motion.div
                    initial={{ scale: 0, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 12, delay: 0.05 }}
                    className="shrink-0"
                  >
                    <Receipt className="w-4 h-4" />
                  </motion.div>
                )}
                {toastMessage.icon === 'Bookmark' && (
                  <motion.div
                    initial={{ scale: 0, rotate: 45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 12, delay: 0.05 }}
                    className="shrink-0"
                  >
                    <Bookmark className="w-4 h-4" />
                  </motion.div>
                )}
                <span className="text-xs sm:text-sm font-semibold truncate leading-tight">{toastMessage.message}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {toastMessage.action && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      toastMessage.action.onClick();
                      setToastMessage(null);
                    }}
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-black/5 shadow-2xs border border-black/5 text-[10px] sm:text-[11px] uppercase tracking-wider font-extrabold transition-colors cursor-pointer"
                  >
                    {toastMessage.action.label}
                    <ChevronRight className="w-3 h-3 opacity-70" />
                  </motion.button>
                )}
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setToastMessage(null)} 
                  className="p-1 rounded-full hover:bg-black/5 text-current/70 hover:text-current cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </motion.button>
              </div>
              
              {/* Toast Auto-Dismiss Timer */}
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 5, ease: "linear" }}
                className="absolute bottom-0 left-0 h-0.75 bg-current opacity-20"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="print:hidden">
        <motion.div
          style={{ opacity: maskOpacity }}
          className="fixed top-0 left-0 right-0 h-18 sm:h-22 bg-[#FAF6F0] z-30 pointer-events-none"
        />
        <Header />
      </div>

      <section
        onMouseEnter={() => setIsHeroHovered(true)}
        onMouseLeave={() => setIsHeroHovered(false)}
        className="relative w-full min-h-135 md:min-h-145 pt-32 pb-8 px-6 flex flex-col justify-end overflow-hidden border-b border-[#E6DFD5] print:hidden cursor-default select-none"
      >
        <motion.div
          style={{
            translateY: reduceMotion ? "0%" : bgY,
            opacity: reduceMotion ? 1 : heroOpacity
          }}
          className="absolute inset-0 z-0 origin-center"
        >
          <motion.img
            initial={reduceMotion ? { scale: 1.1 } : { scale: 1.1 }}
            animate={
              reduceMotion
                ? { scale: 1.1 }
                : isHeroHovered
                  ? { scale: 1.3, filter: "saturate(1.18) brightness(1.04)" }
                  : { scale: 1.25, filter: "saturate(1) brightness(1)" }
            }
            transition={{ duration: 1.5, ease: "easeOut" }}
            src={itinerary.heroImage || `/api/image?q=${encodeURIComponent((destinationNameClean || 'beautiful travel destination') + ' landmark')}`}
            alt={destinationNameClean}
            className="w-full h-full object-cover object-[center_30%] pointer-events-none"
          />
        </motion.div>

        <motion.div
          style={{ translateY: reduceMotion ? "0%" : midY, opacity: reduceMotion ? 1 : heroOpacity }}
          className="absolute inset-0 z-10 pointer-events-none bg-linear-to-tr from-black/95 via-black/40 to-transparent"
        />

        <div className="absolute bottom-0 left-0 right-0 h-28 bg-linear-to-t from-[#FAF6F0] via-[#FAF6F0]/40 to-transparent z-15 pointer-events-none" />

        <motion.div
          style={{
            translateY: reduceMotion ? "0%" : foreY,
            scale: reduceMotion ? 1 : foreScale,
            opacity: reduceMotion ? 1 : heroOpacity
          }}
          animate={isHeroHovered ? { y: -6 } : { y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-5xl mx-auto w-full relative z-20 flex flex-col gap-5 pt-16"
        >
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            className="flex items-center flex-wrap gap-2.5"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#FF6B2C] to-[#E0591F] text-white font-mono text-[10px] font-bold tracking-widest uppercase shadow-md shadow-[#FF6B2C]/25 border border-white/20">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
              </span>
              <span>Curated Travel Guide</span>
            </span>

            {hasDemo && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 border border-white/20 text-white/90 font-mono text-[10px] font-bold tracking-widest uppercase backdrop-blur-md shadow-xs">
                <span>Demo Mode</span>
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/90 font-serif italic text-[11px] backdrop-blur-md shadow-xs">
              <Sparkles size={11} className="text-[#FF6B2C]" />
              <span>Refined by TripWise Private Concierge</span>
            </span>

            {itinerary?.hotelMode === 'basecamp' || (itinerary?.basecampHotel || itinerary?.preferences?.basecamp) ? (
              <motion.button
                type="button"
                onClick={() => setActiveDay('tracking')}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-400/30 hover:border-emerald-400/50 text-emerald-100 font-mono text-[10px] font-bold tracking-wider uppercase backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all duration-300 cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-emerald-400/10 to-emerald-400/0 opacity-50 rounded-full" />
                <span className="relative z-10 text-emerald-400 animate-pulse">🏡</span>
                <span className="relative z-10 text-emerald-50">Basecamp: {itinerary?.basecampHotel || itinerary?.preferences?.basecamp}</span>
              </motion.button>
            ) : (
              <motion.button
                type="button"
                onClick={() => setActiveDay('tracking')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group/basecamp relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/40 text-white/90 hover:text-white font-mono text-[10px] font-bold tracking-wider uppercase backdrop-blur-xl shadow-lg transition-all duration-300 cursor-pointer overflow-visible"
              >
                <div className="absolute inset-[-1px] rounded-full opacity-0 group-hover/basecamp:opacity-100 transition-opacity duration-500 z-0">
                   <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FF6B2C] via-orange-400 to-[#FF6B2C] opacity-40 blur-[4px] animate-pulse" />
                </div>
                
                <div className="absolute inset-0 rounded-full bg-black/20 group-hover/basecamp:bg-black/40 transition-colors duration-300 z-0 border border-white/20 group-hover/basecamp:border-white/40" />
                
                <motion.div 
                  className="relative z-10 flex items-center justify-center text-[#FF6B2C] drop-shadow-[0_0_8px_rgba(255,107,44,0.6)] text-xs"
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  📍
                </motion.div>
                
                <span className="relative z-10 drop-shadow-sm tracking-widest">BASECAMP: CHOOSE HOTEL</span>
                
                <ArrowRight 
                  size={12} 
                  strokeWidth={2.5}
                  className="relative z-10 text-white/40 group-hover/basecamp:text-[#FF6B2C] group-hover/basecamp:translate-x-1 transition-all duration-300" 
                />
              </motion.button>
            )}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.215, 0.61, 0.355, 1], delay: 0.35 }}
            className="text-5xl sm:text-7xl md:text-8xl font-serif font-black tracking-tight text-white leading-[1.04] drop-shadow-sm"
          >
            {destinationNameClean}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.5 }}
            className="text-xl sm:text-2xl font-serif italic text-[#FFF4EB] max-w-3xl leading-relaxed mt-3 mb-5 font-normal drop-shadow-xs"
          >
            “{itinerary.tagline || 'An immersive, thoughtfully paced exploration tailored to your unique preference guide.'}”
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.65 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-6 border-t border-white/15 pt-6 w-full max-w-4xl mt-4"
          >
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs font-sans font-bold text-white/70 uppercase tracking-widest">Duration</span>
              <span className="text-2xl sm:text-3xl font-serif font-black text-white mt-1.5">{days.length} Days</span>
              {itinerary.startDate && (
                <span className="text-[10px] text-white/50 font-sans mt-0.5">
                  {getDayDateString(itinerary.startDate, 0)} – {getDayDateString(itinerary.startDate, days.length - 1)}
                </span>
              )}
            </div>
            <div className="flex flex-col border-l border-white/10 pl-6 last:border-0">
              <span className="text-[10px] sm:text-xs font-sans font-bold text-white/70 uppercase tracking-widest">Curated Stops</span>
              <span className="text-2xl sm:text-3xl font-serif font-black text-white mt-1.5">{totalStopsCount} Stops</span>
            </div>
            <div className="flex flex-col border-l border-white/10 pl-6 last:border-0 cursor-pointer" onClick={() => setActiveDay('expenses')}>
              <span className="text-[10px] sm:text-xs font-sans font-bold text-white/70 uppercase tracking-widest">
                {typeof window !== 'undefined' && getTripExpenses(itinerary?.id || itinerary?.db_id || activeTripId || 'default-trip').length > 0 ? 'Spent / Budget' : 'Est. Budget'}
              </span>
              <span className="text-2xl sm:text-3xl font-serif font-black text-[#FF6B2C] mt-1.5">
                {(() => {
                  if (typeof window === 'undefined') return itinerary.estimatedCost || '$1,450';
                  const currentExp = getTripExpenses(itinerary?.id || itinerary?.db_id || activeTripId || 'default-trip');
                  if (currentExp.length === 0) return getConvertedEstimatedCost(itinerary.estimatedCost, userCurrency);
                  const spentTotal = currentExp.reduce((acc, e) => acc + convertCurrency(e.amount, e.currency, userCurrency), 0);
                  
                  return `${formatCurrency(spentTotal, userCurrency)} of ${getConvertedEstimatedCost(itinerary.estimatedCost, userCurrency)}`;
                })()}
              </span>
            </div>
            <div className="flex flex-col border-l border-white/10 pl-6 last:border-0">
              <span className="text-[10px] sm:text-xs font-sans font-bold text-white/70 uppercase tracking-widest">Daylight Pacing</span>
              <span className="text-2xl sm:text-3xl font-serif font-black text-white mt-1.5 truncate" title="Immersive & Fluid">Fluid</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <TripRecapBanner 
        itinerary={itinerary} 
        onLaunchRecap={() => setIsRecapModalOpen(true)} 
      />

      <div className="sticky top-[66px] sm:top-[70px] z-40 bg-[#FAF6F0]/95 backdrop-blur-md border-b border-[#E6DFD5] pt-3 sm:pt-4 pb-0 px-4 sm:px-6 shadow-2xs transition-all print:hidden">
        <div className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row sm:items-end justify-between gap-4 relative">
          
          <div className="relative flex-1 min-w-0 flex items-center">
            {/* Day Tabs */}
            <div className="flex items-center gap-0.5 sm:gap-1.5 overflow-x-auto w-full no-scrollbar pb-0 pr-4 lg:pr-12">
              {days.map((day, dIdx) => {
                const dayNum = day.dayNumber || dIdx + 1;
                const isSelected = activeDay === dayNum;
                const dateStr = getDayDateString(itinerary.startDate, dIdx);
                return (
                  <button
                    key={dayNum}
                    onClick={() => setActiveDay(dayNum)}
                    className={`group relative pb-3.5 pt-2 px-2.5 sm:px-3.5 text-xs font-serif font-bold transition-all duration-200 shrink-0 cursor-pointer select-none whitespace-nowrap flex flex-col items-center justify-center ${isSelected ? 'text-[#1E1C1A] font-black' : 'text-[#7A7268] hover:text-[#1E1C1A]'
                      }`}
                  >
                    <span>Day {toRomanNumeral(dayNum)}</span>
                    {dateStr && (
                      <span className="text-[9px] font-sans text-stone-400 font-bold -mt-0.5 tracking-wide">{dateStr}</span>
                    )}
                    {!isSelected && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#E6DFD5] rounded-t-full opacity-0 scale-x-50 group-hover:opacity-100 group-hover:scale-x-100 transition-all duration-300 ease-out origin-center" />
                    )}
                    {isSelected && (
                      <motion.div
                        layoutId="activeTabUnderline"
                        className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#FF6B2C] rounded-t-full"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}

              <button
                onClick={() => setActiveDay('epilogue')}
                className={`group relative pb-3.5 pt-2 px-2.5 sm:px-3.5 text-xs font-serif italic transition-all duration-200 shrink-0 cursor-pointer select-none whitespace-nowrap ${activeDay === 'epilogue' ? 'text-[#1E1C1A] font-black' : 'text-[#7A7268] hover:text-[#1E1C1A]'
                  }`}
              >
                <span>Epilogue</span>
                {activeDay !== 'epilogue' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#E6DFD5] rounded-t-full opacity-0 scale-x-50 group-hover:opacity-100 group-hover:scale-x-100 transition-all duration-300 ease-out origin-center" />
                )}
                {activeDay === 'epilogue' && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#FF6B2C] rounded-t-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>

              <button
                onClick={() => setActiveDay('journal')}
                className={`group relative pb-3.5 pt-2 px-2.5 sm:px-3.5 text-xs font-serif italic transition-all duration-200 shrink-0 cursor-pointer select-none whitespace-nowrap ${activeDay === 'journal' ? 'text-[#1E1C1A] font-black' : 'text-[#7A7268] hover:text-[#1E1C1A]'
                  }`}
              >
                <span>Journal</span>
                {activeDay !== 'journal' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#E6DFD5] rounded-t-full opacity-0 scale-x-50 group-hover:opacity-100 group-hover:scale-x-100 transition-all duration-300 ease-out origin-center" />
                )}
                {activeDay === 'journal' && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#FF6B2C] rounded-t-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>

              <button
                onClick={() => setActiveDay('tracking')}
                className={`group relative pb-3.5 pt-2 px-2.5 sm:px-3.5 text-xs font-serif italic transition-all duration-200 shrink-0 cursor-pointer select-none whitespace-nowrap ${activeDay === 'tracking' ? 'text-[#1E1C1A] font-black' : 'text-[#7A7268] hover:text-[#1E1C1A]'
                  }`}
              >
                <span>Price Tracking</span>
                {activeDay !== 'tracking' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#E6DFD5] rounded-t-full opacity-0 scale-x-50 group-hover:opacity-100 group-hover:scale-x-100 transition-all duration-300 ease-out origin-center" />
                )}
                {activeDay === 'tracking' && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.75 bg-[#FF6B2C] rounded-t-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            </div>
            
            <div className="absolute right-0 top-0 bottom-[3px] w-14 bg-gradient-to-l from-[#FAF6F0] via-[#FAF6F0]/80 to-transparent pointer-events-none flex items-center justify-end z-10">
              <ChevronRight className="w-4 h-4 text-[#FF6B2C] opacity-70 animate-pulse mr-1 mt-1" />
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pb-3.5 w-full sm:w-auto">
            {/* Mobile Sidebar Trigger Icon (Placed on the left of action buttons row) */}
            <button
              onClick={() => setIsMobileDrawerOpen(prev => !prev)}
              className={`lg:hidden shrink-0 flex flex-col justify-center items-center gap-1 w-8.5 h-8.5 rounded-full transition-all duration-300 border select-none active:scale-95 cursor-pointer ${
                isMobileDrawerOpen
                  ? 'bg-[#FF6B2C] border-[#FF6B2C] shadow-[#FF6B2C]/25 shadow-md'
                  : 'bg-white hover:bg-stone-50 border-[#E6DFD5] hover:border-[#FF6B2C]/50 shadow-xs'
              }`}
              title={isMobileDrawerOpen ? "Close Tools Menu" : "Open Tools Menu"}
              aria-label={isMobileDrawerOpen ? "Close Tools Menu" : "Open Tools Menu"}
            >
              <span
                className={`block w-4 h-[1.8px] rounded-full transition-transform duration-300 ${
                  isMobileDrawerOpen
                    ? 'bg-white rotate-45 translate-y-[5.5px]'
                    : 'bg-[#FF6B2C]'
                }`}
              />
              <span
                className={`block w-4 h-[1.8px] rounded-full transition-opacity duration-300 ${
                  isMobileDrawerOpen
                    ? 'opacity-0'
                    : 'bg-[#FF6B2C]'
                }`}
              />
              <span
                className={`block w-4 h-[1.8px] rounded-full transition-transform duration-300 ${
                  isMobileDrawerOpen
                    ? 'bg-white -rotate-45 -translate-y-[5.5px]'
                    : 'bg-[#FF6B2C]'
                }`}
              />
            </button>

            <div className="flex items-center gap-2 shrink-0 flex-nowrap">
            <div className="relative group/print">
              <motion.button
                whileTap={{ scale: 0.92 }}
                type="button"
                onClick={handlePrintOrDownload}
                className="group/btn relative overflow-hidden inline-flex items-center gap-0 xl:gap-1.5 px-3 xl:px-4 py-1.5 rounded-full border border-[#E6DFD5]/80 bg-gradient-to-b from-white to-[#FAF6F0] text-xs font-sans font-bold text-[#1E1C1A] hover:border-[#FF6B2C]/60 hover:shadow-[0_8px_20px_-6px_rgba(255,107,44,0.4)] hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 ease-out cursor-pointer"
              >
                <div className="absolute top-0 left-[-100%] w-[120%] h-full bg-gradient-to-r from-transparent via-white/90 to-transparent skew-x-[-25deg] group-hover/btn:left-[100%] transition-all duration-700 ease-out z-0 pointer-events-none" />
                
                <div className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#FF6B2C]/30 rounded-full blur-md opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 z-0 pointer-events-none" />
                
                <div className="relative flex items-center justify-center w-4 h-4 z-10">
                  <div className="absolute top-1 w-2.5 h-2 bg-white border border-[#1E1C1A] rounded-[1px] opacity-0 group-hover/btn:opacity-100 group-active/btn:opacity-100 group-hover/btn:-translate-y-2.5 group-active/btn:-translate-y-2.5 transition-all duration-500 ease-out flex flex-col justify-evenly px-[1px] py-[1px] shadow-sm">
                     <div className="w-full h-[0.5px] bg-[#1E1C1A]/40" />
                     <div className="w-full h-[0.5px] bg-[#1E1C1A]/40" />
                  </div>
                  <div className="bg-white rounded-[2px] relative z-10">
                    <Printer className="w-4 h-4 text-[#FF6B2C] group-hover/btn:scale-110 group-active/btn:scale-125 transition-transform duration-300" />
                  </div>
                </div>
                <span className="hidden xl:inline relative z-10 group-hover/btn:text-[#FF6B2C] transition-colors duration-300 ml-1.5">Download PDF</span>
              </motion.button>
              <div className="absolute right-0 top-full mt-2.5 opacity-0 translate-y-1 pointer-events-none group-hover/print:opacity-100 group-hover/print:translate-y-0 transition-all duration-300 ease-out z-50 bg-[#1E1C1A] text-white text-[10px] font-sans py-1.5 px-2.5 rounded-lg shadow-lg whitespace-nowrap border border-[#FF6B2C]/40">
                💡 Tip: Uncheck "Headers and footers" in print dialog
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={handleShareDossier}
              className="group/btn relative overflow-hidden inline-flex items-center gap-0 xl:gap-1.5 px-3 xl:px-4 py-1.5 rounded-full border border-[#E6DFD5]/80 bg-gradient-to-b from-white to-[#FAF6F0] text-xs font-sans font-bold text-[#1E1C1A] hover:border-[#FF6B2C]/60 hover:shadow-[0_8px_20px_-6px_rgba(255,107,44,0.4)] hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 ease-out cursor-pointer"
            >
              <div className="absolute top-0 left-[-100%] w-[120%] h-full bg-gradient-to-r from-transparent via-white/90 to-transparent skew-x-[-25deg] group-hover/btn:left-[100%] transition-all duration-700 ease-out z-0 pointer-events-none" />
              
              <div className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#FF6B2C]/30 rounded-full blur-md opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 z-0 pointer-events-none" />
              
              {shareCopied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 relative z-10 group-hover/btn:scale-110 group-active/btn:scale-125 transition-transform duration-300" />
                  <span className="hidden xl:inline text-emerald-700 relative z-10 transition-colors duration-300 ml-1.5">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-[#FF6B2C] relative z-10 group-hover/btn:scale-110 group-hover/btn:rotate-[15deg] group-active/btn:scale-125 group-active/btn:rotate-[25deg] transition-transform duration-300 ease-out" />
                  <span className="hidden xl:inline relative z-10 group-hover/btn:text-[#FF6B2C] transition-colors duration-300 ml-1.5">Share Link</span>
                </>
              )}
            </motion.button>

            <OfflineTripManager
              tripId={activeTripId || itinerary?.id || itinerary?.db_id || 'default-trip'}
              itinerary={itinerary}
              expenses={getTripExpenses(itinerary?.id || itinerary?.db_id || activeTripId || 'default-trip')}
              packingList={packingList}
              visaReqs={visaReqs}
              externalIsOpen={isOfflineModalOpen}
              onCloseExternal={() => setIsOfflineModalOpen(false)}
            />

            <motion.a
              whileTap={{ scale: 0.92 }}
              href={itinerary?.id || itinerary?.db_id || activeTripId ? `/ai-planner/new?action=view&trip_id=${itinerary?.id || itinerary?.db_id || activeTripId}` : '/ai-planner'}
              className="group/edit relative overflow-hidden inline-flex items-center gap-0 xl:gap-1.5 px-3 xl:px-5 py-1.5 rounded-full border border-[#FF6B2C] bg-white text-xs font-sans font-bold text-[#FF6B2C] hover:text-white hover:shadow-[0_8px_20px_-6px_rgba(255,107,44,0.6)] hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 ease-out cursor-pointer ml-0 xl:ml-1"
            >
              {/* Premium Left-to-Right Ink Fill */}
              <div className="absolute inset-0 bg-[#FF6B2C] origin-left scale-x-0 group-hover/edit:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] z-0 pointer-events-none" />
              
              <Edit3 className="w-4 h-4 relative z-10 group-hover/edit:-translate-y-0.5 group-hover/edit:translate-x-0.5 group-hover/edit:rotate-12 group-hover/edit:scale-110 group-active/edit:rotate-24 group-active/edit:scale-125 transition-all duration-300" />
              
              <span className="hidden xl:inline relative z-10 ml-1.5">Edit in Planner</span>
            </motion.a>
            </div>
          </div>
        </div>

        {/* Mobile Vertical Sidebar Panel (Anchored Directly Beneath the Entire Horizontal Sidebar Below All 4 Buttons) */}
        <AnimatePresence>
          {isMobileDrawerOpen && (
            <>
              {/* Backdrop below entire horizontal bar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileDrawerOpen(false)}
                className="fixed inset-0 top-[180px] bg-black/25 backdrop-blur-[2px] z-30 lg:hidden"
              />

              {/* Tools Panel Emerging from Left Screen Edge */}
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={{ left: 0.65, right: 0.05 }}
                onDragEnd={(e, info) => {
                  if (info.offset.x < -30 || info.velocity.x < -200) {
                    setIsMobileDrawerOpen(false);
                  }
                }}
                initial={{ x: "-100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "-100%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className="lg:hidden absolute top-[calc(100%-1px)] left-0 z-40 p-2 bg-white/95 backdrop-blur-xl rounded-r-3xl rounded-l-none border-y border-r border-[#E6DFD5] border-l-0 shadow-[8px_20px_40px_rgba(0,0,0,0.12)] flex flex-col items-center gap-1.5 w-27 select-none touch-pan-y"
              >
                {/* Prepare Group */}
                <div className="flex flex-col items-center w-full gap-1">
                  <div className="flex items-center justify-center gap-1 px-1 w-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2C] shrink-0" />
                    <span className="text-[8.5px] font-mono font-black uppercase tracking-widest text-[#FF6B2C]">
                      Prepare
                    </span>
                  </div>

                  {/* Packing List */}
                  {(() => {
                    const totalItems = packingList ? Object.values(packingList).flat().length : 0;
                    const checkedItems = packingList ? Object.values(packingList).flat().filter(i => i.checked).length : 0;
                    const isZero = checkedItems === 0;
                    const isComplete = totalItems > 0 && checkedItems === totalItems;
                    const progressRatio = totalItems > 0 ? checkedItems / totalItems : 0;
                    const isSelected = activeDay === 'packing';

                    return (
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        type="button"
                        onClick={() => { setActiveDay('packing'); setIsMobileDrawerOpen(false); }}
                        className={`relative w-full py-1.25 px-1 rounded-xl flex flex-col items-center justify-center gap-0.75 transition-all duration-150 cursor-pointer select-none group ${
                          isSelected
                            ? 'bg-gradient-to-b from-[#1E1C1A] to-[#2D2A26] text-white shadow-xs border border-[#FF6B2C]/50 scale-[1.02]'
                            : 'bg-[#FAF6F0] hover:bg-[#F5F0E8] text-[#1E1C1A] border border-transparent'
                        }`}
                        title="Packing List"
                      >
                        <div className={`relative p-1 rounded-lg transition-all z-10 group-active:scale-125 ${
                          isSelected ? 'bg-[#FF6B2C]/20 text-[#FF6B2C] border border-[#FF6B2C]/40 shadow-2xs' : 'bg-white text-[#1E1C1A] group-hover:text-[#FF6B2C] shadow-2xs'
                        }`}>
                          <AnimatedSuitcaseIcon
                            isAnimated={isPackingIconAnimated}
                            actionType={packingActionType}
                            checkedItems={checkedItems}
                            totalItems={totalItems}
                            size="small"
                            flyingEmoji={flyingItemEmoji}
                          />
                        </div>
                        
                        <span className="text-[9.5px] font-sans font-bold leading-none tracking-tight text-center relative z-10">
                          Packing
                        </span>

                        {totalItems > 0 && (
                          <div className="flex items-center gap-1 relative z-10 mt-0.5">
                            <svg className="w-2.5 h-2.5 -rotate-90" viewBox="0 0 14 14">
                              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="2" fill="none" className={isSelected ? 'text-white/20' : 'text-stone-300'} />
                              <circle
                                cx="7"
                                cy="7"
                                r="5"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="none"
                                strokeDasharray={31.4}
                                strokeDashoffset={31.4 - progressRatio * 31.4}
                                strokeLinecap="round"
                                className={`transition-all duration-500 ${isComplete ? 'text-emerald-400' : 'text-[#FF6B2C]'}`}
                              />
                            </svg>
                            <span className={`text-[7.5px] font-mono font-black ${
                              isSelected ? 'text-stone-300' : isComplete ? 'text-emerald-600' : 'text-stone-600'
                            }`}>
                              {checkedItems}/{totalItems}
                            </span>
                          </div>
                        )}
                      </motion.button>
                    );
                  })()}

                  {/* Visa & Docs */}
                  {(() => {
                    const isSelected = activeDay === 'visa';
                    return (
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        type="button"
                        onClick={() => { setActiveDay('visa'); setIsMobileDrawerOpen(false); }}
                        className={`relative w-full py-1.25 px-1 rounded-xl flex flex-col items-center justify-center gap-0.75 transition-all duration-150 cursor-pointer select-none group ${
                          isSelected
                            ? 'bg-gradient-to-b from-[#1E1C1A] to-[#2D2A26] text-white shadow-xs border border-[#FF6B2C]/50 scale-[1.02]'
                            : 'bg-[#FAF6F0] hover:bg-[#F5F0E8] text-[#1E1C1A] border border-transparent'
                        }`}
                        title="Visa & Docs"
                      >
                        <div className={`p-1 rounded-lg transition-all relative z-10 group-active:scale-125 group-active:rotate-6 ${
                          isSelected ? 'bg-gradient-to-br from-[#FF6B2C] to-[#E55A1C] text-white shadow-2xs' : 'bg-white text-[#1E1C1A] group-hover:text-[#FF6B2C] shadow-2xs'
                        }`}>
                          <FileText className="w-3.5 h-3.5 stroke-[2.2]" />
                        </div>
                        <span className="text-[9.5px] font-sans font-bold leading-none tracking-tight text-center whitespace-nowrap relative z-10">
                          Visa &amp; Docs
                        </span>
                      </motion.button>
                    );
                  })()}

                  {/* Bookmarks */}
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    type="button"
                    onClick={() => { setIsSavedPlacesModalOpen(true); setIsMobileDrawerOpen(false); }}
                    className="w-full py-1.25 px-1 rounded-xl flex flex-col items-center justify-center gap-0.75 transition-all duration-150 cursor-pointer select-none group bg-[#FAF6F0] hover:bg-[#F5F0E8] text-[#1E1C1A] border border-transparent"
                    title="Saved Bookmarks"
                  >
                    <div className="p-1 rounded-lg transition-all bg-white text-[#1E1C1A] group-hover:text-[#FF6B2C] group-active:scale-125 group-active:rotate-12 shadow-2xs">
                      <Bookmark className="w-3.5 h-3.5 stroke-[2.2] group-hover:fill-[#FF6B2C]/20" />
                    </div>
                    <span className="text-[9.5px] font-sans font-bold leading-none tracking-tight text-center">
                      Bookmarks
                    </span>
                  </motion.button>
                </div>

                <div className="w-full h-px bg-[#E6DFD5]/80 my-0.5" />

                {/* Live Group */}
                <div className="flex flex-col items-center w-full gap-1">
                  <div className="flex items-center justify-center gap-1 px-1 w-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="text-[8.5px] font-mono font-black uppercase tracking-widest text-[#FF6B2C]">
                      Live
                    </span>
                  </div>

                  {/* Tracking */}
                  {(() => {
                    const isSelected = activeDay === 'tracking';
                    return (
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        type="button"
                        onClick={() => { setActiveDay('tracking'); setIsMobileDrawerOpen(false); }}
                        className={`relative w-full py-1.25 px-1 rounded-xl flex flex-col items-center justify-center gap-0.75 transition-all duration-150 cursor-pointer select-none group ${
                          isSelected
                            ? 'bg-gradient-to-b from-[#1E1C1A] to-[#2D2A26] text-white shadow-xs border border-[#FF6B2C]/50 scale-[1.02]'
                            : 'bg-[#FAF6F0] hover:bg-[#F5F0E8] text-[#1E1C1A] border border-transparent'
                        }`}
                        title="Price Tracking"
                      >
                        <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5 z-20">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                        </span>

                        <div className={`p-1 rounded-lg transition-all relative z-10 group-active:scale-125 group-active:rotate-12 ${
                          isSelected ? 'bg-gradient-to-br from-[#FF6B2C] to-[#E55A1C] text-white shadow-2xs' : 'bg-white text-[#1E1C1A] group-hover:text-[#FF6B2C] shadow-2xs'
                        }`}>
                          <Plane className="w-3.5 h-3.5 stroke-[2.2]" />
                        </div>
                        <span className="text-[9.5px] font-sans font-bold leading-none tracking-tight text-center relative z-10">
                          Tracking
                        </span>
                      </motion.button>
                    );
                  })()}

                  {/* Expenses */}
                  {(() => {
                    const isSelected = activeDay === 'expenses';
                    const tripExpenses = typeof window !== 'undefined'
                      ? getTripExpenses(itinerary?.id || itinerary?.db_id || activeTripId || 'default-trip')
                      : [];
                    const totalSpent = tripExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

                    return (
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        type="button"
                        onClick={() => { setActiveDay('expenses'); setIsMobileDrawerOpen(false); }}
                        className={`relative w-full py-1.25 px-1 rounded-xl flex flex-col items-center justify-center gap-0.75 transition-all duration-150 cursor-pointer select-none group ${
                          isSelected
                            ? 'bg-gradient-to-b from-[#1E1C1A] to-[#2D2A26] text-white shadow-xs border border-[#FF6B2C]/50 scale-[1.02]'
                            : 'bg-[#FAF6F0] hover:bg-[#F5F0E8] text-[#1E1C1A] border border-transparent'
                        }`}
                        title="In-Trip Expense Tracker"
                      >
                        <div className={`p-1 rounded-lg transition-all relative z-10 group-active:scale-125 ${
                          isSelected ? 'bg-[#FF6B2C]/20 text-[#FF6B2C] border border-[#FF6B2C]/40 shadow-2xs' : 'bg-white text-[#FF6B2C] shadow-2xs'
                        }`}>
                          <DollarSign className="w-3.5 h-3.5 stroke-[2.2]" />
                        </div>
                        <span className="text-[9.5px] font-sans font-bold leading-none tracking-tight text-center relative z-10">
                          Expenses
                        </span>

                        {totalSpent > 0 && (
                          <span className={`px-1.5 py-0 rounded-full text-[7.5px] font-mono font-black shadow-2xs transition-colors relative z-10 ${
                            isSelected ? 'bg-[#FF6B2C] text-white' : 'bg-[#FF6B2C]/15 text-[#FF6B2C]'
                          }`}>
                            ₹{totalSpent > 999 ? `${(totalSpent / 1000).toFixed(1)}k` : totalSpent}
                          </span>
                        )}
                      </motion.button>
                    );
                  })()}

                  {/* Safety */}
                  {(() => {
                    const isSelected = activeDay === 'emergency';
                    return (
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        type="button"
                        onClick={() => { setActiveDay('emergency'); setIsMobileDrawerOpen(false); }}
                        className={`relative w-full py-1.25 px-1 rounded-xl flex flex-col items-center justify-center gap-0.75 transition-all duration-150 cursor-pointer select-none group ${
                          isSelected
                            ? 'bg-gradient-to-b from-[#1E1C1A] to-[#2D2A26] text-white shadow-xs border border-[#FF6B2C]/50 scale-[1.02]'
                            : 'bg-[#FAF6F0] hover:bg-[#F5F0E8] text-[#1E1C1A] border border-transparent'
                        }`}
                        title="Emergency Safety Info"
                      >
                        <div className={`p-1 rounded-lg transition-all relative z-10 group-active:scale-125 group-active:rotate-6 ${
                          isSelected ? 'bg-gradient-to-br from-[#FF6B2C] to-[#E55A1C] text-white shadow-2xs' : 'bg-white text-[#FF6B2C] shadow-2xs'
                        }`}>
                          <ShieldAlert className="w-3.5 h-3.5 stroke-[2.2]" />
                        </div>
                        <span className="text-[9.5px] font-sans font-bold leading-none tracking-tight text-center relative z-10">
                          Safety
                        </span>
                      </motion.button>
                    );
                  })()}
                </div>

                <div className="w-full h-px bg-[#E6DFD5]/80 my-0.5" />

                {/* Roadmap Group */}
                <div className="flex flex-col items-center w-full gap-1 p-1 rounded-xl bg-[#FAF6F0]/80 border border-dashed border-[#E6DFD5]">
                  <div className="flex items-center justify-center gap-1 px-1 w-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7A7268]/50 shrink-0" />
                    <span className="text-[8px] font-mono font-black uppercase tracking-widest text-[#7A7268]">
                      Roadmap
                    </span>
                  </div>

                  {/* Offline */}
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    type="button"
                    onClick={() => { setIsOfflineModalOpen(true); setIsMobileDrawerOpen(false); }}
                    className="w-full py-1.25 px-1 rounded-xl flex flex-col items-center justify-center gap-0.75 transition-all duration-150 cursor-pointer select-none group bg-[#FAF6F0] hover:bg-[#F5F0E8] text-[#1E1C1A] border border-transparent"
                    title="Offline Availability & Pack Download"
                  >
                    <div className="p-1 rounded-lg bg-white text-[#FF6B2C] group-active:scale-125 shadow-2xs">
                      <CloudOff className="w-3.5 h-3.5 stroke-[2.2]" />
                    </div>
                    <span className="text-[9.5px] font-sans font-bold leading-none tracking-tight text-center">
                      Offline
                    </span>
                    <span className="px-1.5 py-0 rounded-full bg-emerald-100 text-emerald-800 text-[7.5px] font-mono font-black border border-emerald-300">
                      READY
                    </span>
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* DOSSIER BODY CONTENT & DESKTOP SIDEBAR RAIL */}
      <div className="max-w-6xl mx-auto px-6 py-12 w-full flex items-start gap-8 relative">
        
        {/* DESKTOP VERTICAL UTILITY SIDEBAR RAIL (Desktop Only - hidden on mobile/tablet < lg) */}
        <aside className="hidden lg:flex flex-col items-center p-2.5 bg-[#FAF6F0]/90 backdrop-blur-xl backdrop-saturate-150 rounded-3xl border border-[#E6DFD5] shadow-[0_12px_36px_rgba(0,0,0,0.06),0_0_20px_rgba(255,107,44,0.04)] sticky top-[140px] lg:top-[150px] shrink-0 h-fit z-20 font-sans gap-2 w-28 transition-all duration-200">
          
          {/* GROUP 1: PREPARE (Pre-trip planning tools) */}
          <div className="flex flex-col items-center w-full gap-2 pt-1 lg:pt-0">
            <div className="flex items-center justify-center gap-1.5 px-1 w-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2C] shrink-0" />
              <span className="text-[9px] font-mono font-black uppercase tracking-widest text-[#FF6B2C]">
                Prepare
              </span>
            </div>

            {/* Packing List Rail Item */}
            {(() => {
              const totalItems = packingList ? Object.values(packingList).flat().length : 0;
              const checkedItems = packingList ? Object.values(packingList).flat().filter(i => i.checked).length : 0;
              const isZero = checkedItems === 0;
              const isComplete = totalItems > 0 && checkedItems === totalItems;
              const progressRatio = totalItems > 0 ? checkedItems / totalItems : 0;
              const isSelected = activeDay === 'packing';

              return (
                <div className="relative group/tool w-full">
                  <button
                    type="button"
                    onClick={() => { setActiveDay('packing'); setIsMobileDrawerOpen(false); }}
                    className={`relative w-full py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer select-none group ${
                      isSelected
                        ? 'text-white scale-[1.02]'
                        : 'bg-white hover:bg-stone-50 text-[#1E1C1A] hover:scale-[1.03] hover:shadow-md hover:border-[#FF6B2C]/40 border border-[#E6DFD5]/60 shadow-2xs'
                    }`}
                    title="Packing List"
                  >
                    {/* Active Sliding Glider */}
                    {isSelected && (
                      <motion.div
                        layoutId="activeToolGliderDesktop"
                        className="absolute inset-0 bg-gradient-to-b from-[#1E1C1A] to-[#2D2A26] rounded-2xl shadow-md border border-[#FF6B2C]/50 z-0"
                        transition={{ type: "spring", stiffness: 450, damping: 30 }}
                      />
                    )}

                    <div className={`relative p-1.5 rounded-xl transition-all z-10 ${
                      isSelected ? 'bg-[#FF6B2C]/20 text-[#FF6B2C] border border-[#FF6B2C]/40 shadow-xs' : 'bg-[#FAF6F0] text-[#1E1C1A] group-hover:text-[#FF6B2C] shadow-2xs'
                    }`}>
                      <AnimatedSuitcaseIcon
                        isAnimated={isPackingIconAnimated}
                        actionType={packingActionType}
                        checkedItems={checkedItems}
                        totalItems={totalItems}
                        size="small"
                        flyingEmoji={flyingItemEmoji}
                      />
                    </div>
                    
                    <span className="text-[10px] font-sans font-bold leading-none tracking-tight text-center relative z-10">
                      Packing
                    </span>

                    {/* Circular Live Packing Progress Badge */}
                    {totalItems > 0 && (
                      <div className="flex items-center gap-1.5 relative z-10 mt-0.5">
                        <svg className="w-3 h-3 -rotate-90" viewBox="0 0 14 14">
                          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="2" fill="none" className={isSelected ? 'text-white/20' : 'text-stone-300'} />
                          <circle
                            cx="7"
                            cy="7"
                            r="5"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            strokeDasharray={31.4}
                            strokeDashoffset={31.4 - progressRatio * 31.4}
                            strokeLinecap="round"
                            className={`transition-all duration-500 ${isComplete ? 'text-emerald-400' : 'text-[#FF6B2C]'}`}
                          />
                        </svg>
                        <span className={`text-[8.5px] font-mono font-black ${
                          isSelected ? 'text-stone-300' : isComplete ? 'text-emerald-600' : 'text-stone-600'
                        }`}>
                          {checkedItems}/{totalItems}
                        </span>
                      </div>
                    )}
                  </button>

                  {/* Rich Floating Tooltip Glance Card */}
                  <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 opacity-0 pointer-events-none group-hover/tool:opacity-100 group-hover/tool:pointer-events-auto transition-all duration-200 z-50 translate-x-1 group-hover/tool:translate-x-0">
                    <div className="bg-[#1E1C1A]/95 text-white backdrop-blur-md rounded-xl p-2.5 shadow-xl border border-[#FF6B2C]/30 text-left w-44 pointer-events-none">
                      <div className="text-[11px] font-serif font-black text-[#FF6B2C] flex items-center justify-between">
                        <span>Packing Essentials</span>
                        <span className="text-[9px] font-mono text-stone-400">{checkedItems}/{totalItems}</span>
                      </div>
                      <p className="text-[9.5px] text-stone-300 font-sans mt-0.5 leading-snug">
                        Interactive luggage checklist with category categorization.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Visa & Docs Rail Item */}
            {(() => {
              const isSelected = activeDay === 'visa';
              return (
                <div className="relative group/tool w-full">
                  <button
                    type="button"
                    onClick={() => { setActiveDay('visa'); setIsMobileDrawerOpen(false); }}
                    className={`relative w-full py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer select-none group ${
                      isSelected
                        ? 'text-white scale-[1.02]'
                        : 'bg-white hover:bg-stone-50 text-[#1E1C1A] hover:scale-[1.03] hover:shadow-md hover:border-[#FF6B2C]/40 border border-[#E6DFD5]/60 shadow-2xs'
                    }`}
                    title="Visa & Docs"
                  >
                    {/* Active Sliding Glider */}
                    {isSelected && (
                      <motion.div
                        layoutId="activeToolGliderDesktop"
                        className="absolute inset-0 bg-gradient-to-b from-[#1E1C1A] to-[#2D2A26] rounded-2xl shadow-md border border-[#FF6B2C]/50 z-0"
                        transition={{ type: "spring", stiffness: 450, damping: 30 }}
                      />
                    )}

                    <div className={`p-1.5 rounded-xl transition-all relative z-10 ${
                      isSelected ? 'bg-gradient-to-br from-[#FF6B2C] to-[#E55A1C] text-white shadow-xs' : 'bg-[#FAF6F0] text-[#1E1C1A] group-hover:text-[#FF6B2C] shadow-2xs'
                    }`}>
                      <FileText className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <span className="text-[10px] font-sans font-bold leading-none tracking-tight text-center whitespace-nowrap relative z-10">
                      Visa &amp; Docs
                    </span>
                  </button>

                  {/* Rich Tooltip */}
                  <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 opacity-0 pointer-events-none group-hover/tool:opacity-100 group-hover/tool:pointer-events-auto transition-all duration-200 z-50 translate-x-1 group-hover/tool:translate-x-0">
                    <div className="bg-[#1E1C1A]/95 text-white backdrop-blur-md rounded-xl p-2.5 shadow-xl border border-[#FF6B2C]/30 text-left w-44 pointer-events-none">
                      <div className="text-[11px] font-serif font-black text-[#FF6B2C]">Visa &amp; Passports</div>
                      <p className="text-[9.5px] text-stone-300 font-sans mt-0.5 leading-snug">
                        Entry requirements, validity rules &amp; emergency embassy records.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Bookmarks Rail Item */}
            <div className="relative group/tool w-full">
              <button
                type="button"
                onClick={() => { setIsSavedPlacesModalOpen(true); setIsMobileDrawerOpen(false); }}
                className="w-full py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer select-none group bg-white hover:bg-stone-50 text-[#1E1C1A] hover:scale-[1.03] hover:shadow-md hover:border-[#FF6B2C]/40 border border-[#E6DFD5]/60 shadow-2xs"
                title="Saved Bookmarks"
              >
                <div className="p-1.5 rounded-xl transition-all bg-[#FAF6F0] text-[#1E1C1A] group-hover:text-[#FF6B2C] shadow-2xs">
                  <Bookmark className="w-4 h-4 stroke-[2.2] group-hover:fill-[#FF6B2C]/20" />
                </div>
                <span className="text-[10px] font-sans font-bold leading-none tracking-tight text-center">
                  Bookmarks
                </span>
              </button>

              {/* Rich Tooltip */}
              <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 opacity-0 pointer-events-none group-hover/tool:opacity-100 group-hover/tool:pointer-events-auto transition-all duration-200 z-50 translate-x-1 group-hover/tool:translate-x-0">
                <div className="bg-[#1E1C1A]/95 text-white backdrop-blur-md rounded-xl p-2.5 shadow-xl border border-[#FF6B2C]/30 text-left w-44 pointer-events-none">
                  <div className="text-[11px] font-serif font-black text-[#FF6B2C]">Saved Places</div>
                  <p className="text-[9.5px] text-stone-300 font-sans mt-0.5 leading-snug">
                    Quick-access vault of your pinned spots and saved places.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-[#E6DFD5]" />

          {/* GROUP 2: LIVE (Active during-trip tools) */}
          <div className="flex flex-col items-center w-full gap-2">
            <div className="flex items-center justify-center gap-1.5 px-1 w-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[9px] font-mono font-black uppercase tracking-widest text-[#FF6B2C]">
                Live
              </span>
            </div>

            {/* Price Tracking Rail Item */}
            {(() => {
              const isSelected = activeDay === 'tracking';
              return (
                <div className="relative group/tool w-full">
                  <button
                    type="button"
                    onClick={() => { setActiveDay('tracking'); setIsMobileDrawerOpen(false); }}
                    className={`relative w-full py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer select-none group ${
                      isSelected
                        ? 'text-white scale-[1.02]'
                        : 'bg-white hover:bg-stone-50 text-[#1E1C1A] hover:scale-[1.03] hover:shadow-md hover:border-[#FF6B2C]/40 border border-[#E6DFD5]/60 shadow-2xs'
                    }`}
                    title="Price Tracking"
                  >
                    {/* Active Sliding Glider */}
                    {isSelected && (
                      <motion.div
                        layoutId="activeToolGliderDesktop"
                        className="absolute inset-0 bg-gradient-to-b from-[#1E1C1A] to-[#2D2A26] rounded-2xl shadow-md border border-[#FF6B2C]/50 z-0"
                        transition={{ type: "spring", stiffness: 450, damping: 30 }}
                      />
                    )}

                    {/* Live Active Data Pulsing Dot */}
                    <span className="absolute top-2 right-2 flex h-2 w-2 z-20">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>

                    <div className={`p-1.5 rounded-xl transition-all relative z-10 ${
                      isSelected ? 'bg-gradient-to-br from-[#FF6B2C] to-[#E55A1C] text-white shadow-xs' : 'bg-[#FAF6F0] text-[#1E1C1A] group-hover:text-[#FF6B2C] shadow-2xs'
                    }`}>
                      <Plane className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <span className="text-[10px] font-sans font-bold leading-none tracking-tight text-center relative z-10">
                      Tracking
                    </span>
                  </button>

                  {/* Rich Tooltip */}
                  <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 opacity-0 pointer-events-none group-hover/tool:opacity-100 group-hover/tool:pointer-events-auto transition-all duration-200 z-50 translate-x-1 group-hover/tool:translate-x-0">
                    <div className="bg-[#1E1C1A]/95 text-white backdrop-blur-md rounded-xl p-2.5 shadow-xl border border-[#FF6B2C]/30 text-left w-44 pointer-events-none">
                      <div className="text-[11px] font-serif font-black text-[#FF6B2C] flex items-center justify-between">
                        <span>Price Tracking</span>
                        <span className="text-[8px] font-mono bg-emerald-900/60 text-emerald-300 px-1.5 py-0.5 rounded-full">LIVE</span>
                      </div>
                      <p className="text-[9.5px] text-stone-300 font-sans mt-0.5 leading-snug">
                        Real-time airfare, hotel fluctuations &amp; drop alerts.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Expenses Item (Active Utility) */}
            {(() => {
              const isSelected = activeDay === 'expenses';
              const tripExpenses = typeof window !== 'undefined'
                ? getTripExpenses(itinerary?.id || itinerary?.db_id || activeTripId || 'default-trip')
                : [];
              const totalSpent = tripExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

              return (
                <div className="relative group/tool w-full">
                  <button
                    type="button"
                    onClick={() => { setActiveDay('expenses'); setIsMobileDrawerOpen(false); }}
                    className={`relative w-full py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer select-none group ${
                      isSelected
                        ? 'text-white scale-[1.02]'
                        : 'bg-white hover:bg-stone-50 text-[#1E1C1A] hover:scale-[1.03] hover:shadow-md hover:border-[#FF6B2C]/40 border border-[#E6DFD5]/60 shadow-2xs'
                    }`}
                    title="In-Trip Expense Tracker"
                  >
                    {/* Active Sliding Glider */}
                    {isSelected && (
                      <motion.div
                        layoutId="activeToolGliderDesktop"
                        className="absolute inset-0 bg-gradient-to-b from-[#1E1C1A] to-[#2D2A26] rounded-2xl shadow-md border border-[#FF6B2C]/50 z-0"
                        transition={{ type: "spring", stiffness: 450, damping: 30 }}
                      />
                    )}

                    <div className={`p-1.5 rounded-xl transition-all relative z-10 ${
                      isSelected ? 'bg-[#FF6B2C]/20 text-[#FF6B2C] border border-[#FF6B2C]/40 shadow-xs' : 'bg-[#FAF6F0] text-[#FF6B2C] shadow-2xs'
                    }`}>
                      <DollarSign className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <span className="text-[10px] font-sans font-bold leading-none tracking-tight text-center relative z-10">
                      Expenses
                    </span>

                    {totalSpent > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-mono font-black shadow-2xs mt-0.5 transition-colors relative z-10 ${
                        isSelected ? 'bg-[#FF6B2C] text-white' : 'bg-[#FF6B2C]/15 text-[#FF6B2C]'
                      }`}>
                        ₹{totalSpent > 999 ? `${(totalSpent / 1000).toFixed(1)}k` : totalSpent}
                      </span>
                    )}
                  </button>

                  {/* Rich Tooltip */}
                  <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 opacity-0 pointer-events-none group-hover/tool:opacity-100 group-hover/tool:pointer-events-auto transition-all duration-200 z-50 translate-x-1 group-hover/tool:translate-x-0">
                    <div className="bg-[#1E1C1A]/95 text-white backdrop-blur-md rounded-xl p-2.5 shadow-xl border border-[#FF6B2C]/30 text-left w-44 pointer-events-none">
                      <div className="text-[11px] font-serif font-black text-[#FF6B2C] flex items-center justify-between">
                        <span>Expense Vault</span>
                        {totalSpent > 0 && <span className="text-[9px] font-mono text-stone-300">₹{totalSpent.toLocaleString()}</span>}
                      </div>
                      <p className="text-[9.5px] text-stone-300 font-sans mt-0.5 leading-snug">
                        Live spend logs, split bills, receipts &amp; budget tracking.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Safety / Emergency Info Rail Item */}
            {(() => {
              const isSelected = activeDay === 'emergency';
              return (
                <div className="relative group/tool w-full">
                  <button
                    type="button"
                    onClick={() => { setActiveDay('emergency'); setIsMobileDrawerOpen(false); }}
                    className={`relative w-full py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer select-none group ${
                      isSelected
                        ? 'text-white scale-[1.02]'
                        : 'bg-white hover:bg-stone-50 text-[#1E1C1A] hover:scale-[1.03] hover:shadow-md hover:border-[#FF6B2C]/40 border border-[#E6DFD5]/60 shadow-2xs'
                    }`}
                    title="Emergency Safety Info"
                  >
                    {/* Active Sliding Glider */}
                    {isSelected && (
                      <motion.div
                        layoutId="activeToolGliderDesktop"
                        className="absolute inset-0 bg-gradient-to-b from-[#1E1C1A] to-[#2D2A26] rounded-2xl shadow-md border border-[#FF6B2C]/50 z-0"
                        transition={{ type: "spring", stiffness: 450, damping: 30 }}
                      />
                    )}

                    <div className={`p-1.5 rounded-xl transition-all relative z-10 ${
                      isSelected ? 'bg-gradient-to-br from-[#FF6B2C] to-[#E55A1C] text-white shadow-xs' : 'bg-[#FAF6F0] text-[#FF6B2C] shadow-2xs'
                    }`}>
                      <ShieldAlert className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <span className="text-[10px] font-sans font-bold leading-none tracking-tight text-center relative z-10">
                      Safety
                    </span>
                  </button>

                  {/* Rich Tooltip */}
                  <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 opacity-0 pointer-events-none group-hover/tool:opacity-100 group-hover/tool:pointer-events-auto transition-all duration-200 z-50 translate-x-1 group-hover/tool:translate-x-0">
                    <div className="bg-[#1E1C1A]/95 text-white backdrop-blur-md rounded-xl p-2.5 shadow-xl border border-[#FF6B2C]/30 text-left w-44 pointer-events-none">
                      <div className="text-[11px] font-serif font-black text-[#FF6B2C]">Emergency Hub</div>
                      <p className="text-[9.5px] text-stone-300 font-sans mt-0.5 leading-snug">
                        Local emergency numbers, nearest hospitals &amp; travel insurance info.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* GROUP 3: ROADMAP / COMING SOON (Distinct visual zone) */}
          <div className="flex flex-col items-center w-full gap-2 p-1.5 rounded-2xl bg-[#FAF6F0]/80 border border-dashed border-[#E6DFD5] mt-1">
            <div className="flex items-center justify-center gap-1.5 px-1 w-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7A7268]/50 shrink-0" />
              <span className="text-[9px] font-mono font-black uppercase tracking-widest text-[#7A7268]">
                Roadmap
              </span>
            </div>

            {/* Offline Pack Item */}
            <div className="relative group/tool w-full">
              <button
                type="button"
                onClick={() => { setIsOfflineModalOpen(true); setIsMobileDrawerOpen(false); }}
                className="w-full py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer select-none group bg-white hover:bg-stone-50 text-[#1E1C1A] hover:scale-[1.03] hover:shadow-md hover:border-[#FF6B2C]/40 border border-[#E6DFD5]/60 shadow-2xs"
                title="Offline Availability & Pack Download"
              >
                <div className="p-1.5 rounded-xl bg-[#FAF6F0] text-[#FF6B2C] shadow-2xs">
                  <CloudOff className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span className="text-[10px] font-sans font-bold leading-none tracking-tight text-center">
                  Offline
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[8px] font-mono font-black border border-emerald-300">
                  READY
                </span>
              </button>

              {/* Rich Tooltip */}
              <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 opacity-0 pointer-events-none group-hover/tool:opacity-100 group-hover/tool:pointer-events-auto transition-all duration-200 z-50 translate-x-1 group-hover/tool:translate-x-0">
                <div className="bg-[#1E1C1A]/95 text-white backdrop-blur-md rounded-xl p-2.5 shadow-xl border border-[#FF6B2C]/30 text-left w-44 pointer-events-none">
                  <div className="text-[11px] font-serif font-black text-[#FF6B2C] flex items-center justify-between">
                    <span>Offline Pack</span>
                    <span className="text-[8px] font-mono bg-emerald-900/60 text-emerald-300 px-1.5 py-0.5 rounded-full">READY</span>
                  </div>
                  <p className="text-[9.5px] text-stone-300 font-sans mt-0.5 leading-snug">
                    Full offline offline access for flights &amp; low connectivity spots.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN DOSSIER CONTENT PANEL */}
        <main className="flex-1 min-w-0 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDay}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full flex flex-col gap-16"
            >

        {/* THE DOSSIER INDEX (Overview List - Screen Only) */}
        {activeDay !== 'epilogue' && activeDay !== 'packing' && activeDay !== 'visa' && activeDay !== 'tracking' && activeDay !== 'emergency' && activeDay !== 'expenses' && activeDay !== 'journal' && (
          <section className="bg-white rounded-3xl border border-[#E6DFD5] p-8 sm:p-10 shadow-sm relative overflow-hidden print:hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-[#FF6B2C]/5 via-transparent to-transparent pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E6DFD5]">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-[#FF6B2C] font-bold block mb-1">
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

            {/* Approximate Activity Routing Notice for Undecided Hotel Mode */}
            {(itinerary?.hotelMode === 'undecided' || (!itinerary?.basecampHotel && !itinerary?.preferences?.basecamp)) && (
              <div className="bg-[#FFF9F5] border-l-4 border-[#FF6B2C] p-4 rounded-r-2xl mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#FF6B2C]/10 flex items-center justify-center text-base shrink-0 font-bold">
                    📍
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1E1C1A]">Approximate Activity Routing</p>
                    <p className="text-xs text-[#7A7268] mt-0.5">
                      Your itinerary is currently routed around a central city anchor. Select a hotel in Price Tracking to optimize walking & transit routes around your stay!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveDay('tracking')}
                  className="bg-[#1E1C1A] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition-colors shrink-0 cursor-pointer shadow-xs whitespace-nowrap"
                >
                  Select Hotel & Route &rarr;
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
              {days.map((day, idx) => {
                const dayNum = day.dayNumber || idx + 1;
                const summary = getDaySummary(day, idx, days);
                return (
                  <div
                    key={dayNum}
                    onClick={() => setActiveDay(dayNum)}
                    className="flex flex-col justify-between p-6 rounded-2xl bg-[#FAF6F0] border border-[#E6DFD5]/80 hover:border-[#FF6B2C]/60 transition-all duration-300 group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-0.5 rounded-md bg-[#1E1C1A] text-[#FAF6F0] font-serif text-xs font-bold tracking-wider">
                          Day {toRomanNumeral(dayNum)}
                        </span>
                        <span className="text-xs font-sans text-[#7A7268] font-semibold">
                          {getDayDateString(itinerary.startDate, idx) || `Chapter ${dayNum}`}
                        </span>
                      </div>
                      <h3 className="text-lg font-serif font-bold text-[#1E1C1A] leading-snug group-hover:text-[#FF6B2C] transition-colors">
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
                      className="mt-4 w-full py-2 px-3 rounded-xl border border-[#E6DFD5] bg-white hover:bg-[#FF6B2C] hover:border-[#FF6B2C] hover:text-white text-[#1E1C1A] font-sans text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer print:hidden"
                    >
                      <Compass className="w-3.5 h-3.5 text-[#FF6B2C] group-hover:text-white" />
                      <span>View Day {toRomanNumeral(dayNum)} Map Overlay</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* NARRATIVE CHAPTERS WITH 3D DEPTH SWAP TRANSITION (Accesses Requirement 2) */}
        <div style={{ perspective: 1200 }} className="relative min-h-125 print:hidden">
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
              {activeDay === 'journal' ? (
                <JournalView 
                  tripId={activeTripId || itinerary?.id || itinerary?.db_id || 'shared-trip'}
                  itinerary={itinerary}
                  onEntriesChange={setJournalEntries}
                />
              ) : activeDay === 'epilogue' ? (() => {
                const tripDiningRollup = computeDiningRollup(null);
                return (
                  /* SECTION 3: THE EPILOGUE & 3D STAMP FLOURISH (Accesses Requirement 4) */
                  <section className="scroll-mt-32 flex flex-col gap-6 sm:gap-10 pb-12">
                    <div className="text-center max-w-2xl mx-auto px-4">
                      <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-[#FF6B2C] font-bold block mb-1">
                        THE EPILOGUE  —  DOSSIER SUMMARY
                      </span>
                      <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif font-black text-[#1E1C1A] tracking-tight leading-tight">
                        Trip Epilogue &amp; Statistics
                      </h2>
                    </div>

                    {/* Visual 3D stamp flourish loop trigger when scrolled into view */}
                    <div className="flex flex-col items-center justify-center py-4 sm:py-6 relative overflow-hidden sm:overflow-visible w-full min-h-48 sm:min-h-55">
                      {/* SVG Flight Path & Animated Airplane */}
                      {stampInView && (
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[340px] sm:max-w-none sm:w-150 h-72 sm:h-90 pointer-events-none z-0 overflow-hidden sm:overflow-visible opacity-75 sm:opacity-100">
                          <svg
                            viewBox="0 0 600 360"
                            className="w-full h-full overflow-visible"
                          >
                            {/* Dotted path trail */}
                            <motion.path
                              d="M 300 180 C 200 120, 100 180, 100 240 C 100 310, 220 330, 300 290 C 380 250, 440 120, 510 80 C 560 50, 580 60, 600 70"
                              fill="none"
                              stroke="#FF6B2C"
                              strokeWidth="1.5"
                              strokeDasharray="4 4"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 3.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.8 }}
                            />
                          </svg>

                          {/* Airplane following the path */}
                          <div
                            className="flight-plane animate-fly-plane"
                            style={{ animationDelay: '0.8s' }}
                          >
                            <svg viewBox="-30 -30 60 60" className="w-full h-full text-[#FF6B2C] overflow-visible drop-shadow-[0_4px_6px_rgba(255,107,44,0.25)]">
                              <path
                                d="M -8 -4 L 0 -38 L 8 -4 L 26 6 L 26 14 L 8 8 L 5 26 L 13 32 L 13 38 L 0 32 L -13 38 L -13 32 L -5 26 L -8 8 L -26 14 L -26 6 Z"
                                fill="currentColor"
                              />
                            </svg>
                          </div>
                        </div>
                      )}

                      <motion.div
                        initial={{ scale: 1.6, rotate: -35, opacity: 0 }}
                        whileInView={{ scale: 1, rotate: -8, opacity: 1 }}
                        viewport={{ once: true, margin: "-80px" }}
                        onViewportEnter={() => setStampInView(true)}
                        transition={{ type: "spring", damping: 14, stiffness: 100, delay: 0.15 }}
                        className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-3 sm:border-4 border-dashed border-[#FF6B2C]/80 text-[#FF6B2C] flex flex-col items-center justify-center font-serif uppercase text-center relative z-10 shadow-xs select-none bg-[#FAF6F0]"
                      >
                        <span className="text-[9px] sm:text-[10px] tracking-widest font-bold">Approved</span>
                        <span className="text-base sm:text-lg font-black tracking-tight my-0.5">TripWise</span>
                        <span className="text-[7.5px] sm:text-[8px] tracking-[0.2em] font-extrabold text-[#7A7268]">Concierge</span>

                        {/* Innermost ink circle stamp details */}
                        <div className="absolute inset-1 border border-solid border-[#FF6B2C]/25 rounded-full pointer-events-none" />
                        <div className="absolute bottom-2 text-[5.5px] sm:text-[6px] text-[#7A7268] tracking-widest font-sans font-bold uppercase">Private Guide</div>
                      </motion.div>

                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 }}
                        className="text-xs font-serif italic text-[#7A7268] mt-3 text-center px-4"
                      >
                        ✨ Custom travel dossier assembled &amp; formatted.
                      </motion.div>
                    </div>

                    {/* Grid stats - Mobile Responsive 2x2 Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 p-4 sm:p-8 rounded-3xl bg-white border border-[#E6DFD5] text-center shadow-xs">
                      <div className="flex flex-col gap-1 p-2 sm:p-0 sm:border-r border-[#E6DFD5]">
                        <span className="text-[10px] sm:text-xs font-sans uppercase tracking-widest text-[#7A7268] font-bold">Total Duration</span>
                        <span className="text-xl sm:text-3xl font-serif font-black text-[#1E1C1A]">{days.length} Days</span>
                      </div>
                      <div className="flex flex-col gap-1 p-2 sm:p-0 sm:border-r border-[#E6DFD5]">
                        <span className="text-[10px] sm:text-xs font-sans uppercase tracking-widest text-[#7A7268] font-bold">Curated Stops</span>
                        <span className="text-xl sm:text-3xl font-serif font-black text-[#1E1C1A]">{totalStopsCount} Stops</span>
                      </div>
                      <div className="flex flex-col gap-1 p-2 sm:p-0 sm:border-r border-[#E6DFD5]">
                        <span className="text-[10px] sm:text-xs font-sans uppercase tracking-widest text-[#7A7268] font-bold">Walking Est.</span>
                        <span className="text-xl sm:text-3xl font-serif font-black text-[#1E1C1A]">~{totalDistanceEst} km</span>
                      </div>
                      <div className="flex flex-col gap-1 p-2 sm:p-0">
                        <span className="text-[10px] sm:text-xs font-sans uppercase tracking-widest text-[#7A7268] font-bold">Estimated Cost</span>
                        <span className="text-xl sm:text-3xl font-serif font-black text-[#FF6B2C]">{getConvertedEstimatedCost(itinerary.estimatedCost, userCurrency)}</span>
                      </div>
                    </div>

                    {/* Trip-Level Dining Rollup Banner */}
                    {tripDiningRollup.total > 0 && (
                      <div className="p-4.5 sm:p-6 rounded-3xl bg-[#FAF6F0] border border-[#FF6B2C]/30 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 sm:gap-3.5">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#FF6B2C]/10 border border-[#FF6B2C]/25 flex items-center justify-center text-[#FF6B2C] shrink-0">
                            <Utensils className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
                          </div>
                          <div>
                            <h4 className="font-serif font-bold text-base sm:text-lg text-[#1E1C1A] leading-tight">
                              Trip-Level Dining Concierge Rollup
                            </h4>
                            <p className="text-xs sm:text-sm font-sans text-[#5F5E5A] mt-0.5 sm:mt-1">
                              {tripDiningRollup.markedReserved === tripDiningRollup.total ? 'All dining reservations across your itinerary are marked as booked!' : `${tripDiningRollup.markedReserved} of ${tripDiningRollup.total} dining reservations marked as booked.`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end flex-wrap pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E6DFD5]/60">
                          <span className="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-[#FF6B2C]/15 border border-[#FF6B2C]/30 text-[#FF6B2C] font-mono text-[10px] sm:text-xs font-extrabold tracking-wider">
                            {tripDiningRollup.markedReserved} / {tripDiningRollup.total} BOOKED
                          </span>
                          {tripDiningRollup.firstUnbooked && (
                            <button
                              type="button"
                              onClick={() => scrollToFirstUnbookedDining(tripDiningRollup.firstUnbooked)}
                              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#1E1C1A] text-white hover:bg-[#FF6B2C] font-sans text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                            >
                              <span>Mark Day {tripDiningRollup.firstUnbooked.dayNum} Table →</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Reminders grids */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                      <div className="bg-white p-4.5 sm:p-6 rounded-3xl border border-[#E6DFD5] shadow-xs">
                        <h3 className="text-xs sm:text-sm font-sans font-bold uppercase tracking-widest text-[#FF6B2C] border-b border-[#E6DFD5] pb-2.5 mb-3.5 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Concierge Packing &amp; Prep Reminders</span>
                        </h3>
                        <ul className="text-xs font-serif text-[#4A443E] leading-relaxed flex flex-col gap-2.5 list-disc pl-4">
                          <li>
                            <strong>Comfortable Footwear:</strong> Your route covers approximately {totalDistanceEst} km. Wear robust walking shoes suited for old city cobblestones.
                          </li>
                          <li>
                            <strong>Church/Cultural Sites:</strong> Several scheduled historical landmarks require covered shoulders and knees to enter.
                          </li>
                          <li>
                            <strong>Reusable Flasks:</strong> Rome features free historic drinking fountains (Nasoni) across streets—highly recommended for daylight walking segments.
                          </li>
                        </ul>
                      </div>

                      <div className="bg-white p-4.5 sm:p-6 rounded-3xl border border-[#E6DFD5] shadow-xs">
                        <h3 className="text-xs sm:text-sm font-sans font-bold uppercase tracking-widest text-[#FF6B2C] border-b border-[#E6DFD5] pb-2.5 mb-3.5 flex items-center gap-2">
                          <Layers className="w-4 h-4" />
                          <span>Booking &amp; Tickets Status Overview</span>
                        </h3>
                        <div className="flex flex-col gap-3">
                          {preBookedItems.map((item, keyIdx) => (
                            <div key={keyIdx} className="flex items-center justify-between text-xs border-b border-[#FAF6F0] pb-2.5 last:border-b-0 last:pb-0 gap-3">
                              <div className="min-w-0 flex-1 pr-1">
                                <strong className="block text-[#1E1C1A] font-serif truncate">{item.item}</strong>
                                <span className="text-[10px] text-[#7A7268] font-sans truncate block">{item.code || 'Instant access link available'}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold whitespace-nowrap shrink-0 ${item.status === 'Pre-booked' ? 'bg-emerald-500/10 text-emerald-700' :
                                    item.status === 'Open Access' ? 'bg-blue-500/10 text-blue-700' : 'bg-[#FF6B2C]/10 text-[#FF6B2C]'
                                  }`}>
                                  {item.status}
                                </span>
                                {item.status === 'Action Needed' && (
                                  <button
                                    type="button"
                                    onClick={() => scrollToStopCard(item.dayNum, item.stopNum)}
                                    className="px-2 py-1 rounded-lg bg-[#1E1C1A] text-white hover:bg-[#FF6B2C] font-sans text-[9.5px] font-bold transition-all cursor-pointer shadow-2xs shrink-0 flex items-center gap-1"
                                    title="Jump to this stop card to review booking options"
                                  >
                                    <span>View →</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Post-Trip Activity Ratings */}
                    <div className="bg-white p-4.5 sm:p-8 rounded-3xl border border-[#E6DFD5] shadow-xs">
                      <div className="flex items-center gap-3 mb-4 sm:mb-6 border-b border-[#E6DFD5] pb-3.5 sm:pb-4">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#FF6B2C]/10 flex items-center justify-center text-[#FF6B2C] shrink-0">
                          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div>
                          <h3 className="font-serif font-bold text-lg sm:text-xl text-[#1E1C1A]">Rate this Trip's Activities</h3>
                          <p className="text-xs sm:text-sm font-sans text-[#7A7268]">Your ratings help TripWise learn your travel taste.</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2.5 max-h-80 sm:max-h-96 overflow-y-auto pr-1 sm:pr-2 mb-5 custom-scrollbar">
                        {itinerary?.days?.flatMap((day, dayIdx) => 
                          day.activities?.map((act, stopIdx) => {
                            const stopKey = `tw_day${dayIdx}_stop${stopIdx}`;
                            const rating = activityRatings[stopKey]?.rating || 0;
                            return (
                              <div key={stopKey} className="flex items-center justify-between gap-2 p-3 sm:p-3.5 rounded-2xl border border-[#FAF6F0] bg-[#FAF8F5] hover:bg-white transition-colors">
                                <div className="min-w-0 flex-1 pr-2">
                                  <strong className="block text-[#1E1C1A] font-serif text-xs sm:text-sm truncate">{act.title}</strong>
                                  <span className="text-[9px] sm:text-[10px] text-[#7A7268] font-sans uppercase tracking-wider block truncate">{act.category || `Day ${dayIdx + 1}`}</span>
                                </div>
                                <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 touch-manipulation">
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                      key={star}
                                      onClick={() => handleRatingChange(stopKey, act, star)}
                                      className={`p-1 text-xl sm:text-2xl active:scale-125 transition-transform cursor-pointer ${star <= rating ? 'text-amber-500' : 'text-[#E6DFD5]'}`}
                                      aria-label={`${star} star`}
                                    >
                                      ★
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          }) || []
                        )}
                      </div>
                      <button
                        onClick={handleCompleteTrip}
                        className="w-full py-3.5 sm:py-4 rounded-2xl bg-[#1E1C1A] hover:bg-[#FF6B2C] text-white font-bold font-sans text-xs sm:text-sm tracking-wide transition-all cursor-pointer shadow-md active:scale-[0.98]"
                      >
                        Complete Trip &amp; Update Preferences
                      </button>
                    </div>

                    {/* Closing signature and bottom page-turns */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 pt-6 sm:pt-8 border-t border-[#E6DFD5]">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 flex items-center justify-center">
                          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 object-contain">
                            <path
                              d="M24 170 C 70 135, 105 105, 168 42"
                              fill="none"
                              stroke="#8CA3A8"
                              strokeWidth="5"
                              strokeDasharray="3 12"
                              strokeLinecap="round"
                            />
                            <circle cx="24" cy="170" r="11" fill="#0D9488" />
                            <g transform="translate(136,28) rotate(45) scale(0.95)">
                              <path
                                d="M0 34 L8 0 L16 34 L34 44 L34 52 L16 46 L13 64 L21 70 L21 76 L8 70 L-5 76 L-5 70 L3 64 L0 46 L-18 52 L-18 44 Z"
                                fill="#FF6B2C"
                              />
                            </g>
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-serif font-bold text-[#1E1C1A]">TripWise Travel Concierge</h4>
                          <p className="text-xs font-sans text-[#7A7268]">Curated Private Travel Dossier Guide</p>
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
                          className="px-6 py-3 rounded-full border border-[#1E1C1A] bg-[#1E1C1A] text-[#FAF6F0] hover:bg-[#FF6B2C] hover:border-[#FF6B2C] text-xs font-sans font-bold uppercase tracking-wider transition-all duration-300 shadow-md cursor-pointer flex items-center gap-2"
                        >
                          <Printer className="w-4 h-4" />
                          <span>Print Dossier Booklet</span>
                        </button>
                      </div>
                    </div>
                  </section>
                );
              })() : activeDay === 'packing' ? (() => {
                const totalItems = packingList ? Object.values(packingList).flat().length : 0;
                const checkedItems = packingList ? Object.values(packingList).flat().filter(i => i.checked).length : 0;

                return (
                  <section className="flex flex-col gap-8 pt-10 sm:pt-14">
                    <div className="text-center max-w-2xl mx-auto relative">
                      <span className="text-xs font-mono uppercase tracking-widest text-[#FF6B2C] font-bold block mb-1">
                        Preparation &amp; Gear
                      </span>
                      <h2 className="text-3xl sm:text-5xl font-serif font-black text-[#1E1C1A] tracking-tight leading-tight mb-4">
                        Curated Packing List
                      </h2>
                      <p className="text-sm font-sans text-[#7A7268] flex items-center justify-center gap-2 flex-wrap">
                        <span>{itinerary?.destinationName || itinerary?.name || 'Your Destination'}</span>
                        <span className="text-[#E6DFD5]">•</span>
                        <span>{days.length} Days</span>
                      </p>

                      {/* Regenerate Confirm Dialog */}
                      <AnimatePresence>
                        {showRegenerateConfirm && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute top-full mt-4 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-xl border border-[#FF6B2C]/30 p-6 z-50 w-full max-w-sm text-left"
                          >
                            <h4 className="font-serif font-bold text-lg text-[#1E1C1A] mb-2 flex items-center gap-2">
                              <AlertCircle className="w-5 h-5 text-[#FF6B2C]" />
                              Regenerate List?
                            </h4>
                            <p className="text-xs font-sans text-[#5F5E5A] mb-5 leading-relaxed">
                              This will re-evaluate your itinerary activities. Your custom added items and current progress will be preserved, but generated quantities or items may change.
                            </p>
                            <div className="flex gap-3 justify-end">
                              <button onClick={() => setShowRegenerateConfirm(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-[#7A7268] hover:bg-[#FAF6F0] transition-colors">
                                Cancel
                              </button>
                              <button onClick={handleRegeneratePackingList} className="px-4 py-2 rounded-xl bg-[#1E1C1A] text-white text-xs font-bold hover:bg-[#FF6B2C] transition-colors">
                                Confirm Regenerate
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Clean Human-Crafted Completion Banner */}
                    <AnimatePresence>
                      {checkedItems === totalItems && totalItems > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-5 rounded-3xl bg-[#FAF6F0] border border-[#E6DFD5] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-600 shrink-0">
                              <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
                            </div>
                            <div>
                              <h4 className="font-serif font-bold text-base text-[#1E1C1A] leading-tight">
                                All {totalItems} items packed
                              </h4>
                              <p className="text-xs font-sans text-[#7A7268] mt-0.5">
                                Your luggage is prepped and ready for {itinerary?.destinationName || 'your trip'}.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveDay('visa')}
                            className="px-5 py-2.5 rounded-2xl bg-[#1E1C1A] text-white hover:bg-[#FF6B2C] font-sans text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 shrink-0 self-end sm:self-auto"
                          >
                            <span>Next: Visa &amp; Travel Docs</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E6DFD5] shadow-xs sticky top-32 z-30">
                      <div className="flex items-center gap-4">
                        <div className={`relative w-14 h-14 rounded-full border flex items-center justify-center shrink-0 transition-colors duration-500 ${checkedItems === totalItems && totalItems > 0 ? 'bg-green-50 border-green-200' : 'bg-[#FAF6F0] border-[#E6DFD5]'}`}>
                          <AnimatedSuitcaseIcon
                            isAnimated={isPackingIconAnimated}
                            actionType={packingActionType}
                            checkedItems={checkedItems}
                            totalItems={totalItems}
                            size="large"
                            flyingEmoji={flyingItemEmoji}
                          />
                        </div>
                        <div>
                          <div className="text-xs font-mono uppercase tracking-widest text-[#7A7268] mb-1">Packing Progress</div>
                          <motion.div
                            animate={isPackingIconAnimated ? { scale: [1, 1.15, 0.98, 1], color: ['#1E1C1A', '#FF6B2C', '#1E1C1A'] } : {}}
                            transition={{ duration: 0.45 }}
                            className="font-serif font-bold text-xl text-[#1E1C1A]"
                          >
                            {checkedItems} / {totalItems} Packed
                          </motion.div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={checkAllItems}
                          className="flex-1 sm:flex-none inline-flex justify-center items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E6DFD5] bg-white text-[11px] font-sans font-bold text-[#1E1C1A] hover:bg-[#FAF6F0] hover:border-[#7A7268] transition-all shadow-2xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Select All</span>
                        </button>
                        <button
                          onClick={uncheckAllItems}
                          className="flex-1 sm:flex-none inline-flex justify-center items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E6DFD5] bg-white text-[11px] font-sans font-bold text-[#1E1C1A] hover:bg-[#FAF6F0] hover:border-[#7A7268] transition-all shadow-2xs"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Clear All</span>
                        </button>
                        <button
                          onClick={() => setShowRegenerateConfirm(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#FF6B2C]/30 bg-[#FAF6F0] text-[11px] font-sans font-bold text-[#1E1C1A] hover:bg-white hover:border-[#FF6B2C] transition-all shadow-2xs"
                          title="Regenerate"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-[#FF6B2C]" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-6">
                      {!packingList ? (
                        <div className="text-center py-10 text-sm font-sans text-[#7A7268]">Set your trip details to generate a packing list.</div>
                      ) : (
                        (() => {
                          const categoryIcons = {
                            Clothing: <Shirt className="w-5 h-5 text-[#FF6B2C]" />,
                            Documents: <Briefcase className="w-5 h-5 text-[#FF6B2C]" />,
                            Electronics: <Smartphone className="w-5 h-5 text-[#FF6B2C]" />,
                            Toiletries: <Droplets className="w-5 h-5 text-[#FF6B2C]" />,
                            ActivitySpecific: <Compass className="w-5 h-5 text-[#FF6B2C]" />
                          };

                          return Object.keys(packingList).map((category, catIdx) => {
                            const items = packingList[category];
                            const isExpanded = expandedPackingCategories[category];
                            const catCheckedCount = items.filter(i => i.checked).length;
                            const isAllChecked = catCheckedCount === items.length && items.length > 0;

                            return (
                              <div key={category} className={`bg-white rounded-3xl border transition-colors duration-500 overflow-hidden shadow-xs ${isAllChecked ? 'border-green-200 bg-green-50/30' : 'border-[#E6DFD5]'}`}>
                                <button
                                  onClick={() => togglePackingCategory(category)}
                                  className="w-full flex items-center justify-between p-6 hover:bg-[#FAF6F0]/50 transition-colors cursor-pointer"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-[#FAF6F0] border ${isAllChecked ? 'border-green-200 bg-green-50' : 'border-[#E6DFD5]'}`}>
                                      {isAllChecked ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : (categoryIcons[category] || <CheckSquare className="w-5 h-5 text-[#FF6B2C]" />)}
                                    </div>
                                    <h3 className="font-mono text-sm uppercase tracking-widest font-bold text-[#1E1C1A]">
                                      {category.replace(/([A-Z])/g, ' $1').trim()}
                                    </h3>
                                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${isAllChecked ? 'bg-green-100 text-green-700 border-green-200' : 'bg-[#FAF6F0] text-[#7A7268] border-[#E6DFD5]'}`}>
                                      {catCheckedCount}/{items.length}
                                    </span>
                                  </div>
                                  {isExpanded ? <ChevronUp className="w-5 h-5 text-[#7A7268]" /> : <ChevronDown className="w-5 h-5 text-[#7A7268]" />}
                                </button>

                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="p-6 pt-0 border-t border-[#FAF6F0]">
                                        <motion.div
                                          className="flex flex-col gap-2 mt-4"
                                          initial="hidden"
                                          animate="visible"
                                          variants={{
                                            visible: { transition: { staggerChildren: 0.05 } },
                                            hidden: {}
                                          }}
                                        >
                                          {items.map(item => {
                                            const match = item.text.match(/^(\d+x)\s+(.*)$/i);
                                            const badgeText = match ? match[1] : null;
                                            const mainText = match ? match[2] : item.text;

                                            return (
                                              <motion.div
                                                key={item.id}
                                                className="flex items-center justify-between group"
                                                variants={{
                                                  hidden: { opacity: 0, y: 10 },
                                                  visible: { opacity: 1, y: 0 }
                                                }}
                                              >
                                                <button
                                                  onClick={() => togglePackingItem(category, item.id)}
                                                  className="flex items-center gap-3 flex-1 text-left py-2 hover:bg-[#FAF6F0] px-3 rounded-xl transition-colors"
                                                >
                                                  <div className={`shrink-0 transition-transform ${item.checked ? 'scale-110' : ''}`}>
                                                    {item.checked ? (
                                                      <CheckSquare className="w-5 h-5 text-[#FF6B2C]" />
                                                    ) : (
                                                      <Square className="w-5 h-5 text-[#E6DFD5] group-hover:text-[#FF6B2C]/50" />
                                                    )}
                                                  </div>
                                                  <span className={`font-sans text-sm transition-all duration-300 ${item.checked ? 'text-[#7A7268] line-through opacity-60' : 'text-[#1E1C1A]'}`}>
                                                    {mainText}
                                                  </span>
                                                  {badgeText && (
                                                    <span className={`ml-auto px-2 py-0.5 rounded-md text-[10px] font-bold transition-all duration-300 ${item.checked ? 'bg-[#FAF6F0] text-[#7A7268] opacity-60' : 'bg-[#FF6B2C]/10 text-[#FF6B2C]'}`}>
                                                      {badgeText}
                                                    </span>
                                                  )}
                                                </button>

                                                <button
                                                  onClick={() => removePackingItem(category, item.id)}
                                                  className="p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-red-300 hover:text-red-500 rounded-lg"
                                                  title="Remove item"
                                                >
                                                  <Trash2 className="w-4 h-4" />
                                                </button>
                                              </motion.div>
                                            );
                                          })}
                                        </motion.div>

                                        <div className="mt-4 flex items-center gap-2 px-3">
                                          <input
                                            type="text"
                                            placeholder={`Add custom ${category.toLowerCase()} item...`}
                                            value={customInputs[category] || ''}
                                            onChange={(e) => setCustomInputs(prev => ({ ...prev, [category]: e.target.value }))}
                                            onKeyDown={(e) => e.key === 'Enter' && addCustomPackingItem(category)}
                                            className="flex-1 bg-transparent border-b border-[#E6DFD5] py-2 text-sm font-sans focus:outline-hidden focus:border-[#FF6B2C] placeholder:text-[#7A7268]/50"
                                          />
                                          <button
                                            onClick={() => addCustomPackingItem(category)}
                                            disabled={!customInputs[category]?.trim()}
                                            className="p-2 rounded-xl bg-[#FAF6F0] text-[#1E1C1A] hover:bg-[#FF6B2C] hover:text-white disabled:opacity-50 disabled:hover:bg-[#FAF6F0] disabled:hover:text-[#1E1C1A] transition-colors"
                                          >
                                            <Plus className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })
                        })()
                      )}
                    </div>
                  </section>
                );
              })() : activeDay === 'tracking' ? (
                <section className="font-sans mb-12">
                  {/* Live Price Monitor Active Header Banner */}
                  <div className="bg-[#FAF6F0] border-l-4 border-emerald-500 p-4 rounded-r-2xl mb-8 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping shrink-0" />
                      <div>
                        <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-700 block">
                          Live Price &amp; Route Monitor Active
                        </span>
                        <p className="text-xs text-[#7A7268] mt-0.5">
                          Real-time flight fares, hotel pricing, and anchor route optimization active for {itinerary?.destinationName || 'your destination'}.
                        </p>
                      </div>
                    </div>
                  </div>

                  <PriceTracker
                    tripId={itinerary?.id || itinerary?.db_id || activeTripId || 'shared-trip'}
                    destinationName={itinerary?.destinationName}
                    startDate={itinerary?.startDate}
                    endDate={itinerary?.endDate}
                    hotelMode={itinerary?.hotelMode || (itinerary?.basecampHotel || itinerary?.preferences?.basecamp ? 'basecamp' : 'undecided')}
                    basecampHotel={itinerary?.basecampHotel || itinerary?.preferences?.basecamp || null}
                    itinerary={itinerary}
                    onReoptimize={async (newHotelName, hotelObj) => {
                      try {
                        const hotelTitle = typeof newHotelName === 'string' ? newHotelName : (newHotelName?.name || 'The Rome Palace');
                        showToast(`Updating itinerary to use ${hotelTitle}...`, 'info');
                        
                        let basecampCoords = hotelObj?.coordinates || hotelObj?.latLng;
                        let hotelPhotos = [hotelObj?.image];
                        let exactAddress = hotelObj?.address;
                        
                        try {
                          const details = await getPlaceDetails(hotelTitle + ' ' + (itinerary?.destinationName || ''));
                          if (!details.error) {
                            if (details.coordinates) basecampCoords = details.coordinates;
                            if (details.photos && details.photos.length > 0) {
                              hotelPhotos = details.photos;
                              hotelObj.image = details.photos[0];
                            }
                            if (details.address) exactAddress = details.address;
                          }
                        } catch (e) {
                          console.error('Failed to get exact hotel coordinates', e);
                        }

                        if (!basecampCoords) {
                          basecampCoords = {
                            lat: (itinerary?.coordinates?.lat || 41.9028) + ((hotelObj?.mapPos?.y || 45) - 50) * 0.0003,
                            lng: (itinerary?.coordinates?.lng || 12.4964) + ((hotelObj?.mapPos?.x || 45) - 50) * 0.0003
                          };
                        }
                        const basecampAddress = exactAddress || `${hotelTitle}, ${itinerary?.destinationName || 'Rome, Italy'}`;
                        const basecampHotelRecord = {
                          name: hotelTitle,
                          address: basecampAddress,
                          coordinates: basecampCoords,
                          image: hotelObj?.image,
                          photos: hotelPhotos,
                          rating: hotelObj?.rating || 4.8,
                          reviewCount: hotelObj?.reviewCount || 12000
                        };

                        const updated = {
                          ...itinerary,
                          // Intentionally NOT overwriting itinerary days here so existing places are preserved
                          hotelMode: 'basecamp',
                          basecampHotel: hotelTitle,
                          basecampHotelDetails: basecampHotelRecord
                        };
                          setItinerary(updated);
                          if (typeof window !== 'undefined') {
                            localStorage.setItem('tripwise_itinerary', JSON.stringify(updated));
                            const tripIdToUpdate = itinerary?.id || itinerary?.db_id || activeTripId;
                            
                            if (tripIdToUpdate && tripIdToUpdate !== 'shared-trip') {
                              updateTrip(tripIdToUpdate, itinerary.destinationName || 'Trip', updated).catch(e => console.error('Failed to persist re-optimized trip', e));
                            }
                            
                            const trackingState = getTrackingState(tripIdToUpdate || 'shared-trip');
                            if (trackingState) {
                              trackingState.hotelMode = 'basecamp';
                              trackingState.basecampHotel = hotelTitle;
                              trackingState.basecampHotelDetails = basecampHotelRecord;
                              saveTrackingState(tripIdToUpdate || 'shared-trip', trackingState);
                            }
                          }
                          showToast(`Your itinerary has been updated around ${hotelTitle}`, 'success', 'CheckCircle2', {
                            label: 'View Itinerary',
                            onClick: () => setActiveDay(1)
                          });
                      } catch (err) {
                        console.error('Failed to re-optimize itinerary:', err);
                        showToast('Failed to re-optimize itinerary. Please try again.', 'error');
                      }
                    }}
                    onHotelSelect={async (hotel) => {
                      if (itinerary) {
                        showToast('Fetching hotel details...', 'info');
                        let details;
                        try {
                          details = await getPlaceDetails(`${hotel.name} ${itinerary.destinationName || ''}`);
                        } catch (e) {
                          console.error("Error fetching hotel details:", e);
                        }
                        
                        const basecampCoords = details?.coordinates || {
                          lat: itinerary?.coordinates?.lat || 41.9028,
                          lng: itinerary?.coordinates?.lng || 12.4964
                        };
                        
                        const basecampHotelRecord = {
                          name: hotel.name,
                          address: details?.address || hotel.address || `${hotel.name}, ${itinerary.destinationName || 'Destination'}`,
                          coordinates: basecampCoords,
                          image: details?.photos && details.photos.length > 0 ? details.photos[0] : hotel.image,
                          photos: details?.photos || (hotel.image ? [hotel.image] : []),
                          rating: details?.rating || hotel.rating || 4.8,
                          reviewCount: details?.reviewCount || hotel.reviewCount || 12000
                        };

                        const updated = {
                          ...itinerary,
                          hotelMode: 'basecamp',
                          basecampHotel: hotel.name,
                          basecampHotelDetails: basecampHotelRecord
                        };
                        setItinerary(updated);
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('tripwise_itinerary', JSON.stringify(updated));
                        }
                        showToast(`Hotel updated to ${hotel.name}.`, 'success');
                      }
                    }}
                    onToast={showToast}
                  />
                </section>
              ) : activeDay === 'visa' ? (() => {
                return (
                  <section className="font-sans">
                    <div className="bg-[#FAF6F0] border-l-4 border-[#FF6B2C] p-4 rounded-r-xl mb-8 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-[#FF6B2C] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-[#1E1C1A] mb-1">Important Visa Disclaimer</p>
                        <p className="text-xs text-[#7A7268] leading-relaxed">
                          This is general guidance only. Always confirm requirements with the official embassy, consulate, or a licensed visa service before booking travel.
                        </p>
                      </div>
                    </div>

                    <div className="border-b-2 border-[#1E1C1A] pb-6 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      <div>
                        <span className="text-xs font-mono uppercase tracking-widest text-[#FF6B2C] font-bold block mb-1">
                          Preparation
                        </span>
                        <h2 className="text-3xl font-serif font-black text-[#1E1C1A] tracking-tight">
                          Visa &amp; Travel Documents
                        </h2>
                      </div>
                    </div>

                    {!passportNationality ? (
                      <div className="bg-white border border-[#E6DFD5] rounded-3xl p-10 text-center flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-[#FAF6F0] flex items-center justify-center">
                          <Book className="w-8 h-8 text-[#FF6B2C]" />
                        </div>
                        <div>
                          <h3 className="text-xl font-serif font-bold text-[#1E1C1A]">Passport Nationality Missing</h3>
                          <p className="text-sm text-[#7A7268] mt-2 max-w-md mx-auto">
                            Please set your Passport Nationality in Settings to view accurate visa requirements for this destination.
                          </p>
                        </div>
                        <Link
                          href="/settings"
                          className="mt-4 px-6 py-2.5 bg-[#1E1C1A] text-[#FAF6F0] text-sm font-bold rounded-xl hover:bg-[#FF6B2C] transition-colors"
                        >
                          Go to Settings
                        </Link>
                      </div>
                    ) : visaLoading ? (
                      <div className="py-20 flex justify-center">
                        <div className="w-6 h-6 border-2 border-[#E6DFD5] border-t-[#FF6B2C] rounded-full animate-spin"></div>
                      </div>
                    ) : visaError || !visaReqs ? (
                      <div className="bg-white border border-[#E6DFD5] rounded-3xl p-10 text-center flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-[#FAF6F0] flex items-center justify-center">
                          <AlertTriangle className="w-8 h-8 text-[#FF6B2C]" />
                        </div>
                        <div>
                          <h3 className="text-xl font-serif font-bold text-[#1E1C1A]">Information Unavailable</h3>
                          <p className="text-sm text-[#7A7268] mt-2 max-w-md mx-auto">
                            We're unable to retrieve visa requirements for this route. Please check directly with the relevant embassy or consulate.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-8">
                        <div className="bg-white border border-[#E6DFD5] rounded-3xl p-6 md:p-8">
                          <h3 className="text-sm font-mono uppercase tracking-widest text-[#5F5E5A] font-bold mb-6">
                            Entry Requirements for {itinerary?.destinationName}
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div>
                              <div className="text-xs text-[#7A7268] mb-1">Visa Status</div>
                              <div className="font-bold text-[#1E1C1A]">{visaReqs.required}</div>
                              {visaReqs.details && <div className="text-xs text-[#7A7268] mt-1">{visaReqs.details}</div>}
                            </div>

                            {visaReqs.processingTime && (
                              <div>
                                <div className="text-xs text-[#7A7268] mb-1">Processing Time</div>
                                <div className="font-bold text-[#1E1C1A]">{visaReqs.processingTime}</div>
                              </div>
                            )}

                            {visaReqs.passportValidity && (
                              <div>
                                <div className="text-xs text-[#7A7268] mb-1">Passport Validity</div>
                                <div className="font-bold text-[#1E1C1A]">{visaReqs.passportValidity}</div>
                              </div>
                            )}

                            {visaReqs.minimumFunds && (
                              <div>
                                <div className="text-xs text-[#7A7268] mb-1">Minimum Funds</div>
                                <div className="font-bold text-[#1E1C1A]">{visaReqs.minimumFunds}</div>
                              </div>
                            )}
                          </div>

                          {visaReqs.embassyLink && (
                            <div className="mt-8 pt-6 border-t border-[#E6DFD5]">
                              <a
                                href={visaReqs.embassyLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-[#FF6B2C] hover:text-[#E05A20] text-sm font-bold transition-colors"
                              >
                                Official Embassy Website
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-serif font-bold text-[#1E1C1A]">Document Checklist</h3>
                            <span className="text-xs text-[#7A7268]">
                              {visaChecklist ? Object.values(visaChecklist).filter(i => i.checked).length : 0} of {visaChecklist ? Object.keys(visaChecklist).length : 0} Completed
                            </span>
                          </div>
                          <div className="bg-white border border-[#E6DFD5] rounded-3xl overflow-hidden">
                            {visaChecklist && Object.values(visaChecklist).map((item) => (
                              <div key={item.id} className="flex items-center justify-between group p-1 border-b border-[#FAF6F0] last:border-0">
                                <button
                                  onClick={() => toggleVisaItem(item.id)}
                                  className="flex items-center gap-3 flex-1 text-left py-3 px-4 hover:bg-[#FAF6F0] rounded-xl transition-colors"
                                >
                                  <div className={`shrink-0 transition-transform ${item.checked ? 'scale-110' : ''}`}>
                                    {item.checked ? (
                                      <CheckCircle2 className="w-5 h-5 text-[#1E1C1A]" />
                                    ) : (
                                      <div className="w-5 h-5 rounded-full border-2 border-[#E6DFD5] group-hover:border-[#1E1C1A] transition-colors" />
                                    )}
                                  </div>
                                  <span className={`text-sm font-sans transition-all duration-300 ${item.checked ? 'text-[#7A7268] line-through decoration-[#7A7268]/50' : 'text-[#1E1C1A] font-medium'
                                    }`}>
                                    {item.text}
                                  </span>
                                </button>
                                <button
                                  onClick={() => removeVisaItem(item.id)}
                                  className="p-3 text-[#7A7268] hover:text-[#FF6B2C] hover:bg-[#FF6B2C]/10 rounded-xl transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                                  title="Remove item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            <div className="p-4 bg-[#FAF6F0]/50 border-t border-[#E6DFD5]">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="Add a custom document or to-do..."
                                  value={customVisaInput}
                                  onChange={(e) => setCustomVisaInput(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && addCustomVisaItem()}
                                  className="flex-1 bg-white border border-[#E6DFD5] py-2 px-4 rounded-xl text-sm font-sans focus:outline-hidden focus:border-[#FF6B2C] placeholder:text-[#7A7268]/50"
                                />
                                <button
                                  onClick={addCustomVisaItem}
                                  disabled={!customVisaInput?.trim()}
                                  className="p-2.5 rounded-xl bg-[#1E1C1A] text-[#FAF6F0] hover:bg-[#FF6B2C] disabled:opacity-50 transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </section>
                );
              })() : activeDay === 'emergency' ? (
                <section className="font-sans">
                  <div className="border-b-2 border-[#1E1C1A] pb-6 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                      <span className="text-xs font-mono uppercase tracking-widest text-[#FF6B2C] font-bold block mb-1">
                        Safety &amp; Assistance
                      </span>
                      <h2 className="text-3xl font-serif font-black text-[#1E1C1A] tracking-tight">
                        Emergency Info Concierge
                      </h2>
                    </div>
                  </div>

                  <EmergencyInfoView
                    destinationName={itinerary?.destinationName}
                    passportNationality={passportNationality}
                  />
                </section>
              ) : activeDay === 'expenses' ? (
                <ExpenseTrackerView
                  tripId={itinerary?.id || itinerary?.db_id || activeTripId || 'default-trip'}
                  userCurrency={userCurrency}
                  estBudget={itinerary?.estimatedCost}
                  destination={itinerary?.destinationName || 'Rome, Italy'}
                  daysCount={itinerary?.days?.length || 3}
                  onShowToast={showToast}
                  collaborators={itinerary?.collaborators || [
                    { name: 'Sarah Jenkins', photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', email: 'sarah@example.com' }
                  ]}
                />
              ) : (
                /* ACTIVE CHAPTER VIEW */
                (() => {
                  const dayIdx = typeof activeDay === 'number' ? Math.max(0, activeDay - 1) : 0;
                  const day = (days && days.length > 0) ? (days[dayIdx] || days[0] || { activities: [] }) : { activities: [] };
                  const summary = day ? getDaySummary(day, dayIdx, days) : { stats: {} };
                  const activities = day?.activities || [];
                  const dayDiningRollup = computeDiningRollup(activeDay);

                  return (
                    <div className="flex flex-col">
                      {/* Chapter Header Card & daylight pacing gradient */}
                      <div className="border-b-2 border-[#1E1C1A] pb-6 mb-8 flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <span className="text-xs font-mono uppercase tracking-widest text-[#FF6B2C] font-extrabold">
                            CHAPTER {toRomanNumeral(activeDay)}  —  DAY {activeDay}
                            {getDayDateString(itinerary.startDate, dayIdx) && (
                              <span className="ml-2 text-[#7A7268] font-sans font-semibold normal-case tracking-normal text-[11px]">({getDayDateString(itinerary.startDate, dayIdx)})</span>
                            )}
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
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#FF6B2C]/30 bg-[#FF6B2C]/10 text-[#FF6B2C] font-sans text-xs font-bold hover:bg-[#FF6B2C]/20 transition-all cursor-pointer shadow-2xs"
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
                                  <div className="w-5 h-5 rounded-full border border-white bg-[#FF6B2C] shadow-xs flex items-center justify-center text-[9px] font-bold text-white transition-all group-hover/marker:scale-125 group-hover/marker:bg-[#1E1C1A]">
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
                            <Compass className="w-4 h-4 text-[#FF6B2C]" />
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

                          const { logisticsNote, weatherNote } = getContextAwareTip(act, idx, summary);
                          const categoryStyle = getCategoryStyling(act);

                          // Category Classification for Dynamic Concierge Ribbon
                          const catLower = (act.category || act.type || '').toLowerCase();
                          const titleLower = (act.title || '').toLowerCase();
                          const isDining = catLower.includes('din') || catLower.includes('food') || catLower.includes('rest') || catLower.includes('cafe') || catLower.includes('bar') || catLower.includes('lunch') || catLower.includes('dinner') || catLower.includes('breakfast') || titleLower.includes('osteria') || titleLower.includes('trattoria') || titleLower.includes('restaurant') || titleLower.includes('cafe') || titleLower.includes('bistro') || titleLower.includes('gelat') || titleLower.includes('pizzeria') || titleLower.includes('tavern');
                          const isNature = !isDining && (catLower.includes('park') || catLower.includes('nature') || catLower.includes('garden') || catLower.includes('beach') || catLower.includes('walk') || catLower.includes('view') || catLower.includes('scenic') || titleLower.includes('park') || titleLower.includes('garden') || titleLower.includes('fountain') || titleLower.includes('plaza') || titleLower.includes('piazza') || titleLower.includes('villa borghese') || titleLower.includes('spanish steps'));

                          const ribbonTitle = isDining ? 'Table Reservation & Dining Guide' : (isNature ? 'Public Access & Visitor Guide' : 'Official Admission & Gateways');
                          const ribbonBadge = isDining ? '🍽️ Table Check' : (isNature ? '🌿 Open Access' : '⚡ Verified Direct Link');
                          const ribbonEstLabel = isDining ? 'Est. Spend Range:' : (isNature ? 'Admission Status:' : 'Est. Rate:');
                          const ribbonEstValue = isNature && (costInfo.title.includes('Check') || costInfo.title === 'Free' || costInfo.title === '$0') ? 'Free Public Entry' : costInfo.title;
                          const ribbonSubtext = isDining ? 'Table reservations & menu recommendations' : (isNature ? 'Best visiting times & walking directions' : 'Skip-the-line options & box office access');

                          const ribbonBtnText = isDining ? 'Compare Table Gateways' : (isNature ? 'Visitor Access Gateways' : 'Curated Booking Gateways');
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
                                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF6B2C] font-bold block mb-1">
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
                                id={`stop-card-${activeDay}-${stopNum}`}
                                data-dining={`dining-stop-${activeDay}-${stopNum}`}
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
                                    <ImageCarousel
                                        query={getGooglePlacesQuery(act.title, destinationNameClean)}
                                        initialImage={getActivityThumbnail(act, idx)}
                                        alt={act.title}
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
                                          } catch (e) { }
                                        }
                                        return act.time || '10:00 AM';
                                      })()}
                                    </div>

                                    {/* Ticket Confirmation Status Indicator (Requirement 4) */}
                                    {!isDining && (() => {
                                      let hasTicketNote = false;
                                      try {
                                        const noteKey = `tw_ticket_note_${itinerary?.destinationName || 'Destination'}_day${activeDay}_stop${stopNum}`;
                                        const storedNote = localStorage.getItem(noteKey);
                                        if (storedNote && storedNote.trim()) {
                                          hasTicketNote = true;
                                        }
                                      } catch (e) { }
                                      if (hasTicketNote) {
                                        return (
                                          <div className="absolute top-4 right-4 px-3.5 py-1.5 rounded-full bg-emerald-600/95 backdrop-blur-sm text-white font-mono text-xs font-bold tracking-wider shadow-md border border-emerald-400/40 flex items-center gap-1.5 animate-in fade-in zoom-in duration-300 z-10">
                                            <Check className="w-3.5 h-3.5 stroke-3" />
                                            <span>Reference saved ✓</span>
                                          </div>
                                        );
                                      }
                                      return null;
                                    })()}

                                    {/* Distinct Category stamp visual style */}
                                    <div className="absolute bottom-4 right-4 px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-xs text-[#1E1C1A] font-serif italic text-xs font-bold shadow-xs border border-[#E6DFD5]">
                                      {categoryStyle.icon} {categoryStyle.name}
                                    </div>
                                  </div>

                                  {/* Secondary detail card underneath image on wide viewports to balance column heights (`hidden lg:flex`) */}
                                  {(() => {
                                    const isBasecampConfirmed = itinerary?.hotelMode === 'basecamp' || itinerary?.basecampHotel;
                                    const basecampName = typeof itinerary?.basecampHotel === 'string' ? itinerary?.basecampHotel : (itinerary?.basecampHotel?.name || 'Basecamp');
                                    const bCoords = itinerary?.basecampHotelDetails?.coordinates || itinerary?.coordinates || { lat: 41.9028, lng: 12.4964 };
                                    const actCoords = act.coordinates || { lat: 41.9028, lng: 12.4964 };
                                    const prox = getDistanceAndProximity(bCoords, actCoords, basecampName);

                                    return (
                                      <div className="hidden lg:flex items-start gap-3.5 p-4 rounded-2xl border border-[#E6DFD5] bg-[#FAF6F0]/70 text-xs font-sans text-[#5F5E5A] shadow-2xs">
                                        <div className="w-9 h-9 rounded-xl bg-white border border-[#E6DFD5] flex items-center justify-center text-[#FF6B2C] shrink-0 mt-0.5 shadow-2xs">
                                          <MapPin className="w-4 h-4 stroke-[2.2]" />
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center justify-between gap-2 border-b border-[#E6DFD5]/60 pb-1.5 mb-1.5">
                                            <strong className="font-serif font-bold text-[#1E1C1A] text-sm tracking-tight">Getting There &amp; Proximity</strong>
                                            <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md border font-bold ${
                                              isBasecampConfirmed ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-white text-[#7A7268] border-[#E6DFD5]'
                                            }`}>
                                              {isBasecampConfirmed ? `📍 ${prox.label}` : '📍 Central Anchor'}
                                            </span>
                                          </div>
                                          <p className="font-serif text-xs text-[#4A443E] leading-relaxed">
                                            {(typeof act.location === 'object' ? act.location?.name : act.location) || `${cleanName}, ${cleanDest}`} — {isBasecampConfirmed ? `approx. ${prox.distKm} km from your basecamp stay at ${basecampName}.` : 'easily reached on foot or short local transit.'}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>

                                {/* Editorial details side spread */}
                                <div className="w-full lg:w-1/2 flex flex-col justify-center px-2 lg:px-6">
                                  <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-4 mb-2">
                                    <div className="flex items-center gap-2 text-xs font-sans tracking-widest uppercase text-[#7A7268] font-bold">
                                      <span>{act.time || '10:00 AM'}</span>
                                      <span className="text-[#FF6B2C] font-serif">•</span>

                                      {/* Micro-loop 3D hover rotating icon & on-tap 360 flip on mobile */}
                                      <motion.span
                                        whileHover={{ rotateY: 180, scale: 1.25 }}
                                        whileTap={{ rotate: [0, -25, 25, 0], scale: 1.45 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 12 }}
                                        className="inline-block cursor-pointer select-none active:scale-125"
                                      >
                                        {categoryStyle.icon}
                                      </motion.span>

                                      <span>{categoryStyle.name}</span>
                                    </div>

                                    <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                                      {/* Skip Button */}
                                      <motion.button
                                        whileHover={{ y: -1 }}
                                        whileTap={{ scale: 0.88 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                        type="button"
                                        onClick={() => handleRequestSkip(activeDay, stopNum, act.category, act.title)}
                                        className="relative inline-flex items-center justify-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-[#E6DFD5] bg-white text-[#7A7268] hover:bg-red-50 hover:border-red-200 hover:text-red-500 text-[11px] sm:text-xs font-sans font-bold whitespace-nowrap shadow-2xs hover:shadow-xs transition-all cursor-pointer group shrink-0"
                                      >
                                        <X className="w-3.5 h-3.5 group-hover:rotate-90 group-active:rotate-180 group-active:scale-125 transition-transform duration-300" />
                                        <span>Skip</span>
                                      </motion.button>
                                      
                                      {/* Bookmark Button */}
                                      <motion.button
                                        whileHover={{ y: -1 }}
                                        whileTap={{ scale: 0.88 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                        type="button"
                                        onClick={() => toggleSaveStop(stopKey)}
                                        className={`relative inline-flex items-center justify-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-xl border text-[11px] sm:text-xs font-sans font-bold cursor-pointer group transition-all shrink-0 ${isSaved
                                            ? 'border-[#FF6B2C] bg-[#FFF0E8] text-[#FF6B2C] shadow-2xs'
                                            : 'border-[#E6DFD5] bg-white text-[#7A7268] hover:border-[#FF6B2C] hover:text-[#FF6B2C] shadow-2xs hover:shadow-xs'
                                          } whitespace-nowrap`}
                                      >
                                        <Bookmark className={`w-3.5 h-3.5 group-hover:scale-110 group-hover:rotate-12 group-active:scale-135 group-active:rotate-24 transition-transform duration-300 ${isSaved ? 'fill-[#FF6B2C]' : ''}`} />
                                        <span>{isSaved ? 'Saved' : 'Bookmark'}</span>
                                      </motion.button>
                                      
                                      {/* Journal Entry Button */}
                                      {(() => {
                                        const journalId = `${activeDay}-${stopNum}`;
                                        const entry = journalEntries.find(e => e.activityId === journalId);
                                        return (
                                          <motion.button
                                            whileHover={{ y: -1 }}
                                            whileTap={{ scale: 0.9 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                            type="button"
                                            onClick={() => {
                                              setJournalModalActivity({ activity: act, dayNum: activeDay, stopNum });
                                              setJournalModalOpen(true);
                                            }}
                                            className={`relative flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl border text-[11px] sm:text-xs font-sans font-bold cursor-pointer group transition-all whitespace-nowrap shadow-2xs hover:shadow-xs ${entry
                                                ? 'border-[#1E1C1A] bg-[#1E1C1A] text-white hover:bg-stone-800'
                                                : 'border-[#FF6B2C] bg-gradient-to-r from-[#FF6B2C] to-[#FF7744] text-white hover:brightness-105 shadow-xs'
                                              }`}
                                          >
                                            <span className="flex items-center justify-center group-hover:scale-110 group-active:scale-135 group-active:-rotate-18 transition-transform duration-300 shrink-0">
                                              {entry ? <BookOpen className="w-3.5 h-3.5" /> : <PenLine className="w-3.5 h-3.5" />}
                                            </span>
                                            <span className="sm:hidden tracking-wide">{entry ? 'Journal' : '+ Journal'}</span>
                                            <span className="hidden sm:inline tracking-wide">{entry ? 'View Journal' : 'Add Journal Entry'}</span>
                                          </motion.button>
                                        );
                                      })()}
                                    </div>
                                  </div>

                                  <h3 className="text-2xl sm:text-4xl font-serif font-black text-[#1E1C1A] tracking-tight leading-snug mb-3">
                                    {act.title}
                                  </h3>

                                  {/* Clean stats row (Requirement 5: fix duplicate reviews word) */}
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm font-sans font-medium text-[#5F5E5A] mb-3">
                                    <span className="text-amber-600 font-bold">★★★★★ {ratingData.rating}</span>
                                    <span>({formatReviewCount(ratingData?.reviews)})</span>
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
                                  <div className="text-xs font-sans italic text-[#FF6B2C] mb-4 bg-[#FF6B2C]/5 px-3 py-1.5 rounded-lg border-l border-[#FF6B2C]">
                                    ✓ {act.preferenceReasoning || 'Chosen for: High local authenticity, scenic context, and balanced timing pacing.'}
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
                                    <div className="w-full rounded-2xl border border-[#E6DFD5] bg-[#FAF6F0]/80 p-4 sm:p-5 mb-5 shadow-2xs hover:border-[#FF6B2C]/40 transition-all duration-300 relative overflow-hidden group">
                                      {/* Decorative subtle terracotta glow */}
                                      <div className="absolute -right-12 -top-12 w-36 h-36 bg-[#FF6B2C]/10 rounded-full blur-2xl pointer-events-none group-hover:bg-[#FF6B2C]/15 transition-all duration-500" />

                                      {/* Top Row: Icon + Title + Est Rate */}
                                      <div className="flex items-start justify-between gap-3 relative z-10 mb-3.5 pb-3.5 border-b border-[#E6DFD5]/70">
                                        <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-xl bg-white border border-[#E6DFD5] shadow-2xs flex items-center justify-center text-[#FF6B2C] shrink-0 group-hover:scale-105 transition-transform duration-300">
                                            {isNature ? <MapPin className="w-5 h-5 stroke-[2.2]" /> : <Ticket className="w-5 h-5 stroke-[2.2]" />}
                                          </div>
                                          <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <h4 className="font-serif font-bold text-sm sm:text-base text-[#1E1C1A] tracking-tight leading-none">
                                                {ribbonTitle}
                                              </h4>
                                              {(() => {
                                                let hasTicketNote = false;
                                                try {
                                                  const noteKey = `tw_ticket_note_${itinerary?.destinationName || 'Destination'}_day${activeDay}_stop${stopNum}`;
                                                  const storedNote = localStorage.getItem(noteKey);
                                                  if (storedNote && storedNote.trim()) {
                                                    hasTicketNote = true;
                                                  }
                                                } catch (e) { }
                                                if (hasTicketNote) {
                                                  return (
                                                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-600/15 border border-emerald-600/30 text-emerald-700 font-mono text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                                                      <Check className="w-3 h-3 stroke-3" />
                                                      <span>Reference saved ✓</span>
                                                    </span>
                                                  );
                                                }
                                                return (
                                                  <span className="px-2 py-0.5 rounded-full bg-[#FF6B2C]/10 border border-[#FF6B2C]/25 text-[#FF6B2C] font-mono text-[9px] font-bold tracking-wider uppercase">
                                                    {ribbonBadge}
                                                  </span>
                                                );
                                              })()}
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
                                          onClick={() => setActivePassModal({ activity: act, stopNum: stopNum, dayNum: activeDay })}
                                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E1C1A] hover:bg-[#2A2623] text-white text-xs font-sans font-bold shadow-sm transition-all duration-200 cursor-pointer hover:scale-[1.01] active:scale-95"
                                        >
                                          {isNature ? <MapPin className="w-3.5 h-3.5 text-[#FF6B2C] shrink-0" /> : <Ticket className="w-3.5 h-3.5 text-[#FF6B2C] shrink-0" />}
                                          <span>
                                            {(() => {
                                              let hasTicketNote = false;
                                              try {
                                                const noteKey = `tw_ticket_note_${itinerary?.destinationName || 'Destination'}_day${activeDay}_stop${stopNum}`;
                                                const storedNote = localStorage.getItem(noteKey);
                                                if (storedNote && storedNote.trim()) {
                                                  hasTicketNote = true;
                                                }
                                              } catch (e) { }
                                              return hasTicketNote ? 'View Saved Reference ✓' : ribbonBtnText;
                                            })()}
                                          </span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            window.open(ribbonActionUrl, '_blank', 'noopener,noreferrer');
                                          }}
                                          className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E6DFD5] hover:border-[#FF6B2C] bg-white text-[#1E1C1A] hover:text-[#FF6B2C] text-xs font-sans font-bold shadow-2xs transition-all duration-200 cursor-pointer group/btn"
                                          title={ribbonActionLabel}
                                        >
                                          <span>{ribbonActionLabel}</span>
                                          <ExternalLink className="w-3.5 h-3.5 text-[#7A7268] group-hover/btn:text-[#FF6B2C] shrink-0 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
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
                                      className="inline-flex items-center gap-1 px-4 py-2 rounded-full border border-[#E6DFD5] hover:border-[#FF6B2C] hover:text-[#FF6B2C] bg-white text-xs font-sans text-[#7A7268] transition-all cursor-pointer"
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

                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/70 p-4 sm:p-5 rounded-2xl border border-[#E6DFD5] shadow-2xs">
                                            <div className="flex items-start gap-2.5">
                                              <MapPin className="w-4 h-4 text-[#FF6B2C] shrink-0 mt-0.5" />
                                              <div>
                                                <strong className="block text-xs font-sans uppercase tracking-wider text-[#7A7268] font-bold">Logistics &amp; Gate Access</strong>
                                                <p className="text-xs font-serif italic text-[#5F5E5A] mt-0.5 leading-relaxed">{logisticsNote}</p>
                                              </div>
                                            </div>

                                            <div className="flex items-start gap-2.5">
                                              <Sun className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                              <div>
                                                <strong className="block text-xs font-sans uppercase tracking-wider text-[#7A7268] font-bold">Daylight &amp; Weather Alert</strong>
                                                <p className="text-xs font-serif italic text-[#5F5E5A] mt-0.5 leading-relaxed">{weatherNote}</p>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Concierge handwritten notes */}
                                          <div className="p-5 sm:p-6 rounded-2xl bg-[#F3EFEA] border-l-2 border-[#FF6B2C] relative shadow-2xs">
                                            <span className="font-serif text-3xl text-[#FF6B2C] absolute top-1.5 left-4 leading-none select-none">“</span>
                                            <p className="font-serif italic text-sm sm:text-base text-[#3E3A36] pl-5 leading-relaxed">
                                              {aiInsightText}
                                            </p>
                                            <span className="block text-[10px] font-sans uppercase tracking-widest text-[#7A7268] pl-5 pt-3 font-bold">
                                              — TripWise Concierge Custom Insight
                                            </span>
                                          </div>

                                          {isDining && (
                                            <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-[#E6DFD5] text-xs font-sans">
                                              <span className="text-[#7A7268]">Reservation Booking Details:</span>
                                              <strong className="text-[#1E1C1A]">
                                                {act.reservationNote || 'Recommended during peak dinner hours (6:30 PM – 9:00 PM)'}
                                              </strong>
                                            </div>
                                          )}

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
                                        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E6DFD5] flex flex-col gap-3.5 shadow-2xs">
                                          <div className="border-b border-[#E6DFD5] pb-2.5">
                                            <h4 className="text-xs font-sans font-bold uppercase tracking-widest text-[#FF6B2C]">
                                              Nearby Alternatives
                                            </h4>
                                            <p className="text-xs font-serif italic text-[#7A7268] mt-1">
                                              Curated backup choices and spontaneous diversions in the immediate neighborhood if weather or crowd pacing changes.
                                            </p>
                                          </div>
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
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#FF6B2C]/30 bg-[#FF6B2C]/10 text-[#FF6B2C] font-sans text-xs font-bold hover:bg-[#FF6B2C]/20 transition-all cursor-pointer shadow-2xs"
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
                          className="px-5 py-2.5 rounded-full bg-[#1E1C1A] text-white hover:bg-[#FF6B2C] text-xs font-sans font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
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

        {/* PRINT-ONLY FULL DOSSIER SEQUENCE (All Days 1..N + Epilogue in sequence for PDF/Print) */}
        <div className={`hidden print:block print:w-full text-[#1E1C1A] ${isPrinting ? 'block! w-full!' : ''}`}>
          {/* PRINT HERO HEADER (High-contrast solid brand panel, no photographic bg, 100% legibility) */}
          <header className="print-hero-section w-full pt-4 pb-8 mb-8 border-b-4 border-[#1E1C1A] block">
            <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-widest text-[#FF6B2C] mb-3">
              <span>Curated Private Travel Dossier</span>
              <span>{itinerary.duration || `${days.length} Days`} • {itinerary.destinationName || 'Destination'}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-serif font-black text-[#1E1C1A] tracking-tight mb-3">
              {itinerary.destinationName || 'Your Custom Journey'} — Curated Itinerary
            </h1>
            <p className="font-serif italic text-base text-[#4A443E] max-w-3xl leading-relaxed mb-4">
              “{itinerary.tagline || 'An immersive, thoughtfully paced exploration tailored to your unique architectural, culinary, and cultural preferences.'}”
            </p>
            <div className="flex items-center gap-4 text-xs font-sans uppercase tracking-wider text-[#5F5E5A] font-bold pt-3 border-t border-[#C8BFB2]">
              <span>{days.length} Daily Chapters</span>
              <span>•</span>
              <span>{totalStopsCount} Curated Stops</span>
              <span>•</span>
              <span>Est. Budget: {getConvertedEstimatedCost(itinerary.estimatedCost, userCurrency)}</span>
            </div>
          </header>

          {/* PRINT DOSSIER INDEX (Clean Chapters Index without 3D interaction copy - Issue 5) */}
          <section className="print-index-section w-full pt-2 pb-8 mb-8 border-b-2 border-[#1E1C1A] block">
            <div className="flex items-end justify-between gap-4 pb-4 border-b border-[#E6DFD5] mb-6">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-[#FF6B2C] font-bold block mb-1">
                  The Dossier Index
                </span>
                <h2 className="text-3xl font-serif font-black text-[#1E1C1A] tracking-tight">
                  Curated Chapters
                </h2>
              </div>
              <p className="text-xs font-serif italic text-[#7A7268] max-w-xs">
                Chronologically mapped daily schedules and pacing statistics across your trip.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {days.map((day, idx) => {
                const dayNum = day.dayNumber || idx + 1;
                const summary = getDaySummary(day, idx, days);
                return (
                  <div
                    key={`print-index-${dayNum}`}
                    className="print-stat-box flex flex-col justify-between p-5 rounded-2xl bg-[#FAF6F0] border border-[#C8BFB2]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="px-2.5 py-0.5 rounded-md bg-[#1E1C1A] text-white font-serif text-xs font-bold tracking-wider">
                          Day {toRomanNumeral(dayNum)}
                        </span>
                        <span className="text-xs font-sans text-[#7A7268] font-semibold">
                          Chapter {dayNum}
                        </span>
                      </div>
                      <h3 className="text-base font-serif font-bold text-[#1E1C1A] leading-snug">
                        {getDayNarrativeTitle(dayNum, itinerary.destinationName || 'Destination')}
                      </h3>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E6DFD5] flex items-center justify-between text-[11px] font-sans text-[#5F5E5A]">
                      <span>{day.activities?.length || 0} Curated Stops</span>
                      <span className="font-bold text-[#1E1C1A]">{summary?.stats?.hours || '6.5 Hours'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {days.map((day, dIdx) => {
            const dayNum = day.dayNumber || dIdx + 1;
            const summary = getDaySummary(day, dIdx, days);
            const activities = day.activities || [];
            return (
              <section key={`print-day-${dayNum}`} className={`print-day-section w-full pt-4 pb-8 mb-8 border-t-2 border-[#1E1C1A] block ${dIdx > 0 ? 'break-before-page' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-md bg-[#1E1C1A] text-white font-serif text-xs font-bold tracking-wider">
                    Day {toRomanNumeral(dayNum)}
                  </span>
                  <span className="text-xs font-sans font-bold text-[#7A7268] uppercase tracking-wider">
                    Chapter {dayNum} • {activities.length} Curated Stops
                  </span>
                </div>
                <h3 className="text-3xl font-serif font-black text-[#1E1C1A] tracking-tight mb-2">
                  {getDayNarrativeTitle(dayNum, itinerary.destinationName || 'Destination')}
                </h3>
                <p className="font-serif italic text-base text-[#4A443E] mb-6">
                  {day.pacingQuote || 'An immersive day crafted for scenic depth and architectural pacing.'}
                </p>

                {/* Daylight Pace Bar in print (Clean plain-language pacing label without confusing percentage - Issue 2) */}
                <div className="mb-8 p-4 bg-[#FAF6F0] rounded-2xl border border-[#E6DFD5] text-xs">
                  <div className="flex items-center justify-between font-sans font-bold uppercase text-[10px] text-[#7A7268] mb-1.5">
                    <span>Daylight Pacing: {getPacingLabel(activities)}</span>
                    <span>{summary?.stats?.hours || '6.5 Hours'} Total Pace</span>
                  </div>
                  {(() => {
                    const hoursNum = parseFloat(summary?.stats?.hours || '6.5') || 6.5;
                    const usedPct = Math.min(Math.max(Math.round((hoursNum / 14) * 100), 25), 90);
                    return (
                      <div className="w-full h-2 rounded-full bg-[#E6DFD5] overflow-hidden flex">
                        <div className="bg-amber-500 h-full" style={{ width: `${usedPct}%` }} title={`${hoursNum} hours of daylight exploration`} />
                        <div className="bg-indigo-900 h-full flex-1" title="Evening / rest hours" />
                      </div>
                    );
                  })()}
                </div>

                {/* All Stops Expanded */}
                <div className="flex flex-col gap-6">
                  {activities.map((act, aIdx) => {
                    const stopNum = aIdx + 1;
                    const { logisticsNote, weatherNote } = getContextAwareTip(act, aIdx, summary);
                    const aiInsightText = getAiInsight(act, aIdx);
                    const alternatives = getAlternativeSuggestions(act, aIdx);
                    const categoryStyle = getCategoryStyling(act);
                    const ratingData = getActivityRating(act);
                    const costInfo = formatCost(act);

                    return (
                      <div key={`print-stop-${dayNum}-${stopNum}`} className="print-card p-6 rounded-2xl bg-white border border-[#C8BFB2] flex flex-col gap-4 mb-6">
                        <div className="flex items-center justify-between border-b border-[#E6DFD5] pb-3 text-xs font-sans">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#1E1C1A] text-white font-serif text-xs font-bold flex items-center justify-center">
                              {stopNum}
                            </span>
                            <span className="font-bold uppercase tracking-wider text-[#FF6B2C]">{categoryStyle.name}</span>
                          </div>
                          <div className="font-mono text-[#5F5E5A] font-bold">
                            Planned: {act.time || '10:00 AM'} ({act.duration || '1.5 hrs'})
                          </div>
                        </div>

                        <h4 className="text-2xl font-serif font-black text-[#1E1C1A]">
                          {act.title}
                        </h4>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-sans font-medium text-[#5F5E5A]">
                          <span className="text-amber-600 font-bold">★★★★★ {ratingData.rating}</span>
                          <span>({formatReviewCount(ratingData?.reviews)})</span>
                          <span className="text-[#C8BFB2] font-serif">•</span>
                          <span className="font-bold text-[#1E1C1A]">{costInfo.title}</span>
                          {act.duration && (
                            <>
                              <span className="text-[#C8BFB2] font-serif">•</span>
                              <span>Duration: <strong>{act.duration}</strong></span>
                            </>
                          )}
                        </div>

                        <div className="text-xs font-sans italic text-[#FF6B2C] bg-[#FF6B2C]/5 px-3 py-1.5 rounded-lg border-l border-[#FF6B2C]">
                          ✓ Chosen for: High local authenticity, scenic context, and balanced timing pacing.
                        </div>

                        <p className="font-serif text-base text-[#2A2623] leading-relaxed">
                          {act.description}
                        </p>

                        {/* Expanded Logistics & Weather */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FAF6F0] p-4 rounded-xl border border-[#E6DFD5] text-xs">
                          <div>
                            <strong className="block font-sans uppercase tracking-wider text-[#7A7268] font-bold mb-1">Logistics &amp; Gate Access</strong>
                            <p className="font-serif italic text-[#4A443E]">{logisticsNote}</p>
                          </div>
                          <div>
                            <strong className="block font-sans uppercase tracking-wider text-[#7A7268] font-bold mb-1">Daylight &amp; Weather Alert</strong>
                            <p className="font-serif italic text-[#4A443E]">{weatherNote}</p>
                          </div>
                        </div>

                        {/* Expanded Concierge Insight Box */}
                        <div className="p-4 rounded-xl bg-[#F3EFEA] border-l-2 border-[#FF6B2C] text-xs">
                          <p className="font-serif italic text-[#3E3A36] mb-2 leading-relaxed">
                            “{aiInsightText}”
                          </p>
                          <span className="block font-sans uppercase text-[9px] tracking-widest text-[#7A7268] font-bold">
                            — TripWise Concierge Custom Insight
                          </span>
                        </div>

                        {/* Expanded Alternatives */}
                        {alternatives && alternatives.length > 0 && (
                          <div className="mt-2 pt-3 border-t border-[#E6DFD5]">
                            <strong className="text-xs font-sans font-bold uppercase tracking-widest text-[#FF6B2C] block mb-2">Nearby Alternatives</strong>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              {alternatives.map((alt, altIdx) => (
                                <div key={`print-alt-${altIdx}`} className="p-3 bg-[#FAF6F0] rounded-lg border border-[#E6DFD5]/70">
                                  <strong className="font-serif font-bold text-[#1E1C1A] block mb-1">{alt.title}</strong>
                                  <p className="font-serif italic text-[11px] text-[#4A443E] leading-relaxed">{alt.desc}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {/* Print Epilogue Section */}
          <section className="print-epilogue-section w-full pt-8 pb-12 border-t-2 border-[#1E1C1A] block break-before-page">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <span className="text-xs font-mono uppercase tracking-widest text-[#FF6B2C] font-bold block mb-1">
                THE EPILOGUE — DOSSIER SUMMARY
              </span>
              <h2 className="text-4xl font-serif font-black text-[#1E1C1A] tracking-tight">
                Trip Epilogue &amp; Statistics
              </h2>
            </div>

            <div className="print-stamp-wrapper flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-[#FAF6F0] rounded-2xl border border-[#E6DFD5] mb-6">
              <div className="w-36 h-36 rounded-full border-4 border-dashed border-[#FF6B2C]/80 text-[#FF6B2C] flex flex-col items-center justify-center font-serif uppercase text-center shrink-0">
                <span className="text-[9px] tracking-widest font-bold">Approved</span>
                <span className="text-base font-black tracking-tight my-0.5">TripWise</span>
                <span className="text-[7px] tracking-[0.2em] font-extrabold text-[#7A7268]">Concierge</span>
                <div className="text-[6px] text-[#7A7268] tracking-widest font-sans font-bold uppercase mt-1">Private Guide</div>
              </div>
              <div className="text-center sm:text-left">
                <h4 className="font-serif font-bold text-lg text-[#1E1C1A]">TripWise Travel Concierge • Private Guide</h4>
                <p className="text-xs font-serif italic text-[#7A7268] mt-1 leading-relaxed max-w-md">
                  ✨ Custom travel dossier assembled &amp; formatted for offline exploration.
                </p>
              </div>
            </div>

            {/* Grid stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 rounded-2xl bg-white border border-[#E6DFD5] text-center mb-6">
              <div className="flex flex-col gap-1 border-r border-[#E6DFD5] last:border-r-0">
                <span className="text-xs font-sans uppercase tracking-widest text-[#7A7268]">Total Duration</span>
                <span className="text-2xl font-serif font-black text-[#1E1C1A]">{days.length} Days</span>
              </div>
              <div className="flex flex-col gap-1 border-r border-[#E6DFD5] last:border-r-0">
                <span className="text-xs font-sans uppercase tracking-widest text-[#7A7268]">Experiences Plotted</span>
                <span className="text-2xl font-serif font-black text-[#1E1C1A]">{totalStopsCount} Stops</span>
              </div>
              <div className="flex flex-col gap-1 border-r border-[#E6DFD5] last:border-r-0">
                <span className="text-xs font-sans uppercase tracking-widest text-[#7A7268]">Walking Distance</span>
                <span className="text-2xl font-serif font-black text-[#1E1C1A]">~{totalDistanceEst} km</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-sans uppercase tracking-widest text-[#7A7268]">Estimated Cost</span>
                <span className="text-2xl font-serif font-black text-[#FF6B2C]">{getConvertedEstimatedCost(itinerary.estimatedCost, userCurrency)}</span>
              </div>
            </div>

            {/* Trip-Level Dining Rollup */}
            {tripDiningRollup.total > 0 && (
              <div className="print-summary-panel p-6 rounded-2xl bg-[#FAF6F0] border border-[#FF6B2C]/30 flex flex-col gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-serif font-bold text-[#1E1C1A]">🍽️ Trip-Level Dining Concierge Rollup</span>
                </div>
                <p className="text-xs font-sans text-[#5F5E5A]">
                  {tripDiningRollup.markedReserved === tripDiningRollup.total ? 'All dining reservations across your itinerary are marked as booked!' : `${tripDiningRollup.markedReserved || 0} of ${tripDiningRollup.total} dining reservations marked as booked.`}
                </p>
              </div>
            )}

            {/* Packing & Prep Reminders */}
            <div className="print-summary-panel p-6 rounded-2xl bg-white border border-[#E6DFD5] mb-6">
              <h3 className="text-sm font-sans font-bold uppercase tracking-widest text-[#FF6B2C] border-b border-[#E6DFD5] pb-2 mb-3">
                Concierge Packing &amp; Prep Reminders
              </h3>
              <ul className="text-xs font-serif text-[#4A443E] leading-relaxed flex flex-col gap-2 list-disc pl-4">
                <li>
                  <strong>Comfortable Footwear:</strong> Your route covers approximately {totalDistanceEst} km. Wear robust walking shoes suited for old city cobblestones.
                </li>
                <li>
                  <strong>Church/Cultural Sites:</strong> Several scheduled historical landmarks require covered shoulders and knees to enter.
                </li>
                <li>
                  <strong>Reusable Flasks:</strong> Rome features free historic drinking fountains (Nasoni) across streets—highly recommended for daylight walking segments.
                </li>
              </ul>
            </div>

            {/* Booking Status Overview (Table layout to guarantee no WebKit/Chrome clipping across page boundaries - Issue 4) */}
            <div className="print-summary-panel p-6 rounded-2xl bg-white border border-[#E6DFD5] mb-8">
              <h3 className="text-sm font-sans font-bold uppercase tracking-widest text-[#FF6B2C] border-b border-[#E6DFD5] pb-2 mb-4">
                Booking &amp; Tickets Status Overview
              </h3>
              <table className="w-full text-left border-collapse">
                <tbody>
                  {preBookedItems.map((item, keyIdx) => (
                    <tr key={`print-booking-${keyIdx}`} className="border-b border-[#FAF6F0] last:border-b-0 print-booking-row">
                      <td className="py-2.5 pr-4 align-middle">
                        <strong className="block text-[#1E1C1A] font-serif text-xs">{item.item}</strong>
                        <span className="text-[10px] text-[#7A7268] font-sans block mt-0.5">{item.code || 'Instant access link available'}</span>
                      </td>
                      <td className="py-2.5 pl-2 align-middle text-right shrink-0 w-28">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF6F0] border border-[#E6DFD5] text-[#1E1C1A]">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Signature */}
            <div className="pt-6 border-t border-[#E6DFD5] flex items-center justify-between text-xs font-serif italic text-[#7A7268]">
              <span>TripWise Travel Concierge · Curated Private Travel Dossier Guide</span>
              <span>Generated {itinerary.generatedDate || '2026'}</span>
            </div>
          </section>
        </div>

      </motion.div>
    </AnimatePresence>
  </main>
</div>

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
                    basecampHotel={itinerary.basecampHotelDetails || itinerary.basecampHotel}
                  />
                )}
                {!mapMounted && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#FAF6F0]">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-[#FF6B2C]/30 border-t-[#FF6B2C] animate-spin" />
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
        dayNumber={activePassModal?.dayNum || (typeof activeDay === 'number' ? activeDay : 1)}
        stopNumber={activePassModal?.stopNum || 1}
        onStatusChange={handleDiningBookingsChange}
      />

      {/* Invite Modal */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <InviteModal 
            isOpen={isInviteModalOpen}
            onClose={() => setIsInviteModalOpen(false)}
            tripId={activeTripId || itinerary?.id || itinerary?.db_id || 'shared-trip'}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPublishModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPublishModalOpen(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl z-10 overflow-hidden border border-stone-200"
            >
              <h3 className="text-2xl font-serif font-bold text-stone-900 mb-2">Publish Trip to Community</h3>
              <p className="text-sm text-stone-500 mb-6">Share your masterpiece with other travelers.</p>

              {isPublished ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                    <Check className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h4 className="text-xl font-bold text-stone-900 mb-2">Published Successfully!</h4>
                  <p className="text-stone-500 text-sm">Your trip is now visible on the Community feed.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Title */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-stone-500 mb-2">Trip Title</label>
                    <input
                      type="text"
                      value={publishForm.title}
                      onChange={(e) => setPublishForm({ ...publishForm, title: e.target.value })}
                      placeholder="e.g. 3 Days of Coffee & Culture in Tokyo"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-900 focus:outline-none focus:border-[#F4703C] focus:ring-1 focus:ring-[#F4703C] transition-all"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-stone-500 mb-2">Tags (comma separated)</label>
                    <input
                      type="text"
                      value={publishForm.tags}
                      onChange={(e) => setPublishForm({ ...publishForm, tags: e.target.value })}
                      placeholder="e.g. Budget, Solo, Foodie"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-900 focus:outline-none focus:border-[#F4703C] focus:ring-1 focus:ring-[#F4703C] transition-all"
                    />
                  </div>

                  {/* Cover Photo Dropzone */}
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-stone-500 mb-2">Cover Photo</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePublishPhotoUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="w-full bg-stone-50 border border-stone-200 border-dashed rounded-xl px-4 py-4 flex flex-col items-center justify-center text-stone-500 hover:border-[#F4703C] hover:text-[#F4703C] transition-colors group">
                        {publishForm.coverPhoto ? (
                          <div className="relative w-full h-32 rounded-lg overflow-hidden">
                            <img src={publishForm.coverPhoto} alt="Cover Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-bold text-sm">
                              Change Photo
                            </div>
                          </div>
                        ) : (
                          <>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                              <circle cx="8.5" cy="8.5" r="1.5"></circle>
                              <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                            <span className="text-sm font-semibold">Upload a striking cover image</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 flex items-center justify-end gap-3">
                    <button
                      onClick={() => setIsPublishModalOpen(false)}
                      className="px-5 py-2.5 rounded-full text-sm font-bold text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePublishSubmit}
                      disabled={!publishForm.title}
                      className="px-6 py-2.5 rounded-full text-sm font-bold bg-[#F4703C] text-white hover:bg-[#E25C27] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-[#F4703C]/30"
                    >
                      Publish to Feed
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Emergency Modal / Slide-up Bottom Sheet */}
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        destinationName={itinerary?.destinationName}
        passportNationality={passportNationality}
      />

      {/* Saved Places Modal */}
      <SavedPlacesModal 
        isOpen={isSavedPlacesModalOpen}
        onClose={() => setIsSavedPlacesModalOpen(false)}
        savedStops={savedStops}
        itinerary={itinerary}
      />

      {/* Journal Entry Modal */}
      <JournalEntryModal
        isOpen={journalModalOpen}
        onClose={() => { setJournalModalOpen(false); setJournalModalActivity(null); }}
        activity={journalModalActivity?.activity}
        dayNum={journalModalActivity?.dayNum}
        stopNum={journalModalActivity?.stopNum}
        existingEntry={journalModalActivity ? journalEntries.find(e => e.activityId === `${journalModalActivity.dayNum}-${journalModalActivity.stopNum}`) : null}
        onSave={(entryData) => {
          const tripId = activeTripId || itinerary?.id || itinerary?.db_id || 'shared-trip';
          const isNew = !entryData.id;
          const activityTitle = journalModalActivity?.activity?.title;
          
          addJournalEntry(tripId, entryData);
          setJournalEntries(getTripJournalEntries(tripId));
          setJournalModalOpen(false);
          
          setJournalSuccessMessage({
            title: activityTitle || "Activity",
            isNew
          });
          
          setJournalModalActivity(null);
          
          // Fire preference signal for journal engagement
          if (entryData.personalRating > 0 && journalModalActivity?.activity) {
            recordTripSignals({}, [], [], [{
              activity: journalModalActivity.activity,
              entry: entryData
            }]);
          }
        }}
        onDelete={(entryId) => {
          import('../../lib/journalApi').then(({ removeJournalEntry }) => {
            const tripId = activeTripId || itinerary?.id || itinerary?.db_id || 'shared-trip';
            removeJournalEntry(tripId, entryId);
            setJournalEntries(getTripJournalEntries(tripId));
            setJournalModalOpen(false);
            setJournalModalActivity(null);
          });
        }}
      />

      {/* Skip Confirmation Toast Message */}
      <AnimatePresence>
        {skipConfirmation && (
          <div className="fixed bottom-20 sm:bottom-10 left-4 right-4 sm:left-auto sm:right-10 z-[100002] flex justify-center sm:justify-end pointer-events-none">
            <motion.div
              initial={{ y: 35, opacity: 0, scale: 0.94 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.94 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="w-full max-w-sm sm:max-w-md bg-white/95 backdrop-blur-2xl border border-[#E6DFD5] text-[#1E1C1A] p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-[0_24px_50px_-10px_rgba(30,28,26,0.22),0_0_0_1px_rgba(255,255,255,0.8)_inset] pointer-events-auto flex flex-col gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0 text-red-500 shadow-2xs mt-0.5">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-sans font-bold text-[#1E1C1A] leading-tight">
                    Skip this activity?
                  </h4>
                  <p className="text-[11px] sm:text-xs font-sans text-[#7A7268] mt-0.5 truncate leading-tight">
                    Remove <strong className="text-[#1E1C1A] font-semibold">&quot;{skipConfirmation.title}&quot;</strong> from Day {skipConfirmation.dayNum}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6DFD5]/70">
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  type="button"
                  onClick={() => setSkipConfirmation(null)}
                  className="px-3.5 sm:px-4 py-1.5 rounded-xl border border-[#E6DFD5] bg-[#FAF6F0] hover:bg-[#F5F0E8] text-[#7A7268] hover:text-[#1E1C1A] text-xs font-sans font-bold shadow-2xs transition-all cursor-pointer"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  type="button"
                  onClick={handleConfirmSkip}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-sans font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
                >
                  <Trash2 className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform duration-200" />
                  <span>Yes, Skip</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Animated Success Message with Undo */}
      <AnimatePresence>
        {journalSuccessMessage && (
          <div className="fixed bottom-20 sm:bottom-10 left-4 right-4 sm:left-0 sm:right-0 z-[200000] flex justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="bg-white/95 backdrop-blur-xl border border-[#E6DFD5]/80 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.18)] p-2 pr-4 sm:pr-5 rounded-full flex items-center gap-3 pointer-events-auto max-w-[92vw] sm:max-w-md"
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(255,107,44,0.3)] ${journalSuccessMessage.isSkip ? 'bg-[#7A7268]' : 'bg-[#FF6B2C]'}`}>
                <motion.div
                   initial={{ scale: 0, rotate: -45 }}
                   animate={{ scale: 1, rotate: 0 }}
                   transition={{ type: "spring", stiffness: 400, delay: 0.1 }}
                >
                  {journalSuccessMessage.isSkip ? (
                     <FastForward className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[3px] ml-0.5" />
                  ) : (
                     <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[3px]" />
                  )}
                </motion.div>
              </div>
              <div className="flex flex-col justify-center min-w-0 flex-1">
                <h4 className="text-xs sm:text-[13px] font-sans font-bold text-[#1E1C1A] leading-tight mb-0.5">
                  {journalSuccessMessage.isSkip ? 'Activity Skipped' : (journalSuccessMessage.isNew ? 'Entry saved successfully' : 'Entry updated successfully')}
                </h4>
                <p className="text-[10.5px] sm:text-[11px] font-sans font-medium text-[#7A7268] truncate max-w-[150px] sm:max-w-[200px] leading-tight">
                  {journalSuccessMessage.title}
                </p>
              </div>

              {journalSuccessMessage.isSkip && lastSkippedStop && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={handleUndoSkip}
                  className="px-2.5 sm:px-3 py-1 rounded-full bg-[#FF6B2C]/15 hover:bg-[#FF6B2C]/25 text-[#FF6B2C] text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0"
                >
                  Undo
                </motion.button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Trip Recap Modal */}
      <TripRecapModal
        isOpen={isRecapModalOpen}
        onClose={() => setIsRecapModalOpen(false)}
        itinerary={itinerary}
        estBudget={itinerary?.estimatedCost}
      />

      {/* PERSISTENT FLOATING EMERGENCY (SOS) BUTTON - ACCESSIBLE FROM ANY TAB */}
      <div className="fixed bottom-6 right-6 z-[90] print:hidden">
        <button
          type="button"
          onClick={() => setIsEmergencyModalOpen(true)}
          className="group flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[#1E1C1A] text-white shadow-lg border border-[#E6DFD5] hover:border-[#FF6B2C] hover:bg-[#FF6B2C] transition-all duration-200 cursor-pointer select-none"
          title="Open Emergency Info & Safety Concierge"
        >
          <ShieldAlert className="w-4 h-4 text-[#FF6B2C] group-hover:text-white shrink-0 transition-colors" />
          <span className="font-sans text-xs font-bold uppercase tracking-wider text-white">
            Emergency
          </span>
        </button>
      </div>

      <LiveAssistantNudge
        show={showNudge}
        onAdjust={handleLiveAssistantAdjust}
        onSnooze={snoozeNudges}
        onDismiss={dismissNudge}
      />

      <WeatherNudge
        show={!!weatherNudge}
        nudgeData={weatherNudge}
        onAdjust={handleWeatherSwap}
        onDismiss={dismissWeatherNudge}
      />

      <LiveAssistantProposalModal
        show={!!liveAssistantProposal}
        proposal={liveAssistantProposal}
        onAccept={applyLiveAssistantProposal}
        onReject={() => setLiveAssistantProposal(null)}
        isApplying={isApplyingProposal}
      />

      <footer className="py-12 text-center text-xs font-serif italic text-[#7A7268] border-t border-[#E6DFD5] bg-white mt-auto">
        TripWise Private Travel Concierge · Published Dossier Guide · Powered by Google Gemini
      </footer>
    </div>
  );
}
