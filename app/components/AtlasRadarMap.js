'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Star rating helper
function Stars({ rating }) {
  const full = Math.floor(rating);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`text-xs ${i < full ? 'text-amber-400 font-bold' : 'text-stone-600'}`}
        >
          ★
        </span>
      ))}
      <span className="text-xs font-extrabold text-white ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

// Convert lat/lng to SVG coordinates in a 1000x500 map viewBox
function coordsToXY(lat, lng) {
  const minLat = -55, maxLat = 65;
  const minLng = -125, maxLng = 175;
  
  const clat = Math.max(minLat, Math.min(maxLat, lat));
  const clng = Math.max(minLng, Math.min(maxLng, lng));
  
  const x = ((clng - minLng) / (maxLng - minLng)) * 940 + 30; // 30px padding
  const y = ((maxLat - clat) / (maxLat - minLat)) * 440 + 30;
  return { x, y };
}

export default function AtlasRadarMap({ destinations = [], onCardClick }) {
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  // Two-way sync: prioritize hovered item for temporary preview, fallback to selected, then first item
  const activeDest = destinations.find(d => d.id === (hoveredId || selectedId)) || destinations[0];
  const lockedCoordsCount = destinations.filter(d => d.coords).length;

  const handleSelect = (dest) => {
    setSelectedId(dest.id === selectedId ? null : dest.id);
  };

  const getCrowdBadgeStyle = (crowd) => {
    if (!crowd) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    if (crowd.includes('Low')) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    if (crowd.includes('Moderate')) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
  };

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 items-stretch">
      {/* ─── LEFT PANEL: RADAR MAP VIEW ─── */}
      <div className="lg:w-7/12 xl:w-2/3 bg-[#0B0F17] border border-cyan-500/20 rounded-3xl p-5 sm:p-6 relative overflow-hidden shadow-2xl min-h-120 sm:min-h-140 flex flex-col justify-between">
        {/* Futuristic Dot Grid Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
        
        {/* Animated Rotating Radar Scan Beam Line */}
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none overflow-hidden"
          style={{ transformOrigin: 'center center' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
        >
          <div className="w-1/2 h-1/2 origin-bottom-right bg-gradient-to-tl from-cyan-500/25 via-cyan-500/05 to-transparent clip-path-radar" 
               style={{ clipPath: 'polygon(100% 100%, 0 0, 0 100%)' }} />
        </motion.div>

        {/* Concentric Radar Target Rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-cyan-500/10 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-cyan-500/15 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border border-cyan-500/20 pointer-events-none" />

        {/* Top HUD Header */}
        <div className="relative z-10 flex items-center justify-between pb-4 border-b border-cyan-500/20">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
            </span>
            <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
              AI TELEMETRY RADAR • ACTIVE FLIGHT VECTOR
            </span>
          </div>
          <div className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-500/30 flex items-center gap-1.5 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{lockedCoordsCount} COORDINATES LOCKED</span>
          </div>
        </div>

        {/* Interactive SVG World Map Canvas */}
        <div className="relative flex-1 my-4 w-full flex items-center justify-center">
          <svg viewBox="0 0 1000 500" className="w-full h-full max-h-110 overflow-visible select-none">
            {/* World Map Continent Silhouettes */}
            <g className="opacity-25 fill-cyan-950/40 stroke-cyan-500/30 stroke-[0.75]">
              {/* North America */}
              <path d="M 120 80 Q 200 60 280 100 T 320 180 T 220 250 T 140 180 Z" />
              {/* South America */}
              <path d="M 280 260 Q 340 300 320 400 T 250 440 T 260 320 Z" />
              {/* Europe & Asia */}
              <path d="M 450 70 Q 600 50 850 80 T 920 220 T 750 300 T 550 200 Z" />
              {/* Africa */}
              <path d="M 460 210 Q 560 220 580 340 T 500 420 T 450 300 Z" />
              {/* Australia */}
              <path d="M 780 340 Q 880 330 900 400 T 800 440 Z" />
            </g>

            {/* Latitude & Longitude Coordinate Lines */}
            <g className="opacity-15 stroke-cyan-400 stroke-[0.5] fill-none">
              <line x1="0" y1="250" x2="1000" y2="250" strokeDasharray="4 4" />
              <line x1="500" y1="0" x2="500" y2="500" strokeDasharray="4 4" />
              <circle cx="500" cy="250" r="220" strokeDasharray="2 6" />
              <circle cx="500" cy="250" r="140" strokeDasharray="2 6" />
            </g>

            {/* Arc Flight Path Lines */}
            {activeDest && activeDest.coords && destinations.map((d) => {
              if (d.id === activeDest.id || !d.coords) return null;
              const start = coordsToXY(activeDest.coords.lat, activeDest.coords.lng);
              const end = coordsToXY(d.coords.lat, d.coords.lng);
              const midX = (start.x + end.x) / 2;
              const midY = Math.min(start.y, end.y) - 60;
              const isActive = d.id === (hoveredId || selectedId);
              return (
                <g key={`path-group-${activeDest.id}-${d.id}`}>
                  <motion.path
                    d={`M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`}
                    fill="transparent"
                    stroke={isActive ? '#FF5B1D' : 'rgba(34,211,238,0.3)'}
                    strokeWidth={isActive ? '2.5' : '1'}
                    strokeDasharray={isActive ? 'none' : '4 4'}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                  {/* Traveling Pulse Rocket Node */}
                  {isActive && (
                    <motion.circle
                      r="4"
                      fill="#FF5B1D"
                      initial={{ offsetDistance: '0%' }}
                      animate={{ offsetDistance: '100%' }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    />
                  )}
                </g>
              );
            })}

            {/* Destination Pin Markers */}
            {destinations.map((d) => {
              if (!d.coords) return null;
              const { x, y } = coordsToXY(d.coords.lat, d.coords.lng);
              const isHovered = hoveredId === d.id;
              const isSelected = selectedId === d.id || (!selectedId && activeDest?.id === d.id);
              const isActive = isHovered || isSelected;

              return (
                <g key={d.id} className="cursor-pointer" onClick={() => handleSelect(d)} onMouseEnter={() => setHoveredId(d.id)} onMouseLeave={() => setHoveredId(null)}>
                  {/* Radar Pulse Rings */}
                  {isActive && (
                    <>
                      <motion.circle
                        cx={x}
                        cy={y}
                        r="18"
                        fill="none"
                        stroke={isHovered ? '#FF5B1D' : '#22d3ee'}
                        strokeWidth="1.5"
                        initial={{ scale: 0.5, opacity: 1 }}
                        animate={{ scale: 2.2, opacity: 0 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                      />
                      <motion.circle
                        cx={x}
                        cy={y}
                        r="30"
                        fill="none"
                        stroke={isHovered ? '#FF5B1D' : '#22d3ee'}
                        strokeWidth="1"
                        initial={{ scale: 0.5, opacity: 0.8 }}
                        animate={{ scale: 2.8, opacity: 0 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
                      />
                    </>
                  )}

                  {/* Pin Dot */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isActive ? '8' : '5'}
                    fill={isHovered ? '#FF5B1D' : isSelected ? '#22d3ee' : '#64748b'}
                    className="transition-all duration-200"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={isActive ? '3.5' : '2'}
                    fill="#0B0F17"
                  />

                  {/* Pin Label Badge */}
                  <g transform={`translate(${x + 12}, ${y + 4})`}>
                    <rect
                      x="-4"
                      y="-14"
                      width={d.name.length * 7.5 + 18}
                      height="22"
                      rx="6"
                      fill={isActive ? '#0F172A' : 'rgba(15,23,42,0.85)'}
                      stroke={isActive ? (isHovered ? '#FF5B1D' : '#22d3ee') : 'rgba(255,255,255,0.15)'}
                      strokeWidth={isActive ? '1.5' : '1'}
                    />
                    <text
                      x="5"
                      y="1"
                      fill={isActive ? '#ffffff' : '#cbd5e1'}
                      fontSize="10"
                      fontWeight={isActive ? '900' : 'bold'}
                      fontFamily="monospace"
                      letterSpacing="0.5"
                    >
                      {d.name}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Bottom Active Telemetry HUD Banner */}
        {activeDest && (
          <div className="relative z-10 bg-[#0F172A]/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xl">
            <div className="flex items-center gap-3.5 min-w-0">
              {activeDest.imageUrl && (
                <img src={activeDest.imageUrl} alt={activeDest.name} className="w-14 h-14 rounded-xl object-cover border border-cyan-500/30 shrink-0 shadow-md" />
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-white font-extrabold text-base truncate">{activeDest.name}, {activeDest.country}</h4>
                  <span className="text-[9px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full shrink-0">
                    {activeDest.coords?.lat.toFixed(2)}°N, {activeDest.coords?.lng.toFixed(2)}°E
                  </span>
                </div>
                <p className="text-xs text-stone-300 font-medium truncate mt-0.5">
                  {activeDest.weather || '☀️ Optimal Seasonal Pacing'} • {activeDest.duration}
                </p>
                <p className="text-[11px] text-cyan-300 font-mono italic truncate mt-0.5">
                  {activeDest.prompt ? `"${activeDest.prompt}"` : activeDest.tagline}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onCardClick(activeDest)}
              className="group relative overflow-hidden w-full sm:w-auto shrink-0 bg-[#FF5B1D] hover:bg-[#fe7717] text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-[0_6px_25px_rgba(255,91,29,0.45)] transition-all flex items-center justify-center gap-2 cursor-pointer font-mono tracking-wider uppercase"
            >
              <span>Launch AI Itinerary</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        )}
      </div>

      {/* ─── RIGHT PANEL: TELEMETRY CARD DRAWER ─── */}
      <div className="lg:w-5/12 xl:w-1/3 bg-[#0B0F17] border border-white/15 rounded-3xl p-5 flex flex-col max-h-160 shadow-2xl">
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-3.5">
          <h3 className="text-xs font-mono font-extrabold text-white uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>TELEMETRY FEEDS</span>
          </h3>
          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/70 px-2.5 py-1 rounded-full border border-cyan-500/30 font-bold">
            LIVE AI SYNCED
          </span>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
          {destinations.map((dest) => {
            const isHovered = hoveredId === dest.id;
            const isSelected = selectedId === dest.id;
            const isActive = isHovered || isSelected;

            return (
              <div
                key={dest.id}
                onMouseEnter={() => setHoveredId(dest.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => handleSelect(dest)}
                className={`cursor-pointer rounded-2xl p-3.5 transition-all duration-200 border ${
                  isActive
                    ? 'bg-[#1E293B] border-[#FF5B1D] shadow-[0_0_25px_rgba(255,91,29,0.3)] -translate-y-0.5'
                    : 'bg-[#0F172A]/70 border-white/10 hover:border-white/25 hover:bg-[#1E293B]/50'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {dest.imageUrl && (
                      <img src={dest.imageUrl} alt={dest.name} className="w-11 h-11 rounded-xl object-cover border border-white/15 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-extrabold text-white truncate">{dest.name}</h4>
                        <span className="text-[9px] font-mono font-bold text-[#FF5B1D] bg-[#FF5B1D]/10 px-1.5 py-0.5 rounded uppercase shrink-0">
                          {dest.country}
                        </span>
                      </div>
                      {dest.weather && (
                        <p className="text-[11px] text-cyan-300 font-mono font-semibold mt-0.5 truncate">
                          {dest.weather.split('•')[0]}
                          {dest.crowdLevel && <span className="text-amber-300 ml-1.5">• {dest.crowdLevel}</span>}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <Stars rating={dest.rating} />
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-stone-300 italic truncate font-medium">
                    "{dest.tagline}"
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCardClick(dest);
                    }}
                    className="shrink-0 text-[10px] font-mono font-extrabold text-[#FF5B1D] hover:text-white bg-[#FF5B1D]/10 hover:bg-[#FF5B1D] px-2.5 py-1.5 rounded-lg transition-all duration-200 border border-[#FF5B1D]/30 whitespace-nowrap cursor-pointer uppercase tracking-wider"
                  >
                    Launch AI Itinerary
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
