'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function InteractiveRouteMap({
  activities = [],
  destinationName = 'Your Destination',
  coordinates = null
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const layerGroupRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  // 1. Dynamically load Leaflet JS & CSS without SSR issues or version conflicts
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.L) {
      setIsReady(true);
      return;
    }

    // Check if script or css is already inserted
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
      const defaultCenter = coordinates ? [coordinates.lat, coordinates.lng] : [41.9028, 12.4964]; // Default Rome or custom center
      const map = window.L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView(defaultCenter, 13);

      // Add zoom control to top-right
      window.L.control.zoom({ position: 'topright' }).addTo(map);

      // Add CartoDB Voyager modern tile layer (warm, crisp cartography matching TripWise aesthetic)
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      layerGroupRef.current = window.L.layerGroup().addTo(map);
      mapRef.current = map;
    }
  }, [isReady, coordinates]);

  // 3. Update Markers & Polyline when activities or selected day changes
  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current || typeof window === 'undefined' || !window.L) return;

    const L = window.L;
    layerGroupRef.current.clearLayers();

    const validActivities = activities.filter(
      (act) => act.coordinates && typeof act.coordinates.lat === 'number' && typeof act.coordinates.lng === 'number'
    );

    if (validActivities.length === 0) {
      // If no valid coordinates for this day, center on destination center if available
      if (coordinates && typeof coordinates.lat === 'number' && typeof coordinates.lng === 'number') {
        mapRef.current.setView([coordinates.lat, coordinates.lng], 13);
      }
      return;
    }

    const latLngs = [];
    const pinColors = ['#FF6B35', '#0D9488', '#1C1B1B', '#8CA3A8', '#EC6735'];

    validActivities.forEach((act, idx) => {
      const latLng = [act.coordinates.lat, act.coordinates.lng];
      latLngs.push(latLng);

      const color = pinColors[idx % pinColors.length];

      // Custom HTML Marker Pin
      const customIcon = L.divIcon({
        className: 'custom-tripwise-pin',
        html: `
          <div style="
            background-color: ${color};
            width: 36px;
            height: 36px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-weight: 900;
            font-size: 14px;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 12px rgba(28,27,27,0.25);
            transition: transform 0.2s ease;
          ">
            ${idx + 1}
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20]
      });

      const marker = L.marker(latLng, { icon: customIcon }).addTo(layerGroupRef.current);

      const popupContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; padding: 4px; max-width: 220px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: 800; color: #FF6B35; text-transform: uppercase;">${act.time || 'Schedule'}</span>
            ${act.badge ? `<span style="font-size: 9px; font-weight: 800; background: #F5ECE6; color: #4B4745; padding: 2px 6px; border-radius: 4px;">${act.badge}</span>` : ''}
          </div>
          <h4 style="font-size: 13px; font-weight: 900; color: #1C1B1B; margin: 0 0 4px 0; line-height: 1.2;">${act.title || 'Stop ' + (idx + 1)}</h4>
          <p style="font-size: 11px; color: #4B4745; margin: 0; line-height: 1.4;">${act.description || ''}</p>
        </div>
      `;

      marker.bindPopup(popupContent);
    });

    // Draw dashed polyline connecting the day's stops
    if (latLngs.length > 1) {
      const polyline = L.polyline(latLngs, {
        color: '#FF6B35',
        weight: 4,
        opacity: 0.85,
        dashArray: '8, 8',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(layerGroupRef.current);

      mapRef.current.fitBounds(polyline.getBounds(), {
        padding: [50, 50],
        maxZoom: 16,
        animate: true
      });
    } else if (latLngs.length === 1) {
      mapRef.current.setView(latLngs[0], 15, { animate: true });
    }
  }, [activities, coordinates]);

  return (
    <div className="relative w-full h-80 md:h-96 rounded-3xl overflow-hidden border border-stone-200 shadow-md bg-stone-100 flex flex-col">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Loading Overlay while Leaflet fetches */}
      {!isReady && (
        <div className="absolute inset-0 bg-stone-100/90 backdrop-blur-xs z-20 flex flex-col items-center justify-center text-center p-6">
          <div className="w-8 h-8 rounded-full border-2 border-dashed border-[#FF6B35] animate-spin mb-3" />
          <span className="text-xs font-extrabold text-stone-700">Loading Real-World Map Tiles...</span>
        </div>
      )}

      {/* Live Status Badge Overlay */}
      <div className="absolute bottom-4 left-4 right-4 z-20 bg-stone-900/90 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-lg pointer-events-none">
        <div className="flex items-center gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-pulse shrink-0" />
          <span className="truncate">📍 {destinationName} • {activities.length} Stops Plotted</span>
        </div>
        <span className="text-[#FF8C61] font-bold shrink-0 ml-2">Interactive OpenStreetMap</span>
      </div>
    </div>
  );
}
