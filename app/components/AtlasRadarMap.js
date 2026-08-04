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

// Custom Animated Flight Takeoff Button (Identical to DestCard Jet Takeoff Loop)
function FlightButton({ label, onClick, isSmall = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden shrink-0 flex items-center justify-center gap-2.5 rounded-full text-white font-extrabold cursor-pointer tracking-wider uppercase font-mono transition-all duration-300 bg-gradient-to-r from-[#FF5B1D] via-[#FE6B25] to-[#FF5B1D] shadow-[0_6px_25px_rgba(255,91,29,0.45)] hover:shadow-[0_10px_35px_rgba(255,91,29,0.75)] hover:-translate-y-0.5 border border-white/20 ${
        isSmall ? 'text-[10px] px-3.5 py-1.5' : 'text-xs px-6 py-3.5 w-full sm:w-auto'
      }`}
    >
      {/* Liquid Orange Jet Fuel Morph Layer */}
      <span className="absolute inset-0 bg-gradient-to-r from-[#FF5B1D] via-[#FE7717] to-[#FF5B1D] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0" />

      {/* Button Text */}
      <span className="relative z-10 flex items-center justify-center gap-2 group-hover:tracking-widest transition-all duration-300">
        <span>{label}</span>
      </span>

      {/* Vector SVG Jet Flight Loop Animation */}
      <div className="relative z-10 w-4 h-4 overflow-hidden flex items-center justify-center shrink-0">
        <span className="inline-block transform rotate-45 group-hover:translate-x-6 group-hover:-translate-y-6 transition-all duration-300 ease-in text-white">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
          </svg>
        </span>
        <span className="absolute inline-block transform rotate-45 -translate-x-6 translate-y-6 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300 ease-out text-white delay-75">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
          </svg>
        </span>
      </div>
    </button>
  );
}

const CITY_MAP_POSITIONS = {
  'london': { x: 150, y: 90, flag: '🇬🇧' },
  'paris': { x: 300, y: 150, flag: '🇫🇷' },
  'swiss alps': { x: 440, y: 105, flag: '🇨🇭' },
  'swiss-alps': { x: 440, y: 105, flag: '🇨🇭' },
  'rome': { x: 370, y: 230, flag: '🇮🇹' },
  'marrakech': { x: 180, y: 270, flag: '🇲🇦' },
  'rio de janeiro': { x: 200, y: 400, flag: '🇧🇷' },
  'rio-de-janeiro': { x: 200, y: 400, flag: '🇧🇷' },
  'cape town': { x: 480, y: 430, flag: '🇿🇦' },
  'cape-town': { x: 480, y: 430, flag: '🇿🇦' },
  'istanbul': { x: 550, y: 170, flag: '🇹🇷' },
  'dubai': { x: 670, y: 260, flag: '🇦🇪' },
  'bali': { x: 790, y: 360, flag: '🇮🇩' },
  'tokyo': { x: 880, y: 150, flag: '🇯🇵' },
  'kyoto': { x: 890, y: 210, flag: '🇯🇵' },
  'sydney': { x: 920, y: 420, flag: '🇦🇺' },
};

function getDestXY(dest) {
  if (!dest) return { x: 500, y: 250, flag: '✈️' };
  const key = dest.id ? dest.id.toLowerCase() : (dest.name ? dest.name.toLowerCase() : '');
  const custom = CITY_MAP_POSITIONS[key] || CITY_MAP_POSITIONS[dest.name?.toLowerCase()];
  if (custom) return custom;
  if (dest.coords) {
    const xy = coordsToXY(dest.coords.lat, dest.coords.lng);
    return { ...xy, flag: '✈️' };
  }
  return { x: 500, y: 250, flag: '✈️' };
}

export default function AtlasRadarMap({ destinations = [], onCardClick }) {
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  // Two-way sync: prioritize hovered item for temporary preview, fallback to selected, then first item
  const activeDest = destinations.find(d => d.id === (hoveredId || selectedId)) || destinations[0];
  const activeCount = destinations.filter(d => d.coords).length;

  const activeXY = getDestXY(activeDest);

  const handleSelect = (dest) => {
    setSelectedId(dest.id === selectedId ? null : dest.id);
  };

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 items-stretch font-sans">
      {/* ─── LEFT PANEL: INTERACTIVE FLIGHT MAP ─── */}
      <div className="lg:w-7/12 xl:w-2/3 bg-[#161618] border border-stone-800 rounded-3xl p-5 sm:p-6 relative overflow-hidden shadow-xl min-h-120 sm:min-h-140 flex flex-col justify-between">
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
          <svg viewBox="0 0 1000 500" className="w-full h-full min-h-[380px] overflow-visible select-none">
            <defs>
              <linearGradient id="radarLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF5B1D" stopOpacity="0.9" />
                <stop offset="70%" stopColor="#FF5B1D" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#FF5B1D" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Latitude & Longitude Concentric Flight Grid */}
            <g className="opacity-20 stroke-stone-700 stroke-[0.5] fill-none">
              <line x1="0" y1="250" x2="1000" y2="250" strokeDasharray="4 4" />
              <line x1="500" y1="0" x2="500" y2="500" strokeDasharray="4 4" />
              <circle cx="500" cy="250" r="220" strokeDasharray="3 6" />
              <circle cx="500" cy="250" r="140" strokeDasharray="3 6" />
              <circle cx="500" cy="250" r="60" strokeDasharray="3 6" />
            </g>

            {/* Symmetrical Map Center Radar Sweep */}
            <g transform="translate(500, 250)">
              <motion.g
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              >
                {/* Subtle Conic Sweep Sector */}
                <foreignObject x="-450" y="-450" width="900" height="900" className="overflow-visible pointer-events-none opacity-70">
                  <div
                    className="w-full h-full rounded-full"
                    style={{
                      background: 'conic-gradient(from 0deg at 50% 50%, rgba(255, 91, 29, 0.16) 0deg, rgba(255, 91, 29, 0.03) 25deg, transparent 45deg)'
                    }}
                  />
                </foreignObject>

                {/* Fading Laser Scan Line */}
                <line
                  x1="0"
                  y1="0"
                  x2="420"
                  y2="0"
                  stroke="url(#radarLineGrad)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </motion.g>

              {/* Center Scope Crosshair Reticle */}
              <circle r="3" fill="#FF5B1D" />
              <circle r="7" fill="none" stroke="#FF5B1D" strokeWidth="1" className="opacity-50" />
            </g>

            {/* Arc Flight Routes */}
            {activeDest && destinations.map((d) => {
              if (d.id === activeDest.id) return null;
              const start = getDestXY(activeDest);
              const end = getDestXY(d);
              const midX = (start.x + end.x) / 2;
              const midY = Math.min(start.y, end.y) - 45;
              const isActive = d.id === (hoveredId || selectedId);
              return (
                <g key={`path-group-${activeDest.id}-${d.id}`}>
                  <motion.path
                    d={`M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`}
                    fill="transparent"
                    stroke={isActive ? '#FF5B1D' : 'rgba(255,255,255,0.15)'}
                    strokeWidth={isActive ? '2.5' : '1.25'}
                    strokeDasharray={isActive ? 'none' : '4 4'}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
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

            {/* Destination Node Pins */}
            {destinations.map((d) => {
              const pos = getDestXY(d);
              const { x, y, flag } = pos;
              const isHovered = hoveredId === d.id;
              const isSelected = selectedId === d.id || (!selectedId && activeDest?.id === d.id);
              const isActive = isHovered || isSelected;

              const labelText = `${flag} ${d.name}`;
              const badgeWidth = labelText.length * 8.5 + 24;

              return (
                <g 
                  key={d.id} 
                  className="cursor-pointer group" 
                  onClick={() => handleSelect(d)} 
                  onMouseEnter={() => setHoveredId(d.id)} 
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Glowing Target Ring on Active */}
                  {isActive && (
                    <circle
                      cx={x}
                      cy={y}
                      r="18"
                      fill="none"
                      stroke="#FF5B1D"
                      strokeWidth="2"
                      className="animate-pulse opacity-80"
                    />
                  )}

                  {/* Bold Pin Dot */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isActive ? '9' : '6'}
                    fill={isActive ? '#FF5B1D' : '#94a3b8'}
                    className="transition-all duration-200"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={isActive ? '4' : '2.5'}
                    fill="#161618"
                  />

                  {/* High-Visibility City Label Badge */}
                  <g transform={`translate(${x + 14}, ${y + 5})`}>
                    <rect
                      x="-4"
                      y="-17"
                      width={badgeWidth}
                      height="28"
                      rx="8"
                      fill={isActive ? '#FF5B1D' : '#1F1F23'}
                      stroke={isActive ? '#FFFFFF' : 'rgba(255,255,255,0.2)'}
                      strokeWidth={isActive ? '2' : '1'}
                      className="shadow-lg transition-colors duration-200"
                    />
                    <text
                      x="6"
                      y="1"
                      fill="#FFFFFF"
                      fontSize="13"
                      fontWeight={isActive ? '900' : '700'}
                      fontFamily="system-ui, -apple-system, sans-serif"
                    >
                      {labelText}
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
            <FlightButton
              label={`Plan Trip to ${activeDest.name.split(',')[0]}`}
              onClick={() => onCardClick(activeDest)}
            />
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
                  <FlightButton
                    label="Plan Trip"
                    isSmall
                    onClick={(e) => {
                      e.stopPropagation();
                      onCardClick(dest);
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
