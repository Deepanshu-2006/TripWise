'use client';

import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useUser } from '@clerk/nextjs';
import { Compass, Plus, MapPin, Calendar, ArrowRight, Loader2, Trash2, Share2, Check } from 'lucide-react';
import { getUserTrips, deleteTrip } from '../actions/trips';

export default function AIPlannerDashboard() {
    const { isLoaded, isSignedIn, user } = useUser();
    const [savedTrips, setSavedTrips] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isDeleting, setIsDeleting] = useState(null);
    const [copiedId, setCopiedId] = useState(null);

    useEffect(() => {
        async function fetchTrips() {
            if (isSignedIn) {
                try {
                    const trips = await getUserTrips();
                    const formatted = trips.map(t => ({ db_id: t.id, ...t.itinerary_data }));
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

    return (
        <div className="w-full min-h-screen bg-[#FAF8F5] text-[#1F1F1F] flex flex-col pt-24 sm:pt-32 px-6 lg:px-12">
            <Header />
            
            <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col pb-20 mt-8">
                {/* Dashboard Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <h1 className="font-sans font-extrabold text-3xl md:text-4xl tracking-tight mb-2">
                            Your Planning Sessions
                        </h1>
                        <p className="font-mono text-[11px] md:text-sm tracking-wide text-[#8CA3A8] uppercase">
                            Manage and review your AI trip drafts
                        </p>
                    </div>
                    
                    <a 
                        href="/ai-planner/new"
                        className="group relative px-6 py-3.5 bg-[#FF6B2C] hover:bg-[#FF8A4C] text-white font-bold text-[12px] rounded-2xl transition-all duration-300 uppercase tracking-[0.15em] flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(255,107,44,0.25)] hover:shadow-[0_12px_24px_rgba(255,107,44,0.35)] shrink-0"
                    >
                        <Plus size={16} />
                        New Trip
                    </a>
                </div>

                {/* Empty State / Grid */}
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center min-h-[400px]">
                        <Loader2 className="w-8 h-8 text-[#FF6B2C] animate-spin" />
                    </div>
                ) : savedTrips.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-3xl border border-[#ECE8E2] border-dashed p-12 text-center min-h-[400px]">
                        <div className="w-20 h-20 bg-[#F7F5F2] rounded-full flex items-center justify-center mb-6 shadow-sm">
                            <Compass size={32} className="text-[#8CA3A8]" />
                        </div>
                        <h3 className="font-sans font-bold text-xl text-[#1F1F1F] mb-3">No active trips yet</h3>
                        <p className="text-[#8CA3A8] max-w-md mx-auto mb-8 leading-relaxed">
                            You haven't started planning any trips. Click the button below to generate your first personalized AI-powered itinerary.
                        </p>
                        <a 
                            href="/ai-planner/new"
                            className="px-6 py-3 bg-[#F7F5F2] hover:bg-[#ECE8E2] text-[#1F1F1F] font-bold text-[11px] rounded-full transition-colors uppercase tracking-[0.1em]"
                        >
                            Start Planning
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {savedTrips.map((trip, idx) => (
                            <a 
                                key={idx} 
                                href={`/ai-planner/new?action=view&trip_id=${trip.db_id}`} 
                                className="group flex flex-col bg-white rounded-3xl border border-[#ECE8E2] shadow-[0_12px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden cursor-pointer relative"
                            >
                                <div className="h-32 bg-[#F7F5F2] relative overflow-hidden flex items-center justify-center border-b border-[#ECE8E2]">
                                    {/* Abstract shapes or placeholder image for trip */}
                                    <Compass size={40} className="text-[#8CA3A8] opacity-20" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                    <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                                        <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[10px] font-bold tracking-wider text-[#1F1F1F] uppercase shadow-sm">
                                            {trip.days?.length || 0} Days
                                        </span>
                                    </div>

                                    {/* Quick Actions (Hover) */}
                                    <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <button 
                                            onClick={(e) => handleShare(e, trip.db_id)}
                                            className="p-2 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full text-[#1F1F1F] shadow-sm transition-transform hover:scale-110"
                                            title="Share Trip"
                                        >
                                            {copiedId === trip.db_id ? <Check size={14} className="text-green-600" /> : <Share2 size={14} />}
                                        </button>
                                        <button 
                                            onClick={(e) => handleDelete(e, trip.db_id)}
                                            disabled={isDeleting === trip.db_id}
                                            className="p-2 bg-white/90 hover:bg-red-50 backdrop-blur-sm rounded-full text-red-600 shadow-sm transition-transform hover:scale-110 disabled:opacity-50"
                                            title="Delete Trip"
                                        >
                                            {isDeleting === trip.db_id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="p-5 flex flex-col flex-1">
                                    <h3 className="font-sans font-bold text-lg text-[#1F1F1F] mb-1 line-clamp-1">
                                        {trip.destinationName || "Draft Trip"}
                                    </h3>
                                    <p className="text-sm text-[#8CA3A8] mb-4 line-clamp-2">
                                        {trip.days?.[0]?.description || "AI-generated personalized itinerary."}
                                    </p>
                                    <div className="mt-auto flex items-center justify-between text-[11px] font-bold text-[#FF6B2C] uppercase tracking-[0.1em]">
                                        <span>View Itinerary</span>
                                        <ArrowRight size={14} className="transform transition-transform group-hover:translate-x-1" />
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
