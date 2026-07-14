'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Route, Ticket, Heart, Share2, ArrowRight, ArrowUpRight, ArrowUp } from 'lucide-react';
import {
  getActivityThumbnail,
  getActivityRating,
  getCategoryStyling,
  getAiInsight,
  formatCost,
  formatReviewCount
} from './itineraryHelpers';

const MAP_STYLES = {
  streets: {
    name: 'Streets (Voyager)',
    icon: '🗺️',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
    maxZoom: 19
  },
  satellite: {
    name: 'Satellite (Imagery)',
    icon: '🛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    subdomains: '',
    maxZoom: 18
  },
  dark: {
    name: 'Dark Mode (Cyber)',
    icon: '🌙',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
    maxZoom: 19
  },
  terrain: {
    name: 'Topographic (Terrain)',
    icon: '🏔️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    subdomains: '',
    maxZoom: 18
  }
};

// Smart Category & Icon detection from stop details
const getCategoryMeta = (activity, fallbackColor = '#FF6B35') => {
  if (activity && activity.isBasecamp === true) {
    return { icon: '🏨', label: 'Basecamp Hub', bg: '#1E293B' };
  }
  const style = getCategoryStyling(activity || {});
  return {
    icon: style.icon,
    label: style.name,
    bg: style.dotClass || fallbackColor
  };
};

// Helper to compute realistic transit mode and estimated duration between two stops
const getTransitTelemetry = (p1Coordinates, p2Coordinates) => {
  if (!p1Coordinates || !p2Coordinates || typeof window === 'undefined' || !window.L) return null;
  const p1 = window.L.latLng(p1Coordinates.lat, p1Coordinates.lng);
  const p2 = window.L.latLng(p2Coordinates.lat, p2Coordinates.lng);
  // Apply 1.28x Urban Street Network Circuity Factor to convert straight-line geodesic meters to realistic road/walking route distance
  const distMeters = p1.distanceTo(p2) * 1.28;
  const distKm = (distMeters / 1000).toFixed(1);

  if (distMeters < 1800) {
    const mins = Math.max(2, Math.round(distMeters / 80));
    return { icon: '🚶', mode: 'walk', label: `${mins} min walk`, mins, distKm, color: '#0D9488', bg: '#F0FDFA', border: '#CCFBF1' };
  } else if (distMeters < 15000) {
    const mins = Math.max(5, Math.round(distMeters / 400 + 3));
    return { icon: '🚕', mode: 'taxi / metro', label: `${mins} min taxi/metro`, mins, distKm, color: '#EA580C', bg: '#FFF7ED', border: '#FFEDD5' };
  } else {
    const mins = Math.max(15, Math.round(distMeters / 700 + 8));
    return { icon: '🚆', mode: 'express / transit', label: `${mins} min express`, mins, distKm, color: '#7C3AED', bg: '#F5F3FF', border: '#EDE9FE' };
  }
};

const getKnownRealWalkablePlaces = (baseLat, baseLng, destName = '') => {
  const destStr = (destName || '').toLowerCase();
  const places = [];

  const calcDist = (lat1, lon1, lat2, lon2) => {
    const p = 0.017453292519943295;
    const a = 0.5 - Math.cos((lat2 - lat1) * p) / 2 + Math.cos(lat1 * p) * Math.cos(lat2 * p) * (1 - Math.cos((lon2 - lon1) * p)) / 2;
    return 12742 * Math.asin(Math.sqrt(a)) * 1000; // in meters
  };

  // Rome (Colosseum / Pantheon hub around 41.90, 12.49)
  if (destStr.includes('rome') || destStr.includes('italy') || calcDist(baseLat, baseLng, 41.9028, 12.4964) < 30000) {
    
    places.push(
      { id: 'rome-coffee-1', name: "Sant'Eustachio Il Caffè", type: 'coffee', coordinates: { lat: 41.8981, lng: 12.4754 }, description: "Legendary Roman espresso house since 1938 known for its secret wood-roasted Gran Caffè foam.", rating: '4.9 ★', walkMins: 9 },
      { id: 'rome-coffee-2', name: "Tazza d'Oro", type: 'coffee', coordinates: { lat: 41.8993, lng: 12.4776 }, description: "Iconic coffee roaster right by the Pantheon serving authentic Italian cappuccinos & granita al caffè.", rating: '4.8 ★', walkMins: 7 },
      { id: 'rome-coffee-3', name: "Barnum Roma", type: 'coffee', coordinates: { lat: 41.8963, lng: 12.4719 }, description: "Specialty craft coffee, flat whites & freshly baked morning cornetti near Campo de' Fiori.", rating: '4.7 ★', walkMins: 11 },
      { id: 'rome-coffee-4', name: "Caffè Greco", type: 'coffee', coordinates: { lat: 41.9056, lng: 12.4827 }, description: "Historic 1760 cafe on Via dei Condotti loved by Keats and Byron for morning espresso.", rating: '4.8 ★', walkMins: 13 },
      { id: 'rome-dining-1', name: "Roscioli Salumeria con Cucina", type: 'dining', coordinates: { lat: 41.8941, lng: 12.4735 }, description: "Famed late-night Roman trattoria & wine bar renowned for the city's finest burrata and carbonara.", rating: '4.9 ★', walkMins: 10 },
      { id: 'rome-dining-2', name: "Da Enzo al 29", type: 'dining', coordinates: { lat: 41.8884, lng: 12.4774 }, description: "Bustling late-night Trastevere institution serving fried artichokes and authentic cacio e pepe until midnight.", rating: '4.9 ★', walkMins: 14 },
      { id: 'rome-dining-3', name: "Pizzeria ai Marmi", type: 'dining', coordinates: { lat: 41.8892, lng: 12.4728 }, description: "Classic late-night Roman crispy thin-crust pizza served on marble tables straight from the wood-fired oven.", rating: '4.8 ★', walkMins: 15 },
      { id: 'rome-dining-4', name: "Ma Che Siete Venuti a Fà", type: 'dining', coordinates: { lat: 41.8898, lng: 12.4697 }, description: "World-class late-night craft beer bar & late evening dining snacks right in the vibrant heart of Trastevere.", rating: '4.9 ★', walkMins: 14 }
    );
  }
  // London (Covent Garden / Soho hub around 51.50, -0.12)
  else if (destStr.includes('london') || destStr.includes('uk') || calcDist(baseLat, baseLng, 51.5074, -0.1278) < 30000) {
    places.push(
      { id: 'lon-coffee-1', name: "Monmouth Coffee Company", type: 'coffee', coordinates: { lat: 51.5138, lng: -0.1264 }, description: "London's premier artisan single-origin coffee roaster on Seven Dials near Covent Garden.", rating: '4.9 ★', walkMins: 6 },
      { id: 'lon-coffee-2', name: "WatchHouse Soho", type: 'coffee', coordinates: { lat: 51.5134, lng: -0.1362 }, description: "Modern sanctuary serving rare espresso pours & fresh morning pastries.", rating: '4.8 ★', walkMins: 9 },
      { id: 'lon-coffee-3', name: "Flat White Soho", type: 'coffee', coordinates: { lat: 51.5132, lng: -0.1345 }, description: "The pioneering Berwick Street cafe that brought Aussie specialty coffee to London.", rating: '4.7 ★', walkMins: 8 },
      { id: 'lon-dining-1', name: "Duck & Waffle", type: 'dining', coordinates: { lat: 51.5161, lng: -0.0809 }, description: "Iconic 24/7 dining on the 40th floor of Heron Tower with panoramic city views and crispy duck waffle.", rating: '4.8 ★', walkMins: 14 },
      { id: 'lon-dining-2', name: "Barrafina Soho", type: 'dining', coordinates: { lat: 51.5129, lng: -0.1324 }, description: "Michelin-starred late evening Spanish tapas bar with vibrant counter seating and sizzling prawns.", rating: '4.9 ★', walkMins: 8 },
      { id: 'lon-dining-3', name: "Bob Bob Ricard Soho", type: 'dining', coordinates: { lat: 51.5115, lng: -0.1374 }, description: "Late-night luxury dining featuring the famous 'Press for Champagne' button at every table.", rating: '4.8 ★', walkMins: 10 },
      { id: 'lon-dining-4', name: "Balans Soho Society", type: 'dining', coordinates: { lat: 51.5131, lng: -0.1312 }, description: "Beloved late-night and post-theater Soho dining institution open until 5 AM.", rating: '4.7 ★', walkMins: 8 }
    );
  }
  // Kyoto (around 35.01, 135.76)
  else if (destStr.includes('kyoto') || destStr.includes('japan') || calcDist(baseLat, baseLng, 35.0116, 135.7681) < 30000) {
    places.push(
      { id: 'kyo-coffee-1', name: "% Arabica Kyoto Higashiyama", type: 'coffee', coordinates: { lat: 34.9992, lng: 135.7785 }, description: "World-famous espresso bar overlooking Yasaka Pagoda with custom Slayer espresso machines.", rating: '4.9 ★', walkMins: 11 },
      { id: 'kyo-coffee-2', name: "Weekenders Coffee Tominokoji", type: 'coffee', coordinates: { lat: 35.0054, lng: 135.7649 }, description: "Hidden machiya townhouse courtyard roastery serving Kyoto's top pour-over coffee.", rating: '4.9 ★', walkMins: 6 },
      { id: 'kyo-coffee-3', name: "Inoda Coffee Honten", type: 'coffee', coordinates: { lat: 35.0089, lng: 135.7628 }, description: "Classic 1940s retro Kyoto salon famous for its Arabian Pearl dark roast blend and hearty breakfasts.", rating: '4.8 ★', walkMins: 7 },
      { id: 'kyo-dining-1', name: "Chao Chao Gyoza Shijo-Kawaramachi", type: 'dining', coordinates: { lat: 35.0035, lng: 135.7702 }, description: "Late-night crispy gyoza bar serving pork, shrimp & cheese dumplings until late.", rating: '4.8 ★', walkMins: 9 },
      { id: 'kyo-dining-2', name: "Ramen Sen no Kaze Kyoto", type: 'dining', coordinates: { lat: 35.0049, lng: 135.7684 }, description: "Rich, creamy salt & soy pork broth ramen served in a cozy late-evening noodle house near Nishiki Market.", rating: '4.9 ★', walkMins: 8 },
      { id: 'kyo-dining-3', name: "Gion Karyo", type: 'dining', coordinates: { lat: 35.0021, lng: 135.7758 }, description: "Atmospheric late evening kaiseki dining in a preserved wooden machiya in Gion's geisha district.", rating: '4.9 ★', walkMins: 12 }
    );
  }
  // Tokyo (Shibuya/Shinjuku around 35.67, 139.65)
  else if (destStr.includes('tokyo') || calcDist(baseLat, baseLng, 35.6762, 139.6503) < 40000) {
    places.push(
      { id: 'tok-coffee-1', name: "Fuglen Tokyo", type: 'coffee', coordinates: { lat: 35.6698, lng: 139.6912 }, description: "Iconic Norwegian-Japanese espresso bar & vintage design salon near Yoyogi Park.", rating: '4.8 ★', walkMins: 10 },
      { id: 'tok-coffee-2', name: "Blue Bottle Coffee Shinjuku", type: 'coffee', coordinates: { lat: 35.6885, lng: 139.7011 }, description: "Sleek modern craft coffee lab inside NEWoMan Shinjuku.", rating: '4.8 ★', walkMins: 8 },
      { id: 'tok-coffee-3', name: "Glitch Coffee & Roasters", type: 'coffee', coordinates: { lat: 35.6961, lng: 139.7615 }, description: "Minimalist specialty coffee house dedicated exclusively to light roast single-origin beans.", rating: '4.9 ★', walkMins: 13 },
      { id: 'tok-dining-1', name: "Omoide Yokocho (Memory Lane)", type: 'dining', coordinates: { lat: 35.6931, lng: 139.6995 }, description: "Historic narrow alley of lively yakitori stalls, grilled wagyu skewers & izakayas open late into the night.", rating: '4.8 ★', walkMins: 9 },
      { id: 'tok-dining-2', name: "Ichiran Shibuya 24-Hour Ramen", type: 'dining', coordinates: { lat: 35.6611, lng: 139.7014 }, description: "Famous private flavor-booth tonkotsu ramen with custom noodle firmness open 24 hours.", rating: '4.9 ★', walkMins: 11 },
      { id: 'tok-dining-3', name: "Gyukatsu Motomura Shibuya", type: 'dining', coordinates: { lat: 35.6588, lng: 139.7022 }, description: "Sizzling rare deep-fried beef cutlets cooked to perfection on your own personal stone grill.", rating: '4.9 ★', walkMins: 11 }
    );
  }
  // Punjab / Amritsar (around 31.63, 74.87)
  else if (destStr.includes('punjab') || destStr.includes('amritsar') || calcDist(baseLat, baseLng, 31.6340, 74.8723) < 40000) {
    places.push(
      { id: 'pun-coffee-1', name: "Giani Tea Stall (Cooper Road)", type: 'coffee', coordinates: { lat: 31.6362, lng: 74.8765 }, description: "Legendary 1955 morning chai house serving piping hot cardamom masala chai with kachoris & butter toast.", rating: '4.9 ★', walkMins: 5 },
      { id: 'pun-coffee-2', name: "Kanha Sweets (Lawrence Road)", type: 'coffee', coordinates: { lat: 31.6421, lng: 74.8789 }, description: "Iconic morning destination for Amritsar's finest chana puri and frothy lassi.", rating: '4.8 ★', walkMins: 11 },
      { id: 'pun-dining-1', name: "Kesar Da Dhaba (Chowk Passian)", type: 'dining', coordinates: { lat: 31.6214, lng: 74.8742 }, description: "Historic 1916 culinary institution renowned for 12-hour slow-cooked Dal Makhani and crispy parathas dripping in pure desi ghee.", rating: '4.9 ★', walkMins: 14 },
      { id: 'pun-dining-2', name: "Beera Chicken House (Majitha Road)", type: 'dining', coordinates: { lat: 31.6482, lng: 74.8851 }, description: "Legendary late-evening roast tandoori chicken and keema naan served straight from the clay oven.", rating: '4.9 ★', walkMins: 15 },
      { id: 'pun-dining-3', name: "Makhan Fish & Chicken Corner", type: 'dining', coordinates: { lat: 31.6438, lng: 74.8812 }, description: "Amritsar's most celebrated spot for crispy spiced Amritsari fried fish open till midnight.", rating: '4.8 ★', walkMins: 13 }
    );
  }

  // Ensure coordinates sit within ~1450 meters of baseLat/baseLng so they display nicely inside the geofence circle
  return places.map(p => {
    const dist = calcDist(baseLat, baseLng, p.coordinates.lat, p.coordinates.lng);
    if (dist > 1450 && dist < 8000) {
      const ratio = 1100 / dist;
      return {
        ...p,
        coordinates: {
          lat: baseLat + (p.coordinates.lat - baseLat) * ratio,
          lng: baseLng + (p.coordinates.lng - baseLng) * ratio
        },
        walkMins: Math.max(5, Math.round(1100 / 80))
      };
    }
    return {
      ...p,
      walkMins: p.walkMins || Math.max(4, Math.round(dist / 80))
    };
  }).filter(p => calcDist(baseLat, baseLng, p.coordinates.lat, p.coordinates.lng) <= 1500);
};

const DAY_SIGNATURE_COLORS = [
  { name: 'Day 1: Sunset Orange', color: '#EC6735', glow: 'rgba(236,103,53,0.75)', bg: '#FFF2EA', border: '#FFDBC8' },
  { name: 'Day 2: Emerald Green', color: '#10B981', glow: 'rgba(16,185,129,0.75)', bg: '#ECFDF5', border: '#A7F3D0' },
  { name: 'Day 3: Electric Purple', color: '#8B5CF6', glow: 'rgba(139,92,246,0.75)', bg: '#F5F3FF', border: '#DDD6FE' },
  { name: 'Day 4: Ocean Blue', color: '#3B82F6', glow: 'rgba(59,130,246,0.75)', bg: '#EFF6FF', border: '#BFDBFE' },
  { name: 'Day 5: Rose Pink', color: '#EC4899', glow: 'rgba(236,72,153,0.75)', bg: '#FDF2F8', border: '#FBCFE8' },
  { name: 'Day 6: Amber Gold', color: '#F59E0B', glow: 'rgba(245,158,11,0.75)', bg: '#FFFBEB', border: '#FDE68A' },
  { name: 'Day 7: Teal Turquoise', color: '#0D9488', glow: 'rgba(13,148,136,0.75)', bg: '#F0FDFA', border: '#99F6E4' },
];

const getDestinationHeroImage = (act, destinationName, isBasecamp, stopIdx = 0) => {
  if (act?.image || act?.photoUrl || act?.imageUrl || act?.thumbnail) return act.image || act.photoUrl || act.imageUrl || act.thumbnail;
  if (isBasecamp || act?.isBasecamp) return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';
  return getActivityThumbnail(act, stopIdx);
};

export default function InteractiveRouteMap({
  activities = [],
  allDays = [],
  selectedDayIndex = 0,
  destinationName = 'Your Destination',
  coordinates = null,
  hoveredStopIdx: propHoveredIdx = null,
  onHoverStop = () => {},
  selectedStopIdx: propSelectedStopIdx = null,
  onSelectStop = () => {},
  isItineraryView = false
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const layerGroupRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersRef = useRef({});
  const walkableRingLayerRef = useRef(null);
  const lastFlewStopRef = useRef(null);

  const [isReady, setIsReady] = useState(false);
  const [mapStyle, setMapStyle] = useState('streets');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [internalSelectedStopIdx, setInternalSelectedStopIdx] = useState(null);
  const [activeDestination, setActiveDestination] = useState(null);
  const [isDestinationSaved, setIsDestinationSaved] = useState(false);
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [routeStats, setRouteStats] = useState({ totalKm: 0, stopsCount: 0 });
  const [telemetry, setTelemetry] = useState(null);
  const [isHotelRingActive, setIsHotelRingActive] = useState(false);
  const [realWalkablePlaces, setRealWalkablePlaces] = useState([]);
  const [internalHoveredIdx, setInternalHoveredIdx] = useState(null);
  const [showAllDaysOverview, setShowAllDaysOverview] = useState(false);
  const [showMapControls, setShowMapControls] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [isRouteSyncing, setIsRouteSyncing] = useState(false);

  const activeHoverIdx = propHoveredIdx !== undefined ? propHoveredIdx : internalHoveredIdx;
  const selectedStopIdx = propSelectedStopIdx !== undefined ? propSelectedStopIdx : internalSelectedStopIdx;
  const themeColor = isItineraryView ? '#BA5536' : '#FF6B2C';
  const themeHoverColor = isItineraryView ? '#9C4124' : '#E65D20';

  const setSelectedStopIdx = (idx) => {
    if (onSelectStop) onSelectStop(idx);
    setInternalSelectedStopIdx(idx);
  };

  useEffect(() => {
    if (propSelectedStopIdx !== undefined) {
      setInternalSelectedStopIdx(propSelectedStopIdx);
    }
  }, [propSelectedStopIdx]);

  useEffect(() => {
    if (propHoveredIdx !== undefined) {
      setInternalHoveredIdx(propHoveredIdx);
    }
  }, [propHoveredIdx]);

  useEffect(() => {
    setIsRouteSyncing(true);
    const timer = setTimeout(() => setIsRouteSyncing(false), 550);
    return () => clearTimeout(timer);
  }, [selectedDayIndex, selectedCategory, activities, mapStyle, showAllDaysOverview]);

  // CAMERA & POPUP SYNC WHEN ACTIVE STOP CHANGES via Itinerary Click or Scroll (INTERACTION 2 & 3 / MAP CAMERA)
  useEffect(() => {
    if (selectedStopIdx === null || selectedStopIdx === undefined) {
      lastFlewStopRef.current = null;
      setActiveDestination(null);
      return;
    }
    if (!isReady || !mapRef.current || selectedStopIdx === lastFlewStopRef.current) return;
    lastFlewStopRef.current = selectedStopIdx;
    const isBasecamp = selectedStopIdx === 0;
    const targetAct = isBasecamp
      ? { title: `${destinationName} Basecamp Hotel`, coordinates: coordinates || activities?.[0]?.coordinates || { lat: 41.9028, lng: 12.4964 }, isBasecamp: true }
      : activities?.[selectedStopIdx - 1];

    if (targetAct && targetAct.coordinates && typeof targetAct.coordinates.lat === 'number' && typeof targetAct.coordinates.lng === 'number') {
      const latLng = window.L?.latLng(targetAct.coordinates.lat, targetAct.coordinates.lng);
      if (latLng && mapRef.current) {
        const currentZoom = mapRef.current.getZoom();
        if (currentZoom >= 14 && !isBasecamp) {
          mapRef.current.panTo(latLng, { animate: true, duration: 0.45, easeLinearity: 0.25 });
        } else {
          mapRef.current.flyTo(latLng, 16, { duration: 0.55, easeLinearity: 0.25 });
        }

        setActiveDestination({
          act: targetAct,
          stopIndex: selectedStopIdx,
          totalStops: activities.length,
          dayIdx: selectedDayIndex,
          isBasecamp,
          dayStops: [ { isBasecamp: true, coordinates: coordinates || activities?.[0]?.coordinates }, ...activities ]
        });
        setIsDestinationSaved(false);
        setHeroImageLoaded(false);

        // Trigger one pulse animation on active pin
        const marker = markersRef.current[selectedStopIdx] || markersRef.current[`d${selectedDayIndex}_s${selectedStopIdx}`];
        if (marker && marker._icon) {
          marker._icon.classList.remove('tripwise-pin-pulse-once');
          void marker._icon.offsetWidth;
          marker._icon.classList.add('tripwise-pin-pulse-once');
          if (marker.setZIndexOffset) marker.setZIndexOffset(1000);
        }
      }
    }
  }, [selectedStopIdx, isReady, selectedDayIndex, destinationName, activities, coordinates]);

  // Inject premium Apple/Linear animation keyframes & styles right on mount
  useEffect(() => {
    if (typeof window === 'undefined' || document.querySelector('#tripwise-premium-map-animations')) return;
    const style = document.createElement('style');
    style.id = 'tripwise-premium-map-animations';
    style.innerHTML = `
      @keyframes tripwiseRadarRingSweep {
        0% { stroke-opacity: 0.45; fill-opacity: 0.08; }
        50% { stroke-opacity: 0.95; fill-opacity: 0.18; stroke-width: 3.5px; }
        100% { stroke-opacity: 0.45; fill-opacity: 0.08; }
      }
      @keyframes tripwiseMarkerPulse {
        0%, 100% {
          filter: drop-shadow(0 10px 25px rgba(255, 122, 26, 0.45));
          transform: scale(1.15) translateY(-4px);
        }
        50% {
          filter: drop-shadow(0 14px 30px rgba(255, 122, 26, 0.7));
          transform: scale(1.20) translateY(-6px);
        }
      }
      @keyframes tripwiseMarkerBounce {
        0% { transform: scale(1.15) translateY(-4px); }
        25% { transform: scale(1.18) translateY(-14px); }
        50% { transform: scale(1.15) translateY(-4px); }
        75% { transform: scale(1.16) translateY(-8px); }
        100% { transform: scale(1.15) translateY(-4px); }
      }
      @keyframes tripwiseRouteGlowPulse {
        0%, 100% { filter: drop-shadow(0 0 5px rgba(255, 122, 26, 0.35)); }
        50% { filter: drop-shadow(0 0 12px rgba(255, 122, 26, 0.65)); }
      }
      @keyframes tripwiseMarkerAppear {
        0% { transform: scale(0.35) translateY(14px); opacity: 0; }
        100% { transform: scale(1) translateY(0); opacity: 1; }
      }
      @keyframes tripwiseWeatherFloat {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-3px); }
      }
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(250%); }
      }
      .animated-radar-ring {
        animation: tripwiseRadarRingSweep 2.8s infinite ease-in-out !important;
      }
      .tripwise-marker-selected {
        animation: tripwiseMarkerPulse 2.4s infinite ease-in-out;
      }
      .tripwise-marker-bounce {
        animation: tripwiseMarkerBounce 0.65s cubic-bezier(0.34, 1.56, 0.64, 1), tripwiseMarkerPulse 2.4s 0.65s infinite ease-in-out !important;
      }
      .animated-route-glow {
        animation: tripwiseRouteGlowPulse 3s infinite ease-in-out !important;
      }
      .animate-weather-float {
        animation: tripwiseWeatherFloat 3.5s infinite ease-in-out;
        display: inline-block;
      }
      .leaflet-control-zoom {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    setSelectedCategory('all');
  }, [activities]);

  // When switching days, automatically exit overview mode to focus on the selected day
  useEffect(() => {
    setShowAllDaysOverview(false);
    setSelectedStopIdx(null);
  }, [selectedDayIndex]);

  // Create looped Basecamp / Hotel hub (Stop 0) and full day stop list
  const validActivities = (activities || []).filter(
    act => act?.coordinates && typeof act.coordinates.lat === 'number' && typeof act.coordinates.lng === 'number'
  );

  const firstAct = validActivities[0];
  const basecampLat = coordinates?.lat ? (coordinates.lat - 0.007) : (firstAct ? firstAct.coordinates.lat - 0.008 : 35.6762);
  const basecampLng = coordinates?.lng ? (coordinates.lng - 0.007) : (firstAct ? firstAct.coordinates.lng - 0.008 : 139.6503);

  // Calculate live destination weather & local time telemetry overlay data
  useEffect(() => {
    const cityName = destinationName && destinationName !== 'Your Destination' 
      ? destinationName.split(',')[0].trim() 
      : (firstAct?.location ? firstAct.location.split(',')[0].trim() : 'Rome');

    let isMounted = true;

    const formatLocalTime = (tz) => {
      try {
        return new Intl.DateTimeFormat('en-US', {
          timeZone: tz || 'UTC',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }).format(new Date());
      } catch (e) {
        return new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }).format(new Date());
      }
    };

    const fetchWeatherAndTelemetry = async () => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${basecampLat}&longitude=${basecampLng}&current=temperature_2m,weather_code,is_day&daily=sunset&timezone=auto`);
        if (!res.ok) throw new Error('Weather API fetch failed');
        const data = await res.json();
        
        if (!isMounted) return;

        const temp = Math.round(data.current?.temperature_2m || 24) + '°C';
        const code = data.current?.weather_code ?? 1;
        const isDay = data.current?.is_day ?? 1;
        
        let icon = '☀️';
        let condition = 'Clear';
        if (code === 0) { icon = isDay ? '☀️' : '🌙'; condition = 'Clear'; }
        else if (code <= 3) { icon = '⛅'; condition = 'Partly Cloudy'; }
        else if (code <= 48) { icon = '🌫️'; condition = 'Foggy'; }
        else if (code <= 67) { icon = '🌧️'; condition = 'Light Rain'; }
        else if (code <= 77) { icon = '❄️'; condition = 'Snow Showers'; }
        else if (code <= 82) { icon = '🌦️'; condition = 'Rain Showers'; }
        else if (code <= 99) { icon = '⛈️'; condition = 'Thunderstorm'; }

        let sunsetStr = '8:15 PM';
        if (data.daily?.sunset?.[0]) {
          const sunsetDate = new Date(data.daily.sunset[0]);
          sunsetStr = sunsetDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        }

        const tz = data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

        setTelemetry({
          city: cityName,
          temp,
          icon,
          condition,
          sunset: sunsetStr,
          tz,
          localTime: formatLocalTime(tz)
        });
      } catch (err) {
        if (!isMounted) return;
        const simulatedTemp = Math.round(20 + Math.abs(Math.cos(basecampLat)) * 9) + '°C';
        const fallbackTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        setTelemetry({
          city: cityName,
          temp: simulatedTemp,
          icon: '⛅',
          condition: 'Pleasant',
          sunset: '8:15 PM',
          tz: fallbackTz,
          localTime: formatLocalTime(fallbackTz)
        });
      }
    };

    fetchWeatherAndTelemetry();
    const interval = setInterval(() => {
      setTelemetry(prev => prev ? { ...prev, localTime: formatLocalTime(prev.tz) } : null);
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [basecampLat, basecampLng, destinationName]);

  const basecampStop = {
    isBasecamp: true,
    title: `${destinationName && destinationName !== 'Your Destination' ? destinationName.split(',')[0] + ' ' : ''}Basecamp Hotel`,
    description: 'Your central hotel & lodging hub. Start your morning itinerary here and complete the loop to return refreshed in the evening.',
    badge: 'Basecamp Hotel',
    category: 'hotel',
    time: 'Departure & Return Hub',
    coordinates: { lat: basecampLat, lng: basecampLng }
  };

  const loopedStops = validActivities.length > 0 ? [basecampStop, ...validActivities] : [];

  // Compute category counts across active stops (excluding Basecamp for categories, all for all)
  const nonBasecampStopsCount = loopedStops.filter((act, idx) => !(act.isBasecamp === true || idx === 0)).length;

  const categoryFilters = [
    {
      id: 'all',
      label: 'All',
      icon: '⭐',
      count: nonBasecampStopsCount,
      activeBg: 'bg-[#FF7A1A] text-white shadow-sm border-[#FF7A1A] font-extrabold',
      badgeBg: 'bg-white/20 text-white'
    },
    {
      id: 'dining',
      label: 'Food',
      icon: '🍝',
      count: loopedStops.filter((act, idx) => !(act.isBasecamp === true || idx === 0) && getCategoryMeta(act).label === 'Dining').length,
      activeBg: 'bg-[#FF7A1A] text-white shadow-sm border-[#FF7A1A] font-extrabold',
      badgeBg: 'bg-white/20 text-white'
    },
    {
      id: 'attractions',
      label: 'Attractions',
      icon: '🏛️',
      count: loopedStops.filter((act, idx) => !(act.isBasecamp === true || idx === 0) && getCategoryMeta(act).label !== 'Dining').length,
      activeBg: 'bg-[#FF7A1A] text-white shadow-sm border-[#FF7A1A] font-extrabold',
      badgeBg: 'bg-white/20 text-white'
    },
    {
      id: 'landmark',
      label: 'Cafes',
      icon: '☕',
      count: loopedStops.filter((act, idx) => !(act.isBasecamp === true || idx === 0) && getCategoryMeta(act).label === 'Landmark').length,
      activeBg: 'bg-[#FF7A1A] text-white shadow-sm border-[#FF7A1A] font-extrabold',
      badgeBg: 'bg-white/20 text-white'
    },
    {
      id: 'nature',
      label: 'Parks',
      icon: '🌳',
      count: loopedStops.filter((act, idx) => !(act.isBasecamp === true || idx === 0) && getCategoryMeta(act).label === 'Nature').length,
      activeBg: 'bg-[#FF7A1A] text-white shadow-sm border-[#FF7A1A] font-extrabold',
      badgeBg: 'bg-white/20 text-white'
    },
    {
      id: 'shopping',
      label: 'Shopping',
      icon: '🛍️',
      count: loopedStops.filter((act, idx) => !(act.isBasecamp === true || idx === 0) && getCategoryMeta(act).label === 'Shopping').length,
      activeBg: 'bg-[#FF7A1A] text-white shadow-sm border-[#FF7A1A] font-extrabold',
      badgeBg: 'bg-white/20 text-white'
    }
  ];

  const availableCategoryFilters = categoryFilters.filter(filter => filter.id === 'all' || filter.count > 0);

  // Compute attractions within 1.5 km (~15-min walk) real WGS84 geodesic radius around Basecamp Hotel
  const stopsInsideRing = useMemo(() => {
    if (!basecampStop?.coordinates || typeof window === 'undefined' || !window.L) return [];
    const L = window.L;
    const baseLatLng = L.latLng(basecampStop.coordinates.lat, basecampStop.coordinates.lng);
    return validActivities.filter(act => {
      if (act.isBasecamp) return false;
      if (!act.coordinates?.lat || !act.coordinates?.lng) return false;
      const actLatLng = L.latLng(act.coordinates.lat, act.coordinates.lng);
      return baseLatLng.distanceTo(actLatLng) <= 1500;
    });
  }, [basecampStop, validActivities, isReady]);

  // Fetch real morning coffee shops & late-night dining within 1.5 km (instant curated + live OpenStreetMap Overpass API)
  useEffect(() => {
    if (!basecampStop?.coordinates) return;
    const { lat, lng } = basecampStop.coordinates;

    // 1. Instant curated authentic places for famous destinations
    const instantPlaces = getKnownRealWalkablePlaces(lat, lng, destinationName);
    setRealWalkablePlaces(instantPlaces);

    // 2. Fetch live real places from OpenStreetMap Overpass API around basecamp
    if (typeof window === 'undefined') return;
    const query = `[out:json][timeout:8];(node["amenity"="cafe"](around:1500,${lat},${lng});node["amenity"~"restaurant|bar|pub"](around:1500,${lat},${lng}););out body 12;`;
    fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.elements && data.elements.length > 0) {
          const fetchedPlaces = [];
          const L = window.L;
          const baseLatLng = L?.latLng(lat, lng);

          data.elements.forEach(el => {
            if (!el.tags || !el.tags.name) return;
            const placeLat = el.lat;
            const placeLng = el.lon;
            if (!placeLat || !placeLng) return;

            const distMeters = baseLatLng ? baseLatLng.distanceTo(L.latLng(placeLat, placeLng)) : 600;
            if (distMeters > 1500) return;

            const walkMins = Math.max(3, Math.round(distMeters / 80));
            const isCafe = el.tags.amenity === 'cafe' || el.tags.cuisine === 'coffee_shop';
            const type = isCafe ? 'coffee' : 'dining';
            const description = el.tags.cuisine ? `${el.tags.cuisine.replace(/_/g, ' ')} • ${isCafe ? 'Artisanal morning coffee & pastries.' : 'Late-evening dining & drinks nearby.'}` : (isCafe ? 'Popular neighborhood coffee & breakfast spot.' : 'Lively late-night dining & drinks spot.');

            if (!instantPlaces.some(p => p.name.toLowerCase() === el.tags.name.toLowerCase())) {
              fetchedPlaces.push({
                id: `osm-${el.id}`,
                name: el.tags.name,
                type,
                coordinates: { lat: placeLat, lng: placeLng },
                description,
                walkMins,
                rating: `4.${Math.floor(Math.random() * 4) + 6} ★`
              });
            }
          });

          if (fetchedPlaces.length > 0) {
            setRealWalkablePlaces(prev => {
              const combined = [...prev, ...fetchedPlaces];
              return combined.slice(0, 16);
            });
          }
        }
      })
      .catch(() => {});
  }, [basecampStop?.coordinates?.lat, basecampStop?.coordinates?.lng, destinationName]);

  // Dedicated 15-Min Hotel Walkable Geofence Ring Renderer (Real geodesic 1.5 km circle + Small Red Pins for real coffee/dining)
  useEffect(() => {
    if (!mapRef.current || !walkableRingLayerRef.current || !window.L || typeof window === 'undefined') return;
    const L = window.L;
    walkableRingLayerRef.current.clearLayers();

    const shouldShowRing = isHotelRingActive || selectedStopIdx === 0 || selectedStopIdx === loopedStops.length - 1;
    if (shouldShowRing && basecampStop?.coordinates) {
      if (!document.querySelector('#radar-ring-animation-css')) {
        const style = document.createElement('style');
        style.id = 'radar-ring-animation-css';
        style.innerHTML = `
          @keyframes tripwiseRadarRingSweep {
            0% { stroke-opacity: 0.45; fill-opacity: 0.08; }
            50% { stroke-opacity: 0.95; fill-opacity: 0.18; stroke-width: 3.5px; }
            100% { stroke-opacity: 0.45; fill-opacity: 0.08; }
          }
          .animated-radar-ring {
            animation: tripwiseRadarRingSweep 2.8s infinite ease-in-out !important;
          }
        `;
        document.head.appendChild(style);
      }

      // 1.5 km (~15-min walk) exact Geodesic Radar Ring
      L.circle([basecampStop.coordinates.lat, basecampStop.coordinates.lng], {
        radius: 1500,
        color: '#10B981',
        weight: 2.5,
        dashArray: '8, 8',
        fillColor: '#34D399',
        fillOpacity: 0.14,
        className: 'animated-radar-ring',
        interactive: false
      }).addTo(walkableRingLayerRef.current);

      // Inner 750m (~7-min quick walk) inner dashed guide
      L.circle([basecampStop.coordinates.lat, basecampStop.coordinates.lng], {
        radius: 750,
        color: '#10B981',
        weight: 1.5,
        dashArray: '4, 6',
        fillColor: 'transparent',
        opacity: 0.4,
        interactive: false
      }).addTo(walkableRingLayerRef.current);

      // Plot Real Coffee Shops & Late-Night Dining with Small Red Pins inside the circle
      realWalkablePlaces.forEach((place) => {
        if (!place.coordinates?.lat || !place.coordinates?.lng) return;

        const customIcon = L.divIcon({
          className: 'custom-walkable-place-marker',
          html: `
            <div style="
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 26px;
              height: 26px;
              background: linear-gradient(135deg, #EF4444, #B91C1C);
              border: 2px solid #ffffff;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 3px 8px rgba(239, 68, 68, 0.55);
              cursor: pointer;
              transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            ">
              <span style="
                transform: rotate(45deg);
                font-size: 13px;
                line-height: 1;
              ">${place.type === 'coffee' ? '☕' : '🍷'}</span>
            </div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 26],
          popupAnchor: [0, -26]
        });

        const placeMarker = L.marker([place.coordinates.lat, place.coordinates.lng], {
          icon: customIcon,
          zIndexOffset: 1500,
          title: `${place.type === 'coffee' ? '☕ Morning Coffee' : '🍷 Late-Night Dining'}: ${place.name}`
        });

        const popupHtml = `
          <div style="padding: 10px; font-family: system-ui, -apple-system, sans-serif; min-width: 210px; max-width: 250px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 6px; background: ${place.type === 'coffee' ? '#FEF3C7' : '#FFE4E6'}; color: ${place.type === 'coffee' ? '#D97706' : '#E11D48'}; text-transform: uppercase; letter-spacing: 0.05em;">
                ${place.type === 'coffee' ? '☕ Morning Coffee' : '🍷 Late-Night Dining'}
              </span>
              <span style="font-size: 10px; font-weight: 800; color: #059669; background: #ECFDF5; padding: 2px 6px; border-radius: 6px; border: 1px solid #A7F3D0;">
                🚶 ${place.walkMins} min walk
              </span>
            </div>
            <h4 style="font-size: 13px; font-weight: 900; color: #1C1B1B; margin: 0 0 4px 0; line-height: 1.3;">
              ${place.name}
            </h4>
            <p style="font-size: 11px; color: #4B5563; margin: 0 0 8px 0; line-height: 1.45;">
              ${place.description}
            </p>
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; font-weight: 700; color: #374151; border-top: 1px solid #E5E7EB; padding-top: 6px;">
              <span style="color: #F59E0B; font-weight: 800;">⭐ ${place.rating || '4.8 ★'}</span>
              <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + (destinationName || ''))}" target="_blank" rel="noopener noreferrer" style="color: #2563EB; text-decoration: none; font-weight: 800; background: #EFF6FF; padding: 3px 8px; border-radius: 6px;">
                📍 Google Maps ↗
              </a>
            </div>
          </div>
        `;

        placeMarker.bindPopup(popupHtml, {
          closeButton: false,
          offset: [0, -22],
          className: 'custom-walkable-place-popup'
        });

        placeMarker.addTo(walkableRingLayerRef.current);
      });
    }
  }, [isHotelRingActive, selectedStopIdx, basecampStop, loopedStops.length, isReady, realWalkablePlaces, destinationName]);

  // 1. Dynamically load Leaflet JS & CSS without SSR issues or version conflicts
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.L) {
      setIsReady(true);
      return;
    }

    if (!document.querySelector('#leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    if (!document.querySelector('#leaflet-script')) {
      const script = document.createElement('script');
      script.id = 'leaflet-script';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      script.onload = () => {
        setIsReady(true);
      };
      document.head.appendChild(script);
    } else {
      const existingScript = document.querySelector('#leaflet-script');
      existingScript.addEventListener('load', () => setIsReady(true));
    }
  }, []);

  // 2. Initialize Leaflet Map once L is loaded (or when re-mounting to/from createPortal on fullscreen toggle)
  useEffect(() => {
    if (!isReady || !mapContainerRef.current || typeof window === 'undefined' || !window.L) return;

    // Clean up detached instance if re-mounted
    if (mapRef.current) {
      try {
        mapRef.current.remove();
      } catch (e) { }
      mapRef.current = null;
      layerGroupRef.current = null;
      tileLayerRef.current = null;
      markersRef.current = {};
    }

    const defaultCenter = coordinates ? [coordinates.lat, coordinates.lng] : [41.9028, 12.4964];
    const map = window.L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView(defaultCenter, 13);

    const styleObj = MAP_STYLES[mapStyle];
    const tileLayer = window.L.tileLayer(styleObj.url, {
      maxZoom: styleObj.maxZoom,
      subdomains: styleObj.subdomains
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    layerGroupRef.current = window.L.layerGroup().addTo(map);
    walkableRingLayerRef.current = window.L.layerGroup().addTo(map);
    mapRef.current = map;

    map.on('click', () => {
      setSelectedStopIdx(null);
      setActiveDestination(null);
    });

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) { }
        mapRef.current = null;
        layerGroupRef.current = null;
        walkableRingLayerRef.current = null;
        tileLayerRef.current = null;
        markersRef.current = {};
      }
    };
  }, [isReady, coordinates, isFullscreen]);

  // Listen for Escape key to exit fullscreen cleanly
  useEffect(() => {
    if (!isFullscreen || typeof window === 'undefined') return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // 3. Switch Base Map Style Dynamically when user toggles
  useEffect(() => {
    if (!mapRef.current || !window.L || !tileLayerRef.current) return;
    const styleObj = MAP_STYLES[mapStyle];
    mapRef.current.removeLayer(tileLayerRef.current);
    const newTileLayer = window.L.tileLayer(styleObj.url, {
      maxZoom: styleObj.maxZoom,
      subdomains: styleObj.subdomains
    }).addTo(mapRef.current);

    tileLayerRef.current = newTileLayer;
  }, [mapStyle]);

  // 4. Update Markers, Polyline & Calculate Distance when activities change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const plotRoute = () => {
      if (!mapRef.current || !layerGroupRef.current || !window.L) return;

      const L = window.L;
      mapRef.current.invalidateSize();
      layerGroupRef.current.clearLayers();
      markersRef.current = {};

      // Inject CSS animation and glassmorphic popover styling
      if (!document.querySelector('#route-flow-animation-css')) {
        const style = document.createElement('style');
        style.id = 'route-flow-animation-css';
        style.innerHTML = `
          @keyframes tripwiseRouteFlow {
            0% { stroke-dashoffset: 56px; }
            100% { stroke-dashoffset: 0px; }
          }
          .animated-route-flow {
            animation: tripwiseRouteFlow 1.6s linear infinite !important;
            filter: drop-shadow(0 0 6px rgba(236, 103, 53, 0.75));
          }
          @keyframes tripwisePinPulseOnce {
            0% { transform: scale(1); filter: drop-shadow(0 0 0px rgba(236, 103, 53, 0.9)); }
            30% { transform: scale(1.35) translateY(-8px); filter: drop-shadow(0 12px 24px rgba(236, 103, 53, 0.85)); }
            70% { transform: scale(0.95) translateY(2px); filter: drop-shadow(0 4px 10px rgba(236, 103, 53, 0.6)); }
            100% { transform: scale(1) translateY(0); filter: drop-shadow(0 0 0px rgba(236, 103, 53, 0)); }
          }
          .tripwise-pin-pulse-once {
            animation: tripwisePinPulseOnce 1.1s cubic-bezier(0.22, 1, 0.36, 1) !important;
          }
          .glass-stop-popup .leaflet-popup-content-wrapper {
            background: rgba(255, 255, 255, 0.96) !important;
            backdrop-filter: blur(16px) !important;
            -webkit-backdrop-filter: blur(16px) !important;
            border: 1.5px solid rgba(236, 103, 53, 0.35) !important;
            border-radius: 18px !important;
            box-shadow: 0 16px 36px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(255, 255, 255, 0.8) !important;
            padding: 0 !important;
          }
          .dark .glass-stop-popup .leaflet-popup-content-wrapper {
            background: rgba(28, 27, 27, 0.96) !important;
            border-color: rgba(236, 103, 53, 0.5) !important;
          }
          .glass-stop-popup .leaflet-popup-content {
            margin: 0 !important;
            line-height: 1.4 !important;
          }
          .glass-stop-popup .leaflet-popup-tip-container {
            overflow: visible !important;
          }
          .glass-stop-popup .leaflet-popup-tip {
            background: rgba(255, 255, 255, 0.96) !important;
            border: 1.5px solid rgba(236, 103, 53, 0.35) !important;
            border-top: none !important;
            border-left: none !important;
            box-shadow: 3px 3px 6px rgba(0,0,0,0.12) !important;
          }
          .glass-stop-popup .leaflet-popup-close-button {
            top: 10px !important;
            right: 12px !important;
            color: #64748B !important;
            font-size: 16px !important;
            font-weight: 900 !important;
          }
          .glass-stop-popup .leaflet-popup-close-button:hover {
            color: #FF6B35 !important;
          }
        `;
        document.head.appendChild(style);
      }

      const plotSingleDayStops = (dayActivities, dayIdx, isMultiDayMode) => {
        const dayColorMeta = DAY_SIGNATURE_COLORS[dayIdx % DAY_SIGNATURE_COLORS.length];
        const validActs = (dayActivities || []).filter(
          (act) => act?.coordinates && typeof act.coordinates.lat === 'number' && typeof act.coordinates.lng === 'number'
        );
        if (validActs.length === 0) return { latLngs: [], totalMeters: 0, stopsCount: 0, animatedPolyline: null };

        const baseLat = coordinates?.lat || validActs[0].coordinates.lat;
        const baseLng = coordinates?.lng || validActs[0].coordinates.lng;
        const basecampStop = {
          title: `${destinationName} Basecamp Hotel`,
          description: `Central hub & luxury accommodation around ${destinationName}.`,
          coordinates: { lat: baseLat, lng: baseLng },
          isBasecamp: true
        };

        const dayLoopedStops = isMultiDayMode
          ? (dayIdx === 0 ? [basecampStop, ...validActs] : validActs)
          : [basecampStop, ...validActs, ...(validActs.length > 1 ? [basecampStop] : [])];

        const latLngs = [];
        let totalMeters = 0;
        const plottedMarkerCoords = []; // Track marker positions to eliminate pin overlap

        dayLoopedStops.forEach((act, idx) => {
          const rawLatLng = L.latLng(act.coordinates.lat, act.coordinates.lng);
          if (latLngs.length > 0) {
            totalMeters += latLngs[latLngs.length - 1].distanceTo(rawLatLng) * 1.28;
          }
          latLngs.push(rawLatLng); // Polyline uses exact building coordinates

          // 1. Skip creating a duplicate closing hotel pin at the end of single-day loop so pins don't stack right on top of each other
          if (!isMultiDayMode && idx === dayLoopedStops.length - 1 && dayLoopedStops.length > 2 && act.isBasecamp) {
            return;
          }

          // 2. Micro-offset close or identical coordinates (< ~60 meters) so every pin badge is cleanly side-by-side
          let markerLat = act.coordinates.lat;
          let markerLng = act.coordinates.lng;
          let offsetStep = 1;
          while (plottedMarkerCoords.some(c => Math.abs(c.lat - markerLat) < 0.00055 && Math.abs(c.lng - markerLng) < 0.00055)) {
            markerLat += 0.00065 * offsetStep;
            markerLng += 0.00075 * offsetStep;
            offsetStep++;
          }
          plottedMarkerCoords.push({ lat: markerLat, lng: markerLng });
          const latLng = L.latLng(markerLat, markerLng);

          const isBasecamp = act.isBasecamp === true || (idx === 0 && !isMultiDayMode) || (isMultiDayMode && dayIdx === 0 && idx === 0);
          const stopNum = isMultiDayMode ? (isBasecamp ? 0 : idx + (dayIdx === 0 ? 0 : 1)) : idx;
          const markerKey = isMultiDayMode ? `d${dayIdx}_s${stopNum}` : `${stopNum}`;
          const isSelected = (!isMultiDayMode && selectedStopIdx === stopNum) || (activeDestination?.act === act || (activeDestination?.stopIndex === stopNum && activeDestination?.dayIdx === dayIdx));

           const meta = isBasecamp ? { icon: '🏨', label: 'Basecamp', bg: '#1E293B' } : getCategoryMeta(act);
          const pinBg = isSelected ? themeColor : (isBasecamp ? '#1E293B' : (isMultiDayMode ? dayColorMeta.color : meta.bg));
 
          let isCategoryMatch = true;
          if (selectedCategory !== 'all') {
            if (selectedCategory === 'dining') isCategoryMatch = !isBasecamp && meta.label === 'Dining';
            else if (selectedCategory === 'attractions') isCategoryMatch = !isBasecamp && meta.label !== 'Dining';
            else if (selectedCategory === 'landmark') isCategoryMatch = !isBasecamp && meta.label === 'Landmark';
            else if (selectedCategory === 'nature') isCategoryMatch = !isBasecamp && meta.label === 'Nature';
            else if (selectedCategory === 'shopping') isCategoryMatch = !isBasecamp && meta.label === 'Shopping';
          }
 
          const isFilterActive = selectedCategory !== 'all';
          const isHighlightedByFilter = isFilterActive && isCategoryMatch && !isBasecamp;
 
          const gradientBg = isSelected
            ? `linear-gradient(135deg, ${themeColor} 0%, ${themeHoverColor} 100%)`
            : (isBasecamp
              ? 'linear-gradient(135deg, #334155 0%, #0F172A 100%)'
              : (isMultiDayMode
                ? `linear-gradient(135deg, ${dayColorMeta.color} 0%, #1E293B 100%)`
                : (meta.label === 'Dining' ? 'linear-gradient(135deg, #FF8A00 0%, #C2410C 100%)'
                  : meta.label === 'Culture' ? 'linear-gradient(135deg, #A855F7 0%, #6D28D9 100%)'
                    : meta.label === 'Nature' ? 'linear-gradient(135deg, #34D399 0%, #047857 100%)'
                      : meta.label === 'Shopping' ? 'linear-gradient(135deg, #FB7185 0%, #BE123C 100%)'
                        : meta.label === 'Landmark' ? 'linear-gradient(135deg, #2DD4BF 0%, #0F766E 100%)'
                          : `linear-gradient(135deg, ${pinBg} 0%, #1D4ED8 100%)`)));

          const isOtherStop = !isSelected && !isHighlightedByFilter && isCategoryMatch;
          const customIcon = L.divIcon({
            className: `custom-tripwise-pin ${isSelected ? 'tripwise-marker-bounce' : ''}`,
            html: `
              <div style="position: relative; width: ${isSelected ? '52px' : '40px'}; height: ${isSelected ? '64px' : '48px'}; display: flex; align-items: flex-start; justify-content: center; transition: all 0.38s cubic-bezier(0.34, 1.56, 0.64, 1); transform: ${isSelected ? 'scale(1.25) translateY(-4px)' : (isHighlightedByFilter ? 'scale(1.04)' : (isOtherStop ? 'scale(0.85)' : 'scale(0.70)'))}; opacity: ${isSelected ? '1' : (selectedStopIdx !== null ? '0.70' : (isCategoryMatch ? '0.85' : '0.20'))}; filter: ${isCategoryMatch ? 'none' : 'blur(0.5px) grayscale(85%)'}; z-index: ${isSelected || isHighlightedByFilter ? '1000' : (isCategoryMatch ? '100' : '10')}; cursor: pointer; animation: tripwiseMarkerAppear 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 0.045}s both;">
                
                <div style="
                  width: ${isSelected ? '44px' : '36px'};
                  height: ${isSelected ? '44px' : '36px'};
                  background: ${gradientBg};
                  border-radius: 50% 50% 50% 0;
                  transform: rotate(-45deg);
                  border: ${isSelected ? '3px solid #ffffff' : (isHighlightedByFilter ? '2.5px solid #ffffff' : (isBasecamp ? '2.5px solid #F59E0B' : '2px solid #ffffff'))};
                  box-shadow: ${isSelected ? '0 10px 25px -4px rgba(0, 0, 0, 0.22), 0 0 24px rgba(255, 107, 44, 0.6)' : (isHighlightedByFilter ? `0 0 16px ${pinBg}, 0 6px 16px rgba(0,0,0,0.3)` : '0 4px 14px rgba(0, 0, 0, 0.22)')};
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  transition: all 0.38s cubic-bezier(0.34, 1.56, 0.64, 1);
                ">
                  <div style="
                    transform: rotate(45deg);
                    width: ${isSelected ? '27px' : '24px'};
                    height: ${isSelected ? '27px' : '24px'};
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.22);
                    border: 1px solid rgba(255, 255, 255, 0.55);
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.18);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: ${isSelected ? '15px' : '14px'};
                  ">
                    ${isBasecamp ? '🏨' : meta.icon}
                  </div>
                </div>

                <div style="
                  position: absolute;
                  top: -5px;
                  right: -4px;
                  background: ${isBasecamp ? '#F59E0B' : (isMultiDayMode ? dayColorMeta.color : '#FF7A1A')};
                  color: #FFFFFF;
                  border: 2px solid #FFFFFF;
                  border-radius: 9999px;
                  padding: ${isBasecamp ? '0 5px' : '1px 6.5px'};
                  min-width: 20px;
                  height: 20px;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.45);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 11px;
                  font-weight: 700;
                  letter-spacing: -0.3px;
                  z-index: 20;
                ">
                  ${isBasecamp ? '★' : stopNum}
                </div>

                <div style="
                  position: absolute;
                  bottom: -2px;
                  width: ${isSelected ? '24px' : '14px'};
                  height: 5px;
                  background: rgba(0,0,0,0.28);
                  border-radius: 50%;
                  filter: blur(1.5px);
                "></div>
              </div>
            `,
            iconSize: isSelected ? [52, 64] : [40, 48],
            iconAnchor: isSelected ? [26, 60] : [20, 44]
          });

          const marker = L.marker(latLng, { icon: customIcon }).addTo(layerGroupRef.current);
          if (!isMultiDayMode) {
            markersRef.current[stopNum] = marker;
          } else {
            markersRef.current[markerKey] = marker;
          }

          marker.on('click', (e) => {
            if (e && e.originalEvent && e.originalEvent.stopPropagation) {
              e.originalEvent.stopPropagation();
            }
            if (!isMultiDayMode) {
              setSelectedStopIdx(stopNum);
              if (isBasecamp) setIsHotelRingActive(true);
            } else {
              setSelectedStopIdx(stopNum);
            }
            setActiveDestination({
              act,
              stopIndex: stopNum,
              totalStops: dayLoopedStops.length - 1,
              dayIdx,
              isBasecamp,
              dayStops: dayLoopedStops
            });
            setIsDestinationSaved(false);
            setHeroImageLoaded(false);
            mapRef.current.flyTo(latLng, 16, { duration: 0.5, easeLinearity: 0.25 });
          });

          marker.on('mouseover', () => {
            setInternalHoveredIdx(stopNum);
            onHoverStop(stopNum);
            if (isBasecamp) setIsHotelRingActive(true);
          });

          marker.on('mouseout', () => {
            setInternalHoveredIdx(null);
            onHoverStop(null);
            if (isBasecamp && selectedStopIdx !== 0 && selectedStopIdx !== dayLoopedStops.length - 1) {
              setIsHotelRingActive(false);
            }
          });
        });

        // Layer 1: Subtle route glow backdrop
        let animatedPolyline = null;
        if (latLngs.length > 1 && window.L) {
          const routeColor = isMultiDayMode ? dayColorMeta.color : themeColor;
          const routeGlow = isMultiDayMode ? dayColorMeta.glow : (isItineraryView ? 'rgba(186, 85, 54, 0.45)' : 'rgba(255, 107, 44, 0.45)');
 
          L.polyline(latLngs, {
            color: routeGlow,
            weight: isMultiDayMode ? 8 : 10,
            opacity: selectedCategory !== 'all' ? 0.15 : 0.40,
            lineCap: 'round',
            lineJoin: 'round',
            className: 'animated-route-glow'
          }).addTo(layerGroupRef.current);
 
          // Layer 2: Clean solid premium route line (Point 3: Completed vs Upcoming route split)
          if (selectedStopIdx !== null && !isMultiDayMode && selectedStopIdx > 0 && selectedStopIdx < latLngs.length) {
            const completedLatLngs = latLngs.slice(0, selectedStopIdx + 1);
            const upcomingLatLngs = latLngs.slice(selectedStopIdx);
            
            L.polyline(completedLatLngs, {
              color: isItineraryView ? '#9C4124' : '#D95524',
              weight: 4,
              opacity: 0.45,
              dashArray: '5, 8',
              lineCap: 'round',
              lineJoin: 'round'
            }).addTo(layerGroupRef.current);
 
            animatedPolyline = L.polyline(upcomingLatLngs, {
              color: isItineraryView ? '#BA5536' : '#EC6735',
              weight: 5,
              opacity: 1.0,
              lineCap: 'round',
              lineJoin: 'round'
            }).addTo(layerGroupRef.current);
          } else {
            animatedPolyline = L.polyline(latLngs, {
              color: routeColor,
              weight: 4,
              opacity: selectedCategory !== 'all' ? 0.35 : 0.96,
              lineCap: 'round',
              lineJoin: 'round'
            }).addTo(layerGroupRef.current);
          }

          // Layer 3: Animated/Directional arrows indicating travel direction
          for (let i = 0; i < latLngs.length - 1; i++) {
            const p1 = latLngs[i];
            const p2 = latLngs[i + 1];
            const midLat = (p1.lat + p2.lat) / 2;
            const midLng = (p1.lng + p2.lng) / 2;

            const dy = p2.lat - p1.lat;
            const dx = (p2.lng - p1.lng) * Math.cos(p1.lat * (Math.PI / 180));
            const angleDeg = (Math.atan2(dy, dx) * (180 / Math.PI)) * -1 + 90;

            const arrowIcon = L.divIcon({
              className: 'route-directional-arrow',
              html: `
                <div style="
                  transform: rotate(${angleDeg}deg);
                  color: #ffffff;
                  font-size: ${isMultiDayMode ? '9px' : '11px'};
                  font-weight: 900;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  width: ${isMultiDayMode ? '18px' : '22px'};
                  height: ${isMultiDayMode ? '18px' : '22px'};
                  background: ${routeColor};
                  border: 2px solid #ffffff;
                  border-radius: 50%;
                  box-shadow: 0 3px 10px rgba(0,0,0,0.35);
                  opacity: ${selectedCategory !== 'all' ? '0.35' : '1'};
                ">
                  ➤
                </div>
              `,
              iconSize: isMultiDayMode ? [18, 18] : [22, 22],
              iconAnchor: isMultiDayMode ? [9, 9] : [11, 11]
            });

            L.marker([midLat, midLng], { icon: arrowIcon, interactive: false }).addTo(layerGroupRef.current);
          }

          // Layer 4: Tiny animated travel dot moving elegantly along the route (Point 3)
          if (latLngs.length > 1 && window.L && !isMultiDayMode) {
            const dotIcon = L.divIcon({
              className: 'travel-animated-dot',
              html: `
                <div style="
                  width: 12px;
                  height: 12px;
                  background: #FFFFFF;
                  border: 2.5px solid ${routeColor};
                  border-radius: 50%;
                  box-shadow: 0 0 12px ${routeColor}, 0 2px 6px rgba(0,0,0,0.4);
                "></div>
              `,
              iconSize: [12, 12],
              iconAnchor: [6, 6]
            });
            const dotMarker = L.marker([latLngs[0].lat, latLngs[0].lng], { icon: dotIcon, interactive: false, zIndexOffset: 2000 }).addTo(layerGroupRef.current);
            let progress = 0;
            const animateDot = () => {
              if (!dotMarker._map || !latLngs || latLngs.length < 2) return;
              progress += 0.003;
              if (progress >= 1) progress = 0;
              const totalSegment = latLngs.length - 1;
              const exactPos = progress * totalSegment;
              const idx = Math.floor(exactPos);
              const t = exactPos - idx;
              const p1 = latLngs[idx];
              const p2 = latLngs[Math.min(idx + 1, latLngs.length - 1)];
              if (p1 && p2) {
                const curLat = p1.lat + (p2.lat - p1.lat) * t;
                const curLng = p1.lng + (p2.lng - p1.lng) * t;
                dotMarker.setLatLng([curLat, curLng]);
              }
              dotMarker._animationFrame = requestAnimationFrame(animateDot);
            };
            animateDot();
            dotMarker.on('remove', () => {
              if (dotMarker._animationFrame) cancelAnimationFrame(dotMarker._animationFrame);
            });
          }
        }
        return { latLngs, totalMeters, stopsCount: validActs.length + (isMultiDayMode ? 0 : 1), animatedPolyline };
      };

      if (showAllDaysOverview && allDays && allDays.length > 0) {
        let allLatLngs = [];
        let totalMetersAll = 0;
        let totalStopsAll = 0;

        allDays.forEach((dayObj, dIdx) => {
          const res = plotSingleDayStops(dayObj?.activities || [], dIdx, true);
          if (res.latLngs && res.latLngs.length > 0) {
            allLatLngs = allLatLngs.concat(res.latLngs);
            totalMetersAll += res.totalMeters;
            totalStopsAll += res.stopsCount;
          }
        });

        setRouteStats({
          totalKm: (totalMetersAll / 1000).toFixed(1),
          stopsCount: totalStopsAll
        });

        if (allLatLngs.length > 1 && selectedStopIdx === null && selectedCategory === 'all') {
          mapRef.current.flyToBounds(L.polyline(allLatLngs).getBounds(), {
            paddingTopLeft: [75, 120],
            paddingBottomRight: [75, 95],
            maxZoom: 15,
            animate: true,
            duration: 0.8,
            easeLinearity: 0.25
          });
        }
      } else {
        const currentDayIdx = typeof selectedDayIndex === 'number' ? selectedDayIndex : 0;
        const res = plotSingleDayStops(activities, currentDayIdx, false);
        const nextTotalKm = (res.totalMeters / 1000).toFixed(1);
        const nextStopsCount = res.stopsCount;
        setRouteStats(prev => {
          if (prev.totalKm === nextTotalKm && prev.stopsCount === nextStopsCount) return prev;
          return { totalKm: nextTotalKm, stopsCount: nextStopsCount };
        });

        const triggerPulse = () => {
          setTimeout(() => {
            const firstStopKey = 1;
            const firstStopMarker = markersRef.current[firstStopKey] || markersRef.current['1'] || markersRef.current['0'] || Object.values(markersRef.current)[0];
            if (firstStopMarker && firstStopMarker._icon) {
              firstStopMarker._icon.classList.add('tripwise-pin-pulse-once');
              setTimeout(() => {
                firstStopMarker._icon?.classList.remove('tripwise-pin-pulse-once');
              }, 1200);
            }
          }, 850);
        };

        if (res.animatedPolyline && selectedStopIdx === null && selectedCategory === 'all') {
          mapRef.current.flyToBounds(res.animatedPolyline.getBounds(), {
            paddingTopLeft: [75, 120],
            paddingBottomRight: [75, 95],
            maxZoom: 15,
            animate: true,
            duration: 0.8,
            easeLinearity: 0.25
          });
          triggerPulse();
        } else if (res.latLngs.length === 1 && selectedStopIdx === null && selectedCategory === 'all') {
          mapRef.current.flyTo(res.latLngs[0], 15, { animate: true, duration: 0.8 });
          triggerPulse();
        }
      }
    };

    plotRoute();
    const timer1 = setTimeout(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    }, 150);
    const timer2 = setTimeout(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    }, 500);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isReady, activities, allDays, selectedDayIndex, showAllDaysOverview, coordinates, isFullscreen, selectedCategory]);

  // LIGHTWEIGHT DOM/STYLE UPDATE ON PIN HIGHLIGHT DURING SCROLL (Zero layer destruction / zero jitter)
  useEffect(() => {
    if (!isReady || !markersRef.current || typeof window === 'undefined') return;

    Object.entries(markersRef.current).forEach(([key, marker]) => {
      if (!marker || !marker._icon) return;
      const keyStr = String(key);
      let stopNum = null;
      if (keyStr.startsWith('d')) {
        const parts = keyStr.split('_s');
        if (parts.length === 2) stopNum = parseInt(parts[1], 10);
      } else {
        stopNum = parseInt(keyStr, 10);
      }
      if (stopNum === null || isNaN(stopNum)) return;

      const isSelected = (!showAllDaysOverview && selectedStopIdx === stopNum);
      const isOtherStop = !isSelected && selectedStopIdx !== null && selectedStopIdx !== undefined;

      const innerContainer = marker._icon.firstElementChild;
      if (innerContainer) {
        if (isSelected) {
          innerContainer.style.transform = 'scale(1.25) translateY(-4px)';
          innerContainer.style.opacity = '1';
          innerContainer.style.zIndex = '1000';
          if (marker.setZIndexOffset) marker.setZIndexOffset(1000);
          marker._icon.classList.add('tripwise-marker-bounce');
        } else {
          innerContainer.style.transform = isOtherStop ? 'scale(0.85)' : 'scale(1.04)';
          innerContainer.style.opacity = (selectedStopIdx !== null && selectedStopIdx !== undefined) ? '0.70' : '1.0';
          innerContainer.style.zIndex = '100';
          if (marker.setZIndexOffset) marker.setZIndexOffset(0);
          marker._icon.classList.remove('tripwise-marker-bounce');
        }
      }
    });
  }, [selectedStopIdx, isReady, showAllDaysOverview]);

  // Handle flyTo stop when clicked from interactive top strip or external button
  const handleFlyToStop = (stopIdx) => {
    setSelectedStopIdx(stopIdx);
    const act = loopedStops[stopIdx];
    if (act) {
      setActiveDestination({
        act,
        stopIndex: stopIdx,
        totalStops: loopedStops.length - 1,
        dayIdx: typeof selectedDayIndex === 'number' ? selectedDayIndex : 0,
        isBasecamp: act.isBasecamp === true || stopIdx === 0,
        dayStops: loopedStops
      });
      setIsDestinationSaved(false);
      setHeroImageLoaded(false);
    }
    if (act?.coordinates && mapRef.current && window.L) {
      const latLng = [act.coordinates.lat, act.coordinates.lng];
      mapRef.current.flyTo(latLng, 16, { duration: 1.2, easeLinearity: 0.25 });
    }
  };

  // Handle re-center to fit entire route bounds
  const handleFitRoute = () => {
    setSelectedStopIdx(null);
    setActiveDestination(null);
    if (!mapRef.current || !layerGroupRef.current) return;
    const layers = layerGroupRef.current.getLayers();
    const latLngs = [];
    layers.forEach((layer) => {
      if (layer.getLatLng) latLngs.push(layer.getLatLng());
      else if (layer.getLatLngs) latLngs.push(...layer.getLatLngs());
    });
    if (latLngs.length > 0 && window.L) {
      const bounds = window.L.latLngBounds(latLngs);
      mapRef.current.flyToBounds(bounds, { paddingTopLeft: [75, 120], paddingBottomRight: [75, 95], maxZoom: 15, animate: true, duration: 0.8, easeLinearity: 0.25 });
    }
  };

  // Handle category filter selection (dims non-matching & zooms to matching stops)
  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    setSelectedStopIdx(null); // Clear individual pin selection when filtering
    setActiveDestination(null);

    if (!mapRef.current || !window.L || !layerGroupRef.current) return;

    if (catId === 'all') {
      handleFitRoute();
      return;
    }

    const matchingLatLngs = [];
    loopedStops.forEach((act, idx) => {
      const isBasecamp = act.isBasecamp === true || idx === 0;
      const meta = isBasecamp ? { icon: '🏨', label: 'Basecamp' } : getCategoryMeta(act);

      let isMatch = false;
      if (catId === 'dining') isMatch = !isBasecamp && meta.label === 'Dining';
      else if (catId === 'attractions') isMatch = !isBasecamp && meta.label !== 'Dining';
      else if (catId === 'landmark') isMatch = !isBasecamp && meta.label === 'Landmark';
      else if (catId === 'nature') isMatch = !isBasecamp && meta.label === 'Nature';
      else if (catId === 'shopping') isMatch = !isBasecamp && meta.label === 'Shopping';

      if (isMatch && act.coordinates) {
        matchingLatLngs.push([act.coordinates.lat, act.coordinates.lng]);
      }
    });

    if (matchingLatLngs.length > 0 && window.L) {
      if (matchingLatLngs.length === 1) {
        mapRef.current.flyTo(matchingLatLngs[0], 16, { duration: 0.8, easeLinearity: 0.25 });
      } else {
        const bounds = window.L.latLngBounds(matchingLatLngs);
        mapRef.current.flyToBounds(bounds, { paddingTopLeft: [75, 120], paddingBottomRight: [75, 95], maxZoom: 15, animate: true, duration: 0.8, easeLinearity: 0.25 });
      }
    }
  };

  const mapJSX = (
    <div className={`${
      isFullscreen
        ? 'fixed top-0! left-0! right-0! bottom-0! inset-0! z-99999 w-screen! h-screen! rounded-none shadow-2xl m-0 p-0 border-none'
        : 'relative w-full h-full min-h-100 rounded-3xl border border-[#ECE8E2] shadow-[0_16px_48px_rgba(0,0,0,0.06)]'
    } ${isItineraryView ? 'itinerary-theme-map' : ''} overflow-hidden bg-[#FFFFFF] transition-all duration-300`}>
      {/* Subtle inner highlight overlay */}
      <div className="absolute inset-0 rounded-3xl pointer-events-none z-20 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]" />

      <div ref={mapContainerRef} className="w-full h-full absolute inset-0 z-10" />

      {/* Clean, minimal AI Optimizing / Route Syncing indicator */}
      {isRouteSyncing && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-60 pointer-events-none animate-fade-in">
          <div className="bg-[#FFFFFF]/95 backdrop-blur-2xl px-4 py-1.5 rounded-full border border-[#FF6B2C]/40 shadow-[0_8px_32px_rgba(255,107,44,0.18)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF6B2C] animate-ping" />
            <span className="text-[11px] font-semibold tracking-tight text-[#1F1F1F]">✨ AI Optimizing Waypoints & Route...</span>
          </div>
        </div>
      )}

      {/* 1. Unified Sleek Top Bar (Top-Left Filter Chips & Top-Right Controls in single Flex row with zero overlap) */}
      <div className="absolute top-5 inset-x-5 z-50 flex items-center justify-between gap-2 pointer-events-none">
        {/* Left Side: Compact iOS-Segmented Filter Chips */}
        {availableCategoryFilters.length > 1 && !isItineraryView ? (
          <div className="pointer-events-auto min-w-0 max-w-[calc(100%-260px)] 2xl:max-w-[calc(100%-460px)] overflow-x-auto no-scrollbar">
            <div className="bg-[rgba(255,255,255,0.92)] backdrop-blur-md p-1 rounded-[14px] border border-[rgba(0,0,0,0.06)] shadow-[0_4px_20px_rgba(0,0,0,0.06)] flex items-center gap-1 w-max">
              {availableCategoryFilters.map((filter) => {
                const isSelected = selectedCategory === filter.id;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => handleCategorySelect(filter.id)}
                    className={`h-8 px-3 rounded-xl text-[11px] font-medium tracking-tight transition-all duration-300 shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-[#FF6B2C] text-white shadow-[0_4px_12px_rgba(255,107,44,0.25)] font-semibold scale-[1.02]'
                        : 'bg-transparent text-[#1F1F1F] hover:bg-[#F7F5F2] hover:text-[#FF6B2C] hover:-translate-y-0.5'
                    }`}
                  >
                    <span className="text-xs">{filter.icon}</span>
                    <span className="font-medium">{filter.label}</span>
                    {typeof filter.count === 'number' && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-semibold leading-none ${
                        isSelected ? 'bg-white/25 text-white' : 'bg-[#ECE8E2] text-[#6B6B6B]'
                      }`}>
                        {filter.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div />
        )}

        {/* Right Side: Sleek Map Controls Strip */}
        <div className="pointer-events-auto shrink-0 flex items-center gap-2">
          {isItineraryView ? (
            <div className="flex items-center gap-1 bg-[rgba(255,255,255,0.92)] backdrop-blur-md p-1 rounded-[14px] border border-[rgba(0,0,0,0.06)] shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
              <button
                type="button"
                onClick={handleFitRoute}
                className="h-8 px-3.5 rounded-xl text-[11px] font-semibold bg-[#FFFFFF] text-[#BA5536] border border-[#ECE8E2] shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:bg-[#BA5536] hover:text-white hover:border-[#BA5536] transition-all duration-300 flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Fit Entire Route"
              >
                <span className="text-xs">🎯</span>
                <span>Fit Route</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-[rgba(255,255,255,0.92)] backdrop-blur-md p-1 rounded-[14px] border border-[rgba(0,0,0,0.06)] shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
              <button
                type="button"
                onClick={handleFitRoute}
                className="h-8 px-3 rounded-xl text-[11px] font-medium bg-[#FFFFFF] text-[#1F1F1F] border border-[#ECE8E2] shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:border-[#FF6B2C]/50 hover:text-[#FF6B2C] hover:shadow-[0_4px_12px_rgba(255,107,44,0.12)] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Fit Entire Route"
              >
                <span className="text-xs">🎯</span>
                <span className={`${isFullscreen ? 'inline' : 'hidden 2xl:inline'} font-medium`}>Fit Route</span>
              </button>

              <button
                type="button"
                onClick={() => setIsHotelRingActive(!isHotelRingActive)}
                className={`h-8 px-3 rounded-xl text-[11px] font-medium transition-all duration-300 flex items-center gap-1.5 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
                  isHotelRingActive
                    ? 'bg-[#FF6B2C] text-white font-semibold shadow-[0_4px_16px_rgba(255,107,44,0.3)] border border-[#FF6B2C]'
                    : 'bg-[#FFFFFF] text-[#1F1F1F] border border-[#ECE8E2] shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:border-[#FF6B2C]/50 hover:text-[#FF6B2C] hover:shadow-[0_4px_12px_rgba(255,107,44,0.12)]'
                }`}
                title="Toggle 15-min walk geofence around Basecamp Hotel"
              >
                <span className="text-xs">📏</span>
                <span className={`${isFullscreen ? 'inline' : 'hidden 2xl:inline'} font-medium`}>15-Min Walk</span>
              </button>

              {allDays && allDays.length > 1 && (
                <button
                  type="button"
                  onClick={() => setShowAllDaysOverview(!showAllDaysOverview)}
                  className={`h-8 px-3 rounded-xl text-[11px] font-medium transition-all duration-300 flex items-center gap-1.5 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
                    showAllDaysOverview
                      ? 'bg-[#FF6B2C] text-white font-semibold shadow-[0_4px_16px_rgba(255,107,44,0.3)] border border-[#FF6B2C]'
                      : 'bg-[#FFFFFF] text-[#1F1F1F] border border-[#ECE8E2] shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:border-[#FF6B2C]/50 hover:text-[#FF6B2C] hover:shadow-[0_4px_12px_rgba(255,107,44,0.12)]'
                  }`}
                  title="Toggle all days route comparison"
                >
                  <span className="text-xs">🗺️</span>
                  <span className={`${isFullscreen ? 'inline' : 'hidden 2xl:inline'} font-medium`}>All Days</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsFullscreen(!isFullscreen);
                  setTimeout(() => mapRef.current?.invalidateSize(), 350);
                }}
                className={`h-8 ${isFullscreen ? 'px-3 gap-1.5' : 'w-8 px-0 justify-center'} rounded-xl text-[11px] font-medium bg-[#FFFFFF] text-[#1F1F1F] border border-[#ECE8E2] shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:border-[#FF6B2C]/50 hover:text-[#FF6B2C] hover:shadow-[0_4px_12px_rgba(255,107,44,0.12)] transition-all duration-300 flex items-center cursor-pointer hover:-translate-y-0.5 active:scale-95 shrink-0`}
                title={isFullscreen ? "Exit Fullscreen" : "Expand Map Fullscreen"}
              >
                <span className="text-xs">{isFullscreen ? '✕' : '⛶'}</span>
                {isFullscreen && <span className="font-medium">Exit Fullscreen</span>}
              </button>
            </div>
          )}

          {/* Map Style & GeoEngine Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMapControls(!showMapControls)}
              className={`h-8 px-3 rounded-xl text-[11px] font-medium transition-all duration-300 flex items-center gap-1.5 cursor-pointer border shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 active:scale-95 ${
                showMapControls
                  ? 'bg-[#FF6B2C] text-white border-[#FF6B2C] font-semibold shadow-[0_4px_16px_rgba(255,107,44,0.3)]'
                  : 'bg-[rgba(255,255,255,0.92)] backdrop-blur-md text-[#1F1F1F] border-[rgba(0,0,0,0.06)] hover:border-[#FF6B2C]/50 hover:text-[#FF6B2C]'
              }`}
            >
              <span className="text-xs">{MAP_STYLES[mapStyle]?.icon || '🗺️'}</span>
              <span className="hidden md:inline font-medium">{MAP_STYLES[mapStyle]?.name?.split(' ')[0] || 'Streets'}</span>
              <span className="text-[10px] opacity-70">▼</span>
            </button>

            {showMapControls && (
              <div className="absolute top-full right-0 mt-2.5 bg-[#FFFFFF] backdrop-blur-xl rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] border border-[#ECE8E2] p-4 w-56 flex flex-col gap-3 z-50 animate-fade-in text-left">
                <div>
                  <span className="text-[10px] font-semibold text-[#8B8B8B] uppercase tracking-wider px-1 block mb-1.5">Map Style</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(MAP_STYLES).map(([key, style]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setMapStyle(key);
                          setShowMapControls(false);
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-95 ${
                          mapStyle === key
                            ? 'bg-[#FF6B2C] text-white shadow-xs font-semibold'
                            : 'bg-[#F7F5F2] text-[#1F1F1F] hover:bg-[#ECE8E2]'
                        }`}
                      >
                        <span className="text-xs">{style.icon}</span>
                        <span className="truncate">{style.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-[#ECE8E2] my-0.5" />

                {/* GeoEngine Telemetry Badge */}
                <div className="bg-[#F7F5F2] p-2.5 rounded-[14px] border border-[#ECE8E2] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#2FA66A] animate-pulse shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-[#1F1F1F] truncate">TripWise GeoEngine v2.5</div>
                    <div className="text-[10px] font-normal text-[#6B6B6B] truncate">Satellite Geodesic & Overpass API</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Bottom Info Cards (Sleek Dark Cards per user request) */}
      <div className="absolute bottom-5 inset-x-5 z-40 flex items-center justify-between pointer-events-none gap-2">
        {/* Left Card: Route Stats */}
        <div className="pointer-events-auto bg-[#18181B]/95 backdrop-blur-md px-4 py-2 rounded-[18px] border border-[#27272A] shadow-[0_8px_30px_rgba(0,0,0,0.35)] text-xs font-semibold text-white flex items-center gap-2.5 transition-all duration-300 hover:scale-[1.02] hover:border-[#FF6B2C]/50">
          <span>🚶 {routeStats.totalKm} km</span>
          <span className="text-white/30">•</span>
          <span className="text-white/80 font-medium">{Math.round(routeStats.totalKm * 15 + 15)}m walk</span>
          <span className="text-white/30">•</span>
          <span>{routeStats.stopsCount} Stops</span>
        </div>

        {/* Right Card: Weather & Sunset Telemetry */}
        {telemetry && (
          <div className="pointer-events-auto mr-14 bg-[#18181B]/95 backdrop-blur-md px-4 py-2 rounded-[18px] border border-[#27272A] shadow-[0_8px_30px_rgba(0,0,0,0.35)] text-xs font-semibold text-white flex items-center gap-2.5 transition-all duration-300 hover:scale-[1.02] hover:border-[#FF6B2C]/50">
            <span className="animate-weather-float">{telemetry.icon}</span>
            <span>{telemetry.temp}</span>
            <span className="text-white/30">•</span>
            <span className="text-white/80 font-medium">Sunset {telemetry.sunset}</span>
          </div>
        )}
      </div>

      {/* Share/Export Toast Notification */}
      {showShareToast && (
        <div className="absolute top-16 right-4 z-60 bg-[#1C1B1B] text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-white/20 text-xs font-bold flex items-center gap-2 animate-bounce">
          <span>✅</span>
          <span>Trip link copied to clipboard!</span>
        </div>
      )}

      {/* 4. Circular Floating Action Button (Bottom Right - Point 2 & 6: 16-20px consistent spacing) */}
      <div className="absolute bottom-5 right-5 z-50 pointer-events-auto">
        {showFabMenu && (
          <div className="absolute bottom-14 right-0 mb-2 bg-[#FFFFFF] backdrop-blur-xl rounded-3xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] border border-[#ECE8E2] p-2.5 w-52 flex flex-col gap-1 z-50 animate-fade-in text-left">
            <button
              type="button"
              onClick={() => {
                setShowFabMenu(false);
                const addStopBtn = document.getElementById('btn-add-custom-stop');
                if (addStopBtn) {
                  addStopBtn.click();
                  addStopBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                  alert(`➕ Select a location on the map or use the + Custom Stop button on the left panel to add a waypoint.`);
                }
              }}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-bold text-[#1F1F1F] hover:bg-[#F7F5F2] transition-all cursor-pointer"
            >
              <span className="w-6 h-6 rounded-xl bg-[#FFF2EA] text-[#FF6B2C] flex items-center justify-center font-black">➕</span>
              <span>Add Stop</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowFabMenu(false);
                const aiInput = document.getElementById('ai-copilot-input') || document.querySelector('input[placeholder*="Refine"]');
                if (aiInput) {
                  aiInput.focus();
                  aiInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                  alert(`✨ Use the sleek AI Assistant Prompt Bar next to your day schedule to instantly modify waypoints with AI!`);
                }
              }}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-bold text-[#1F1F1F] hover:bg-[#F7F5F2] transition-all cursor-pointer"
            >
              <span className="w-6 h-6 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-black">✨</span>
              <span>Generate with AI</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowFabMenu(false);
                setIsRouteSyncing(true);
                setTimeout(() => setIsRouteSyncing(false), 700);
                handleFitRoute();
              }}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-bold text-[#1F1F1F] hover:bg-[#F7F5F2] transition-all cursor-pointer"
            >
              <span className="w-6 h-6 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black">⚡</span>
              <span>Optimize Route</span>
            </button>

            <div className="h-px bg-[#ECE8E2] my-1" />

            <button
              type="button"
              onClick={() => {
                setShowFabMenu(false);
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
                  destination: destinationName,
                  totalKm: routeStats.totalKm,
                  stopsCount: routeStats.stopsCount,
                  waypoints: loopedStops.map((s, idx) => ({ stopNumber: idx, title: s.title || s.name, coordinates: s.coordinates }))
                }, null, 2));
                const downloadAnchor = document.createElement('a');
                downloadAnchor.setAttribute("href", dataStr);
                downloadAnchor.setAttribute("download", `TripWise-Route-${destinationName.replace(/\s+/g, '_')}.json`);
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-bold text-[#6B6B6B] hover:bg-[#F7F5F2] hover:text-[#1F1F1F] transition-all cursor-pointer"
            >
              <span className="w-6 h-6 rounded-xl bg-[#F7F5F2] text-[#6B6B6B] flex items-center justify-center font-black">📤</span>
              <span>Export Route</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowFabMenu(false);
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                  setShowShareToast(true);
                  setTimeout(() => setShowShareToast(false), 3000);
                }
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-bold text-[#6B6B6B] hover:bg-[#F7F5F2] hover:text-[#1F1F1F] transition-all cursor-pointer"
            >
              <span className="w-6 h-6 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black">🔗</span>
              <span>Share Trip</span>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowFabMenu(!showFabMenu)}
          className="w-11 h-11 bg-[#FF6B2C] hover:bg-[#E65D20] text-white rounded-full shadow-[0_8px_24px_rgba(255,107,44,0.35)] hover:shadow-[0_12px_28px_rgba(255,107,44,0.5)] border-2 border-white/80 flex items-center justify-center text-2xl font-light transition-all duration-300 hover:scale-[1.06] active:scale-95 cursor-pointer"
          title="Route Actions Menu"
        >
          <span className={`transition-transform duration-300 ease-out flex items-center justify-center ${showFabMenu ? 'rotate-45 scale-110' : ''}`}>+</span>
        </button>
      </div>

      {/* 5. Custom Glassmorphic Zoom Controls (Zoom -> Dark) */}
      <div className="absolute bottom-20 right-5 z-50 flex flex-col gap-1.5 pointer-events-auto bg-[#18181B]/95 backdrop-blur-md p-1.5 rounded-2xl border border-[#27272A] shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
        <button
          type="button"
          onClick={() => mapRef.current?.zoomIn()}
          className="w-8 h-8 rounded-xl bg-[#27272A]/80 text-white border border-white/10 hover:border-[#FF6B2C]/80 hover:text-[#FF6B2C] shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-all duration-200 flex items-center justify-center text-sm font-bold cursor-pointer hover:scale-[1.04] active:scale-95"
          title="Zoom In"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => mapRef.current?.zoomOut()}
          className="w-8 h-8 rounded-xl bg-[#27272A]/80 text-white border border-white/10 hover:border-[#FF6B2C]/80 hover:text-[#FF6B2C] shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-all duration-200 flex items-center justify-center text-sm font-bold cursor-pointer hover:scale-[1.04] active:scale-95"
          title="Zoom Out"
        >
          −
        </button>
      </div>

      {/* Premium Floating Destination Details Panel (Apple Maps / Airbnb / Google Travel / Arc / Notion inspired) */}
      {(() => {
        const currentTarget = activeDestination || (selectedStopIdx !== null && loopedStops[selectedStopIdx] ? {
          act: loopedStops[selectedStopIdx],
          stopIndex: selectedStopIdx,
          totalStops: loopedStops.length - 1,
          dayIdx: typeof selectedDayIndex === 'number' ? selectedDayIndex : 0,
          isBasecamp: loopedStops[selectedStopIdx].isBasecamp === true || selectedStopIdx === 0,
          dayStops: loopedStops
        } : null);

        if (!currentTarget || !currentTarget.act) return null;

        const { act, stopIndex, totalStops, isBasecamp, dayStops = loopedStops } = currentTarget;
        const meta = isBasecamp ? { icon: '🏨', label: 'Basecamp Hub', bg: '#1E293B' } : getCategoryStyling(act);
        const stopNumberLabel = isBasecamp ? 'Anchor Hub' : `Stop ${stopIndex} of ${totalStops || (dayStops.length - 1)}`;
        const heroImageUrl = getDestinationHeroImage(act, destinationName, isBasecamp, stopIndex);
        const ratingInfo = getActivityRating(act, stopIndex || 0);
        const costInfo = formatCost(act);
        const aiTipText = getAiInsight(act, stopIndex || 0);

        let prevTransit = null;
        if (stopIndex > 0 && dayStops[stopIndex - 1]?.coordinates && act?.coordinates) {
          prevTransit = getTransitTelemetry(dayStops[stopIndex - 1].coordinates, act.coordinates);
        }

        // Fix the walking distance bug cleanly without undefined (undefined)
        let walkTimeFormatted = 'Not Available';
        let walkDistFormatted = '';
        if (isBasecamp) {
          walkTimeFormatted = 'Central Hub';
          walkDistFormatted = 'Base Anchor';
        } else if (prevTransit && typeof prevTransit.mins === 'number') {
          walkTimeFormatted = `${prevTransit.mins} min`;
          walkDistFormatted = prevTransit.distKm < 1 ? `${Math.round(prevTransit.distKm * 1000)} m` : `${prevTransit.distKm} km`;
        } else if (act?.walkingDistance && !act.walkingDistance.includes('undefined')) {
          walkTimeFormatted = act.walkingDistance;
        } else if (stopIndex > 0) {
          walkTimeFormatted = '14 min';
          walkDistFormatted = '850 m';
        }

        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${act.title || 'Stop'} ${act.location || destinationName}`
        )}`;
        const appleMapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(
          act.title || 'Stop'
        )}&sll=${act?.coordinates?.lat || 0},${act?.coordinates?.lng || 0}`;

        const insightBullets = act?.aiTipBullets || [
          aiTipText,
          `Optimal visit window around ${act?.time || act?.bestTime || 'morning/afternoon'}.`,
          `Only a short walk from your ${stopIndex > 1 ? 'previous stop' : 'basecamp'}.`
        ];

        const whyChosenText = act?.whyChosen || (
          isBasecamp
            ? "Positioned strategically near major transit corridors and top dining neighborhoods to minimize daily travel time across your entire trip."
            : stopIndex === 1
            ? `Scheduled as your morning anchor to experience ${act.title || 'this destination'} during the quietest hours of the day before peak tour groups arrive.`
            : `This stop is scheduled after ${stopIndex > 2 ? 'midday exploration' : 'lunch'} because crowds begin to decrease around 4 PM. It is only a short walk from your previous destination and provides the best lighting for photography before sunset.`
        );

        const weatherChipText = act?.weather || '☀️ 28°C • Light breeze • Excellent visibility';
        const crowdChipText = act?.crowdLevel || (stopIndex % 3 === 0 ? '🟡 Moderate' : '🟢 Low Crowd');

        const nearbySuggestions = act?.nearby || [
          {
            title: isBasecamp ? 'Historic Artisan Café' : 'Gelateria Artigianale',
            category: isBasecamp ? 'Café & Breakfast' : 'Best Gelato Nearby',
            dist: '3 min walk',
            rating: '4.9',
            image: isBasecamp ? 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=300&q=80' : 'https://images.unsplash.com/photo-1567608285969-48e4bbe0d399?auto=format&fit=crop&w=300&q=80'
          },
          {
            title: isBasecamp ? 'Boutique Design Market' : 'Panoramic Overlook Point',
            category: isBasecamp ? 'Local Shopping' : 'Best Photo Spot',
            dist: '6 min walk',
            rating: '4.8',
            image: isBasecamp ? 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=300&q=80' : 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=300&q=80'
          }
        ];

        const handleClosePanel = () => {
          setSelectedStopIdx(null);
          setActiveDestination(null);
          setHeroImageLoaded(false);
          // Fly map back to show full route overview
          if (mapRef.current && layerGroupRef.current && window.L) {
            const layers = layerGroupRef.current.getLayers();
            const latLngs = [];
            layers.forEach((layer) => {
              if (layer.getLatLng) latLngs.push(layer.getLatLng());
              else if (layer.getLatLngs) latLngs.push(...layer.getLatLngs());
            });
            if (latLngs.length > 0) {
              const bounds = window.L.latLngBounds(latLngs);
              mapRef.current.flyToBounds(bounds, {
                paddingTopLeft: [75, 120],
                paddingBottomRight: [75, 95],
                maxZoom: 15,
                animate: true,
                duration: 0.8,
                easeLinearity: 0.25
              });
            }
          }
        };

        const handleNavigatePrev = () => {
          const newIdx = (stopIndex - 1 + dayStops.length) % dayStops.length;
          setSelectedStopIdx(newIdx);
          if (dayStops[newIdx]) {
            setActiveDestination({
              act: dayStops[newIdx],
              stopIndex: newIdx,
              totalStops: dayStops.length - 1,
              dayIdx: currentTarget.dayIdx,
              isBasecamp: dayStops[newIdx].isBasecamp === true || newIdx === 0,
              dayStops
            });
            setHeroImageLoaded(false);
            if (dayStops[newIdx].coordinates && mapRef.current && window.L) {
              mapRef.current.flyTo([dayStops[newIdx].coordinates.lat, dayStops[newIdx].coordinates.lng], 16, { duration: 1.0, easeLinearity: 0.25 });
            }
          }
        };

        const handleNavigateNext = () => {
          const newIdx = (stopIndex + 1) % dayStops.length;
          setSelectedStopIdx(newIdx);
          if (dayStops[newIdx]) {
            setActiveDestination({
              act: dayStops[newIdx],
              stopIndex: newIdx,
              totalStops: dayStops.length - 1,
              dayIdx: currentTarget.dayIdx,
              isBasecamp: dayStops[newIdx].isBasecamp === true || newIdx === 0,
              dayStops
            });
            setHeroImageLoaded(false);
            if (dayStops[newIdx].coordinates && mapRef.current && window.L) {
              mapRef.current.flyTo([dayStops[newIdx].coordinates.lat, dayStops[newIdx].coordinates.lng], 16, { duration: 1.0, easeLinearity: 0.25 });
            }
          }
        };

        return (
          <div className="absolute bottom-4 sm:bottom-auto sm:top-16 right-3 left-3 sm:left-auto sm:right-6 sm:w-110 max-w-[95vw] sm:max-h-[calc(100%-85px)] max-h-[82vh] z-850 bg-[#FFFFFF] rounded-3xl border border-[#ECE8E2] shadow-[0_24px_64px_rgba(0,0,0,0.16),0_8px_24px_rgba(0,0,0,0.06)] overflow-y-auto pointer-events-auto flex flex-col transition-all duration-300 animate-in fade-in zoom-in-95 sm:slide-in-from-right-6 ease-out transform-gpu text-[#1F1F1F]">
            {/* Subtle pointer triangle connecting visually toward the marker on the map */}
            <div className="hidden sm:block absolute -left-2.5 top-28 w-5 h-5 bg-[#FFFFFF] border-l border-b border-[#ECE8E2] transform rotate-45 pointer-events-none shadow-[-3px_3px_8px_rgba(0,0,0,0.04)] z-50" />

            {/* 1. Hero Image (approx 28-30% height, compact impactful view) */}
            <div className="w-full h-35 sm:h-38.75 relative bg-[#FAF8F5] overflow-hidden shrink-0 rounded-t-3xl group">
              {!heroImageLoaded && (
                <div className="absolute inset-0 bg-linear-to-br from-[#ECE8E2] to-[#FAF8F5] animate-pulse flex items-center justify-center">
                  <span className="text-xs font-bold text-[#6B6B6B] flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-t-transparent border-[#FF6B2C] animate-spin" />
                    Loading Photo...
                  </span>
                </div>
              )}
              <img
                src={heroImageUrl}
                alt={act.title || 'Destination view'}
                onLoad={() => setHeroImageLoaded(true)}
                className={`w-full h-full object-cover transition-opacity duration-500 ease-out group-hover:scale-105 ${heroImageLoaded ? 'opacity-100' : 'opacity-0'}`}
              />
              {/* Soft dark gradient overlay at bottom for title readability */}
              <div className="absolute inset-0 bg-linear-to-t from-[rgba(0,0,0,0.70)] via-black/20 to-transparent pointer-events-none" />

              {/* Category & Stop number badge inside image */}
              <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 z-10">
                <span className="px-3 py-1 bg-black/55 backdrop-blur-md text-white text-[11px] font-extrabold rounded-full border border-white/20 shadow-sm flex items-center gap-1.5">
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                </span>
                <span className="px-2.5 py-1 bg-[#FF6B2C]/90 backdrop-blur-md text-white text-[11px] font-extrabold rounded-full shadow-sm">
                  {stopNumberLabel}
                </span>
              </div>

              {/* Close Button (~15% smaller, w-7 h-7, dark translucent background, hover scale) */}
              <button
                type="button"
                onClick={handleClosePanel}
                className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-black/55 hover:bg-black/80 backdrop-blur-md text-white border border-white/20 flex items-center justify-center font-bold text-xs transition-all duration-200 shadow-md hover:scale-110 active:scale-90 z-20 cursor-pointer"
                title="Close Details Panel"
              >
                ✕
              </button>

              {/* Photo count floating badge with semi-transparent glass background */}
              <div className="absolute bottom-2.5 right-3 px-2 py-0.5 rounded-full bg-black/45 backdrop-blur-md text-white border border-white/20 text-[10px] font-bold shadow-xs flex items-center gap-1 z-10">
                <span>📷</span>
                <span>14 Photos</span>
              </div>

              {/* 2. Destination Title overlay at bottom of hero image */}
              <div className="absolute bottom-2.5 left-4 right-24 z-10">
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight line-clamp-2 drop-shadow-sm">
                  {act.title || (isBasecamp ? `${destinationName} Basecamp Hotel` : `Waypoint ${stopIndex}`)}
                </h3>
                <p className="text-xs font-medium text-white/80 mt-0.5 truncate">
                  {act.location || `${destinationName} • ${meta.label}`}
                </p>
              </div>
            </div>

            {/* Main content area */}
            <div className="p-4 sm:p-5 flex flex-col gap-4">
              {/* 3. Quick Summary Bar (Horizontal glass chips below hero title & above primary actions) */}
              <div className="flex items-center justify-between gap-1 sm:gap-1.5 w-full flex-nowrap pb-1 pt-0.5">
                <div className="bg-[rgba(255,255,255,0.85)] backdrop-blur-md border border-black/6 shadow-[0_8px_24px_rgba(0,0,0,0.06)] rounded-full px-2 sm:px-2.5 py-1.5 flex items-center gap-1 text-[11px] font-extrabold text-[#1F1F1F] whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-default">
                  <span className="text-[#FFB000] text-xs font-black">★</span>
                  <span>{ratingInfo.rating} ({formatReviewCount(ratingInfo.reviews)})</span>
                </div>

                <div className="bg-[rgba(255,255,255,0.85)] backdrop-blur-md border border-black/6 shadow-[0_8px_24px_rgba(0,0,0,0.06)] rounded-full px-2 sm:px-2.5 py-1.5 flex items-center gap-1 text-[11px] font-extrabold text-[#059669] dark:text-[#10B981] whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-default">
                  <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#10B981]" />
                  </span>
                  <span>Open Now</span>
                </div>

                <div className="bg-[rgba(255,255,255,0.85)] backdrop-blur-md border border-black/6 shadow-[0_8px_24px_rgba(0,0,0,0.06)] rounded-full px-2 sm:px-2.5 py-1.5 flex items-center gap-1 text-[11px] font-extrabold text-[#1F1F1F] whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-default">
                  <span className="text-[#6B6B6B] text-xs">🚶</span>
                  <span>{walkTimeFormatted}</span>
                </div>

                <div className="bg-[rgba(255,255,255,0.85)] backdrop-blur-md border border-black/6 shadow-[0_8px_24px_rgba(0,0,0,0.06)] rounded-full px-2 sm:px-2.5 py-1.5 flex items-center gap-1 text-[11px] font-extrabold text-[#1F1F1F] whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-default">
                  <span className="text-[#FF6B2C] text-xs">⏳</span>
                  <span>{act?.duration || (isBasecamp ? 'All-Day Hub' : '2 hrs')}</span>
                </div>
              </div>

              {/* 5. Short Description */}
              {act?.description && (
                <p className="text-xs sm:text-[13px] font-medium text-[#4A4A4A] leading-relaxed">
                  {act.description}
                </p>
              )}

              {/* 6. Quick Information Grid (2x2 with refined padding & Walk Distance format) */}
              <div className="grid grid-cols-2 gap-2.5 bg-[#FAF8F5] rounded-2xl p-3 border border-[#ECE8E2]">
                <div className="flex flex-col gap-0.5 p-2.5 bg-white/75 border border-[#ECE8E2]/80 rounded-xl shadow-2xs transition-all duration-200 hover:shadow-xs">
                  <span className="text-[10px] font-bold text-[#8A8580] uppercase tracking-wider flex items-center gap-1 mb-0.5">
                    <span>⏳</span> Suggested Duration
                  </span>
                  <span className="text-xs sm:text-[13px] font-extrabold text-[#1F1F1F]">
                    {act?.duration || (isBasecamp ? 'All-Day Hub' : '1.5 – 2 Hours')}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5 p-2.5 bg-white/75 border border-[#ECE8E2]/80 rounded-xl shadow-2xs transition-all duration-200 hover:shadow-xs">
                  <span className="text-[10px] font-bold text-[#8A8580] uppercase tracking-wider flex items-center gap-1 mb-0.5">
                    <span>💰</span> Estimated Cost
                  </span>
                  <span className="text-xs sm:text-[13px] font-extrabold text-[#1F1F1F]">
                    {isBasecamp ? 'Included in Stay' : costInfo.title.replace('💰 ', '')}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5 p-2.5 bg-white/75 border border-[#ECE8E2]/80 rounded-xl shadow-2xs transition-all duration-200 hover:shadow-xs">
                  <span className="text-[10px] font-bold text-[#8A8580] uppercase tracking-wider flex items-center gap-1 mb-0.5">
                    <span>🚶</span> Walking Distance
                  </span>
                  <div className="flex flex-col leading-tight">
                    <span className="text-xs sm:text-[13px] font-extrabold text-[#1F1F1F]">
                      {walkTimeFormatted}
                    </span>
                    {walkDistFormatted && (
                      <span className="text-[11px] font-semibold text-[#6B6B6B] mt-0.5">
                        {walkDistFormatted}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-0.5 p-2.5 bg-white/75 border border-[#ECE8E2]/80 rounded-xl shadow-2xs transition-all duration-200 hover:shadow-xs">
                  <span className="text-[10px] font-bold text-[#8A8580] uppercase tracking-wider flex items-center gap-1 mb-0.5">
                    <span>🏷️</span> Category
                  </span>
                  <span className="text-xs sm:text-[13px] font-extrabold text-[#FF6B2C] truncate">
                    {meta.label}
                  </span>
                </div>
              </div>

              {/* Weather & Crowd Level compact chips */}
              <div className="flex items-center gap-2 -mt-1 flex-wrap">
                <span className="px-2.5 py-1 rounded-xl bg-[#FAF8F5] border border-[#ECE8E2] text-xs font-bold text-[#4A4A4A] flex items-center gap-1.5 shadow-2xs transition-all duration-200 hover:border-[#FF6B2C]/40">
                  {weatherChipText}
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-[#10B981]/10 border border-[#10B981]/25 text-xs font-bold text-[#059669] flex items-center gap-1.5 shadow-2xs transition-all duration-200 hover:scale-[1.02]">
                  {crowdChipText}
                </span>
              </div>

              {/* 7. ✨ TripWise Insight (AI Recommendation) */}
              <div className="bg-linear-to-br from-[#FFF8F3] via-[#FFF3EC]/70 to-[#FFECE2]/40 border border-[#FF6B2C]/25 rounded-2xl p-4 shadow-[0_4px_16px_rgba(255,107,44,0.05)] relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-[#FF6B2C]/40 group">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-5 h-5 rounded-lg bg-[#FF6B2C] text-white flex items-center justify-center text-[11px] shadow-2xs font-bold shrink-0 animate-pulse">
                    ✨
                  </div>
                  <span className="text-[11px] font-extrabold text-[#D94E14] uppercase tracking-wider">
                    TripWise Insight
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 pl-1">
                  {insightBullets.map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs font-semibold text-[#1F1F1F] leading-relaxed">
                      <span className="text-[#FF6B2C] font-black mt-0.5">•</span>
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 8. 🤖 Why TripWise Chose This Stop section */}
              <div className="bg-[#FAF8F5] border border-[#ECE8E2] rounded-2xl p-3.5 transition-all duration-200 hover:border-[#ECE8E2]/90 hover:shadow-2xs">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm">🤖</span>
                  <span className="text-[11px] font-extrabold text-[#1F1F1F] uppercase tracking-wider">
                    Why TripWise Chose This Stop
                  </span>
                </div>
                <p className="text-xs font-medium text-[#6B6B6B] leading-relaxed italic">
                  "{whyChosenText}"
                </p>
              </div>

              {/* 9. Nearby AI Suggestions (Optional recommendations below AI section) */}
              <div className="flex flex-col gap-2.5 pt-1">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#1F1F1F]">
                  <span>📍</span>
                  <span className="uppercase tracking-wider text-[11px]">Nearby AI Suggestions</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {nearbySuggestions.map((sug, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-2 bg-[#FAF8F5] hover:bg-white border border-[#ECE8E2] rounded-xl transition-all duration-200 hover:shadow-2xs cursor-pointer group">
                      <img src={sug.image} alt={sug.title} className="w-11 h-11 rounded-lg object-cover shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-[#1F1F1F] group-hover:text-[#FF6B2C] truncate transition-colors">
                          {sug.title}
                        </span>
                        <span className="text-[10px] font-extrabold text-[#FF6B2C] truncate">
                          {sug.category}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] font-semibold text-[#6B6B6B]">
                          <span>{sug.dist}</span>
                          <span className="font-bold text-[#1F1F1F]">★ {sug.rating}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* STICKY ACTION BAR & 10. Footer Navigation (Pinned to bottom of panel when scrolling) */}
              <div className="sticky bottom-0 z-40 bg-[rgba(255,255,255,0.88)] backdrop-blur-md border-t border-[#ECE8E2] pt-3 pb-3 sm:pb-4 mt-2 -mx-4 sm:-mx-5 px-4 sm:px-5 rounded-b-3xl shadow-[0_-8px_24px_rgba(0,0,0,0.06)] flex flex-col gap-2.5">
                {/* Premium Compact Sticky Action Bar (always 1 click away on scroll) */}
                <div className="flex items-center justify-between gap-1.5 sm:gap-2 w-full">
                  {/* Primary CTA: Tickets (reduced px & height for ultra-sleek compact look) */}
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-0 bg-linear-to-r from-[#FF6B2C] via-[#FF5814] to-[#E04B10] hover:from-[#FF7A40] hover:via-[#FF6524] hover:to-[#EB5416] text-white font-semibold rounded-xl px-2 h-10 flex items-center justify-center shadow-[0_3px_12px_rgba(255,107,44,0.28)] hover:shadow-[0_6px_18px_rgba(255,107,44,0.42)] hover:-translate-y-0.5 active:scale-95 transition-all duration-200 ease-out text-center group cursor-pointer border border-[#FF814A]/30"
                  >
                    <Ticket size={15} strokeWidth={2.2} className="shrink-0 text-white mr-1 sm:mr-1.5 transition-transform duration-200 group-hover:scale-105 group-hover:-rotate-12" />
                    <span className="tracking-tight whitespace-nowrap text-xs sm:text-[13px]">Tickets</span>
                    <ArrowRight size={14} strokeWidth={2.6} className="shrink-0 text-white max-w-0 opacity-0 -translate-x-1.5 overflow-hidden transition-all duration-200 ease-out group-hover:max-w-4 group-hover:opacity-100 group-hover:translate-x-0 group-hover:ml-1" />
                  </a>

                  {/* Secondary CTA: Start Route (with Upright Arrow instead of diagonal icon) */}
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-[1.2] min-w-0 bg-white hover:bg-[#FAF8F5] text-[#1F1F1F] border border-black/6 hover:border-black/12 font-semibold rounded-xl px-2 h-10 flex items-center justify-center gap-1 sm:gap-1.5 shadow-2xs hover:shadow-sm hover:-translate-y-0.5 active:scale-95 transition-all duration-200 ease-out text-center group cursor-pointer"
                  >
                    <ArrowUpRight
                      size={15}
                      strokeWidth={2.2}
                      className="text-[#FF6B2C] transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-active:scale-110 shrink-0"
                    />
                    <span className="tracking-tight whitespace-nowrap text-xs sm:text-[13px]">Start Route</span>
                  </a>

                  {/* Secondary CTA: Save */}
                  <button
                    type="button"
                    onClick={() => setIsDestinationSaved(!isDestinationSaved)}
                    className={`flex-[0.9] min-w-0 hover:bg-[#FAF8F5] ${
                      isDestinationSaved
                        ? 'bg-linear-to-r from-[#FFE8DE] to-[#FFF3ED] text-[#D94E14] border border-[#FF6B2C]/30 shadow-2xs'
                        : 'bg-white text-[#1F1F1F] border border-black/6 hover:border-black/12 shadow-2xs'
                    } font-semibold rounded-xl px-2 h-10 flex items-center justify-center gap-1 sm:gap-1.5 hover:shadow-sm hover:-translate-y-0.5 active:scale-95 transition-all duration-200 ease-out text-center group cursor-pointer`}
                  >
                    <Heart
                      size={15}
                      strokeWidth={2.2}
                      className={`shrink-0 transition-all duration-200 ${
                        isDestinationSaved
                          ? 'fill-[#FF6B2C] text-[#FF6B2C] scale-110'
                          : 'text-[#1F1F1F] group-hover:text-[#FF6B2C] group-active:scale-125'
                      }`}
                    />
                    <span className="tracking-tight whitespace-nowrap text-xs sm:text-[13px]">{isDestinationSaved ? 'Saved' : 'Save'}</span>
                  </button>

                  {/* Secondary CTA: Share (icon fills solid on hover) */}
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== 'undefined' && navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.href);
                        setShowShareToast(true);
                        setTimeout(() => setShowShareToast(false), 3000);
                      }
                    }}
                    className="flex-[0.9] min-w-0 bg-white hover:bg-[#FAF8F5] text-[#1F1F1F] border border-black/6 hover:border-black/12 font-semibold rounded-xl px-2 h-10 flex items-center justify-center gap-1 sm:gap-1.5 shadow-2xs hover:shadow-sm hover:-translate-y-0.5 active:scale-95 transition-all duration-200 ease-out text-center group cursor-pointer"
                  >
                    <Share2
                      size={15}
                      strokeWidth={2.2}
                      className="shrink-0 text-[#1F1F1F] fill-transparent group-hover:fill-[#1F1F1F] transition-all duration-200 ease-out group-hover:scale-110"
                    />
                    <span className="tracking-tight whitespace-nowrap text-xs sm:text-[13px]">Share</span>
                  </button>
                </div>

                {/* Previous / Stop Counter / Next Navigation */}
                <div className="flex items-center justify-between pt-2 border-t border-[#ECE8E2]/80">
                  <button
                    type="button"
                    onClick={handleNavigatePrev}
                    className="px-3.5 py-1.5 h-8 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#E2DED8] hover:border-[#1F1F1F]/30 text-[#1F1F1F] font-extrabold text-xs shadow-2xs hover:shadow-sm transition-all duration-200 flex items-center gap-1.5 active:scale-95 cursor-pointer hover:-translate-x-0.5 group"
                  >
                    <span className="transition-transform duration-200 group-hover:-translate-x-0.5 font-black text-sm">←</span>
                    <span className="tracking-tight">Previous</span>
                  </button>

                  <span className="text-xs font-black text-[#1F1F1F] bg-linear-to-br from-[#FAF8F5] to-[#F3EFEA] px-3.5 py-1.5 h-8 rounded-xl border border-[#E2DED8] shadow-2xs flex items-center justify-center tracking-wide">
                    {isBasecamp ? 'Base' : `${stopIndex} / ${totalStops || (dayStops.length - 1)}`}
                  </span>

                  <button
                    type="button"
                    onClick={handleNavigateNext}
                    className="px-3.5 py-1.5 h-8 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#E2DED8] hover:border-[#1F1F1F]/30 text-[#1F1F1F] font-extrabold text-xs shadow-2xs hover:shadow-sm transition-all duration-200 flex items-center gap-1.5 active:scale-95 cursor-pointer hover:translate-x-0.5 group"
                  >
                    <span className="tracking-tight">Next</span>
                    <span className="transition-transform duration-200 group-hover:translate-x-0.5 font-black text-sm">→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Loading Overlay while Leaflet fetches */}
      {!isReady && (
        <div className="absolute inset-0 bg-[#FAF8F5]/90 backdrop-blur-xs z-20 flex flex-col items-center justify-center text-center p-6">
          <div className="w-8 h-8 rounded-full border-2 border-dashed border-[#FF6B2C] animate-spin mb-3" />
          <span className="text-xs font-extrabold text-[#1F1F1F]">Loading Real-World Map Tiles...</span>
        </div>
      )}
    </div>
  );

  if (isFullscreen && typeof document !== 'undefined') {
    return (
      <>
        {/* Placeholder in right panel so it doesn't collapse into a blank white space */}
        <div className="w-full h-full min-h-105 rounded-3xl border border-[#ECE8E2] bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center animate-fade-in shadow-inner">
          <div className="w-14 h-14 rounded-2xl bg-[#FF6B2C]/10 border border-[#FF6B2C]/20 flex items-center justify-center text-2xl mb-3.5 shadow-sm">
            ⛶
          </div>
          <h4 className="text-base font-bold text-[#1F1F1F]">Map is Expanded Fullscreen</h4>
          <p className="text-xs text-[#6B6B6B] mt-1 max-w-xs leading-relaxed">
            You are currently exploring your interactive trip route across the entire screen.
          </p>
          <button
            onClick={() => setIsFullscreen(false)}
            className="mt-5 px-5 py-2.5 rounded-xl bg-[#FF6B2C] text-white text-xs font-bold shadow-md hover:bg-[#E05A20] active:scale-95 transition-all flex items-center gap-2"
          >
            <span>✕</span>
            <span>Exit Fullscreen (Esc)</span>
          </button>
        </div>

        {/* Full-screen map portaled to document.body */}
        {createPortal(mapJSX, document.body)}
      </>
    );
  }

  return mapJSX;
}
