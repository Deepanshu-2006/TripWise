'use client';

import React, { useState } from 'react';
import PlannerSidebar from '../components/PlannerSidebar';
import Header from '../components/Header';

// Mock Map Placeholder for right 60% of split-screen (Warm Cream / Light Theme)
const MockMapView = ({ destination = "Your Destination", itinerary, isGenerating }) => {
  const displayDest = itinerary?.destinationName || destination || "Global View";
  const coords = itinerary?.coordinates || { lat: 41.9028, lng: 12.4964 };
  const activities = itinerary?.days?.[0]?.activities || [];

  return (
    <div className="w-full h-full bg-[#F5ECE6] relative overflow-hidden flex flex-col justify-between p-6 md:p-8 select-none border-l border-[rgba(28,27,27,0.08)]">
      {/* Subtle Grid / Map Texture */}
      <div className="absolute inset-0 opacity-25 pointer-events-none" style={{
        backgroundImage: `radial-gradient(#EC6735 1.5px, transparent 1.5px), radial-gradient(#EC6735 1.5px, #F5ECE6 1.5px)`,
        backgroundSize: '40px 40px',
        backgroundPosition: '0 0, 20px 20px'
      }} />

      {/* Map Header / Floating Controls */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-[rgba(28,27,27,0.1)] flex items-center gap-2 text-xs font-semibold text-[#1C1B1B] shadow-xs">
          <span className={`w-2 h-2 rounded-full ${isGenerating ? 'bg-[#EC6735] animate-ping' : 'bg-[#0F6E56] animate-pulse'}`} />
          <span>Live Interactive Map — {displayDest}</span>
        </div>

        <div className="flex gap-2">
          <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[rgba(28,27,27,0.1)] text-xs font-medium text-[#4B4745] shadow-xs">
            {itinerary ? `${itinerary.days?.length || 3} Days` : '3D View'}
          </div>
          <div className="bg-[#EC6735] text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs">
            {itinerary ? 'AI Tailored' : 'Explore'}
          </div>
        </div>
      </div>

      {/* Map Content / Pins */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <div className="w-16 h-16 rounded-full border-4 border-[#EC6735] border-t-transparent animate-spin" />
            <p className="text-sm font-bold text-[#1C1B1B] animate-pulse">
              ✨ Gemini 2.0 Flash is compiling your coordinates & route...
            </p>
          </div>
        ) : (
          <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
            {/* Animated Rings */}
            <div className="absolute inset-0 rounded-full border border-[#EC6735]/30 animate-ping opacity-40 duration-1000" />
            <div className="absolute w-48 h-48 rounded-full border border-[#EC6735]/40 flex items-center justify-center">
              {activities.length > 0 ? (
                <>
                  <div className="absolute -top-4 left-4 bg-white border border-[#EC6735] px-2.5 py-1 rounded-md text-[11px] text-[#1C1B1B] font-bold shadow-md flex items-center gap-1 max-w-40 truncate">
                    <span>📍</span>
                    <span className="truncate">{activities[0].title}</span>
                  </div>
                  {activities[1] && (
                    <div className="absolute -bottom-4 right-2 bg-white border border-[#EC6735] px-2.5 py-1 rounded-md text-[11px] text-[#1C1B1B] font-bold shadow-md flex items-center gap-1 max-w-40 truncate">
                      <span>🏛️</span>
                      <span className="truncate">{activities[1].title}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="absolute -top-3 left-6 bg-white border border-[#EC6735] px-2.5 py-1 rounded-md text-[11px] text-[#1C1B1B] font-bold shadow-md flex items-center gap-1">
                    <span>🍕</span>
                    <span>Food & Culture Stop</span>
                  </div>
                  <div className="absolute -bottom-3 right-4 bg-white border border-[#EC6735] px-2.5 py-1 rounded-md text-[11px] text-[#1C1B1B] font-bold shadow-md flex items-center gap-1">
                    <span>🏛️</span>
                    <span>Historic Landmark</span>
                  </div>
                </>
              )}
            </div>

            {/* Center Pin */}
            <div className="w-16 h-16 rounded-full bg-[#EC6735]/20 flex items-center justify-center animate-pulse">
              <div className="w-10 h-10 rounded-full bg-[#EC6735] flex items-center justify-center text-white shadow-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </div>
        )}
        <p className="text-sm font-medium text-[#4B4745] mt-4 max-w-sm">
          {itinerary ? (
            <span className="text-[#1C1B1B] font-bold">✨ {itinerary.tagline || "Custom AI Routing Calculated!"}</span>
          ) : (
            "Map visualization updates dynamically as your itinerary is calculated on the left panel."
          )}
        </p>
      </div>

      {/* Map Footer */}
      <div className="relative z-10 flex items-center justify-between text-xs font-medium text-[#4B4745]">
        <span>Coordinates: {coords.lat ? `${coords.lat.toFixed(4)}° N, ${coords.lng.toFixed(4)}° E` : "41.9028° N, 12.4964° E"}</span>
        <span>{itinerary ? `Est. Budget: ${itinerary.estimatedCost}` : 'TripWise GeoEngine v2'}</span>
      </div>
    </div>
  );
};

export default function AIPlannerPage() {
  // Demo state to allow easy verification of all flows
  const [demoMode, setDemoMode] = useState('input'); // 'input' | 'missing' | 'complete'
  const [key, setKey] = useState(0); // For resetting component state
  const [itinerary, setItinerary] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const mockInputExtracted = {
    destination: null,
    duration: null,
    budget: null,
    travelStyle: null,
    interests: []
  };

  const mockMissingExtracted = {
    destination: "Rome",
    duration: null,
    budget: null,
    travelStyle: null,
    interests: ["Foodie", "History"]
  };

  const mockCompleteExtracted = {
    destination: "Tokyo",
    duration: "7 days",
    budget: "standard",
    travelStyle: "balanced",
    interests: ["Foodie", "Nightlife", "Shopping"]
  };

  const currentExtracted = 
    demoMode === 'input' ? mockInputExtracted :
    demoMode === 'missing' ? mockMissingExtracted : mockCompleteExtracted;

  const currentPrompt = 
    demoMode === 'input' ? "" :
    demoMode === 'missing' ? "3 days in Rome... heavy on authentic local food, find hidden gems, keep it highly budget-friendly." :
    "A full week in Tokyo exploring neon nightlife, cyberpunk alleys, top shopping districts, and Michelin street ramen!";

  const handleGenerate = async (selections) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: selections.prompt || currentPrompt || "A dream vacation",
          interests: selections.interests || [],
          budget: selections.budget || 'standard',
          pace: selections.pace || 'balanced'
        })
      });
      const data = await response.json();
      if (data.success && data.itinerary) {
        setItinerary(data.itinerary);
        if (typeof window !== 'undefined') {
          localStorage.setItem('tripwise_itinerary', JSON.stringify(data.itinerary));
        }
      } else {
        console.error("API Error:", data.error);
      }
    } catch (err) {
      console.error("Error generating trip:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = (mode) => {
    setDemoMode(mode);
    setItinerary(null);
    setKey((prev) => prev + 1);
  };

  return (
    <div className="w-full h-screen min-h-160 flex flex-col bg-(--background) text-(--foreground) overflow-hidden pt-24">
      <Header />
      {/* Top Demo Bar (for review and testing) */}
      <div className="bg-[#FFF2EA] border-b border-[rgba(28,27,27,0.08)] px-6 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#EC6735] uppercase tracking-wider">
            Demo Mode Controls
          </span>
          <span className="text-xs text-[#4B4745] hidden sm:inline font-medium">
            | Switch scenarios or enter your own prompt:
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            type="button"
            onClick={() => handleReset('input')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
              demoMode === 'input'
                ? 'bg-[#EC6735] text-white shadow-xs'
                : 'bg-white text-[#1C1B1B] border border-[rgba(28,27,27,0.12)] hover:border-[#EC6735]/50'
            }`}
          >
            1. Enter Prompt (State 0)
          </button>

          <button
            type="button"
            onClick={() => handleReset('missing')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
              demoMode === 'missing'
                ? 'bg-[#EC6735] text-white shadow-xs'
                : 'bg-white text-[#1C1B1B] border border-[rgba(28,27,27,0.12)] hover:border-[#EC6735]/50'
            }`}
          >
            2. Missing Fields (State 2)
          </button>

          <button
            type="button"
            onClick={() => handleReset('complete')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
              demoMode === 'complete'
                ? 'bg-[#EC6735] text-white shadow-xs'
                : 'bg-white text-[#1C1B1B] border border-[rgba(28,27,27,0.12)] hover:border-[#EC6735]/50'
            }`}
          >
            3. All Complete (State 3)
          </button>

          <button
            type="button"
            onClick={() => setKey((prev) => prev + 1)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-[#4B4745] hover:text-[#1C1B1B] border border-[rgba(28,27,27,0.12)] transition-all cursor-pointer ml-1 shadow-2xs"
            title="Replay animation"
          >
            ↻ Replay
          </button>
        </div>
      </div>

      {/* Split-Screen Layout */}
      <div className="flex-1 flex w-full h-full overflow-hidden">
        {/* Left 40% Sidebar */}
        <div className="w-full md:w-[42%] lg:w-[40%] xl:w-[38%] h-full overflow-y-auto shrink-0">
          <PlannerSidebar
            key={key}
            rawPrompt={currentPrompt}
            extracted={currentExtracted}
            onGenerate={handleGenerate}
            onViewItinerary={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/itinerary';
              }
            }}
          />
        </div>

        {/* Right 60% Map View */}
        <div className="hidden md:block flex-1 h-full overflow-hidden">
          <MockMapView
            destination={itinerary?.destinationName || currentExtracted?.destination}
            itinerary={itinerary}
            isGenerating={isGenerating}
          />
        </div>
      </div>
    </div>
  );
}
