'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import { useUser } from '@clerk/nextjs';
import { Compass, Plus, MapPin, Calendar, ArrowRight, Loader2, Trash2, Share2, Check, Map } from 'lucide-react';
import { getUserTrips, deleteTrip } from '../actions/trips';
import { DESTINATIONS } from '../../lib/destinations';
import { motion, AnimatePresence } from 'framer-motion';

const PLANNING_STAGES = [
    { label: 'Destination', threshold: 25 },
    { label: 'Preferences', threshold: 50 },
    { label: 'AI Generation', threshold: 75 },
    { label: 'Review Draft', threshold: 90 },
    { label: 'Confirmed', threshold: 100 }
];

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
                        let tripObj = {};
                        
                        const actualData = typeof t.itinerary_data === 'string' ? JSON.parse(t.itinerary_data) : (t.itinerary_data || {});
                        
                        // 1. CONFIRMED trip (Demo logic)
                        if (idx % 4 === 0) {
                            const start = new Date(now); start.setDate(start.getDate() + 10);
                            const end = new Date(start); end.setDate(end.getDate() + 4);
                            tripObj = {
                                db_id: t.id, destinationName: actualData.destinationName || t.destination_name || "Rome, Italy",
                                status: actualData.status || "DRAFT", lastCompletedStep: actualData.lastCompletedStep || 'review',
                                days: actualData.days || Array(4).fill({ activities: [1,2] }),
                                startDate: start, endDate: end, created_at: new Date(now.getTime() - 2*86400000).toISOString()
                            };
                        }
                        // 2. DRAFT trip (Demo logic)
                        else if (idx % 4 === 1) {
                            const start = new Date(now); start.setDate(start.getDate() + 30);
                            const end = new Date(start); end.setDate(end.getDate() + 6);
                            tripObj = {
                                db_id: t.id, destinationName: actualData.destinationName || t.destination_name || "Tokyo, Japan",
                                status: actualData.status || "DRAFT", lastCompletedStep: actualData.lastCompletedStep || 'preferences',
                                days: actualData.days || [],
                                startDate: start, endDate: end, created_at: new Date(now.getTime() - 1*86400000).toISOString()
                            };
                        }
                        // 3. UPCOMING trip (Demo logic)
                        else if (idx % 4 === 2) {
                            const start = new Date(now); start.setDate(start.getDate() + 45);
                            const end = new Date(start); end.setDate(end.getDate() + 7);
                            tripObj = {
                                db_id: t.id, destinationName: actualData.destinationName || t.destination_name || "Bali, Indonesia",
                                status: actualData.status || "DRAFT", lastCompletedStep: actualData.lastCompletedStep || 'review',
                                days: actualData.days || Array(6).fill({ activities: [1,2,3] }),
                                startDate: start, endDate: end, created_at: new Date(now.getTime() - 5*86400000).toISOString()
                            };
                        }
                        // 4. PAST trip (Demo logic)
                        else if (idx % 4 === 3) {
                            const start = new Date(now); start.setDate(start.getDate() - 40);
                            const end = new Date(start); end.setDate(end.getDate() + 5);
                            tripObj = {
                                db_id: t.id, destinationName: actualData.destinationName || t.destination_name || "Paris, France",
                                status: actualData.status || "COMPLETED", lastCompletedStep: actualData.lastCompletedStep || 'review',
                                days: actualData.days || Array(5).fill({ activities: [1,2,3] }),
                                startDate: start, endDate: end, created_at: new Date(now.getTime() - 60*86400000).toISOString()
                            };
                        }

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

    const confirmDelete = () => {
        if (!tripToDelete) return;
        
        const tripId = tripToDelete;
        const tripToRestore = savedTrips.find(t => t.db_id === tripId);
        
        // Optimistically remove from UI
        setSavedTrips(prev => prev.filter(t => t.db_id !== tripId));
        setTripToDelete(null); // Close modal instantly
        
        // Setup actual backend deletion after 5 seconds
        const timeoutId = setTimeout(async () => {
            try {
                await deleteTrip(tripId);
            } catch (err) {
                console.error("Error deleting trip:", err);
            }
            setToast(null);
        }, 5000);
        
        // Show Toast
        setToast({
            tripId,
            timeoutId,
            tripData: tripToRestore,
            destinationName: tripToRestore.destinationName.split(',')[0]
        });
    };

    const handleUndo = () => {
        if (!toast) return;
        clearTimeout(toast.timeoutId);
        // Restore trip to local state
        setSavedTrips(prev => [...prev, toast.tripData]);
        setToast(null);
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
            <div className="absolute top-0 left-0 w-full h-[450px] overflow-hidden pointer-events-none z-0">
                {/* Subtle gradient band */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#FF6B2C]/5 to-transparent" />
                
                {/* Dotted Flight Routes SVG */}
                <svg className="absolute inset-0 w-full h-full opacity-[0.07]" viewBox="0 0 1440 450" fill="none" preserveAspectRatio="xMidYMin slice" xmlns="http://www.w3.org/2000/svg">
                    {/* Primary flight path */}
                    <path d="M-100 200 C 200 100, 450 300, 800 150 C 1100 50, 1300 200, 1600 100" stroke="#FF6B2C" strokeWidth="4" strokeDasharray="8 12" strokeLinecap="round" />
                    
                    {/* Secondary flight path */}
                    <path d="M 100 400 C 350 300, 500 50, 950 250 C 1200 350, 1400 150, 1700 250" stroke="#FF6B2C" strokeWidth="2.5" strokeDasharray="6 10" strokeLinecap="round" />
                    
                    {/* Location Pins (Primary) */}
                    <circle cx="210" cy="142" r="6" fill="#FF6B2C" />
                    <circle cx="800" cy="150" r="8" fill="#FF6B2C" stroke="white" strokeWidth="3" />
                    <circle cx="1270" cy="172" r="5" fill="#FF6B2C" />
                    
                    {/* Location Pins (Secondary) */}
                    <circle cx="340" cy="305" r="5" fill="#FF6B2C" />
                    <circle cx="950" cy="250" r="8" fill="#FF6B2C" stroke="white" strokeWidth="3" />
                    <circle cx="1400" cy="150" r="5" fill="#FF6B2C" />
                </svg>

                {/* Soft glow */}
                <div className="absolute -top-[10%] left-[20%] w-[60%] h-[300px] rounded-full bg-[#FF6B2C]/[0.03] blur-[120px]" />
            </div>

            <div className="relative z-50">
                <Header />
            </div>
            
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12 md:pt-36 md:pb-20">
                
                {/* Header Section */}
                <div className="mb-12">
                    <h1 className="font-serif font-bold text-5xl md:text-6xl text-stone-900 mb-4 tracking-tight">Your Planning Sessions</h1>
                    <p className="text-xs md:text-sm font-mono text-stone-500 uppercase tracking-[0.2em] font-semibold">
                        Manage and review your AI trip drafts
                    </p>
                </div>
                
                {/* Filter and Sort Bar */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-20">
                    
                    {/* Status Pill Tabs */}
                    <div className="flex p-1.5 bg-white/60 backdrop-blur-md shadow-sm rounded-full border border-white/80 w-full md:w-auto shrink-0 relative overflow-hidden">
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
                                            className="absolute inset-0 bg-gradient-to-r from-[#FF6B2C] to-[#FF8A4C] rounded-full shadow-[0_4px_15px_rgba(255,107,44,0.4)]"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                                        />
                                    )}
                                    <span className="relative z-10 tracking-[0.1em]">{filter}</span>
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

                {/* Summary Stats Strip */}
                <div className="flex items-center gap-6 md:gap-10 mb-8 relative z-20 overflow-x-auto pb-2 scrollbar-hide">
                    <div className="flex flex-col items-start gap-1">
                        <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400 font-bold">Trips Planned</span>
                        <span className="font-serif font-bold text-2xl text-stone-800 leading-none">{totalTrips}</span>
                    </div>
                    <div className="w-[1px] h-8 bg-stone-200/80 shrink-0" />
                    <div className="flex flex-col items-start gap-1">
                        <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400 font-bold">Upcoming</span>
                        <span className="font-serif font-bold text-2xl text-[#FF6B2C] leading-none">{upcomingTrips}</span>
                    </div>
                    <div className="w-[1px] h-8 bg-stone-200/80 shrink-0" />
                    <div className="flex flex-col items-start gap-1">
                        <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400 font-bold">Countries</span>
                        <span className="font-serif font-bold text-2xl text-stone-800 leading-none">{uniqueCountries}</span>
                    </div>
                    <div className="w-[1px] h-8 bg-stone-200/80 shrink-0" />
                    <div className="flex flex-col items-start gap-1">
                        <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400 font-bold">Days Traveled</span>
                        <span className="font-serif font-bold text-2xl text-stone-800 leading-none">{totalDaysTraveled}</span>
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
                        <Link 
                            href="/ai-planner/new?action=new"
                            className="px-6 py-3 bg-[#1F1F1F] hover:bg-[#333] text-white font-bold text-[11px] rounded-full transition-all uppercase tracking-[0.15em] shadow-md hover:-translate-y-0.5"
                        >
                            Start Planning
                        </Link>
                    </div>
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
                                        href={trip.status === 'COMPLETED' ? `/ai-planner/new?action=new&destination=${encodeURIComponent(trip.destinationName)}` : `/ai-planner/new?action=view&trip_id=${trip.db_id}${trip.status === 'DRAFT' ? '&step=' + getNextStep(trip.lastCompletedStep) : ''}`}
                                        className={`flex group h-full flex-col bg-white rounded-[2rem] border transition-all duration-500 overflow-hidden cursor-pointer relative hover:-translate-y-2 ${trip.status === 'COMPLETED' ? 'opacity-[0.85] border-stone-200/50' : 'border-stone-100 shadow-sm hover:shadow-2xl hover:shadow-[#FF6B2C]/10 hover:border-[#FF6B2C]/30'}`}
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

                                            <div className={`absolute inset-0 bg-gradient-to-t ${trip.imageUrl ? 'from-black/80 via-black/20' : 'from-black/40 via-transparent'} to-transparent z-0`} />
                                            
                                            {/* Status Badge */}
                                            <div className="absolute top-5 left-5 z-10">
                                                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-widest uppercase shadow-lg border flex items-center gap-2 backdrop-blur-xl ${
                                                    trip.status === 'DRAFT' ? 'bg-white/20 border-white/40 text-white' :
                                                    trip.status === 'CONFIRMED' ? 'bg-emerald-500/80 border-emerald-400/50 text-white' :
                                                    'bg-stone-900/60 border-white/20 text-stone-200'
                                                }`}>
                                                    {trip.status === 'DRAFT' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                                    {trip.status === 'CONFIRMED' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse" />}
                                                    {trip.status}
                                                </span>
                                            </div>

                                            {/* Date Overlay (Top Right) */}
                                            <div className="absolute top-5 right-5 z-10 flex flex-col items-end gap-1.5">
                                                <span className="px-3 py-1.5 bg-black/30 backdrop-blur-xl rounded-xl text-[10px] font-bold text-white shadow-lg border border-white/20">
                                                    {trip.dateRange}
                                                </span>
                                                {trip.status === 'CONFIRMED' && daysUntil && (
                                                    <span className="px-2 py-1 bg-[#FF6B2C] text-white rounded-lg text-[9px] font-bold uppercase tracking-widest shadow-md">
                                                        {daysUntil}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Floating Quick Actions (Hover) */}
                                            <div className="absolute right-5 bottom-5 z-20 flex items-center gap-2 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-out">
                                                <button 
                                                    onClick={(e) => handleShare(e, trip.db_id)}
                                                    className="p-2 bg-white/90 backdrop-blur-md rounded-full text-stone-700 hover:bg-[#FF6B2C] hover:text-white transition-all shadow-lg border border-white/50"
                                                    title="Share Trip"
                                                >
                                                    {copiedId === trip.db_id ? <Check size={14} /> : <Share2 size={14} />}
                                                </button>
                                                <button 
                                                    onClick={(e) => handleDelete(e, trip.db_id)}
                                                    className="p-2 bg-white/90 backdrop-blur-md rounded-full text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-lg border border-white/50"
                                                    title="Delete Trip"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-6 flex flex-col flex-1 bg-white relative z-10 min-h-[160px]">
                                            <div className="mb-2">
                                                <p className="text-[10px] font-mono text-[#FF6B2C] uppercase tracking-[0.2em] mb-1.5 font-semibold">
                                                    {trip.country || 'Destination'}
                                                </p>
                                                <div className="flex items-start justify-between gap-4">
                                                    <h3 className="font-serif font-bold text-2xl text-stone-900 line-clamp-2 group-hover:text-[#FF6B2C] transition-colors leading-tight">
                                                        {trip.destinationName.split(',')[0]}
                                                    </h3>
                                                    <div className="px-2.5 py-1 bg-stone-100 rounded-lg text-[10px] font-bold text-stone-500 uppercase tracking-widest shrink-0 mt-1">
                                                        {getTotalActivities(trip)} Places
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-auto pt-6 flex flex-col gap-4">
                                                {trip.status === 'DRAFT' && (
                                                    <div className="w-full bg-stone-50 p-4 rounded-2xl border border-stone-100 relative group/progress">
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
                                                                className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[#FFB085] to-[#FF6B2C] transition-all duration-500 ease-out z-0" 
                                                                initial={{ width: "0%" }}
                                                                animate={{ width: `${trip.progress}%` }}
                                                                transition={{ duration: 1.5, ease: "easeOut", delay: 0.1 * (idx || 0) }}
                                                            >
                                                                {/* Soft leading glow edge */}
                                                                <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-[#FF6B2C] rounded-full blur-[4px] opacity-80" />
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
                                                
                                                <div className="flex items-center justify-between w-full pt-4 border-t border-stone-100">
                                                    <span className="text-[11px] font-bold text-stone-900 uppercase tracking-[0.15em] group-hover:text-[#FF6B2C] transition-colors">
                                                        {trip.status === 'DRAFT' ? 'Continue Planning' : trip.status === 'COMPLETED' ? 'Plan Similar Trip' : 'View Full Itinerary'}
                                                    </span>
                                                    <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center group-hover:bg-[#FF6B2C] group-hover:text-white text-stone-400 transition-all duration-300 transform group-hover:translate-x-1">
                                                        <ArrowRight size={14} />
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
                                    <Link 
                                        href="/ai-planner/new?action=new"
                                        className="h-full min-h-[300px] flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm rounded-[2rem] border-2 border-stone-200/60 border-dashed hover:border-[#FF6B2C]/40 hover:bg-white hover:-translate-y-2 hover:shadow-xl hover:shadow-[#FF6B2C]/5 transition-all duration-500 group cursor-pointer"
                                    >
                                        <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-[#FF6B2C] transition-all duration-500 shadow-sm group-hover:shadow-[0_8px_25px_rgba(255,107,44,0.4)]">
                                            <Plus size={24} className="text-stone-400 group-hover:text-white transition-colors duration-300" />
                                        </div>
                                        <span className="font-serif font-bold text-xl text-stone-600 group-hover:text-[#FF6B2C] transition-colors duration-300">Plan Another Trip</span>
                                        <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-stone-400 mt-2 font-semibold">Start a new draft</p>
                                    </Link>
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
                                    className="bg-white rounded-[2rem] max-w-sm w-full shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-stone-200/50 flex flex-col relative overflow-hidden"
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
                                        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20" />
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
                                        <p className="text-stone-500 text-[13px] leading-relaxed mb-8 max-w-[260px]">
                                            You are about to permanently delete this planning session. This cannot be undone.
                                        </p>
                                        
                                        {/* Actions - Horizontal Layout */}
                                        <div className="flex w-full gap-3 mt-2">
                                            <button 
                                                onClick={() => setTripToDelete(null)}
                                                className="flex-1 px-4 py-3.5 rounded-2xl text-[12px] font-bold uppercase tracking-[0.1em] text-stone-600 bg-white border border-stone-200 shadow-sm hover:bg-stone-50 hover:border-stone-300 transition-all active:scale-[0.98]"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={confirmDelete}
                                                className="flex-1 px-4 py-3.5 rounded-2xl text-[12px] font-bold uppercase tracking-[0.1em] text-white bg-gradient-to-b from-rose-500 to-rose-600 border border-rose-600 shadow-[0_8px_20px_rgba(225,29,72,0.25)] hover:shadow-[0_12px_25px_rgba(225,29,72,0.4)] transition-all hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0"
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
                        initial={{ x: "-50%", opacity: 0, y: 80, scale: 0.8, rotateX: -60, transformPerspective: 1000 }}
                        animate={{ x: "-50%", opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                        exit={{ x: "-50%", opacity: 0, y: 40, scale: 0.8, rotateX: 60 }}
                        transition={{ type: "spring", bounce: 0.35, duration: 0.7 }}
                        className="fixed bottom-10 left-1/2 z-[100] flex items-center gap-4 bg-stone-900/90 backdrop-blur-xl border border-white/10 text-white pl-5 pr-3 py-2.5 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] overflow-hidden min-w-[300px] origin-bottom"
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
                            transition={{ duration: 5, ease: "linear" }}
                            className="absolute bottom-0 left-0 h-[3px] bg-[#FF6B2C]"
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
