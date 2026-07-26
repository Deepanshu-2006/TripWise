'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { WORLD_MAP_PATH } from './WorldMapPath';

// True geographic coordinates for precise placement on the Equirectangular projection
const CITY_LAT_LON = {
  'new york': { lat: 40.7128, lon: -74.0060 },
  'rio de janeiro': { lat: -22.9068, lon: -43.1729 },
  'london': { lat: 51.5074, lon: -0.1278 },
  'paris': { lat: 48.8566, lon: 2.3522 },
  'rome': { lat: 41.9028, lon: 12.4964 },
  'swiss alps': { lat: 46.5595, lon: 8.5618 },
  'marrakech': { lat: 31.6295, lon: -7.9811 },
  'cape town': { lat: -33.9249, lon: 18.4241 },
  'istanbul': { lat: 41.0082, lon: 28.9784 },
  'dubai': { lat: 25.2048, lon: 55.2708 },
  'bali': { lat: -8.4095, lon: 115.1889 },
  'tokyo': { lat: 35.6762, lon: 139.6503 },
  'kyoto': { lat: 35.0116, lon: 135.7681 },
  'sydney': { lat: -33.8688, lon: 151.2093 },
  'queenstown': { lat: -45.0312, lon: 168.6626 },
  'barcelona': { lat: 41.3851, lon: 2.1734 }
};

// Canvas Settings (Matched with D3 Equirectangular logic)
const MAP_WIDTH = 1200;
const MAP_HEIGHT = 600;
// Translate map to center in the 1440x450 canvas container
const OFFSET_X = 120; // (1440 - 1200) / 2
const OFFSET_Y = 20; // Move map down slightly to make plenty of room for Northern flight arcs

function getCityCoords(destName) {
  if (!destName) return null;
  const lower = destName.toLowerCase();
  let coords = null;
  for (const [city, latlon] of Object.entries(CITY_LAT_LON)) {
    if (lower.includes(city)) {
        coords = latlon;
        break;
    }
  }

  // Generic fallback points if unknown, semi-randomized within a bounding box
  if (!coords) {
    let hash = 0;
    for (let i = 0; i < lower.length; i++) hash = lower.charCodeAt(i) + ((hash << 5) - hash);
    return { x: 300 + (Math.abs(hash) % 800), y: 150 + (Math.abs(hash * 3) % 200) };
  }
  
  // Mathematical conversion to Map scale
  const x = ((coords.lon + 180) / 360) * MAP_WIDTH + OFFSET_X;
  const y = ((90 - coords.lat) / 180) * MAP_HEIGHT + OFFSET_Y;
  
  return { x, y };
}

export default function AnimatedFlightMap({ trips = [] }) {
    const [reducedMotion, setReducedMotion] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReducedMotion(mediaQuery.matches);
        const handleChange = (e) => setReducedMotion(e.matches);
        mediaQuery.addEventListener('change', handleChange);

        const handleVisibility = () => setIsVisible(document.visibilityState === 'visible');
        document.addEventListener('visibilitychange', handleVisibility);
        
        return () => {
            mediaQuery.removeEventListener('change', handleChange);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, []);

    const points = useMemo(() => {
        // Sort chronologically and map to coordinates
        const sorted = [...trips].sort((a, b) => new Date(a.startDate || a.created_at) - new Date(b.startDate || b.created_at));
        const pts = [];
        sorted.forEach(t => {
            const coords = getCityCoords(t.destinationName);
            if (coords) pts.push(coords);
        });
        
        // Remove consecutive duplicate locations
        return pts.filter((p, i) => i === 0 || p.x !== pts[i-1].x || p.y !== pts[i-1].y);
    }, [trips]);

    // Generate SVG path connecting points using Great Circle (bowing up)
    const generatePath = (points) => {
        if (points.length < 2) return '';
        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const dist = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
            const midX = (prev.x + curr.x) / 2;
            const midY = (prev.y + curr.y) / 2 - dist * 0.15; // Bow upwards (towards North) without clipping
            d += ` Q ${midX} ${midY} ${curr.x} ${curr.y}`;
        }
        return d;
    };

    const pathD = generatePath(points);
    const shouldAnimate = !reducedMotion && isVisible && points.length >= 2;

    return (
        <div className="absolute inset-0 w-full h-[450px] overflow-hidden pointer-events-none z-0">
            {/* Subtle gradient band */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#FF6B2C]/5 to-transparent" />
            
            {/* World Map Silhouette (Real geographic line art) */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.16]" viewBox="0 0 1440 450" fill="none" preserveAspectRatio="xMidYMin slice">
                <g transform={`translate(${OFFSET_X}, ${OFFSET_Y})`}>
                    <path d={WORLD_MAP_PATH} stroke="#1E1C1A" strokeWidth="1.25" fill="none" />
                </g>
            </svg>

            {/* Flight Path SVG */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 450" fill="none" preserveAspectRatio="xMidYMin slice">
                {/* Drawn Path */}
                {points.length >= 2 && (
                    <>
                        {/* Outer Glow Path */}
                        <path 
                            d={pathD} 
                            stroke="#FF6B2C" 
                            strokeWidth="6" 
                            strokeLinecap="round" 
                            fill="none" 
                            className="opacity-[0.15]"
                            style={{ filter: 'blur(3px)' }}
                        />
                        {/* Core Dashed Path */}
                        <path 
                            id="userFlightPath" 
                            d={pathD} 
                            stroke="#FF6B2C" 
                            strokeWidth="2" 
                            strokeDasharray="4 8" 
                            strokeLinecap="round" 
                            fill="none" 
                            className="opacity-[0.8]"
                        />
                        {shouldAnimate && (
                            <style>
                                {`
                                    @keyframes dashFlow {
                                        to { stroke-dashoffset: -160; }
                                    }
                                    #userFlightPath {
                                        animation: dashFlow 12s linear infinite;
                                    }
                                `}
                            </style>
                        )}
                    </>
                )}

                {/* Waypoints */}
                {points.map((pt, idx) => (
                    <g key={`pin-${idx}`} transform={`translate(${pt.x}, ${pt.y})`}>
                        {shouldAnimate ? (
                            <>
                                {/* Core Dot */}
                                <circle r="4" fill="#FF6B2C" className="opacity-90" />
                                {/* Static Outer Ring */}
                                <circle r="10" fill="none" stroke="#FF6B2C" strokeWidth="1.5" className="opacity-30" />
                                {/* Expanding Radar Pulse */}
                                <circle r="10" fill="none" stroke="#FF6B2C" strokeWidth="1.5" className="opacity-80">
                                    <animate attributeName="r" values="10;28;10" dur="3s" begin={`${idx * 0.5}s`} repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="0.8;0;0" dur="3s" begin={`${idx * 0.5}s`} repeatCount="indefinite" />
                                </circle>
                                <circle r="10" fill="#FF6B2C" className="opacity-20">
                                    <animate attributeName="r" values="10;28;10" dur="3s" begin={`${idx * 0.5}s`} repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="0.3;0;0" dur="3s" begin={`${idx * 0.5}s`} repeatCount="indefinite" />
                                </circle>
                            </>
                        ) : (
                            <>
                                <circle r="4" fill="#FF6B2C" className="opacity-60" />
                                <circle r="10" fill="none" stroke="#FF6B2C" strokeWidth="1.5" className="opacity-20" />
                            </>
                        )}
                    </g>
                ))}

                {/* Traveling Plane and Shadow */}
                {shouldAnimate && points.length >= 2 && (
                    <g className="opacity-100">
                        {/* Shadow plane */}
                        <path 
                            d="M24,12 c0-1.1-1.3-2-2.9-2 h-4.4 L11.2,1.3 C10.9,0.9,10.4,0.5,9.8,0.5 H8.5 C8.1,0.5,7.9,0.8,8,1.2 l2.7,8.8 H4.8 l-2-2.9 C2.6,6.9,2.3,6.7,1.9,6.7 H0.8 C0.5,6.7,0.3,7,0.4,7.3 L1.5,12 L0.4,16.7 C0.3,17,0.5,17.3,0.8,17.3 h1.1 c0.4,0,0.7-0.2,0.9-0.4 l2-2.9 h5.9 l-2.7,8.8 c-0.1,0.4,0.1,0.7,0.5,0.7 h1.3 c0.6,0,1.1-0.4,1.4-0.8 L16.7,14 h4.4 C22.7,14,24,13.1,24,12 Z" 
                            fill="#000" 
                            className="opacity-15" 
                            transform="translate(0, 5) scale(0.65) translate(-12, -12)" 
                            style={{ filter: 'blur(2px)' }} 
                        />
                        
                        {/* Main plane */}
                        <path 
                            d="M24,12 c0-1.1-1.3-2-2.9-2 h-4.4 L11.2,1.3 C10.9,0.9,10.4,0.5,9.8,0.5 H8.5 C8.1,0.5,7.9,0.8,8,1.2 l2.7,8.8 H4.8 l-2-2.9 C2.6,6.9,2.3,6.7,1.9,6.7 H0.8 C0.5,6.7,0.3,7,0.4,7.3 L1.5,12 L0.4,16.7 C0.3,17,0.5,17.3,0.8,17.3 h1.1 c0.4,0,0.7-0.2,0.9-0.4 l2-2.9 h5.9 l-2.7,8.8 c-0.1,0.4,0.1,0.7,0.5,0.7 h1.3 c0.6,0,1.1-0.4,1.4-0.8 L16.7,14 h4.4 C22.7,14,24,13.1,24,12 Z" 
                            fill="#FF6B2C" 
                            transform="scale(0.65) translate(-12, -12)" 
                        />
                        
                        <animateMotion 
                            dur="15s" 
                            repeatCount="indefinite" 
                            rotate="auto"
                            path={pathD}
                        />
                    </g>
                )}
            </svg>

            {/* Soft glow */}
            <div className="absolute -top-[10%] left-[20%] w-[60%] h-[300px] rounded-full bg-[#FF6B2C]/[0.03] blur-[120px]" />
        </div>
    );
}
