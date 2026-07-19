'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { geocodeDestination } from '../actions/geocode';

// Dynamically import react-globe.gl to avoid SSR window errors
const Globe = dynamic(() => import('react-globe.gl'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-sm font-medium text-[#1F1F1F]/40 animate-pulse">
      Initializing 3D Globe...
    </div>
  )
});

const detectDestination = (prompt) => {
  if (!prompt || prompt === 'Global View' || prompt === 'Your Destination') return null;
  const lower = prompt.toLowerCase();

  const match = prompt.match(/(?:in|to|visit|at)\s+([a-zA-Z\s,]+)(?:for|with|during|budget|\.|\b|$)/i);
  if (match && match[1]) {
    const cleanCity = match[1].split(/(?:for|with|during|budget)/i)[0].trim().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
    if (cleanCity.length > 2) return cleanCity;
  }

  if (prompt.length < 30 && !lower.includes("days")) {
    return prompt.trim();
  }
  return null;
};

export default function InteractiveGlobe({
  isGenerating = false,
  isTransitioning = false,
  activeStepText = '',
  destinationName = 'Your Destination',
  targetCoordinates = { lat: 35.0116, lng: 135.7681 }
}) {
  const globeEl = useRef();
  const [dynamicCoords, setDynamicCoords] = useState(null);
  const [windowSize, setWindowSize] = useState({ width: 500, height: 500 });
  const containerRef = useRef();

  // Handle responsive sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setWindowSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Live Geocoding using Server Action
  useEffect(() => {
    let active = true;
    const fetchCoords = async () => {
      const loc = detectDestination(destinationName);
      if (!loc) {
        if (active) setDynamicCoords(null);
        return;
      }

      const coords = await geocodeDestination(loc);
      if (active && coords) {
        setDynamicCoords(coords);
      }
    };

    fetchCoords();

    return () => { active = false; };
  }, [destinationName]);

  const finalCoords = dynamicCoords || targetCoordinates;

  // Fly to location when coordinates change or when transitioning
  useEffect(() => {
    if (globeEl.current) {
      // Enable auto-rotation for the globe controls
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
      globeEl.current.controls().enableZoom = true;

      if (dynamicCoords) {
        // Stop auto-rotate when zooming in on a specific location
        globeEl.current.controls().autoRotate = false;
        globeEl.current.pointOfView({
          lat: dynamicCoords.lat,
          lng: dynamicCoords.lng,
          altitude: isTransitioning ? 0.01 : (isGenerating ? 1.5 : 1.2)
        }, isTransitioning ? 1000 : 1500); // 1.5s animation, or 1s plunge
      } else {
        // Zoomed out initial state
        globeEl.current.pointOfView({
          lat: targetCoordinates.lat,
          lng: targetCoordinates.lng,
          altitude: isTransitioning ? 0.01 : 2.8
        }, isTransitioning ? 1000 : 1500);
      }
    }
  }, [dynamicCoords, targetCoordinates.lat, targetCoordinates.lng, isGenerating, isTransitioning]);

  // Marker data (only show marker if we have dynamic coords, and not generating)
  const markerData = (dynamicCoords && !isGenerating) ? [
    {
      lat: finalCoords.lat,
      lng: finalCoords.lng,
      color: '#FF6B2C'
    }
  ] : [];

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-100 flex items-center justify-center relative overflow-hidden cursor-grab active:cursor-grabbing"
    >
      <Globe
        ref={globeEl}
        width={windowSize.width}
        height={windowSize.height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-day.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        backgroundColor="rgba(0,0,0,0)" // Transparent background
        htmlElementsData={markerData}
        htmlElement={(d) => {
          const el = document.createElement('div');
          el.innerHTML = `
            <div class="relative flex items-center justify-center" style="transform: translate(-50%, -50%)">
              <div class="w-5 h-5 bg-[#FF6B2C] rounded-full shadow-[0_0_15px_#FF6B2C]"></div>
              <div class="absolute w-12 h-12 bg-[#FF6B2C]/30 rounded-full animate-ping"></div>
            </div>
          `;
          return el;
        }}
      />

    </div>
  );
}
