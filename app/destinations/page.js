'use client';

import React, { useState, useMemo, useRef } from 'react';
import Header from '../components/Header';
import { useRouter } from 'next/navigation';

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

// ─── Destination Data ────────────────────────────────────────────────────────
const DESTINATIONS = [
  {
    id: 'rome',
    name: 'Rome',
    country: 'Italy',
    region: 'europe',
    badge: '🏛️ History & Culture',
    badgeColor: '#7C3AED',
    rating: 4.9,
    reviews: 2841,
    vibes: ['history', 'foodie', 'art'],
    budget: ['standard', 'premium'],
    tagline: 'Where every cobblestone tells a story',
    duration: '4–6 days',
    prompt: '5 days in Rome: ancient ruins, Vatican, hidden trattorias & sunset over the Tiber',
    gradient: 'from-amber-900/70 via-orange-800/50 to-transparent',
    imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&auto=format&fit=crop&q=80',
    emoji: '🍕',
    bgColor: '#C8956C',
  },
  {
    id: 'kyoto',
    name: 'Kyoto',
    country: 'Japan',
    region: 'asia',
    badge: '🌸 Temples & Zen',
    badgeColor: '#DB2777',
    rating: 4.8,
    reviews: 3102,
    vibes: ['history', 'nature', 'foodie'],
    budget: ['standard', 'premium'],
    tagline: 'Ancient Japan, perfectly preserved',
    duration: '5–7 days',
    prompt: '5 days in Kyoto: temples, bamboo groves, tea ceremonies & kaiseki dining',
    gradient: 'from-pink-900/70 via-rose-800/50 to-transparent',
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80',
    emoji: '🌸',
    bgColor: '#C8929A',
  },
  {
    id: 'swiss-alps',
    name: 'Swiss Alps',
    country: 'Switzerland',
    region: 'europe',
    badge: '⛰️ Adventure & Nature',
    badgeColor: '#0891B2',
    rating: 4.9,
    reviews: 1876,
    vibes: ['nature', 'art'],
    budget: ['premium'],
    tagline: 'Breathtaking peaks, crystal lakes',
    duration: '6–8 days',
    prompt: '7 days in Swiss Alps: Zermatt, Interlaken, scenic train rides & alpine hikes',
    gradient: 'from-sky-900/70 via-blue-800/50 to-transparent',
    imageUrl: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800&auto=format&fit=crop&q=80',
    emoji: '🏔️',
    bgColor: '#6B93B0',
  },
  {
    id: 'marrakech',
    name: 'Marrakech',
    country: 'Morocco',
    region: 'africa',
    badge: '🕌 Souks & Spice',
    badgeColor: '#D97706',
    rating: 4.7,
    reviews: 1654,
    vibes: ['shopping', 'history', 'foodie'],
    budget: ['economy', 'standard'],
    tagline: 'A sensory explosion in every alley',
    duration: '3–5 days',
    prompt: '4 days in Marrakech: medina souks, riad stays, Djemaa el-Fna & Sahara day trip',
    gradient: 'from-orange-900/70 via-amber-800/50 to-transparent',
    imageUrl: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800&auto=format&fit=crop&q=80',
    emoji: '🕌',
    bgColor: '#C8895A',
  },
  {
    id: 'new-york',
    name: 'New York',
    country: 'USA',
    region: 'americas',
    badge: '🗽 City & Nightlife',
    badgeColor: '#1D4ED8',
    rating: 4.8,
    reviews: 4201,
    vibes: ['nightlife', 'art', 'foodie', 'shopping'],
    budget: ['standard', 'premium'],
    tagline: 'The city that never stops surprising',
    duration: '5–7 days',
    prompt: '6 days in New York: Brooklyn food scene, MoMA, Manhattan skyline, jazz bars & Times Square',
    gradient: 'from-slate-900/70 via-gray-800/50 to-transparent',
    imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e57fe2c?w=800&auto=format&fit=crop&q=80',
    emoji: '🗽',
    bgColor: '#6B7BA0',
  },
  {
    id: 'bali',
    name: 'Bali',
    country: 'Indonesia',
    region: 'asia',
    badge: '🌴 Spiritual & Tropical',
    badgeColor: '#059669',
    rating: 4.7,
    reviews: 3487,
    vibes: ['nature', 'foodie', 'art'],
    budget: ['economy', 'standard'],
    tagline: 'Jungle temples and infinite sunsets',
    duration: '7–10 days',
    prompt: '8 days in Bali: Ubud rice terraces, Uluwatu temples, surf lessons & organic cuisine',
    gradient: 'from-green-900/70 via-emerald-800/50 to-transparent',
    imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&auto=format&fit=crop&q=80',
    emoji: '🌴',
    bgColor: '#6B9B7A',
  },
  {
    id: 'barcelona',
    name: 'Barcelona',
    country: 'Spain',
    region: 'europe',
    badge: '🎨 Art & Architecture',
    badgeColor: '#DC2626',
    rating: 4.8,
    reviews: 2934,
    vibes: ['art', 'foodie', 'nightlife'],
    budget: ['standard', 'premium'],
    tagline: 'Gaudí, tapas, and Mediterranean magic',
    duration: '4–6 days',
    prompt: '5 days in Barcelona: Sagrada Família, Gothic Quarter, pintxos crawl & beach at Barceloneta',
    gradient: 'from-red-900/70 via-rose-800/50 to-transparent',
    imageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&auto=format&fit=crop&q=80',
    emoji: '🎨',
    bgColor: '#C8726B',
  },
  {
    id: 'queenstown',
    name: 'Queenstown',
    country: 'New Zealand',
    region: 'oceania',
    badge: '🪂 Adventure Capital',
    badgeColor: '#7C3AED',
    rating: 4.9,
    reviews: 1203,
    vibes: ['nature', 'nightlife'],
    budget: ['premium'],
    tagline: 'Bungee jumps and fjord-blue lakes',
    duration: '4–6 days',
    prompt: '5 days in Queenstown: bungee jumping, Milford Sound, Fergburger & Remarkables ski field',
    gradient: 'from-violet-900/70 via-purple-800/50 to-transparent',
    imageUrl: 'https://images.unsplash.com/photo-1607427293702-036933bbf746?w=800&auto=format&fit=crop&q=80',
    emoji: '🪂',
    bgColor: '#7B7AB0',
  },
];

const TRENDING_IDS = ['kyoto', 'new-york', 'barcelona', 'queenstown'];

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
      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs md:text-sm font-semibold transition-all duration-150 cursor-pointer shadow-2xs hover:scale-[1.01] active:scale-95 whitespace-nowrap ${
        active
          ? 'bg-[#FF6B2C]/10 border-2 border-[#FF6B2C] text-stone-900 font-extrabold shadow-sm'
          : 'bg-white border border-stone-200 text-stone-650 hover:border-stone-400 font-medium'
      }`}
    >
      {icon && (
        <span className={active ? 'text-[#FF6B2C]' : 'text-stone-400'}>
          {icon}
        </span>
      )}
      {label}
    </button>
  );
}

function DestCard({ dest, onClick }) {
  return (
    <div
      onClick={() => onClick(dest)}
      className="group cursor-pointer rounded-2xl overflow-hidden bg-white border border-[#ECE8E2] shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col"
    >
      <div className="relative h-44 overflow-hidden" style={{ backgroundColor: dest.bgColor }}>
        {dest.imageUrl && (
          <img src={dest.imageUrl} alt={dest.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        )}
        <div className={`absolute inset-0 bg-gradient-to-t ${dest.gradient}`} />
        <div className="absolute top-3 left-3">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white"
            style={{ backgroundColor: dest.badgeColor + 'dd' }}
          >
            {dest.badge}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-semibold bg-black/40 text-white px-2 py-1 rounded-full backdrop-blur-sm">
            {dest.duration}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 p-4 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-[#1F1F1F] text-base leading-tight">{dest.name}</h3>
            <p className="text-xs text-stone-500 font-medium">{dest.country}</p>
          </div>
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <Stars rating={dest.rating} />
            <span className="text-[10px] text-stone-400">{dest.reviews.toLocaleString()} trips</span>
          </div>
        </div>

        <p className="text-xs text-stone-500 leading-relaxed italic">{dest.tagline}</p>

        <div className="mt-auto pt-2 border-t border-stone-100">
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#FF6B2C]/8 hover:bg-[#FF6B2C] text-[#FF6B2C] hover:text-white font-semibold text-xs transition-all duration-200 group/btn border border-[#FF6B2C]/20 hover:border-[#FF6B2C] hover:shadow-[0_4px_16px_rgba(255,107,44,0.3)]"
          >
            <span>Use Template</span>
            <span className="group-hover/btn:translate-x-0.5 transition-transform duration-150">
              <ArrowRightIcon />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function TrendingCard({ dest, onClick }) {
  return (
    <div
      onClick={() => onClick(dest)}
      className="group cursor-pointer shrink-0 w-64 rounded-2xl overflow-hidden border border-[#ECE8E2] shadow-[0_4px_20px_rgba(0,0,0,0.07)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.13)] hover:-translate-y-1 transition-all duration-300 bg-white flex flex-col"
    >
      <div className="relative h-36 overflow-hidden" style={{ backgroundColor: dest.bgColor }}>
        {dest.imageUrl && (
          <img src={dest.imageUrl} alt={dest.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        )}
        <div className={`absolute inset-0 bg-gradient-to-t ${dest.gradient}`} />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white font-bold text-sm drop-shadow-md">{dest.name}</p>
          <p className="text-white/80 text-xs">{dest.country}</p>
        </div>
        <div className="absolute top-2.5 right-2.5">
          <span
            className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: dest.badgeColor + 'dd' }}
          >
            {dest.badge.split(' ').slice(1).join(' ')}
          </span>
        </div>
      </div>
      <div className="p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Stars rating={dest.rating} />
          <span className="text-[10px] text-stone-400">{dest.reviews.toLocaleString()} trips</span>
        </div>
        <button
          type="button"
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#FF6B2C]/8 hover:bg-[#FF6B2C] text-[#FF6B2C] hover:text-white font-semibold text-xs transition-all duration-200 border border-[#FF6B2C]/20 hover:border-[#FF6B2C] hover:shadow-[0_4px_12px_rgba(255,107,44,0.25)]"
        >
          <span>Use Template</span>
          <ArrowRightIcon />
        </button>
      </div>
    </div>
  );
}

export default function DestinationsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVibes, setActiveVibes] = useState([]);
  const [activeBudgets, setActiveBudgets] = useState([]);
  const [activeRegions, setActiveRegions] = useState([]);

  const toggleFilter = (id, setter) => {
    setter(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const clearAll = () => {
    setActiveVibes([]); setActiveBudgets([]); setActiveRegions([]); setSearchQuery('');
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
    // If no filters are active, exclude trending destinations from the main grid to avoid duplicates
    if (!hasFilters) {
      list = list.filter(d => !TRENDING_IDS.includes(d.id));
    }
    return list;
  }, [searchQuery, activeVibes, activeBudgets, activeRegions, hasFilters]);

  const trendingDests = DESTINATIONS.filter(d => TRENDING_IDS.includes(d.id));

  const handleUseTemplate = (dest) => {
    router.push(`/ai-planner?prompt=${encodeURIComponent(dest.prompt)}`);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1F1F1F]">
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-12 px-4 sm:px-6 md:px-8 relative overflow-hidden">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-175 h-95 rounded-full bg-[#FF6B2C]/6 blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#FF6B2C]/10 border border-[#FF6B2C]/25 rounded-full mb-5">
            <GlobeIcon />
            <span className="text-xs font-bold text-[#FF6B2C] uppercase tracking-widest">Explore the World</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.08] text-[#1F1F1F] mb-4">
            Find your next{' '}
            <span className="text-[#FF6B2C]">adventure</span>
          </h1>
          <p className="text-base sm:text-lg text-stone-500 max-w-xl mx-auto mb-8 leading-relaxed">
            Browse hand-curated destinations. Pick a vibe, set your budget, and let TripWise AI build your perfect itinerary in seconds.
          </p>
          <div className="relative max-w-xl mx-auto">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
              <SearchIcon />
            </div>
            <input
              id="destinations-search"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search destinations, cities, or vibes..."
              className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white border border-[#ECE8E2] shadow-[0_8px_32px_rgba(0,0,0,0.07)] text-[#1F1F1F] text-sm placeholder:text-stone-400 focus:outline-none focus:border-[#FF6B2C]/60 focus:ring-2 focus:ring-[#FF6B2C]/15 transition-all duration-200"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors text-lg leading-none">×</button>
            )}
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="sticky top-17 z-40 bg-[#FAF8F5]/95 backdrop-blur-sm border-b border-[#ECE8E2] shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="flex items-center gap-2 min-w-max">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Vibe</span>
            {VIBE_FILTERS.map(f => (
              <FilterPill key={f.id} label={f.label} icon={f.icon} active={activeVibes.includes(f.id)} onClick={() => toggleFilter(f.id, setActiveVibes)} />
            ))}
            <div className="h-6 w-px bg-stone-200 mx-1 shrink-0" />
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Budget</span>
            {BUDGET_FILTERS.map(f => (
              <FilterPill key={f.id} label={f.label} active={activeBudgets.includes(f.id)} onClick={() => toggleFilter(f.id, setActiveBudgets)} />
            ))}
            <div className="h-6 w-px bg-stone-200 mx-1 shrink-0" />
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Region</span>
            {REGION_FILTERS.map(f => (
              <FilterPill key={f.id} label={f.label} active={activeRegions.includes(f.id)} onClick={() => toggleFilter(f.id, setActiveRegions)} />
            ))}
            {hasFilters && (
              <>
                <div className="h-6 w-px bg-stone-200 mx-1 shrink-0" />
                <button type="button" onClick={clearAll} className="text-[11px] font-bold text-stone-400 hover:text-[#FF6B2C] transition-colors whitespace-nowrap px-2">Clear all ×</button>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-14">

        {/* Trending row */}
        {!hasFilters && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-extrabold text-[#1F1F1F] tracking-tight">🔥 Trending This Month</h2>
                <p className="text-sm text-stone-500 mt-0.5">Most planned trips from our community</p>
              </div>
              <a href="#all-destinations" className="text-xs font-bold text-[#FF6B2C] hover:underline">See all →</a>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1 scroll-smooth" style={{ scrollbarWidth: 'none' }}>
              {trendingDests.map(dest => (
                <TrendingCard key={dest.id} dest={dest} onClick={handleUseTemplate} />
              ))}
              <div
                className="shrink-0 w-56 rounded-2xl border-2 border-dashed border-[#FF6B2C]/30 bg-[#FF6B2C]/4 flex flex-col items-center justify-center p-6 gap-3 cursor-pointer hover:bg-[#FF6B2C]/8 transition-colors"
                onClick={() => router.push('/ai-planner')}
              >
                <span className="text-3xl">✨</span>
                <p className="text-sm font-semibold text-[#FF6B2C] text-center leading-snug">Plan a custom trip</p>
                <p className="text-xs text-stone-500 text-center">Tell AI exactly what you want</p>
              </div>
            </div>
          </section>
        )}

        {/* All destinations grid */}
        <section id="all-destinations">
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
            <div className="text-center py-20">
              <span className="text-5xl">🗺️</span>
              <p className="text-lg font-semibold text-stone-500 mt-4">No destinations match your filters</p>
              <p className="text-sm text-stone-400 mt-1">Try broadening your search or clearing filters</p>
              <button type="button" onClick={clearAll} className="mt-5 px-6 py-2.5 bg-[#FF6B2C] text-white font-bold text-sm rounded-full hover:bg-[#E55A20] transition-colors shadow-md hover:shadow-[0_6px_20px_rgba(255,107,44,0.3)]">
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredDests.map(dest => (
                <DestCard key={dest.id} dest={dest} onClick={handleUseTemplate} />
              ))}
            </div>
          )}
        </section>

        {/* Bottom CTA */}
        <section className="rounded-3xl bg-[#1C1B1B] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,107,44,0.12),transparent_60%)] pointer-events-none" />
          <div className="relative z-10">
            <p className="text-xs font-bold text-[#FF6B2C] uppercase tracking-widest mb-2">Custom AI Planning</p>
            <h3 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">Don&apos;t see your dream trip?</h3>
            <p className="text-stone-400 text-sm mt-2 max-w-md">Describe any destination in natural language and let TripWise AI craft your entire itinerary — stops, timings, budget and all.</p>
          </div>
          <a href="/ai-planner" className="relative z-10 shrink-0 px-8 py-3.5 bg-[#FF6B2C] hover:bg-[#E55A20] text-white font-extrabold text-sm rounded-full transition-all duration-200 shadow-lg hover:shadow-[0_8px_28px_rgba(255,107,44,0.4)] hover:scale-105 active:scale-95 uppercase tracking-wider whitespace-nowrap">
            Plan My Trip →
          </a>
        </section>
      </div>

      <div className="h-16" />
    </div>
  );
}
