'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const InteractiveRouteMap = dynamic(() => import('./InteractiveRouteMap'), {
  ssr: false,
  loading: () => (
    <div className="relative w-full h-80 md:h-96 rounded-3xl overflow-hidden border border-stone-200 shadow-md bg-stone-100 flex flex-col items-center justify-center text-center p-6">
      <div className="w-8 h-8 rounded-full border-2 border-dashed border-[#FF6B35] animate-spin mb-3" />
      <span className="text-xs font-extrabold text-stone-700">Loading Interactive Route Map...</span>
    </div>
  )
});

const InteractiveGlobe = dynamic(() => import('./InteractiveGlobe'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 sm:h-96 flex flex-col items-center justify-center bg-stone-100/80 rounded-3xl animate-pulse p-6">
      <div className="w-12 h-12 rounded-full border-4 border-dashed border-[#FF6B35] animate-spin mb-4" />
      <span className="text-xs font-black text-stone-700 uppercase tracking-wider">Loading 3D TripWise Globe...</span>
    </div>
  )
});

const GENERATION_STEPS = [
  "🛰️ Triangulating optimal GPS coordinates & scenic routes...",
  "🍝 Scanning local dining gems & Michelin recommendations...",
  "🚶 Calculating walking transit times & crowd density windows...",
  "✨ Finalizing your custom AI itinerary schedule..."
];

export default function LiveTripDashboard({
  destination = "Global View",
  itinerary,
  isGenerating,
  onSelectPrompt
}) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'activities'
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevIsGeneratingRef = React.useRef(isGenerating);

  // Cycle generation status messages
  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setActiveStepIndex((prev) => (prev + 1) % GENERATION_STEPS.length);
    }, 1400);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Handle camera plunge target lock right after trip generation completes
  useEffect(() => {
    if (prevIsGeneratingRef.current && !isGenerating && itinerary) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 1800); // 1.8 seconds of cinematic globe target lock camera plunge!
      return () => clearTimeout(timer);
    }
    prevIsGeneratingRef.current = isGenerating;
  }, [isGenerating, itinerary]);

  // Reset transition state if user triggers a new generation
  useEffect(() => {
    if (isGenerating) {
      setIsTransitioning(false);
    }
  }, [isGenerating]);

  // Reset day index when new itinerary arrives
  useEffect(() => {
    setSelectedDayIndex(0);
  }, [itinerary]);

  const displayDest = itinerary?.destinationName || destination || "Global View";
  const currentDay = itinerary?.days?.[selectedDayIndex] || null;
  const activities = currentDay?.activities || [];

  return (
    <div className="w-full h-full bg-[#FFF8F5] relative overflow-hidden flex flex-col justify-between p-6 md:p-8 select-none border-l border-[rgba(28,27,27,0.08)]">
      {/* Subtle Grid & Topographic Texture */}
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
        backgroundImage: `radial-gradient(#EC6735 1.5px, transparent 1.5px), radial-gradient(#8CA3A8 1px, transparent 1px)`,
        backgroundSize: '32px 32px, 64px 64px',
        backgroundPosition: '0 0, 16px 16px'
      }} />

      {/* Top Bar: Telemetry & Controls */}
      <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
        <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-full border border-[rgba(28,27,27,0.1)] flex items-center gap-2.5 text-xs font-bold text-[#1C1B1B] shadow-sm">
          <span className={`w-2.5 h-2.5 rounded-full ${isGenerating ? 'bg-[#EC6735] animate-ping' : 'bg-[#0D9488] animate-pulse'}`} />
          <span className="tracking-wide">TripWise GeoEngine v2.5</span>
          <span className="text-[#8CA3A8]">|</span>
          <span className="text-[#EC6735] truncate max-w-48 sm:max-w-xs">{displayDest}</span>
        </div>

        <div className="flex items-center gap-2">
          {itinerary && !isTransitioning && !isGenerating && (
            <div className="flex bg-white/90 backdrop-blur-md p-1 rounded-xl border border-[rgba(28,27,27,0.1)] shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab('map')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'map' ? 'bg-[#EC6735] text-white shadow-xs' : 'text-[#4B4745] hover:text-[#1C1B1B]'
                  }`}
              >
                🗺️ Route Map
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('activities')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'activities' ? 'bg-[#EC6735] text-white shadow-xs' : 'text-[#4B4745] hover:text-[#1C1B1B]'
                  }`}
              >
                📋 Day Schedule
              </button>
            </div>
          )}

          <div className="bg-[#1C1B1B] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide shadow-sm flex items-center gap-1.5">
            <span>⚡</span>
            <span>{isGenerating ? 'Satellite Triangulation' : isTransitioning ? 'Target Lock' : itinerary ? 'AI Optimized' : 'Live Radar'}</span>
          </div>
        </div>
      </div>

      {/* Main Center Dashboard Area */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center w-full max-w-4xl mx-auto py-2">
        {isGenerating || isTransitioning || !itinerary ? (
          /* STATE: 3D GLOBE (IDLE / HYPER-SCANNING DURING GENERATION / TARGET LOCK CAMERA PLUNGE) */
          <InteractiveGlobe
            isGenerating={isGenerating}
            isTransitioning={isTransitioning}
            activeStepText={GENERATION_STEPS[activeStepIndex]}
            destinationName={displayDest}
            targetCoordinates={itinerary?.coordinates || { lat: 35.0116, lng: 135.7681 }}
          />
        ) : (
          /* STATE: GENERATED ITINERARY VIEW */
          <div className="w-full flex flex-col gap-5 animate-fade-in">
            {/* Day Selector Tabs */}
            <div className="flex items-center justify-between border-b border-[rgba(28,27,27,0.1)] pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {itinerary.days?.map((day, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDayIndex(idx)}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${selectedDayIndex === idx
                      ? 'bg-[#1C1B1B] text-white shadow-md scale-[1.02]'
                      : 'bg-white text-[#4B4745] hover:bg-[#FFFDFB] border border-[rgba(28,27,27,0.1)]'
                      }`}
                  >
                    <span>Day {day.dayNumber || idx + 1}</span>
                  </button>
                ))}
              </div>

              <div className="text-xs font-bold text-[#4B4745] bg-white px-3 py-1.5 rounded-lg border border-[rgba(28,27,27,0.08)] shadow-2xs">
                ✨ {currentDay?.dateLabel || `Day ${selectedDayIndex + 1}`}
              </div>
            </div>

            {/* Content: Either Route Map or Activity Cards */}
            {activeTab === 'map' ? (
              <InteractiveRouteMap
                activities={activities}
                destinationName={displayDest}
                coordinates={itinerary.coordinates || { lat: 41.9028, lng: 12.4964 }}
              />
            ) : (
              /* Day Schedule Cards */
              <div className="w-full h-80 md:h-96 overflow-y-auto pr-2 flex flex-col gap-3">
                {activities.map((act, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-2xl border border-[rgba(28,27,27,0.1)] shadow-2xs hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#FFF2EA] text-[#EC6735] font-black text-sm flex items-center justify-center shrink-0 border border-[#EC6735]/20">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-[#EC6735]">{act.time}</span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-[#F5ECE6] text-[#4B4745] uppercase tracking-wider">
                            {act.badge || act.category || 'Highlight'}
                          </span>
                        </div>
                        <h4 className="text-sm md:text-base font-extrabold text-[#1C1B1B] mt-1">{act.title}</h4>
                        <p className="text-xs text-[#4B4745] mt-1 leading-relaxed">{act.description}</p>
                      </div>
                    </div>

                    <div className="shrink-0 self-end sm:self-center">
                      <span className="text-xs font-bold text-[#0D9488] bg-[#0D9488]/10 px-3 py-1.5 rounded-lg border border-[#0D9488]/20">
                        📍 View Map Pin
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
