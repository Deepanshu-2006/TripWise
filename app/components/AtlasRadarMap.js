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
  // Clamp coordinates
  const clat = Math.max(-80, Math.min(80, lat));
  const clng = Math.max(-180, Math.min(180, lng));
  
  const x = ((clng + 180) / 360) * 940 + 30; // 30px padding
  const y = ((80 - clat) / 160) * 440 + 30;
  return { x, y };
}

export default function AtlasRadarMap({ destinations = [], onCardClick }) {
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const activeDest = destinations.find(d => d.id === (selectedId || hoveredId)) || destinations[0];

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
      <div className="lg:w-7/12 xl:w-2/3 bg-stone-950 border border-white/15 rounded-3xl p-5 sm:p-6 relative overflow-hidden shadow-2xl min-h-120 sm:min-h-140 flex flex-col justify-between">
        {/* Radar Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-size-[24px_24px] opacity-40 pointer-events-none" />
        <motion.div 
          className="absolute -top-1/4 -left-1/4 w-3/2 h-3/2 rounded-full border border-cyan-500/10 pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div 
          className="absolute inset-0 bg-radial from-cyan-500/5 via-transparent to-transparent pointer-events-none"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Top HUD Header */}
        <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
              AI Telemetry Radar • Active Tracking
            </span>
          </div>
          <div className="text-xs font-mono text-white/60 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            {destinations.length} Coordinates Locked
          </div>
        </div>

        {/* Interactive SVG World Map Canvas */}
        <div className="relative flex-1 my-4 w-full flex items-center justify-center">
          <svg viewBox="0 0 1000 500" className="w-full h-full max-h-110 overflow-visible select-none">
            {/* Stylized World Continents Background Grid Lines */}
            <g className="opacity-20 stroke-stone-600 stroke-1 fill-none">
              <path d="M 100 150 Q 250 80 400 160 T 700 140 T 900 200" strokeDasharray="4 4" />
              <path d="M 150 300 Q 350 240 550 320 T 850 280" strokeDasharray="4 4" />
              <circle cx="500" cy="250" r="220" strokeDasharray="2 6" />
              <circle cx="500" cy="250" r="140" strokeDasharray="2 6" />
            </g>

            {/* Flight Path Lines from Active/Selected Destination to others */}
            {activeDest && activeDest.coords && destinations.map((d) => {
              if (d.id === activeDest.id || !d.coords) return null;
              const start = coordsToXY(activeDest.coords.lat, activeDest.coords.lng);
              const end = coordsToXY(d.coords.lat, d.coords.lng);
              const midX = (start.x + end.x) / 2;
              const midY = Math.min(start.y, end.y) - 60;
              return (
                <motion.path
                  key={`path-${activeDest.id}-${d.id}`}
                  d={`M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`}
                  fill="transparent"
                  stroke={d.id === (hoveredId || selectedId) ? '#FF6B2C' : 'rgba(34,211,238,0.25)'}
                  strokeWidth={d.id === (hoveredId || selectedId) ? '2' : '1'}
                  strokeDasharray="4 4"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
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
                        r="20"
                        fill="none"
                        stroke={isHovered ? '#FF6B2C' : '#22d3ee'}
                        strokeWidth="1.5"
                        initial={{ scale: 0.5, opacity: 1 }}
                        animate={{ scale: 2.2, opacity: 0 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                      />
                      <motion.circle
                        cx={x}
                        cy={y}
                        r="32"
                        fill="none"
                        stroke={isHovered ? '#FF6B2C' : '#22d3ee'}
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
                    fill={isHovered ? '#FF6B2C' : isSelected ? '#22d3ee' : '#cbd5e1'}
                    className="transition-all duration-200"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={isActive ? '4' : '2'}
                    fill="#000"
                  />

                  {/* Pin Label */}
                  <g transform={`translate(${x + 12}, ${y + 4})`}>
                    <rect
                      x="-4"
                      y="-14"
                      width={d.name.length * 7 + 16}
                      height="20"
                      rx="4"
                      fill={isActive ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.65)'}
                      stroke={isActive ? (isHovered ? '#FF6B2C' : '#22d3ee') : 'rgba(255,255,255,0.15)'}
                      strokeWidth="1"
                    />
                    <text
                      x="4"
                      y="-0.5"
                      fill={isActive ? '#fff' : '#cbd5e1'}
                      fontSize="11"
                      fontWeight={isActive ? 'bold' : 'normal'}
                      fontFamily="monospace"
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
          <div className="relative z-10 bg-black/80 backdrop-blur-xl border border-white/15 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3.5 min-w-0">
              {activeDest.imageUrl && (
                <img src={activeDest.imageUrl} alt={activeDest.name} className="w-14 h-14 rounded-xl object-cover border border-white/20 shrink-0" />
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-white font-extrabold text-base truncate">{activeDest.name}, {activeDest.country}</h4>
                  <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-md font-mono shrink-0">
                    {activeDest.coords?.lat.toFixed(2)}°N, {activeDest.coords?.lng.toFixed(2)}°E
                  </span>
                </div>
                <p className="text-xs text-white/80 font-medium truncate mt-0.5">
                  {activeDest.weather || '☀️ Optimal Seasonal Pacing'} • {activeDest.duration}
                </p>
                <p className="text-[11px] text-cyan-300 font-mono italic truncate mt-0.5">
                  {activeDest.aiTip || '💡 AI Verdict: Highly Recommended for cultural itinerary creation.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onCardClick(activeDest)}
              className="w-full sm:w-auto shrink-0 bg-[#FF6B2C] hover:bg-[#ff7b42] text-white font-bold text-xs px-5 py-3 rounded-xl shadow-[0_4px_20px_rgba(255,107,44,0.4)] transition-all flex items-center justify-center gap-2"
            >
              <span>Launch AI Itinerary</span>
              <span>→</span>
            </button>
          </div>
        )}
      </div>

      {/* ─── RIGHT PANEL: TELEMETRY CARD DRAWER ─── */}
      <div className="lg:w-5/12 xl:w-1/3 bg-stone-900 border border-white/15 rounded-3xl p-5 flex flex-col max-h-160">
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-3.5">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <span>◉</span>
            <span>Telemetry Feeds</span>
          </h3>
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-md border border-cyan-500/30">
            Live AI Synced
          </span>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
          {destinations.map((dest) => {
            const isHovered = hoveredId === dest.id;
            const isSelected = selectedId === dest.id;
            return (
              <div
                key={dest.id}
                onMouseEnter={() => setHoveredId(dest.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => handleSelect(dest)}
                className={`cursor-pointer rounded-2xl p-3.5 transition-all border ${
                  isSelected || isHovered
                    ? 'bg-stone-800 border-[#FF6B2C] shadow-[0_0_20px_rgba(255,107,44,0.2)]'
                    : 'bg-stone-950/70 border-white/10 hover:border-white/25'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white truncate">{dest.name}</h4>
                      <span className="text-[10px] font-mono text-stone-400 uppercase">{dest.country}</span>
                    </div>
                    {dest.weather && (
                      <p className="text-xs text-cyan-300 font-medium mt-1 truncate">{dest.weather}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <Stars rating={dest.rating} />
                    {dest.crowdLevel && (
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border mt-1 ${getCrowdBadgeStyle(dest.crowdLevel)}`}>
                        {dest.crowdLevel}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-white/70 italic truncate">
                    {dest.aiTip ? dest.aiTip.replace('💡 AI Verdict: ', '') : dest.tagline}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCardClick(dest);
                    }}
                    className="shrink-0 text-[11px] font-bold text-[#FF6B2C] hover:text-white bg-[#FF6B2C]/10 hover:bg-[#FF6B2C] px-2.5 py-1 rounded-lg transition-colors border border-[#FF6B2C]/30"
                  >
                    Use Prompt
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
