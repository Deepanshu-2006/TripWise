"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { getUserTrips } from '../actions/trips';
import { DESTINATIONS } from '../../lib/destinations';

export default function CommunityCTA() {
  const { user, isLoaded } = useUser();
  const [trips, setTrips] = useState([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  useEffect(() => {
    const loadTrips = async () => {
      if (user?.id && isModalOpen) {
        setIsLoadingTrips(true);
        try {
          const rawTrips = await getUserTrips();
          
          const mappedTrips = (rawTrips || []).map(t => {
            const actualData = typeof t.itinerary_data === 'string' ? JSON.parse(t.itinerary_data) : (t.itinerary_data || {});
            const destName = actualData.destinationName || t.destination_name;
            const destSearchName = destName?.split(',')[0].trim().toLowerCase();
            const destInfo = DESTINATIONS.find(d => d.name.toLowerCase() === destSearchName) || {};
            
            return {
              db_id: t.id,
              destinationName: destName,
              imageUrl: actualData.imageUrl || destInfo.imageUrl || null,
              days: actualData.days || [],
              dateRange: actualData.dateRange || null
            };
          }).filter(t => t.destinationName);
          
          setTrips(mappedTrips);
        } catch (error) {
          console.error('Failed to load trips:', error);
        } finally {
          setIsLoadingTrips(false);
        }
      }
    };
    
    if (isLoaded && user && isModalOpen) {
      loadTrips();
    }
  }, [user, isLoaded, isModalOpen]);

  const handlePublish = () => {
    if (!selectedTrip) return;
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      setPublishSuccess(true);
      setTimeout(() => {
        setPublishSuccess(false);
        setIsModalOpen(false);
        setSelectedTrip(null);
      }, 2000);
    }, 1500);
  };

  return (
    <>
      <div className="bg-[#FAF6F0] py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Dark Container */}
          <div className="relative rounded-4xl overflow-hidden bg-[#1E1C1A] px-8 py-16 md:px-16 md:py-24 shadow-2xl border border-stone-800">
            
            {/* Background Soft Collage (Real Trips) */}
            <div className="absolute inset-0 pointer-events-none opacity-30 overflow-hidden hidden md:block">
              <img src="https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&q=80&w=600" className="absolute -top-10 -right-10 w-72 h-72 object-cover rounded-3xl rotate-6 blur-[1px]" alt="Travel 1" />
              <img src="https://images.unsplash.com/photo-1504150558240-0b4fd8946624?auto=format&fit=crop&q=80&w=600" className="absolute bottom-10 right-40 w-80 h-56 object-cover rounded-3xl -rotate-6 blur-[1px]" alt="Travel 2" />
              <img src="https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80&w=600" className="absolute top-20 right-80 w-64 h-80 object-cover rounded-3xl rotate-[-10deg] blur-sm" alt="Travel 3" />
              
              {/* Gradient Overlays for smooth blending */}
              <div className="absolute inset-0 bg-linear-to-r from-[#1E1C1A] via-[#1E1C1A]/95 to-transparent"></div>
              <div className="absolute inset-0 bg-linear-to-b from-[#1E1C1A]/50 via-transparent to-[#1E1C1A]/50"></div>
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8 items-center">
              
              {/* Left Column: Text and Button */}
              <div className="text-left">
                {/* Brand Eyebrow Tag */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2C]"></span>
                  <span className="text-[#FF6B2C] font-mono text-[11px] font-bold uppercase tracking-[0.2em] pt-0.5">
                    Community Driven
                  </span>
                </div>

                {/* Headline */}
                <h3 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white mb-6 leading-tight tracking-tight">
                  Your trip could inspire <br className="hidden md:block" /> the next traveler.
                </h3>

                {/* Subtext */}
                <p className="text-[#A39D98] font-sans text-lg md:text-xl mb-10 max-w-md leading-relaxed">
                  Join our growing collective of modern explorers sharing real itineraries, discovering hidden gems, and offering honest advice.
                </p>

                {/* Unique Liquid Swipe Button */}
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="group relative inline-flex items-center gap-8 pl-8 pr-2 py-2 bg-[#2A2724] border border-white/5 rounded-full overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(255,107,44,0.2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B2C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E1C1A]"
                >
                  {/* Liquid Swipe Background */}
                  <div className="absolute inset-0 bg-[#FF6B2C] translate-x-[101%] group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] rounded-full"></div>
                  
                  <span className="relative z-10 font-sans font-bold text-base text-stone-200 group-hover:text-white transition-colors duration-300">
                    Share Your Itinerary
                  </span>
                  
                  <div className="relative z-10 w-11 h-11 rounded-full bg-[#FF6B2C] group-hover:bg-white flex items-center justify-center text-white group-hover:text-[#FF6B2C] transition-colors duration-500 shadow-lg">
                    <svg className="w-5 h-5 transition-transform duration-500 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  </div>
                </button>
              </div>

              {/* Right Column: Social Proof Visuals */}
              <div className="flex justify-start md:justify-end md:items-center">
                <div className="flex flex-col items-start md:items-end gap-4 mt-8 md:mt-0">
                   
                   {/* Avatar Stack */}
                   <div className="flex -space-x-3 shadow-2xl">
                      <img className="w-14 h-14 md:w-16 md:h-16 rounded-full border-[3px] border-[#1E1C1A] object-cover relative z-30" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150" alt="Traveler 1" />
                      <img className="w-14 h-14 md:w-16 md:h-16 rounded-full border-[3px] border-[#1E1C1A] object-cover relative z-20" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150" alt="Traveler 2" />
                      <img className="w-14 h-14 md:w-16 md:h-16 rounded-full border-[3px] border-[#1E1C1A] object-cover relative z-10" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150" alt="Traveler 3" />
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-full border-[3px] border-[#1E1C1A] bg-white text-[#1E1C1A] flex items-center justify-center font-sans font-extrabold text-xs md:text-sm z-0">
                        +12K
                      </div>
                   </div>
                   
                   {/* Proof Text */}
                   <div className="text-left md:text-right pr-2">
                      <p className="text-white/90 font-serif italic text-lg md:text-xl">Real travelers. Real trips.</p>
                   </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Share Trip Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#1E1C1A]/40 backdrop-blur-md"
              onClick={() => setIsModalOpen(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden border border-stone-100"
            >
              <div className="p-8 pb-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-3xl font-serif text-[#1E1C1A]">Share a Trip</h3>
                  <button 
                    onClick={() => setIsModalOpen(false)} 
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-700 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {!publishSuccess ? (
                  <>
                    <p className="text-stone-500 font-sans text-[15px] mb-8 leading-relaxed pr-4">
                      Select one of your beautifully crafted itineraries to publish to the community board. It will be visible to all travelers.
                    </p>
                    
                    <div className="space-y-3 mb-8 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
                      {isLoadingTrips ? (
                        <div className="py-12 flex justify-center text-[#FF6B2C]">
                          <svg className="animate-spin h-8 w-8" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      ) : trips.length === 0 ? (
                        <div className="py-12 text-center text-stone-500 font-sans text-sm bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                          You don't have any saved trips yet.
                        </div>
                      ) : (
                        trips.map(trip => {
                          const isSelected = selectedTrip === trip.db_id;
                          return (
                            <div 
                              key={trip.db_id}
                              onClick={() => setSelectedTrip(trip.db_id)}
                              className={`group flex items-center gap-5 p-3 rounded-2xl cursor-pointer transition-all duration-400 ${
                                isSelected 
                                  ? 'bg-[#1E1C1A] shadow-xl scale-[1.02]' 
                                  : 'bg-stone-50/80 hover:bg-stone-100 hover:scale-[1.01]'
                              }`}
                            >
                              <div className="relative w-22 h-16 rounded-[0.8rem] overflow-hidden shrink-0 shadow-sm">
                                <img src={trip.imageUrl || 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=300&h=300'} alt={trip.destinationName} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent"></div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className={`font-sans font-extrabold text-lg truncate transition-colors duration-400 ${isSelected ? 'text-white' : 'text-[#1E1C1A]'}`}>
                                  {trip.destinationName?.split(',')[0]}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md transition-colors duration-400 ${
                                    isSelected
                                      ? 'bg-white/10 text-white/90'
                                      : 'bg-white text-stone-500 shadow-sm border border-stone-200/60'
                                  }`}>
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {trip.days?.length ? `${trip.days.length} Days` : 'Trip'}
                                  </span>
                                </div>
                              </div>
                              <div className="pr-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-400 ${
                                  isSelected 
                                    ? 'bg-[#FF6B2C] text-white scale-110 shadow-[0_0_15px_rgba(255,107,44,0.4)]' 
                                    : 'bg-transparent text-transparent border-2 border-stone-300 scale-100 group-hover:border-stone-400'
                                }`}>
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <button 
                      onClick={handlePublish}
                      disabled={!selectedTrip || isPublishing || isLoadingTrips || trips.length === 0}
                      className={`relative w-full py-4 rounded-2xl font-sans font-bold text-[15px] transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden ${
                        selectedTrip && !isPublishing 
                          ? 'bg-[#FF6B2C] text-white hover:bg-[#E25C27] shadow-[0_8px_20px_-6px_rgba(255,107,44,0.4)] hover:-translate-y-0.5' 
                          : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                      }`}
                    >
                      {isPublishing ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Publishing Trip...
                        </>
                      ) : (
                        <>
                          Publish to Community
                          <svg className={`w-5 h-5 transition-transform duration-300 ${selectedTrip ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-16 flex flex-col items-center justify-center text-center"
                  >
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-[#FF6B2C] blur-xl opacity-20 rounded-full animate-pulse"></div>
                      <div className="relative w-20 h-20 rounded-full bg-[#FF6B2C] text-white flex items-center justify-center shadow-xl shadow-[#FF6B2C]/30">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <h4 className="text-3xl font-serif text-[#1E1C1A] mb-3">It's Out There!</h4>
                    <p className="text-stone-500 font-sans text-[15px] max-w-70 mx-auto leading-relaxed">
                      Your amazing itinerary is now live. Travelers around the world can view and be inspired by your trip.
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
