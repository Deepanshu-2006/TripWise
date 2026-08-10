'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import { useUser } from '@clerk/nextjs';
import { Compass, Plus, MapPin, Calendar, ArrowRight, Loader2, Trash2, Share2, Check, Map, LayoutGrid } from 'lucide-react';
import { getUserTrips, deleteTrip } from '../actions/trips';
import { DESTINATIONS } from '../../lib/destinations';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedFlightMap from '../components/AnimatedFlightMap';
import TripsCalendarView from '../components/TripsCalendarView';
import { getTrackingState, pollForPriceDrops } from '../../lib/priceTrackingApi';
import Animated3DBackground from '../components/Animated3DBackground';


const PLANNING_STAGES = [
    { label: 'Destination', threshold: 25 },
    { label: 'Preferences', threshold: 50 },
    { label: 'AI Generation', threshold: 75 },
    { label: 'Review Draft', threshold: 90 },
    { label: 'Confirmed', threshold: 100 }
];

const AnimatedCounter = ({ value, delay = 0 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime;
        let animationFrame;
        const duration = 800; // 800ms
        
        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime - delay;
            
            if (progress < 0) {
                animationFrame = requestAnimationFrame(animate);
                return;
            }
            
            const t = Math.min(progress / duration, 1);
            const easeOut = 1 - Math.pow(1 - t, 3); // Cubic ease-out
            
            setCount(Math.floor(easeOut * value));
            
            if (t < 1) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setCount(value);
            }
        };
        
        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [value, delay]);

    return <>{count}</>;
};

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

export const STEP_ORDER = ['destination', 'preferences', 'itinerary', 'review'];

const STEP_PROGRESS = {
    'destination': 25,
    'preferences': 50,
    'itinerary': 90,
    'review': 100
};

export const getNextStep = (lastCompletedStep) => {
    if (!lastCompletedStep) return 'destination';
    const idx = STEP_ORDER.indexOf(lastCompletedStep);
    if (idx === -1 || idx === STEP_ORDER.length - 1) return 'review';
    return STEP_ORDER[idx + 1];
};

const calculateTripProgress = (trip) => {
    let score = 0;
    
    // 1. Base score from the explicit string if it exists
    if (trip.lastCompletedStep) {
        score = STEP_PROGRESS[trip.lastCompletedStep] || 0;
    }
    
    // 2. Ensure they get credit for picking a destination
    if (trip.destinationName) {
        score = Math.max(score, 25);
    }
    
    // 3. If AI has generated the itinerary days, they have bypassed manual steps
    // and are now in the "Review Draft" stage (90%)
    if (trip.days && trip.days.length > 0) {
        score = Math.max(score, 90);
    }
    
    if (trip.status === 'COMPLETED' || trip.status === 'CONFIRMED') {
        score = 100;
    }
    
    return score;
};

const getProgressLabel = (progress) => {
    if (progress < 30) return "Just Started";
    if (progress < 70) return "In Progress";
    if (progress < 100) return "Almost Ready";
    return "Ready to Confirm";
};

const formatDates = (startDate, endDate) => {
    const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
        return `${startStr}–${endDate.getDate()}, ${endDate.getFullYear()}`;
    }
    return `${startStr}–${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
};

const getDaysUntil = (dateStr) => {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(dateStr);
    target.setHours(0,0,0,0);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Starts Today';
    if (diffDays === 1) return 'In 1 day';
    if (diffDays > 1) return `In ${diffDays} days`;
    if (diffDays < 0) return 'Started';
    return null;
};

const AnimatedTrashIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400 shrink-0">
        {/* Paper falling in */}
        <motion.rect 
            x="9" y="0" width="6" height="6" rx="1"
            fill="currentColor"
            stroke="none"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: [ -20, -5, 10 ], opacity: [0, 1, 0] }}
            transition={{ delay: 0.4, duration: 0.35, times: [0, 0.5, 1], ease: "easeIn" }}
        />
        
        {/* The Bin */}
        <motion.g
            initial={{ y: 0 }}
            animate={{ y: [0, 0, 0, 2, -1, 0] }}
            transition={{ delay: 0.3, duration: 0.7, times: [0, 0.2, 0.7, 0.8, 0.9, 1] }}
        >
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <line x1="10" x2="10" y1="11" y2="17"/>
            <line x1="14" x2="14" y1="11" y2="17"/>
        </motion.g>

        {/* The Lid */}
        <motion.g
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, -45, -45, 0] }}
            transition={{ delay: 0.3, duration: 0.6, times: [0, 0.15, 0.85, 1] }}
            style={{ originX: "4px", originY: "6px" }}
        >
            <path d="M3 6h18"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
        </motion.g>
    </svg>
);

const FILTERS = ['All', 'Drafts', 'Upcoming', 'Past'];
const SORTS = ['Most Recent', 'Upcoming First', 'Alphabetical'];

export default function AIPlannerDashboard() {
    const { isLoaded, isSignedIn } = useUser();
    const [savedTrips, setSavedTrips] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [tripToDelete, setTripToDelete] = useState(null);
    const [toast, setToast] = useState(null);
    const [priceDrops, setPriceDrops] = useState({});
    const [copiedId, setCopiedId] = useState(null);

    const [activeTab, setActiveTab] = useState('All');
    const [activeSort, setActiveSort] = useState('Most Recent');
    const [viewMode, setViewMode] = useState('grid');

    useEffect(() => {
        async function fetchTrips() {
            if (isSignedIn) {
                try {
                    const trips = await getUserTrips();
                    console.log("FETCHED TRIPS FROM SERVER:", trips);
                    
                    // Demo Mode: Map DB trips to diverse realistic sample data to demonstrate range
                    const demoTrips = trips.map((t, idx) => {
                        const now = new Date();
                        let tripObj = {};
                        
                        const actualData = typeof t.itinerary_data === 'string' ? JSON.parse(t.itinerary_data) : (t.itinerary_data || {});
                        
                        const hasActualDates = actualData.startDate && actualData.endDate;
                        let start = new Date();
                        let end = new Date();

                        if (hasActualDates) {
                            // parse safely to avoid UTC offset issues (e.g. 2026-08-01 becoming July 31)
                            const [sYear, sMonth, sDay] = actualData.startDate.split('-');
                            start = new Date(sYear, sMonth - 1, sDay);
                            const [eYear, eMonth, eDay] = actualData.endDate.split('-');
                            end = new Date(eYear, eMonth - 1, eDay);
                        } else {
                            // If they didn't pick dates, default to starting today for the given duration
                            start = new Date(now);
                            const duration = actualData.duration || actualData.days?.length || 5;
                            end = new Date(now);
                            end.setDate(end.getDate() + duration - 1);
                        }

                        tripObj = {
                            db_id: t.id, 
                            destinationName: actualData.destinationName || t.destination_name || "Draft Trip",
                            status: actualData.status || "DRAFT", 
                            lastCompletedStep: actualData.lastCompletedStep || 'review',
                            days: actualData.days || [],
                            startDate: start, 
                            endDate: end, 
                            created_at: t.created_at || new Date(now.getTime() - 2*86400000).toISOString()
                        };

                        // Calculate computed progress
                        tripObj.progress = calculateTripProgress(tripObj);
                        
                        // Auto-promote DRAFT to CONFIRMED if 100%
                        if (tripObj.progress === 100 && tripObj.status === 'DRAFT') {
                            tripObj.status = 'CONFIRMED';
                        }
                        
                        return tripObj;
                    });

                    const formatted = demoTrips.map(dt => {
                        const destSearchName = dt.destinationName.split(',')[0].trim().toLowerCase();
                        const destInfo = DESTINATIONS.find(d => d.name.toLowerCase() === destSearchName) || {};
                        const parsedCountry = dt.destinationName.split(',')[1]?.trim();
                        
                        return {
                            ...dt,
                            country: destInfo.country || parsedCountry || 'Destination',
                            imageUrl: destInfo.imageUrl || `/api/image?q=${encodeURIComponent(dt.destinationName)}`,
                            gradient: destInfo.gradient,
                            dateRange: formatDates(dt.startDate, dt.endDate)
                        };
                    });
                    
                    setSavedTrips(formatted);

                    // Check for price drops for confirmed/upcoming trips
                    formatted.forEach(async (trip) => {
                        if (trip.status === 'CONFIRMED' || trip.status === 'UPCOMING') {
                            const state = getTrackingState(trip.db_id);
                            if (state) {
                                const dropInfo = await pollForPriceDrops(trip.db_id);
                                if (dropInfo && dropInfo.hasDrops && dropInfo.state.unreadDrops) {
                                    setPriceDrops(prev => ({
                                        ...prev,
                                        [trip.db_id]: dropInfo.drops
                                    }));
                                } else if (state.unreadDrops && state.recentDrops) {
                                    setPriceDrops(prev => ({
                                        ...prev,
                                        [trip.db_id]: state.recentDrops
                                    }));
                                }
                            }
                        }
                    });

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

    // Handle Escape key to close modal
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && tripToDelete) {
                setTripToDelete(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [tripToDelete]);

    const handleDelete = (e, tripId) => {
        e.preventDefault();
        e.stopPropagation();
        setTripToDelete(tripId);
    };

    const confirmDelete = async () => {
        if (!tripToDelete) return;
        
        const tripId = tripToDelete;
        const tripToRestore = savedTrips.find(t => t.db_id === tripId);
        
        // Optimistically remove from UI
        setSavedTrips(prev => prev.filter(t => t.db_id !== tripId));
        setTripToDelete(null); // Close modal instantly

        // Clear local storage if active trip matches deleted trip
        if (typeof window !== 'undefined') {
            if (localStorage.getItem('tripwise_trip_id') === tripId) {
                localStorage.removeItem('tripwise_trip_id');
                localStorage.removeItem('tripwise_itinerary');
            }
        }

        // Perform immediate cloud DB deletion
        try {
            await deleteTrip(tripId);
            console.log("Successfully deleted trip from cloud DB:", tripId);
        } catch (err) {
            console.error("Error deleting trip from DB:", err);
            // Restore trip if deletion failed
            if (tripToRestore) {
                setSavedTrips(prev => [...prev, tripToRestore]);
            }
        }

        // Show toast notification
        setToast({
            tripId,
            tripData: tripToRestore,
            destinationName: tripToRestore?.destinationName?.split(',')[0] || "Trip"
        });
        setTimeout(() => setToast(null), 4000);
    };

    const handleUndo = async () => {
        if (!toast || !toast.tripData) return;
        const tripDataToRestore = toast.tripData;
        setToast(null);
        
        // Optimistically restore to local UI state
        setSavedTrips(prev => [...prev, tripDataToRestore]);
        
        // Re-save trip to database
        try {
            const rawItinerary = {
                destinationName: tripDataToRestore.destinationName,
                days: tripDataToRestore.days,
                status: tripDataToRestore.status,
                lastCompletedStep: tripDataToRestore.lastCompletedStep
            };
            await saveTrip(tripDataToRestore.destinationName, rawItinerary);
        } catch (err) {
            console.error("Failed to restore trip to cloud:", err);
        }
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

    // Compute Summary Stats
    const totalTrips = savedTrips.length;
    const upcomingTrips = savedTrips.filter(t => t.status === 'CONFIRMED' || t.status === 'UPCOMING').length;
    const uniqueCountries = new Set(savedTrips.map(t => t.country).filter(Boolean)).size;
    const totalDaysTraveled = savedTrips.reduce((acc, t) => {
        if (t.startDate && t.endDate) {
            return acc + Math.max(0, Math.ceil((new Date(t.endDate) - new Date(t.startDate)) / (1000 * 60 * 60 * 24)));
        }
        return acc;
    }, 0);

    return (
        <div className="min-h-screen bg-[#FAF8F5] relative">
            {/* Hero Background Treatment */}
            <AnimatedFlightMap trips={savedTrips} />

            <div className="relative z-50">
                <Header />
            </div>
            
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12 md:pt-36 md:pb-20">
                
                {/* Header Section */}
                <div className="mb-10">
                    <div className="mb-4">
                        <span className="text-[10px] font-bold text-[#FF6B2C] uppercase tracking-[0.2em]">TRAVEL LOG — 2026</span>
                    </div>
                    <h1 className="font-serif font-bold text-5xl md:text-6xl text-stone-900 mb-4 tracking-tight">Your Planning Sessions</h1>
                    <p className="text-xs md:text-sm font-mono text-stone-500 uppercase tracking-[0.2em] font-semibold">
                        Manage and review your AI trip drafts
                    </p>
                </div>

                {/* Summary Stats Grid/Row */}
                <div className="grid grid-cols-2 md:flex md:items-center gap-y-8 md:gap-y-0 mb-10 relative z-20">
                    <div className="flex flex-col items-start gap-1.5 md:gap-2">
                        <span className="font-mono text-[9px] md:text-[10px] uppercase tracking-widest text-stone-400 font-bold">Trips Planned</span>
                        <span className="font-serif font-bold text-5xl md:text-6xl text-stone-800 leading-none"><AnimatedCounter value={totalTrips} delay={0} /></span>
                    </div>
                    
                    <div className="hidden md:block w-px h-14 bg-stone-200/80 shrink-0 mx-8 lg:mx-12" />
                    
                    <div className="flex flex-col items-start gap-1.5 md:gap-2 pl-6 md:pl-0 border-l border-stone-200/80 md:border-none">
                        <span className="font-mono text-[9px] md:text-[10px] uppercase tracking-widest text-stone-400 font-bold">Upcoming</span>
                        <span className="font-serif font-bold text-5xl md:text-6xl text-[#FF6B2C] leading-none"><AnimatedCounter value={upcomingTrips} delay={100} /></span>
                    </div>

                    <div className="hidden md:block w-px h-14 bg-stone-200/80 shrink-0 mx-8 lg:mx-12" />
                    
                    <div className="flex flex-col items-start gap-1.5 md:gap-2 pr-6 md:pr-0">
                        <span className="font-mono text-[9px] md:text-[10px] uppercase tracking-widest text-stone-400 font-bold">Countries</span>
                        <span className="font-serif font-bold text-5xl md:text-6xl text-stone-800 leading-none"><AnimatedCounter value={uniqueCountries} delay={200} /></span>
                    </div>

                    <div className="hidden md:block w-px h-14 bg-stone-200/80 shrink-0 mx-8 lg:mx-12" />
                    
                    <div className="flex flex-col items-start gap-1.5 md:gap-2 pl-6 md:pl-0 border-l border-stone-200/80 md:border-none">
                        <span className="font-mono text-[9px] md:text-[10px] uppercase tracking-widest text-stone-400 font-bold">Days Traveled</span>
                        <span className="font-serif font-bold text-5xl md:text-6xl text-stone-800 leading-none"><AnimatedCounter value={totalDaysTraveled} delay={300} /></span>
                    </div>
                </div>
                
                {/* Filter and Sort Bar */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-20">
                    
                    {/* Status Pill Tabs & View Toggle Group */}
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        {/* Filters */}
                        <div className="flex p-1.5 bg-white/60 backdrop-blur-md shadow-sm rounded-full border border-white/80 shrink-0 relative overflow-hidden">
                            {FILTERS.map(filter => {
                                const isActive = activeTab === filter;
                                return (
                                    <button
                                        key={filter}
                                        onClick={() => setActiveTab(filter)}
                                        className={`relative flex items-center justify-center flex-1 md:flex-none px-6 py-2.5 rounded-full text-[11px] font-mono uppercase font-bold transition-all duration-300 ${
                                            isActive ? 'text-white' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100/50'
                                        }`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeFilterTab"
                                                className="absolute inset-0 bg-linear-to-r from-[#FF6B2C] to-[#FF8A4C] rounded-full shadow-[0_4px_15px_rgba(255,107,44,0.4)]"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                                            />
                                        )}
                                        <span className="relative z-10 tracking-widest">{filter}</span>
                                    </button>
                                );
                            })}
                        </div>
                        
                        {/* View Toggle */}
                        <div className="flex p-1 bg-white/60 backdrop-blur-md shadow-sm rounded-full border border-white/80 shrink-0 relative overflow-hidden self-start md:self-auto">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`relative flex items-center justify-center px-4 py-2 rounded-full text-[11px] font-mono uppercase font-bold transition-all duration-300 gap-1.5 ${
                                    viewMode === 'grid' ? 'text-white' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100/50'
                                }`}
                            >
                                {viewMode === 'grid' && (
                                    <motion.div
                                        layoutId="activeViewTab"
                                        className="absolute inset-0 bg-stone-800 rounded-full shadow-sm"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                                    />
                                )}
                                <LayoutGrid size={14} className="relative z-10" />
                                <span className="relative z-10 tracking-widest">Grid</span>
                            </button>
                            <button
                                onClick={() => setViewMode('calendar')}
                                className={`relative flex items-center justify-center px-4 py-2 rounded-full text-[11px] font-mono uppercase font-bold transition-all duration-300 gap-1.5 ${
                                    viewMode === 'calendar' ? 'text-white' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100/50'
                                }`}
                            >
                                {viewMode === 'calendar' && (
                                    <motion.div
                                        layoutId="activeViewTab"
                                        className="absolute inset-0 bg-stone-800 rounded-full shadow-sm"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                                    />
                                )}
                                <Calendar size={14} className="relative z-10" />
                                <span className="relative z-10 tracking-widest">Calendar</span>
                            </button>
                        </div>
                    </div>

                    {/* Sort and New Trip */}
                    <div className="flex items-center gap-4 w-full md:w-auto translate-y-0.75">
                        <div className={`relative w-full md:w-48 group ${viewMode === 'calendar' ? 'hidden' : ''}`}>
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400 group-hover:text-[#FF6B2C] transition-colors duration-300">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="4" y1="6" x2="20" y2="6"></line>
                                    <line x1="4" y1="12" x2="14" y2="12"></line>
                                    <line x1="4" y1="18" x2="8" y2="18"></line>
                                </svg>
                            </div>
                            <select 
                                value={activeSort}
                                onChange={(e) => setActiveSort(e.target.value)}
                                className="w-full appearance-none bg-white/80 backdrop-blur-md shadow-sm border border-stone-200/60 hover:border-[#FF6B2C]/40 hover:shadow-md text-stone-600 hover:text-stone-900 text-[11px] font-mono font-bold uppercase rounded-full pl-10 pr-10 py-3 focus:outline-none focus:border-[#FF6B2C]/50 focus:ring-1 focus:ring-[#FF6B2C]/20 transition-all duration-300 cursor-pointer"
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
                            className="relative overflow-hidden hidden sm:flex group px-6 py-3 bg-linear-to-r from-[#FF8243] via-[#FF5A00] to-[#FF8243] bg-size-[200%_auto] hover:bg-position-[100%_0] text-white font-bold text-[11px] rounded-full transition-all duration-500 uppercase tracking-widest items-center justify-center gap-2 shadow-[0_8px_20px_-6px_rgba(255,107,44,0.6)] hover:shadow-[0_15px_30px_-6px_rgba(255,107,44,0.9)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_4px_10px_-6px_rgba(255,107,44,0.5)] shrink-0 border border-white/30"
                        >
                            {/* Inner Shine sweep on hover */}
                            <div className="absolute inset-0 w-[200%] h-full bg-linear-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" style={{ transform: 'skewX(-20deg)' }} />
                            
                            <div className="bg-white/20 backdrop-blur-md rounded-full p-0.5 group-hover:rotate-180 group-hover:scale-110 transition-all duration-500 shadow-[inset_0_1px_3px_rgba(255,255,255,0.4)] relative z-10">
                                <Plus size={14} strokeWidth={3} className="text-white drop-shadow-md" />
                            </div>
                            <span className="relative z-10 drop-shadow-md">New Trip</span>
                        </a>
                    </div>
                </div>


                {/* Empty State / Grid */}
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center min-h-100">
                        <Loader2 className="w-8 h-8 text-[#FF6B2C] animate-spin" />
                    </div>
                ) : savedTrips.length === 0 ? (
                    /* Premium Empty State */
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="relative flex flex-col items-center justify-center py-32 px-6 rounded-[2.5rem] border border-stone-200/50 shadow-sm overflow-hidden bg-white/80 backdrop-blur-sm isolate"
                    >
                        <Animated3DBackground />
                        
                        {/* Floating Icon Container */}
                        <motion.div 
                            animate={{ y: [0, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            className="relative w-24 h-24 mb-8"
                        >
                            <div className="absolute inset-0 bg-orange-100/50 rounded-full blur-xl scale-150"></div>
                            <div className="relative w-full h-full bg-linear-to-br from-white to-orange-50 rounded-2xl shadow-xl shadow-orange-900/5 border border-white flex items-center justify-center rotate-3 hover:rotate-6 transition-transform duration-500">
                                <Compass size={40} strokeWidth={1.5} className="text-[#FF6B2C]" />
                            </div>
                            
                            {/* Decorative Sparkles */}
                            <motion.div animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }} transition={{ repeat: Infinity, duration: 2, delay: 0.5 }} className="absolute -top-4 -right-4">
                                <span className="text-xl">✨</span>
                            </motion.div>
                            <motion.div animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }} transition={{ repeat: Infinity, duration: 2, delay: 1.5 }} className="absolute -bottom-2 -left-6">
                                <span className="text-sm">🌟</span>
                            </motion.div>
                        </motion.div>

                        <h3 className="font-serif font-bold text-3xl md:text-4xl text-stone-900 mb-4 text-center tracking-tight">Your canvas is <span className="text-transparent bg-clip-text bg-linear-to-r from-[#FF6B2C] to-orange-400">waiting.</span></h3>
                        <p className="text-stone-500 max-w-lg mx-auto text-center mb-10 text-[15px] leading-relaxed">
                            Every great journey begins with a single idea. Spark your next unforgettable adventure with our AI-powered travel designer.
                        </p>
                        
                        <Link 
                            href="/ai-planner/new?action=new"
                            className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-[13px] text-white transition-all duration-300 bg-[#1F1F1F] rounded-full uppercase tracking-[0.2em] hover:bg-black hover:shadow-xl hover:shadow-orange-500/20 hover:-translate-y-1 overflow-hidden"
                        >
                            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-linear-to-r from-transparent via-white/10 to-transparent"></div>
                            <span className="relative flex items-center gap-2">
                                Start Planning <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </span>
                        </Link>
                    </motion.div>
                ) : viewMode === 'calendar' ? (
                    <TripsCalendarView trips={filteredAndSortedTrips} />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence mode="popLayout">
                            {filteredAndSortedTrips.map((trip, idx) => {
                                const daysUntil = trip.startDate ? getDaysUntil(trip.startDate) : null;
                                const saturation = trip.status === 'COMPLETED' ? 0 : trip.status === 'DRAFT' ? (trip.progress < 50 ? 0.4 : 0.4 + (0.6 * ((trip.progress - 50) / 50))) : 1;
                                
                                return (
                                <motion.div 
                                    key={trip.db_id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Link 
                                        href={trip.status === 'COMPLETED' ? `/ai-planner/new?action=new&destination=${encodeURIComponent(trip.destinationName)}` : `/ai-planner/new?action=view&trip_id=${trip.db_id}${trip.status === 'DRAFT' ? '&step=' + getNextStep(trip.lastCompletedStep) : ''}${priceDrops[trip.db_id] ? '&tab=tracking' : ''}`}
                                        className={`flex group h-full flex-col bg-white rounded-4xl border transition-all duration-500 overflow-hidden cursor-pointer relative hover:-translate-y-2 ${trip.status === 'COMPLETED' ? 'opacity-[0.85] border-stone-200/50' : 'border-stone-200/50 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(255,107,44,0.15)] hover:border-[#FF6B2C]/40'}`}
                                    >
                                        <div 
                                            className="h-56 relative overflow-hidden flex items-center justify-center transition-transform duration-700 bg-stone-100"
                                            style={!trip.imageUrl ? generateGradient(trip.destinationName) : undefined}
                                        >
                                            {/* Photo or Gradient */}
                                            {trip.imageUrl ? (
                                                <img src={trip.imageUrl} alt={trip.destinationName} className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105" style={{ filter: `saturate(${saturation})` }} />
                                            ) : (
                                                <>
                                                    <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
                                                    <Map size={48} className="text-white opacity-20 absolute rotate-12 -right-4 -bottom-4" />
                                                </>
                                            )}

                                            <div className={`absolute inset-0 bg-linear-to-t ${trip.imageUrl ? 'from-black/80 via-black/20' : 'from-black/40 via-transparent'} to-transparent z-0`} />
                                            
                                            {/* Status Badge */}
                                            <div className="absolute top-5 left-5 z-10">
                                                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-widest uppercase shadow-lg border flex items-center gap-2 backdrop-blur-md ${
                                                    trip.status === 'DRAFT' ? 'bg-black/30 border-white/20 text-white' :
                                                    trip.status === 'CONFIRMED' ? 'bg-emerald-500/90 border-emerald-400/30 text-white shadow-emerald-900/20' :
                                                    'bg-stone-900/80 border-white/20 text-stone-200'
                                                }`}>
                                                    {trip.status === 'DRAFT' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                                    {trip.status === 'CONFIRMED' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse" />}
                                                    {trip.status}
                                                </span>
                                                
                                                {/* Price Drop Badge */}
                                                {priceDrops[trip.db_id] && (
                                                    <span className="mt-2 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-widest uppercase shadow-lg border flex items-center gap-1.5 backdrop-blur-md bg-emerald-500/90 border-emerald-400/30 text-white shadow-emerald-900/20">
                                                        <span>💰 Price Dropped -{priceDrops[trip.db_id].flight ? priceDrops[trip.db_id].flight.percentageSaved : priceDrops[trip.db_id].hotel.percentageSaved}%</span>
                                                    </span>
                                                )}
                                            </div>

                                            {/* Date Overlay (Top Right) */}
                                            <div className="absolute top-5 right-5 z-10 flex flex-col items-end gap-1.5">
                                                <span className="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl text-[10px] font-bold text-white shadow-lg border border-white/20">
                                                    {trip.dateRange}
                                                </span>
                                                {trip.status === 'CONFIRMED' && daysUntil && (
                                                    <span className="px-2 py-1 bg-[#FF6B2C] text-white rounded-lg text-[9px] font-bold uppercase tracking-widest shadow-md">
                                                        {daysUntil}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Floating Quick Actions (Hover) */}
                                            <div className="absolute right-5 bottom-5 z-20 flex items-center gap-2.5 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-out">
                                                <motion.button 
                                                    whileHover={{ scale: 1.05, y: -2 }}
                                                    whileTap={{ scale: 0.95, y: 1 }}
                                                    onClick={(e) => handleShare(e, trip.db_id)}
                                                    className="group/share relative p-2.5 bg-white/90 backdrop-blur-xl rounded-full text-stone-600 transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_20px_rgba(255,107,44,0.3)] border border-white/60 hover:border-[#FF6B2C]/30 overflow-hidden"
                                                    title="Share Trip"
                                                >
                                                    <div className="absolute inset-0 bg-[#FF6B2C] translate-y-[100%] group-hover/share:translate-y-0 transition-transform duration-300 ease-out" />
                                                    <div className="relative z-10 flex items-center justify-center group-hover/share:text-white transition-colors duration-300">
                                                      {copiedId === trip.db_id ? (
                                                          <Check size={15} strokeWidth={2.5} />
                                                      ) : (
                                                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="overflow-visible">
                                                              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" className="transition-transform duration-300 group-hover/share:translate-y-[1px]" />
                                                              <g className="transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/share:-translate-y-[4px] group-hover/share:scale-110 origin-bottom">
                                                                  <polyline points="16 6 12 2 8 6"/>
                                                                  <line x1="12" y1="2" x2="12" y2="15"/>
                                                              </g>
                                                          </svg>
                                                      )}
                                                    </div>
                                                </motion.button>
                                                
                                                <motion.button 
                                                    whileHover={{ scale: 1.05, y: -2 }}
                                                    whileTap={{ scale: 0.95, y: 1 }}
                                                    onClick={(e) => handleDelete(e, trip.db_id)}
                                                    className="group/delete relative p-2.5 bg-white/90 backdrop-blur-xl rounded-full text-rose-500 transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_20px_rgba(244,63,94,0.3)] border border-white/60 hover:border-rose-500/30 overflow-hidden"
                                                    title="Delete Trip"
                                                >
                                                    <div className="absolute inset-0 bg-rose-500 translate-y-[100%] group-hover/delete:translate-y-0 transition-transform duration-300 ease-out" />
                                                    <div className="relative z-10 flex items-center justify-center group-hover/delete:text-white transition-colors duration-300">
                                                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="overflow-visible">
                                                          <g className="transition-transform duration-300 group-hover/delete:-translate-y-[1px]">
                                                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                                              <line x1="10" x2="10" y1="11" y2="17"/>
                                                              <line x1="14" x2="14" y1="11" y2="17"/>
                                                          </g>
                                                          <g className="origin-[12px_6px] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/delete:-translate-y-[3px] group-hover/delete:rotate-[-12deg]">
                                                              <path d="M3 6h18"/>
                                                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                                          </g>
                                                      </svg>
                                                    </div>
                                                </motion.button>
                                            </div>
                                        </div>

                                        <div className="p-7 flex flex-col flex-1 bg-white relative z-10 min-h-40">
                                            <div className="mb-2">
                                                <p className="text-[10px] font-mono text-[#FF6B2C] uppercase tracking-[0.25em] mb-1.5 font-bold">
                                                    {trip.country || 'Destination'}
                                                </p>
                                                <div className="flex items-start justify-between gap-4 mt-2">
                                                    <h3 className="font-serif font-bold text-3xl text-stone-900 line-clamp-2 group-hover:text-[#FF6B2C] transition-colors leading-tight">
                                                        {trip.destinationName.split(',')[0]}
                                                    </h3>
                                                    <div className="px-3 py-1.5 bg-stone-50 border border-stone-200/60 rounded-xl text-[10px] font-bold text-stone-500 uppercase tracking-widest shrink-0 mt-1 flex items-center shadow-sm">
                                                        <MapPin size={12} className="mr-1.5 text-stone-400" />
                                                        {getTotalActivities(trip)} Places
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-auto pt-6 flex flex-col gap-4">
                                                {trip.status === 'DRAFT' && (
                                                    <div className="w-full bg-stone-50 p-5 rounded-2xl border border-stone-200/60 relative group/progress shadow-sm">
                                                        <div className="flex justify-between items-end mb-2.5 relative z-10">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-[10px] font-bold text-stone-800 uppercase tracking-widest">Planning Progress</span>
                                                                <span className="text-[9px] font-medium text-stone-500 uppercase tracking-widest">{getProgressLabel(trip.progress)}</span>
                                                            </div>
                                                            <span className="text-[11px] font-bold text-[#FF6B2C]">{trip.progress}%</span>
                                                        </div>
                                                        <div className="relative w-full h-2">
                                                            {/* Background track */}
                                                            <div className="absolute inset-0 bg-stone-200/50 rounded-full shadow-inner" />
                                                            
                                                            {/* Fill */}
                                                            <motion.div 
                                                                className="absolute top-0 left-0 h-full rounded-full bg-linear-to-r from-[#FFB085] to-[#FF6B2C] transition-all duration-500 ease-out z-0" 
                                                                initial={{ width: "0%" }}
                                                                animate={{ width: `${trip.progress}%` }}
                                                                transition={{ duration: 1.5, ease: "easeOut", delay: 0.1 * (idx || 0) }}
                                                            >
                                                                {/* Soft leading glow edge */}
                                                                <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-[#FF6B2C] rounded-full blur-xs opacity-80" />
                                                            </motion.div>

                                                            {/* Markers */}
                                                            {PLANNING_STAGES.map((stage, i) => (
                                                                <div 
                                                                    key={i}
                                                                    className={`absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full border border-white z-10 transition-colors duration-500 ${trip.progress >= stage.threshold ? 'bg-[#FF6B2C]' : 'bg-transparent border-stone-300'}`}
                                                                    style={{ left: `${stage.threshold}%`, transform: `translate(-50%, -50%)` }}
                                                                />
                                                            ))}
                                                        </div>
                                                        
                                                        {/* Tooltip */}
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 bg-stone-900 text-white p-3 rounded-xl shadow-2xl opacity-0 invisible group-hover/progress:opacity-100 group-hover/progress:visible transition-all duration-300 z-50 translate-y-2 group-hover/progress:translate-y-0 pointer-events-none">
                                                            <div className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-2">Stage Breakdown</div>
                                                            <div className="flex flex-col gap-1.5">
                                                                {PLANNING_STAGES.map((stage, i) => {
                                                                    const isCompleted = trip.progress >= stage.threshold;
                                                                    return (
                                                                        <div key={i} className="flex items-center gap-2">
                                                                            <div className={`w-3 h-3 rounded-full flex items-center justify-center shrink-0 ${isCompleted ? 'bg-[#FF6B2C]' : 'bg-stone-700'}`}>
                                                                                {isCompleted ? <Check size={8} className="text-white" strokeWidth={4} /> : <div className="w-1 h-1 rounded-full bg-stone-500" />}
                                                                            </div>
                                                                            <span className={`text-[10px] font-mono tracking-wider ${isCompleted ? 'text-white' : 'text-stone-500'}`}>{stage.label}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-900" />
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                <div className="flex items-center justify-between w-full pt-5 border-t border-stone-100">
                                                    <span className="text-[11px] font-bold text-stone-900 uppercase tracking-[0.15em] group-hover:text-[#FF6B2C] transition-colors flex items-center">
                                                        {trip.status === 'DRAFT' ? 'Continue Planning' : trip.status === 'COMPLETED' ? 'Plan Similar Trip' : 'View Full Itinerary'}
                                                    </span>
                                                    <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-[#FF6B2C] group-hover:text-white text-stone-400 transition-all duration-300 transform group-hover:translate-x-1 group-hover:shadow-md">
                                                        <ArrowRight size={16} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                                );
                            })}

                            {/* Ghost Card for uneven rows */}
                            {needsGhostCard && (
                                <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
                                    {filteredAndSortedTrips.length >= 4 ? (
                                        <Link 
                                            href="/ai-planner/new?action=new"
                                            className="h-full min-h-75 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm rounded-4xl border-2 border-stone-200/60 border-dashed hover:border-[#FF6B2C]/40 hover:bg-white hover:-translate-y-2 hover:shadow-xl hover:shadow-[#FF6B2C]/5 transition-all duration-500 group cursor-pointer"
                                        >
                                            <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-[#FF6B2C] transition-all duration-500 shadow-sm group-hover:shadow-[0_8px_25px_rgba(255,107,44,0.4)]">
                                                <Plus size={24} className="text-stone-400 group-hover:text-white transition-colors duration-300" />
                                            </div>
                                            <span className="font-serif font-bold text-xl text-stone-600 group-hover:text-[#FF6B2C] transition-colors duration-300">Plan Another Trip</span>
                                            <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-stone-400 mt-2 font-semibold">Start a new draft</p>
                                        </Link>
                                    ) : (
                                        <Link 
                                            href="/destinations"
                                            className="h-full min-h-75 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm rounded-4xl border-2 border-stone-200/60 border-dashed hover:border-[#FF6B2C]/40 hover:bg-white hover:-translate-y-2 hover:shadow-xl hover:shadow-[#FF6B2C]/5 transition-all duration-500 group cursor-pointer"
                                        >
                                            <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-[#FF6B2C] transition-all duration-500 shadow-sm group-hover:shadow-[0_8px_25px_rgba(255,107,44,0.4)]">
                                                <Compass size={24} className="text-stone-400 group-hover:text-white transition-colors duration-300" />
                                            </div>
                                            <span className="font-serif font-bold text-xl text-stone-600 group-hover:text-[#FF6B2C] transition-colors duration-300">Browse Destinations</span>
                                            <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-stone-400 mt-2 font-semibold">Need inspiration?</p>
                                        </Link>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
            
            {/* Mobile FAB for New Trip */}
            <Link 
                href="/ai-planner/new?action=new"
                className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-[#FF6B2C] rounded-full shadow-xl flex items-center justify-center text-white z-50 hover:scale-105 active:scale-95 transition-all"
            >
                <Plus size={24} />
            </Link>

            {/* Custom Delete Confirmation Modal */}
            <AnimatePresence>
                {tripToDelete && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-md"
                        onClick={() => setTripToDelete(null)}
                    >
                        {(() => {
                            const trip = savedTrips.find(t => t.db_id === tripToDelete);
                            return (
                                <motion.div
                                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                    transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                                    className="bg-white rounded-4xl max-w-sm w-full shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-stone-200/50 flex flex-col relative overflow-hidden"
                                    onClick={e => e.stopPropagation()}
                                >
                                    {/* Modal Header with Trip Image */}
                                    <div className="h-44 relative bg-stone-100 w-full overflow-hidden">
                                        {trip?.imageUrl ? (
                                            <img src={trip.imageUrl} alt={trip.destinationName} className="absolute inset-0 w-full h-full object-cover" />
                                        ) : (
                                            <div className="absolute inset-0" style={generateGradient(trip?.destinationName)}></div>
                                        )}
                                        {/* Soft fade to white at the bottom */}
                                        <div className="absolute inset-0 bg-linear-to-t from-white via-transparent to-black/20" />
                                    </div>
                                    
                                    {/* Overlapping Icon */}
                                    <div className="relative -mt-8 flex justify-center z-10">
                                        <motion.div 
                                            initial={{ rotate: 0 }}
                                            animate={{ rotate: [0, -15, 15, -15, 15, 0] }}
                                            transition={{ delay: 0.3, duration: 0.5, ease: "easeInOut" }}
                                            className="w-16 h-16 bg-white rounded-full flex items-center justify-center p-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.08)]"
                                        >
                                            <div className="w-full h-full bg-rose-50 rounded-full flex items-center justify-center border border-rose-100">
                                                <Trash2 size={24} className="text-rose-500" />
                                            </div>
                                        </motion.div>
                                    </div>

                                    {/* Modal Body */}
                                    <div className="p-8 pt-5 flex flex-col items-center text-center">
                                        <h3 className="font-serif font-bold text-3xl text-stone-900 mb-2">Delete {trip?.destinationName?.split(',')[0]}?</h3>
                                        <p className="text-stone-500 text-[13px] leading-relaxed mb-8 max-w-65">
                                            You are about to permanently delete this planning session. This cannot be undone.
                                        </p>
                                        
                                        {/* Actions - Horizontal Layout */}
                                        <div className="flex w-full gap-3 mt-2">
                                            <button 
                                                onClick={() => setTripToDelete(null)}
                                                className="flex-1 px-4 py-3.5 rounded-2xl text-[12px] font-bold uppercase tracking-widest text-stone-600 bg-white border border-stone-200 shadow-sm hover:bg-stone-50 hover:border-stone-300 transition-all active:scale-[0.98]"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={confirmDelete}
                                                className="flex-1 px-4 py-3.5 rounded-2xl text-[12px] font-bold uppercase tracking-widest text-white bg-linear-to-b from-rose-500 to-rose-600 border border-rose-600 shadow-[0_8px_20px_rgba(225,29,72,0.25)] hover:shadow-[0_12px_25px_rgba(225,29,72,0.4)] transition-all hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })()}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Undo Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ x: 80, opacity: 0, y: 0, scale: 0.8, rotateX: -60, transformPerspective: 1000 }}
                        animate={{ x: 0, opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                        exit={{ x: 80, opacity: 0, y: 0, scale: 0.8, rotateX: 60 }}
                        transition={{ type: "spring", bounce: 0.35, duration: 0.7 }}
                        className="fixed bottom-10 right-10 z-100 flex items-center gap-4 bg-stone-900/90 backdrop-blur-xl border border-white/10 text-white pl-5 pr-3 py-2.5 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] overflow-hidden min-w-75 origin-right"
                    >
                        <AnimatedTrashIcon />
                        
                        <p className="text-[13px] text-stone-200 flex-1 truncate">
                            Deleted <strong className="text-white font-semibold">{toast.destinationName}</strong>
                        </p>
                        
                        <div className="w-px h-4 bg-white/20 ml-2 shrink-0" />
                        
                        <button 
                            onClick={handleUndo}
                            className="px-3 py-1.5 hover:bg-white/10 rounded-lg text-[#FF6B2C] hover:text-[#FF8A4C] text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95 shrink-0"
                        >
                            Undo
                        </button>
                        
                        {/* Time remaining indicator */}
                        <motion.div 
                            initial={{ width: "100%" }}
                            animate={{ width: "0%" }}
                            transition={{ duration: 7, ease: "linear" }}
                            className="absolute bottom-0 left-0 h-0.75 bg-[#FF6B2C]"
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
