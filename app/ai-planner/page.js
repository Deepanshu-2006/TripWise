'use client';

import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useUser } from '@clerk/nextjs';
import { Compass, Plus, MapPin, Calendar, ArrowRight } from 'lucide-react';

export default function AIPlannerDashboard() {
    const { isLoaded, isSignedIn, user } = useUser();
    const [savedTrips, setSavedTrips] = useState([]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('tripwise_itinerary');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (parsed && parsed.destinationName) {
                        setSavedTrips([parsed]); // Mock array with one item for now
                    }
                } catch (e) {
                    console.error("Failed to parse itinerary from localStorage", e);
                }
            }
        }
    }, []);

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
                {savedTrips.length === 0 ? (
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
                                href="/ai-planner/new?action=view" 
                                className="group flex flex-col bg-white rounded-3xl border border-[#ECE8E2] shadow-[0_12px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden cursor-pointer"
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
