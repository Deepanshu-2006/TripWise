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
  const activeCount = destinations.filter(d => d.coords).length;

  const handleSelect = (dest) => {
    setSelectedId(dest.id === selectedId ? null : dest.id);
  };

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 items-stretch font-sans">
      {/* ─── LEFT PANEL: INTERACTIVE FLIGHT MAP ─── */}
      <div className="lg:w-7/12 xl:w-2/3 bg-[#161618] border border-stone-800 rounded-3xl p-5 sm:p-6 relative overflow-hidden shadow-xl min-h-120 sm:min-h-140 flex flex-col justify-between">
        {/* Animated 360° Rotating Radar Scan Beam Line */}
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[750px] rounded-full pointer-events-none overflow-hidden z-0"
          style={{ transformOrigin: 'center center' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
        >
          <div 
            className="w-1/2 h-1/2 origin-bottom-right bg-gradient-to-tl from-[#FF5B1D]/15 via-[#FF5B1D]/03 to-transparent" 
            style={{ clipPath: 'polygon(100% 100%, 0 0, 0 100%)' }} 
          />
        </motion.div>

        {/* Elegant Top Header */}
        <div className="relative z-10 flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5B1D]" />
            <h3 className="text-xs font-mono font-bold tracking-widest text-white uppercase">
              Global Flight Network
            </h3>
          </div>
          <div className="text-[10px] font-mono text-stone-300 bg-stone-900 px-3 py-1 rounded-full border border-stone-800 flex items-center gap-1.5 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{activeCount} Active Destinations</span>
          </div>
        </div>

        {/* Interactive SVG Flight Grid Canvas */}
        <div className="relative flex-1 my-4 w-full flex items-center justify-center">
          <svg viewBox="0 0 1000 500" className="w-full h-full max-h-110 overflow-visible select-none">
            {/* Latitude & Longitude Concentric Flight Grid */}
            <g className="opacity-20 stroke-stone-700 stroke-[0.5] fill-none">
              <line x1="0" y1="250" x2="1000" y2="250" strokeDasharray="4 4" />
              <line x1="500" y1="0" x2="500" y2="500" strokeDasharray="4 4" />
              <circle cx="500" cy="250" r="220" strokeDasharray="3 6" />
              <circle cx="500" cy="250" r="140" strokeDasharray="3 6" />
              <circle cx="500" cy="250" r="60" strokeDasharray="3 6" />
            </g>

            {/* Arc Flight Routes */}
            {activeDest && activeDest.coords && destinations.map((d) => {
              if (d.id === activeDest.id || !d.coords) return null;
              const start = coordsToXY(activeDest.coords.lat, activeDest.coords.lng);
              const end = coordsToXY(d.coords.lat, d.coords.lng);
              const midX = (start.x + end.x) / 2;
              const midY = Math.min(start.y, end.y) - 50;
              const isActive = d.id === (hoveredId || selectedId);
              return (
                <g key={`path-group-${activeDest.id}-${d.id}`}>
                  <motion.path
                    d={`M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`}
                    fill="transparent"
                    stroke={isActive ? '#FF5B1D' : 'rgba(255,255,255,0.12)'}
                    strokeWidth={isActive ? '2' : '1'}
                    strokeDasharray={isActive ? 'none' : '3 4'}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                  {isActive && (
                    <motion.circle
                      r="3.5"
                      fill="#FF5B1D"
                      initial={{ offsetDistance: '0%' }}
                      animate={{ offsetDistance: '100%' }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                    />
                  )}
                </g>
              );
            })}

            {/* Destination Node Pins */}
            {destinations.map((d) => {
              if (!d.coords) return null;
              const { x, y } = coordsToXY(d.coords.lat, d.coords.lng);
              const isHovered = hoveredId === d.id;
              const isSelected = selectedId === d.id || (!selectedId && activeDest?.id === d.id);
              const isActive = isHovered || isSelected;

              return (
                <g key={d.id} className="cursor-pointer" onClick={() => handleSelect(d)} onMouseEnter={() => setHoveredId(d.id)} onMouseLeave={() => setHoveredId(null)}>
                  {/* Target Circle */}
                  {isActive && (
                    <circle
                      cx={x}
                      cy={y}
                      r="14"
                      fill="none"
                      stroke="#FF5B1D"
                      strokeWidth="1.5"
                      className="opacity-60"
                    />
                  )}

                  {/* Node Dot */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isActive ? '6' : '4'}
                    fill={isActive ? '#FF5B1D' : '#71717a'}
                    className="transition-all duration-200"
                  />

                  {/* City Label Badge */}
                  <g transform={`translate(${x + 10}, ${y + 4})`}>
                    <rect
                      x="-4"
                      y="-13"
                      width={d.name.length * 7 + 16}
                      height="20"
                      rx="6"
                      fill={isActive ? '#18181B' : '#09090B'}
                      stroke={isActive ? '#FF5B1D' : 'rgba(255,255,255,0.12)'}
                      strokeWidth={isActive ? '1.5' : '1'}
                    />
                    <text
                      x="4"
                      y="1"
                      fill={isActive ? '#ffffff' : '#a1a1aa'}
                      fontSize="10"
                      fontWeight={isActive ? '800' : '600'}
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

        {/* Bottom Selected Destination Card */}
        {activeDest && (
          <div className="relative z-10 bg-[#18181B] border border-stone-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3.5 min-w-0">
              {activeDest.imageUrl && (
                <img src={activeDest.imageUrl} alt={activeDest.name} className="w-14 h-14 rounded-xl object-cover border border-stone-700 shrink-0 shadow-xs" />
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-white font-extrabold text-base truncate">{activeDest.name}, {activeDest.country}</h4>
                  <span className="text-[9px] font-mono font-bold bg-stone-800 text-stone-300 border border-stone-700 px-2 py-0.5 rounded-full shrink-0">
                    {activeDest.coords?.lat.toFixed(2)}°N, {activeDest.coords?.lng.toFixed(2)}°E
                  </span>
                </div>
                <p className="text-xs text-stone-400 font-medium truncate mt-0.5">
                  {activeDest.weather || '☀️ Optimal Seasonal Pacing'} • {activeDest.duration}
                </p>
                <p className="text-[11px] text-[#FF5B1D] font-mono italic truncate mt-0.5">
                  {activeDest.prompt ? `"${activeDest.prompt}"` : activeDest.tagline}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onCardClick(activeDest)}
              className="group relative w-full sm:w-auto shrink-0 bg-[#FF5B1D] hover:bg-[#E04D15] text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer font-mono tracking-wider uppercase"
            >
              <span>Plan Trip to {activeDest.name.split(',')[0]}</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        )}
      </div>

      {/* ─── RIGHT PANEL: DESTINATION EXPLORER DRAWER ─── */}
      <div className="lg:w-5/12 xl:w-1/3 bg-[#161618] border border-stone-800 rounded-3xl p-5 flex flex-col max-h-160 shadow-xl">
        <div className="flex items-center justify-between pb-3.5 border-b border-stone-800 mb-3.5">
          <h3 className="text-xs font-mono font-extrabold text-white uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF5B1D]" />
            <span>Destination Explorer</span>
          </h3>
          <span className="text-[10px] font-mono text-stone-400 bg-stone-900 px-2.5 py-1 rounded-full border border-stone-800 font-bold">
            Interactive List
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
                    ? 'bg-[#18181B] border-[#FF5B1D] shadow-xs -translate-y-0.5'
                    : 'bg-stone-900/60 border-stone-800/80 hover:border-stone-700 hover:bg-[#18181B]/70'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {dest.imageUrl && (
                      <img src={dest.imageUrl} alt={dest.name} className="w-12 h-12 rounded-xl object-cover border border-stone-700 shrink-0 shadow-xs" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-extrabold text-white truncate">{dest.name}</h4>
                        <span className="text-[9px] font-mono font-extrabold text-[#FF5B1D] bg-[#FF5B1D]/10 px-1.5 py-0.5 rounded uppercase shrink-0">
                          {dest.country}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 font-medium mt-0.5 truncate">
                        {dest.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <Stars rating={dest.rating} />
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-stone-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-stone-400">
                    {dest.weather && <span>{dest.weather.split('•')[0]}</span>}
                    {dest.duration && <span>• {dest.duration}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCardClick(dest);
                    }}
                    className="shrink-0 text-[10px] font-mono font-extrabold text-[#FF5B1D] hover:text-white bg-[#FF5B1D]/10 hover:bg-[#FF5B1D] px-3 py-1.5 rounded-lg transition-all duration-200 border border-[#FF5B1D]/30 whitespace-nowrap cursor-pointer uppercase tracking-wider"
                  >
                    Plan Trip →
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
