'use client';

import React, { useEffect, useRef, useState } from 'react';

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
  const [routeStats, setRouteStats] = useState({ totalKm: 0, stopsCount: 0 });

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

  // 2. Initialize Leaflet Map once L is loaded
  useEffect(() => {
    if (!isReady || !mapContainerRef.current || typeof window === 'undefined' || !window.L) return;

    if (!mapRef.current) {
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
    }
  }, [isReady, coordinates]);

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

      validActivities.forEach((act, idx) => {
        const latLng = L.latLng(act.coordinates.lat, act.coordinates.lng);
        if (latLngs.length > 0) {
          totalMeters += latLngs[latLngs.length - 1].distanceTo(latLng);
        }
        latLngs.push(latLng);

        const color = pinColors[idx % pinColors.length];
        const isSelected = selectedStopIdx === idx;

        const customIcon = L.divIcon({
          className: 'custom-tripwise-pin',
          html: `
            <div style="
              background-color: ${isSelected ? '#10B981' : color};
              width: ${isSelected ? '42px' : '36px'};
              height: ${isSelected ? '42px' : '36px'};
              border-radius: ${isSelected ? '14px' : '12px'};
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              font-weight: 900;
              font-size: ${isSelected ? '16px' : '14px'};
              border: ${isSelected ? '3px solid #ffffff' : '2px solid #ffffff'};
              box-shadow: ${isSelected ? '0 0 16px rgba(16, 185, 129, 0.8)' : '0 4px 12px rgba(28,27,27,0.25)'};
              transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
              transform: ${isSelected ? 'scale(1.15) translateY(-4px)' : 'scale(1)'};
            ">
              ${idx + 1}
            </div>
          `,
          iconSize: isSelected ? [42, 42] : [36, 36],
          iconAnchor: isSelected ? [21, 21] : [18, 18],
          popupAnchor: [0, -22]
        });

        const marker = L.marker(latLng, { icon: customIcon }).addTo(layerGroupRef.current);
        markersRef.current[idx] = marker;

        const popupContent = `
          <div style="font-family: system-ui, -apple-system, sans-serif; padding: 6px; min-width: 200px; max-width: 240px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-size: 11px; font-weight: 800; color: #FF6B35; text-transform: uppercase;">${act.time || 'Schedule'}</span>
              ${act.badge ? `<span style="font-size: 9px; font-weight: 800; background: #F5ECE6; color: #4B4745; padding: 2px 6px; border-radius: 4px;">${act.badge}</span>` : ''}
            </div>
            <h4 style="font-size: 14px; font-weight: 900; color: #1C1B1B; margin: 0 0 4px 0; line-height: 1.2;">${act.title || 'Stop ' + (idx + 1)}</h4>
            <p style="font-size: 11px; color: #4B4745; margin: 0 0 8px 0; line-height: 1.4;">${act.description || ''}</p>
            <div style="font-size: 10px; font-weight: 700; color: #0D9488; background: rgba(13, 148, 136, 0.1); padding: 4px 8px; border-radius: 6px; text-align: center;">
              📍 GPS: ${act.coordinates.lat.toFixed(4)}, ${act.coordinates.lng.toFixed(4)}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);

        marker.on('click', () => {
          setSelectedStopIdx(idx);
          mapRef.current.flyTo(latLng, 16, { duration: 1.2, easeLinearity: 0.25 });
        });
      });

      setRouteStats({
        totalKm: (totalMeters / 1000).toFixed(1),
        stopsCount: validActivities.length
      });

      if (selectedStopIdx === null && latLngs.length > 1) {
        const polyline = L.polyline(latLngs, {
          color: '#FF6B35',
          weight: 4.5,
          opacity: 0.9,
          dashArray: '10, 8',
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(layerGroupRef.current);

        mapRef.current.fitBounds(polyline.getBounds(), {
          padding: [60, 60],
          maxZoom: 16,
          animate: true
        });
      } else if (selectedStopIdx === null && latLngs.length === 1) {
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
  }, [isReady, activities, coordinates, selectedStopIdx]);

  // Handle flyTo stop when clicked from interactive top strip or external button
  const handleFlyToStop = (idx) => {
    setSelectedStopIdx(idx);
    const act = activities[idx];
    if (act?.coordinates && mapRef.current && window.L) {
      const latLng = [act.coordinates.lat, act.coordinates.lng];
      mapRef.current.flyTo(latLng, 16, { duration: 1.2, easeLinearity: 0.25 });
      setTimeout(() => {
        markersRef.current[idx]?.openPopup();
      }, 1250);
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

  return (
    <div className={`relative w-full rounded-3xl overflow-hidden border border-stone-200 shadow-md bg-stone-100 flex flex-col transition-all duration-300 ${
      isFullscreen ? 'fixed inset-4 z-50 h-[calc(100vh-2rem)] shadow-2xl' : 'h-96 md:h-[460px]'
    }`}>
      {/* Top Google Maps Style Controls & Layer Switcher */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 flex-wrap max-w-[80%] pointer-events-auto">
        {/* Layer Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs font-extrabold text-[#1C1B1B] shadow-md border border-[rgba(28,27,27,0.1)] flex items-center gap-2 hover:bg-stone-50 transition-all cursor-pointer"
          >
            <span>{MAP_STYLES[mapStyle].icon}</span>
            <span>{MAP_STYLES[mapStyle].name.split(' ')[0]}</span>
            <span className="text-[10px] text-stone-400">▼</span>
          </button>

          {showLayerMenu && (
            <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-stone-200 p-1.5 w-48 flex flex-col gap-1 z-30 animate-fade-in">
              {Object.entries(MAP_STYLES).map(([key, style]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setMapStyle(key);
                    setShowLayerMenu(false);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold w-full text-left transition-all cursor-pointer ${
                    mapStyle === key ? 'bg-[#EC6735] text-white shadow-xs' : 'text-stone-700 hover:bg-stone-100'
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
          className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs font-extrabold text-[#0D9488] shadow-md border border-[rgba(28,27,27,0.1)] hover:bg-[#0D9488]/10 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>🎯</span>
          <span>Fit Route</span>
        </button>

        {/* Fullscreen Toggle */}
        <button
          type="button"
          onClick={() => {
            setIsFullscreen(!isFullscreen);
            setTimeout(() => mapRef.current?.invalidateSize(), 350);
          }}
          className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl text-xs font-extrabold text-[#1C1B1B] shadow-md border border-[rgba(28,27,27,0.1)] hover:bg-stone-100 transition-all cursor-pointer flex items-center gap-1"
        >
          <span>{isFullscreen ? '✕ Exit' : '⛶ Expand'}</span>
        </button>
      </div>

      {/* Interactive Google Maps Style Quick Stop Selector Strip */}
      {activities.length > 0 && (
        <div className="absolute top-16 left-4 right-16 z-20 overflow-x-auto py-1 flex items-center gap-2 pointer-events-auto no-scrollbar">
          {activities.map((act, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleFlyToStop(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-2 shadow-sm cursor-pointer border ${
                selectedStopIdx === idx
                  ? 'bg-[#10B981] text-white border-white scale-105 shadow-md'
                  : 'bg-white/95 backdrop-blur-md text-stone-800 border-stone-200 hover:bg-stone-50'
              }`}
            >
              <span className="w-5 h-5 rounded-lg bg-black/10 flex items-center justify-center text-[10px] font-black">
                {idx + 1}
              </span>
              <span className="truncate max-w-28 sm:max-w-40">{act.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Loading Overlay while Leaflet fetches */}
      {!isReady && (
        <div className="absolute inset-0 bg-stone-100/90 backdrop-blur-xs z-20 flex flex-col items-center justify-center text-center p-6">
          <div className="w-8 h-8 rounded-full border-2 border-dashed border-[#FF6B35] animate-spin mb-3" />
          <span className="text-xs font-extrabold text-stone-700">Loading Real-World Map Tiles...</span>
        </div>
      )}

      {/* Google Maps Style Bottom Telemetry Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-20 bg-stone-900/90 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-lg pointer-events-none flex-wrap gap-2">
        <div className="flex items-center gap-2.5 truncate">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse shrink-0" />
          <span className="font-extrabold tracking-wide truncate">📍 {destinationName}</span>
          <span className="text-stone-400">|</span>
          <span className="text-[#FF8C61] font-extrabold shrink-0">🚗 {routeStats.totalKm} km path</span>
          <span className="text-stone-400 hidden sm:inline">|</span>
          <span className="text-stone-300 hidden sm:inline">{routeStats.stopsCount} Waypoints</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-stone-300 shrink-0">
          <span>Click any pin or top chip to fly inside</span>
        </div>
      </div>
    </div>
  );
}
