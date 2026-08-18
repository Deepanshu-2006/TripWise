'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TripCard from './TripCard';
import { getPublicTrips, seedPublicTrips, clonePublicTrip, unsavePublicTrip } from '../actions/trips';

const MOCK_TRIPS_SEED = [
  {
    destination: 'Italy',
    tagline: 'A Culinary Journey Through the Amalfi Coast',
    creator: { name: 'Elena Rossi', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&q=80' },
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
    vibes: ['FOODIE', 'LUXURY'],
    upvotes: 342,
    duration: 7,
  },
  {
    destination: 'Argentina',
    tagline: 'Backpacking the Hidden Trails of Patagonia',
    creator: { name: 'Sam Rivera', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop&q=80' },
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80',
    vibes: ['ADVENTURE', 'BUDGET'],
    upvotes: 890,
    duration: 14,
  },
  {
    destination: 'Japan',
    tagline: 'Kyoto Temple Hopping & Tea Ceremonies',
    creator: { name: 'Kenji Sato', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&q=80' },
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80',
    vibes: ['CULTURE', 'RELAXATION'],
    upvotes: 156,
    duration: 5,
  },
  {
    destination: 'Portugal',
    tagline: 'Secret Beaches of the Algarve',
    creator: { name: 'Sofia Costa', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&q=80' },
    image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&auto=format&fit=crop&q=80',
    vibes: ['HIDDEN GEMS', 'BEACH'],
    upvotes: 421,
    duration: 8,
  },
  {
    destination: 'Denmark',
    tagline: 'Minimalist Guide to Copenhagen',
    creator: { name: 'Lars Jensen', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&q=80' },
    image: 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800&auto=format&fit=crop&q=80',
    vibes: ['CITY BREAK', 'DESIGN'],
    upvotes: 289,
    duration: 3,
  },
  {
    destination: 'Scotland',
    tagline: 'Roadtrip Across the Scottish Highlands',
    creator: { name: 'Fiona MacLeod', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&q=80' },
    image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&auto=format&fit=crop&q=80',
    vibes: ['NATURE', 'ROAD TRIP'],
    upvotes: 612,
    duration: 10,
  }
];

const FILTERS = ['Trending', 'Recent', 'Most Saved'];
const DESTINATIONS = ['All Destinations', 'Italy', 'Argentina', 'Japan', 'Portugal', 'Denmark', 'Scotland'];

function CustomDropdown({ options, activeOption, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = React.useRef(null);

  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    const handleClose = (e) => {
      if (!e.target.closest('.dropdown-trigger') && !e.target.closest('.dropdown-menu')) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('toggle-dropdown', handleToggle);
    document.addEventListener('click', handleClose);
    
    return () => {
      document.removeEventListener('toggle-dropdown', handleToggle);
      document.removeEventListener('click', handleClose);
    };
  }, []);

  // Ensure body scroll is restored if the component unmounts while hovered
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onMouseEnter={() => { document.body.style.overflow = 'hidden'; }}
          onMouseLeave={() => { document.body.style.overflow = ''; }}
          className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-xl border border-stone-200/50 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] overflow-hidden z-50 dropdown-menu"
        >
          <div className="py-2 max-h-60 overflow-y-auto overscroll-contain custom-scrollbar">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onSelect(option);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-5 py-3 text-xs font-mono font-bold uppercase transition-colors ${
                  activeOption === option 
                    ? 'text-[#F4703C] bg-[#F4703C]/5' 
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function CommunityFeed() {
  const [activeFilter, setActiveFilter] = useState('Trending');
  const [activeDestination, setActiveDestination] = useState('All Destinations');
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  const fetchTrips = async () => {
    setIsLoading(true);
    try {
      const publicTrips = await getPublicTrips();
      
      const mappedTrips = await Promise.all(publicTrips.map(async t => {
        const actualData = typeof t.itinerary_data === 'string' ? JSON.parse(t.itinerary_data) : (t.itinerary_data || {});
        
        // Handle mock seed data format vs real AI generated format
        const meta = actualData.communityMeta || {};
        const daysLen = actualData.days?.length || 1;
        const destName = actualData.destinationName || t.destination_name;
        
        let finalImageUrl = actualData.imageUrl || null;
        
        // Dynamically fetch a relatable image if none exists
        if (!finalImageUrl && destName) {
          try {
            // Remove generic terms from search to get better images
            const searchQuery = destName.replace(/\(Demo Mode\)/g, '').trim();
            const res = await fetch(`/api/images?q=${encodeURIComponent(searchQuery)}&count=1`);
            if (res.ok) {
              const data = await res.json();
              if (data.images && data.images.length > 0) {
                finalImageUrl = data.images[0];
              }
            }
          } catch (e) {
            console.error('Failed to fetch image for:', destName, e);
          }
        }
        
        return {
          id: t.id,
          title: actualData.tagline || destName,
          authorName: meta.creatorName || 'Community Member',
          authorAvatar: meta.creatorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150',
          destination: destName?.split(',')[0],
          duration: `${daysLen} Days`,
          coverImage: finalImageUrl || 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800',
          tags: meta.vibes || ['EXPLORER'],
          upvotes: meta.upvotes || 0,
          bookmarks: meta.bookmarks || 0,
          filter: meta.upvotes > 300 ? 'Trending' : 'Recent'
        };
      }));
      
      setTrips(mappedTrips);
    } catch (e) {
      console.error("Failed to load public trips", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
    
    // Listen for publish events from CommunityCTA modal
    const handleTripPublished = () => {
      fetchTrips();
    };
    
    document.addEventListener('trip-published', handleTripPublished);
    return () => document.removeEventListener('trip-published', handleTripPublished);
  }, []);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await seedPublicTrips(MOCK_TRIPS_SEED);
      await fetchTrips();
    } catch (error) {
      console.error('Failed to seed trips:', error);
      alert('Failed to seed. Are you signed in? ' + error.message);
    } finally {
      setIsSeeding(false);
    }
  };

  const filteredTrips = trips.filter(trip => {
    const matchFilter = activeFilter === 'Trending' ? trip.upvotes >= 300 : (activeFilter === 'Recent' ? trip.upvotes < 300 : trip.upvotes > 500);
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
            <h3 className="text-3xl font-serif font-bold text-stone-900 mb-2 leading-tight flex items-center gap-4">
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

            {/* Custom Destination Dropdown */}
            <div className="relative w-full sm:w-56 group z-50">
              <button 
                onClick={() => {
                  // A simple way to toggle dropdown state
                  const event = new CustomEvent('toggle-dropdown');
                  document.dispatchEvent(event);
                }}
                className={`w-full flex items-center justify-between bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-stone-200/60 text-stone-700 text-xs font-mono font-bold uppercase rounded-full pl-6 pr-5 h-11.5 focus:outline-none focus:border-[#F4703C]/50 focus:ring-1 focus:ring-[#F4703C]/20 transition-all cursor-pointer hover:border-[#F4703C] hover:text-stone-900 dropdown-trigger`}
              >
                <span>{activeDestination}</span>
                <span className="text-stone-400 group-hover:text-[#F4703C] transition-colors duration-300">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </span>
              </button>
              
              <CustomDropdown 
                options={DESTINATIONS} 
                activeOption={activeDestination} 
                onSelect={setActiveDestination} 
              />
            </div>
          </div>
        </div>

        {/* Grid */}
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <motion.div 
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center justify-center py-20"
            >
              <svg className="animate-spin h-10 w-10 text-[#F4703C]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-4 text-stone-500 font-mono text-xs uppercase tracking-widest">Loading trips...</p>
            </motion.div>
          ) : filteredTrips.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-dashed border-stone-200"
            >
              <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-serif text-stone-900 mb-2">No itineraries found</h3>
              <p className="text-stone-500 max-w-sm mb-6">There are no shared trips that match your current filters. Try changing them or seed the database to see examples.</p>
              
              <button 
                onClick={handleSeed}
                disabled={isSeeding}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#F4703C] hover:bg-[#E55A24] text-white rounded-full font-mono text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-[#F4703C]/20 disabled:opacity-50"
              >
                {isSeeding ? 'Seeding...' : 'Seed Sample Itineraries'}
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="grid"
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              style={{ perspective: 1200 }}
            >
              {filteredTrips.map(trip => (
                <TripCard
                  key={trip.id}
                  authorName={trip.authorName}
                  authorAvatar={trip.authorAvatar}
                  destination={trip.destination}
                  duration={trip.duration}
                  coverImage={trip.coverImage}
                  tags={trip.tags}
                  saveCount={trip.bookmarks || 0}
                  upvoteCount={trip.upvotes}
                  onSave={() => clonePublicTrip(trip.id)}
                  onUnsave={(clonedTripId) => unsavePublicTrip(trip.id, clonedTripId)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
