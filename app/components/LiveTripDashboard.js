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
  selectedDayIndex: propSelectedDayIndex = null,
  onSelectDay = null,
  hoveredStopIdx: propHoveredStopIdx = null,
  onHoverStop = null,
  onSelectPrompt
}) {
  const [internalSelectedDayIndex, setInternalSelectedDayIndex] = useState(0);
  const selectedDayIndex = propSelectedDayIndex !== null ? propSelectedDayIndex : internalSelectedDayIndex;
  const setSelectedDayIndex = (idx) => {
    if (onSelectDay) onSelectDay(idx);
    setInternalSelectedDayIndex(idx);
  };

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'activities'
  const [internalHoveredStopIdx, setInternalHoveredStopIdx] = useState(null);
  const hoveredStopIdx = propHoveredStopIdx !== null ? propHoveredStopIdx : internalHoveredStopIdx;
  const setHoveredStopIdx = (idx) => {
    if (onHoverStop) onHoverStop(idx);
    setInternalHoveredStopIdx(idx);
  };
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFadingOutGlobe, setIsFadingOutGlobe] = useState(false);
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
      setIsFadingOutGlobe(false);

      // At 750ms: begin smooth cinematic cross-fade from 3D Globe into pre-loaded 2D Route Map
      const fadeTimer = setTimeout(() => {
        setIsFadingOutGlobe(true);
      }, 750);

      // At 1600ms: transition complete, unmount globe overlay cleanly
      const endTimer = setTimeout(() => {
        setIsTransitioning(false);
        setIsFadingOutGlobe(false);
      }, 1600);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(endTimer);
      };
    }
    prevIsGeneratingRef.current = isGenerating;
  }, [isGenerating, itinerary]);

  // Reset transition state if user triggers a new generation
  useEffect(() => {
    if (isGenerating) {
      setIsTransitioning(false);
      setIsFadingOutGlobe(false);
    }
  }, [isGenerating]);

  // Reset day index only when a completely new destination itinerary is generated
  const prevDestNameRef = React.useRef(itinerary?.destinationName);
  useEffect(() => {
    if (itinerary && itinerary.destinationName !== prevDestNameRef.current) {
      prevDestNameRef.current = itinerary.destinationName;
      setSelectedDayIndex(0);
    }
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
          <div className="bg-[#1C1B1B] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide shadow-sm flex items-center gap-1.5">
            <span>⚡</span>
            <span>{isGenerating ? 'Satellite Triangulation' : isTransitioning ? 'Target Lock' : itinerary ? 'AI Optimized Route' : 'Live Radar'}</span>
          </div>
        </div>
      </div>

      {/* Main Center Dashboard Area */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center w-full max-w-4xl mx-auto py-2">
        {isGenerating || !itinerary ? (
          /* STATE 1: IDLE / HYPER-SCANNING DURING GENERATION */
          <InteractiveGlobe
            isGenerating={isGenerating}
            isTransitioning={false}
            activeStepText={GENERATION_STEPS[activeStepIndex]}
            destinationName={displayDest}
            targetCoordinates={itinerary?.coordinates || { lat: 35.0116, lng: 135.7681 }}
          />
        ) : (
          /* STATE 2: GENERATED ITINERARY VIEW (MOUNTED IMMEDIATELY UNDERNEATH DURING TRANSITION FOR 0-LAG TILE LOAD) */
          <div className="relative w-full flex flex-col gap-4 animate-fade-in">
            {/* Cinematic 3D Globe Overlay during Target Lock Phase */}
            {isTransitioning && (
              <div
                className={`absolute inset-0 z-40 flex items-center justify-center bg-[#FFF8F5]/95 backdrop-blur-xs rounded-3xl transition-all duration-800 ease-in-out pointer-events-none ${
                  isFadingOutGlobe ? 'opacity-0 scale-110' : 'opacity-100 scale-100'
                }`}
              >
                <InteractiveGlobe
                  isGenerating={false}
                  isTransitioning={true}
                  activeStepText="Target Locked!"
                  destinationName={displayDest}
                  targetCoordinates={itinerary.coordinates || { lat: 35.0116, lng: 135.7681 }}
                />
              </div>
            )}

            {/* Clean Day Label Badge above map */}
            <div className={`flex items-center justify-between border-b border-[rgba(28,27,27,0.08)] pb-2.5 transition-opacity duration-800 ${
              isTransitioning && !isFadingOutGlobe ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-[#1C1B1B]">📍 Day Route Map</span>
                <span className="text-xs font-bold text-[#EC6735] bg-[#FFF2EA] px-2.5 py-0.5 rounded-md">
                  ✨ {currentDay?.dateLabel || `Day ${selectedDayIndex + 1}`}
                </span>
              </div>
              <div className="text-[11px] font-bold text-[#8CA3A8] hidden sm:block">
                ⚡ Hover stops on left or pins on map to sync
              </div>
            </div>

            {/* Content: Route Map */}
            <div className={`w-full transition-all duration-800 ${
              isTransitioning && !isFadingOutGlobe ? 'opacity-0 pointer-events-none scale-98' : 'opacity-100'
            }`}>
              <InteractiveRouteMap
                activities={activities}
                allDays={itinerary.days || []}
                selectedDayIndex={selectedDayIndex || 0}
                destinationName={displayDest}
                coordinates={itinerary.coordinates || { lat: 41.9028, lng: 12.4964 }}
                hoveredStopIdx={hoveredStopIdx}
                onHoverStop={setHoveredStopIdx}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
