'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import CustomDatePicker from './CustomDatePicker';
import { Navigation, Ticket, Heart, Sparkles, MapPin, Clock, DollarSign, ChevronRight, Plus, ArrowUpDown, MoreHorizontal, CloudSun, RefreshCw, Check, Map, Compass, ThumbsUp, ThumbsDown, Users, UserPlus } from 'lucide-react';
import {
  getActivityThumbnail,
  getTransportBetweenStops,
  getActivityRating,
  getCategoryStyling,
  getIconBadges,
  getAiInsight,
  formatCost,
  getDaySummary,
  formatReviewCount
} from './itineraryHelpers';
import { saveTrip, updateTrip, getTripCollaborators } from '../actions/trips';
import { activateTracking } from '../../lib/priceTrackingApi';
import { useRouter } from 'next/navigation';
import * as htmlToImage from 'html-to-image';
import { useCollaboration } from './CollaborationProvider';
import CollaboratorStack from './CollaboratorStack';
import InviteModal from './InviteModal';

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
    <rect x="6" y="10" width="12" height="11" rx="2" />
    <path d="M10 10V6a2 2 0 0 1 4 0v4" />
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

const getDayDateString = (startDateStr, dayIndex) => {
  if (!startDateStr) return null;
  const [year, month, day] = startDateStr.split('-');
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + dayIndex);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function PlannerSidebar({
  currentStep = 'destination',
  onStepChange = () => {},
  tripId = null,
  onTripIdChange = () => {},
  rawPrompt = "",
  onPromptChange,
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
  selectedStopIdx: propSelectedStopIdx = null,
  onSelectStop = null,
  onUpdateItinerary: originalOnUpdateItinerary = null,
  onResetPrompt = null,
  onGenerate,
  onViewItinerary
}) {
  const [internalSelectedDayIndex, setInternalSelectedDayIndex] = useState(0);
  const selectedDayIndex = propSelectedDayIndex !== undefined ? propSelectedDayIndex : internalSelectedDayIndex;
  const [isDayChanging, setIsDayChanging] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isElevating, setIsElevating] = useState(false);
  const [isUnfoldingMap, setIsUnfoldingMap] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();
  const cachedScreenshot = useRef(null);

  const collaboration = useCollaboration();
  const realtimeItinerary = collaboration?.itinerary || itinerary;
  const activeUsers = collaboration?.activeUsers || [];
  
  const onUpdateItinerary = useCallback(async (newItin) => {
    if (collaboration?.setItinerary) {
      collaboration.setItinerary(newItin);
    }
    if (originalOnUpdateItinerary) {
      await originalOnUpdateItinerary(newItin);
    }
  }, [collaboration, originalOnUpdateItinerary]);
  
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [collaboratorsList, setCollaboratorsList] = useState([]);

  const [mockVotes, setMockVotes] = useState({});

  const handleVote = (stopKey, type) => {
    setMockVotes(prev => {
      const current = prev[stopKey] || { up: 0, down: 0, userVote: null };
      if (current.userVote === type) {
        return {
          ...prev,
          [stopKey]: { ...current, [type]: Math.max(0, current[type] - 1), userVote: null }
        };
      }
      const newVotes = { ...current };
      if (current.userVote) {
        newVotes[current.userVote] = Math.max(0, newVotes[current.userVote] - 1);
      }
      newVotes[type]++;
      newVotes.userVote = type;
      return { ...prev, [stopKey]: newVotes };
    });
  };

  useEffect(() => {
    if (tripId) {
      getTripCollaborators(tripId).then(list => {
        if (list) setCollaboratorsList(list);
      });
    }
  }, [tripId, isInviteModalOpen]);

  const handleDetailedItineraryClick = async () => {
    if (isUnfoldingMap) return;
    
    // Start pre-fetching the screenshot immediately
    if (!cachedScreenshot.current) {
      htmlToImage.toJpeg(document.body, { 
        quality: 0.9,
        width: window.innerWidth, 
        height: window.innerHeight,
        pixelRatio: window.devicePixelRatio || 1,
        backgroundColor: '#F7F5F2'
      }).then(dataUrl => {
        cachedScreenshot.current = dataUrl;
      }).catch(e => console.error(e));
    }

    if (prefersReducedMotion) {
      setIsUnfoldingMap(true);
      await new Promise(r => setTimeout(r, 2000));
      if (onViewItinerary) onViewItinerary();
      else router.push('/itinerary');
      setIsUnfoldingMap(false);
      return;
    }

    setIsUnfoldingMap(true);
    await new Promise(r => setTimeout(r, 2000));
    
    try {
      let dataUrl = cachedScreenshot.current;
      if (!dataUrl) {
        dataUrl = await htmlToImage.toJpeg(document.body, { 
          quality: 0.9,
          width: window.innerWidth, 
          height: window.innerHeight,
          pixelRatio: window.devicePixelRatio || 1,
          backgroundColor: '#F7F5F2'
        });
      }
      cachedScreenshot.current = null;
      
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.perspective = '2000px';
      overlay.style.zIndex = '999999';
      overlay.style.pointerEvents = 'none';
      overlay.style.backgroundColor = '#000'; // Black background for cinematic depth

      // The new page will load in the background. We need a fade layer to reveal it smoothly.
      const fadeOverlay = document.createElement('div');
      fadeOverlay.style.position = 'absolute';
      fadeOverlay.style.inset = '0';
      fadeOverlay.style.backgroundColor = '#F7F5F2';
      fadeOverlay.style.transition = 'opacity 1200ms ease-in-out 400ms';
      overlay.appendChild(fadeOverlay);

      // Create a 3D flipping card with the screenshot
      const card = document.createElement('div');
      card.style.position = 'absolute';
      card.style.inset = '0';
      card.style.backgroundImage = `url(${dataUrl})`;
      card.style.backgroundSize = `${window.innerWidth}px ${window.innerHeight}px`;
      card.style.backgroundPosition = 'top left';
      card.style.backgroundRepeat = 'no-repeat';
      card.style.transformOrigin = 'left center';
      card.style.transition = 'transform 1500ms cubic-bezier(0.25, 1, 0.5, 1), opacity 1500ms ease-in';
      card.style.willChange = 'transform, opacity';
      card.style.boxShadow = '20px 0 50px rgba(0,0,0,0.5)';
      
      overlay.appendChild(card);
      document.body.appendChild(overlay);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Flip it open like a massive book cover
          card.style.transform = 'rotateY(-110deg) scale(0.9) translateX(-100px)';
          card.style.opacity = '0';
          fadeOverlay.style.opacity = '0';
        });
      });

      // Navigate under the overlay
      setTimeout(() => {
        if (onViewItinerary) onViewItinerary();
        else router.push('/itinerary');
      }, 50);

      // Cleanup
      setTimeout(() => {
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
        }
        setIsUnfoldingMap(false);
      }, 2000);

    } catch (e) {
      console.error('3D transition failed', e);
      if (onViewItinerary) onViewItinerary();
      else router.push('/itinerary');
      setIsUnfoldingMap(false);
    }
  };

  const handleDaySelect = (idx) => {
    if (idx === selectedDayIndex) return;
    if (onSelectDay) onSelectDay(idx);
    setInternalSelectedDayIndex(idx);
    setRefineExplanation(null);
  };

  const [internalHoveredStopIdx, setInternalHoveredStopIdx] = useState(null);
  const hoveredStopIdx = propHoveredStopIdx !== undefined ? propHoveredStopIdx : internalHoveredStopIdx;
  const handleHoverStop = (idx) => {
    if (onHoverStop) onHoverStop(idx);
    setInternalHoveredStopIdx(idx);
  };

  const [internalSelectedStopIdx, setInternalSelectedStopIdx] = useState(null);
  const selectedStopIdx = propSelectedStopIdx !== undefined ? propSelectedStopIdx : internalSelectedStopIdx;
  const selectedStopIdxRef = useRef(selectedStopIdx);
  selectedStopIdxRef.current = selectedStopIdx;

  useEffect(() => {
    if (propSelectedDayIndex !== undefined) setInternalSelectedDayIndex(propSelectedDayIndex);
  }, [propSelectedDayIndex]);

  useEffect(() => {
    if (propSelectedStopIdx !== undefined) setInternalSelectedStopIdx(propSelectedStopIdx);
  }, [propSelectedStopIdx]);

  useEffect(() => {
    if (propHoveredStopIdx !== undefined) setInternalHoveredStopIdx(propHoveredStopIdx);
  }, [propHoveredStopIdx]);
  const isProgrammaticScrollRef = useRef(false);
  const programmaticScrollTimeoutRef = useRef(null);

  const triggerProgrammaticScroll = () => {
    isProgrammaticScrollRef.current = true;
    if (programmaticScrollTimeoutRef.current) clearTimeout(programmaticScrollTimeoutRef.current);
    programmaticScrollTimeoutRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 1200); // Wait for smooth scroll to finish
  };

  const handleSelectStop = useCallback((idx, opts = {}) => {
    if (onSelectStop) onSelectStop(idx);
    setInternalSelectedStopIdx(idx);
    if (!opts.isScrollSync && typeof document !== 'undefined' && idx !== null && idx !== undefined) {
      triggerProgrammaticScroll();
      const cardEl = document.getElementById(`itinerary-card-${selectedDayIndex}-${idx}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [onSelectStop, selectedDayIndex]);

  // Automatically scroll card into view when selectedStopIdx changes externally (e.g. Map pin click)
  useEffect(() => {
    if (selectedStopIdx !== null && selectedStopIdx !== undefined && typeof document !== 'undefined') {
      // If the change came from outside and wasn't initiated by our own handleSelectStop
      // we need to trigger programmatic scroll so the observer ignores it
      triggerProgrammaticScroll();
      const cardEl = document.getElementById(`itinerary-card-${selectedDayIndex}-${selectedStopIdx}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [selectedStopIdx, selectedDayIndex]);

  // Highly robust scroll-spy to sync map and active stop during user scroll
  useEffect(() => {
    if (typeof document === 'undefined' || !itinerary?.days?.[selectedDayIndex]?.activities) return;
    
    // Find the scrollable container. We search up from one of the cards to find the nearest overflow-y-auto parent
    const firstCard = document.querySelector(`[data-day-idx="${selectedDayIndex}"]`);
    if (!firstCard) return;
    
    let scrollParent = firstCard.parentElement;
    while (scrollParent && scrollParent !== document.body) {
      const style = window.getComputedStyle(scrollParent);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        break;
      }
      scrollParent = scrollParent.parentElement;
    }
    
    // Fallback to window if no scroll parent found
    const target = (scrollParent && scrollParent !== document.body) ? scrollParent : window;

    let rafId = null;
    
    const handleScroll = () => {
      if (isProgrammaticScrollRef.current) return;
      
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const cards = document.querySelectorAll(`[data-day-idx="${selectedDayIndex}"]`);
        if (cards.length === 0) return;
        
        let bestStopNum = null;
        let minDistance = Infinity;
        
        // We consider the "active zone" to be around 25% down the viewport/container height
        const targetY = target === window ? window.innerHeight * 0.25 : scrollParent.getBoundingClientRect().top + (scrollParent.clientHeight * 0.25);

        cards.forEach((card) => {
          const rect = card.getBoundingClientRect();
          // Distance from the top of the card to our target line
          // If the card is very tall, we might want to check if the target line is *within* the card
          if (rect.top <= targetY && rect.bottom >= targetY) {
            // Target line intersects this card directly, it's a perfect match
            bestStopNum = parseInt(card.getAttribute('data-stop-idx'), 10);
            minDistance = -1; // Guaranteed to beat anything else
          } else if (minDistance !== -1) {
            // Find closest card to the line
            const distance = Math.abs(rect.top - targetY);
            if (distance < minDistance) {
              minDistance = distance;
              bestStopNum = parseInt(card.getAttribute('data-stop-idx'), 10);
            }
          }
        });

        if (bestStopNum !== null && !isNaN(bestStopNum) && bestStopNum !== selectedStopIdxRef.current) {
          handleSelectStop(bestStopNum, { isScrollSync: true });
        }
      });
    };

    target.addEventListener('scroll', handleScroll, { passive: true });
    // Also run once initially to set correct state
    handleScroll();
    
    return () => {
      target.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [selectedDayIndex, itinerary, handleSelectStop]);

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
  const [localStep, setLocalStep] = useState(() => {
    if (currentStep === 'preferences') return 'confirming';
    if (['itinerary', 'places', 'logistics', 'review'].includes(currentStep)) return 'progress';
    return (rawPrompt || itinerary?.prompt) ? 'parsing' : 'input';
  });

  const step = localStep;
  const setStep = (newStep) => {
    setLocalStep(newStep);
    if (newStep === 'input') onStepChange('destination');
    if (newStep === 'confirming') onStepChange('preferences');
    if (newStep === 'progress') onStepChange('itinerary');
  };

  useEffect(() => {
    if (currentStep === 'destination' && localStep !== 'parsing' && localStep !== 'input') setLocalStep('input');
    if (currentStep === 'preferences' && localStep !== 'confirming') setLocalStep('confirming');
    if (['itinerary', 'places', 'logistics', 'review'].includes(currentStep) && localStep !== 'progress') setLocalStep('progress');
  }, [currentStep, localStep]);

  const [userPromptInput, setUserPromptInput] = useState(() => rawPrompt || itinerary?.prompt || '');
  const [basecamp, setBasecamp] = useState(() => itinerary?.preferences?.basecamp || '');
  const [basecampSuggestions, setBasecampSuggestions] = useState([]);
  const [isSearchingBasecamp, setIsSearchingBasecamp] = useState(false);
  const [showBasecampDropdown, setShowBasecampDropdown] = useState(false);
  const basecampSearchTimeoutRef = useRef(null);

  useEffect(() => {
     if (itinerary?.prompt && !userPromptInput) {
        setUserPromptInput(itinerary.prompt);
     }
  }, [itinerary?.prompt, userPromptInput]);

  // State 2 Form Selections
  const [selectedInterests, setSelectedInterests] = useState(() =>
    itinerary?.preferences?.interests || (extracted?.interests && Array.isArray(extracted.interests) ? extracted.interests : ['Foodie', 'Nature'])
  );
  const [selectedBudget, setSelectedBudget] = useState(() => itinerary?.preferences?.budget || extracted?.budget || 'standard');
  const [selectedPace, setSelectedPace] = useState(() => itinerary?.preferences?.pace || extracted?.travelStyle || 'balanced');
  
  const [startDate, setStartDate] = useState(() => itinerary?.startDate || '');
  const [endDate, setEndDate] = useState(() => itinerary?.endDate || '');

  // Price Tracking State
  const [trackPrices, setTrackPrices] = useState(false);
  const [trackOrigin, setTrackOrigin] = useState('JFK');

  const [selectedDays, setSelectedDays] = useState(() => {
    if (itinerary?.duration) return itinerary.duration;
    if (extracted?.duration) return extracted.duration;
    if (rawPrompt) {
      const match = rawPrompt.match(/\b(\d+)\s*days?\b/i);
      if (match && match[1]) {
        const d = parseInt(match[1], 10);
        if (d > 0 && d <= 30) return d;
      }
    }
    return 3;
  });

  const handleDateChange = (type, value) => {
    if (type === 'start') {
      setStartDate(value);
      if (value && selectedDays) {
        // Auto-calculate end date based on start date + selectedDays
        const start = new Date(value);
        start.setDate(start.getDate() + selectedDays - 1);
        setEndDate(start.toISOString().split('T')[0]);
      }
    } else {
      setEndDate(value);
      if (startDate && value) {
        // If end date is manually changed, update the duration
        const start = new Date(startDate);
        const end = new Date(value);
        if (end >= start) {
          const diffTime = Math.abs(end - start);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          setSelectedDays(Math.min(30, Math.max(1, diffDays)));
        } else {
          setStartDate(value);
          setSelectedDays(1);
        }
      }
    }
  };



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

  useEffect(() => {
    // Dynamically load Google Maps script if a key is provided and not already loaded
    if (typeof window !== 'undefined' && !window.google && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const fetchBasecampSuggestions = async (query) => {
    if (!query || query.trim().length < 3) {
      setBasecampSuggestions([]);
      setShowBasecampDropdown(false);
      return;
    }
    setIsSearchingBasecamp(true);

    // 1. Google Places API (Requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local)
    if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
      const service = new window.google.maps.places.AutocompleteService();
      // 'lodging' type strictly returns hotels, motels, and accommodations
      service.getPlacePredictions({ input: query, types: ['lodging'] }, (predictions, status) => {
        setIsSearchingBasecamp(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setBasecampSuggestions(predictions.map(p => ({
            place_id: p.place_id,
            name: p.structured_formatting.main_text,
            display_name: p.description
          })));
          setShowBasecampDropdown(true);
        } else {
          setBasecampSuggestions([]);
          setShowBasecampDropdown(false);
        }
      });
      return;
    }

    // 2. Fallback: Highly optimized Nominatim strict hotel search
    try {
      const searchUrl = `https://nominatim.openstreetmap.org/search?q=hotel+${encodeURIComponent(query)}&format=json&limit=8`;
      const res = await fetch(searchUrl);
      const data = await res.json();
      
      // Filter strictly for accommodations to ensure it only shows hotels
      const hotels = data.filter(d => 
        ['hotel', 'guest_house', 'hostel', 'motel', 'apartment'].includes(d.type) || 
        d.class === 'tourism'
      );
      
      const finalSuggestions = hotels.length > 0 ? hotels : data;
      setBasecampSuggestions(finalSuggestions);
      setShowBasecampDropdown(finalSuggestions.length > 0);
    } catch (err) {
      console.error("Autocomplete error:", err);
    } finally {
      setIsSearchingBasecamp(false);
    }
  };

  const handleBasecampChange = (e) => {
    const val = e.target.value;
    setBasecamp(val);
    if (basecampSearchTimeoutRef.current) clearTimeout(basecampSearchTimeoutRef.current);
    if (val.trim().length === 0) {
      setShowBasecampDropdown(false);
      return;
    }
    basecampSearchTimeoutRef.current = setTimeout(() => {
      fetchBasecampSuggestions(val);
    }, 500);
  };

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

  const handleActivityVote = (dayIdx, activityIdx, voteType) => {
    if (!itinerary?.days?.[dayIdx]?.activities?.[activityIdx]) return;
    const currentDays = [...itinerary.days];
    const currentDay = { ...currentDays[dayIdx] };
    const currentActivities = [...currentDay.activities];
    const activity = { ...currentActivities[activityIdx] };

    // Toggle logic: if clicking the same vote type, clear it (0)
    const newVote = activity.userVote === voteType ? 0 : voteType;
    activity.userVote = newVote;
    
    currentActivities[activityIdx] = activity;
    currentDay.activities = currentActivities;
    currentDays[dayIdx] = currentDay;

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
    setLocalStep('progress');
    onStepChange('itinerary');
    if (onGenerate && selections) {
      const cleanBasecamp = basecamp?.trim() || '';
      onGenerate({
        ...selections,
        basecamp: cleanBasecamp,
        hotelMode: cleanBasecamp ? 'basecamp' : 'undecided',
        basecampHotel: cleanBasecamp || null,
        prompt: userPromptInput || rawPrompt || "Planning a trip",
        destination: parsedIntent?.destination || extracted?.destination || userPromptInput || rawPrompt || "Your Destination",
        startDate: startDate,
        endDate: endDate
      });
    }
  }, [onGenerate, userPromptInput, rawPrompt, extracted?.destination, parsedIntent?.destination, basecamp, onStepChange, startDate, endDate]);

  // Sync when rawPrompt is updated from external click (e.g. clicking a destination card on the right radar map)
  useEffect(() => {
    if (rawPrompt && rawPrompt !== userPromptInput) {
      setUserPromptInput(rawPrompt);
      const match = rawPrompt.match(/\b(\d+)\s*days?\b/i);
      if (match && match[1]) {
        const d = parseInt(match[1], 10);
        if (d > 0 && d <= 30) setSelectedDays(d);
      }
      setStep('parsing');
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
          if (intent.duration_days) {
            setSelectedDays(Number(intent.duration_days));
          }
        }
      } catch (err) {
        console.error("Error parsing intent:", err);
      } finally {
        if (isMounted) {
          // Optimistic save of step 1 (Destination)
          const partialData = {
              ...(itinerary || {}),
              lastCompletedStep: 'destination',
              prompt: userPromptInput
          };
          const destName = parsedIntent?.destination || userPromptInput || "Draft Trip";
          if (tripId) {
              updateTrip(tripId, destName, partialData).catch(e => console.error(e));
          } else {
              saveTrip(destName, partialData).then(res => {
                  if (res && res.trip) onTripIdChange(res.trip.id);
              }).catch(e => console.error(e));
          }
          
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
    if (onPromptChange) {
      onPromptChange('');
    }
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

  const handlePromptTextChange = (e) => {
    const newVal = e.target.value;
    setUserPromptInput(newVal);
    
    // Look for X days in the prompt
    const match = newVal.match(/\b(\d+)\s*days?\b/i);
    if (match && match[1]) {
      const parsedDays = parseInt(match[1], 10);
      if (parsedDays > 0 && parsedDays <= 30) {
        setSelectedDays(parsedDays);
      }
    }
  };

  const handleDaysCounterChange = (newDays) => {
    setSelectedDays(newDays);
    if (startDate) {
      // Auto-calculate end date based on new duration
      const start = new Date(startDate);
      start.setDate(start.getDate() + newDays - 1);
      setEndDate(start.toISOString().split('T')[0]);
    }
    
    setUserPromptInput((prev) => {
      const current = prev || "";
      const match = current.match(/\b(\d+)\s*days?\b/i);
      if (match) {
        // Replace the number
        return current.replace(/\b(\d+)(\s*days?)\b/i, `${newDays}$2`);
      } else {
        // Append if not found
        const trimmed = current.trim();
        return trimmed ? `${trimmed} for ${newDays} days` : `${newDays} days`;
      }
    });
  };

  const toggleInterest = (id) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleGenerateClick = () => {
    // Optimistically save that they finished Preferences
    const partialData = {
        ...(itinerary || {}),
        lastCompletedStep: 'preferences',
        prompt: userPromptInput,
        preferences: {
            interests: selectedInterests,
            budget: selectedBudget,
            pace: selectedPace,
            basecamp: basecamp
        },
        duration: selectedDays,
        startDate: startDate,
        endDate: endDate
    };
    const destName = parsedIntent?.destination || userPromptInput || "Draft Trip";
    let activeTripId = tripId;

    if (tripId) {
        updateTrip(tripId, destName, partialData).catch(e => console.error(e));
    } else {
        saveTrip(destName, partialData).then(res => {
            if (res && res.trip) {
                activeTripId = res.trip.id;
                onTripIdChange(res.trip.id);
            }
        }).catch(e => console.error(e));
    }

    if (trackPrices) {
        // Activate price tracking baseline in background
        activateTracking(activeTripId || 'shared-trip', destName, {
            startDate,
            trackFlights: true,
            trackHotels: true,
            origin: trackOrigin
        }).catch(e => console.error("Tracking setup error", e));
    }

    startProgressTransition({
      interests: selectedInterests,
      budget: selectedBudget,
      pace: selectedPace,
      days: selectedDays,
      startDate: startDate,
      endDate: endDate
    });
  };

  const handleSkipClick = () => {
    handleGenerateClick();
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

  const isTagActive = (tag) => {
    const cleanTag = tag.replace('➕ ', '').replace('✓ ', '').replace('&', '').trim().toLowerCase().replace(/\s+/g, ' ');
    const promptNorm = userPromptInput.toLowerCase().replace(/&/g, '').replace(/\s+/g, ' ');
    return promptNorm.includes(cleanTag);
  };

  const toggleVibeEnhancer = (tag) => {
    const cleanTag = tag.replace('➕ ', '').replace('✓ ', '').trim();
    const searchPattern = new RegExp(`[,.\\s]*include\\s+${cleanTag.toLowerCase()}[,.\\s]*`, 'gi');
    
    if (isTagActive(tag)) {
      setUserPromptInput((prev) => {
        let updated = prev.replace(searchPattern, ' ').trim();
        updated = updated.replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim();
        if (updated.startsWith(',')) updated = updated.slice(1).trim();
        if (updated.endsWith(',')) updated = updated.slice(0, -1).trim();
        if (onPromptChange) onPromptChange(updated);
        return updated;
      });
    } else {
      setUserPromptInput((prev) => {
        const trimmed = prev.trim();
        let updated = '';
        if (!trimmed) {
          updated = `Include ${cleanTag.toLowerCase()}.`;
        } else {
          const cleanPrev = trimmed.endsWith('.') ? trimmed.slice(0, -1) : trimmed;
          updated = `${cleanPrev}, include ${cleanTag.toLowerCase()}.`;
        }
        if (onPromptChange) onPromptChange(updated);
        return updated;
      });
    }
  };

  return (
    <div className={`w-full flex-1 min-h-full bg-[#FAF3EE] text-stone-900 ${step === 'progress' && showFinalCTA && itinerary ? 'p-4 md:p-6' : 'p-6 md:p-8'} flex flex-col justify-between font-sans select-none border-r border-stone-200/60`}>
      {/* Top Header Brand / Label with Sticky wrapper */}
      <div className="sticky top-0 z-30 bg-[#FAF3EE] pt-2 pb-4 -mx-6 md:-mx-8 px-6 md:px-8 border-b border-stone-200/50 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B2C]" />
            <span className="text-xs font-bold tracking-widest uppercase text-stone-500">
              TripWise AI Planner
            </span>
          </div>
          {step !== 'input' && !(step === 'progress' && showFinalCTA && itinerary) && (
            <button
              type="button"
              onClick={handleNewPrompt}
              className="text-xs font-semibold text-[#FF6B2C] hover:underline cursor-pointer bg-transparent border-none"
            >
              ← New Prompt
            </button>
          )}
        </div>

        {step === 'input' && (
          <div className="space-y-2 mb-4">
            <h2 className="text-3xl md:text-4xl font-black text-stone-900 tracking-tight leading-tight">
              Where to next?
            </h2>
            <p className="text-sm md:text-base text-stone-650 leading-relaxed">
              Tell TripWise your dream destination, vibe, budget, or timeline. Our AI will craft your custom itinerary in seconds.
            </p>
          </div>
        )}

        {/* Visual Progress Stepper placed prominently near the top */}
        <div className="flex items-center justify-between max-w-md mx-auto mt-4 px-2">
          {[
            { label: 'Prompt', id: 'input' },
            { label: 'Details', id: 'parsing' },
            { label: 'Vibe', id: 'confirming' },
            { label: 'Generate', id: 'progress' }
          ].map((s, idx) => {
            const stepOrder = ['input', 'parsing', 'confirming', 'progress'];
            const currentIdx = stepOrder.indexOf(step);
            const isCompleted = currentIdx > idx;
            const isActive = currentIdx === idx;
            
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-[#2FA66A] text-white shadow-xs' 
                      : isActive 
                      ? 'bg-[#FF6B2C] text-white ring-4 ring-[#FF6B2C]/20 scale-105 shadow-xs' 
                      : 'bg-stone-200 text-stone-400 border border-stone-300'
                  }`}>
                    {isCompleted ? '✓' : idx + 1}
                  </div>
                  <span className={`text-[9px] font-extrabold uppercase tracking-wider ${
                    isActive ? 'text-[#FF6B2C]' : isCompleted ? 'text-[#2FA66A]' : 'text-stone-400'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {idx < 3 && (
                  <div className="flex-1 h-0.5 mx-2 bg-stone-200 -mt-4 relative overflow-hidden rounded-full shrink-0">
                    <div className={`h-full bg-[#2FA66A] ${
                      isCompleted 
                        ? 'w-full' 
                        : isActive 
                        ? 'w-1/2 animate-pulse' 
                        : 'w-0'
                    } transition-all duration-500`} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div data-lenis-prevent="true" className="flex-1 overflow-y-auto overflow-x-hidden pr-2 -mr-3 scroll-smooth min-h-0">
        {/* STATE 0: Prompt Input Setup Page */}
        {step === 'input' && (
          <div className="space-y-8 animate-fade-in">
            {/* Input Block */}
            <div className="space-y-6">
              <textarea
                value={userPromptInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setUserPromptInput(val);
                  if (onPromptChange) onPromptChange(val);
                }}
                placeholder="e.g., 5 days in Kyoto during cherry blossom season... love historic temples, hidden gardens, authentic ramen shops, and boutique stays."
                className="w-full h-36 p-4 md:p-5 rounded-2xl bg-white border border-stone-300 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 text-sm md:text-base text-stone-900 placeholder:text-stone-400 focus:outline-none shadow-sm transition-all duration-150 resize-none font-medium"
              />

              {/* Basecamp Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  {isSearchingBasecamp ? (
                    <div className="w-4 h-4 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <MapPin className="w-4 h-4 text-stone-400" />
                  )}
                </div>
                <input
                  type="text"
                  value={basecamp}
                  onChange={handleBasecampChange}
                  onFocus={() => { if (basecampSuggestions.length > 0) setShowBasecampDropdown(true); }}
                  onBlur={() => setTimeout(() => setShowBasecampDropdown(false), 200)}
                  placeholder="Where are you staying? (e.g. Hotel Artemide, Rome)"
                  className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-white border border-stone-300 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 text-sm md:text-base text-stone-900 placeholder:text-stone-400 focus:outline-none shadow-sm transition-all duration-150 font-medium"
                />
                
                {/* Autocomplete Dropdown */}
                {showBasecampDropdown && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-stone-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {basecampSuggestions.map((place) => (
                      <div
                        key={place.place_id}
                        className="px-4 py-3 hover:bg-stone-50 cursor-pointer border-b border-stone-100 last:border-0 transition-colors"
                        onClick={() => {
                          setBasecamp(place.name || place.display_name.split(',')[0]);
                          setShowBasecampDropdown(false);
                        }}
                      >
                        <div className="font-semibold text-stone-800 text-sm">{place.name || place.display_name.split(',')[0]}</div>
                        <div className="text-xs text-stone-500 truncate mt-0.5">{place.display_name}</div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-stone-500 mt-1.5 leading-relaxed font-sans">
                  Already booked a place to stay? Tell us and we'll route your itinerary around it. Not sure yet? Leave this blank — we'll help you pick one later.
                </p>
              </div>

              {/* Vibe Enhancers */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B2C] flex items-center gap-1.5">
                    <span>⚡ One-Click Vibe Enhancers</span>
                  </span>
                  <span className="text-[11px] text-stone-500 font-normal">Click to toggle</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    "➕ Hidden Local Gems",
                    "➕ Michelin & Street Food",
                    "➕ Scenic Photography Spots",
                    "➕ Budget Friendly & Hostels",
                    "➕ Luxury Boutique Stays",
                    "➕ Fast-Paced Nightlife"
                  ].map((tag, idx) => {
                    const active = isTagActive(tag);
                    const label = active ? `✓ ${tag.replace('➕ ', '')}` : tag;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleVibeEnhancer(tag)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all duration-150 cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                          active
                            ? 'bg-[#FF6B2C] text-white border-[#FF6B2C] shadow-sm ring-2 ring-[#FF6B2C]/30 scale-102 font-extrabold'
                            : 'bg-white hover:bg-[#FF6B2C]/10 hover:text-[#FF6B2C] text-stone-700 border-stone-200/60 shadow-2xs'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

            {/* Example Prompts styled as links list */}
            <div className="space-y-2.5 pt-4 border-t border-stone-200/60">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
                💡 Quick Start Ideas (Text Templates):
              </span>
                <div className="flex flex-col gap-2">
                  {[
                    { text: "5 days in Kyoto: temples, gardens & street food", emoji: "🌸" },
                    { text: "3 budget days in Rome: hidden gems & local pasta", emoji: "🍕" },
                    { text: "7 fast-paced days in Tokyo: cyberpunk nightlife & tech", emoji: "⚡" }
                  ].map((ex, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setUserPromptInput(`${ex.emoji} ${ex.text}`);
                        if (onPromptChange) onPromptChange(`${ex.emoji} ${ex.text}`);
                        setStep('parsing');
                      }}
                      className="w-full flex items-center justify-between text-left text-xs sm:text-sm text-[#1F1F1F] hover:text-[#FF6B2C] transition-all bg-white hover:bg-stone-50 border border-stone-200/60 rounded-xl p-3 shadow-2xs group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-sm shrink-0">{ex.emoji}</span>
                        <span className="font-semibold truncate text-stone-700 group-hover:text-stone-900">{ex.text}</span>
                      </div>
                      <span className="text-[#FF6B2C] opacity-0 group-hover:opacity-100 transition-all font-bold text-xs shrink-0 -translate-x-1 group-hover:translate-x-0">
                        Try it →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled={!userPromptInput.trim()}
                onClick={() => {
                  if (userPromptInput.trim()) {
                    const match = userPromptInput.match(/\b(\d+)\s*days?\b/i);
                    if (match && match[1]) {
                      const d = parseInt(match[1], 10);
                      if (d > 0 && d <= 30) setSelectedDays(d);
                    }
                    setStep('parsing');
                  }
                }}
                className={`group relative w-full py-4 px-6 rounded-2xl font-extrabold text-base transition-all duration-300 flex items-center justify-center gap-2.5 overflow-hidden ${
                  userPromptInput.trim()
                    ? 'bg-linear-to-r from-[#FF6B2C] to-[#E55A20] text-white shadow-[0_8px_20px_rgba(255,107,44,0.4)] hover:shadow-[0_12px_30px_rgba(255,107,44,0.6)] hover:-translate-y-1 active:scale-[0.98] active:translate-y-0 cursor-pointer border border-[#FF854F]/30'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed opacity-60 border border-stone-300/40'
                }`}
              >
                {/* Hover Shine Effect */}
                {userPromptInput.trim() && (
                  <div className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/30 to-transparent -skew-x-12 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out" />
                )}
                
                <span className="relative z-10 tracking-wide drop-shadow-sm text-lg">Plan My Trip</span>
                <div className="relative z-10 transition-transform duration-300 group-hover:translate-x-2">
                  <ArrowRightIcon />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STATE 1: Parsing */}
        {step === 'parsing' && (
          <div className="flex flex-col gap-5 animate-fade-in pt-4">
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
          <div className="flex flex-col gap-6 animate-fade-in pb-16">
            <h2 className="text-lg md:text-xl font-semibold text-(--foreground) leading-snug">
              Got it, {destinationName}. A couple quick things:
            </h2>

            {/* Editable Prompt */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary-text mb-2.5">
                Your Prompt
              </label>
              <textarea
                value={userPromptInput}
                onChange={handlePromptTextChange}
                rows={3}
                className="w-full p-3 rounded-xl border border-[rgba(28,27,27,0.1)] bg-bg-white text-(--foreground) text-sm shadow-2xs focus:outline-none focus:ring-2 focus:ring-accent-orange/40 focus:border-accent-orange transition-all resize-none"
                placeholder="E.g., 5 days in Tokyo focusing on street food and neon lights..."
              />
            </div>


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
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs md:text-sm font-semibold transition-all duration-150 cursor-pointer shadow-2xs hover:scale-[1.01] active:scale-98 ${
                        isActive
                          ? 'bg-[#FF6B2C]/10 border-2 border-[#FF6B2C] text-stone-900 font-extrabold shadow-sm'
                          : 'bg-white border border-stone-200 text-stone-650 hover:border-stone-400 font-medium'
                      }`}
                    >
                      <span className={isActive ? 'text-[#FF6B2C]' : 'text-stone-400'}>
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

            {/* Trip duration */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary-text mb-2.5">
                Trip duration (days)
              </label>
              <div className="flex items-center justify-between p-1.5 rounded-xl bg-bg-white border border-[rgba(28,27,27,0.1)] shadow-2xs mb-4">
                <button
                  type="button"
                  onClick={() => handleDaysCounterChange(Math.max(1, selectedDays - 1))}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-500 font-bold transition-colors cursor-pointer"
                >
                  –
                </button>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-[#1F1F1F]">{selectedDays}</span>
                  <span className="text-xs font-medium text-stone-400">days</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDaysCounterChange(Math.min(30, selectedDays + 1))}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-500 font-bold transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>
              
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-secondary-text">
                  Travel Dates (Optional)
                </label>
              </div>
              <div className="flex gap-2 relative z-50">
                <div className="flex-1">
                  <CustomDatePicker
                    value={startDate}
                    onChange={(val) => handleDateChange('start', val)}
                    placeholder="Start date"
                  />
                </div>
                <div className="flex items-center text-stone-400">
                  <ArrowRightIcon />
                </div>
                <div className="flex-1">
                  <CustomDatePicker
                    value={endDate}
                    onChange={(val) => handleDateChange('end', val)}
                    placeholder="End date"
                  />
                </div>
              </div>

              {/* Price Tracking Opt-In */}
              <div className="mt-4 p-4 rounded-xl bg-[#FAF6F0] border border-[#E6DFD5]">
                <label className="flex items-start justify-between cursor-pointer group">
                  <div className="flex flex-col gap-0.5 max-w-[200px]">
                    <span className="text-sm font-bold text-[#1E1C1A] group-hover:text-[#FF6B2C] transition-colors">Track Prices</span>
                    <span className="text-xs text-[#7A7268]">Monitor flight & hotel prices for drops</span>
                  </div>
                  <div className={`mt-1 w-10 h-6 rounded-full transition-colors relative shrink-0 ${trackPrices ? 'bg-[#FF6B2C]' : 'bg-[#E6DFD5]'}`}>
                    <input type="checkbox" className="sr-only" checked={trackPrices} onChange={() => setTrackPrices(!trackPrices)} />
                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${trackPrices ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </label>
                
                <AnimatePresence>
                  {trackPrices && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="overflow-hidden"
                    >
                      <label className="block text-[10px] font-bold text-[#7A7268] uppercase tracking-wider mb-1">Origin Airport</label>
                      <input 
                        type="text" 
                        value={trackOrigin}
                        onChange={(e) => setTrackOrigin(e.target.value.toUpperCase())}
                        maxLength={3}
                        className="w-full bg-white border border-[#E6DFD5] py-2 px-3 rounded-lg text-sm font-mono font-bold focus:outline-none focus:border-[#FF6B2C] transition-colors"
                        placeholder="JFK"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
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
                      <span>{itinerary.days?.[selectedDayIndex]?.dateLabel || getDayDateString(itinerary?.startDate || startDate, selectedDayIndex) || `Day ${selectedDayIndex + 1}`} • {itinerary.days?.[selectedDayIndex]?.activities?.length || 0} Stops</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleNewPrompt}
                    className="group px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-bold bg-white border border-[#E6DFD5] text-[#1E1C1A] hover:border-[#FF6B2C]/40 hover:bg-[#FAF6F0] hover:text-[#FF6B2C] transition-all duration-300 cursor-pointer shadow-xs hover:shadow-sm hover:-translate-y-0.5 shrink-0 flex items-center gap-1.5 sm:gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#A89F91] group-hover:text-[#FF6B2C] transition-all duration-500 group-hover:rotate-180" />
                    <span>New Prompt</span>
                  </button>
                </div>

                {/* Merged Day Tabs + Compact Sticky Trip Summary Header (Apple Maps / Arc / Linear inspired) */}
                <div className="sticky top-0 z-30 pt-4 pb-3 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 bg-[#FAF3EE] transition-all duration-300 flex flex-col gap-2.5">
                  {(() => {
                    const activeDayObj = itinerary.days?.[selectedDayIndex];
                    const daySummary = getDaySummary(activeDayObj, selectedDayIndex, itinerary.days);
                    return (
                      <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-[rgba(28,27,27,0.08)] shadow-sm flex flex-col gap-2.5 transition-all duration-300">
                        {/* Top Row: Day Navigation Segmented Control + Weather Chip (top-right) */}
                        <div className="flex items-center justify-between gap-3">
                          {itinerary.days && itinerary.days.length > 0 ? (
                            <div className="inline-flex items-center gap-1 bg-[#F6F4F1] p-0.5 rounded-full border border-[#ECE8E2] h-8.5 select-none shadow-inner w-fit">
                              {itinerary.days.map((day, idx) => {
                                const isSelected = selectedDayIndex === idx;
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleDaySelect(idx)}
                                    className="relative px-4 sm:px-5 h-full text-xs transition-colors duration-300 cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-full focus:outline-hidden z-10"
                                  >
                                    {isSelected && (
                                      <motion.span
                                        layoutId="activeDaySegmentedTab"
                                        className="absolute inset-0 rounded-full bg-[#EC6735] shadow-[0_1px_6px_rgba(236,103,53,0.28)] -z-10"
                                        transition={{
                                          layout: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
                                        }}
                                      />
                                    )}
                                    <span className={`relative transition-colors duration-300 ${
                                      isSelected ? 'text-white font-semibold' : 'text-[#5F5E5A] hover:text-[#1C1B1B] font-medium'
                                    }`}>
                                      {getDayDateString(itinerary?.startDate || startDate, idx) || `Day ${idx + 1}`}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          ) : <div />}

                          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1C1B1B] bg-[#F7F5F2] px-2.5 py-1 rounded-full border border-[#ECE8E2] shrink-0 select-none shadow-2xs">
                            <span>☀︎</span>
                            <span>{daySummary.stats.weather || '32°'}</span>
                          </div>
                        </div>

                        {/* Second Row: Clean Inline Statistics & Rebalanced Action Toolbar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-[rgba(28,27,27,0.06)] text-xs font-medium text-[#5F5E5A]">
                          {/* Left: Clean horizontal statistics separated by subtle dots */}
                          <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 min-w-0 select-none text-[#5F5E5A]">
                            <span className="inline-flex items-center gap-1">
                              <span className="text-[11px] text-[#8C8B88]">📍</span>
                              <span>{String(daySummary.stats.stops).includes('Stop') ? daySummary.stats.stops : `${daySummary.stats.stops} Stops`}</span>
                            </span>
                            <span className="text-[#ECE8E2] font-light">•</span>
                            <span className="inline-flex items-center gap-1">
                              <span className="text-[11px] text-[#8C8B88]">🕒</span>
                              <span>{daySummary.stats.hours}</span>
                            </span>
                            <span className="text-[#ECE8E2] font-light">•</span>
                            <span className="inline-flex items-center gap-1">
                              <span className="text-[11px] text-[#8C8B88]">🚶</span>
                              <span>{daySummary.stats.distance}</span>
                            </span>
                            <span className="text-[#ECE8E2] font-light">•</span>
                            <span className="inline-flex items-center gap-1 text-[#15803D] font-bold">
                              <span className="text-[11px]">💰</span>
                              <span>{daySummary.stats.cost}</span>
                            </span>
                          </div>

                          {/* Right: Only Optimize Route (Primary orange) and Add Stop (Lightweight ghost) */}
                          <div className="flex items-center flex-nowrap gap-2 shrink-0 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => { setShowCopilotDrawer(true); setActiveDrawerTab('ai'); }}
                              className="inline-flex items-center gap-1.5 h-8.5 px-3.5 rounded-xl bg-[#EC6735] text-white hover:bg-[#D95524] text-xs font-semibold shadow-[0_2px_8px_rgba(236,103,53,0.25)] transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 shrink-0"
                            >
                              <Sparkles className="w-3.5 h-3.5 shrink-0" />
                              <span>Optimize Route</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => { setShowCopilotDrawer(true); setActiveDrawerTab('manual'); }}
                              className="inline-flex items-center gap-1.5 h-8.5 px-3.5 rounded-xl bg-transparent hover:bg-black/5 text-[#1C1B1B] text-xs font-semibold transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 shrink-0"
                              title="Add Stop"
                            >
                              <Plus className="w-3.5 h-3.5 text-[#6B6B6B] shrink-0" />
                              <span>Add Stop</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Unified Floating Modify / Copilot Drawer with Smooth Pop Animation */}
                  <div className={`w-full transition-all duration-500 ease-in-out overflow-hidden ${
                    showCopilotDrawer || isRefiningDay || refineExplanation
                      ? 'max-h-115 opacity-100 mt-0.5 mb-1'
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
                            <span>➕</span>
                            <span>Add Stop</span>
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setShowCopilotDrawer(false); setRefinePromptInput(''); }}
                          className="text-stone-400 hover:text-white text-sm font-bold w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 cursor-pointer"
                          title="Close"
                        >
                          ✕
                        </button>
                      </div>

                      {activeDrawerTab === 'ai' ? (
                        <>
                          <textarea
                            value={refinePromptInput}
                            onChange={(e) => setRefinePromptInput(e.target.value)}
                            placeholder="e.g. 'Add a highly rated rooftop bar near the Colosseum for sunset' or 'Replace dinner with authentic Trastevere pasta spot'"
                            className="w-full bg-black/40 text-white placeholder-stone-400 text-xs rounded-xl p-2.5 border border-white/10 focus:border-[#EC6735] focus:outline-hidden resize-none min-h-14 font-medium"
                          />
                          <div className="flex items-center justify-between gap-2 pt-0.5">
                            <span className="text-[11px] text-stone-400 italic">
                              ⚡ GeoEngine re-calculates travel times & pacing
                            </span>
                            <button
                              type="button"
                              onClick={() => triggerRefineDay()}
                              disabled={isRefiningDay || !refinePromptInput.trim()}
                              className={`h-8 px-4 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                                isRefiningDay || !refinePromptInput.trim()
                                  ? 'bg-white/10 text-stone-400 cursor-not-allowed'
                                  : 'bg-[#EC6735] text-white hover:bg-[#D95524] shadow-md shadow-[#EC6735]/30 active:scale-95'
                              }`}
                            >
                              {isRefiningDay ? (
                                <>
                                  <SpinnerIcon />
                                  <span>Refining...</span>
                                </>
                              ) : (
                                <>
                                  <span>Update Route</span>
                                  <ArrowRightIcon />
                                </>
                              )}
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col gap-2.5 pt-0.5">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[10px] font-extrabold uppercase text-stone-400 mb-1">Time</label>
                              <input
                                type="text"
                                value={newStopTime}
                                onChange={(e) => setNewStopTime(e.target.value)}
                                placeholder="06:00 PM"
                                className="w-full bg-black/40 text-white text-xs rounded-lg p-2 border border-white/10 focus:border-[#EC6735] focus:outline-hidden font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-extrabold uppercase text-stone-400 mb-1">Type</label>
                              <select
                                value={newStopCategory}
                                onChange={(e) => setNewStopCategory(e.target.value)}
                                className="w-full bg-black/40 text-white text-xs rounded-lg p-2 border border-white/10 focus:border-[#EC6735] focus:outline-hidden font-medium"
                              >
                                <option value="Highlight">Highlight</option>
                                <option value="Food & Dining">Food & Dining</option>
                                <option value="Cultural">Cultural</option>
                                <option value="Hidden Gem">Hidden Gem</option>
                                <option value="Activity">Activity</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-extrabold uppercase text-stone-400 mb-1">Title</label>
                              <input
                                type="text"
                                value={newStopTitle}
                                onChange={(e) => setNewStopTitle(e.target.value)}
                                placeholder="e.g. Rooftop Aperitivo"
                                className="w-full bg-black/40 text-white text-xs rounded-lg p-2 border border-white/10 focus:border-[#EC6735] focus:outline-hidden font-medium"
                              />
                            </div>
                          </div>
                          <div>
                            <input
                              type="text"
                              value={newStopDesc}
                              onChange={(e) => setNewStopDesc(e.target.value)}
                              placeholder="Optional short description or note..."
                              className="w-full bg-black/40 text-white text-xs rounded-lg p-2 border border-white/10 focus:border-[#EC6735] focus:outline-hidden font-medium"
                            />
                          </div>
                          <div className="flex justify-end pt-1 border-t border-white/10">
                            <button
                              type="button"
                              onClick={handleAddCustomStop}
                              disabled={!newStopTitle.trim()}
                              className={`h-8 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                                !newStopTitle.trim()
                                  ? 'bg-white/10 text-stone-400 cursor-not-allowed'
                                  : 'bg-[#EC6735] text-white hover:bg-[#D95524] shadow-md shadow-[#EC6735]/30 active:scale-95'
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Insert Stop into Timeline</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

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

                {/* Day Schedule Activities Cards List with Vertical Timeline (Point 4, 5, & 6) */}
                <div className="relative px-1 pt-3 pb-1 w-full z-10">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedDayIndex}
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, y: -10, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } }}
                      className="relative flex flex-col gap-3.5 w-full pb-6"
                    >
                      {/* Point 5 & 1: Subtle orange continuous vertical timeline connecting stops */}
                      <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-linear-to-b from-[#FF6B2C] via-[#FF6B2C]/50 to-[#FF6B2C]/20 pointer-events-none z-0" />

                      {itinerary.days?.[selectedDayIndex]?.activities?.map((act, idx) => {
                        const stopNum = idx + 1;
                        const isHovered = hoveredStopIdx === stopNum;
                        const isSelected = selectedStopIdx === stopNum;
                        const categoryStyle = getCategoryStyling(act);
                        const ratingData = getActivityRating(act, idx);
                        const costInfo = formatCost(act);
                        const iconBadges = getIconBadges(act, idx);
                        const aiInsightText = getAiInsight(act, idx);
                        const transport = getTransportBetweenStops(itinerary.days?.[selectedDayIndex]?.activities?.[idx - 1], act, idx);

                        return (
                          <motion.div
                            key={`${selectedDayIndex}-${idx}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0, transition: { duration: 0.26, delay: idx * 0.06, ease: [0.22, 1, 0.36, 1] } }}
                            exit={{ opacity: 0, y: -10, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } }}
                            className="flex flex-col"
                            data-day-idx={selectedDayIndex}
                            data-stop-idx={stopNum}
                          >
                            {/* Point 1 & 10: Transport Connector Between Stops */}
                            {idx > 0 && transport && (
                              <div className="relative pl-12 py-2 flex items-center z-10">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFF8F5] hover:bg-[#FFF2EA] border border-[#ECE8E2] rounded-full text-[11px] font-extrabold text-[#5F5E5A] shadow-2xs transition-all">
                                  <span className="text-xs">{transport.icon}</span>
                                  <span className="tracking-tight text-[#1C1B1B]">{transport.text}</span>
                                </div>
                              </div>
                            )}

                            {/* Drag & Interactive Activity Card */}
                            <div
                              id={`itinerary-card-${selectedDayIndex}-${stopNum}`}
                              draggable={true}
                              onDragStart={(e) => handleDragStart(e, idx)}
                              onDragOver={(e) => handleDragOver(e, idx)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, idx)}
                              onDragEnd={handleDragEnd}
                              onMouseEnter={() => handleHoverStop(stopNum)}
                              onMouseLeave={() => handleHoverStop(null)}
                              onClick={() => {
                                handleSelectStop(isSelected ? null : stopNum);
                                handleHoverStop(stopNum);
                              }}
                              className={`scroll-mt-40 w-full box-border p-4 rounded-2xl border transition-all duration-300 ease-out flex flex-col gap-3 cursor-pointer select-none relative z-10 ${
                                dragOverStopIdx === idx
                                  ? 'border-[#FF6B2C] border-2 bg-[#FFF8F5] scale-[1.02] ring-4 ring-[#FF6B2C]/30 shadow-2xl z-30'
                                  : draggedStopIdx === idx
                                  ? 'opacity-40 border-dashed border-[#FF6B2C] scale-95'
                                  : isSelected
                                  ? 'border-[#EC6735] border-2 bg-[#FFF8F5] shadow-[0_12px_36px_rgba(236,103,53,0.18)] scale-[1.01] z-20'
                                  : isHovered || hoveredStopIdx === stopNum
                                  ? 'border-[#FF6B2C] bg-white shadow-[0_12px_28px_rgba(255,107,44,0.16)] -translate-y-1 z-20'
                                  : 'border-[#ECE8E2] bg-white shadow-2xs hover:border-[#FF6B2C]/60 hover:shadow-md hover:-translate-y-0.5'
                              }`}
                            >
                              <div className="flex items-start gap-3.5">
                                {/* Stop Number Circle / Timeline Node */}
                                <div className="flex flex-col items-center shrink-0 pt-0.5">
                                  <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-black transition-all ${
                                    isSelected || isHovered
                                      ? 'bg-[#EC6735] text-white border-[#EC6735] shadow-md scale-110'
                                      : 'bg-[#FFF2EA] text-[#FF6B2C] border-[#FF6B2C]/30'
                                  }`}>
                                    {stopNum}
                                  </div>
                                </div>

                                {/* Point 2: Activity Thumbnail (80-100px) */}
                                <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-[#ECE8E2] shadow-2xs">
                                  <img
                                    src={getActivityThumbnail(act, idx)}
                                    alt={act.title}
                                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                                    loading="lazy"
                                  />
                                </div>

                                {/* Main Content Hierarchy */}
                                <div className="flex-1 min-w-0 flex flex-col gap-1">
                                  <div className="flex items-center justify-between gap-1 flex-wrap">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-mono font-extrabold text-[#FF6B2C]">{act.time || '10:00 AM'}</span>
                                      <span>•</span>
                                      <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${categoryStyle.badgeClass}`}>
                                        <span>{categoryStyle.icon}</span> <span>{categoryStyle.name}</span>
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="text-sm sm:text-base font-black text-[#1C1B1B] leading-snug tracking-tight">
                                      {act.title}
                                    </h4>
                                    
                                    {/* Voting Actions */}
                                    <div className="flex items-center gap-1.5 shrink-0 bg-[#F7F5F2] p-1 rounded-lg border border-[#ECE8E2]" onClick={(e) => e.stopPropagation()}>
                                      {(() => {
                                        const stopKey = `${selectedDayIndex}-${idx}`;
                                        const voteData = mockVotes[stopKey] || { up: 0, down: 0, userVote: null };
                                        // Mock base vote for demo if it's not interacted yet
                                        const displayUp = voteData.up + (voteData.userVote === 'up' ? 0 : (idx === 0 ? 1 : 0));
                                        
                                        return (
                                          <>
                                            <button 
                                              onClick={() => handleVote(stopKey, 'up')}
                                              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-[#FFF8F5] hover:text-[#FF6B2C] transition-colors ${voteData.userVote === 'up' ? 'bg-[#FFF8F5] text-[#FF6B2C]' : 'text-[#5F5E5A]'}`} 
                                              title="Upvote"
                                            >
                                              <ThumbsUp size={12} strokeWidth={2.5} className={voteData.userVote === 'up' ? 'fill-[#FF6B2C]/20' : ''} />
                                              <span className="text-[10px] font-bold">{displayUp > 0 ? displayUp : ''}</span>
                                            </button>
                                            <div className="w-px h-3 bg-[#ECE8E2]"></div>
                                            <button 
                                              onClick={() => handleVote(stopKey, 'down')}
                                              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-gray-200 transition-colors ${voteData.userVote === 'down' ? 'bg-gray-200 text-[#1C1B1B]' : 'text-[#5F5E5A]'}`} 
                                              title="Downvote"
                                            >
                                              <ThumbsDown size={12} strokeWidth={2.5} className={voteData.userVote === 'down' ? 'fill-gray-400/30' : ''} />
                                            </button>
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </div>

                                  {/* Rating */}
                                  <div className="flex items-center gap-1 text-[11px] font-extrabold text-[#1C1B1B]">
                                    <span className="text-amber-500">★★★★★</span>
                                    <span>{ratingData.rating}</span>
                                    <span className="text-[#5F5E5A] font-medium">({formatReviewCount(ratingData.reviews)})</span>
                                  </div>
                                </div>
                              </div>

                              {/* Description (line-clamp-2) */}
                              <p className="text-xs text-[#5F5E5A] leading-relaxed line-clamp-2 pl-12 sm:pl-13 font-normal">
                                {act.description}
                              </p>

                              {/* Pills: Duration, Cost, Badges */}
                              <div className="pl-12 sm:pl-13 flex items-center flex-wrap gap-1.5 pt-0.5">
                                {act.duration && (
                                  <span className="text-[10px] font-bold text-[#5F5E5A] bg-[#F7F5F2] px-2 py-0.5 rounded-md border border-[#ECE8E2]">
                                    ⏱️ {act.duration}
                                  </span>
                                )}
                                <span className="text-[10px] font-bold text-[#0D9488] bg-[#0D9488]/10 px-2 py-0.5 rounded-md border border-[#0D9488]/20">
                                  {costInfo.title}
                                </span>
                                {iconBadges.map((badge, bIdx) => (
                                  <span key={bIdx} className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border flex items-center gap-1 ${badge.colorClass}`}>
                                    <span>{badge.icon}</span> <span>{badge.text}</span>
                                  </span>
                                ))}
                              </div>

                              {/* AI Insight Collapsible */}
                              <div className="pl-12 sm:pl-13 pt-1 border-t border-[rgba(28,27,27,0.06)]" onClick={(e) => e.stopPropagation()}>
                                <details className="group/tip cursor-pointer">
                                  <summary className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF6B2C] hover:text-[#D95524] select-none py-0.5">
                                    <span>💡 AI Insight &amp; Tip</span>
                                    <span className="text-[9px] opacity-70 group-open/tip:rotate-180 transition-transform">▼</span>
                                  </summary>
                                  <div className="mt-1 p-2.5 rounded-xl bg-[#FFF8F5] border border-[#FF6B2C]/20 text-xs text-[#1C1B1B] font-medium leading-relaxed shadow-2xs">
                                    ✨ {aiInsightText}
                                  </div>
                                </details>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </AnimatePresence>
                </div>

                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                  className="pt-4 mb-2 flex flex-col gap-4 border-t border-[#ECE8E2]"
                >
                  {/* Collaboration Bar */}
                  <div className="group relative overflow-hidden bg-gradient-to-r from-orange-50/80 via-white to-orange-50/80 p-3.5 sm:p-4 rounded-[1.25rem] border border-orange-200/60 shadow-sm transition-all hover:shadow-md hover:border-orange-300 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                      <div className="flex flex-col items-center sm:items-start gap-1 sm:gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <Users size={14} className="text-orange-500" />
                          <span className="text-[10px] font-extrabold text-orange-900/80 uppercase tracking-widest">Plan With Friends</span>
                        </div>
                        <CollaboratorStack collaborators={collaboratorsList} activeUsers={activeUsers} maxDisplay={4} size="md" />
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsInviteModalOpen(true)} 
                      className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-[#111827] rounded-xl hover:bg-black transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 group/btn"
                    >
                      <UserPlus size={14} className="group-hover/btn:scale-110 transition-transform" />
                      Invite Friends
                    </button>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleDetailedItineraryClick}
                    className="group w-full sm:w-[48%] h-10 px-4 rounded-2xl font-bold bg-[#F7F5F2] text-[#1C1B1B] hover:bg-[#ECE8E2] transition-colors duration-300 text-xs flex items-center justify-center cursor-pointer z-10 shadow-sm"
                  >
                    <AnimatePresence mode="wait">
                      {isUnfoldingMap ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <SpinnerIcon />
                          <span>Opening...</span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="default"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center gap-2 whitespace-nowrap"
                        >
                          <Map size={16} strokeWidth={2.5} className="text-[#5F5E5A] group-hover:text-[#1C1B1B] transition-colors" />
                          <span>Detailed Itinerary</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  <motion.div
                    whileHover={!isConfirming && !isElevating && itinerary?.status !== 'CONFIRMED' ? { scale: 1.03, y: -2 } : {}}
                    whileTap={!isConfirming && !isElevating && itinerary?.status !== 'CONFIRMED' ? { scale: 0.97 } : {}}
                    animate={{ scale: isElevating && !isConfirming && itinerary?.status !== 'CONFIRMED' ? 1.05 : 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    onClick={async () => {
                        if (itinerary && !isConfirming && !isElevating && itinerary.status !== 'CONFIRMED') {
                            setIsElevating(true);
                            await new Promise(r => setTimeout(r, prefersReducedMotion ? 0 : 400));
                            
                            setIsConfirming(true);
                            await new Promise(r => setTimeout(r, prefersReducedMotion ? 150 : 1200));
                            const confirmedItinerary = { ...itinerary, status: 'CONFIRMED' };
                            if (onUpdateItinerary) await onUpdateItinerary(confirmedItinerary);
                            if (typeof window !== 'undefined') window.location.href = '/ai-planner';
                        }
                    }}
                    className={`relative w-full sm:w-[48%] h-10 flex rounded-2xl ${itinerary?.status === 'CONFIRMED' ? '' : 'cursor-pointer group hover:shadow-[0_12px_32px_rgba(255,107,44,0.5)]'} shadow-[0_8px_24px_rgba(255,107,44,0.3)] transition-shadow`}
                  >
                    {/* Background Layer: Main (Expands to fill) */}
                    <motion.div
                      className="absolute left-0 top-0 h-full rounded-2xl z-0"
                      initial={itinerary?.status === 'CONFIRMED' ? { width: '100%', backgroundColor: '#10B981', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)' } : { width: '100%', backgroundColor: '#FF6B2C', boxShadow: '0 8px 24px rgba(255, 107, 44, 0.3)' }}
                      animate={{
                        width: isConfirming ? ['50%', '100%'] : '100%',
                        backgroundColor: (isConfirming || itinerary?.status === 'CONFIRMED') ? '#10B981' : '#FF6B2C',
                        boxShadow: (isElevating && !isConfirming && itinerary?.status !== 'CONFIRMED') ? '0 16px 32px rgba(255, 107, 44, 0.5)' : (isConfirming || itinerary?.status === 'CONFIRMED') ? '0 8px 24px rgba(16, 185, 129, 0.4)' : '0 8px 24px rgba(255, 107, 44, 0.3)'
                      }}
                      transition={{ duration: 1.0, ease: "easeOut" }}
                    />

                    {/* Background Layer: Tear Away Stub */}
                    <AnimatePresence>
                      {isConfirming && (
                        <motion.div
                          className="absolute right-0 top-0 h-full w-[50%] bg-[#FF6B2C] rounded-r-2xl z-0"
                          initial={{ opacity: 1, rotate: 0, x: 0, y: 0, transformOrigin: 'top left' }}
                          animate={{ opacity: 0, rotate: 12, x: 40, y: -20 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                        />
                      )}
                    </AnimatePresence>

                    {/* Flash tear overlay */}
                    <AnimatePresence>
                      {isConfirming && !prefersReducedMotion && (
                        <motion.div
                          key="flash-tear-effect"
                          className="absolute z-10 pointer-events-none top-0 bottom-0"
                          style={{ left: '50%', marginLeft: '-4px' }}
                          initial={{ opacity: 1 }}
                          animate={{ opacity: 0 }}
                          transition={{ duration: 0.2, delay: 0.05 }}
                        >
                          <svg height="100%" width="8" viewBox="0 0 8 48" preserveAspectRatio="none" fill="none">
                            <path d="M0 0 L8 4 L0 8 L8 12 L0 16 L8 20 L0 24 L8 28 L0 32 L8 36 L0 40 L8 44 L0 48" stroke="white" strokeWidth="2" strokeOpacity="0.8" />
                          </svg>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Content Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center gap-2 z-20 text-white font-bold text-xs pointer-events-none px-4">
                      
                      {/* Checkmark Icon */}
                      <motion.div layout className="relative flex items-center justify-center">
                        {isConfirming && !prefersReducedMotion && (
                          <motion.div
                            className="absolute w-0 h-0 bg-white/40 rounded-full"
                            initial={{ boxShadow: '0 0 0px 0px rgba(255,255,255,0)' }}
                            animate={{ boxShadow: ['0 0 0px 0px rgba(255,255,255,0.6)', '0 0 20px 20px rgba(255,255,255,0)'] }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                          />
                        )}
                        <motion.div
                          className="relative z-10"
                          animate={isConfirming && !prefersReducedMotion ? { rotate: 1080 } : { rotate: 0 }}
                          transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        >
                           <div className="transition-transform duration-300 ease-out group-hover:scale-125 group-hover:rotate-12">
                             <Check size={16} strokeWidth={3} />
                           </div>
                        </motion.div>
                      </motion.div>

                      {/* Exiting Initial Text */}
                      <AnimatePresence>
                        {!isConfirming && itinerary?.status !== 'CONFIRMED' && (
                          <motion.div
                            layout
                            className="flex items-center gap-2 overflow-hidden whitespace-nowrap"
                            exit={{ opacity: 0, rotate: 12, x: 40, y: -20, width: 0, gap: 0 }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                          >
                            <span>Confirm Trip</span>
                            <span className="transition-transform duration-300 ease-out group-hover:translate-x-1 flex items-center">
                              <ArrowRightIcon />
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Entering Confirmed Text */}
                      <AnimatePresence>
                        {(isConfirming || itinerary?.status === 'CONFIRMED') && (
                          <motion.div
                            layout
                            className="overflow-hidden whitespace-nowrap"
                            initial={itinerary?.status === 'CONFIRMED' ? { width: 'auto', opacity: 1, marginLeft: 8 } : { width: 0, opacity: 0, marginLeft: 0 }}
                            animate={{ width: 'auto', opacity: 1, marginLeft: 8 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                          >
                            Trip Confirmed
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          ) : (
              /* progress bar & status checkmarks during generation */
              <>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-secondary-text block mb-2">
                    Building your itinerary
                  </span>
                  <div className="w-full h-1.5 rounded-full bg-[rgba(28,27,27,0.06)] border border-[rgba(28,27,27,0.04)] overflow-hidden relative">
                    <div
                      className="h-full bg-accent-orange transition-all duration-100 ease-linear"
                      style={{ width: `${progressPercent}%` }}
                    />
                    {/* Glowing moving strip across progress bar */}
                    {progressPercent > 0 && progressPercent < 100 && (
                      <motion.div
                         className="absolute top-0 bottom-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                         animate={{ x: ['-100%', '400%'] }}
                         transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                      />
                    )}
                  </div>
                </div>

                  <div className="flex flex-col gap-4 mt-2">
                    <AnimatePresence>
                      {STATUS_ROWS.map((row, index) => {
                        const isRevealed = activeRowIndex >= index;
                        const isDone = activeRowIndex > index;
                        const isActive = isRevealed && !isDone;

                        if (!isRevealed) return null;

                        return (
                          <motion.div
                            key={row.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: isDone ? 1 : 1, x: 0 }}
                            className={`flex items-center gap-3 transition-opacity duration-300 ${
                              isDone
                                ? 'text-[#1F1F1F] font-semibold opacity-100'
                                : 'text-[#6B6B6B] opacity-85'
                            }`}
                          >
                            <div className="relative">
                              {/* Glowing ring for active state */}
                              {isActive && (
                                <motion.div
                                  className="absolute -inset-1.5 rounded-xl border border-[#FF6B2C]/40"
                                  animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.8, 0.3] }}
                                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                />
                              )}
                              
                              <div
                                className={`relative z-10 p-1.5 rounded-lg border transition-all duration-300 overflow-hidden ${
                                  isDone
                                    ? 'bg-[#FFDBC8]/40 border-[#FF6B2C]/60 text-[#FF6B2C] shadow-sm'
                                    : isActive
                                      ? 'bg-white border-2 border-[#FF6B2C] text-[#FF6B2C] shadow-sm shadow-[#FF6B2C]/30 scale-105'
                                      : 'bg-white border-[rgba(28,27,27,0.1)] text-[#6B6B6B] shadow-2xs'
                                }`}
                              >
                                {/* Shimmering background overlay for active state */}
                                {isActive && (
                                  <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FF6B2C]/10 to-transparent skew-x-[-20deg]"
                                    style={{ width: '200%' }}
                                    animate={{ x: ['-100%', '100%'] }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                                  />
                                )}
                                <div className="relative z-10">
                                  {row.icon}
                                </div>
                              </div>
                            </div>
                            
                            {/* Shimmering text for active state */}
                            {isActive ? (
                              <motion.span 
                                className="text-xs md:text-sm leading-snug font-medium bg-clip-text text-transparent bg-gradient-to-r from-[#FF6B2C] via-[#FFA37C] to-[#FF6B2C]"
                                style={{ backgroundSize: '200% 100%' }}
                                animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
                                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                              >
                                {row.label}
                              </motion.span>
                            ) : (
                              <span className="text-xs md:text-sm leading-snug">
                                {row.label}
                              </span>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
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

      {/* Footer / Subtle Info - Pinned to bottom */}
      <div className="pt-4 mt-auto border-t border-[rgba(28,27,27,0.06)] flex items-center justify-between text-[11px] text-secondary-text shrink-0">
        <span>Powered by TripWise AI</span>
        <span>Real-Time Optimization Engine</span>
      </div>
      
      <InviteModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
        tripId={tripId} 
        currentCollaborators={collaboratorsList} 
      />
    </div>
  );
}
