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
    <div className="w-full h-full bg-[#FFFFFF] text-[#1F1F1F] relative overflow-hidden flex flex-col justify-between p-4 md:p-5 select-none transition-colors duration-500">
      {/* Main Container */}
      <div className="w-full h-full flex flex-col relative z-10 min-h-0">
        {/* Cinematic Globe Overlay during generation */}
        {isGenerating || !itinerary || (isTransitioning && !isFadingOutGlobe) ? (
          <div className="w-full h-full flex-1 min-h-0 flex items-center justify-center animate-fade-in">
            <InteractiveGlobe
              isGenerating={isGenerating}
              isTransitioning={isTransitioning}
              activeStepText={GENERATION_STEPS[activeStepIndex]}
              destinationName={displayDest}
              targetCoordinates={itinerary?.coordinates || { lat: 41.9028, lng: 12.4964 }}
            />
          </div>
        ) : null}

        {/* Post-Generation / Loaded Dashboard View */}
        {(itinerary && !isGenerating && (!isTransitioning || isFadingOutGlobe)) && (
          <div className="w-full h-full flex flex-col flex-1 min-h-0 animate-fade-in relative z-10">
            {/* Cinematic Camera Plunge Overlay */}
            {isTransitioning && isFadingOutGlobe && (
              <div className="absolute inset-0 z-50 pointer-events-none animate-fade-out">
                <InteractiveGlobe
                  isGenerating={false}
                  isTransitioning={true}
                  activeStepText="Target Locked!"
                  destinationName={displayDest}
                  targetCoordinates={itinerary?.coordinates || { lat: 35.0116, lng: 135.7681 }}
                />
              </div>
            )}

            {/* Single Clean Minimal Header Strip */}
            <div className={`flex items-center justify-between shrink-0 mb-2.5 md:mb-3 transition-opacity duration-800 ${
              isTransitioning && !isFadingOutGlobe ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Clean Destination Badge */}
                <div className="flex items-center gap-1.5 bg-[#FFFFFF] px-3 py-1 rounded-2xl border border-[#ECE8E2] shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_6px_20px_rgba(0,0,0,0.07)]">
                  <span className="text-xs">📍</span>
                  <span className="text-xs font-semibold text-[#1F1F1F] tracking-tight">
                    {displayDest.replace(/\s*\(\s*Demo Mode\s*\)/i, '').trim()}
                  </span>
                </div>

                {/* Day selector dropdown/pill */}
                {itinerary && itinerary.days && itinerary.days.length > 0 ? (
                  <div className="relative group/day">
                    <div className="flex items-center gap-1.5 bg-[#FF6B2C]/10 hover:bg-[#FF6B2C]/16 text-[#FF6B2C] px-3 py-1 rounded-2xl border border-[#FF6B2C]/30 transition-all duration-250 cursor-pointer shadow-[0_4px_16px_rgba(255,107,44,0.08)] hover:scale-[1.02]">
                      {(() => {
                        const rawLabel = currentDay?.dateLabel || `Day ${selectedDayIndex + 1}`;
                        const parts = rawLabel.split(/\s*[-:|]\s*/);
                        const dayNum = /^Day\s*\d+/i.test(parts[0]) ? parts[0].trim() : `Day ${selectedDayIndex + 1}`;
                        let subtitle = parts.length > 1 ? parts.slice(1).join(' ').replace(/Treasures|Vibe|Tour|Exploration|Highlights/gi, '').replace(/\s+/g, ' ').replace(/\s+&\s+$/, '').trim() : null;
                        if (!subtitle && parts.length > 1) subtitle = parts.slice(1).join(' ').trim();
                        return (
                          <>
                            <span className="text-xs font-bold tracking-tight">{dayNum} ▼</span>
                            {subtitle && (
                              <>
                                <span className="text-[#FF6B2C]/40 font-light">•</span>
                                <span className="text-xs font-medium text-[#6B6B6B] tracking-tight truncate max-w-40 sm:max-w-52.5">
                                  {subtitle}
                                </span>
                              </>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    
                    <select
                      value={selectedDayIndex}
                      onChange={(e) => {
                        const newIdx = parseInt(e.target.value, 10);
                        setSelectedDayIndex(newIdx);
                        if (onSelectDay) onSelectDay(newIdx);
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
                      title={currentDay?.dateLabel || `Day ${selectedDayIndex + 1}`}
                    >
                      {itinerary.days.map((d, idx) => (
                        <option key={idx} value={idx} className="bg-white text-[#1F1F1F] font-bold">
                          {d.dateLabel || `Day ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-[#FF6B2C] bg-[#FFF2EA] px-3 py-1 rounded-2xl border border-[#FFDBC8]">
                    Day {selectedDayIndex + 1}
                  </span>
                )}
              </div>

              {/* AI Badge as an active breathing system status in pure light theme */}
              <div className="flex items-center gap-2">
                <div className="relative group overflow-hidden bg-[#FFFFFF] text-[#1F1F1F] px-3.5 py-1.5 rounded-2xl text-xs font-bold shadow-[0_4px_16px_rgba(255,107,44,0.12)] flex items-center gap-1.5 border border-[#ECE8E2] transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:shadow-[0_6px_24px_rgba(255,107,44,0.22)] hover:border-[#FF6B2C]/40 cursor-default">
                  {/* Gentle shimmer overlay */}
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_3.5s_infinite_ease-in-out] pointer-events-none" />
                  <span className="text-[#FF6B2C] animate-pulse inline-block text-xs font-black">⚡</span>
                  <span className="tracking-tight font-bold text-[#1F1F1F]">AI Optimized</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2FA66A] animate-ping ml-0.5" />
                </div>
              </div>
            </div>

            {/* Content: Route Map filling exact remaining vertical space */}
            <div className={`w-full flex-1 min-h-0 transition-all duration-800 ${
              isTransitioning && !isFadingOutGlobe ? 'opacity-0 pointer-events-none scale-98' : 'opacity-100'
            }`}>
              <InteractiveRouteMap
                activities={activities}
                allDays={itinerary?.days || []}
                selectedDayIndex={selectedDayIndex || 0}
                destinationName={displayDest}
                coordinates={itinerary?.coordinates || { lat: 41.9028, lng: 12.4964 }}
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
