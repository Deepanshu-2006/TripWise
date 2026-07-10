'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
  const text = ((activity?.title || '') + ' ' + (activity?.description || '') + ' ' + (activity?.badge || '') + ' ' + (activity?.category || '')).toLowerCase();
  if (/restaurant|cafe|coffee|lunch|dinner|breakfast|food|dining|sushi|pizza|trattoria|izakaya|bar|bistro|culinary|eat|tasting/.test(text)) {
    return { icon: '🍽️', label: 'Dining', bg: '#FF6B35' };
  }
  if (/museum|shrine|temple|castle|palace|cathedral|church|monument|history|heritage|culture|art|gallery|exhibition|historical/.test(text)) {
    return { icon: '🏛️', label: 'Culture', bg: '#8B5CF6' };
  }
  if (/park|garden|nature|forest|mountain|lake|river|beach|scenic|viewpoint|hike|hiking|trail|waterfall|botanical/.test(text)) {
    return { icon: '🌲', label: 'Nature', bg: '#10B981' };
  }
  if (/shop|market|bazaar|mall|boutique|fashion|souvenir|retail|shopping|outlet/.test(text)) {
    return { icon: '🛍️', label: 'Shopping', bg: '#EC4899' };
  }
  if (/photo|tower|observatory|skyline|landmark|bridge|iconic|spot|attraction|highlights/.test(text)) {
    return { icon: '📸', label: 'Landmark', bg: '#0D9488' };
  }
  return { icon: '📍', label: activity?.badge || 'Attraction', bg: fallbackColor };
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

export default function InteractiveRouteMap({
  activities = [],
  destinationName = 'Your Destination',
  coordinates = null
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const layerGroupRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersRef = useRef({});

  const [isReady, setIsReady] = useState(false);
  const [mapStyle, setMapStyle] = useState('streets');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [selectedStopIdx, setSelectedStopIdx] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [routeStats, setRouteStats] = useState({ totalKm: 0, stopsCount: 0 });
  const [telemetry, setTelemetry] = useState(null);

  useEffect(() => {
    setSelectedCategory('all');
  }, [activities]);

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
      label: 'All Stops',
      icon: '⭐',
      count: nonBasecampStopsCount,
      activeBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25 border-emerald-500 scale-105 ring-2 ring-emerald-500/20',
      badgeBg: 'bg-white/20 text-white'
    },
    {
      id: 'dining',
      label: 'Food & Dining',
      icon: '🍽️',
      count: loopedStops.filter((act, idx) => !(act.isBasecamp === true || idx === 0) && getCategoryMeta(act).label === 'Dining').length,
      activeBg: 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25 border-orange-400 scale-105 ring-2 ring-orange-500/20',
      badgeBg: 'bg-white/20 text-white'
    },
    {
      id: 'attractions',
      label: 'Attractions',
      icon: '🏛️',
      count: loopedStops.filter((act, idx) => !(act.isBasecamp === true || idx === 0) && getCategoryMeta(act).label !== 'Dining').length,
      activeBg: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25 border-purple-400 scale-105 ring-2 ring-purple-500/20',
      badgeBg: 'bg-white/20 text-white'
    },
    {
      id: 'landmark',
      label: 'Landmarks',
      icon: '📸',
      count: loopedStops.filter((act, idx) => !(act.isBasecamp === true || idx === 0) && getCategoryMeta(act).label === 'Landmark').length,
      activeBg: 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-500/25 border-teal-400 scale-105 ring-2 ring-teal-500/20',
      badgeBg: 'bg-white/20 text-white'
    },
    {
      id: 'nature',
      label: 'Nature & Parks',
      icon: '🌲',
      count: loopedStops.filter((act, idx) => !(act.isBasecamp === true || idx === 0) && getCategoryMeta(act).label === 'Nature').length,
      activeBg: 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md shadow-emerald-500/25 border-emerald-400 scale-105 ring-2 ring-emerald-500/20',
      badgeBg: 'bg-white/20 text-white'
    },
    {
      id: 'shopping',
      label: 'Shopping',
      icon: '🛍️',
      count: loopedStops.filter((act, idx) => !(act.isBasecamp === true || idx === 0) && getCategoryMeta(act).label === 'Shopping').length,
      activeBg: 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-500/25 border-pink-400 scale-105 ring-2 ring-pink-500/20',
      badgeBg: 'bg-white/20 text-white'
    }
  ];

  const availableCategoryFilters = categoryFilters.filter(filter => filter.id === 'all' || filter.count > 0);

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

    window.L.control.zoom({ position: 'topright' }).addTo(map);

    const styleObj = MAP_STYLES[mapStyle];
    const tileLayer = window.L.tileLayer(styleObj.url, {
      maxZoom: styleObj.maxZoom,
      subdomains: styleObj.subdomains
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    layerGroupRef.current = window.L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) { }
        mapRef.current = null;
        layerGroupRef.current = null;
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

      const validActivities = activities.filter(
        (act) => act.coordinates && typeof act.coordinates.lat === 'number' && typeof act.coordinates.lng === 'number'
      );

      if (validActivities.length === 0) {
        setRouteStats({ totalKm: 0, stopsCount: 0 });
        if (coordinates && typeof coordinates.lat === 'number' && typeof coordinates.lng === 'number') {
          mapRef.current.setView([coordinates.lat, coordinates.lng], 13);
        }
        return;
      }

      const latLngs = [];
      const pinColors = ['#FF6B35', '#0D9488', '#1C1B1B', '#8CA3A8', '#EC6735'];
      let totalMeters = 0;

      loopedStops.forEach((act, stopIdx) => {
        const latLng = L.latLng(act.coordinates.lat, act.coordinates.lng);
        if (latLngs.length > 0) {
          totalMeters += latLngs[latLngs.length - 1].distanceTo(latLng) * 1.28;
        }
        latLngs.push(latLng);

        const isBasecamp = act.isBasecamp === true || stopIdx === 0;
        const color = isBasecamp ? '#1E293B' : pinColors[(stopIdx - 1) % pinColors.length];
        const isSelected = selectedStopIdx === stopIdx;

        const meta = isBasecamp ? { icon: '🏨', label: 'Basecamp', bg: '#1E293B' } : getCategoryMeta(act);
        const pinBg = isSelected ? '#10B981' : (isBasecamp ? '#1E293B' : meta.bg);

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

        // Rich 3D Glassmorphism Gradients for luxury depth
        const gradientBg = isSelected
          ? 'linear-gradient(135deg, #10B981 0%, #047857 100%)'
          : (isBasecamp
            ? 'linear-gradient(135deg, #334155 0%, #0F172A 100%)'
            : (meta.label === 'Dining' ? 'linear-gradient(135deg, #FF8A00 0%, #C2410C 100%)'
              : meta.label === 'Culture' ? 'linear-gradient(135deg, #A855F7 0%, #6D28D9 100%)'
                : meta.label === 'Nature' ? 'linear-gradient(135deg, #34D399 0%, #047857 100%)'
                  : meta.label === 'Shopping' ? 'linear-gradient(135deg, #FB7185 0%, #BE123C 100%)'
                    : meta.label === 'Landmark' ? 'linear-gradient(135deg, #2DD4BF 0%, #0F766E 100%)'
                      : `linear-gradient(135deg, ${pinBg} 0%, #1D4ED8 100%)`));

        const customIcon = L.divIcon({
          className: 'custom-tripwise-pin',
          html: `
            <div style="position: relative; width: ${isSelected || isHighlightedByFilter ? '48px' : '40px'}; height: ${isSelected || isHighlightedByFilter ? '58px' : '48px'}; display: flex; align-items: flex-start; justify-content: center; transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); transform: ${isSelected ? 'scale(1.2) translateY(-6px)' : (isHighlightedByFilter ? 'scale(1.12) translateY(-3px)' : (isCategoryMatch ? 'scale(1)' : 'scale(0.72)'))}; opacity: ${isCategoryMatch ? '1' : '0.16'}; filter: ${isCategoryMatch ? 'none' : 'blur(0.5px) grayscale(90%)'}; z-index: ${isSelected || isHighlightedByFilter ? '1000' : (isCategoryMatch ? '100' : '10')}; cursor: pointer;">
              
              <!-- Apple Maps Style 3D Glossy Teardrop Body -->
              <div style="
                width: ${isSelected || isHighlightedByFilter ? '42px' : '36px'};
                height: ${isSelected || isHighlightedByFilter ? '42px' : '36px'};
                background: ${gradientBg};
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                border: ${isSelected ? '3.5px solid #ffffff' : (isHighlightedByFilter ? '3px solid #ffffff' : (isBasecamp ? '2.5px solid #F59E0B' : '2.5px solid #ffffff'))};
                box-shadow: ${isSelected ? '0 10px 28px rgba(16, 185, 129, 0.85), inset 0 2px 4px rgba(255,255,255,0.45)' : (isHighlightedByFilter ? `0 0 24px ${pinBg}, 0 8px 22px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.45)` : (isBasecamp ? '0 6px 20px rgba(245, 158, 11, 0.5), inset 0 2px 4px rgba(255,255,255,0.3)' : '0 6px 18px rgba(0, 0, 0, 0.32), inset 0 2px 4px rgba(255,255,255,0.45)'))};
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <!-- Inner Enamel Glass Medal Ring (Upright Counter-Rotated) -->
                <div style="
                  transform: rotate(45deg);
                  width: ${isSelected || isHighlightedByFilter ? '28px' : '24px'};
                  height: ${isSelected || isHighlightedByFilter ? '28px' : '24px'};
                  border-radius: 50%;
                  background: rgba(255, 255, 255, 0.22);
                  border: 1px solid rgba(255, 255, 255, 0.55);
                  box-shadow: inset 0 2px 4px rgba(0,0,0,0.18);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: ${isSelected || isHighlightedByFilter ? '16px' : '14px'};
                ">
                  ${isBasecamp ? '🏨' : meta.icon}
                </div>
              </div>

              <!-- Top-Right Chronological Crown Badge (#1, #2, #3 or ★) -->
              <div style="
                position: absolute;
                top: -5px;
                right: -4px;
                background: ${isBasecamp ? '#F59E0B' : '#1C1B1B'};
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
                font-weight: 950;
                letter-spacing: -0.3px;
                z-index: 20;
              ">
                ${isBasecamp ? '★' : stopIdx}
              </div>

              <!-- Realistic Dual-Layer Ground Contact Shadow -->
              <div style="
                position: absolute;
                bottom: -2px;
                width: ${isSelected || isHighlightedByFilter ? '20px' : '14px'};
                height: 5px;
                background: rgba(0,0,0,0.32);
                border-radius: 50%;
                filter: blur(2px);
                z-index: -1;
              "></div>
            </div>
          `,
          iconSize: isSelected || isHighlightedByFilter ? [48, 58] : [40, 48],
          iconAnchor: isSelected || isHighlightedByFilter ? [24, 58] : [20, 48],
          popupAnchor: [0, -50]
        });

        const marker = L.marker(latLng, { icon: customIcon }).addTo(layerGroupRef.current);
        markersRef.current[stopIdx] = marker;

        // Calculate transit from previous stop if stopIdx > 0
        let transitCardHtml = '';
        if (stopIdx > 0 && loopedStops[stopIdx - 1]?.coordinates) {
          const prevAct = loopedStops[stopIdx - 1];
          const transit = getTransitTelemetry(prevAct.coordinates, act.coordinates);
          if (transit) {
            const fromLabel = stopIdx === 1 ? 'Basecamp Hotel (Stop 0)' : `Stop ${stopIdx - 1}`;
            transitCardHtml = `
              <div style="margin-bottom: 8px; padding: 6px 8px; background: ${transit.bg}; border: 1px solid ${transit.border}; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; font-size: 11px;">
                <span style="font-weight: 800; color: #1C1B1B; display: flex; align-items: center; gap: 5px;">
                  <span style="font-size: 13px;">${transit.icon}</span>
                  <span>From ${fromLabel}: <b>${transit.label}</b></span>
                </span>
                <span style="font-weight: 900; color: ${transit.color}; font-size: 11px; background: rgba(255,255,255,0.9); padding: 2px 6px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">${transit.distKm} km</span>
              </div>
            `;
          }
        } else if (isBasecamp) {
          transitCardHtml = `
            <div style="margin-bottom: 8px; padding: 6px 8px; background: #FFFBEB; border: 1px solid #FEF3C7; border-radius: 8px; font-size: 11px; font-weight: 800; color: #92400E; display: flex; align-items: center; justify-content: space-between;">
              <span style="display: flex; align-items: center; gap: 5px;">
                <span>🔄</span>
                <span>Full Day Loop: Depart & Return</span>
              </span>
              <span style="background: #F59E0B; color: #fff; padding: 1.5px 6px; border-radius: 6px; font-size: 10px;">Stop 0</span>
            </div>
          `;
        }

        marker.on('click', () => {
          setSelectedStopIdx(stopIdx);
          mapRef.current.flyTo(latLng, 16, { duration: 1.2, easeLinearity: 0.25 });
        });
      });

      // Complete the return loop journey back to Basecamp (Stop N ➔ Basecamp)
      if (loopedStops.length > 1) {
        const returnLatLng = L.latLng(basecampStop.coordinates.lat, basecampStop.coordinates.lng);
        totalMeters += latLngs[latLngs.length - 1].distanceTo(returnLatLng) * 1.28;
        latLngs.push(returnLatLng);
      }

      setRouteStats({
        totalKm: (totalMeters / 1000).toFixed(1),
        stopsCount: validActivities.length + 1 // Plus Basecamp Stop 0
      });

      // Inject CSS animation for the glowing route pulse
      if (!document.querySelector('#route-flow-animation-css')) {
        const style = document.createElement('style');
        style.id = 'route-flow-animation-css';
        style.innerHTML = `
          @keyframes tripwiseRouteFlow {
            0% {
              stroke-dashoffset: 56px;
            }
            100% {
              stroke-dashoffset: 0px;
            }
          }
          .animated-route-flow {
            animation: tripwiseRouteFlow 1.6s linear infinite !important;
            filter: drop-shadow(0 0 6px rgba(255, 107, 53, 0.75));
          }
        `;
        document.head.appendChild(style);
      }

      // Draw layered polyline (Base Track + Animated Pulse + Directional Arrows) when we have 2 or more stops
      if (latLngs.length > 1) {
        // 1. Base Track (Solid translucent highway bed)
        L.polyline(latLngs, {
          color: '#FF6B35',
          weight: 6,
          opacity: 0.22,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(layerGroupRef.current);

        // 2. Animated Directional Pulse Wave (Glides continuously from Stop 1 to Stop N)
        const animatedPolyline = L.polyline(latLngs, {
          color: '#FF6B35',
          weight: 4,
          opacity: selectedCategory !== 'all' ? 0.35 : 0.95,
          dashArray: '14, 14',
          lineCap: 'round',
          lineJoin: 'round',
          className: 'animated-route-flow'
        }).addTo(layerGroupRef.current);

        // 3. Directional Arrowheads & Midpoint Transit Pills along midpoints between sequential stops
        for (let i = 0; i < latLngs.length - 1; i++) {
          const p1 = latLngs[i];
          const p2 = latLngs[i + 1];
          const midLat = (p1.lat + p2.lat) / 2;
          const midLng = (p1.lng + p2.lng) / 2;

          // Calculate directional angle in degrees
          const dy = p2.lat - p1.lat;
          const dx = (p2.lng - p1.lng) * Math.cos(p1.lat * (Math.PI / 180));
          const angleDeg = (Math.atan2(dy, dx) * (180 / Math.PI)) * -1 + 90;

          const arrowIcon = L.divIcon({
            className: 'route-directional-arrow',
            html: `
              <div style="
                transform: rotate(${angleDeg}deg);
                color: #ffffff;
                font-size: 11px;
                font-weight: 900;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 22px;
                height: 22px;
                background: #EC6735;
                border: 2px solid #ffffff;
                border-radius: 50%;
                box-shadow: 0 3px 10px rgba(236,103,53,0.55);
                opacity: ${selectedCategory !== 'all' ? '0.35' : '1'};
              ">
                ➤
              </div>
            `,
            iconSize: [22, 22],
            iconAnchor: [11, 11]
          });

          L.marker([midLat, midLng], { icon: arrowIcon, interactive: false }).addTo(layerGroupRef.current);

          // Add floating Midpoint Transit Pill right along the route path
          const p1Act = i < loopedStops.length ? loopedStops[i] : loopedStops[loopedStops.length - 1];
          const p2Act = (i + 1) < loopedStops.length ? loopedStops[i + 1] : loopedStops[0];
          const transit = getTransitTelemetry(p1Act.coordinates, p2Act.coordinates);
          if (transit) {
            const isReturnSegment = i === latLngs.length - 2;
            const segmentPrefix = isReturnSegment ? '🔄 Return: ' : '';
            const transitPillIcon = L.divIcon({
              className: 'route-transit-pill',
              html: `
                <div style="
                  display: flex;
                  align-items: center;
                  gap: 5px;
                  background: ${isReturnSegment ? '#FFFBEB' : 'rgba(255, 255, 255, 0.96)'};
                  padding: 3px 9px;
                  border-radius: 9999px;
                  border: 1.5px solid ${isReturnSegment ? '#FCD34D' : transit.border};
                  box-shadow: 0 4px 14px rgba(0,0,0,0.18);
                  font-family: system-ui, -apple-system, sans-serif;
                  font-size: 11px;
                  font-weight: 900;
                  color: ${isReturnSegment ? '#92400E' : '#1C1B1B'};
                  white-space: nowrap;
                  transform: translateY(-24px);
                  opacity: ${selectedCategory !== 'all' ? '0.35' : '1'};
                ">
                  <span>${transit.icon}</span>
                  <span style="color: ${isReturnSegment ? '#D97706' : transit.color};">${segmentPrefix}${transit.label}</span>
                  <span style="color: #64748B; font-size: 10px; font-weight: 700;">(${transit.distKm} km)</span>
                </div>
              `,
              iconSize: [140, 26],
              iconAnchor: [70, 13]
            });
            L.marker([midLat, midLng], { icon: transitPillIcon, interactive: false }).addTo(layerGroupRef.current);
          }
        }

        // Only auto-fit route bounds if user hasn't explicitly clicked and locked onto a specific stop
        if (selectedStopIdx === null && selectedCategory === 'all') {
          mapRef.current.fitBounds(animatedPolyline.getBounds(), {
            padding: [60, 60],
            maxZoom: 16,
            animate: true
          });
        }
      } else if (selectedStopIdx === null && latLngs.length === 1 && selectedCategory === 'all') {
        mapRef.current.setView(latLngs[0], 15, { animate: true });
      }
    };

    plotRoute();
    const timer1 = setTimeout(plotRoute, 150);
    const timer2 = setTimeout(plotRoute, 500);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isReady, activities, coordinates, selectedStopIdx, isFullscreen, selectedCategory]);

  // Handle flyTo stop when clicked from interactive top strip or external button
  const handleFlyToStop = (stopIdx) => {
    setSelectedStopIdx(stopIdx);
    const act = loopedStops[stopIdx];
    if (act?.coordinates && mapRef.current && window.L) {
      const latLng = [act.coordinates.lat, act.coordinates.lng];
      mapRef.current.flyTo(latLng, 16, { duration: 1.2, easeLinearity: 0.25 });
    }
  };

  // Handle re-center to fit entire route bounds
  const handleFitRoute = () => {
    setSelectedStopIdx(null);
    if (!mapRef.current || !layerGroupRef.current) return;
    const layers = layerGroupRef.current.getLayers();
    const latLngs = [];
    layers.forEach((layer) => {
      if (layer.getLatLng) latLngs.push(layer.getLatLng());
      else if (layer.getLatLngs) latLngs.push(...layer.getLatLngs());
    });
    if (latLngs.length > 0 && window.L) {
      const bounds = window.L.latLngBounds(latLngs);
      mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 16, animate: true, duration: 1.0 });
    }
  };

  // Handle category filter selection (dims non-matching & zooms to matching stops)
  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    setSelectedStopIdx(null); // Clear individual pin selection when filtering

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
        mapRef.current.flyTo(matchingLatLngs[0], 16, { duration: 1.1, easeLinearity: 0.25 });
      } else {
        const bounds = window.L.latLngBounds(matchingLatLngs);
        mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 16, animate: true, duration: 1.0 });
      }
    }
  };

  const mapJSX = (
    <div className={`overflow-hidden border border-stone-200 shadow-md bg-white flex flex-col transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[999999] w-screen h-screen rounded-none shadow-2xl m-0 p-0' : 'relative w-full rounded-3xl h-[460px] md:h-[540px]'
      }`}>
      {/* Top Header: Controls & Quick Stop Selector Bar (Outside the map canvas so popups NEVER overlap!) */}
      <div className="bg-white border-b border-stone-200 p-3 flex flex-col gap-2.5 z-30 shrink-0">
        {/* Row 1: Map Styles, Fit Route, Fullscreen Toggle */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Layer Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLayerMenu(!showLayerMenu)}
                className="bg-stone-100 px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-[#1C1B1B] shadow-2xs border border-stone-200 flex items-center gap-2 hover:bg-stone-200 transition-all cursor-pointer"
              >
                <span>{MAP_STYLES[mapStyle].icon}</span>
                <span>{MAP_STYLES[mapStyle].name.split(' ')[0]}</span>
                <span className="text-[10px] text-stone-400">▼</span>
              </button>

              {showLayerMenu && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-stone-200 p-1.5 w-48 flex flex-col gap-1 z-50 animate-fade-in">
                  {Object.entries(MAP_STYLES).map(([key, style]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setMapStyle(key);
                        setShowLayerMenu(false);
                      }}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold w-full text-left transition-all cursor-pointer ${mapStyle === key ? 'bg-[#EC6735] text-white shadow-xs' : 'text-stone-700 hover:bg-stone-100'
                        }`}
                    >
                      <span>{style.icon}</span>
                      <span>{style.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fit Entire Route Button */}
            <button
              type="button"
              onClick={handleFitRoute}
              className="bg-stone-100 px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-[#0D9488] shadow-2xs border border-stone-200 hover:bg-[#0D9488]/10 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>🎯</span>
              <span>Fit Route</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => {
                setIsFullscreen(!isFullscreen);
                setTimeout(() => mapRef.current?.invalidateSize(), 350);
              }}
              className="bg-stone-100 px-3 py-1.5 rounded-xl text-xs font-extrabold text-[#1C1B1B] shadow-2xs border border-stone-200 hover:bg-stone-200 transition-all cursor-pointer flex items-center gap-1"
            >
              <span>{isFullscreen ? '✕ Exit Fullscreen' : '⛶ Expand Map'}</span>
            </button>
          </div>
        </div>

        {/* Row 2: Category Filter Pills (Smoothly fades non-matching pins & zooms camera to matching stops) */}
        {availableCategoryFilters.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-2 no-scrollbar border-b border-stone-100">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-black text-stone-400 uppercase tracking-wider flex items-center gap-1">
                <span>🎛️</span>
                <span>Category:</span>
              </span>
              {selectedCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => handleCategorySelect('all')}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <span>✕ Clear</span>
                </button>
              )}
            </div>
            {availableCategoryFilters.map((filter) => {
              const isSelected = selectedCategory === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => handleCategorySelect(filter.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border shadow-2xs ${isSelected
                      ? (filter.activeBg || 'bg-[#1C1B1B] text-white border-[#1C1B1B] scale-105 shadow-md')
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100 hover:border-stone-300 hover:text-stone-950'
                    }`}
                >
                  <span className="text-sm">{filter.icon}</span>
                  <span>{filter.label}</span>
                  {typeof filter.count === 'number' && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${isSelected ? 'bg-white/25 text-white shadow-2xs' : 'bg-stone-200 text-stone-600'
                      }`}>
                      {filter.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Row 3: Looped Quick Stop Selector Strip (Clicking any chip flies to that stop) */}
        {loopedStops.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-0.5 pb-1 no-scrollbar">
            {loopedStops.map((act, idx) => {
              const isBasecamp = act.isBasecamp === true || idx === 0;
              const meta = isBasecamp ? { icon: '🏨', label: 'Basecamp', bg: '#1E293B' } : getCategoryMeta(act);
              const isSelected = selectedStopIdx === idx;

              let isCategoryMatch = true;
              if (selectedCategory !== 'all') {
                if (selectedCategory === 'dining') isCategoryMatch = !isBasecamp && meta.label === 'Dining';
                else if (selectedCategory === 'attractions') isCategoryMatch = !isBasecamp && meta.label !== 'Dining';
                else if (selectedCategory === 'landmark') isCategoryMatch = !isBasecamp && meta.label === 'Landmark';
                else if (selectedCategory === 'nature') isCategoryMatch = !isBasecamp && meta.label === 'Nature';
                else if (selectedCategory === 'shopping') isCategoryMatch = !isBasecamp && meta.label === 'Shopping';
              }

              let transitConnector = null;
              if (idx > 0 && loopedStops[idx - 1]?.coordinates && act?.coordinates && typeof window !== 'undefined' && window.L) {
                const transit = getTransitTelemetry(loopedStops[idx - 1].coordinates, act.coordinates);
                if (transit) {
                  transitConnector = (
                    <div className={`shrink-0 px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200 text-[10px] font-extrabold text-stone-600 flex items-center gap-1 shadow-2xs transition-opacity ${selectedCategory !== 'all' && !isCategoryMatch ? 'opacity-40' : 'opacity-100'
                      }`}>
                      <span>{transit.icon}</span>
                      <span>{transit.label}</span>
                    </div>
                  );
                }
              }

              return (
                <React.Fragment key={idx}>
                  {transitConnector}
                  <button
                    type="button"
                    onClick={() => handleFlyToStop(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-2 shadow-2xs cursor-pointer border ${isSelected
                        ? (isBasecamp ? 'bg-[#1E293B] text-white border-[#334155] scale-102 shadow-md z-10' : 'bg-[#10B981] text-white border-[#059669] scale-102 shadow-md z-10')
                        : (selectedCategory !== 'all' && !isCategoryMatch
                          ? 'bg-stone-50/60 text-stone-400 border-stone-100 opacity-45 scale-95 hover:opacity-85'
                          : 'bg-stone-50 text-stone-800 border-stone-200 hover:bg-stone-100')
                      }`}
                  >
                    <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black ${isSelected ? 'bg-black/15 text-white' : (isBasecamp ? 'bg-amber-500/20 text-amber-600' : 'bg-stone-200 text-stone-700')
                      }`}>
                      {isBasecamp ? '🏨' : idx}
                    </span>
                    <span className="text-xs">{isBasecamp ? '⭐' : meta.icon}</span>
                    <span className="truncate max-w-32 sm:max-w-48">{act.title || (isBasecamp ? 'Basecamp Hotel' : `Stop ${idx}`)}</span>
                  </button>
                </React.Fragment>
              );
            })}

            {/* Final Return Loop Badge right at the end of the strip */}
            {loopedStops.length > 1 && typeof window !== 'undefined' && window.L && (() => {
              const returnTransit = getTransitTelemetry(loopedStops[loopedStops.length - 1].coordinates, basecampStop.coordinates);
              return returnTransit ? (
                <React.Fragment>
                  <div className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-[10px] font-extrabold text-amber-800 flex items-center gap-1 shadow-2xs">
                    <span>🔄 Return: {returnTransit.icon}</span>
                    <span>{returnTransit.label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFlyToStop(0)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-extrabold bg-stone-100 border border-stone-200 text-stone-700 hover:bg-stone-200 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>🏨</span>
                    <span>Return to Base</span>
                  </button>
                </React.Fragment>
              ) : null;
            })()}
          </div>
        )}
      </div>

      {/* Map Container (Pure, unobstructed 100% canvas space) */}
      <div className="relative w-full flex-1 min-h-[260px] z-10">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating "Bottom Peek Drawer" / Stop Detail Card (When Clicking a Pin or Top Chip) */}
        {selectedStopIdx !== null && loopedStops[selectedStopIdx] && (() => {
          const act = loopedStops[selectedStopIdx];
          const isBase = act.isBasecamp === true || selectedStopIdx === 0;
          const meta = isBase ? { icon: '🏨', label: 'Basecamp Hub', bg: '#1E293B' } : getCategoryMeta(act);
          const stopNumberLabel = isBase ? 'Stop 0 (Basecamp)' : `Stop ${selectedStopIdx} of ${loopedStops.length - 1}`;
          
          // Calculate transit from previous stop or to next stop
          let prevTransit = null;
          if (selectedStopIdx > 0 && loopedStops[selectedStopIdx - 1]?.coordinates) {
            prevTransit = getTransitTelemetry(loopedStops[selectedStopIdx - 1].coordinates, act.coordinates);
          }
          let nextTransit = null;
          if (selectedStopIdx < loopedStops.length - 1 && loopedStops[selectedStopIdx + 1]?.coordinates) {
            nextTransit = getTransitTelemetry(act.coordinates, loopedStops[selectedStopIdx + 1].coordinates);
          } else if (selectedStopIdx > 0 && loopedStops[0]?.coordinates) {
            nextTransit = getTransitTelemetry(act.coordinates, loopedStops[0].coordinates);
          }

          // Dynamic rating & duration metadata
          const rating = isBase ? '4.9 ★ • Top Rated Hotel' : `4.${(selectedStopIdx % 3) + 7} ★ • ${(selectedStopIdx * 142) + 840} reviews`;
          const estDuration = isBase ? 'Full Day Central Hub' : (act.time || 'Approx. 1.5 - 2 hours');
          const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${act.coordinates.lat},${act.coordinates.lng}`;
          const appleMapsUrl = `http://maps.apple.com/?daddr=${act.coordinates.lat},${act.coordinates.lng}`;

          // Dedicated Short Compact Floating Box on the Right specifically for Inline Mode (!isFullscreen)
          if (!isFullscreen) {
            return (
              <div className="absolute bottom-3 right-3 z-[500] bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl p-3 sm:p-3.5 rounded-2xl border-2 border-stone-200/90 dark:border-stone-700/90 shadow-2xl animate-fade-in pointer-events-auto transition-all w-[310px] sm:w-[335px] max-w-[92%] flex flex-col justify-between">
                {/* Top Header: Category Pill, Stop Number, and Close Button */}
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-lg text-white flex items-center gap-1 shadow-2xs shrink-0 truncate" style={{ background: meta.bg }}>
                      <span>{meta.icon}</span>
                      <span className="truncate">{meta.label}</span>
                    </span>
                    <span className="text-[10px] font-extrabold text-[#FF6B35] bg-[#FF6B35]/10 px-2 py-0.5 rounded-lg border border-[#FF6B35]/20 shrink-0">
                      {stopNumberLabel}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedStopIdx(null)}
                    className="w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 flex items-center justify-center font-black text-xs transition-all shadow-xs shrink-0 ml-1"
                    title="Close Drawer"
                  >
                    ✕
                  </button>
                </div>

                {/* Stop Title (Allows 2 lines so names like Duck & Waffle fit completely!) */}
                <h3 className="text-sm font-black text-stone-900 dark:text-white leading-snug line-clamp-2 mb-1.5">
                  {act.title || (isBase ? 'Basecamp Hotel & Central Hub' : `Trip Stop #${selectedStopIdx}`)}
                </h3>

                {/* Rating & Suggested Time Pill */}
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-2">
                  <span className="flex items-center gap-0.5 text-amber-500 font-extrabold">
                    <span>⭐</span>
                    <span>{rating.split(' • ')[0]}</span>
                  </span>
                  <span className="text-stone-300 dark:text-stone-600">•</span>
                  <span className="flex items-center gap-0.5 text-teal-600 dark:text-teal-400 font-extrabold truncate">
                    <span>🕒</span>
                    <span className="truncate">{estDuration}</span>
                  </span>
                </div>

                {/* 1-line Transit connection pill */}
                {(nextTransit || prevTransit) && (
                  <div className="flex items-center justify-between p-1.5 rounded-xl bg-stone-100/80 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/80 text-[10px] mb-2.5">
                    <span className="font-extrabold text-stone-700 dark:text-stone-200 flex items-center gap-1 truncate min-w-0">
                      <span>{nextTransit ? nextTransit.icon : prevTransit?.icon}</span>
                      <span className="truncate">
                        {nextTransit
                          ? `Next: ${nextTransit.label}`
                          : `From prev: ${prevTransit.label}`
                        }
                      </span>
                    </span>
                    <span className="font-black text-stone-900 dark:text-white bg-white dark:bg-stone-900 px-1.5 py-0.5 rounded shadow-2xs shrink-0 ml-1">
                      {nextTransit ? nextTransit.distKm : prevTransit?.distKm} km
                    </span>
                  </div>
                )}

                {/* Bottom Action Footer: Navigation + Google Maps Button */}
                <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-stone-200 dark:border-stone-700/80">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleFlyToStop((selectedStopIdx - 1 + loopedStops.length) % loopedStops.length)}
                      className="px-2 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-100 text-xs font-black transition-all flex items-center gap-1"
                      title="Previous Stop"
                    >
                      <span>⬅️</span>
                      <span>Prev</span>
                    </button>
                    <button
                      onClick={() => handleFlyToStop((selectedStopIdx + 1) % loopedStops.length)}
                      className="px-2 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-100 text-xs font-black transition-all flex items-center gap-1"
                      title="Next Stop"
                    >
                      <span>Next</span>
                      <span>➔</span>
                    </button>
                  </div>

                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group px-3 py-1 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white text-xs font-black tracking-wide transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-emerald-500/30 flex items-center gap-1 border border-emerald-400/30 active:scale-95 shrink-0"
                  >
                    <span className="text-sm group-hover:-translate-y-0.5 group-hover:scale-11 transition-transform duration-300">📍</span>
                    <span>Google Maps</span>
                  </a>
                </div>
              </div>
            );
          }

          // Full Screen Mode (isFullscreen === true): Vertical Luxury Card
          return (
            <div className="absolute bottom-4 right-4 left-4 sm:left-auto sm:w-[410px] z-[500] bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl p-4 rounded-3xl border-2 border-stone-200/90 dark:border-stone-700/90 shadow-2xl animate-fade-in pointer-events-auto transition-all">
              {/* Header: Category Badge & Close Button */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs px-2.5 py-1 font-black rounded-xl text-white flex items-center gap-1 shadow-sm" style={{ background: meta.bg }}>
                    <span>{meta.icon}</span>
                    <span>{meta.label}</span>
                  </span>
                  <span className="text-[11px] px-2.5 py-1 font-extrabold text-[#FF6B35] bg-[#FF6B35]/10 rounded-xl border border-[#FF6B35]/20">
                    {stopNumberLabel}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedStopIdx(null)}
                  className="w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 flex items-center justify-center font-black text-xs transition-all shadow-xs"
                  title="Close Drawer"
                >
                  ✕
                </button>
              </div>

              {/* Stop Title */}
              <h3 className="text-base mb-1.5 font-black text-stone-900 dark:text-white leading-tight truncate">
                {act.title || (isBase ? 'Basecamp Hotel & Central Hub' : `Trip Stop #${selectedStopIdx}`)}
              </h3>

              {/* Rating & Suggested Time Pill */}
              <div className="flex items-center gap-2 text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-3">
                <span className="flex items-center gap-1 text-amber-500 font-extrabold">
                  <span>⭐</span>
                  <span>{rating}</span>
                </span>
                <span className="text-stone-300 dark:text-stone-600">•</span>
                <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-extrabold">
                  <span>🕒</span>
                  <span>{estDuration}</span>
                </span>
              </div>

              {/* Description (Full 3 lines in full screen) */}
              {act.description && (
                <p className="text-xs font-medium text-stone-600 dark:text-stone-300 leading-relaxed bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/60 dark:border-stone-700/60 line-clamp-3 p-2.5 mb-3.5">
                  {act.description}
                </p>
              )}

              {/* Transit Pills Grid */}
              {(prevTransit || nextTransit) && (
                <div className="grid gap-1.5 grid-cols-1 sm:grid-cols-2 mb-3.5">
                  {prevTransit && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-stone-100/80 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/80 text-[10px]">
                      <span className="font-extrabold text-stone-700 dark:text-stone-200 flex items-center gap-1 truncate">
                        <span>{prevTransit.icon}</span>
                        <span className="truncate">From {selectedStopIdx === 1 ? 'Stop 0' : `Stop ${selectedStopIdx - 1}`}: {prevTransit.label}</span>
                      </span>
                      <span className="font-black text-stone-900 dark:text-white bg-white dark:bg-stone-900 px-1.5 py-0.5 rounded shadow-2xs shrink-0">{prevTransit.distKm} km</span>
                    </div>
                  )}
                  {nextTransit && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-stone-100/80 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/80 text-[10px]">
                      <span className="font-extrabold text-stone-700 dark:text-stone-200 flex items-center gap-1 truncate">
                        <span>{nextTransit.icon}</span>
                        <span className="truncate">To {selectedStopIdx === loopedStops.length - 1 ? 'Base' : `Stop ${selectedStopIdx + 1}`}: <b>{nextTransit.label}</b></span>
                      </span>
                      <span className="font-black text-stone-900 dark:text-white bg-white dark:bg-stone-900 px-1.5 py-0.5 rounded shadow-2xs shrink-0">{nextTransit.distKm} km</span>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Action Bar: Prev / Next Navigation + GPS Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200 dark:border-stone-700/80">
                {/* Step Through Route Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleFlyToStop((selectedStopIdx - 1 + loopedStops.length) % loopedStops.length)}
                    className="px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-100 text-xs font-black transition-all flex items-center gap-1"
                    title="Previous Stop"
                  >
                    <span>⬅️</span>
                    <span className="hidden sm:inline">Prev</span>
                  </button>
                  <button
                    onClick={() => handleFlyToStop((selectedStopIdx + 1) % loopedStops.length)}
                    className="px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-100 text-xs font-black transition-all flex items-center gap-1"
                    title="Next Stop"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <span>➔</span>
                  </button>
                </div>

                {/* Direct Navigation Links */}
                <div className="flex items-center gap-1.5">
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white text-xs font-black tracking-wide transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-emerald-500/30 flex items-center gap-1.5 border border-emerald-400/30 active:scale-95"
                  >
                    <span className="text-sm group-hover:-translate-y-0.5 group-hover:scale-11 transition-transform duration-300">📍</span>
                    <span>Google Maps</span>
                  </a>
                  <a
                    href={appleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-xl bg-[#1C1B1B] dark:bg-stone-700 hover:bg-stone-800 text-white text-xs font-black transition-all shadow-md flex items-center gap-1 hover:scale-105"
                    title="Open in Apple Maps"
                  >
                    <span>🍎</span>
                  </a>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Loading Overlay while Leaflet fetches */}
        {!isReady && (
          <div className="absolute inset-0 bg-stone-100/90 backdrop-blur-xs z-20 flex flex-col items-center justify-center text-center p-6">
            <div className="w-8 h-8 rounded-full border-2 border-dashed border-[#FF6B35] animate-spin mb-3" />
            <span className="text-xs font-extrabold text-stone-700">Loading Real-World Map Tiles...</span>
          </div>
        )}
      </div>

      {/* Bottom Footer: Telemetry & Route Stats Bar (Outside map area so zero overlap!) */}
      <div className="bg-[#1C1B1B] text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between shrink-0 flex-wrap gap-2.5 z-30">
        <div className="flex items-center gap-2.5 truncate flex-wrap">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse shrink-0" />
            <span className="font-extrabold tracking-wide truncate">📍 {destinationName}</span>
          </div>
          <span className="text-stone-500 hidden sm:inline">|</span>
          <div className="flex items-center gap-1 text-[#FF8C61] font-extrabold shrink-0">
            <span>🚗</span>
            <span>{routeStats.totalKm} km path</span>
          </div>
          <span className="text-stone-500 hidden sm:inline">|</span>
          <span className="text-stone-300 hidden sm:inline">{routeStats.stopsCount} Waypoints</span>
        </div>

        {/* Live Weather & Time Telemetry Badge inside Bottom Bar */}
        {telemetry ? (
          <div className="flex items-center gap-2 bg-stone-800/90 px-3 py-1 rounded-xl border border-stone-700/80 text-[11px] font-extrabold text-stone-100 shadow-inner shrink-0">
            <span className="text-sm">{telemetry.icon}</span>
            <span className="text-white font-black">{telemetry.city} • <span className="text-[#FF6B35]">{telemetry.temp}</span></span>
            <span className="text-stone-500">•</span>
            <span className="text-stone-300 flex items-center gap-1 font-bold">
              <span>🕒</span>
              <span>{telemetry.localTime}</span>
            </span>
            <span className="text-stone-500">•</span>
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <span>🌅</span>
              <span>Sunset at {telemetry.sunset}</span>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[11px] font-bold text-stone-300 shrink-0">
            <span>Click any pin or top chip to fly inside</span>
          </div>
        )}
      </div>
    </div>
  );

  if (isFullscreen && typeof document !== 'undefined') {
    return createPortal(mapJSX, document.body);
  }

  return mapJSX;
}
