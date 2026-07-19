'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import BentoShowcase from '../components/BentoShowcase';
import AtlasRadarMap from '../components/AtlasRadarMap';

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
    imageUrl: 'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=800&auto=format&fit=crop&q=80',
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
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    region: 'europe',
    badge: '🥐 Romance & Art',
    badgeColor: '#E11D48',
    rating: 4.8,
    reviews: 5410,
    vibes: ['art', 'foodie', 'history'],
    budget: ['premium'],
    tagline: 'Café culture and iconic landmarks',
    duration: '4–6 days',
    prompt: '5 days in Paris: Louvre, Eiffel Tower, Montmartre cafés & Seine cruise',
    gradient: 'from-rose-900/70 via-pink-800/50 to-transparent',
    imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop&q=80',
    emoji: '🥐',
    bgColor: '#B78C91',
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    region: 'asia',
    badge: '🗼 Neon & Tradition',
    badgeColor: '#EA580C',
    rating: 4.9,
    reviews: 6203,
    vibes: ['nightlife', 'foodie', 'shopping'],
    budget: ['standard', 'premium'],
    tagline: 'A dizzying blend of future and past',
    duration: '5–8 days',
    prompt: '7 days in Tokyo: Shibuya crossing, sushi masterclasses, Akihabara & ancient shrines',
    gradient: 'from-orange-900/70 via-amber-800/50 to-transparent',
    imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&auto=format&fit=crop&q=80',
    emoji: '🗼',
    bgColor: '#967C6B',
  },
  {
    id: 'london',
    name: 'London',
    country: 'UK',
    region: 'europe',
    badge: '🎡 Royal & Historic',
    badgeColor: '#2563EB',
    rating: 4.7,
    reviews: 4892,
    vibes: ['history', 'art', 'shopping'],
    budget: ['standard', 'premium'],
    tagline: 'Pubs, palaces, and world-class museums',
    duration: '5–7 days',
    prompt: '6 days in London: British Museum, West End shows, Borough Market & royal parks',
    gradient: 'from-blue-900/70 via-indigo-800/50 to-transparent',
    imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&auto=format&fit=crop&q=80',
    emoji: '🎡',
    bgColor: '#7583A8',
  },
  {
    id: 'sydney',
    name: 'Sydney',
    country: 'Australia',
    region: 'oceania',
    badge: '🏄 Beaches & Harbors',
    badgeColor: '#0EA5E9',
    rating: 4.8,
    reviews: 2130,
    vibes: ['nature', 'foodie', 'nightlife'],
    budget: ['premium'],
    tagline: 'Sun-drenched coasts and harbor sails',
    duration: '6–10 days',
    prompt: '8 days in Sydney: Opera House, Bondi surfing, coastal walks & harbor dining',
    gradient: 'from-cyan-900/70 via-sky-800/50 to-transparent',
    imageUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&auto=format&fit=crop&q=80',
    emoji: '🏄',
    bgColor: '#6FA4B5',
  },
  {
    id: 'rio',
    name: 'Rio de Janeiro',
    country: 'Brazil',
    region: 'americas',
    badge: '🏖️ Sun & Samba',
    badgeColor: '#16A34A',
    rating: 4.6,
    reviews: 1845,
    vibes: ['nature', 'nightlife', 'art'],
    budget: ['economy', 'standard'],
    tagline: 'Golden beaches beneath tropical mountains',
    duration: '5–7 days',
    prompt: '6 days in Rio: Copacabana, Christ the Redeemer, samba clubs & Tijuca forest',
    gradient: 'from-emerald-900/70 via-green-800/50 to-transparent',
    imageUrl: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&auto=format&fit=crop&q=80',
    emoji: '🏖️',
    bgColor: '#6FA378',
  },
  {
    id: 'cape-town',
    name: 'Cape Town',
    country: 'South Africa',
    region: 'africa',
    badge: '🐧 Wildlife & Wine',
    badgeColor: '#8B5CF6',
    rating: 4.9,
    reviews: 2314,
    vibes: ['nature', 'foodie', 'history'],
    budget: ['economy', 'standard'],
    tagline: 'Rugged coastlines and vineyards',
    duration: '6–9 days',
    prompt: '7 days in Cape Town: Table Mountain, penguin beaches, wine tasting & Robben Island',
    gradient: 'from-purple-900/70 via-violet-800/50 to-transparent',
    imageUrl: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&auto=format&fit=crop&q=80',
    emoji: '🐧',
    bgColor: '#877EA3',
  },
  {
    id: 'dubai',
    name: 'Dubai',
    country: 'UAE',
    region: 'asia',
    badge: '✨ Luxury & Desert',
    badgeColor: '#EAB308',
    rating: 4.7,
    reviews: 3845,
    vibes: ['shopping', 'nightlife', 'art'],
    budget: ['premium'],
    tagline: 'Futuristic skylines and golden dunes',
    duration: '4–6 days',
    prompt: '5 days in Dubai: Burj Khalifa, desert safaris, mega-malls & luxury beach clubs',
    gradient: 'from-yellow-900/70 via-amber-800/50 to-transparent',
    imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&auto=format&fit=crop&q=80',
    emoji: '✨',
    bgColor: '#B5A574',
  },
  {
    id: 'istanbul',
    name: 'Istanbul',
    country: 'Turkey',
    region: 'europe',
    badge: '☕ Spices & Bazaars',
    badgeColor: '#B91C1C',
    rating: 4.8,
    reviews: 2987,
    vibes: ['history', 'shopping', 'foodie'],
    budget: ['economy', 'standard'],
    tagline: 'Where continents collide in stunning beauty',
    duration: '4–7 days',
    prompt: '6 days in Istanbul: Hagia Sophia, Grand Bazaar, Bosphorus cruise & Turkish baths',
    gradient: 'from-red-900/70 via-rose-800/50 to-transparent',
    imageUrl: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&auto=format&fit=crop&q=80',
    emoji: '☕',
    bgColor: '#A37272',
  },
];

const TELEMETRY_MAP = {
  rome: {
    weather: '☀️ 24°C • Perfect Spring Pacing',
    aiTip: '💡 AI Verdict: Best visited for 5 days to balance historic landmarks with relaxation.',
    crowdLevel: '🟡 Moderate Season',
    coords: { lat: 41.9028, lng: 12.4964 }
  },
  kyoto: {
    weather: '🌸 18°C • Cherry Blossom Peak',
    aiTip: '💡 AI Verdict: #1 Top Rated Cultural Retreat in Asia right now.',
    crowdLevel: '🟢 Low Crowds',
    coords: { lat: 35.0116, lng: 135.7681 }
  },
  'swiss-alps': {
    weather: '🌤️ 14°C • Crisp Alpine Air',
    aiTip: '💡 AI Verdict: Scenic train loops & light valley hikes are prime right now.',
    crowdLevel: '🟢 Low Crowds',
    coords: { lat: 46.5580, lng: 8.5610 }
  },
  marrakech: {
    weather: '☀️ 28°C • Warm & Sunny',
    aiTip: '💡 AI Verdict: 4 days is the sweet spot for souks, riads, and a desert excursion.',
    crowdLevel: '🟡 Moderate Season',
    coords: { lat: 31.6295, lng: -8.0088 }
  },
  'new-york': {
    weather: '☀️ 22°C • Clear Rooftop Season',
    aiTip: '💡 AI Verdict: Ideal for urban nightlife & architectural discovery.',
    crowdLevel: '🟡 Moderate Season',
    coords: { lat: 40.7128, lng: -74.0060 }
  },
  bali: {
    weather: '🌴 29°C • Tropical Breeze',
    aiTip: '💡 AI Verdict: Split time between Ubud rice terraces and Uluwatu coast.',
    crowdLevel: '🟢 Low Crowds',
    coords: { lat: -8.4095, lng: 115.1889 }
  },
  barcelona: {
    weather: '☀️ 25°C • Mediterranean Warmth',
    aiTip: '💡 AI Verdict: Reserve Sagrada Família early; evening tapas crawls recommended.',
    crowdLevel: '🟡 Moderate Season',
    coords: { lat: 41.3851, lng: 2.1734 }
  },
  queenstown: {
    weather: '⛰️ 12°C • Crisp Mountain Views',
    aiTip: '💡 AI Verdict: Top choice for thrill seekers; 5 days covers Milford Sound & skiing.',
    crowdLevel: '🟢 Low Crowds',
    coords: { lat: -45.0312, lng: 168.6626 }
  },
  paris: {
    weather: '🥐 20°C • Mild & Romantic',
    aiTip: '💡 AI Verdict: Evening Seine cruise combined with Montmartre sunset is unbeatable.',
    crowdLevel: '🔴 High Season',
    coords: { lat: 48.8566, lng: 2.3522 }
  },
  tokyo: {
    weather: '🗼 21°C • Ideal City Walking',
    aiTip: '💡 AI Verdict: Group neighborhoods by transit line (Shibuya/Shinjuku then Asakusa/Akihabara).',
    crowdLevel: '🟡 Moderate Season',
    coords: { lat: 35.6762, lng: 139.6503 }
  },
  london: {
    weather: '🌤️ 17°C • Classic English Sunshine',
    aiTip: '💡 AI Verdict: Free national museums make this exceptional value right now.',
    crowdLevel: '🟡 Moderate Season',
    coords: { lat: 51.5074, lng: -0.1278 }
  },
  sydney: {
    weather: '🏄 24°C • Coastal Sunshine',
    aiTip: '💡 AI Verdict: The Bondi to Coogee coastal walk is in peak weather window.',
    crowdLevel: '🟢 Low Crowds',
    coords: { lat: -33.8688, lng: 151.2093 }
  },
  rio: {
    weather: '🏖️ 27°C • Golden Beach Days',
    aiTip: '💡 AI Verdict: Sunset at Sugarloaf Mountain followed by Lapa samba nightlife.',
    crowdLevel: '🟡 Moderate Season',
    coords: { lat: -22.9068, lng: -43.1729 }
  },
  'cape-town': {
    weather: '🐧 23°C • Clear Table Mountain Views',
    aiTip: '💡 AI Verdict: Combine wine country tasting with Boulders Beach penguin colony.',
    crowdLevel: '🟢 Low Crowds',
    coords: { lat: -33.9249, lng: 18.4241 }
  },
  dubai: {
    weather: '✨ 32°C • Evening Desert Breezes',
    aiTip: '💡 AI Verdict: Late afternoon sunset dune safaris and rooftop lounges are prime.',
    crowdLevel: '🔴 High Season',
    coords: { lat: 25.2048, lng: 55.2708 }
  },
  istanbul: {
    weather: '☕ 22°C • Bosphorus Breeze',
    aiTip: '💡 AI Verdict: Cross continents by ferry at sunset; explore hidden rooftop tea gardens.',
    crowdLevel: '🟢 Low Crowds',
    coords: { lat: 41.0082, lng: 28.9784 }
  }
};

DESTINATIONS.forEach(d => {
  if (TELEMETRY_MAP[d.id]) {
    Object.assign(d, TELEMETRY_MAP[d.id]);
  }
});

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

function DestCard({ dest, onClick, isHighlighted }) {
  const minBudget = dest.budget.includes('economy') ? 'Economy' : dest.budget.includes('standard') ? 'Standard' : 'Premium';
  const budgetStr = minBudget === 'Economy' ? '$ Economy' : minBudget === 'Standard' ? '$$ Standard' : '$$$ Premium';

  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);

  const handleMouseMove = (e) => {
    if (isZooming) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTilt({ 
      x: -(y / (rect.height / 2)) * 5, 
      y: (x / (rect.width / 2)) * 5 
    });
  };

  const handleMouseLeave = () => {
    if (!isZooming) setTilt({ x: 0, y: 0 });
  };

  const handleClick = () => {
    setIsZooming(true);
    setTilt({ x: 0, y: 0 }); // reset tilt for clean zoom
    setTimeout(() => {
      onClick(dest);
    }, 450);
  };

  return (
    <>
      <AnimatePresence>
        {isZooming && (
          <motion.div 
            className="fixed inset-0 bg-white z-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>
      <motion.div
        id={`dest-card-${dest.id}`}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`group cursor-pointer rounded-2xl overflow-hidden bg-white border ${isHighlighted ? 'border-[#FF6B2C]' : 'border-[#ECE8E2]'} shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.15)] flex flex-col relative ${isZooming ? 'z-101' : 'z-10'}`}
        style={{ 
          transform: isZooming 
            ? 'scale(1.05)' 
            : `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(${tilt.x === 0 ? '0' : '-6px'})`,
          transition: isZooming ? 'transform 0.45s ease-in-out' : (tilt.x === 0 ? 'all 0.5s ease-out' : 'box-shadow 0.3s ease-out'),
          boxShadow: isHighlighted ? '0 0 0 2px #FF6B2C, 0 0 30px rgba(255,107,44,0.4)' : undefined
        }}
      >
        <div className="relative h-44 overflow-hidden" style={{ backgroundColor: dest.bgColor }}>
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
        
        {/* Top Info Bar: Category & Duration */}
        <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white bg-black/40 backdrop-blur-md border border-white/20 shadow-sm whitespace-nowrap overflow-hidden text-ellipsis">
            {dest.badge}
          </span>
          <span className="text-[10px] font-semibold bg-black/50 text-white px-2 py-1 rounded-full backdrop-blur-sm border border-white/10 shadow-sm whitespace-nowrap shrink-0">
            {dest.duration}
          </span>
        </div>

        {/* Bottom Info Bar: Weather, Season & Price */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-3 pt-6 flex items-end justify-between bg-linear-to-t from-black/80 via-black/40 to-transparent">
          <div className="flex flex-col gap-1.5">
            {dest.weather && (
              <span className="text-[9px] font-semibold text-white/90 drop-shadow-md">
                {dest.weather.split('•')[0]}
              </span>
            )}
            {dest.crowdLevel && (
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md border shadow-sm w-fit ${
                dest.crowdLevel.includes('Low') 
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' 
                  : dest.crowdLevel.includes('Moderate') 
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500/40' 
                  : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
              }`}>
                {dest.crowdLevel}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white shadow-sm">
            From {budgetStr}
          </span>
        </div>
      </div>

      <div className="flex flex-col p-5 flex-1 bg-white h-58">
        <div className="mb-2">
          {/* Editorial hierarchy: Country above City */}
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[9px] text-stone-400 font-extrabold uppercase tracking-[0.2em]">{dest.country}</p>
            <div className="flex items-center gap-1">
              <Stars rating={dest.rating} />
              <span className="text-[10px] font-bold text-stone-800 ml-0.5">
                {dest.rating.toFixed(1)}
              </span>
              <span className="text-[9px] font-medium text-stone-400 ml-0.5 hidden sm:inline-block">({dest.reviews.toLocaleString()})</span>
            </div>
          </div>
          <h3 className="font-extrabold text-[#1F1F1F] text-xl leading-tight group-hover:text-[#FF6B2C] transition-colors truncate">{dest.name}</h3>
        </div>

        <p className="text-xs text-stone-500 leading-relaxed truncate">{dest.tagline}</p>

        {/* AI Tip Box - Clean minimal look */}
        {dest.aiTip && (
          <div className="mt-3.5 mb-4 rounded-xl p-3 bg-stone-50/80 border border-stone-100 flex items-start gap-2.5">
            <div className="shrink-0 w-5 h-5 rounded-full bg-linear-to-br from-amber-100 to-orange-100 border border-orange-200/50 flex items-center justify-center shadow-xs">
              <span className="text-[10px]">✨</span>
            </div>
            <p className="text-[11px] font-medium text-stone-600 leading-snug line-clamp-2">
              {dest.aiTip.replace('💡 AI Verdict: ', '').replace('💡 AI Tip: ', '')}
            </p>
          </div>
        )}

        {/* Use Prompt Button - Premium interaction */}
        <div className="mt-auto pt-1">
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-stone-200 text-stone-600 group-hover:bg-[#FF6B2C] group-hover:border-[#FF6B2C] group-hover:text-white font-bold text-xs transition-all duration-300 shadow-xs group-hover:shadow-[0_8px_20px_rgba(255,107,44,0.25)]"
          >
            <span className="uppercase tracking-wider text-[10px]">Customize AI Prompt</span>
            <span className="group-hover:translate-x-1 transition-transform duration-200">
              <ArrowRightIcon />
            </span>
          </button>
        </div>
      </div>
      </motion.div>
    </>
  );
}

function TrendingCard({ dest, onClick, isHighlighted }) {
  const minBudget = dest.budget.includes('economy') ? 'Economy' : dest.budget.includes('standard') ? 'Standard' : 'Premium';
  const budgetStr = minBudget === 'Economy' ? '$ Economy' : minBudget === 'Standard' ? '$$ Standard' : '$$$ Premium';

  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);

  const handleMouseMove = (e) => {
    if (isZooming) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTilt({ 
      x: -(y / (rect.height / 2)) * 5, 
      y: (x / (rect.width / 2)) * 5 
    });
  };

  const handleMouseLeave = () => {
    if (!isZooming) setTilt({ x: 0, y: 0 });
  };

  const handleClick = () => {
    setIsZooming(true);
    setTilt({ x: 0, y: 0 });
    setTimeout(() => {
      onClick(dest);
    }, 450);
  };

  return (
    <>
      <AnimatePresence>
        {isZooming && (
          <motion.div 
            className="fixed inset-0 bg-white z-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>
      <motion.div
        id={`dest-card-${dest.id}`}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`group cursor-pointer shrink-0 w-64 rounded-2xl overflow-hidden border ${isHighlighted ? 'border-[#FF6B2C]' : 'border-[#ECE8E2]'} shadow-[0_4px_20px_rgba(0,0,0,0.07)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.15)] bg-white flex flex-col relative ${isZooming ? 'z-101' : 'z-10'}`}
        style={{ 
          transform: isZooming 
            ? 'scale(1.05)' 
            : `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(${tilt.x === 0 ? '0' : '-6px'})`,
          transition: isZooming ? 'transform 0.45s ease-in-out' : (tilt.x === 0 ? 'all 0.5s ease-out' : 'box-shadow 0.3s ease-out'),
          boxShadow: isHighlighted ? '0 0 0 2px #FF6B2C, 0 0 30px rgba(255,107,44,0.4)' : undefined
        }}
      >
        <div className="relative h-36 overflow-hidden" style={{ backgroundColor: dest.bgColor }}>
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
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white font-bold text-sm drop-shadow-md group-hover:text-white/90 transition-colors">{dest.name}</p>
          <div className="flex items-center justify-between">
            <p className="text-white/80 text-xs">{dest.country}</p>
            <span className="text-[9px] font-semibold bg-white/20 text-white px-1.5 py-0.5 rounded-full backdrop-blur-md border border-white/20">
              {budgetStr}
            </span>
          </div>
        </div>
        <div className="absolute top-2.5 right-2.5 z-10 flex flex-col items-end gap-1">
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
          <div className="absolute top-2.5 left-2.5 z-10">
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
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#FF6B2C]/8 hover:bg-[#FF6B2C] text-[#FF6B2C] hover:text-white font-semibold text-xs transition-all duration-200 border border-[#FF6B2C]/20 hover:border-[#FF6B2C] hover:shadow-[0_4px_12px_rgba(255,107,44,0.25)] mt-auto"
        >
          <span>Use Prompt</span>
          <ArrowRightIcon />
        </button>
      </div>
      </motion.div>
    </>
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
    const handleScroll = () => {
      // Show mask ONLY after the hero section (h-[550px] or h-[650px]) is completely scrolled past
      const heroHeight = window.innerWidth >= 768 ? 650 : 550;
      setIsScrolledPastHero(window.scrollY >= heroHeight - 10);
    };
    window.addEventListener('scroll', handleScroll);
    
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
            className="absolute inset-0 w-full h-full object-cover origin-center"
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
        <section className="sticky top-24 z-40 max-w-6xl mx-auto w-full px-4 sm:px-6 -mt-8 mb-8 pointer-events-none">
          {/* Solid sharp-cornered mask to hide scrolling content that peeks through the rounded corners */}
          <div className={`absolute top-0 bottom-0 left-4 right-4 sm:left-6 sm:right-6 bg-[#FAF8F5] -z-10 transition-opacity duration-500 ${isScrolledPastHero ? 'opacity-100' : 'opacity-0'}`} />
          <div className="bg-white/90 backdrop-blur-2xl rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-[#ECE8E2]/80 flex flex-col pointer-events-auto transition-shadow hover:shadow-[0_16px_50px_rgba(0,0,0,0.12)]">
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
                    <button type="button" onClick={clearAll} className="text-[11px] font-bold text-stone-400 hover:text-[#FF6B2C] transition-colors whitespace-nowrap px-2 shrink-0">Clear all ×</button>
                  </>
                )}
              </div>
            </div>
            
            {/* Active Chips & Sort Row */}
            <div className="px-5 py-3 flex items-center justify-between border-t border-stone-100 bg-[#FAF8F5]/50 rounded-b-2xl">
              <div className="flex items-center gap-2 overflow-x-auto flex-1 pr-4" style={{ scrollbarWidth: 'none' }}>
                {hasFilters ? (
                  <span className="text-[11px] font-bold text-[#FF6B2C] shrink-0">{filteredDests.length} destinations match</span>
                ) : (
                  <span className="text-[11px] font-bold text-stone-400 shrink-0">Filter your perfect trip</span>
                )}
                {activeChips.length > 0 && <div className="h-3 w-px bg-stone-300 mx-1 shrink-0" />}
                {activeChips.map(chip => (
                  <button
                    key={chip.id}
                    onClick={() => removeFilter(chip.id, chip.type)}
                    className="flex items-center gap-1.5 bg-[#fe7717]/10 border border-[#fe7717]/20 text-[#fe7717] px-2.5 py-1 rounded-full text-[10px] font-bold hover:bg-[#fe7717]/20 hover:border-[#fe7717]/30 transition-all shrink-0 group"
                  >
                    {chip.label} <span className="text-[#fe7717]/50 text-xs leading-none font-normal group-hover:text-[#fe7717] transition-colors">×</span>
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest hidden sm:inline">Sort</span>
                <div className="relative group">
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="appearance-none bg-white shadow-xs border border-stone-200 group-hover:border-stone-300 text-stone-700 text-[11px] font-bold rounded-full pl-3 pr-8 py-1.5 focus:outline-none focus:border-[#fe7717] focus:ring-1 focus:ring-[#fe7717]/20 cursor-pointer transition-all"
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
                  <BentoShowcase destinations={trendingDests} onCardClick={handleUseTemplate} />
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
                      {filteredDests.slice(0, visibleCount).map(dest => (
                        <DestCard key={dest.id} dest={dest} onClick={handleUseTemplate} isHighlighted={highlightedDestId === dest.id} />
                      ))}
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
