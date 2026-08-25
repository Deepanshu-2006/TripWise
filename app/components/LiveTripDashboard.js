'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Check, ChevronDown } from 'lucide-react';

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

const getCoordinatesForDestination = (name) => {
  if (!name || typeof name !== 'string') return { lat: 28.6139, lng: 77.2090 };
  const lower = name.toLowerCase();
  if (lower.includes("kyoto")) return { lat: 35.0116, lng: 135.7681 };
  if (lower.includes("rome")) return { lat: 41.9028, lng: 12.4964 };
  if (lower.includes("tokyo")) return { lat: 35.6762, lng: 139.6503 };
  if (lower.includes("swiss") || lower.includes("alps")) return { lat: 46.8182, lng: 8.2275 };
  if (lower.includes("london")) return { lat: 51.5074, lng: -0.1278 };
  if (lower.includes("paris")) return { lat: 48.8566, lng: 2.3522 };
  if (lower.includes("argentina") || lower.includes("patagonia") || lower.includes("buenos")) return { lat: -34.6037, lng: -58.3816 };
  if (lower.includes("delhi") || lower.includes("india") || lower.includes("khan market") || lower.includes("janpath") || lower.includes("cp")) return { lat: 28.6139, lng: 77.2090 };
  if (lower.includes("new york") || lower.includes("nyc")) return { lat: 40.7128, lng: -74.0060 };
  if (lower.includes("barcelona")) return { lat: 41.3879, lng: 2.1699 };
  if (lower.includes("dubai")) return { lat: 25.2048, lng: 55.2708 };
  return { lat: 28.6139, lng: 77.2090 };
};

export default function LiveTripDashboard({
  destination = "Global View",
  itinerary,
  isGenerating,
  selectedDayIndex: propSelectedDayIndex = null,
  onSelectDay = null,
  hoveredStopIdx: propHoveredStopIdx = null,
  onHoverStop = null,
  selectedStopIdx: propSelectedStopIdx = null,
  onSelectStop = null,
  onSelectPrompt,
  tripId
}) {
  const [internalSelectedDayIndex, setInternalSelectedDayIndex] = useState(0);
  const [internalSelectedStopIdx, setInternalSelectedStopIdx] = useState(null);
  const selectedDayIndex = propSelectedDayIndex !== undefined ? propSelectedDayIndex : internalSelectedDayIndex;
  const selectedStopIdx = propSelectedStopIdx !== undefined ? propSelectedStopIdx : internalSelectedStopIdx;
  const setSelectedDayIndex = (idx) => {
    if (onSelectDay) onSelectDay(idx);
    setInternalSelectedDayIndex(idx);
  };
  const setSelectedStopIdx = (idx) => {
    if (onSelectStop) onSelectStop(idx);
    setInternalSelectedStopIdx(idx);
  };

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'activities'
  const [showDayMenu, setShowDayMenu] = useState(false);
  const [internalHoveredStopIdx, setInternalHoveredStopIdx] = useState(null);
  const hoveredStopIdx = propHoveredStopIdx !== undefined ? propHoveredStopIdx : internalHoveredStopIdx;
  const setHoveredStopIdx = (idx) => {
    if (onHoverStop) onHoverStop(idx);
    setInternalHoveredStopIdx(idx);
  };

  useEffect(() => {
    if (propSelectedDayIndex !== undefined) setInternalSelectedDayIndex(propSelectedDayIndex);
  }, [propSelectedDayIndex]);

  useEffect(() => {
    if (propSelectedStopIdx !== undefined) setInternalSelectedStopIdx(propSelectedStopIdx);
  }, [propSelectedStopIdx]);

  useEffect(() => {
    if (propHoveredStopIdx !== undefined) setInternalHoveredStopIdx(propHoveredStopIdx);
  }, [propHoveredStopIdx]);
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
  
  // Resolve valid coordinates, falling back to destination map coordinates if invalid (e.g. 0,0, NaN, or string)
  const isInvalidCoords = (coords) => {
    if (!coords || typeof coords !== 'object') return true;
    const lat = typeof coords.lat === 'number' ? coords.lat : parseFloat(coords.lat);
    const lng = typeof coords.lng === 'number' ? coords.lng : parseFloat(coords.lng);
    if (isNaN(lat) || isNaN(lng) || !Number.isFinite(lat) || !Number.isFinite(lng)) return true;
    if (lat === 0 && lng === 0) return true;
    return false;
  };

  const safeDestCoords = getCoordinatesForDestination(displayDest);
  const safeCoordinates = !isInvalidCoords(itinerary?.coordinates) 
    ? { lat: parseFloat(itinerary.coordinates.lat), lng: parseFloat(itinerary.coordinates.lng) }
    : safeDestCoords;

  const routeActivities = activities.map((act, index) => {
    let actCoords = act.coordinates || (typeof act.location === 'object' ? act.location?.coordinates : null);
    let actLocationName = typeof act.location === 'object' ? (act.location?.name || '') : act.location;

    if (isInvalidCoords(actCoords)) {
      // Synthesize realistic coordinates around the basecamp so the map can draw a route
      const angle = (index / Math.max(1, activities.length)) * Math.PI * 2;
      const radius = 0.005 + (index * 0.001); // Roughly 500m - 1km radius
      return {
        ...act,
        location: actLocationName || act.title,
        coordinates: {
          lat: safeCoordinates.lat + (Math.sin(angle) * radius),
          lng: safeCoordinates.lng + (Math.cos(angle) * radius)
        }
      };
    }
    return {
      ...act,
      location: actLocationName || act.title,
      coordinates: {
        lat: typeof actCoords.lat === 'number' ? actCoords.lat : parseFloat(actCoords.lat),
        lng: typeof actCoords.lng === 'number' ? actCoords.lng : parseFloat(actCoords.lng)
      }
    };
  });

  return (
    <div className="w-full h-full bg-[#FFFFFF] text-[#1F1F1F] relative overflow-hidden flex flex-col p-0 md:p-5 select-none transition-colors duration-500">
      {/* Post-Generation / Loaded Dashboard View */}
      {itinerary && !isGenerating && (
          <div className="w-full h-full flex flex-col flex-1 min-h-0 animate-fade-in relative z-10">
            {/* Desktop Clean Minimal Header Strip */}
            <div className="hidden md:flex items-center justify-between shrink-0 mb-2.5 md:mb-3 gap-2">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                {/* Clean Destination Badge */}
                <div className="flex items-center gap-1.5 bg-[#FFFFFF] px-3 py-1 rounded-2xl border border-[#ECE8E2] shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all duration-300">
                  <span className="text-xs">📍</span>
                  <span className="text-xs font-semibold text-[#1F1F1F] tracking-tight">
                    {displayDest.replace(/\s*\(\s*Demo Mode\s*\)/i, '').trim()}
                  </span>
                </div>

                {/* Day selector dropdown/pill */}
                {itinerary && itinerary.days && itinerary.days.length > 0 ? (
                  <div className="relative group/day">
                    <button
                      type="button"
                      onClick={() => setShowDayMenu(!showDayMenu)}
                      className="flex items-center gap-1.5 bg-[#FF6B2C]/10 hover:bg-[#FF6B2C]/16 text-[#FF6B2C] px-3 py-1 rounded-2xl border border-[#FF6B2C]/30 transition-all duration-250 cursor-pointer shadow-[0_4px_16px_rgba(255,107,44,0.08)] hover:scale-[1.02]"
                    >
                      {(() => {
                        const rawLabel = currentDay?.dateLabel || `Day ${selectedDayIndex + 1}`;
                        const parts = rawLabel.split(/\s*[-:|]\s*/);
                        const dayNum = /^Day\s*\d+/i.test(parts[0]) ? parts[0].trim() : `Day ${selectedDayIndex + 1}`;
                        let subtitle = parts.length > 1 ? parts.slice(1).join(' ').replace(/Treasures|Vibe|Tour|Exploration|Highlights/gi, '').replace(/\s+/g, ' ').replace(/\s+&\s+$/, '').trim() : null;
                        if (!subtitle && parts.length > 1) subtitle = parts.slice(1).join(' ').trim();
                        return (
                          <>
                            <span className="text-xs font-bold tracking-tight">{dayNum}</span>
                            <ChevronDown size={13} strokeWidth={2.5} className={`transition-transform duration-200 ${showDayMenu ? 'rotate-180' : ''}`} />
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
                    </button>

                    {/* Custom Premium Day Picker Dropdown Menu */}
                    {showDayMenu && itinerary.days && itinerary.days.length > 0 && (
                      <>
                        <div 
                          className="fixed inset-0 z-50 bg-black/10 backdrop-blur-xs" 
                          onClick={() => setShowDayMenu(false)} 
                        />
                        <div className="absolute top-full left-0 mt-2 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.14)] border border-stone-200/80 p-1.5 w-72 max-w-[85vw] max-h-[55vh] overflow-y-auto custom-scrollbar flex flex-col gap-1 z-60 animate-in fade-in zoom-in-95 duration-150">
                          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                            Select Day
                          </div>
                          {itinerary.days.map((d, idx) => {
                            const isCurrent = (selectedDayIndex || 0) === idx;
                            const rawLabel = d.dateLabel || `Day ${idx + 1}`;
                            const parts = rawLabel.split(/\s*[-:|]\s*/);
                            const dayNum = /^Day\s*\d+/i.test(parts[0]) ? parts[0].trim() : `Day ${idx + 1}`;
                            let subtitle = parts.length > 1 ? parts.slice(1).join(' ').trim() : null;

                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setShowDayMenu(false);
                                  setSelectedDayIndex(idx);
                                  if (onSelectDay) onSelectDay(idx);
                                }}
                                className={`w-full flex items-center justify-between gap-2 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                                  isCurrent
                                    ? 'bg-[#FFF2EA] text-[#EC6735] font-bold shadow-2xs'
                                    : 'hover:bg-stone-100 text-stone-700 font-medium'
                                }`}
                              >
                                <div className="flex flex-col min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs ${isCurrent ? 'font-black text-[#EC6735]' : 'font-bold text-stone-900'}`}>
                                      {dayNum}
                                    </span>
                                    {d.activities?.length > 0 && (
                                      <span className="text-[10px] text-stone-400 font-medium">
                                        • {d.activities.length} stops
                                      </span>
                                    )}
                                  </div>
                                  {subtitle && (
                                    <span className={`text-[11px] truncate leading-tight mt-0.5 ${isCurrent ? 'text-[#EC6735]/80' : 'text-stone-500'}`}>
                                      {subtitle}
                                    </span>
                                  )}
                                </div>
                                {isCurrent && (
                                  <div className="w-5 h-5 rounded-full bg-[#EC6735] text-white flex items-center justify-center shrink-0">
                                    <Check size={12} strokeWidth={3} />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
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
            <div className="w-full flex-1 min-h-0">
              <InteractiveRouteMap
                activities={routeActivities}
                allDays={itinerary?.days || []}
                selectedDayIndex={selectedDayIndex || 0}
                onSelectDay={setSelectedDayIndex}
                destinationName={displayDest}
                coordinates={safeCoordinates}
                basecampHotel={itinerary?.basecampHotelDetails || itinerary?.basecampHotel || itinerary?.preferences?.basecamp}
                hoveredStopIdx={hoveredStopIdx}
                onHoverStop={setHoveredStopIdx}
                selectedStopIdx={selectedStopIdx}
                onSelectStop={setSelectedStopIdx}
                tripId={tripId}
              />
            </div>
          </div>
        )}

      {/* Cinematic Globe Overlay (Renders on top during generation and transition) */}
      {(isGenerating || !itinerary || isTransitioning) && (
        <div 
          className={`absolute inset-0 bg-[#FFFFFF] z-50 flex items-center justify-center transition-all duration-1000 ease-in-out transform-gpu ${
            isFadingOutGlobe 
              ? 'opacity-0 scale-[1.5] pointer-events-none' 
              : 'opacity-100 scale-100'
          } ${
            isTransitioning || isGenerating ? 'pointer-events-none' : 'pointer-events-auto'
          }`}
        >
          <div className="w-full h-full flex items-center justify-center">
            <InteractiveGlobe
              isGenerating={isGenerating}
              isTransitioning={isTransitioning}
              activeStepText={GENERATION_STEPS[activeStepIndex]}
              destinationName={displayDest}
              targetCoordinates={safeCoordinates}
              onSelectPrompt={onSelectPrompt}
            />
          </div>
        </div>
      )}
    </div>
  );
}
