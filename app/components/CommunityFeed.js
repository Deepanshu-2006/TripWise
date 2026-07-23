'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TripCard from './TripCard';

const MOCK_TRIPS = [
  {
    id: 1,
    title: 'A Culinary Journey Through the Amalfi Coast',
    authorName: 'Elena Rossi',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&q=80',
    destination: 'Italy',
    duration: '7 Days',
    coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
    tags: ['FOODIE', 'LUXURY'],
    upvotes: 342,
    filter: 'Trending',
  },
  {
    id: 2,
    title: 'Backpacking the Hidden Trails of Patagonia',
    authorName: 'Sam Rivera',
    authorAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop&q=80',
    destination: 'Argentina',
    duration: '14 Days',
    coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80',
    tags: ['ADVENTURE', 'BUDGET'],
    upvotes: 890,
    filter: 'Most Saved',
  },
  {
    id: 3,
    title: 'Kyoto Temple Hopping & Tea Ceremonies',
    authorName: 'Kenji Sato',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&q=80',
    destination: 'Japan',
    duration: '5 Days',
    coverImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80',
    tags: ['CULTURE', 'RELAXATION'],
    upvotes: 156,
    filter: 'Recent',
  },
  {
    id: 4,
    title: 'Secret Beaches of the Algarve',
    authorName: 'Sofia Costa',
    authorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&q=80',
    destination: 'Portugal',
    duration: '8 Days',
    coverImage: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&auto=format&fit=crop&q=80',
    tags: ['HIDDEN GEMS', 'BEACH'],
    upvotes: 421,
    filter: 'Trending',
  },
  {
    id: 5,
    title: 'Minimalist Guide to Copenhagen',
    authorName: 'Lars Jensen',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&q=80',
    destination: 'Denmark',
    duration: '3 Days',
    coverImage: 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800&auto=format&fit=crop&q=80',
    tags: ['CITY BREAK', 'DESIGN'],
    upvotes: 289,
    filter: 'Recent',
  },
  {
    id: 6,
    title: 'Roadtrip Across the Scottish Highlands',
    authorName: 'Fiona MacLeod',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&q=80',
    destination: 'Scotland',
    duration: '10 Days',
    coverImage: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&auto=format&fit=crop&q=80',
    tags: ['NATURE', 'ROAD TRIP'],
    upvotes: 612,
    filter: 'Most Saved',
  }
];

const FILTERS = ['Trending', 'Recent', 'Most Saved'];
const DESTINATIONS = ['All Destinations', 'Italy', 'Argentina', 'Japan', 'Portugal', 'Denmark', 'Scotland'];

export default function CommunityFeed() {
  const [activeFilter, setActiveFilter] = useState('Trending');
  const [activeDestination, setActiveDestination] = useState('All Destinations');

  const filteredTrips = MOCK_TRIPS.filter(trip => {
    const matchFilter = trip.filter === activeFilter;
    const matchDest = activeDestination === 'All Destinations' || trip.destination === activeDestination;
    return matchFilter && matchDest;
  });

  return (
    <div className="font-sans">
      <div className="w-full">
        
        {/* Header & Filter Bar */}
        <div className="flex flex-col xl:flex-row flex-wrap justify-between items-start xl:items-end mb-10 gap-6">
          <div>
            <h2 className="text-[#F4703C] font-mono font-bold text-xs uppercase tracking-[0.2em] mb-3">
              Community Trips
            </h2>
            <h3 className="text-3xl font-serif font-bold text-stone-900 mb-2 leading-tight">
              Shared Itineraries
            </h3>
            <p className="text-stone-500 text-sm">Discover and fork trips from fellow travelers.</p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4 w-full xl:w-auto shrink-0">
            {/* Pill Filters */}
            <div className="flex p-1.5 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-full border border-stone-200/60 w-full sm:w-auto shrink-0 relative overflow-hidden">
              {FILTERS.map(filter => {
                const isActive = activeFilter === filter;
                return (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`relative flex items-center justify-center flex-1 sm:flex-none px-5 py-2.5 rounded-full text-xs font-mono uppercase font-bold transition-all duration-300 ${
                      isActive ? 'text-white' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeFilterPill"
                        className="absolute inset-0 bg-[#F4703C] rounded-full shadow-[0_4px_15px_rgba(244,112,60,0.3)]"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                      />
                    )}
                    <span className="relative z-10">{filter}</span>
                  </button>
                );
              })}
            </div>

            {/* Destination Dropdown */}
            <div className="relative w-full sm:w-56 group">
              <select 
                value={activeDestination}
                onChange={(e) => setActiveDestination(e.target.value)}
                className="w-full appearance-none bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-stone-200/60 text-stone-700 text-xs font-mono font-bold uppercase rounded-full pl-6 pr-12 h-[46px] focus:outline-none focus:border-[#F4703C]/50 focus:ring-1 focus:ring-[#F4703C]/20 transition-all cursor-pointer hover:border-[#F4703C] hover:text-stone-900"
              >
                {DESTINATIONS.map(dest => (
                  <option key={dest} value={dest} className="bg-white text-stone-700">{dest}</option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400 group-hover:text-[#F4703C] transition-colors duration-300">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          style={{ perspective: 1200 }}
        >
          <AnimatePresence mode="popLayout">
            {filteredTrips.map(trip => (
              <TripCard
                key={trip.id}
                authorName={trip.authorName}
                authorAvatar={trip.authorAvatar}
                destination={trip.destination}
                duration={trip.duration}
                coverImage={trip.coverImage}
                tags={trip.tags}
                saveCount={Math.floor(trip.upvotes * 0.4) + 12} // mock save count
                upvoteCount={trip.upvotes}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredTrips.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="text-center py-24"
          >
            <p className="text-stone-500 font-mono uppercase tracking-widest text-sm">No trips found for this combination.</p>
          </motion.div>
        )}

      </div>
    </div>
  );
}
