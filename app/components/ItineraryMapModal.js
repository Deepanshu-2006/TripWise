'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  getActivityThumbnail,
  getActivityRating,
  getCategoryStyling,
  getAiInsight,
  formatCost
} from './itineraryHelpers';

// ── Leaflet CSS (injected once globally) ───────────────────────────────────────
let leafletCssInjected = false;
function ensureLeafletCss() {
  if (leafletCssInjected || typeof document === 'undefined') return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
  leafletCssInjected = true;
}

// ── Map tile styles — matches InteractiveRouteMap exactly ─────────────────────
const MAP_STYLES = {
  streets: {
    name: 'Streets',
    icon: '🗺️',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
    maxZoom: 19
  },
  satellite: {
    name: 'Satellite',
    icon: '🛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    subdomains: '',
    maxZoom: 18
  },
  dark: {
    name: 'Dark',
    icon: '🌙',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
    maxZoom: 19
  },
  terrain: {
    name: 'Terrain',
    icon: '🏔️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    subdomains: '',
    maxZoom: 18
  }
};

// Category hex colors — always real hex values (never Tailwind class strings)
const CATEGORY_COLORS = {
  dining: '#E8701A',
  restaurant: '#E8701A',
  food: '#E8701A',
  cafe: '#E8701A',
  culture: '#8B5CF6',
  museum: '#8B5CF6',
  art: '#8B5CF6',
  gallery: '#8B5CF6',
  nature: '#16A34A',
  park: '#16A34A',
  garden: '#16A34A',
  hike: '#16A34A',
  shopping: '#EC4899',
  market: '#EC4899',
  shop: '#EC4899',
  landmark: '#2DD4BF',
  attraction: '#2DD4BF',
  sightseeing: '#2DD4BF',
  entertainment: '#3B82F6',
  night: '#3B82F6',
};

const getCategoryMeta = (activity) => {
  if (!activity || activity.isBasecamp) return { icon: '🏨', label: 'Basecamp Hub', bg: '#1E293B' };
  const cat = (activity.category || activity.type || '').toLowerCase();
  const icon_map = {
    dining: '🍽️', restaurant: '🍽️', food: '🍽️', cafe: '☕',
    culture: '🎨', museum: '🏛️', art: '🖼️', gallery: '🖼️',
    nature: '🌿', park: '🌳', garden: '🌸', hike: '🥾',
    shopping: '🛍️', market: '🧺', shop: '🏪',
    landmark: '🗿', attraction: '⭐', sightseeing: '👁️',
    entertainment: '🎭', night: '🌙',
  };
  const matchedKey = Object.keys(CATEGORY_COLORS).find(k => cat.includes(k));
  const bg = matchedKey ? CATEGORY_COLORS[matchedKey] : '#BA5536';
  const icon = matchedKey ? (icon_map[matchedKey] || '📍') : '📍';
  const style = getCategoryStyling(activity);
  return { icon: style?.icon || icon, label: style?.name || 'Attraction', bg };
};

// ── Transit telemetry ──────────────────────────────────────────────────────────
const getTransitInfo = (p1, p2) => {
  if (!p1 || !p2 || typeof window === 'undefined' || !window.L) return null;
  const distM = window.L.latLng(p1.lat, p1.lng).distanceTo(window.L.latLng(p2.lat, p2.lng)) * 1.28;
  const distKm = (distM / 1000).toFixed(1);
  if (distM < 1800) return { icon: '🚶', label: `${Math.max(2, Math.round(distM / 80))} min walk`, distKm, color: '#0D9488' };
  if (distM < 15000) return { icon: '🚕', label: `${Math.max(5, Math.round(distM / 400 + 3))} min taxi`, distKm, color: '#EA580C' };
  return { icon: '🚆', label: `${Math.max(15, Math.round(distM / 700 + 8))} min transit`, distKm, color: '#7C3AED' };
};

// ── Hero image helper ─────────────────────────────────────────────────────────
const getHeroImage = (act, destName, isBasecamp) => {
  if (act?.image || act?.photoUrl || act?.imageUrl || act?.thumbnail)
    return act.image || act.photoUrl || act.imageUrl || act.thumbnail;
  if (isBasecamp) return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';
  return getActivityThumbnail(act, 0);
};

export default function ItineraryMapModal({ activities = [], coordinates = null, destinationName = 'Destination' }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const layerGroupRef = useRef(null);
  const markersRef = useRef({});
  const animFrameRef = useRef(null);

  const [isReady, setIsReady] = useState(false);
  const [mapStyle, setMapStyle] = useState('streets');
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [activePanel, setActivePanel] = useState(null); // { act, stopIndex, isBasecamp, meta }
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [routeStats, setRouteStats] = useState({ stops: 0, km: '0.0' });

  const center = coordinates ? [coordinates.lat, coordinates.lng] : [41.9028, 12.4964];

  // ── CSS keyframe injection for marker pulse ───────────────────────────────
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById('itinerary-map-styles')) return;
    const style = document.createElement('style');
    style.id = 'itinerary-map-styles';
    style.textContent = `
      @keyframes imap-appear { 0% { opacity:0; transform:scale(0.5) translateY(6px); } 100% { opacity:1; transform:scale(1) translateY(0); } }
      .imap-marker { animation: imap-appear 0.38s cubic-bezier(0.34,1.56,0.64,1) both; }
      .leaflet-control-zoom a { background:#18181B!important; border-color:#3F3F46!important; color:#fff!important; }
      .leaflet-control-zoom a:hover { background:#27272A!important; border-color:#BA5536!important; color:#BA5536!important; }
      .leaflet-control-attribution { background:rgba(250,246,240,0.8)!important; backdrop-filter:blur(6px); font-size:10px!important; }
    `;
    document.head.appendChild(style);
  }, []);

  // ── 1. Init Leaflet map once ───────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;
    let alive = true;

    const init = async () => {
      ensureLeafletCss();
      if (!window.L) {
        await new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
      }
      if (!alive || !containerRef.current) return;
      const L = window.L;

      const map = L.map(containerRef.current, {
        center, zoom: 13,
        zoomControl: false,
        attributionControl: false
      });
      L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const st = MAP_STYLES.streets;
      tileLayerRef.current = L.tileLayer(st.url, { subdomains: st.subdomains, maxZoom: st.maxZoom }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setIsReady(true);
    };

    init().catch(console.warn);
    return () => {
      alive = false;
      if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
      layerGroupRef.current = null;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      setIsReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 2. Plot stops whenever activities / ready changes ─────────────────────
  useEffect(() => {
    if (!isReady || !mapRef.current || !window.L || !layerGroupRef.current) return;
    const L = window.L;
    const map = mapRef.current;
    const lg = layerGroupRef.current;

    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
    lg.clearLayers();
    markersRef.current = {};

    if (!activities?.length) { map.setView(center, 13); return; }

    const validActs = activities.filter(a => a?.coordinates?.lat && a?.coordinates?.lng);
    if (!validActs.length) { map.setView(center, 13); return; }

    // Build looped stop list: basecamp → stops → basecamp
    const basecampStop = {
      isBasecamp: true,
      title: `${destinationName.split(',')[0]} Basecamp`,
      coordinates: { lat: center[0], lng: center[1] }
    };
    const loopedStops = [basecampStop, ...validActs, { ...basecampStop, isReturn: true }];

    // Filter out any LatLng with NaN values to prevent Leaflet projection crash
    const rawLatLngs = loopedStops.map(s => L.latLng(s.coordinates.lat, s.coordinates.lng));
    const latLngs = rawLatLngs.filter(ll => ll && Number.isFinite(ll.lat) && Number.isFinite(ll.lng));
    if (latLngs.length < 2) { map.setView([center[0], center[1]], 13); return; }

    // ── Route layers — 4-layer system matching InteractiveRouteMap exactly ──
    const routeColor = '#EC6735';
    const routeGlow  = 'rgba(236,103,53,0.45)';

    // Layer 1: Wide outer glow
    L.polyline(latLngs, {
      color: routeGlow, weight: 14,
      opacity: 0.30, lineCap: 'round', lineJoin: 'round'
    }).addTo(lg);

    // Layer 2: Inner glow
    L.polyline(latLngs, {
      color: routeGlow, weight: 8,
      opacity: 0.50, lineCap: 'round', lineJoin: 'round'
    }).addTo(lg);

    // Layer 3: Solid premium route line
    L.polyline(latLngs, {
      color: routeColor, weight: 4,
      opacity: 0.96, lineCap: 'round', lineJoin: 'round'
    }).addTo(lg);

    // Layer 4: Direction arrows at midpoints
    for (let i = 0; i < latLngs.length - 1; i++) {
      const p1 = latLngs[i], p2 = latLngs[i + 1];
      if (!p1 || !p2) continue;
      const mid = L.latLng((p1.lat + p2.lat) / 2, (p1.lng + p2.lng) / 2);
      const angle = Math.atan2(p2.lat - p1.lat, (p2.lng - p1.lng) * Math.cos(p1.lat * Math.PI / 180)) * (-180 / Math.PI) + 90;
      L.marker(mid, {
        icon: L.divIcon({
          className: '',
          html: `<div style="transform:rotate(${angle}deg);color:#fff;font-size:11px;font-weight:900;width:22px;height:22px;background:${routeColor};border:2px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.35)">➤</div>`,
          iconSize: [22, 22], iconAnchor: [11, 11]
        }),
        interactive: false
      }).addTo(lg);
    }

    // Layer 5: Animated travel dot moving elegantly along the route
    if (latLngs.length > 1) {
      const dotIcon = L.divIcon({
        className: '',
        html: `<div style="width:12px;height:12px;background:#FFFFFF;border:2.5px solid ${routeColor};border-radius:50%;box-shadow:0 0 12px ${routeColor},0 2px 6px rgba(0,0,0,0.4)"></div>`,
        iconSize: [12, 12], iconAnchor: [6, 6]
      });
      const dotMarker = L.marker([latLngs[0].lat, latLngs[0].lng], {
        icon: dotIcon, interactive: false, zIndexOffset: 2000
      }).addTo(lg);

      let progress = 0;
      const animateDot = () => {
        if (!dotMarker._map || !mapRef.current || !lg) return;
        progress += 0.003;
        if (progress >= 1) progress = 0;
        const totalSeg = latLngs.length - 1;
        const exactPos = progress * totalSeg;
        const segIdx = Math.floor(exactPos);
        const t = exactPos - segIdx;
        const p1 = latLngs[segIdx];
        const p2 = latLngs[Math.min(segIdx + 1, latLngs.length - 1)];
        if (p1 && p2 && Number.isFinite(p1.lat) && Number.isFinite(p2.lat)) {
          dotMarker.setLatLng([p1.lat + (p2.lat - p1.lat) * t, p1.lng + (p2.lng - p1.lng) * t]);
        }
        animFrameRef.current = requestAnimationFrame(animateDot);
      };
      animFrameRef.current = requestAnimationFrame(animateDot);
    }

    // Route stats
    let totalM = 0;
    for (let i = 0; i < latLngs.length - 1; i++) totalM += latLngs[i].distanceTo(latLngs[i + 1]);
    setRouteStats(prev => {
      const km = (totalM / 1000).toFixed(1);
      const stops = validActs.length;
      if (prev.km === km && prev.stops === stops) return prev;
      return { stops, km };
    });

    // Markers
    loopedStops.forEach((stop, idx) => {
      if (stop.isReturn) return;
      if (!stop?.coordinates?.lat || !stop?.coordinates?.lng) return;
      const isBasecamp = !!stop.isBasecamp;
      const stopNum = idx;
      const meta = getCategoryMeta(stop);
      const latlng = L.latLng(stop.coordinates.lat, stop.coordinates.lng);

      // Teardrop pin — same shape/gradient as InteractiveRouteMap
      // Always use real hex bg — never Tailwind class strings
      const pinBg = isBasecamp ? '#1E293B' : (meta.bg.startsWith('#') ? meta.bg : '#BA5536');
      const pinGrad = isBasecamp
        ? 'linear-gradient(135deg,#334155,#0F172A)'
        : `linear-gradient(135deg,${pinBg},#1E293B)`;

      const pinSize = isBasecamp ? 44 : 36;
      const bodySize = isBasecamp ? 40 : 32;
      const animDelay = `${idx * 0.045}s`;
      const html = [
        `<div style="position:relative;width:${pinSize}px;height:${pinSize + 12}px;display:flex;align-items:flex-start;justify-content:center;cursor:pointer;animation:imap-appear 0.38s cubic-bezier(0.34,1.56,0.64,1) ${animDelay} both">`,
          `<div style="width:${bodySize}px;height:${bodySize}px;background:${pinGrad};border:2.5px solid #FAF6F0;border-radius:50% 50% 50% 2px;transform:rotate(-45deg);box-shadow:0 6px 20px rgba(0,0,0,0.35),0 2px 6px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center">`,
            `<div style="transform:rotate(45deg);color:#fff;font-size:${isBasecamp ? 16 : 12}px;font-weight:800;font-family:Georgia,serif;line-height:1;user-select:none">${isBasecamp ? meta.icon : idx}</div>`,
          `</div>`,
          `<div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:6px;height:6px;background:rgba(0,0,0,0.18);border-radius:50%;filter:blur(2px)"></div>`,
        `</div>`
      ].join('');

      const icon = L.divIcon({
        html, className: '',
        iconSize: [pinSize, pinSize + 12],
        iconAnchor: [pinSize / 2, pinSize + 10]
      });

      const marker = L.marker(latlng, { icon }).addTo(lg);
      marker.on('click', () => {
        setHeroLoaded(false);
        setActivePanel({ act: stop, stopIndex: idx, isBasecamp, meta, latlng, allStops: loopedStops });
        map.panTo(latlng, { animate: true, duration: 0.5 });
      });
      markersRef.current[idx] = marker;
    });

    // Fit bounds
    const bounds = L.latLngBounds(latLngs);
    if (bounds.isValid()) {
      map.flyToBounds(bounds, { paddingTopLeft: [40, 80], paddingBottomRight: [40, activePanel ? 240 : 60], maxZoom: 15, animate: true, duration: 0.9 });
    }

    // Cleanup: cancel RAF when activities change or component unmounts
    return () => {
      if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, activities, center[0], center[1], destinationName]);

  // ── 3. Tile layer swap ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isReady || !mapRef.current || !window.L) return;
    const L = window.L;
    if (tileLayerRef.current) mapRef.current.removeLayer(tileLayerRef.current);
    const st = MAP_STYLES[mapStyle];
    tileLayerRef.current = L.tileLayer(st.url, { subdomains: st.subdomains, maxZoom: st.maxZoom }).addTo(mapRef.current);
    layerGroupRef.current?.eachLayer(l => l.bringToFront?.());
  }, [mapStyle, isReady]);

  // ── Fit route ─────────────────────────────────────────────────────────────
  const handleFitRoute = useCallback(() => {
    if (!mapRef.current || !window.L || !layerGroupRef.current) return;
    const lls = [];
    layerGroupRef.current.eachLayer(l => { if (l.getLatLng) lls.push(l.getLatLng()); });
    if (lls.length > 1) {
      mapRef.current.flyToBounds(window.L.latLngBounds(lls), {
        paddingTopLeft: [40, 80], paddingBottomRight: [40, 60], maxZoom: 15, animate: true, duration: 0.8
      });
    }
    setActivePanel(null);
  }, []);

  // ── Panel close ───────────────────────────────────────────────────────────
  const handleClosePanel = () => {
    setActivePanel(null);
    if (mapRef.current && window.L && layerGroupRef.current) {
      const lls = [];
      layerGroupRef.current.eachLayer(l => { if (l.getLatLng) lls.push(l.getLatLng()); });
      if (lls.length > 1) {
        mapRef.current.flyToBounds(window.L.latLngBounds(lls), {
          paddingTopLeft: [40, 80], paddingBottomRight: [40, 60], maxZoom: 15, animate: true, duration: 0.8
        });
      }
    }
  };

  // ── Panel data ────────────────────────────────────────────────────────────
  const renderPanel = () => {
    if (!activePanel) return null;
    const { act, stopIndex, isBasecamp, meta, allStops } = activePanel;
    const heroUrl = getHeroImage(act, destinationName, isBasecamp);
    const ratingInfo = getActivityRating(act, stopIndex || 0);
    const costInfo = formatCost(act);
    const aiTip = getAiInsight(act, stopIndex || 0);
    const stopLabel = isBasecamp ? 'Anchor Hub' : `Stop ${stopIndex} of ${(allStops?.length || 2) - 2}`;

    let transitInfo = null;
    if (!isBasecamp && stopIndex > 0 && allStops?.[stopIndex - 1]?.coordinates && act?.coordinates) {
      transitInfo = getTransitInfo(allStops[stopIndex - 1].coordinates, act.coordinates);
    }

    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((act.title || 'Stop') + ' ' + (act.location || destinationName))}`;

    return (
      <div className="absolute bottom-4 right-3 left-3 sm:left-auto sm:w-96 max-w-[95vw] max-h-[72vh] z-850 bg-white rounded-3xl border border-[#ECE8E2] shadow-[0_24px_64px_rgba(0,0,0,0.16)] overflow-y-auto pointer-events-auto flex flex-col text-[#1F1F1F] animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200">
        {/* Pointer triangle */}
        <div className="hidden sm:block absolute -left-2.5 top-24 w-5 h-5 bg-white border-l border-b border-[#ECE8E2] rotate-45 pointer-events-none shadow-[-3px_3px_8px_rgba(0,0,0,0.04)] z-50" />

        {/* Hero image */}
        <div className="w-full h-36 relative bg-[#FAF8F5] overflow-hidden shrink-0 rounded-t-3xl group">
          {!heroLoaded && <div className="absolute inset-0 bg-linear-to-br from-[#ECE8E2] to-[#FAF8F5] animate-pulse" />}
          <img src={heroUrl} alt={act.title} onLoad={() => setHeroLoaded(true)}
            className={`w-full h-full object-cover transition-opacity duration-500 group-hover:scale-105 ${heroLoaded ? 'opacity-100' : 'opacity-0'}`} />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/15 to-transparent pointer-events-none" />

          {/* Category + stop number badges */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
            <span className="px-2.5 py-1 bg-black/55 backdrop-blur-md text-white text-[11px] font-bold rounded-full border border-white/20 flex items-center gap-1">
              <span>{meta.icon}</span><span>{meta.label}</span>
            </span>
            <span className="px-2 py-1 bg-[#BA5536]/90 backdrop-blur-md text-white text-[11px] font-bold rounded-full">{stopLabel}</span>
          </div>

          {/* Close button */}
          <button onClick={handleClosePanel}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/55 hover:bg-black/80 backdrop-blur-md text-white border border-white/20 flex items-center justify-center text-xs font-bold transition-all hover:scale-110 active:scale-90 z-20 cursor-pointer">
            ✕
          </button>

          {/* Title overlay */}
          <div className="absolute bottom-2.5 left-4 right-4 z-10">
            <h3 className="text-base font-bold text-white leading-tight line-clamp-2 drop-shadow">
              {act.title || (isBasecamp ? `${destinationName} Basecamp` : `Stop ${stopIndex}`)}
            </h3>
            {act.location && <p className="text-[11px] text-white/80 mt-0.5 truncate">{act.location}</p>}
          </div>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col gap-3.5">
          {/* Quick stats row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-1.5 bg-white/90 rounded-full border border-black/6 shadow-sm text-[11px] font-bold flex items-center gap-1">
              <span className="text-yellow-500">★</span>{ratingInfo.rating} ({ratingInfo.reviews})
            </span>
            {costInfo?.display && (
              <span className="px-2.5 py-1.5 bg-white/90 rounded-full border border-black/6 shadow-sm text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                💰 {costInfo.display}
              </span>
            )}
            {transitInfo && (
              <span className="px-2.5 py-1.5 bg-white/90 rounded-full border border-black/6 shadow-sm text-[11px] font-bold flex items-center gap-1" style={{ color: transitInfo.color }}>
                {transitInfo.icon} {transitInfo.label}
              </span>
            )}
            {act.time && (
              <span className="px-2.5 py-1.5 bg-white/90 rounded-full border border-black/6 shadow-sm text-[11px] font-bold text-[#6B6B6B] flex items-center gap-1">
                🕐 {act.time}
              </span>
            )}
          </div>

          {/* AI insight */}
          {aiTip && (
            <div className="bg-linear-to-br from-[#FFF8F3] to-[#FFECE2]/40 border border-[#BA5536]/25 rounded-2xl p-3 text-xs text-[#3F3F3F] leading-relaxed">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-lg bg-[#BA5536] text-white flex items-center justify-center text-[10px] shrink-0 font-bold">✦</div>
                <p>{aiTip}</p>
              </div>
            </div>
          )}

          {/* Description */}
          {act.description && (
            <p className="text-xs text-[#4A4A4A] leading-relaxed line-clamp-3">{act.description}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-0.5">
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
              className="flex-1 bg-linear-to-r from-[#BA5536] to-[#9C4124] hover:from-[#C4614A] hover:to-[#AB4C33] text-white font-semibold rounded-xl px-3 h-10 flex items-center justify-center shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200 text-xs text-center cursor-pointer gap-1.5">
              <span>Open in Maps</span>
              <span className="text-[10px]">↗</span>
            </a>
            <button onClick={handleClosePanel}
              className="h-10 px-4 rounded-xl bg-[#FAF8F5] border border-[#ECE8E2] text-[#6B6B6B] text-xs font-semibold hover:border-[#BA5536]/40 hover:text-[#BA5536] transition-all duration-200 cursor-pointer active:scale-95">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-full bg-[#FAF6F0]">
      {/* Leaflet map container */}
      <div ref={containerRef} className="w-full h-full" style={{ isolation: 'isolate' }} />

      {/* Top bar — matches InteractiveRouteMap layout */}
      <div className="absolute top-4 inset-x-4 z-500 flex items-center justify-between gap-2 pointer-events-none">
        {/* Route stats */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-[14px] border border-[rgba(0,0,0,0.06)] shadow-md flex items-center gap-2.5 text-[#1F1F1F]">
          <span className="text-[11px] font-semibold flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-[#BA5536]/15 text-[#BA5536] flex items-center justify-center text-[10px]">📍</span>
            {routeStats.stops} {routeStats.stops === 1 ? 'Stop' : 'Stops'}
          </span>
          <div className="w-px h-4 bg-[#ECE8E2]" />
          <span className="text-[11px] font-semibold flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-[#BA5536]/15 text-[#BA5536] flex items-center justify-center text-[10px]">🚶</span>
            {routeStats.km} km
          </span>
        </div>

        {/* Right controls */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          {/* Fit Route */}
          <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-[14px] border border-[rgba(0,0,0,0.06)] shadow-md">
            <button onClick={handleFitRoute}
              className="h-8 px-3.5 rounded-xl text-[11px] font-semibold text-[#BA5536] bg-white border border-[#ECE8E2] shadow-sm hover:bg-[#BA5536] hover:text-white hover:border-[#BA5536] transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-1.5">
              🎯 <span>Fit Route</span>
            </button>
          </div>

          {/* Map style switcher */}
          <div className="relative">
            <button onClick={() => setShowStyleMenu(v => !v)}
              className={`h-8 px-3 rounded-[14px] text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer border shadow-md transition-all duration-200 active:scale-95 ${
                showStyleMenu ? 'bg-[#BA5536] text-white border-[#BA5536]' : 'bg-white/95 backdrop-blur-md text-[#1F1F1F] border-[rgba(0,0,0,0.06)] hover:border-[#BA5536]/50 hover:text-[#BA5536]'
              }`}>
              {MAP_STYLES[mapStyle].icon}
              <span className="hidden sm:inline">{MAP_STYLES[mapStyle].name}</span>
              <span className="text-[9px] opacity-60">▼</span>
            </button>
            {showStyleMenu && (
              <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-xl border border-[#ECE8E2] p-2 w-44 flex flex-col gap-1 z-600 animate-in fade-in zoom-in-95 duration-150">
                <span className="text-[10px] font-semibold text-[#8B8B8B] uppercase tracking-wider px-2 pt-1 pb-0.5">Map Style</span>
                {Object.entries(MAP_STYLES).map(([key, s]) => (
                  <button key={key} onClick={() => { setMapStyle(key); setShowStyleMenu(false); }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-medium cursor-pointer transition-all ${
                      mapStyle === key ? 'bg-[#BA5536] text-white' : 'hover:bg-[#F7F5F2] text-[#1F1F1F]'
                    }`}>
                    <span>{s.icon}</span>{s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating detail panel */}
      {renderPanel()}

      {/* Loading overlay */}
      {!isReady && (
        <div className="absolute inset-0 z-600 bg-[#FAF6F0] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#BA5536]/30 border-t-[#BA5536] animate-spin" />
            <span className="text-xs font-serif text-[#7A7268]">Loading map…</span>
          </div>
        </div>
      )}
    </div>
  );
}
