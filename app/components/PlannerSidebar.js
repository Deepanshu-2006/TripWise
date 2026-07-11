'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

// --- Icons ---
const SpinnerIcon = () => (
  <svg className="animate-spin h-5 w-5 text-accent-orange" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const FoodieIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
    <path d="M7 2v20" />
    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
  </svg>
);

const HistoryIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 22h18" />
    <path d="M6 18v-7" />
    <path d="M10 18v-7" />
    <path d="M14 18v-7" />
    <path d="M18 18v-7" />
    <path d="M12 2 2 7h20L12 2Z" />
  </svg>
);

const NatureIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.4 19 2c1 2 2 4.1 2 11.5a8.5 8.5 0 0 1-10 6.5Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

const ShoppingIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const ArtIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2Z" />
  </svg>
);

const NightlifeIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 22h8" />
    <path d="M12 11v11" />
    <path d="m19 3-7 8-7-8Z" />
  </svg>
);

const SpotIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const NeighborhoodIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="7" height="7" x="3" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="14" rx="1" />
    <rect width="7" height="7" x="3" y="14" rx="1" />
  </svg>
);

const TransitIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" />
    <path d="M9 17h6" />
    <circle cx="17" cy="17" r="2" />
  </svg>
);

const TimelineIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
    <path d="m9 16 2 2 4-4" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

// Chip configuration
const INTEREST_OPTIONS = [
  { id: 'Foodie', label: 'Foodie', icon: <FoodieIcon /> },
  { id: 'History', label: 'History', icon: <HistoryIcon /> },
  { id: 'Nature', label: 'Nature', icon: <NatureIcon /> },
  { id: 'Shopping', label: 'Shopping', icon: <ShoppingIcon /> },
  { id: 'Art', label: 'Art', icon: <ArtIcon /> },
  { id: 'Nightlife', label: 'Nightlife', icon: <NightlifeIcon /> },
];

const BUDGET_OPTIONS = [
  { id: 'economy', title: 'Economy', desc: 'Public transport, street food, hostels' },
  { id: 'standard', title: 'Standard', desc: 'Rideshares, cafes, boutique hotels' },
  { id: 'premium', title: 'Premium', desc: 'Private tours, fine dining, 5-star stays' },
];

const PACE_OPTIONS = [
  { id: 'relaxed', label: 'Relaxed' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'fast', label: 'Fast-paced' },
];

const STATUS_ROWS = [
  { id: 'spots', label: 'Analyzing spots matching your profile...', icon: <SpotIcon /> },
  { id: 'neighborhood', label: 'Grouping places by neighborhood...', icon: <NeighborhoodIcon /> },
  { id: 'transit', label: 'Calculating transit times and routes...', icon: <TransitIcon /> },
  { id: 'timeline', label: 'Finalizing your custom timeline...', icon: <TimelineIcon /> },
];

export default function PlannerSidebar({
  rawPrompt = "",
  extracted = {
    destination: null,
    duration: null,
    budget: null,
    travelStyle: null,
    interests: []
  },
  isGenerating = false,
  itinerary = null,
  selectedDayIndex: propSelectedDayIndex = null,
  onSelectDay = null,
  hoveredStopIdx: propHoveredStopIdx = null,
  onHoverStop = null,
  onUpdateItinerary = null,
  onResetPrompt = null,
  onGenerate,
  onViewItinerary
}) {
  const [internalSelectedDayIndex, setInternalSelectedDayIndex] = useState(0);
  const selectedDayIndex = propSelectedDayIndex !== null ? propSelectedDayIndex : internalSelectedDayIndex;
  const [isDayChanging, setIsDayChanging] = useState(false);

  const handleDaySelect = (idx) => {
    if (idx === selectedDayIndex) return;
    setIsDayChanging(true);
    setTimeout(() => {
      if (onSelectDay) onSelectDay(idx);
      setInternalSelectedDayIndex(idx);
      setRefineExplanation(null);
      setTimeout(() => setIsDayChanging(false), 200);
    }, 120);
  };

  const [internalHoveredStopIdx, setInternalHoveredStopIdx] = useState(null);
  const hoveredStopIdx = propHoveredStopIdx !== null ? propHoveredStopIdx : internalHoveredStopIdx;
  const handleHoverStop = (idx) => {
    if (onHoverStop) onHoverStop(idx);
    setInternalHoveredStopIdx(idx);
  };

  // Drag and Drop Stop Reordering State & Handlers
  const [draggedStopIdx, setDraggedStopIdx] = useState(null);
  const [dragOverStopIdx, setDragOverStopIdx] = useState(null);

  const handleDragStart = (e, idx) => {
    e.stopPropagation();
    setDraggedStopIdx(idx);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', idx.toString());
    }
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedStopIdx === null || draggedStopIdx === idx) return;
    if (dragOverStopIdx !== idx) {
      setDragOverStopIdx(idx);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverStopIdx(null);
    if (draggedStopIdx === null || draggedStopIdx === targetIdx || !itinerary || !itinerary.days?.[selectedDayIndex]) {
      setDraggedStopIdx(null);
      return;
    }

    const currentDay = itinerary.days[selectedDayIndex];
    const newActivities = [...(currentDay.activities || [])];
    const [movedItem] = newActivities.splice(draggedStopIdx, 1);
    newActivities.splice(targetIdx, 0, movedItem);

    const updatedDays = itinerary.days.map((day, dIdx) => {
      if (dIdx === selectedDayIndex) {
        return { ...day, activities: newActivities };
      }
      return day;
    });

    const updatedItinerary = {
      ...itinerary,
      days: updatedDays
    };

    if (onUpdateItinerary) {
      onUpdateItinerary(updatedItinerary);
    }
    setDraggedStopIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedStopIdx(null);
    setDragOverStopIdx(null);
  };

  // Real-Time AI Refinement ("Chat to Modify") State & Handlers
  const [refinePromptInput, setRefinePromptInput] = useState('');
  const [isRefiningDay, setIsRefiningDay] = useState(false);
  const [refineExplanation, setRefineExplanation] = useState(null);
  const [showCopilotDrawer, setShowCopilotDrawer] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState('ai'); // 'ai' | 'manual'

  const triggerRefineDay = async (customPrompt = null) => {
    const promptText = (customPrompt || refinePromptInput).trim();
    if (!promptText || !itinerary?.days?.[selectedDayIndex]) return;
    setIsRefiningDay(true);
    setRefineExplanation(null);

    try {
      const currentDay = itinerary.days[selectedDayIndex];
      const res = await fetch('/api/refine-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          currentDay,
          destinationName: itinerary.destinationName || 'Your Destination',
          dayIndex: selectedDayIndex
        })
      });
      const data = await res.json();
      if (data && data.updatedDay) {
        const updatedDays = itinerary.days.map((day, idx) => {
          if (idx === selectedDayIndex) {
            return data.updatedDay;
          }
          return day;
        });
        const updatedItinerary = {
          ...itinerary,
          days: updatedDays
        };
        if (onUpdateItinerary) {
          onUpdateItinerary(updatedItinerary);
        }
        setRefineExplanation(data.explanation || `Refined Day ${selectedDayIndex + 1} with AI!`);
        setRefinePromptInput('');
      }
    } catch (err) {
      console.error("Failed to refine day:", err);
      setRefineExplanation("❌ Could not modify day right now. Please try again.");
    } finally {
      setIsRefiningDay(false);
    }
  };

  const handleRefineDaySubmit = (e) => {
    e.preventDefault();
    triggerRefineDay();
  };

  // State: 'input' | 'parsing' | 'confirming' | 'progress'
  // If a prompt was passed in (e.g. from demo controls or homepage), start at 'parsing'; otherwise start at 'input'
  const [step, setStep] = useState(() => (rawPrompt ? 'parsing' : 'input'));
  const [userPromptInput, setUserPromptInput] = useState(() => rawPrompt || '');

  // State 2 Form Selections
  const [selectedInterests, setSelectedInterests] = useState(() =>
    extracted?.interests && Array.isArray(extracted.interests) ? extracted.interests : ['Foodie', 'Nature']
  );
  const [selectedBudget, setSelectedBudget] = useState(() => extracted?.budget || 'standard');
  const [selectedPace, setSelectedPace] = useState(() => extracted?.travelStyle || 'balanced');

  // State 3 Progress
  const [progressPercent, setProgressPercent] = useState(0);
  const [activeRowIndex, setActiveRowIndex] = useState(-1);
  const [showFinalCTA, setShowFinalCTA] = useState(false);
  const [parsedIntent, setParsedIntent] = useState(null);

  // Custom Stop Quick-Add State
  const [isAddingStop, setIsAddingStop] = useState(false);
  const [newStopTime, setNewStopTime] = useState('06:00 PM');
  const [newStopCategory, setNewStopCategory] = useState('Highlight');
  const [newStopTitle, setNewStopTitle] = useState('');
  const [newStopDesc, setNewStopDesc] = useState('');

  const handleAddCustomStop = () => {
    if (!newStopTitle.trim() || !itinerary?.days?.[selectedDayIndex]) return;
    const currentDays = [...itinerary.days];
    const currentDay = { ...currentDays[selectedDayIndex] };
    const currentActivities = [...(currentDay.activities || [])];
    
    const newStop = {
      time: newStopTime || '06:00 PM',
      title: newStopTitle.trim(),
      category: newStopCategory || 'Highlight',
      badge: newStopCategory === 'Food & Dining' || newStopCategory === 'Late Night Dining' ? 'Local Gem' : 'Custom Stop',
      description: newStopDesc.trim() || `Custom activity added to Day ${selectedDayIndex + 1} schedule.`,
      duration: '1.5 hrs',
      cost: 'Varies',
      lat: currentActivities[currentActivities.length - 1]?.lat ? currentActivities[currentActivities.length - 1].lat + 0.003 : (itinerary.coordinates?.lat || 51.5072) + 0.003,
      lng: currentActivities[currentActivities.length - 1]?.lng ? currentActivities[currentActivities.length - 1].lng + 0.003 : (itinerary.coordinates?.lng || -0.1276) + 0.003,
    };

    currentActivities.push(newStop);
    currentDay.activities = currentActivities;
    currentDays[selectedDayIndex] = currentDay;

    const updatedItinerary = {
      ...itinerary,
      days: currentDays
    };

    if (onUpdateItinerary) {
      onUpdateItinerary(updatedItinerary);
    } else if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('tripwise_itinerary', JSON.stringify(updatedItinerary));
        window.dispatchEvent(new Event('storage'));
      } catch (e) {
        console.error('Failed to save updated itinerary:', e);
      }
    }

    setIsAddingStop(false);
    setNewStopTitle('');
    setNewStopDesc('');
    setRefineExplanation(`Added custom stop "${newStopTitle.trim()}" to Day ${selectedDayIndex + 1}!`);
    setShowCopilotDrawer(true);
  };

  // Check if confirmation state is needed
  const isMissingRequiredFields = 
    extracted?.duration == null || 
    extracted?.budget == null || 
    extracted?.travelStyle == null;

  const startProgressTransition = useCallback((selections) => {
    setProgressPercent(0);
    setActiveRowIndex(0);
    setShowFinalCTA(false);
    setStep('progress');
    if (onGenerate && selections) {
      onGenerate({
        ...selections,
        prompt: userPromptInput || rawPrompt || "Planning a trip",
        destination: parsedIntent?.destination || extracted?.destination || userPromptInput || rawPrompt || "Your Destination"
      });
    }
  }, [onGenerate, userPromptInput, rawPrompt, extracted?.destination, parsedIntent?.destination]);

  // Sync when rawPrompt is updated from external click (e.g. clicking a destination card on the right radar map)
  useEffect(() => {
    if (rawPrompt) {
      setUserPromptInput(rawPrompt);
      if (step === 'input' || rawPrompt !== userPromptInput) {
        setStep('parsing');
      }
    }
  }, [rawPrompt]);

  // State 1: Call /api/parse-intent to analyze user query and pre-populate UI chips
  useEffect(() => {
    if (step !== 'parsing') return;

    let isMounted = true;
    const parseUserPrompt = async () => {
      try {
        const promptToParse = userPromptInput || rawPrompt || "A dream trip";
        const res = await fetch('/api/parse-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: promptToParse })
        });
        const data = await res.json();
        if (isMounted && data.success && data.intent) {
          const intent = data.intent;
          setParsedIntent(intent);

          // Pre-populate Step 2 UI chips automatically based on returned JSON object:
          if (Array.isArray(intent.vibes) && intent.vibes.length > 0) {
            setSelectedInterests(intent.vibes);
          }
          if (intent.budget_tier) {
            const b = intent.budget_tier.toLowerCase();
            if (b === 'premium') setSelectedBudget('premium');
            else if (b === 'economy') setSelectedBudget('economy');
            else setSelectedBudget('standard');
          }
          if (intent.pace) {
            const p = intent.pace.toLowerCase();
            if (p.includes('fast')) setSelectedPace('fast');
            else if (p.includes('relax')) setSelectedPace('relaxed');
            else setSelectedPace('balanced');
          }
        }
      } catch (err) {
        console.error("Error parsing intent:", err);
      } finally {
        if (isMounted) {
          // Always transition smoothly to confirming step after parsing
          setStep('confirming');
        }
      }
    };

    parseUserPrompt();

    return () => { isMounted = false; };
  }, [step, userPromptInput, rawPrompt]);

  // State 3 progress tracker animation (Fast & linked to real AI generation status)
  useEffect(() => {
    if (step !== 'progress') return;

    // If real generation is finished, instantly snap to 100% without forcing user to wait!
    if (!isGenerating && itinerary) {
      setProgressPercent(100);
      setActiveRowIndex(3);
      setShowFinalCTA(true);
      return;
    }

    const startTime = Date.now();
    const duration = 2500; // Animate smoothly up to 88% while generating

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(88, (elapsed / duration) * 88);
      setProgressPercent(pct);

      if (elapsed >= 1800) {
        setActiveRowIndex(3);
      } else if (elapsed >= 1200) {
        setActiveRowIndex(2);
      } else if (elapsed >= 600) {
        setActiveRowIndex(1);
      } else {
        setActiveRowIndex(0);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [step, isGenerating, itinerary]);

  const prevItineraryRef = useRef(itinerary);
  const hasAutoLoadedRef = useRef(false);

  useEffect(() => {
    if (itinerary && !isGenerating) {
      if (itinerary !== prevItineraryRef.current || !hasAutoLoadedRef.current) {
        prevItineraryRef.current = itinerary;
        hasAutoLoadedRef.current = true;
        setStep('progress');
        setProgressPercent(100);
        setActiveRowIndex(3);
        setShowFinalCTA(true);
      }
    } else if (!itinerary) {
      prevItineraryRef.current = null;
    }
  }, [itinerary, isGenerating]);

  // Handlers
  const handleNewPrompt = () => {
    setStep('input');
    setUserPromptInput('');
    setParsedIntent(null);
    setShowFinalCTA(false);
    setProgressPercent(0);
    setActiveRowIndex(0);
    if (onResetPrompt) {
      onResetPrompt();
    } else if (onUpdateItinerary) {
      onUpdateItinerary(null);
    } else if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('tripwise_itinerary');
        window.dispatchEvent(new Event('storage'));
      } catch (e) {
        console.error('Error clearing itinerary:', e);
      }
    }
  };
  const toggleInterest = (id) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleGenerateClick = () => {
    startProgressTransition({
      interests: selectedInterests,
      budget: selectedBudget,
      pace: selectedPace,
    });
  };

  const handleSkipClick = () => {
    startProgressTransition({
      interests: extracted?.interests || [],
      budget: extracted?.budget || 'standard',
      pace: extracted?.travelStyle || 'balanced',
    });
  };

  // Derive destination name gracefully
  const derivedDestination = () => {
    if (parsedIntent?.destination) return parsedIntent.destination;
    if (extracted?.destination) return extracted.destination;
    const lower = userPromptInput.toLowerCase();
    if (lower.includes("london")) return "London, United Kingdom";
    if (lower.includes("kyoto")) return "Kyoto, Japan";
    if (lower.includes("tokyo")) return "Tokyo, Japan";
    if (lower.includes("punjab")) return "Punjab, India";
    if (lower.includes("rome")) return "Rome, Italy";
    if (lower.includes("paris")) return "Paris, France";
    if (lower.includes("swiss") || lower.includes("alps")) return "Swiss Alps, Switzerland";
    
    const clean = userPromptInput.trim().replace(/^(?:generate\s+)?(?:a\s+)?(?:trip\s+to\s+|trip\s+for\s+|visit\s+|for\s+)/i, "").trim();
    if (clean.length > 2 && clean.split(/\s+/).length <= 4) {
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    }
    return "your trip";
  };

  const destinationName = derivedDestination();
  const activePromptText = userPromptInput || rawPrompt || "Planning your custom journey...";

  return (
    <div className={`w-full h-full min-h-160 bg-[#FAF3EE] text-stone-900 ${step === 'progress' && showFinalCTA && itinerary ? 'p-4 md:p-6' : 'p-6 md:p-8'} flex flex-col justify-between font-sans select-none border-r border-stone-200/60`}>
      {/* Top Header Brand / Label */}
      <div>
        <div className={`flex items-center justify-between ${step === 'progress' && showFinalCTA && itinerary ? 'mb-3' : 'mb-8'}`}>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B35]" />
            <span className="text-xs font-bold tracking-widest uppercase text-stone-500">
              TripWise AI Planner
            </span>
          </div>
          {step !== 'input' && !(step === 'progress' && showFinalCTA && itinerary) && (
            <button
              type="button"
              onClick={handleNewPrompt}
              className="text-xs font-semibold text-[#FF6B35] hover:underline cursor-pointer bg-transparent border-none"
            >
              ← New Prompt
            </button>
          )}
        </div>

        {/* STATE 0: Prompt Input Setup Page */}
        {step === 'input' && (
          <div className="space-y-8 animate-fade-in">
            {/* Header Block */}
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-black text-stone-900 tracking-tight leading-tight">
                Where to next?
              </h2>
              <p className="text-sm md:text-base text-stone-600 leading-relaxed">
                Tell TripWise your dream destination, vibe, budget, or timeline. Our AI will craft your custom itinerary in seconds.
              </p>
            </div>

            {/* Input Block */}
            <div className="space-y-6">
              <textarea
                value={userPromptInput}
                onChange={(e) => setUserPromptInput(e.target.value)}
                placeholder="e.g., 5 days in Kyoto during cherry blossom season... love historic temples, hidden gardens, authentic ramen shops, and boutique stays."
                className="w-full h-36 p-4 md:p-5 rounded-2xl bg-white border border-stone-300 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 text-sm md:text-base text-stone-900 placeholder:text-stone-400 focus:outline-none shadow-sm transition-all duration-150 resize-none font-medium"
              />

              {/* Vibe Enhancers */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B35] flex items-center gap-1.5">
                    <span>⚡ One-Click Vibe Enhancers</span>
                  </span>
                  <span className="text-[11px] text-stone-500 font-normal">Click to append</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    "➕ Hidden Local Gems",
                    "➕ Michelin & Street Food",
                    "➕ Scenic Photography Spots",
                    "➕ Budget Friendly & Hostels",
                    "➕ Luxury Boutique Stays",
                    "➕ Fast-Paced Nightlife"
                  ].map((tag, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const cleanTag = tag.replace('➕ ', '');
                        setUserPromptInput((prev) => {
                          const trimmed = prev.trim();
                          if (!trimmed) return `Include ${cleanTag.toLowerCase()}.`;
                          return `${trimmed}${trimmed.endsWith('.') ? '' : ','} include ${cleanTag.toLowerCase()}.`;
                        });
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FF6B35]/10 text-[#FF6B35] hover:bg-[#FF6B35] hover:text-white border border-[#FF6B35]/20 transition-all duration-150 cursor-pointer shadow-2xs active:scale-95"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* De-emphasized Examples */}
              <div className="space-y-2.5 pt-2 border-t border-stone-200/60">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 block">
                  Or try an example prompt:
                </span>
                <ul className="space-y-2">
                  {[
                    { text: "5 days in Kyoto: temples, gardens & street food", emoji: "🌸" },
                    { text: "3 budget days in Rome: hidden gems & local pasta", emoji: "🍕" },
                    { text: "7 fast-paced days in Tokyo: cyberpunk nightlife & tech", emoji: "⚡" }
                  ].map((ex, idx) => (
                    <li key={idx}>
                      <button
                        type="button"
                        onClick={() => {
                          setUserPromptInput(`${ex.emoji} ${ex.text}`);
                          setStep('parsing');
                        }}
                        className="w-full flex items-center gap-2.5 text-left text-xs md:text-sm text-slate-500 hover:text-[#FF6B35] transition-colors cursor-pointer py-1 group font-medium"
                      >
                        <span className="text-stone-400 group-hover:text-[#FF6B35] transition-colors">→</span>
                        <span className="truncate">{ex.emoji} {ex.text}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={!userPromptInput.trim()}
                onClick={() => {
                  if (userPromptInput.trim()) {
                    setStep('parsing');
                  }
                }}
                className={`w-full py-4 px-6 rounded-2xl font-extrabold text-base transition-all duration-200 flex items-center justify-center gap-2.5 ${
                  userPromptInput.trim()
                    ? 'bg-[#FF6B35] text-white hover:bg-[#e85a24] shadow-lg shadow-[#FF6B35]/25 active:scale-[0.99] cursor-pointer'
                    : 'border-2 border-dashed border-stone-300 text-stone-400 bg-transparent cursor-not-allowed'
                }`}
              >
                <span>Plan My Trip</span>
                <ArrowRightIcon />
              </button>
            </div>
          </div>
        )}

        {/* STATE 1: Parsing */}
        {step === 'parsing' && (
          <div className="flex flex-col gap-5 animate-fade-in">
            <div className="flex items-center gap-3">
              <SpinnerIcon />
              <span className="text-base font-semibold text-(--foreground)">
                Reading your prompt...
              </span>
            </div>

            <div className="p-4 rounded-xl bg-bg-white border border-[rgba(28,27,27,0.08)] shadow-xs">
              <p className="text-sm md:text-base text-(--foreground)/90 italic leading-relaxed">
                &ldquo;{activePromptText}&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* STATE 2: Confirmation */}
        {step === 'confirming' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <h2 className="text-lg md:text-xl font-semibold text-(--foreground) leading-snug">
              Got it, {destinationName}. A couple quick things:
            </h2>

            {/* Tune your vibe */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary-text mb-2.5">
                Tune your vibe
              </label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((item) => {
                  const isActive = selectedInterests.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleInterest(item.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-150 cursor-pointer shadow-2xs ${
                        isActive
                          ? 'bg-accent-orange-tint border border-accent-orange text-text-primary font-semibold'
                          : 'bg-bg-white border border-[rgba(28,27,27,0.12)] text-(--foreground) hover:border-[rgba(28,27,27,0.3)]'
                      }`}
                    >
                      <span className={isActive ? 'text-text-primary' : 'text-accent-orange'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Set your budget */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary-text mb-2.5">
                Set your budget
              </label>
              <div className="flex flex-col gap-2.5">
                {BUDGET_OPTIONS.map((item) => {
                  const isSelected = selectedBudget === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedBudget(item.id)}
                      className={`w-full p-3.5 rounded-xl cursor-pointer transition-all duration-150 text-left flex flex-col shadow-2xs ${
                        isSelected
                          ? 'bg-(--accent-orange-tint)/30 border-2 border-accent-orange'
                          : 'bg-bg-white border border-[rgba(28,27,27,0.1)] hover:bg-[#FFFDFB]'
                      }`}
                    >
                      <span className="text-sm md:text-base font-semibold text-(--foreground)">
                        {item.title}
                      </span>
                      <span className="text-xs md:text-sm text-secondary-text mt-0.5">
                        {item.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Choose your pace */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary-text mb-2.5">
                Choose your pace
              </label>
              <div className="grid grid-cols-3 p-1 gap-1 rounded-xl bg-bg-white border border-[rgba(28,27,27,0.1)] shadow-2xs">
                {PACE_OPTIONS.map((item) => {
                  const isActive = selectedPace === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedPace(item.id)}
                      className={`py-2 px-2 rounded-lg text-xs md:text-sm transition-all duration-150 cursor-pointer text-center ${
                        isActive
                          ? 'bg-accent-orange-tint text-text-primary font-semibold shadow-2xs'
                          : 'bg-transparent text-secondary-text hover:text-(--foreground) font-medium'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleGenerateClick}
                className="w-full py-3.5 px-6 rounded-xl font-semibold bg-accent-orange text-bg-white hover:opacity-90 active:scale-[0.99] transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 text-sm md:text-base shadow-md shadow-(--accent-orange)/20"
              >
                <span>Generate my trip</span>
              </button>
              <button
                type="button"
                onClick={handleSkipClick}
                className="w-full py-2 text-center text-xs md:text-sm font-medium text-secondary-text hover:text-(--foreground) transition-colors cursor-pointer bg-transparent border-none"
              >
                Skip, just generate
              </button>
            </div>
          </div>
        )}

        {/* STATE 3: Progress Tracker OR Live Day Schedule Cards (`showFinalCTA && itinerary`) */}
        {step === 'progress' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {showFinalCTA && itinerary ? (
              /* LIVE ITINERARY CARDS WORKSPACE IN LEFT SIDEBAR */
              <div className="flex flex-col gap-5 animate-fade-in">
                <div className="flex items-center justify-between border-b border-[rgba(28,27,27,0.1)] pb-3">
                  <div>
                    <h3 className="text-lg md:text-xl font-black text-[#1C1B1B] leading-tight">
                      {itinerary.destinationName || 'Your Custom Itinerary'}
                    </h3>
                    <p className="text-xs font-bold text-[#FF7A1A] mt-0.5 flex items-center gap-1.5">
                      <span className="animate-pulse inline-block text-amber-500">⚡</span>
                      <span>{itinerary.days?.[selectedDayIndex]?.dateLabel || `Day ${selectedDayIndex + 1}`} • {itinerary.days?.[selectedDayIndex]?.activities?.length || 0} Stops</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleNewPrompt}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-white border border-[rgba(28,27,27,0.15)] text-[#4B4745] hover:bg-[#FFF8F5] hover:text-[#FF7A1A] transition-all duration-200 cursor-pointer shadow-xs hover:shadow-sm hover:-translate-y-0.5 shrink-0"
                  >
                    🔄 New Prompt
                  </button>
                </div>

                {/* Day Selector Pills & Chat to Modify Toggle Button */}
                <div className="flex items-center justify-between gap-2 pb-1">
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none p-1 rounded-2xl bg-[#F7F5F2] border border-[#ECE8E2]">
                    {itinerary.days && itinerary.days.map((day, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleDaySelect(idx)}
                        className={`relative px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-300 ease-out cursor-pointer whitespace-nowrap ${
                          selectedDayIndex === idx
                            ? 'bg-[#FF6B2C] text-white shadow-[0_4px_16px_rgba(255,107,44,0.25)] scale-[1.03] z-10'
                            : 'bg-transparent text-[#6B6B6B] hover:bg-white/80 hover:text-[#1F1F1F]'
                        }`}
                      >
                        {selectedDayIndex === idx && (
                          <span className="absolute inset-0 rounded-xl bg-linear-to-r from-white/15 to-transparent pointer-events-none" />
                        )}
                        Day {day.dayNumber || idx + 1}
                      </button>
                    ))}
                  </div>

                  {/* Unified Modify Day Toggle Button right of the days */}
                  <button
                    type="button"
                    onClick={() => setShowCopilotDrawer(!showCopilotDrawer)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap shadow-sm flex items-center gap-1.5 shrink-0 border ${
                      showCopilotDrawer || isRefiningDay || refineExplanation
                        ? 'bg-linear-to-r from-[#FF6B2C] to-[#FF8C61] text-white border-[#FF6B2C] shadow-md scale-102'
                        : 'bg-[#FFFFFF] hover:bg-[#F7F5F2] text-[#1F1F1F] border-[#ECE8E2] hover:border-[#FF6B2C]/50 hover:text-[#FF6B2C]'
                    }`}
                  >
                    <span className="animate-pulse">⚡</span>
                    <span>Modify Day</span>
                    <span className={`transition-transform duration-300 text-[10px] ${showCopilotDrawer ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                </div>

                {/* Unified Floating Modify / Copilot Drawer with Smooth Pop Animation */}
                <div className={`w-full transition-all duration-500 ease-in-out overflow-hidden ${
                  showCopilotDrawer || isRefiningDay || refineExplanation
                    ? 'max-h-115 opacity-100 mt-1 mb-2'
                    : 'max-h-0 opacity-0 mt-0 mb-0 pointer-events-none'
                }`}>
                  <div className="w-full bg-linear-to-r from-[#1C1B1B] via-[#2A2626] to-[#1C1B1B] p-3 rounded-2xl shadow-lg border border-[rgba(255,255,255,0.12)] flex flex-col gap-2.5 relative">
                    {/* Header & Mode Tabs */}
                    <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                      <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
                        <button
                          type="button"
                          onClick={() => setActiveDrawerTab('ai')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                            activeDrawerTab === 'ai'
                              ? 'bg-[#EC6735] text-white shadow-xs'
                              : 'text-stone-300 hover:text-white'
                          }`}
                        >
                          <span>✨</span>
                          <span>AI Copilot</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveDrawerTab('manual')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                            activeDrawerTab === 'manual'
                              ? 'bg-[#EC6735] text-white shadow-xs'
                              : 'text-stone-300 hover:text-white'
                          }`}
                        >
                          <span>📝</span>
                          <span>Manual Add Stop</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-stone-400 font-bold tracking-normal hidden sm:inline">
                          {activeDrawerTab === 'ai' ? 'Natural language prompt' : 'Direct custom entry'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCopilotDrawer(false);
                            setRefineExplanation(null);
                          }}
                          className="text-stone-400 hover:text-white text-xs font-bold cursor-pointer px-1.5 py-0.5 rounded-lg hover:bg-white/10"
                          title="Close Drawer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Tab 1: AI Copilot */}
                    {activeDrawerTab === 'ai' && (
                      <div className="flex flex-col gap-2 animate-fade-in">
                        <form
                          onSubmit={handleRefineDaySubmit}
                          className="flex items-center gap-2"
                        >
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={refinePromptInput}
                              onChange={(e) => setRefinePromptInput(e.target.value)}
                              placeholder='e.g. "Add a Michelin-star dinner after Stop #3..."'
                              disabled={isRefiningDay}
                              className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 text-white placeholder-stone-400 text-xs rounded-xl px-3.5 py-2 border border-white/15 focus:border-[#EC6735] focus:outline-hidden transition-all pr-8"
                            />
                            {refinePromptInput && !isRefiningDay && (
                              <button
                                type="button"
                                onClick={() => setRefinePromptInput('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white text-xs font-bold cursor-pointer"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                          <button
                            type="submit"
                            disabled={!refinePromptInput.trim() || isRefiningDay}
                            className="bg-linear-to-r from-[#EC6735] to-[#FF8C61] hover:from-[#d85827] hover:to-[#EC6735] text-white px-3.5 py-2 rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                          >
                            {isRefiningDay ? (
                              <>
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                <span>Refining...</span>
                              </>
                            ) : (
                              <>
                                <span>✨</span>
                                <span>Apply</span>
                              </>
                            )}
                          </button>
                        </form>

                        {/* Quick suggestion pills for instant 1-click refinement */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-none">
                          {[
                            '🍷 Add a Michelin-star dinner after Stop #3',
                            '🧸 Make this day more kid-friendly',
                            '☕ Add early morning coffee & pastry before Stop #1',
                            '💆 Insert a relaxing luxury thermal spa break'
                          ].map((sugg, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                const cleanPrompt = sugg.replace(/^[^\s]+\s+/, '');
                                setRefinePromptInput(cleanPrompt);
                                triggerRefineDay(cleanPrompt);
                              }}
                              disabled={isRefiningDay}
                              className="text-[10px] font-bold text-stone-300 bg-white/10 hover:bg-white/20 border border-white/15 rounded-lg px-2.5 py-1 whitespace-nowrap transition-all cursor-pointer shrink-0"
                            >
                              {sugg}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Manual Add Stop */}
                    {activeDrawerTab === 'manual' && (
                      <div className="flex flex-col gap-2.5 animate-fade-in bg-black/20 p-2.5 rounded-xl border border-white/10">
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="Time (e.g. 06:00 PM)"
                            value={newStopTime}
                            onChange={(e) => setNewStopTime(e.target.value)}
                            className="col-span-1 p-2 rounded-xl text-xs bg-white/10 border border-white/15 font-bold text-white focus:outline-hidden focus:border-[#EC6735]"
                          />
                          <select
                            value={newStopCategory}
                            onChange={(e) => setNewStopCategory(e.target.value)}
                            className="col-span-2 p-2 rounded-xl text-xs bg-stone-900 border border-white/15 font-bold text-white focus:outline-hidden focus:border-[#EC6735]"
                          >
                            <option value="Highlight">Category: Highlight</option>
                            <option value="Food & Dining">Category: Food & Dining</option>
                            <option value="Attractions">Category: Attractions</option>
                            <option value="Landmarks">Category: Landmarks</option>
                            <option value="Coffee & Cafe">Category: Coffee & Cafe</option>
                            <option value="Late Night Dining">Category: Late Night Dining</option>
                          </select>
                        </div>
                        <input
                          type="text"
                          placeholder="Stop Title (e.g. Sunset Rooftop Cocktails at Aqua Shard)"
                          value={newStopTitle}
                          onChange={(e) => setNewStopTitle(e.target.value)}
                          className="w-full p-2.5 rounded-xl text-xs bg-white/10 border border-white/15 font-bold text-white placeholder-stone-400 focus:outline-hidden focus:border-[#EC6735]"
                        />
                        <input
                          type="text"
                          placeholder="Short description or notes..."
                          value={newStopDesc}
                          onChange={(e) => setNewStopDesc(e.target.value)}
                          className="w-full p-2.5 rounded-xl text-xs bg-white/10 border border-white/15 text-stone-200 placeholder-stone-400 focus:outline-hidden focus:border-[#EC6735]"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomStop}
                          disabled={!newStopTitle.trim()}
                          className={`w-full py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm ${
                            newStopTitle.trim()
                              ? 'bg-linear-to-r from-[#EC6735] to-[#FF8C61] text-white hover:opacity-95'
                              : 'bg-white/10 text-stone-500 cursor-not-allowed'
                          }`}
                        >
                          ✅ Add Stop to Itinerary
                        </button>
                      </div>
                    )}

                    {/* AI / Manual Refinement Feedback Notification */}
                    {refineExplanation && (
                      <div className="mt-1 bg-[#10B981]/20 border border-[#10B981]/40 text-[#A7F3D0] px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 animate-fade-in font-bold">
                        <span className="flex items-center gap-1.5">
                          <span>✅</span>
                          <span>{refineExplanation}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setRefineExplanation(null)}
                          className="text-[#A7F3D0] hover:text-white font-extrabold text-xs ml-2 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Day Schedule Activities Cards List with Vertical Timeline (Point 4, 5, & 6) */}
                <div className={`relative flex flex-col gap-3.5 px-1 py-1 max-h-[calc(100vh-270px)] overflow-y-auto overflow-x-hidden transition-all duration-300 ease-out ${
                  isDayChanging ? 'opacity-20 scale-[0.98]' : 'opacity-100 scale-100'
                }`}>
                  {/* Point 5: Subtle orange vertical timeline connecting stops */}
                  {itinerary.days?.[selectedDayIndex]?.activities?.length > 1 && (
                    <div className="absolute left-8.5 top-8 bottom-8 w-0.5 bg-linear-to-b from-[#FF7A1A]/75 via-[#FF7A1A]/40 to-[#FF7A1A]/15 pointer-events-none z-0" />
                  )}

                  {itinerary.days?.[selectedDayIndex]?.activities?.map((act, idx) => {
                    const stopNum = idx + 1;
                    const isHovered = hoveredStopIdx === stopNum;
                    return (
                      <div
                        key={idx}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, idx)}
                        onDragEnd={handleDragEnd}
                        onMouseEnter={() => handleHoverStop(stopNum)}
                        onMouseLeave={() => handleHoverStop(null)}
                        onClick={() => handleHoverStop(stopNum)}
                        className={`w-full box-border p-4 rounded-2xl border transition-all duration-300 ease-out flex flex-col gap-2.5 cursor-pointer select-none relative z-10 ${
                          dragOverStopIdx === idx
                            ? 'border-[#FF6B2C] border-2 bg-[#FFF8F5] scale-[1.02] ring-4 ring-[#FF6B2C]/30 shadow-2xl z-30'
                            : draggedStopIdx === idx
                            ? 'opacity-40 scale-95 border-dashed border-2 border-[#ECE8E2] bg-[#F7F5F2]'
                            : isHovered
                            ? 'bg-[#FFFFFF] border-[#FF6B2C]/80 border ring-4 ring-[#FF6B2C]/20 -translate-y-1 shadow-[0_14px_32px_rgba(255,107,44,0.18)] z-20 font-bold'
                            : 'bg-[#FFFFFF] border-[#ECE8E2] shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:border-[#FF6B2C]/70 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(255,107,44,0.14)]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            {/* Drag Handle */}
                            <div
                              className="cursor-grab active:cursor-grabbing text-[#6B6B6B] hover:text-[#FF6B2C] py-1 flex items-center justify-center transition-colors shrink-0"
                              title="Drag stop to reorder along route"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="text-base font-black tracking-tighter leading-none">⋮⋮</span>
                            </div>
                            {/* Stop Number Badge aligned with vertical timeline */}
                            <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 border relative z-20 transition-all duration-300 ${
                              isHovered || dragOverStopIdx === idx
                                ? 'bg-[#FF6B2C] text-white border-[#FF6B2C] shadow-md scale-110'
                                : 'bg-[#FFF2EA] text-[#FF6B2C] border-[#FF6B2C]/30'
                            }`}>
                              {stopNum}
                            </div>
                            <div className="ml-0.5">
                              <span className="text-xs font-extrabold text-[#FF6B2C] tracking-tight">{act.time}</span>
                              <h4 className="text-sm font-extrabold text-[#1F1F1F] leading-snug tracking-tight">{act.title}</h4>
                            </div>
                          </div>
                          <span className="text-[9px] font-extrabold px-2.5 py-0.5 rounded-md bg-[#F7F5F2] text-[#6B6B6B] uppercase tracking-wider shrink-0 border border-[#ECE8E2]">
                            {act.badge || act.category || 'Stop'}
                          </span>
                        </div>
                        <p className="text-xs text-[#6B6B6B] leading-relaxed pl-12">{act.description}</p>
                        <div className="pl-12 flex items-center flex-wrap gap-1.5 pt-1">
                          {act.duration && (
                            <span className="text-[10px] font-bold text-[#6B6B6B] bg-[#F7F5F2] px-2.5 py-0.5 rounded-md flex items-center gap-1 border border-[#ECE8E2]">
                              ⏱️ {act.duration}
                            </span>
                          )}
                          {act.cost && (
                            <span className="text-[10px] font-bold text-[#0D9488] bg-[#0D9488]/10 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                              💰 {act.cost}
                            </span>
                          )}
                          {(act.badge?.toLowerCase().includes('must') || act.title?.toLowerCase().includes('fast-track') || act.category?.toLowerCase().includes('attraction')) && (
                            <span className="text-[10px] font-extrabold text-[#FF6B2C] bg-[#FFF2EA] px-2.5 py-0.5 rounded-md flex items-center gap-1 border border-[#FF6B2C]/30">
                              🎟️ Fast-Track
                            </span>
                          )}
                          {(act.category?.toLowerCase().includes('food') || act.badge?.toLowerCase().includes('gem') || act.title?.toLowerCase().includes('lunch')) && (
                            <span className="text-[10px] font-extrabold text-[#854D0E] bg-[#FEF9C3] px-2.5 py-0.5 rounded-md flex items-center gap-1 border border-[#854D0E]/30">
                              🍴 Gourmet Pick
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Action bar */}
                <div className="pt-3.5 border-t border-[#ECE8E2] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={onViewItinerary || (() => { if (typeof window !== 'undefined') window.location.href = '/itinerary'; })}
                    className="group w-full h-12 px-5 rounded-2xl font-bold bg-linear-to-r from-[#FF6B2C] to-[#E65D20] text-white hover:from-[#FF7A3D] hover:to-[#FF6B2C] transition-all duration-300 ease-out text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-[0_8px_24px_rgba(255,107,44,0.3)] hover:shadow-[0_12px_32px_rgba(255,107,44,0.5)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  >
                    <span>📄 Open Full Summary & Printable View</span>
                    <span className="transition-transform duration-300 ease-out group-hover:translate-x-1.5 flex items-center">
                      <ArrowRightIcon />
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* progress bar & status checkmarks during generation */
              <>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-secondary-text block mb-2">
                    Building your itinerary
                  </span>
                  <div className="w-full h-1.5 rounded-full bg-[rgba(28,27,27,0.06)] border border-[rgba(28,27,27,0.04)] overflow-hidden">
                    <div
                      className="h-full bg-accent-orange transition-all duration-100 ease-linear"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4 mt-2">
                  {STATUS_ROWS.map((row, index) => {
                    const isRevealed = activeRowIndex >= index;
                    const isDone = activeRowIndex > index;

                    if (!isRevealed) return null;

                    return (
                      <div
                        key={row.id}
                        className={`flex items-center gap-3 transition-opacity duration-300 ${
                          isDone
                            ? 'text-(--foreground) font-semibold opacity-100'
                            : 'text-secondary-text opacity-85'
                        }`}
                      >
                        <div
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isDone
                              ? 'bg-(--accent-orange-tint)/40 border-(--accent-orange)/60 text-accent-orange'
                              : 'bg-bg-white border-[rgba(28,27,27,0.1)] text-secondary-text shadow-2xs'
                          }`}
                        >
                          {row.icon}
                        </div>
                        <span className="text-xs md:text-sm leading-snug">
                          {row.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Final Button Revealed after last row visible for ~1.3s */}
                {showFinalCTA && (
                  <div className="mt-6 animate-fade-in">
                    <button
                      type="button"
                      onClick={onViewItinerary || (() => {
                        if (typeof window !== 'undefined') {
                          window.location.href = '/itinerary';
                        }
                      })}
                      className="w-full py-3.5 px-6 rounded-xl font-semibold bg-accent-orange text-bg-white hover:opacity-90 active:scale-[0.99] transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 text-sm md:text-base shadow-md shadow-(--accent-orange)/20"
                    >
                      <span>View my itinerary</span>
                      <ArrowRightIcon />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer / Subtle Info */}
      <div className="pt-6 border-t border-[rgba(28,27,27,0.06)] mt-8 flex items-center justify-between text-[11px] text-secondary-text">
        <span>Powered by TripWise AI</span>
        <span>{step === 'input' ? 'Step 0 of 3' : step === 'parsing' ? 'Step 1 of 3' : step === 'confirming' ? 'Step 2 of 3' : 'Step 3 of 3'}</span>
      </div>
    </div>
  );
}
