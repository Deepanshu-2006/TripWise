'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion, useScroll, useSpring } from 'framer-motion';
import CustomDatePicker from './CustomDatePicker';
import { Navigation, Ticket, Heart, Sparkles, MapPin, Clock, DollarSign, ChevronRight, Plus, ArrowUpDown, MoreHorizontal, CloudSun, RefreshCw, Check, Map, Compass, ThumbsUp, ThumbsDown, Users, UserPlus, Landmark, Utensils, Zap, Gem, Star, Lightbulb, Smile, TreePine, Coffee, Palmtree, Banknote, Sun, Footprints, Coins, Plane, Building2, TrendingDown, Mic, MicOff, Flag, AlertTriangle, ShieldCheck, ShieldAlert, CornerDownLeft, Send, ArrowRight, Square, StopCircle, X } from 'lucide-react';
import dynamic from 'next/dynamic';
const FlagModal = dynamic(() => import('./FlagModal'));
const FlaggingAdminModal = dynamic(() => import('./FlaggingAdminModal'));
import { getPlaceAccuracyStatus } from '../../lib/flaggingStore';
import { getDestinationOvertourismInfo, getAttractionOvertourismInfo } from '../../lib/overtourismData';

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
const InviteModal = dynamic(() => import('./InviteModal'));

import { 
  SpinnerIcon, FoodieIcon, HistoryIcon, NatureIcon, ShoppingIcon, 
  ArtIcon, NightlifeIcon, SpotIcon, NeighborhoodIcon, TransitIcon, 
  TimelineIcon, ArrowRightIcon, INTEREST_OPTIONS, BUDGET_OPTIONS, 
  PACE_OPTIONS, STATUS_ROWS, getDayDateString, parseTimeToMinutes, 
  formatMinutesToTime, getDurationMinutes, renderPremiumIcon 
} from "./PlannerSidebarUtils";
import { RouteRow, PlanButton, renderHighlightedText, StepIndicator, LiveTransitPill, DayScheduleCard } from "./PlannerSidebarComponents";

export default function PlannerSidebar({
  currentStep = 'destination',
  onStepChange = () => { },
  tripId = null,
  onTripIdChange = () => { },
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
  onViewItinerary,
  onOpenCalendar = null,
  onOpenNotifications = null,
}) {
  const scrollRef = useRef(null);
  const { scrollYProgress } = useScroll({ container: scrollRef });
  const pathProgress = useSpring(scrollYProgress, { stiffness: 40, damping: 20, restDelta: 0.001 });
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

  const handleVote = useCallback((stopKey, type) => {
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
  }, []);

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
      if (onOpenCalendar) onOpenCalendar();
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

  const handleSwapActivity = useCallback((dayIdx, actIdx, newActivity) => {
    if (!itinerary || !itinerary.days) return;
    const updatedDays = [...itinerary.days];
    if (updatedDays[dayIdx] && updatedDays[dayIdx].activities) {
      const updatedActs = [...updatedDays[dayIdx].activities];
      updatedActs[actIdx] = { ...updatedActs[actIdx], ...newActivity };
      updatedDays[dayIdx] = { ...updatedDays[dayIdx], activities: updatedActs };
      if (typeof onUpdateItinerary === 'function') {
        onUpdateItinerary({ ...itinerary, days: updatedDays });
      }
    }
  }, [itinerary, onUpdateItinerary]);

  const [internalHoveredStopIdx, setInternalHoveredStopIdx] = useState(null);
  const hoveredStopIdx = propHoveredStopIdx !== undefined ? propHoveredStopIdx : internalHoveredStopIdx;
  const handleHoverStop = useCallback((idx) => {
    if (onHoverStop) onHoverStop(idx);
    setInternalHoveredStopIdx(idx);
  }, [onHoverStop]);

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
    if (!opts.isScrollSync && typeof window !== 'undefined' && window.innerWidth >= 768 && idx !== null && idx !== undefined) {
      triggerProgrammaticScroll();
      const cardEl = document.getElementById(`itinerary-card-${selectedDayIndex}-${idx}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [onSelectStop, selectedDayIndex]);

  // Automatically scroll card into view when selectedStopIdx changes externally (e.g. Map pin click) on desktop
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768 && selectedStopIdx !== null && selectedStopIdx !== undefined) {
      // If the change came from outside and wasn't initiated by our own handleSelectStop
      // we need to trigger programmatic scroll so the observer ignores it
      triggerProgrammaticScroll();
      const cardEl = document.getElementById(`itinerary-card-${selectedDayIndex}-${selectedStopIdx}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [selectedStopIdx, selectedDayIndex]);

  // Highly robust scroll-spy to sync map and active stop during user scroll (Desktop only)
  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth < 768 || !itinerary?.days?.[selectedDayIndex]?.activities) return;

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

  const handleDragStart = useCallback((e, idx) => {
    e.stopPropagation();
    setDraggedStopIdx(idx);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', idx.toString());
    }
  }, []);

  const handleDragOver = useCallback((e, idx) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedStopIdx === null || draggedStopIdx === idx) return;
    if (dragOverStopIdx !== idx) {
      setDragOverStopIdx(idx);
    }
  }, [draggedStopIdx, dragOverStopIdx]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e, targetIdx) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverStopIdx(null);
    if (draggedStopIdx === null || draggedStopIdx === targetIdx || !itinerary || !itinerary.days?.[selectedDayIndex]) {
      setDraggedStopIdx(null);
      return;
    }

    const currentDay = itinerary.days[selectedDayIndex];
    let startMins = 9 * 60;
    if (currentDay.activities && currentDay.activities.length > 0) {
      startMins = parseTimeToMinutes(currentDay.activities[0].time);
    }
    
    const newActivities = [...(currentDay.activities || [])];
    const [movedItem] = newActivities.splice(draggedStopIdx, 1);
    newActivities.splice(targetIdx, 0, movedItem);

    // Recalculate times for the new order
    let currentMins = startMins;
    newActivities.forEach((act) => {
      act.time = formatMinutesToTime(currentMins);
      const duration = getDurationMinutes(act.duration);
      currentMins += duration + 30; // Add duration + 30 mins padding for transit between stops
    });

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
  }, [draggedStopIdx, itinerary, selectedDayIndex, onUpdateItinerary]);

  const handleDragEnd = useCallback(() => {
    setDraggedStopIdx(null);
    setDragOverStopIdx(null);
  }, []);

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
  const [basecamp, setBasecamp] = useState(() => itinerary?.basecampHotelDetails?.name || itinerary?.basecampHotel || itinerary?.preferences?.basecamp || '');
  const [basecampDetails, setBasecampDetails] = useState(null); // Full place object from suggestion pick
  const [basecampSuggestions, setBasecampSuggestions] = useState([]);
  
  useEffect(() => {
    if (itinerary?.basecampHotelDetails?.name || itinerary?.basecampHotel) {
      setBasecamp(itinerary?.basecampHotelDetails?.name || itinerary?.basecampHotel);
    } else if (!itinerary) {
      setBasecamp('');
      setBasecampDetails(null);
    }
  }, [itinerary?.basecampHotelDetails?.name, itinerary?.basecampHotel, itinerary]);
  const [isSearchingBasecamp, setIsSearchingBasecamp] = useState(false);
  const [showBasecampDropdown, setShowBasecampDropdown] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [isTranscribingCloud, setIsTranscribingCloud] = useState(false);
  const [voiceInterimText, setVoiceInterimText] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const initialPromptRef = useRef('');
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const basecampSearchTimeoutRef = useRef(null);

  const [activeFlagTarget, setActiveFlagTarget] = useState(null); // { placeId, placeTitle }
  const [isAdminQueueOpen, setIsAdminQueueOpen] = useState(false);
  const [flagsUpdateTrigger, setFlagsUpdateTrigger] = useState(0);

  useEffect(() => {
    const handleFlagsUpdate = () => setFlagsUpdateTrigger(prev => prev + 1);
    if (typeof window !== 'undefined') {
      window.addEventListener('tw_flags_updated', handleFlagsUpdate);
      return () => window.removeEventListener('tw_flags_updated', handleFlagsUpdate);
    }
  }, []);

  const processCloudTranscription = async (blob) => {
    if (!blob || blob.size < 300) {
      console.warn('Recorded audio blob is empty or too short:', blob?.size);
      setIsTranscribingCloud(false);
      setIsListeningVoice(false);
      setVoiceInterimText('');
      setVoiceError('No speech detected in recording. Please try speaking into your mic again.');
      return;
    }

    try {
      setIsTranscribingCloud(true);
      setVoiceInterimText('Transcribing audio via Cloud AI...');

      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result;
        const res = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioBase64: base64data, mimeType: blob.type || 'audio/webm' })
        });
        const data = await res.json();

        setIsTranscribingCloud(false);
        setIsListeningVoice(false);
        setVoiceInterimText('');

        if (data.success && data.transcript) {
          const trimmed = data.transcript.trim();
          if (trimmed) {
            const combined = initialPromptRef.current
              ? `${initialPromptRef.current} ${trimmed}`
              : trimmed;
            const formatted = combined.slice(0, 400);
            setUserPromptInput(formatted);
            if (onPromptChange) onPromptChange(formatted);
          }
        } else if (data.error) {
          console.warn('Cloud transcription error:', data.error);
          setVoiceError(data.error);
        }
      };
    } catch (err) {
      console.error('Failed to process cloud transcription:', err);
      setIsTranscribingCloud(false);
      setIsListeningVoice(false);
    }
  };

  const toggleVoiceRecognition = useCallback(async () => {
    if (typeof window === 'undefined') return;

    if (isListeningVoice) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try { mediaRecorderRef.current.requestData(); } catch {}
        try { mediaRecorderRef.current.stop(); } catch {}
      } else {
        setIsListeningVoice(false);
        setVoiceInterimText('');
      }
      return;
    }

    setVoiceError('');
    initialPromptRef.current = userPromptInput ? userPromptInput.trim() : '';

    // Step 1: Request Mic Stream
    let stream = null;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (err) {
      console.warn('Microphone permission denied:', err);
      setVoiceError('Microphone permission denied. Click the lock icon in your address bar to allow microphone.');
      return;
    }

    if (!stream) {
      if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        setVoiceError('Phone testing blocked: Microphone requires HTTPS. Deploy the app or use an ngrok tunnel to test voice on your phone.');
      } else {
        setVoiceError('Microphone not available on this device.');
      }
      return;
    }

    let webSpeechHasResult = false;

    // Step 2: WebSpeech API for instant live interim typing feedback
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = (typeof navigator !== 'undefined' && navigator.language) || 'en-US';

        recognition.onresult = (event) => {
          let fullSpoken = '';
          for (let i = 0; i < event.results.length; i++) {
            fullSpoken += event.results[i][0].transcript;
          }
          const trimmed = fullSpoken.trim();
          if (trimmed) {
            webSpeechHasResult = true;
            setVoiceInterimText(trimmed);
            const combined = initialPromptRef.current
              ? `${initialPromptRef.current} ${trimmed}`
              : trimmed;
            const formatted = combined.slice(0, 400);
            setUserPromptInput(formatted);
            if (onPromptChange) onPromptChange(formatted);
          }
        };

        recognition.onerror = (err) => {
          console.warn('Browser SpeechRecognition error:', err.error);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.warn('WebSpeech API start error:', err);
      }
    }

    // Step 3: MediaRecorder + Gemini Cloud AI ASR Backup
    try {
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        setTimeout(() => {
          const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
          stream.getTracks().forEach(t => t.stop());

          // Process recorded audio blob via Cloud Gemini AI ASR
          if (audioBlob.size > 300) {
            processCloudTranscription(audioBlob);
          } else {
            setIsListeningVoice(false);
            setVoiceInterimText('');
          }
        }, 50);
      };

      mediaRecorder.start(100);
      setIsListeningVoice(true);
      setVoiceInterimText('Listening... Speak clearly');
    } catch (err) {
      console.warn('MediaRecorder setup failed:', err);
      setVoiceError('Failed to start voice recorder. Please check microphone settings.');
      setIsListeningVoice(false);
    }
  }, [isListeningVoice, userPromptInput, onPromptChange]);

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



  const fetchBasecampSuggestions = async (query, forceFetch = false) => {
    let effectiveDest = parsedIntent?.destination || extracted?.destination || itinerary?.destinationName || userPromptInput || "";

    if ((!query || query.trim().length === 0) && !forceFetch) {
      setBasecampSuggestions([]);
      setShowBasecampDropdown(false);
      return;
    }
    
    let searchQuery = query || "";
    
    // If it's empty, we want to fetch generic hotel suggestions for the destination
    const isEmptyQuery = !query || query.trim().length === 0;
    
    if (isEmptyQuery) {
      if (!effectiveDest || effectiveDest.trim().length === 0) {
        setBasecampSuggestions([]);
        setIsSearchingBasecamp(false);
        setShowBasecampDropdown(true);
        return;
      }
      searchQuery = `hotels in ${effectiveDest}`;
    } else {
      // Auto-append destination to restrict to that city
      if (effectiveDest && effectiveDest.trim().length > 0 && !searchQuery.toLowerCase().includes(effectiveDest.toLowerCase())) {
          searchQuery = `${searchQuery} in ${effectiveDest}`.trim();
      }
    }

    setIsSearchingBasecamp(true);
    setShowBasecampDropdown(true);

    // 1. Google Places API (Requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local)
    if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
      if (isEmptyQuery) {
        // Use textSearch for categorical queries like "hotels in Kyoto"
        const dummyNode = document.createElement('div');
        const placesService = new window.google.maps.places.PlacesService(dummyNode);
        placesService.textSearch({ query: searchQuery, type: 'lodging' }, (results, status) => {
          setIsSearchingBasecamp(false);
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            setBasecampSuggestions(results.slice(0, 8).map(p => ({
              place_id: p.place_id,
              name: p.name,
              display_name: p.formatted_address || p.name
            })));
          } else {
            setBasecampSuggestions([]);
          }
        });
      } else {
        const service = new window.google.maps.places.AutocompleteService();
        // 'lodging' type strictly returns hotels, motels, and accommodations
        service.getPlacePredictions({ input: searchQuery, types: ['lodging'] }, (predictions, status) => {
          setIsSearchingBasecamp(false);
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setBasecampSuggestions(predictions.map(p => ({
              place_id: p.place_id,
              name: p.structured_formatting.main_text,
              display_name: p.description
            })));
          } else {
            setBasecampSuggestions([]);
          }
        });
      }
      return;
    }

    // 2. Fallback: Highly optimized Nominatim strict hotel search
    try {
      const finalNominatimQuery = isEmptyQuery ? searchQuery : `hotel ${searchQuery}`;
      const searchUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(finalNominatimQuery)}&format=json&limit=8`;
      const res = await fetch(searchUrl);
      const data = await res.json();

      // Filter strictly for accommodations to ensure it only shows hotels
      const hotels = data.filter(d =>
        ['hotel', 'guest_house', 'hostel', 'motel', 'apartment'].includes(d.type) ||
        d.class === 'tourism'
      );

      const finalSuggestions = hotels.length > 0 ? hotels : data;
      setBasecampSuggestions(finalSuggestions);
    } catch (err) {
      console.error("Autocomplete error:", err);
      setBasecampSuggestions([]);
    } finally {
      setIsSearchingBasecamp(false);
    }
  };

  const handleBasecampChange = (e) => {
    const val = e.target.value;
    setBasecamp(val);
    setBasecampDetails(null); // User is typing manually, clear any previously selected details
    
    // Provide instant UI feedback on every character typed
    setIsSearchingBasecamp(true);
    setShowBasecampDropdown(true);

    if (basecampSearchTimeoutRef.current) clearTimeout(basecampSearchTimeoutRef.current);
    if (val.trim().length === 0) {
      basecampSearchTimeoutRef.current = setTimeout(() => {
        fetchBasecampSuggestions('', true);
      }, 300);
      return;
    }
    basecampSearchTimeoutRef.current = setTimeout(() => {
      fetchBasecampSuggestions(val);
    }, 300);
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
        // Pass pre-fetched details if the user selected from the autocomplete dropdown
        basecampPreFetched: cleanBasecamp && basecampDetails ? {
          name: basecampDetails.name || basecampDetails.display_name?.split(',')[0] || cleanBasecamp,
          address: basecampDetails.display_name || basecampDetails.address || '',
          coordinates: basecampDetails.coordinates ||
            (basecampDetails.lat && basecampDetails.lon
              ? { lat: parseFloat(basecampDetails.lat), lng: parseFloat(basecampDetails.lon) }
              : null),
          place_id: basecampDetails.place_id || null,
        } : null,
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
      try {
        activateTracking(activeTripId || 'shared-trip', {
          startDate,
          trackFlights: true,
          trackHotels: true,
          origin: trackOrigin
        });
      } catch(e) {
        console.error("Tracking setup error", e);
      }
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
    const searchPattern = new RegExp('[,.\\s]*include\\s+' + cleanTag.toLowerCase() + '[,.\\s]*', 'gi');

    if (isTagActive(tag)) {
      let updated = userPromptInput.replace(searchPattern, ' ').trim();
      updated = updated.replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim();
      if (updated.startsWith(',')) updated = updated.slice(1).trim();
      if (updated.endsWith(',')) updated = updated.slice(0, -1).trim();
      setUserPromptInput(updated);
      if (onPromptChange) onPromptChange(updated);
    } else {
      const trimmed = userPromptInput.trim();
      let updated = '';
      if (!trimmed) {
        updated = `Include ${cleanTag.toLowerCase()}.`;
      } else {
        const cleanPrev = trimmed.endsWith('.') ? trimmed.slice(0, -1) : trimmed;
        updated = `${cleanPrev}, include ${cleanTag.toLowerCase()}.`;
      }
      setUserPromptInput(updated);
      if (onPromptChange) onPromptChange(updated);
    }
  };

  return (
    <div className={`w-full flex-1 h-full bg-[#FAF3EE] text-stone-900 p-4 sm:p-6 md:p-8 flex flex-col font-sans select-none border-r border-stone-200/60`}>
      {/* ── Sticky Header — Desktop only (sm+) ─────────────────────────────── */}
      <div className="hidden sm:block sm:sticky top-0 z-30 bg-[#FAF3EE] pt-3 pb-4 sm:-mx-6 md:-mx-8 sm:px-6 md:px-8 border-b border-stone-200/50 mb-6">

        {/* Stamp badge row */}
        <div className="flex items-center justify-between mb-5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 border border-stone-300/70 rounded-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2C]" />
            <span className="font-mono text-[10px] font-bold tracking-[0.18em] uppercase text-stone-500">
              TripWise · Planner
            </span>
          </div>
          {step !== 'input' && !(step === 'progress' && showFinalCTA && itinerary) && (
            <button
              type="button"
              onClick={handleNewPrompt}
              className="font-mono text-[10px] uppercase tracking-wide font-bold text-[#FF6B2C] hover:text-[#E55A20] cursor-pointer bg-transparent border-none transition-colors"
            >
              ← Reset
            </button>
          )}
        </div>

        {/* Headline — only on step=input */}
        {step === 'input' && (
          <div className="mb-5">
            <h2 className="text-3xl md:text-4xl font-serif font-black text-stone-900 tracking-tight leading-tight mb-1.5">
              Where to next?
            </h2>
            <p className="text-sm text-stone-500 leading-relaxed font-sans">
              Tell TripWise your destination, vibe, budget, or timeline — we'll craft the rest.
            </p>
          </div>
        )}

        <StepIndicator step={step} />
      </div>

      <div id="itinerary-scroll-container" ref={scrollRef} data-lenis-prevent="true" className="flex-1 overflow-y-auto overflow-x-hidden pb-20 scroll-smooth min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] sm:[scrollbar-width:auto] sm:pr-2 sm:-mr-3">

        {/* ── Mobile-only scrollable header (scrolls away on phone) ─────────── */}
        <div className="sm:hidden bg-[#FAF3EE] pt-3 pb-4 -mx-4 px-4 border-b border-stone-200/50 mb-5">
          {/* Badge + Reset */}
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 border border-stone-300/70 rounded-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2C]" />
              <span className="font-mono text-[10px] font-bold tracking-[0.18em] uppercase text-stone-500">
                TripWise · Planner
              </span>
            </div>
            {step !== 'input' && !(step === 'progress' && showFinalCTA && itinerary) && (
              <button
                type="button"
                onClick={handleNewPrompt}
                className="font-mono text-[10px] uppercase tracking-wide font-bold text-[#FF6B2C] cursor-pointer bg-transparent border-none"
              >
                ← Reset
              </button>
            )}
          </div>
          {/* Headline — only on step=input */}
          {step === 'input' && (
            <div className="mb-4">
              <h2 className="text-2xl font-serif font-black text-stone-900 tracking-tight leading-tight mb-1">
                Where to next?
              </h2>
              <p className="text-sm text-stone-500 leading-relaxed font-sans">
                Tell TripWise your destination, vibe, budget, or timeline.
              </p>
            </div>
          )}
          <StepIndicator step={step} />
        </div>
        {/* STATE 0: Prompt Input Setup Page */}
        {step === 'input' && (
          <div className="space-y-8 animate-fade-in pt-5 sm:pt-0">
            {/* ── Prompt Textarea & Minimal Voice UI ── */}
            <div className="space-y-6">
              <div className="relative">
                <textarea
                  value={userPromptInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setUserPromptInput(val);
                    if (onPromptChange) onPromptChange(val);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (userPromptInput.trim()) {
                        setStep('confirming');
                      }
                    }
                  }}
                  placeholder="e.g., 5 days in Kyoto during cherry blossom season… love historic temples, hidden gardens, authentic ramen shops, and boutique stays."
                  maxLength={400}
                  className={`w-full h-36 pt-4 pb-12 px-4 md:px-5 rounded-2xl bg-white border transition-all duration-300 resize-none font-sans leading-relaxed text-[15px] md:text-base text-stone-900 placeholder:text-stone-400/80 focus:outline-none shadow-sm md:shadow-xs ${
                    isListeningVoice
                      ? 'border-[#FF6B2C] ring-4 ring-[#FF6B2C]/10 bg-[#FFF9F6] border-l-[4px] border-l-[#FF6B2C]'
                      : 'border-stone-200 border-l-[3px] border-l-[#FF6B2C] focus:border-[#FF6B2C]/50 focus:border-l-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/10'
                  }`}
                />

                {/* ── High-End Animated Listening / Transcribing Indicator ── */}
                <AnimatePresence>
                  {(isListeningVoice || isTranscribingCloud) && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.96 }}
                      transition={{ duration: 0.2 }}
                      className="absolute bottom-3 left-3.5 flex items-center pointer-events-none z-10"
                    >
                      {isTranscribingCloud ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF6B2C]/10 border border-[#FF6B2C]/30 text-[#FF6B2C] text-[11px] font-bold shadow-xs backdrop-blur-md">
                          <div className="w-3.5 h-3.5 border-2 border-[#FF6B2C] border-t-transparent rounded-full animate-spin" />
                          <span>AI Transcribing Speech...</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#FFF2EA] border border-[#FF6B2C]/40 text-[#FF6B2C] text-[11px] font-bold shadow-xs backdrop-blur-md">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6B2C] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF6B2C]"></span>
                          </span>
                          <span className="tracking-wide">Listening...</span>
                          {/* Animated 5-bar soundwave equalizer */}
                          <div className="flex items-end gap-0.5 h-3 ml-0.5">
                            <span className="w-0.5 h-2 bg-[#FF6B2C] rounded-full animate-bounce [animation-delay:0ms]" />
                            <span className="w-0.5 h-3.5 bg-[#FF6B2C] rounded-full animate-bounce [animation-delay:150ms]" />
                            <span className="w-0.5 h-1.5 bg-[#FF6B2C] rounded-full animate-bounce [animation-delay:300ms]" />
                            <span className="w-0.5 h-3 bg-[#FF6B2C] rounded-full animate-bounce [animation-delay:100ms]" />
                            <span className="w-0.5 h-2 bg-[#FF6B2C] rounded-full animate-bounce [animation-delay:200ms]" />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Action Group: Microphone / Stop Button & Enter Submit Button ── */}
                <div className="absolute bottom-2.5 right-3 flex items-center gap-2 z-10">
                  {/* Premium Microphone / Stop Recording Button */}
                  <div className="relative flex items-center justify-center">
                    {isListeningVoice && (
                      <>
                        <span className="absolute -inset-2.5 rounded-full bg-[#FF6B2C]/20 animate-ping pointer-events-none" />
                        <span className="absolute -inset-1 rounded-full bg-[#FF6B2C]/40 animate-pulse pointer-events-none" />
                      </>
                    )}
                    <motion.button
                      type="button"
                      onClick={toggleVoiceRecognition}
                      disabled={isTranscribingCloud}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      title={isListeningVoice ? "Tap to stop recording & transcribe" : "Tap to speak your prompt"}
                      className={`p-2 rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center relative z-10 shadow-sm ${
                        isListeningVoice
                          ? 'bg-gradient-to-br from-[#FF6B2C] to-[#E0591F] text-white ring-2 ring-white/80 shadow-md shadow-[#FF6B2C]/30 scale-105'
                          : isTranscribingCloud
                          ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                          : 'bg-stone-100/90 text-stone-600 hover:text-[#FF6B2C] hover:bg-[#FFF2EA] hover:shadow-xs active:scale-95'
                      }`}
                    >
                      {isTranscribingCloud ? (
                        <div className="w-4 h-4 border-2 border-stone-500 border-t-transparent rounded-full animate-spin" />
                      ) : isListeningVoice ? (
                        <Square className="w-3.5 h-3.5 fill-current stroke-none rounded-xs animate-pulse" />
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                    </motion.button>
                  </div>

                  {/* Enter / Send Submit Button */}
                  <motion.button
                    type="button"
                    onClick={() => {
                      if (userPromptInput.trim()) {
                        setStep('confirming');
                      }
                    }}
                    whileHover={{ scale: userPromptInput.trim() ? 1.08 : 1 }}
                    whileTap={{ scale: userPromptInput.trim() ? 0.92 : 1 }}
                    disabled={!userPromptInput.trim() || isListeningVoice || isTranscribingCloud}
                    title="Send prompt (Press Enter)"
                    className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center shadow-xs ${
                      userPromptInput.trim() && !isListeningVoice && !isTranscribingCloud
                        ? 'bg-[#FF6B2C] text-white hover:bg-[#E0591F] cursor-pointer shadow-md'
                        : 'bg-stone-100 text-stone-300 cursor-not-allowed'
                    }`}
                  >
                    <CornerDownLeft className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Voice Error & Permission Troubleshooting Banner */}
              {voiceError && (
                <div className="text-[11px] font-medium text-amber-900 bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-center justify-between gap-2 shadow-2xs animate-fade-in">
                  <span>⚠️ {voiceError}</span>
                  <button type="button" onClick={() => setVoiceError('')} className="text-amber-950 font-bold hover:underline shrink-0 cursor-pointer">Dismiss</button>
                </div>
              )}

              {/* ── Vibe Enhancer Chips ── */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-stone-400">Vibe Add-ons</span>
                  <div className="flex-1 h-px bg-stone-200" />
                </div>
                <div className="flex flex-wrap justify-center sm:justify-start gap-x-2 gap-y-3 pt-2 pb-1 relative">
                  {[
                    "Hidden Local Gems",
                    "Michelin & Street Food",
                    "Scenic Photography",
                    "Budget & Hostels",
                    "Luxury Boutique",
                    "Fast-Paced Nightlife"
                  ].map((rawLabel, idx) => {
                    const tag = `➕ ${rawLabel}`;
                    const active = isTagActive(tag);
                    
                    // Controlled random scattered layout for mobile (stamps/stickers effect)
                    const scatterTransform = [
                      '-rotate-2 translate-y-1',
                      'rotate-3 -translate-y-0.5',
                      '-rotate-1 -translate-y-1.5',
                      'rotate-2 translate-y-1',
                      '-rotate-3 -translate-y-0.5',
                      'rotate-1 translate-y-1.5'
                    ][idx];

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleVibeEnhancer(tag)}
                        style={{
                          transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        }}
                        className={`px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-[10px] sm:rounded-xl text-[9.5px] sm:text-xs font-mono font-bold border cursor-pointer select-none
                          ${active 
                            ? 'z-20 scale-105 !rotate-0 !translate-y-0 shadow-[0_8px_16px_rgba(255,107,44,0.25)] border-[#FF6B2C] bg-[#FF6B2C] text-white' 
                            : `z-10 shadow-sm border-stone-200 bg-white text-stone-600 hover:text-[#FF6B2C] hover:border-[#FF6B2C]/30 hover:bg-[#FFF2EA] hover:scale-105 hover:!rotate-0 hover:z-20 md:!rotate-0 md:!translate-y-0 ${scatterTransform}`
                          }
                        `}
                      >
                        {active ? `✓ ${rawLabel}` : `+ ${rawLabel}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Basecamp Input (Secondary, Mode-Branching Detail) */}
              <div className="relative">
                <div className="relative flex items-center">
                  <div className="absolute left-3 flex items-center justify-center pointer-events-none z-10">
                    {isSearchingBasecamp ? (
                      <div className="w-3.5 h-3.5 border-2 border-[#FF6B2C] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    )}
                  </div>
                  <input
                    type="text"
                    value={basecamp}
                    onChange={handleBasecampChange}
                    onFocus={() => { 
                      if (basecampSuggestions.length > 0) {
                        setShowBasecampDropdown(true);
                      } else {
                        fetchBasecampSuggestions(basecamp, true);
                        setShowBasecampDropdown(true);
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowBasecampDropdown(false), 200)}
                    placeholder="Where are you staying? (Optional basecamp hotel)"
                    className="w-full py-2.5 pl-9 pr-3 rounded-xl bg-stone-50/70 hover:bg-white focus:bg-white border border-stone-200/80 focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/15 text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none shadow-2xs transition-all duration-150 font-medium"
                  />
                </div>

                {/* Autocomplete Dropdown */}
                {showBasecampDropdown && (
                  <div className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-xl border border-stone-200/60 rounded-2xl shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)] overflow-hidden">
                    {basecampSuggestions.length > 0 ? (
                      <div className="max-h-[280px] overflow-y-auto p-1.5 scrollbar-thin scrollbar-thumb-stone-200 scrollbar-track-transparent">
                        {basecampSuggestions.map((place, idx) => {
                          const hotelName = place.name || place.display_name?.split(',')[0] || '';
                          const hotelAddress = place.display_name || '';
                          const isRecommended = idx < 2 && !basecamp.trim();
                          
                          return (
                            <div
                              key={place.place_id || idx}
                              className="group flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-stone-50 cursor-pointer transition-all duration-200"
                              onClick={() => {
                                setBasecamp(hotelName);
                                setBasecampDetails(place);
                                setShowBasecampDropdown(false);
                                setBasecampSuggestions([]);
                              }}
                            >
                              <div className="shrink-0 w-9 h-9 rounded-full bg-stone-100 border border-stone-200/60 flex items-center justify-center text-stone-500 group-hover:bg-[#FFF2EA] group-hover:text-[#FF6B2C] group-hover:border-[#FDDCC7] transition-colors">
                                <Building2 className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <div className="font-bold text-stone-800 text-[13px] truncate group-hover:text-[#FF6B2C] transition-colors">
                                    {renderHighlightedText(hotelName, basecamp)}
                                  </div>
                                  {isRecommended && (
                                    <span className="shrink-0 text-[8px] font-black uppercase tracking-wider text-[#FF6B2C] bg-[#FFF2EA] px-1.5 py-0.5 rounded-[4px]">Recommended</span>
                                  )}
                                </div>
                                <div className="text-[10.5px] text-stone-400 truncate mt-0.5 font-medium">
                                  {renderHighlightedText(hotelAddress, basecamp)}
                                </div>
                              </div>
                              <div className="shrink-0 text-[10px] font-bold text-stone-300 group-hover:text-[#FF6B2C] transition-colors">
                                <CornerDownLeft className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="px-4 py-8 text-center flex flex-col items-center justify-center gap-2">
                        {isSearchingBasecamp ? (
                          <>
                            <div className="w-5 h-5 border-2 border-[#FF6B2C] border-t-transparent rounded-full animate-spin" />
                            <div className="text-[11px] font-medium text-stone-400">Finding best stays...</div>
                          </>
                        ) : (
                          <>
                            <Building2 className="w-6 h-6 text-stone-300" />
                            <div className="text-[11px] font-medium text-stone-400">
                               {(!basecamp && !parsedIntent?.destination && !userPromptInput && !itinerary?.destinationName) 
                                 ? "Enter a destination above to see hotel suggestions, or type to search."
                                 : !basecamp.trim()
                                 ? `Type to search for hotels ${parsedIntent?.destination || itinerary?.destinationName || userPromptInput ? `in ${parsedIntent?.destination || itinerary?.destinationName || userPromptInput}` : 'for your trip'}`
                                 : basecamp.trim().length > 0 && basecamp.trim().length < 4
                                 ? "Keep typing to find your hotel..."
                                 : "No hotels found. Try a different search."}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Structured Micro-Format Helper & Live Mode Indicator */}
                <AnimatePresence mode="wait">
                  {basecamp && basecamp.trim() ? (
                    <motion.div
                      key="active-basecamp-mode"
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-bold shadow-2xs"
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-black shrink-0">✓</span>
                      <span>Basecamp mode: We'll optimize your itinerary around <strong className="font-extrabold text-emerald-950">{basecamp.trim()}</strong></span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="undecided-mode-helper"
                      initial={{ opacity: 0, y: -2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -2 }}
                      transition={{ duration: 0.15 }}
                      className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-x-4 gap-y-1.5 mt-3 text-[11.5px] font-sans text-stone-500"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <span>🏨</span>
                        <span className="font-semibold text-stone-700">Have a hotel?</span> We'll route around it.
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span>🎲</span>
                        <span className="font-semibold text-stone-600">Not sure yet?</span> We'll help you pick one later.
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Quick Start Routes ── */}
              <div className="pt-4 border-t border-stone-200/60">
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-stone-400">Routes</span>
                  <div className="flex-1 h-px bg-stone-200" />
                </div>
                <div className="flex flex-col gap-1.5">
                  {[
                    { dest: "Kyoto",  detail: "5 days · temples, gardens & street food",    prompt: "🌸 5 days in Kyoto: temples, gardens & street food" },
                    { dest: "Rome",   detail: "3 days · hidden gems & local pasta",           prompt: "🍕 3 budget days in Rome: hidden gems & local pasta" },
                    { dest: "Tokyo",  detail: "7 days · cyberpunk nightlife & tech",          prompt: "⚡ 7 fast-paced days in Tokyo: cyberpunk nightlife & tech" }
                  ].map((ex, idx) => (
                    <RouteRow
                      key={idx}
                      idx={idx}
                      dest={ex.dest}
                      detail={ex.detail}
                      onClick={() => {
                        setUserPromptInput(ex.prompt);
                        if (onPromptChange) onPromptChange(ex.prompt);
                        setStep('parsing');
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* ── CTA Button ── */}
            <div className="pt-2">
              <PlanButton
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
              />
            </div>
          </div>
        )}

        {/* STATE 1: Parsing */}
        {step === 'parsing' && (
          <div className="flex flex-col gap-5 animate-fade-in pt-5 sm:pt-4">
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
          <motion.div
            className="flex flex-col gap-6 pb-16 pt-5 sm:pt-0"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.07 } }
            }}
          >
            {/* Inject shimmer keyframes once */}
            <style>{`
              @keyframes shimmer-sweep {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(200%); }
              }
              @keyframes float-up {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-2px); }
              }
            `}</style>

            {/* ── Editorial Header ── */}
            <motion.div
              className="flex flex-col gap-1.5 pb-3 border-b border-[#E6DFD5]/60"
              variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16,1,0.3,1] } } }}
            >
              <div className="flex items-center gap-2">
                <motion.span
                  className="w-2 h-2 rounded-full bg-[#FF6B2C]"
                  animate={{ scale: [1, 1.35, 1], opacity: [1, 0.6, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#7A7268]">
                  TRIPWISE · PREFERENCES
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-serif font-black text-[#1E1C1A] tracking-tight leading-snug">
                Fine-tune your trip to{' '}
                <span className="italic font-serif text-[#FF6B2C] underline decoration-[#FF6B2C]/30 underline-offset-4">
                  {destinationName}
                </span>
              </h2>
            </motion.div>

            {/* ── Editable Prompt ── */}
            <motion.div
              className="flex flex-col gap-2"
              variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16,1,0.3,1] } } }}
            >
              <div className="flex items-center justify-between">
                <label className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A7268]">
                  YOUR PROMPT
                </label>
                <span className="text-[9px] font-mono font-medium text-[#A89F91]">EDITABLE</span>
              </div>
              <motion.div
                className="relative bg-white rounded-2xl border border-[#E6DFD5] border-l-4 border-l-[#FF6B2C] p-3.5 pl-4 shadow-2xs transition-all focus-within:border-[#FF6B2C] focus-within:ring-2 focus-within:ring-[#FF6B2C]/15"
                whileHover={{ boxShadow: '0 4px 20px rgba(255,107,44,0.12)', borderColor: '#FF6B2C' }}
                transition={{ duration: 0.2 }}
              >
                <textarea
                  value={userPromptInput}
                  onChange={handlePromptTextChange}
                  rows={2}
                  className="w-full bg-transparent text-sm font-sans text-[#1E1C1A] placeholder-[#A89F91] focus:outline-none resize-none leading-relaxed"
                  placeholder="E.g., 5 days in Tokyo — street food & neon lights..."
                />
              </motion.div>
            </motion.div>

            {/* ── Tune Your Vibe ── */}
            <motion.div
              className="flex flex-col gap-2.5"
              variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16,1,0.3,1] } } }}
            >
              <label className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A7268]">
                TUNE YOUR VIBE
              </label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((item, i) => {
                  const isActive = selectedInterests.includes(item.id);
                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      onClick={() => toggleInterest(item.id)}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04, duration: 0.3, ease: [0.16,1,0.3,1] }}
                      whileHover={{
                        scale: 1.06,
                        y: -2,
                        boxShadow: isActive ? '0 6px 18px rgba(30,28,26,0.25)' : '0 6px 16px rgba(0,0,0,0.1)',
                        transition: { duration: 0.18, ease: 'easeOut' }
                      }}
                      whileTap={{ scale: 0.94 }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold cursor-pointer ${
                        isActive
                          ? 'bg-[#1E1C1A] text-[#FAF6F0] border border-[#1E1C1A]'
                          : 'bg-white text-[#5F5E5A] border border-[#E6DFD5]'
                      }`}
                      style={{ transition: 'background 0.2s, color 0.2s, border-color 0.2s' }}
                    >
                      <motion.span
                        className={isActive ? 'text-[#FF6B2C]' : 'text-[#7A7268]'}
                        animate={isActive ? { rotate: [0, -8, 8, 0] } : { rotate: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        {item.icon}
                      </motion.span>
                      <span className="tracking-wide">{item.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* ── Set Your Budget ── */}
            <motion.div
              className="flex flex-col gap-2.5"
              variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16,1,0.3,1] } } }}
            >
              <label className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A7268]">
                SET YOUR BUDGET
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {BUDGET_OPTIONS.map((item, idx) => {
                  const isSelected = selectedBudget === item.id;
                  const budgetIcons = [<Coins key="1" className="w-4 h-4" />, <Building2 key="2" className="w-4 h-4" />, <Sparkles key="3" className="w-4 h-4" />];
                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedBudget(item.id)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.06, duration: 0.35, ease: [0.16,1,0.3,1] }}
                      whileHover={{
                        y: -4,
                        boxShadow: isSelected
                          ? '0 10px 28px rgba(255,107,44,0.2)'
                          : '0 8px 24px rgba(0,0,0,0.09)',
                        transition: { duration: 0.2, ease: 'easeOut' }
                      }}
                      whileTap={{ scale: 0.97 }}
                      className={`relative p-3.5 rounded-2xl border text-left flex flex-col justify-between overflow-hidden cursor-pointer ${
                        isSelected
                          ? 'bg-white border-[#FF6B2C] shadow-sm ring-2 ring-[#FF6B2C]/15'
                          : 'bg-white/70 border-[#E6DFD5]'
                      }`}
                      style={{ transition: 'background 0.2s, border-color 0.2s' }}
                    >
                      {/* Shimmer on hover */}
                      <span
                        aria-hidden
                        style={{
                          position: 'absolute', inset: 0,
                          background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)',
                          animation: 'shimmer-sweep 1.6s ease-in-out infinite',
                          opacity: 0,
                          transition: 'opacity 0.2s',
                          pointerEvents: 'none',
                        }}
                        className="group-hover:opacity-100"
                      />
                      <div className="flex items-center justify-between w-full mb-3">
                        <motion.span
                          className={`p-2 rounded-xl ${isSelected ? 'bg-[#FF6B2C]/10 text-[#FF6B2C]' : 'bg-[#FAF6F0] text-[#7A7268]'}`}
                          animate={isSelected ? { rotate: [0, -10, 10, 0] } : {}}
                          transition={{ duration: 0.4 }}
                        >
                          {budgetIcons[idx]}
                        </motion.span>
                        <motion.span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-[#FF6B2C] bg-[#FF6B2C]' : 'border-[#E6DFD5]'
                          }`}
                          animate={isSelected ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </motion.span>
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${isSelected ? 'text-[#1E1C1A]' : 'text-[#5F5E5A]'}`}>
                          {item.title}
                        </div>
                        <div className="text-[10px] text-[#7A7268] mt-0.5 line-clamp-1">
                          {item.desc}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* ── Choose Your Pace ── */}
            <motion.div
              className="flex flex-col gap-2.5"
              variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16,1,0.3,1] } } }}
            >
              <label className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A7268]">
                CHOOSE YOUR PACE
              </label>
              <div className="grid grid-cols-3 p-1 rounded-2xl bg-white border border-[#E6DFD5] shadow-2xs relative">
                {/* Sliding active background */}
                {PACE_OPTIONS.map((item, idx) => {
                  const isActive = selectedPace === item.id;
                  return isActive ? (
                    <motion.div
                      key="pace-bg"
                      layoutId="pace-active-bg"
                      className="absolute inset-1 rounded-xl bg-[#1E1C1A]"
                      style={{ width: `calc(33.33% - 4px)`, left: `calc(${idx * 33.33}% + 2px)` }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  ) : null;
                })}
                {PACE_OPTIONS.map((item) => {
                  const isActive = selectedPace === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedPace(item.id)}
                      className={`relative z-10 py-2.5 px-2 rounded-xl text-xs font-bold cursor-pointer text-center ${
                        isActive ? 'text-[#FAF6F0]' : 'text-[#7A7268]'
                      }`}
                      whileHover={!isActive ? { color: '#1E1C1A', scale: 1.02 } : {}}
                      whileTap={{ scale: 0.96 }}
                      style={{ transition: 'color 0.2s' }}
                    >
                      {item.label}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* ── Trip Duration ── */}
            <motion.div
              className="flex flex-col gap-2.5"
              variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16,1,0.3,1] } } }}
            >
              <label className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A7268]">
                TRIP DURATION
              </label>
              <div className="flex items-center justify-between p-1.5 rounded-2xl bg-white border border-[#E6DFD5] shadow-2xs">
                <motion.button
                  type="button"
                  onClick={() => handleDaysCounterChange(Math.max(1, selectedDays - 1))}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#FAF6F0] text-[#1E1C1A] font-bold text-lg cursor-pointer"
                  whileHover={{ scale: 1.15, backgroundColor: '#e8ddd5' }}
                  whileTap={{ scale: 0.88 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                >
                  –
                </motion.button>
                <motion.div
                  className="flex items-baseline gap-1"
                  key={selectedDays}
                  initial={{ scale: 1.3, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                >
                  <span className="text-lg font-black text-[#1E1C1A]">{selectedDays}</span>
                  <span className="text-xs font-medium text-[#7A7268]">days</span>
                </motion.div>
                <motion.button
                  type="button"
                  onClick={() => handleDaysCounterChange(Math.min(30, selectedDays + 1))}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#FAF6F0] text-[#1E1C1A] font-bold text-lg cursor-pointer"
                  whileHover={{ scale: 1.15, backgroundColor: '#e8ddd5' }}
                  whileTap={{ scale: 0.88 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                >
                  +
                </motion.button>
              </div>
            </motion.div>

            {/* ── Travel Dates ── */}
            <motion.div
              className="flex flex-col gap-2.5"
              variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16,1,0.3,1] } } }}
            >
              <label className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A7268]">
                TRAVEL DATES <span className="text-[#A89F91] font-normal font-sans">(OPTIONAL)</span>
              </label>
              <div className="flex gap-2 relative z-50">
                <div className="flex-1">
                  <CustomDatePicker
                    value={startDate}
                    onChange={(val) => handleDateChange('start', val)}
                    placeholder="Start date"
                  />
                </div>
                <div className="flex items-center text-[#A89F91]">
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
            </motion.div>

            {/* ── Track Prices ── */}
            <motion.div
              className={`rounded-2xl border transition-all duration-300 overflow-hidden relative ${
                trackPrices
                  ? 'bg-white border-[#FF6B2C]/40 shadow-md ring-2 ring-[#FF6B2C]/10'
                  : 'bg-white border-[#E6DFD5] shadow-2xs'
              }`}
              variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16,1,0.3,1] } } }}
              whileHover={{ boxShadow: '0 10px 28px rgba(255,107,44,0.1)', borderColor: trackPrices ? '#FF6B2C' : '#d4c9bd' }}
              transition={{ duration: 0.2 }}
            >
              <label className="flex items-center justify-between cursor-pointer p-4 select-none">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <motion.div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        trackPrices ? 'bg-[#FF6B2C] text-white shadow-sm' : 'bg-[#FF6B2C]/10 text-[#FF6B2C]'
                      }`}
                      whileHover={{ scale: 1.15, rotate: -10 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                      <TrendingDown className="w-4.5 h-4.5" />
                    </motion.div>
                    {trackPrices && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6B2C] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF6B2C]"></span>
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#1E1C1A]">Track Price Drops</span>
                      {trackPrices && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF6B2C]/10 text-[#FF6B2C] text-[9px] font-mono font-bold uppercase tracking-wider"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2C] animate-pulse" />
                          RADAR ACTIVE
                        </motion.span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#7A7268] mt-0.5">Monitor flight & hotel rates for sudden price dips</div>
                  </div>
                </div>
                <motion.div
                  className={`w-10 h-5.5 rounded-full relative shrink-0 cursor-pointer transition-colors ${
                    trackPrices ? 'bg-[#FF6B2C]' : 'bg-[#E6DFD5]'
                  }`}
                  animate={{ backgroundColor: trackPrices ? '#FF6B2C' : '#E6DFD5' }}
                  transition={{ duration: 0.25 }}
                  whileTap={{ scale: 0.92 }}
                >
                  <input type="checkbox" className="sr-only" checked={trackPrices} onChange={() => setTrackPrices(!trackPrices)} />
                  <motion.div
                    className="absolute top-0.5 left-0.5 bg-white w-4.5 h-4.5 rounded-full shadow-md"
                    animate={{ x: trackPrices ? 18 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                  />
                </motion.div>
              </label>

              <AnimatePresence>
                {trackPrices && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden px-4 pb-4 pt-2 border-t border-[#E6DFD5]/60 bg-gradient-to-b from-[#FAF6F0]/60 to-[#FAF6F0]/20"
                  >
                    <div className="flex flex-col gap-3 pt-1">
                      {/* Label & Active Airport Resolved Name */}
                      <div className="flex items-center justify-between">
                        <label className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#7A7268]">
                          ORIGIN AIRPORT (IATA CODE)
                        </label>
                        {trackOrigin.length === 3 && (
                          <motion.span
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-[#FF6B2C] bg-[#FF6B2C]/10 px-2 py-0.5 rounded-md"
                          >
                            <Check className="w-3 h-3" />
                            {({
                              JFK: 'New York (JFK)',
                              LHR: 'London (LHR)',
                              DEL: 'New Delhi (DEL)',
                              SFO: 'San Francisco (SFO)',
                              DXB: 'Dubai (DXB)',
                              CDG: 'Paris (CDG)',
                              LAX: 'Los Angeles (LAX)'
                            })[trackOrigin] || `${trackOrigin} AIRPORT`}
                          </motion.span>
                        )}
                      </div>

                      {/* Input Field with animated Plane Icon */}
                      <motion.div
                        className="relative flex items-center bg-white rounded-xl border border-[#E6DFD5] p-1.5 focus-within:border-[#FF6B2C] focus-within:ring-2 focus-within:ring-[#FF6B2C]/15 transition-all shadow-2xs"
                        whileHover={{ borderColor: '#d4c9bd' }}
                      >
                        <motion.div
                          className="w-8 h-8 rounded-lg bg-[#FAF6F0] text-[#FF6B2C] flex items-center justify-center shrink-0 ml-1"
                          animate={trackOrigin ? { x: [0, 4, 0], rotate: [45, 50, 45] } : { rotate: 45 }}
                          transition={{ duration: 0.4 }}
                        >
                          <Plane className="w-4 h-4" />
                        </motion.div>
                        <input
                          type="text"
                          value={trackOrigin}
                          onChange={(e) => setTrackOrigin(e.target.value.toUpperCase().slice(0, 3))}
                          maxLength={3}
                          className="w-full bg-transparent px-3 text-sm font-mono font-black text-[#1E1C1A] placeholder-[#A89F91] tracking-widest uppercase focus:outline-none"
                          placeholder="E.G. JFK"
                        />
                        {trackOrigin && (
                          <motion.button
                            type="button"
                            onClick={() => setTrackOrigin('')}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="mr-2 px-2 py-0.5 text-[9px] font-mono font-bold text-[#7A7268] hover:text-[#1E1C1A] hover:bg-[#FAF6F0] rounded-md cursor-pointer transition-colors"
                          >
                            CLEAR
                          </motion.button>
                        )}
                      </motion.div>

                      {/* Quick Airport Suggestions with City Names */}
                      <div className="flex flex-col gap-1.5 pt-1">
                        <span className="text-[9px] font-mono text-[#A89F91] uppercase tracking-wider">
                          POPULAR HUBS:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { code: 'JFK', city: 'NYC' },
                            { code: 'LHR', city: 'London' },
                            { code: 'DEL', city: 'Delhi' },
                            { code: 'SFO', city: 'SFO' },
                            { code: 'DXB', city: 'Dubai' },
                            { code: 'CDG', city: 'Paris' },
                          ].map(({ code, city }) => {
                            const isSelected = trackOrigin === code;
                            return (
                              <motion.button
                                key={code}
                                type="button"
                                onClick={() => setTrackOrigin(code)}
                                whileHover={{ scale: 1.06, y: -1 }}
                                whileTap={{ scale: 0.94 }}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-[#1E1C1A] text-[#FAF6F0] shadow-sm ring-2 ring-[#1E1C1A]/20 scale-[1.02]'
                                    : 'bg-white border border-[#E6DFD5] text-[#7A7268] hover:border-[#1E1C1A]/40 hover:text-[#1E1C1A]'
                                }`}
                              >
                                <span>{code}</span>
                                <span className={`text-[8px] font-normal font-sans ${isSelected ? 'text-[#FF6B2C]' : 'text-[#A89F91]'}`}>
                                  • {city}
                                </span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* ── Action Buttons ── */}
            <motion.div
              className="flex flex-col gap-2.5 pt-2"
              variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16,1,0.3,1] } } }}
            >
              <PlanButton onClick={handleGenerateClick} />
              <motion.button
                type="button"
                onClick={handleSkipClick}
                className="relative w-full py-1 text-center font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A7268] cursor-pointer bg-transparent border-none overflow-hidden"
                whileHover={{ color: '#FF6B2C' }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2 }}
              >
                SKIP & GENERATE IMMEDIATELY →
              </motion.button>
            </motion.div>
          </motion.div>
        )}



        {/* STATE 3: Progress Tracker OR Live Day Schedule Cards (`showFinalCTA && itinerary`) */}
        {step === 'progress' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {showFinalCTA && itinerary ? (
              /* LIVE ITINERARY CARDS WORKSPACE IN LEFT SIDEBAR */
              <div className="flex flex-col gap-5 animate-fade-in">
                <div className="flex md:hidden items-center justify-between border-b border-[rgba(28,27,27,0.1)] pb-3 mb-4">
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
                <div className="hidden md:flex items-center justify-between border-b border-[rgba(28,27,27,0.1)] pb-3">
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

                {/* Destination-Level Overtourism Warning Banner */}
                {(() => {
                  const destOvertourism = getDestinationOvertourismInfo(itinerary?.destinationName);
                  if (!destOvertourism) return null;

                  return (
                    <div className="relative p-5 rounded-[20px] bg-white border border-[#E6DFD5] shadow-sm flex flex-col gap-4 group">
                      <div className="flex items-start gap-3.5">
                        <div className="w-8 h-8 rounded-full border border-orange-100 bg-orange-50/50 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-4 h-4 text-[#FF6B2C]" strokeWidth={1.5} />
                        </div>
                        <p className="text-[13px] font-medium text-[#1E1C1A] font-sans leading-relaxed pt-1.5 sm:pt-1">
                          {destOvertourism.warningText}
                        </p>
                      </div>

                      {destOvertourism.alternativeDestinations?.length > 0 && (
                        <div className="flex flex-col gap-3 pt-4 border-t border-[#E6DFD5]/60">
                          <span className="font-mono font-bold uppercase tracking-widest text-[9px] text-[#A89F91]">
                            Consider Nearby Alternatives
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            {destOvertourism.alternativeDestinations.map((alt, aIdx) => (
                              <button 
                                key={aIdx} 
                                className="px-4 py-1.5 rounded-full bg-[#FAF6F0] border border-[#E6DFD5] text-[#1E1C1A] text-[11px] font-bold hover:border-[#FF6B2C] hover:text-[#FF6B2C] hover:bg-white transition-all cursor-pointer shadow-xs"
                              >
                                {alt.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Merged Day Tabs + Compact Sticky Trip Summary Header (Apple Maps / Arc / Linear inspired) */}
                <div className="sticky top-0 z-30 pt-2 pb-2 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 bg-[#FAF3EE] transition-all duration-300 flex flex-col gap-2">
                  {(() => {
                    const activeDayObj = itinerary.days?.[selectedDayIndex];
                    const daySummary = getDaySummary(activeDayObj, selectedDayIndex, itinerary.days);
                    return (
                      <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-[rgba(28,27,27,0.08)] shadow-sm flex flex-col gap-2 transition-all duration-300">
                        {/* Top Row: Day Navigation Segmented Control + Weather Chip (top-right) */}
                        <div className="flex items-center justify-between gap-3">
                          {itinerary.days && itinerary.days.length > 0 ? (
                            <div className="flex-1 min-w-0 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                              <div className="inline-flex items-center gap-1 bg-[#F6F4F1] p-0.5 rounded-full border border-[#ECE8E2] h-7.5 select-none shadow-inner w-max">
                                {itinerary.days.map((day, idx) => {
                                const isSelected = selectedDayIndex === idx;
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleDaySelect(idx)}
                                    className="relative px-3 sm:px-4 h-full text-[11px] sm:text-xs transition-colors duration-300 cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-full focus:outline-hidden z-10"
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
                                    <span className={`relative transition-colors duration-300 ${isSelected ? 'text-white font-semibold' : 'text-[#5F5E5A] hover:text-[#1C1B1B] font-medium'
                                      }`}>
                                      {getDayDateString(itinerary?.startDate || startDate, idx) || `Day ${idx + 1}`}
                                    </span>
                                  </button>
                                );
                              })}
                              </div>
                            </div>
                          ) : <div />}

                          <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-[#1C1B1B] bg-[#F7F5F2] px-2.5 py-1 rounded-full border border-[#ECE8E2] shrink-0 select-none shadow-2xs">
                            <Sun className="w-3.5 h-3.5 text-[#1C1B1B]" />
                            <span>{daySummary.stats.weather || '32°'}</span>
                          </div>
                        </div>

                        {/* Second Row: Clean Inline Statistics & Rebalanced Action Toolbar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1.5 border-t border-[rgba(28,27,27,0.06)] text-[11px] sm:text-xs font-medium text-[#5F5E5A]">
                          {/* Left: Clean horizontal statistics separated by subtle dots */}
                          <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 min-w-0 select-none text-[#5F5E5A]">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-[#8C8B88]" />
                              <span>{String(daySummary.stats.stops).includes('Stop') ? daySummary.stats.stops : `${daySummary.stats.stops} Stops`}</span>
                            </span>
                            <span className="text-[#ECE8E2] font-light">•</span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#8C8B88]" />
                              <span>{daySummary.stats.hours}</span>
                            </span>
                            <span className="text-[#ECE8E2] font-light">•</span>
                            <span className="inline-flex items-center gap-1">
                              <Footprints className="w-3.5 h-3.5 text-[#8C8B88]" />
                              <span>{daySummary.stats.distance}</span>
                            </span>
                            <span className="text-[#ECE8E2] font-light">•</span>
                            <span className="inline-flex items-center gap-1 text-[#15803D] font-bold">
                              <Coins className="w-3.5 h-3.5" />
                              <span>{daySummary.stats.cost}</span>
                            </span>
                          </div>

                          {/* Right: Only Optimize Route (Primary orange) and Add Stop (Lightweight ghost) */}
                          <div className="flex items-center flex-nowrap gap-2 shrink-0 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => {
                                if (showCopilotDrawer && activeDrawerTab === 'ai') {
                                  setShowCopilotDrawer(false);
                                } else {
                                  setShowCopilotDrawer(true);
                                  setActiveDrawerTab('ai');
                                }
                              }}
                              className={`inline-flex items-center gap-1.5 h-8.5 px-3.5 rounded-xl text-xs font-bold shadow-[0_2px_8px_rgba(236,103,53,0.25)] transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 shrink-0 ${
                                showCopilotDrawer && activeDrawerTab === 'ai'
                                  ? 'bg-[#D95524] text-white ring-2 ring-[#EC6735]/40'
                                  : 'bg-[#EC6735] text-white hover:bg-[#D95524]'
                              }`}
                            >
                              <Sparkles className="w-3.5 h-3.5 shrink-0" />
                              <span>Optimize Route</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (showCopilotDrawer && activeDrawerTab === 'manual') {
                                  setShowCopilotDrawer(false);
                                } else {
                                  setShowCopilotDrawer(true);
                                  setActiveDrawerTab('manual');
                                }
                              }}
                              className={`inline-flex items-center gap-1.5 h-8.5 px-3.5 rounded-xl text-[#1C1B1B] text-xs font-bold transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 shrink-0 ${
                                showCopilotDrawer && activeDrawerTab === 'manual'
                                  ? 'bg-stone-200 text-stone-900 ring-2 ring-stone-300'
                                  : 'bg-transparent hover:bg-black/5'
                              }`}
                              title="Add Stop"
                            >
                              <Plus className="w-3.5 h-3.5 text-[#6B6B6B] shrink-0" />
                              <span>Add Stop</span>
                            </button>
                          </div>
                        </div>

                        {/* Seamless Integrated Inline Modifier Bar */}
                        <div className={`w-full transition-all duration-300 ease-out overflow-hidden ${
                          showCopilotDrawer || isRefiningDay || refineExplanation
                            ? 'max-h-[350px] opacity-100 mt-2.5 pt-2.5 border-t border-stone-100'
                            : 'max-h-0 opacity-0 mt-0 pt-0 border-t-0 pointer-events-none'
                        }`}>
                          {activeDrawerTab === 'ai' ? (
                            <div className="flex flex-col gap-2">
                              {/* Sleek Search / Prompt Bar */}
                              <div className="flex items-center gap-2 bg-stone-50/90 border border-stone-200/80 rounded-2xl p-1.5 pl-3 focus-within:border-[#EC6735] focus-within:ring-2 focus-within:ring-[#EC6735]/15 focus-within:bg-white transition-all shadow-2xs">
                                <Sparkles className="w-4 h-4 text-[#EC6735] shrink-0" />
                                <input
                                  type="text"
                                  value={refinePromptInput}
                                  onChange={(e) => setRefinePromptInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && refinePromptInput.trim() && !isRefiningDay) {
                                      triggerRefineDay();
                                    }
                                  }}
                                  placeholder="Ask AI to adjust this day (e.g. 'Optimize route pacing', 'Add sunset dinner')..."
                                  className="flex-1 min-w-0 bg-transparent text-xs text-stone-900 placeholder:text-stone-400 focus:outline-hidden font-normal py-1"
                                />
                                <button
                                  type="button"
                                  onClick={() => triggerRefineDay()}
                                  disabled={isRefiningDay || !refinePromptInput.trim()}
                                  className="h-7.5 px-3 rounded-xl bg-[#EC6735] text-white hover:bg-[#D95524] text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer shrink-0 active:scale-95 shadow-2xs"
                                >
                                  {isRefiningDay ? (
                                    <SpinnerIcon />
                                  ) : (
                                    <>
                                      <span>Update</span>
                                      <ArrowRight className="w-3 h-3" />
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setShowCopilotDrawer(false); setRefinePromptInput(''); }}
                                  className="w-6 h-6 rounded-full text-stone-400 hover:text-stone-700 flex items-center justify-center cursor-pointer shrink-0 transition-colors"
                                  title="Close"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Clean Suggestion Tags (Wrap neatly without overflow scrollbars) */}
                              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                {[
                                  { label: 'Minimize travel', prompt: 'Re-order activities to minimize transit time and distance.' },
                                  { label: 'Sunset viewpoint', prompt: 'Add a scenic sunset viewpoint before evening dinner.' },
                                  { label: 'Morning coffee', prompt: 'Add a highly rated artisan coffee roaster in the morning.' },
                                  { label: 'Local dinner', prompt: 'Recommend a popular local neighborhood dinner spot.' }
                                ].map((chip, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setRefinePromptInput(chip.prompt)}
                                    className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-stone-100 hover:bg-stone-200/70 text-stone-600 hover:text-stone-900 border border-stone-200/50 transition-all cursor-pointer active:scale-95"
                                  >
                                    {chip.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div>
                                  <input
                                    type="text"
                                    value={newStopTime}
                                    onChange={(e) => setNewStopTime(e.target.value)}
                                    placeholder="Time (e.g. 06:00 PM)"
                                    className="w-full bg-stone-50 focus:bg-white text-stone-900 placeholder:text-stone-400 text-xs rounded-xl p-2 border border-stone-200 focus:border-[#EC6735] focus:ring-2 focus:ring-[#EC6735]/15 focus:outline-hidden font-medium"
                                  />
                                </div>
                                <div>
                                  <select
                                    value={newStopCategory}
                                    onChange={(e) => setNewStopCategory(e.target.value)}
                                    className="w-full bg-stone-50 focus:bg-white text-stone-900 text-xs rounded-xl p-2 border border-stone-200 focus:border-[#EC6735] focus:ring-2 focus:ring-[#EC6735]/15 focus:outline-hidden font-medium cursor-pointer"
                                  >
                                    <option value="Highlight">Highlight</option>
                                    <option value="Food & Dining">Food & Dining</option>
                                    <option value="Cultural">Cultural</option>
                                    <option value="Hidden Gem">Hidden Gem</option>
                                    <option value="Activity">Activity</option>
                                  </select>
                                </div>
                                <div>
                                  <input
                                    type="text"
                                    value={newStopTitle}
                                    onChange={(e) => setNewStopTitle(e.target.value)}
                                    placeholder="Stop Title (e.g. Rooftop Aperitivo)"
                                    className="w-full bg-stone-50 focus:bg-white text-stone-900 placeholder:text-stone-400 text-xs rounded-xl p-2 border border-stone-200 focus:border-[#EC6735] focus:ring-2 focus:ring-[#EC6735]/15 focus:outline-hidden font-medium"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={newStopDesc}
                                  onChange={(e) => setNewStopDesc(e.target.value)}
                                  placeholder="Optional short description or note..."
                                  className="flex-1 min-w-0 bg-stone-50 focus:bg-white text-stone-900 placeholder:text-stone-400 text-xs rounded-xl p-2 border border-stone-200 focus:border-[#EC6735] focus:ring-2 focus:ring-[#EC6735]/15 focus:outline-hidden font-medium"
                                />
                                <button
                                  type="button"
                                  onClick={handleAddCustomStop}
                                  disabled={!newStopTitle.trim()}
                                  className="h-8 px-3.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer bg-[#EC6735] text-white hover:bg-[#D95524] shadow-xs active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setShowCopilotDrawer(false); }}
                                  className="w-6 h-6 rounded-full text-stone-400 hover:text-stone-700 flex items-center justify-center cursor-pointer shrink-0 transition-colors"
                                  title="Close"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Refinement Feedback Toast */}
                          {refineExplanation && (
                            <div className="mt-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 shadow-xs font-medium animate-fade-in">
                              <span className="flex items-center gap-1.5 min-w-0 truncate">
                                <span>✨</span>
                                <span className="truncate">{refineExplanation}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setRefineExplanation(null)}
                                className="text-emerald-600 hover:text-emerald-900 font-bold text-xs p-0.5 rounded-md hover:bg-emerald-100 cursor-pointer shrink-0"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
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
                      {/* Point 5 & 1: Subtle vertical timeline connecting stops */}
                      <motion.div 
                        style={{ 
                          scaleY: scrollRef ? pathProgress : 1, 
                          originY: 0,
                          backgroundImage: 'linear-gradient(to bottom, #FF6B2C 60%, transparent 40%)',
                          backgroundSize: '3px 12px',
                          backgroundRepeat: 'repeat-y',
                          opacity: 1
                        }}
                        className="absolute left-[31px] sm:left-[29.5px] top-8 bottom-8 w-[3px] pointer-events-none z-0" 
                      />

                      {itinerary.days?.[selectedDayIndex]?.activities?.map((act, idx) => (
  <DayScheduleCard
    key={`${selectedDayIndex}-${idx}`}
    act={act}
    idx={idx}
    selectedDayIndex={selectedDayIndex}
    itinerary={itinerary}
    hoveredStopIdx={hoveredStopIdx}
    selectedStopIdx={selectedStopIdx}
    dragOverStopIdx={dragOverStopIdx}
    draggedStopIdx={draggedStopIdx}
    mockVotes={mockVotes}
    scrollRef={scrollRef}
    handleDragStart={handleDragStart}
    handleDragOver={handleDragOver}
    handleDragLeave={handleDragLeave}
    handleDrop={handleDrop}
    handleDragEnd={handleDragEnd}
    handleHoverStop={handleHoverStop}
    handleSelectStop={handleSelectStop}
    handleVote={handleVote}
    setActiveFlagTarget={setActiveFlagTarget}
    handleSwapActivity={handleSwapActivity}
  />
))}
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
                  <div className="group relative overflow-hidden bg-linear-to-r from-orange-50/80 via-white to-orange-50/80 p-3.5 sm:p-4 rounded-[1.25rem] border border-orange-200/60 shadow-sm transition-all hover:shadow-md hover:border-orange-300 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
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
                          // Show the Trip Setup popup (calendar + notifications)
                          if (onOpenCalendar) onOpenCalendar();
                          setIsElevating(false);
                          setIsConfirming(false);
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
              /* ── Non-Scrollable Minimal Editorial Progress View ── */
              <div className="flex flex-col gap-6 py-2 overflow-hidden select-none">
                {/* Header Badge & Title */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#FF6B2C] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2C] animate-ping" />
                      TRIPWISE AI · GENERATING
                    </span>
                    <span className="font-mono text-[11px] font-black text-[#FF6B2C]">
                      {Math.round(progressPercent)}%
                    </span>
                  </div>
                  <h3 className="text-lg font-serif font-black text-[#1E1C1A] tracking-tight leading-snug">
                    Building your custom itinerary
                  </h3>
                </div>

                {/* Sleek Minimal Progress Track */}
                <div className="w-full h-1.5 rounded-full bg-[#E6DFD5]/60 overflow-hidden relative">
                  <motion.div
                    className="h-full rounded-full bg-[#FF6B2C] relative"
                    initial={{ width: '0%' }}
                    animate={{ width: `${Math.max(3, progressPercent)}%` }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                    />
                  </motion.div>
                </div>

                {/* Minimal Single-Line Step Timeline */}
                <div className="flex flex-col gap-3 pt-1">
                  <AnimatePresence>
                    {STATUS_ROWS.map((row, index) => {
                      const isRevealed = activeRowIndex >= index;
                      const isDone = activeRowIndex > index;
                      const isActive = isRevealed && !isDone;

                      if (!isRevealed) return null;

                      return (
                        <motion.div
                          key={row.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className="flex items-center gap-3"
                        >
                          {/* Left Indicator Dot / Check */}
                          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                            {isDone ? (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-4 h-4 rounded-full bg-[#2FA66A] text-white flex items-center justify-center text-[9px] font-bold"
                              >
                                ✓
                              </motion.div>
                            ) : isActive ? (
                              <div className="relative flex items-center justify-center">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B2C] animate-ping opacity-75 absolute" />
                                <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B2C] relative" />
                              </div>
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#E6DFD5]" />
                            )}
                          </div>

                          {/* Text Label */}
                          <span
                            className={`text-xs transition-colors duration-200 ${
                              isActive
                                ? 'font-bold text-[#FF6B2C]'
                                : isDone
                                ? 'font-medium text-[#1E1C1A]'
                                : 'font-normal text-[#A89F91]'
                            }`}
                          >
                            {row.label}
                          </span>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* ── High-End Animated Plane Runway & Takeoff Experience ── */}
                <div className="relative flex-1 flex flex-col justify-end overflow-hidden pt-4 pb-2" style={{ minHeight: 110 }}>
                  
                  {/* Glowing Tarmac Horizon Light Gradient */}
                  <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#FF6B2C]/5 via-stone-100/30 to-transparent pointer-events-none" />

                  {/* Dynamic Streaming Runway Dashes & Beacon Lights */}
                  <div className="absolute bottom-6 left-0 right-0 h-3 flex items-center overflow-hidden pointer-events-none">
                    {/* Streaming Dashed Runway Line */}
                    <div className="w-full flex items-center gap-2 overflow-hidden px-1">
                      {Array.from({ length: 32 }).map((_, i) => (
                        <motion.div
                          key={i}
                          className="h-[2.5px] rounded-full bg-[#D8D0C5] shrink-0 shadow-2xs"
                          style={{ width: 14 }}
                          animate={{ x: [-22, 0] }}
                          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Pulsing Runway Edge Beacon LED Lights */}
                  <div className="absolute bottom-5 left-2 right-2 flex justify-between items-center pointer-events-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2C] animate-ping" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2C] animate-ping [animation-delay:400ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2C] animate-ping [animation-delay:800ms]" />
                  </div>

                  {/* Airplane & Engine Thrusters */}
                  <AnimatePresence mode="wait">
                    {!showFinalCTA ? (
                      /* Idle State — Plane Taxiing & Engine Shimmering on Tarmac */
                      <motion.div
                        key="plane-idle"
                        className="absolute bottom-[22px] left-4 flex flex-col items-start"
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 15 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {/* Plane Container with Engine Vibration & Thruster Flame */}
                        <div className="relative flex items-center">
                          {/* Engine Afterburner Flame */}
                          <motion.div
                            className="absolute -left-4 top-1/2 -translate-y-1/2 w-6 h-2 rounded-full bg-gradient-to-l from-[#FF6B2C] via-[#FF8C00] to-transparent blur-[2px]"
                            animate={{ opacity: [0.5, 1, 0.5], scaleX: [0.8, 1.4, 0.8] }}
                            transition={{ repeat: Infinity, duration: 0.5, ease: 'easeInOut' }}
                          />
                          {/* Heat Distortion Glow */}
                          <motion.div
                            className="absolute -left-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#FF6B2C]/20 blur-[8px]"
                            animate={{ scale: [0.9, 1.2, 0.9] }}
                            transition={{ repeat: Infinity, duration: 0.7, ease: 'easeInOut' }}
                          />

                          {/* Airplane Icon */}
                          <motion.div
                            animate={{ y: [0, -1, 0] }}
                            transition={{ repeat: Infinity, duration: 0.35, ease: 'easeInOut' }}
                          >
                            <Plane className="w-7 h-7 text-[#1E1C1A] filter drop-shadow-xs" />
                          </motion.div>
                        </div>

                        {/* Animated Status Pill Badge */}
                        <motion.div 
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF2EA] border border-[#FF6B2C]/30 text-[#FF6B2C] text-[10px] font-bold tracking-widest uppercase shadow-2xs backdrop-blur-sm"
                        >
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6B2C] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF6B2C]"></span>
                          </span>
                          <span>✦ Preparing for takeoff...</span>
                        </motion.div>
                      </motion.div>
                    ) : (
                      /* Complete State — Supersonic Takeoff Lift-Off Animation */
                      <motion.div
                        key="plane-takeoff"
                        className="absolute bottom-[22px] left-4 z-20"
                        initial={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 }}
                        animate={{ x: 320, y: -90, rotate: -24, opacity: 0, scale: 1.15 }}
                        transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
                      >
                        <div className="relative flex items-center">
                          {/* Supersonic Jet Contrail */}
                          <motion.div
                            className="absolute top-1/2 -left-12 h-[2.5px] rounded-full bg-gradient-to-l from-[#FF6B2C] via-[#FF8C00]/60 to-transparent shadow-[0_0_8px_#FF6B2C]"
                            initial={{ width: 0 }}
                            animate={{ width: 110 }}
                            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.15 }}
                            style={{ translateY: '-50%' }}
                          />
                          <Plane className="w-8 h-8 text-[#FF6B2C] filter drop-shadow-md" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* CTA — slides in after takeoff */}
                <AnimatePresence>
                  {showFinalCTA && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 360, damping: 24, delay: 0.7 }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          /* Flash transition overlay before navigating */
                          const overlay = document.createElement('div');
                          overlay.style.cssText = 'position:fixed;inset:0;background:#FF6B2C;opacity:0;z-index:9999;pointer-events:none;transition:opacity 0.35s ease';
                          document.body.appendChild(overlay);
                          requestAnimationFrame(() => { overlay.style.opacity = '0.18'; });
                          setTimeout(() => {
                            if (onViewItinerary) onViewItinerary();
                            else if (typeof window !== 'undefined') window.location.href = '/itinerary';
                            setTimeout(() => overlay.remove(), 600);
                          }, 350);
                        }}
                        className="w-full py-3 px-5 rounded-xl font-bold bg-[#FF6B2C] text-white hover:bg-[#E55A20] active:scale-[0.98] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 text-xs md:text-sm shadow-sm"
                      >
                        <Plane className="w-3.5 h-3.5 -rotate-45" />
                        <span>View My Itinerary</span>
                        <ArrowRightIcon />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer / Subtle Info - Pinned to bottom */}
      <div className="pt-4 mt-auto border-t border-[rgba(28,27,27,0.06)] flex items-center justify-between text-[11px] text-secondary-text shrink-0">
        <span>Powered by TripWise AI</span>
        <button
          type="button"
          onClick={() => setIsAdminQueueOpen(true)}
          className="hover:text-[#FF6B2C] underline decoration-dotted font-mono text-[10px] transition-colors cursor-pointer flex items-center gap-1"
        >
          <ShieldAlert className="w-3 h-3 text-amber-600" />
          <span>Moderation Queue</span>
        </button>
      </div>

      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        tripId={tripId}
        currentCollaborators={collaboratorsList}
      />

      <FlagModal
        isOpen={!!activeFlagTarget}
        onClose={() => setActiveFlagTarget(null)}
        placeId={activeFlagTarget?.placeId}
        placeTitle={activeFlagTarget?.placeTitle}
        onSubmitted={() => setFlagsUpdateTrigger(prev => prev + 1)}
      />

      <FlaggingAdminModal
        isOpen={isAdminQueueOpen}
        onClose={() => setIsAdminQueueOpen(false)}
        onUpdated={() => setFlagsUpdateTrigger(prev => prev + 1)}
      />
    </div>
  );
}
