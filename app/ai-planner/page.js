'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PlannerSidebar from '../components/PlannerSidebar';
import Header from '../components/Header';
import LiveTripDashboard from '../components/LiveTripDashboard';

// Separate component so useSearchParams is inside a Suspense boundary
function PromptSeeder({ onPrompt }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const urlPrompt = searchParams.get('prompt');
    if (urlPrompt) onPrompt(urlPrompt);
  }, [searchParams, onPrompt]);
  return null;
}

export default function AIPlannerPage() {
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [itinerary, setItinerary] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [hoveredStopIdx, setHoveredStopIdx] = useState(null);
  const [selectedStopIdx, setSelectedStopIdx] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tripwise_itinerary');
      if (stored) {
        try {
          setItinerary(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse itinerary from localStorage", e);
        }
      }
    }
  }, []);

  const handleGenerate = async (selections) => {
    setIsGenerating(true);
    setSelectedDayIndex(0);
    setSelectedStopIdx(null);
    try {
      const response = await fetch('/api/generate-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: selections.prompt || currentPrompt || "A dream vacation",
          destination: selections.destination || selections.prompt || currentPrompt || "",
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

  return (
    <div className="w-full h-screen min-h-160 flex flex-col bg-[#FAF8F5] text-[#1F1F1F] overflow-hidden pt-20 sm:pt-22">
      <Header />
      <Suspense fallback={null}>
        <PromptSeeder onPrompt={setCurrentPrompt} />
      </Suspense>
      
      {/* Unified Parent Container (Wrap BOTH Itinerary Panel and Map Section inside one shared parent container) */}
      <div className="flex-1 w-full h-full overflow-hidden p-3 sm:p-4 md:p-6 pb-4 sm:pb-6 flex flex-col min-h-0">
        <div className="flex-1 flex w-full h-full min-h-0 bg-[#FFFFFF] rounded-3xl border border-[#ECE8E2] shadow-[0_20px_60px_rgba(0,0,0,0.06)] overflow-hidden relative">
          {/* Left Panel: Itinerary & Prompt Controls (One single scrollable container for the entire left panel) */}
          <div className="w-full md:w-[42%] lg:w-[40%] xl:w-[38%] h-full overflow-y-auto overflow-x-hidden shrink-0 bg-[#F7F5F2] border-r border-[#ECE8E2] flex flex-col scroll-smooth">
            <PlannerSidebar
              rawPrompt={currentPrompt}
              onPromptChange={setCurrentPrompt}
              isGenerating={isGenerating}
              itinerary={itinerary}
              selectedDayIndex={selectedDayIndex}
              onSelectDay={setSelectedDayIndex}
              hoveredStopIdx={hoveredStopIdx}
              onHoverStop={setHoveredStopIdx}
              selectedStopIdx={selectedStopIdx}
              onSelectStop={setSelectedStopIdx}
              onUpdateItinerary={(updated) => {
                setItinerary(updated);
                if (typeof window !== 'undefined') {
                  if (!updated) {
                    localStorage.removeItem('tripwise_itinerary');
                  } else {
                    localStorage.setItem('tripwise_itinerary', JSON.stringify(updated));
                  }
                }
              }}
              onResetPrompt={() => {
                setCurrentPrompt('');
                setItinerary(null);
                setSelectedDayIndex(0);
                setSelectedStopIdx(null);
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('tripwise_itinerary');
                }
              }}
              onGenerate={handleGenerate}
              onViewItinerary={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = '/itinerary';
                }
              }}
            />
          </div>

          {/* Right Panel: Map View & Interactive Dashboard */}
          <div className="hidden md:flex flex-1 h-full overflow-hidden flex-col bg-[#FFFFFF]">
            <LiveTripDashboard
              destination={itinerary?.destinationName || currentPrompt}
              itinerary={itinerary}
              isGenerating={isGenerating}
              selectedDayIndex={selectedDayIndex}
              onSelectDay={setSelectedDayIndex}
              hoveredStopIdx={hoveredStopIdx}
              onHoverStop={setHoveredStopIdx}
              selectedStopIdx={selectedStopIdx}
              onSelectStop={setSelectedStopIdx}
              onSelectPrompt={(promptText) => {
                setCurrentPrompt(promptText);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
