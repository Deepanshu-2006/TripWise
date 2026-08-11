'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import CollaborationProvider from '../../components/CollaborationProvider';
import PlannerSidebar from '../../components/PlannerSidebar';
import Header from '../../components/Header';
import LiveTripDashboard from '../../components/LiveTripDashboard';
import { saveTrip, getTripById, updateTrip } from '../../actions/trips';
import { usePreferenceEngine } from '../../hooks/usePreferenceEngine';

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
  const { user } = useUser();
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [currentStep, setCurrentStep] = useState('destination');
  const [tripId, setTripId] = useState(null);
  const { profile } = usePreferenceEngine();

  useEffect(() => {
    if (typeof window !== 'undefined' && tripId) {
      localStorage.setItem('tripwise_trip_id', tripId);
    }
  }, [tripId]);

  const [generatingDestination, setGeneratingDestination] = useState('');
  const [itinerary, setItinerary] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [hoveredStopIdx, setHoveredStopIdx] = useState(null);
  const [selectedStopIdx, setSelectedStopIdx] = useState(null);

  useEffect(() => {
    async function loadSharedTrip() {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        
        const step = urlParams.get('step');
        if (step) setCurrentStep(step);
        
        const trip_id = urlParams.get('trip_id');
        if (trip_id) setTripId(trip_id);

        if (urlParams.get('action') === 'view') {
          const tripId = urlParams.get('trip_id');
          if (tripId) {
            try {
              const tripData = await getTripById(tripId);
              if (tripData && tripData.itinerary_data) {
                setItinerary(tripData.itinerary_data);
                localStorage.setItem('tripwise_itinerary', JSON.stringify(tripData.itinerary_data));
              }
            } catch (e) {
              console.error("Failed to fetch shared trip from cloud", e);
            }
          }
        } else if (urlParams.get('action') === 'new') {
          // Explicitly clear local state for a fresh new trip
          localStorage.removeItem('tripwise_itinerary');
          localStorage.removeItem('tripwise_trip_id');
          setItinerary(null);
          setTripId(null);
          setCurrentStep('destination');
        } else {
          // Fallback to local storage only if there is no action specified
          const stored = localStorage.getItem('tripwise_itinerary');
          if (stored) {
            try {
              setItinerary(JSON.parse(stored));
            } catch (e) {
              console.error("Failed to parse itinerary from localStorage", e);
            }
          }
        }
      }
    }
    loadSharedTrip();
    
    const handleStorageChange = (e) => {
      if (e.key === 'tripwise_itinerary' && e.newValue) {
        try {
          const updatedItinerary = JSON.parse(e.newValue);
          if (updatedItinerary) {
            setItinerary(updatedItinerary);
          }
        } catch (err) {
          console.error("Failed to sync itinerary from storage", err);
        }
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  const handleGenerate = async (selections) => {
    const finalPrompt = selections.prompt || currentPrompt || "A dream vacation";
    const finalDest = selections.destination || selections.prompt || currentPrompt || "";
    setGeneratingDestination(finalDest);

    setIsGenerating(true);
    setSelectedDayIndex(0);
    setSelectedStopIdx(null);
    try {
      const response = await fetch('/api/generate-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          destination: finalDest,
          basecamp: selections.basecamp || "",
          interests: selections.interests || [],
          budget: selections.budget || 'standard',
          pace: selections.pace || 'balanced',
          userPreferences: profile
        })
      });
      const data = await response.json();
      if (data.success && data.itinerary) {
        // Keep previous preferences, update generated data, and advance step
        const finalItinerary = {
          ...itinerary,
          ...data.itinerary,
          startDate: selections.startDate || itinerary?.startDate || null,
          endDate: selections.endDate || itinerary?.endDate || null,
          lastCompletedStep: 'itinerary'
        };
        
        setItinerary(finalItinerary);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('tripwise_itinerary', JSON.stringify(finalItinerary));
        }
        
        try {
          const nameToSave = finalItinerary.destinationName || finalDest || "Draft Trip";
          if (tripId) {
            await updateTrip(tripId, nameToSave, finalItinerary);
          } else {
            const res = await saveTrip(nameToSave, finalItinerary);
            if (res && res.trip) setTripId(res.trip.id);
          }
        } catch (e) {
          console.error("Failed to save trip to cloud:", e);
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
      
      <CollaborationProvider 
        tripId={tripId} 
        initialItinerary={itinerary} 
        currentUser={user ? { id: user.id, name: user.fullName || user.firstName, avatarUrl: user.imageUrl } : null}
        onRemoteUpdate={(newItin) => setItinerary(newItin)}
      >
      {/* Unified Parent Container (Wrap BOTH Itinerary Panel and Map Section inside one shared parent container) */}
      <div className="flex-1 w-full h-full overflow-hidden p-3 sm:p-4 md:p-6 pb-4 sm:pb-6 flex flex-col min-h-0">
        <div className="flex-1 flex w-full h-full min-h-0 bg-[#FFFFFF] rounded-3xl border border-[#ECE8E2] shadow-[0_20px_60px_rgba(0,0,0,0.06)] overflow-hidden relative">
          {/* Left Panel: Itinerary & Prompt Controls (One single scrollable container for the entire left panel) */}
          <div id="itinerary-scroll-container" data-lenis-prevent="true" className="w-full md:w-[42%] lg:w-[40%] xl:w-[38%] h-full overflow-y-auto overflow-x-hidden shrink-0 bg-[#F7F5F2] border-r border-[#ECE8E2] flex flex-col scroll-smooth">
            <PlannerSidebar
              currentStep={currentStep}
              onStepChange={(newStep) => {
                 setCurrentStep(newStep);
                 if (typeof window !== 'undefined') {
                   const url = new URL(window.location);
                   url.searchParams.set('step', newStep);
                   window.history.pushState({}, '', url);
                 }
              }}
              tripId={tripId}
              onTripIdChange={setTripId}
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
              onUpdateItinerary={async (updated) => {
                setItinerary(updated);
                if (typeof window !== 'undefined') {
                  if (!updated) {
                    localStorage.removeItem('tripwise_itinerary');
                  } else {
                    localStorage.setItem('tripwise_itinerary', JSON.stringify(updated));
                    
                    if (tripId) {
                      try {
                        const nameToSave = updated.destinationName || "Draft Trip";
                        await updateTrip(tripId, nameToSave, updated);
                      } catch (e) {
                        console.error("Failed to sync updated itinerary to cloud:", e);
                      }
                    }
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
              destination={itinerary?.destinationName || generatingDestination || currentPrompt}
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
              tripId={tripId}
            />
          </div>
        </div>
      </div>
      </CollaborationProvider>
    </div>
  );
}
