'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import { useUser } from '@clerk/nextjs';
import { Compass, Plus, MapPin, Calendar, ArrowRight, Loader2, Trash2, Share2, Check, Map } from 'lucide-react';
import { getUserTrips, deleteTrip } from '../actions/trips';
import { DESTINATIONS } from '../../lib/destinations';
import { motion, AnimatePresence } from 'framer-motion';

const hashString = (str) => {
    let hash = 0;
    if (!str) return hash;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
};

const generateGradient = (name) => {
    const hash = hashString(name || 'default');
    const hue1 = hash % 360;
    const hue2 = (hue1 + 40 + (hash % 60)) % 360; 
    
    const color1 = `hsl(${hue1}, 85%, 65%)`;
    const color2 = `hsl(${hue2}, 90%, 50%)`;
    
    return {
        background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
    };
};

const getTotalActivities = (trip) => {
    if (!trip.days) return 0;
    return trip.days.reduce((total, day) => total + (day.activities ? day.activities.length : 0), 0);
};

const formatDates = (startDate, endDate) => {
    const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
        return `${startStr}–${endDate.getDate()}, ${endDate.getFullYear()}`;
    }
    return `${startStr}–${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
};

const FILTERS = ['All', 'Drafts', 'Upcoming', 'Past'];
const SORTS = ['Most Recent', 'Upcoming First', 'Alphabetical'];

export default function AIPlannerDashboard() {
    const { isLoaded, isSignedIn } = useUser();
    const [savedTrips, setSavedTrips] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isDeleting, setIsDeleting] = useState(null);
    const [copiedId, setCopiedId] = useState(null);

    const [activeTab, setActiveTab] = useState('All');
    const [activeSort, setActiveSort] = useState('Most Recent');

    useEffect(() => {
        async function fetchTrips() {
            if (isSignedIn) {
                try {
                    const trips = await getUserTrips();
                    
                    // Demo Mode: Map DB trips to diverse realistic sample data to demonstrate range
                    const demoTrips = trips.map((t, idx) => {
                        const now = new Date();
                        
                        // 1. CONFIRMED trip (Rome)
                        if (idx % 4 === 0) {
                            const start = new Date(now); start.setDate(start.getDate() + 10);
                            const end = new Date(start); end.setDate(end.getDate() + 4);
                            return {
                                db_id: t.id, destinationName: "Rome, Italy", country: "Italy",
                                status: "CONFIRMED", progress: 100, days: Array(4).fill({ activities: [1,2] }),
                                startDate: start, endDate: end, created_at: new Date(now.getTime() - 2*86400000).toISOString()
                            };
                        }
                        // 2. DRAFT trip (Tokyo)
                        if (idx % 4 === 1) {
                            const start = new Date(now); start.setDate(start.getDate() + 30);
                            const end = new Date(start); end.setDate(end.getDate() + 6);
                            return {
                                db_id: t.id, destinationName: "Tokyo, Japan", country: "Japan",
                                status: "DRAFT", progress: 65, days: [],
                                startDate: start, endDate: end, created_at: new Date(now.getTime() - 1*86400000).toISOString()
                            };
                        }
                        // 3. UPCOMING/CONFIRMED trip (Bali)
                        if (idx % 4 === 2) {
                            const start = new Date(now); start.setDate(start.getDate() + 45);
                            const end = new Date(start); end.setDate(end.getDate() + 7);
                            return {
                                db_id: t.id, destinationName: "Bali, Indonesia", country: "Indonesia",
                                status: "CONFIRMED", progress: 100, days: Array(6).fill({ activities: [1,2,3] }),
                                startDate: start, endDate: end, created_at: new Date(now.getTime() - 5*86400000).toISOString()
                            };
                        }
                        // 4. PAST trip (Paris)
                        if (idx % 4 === 3) {
                            const start = new Date(now); start.setDate(start.getDate() - 40);
                            const end = new Date(start); end.setDate(end.getDate() + 5);
                            return {
                                db_id: t.id, destinationName: "Paris, France", country: "France",
                                status: "COMPLETED", progress: 100, days: Array(5).fill({ activities: [1,2,3] }),
                                startDate: start, endDate: end, created_at: new Date(now.getTime() - 60*86400000).toISOString()
                            };
                        }
                    });

                    const formatted = demoTrips.map(dt => {
                        const destSearchName = dt.destinationName.split(',')[0].trim().toLowerCase();
                        const destInfo = DESTINATIONS.find(d => d.name.toLowerCase() === destSearchName) || {};
                        return {
                            ...dt,
                            imageUrl: destInfo.imageUrl,
                            gradient: destInfo.gradient,
                            dateRange: formatDates(dt.startDate, dt.endDate)
                        };
                    });
                    
                    setSavedTrips(formatted);
                } catch (e) {
                    console.error("Failed to fetch trips from cloud", e);
                }
            }
            setIsLoading(false);
        }
        
        if (isLoaded) {
            fetchTrips();
        }
    }, [isLoaded, isSignedIn]);

    const handleDelete = async (e, tripId) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!confirm("Are you sure you want to delete this trip?")) return;

        setIsDeleting(tripId);
        try {
            await deleteTrip(tripId);
            setSavedTrips(prev => prev.filter(t => t.db_id !== tripId));
        } catch (err) {
            console.error("Error deleting trip:", err);
            alert("Failed to delete trip.");
        }
        setIsDeleting(null);
    };

    const handleShare = (e, tripId) => {
        e.preventDefault();
        e.stopPropagation();
        
        const shareUrl = `${window.location.origin}/ai-planner/new?action=view&trip_id=${tripId}`;
        
        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopiedId(tripId);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    const filteredAndSortedTrips = useMemo(() => {
        let result = [...savedTrips];

        // Apply Tab Filter
        if (activeTab === 'Drafts') {
            result = result.filter(t => t.status === 'DRAFT');
        } else if (activeTab === 'Upcoming') {
            result = result.filter(t => t.status === 'CONFIRMED');
        } else if (activeTab === 'Past') {
            result = result.filter(t => t.status === 'COMPLETED');
        }

        // Apply Sort
        if (activeSort === 'Most Recent') {
            result.sort((a, b) => {
                // Group order: Upcoming (CONFIRMED) -> Drafts (DRAFT) -> Past (COMPLETED)
                const groupOrder = { 'CONFIRMED': 1, 'DRAFT': 2, 'COMPLETED': 3 };
                if (groupOrder[a.status] !== groupOrder[b.status]) {
                    return groupOrder[a.status] - groupOrder[b.status];
                }
                // Within group sorting
                if (a.status === 'CONFIRMED') {
                    return a.startDate - b.startDate; // Soonest upcoming first
                } else if (a.status === 'DRAFT') {
                    return new Date(b.created_at) - new Date(a.created_at); // Most recently added first
                } else {
                    return b.endDate - a.endDate; // Most recently completed first
                }
            });
        } else if (activeSort === 'Upcoming First') {
            result.sort((a, b) => a.startDate - b.startDate);
        } else if (activeSort === 'Alphabetical') {
            result.sort((a, b) => a.destinationName.localeCompare(b.destinationName));
        }

        return result;
    }, [savedTrips, activeTab, activeSort]);

    // Calculate if we need a ghost card (only if rows are uneven, e.g., length % 3 !== 0)
    // Actually, to make it always accessible, we can add it at the end if the list isn't empty.
    const needsGhostCard = filteredAndSortedTrips.length > 0 && filteredAndSortedTrips.length % 3 !== 0;

    return (
        <div className="w-full min-h-screen bg-[#FAF8F5] text-[#1F1F1F] flex flex-col pt-24 sm:pt-32 px-4 sm:px-6 lg:px-12">
            <Header />
            
            <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col pb-20 mt-8">
                {/* Dashboard Header */}
                <div className="flex flex-col mb-10">
                    <h1 className="font-sans font-extrabold text-3xl md:text-4xl tracking-tight mb-2">
                        Your Planning Sessions
                    </h1>
                    <p className="font-mono text-[11px] md:text-sm tracking-wide text-[#8CA3A8] uppercase">
                        Manage and review your AI trip drafts
                    </p>
                </div>
                
                {/* Filter and Sort Bar */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-20">
                    
                    {/* Status Pill Tabs (Matches Community Page) */}
                    <div className="flex p-1 bg-white shadow-xs rounded-full border border-stone-200/60 w-full md:w-auto shrink-0 relative overflow-hidden">
                        {FILTERS.map(filter => {
                            const isActive = activeTab === filter;
                            return (
                                <button
                                    key={filter}
                                    onClick={() => setActiveTab(filter)}
                                    className={`relative flex items-center justify-center flex-1 md:flex-none px-5 py-2 rounded-full text-[11px] font-mono uppercase font-bold transition-all duration-300 ${
                                        isActive ? 'text-white' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
                                    }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeFilterTab"
                                            className="absolute inset-0 bg-[#FF6B2C] rounded-full shadow-[0_4px_15px_rgba(255,107,44,0.3)]"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                                        />
                                    )}
                                    <span className="relative z-10">{filter}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Sort and New Trip */}
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative w-full md:w-48 group">
                            <select 
                                value={activeSort}
                                onChange={(e) => setActiveSort(e.target.value)}
                                className="w-full appearance-none bg-white shadow-xs border border-stone-200/60 text-stone-700 text-[11px] font-mono font-bold uppercase rounded-full pl-5 pr-10 py-2.5 focus:outline-none focus:border-[#FF6B2C]/50 focus:ring-1 focus:ring-[#FF6B2C]/20 transition-all cursor-pointer hover:border-[#FF6B2C] hover:text-stone-900"
                            >
                                {SORTS.map(sort => (
                                    <option key={sort} value={sort}>{sort}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400 group-hover:text-[#FF6B2C] transition-colors duration-300">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>
                        </div>

                        <a 
                            href="/ai-planner/new"
                            className="hidden sm:flex group px-5 py-2.5 bg-[#FF6B2C] hover:bg-[#FF8A4C] text-white font-bold text-[11px] rounded-full transition-all duration-300 uppercase tracking-[0.1em] items-center justify-center gap-1.5 shadow-[0_4px_15px_rgba(255,107,44,0.25)] hover:shadow-[0_8px_20px_rgba(255,107,44,0.35)] shrink-0"
                        >
                            <Plus size={14} />
                            New Trip
                        </a>
                    </div>
                </div>

                {/* Empty State / Grid */}
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center min-h-[400px]">
                        <Loader2 className="w-8 h-8 text-[#FF6B2C] animate-spin" />
                    </div>
                ) : savedTrips.length === 0 ? (
                    /* Simple Empty State */
                    <div className="flex flex-col items-center justify-center py-24 px-4 bg-white rounded-3xl border border-stone-200/60 shadow-xs">
                        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-6">
                            <Compass size={32} className="text-stone-400" />
                        </div>
                        <h3 className="font-serif font-bold text-2xl text-stone-900 mb-2">No trips planned yet</h3>
                        <p className="text-stone-500 max-w-md mx-auto text-center mb-8 text-sm">
                            Your itinerary canvas is completely blank. Start a new planning session to discover your next adventure.
                        </p>
                        <a 
                            href="/ai-planner/new"
                            className="px-6 py-3 bg-[#1F1F1F] hover:bg-[#333] text-white font-bold text-[11px] rounded-full transition-all uppercase tracking-[0.15em] shadow-md hover:-translate-y-0.5"
                        >
                            Start Planning
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence mode="popLayout">
                            {filteredAndSortedTrips.map((trip) => (
                                <motion.div 
                                    key={trip.db_id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <a 
                                        href={`/ai-planner/new?action=view&trip_id=${trip.db_id}`} 
                                        className={`block group h-full flex-col bg-white rounded-3xl border shadow-sm transition-all duration-300 overflow-hidden cursor-pointer relative hover:-translate-y-1 ${trip.status === 'COMPLETED' ? 'opacity-60 grayscale-[0.4] hover:opacity-100 hover:grayscale-0 border-stone-200/50' : 'border-stone-200/70 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:border-[#FF6B2C]/30'}`}
                                    >
                                        <div 
                                            className="h-44 relative overflow-hidden flex items-center justify-center transition-transform duration-700 bg-stone-100"
                                            style={!trip.imageUrl ? generateGradient(trip.destinationName) : undefined}
                                        >
                                            {/* Photo or Gradient */}
                                            {trip.imageUrl ? (
                                                <img src={trip.imageUrl} alt={trip.destinationName} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            ) : (
                                                <>
                                                    <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
                                                    <Map size={48} className="text-white opacity-20 absolute rotate-12 -right-4 -bottom-4" />
                                                </>
                                            )}

                                            <div className={`absolute inset-0 bg-linear-to-t ${trip.imageUrl ? 'from-black/60 via-black/10' : 'from-black/30 via-transparent'} to-transparent z-0`} />
                                            
                                            {/* Status Badge */}
                                            <div className="absolute top-4 left-4 z-10">
                                                <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold tracking-widest uppercase shadow-xs flex items-center gap-1.5 ${
                                                    trip.status === 'DRAFT' ? 'bg-stone-100/90 text-stone-600 backdrop-blur-md' :
                                                    trip.status === 'CONFIRMED' ? 'bg-emerald-500/90 text-white backdrop-blur-md' :
                                                    'bg-stone-800/80 text-stone-300 backdrop-blur-md'
                                                }`}>
                                                    {trip.status === 'DRAFT' && <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />}
                                                    {trip.status === 'CONFIRMED' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse" />}
                                                    {trip.status}
                                                </span>
                                            </div>

                                            {/* Date Overlay (Top Right) */}
                                            <div className="absolute top-4 right-4 z-10">
                                                <span className="px-2.5 py-1 bg-black/40 backdrop-blur-md rounded-md text-[10px] font-bold text-white shadow-xs border border-white/10">
                                                    {trip.dateRange}
                                                </span>
                                            </div>

                                            {/* Floating Quick Actions (Hover) - Moved to Center/Bottom to not conflict with dates */}
                                            <div className="absolute right-4 bottom-4 z-20 flex items-center gap-1 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 bg-white/90 backdrop-blur-md border border-white/50 rounded-full p-1 shadow-lg">
                                                <button 
                                                    onClick={(e) => handleShare(e, trip.db_id)}
                                                    className="p-1.5 hover:bg-stone-200 rounded-full text-stone-700 transition-colors"
                                                    title="Share Trip"
                                                >
                                                    {copiedId === trip.db_id ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
                                                </button>
                                                <button 
                                                    onClick={(e) => handleDelete(e, trip.db_id)}
                                                    disabled={isDeleting === trip.db_id}
                                                    className="p-1.5 hover:bg-rose-100 rounded-full text-rose-500 transition-colors disabled:opacity-50"
                                                    title="Delete Trip"
                                                >
                                                    {isDeleting === trip.db_id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-5 flex flex-col flex-1 bg-white relative z-10 min-h-[140px]">
                                            <div className="mb-1 flex items-center justify-between">
                                                <h3 className="font-serif font-bold text-xl text-[#1F1F1F] line-clamp-1 group-hover:text-[#FF6B2C] transition-colors leading-tight">
                                                    {trip.destinationName.split(',')[0]}
                                                </h3>
                                                {/* X Places Stat */}
                                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest shrink-0 ml-2">
                                                    {getTotalActivities(trip)} Places
                                                </span>
                                            </div>
                                            <p className="text-[11px] font-mono text-stone-400 uppercase tracking-widest mb-4">
                                                {trip.country || 'Destination'}
                                            </p>
                                            
                                            <div className="mt-auto pt-4 border-t border-stone-100 flex items-center justify-between">
                                                {trip.status === 'DRAFT' ? (
                                                    <div className="w-full">
                                                        <div className="flex justify-between text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                                                            <span>Planning Progress</span>
                                                            <span>{trip.progress}%</span>
                                                        </div>
                                                        <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                                                            <div className="bg-[#FF6B2C] h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${trip.progress}%` }} />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="text-[10px] font-bold text-[#1F1F1F] uppercase tracking-[0.1em] group-hover:text-[#FF6B2C] transition-colors">
                                                            View Full Itinerary
                                                        </span>
                                                        <ArrowRight size={14} className="text-stone-400 transform transition-all group-hover:translate-x-1 group-hover:text-[#FF6B2C]" />
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </a>
                                </motion.div>
                            ))}

                            {/* Ghost Card for uneven rows */}
                            {needsGhostCard && (
                                <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
                                    <a 
                                        href="/ai-planner/new"
                                        className="h-full min-h-[280px] flex flex-col items-center justify-center bg-stone-50/50 rounded-3xl border-2 border-stone-200 border-dashed hover:border-[#FF6B2C]/50 hover:bg-[#FF6B2C]/5 transition-all duration-300 group cursor-pointer"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-white border border-stone-200 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-[#FF6B2C]/30 transition-all duration-300 shadow-sm">
                                            <Plus size={20} className="text-stone-400 group-hover:text-[#FF6B2C] transition-colors" />
                                        </div>
                                        <span className="font-bold text-sm text-stone-500 group-hover:text-[#FF6B2C] transition-colors">Plan Another Trip</span>
                                    </a>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
            
            {/* Mobile FAB for New Trip */}
            <a 
                href="/ai-planner/new"
                className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-[#FF6B2C] rounded-full shadow-xl flex items-center justify-center text-white z-50 hover:scale-105 active:scale-95 transition-all"
            >
                <Plus size={24} />
            </a>
        </div>
    );
}
