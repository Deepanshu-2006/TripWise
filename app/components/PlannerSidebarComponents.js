import React, { useState } from 'react';
import { 
  Star, Clock, Banknote, AlertTriangle, ShieldCheck, 
  Compass, Lightbulb, Sparkles, ChevronRight, ThumbsUp, ThumbsDown, Flag, Plane
} from 'lucide-react';
import { getActivityThumbnail, getCategoryStyling, getActivityRating, getIconBadges, getAiInsight, formatCost } from './itineraryHelpers';
import { getPlaceAccuracyStatus } from '../../lib/flaggingStore';
import { getAttractionOvertourismInfo } from '../../lib/overtourismData';

import { motion, AnimatePresence } from 'framer-motion';

import { getDistance } from '../actions/distance';
import { getTransportBetweenStops } from './itineraryHelpers';
import { renderPremiumIcon } from './PlannerSidebarUtils';

// ─── RouteRow ─────────────────────────────────────────────────────────────────
export function RouteRow({ idx, dest, detail, onClick }) {
  const [hovered, setHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const nums = ['01', '02', '03'];

  const handleClick = (e) => {
    if (e) e.preventDefault();
    if (isAnimating) return;
    
    setIsAnimating(true);
    setHovered(true);
    
    // Delay the actual routing by 300ms so the tap animation can play fully on mobile
    setTimeout(() => {
      onClick();
      setTimeout(() => {
        setHovered(false);
        setIsAnimating(false);
      }, 50);
    }, 300);
  };

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={handleClick}
      onMouseEnter={() => !isAnimating && setHovered(true)}
      onMouseLeave={() => !isAnimating && setHovered(false)}
      className={`w-full flex items-center justify-between text-left p-3 rounded-xl bg-white border cursor-pointer transition-colors duration-200 ${hovered ? 'border-[#FF6B2C]/40 bg-[#FAF6F0]' : 'border-stone-200/70 hover:border-[#FF6B2C]/40 hover:bg-[#FAF6F0]'}`}
      style={{ boxShadow: hovered ? '0 4px 16px rgba(255,107,44,0.08)' : '0 1px 3px rgba(0,0,0,0.04)', transition: 'box-shadow 0.25s ease, border-color 0.2s ease, background 0.2s ease' }}
    >
      {/* Index + text */}
      <div className="flex items-center gap-3 min-w-0">
        <span
          className="font-mono text-[10px] font-black shrink-0 tabular-nums transition-colors duration-200"
          style={{ color: hovered ? '#FF6B2C' : '#a8a29e' }}
        >
          {nums[idx] || `0${idx + 1}`}
        </span>
        <div className="min-w-0">
          <div
            className="font-serif font-black text-sm leading-tight transition-colors duration-200"
            style={{ color: hovered ? '#FF6B2C' : '#1c1917' }}
          >
            {dest}
          </div>
          <div className="font-mono text-[9px] text-stone-400 uppercase tracking-wider truncate mt-0.5">
            {detail}
          </div>
        </div>
      </div>

      {/* Arrow circle with shoot-out / fly-in */}
      <div
        className="shrink-0 ml-3 flex items-center justify-center rounded-full transition-all duration-300"
        style={{
          width: 28, height: 28,
          background: hovered ? '#FF6B2C' : 'rgba(230,223,213,0.5)',
          boxShadow: hovered ? '0 4px 14px rgba(255,107,44,0.3)' : 'none',
          transform: hovered ? 'scale(1.1)' : 'scale(1)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Arrow that shoots out */}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{
            position: 'absolute',
            color: hovered ? '#fff' : '#78716c',
            opacity: hovered ? 0 : 1,
            transform: hovered ? 'translate(16px,-16px) rotate(-45deg)' : 'translate(0,0) rotate(0deg)',
            transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.18s ease',
          }}
        >
          <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
        </svg>
        {/* Arrow that flies in */}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{
            position: 'absolute',
            color: '#fff',
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translate(0,0) rotate(0deg)' : 'translate(-16px,16px) rotate(-45deg)',
            transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1) 0.04s, opacity 0.18s ease 0.04s',
          }}
        >
          <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
        </svg>
      </div>
    </motion.button>
  );
}

// ─── PlanButton ───────────────────────────────────────────────────────────────
export function PlanButton({ disabled, onClick }) {
  const [hovered, setHovered] = useState(false);
  const [particles, setParticles] = useState([]);

  const handleClick = (e) => {
    if (disabled) return;
    // Spawn 6 planes in a burst
    const burst = Array.from({ length: 6 }, (_, i) => ({
      id: Date.now() + i,
      angle: i * 60 + Math.random() * 20 - 10,
      dist: 48 + Math.random() * 24,
      delay: i * 30,
    }));
    setParticles(burst);
    setTimeout(() => setParticles([]), 750);
    setTimeout(() => onClick && onClick(e), 50);
  };

  return (
    <div className="relative w-full" style={{ isolation: 'isolate' }}>
      {/* ── Keyframes injected once ── */}
      <style>{`
        @keyframes planeBurst {
          0%   { opacity: 1; transform: translate(var(--tx0), var(--ty0)) scale(1); }
          60%  { opacity: 0.7; }
          100% { opacity: 0; transform: translate(var(--tx1), var(--ty1)) scale(0.4); }
        }
      `}</style>

      {/* ── Particle planes (overflow the button) ── */}
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * p.dist;
        const ty = Math.sin(rad) * p.dist;
        return (
          <Plane
            key={p.id}
            style={{
              position: 'absolute',
              left: '50%', top: '50%',
              width: 11, height: 11,
              color: '#FF6B2C', fill: '#FF6B2C',
              pointerEvents: 'none', zIndex: 50,
              '--tx0': '0px', '--ty0': '0px',
              '--tx1': `${tx}px`, '--ty1': `${ty}px`,
              animation: `planeBurst 0.65s cubic-bezier(0.2,0,0.8,1) ${p.delay}ms forwards`,
              transform: 'translate(-50%,-50%)',
            }}
          />
        );
      })}

      {/* ── The button itself ── */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleClick}
        onMouseEnter={() => !disabled && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '100%',
          transform: hovered && !disabled ? 'translateY(-2px)' : 'translateY(0)',
          boxShadow: hovered && !disabled
            ? '0 12px 28px rgba(255,107,44,0.4), 0 3px 8px rgba(255,107,44,0.15)'
            : disabled ? 'none' : '0 4px 14px rgba(255,107,44,0.22)',
          transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease',
        }}
        className={`relative rounded-2xl overflow-hidden flex items-center cursor-pointer active:scale-[0.98] ${
          disabled
            ? 'bg-stone-200 text-stone-400 cursor-not-allowed opacity-60'
            : 'bg-gradient-to-r from-[#FF6B2C] via-[#F96620] to-[#E55A20] text-white'
        }`}
      >
        {/* Dark ink fill sweeps from left on hover */}
        {!disabled && (
          <span aria-hidden style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(110deg, #1a1816 0%, #252220 100%)',
            transform: hovered ? 'scaleX(1)' : 'scaleX(0)',
            transformOrigin: 'left center',
            transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1)',
            pointerEvents: 'none',
          }} />
        )}

        {/* LEFT: text block */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-5 py-3">
          <span className="font-mono text-[7px] uppercase tracking-[0.22em] leading-none mb-1"
            style={{ color: 'rgba(255,255,255,0.5)' }}>
            {hovered && !disabled ? '✦ ready for takeoff' : 'your journey awaits'}
          </span>
          <span
            className="font-black text-[14px] uppercase leading-none"
            style={{
              letterSpacing: hovered && !disabled ? '0.15em' : '0.10em',
              transition: 'letter-spacing 0.4s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            Plan My Trip
          </span>
        </div>

        {/* Thin vertical separator */}
        {!disabled && (
          <span className="relative z-10 self-stretch w-px shrink-0"
            style={{
              background: hovered ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.15)',
              transition: 'background 0.3s ease',
            }}
          />
        )}

        {/* RIGHT: plane circle */}
        <div className="relative z-10 flex items-center justify-center px-4 shrink-0">
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
            background: hovered && !disabled ? '#FF6B2C' : '#fff',
            boxShadow: hovered && !disabled
              ? '0 0 0 2px rgba(255,255,255,0.25), 0 4px 12px rgba(0,0,0,0.15)'
              : '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'background 0.3s ease, box-shadow 0.3s ease',
          }}>
            {/* Spinning dashed ring */}
            <span aria-hidden style={{
              position: 'absolute', inset: 3, borderRadius: '50%',
              border: `1.5px dashed ${hovered && !disabled ? 'rgba(255,255,255,0.55)' : 'rgba(255,107,44,0.45)'}`,
              animation: 'spin 5s linear infinite',
              transition: 'border-color 0.3s ease',
            }} />
            {/* Plane out */}
            <Plane style={{
              width: 13, height: 13, position: 'absolute',
              color: hovered && !disabled ? '#fff' : '#FF6B2C',
              fill: hovered && !disabled ? '#fff' : '#FF6B2C',
              opacity: hovered ? 0 : 1,
              transform: hovered ? 'translate(16px,-16px)' : 'translate(0,0)',
              transition: 'transform 0.24s cubic-bezier(0.4,0,0.2,1), opacity 0.15s ease',
            }} />
            {/* Plane in */}
            <Plane style={{
              width: 13, height: 13, position: 'absolute',
              color: hovered && !disabled ? '#fff' : '#FF6B2C',
              fill: hovered && !disabled ? '#fff' : '#FF6B2C',
              opacity: hovered ? 1 : 0,
              transform: hovered ? 'translate(0,0)' : 'translate(-16px,16px)',
              transition: 'transform 0.26s cubic-bezier(0.16,1,0.3,1) 0.05s, opacity 0.16s ease 0.05s',
            }} />
          </div>
        </div>
      </button>
    </div>
  );
}

export const renderHighlightedText = (text, highlight) => {
  if (!highlight || !highlight.trim()) return <>{text}</>;
  // Escape regex special characters from highlight string just in case
  const safeHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${safeHighlight})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="text-[#FF6B2C] font-black bg-[#FF6B2C]/10 rounded-[3px] px-[2px]">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

// ─── StepIndicator ─────────────────────────────────────────────────────────────
export function StepIndicator({ step }) {
  const stepOrder = ['input', 'parsing', 'confirming', 'progress'];
  const currentIdx = stepOrder.indexOf(step);
  const steps = [
    { label: 'Prompt',   id: 'input',      icon: '✦' },
    { label: 'Details',  id: 'parsing',    icon: '◈' },
    { label: 'Vibe',     id: 'confirming', icon: '◉' },
    { label: 'Generate', id: 'progress',   icon: '▶' },
  ];

  return (
    <div className="flex flex-col gap-2 mb-1">
      {/* Progress track */}
      <div className="relative h-[3px] bg-stone-100 rounded-full overflow-visible mx-0.5">
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full overflow-hidden"
          initial={{ width: '2%' }}
          animate={{ width: currentIdx === 0 ? '2%' : `${(currentIdx / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ background: 'linear-gradient(90deg, #2FA66A, #FF6B2C)' }}
        >
          {/* Shimmer on track fill */}
          <span style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.6) 50%, transparent 80%)',
            animation: 'progress-shimmer 2s ease-in-out infinite',
          }} />
        </motion.div>

        {/* Step dots on track */}
        {steps.map((s, idx) => {
          const isCompleted = currentIdx > idx;
          const isActive = currentIdx === idx;
          const pct = idx === 0 ? 0 : (idx / (steps.length - 1)) * 100;
          return (
            <motion.div
              key={s.id}
              className="absolute top-1/2 -translate-y-1/2"
              style={{ left: `${pct}%`, translateX: '-50%' }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 700, damping: 20, delay: idx * 0.07 }}
            >
              <motion.div
                className={`w-2.5 h-2.5 rounded-full border-2 border-white transition-all ${
                  isCompleted ? 'bg-[#2FA66A]' : isActive ? 'bg-[#FF6B2C]' : 'bg-stone-200'
                }`}
                animate={isActive ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                transition={{ repeat: isActive ? Infinity : 0, duration: 1.5, ease: 'easeInOut' }}
                style={isActive ? { animation: 'glow-ring 1.5s ease-in-out infinite' } : isCompleted ? { animation: 'green-glow-ring 2s ease-in-out infinite' } : {}}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Step pills row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x">
        {steps.map((s, idx) => {
          const isCompleted = currentIdx > idx;
          const isActive    = currentIdx === idx;

          return (
            <motion.div
              key={s.id}
              className={`relative flex-1 shrink-0 snap-center min-w-[95px] md:min-w-0 md:flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl cursor-default overflow-hidden select-none ${
                isActive    ? 'bg-[#FF6B2C]/10'
              : isCompleted ? 'bg-[#2FA66A]/8'
              : 'bg-stone-50'
              }`}
              initial={{ opacity: 0, y: 10, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 24, delay: idx * 0.07 }}
              whileHover={{
                y: -3,
                scale: 1.03,
                boxShadow: isActive
                  ? '0 8px 24px rgba(255,107,44,0.25), 0 2px 6px rgba(255,107,44,0.15)'
                  : isCompleted
                  ? '0 8px 20px rgba(47,166,106,0.2)'
                  : '0 6px 18px rgba(0,0,0,0.08)',
                transition: { type: 'spring', stiffness: 500, damping: 18 }
              }}
              whileTap={{ scale: 0.97 }}
            >
              {/* Active shimmer sweep */}
              {isActive && (
                <span aria-hidden style={{
                  position: 'absolute', inset: 0, zIndex: 0,
                  background: 'linear-gradient(105deg, transparent 30%, rgba(255,107,44,0.12) 50%, transparent 70%)',
                  animation: 'progress-shimmer 2.2s ease-in-out infinite',
                  pointerEvents: 'none',
                }} />
              )}

              {/* Number badge */}
              <motion.div
                className={`relative z-10 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                  isCompleted ? 'bg-[#2FA66A] text-white' : isActive ? 'bg-[#FF6B2C] text-white' : 'bg-stone-200 text-stone-400'
                }`}
                key={`badge-${s.id}-${isCompleted}`}
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 800, damping: 18, delay: idx * 0.07 + 0.05 }}
                whileHover={{ scale: 1.25, rotate: isActive ? -8 : isCompleted ? 6 : 0, transition: { type: 'spring', stiffness: 600, damping: 12 } }}
                style={isActive ? { animation: 'glow-ring 1.6s ease-in-out infinite' } : isCompleted ? { animation: 'green-glow-ring 2.5s ease-in-out infinite' } : {}}
              >
                <AnimatePresence mode="wait">
                  {isCompleted ? (
                    <motion.span key="chk" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }} transition={{ type: 'spring', stiffness: 800, damping: 14 }} style={{ display: 'inline-block' }}>✓</motion.span>
                  ) : (
                    <motion.span key="num" initial={{ scale: 0, y: -8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0, y: 8 }} transition={{ type: 'spring', stiffness: 700, damping: 18 }} style={{ display: 'inline-block' }}>{idx + 1}</motion.span>
                  )}
                </AnimatePresence>

                {/* Active pulsing ring */}
                {isActive && (
                  <motion.span
                    className="absolute inset-0 rounded-md"
                    style={{ background: '#FF6B2C', zIndex: -1 }}
                    animate={{ scale: [1, 1.9], opacity: [0.55, 0] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: 'easeOut' }}
                  />
                )}
              </motion.div>

              {/* Label */}
              <motion.span
                className={`relative z-10 text-[9px] font-mono font-bold uppercase tracking-wider leading-none ${
                  isActive ? 'text-[#FF6B2C]' : isCompleted ? 'text-[#2FA66A]' : 'text-stone-400'
                }`}
                animate={isActive ? { y: [0, -1, 0], opacity: [0.8, 1, 0.8] } : {}}
                transition={isActive ? { repeat: Infinity, duration: 2, ease: 'easeInOut' } : {}}
              >
                {s.label}
              </motion.span>

              {/* Active glowing border bottom */}
              {isActive && (
                <motion.span
                  className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-[#FF6B2C]"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  style={{ boxShadow: '0 0 8px rgba(255,107,44,0.7)' }}
                />
              )}
              {isCompleted && (
                <motion.span
                  className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-[#2FA66A]"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.4, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  style={{ boxShadow: '0 0 6px rgba(47,166,106,0.5)' }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── LiveTransitPill ──────────────────────────────────────────────────────────

export function LiveTransitPill({ prevStop, nextStop, idx }) {
  const initialTransport = getTransportBetweenStops(prevStop, nextStop, idx);
  const [transitIcon, setTransitIcon] = React.useState(initialTransport?.icon || '🚶');
  const [transitText, setTransitText] = React.useState(initialTransport?.text || '');
  const [transitDist, setTransitDist] = React.useState(initialTransport?.distStr || '');
  const [mode, setMode] = React.useState(initialTransport?.mode || 'walk');

  React.useEffect(() => {
    if (!prevStop?.coordinates || !nextStop?.coordinates) return;
    let isMounted = true;
    const fetchTrueDistance = async () => {
      try {
        const origins = `${prevStop.coordinates.lat},${prevStop.coordinates.lng}`;
        const destinations = `${nextStop.coordinates.lat},${nextStop.coordinates.lng}`;
        const data = await getDistance(origins, destinations, mode);
        
        if (data.error) return;
        
        if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
          if (!isMounted) return;
          
          const element = data.rows[0].elements[0];
          let distText = element.distance.text;
          if (mode === 'walk') {
             const kmVal = parseFloat(distText.replace(' km', ''));
             if (kmVal < 1.0 && kmVal > 0) {
               distText = `${Math.round(kmVal * 1000)}m`;
             }
          }

          const durMins = Math.round(element.duration.value / 60);
          const minLabel = durMins === 1 ? 'min' : 'mins';
          
          let finalModeStr = mode;
          let finalIcon = transitIcon;

          if (mode === 'taxi' || mode === 'driving') {
             finalModeStr = 'Taxi';
             finalIcon = '🚕';
          } else if (mode === 'metro' || mode === 'transit') {
             finalModeStr = 'Metro';
             finalIcon = '🚇';
          } else {
             finalModeStr = 'walk';
             finalIcon = '🚶';
          }

          let newText = '';
          if (finalModeStr === 'walk') {
            newText = `${durMins} ${minLabel} walk`;
          } else {
            newText = `${finalModeStr} • ${durMins} ${minLabel}`;
          }

          setTransitIcon(finalIcon);
          setTransitText(newText);
          setTransitDist(distText);
        }
      } catch (e) {
        console.error("OSRM Routing API error", e);
      }
    };

    const timer = setTimeout(fetchTrueDistance, 300 + (idx * 150));
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [prevStop, nextStop, mode, idx, transitIcon]);

  if (!initialTransport) return null;

  return (
    <div className="inline-flex items-center gap-2 px-1.5 py-1.5 bg-white/80 backdrop-blur-md border border-stone-200/60 rounded-full shadow-sm text-[11px] font-medium text-stone-600 cursor-default">
      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-stone-100/80 text-[10px]">
        {transitIcon}
      </div>
      <span className="tracking-tight text-[#1E1C1A] font-bold pr-1">
        {transitText}
      </span>
      <span className="text-[#A39E99] font-bold tracking-wide pl-1.5 pr-2 border-l border-stone-200/60">
        {transitDist}
      </span>
    </div>
  );
}



// ─── DayScheduleCard (Memoized) ────────────────────────────────────────────────
export const DayScheduleCard = React.memo(function DayScheduleCard({
  act,
  idx,
  selectedDayIndex,
  itinerary,
  hoveredStopIdx,
  selectedStopIdx,
  dragOverStopIdx,
  draggedStopIdx,
  mockVotes,
  scrollRef,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleDragEnd,
  handleHoverStop,
  handleSelectStop,
  handleVote,
  setActiveFlagTarget,
  handleSwapActivity
}) {
  const stopNum = idx + 1;
  const [mobileExpanded, setMobileExpanded] = React.useState(false);
  const isHovered = hoveredStopIdx === stopNum;
  const isSelected = selectedStopIdx === stopNum;
  const categoryStyle = getCategoryStyling(act);
  const ratingData = getActivityRating(act, idx);
  const costInfo = formatCost(act);
  const iconBadges = getIconBadges(act, idx);
  const aiInsightText = getAiInsight(act, idx);
  const transport = getTransportBetweenStops(itinerary.days?.[selectedDayIndex]?.activities?.[idx - 1], act, idx);
  const stopKey = `${selectedDayIndex}-${idx}`;
  const accuracyData = getPlaceAccuracyStatus(stopKey, act.title);
  const overtourismInfo = getAttractionOvertourismInfo(act.title);
  const voteData = mockVotes[stopKey] || { up: 0, down: 0, userVote: null };
  const displayUp = voteData.up + (voteData.userVote === 'up' ? 0 : (idx === 0 ? 1 : 0));

  return (
    <motion.div
      key={`${selectedDayIndex}-${idx}`}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
      viewport={{ once: true, margin: "100px", root: scrollRef }}
      exit={{ opacity: 0, y: -10, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } }}
      className="flex flex-col gap-2"
      data-day-idx={selectedDayIndex}
      data-stop-idx={stopNum}
    >
      {/* Transport Connector + Uber */}
      {idx > 0 && transport && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "100px", root: scrollRef }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative pl-2 sm:pl-[46px] py-1.5 sm:py-2 flex items-center justify-between z-10 pr-1 gap-2 flex-wrap sm:flex-nowrap"
        >
          <LiveTransitPill
            prevStop={itinerary.days?.[selectedDayIndex]?.activities?.[idx - 1]}
            nextStop={act}
            idx={idx}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const prevStop = itinerary.days?.[selectedDayIndex]?.activities?.[idx - 1];
              const destLat = act.coordinates?.lat;
              const destLng = act.coordinates?.lng;
              const destName = act.title + (itinerary?.destinationName ? ', ' + itinerary.destinationName : '');
              const pickupLat = prevStop?.coordinates?.lat;
              const pickupLng = prevStop?.coordinates?.lng;
              const pickupName = prevStop?.title || 'Previous Stop';
              let url = 'https://m.uber.com/ul/?action=setPickup';
              if (pickupLat && pickupLng) {
                url += `&pickup[latitude]=${pickupLat}&pickup[longitude]=${pickupLng}&pickup[nickname]=${encodeURIComponent(pickupName)}`;
              } else {
                url += '&pickup=my_location';
              }
              url += `&dropoff[formatted_address]=${encodeURIComponent(destName)}`;
              if (destLat) url += `&dropoff[latitude]=${destLat}`;
              if (destLng) url += `&dropoff[longitude]=${destLng}`;
              url += `&dropoff[nickname]=${encodeURIComponent(act.title)}`;
              window.open(url, '_blank', 'noopener,noreferrer');
            }}
            className="group relative inline-flex items-center gap-0 pl-[3px] pr-3.5 sm:pr-4 py-[3px] rounded-full overflow-hidden cursor-pointer select-none shrink-0 transition-all duration-200 hover:scale-[1.04] active:scale-[0.97]"
            style={{ background: '#000', boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}
            title={`Request Uber to ${act.title}`}
          >
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-in-out bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <span className="relative flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white shrink-0 mr-2">
              <svg width="10" height="12" viewBox="0 0 11 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0H2.64V7.392C2.64 8.6328 3.3792 9.372 4.62 9.372H6.38C7.6208 9.372 8.36 8.6328 8.36 7.392V0H11V7.392C11 10.1376 9.3104 11.88 6.38 11.88H4.62C1.6896 11.88 0 10.1376 0 7.392V0Z" fill="black"/>
              </svg>
            </span>
            <span className="relative flex flex-col items-start leading-none">
              <span className="text-white/40 text-[7px] font-bold tracking-[0.15em] uppercase">uber</span>
              <span className="text-white text-[10.5px] font-extrabold leading-tight">Request Ride</span>
            </span>
          </button>
        </motion.div>
      )}

      {/* Accuracy Warning */}
      {accuracyData.hasWarning && (
        <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-2xl px-3.5 py-2 flex items-center justify-between text-amber-800 text-[11px] font-bold shadow-2xs">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>⚠️ Recently reported as outdated — verify before visiting</span>
          </div>
          <span className="text-[9px] font-mono uppercase bg-amber-500/20 text-amber-900 px-1.5 py-0.5 rounded-md">
            {accuracyData.topFlag?.reasonLabel || 'Flagged'}
          </span>
        </div>
      )}

      {/* Card wrapper */}
      <div
        id={`itinerary-card-${selectedDayIndex}-${stopNum}`}
        draggable={true}
        onDragStart={(e) => handleDragStart(e, idx)}
        onDragOver={(e) => handleDragOver(e, idx)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, idx)}
        onDragEnd={handleDragEnd}
        onMouseEnter={() => handleHoverStop(stopNum)}
        onMouseLeave={() => handleHoverStop(null)}
        onClick={() => {
          handleSelectStop(isSelected ? null : stopNum);
          handleHoverStop(stopNum);
        }}
        className={`scroll-mt-40 w-full box-border rounded-2xl border transition-all duration-200 ease-out flex items-center p-3 sm:p-3.5 gap-3 sm:gap-3.5 cursor-pointer select-none relative z-10 overflow-hidden bg-white group active:scale-[0.985]
          ${dragOverStopIdx === idx
            ? 'border-[#FF6B2C] border-2 bg-[#FFF8F5] sm:scale-[1.02] ring-4 ring-[#FF6B2C]/30 z-30'
            : draggedStopIdx === idx
              ? 'opacity-40 border-dashed border-[#FF6B2C] sm:scale-95'
              : isSelected
                ? 'border-[#FF6B2C] bg-[#FFF9F6] shadow-[0_8px_24px_rgba(255,107,44,0.12)] ring-1 ring-[#FF6B2C]/40 z-20'
                : isHovered || hoveredStopIdx === stopNum
                  ? 'border-stone-300 shadow-[0_8px_24px_rgba(0,0,0,0.06)] sm:-translate-y-0.5 z-20'
                  : 'border-stone-200/70 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-stone-300 hover:shadow-[0_8px_20px_rgba(0,0,0,0.05)]'
        }`}
      >
        {/* Left: Square Thumbnail */}
        <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-stone-100 border border-stone-200/60 shadow-2xs group-hover:scale-102 transition-transform duration-300">
          <img
            src={getActivityThumbnail(act, itinerary?.destinationName || '', idx)}
            alt={act.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="w-full h-full flex items-center justify-center text-[#FF6B2C]/40 bg-gradient-to-br from-[#FFF5EE] via-[#FAF0E6] to-[#F5EBE1]">
            {renderPremiumIcon(categoryStyle.icon, 24)}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/15 pointer-events-none" />
          
          {/* Stop Number Badge */}
          <div className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm backdrop-blur-md transition-all ${isSelected ? 'bg-[#FF6B2C] text-white' : 'bg-white text-stone-900 border border-stone-200/80'}`}>
            {stopNum}
          </div>

          {/* Star Rating Badge */}
          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 text-[9px] font-bold text-white drop-shadow-md bg-black/50 backdrop-blur-md px-1.5 py-0.5 rounded">
            <Star size={8} className="fill-amber-400 text-amber-400 shrink-0" />
            <span>{ratingData.rating}</span>
          </div>
        </div>

        {/* Right: Info Column */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
          {/* Top Line: Time + Category + Duration */}
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-500 flex-wrap">
            <span className="text-stone-900 font-bold">{act.time || '10:00 AM'}</span>
            <span className="text-stone-300 text-[8px]">•</span>
            <span className="inline-flex items-center gap-1 text-stone-700 font-bold capitalize">
              <span className="text-[#FF6B2C] shrink-0">{renderPremiumIcon(categoryStyle.icon, 11)}</span>
              <span>{categoryStyle.name.toLowerCase()}</span>
            </span>
            {act.duration && (
              <>
                <span className="text-stone-300 text-[8px]">•</span>
                <span>{act.duration}</span>
              </>
            )}
          </div>

          {/* Title */}
          <h4 className={`text-sm sm:text-[15px] font-bold leading-snug tracking-tight line-clamp-1 group-hover:text-[#FF6B2C] transition-colors ${isSelected ? 'text-[#FF6B2C]' : 'text-stone-900'}`}>
            {act.title}
          </h4>

          {/* Bottom Line: Cost + Map Cue */}
          <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-stone-500 pt-0.5">
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold truncate">
              <Banknote size={12} strokeWidth={2.5} className="shrink-0" />
              <span className="truncate">{costInfo.title.replace('💰 ', '')}</span>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-bold text-stone-400 group-hover:text-[#FF6B2C] transition-colors shrink-0">
              <span className="hidden sm:inline text-[10px] uppercase tracking-wider">Map</span>
              <ChevronRight size={13} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});


