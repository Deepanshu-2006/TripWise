'use client';

import React, { useState } from 'react';
import PlannerSidebar from '../components/PlannerSidebar';
import Header from '../components/Header';
import LiveTripDashboard from '../components/LiveTripDashboard';

export default function AIPlannerPage() {
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [itinerary, setItinerary] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [hoveredStopIdx, setHoveredStopIdx] = useState(null);

  React.useEffect(() => {
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
    <div className="w-full h-screen min-h-160 flex flex-col bg-[#FFF8F5] text-[#1C1B1B] overflow-hidden pt-24">
      <Header />
      
      {/* Split-Screen Layout (Subheader removed as requested) */}
      <div className="flex-1 flex w-full h-full overflow-hidden">
        {/* Left 40% Sidebar */}
        <div className="w-full md:w-[42%] lg:w-[40%] xl:w-[38%] h-full overflow-y-auto shrink-0 bg-[#FAF3EE]">
          <PlannerSidebar
            rawPrompt={currentPrompt}
            isGenerating={isGenerating}
            itinerary={itinerary}
            selectedDayIndex={selectedDayIndex}
            onSelectDay={setSelectedDayIndex}
            hoveredStopIdx={hoveredStopIdx}
            onHoverStop={setHoveredStopIdx}
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

        {/* Right 60% Map View & Interactive Dashboard */}
        <div className="hidden md:block flex-1 h-full overflow-hidden">
          <LiveTripDashboard
            destination={itinerary?.destinationName || currentPrompt}
            itinerary={itinerary}
            isGenerating={isGenerating}
            selectedDayIndex={selectedDayIndex}
            onSelectDay={setSelectedDayIndex}
            hoveredStopIdx={hoveredStopIdx}
            onHoverStop={setHoveredStopIdx}
            onSelectPrompt={(promptText) => {
              setCurrentPrompt(promptText);
            }}
          />
        </div>
      </div>
    </div>
  );
}
