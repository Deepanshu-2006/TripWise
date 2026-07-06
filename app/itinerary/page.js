'use client';

import React, { useState, useEffect } from 'react';
import Header from '../components/Header';

export default function ItineraryPage() {
  const [itinerary, setItinerary] = useState(null);
  const [activeDay, setActiveDay] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('tripwise_itinerary');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setItinerary(parsed);
            if (parsed.days && parsed.days.length > 0) {
              setActiveDay(parsed.days[0].dayNumber || 1);
            }
          } catch (err) {
            console.error("Failed to parse stored itinerary:", err);
          }
        }
        setLoading(false);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F5] text-[#1C1B1B] flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 rounded-full border-4 border-[#EC6735] border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-bold text-[#5F5E5A] uppercase tracking-wider">Loading your AI Itinerary...</p>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="min-h-screen bg-[#FFF8F5] text-[#1C1B1B] flex flex-col justify-between font-sans">
        <Header />
        <div className="max-w-xl mx-auto px-6 py-32 text-center my-auto">
          <div className="w-16 h-16 rounded-2xl bg-[#FCE8E1] text-[#EC6735] flex items-center justify-center mx-auto mb-6 text-2xl shadow-sm">
            🗺️
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-3">No Itinerary Found</h1>
          <p className="text-sm text-[#5F5E5A] leading-relaxed mb-8">
            You haven&apos;t generated a custom trip yet! Head over to the AI Planner to craft your dream journey with Gemini 2.0 Flash.
          </p>
          <a
            href="/ai-planner"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-[#EC6735] text-white hover:opacity-90 transition-all shadow-md shadow-[#EC6735]/20"
          >
            <span>Plan My Trip with AI →</span>
          </a>
        </div>
        <footer className="py-6 text-center text-xs text-[#5F5E5A] border-t border-[rgba(28,27,27,0.08)]">
          Powered by TripWise AI &amp; Google Gemini
        </footer>
      </div>
    );
  }

  const currentDayData = itinerary.days?.find((d) => (d.dayNumber || 1) === activeDay) || itinerary.days?.[0];

  return (
    <div className="min-h-screen bg-[#FFF8F5] text-[#1C1B1B] flex flex-col font-sans selection:bg-[#EC6735]/20">
      <Header />

      {/* Hero Banner */}
      <section className="pt-28 pb-12 px-6 border-b border-[rgba(28,27,27,0.08)] bg-linear-to-b from-[#FFF2EA] to-[#FFF8F5] relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <a
              href="/ai-planner"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#EC6735] hover:underline uppercase tracking-wider"
            >
              ← Back to AI Planner
            </a>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#E1EEEB] text-[#0F6E56] text-xs font-bold font-mono uppercase tracking-wider">
                ⚡ Gemini 2.0 Flash
              </span>
              <span className="px-3 py-1 rounded-full bg-[#FCE8E1] text-[#EC6735] text-xs font-bold font-mono uppercase tracking-wider">
                Est. Cost: {itinerary.estimatedCost || 'Standard'}
              </span>
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-[#180F0F] leading-none mb-4">
            {itinerary.destinationName || 'Your Custom Journey'}
          </h1>
          <p className="text-base md:text-lg text-[#5F5E5A] font-medium max-w-2xl leading-relaxed">
            ✨ {itinerary.tagline || 'Tailored to your exact vibe, budget, and travel pace.'}
          </p>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="max-w-5xl mx-auto px-6 py-12 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Day Selector & Stats */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[rgba(28,27,27,0.08)] shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#5F5E5A] mb-4">
              Select Day
            </h3>
            <div className="flex flex-col gap-2">
              {itinerary.days?.map((day, idx) => {
                const dayNum = day.dayNumber || idx + 1;
                const isActive = activeDay === dayNum;
                return (
                  <button
                    key={dayNum}
                    onClick={() => setActiveDay(dayNum)}
                    className={`w-full p-3.5 rounded-xl text-left font-bold transition-all flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-[#EC6735] text-white shadow-md shadow-[#EC6735]/20'
                        : 'bg-[#FFF8F5] text-[#1C1B1B] hover:bg-[#FCE8E1]/50 border border-[rgba(28,27,27,0.06)]'
                    }`}
                  >
                    <span>Day {dayNum}</span>
                    <span className={`text-xs font-normal ${isActive ? 'text-white/90' : 'text-[#5F5E5A]'}`}>
                      {day.dateLabel || `Day ${dayNum}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* GPS Coordinates Card */}
          <div className="bg-white p-6 rounded-2xl border border-[rgba(28,27,27,0.08)] shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#5F5E5A] mb-2">
              GeoEngine Routing
            </h3>
            <p className="text-xs font-mono text-[#1C1B1B] mb-3">
              Center: {itinerary.coordinates?.lat?.toFixed(4) || '41.9028'}° N, {itinerary.coordinates?.lng?.toFixed(4) || '12.4964'}° E
            </p>
            <div className="w-full h-32 rounded-xl bg-[#F5ECE6] border border-[rgba(28,27,27,0.08)] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                backgroundImage: `radial-gradient(#EC6735 1.5px, transparent 1.5px)`,
                backgroundSize: '16px 16px'
              }} />
              <div className="w-10 h-10 rounded-full bg-[#EC6735] text-white flex items-center justify-center shadow-lg z-10 animate-pulse">
                📍
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Day Timeline Activities */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="border-b border-[rgba(28,27,27,0.08)] pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-[#1C1B1B]">
                {currentDayData?.dateLabel || `Day ${activeDay}`}
              </h2>
              <p className="text-xs text-[#5F5E5A] font-medium mt-1">
                {currentDayData?.activities?.length || 0} scheduled stops &amp; activities
              </p>
            </div>
          </div>

          {/* Activity Cards List */}
          <div className="relative pl-8 flex flex-col gap-6 min-h-75">
            {/* Dotted Vertical Line Connector */}
            <div className="absolute left-2.75 top-3 bottom-3 w-0.5 bg-[#1C1B1B]/10 border-l border-dashed border-[#1C1B1B]/20" />

            {currentDayData?.activities?.map((act, idx) => {
              const isDining = act.category?.toLowerCase().includes('din') || act.title?.toLowerCase().includes('food') || act.title?.toLowerCase().includes('dinner') || act.title?.toLowerCase().includes('lunch');
              const isHotel = act.category?.toLowerCase().includes('hotel') || act.category?.toLowerCase().includes('check');
              const timeColor = isDining ? 'text-[#EC6735]' : isHotel ? 'text-green-600' : 'text-blue-600';
              const badgeBg = isDining ? 'bg-[#EC6735]/10 border-[#EC6735]/30 text-[#EC6735]' : isHotel ? 'bg-green-500/10 border-green-500/30 text-green-700' : 'bg-blue-500/10 border-blue-500/30 text-blue-700';
              const dotColor = isDining ? 'bg-[#EC6735]' : isHotel ? 'bg-green-500' : 'bg-blue-500';

              return (
                <div
                  key={idx}
                  className="relative p-6 rounded-2xl border border-[rgba(28,27,27,0.08)] bg-white shadow-sm flex flex-col md:flex-row items-start justify-between gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-[#EC6735]/30"
                >
                  {/* Step Number Dot */}
                  <div className="absolute -left-10 top-6 w-6 h-6 rounded-full bg-[#FFF8F5] border-2 border-[#1C1B1B]/20 flex items-center justify-center z-10 text-[10px] font-black shadow-sm">
                    {idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-mono font-bold leading-none ${timeColor}`}>
                        {act.time || '10:00'}
                      </span>
                      <span className="text-[10px] font-bold text-[#5F5E5A]/60 uppercase tracking-widest leading-none">
                        {act.category || 'Activity'}
                      </span>
                    </div>
                    <h4 className="text-base md:text-lg font-extrabold text-[#1C1B1B] mb-1">
                      {act.title}
                    </h4>
                    <p className="text-xs md:text-sm text-[#5F5E5A] leading-relaxed">
                      {act.description}
                    </p>
                    {act.coordinates && (
                      <span className="inline-block mt-3 text-[11px] font-mono text-[#5F5E5A]/70 bg-[#FFF8F5] px-2 py-0.5 rounded border border-[rgba(28,27,27,0.06)]">
                        📍 {act.coordinates.lat?.toFixed(4)}° N, {act.coordinates.lng?.toFixed(4)}° E
                      </span>
                    )}
                  </div>

                  {/* Custom Badge */}
                  {act.badge && (
                    <div className={`shrink-0 px-3 py-1.5 border rounded-lg font-mono text-[9px] font-bold tracking-wider uppercase select-none flex items-center gap-1.5 ${badgeBg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${dotColor}`} />
                      {act.badge}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-[#5F5E5A] border-t border-[rgba(28,27,27,0.08)] bg-white mt-auto">
        TripWise AI Planner · Powered by Google Gemini 2.0 Flash
      </footer>
    </div>
  );
}
