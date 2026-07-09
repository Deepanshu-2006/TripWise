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
          opacity: 0.95,
          dashArray: '14, 14',
          lineCap: 'round',
          lineJoin: 'round',
          className: 'animated-route-flow'
        }).addTo(layerGroupRef.current);

        // 3. Directional Arrowheads along midpoints between sequential stops
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
                color: #EC6735;
                font-size: 13px;
                font-weight: 900;
                filter: drop-shadow(0 2px 4px rgba(28,27,27,0.35));
                display: flex;
                align-items: center;
                justify-content: center;
                width: 22px;
                height: 22px;
                background: #FFF8F5;
                border: 2px solid #EC6735;
                border-radius: 50%;
                box-shadow: 0 2px 6px rgba(236,103,53,0.3);
              ">
                ➤
              </div>
            `,
            iconSize: [22, 22],
            iconAnchor: [11, 11]
          });

          L.marker([midLat, midLng], { icon: arrowIcon, interactive: false }).addTo(layerGroupRef.current);
        }

        // Only auto-fit route bounds if user hasn't explicitly clicked and locked onto a specific stop
        if (selectedStopIdx === null) {
          mapRef.current.fitBounds(animatedPolyline.getBounds(), {
            padding: [60, 60],
            maxZoom: 16,
            animate: true
          });
        }
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
    <div className={`overflow-hidden border border-stone-200 shadow-md bg-white flex flex-col transition-all duration-300 ${
      isFullscreen ? 'fixed inset-0 z-[9999] w-screen h-screen rounded-none shadow-2xl' : 'relative w-full rounded-3xl h-[460px] md:h-[540px]'
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

        {/* Row 2: Quick Stop Selector Strip (Clicking any chip flies to that stop) */}
        {activities.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-0.5 pb-1 no-scrollbar">
            {activities.map((act, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleFlyToStop(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-2 shadow-2xs cursor-pointer border ${
                  selectedStopIdx === idx
                    ? 'bg-[#10B981] text-white border-[#059669] scale-102 shadow-md'
                    : 'bg-stone-50 text-stone-800 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black ${
                  selectedStopIdx === idx ? 'bg-black/15 text-white' : 'bg-stone-200 text-stone-700'
                }`}>
                  {idx + 1}
                </span>
                <span className="truncate max-w-32 sm:max-w-48">{act.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Container (Pure, unobstructed 100% canvas space) */}
      <div className="relative w-full flex-1 min-h-[260px] z-10">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Loading Overlay while Leaflet fetches */}
        {!isReady && (
          <div className="absolute inset-0 bg-stone-100/90 backdrop-blur-xs z-20 flex flex-col items-center justify-center text-center p-6">
            <div className="w-8 h-8 rounded-full border-2 border-dashed border-[#FF6B35] animate-spin mb-3" />
            <span className="text-xs font-extrabold text-stone-700">Loading Real-World Map Tiles...</span>
          </div>
        )}
      </div>

      {/* Bottom Footer: Telemetry & Route Stats Bar (Outside map area so zero overlap!) */}
      <div className="bg-[#1C1B1B] text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between shrink-0 flex-wrap gap-2 z-30">
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
