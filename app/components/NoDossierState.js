'use client';

import React, { useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from './Header';
import AnimatedCartographyBackground from './AnimatedCartographyBackground';
import { ArrowRight, Plane } from 'lucide-react';

const SUGGESTED_TRIPS = [
  {
    num: "01",
    title: "Tokyo & Kyoto",
    subtitle: "7-Day Cultural & Culinary Route",
    tags: "RAMEN SPOT · TEMPLES · LOCAL MARKETS",
    prompt: "7 days in Tokyo and Kyoto with temples, authentic ramen, and hidden local spots",
    code: "HND ✈ KIX"
  },
  {
    num: "02",
    title: "Rome & Amalfi Coast",
    subtitle: "5-Day Historic & Coastal Escape",
    tags: "COLOSSEUM · CLIFFTOP VIEWS · TRATTORIAS",
    prompt: "5 days exploring Roman ancient ruins and scenic Amalfi Coast detours",
    code: "FCO ✈ NAP"
  },
  {
    num: "03",
    title: "Paris & Provence",
    subtitle: "4-Day Art & Countryside Retreat",
    tags: "LOUVRE · BAKERIES · LAVENDER FIELDS",
    prompt: "4 days in Paris and Provence with museum passes and countryside bakeries",
    code: "CDG ✈ MRS"
  }
];

// ─── Crazy Hover Card ──────────────────────────────────────────────────────
function TripCard({ trip, idx }) {
  const cardRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  const onMouseMove = useCallback((e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 16;
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 10;
    el.style.setProperty('--rx', `${-y}deg`);
    el.style.setProperty('--ry', `${x}deg`);
  }, []);

  const onMouseLeave = useCallback(() => {
    setHovered(false);
    const el = cardRef.current;
    if (el) {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 + idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: '900px' }}
    >
      <Link
        href={`/ai-planner/new?prompt=${encodeURIComponent(trip.prompt)}`}
        ref={cardRef}
        onMouseMove={onMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={onMouseLeave}
        style={{
          '--rx': '0deg',
          '--ry': '0deg',
          transform: 'rotateX(var(--rx)) rotateY(var(--ry))',
          transformStyle: 'preserve-3d',
          transition: hovered
            ? 'transform 0.08s linear, box-shadow 0.3s ease, border-color 0.3s ease'
            : 'transform 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease, border-color 0.3s ease',
        }}
        className="group relative flex items-center justify-between p-4.5 rounded-2xl bg-[#FAF6F0]/60 border border-[#E6DFD5]/80 overflow-hidden block will-change-transform"
      >
        {/* ① Coral ink-wash sweep from left */}
        <span
          aria-hidden
          style={{
            position: 'absolute', inset: 0, borderRadius: 'inherit',
            background: 'linear-gradient(120deg, rgba(254,119,23,0.10) 0%, rgba(255,107,44,0.06) 100%)',
            transform: hovered ? 'scaleX(1)' : 'scaleX(0)',
            transformOrigin: 'left center',
            transition: 'transform 0.45s cubic-bezier(0.16,1,0.3,1)',
            pointerEvents: 'none',
          }}
        />

        {/* ② Border colour transition */}
        <span
          aria-hidden
          style={{
            position: 'absolute', inset: 0, borderRadius: 'inherit',
            boxShadow: hovered ? '0 0 0 1.5px rgba(254,119,23,0.55), 0 14px 36px rgba(254,119,23,0.12)' : '0 0 0 0px transparent',
            transition: 'box-shadow 0.35s cubic-bezier(0.16,1,0.3,1)',
            pointerEvents: 'none',
          }}
        />

        {/* ③ Dashed scan-line crawling across on hover */}
        <span
          aria-hidden
          style={{
            position: 'absolute', top: '50%', left: 0,
            height: '1px', width: '100%',
            backgroundImage: 'repeating-linear-gradient(90deg,#fe7717 0,#fe7717 5px,transparent 5px,transparent 13px)',
            opacity: hovered ? 0.28 : 0,
            transform: hovered ? 'translateY(-50%) translateX(0%)' : 'translateY(-50%) translateX(-100%)',
            transition: 'opacity 0.18s ease, transform 0.55s cubic-bezier(0.16,1,0.3,1)',
            pointerEvents: 'none',
          }}
        />

        {/* ④ Airport code stamp that pops in top-right */}
        <span
          aria-hidden
          style={{
            position: 'absolute', top: '10px', right: '44px',
            fontFamily: 'monospace', fontSize: '9px', fontWeight: 800,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: '#fe7717',
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateY(0) rotate(-3deg) scale(1)' : 'translateY(-8px) rotate(-3deg) scale(0.85)',
            transition: 'opacity 0.22s ease 0.12s, transform 0.32s cubic-bezier(0.16,1,0.3,1) 0.12s',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {trip.code}
        </span>

        {/* Left: index badge + text */}
        <div className="flex items-center gap-4 relative z-10">
          <div
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: hovered ? 'rgba(254,119,23,0.12)' : 'rgba(230,223,213,0.4)',
              color: hovered ? '#fe7717' : '#7A7268',
              fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.3s ease, color 0.3s ease',
            }}
          >
            {trip.num}
          </div>

          <div>
            <h4
              style={{
                fontFamily: 'serif', fontWeight: 900, fontSize: 16,
                color: hovered ? '#fe7717' : '#1E1C1A',
                lineHeight: 1.25, marginBottom: 2,
                transition: 'color 0.3s ease',
              }}
            >
              {trip.title}
            </h4>
            <p className="text-xs font-serif italic text-[#7A7268] mb-1">{trip.subtitle}</p>
            <div className="font-mono text-[9px] text-[#7A7268]/60 uppercase tracking-wider font-semibold">
              {trip.tags}
            </div>
          </div>
        </div>

        {/* Right: arrow circle — shoot-out + fly-in on hover */}
        <div
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: hovered ? '#fe7717' : 'rgba(230,223,213,0.5)',
            color: hovered ? '#fff' : '#1E1C1A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: hovered ? '0 6px 20px rgba(254,119,23,0.35)' : 'none',
            transform: hovered ? 'scale(1.15)' : 'scale(1)',
            transition: 'background 0.3s ease, color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease',
            position: 'relative', zIndex: 10,
            overflow: 'hidden',
          }}
        >
          {/* Arrow that shoots out top-right on hover */}
          <ArrowRight
            style={{
              width: 15, height: 15,
              position: 'absolute',
              opacity: hovered ? 0 : 1,
              transform: hovered
                ? 'translate(18px, -18px) rotate(-45deg)'
                : 'translate(0px, 0px) rotate(0deg)',
              transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease',
            }}
          />
          {/* Fresh arrow that flies in from bottom-left on hover */}
          <ArrowRight
            style={{
              width: 15, height: 15,
              position: 'absolute',
              opacity: hovered ? 1 : 0,
              transform: hovered
                ? 'translate(0px, 0px) rotate(0deg)'
                : 'translate(-18px, 18px) rotate(-45deg)',
              transition: 'transform 0.28s cubic-bezier(0.16,1,0.3,1) 0.05s, opacity 0.2s ease 0.05s',
            }}
          />
        </div>
      </Link>
    </motion.div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function NoDossierState() {
  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#1E1C1A] flex flex-col justify-between font-sans selection:bg-[#FF6B2C]/15 relative overflow-hidden">
      <Header />

      {/* CRAZY Background: Animated Cartography Map + Flight Paths + Parallax Passport Stamps */}
      <AnimatedCartographyBackground />

      <main className="max-w-3xl mx-auto px-6 pt-32 md:pt-40 pb-20 text-center my-auto relative z-10 flex flex-col items-center">
        
        {/* Animated Flight Radar Emblem Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.06 }}
          className="mb-8 cursor-pointer relative group flex items-center justify-center"
        >
          {/* Outer Rotating Compass Orbit Ring 1 */}
          <div className="absolute -inset-4 rounded-full border border-dashed border-[#1E1C1A]/15 animate-[spin_25s_linear_infinite] pointer-events-none" />
          
          {/* Outer Rotating Compass Orbit Ring 2 (Counter-clockwise) */}
          <div className="absolute -inset-2 rounded-full border border-dashed border-[#FF6B2C]/30 animate-[spin_18s_linear_infinite_reverse] pointer-events-none" />

          {/* Cardinal Points on Ring */}
          <span className="absolute -top-6 text-[9px] font-mono font-bold text-[#FF6B2C]">N</span>
          <span className="absolute -bottom-6 text-[9px] font-mono font-bold text-[#7A7268]/60">S</span>
          <span className="absolute -right-6 text-[9px] font-mono font-bold text-[#7A7268]/60">E</span>
          <span className="absolute -left-6 text-[9px] font-mono font-bold text-[#7A7268]/60">W</span>

          {/* Badge Container */}
          <div className="relative w-20 h-20 rounded-3xl border border-[#E6DFD5] bg-[#F5F0E8] shadow-md group-hover:border-[#FF6B2C]/50 group-hover:shadow-lg transition-all duration-300 flex items-center justify-center p-2.5 overflow-hidden">
            
            {/* Animated Radar Scanning Line */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#FF6B2C]/10 via-transparent to-transparent animate-[spin_4s_linear_infinite] opacity-60 pointer-events-none" />

            {/* Official TripWise SVG Logo with Perfect Arc Alignment & Pulse Animations */}
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 object-contain relative z-10">
              {/* Main Dashed Flight Arc */}
              <path
                d="M24 170 C 70 135, 105 105, 168 42"
                fill="none"
                stroke="#8CA3A8"
                strokeWidth="4"
                strokeDasharray="3 12"
                strokeLinecap="round"
              />

              {/* Glowing Jet Dash Pulse along Arc */}
              <motion.path
                d="M24 170 C 70 135, 105 105, 168 42"
                fill="none"
                stroke="#fe7717"
                strokeWidth="4"
                strokeDasharray="30 150"
                strokeLinecap="round"
                initial={{ strokeDashoffset: 180 }}
                animate={{ strokeDashoffset: -180 }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
              />

              {/* Origin Beacon Point with Sonar Ring */}
              <circle cx="24" cy="170" r="9" fill="#0D9488" />
              <motion.circle 
                cx="24" 
                cy="170" 
                r="9" 
                fill="none" 
                stroke="#0D9488" 
                strokeWidth="2"
                animate={{ scale: [1, 2.2], opacity: [0.8, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut" }}
              />

              {/* Airplane perfectly attached at the end of the arc */}
              <g transform="translate(136,28) rotate(45)">
                <motion.path
                  d="M0 34 L8 0 L16 34 L34 44 L34 52 L16 46 L13 64 L21 70 L21 76 L8 70 L-5 76 L-5 70 L3 64 L0 46 L-18 52 L-18 44 Z"
                  fill="#fe7717"
                  animate={{ scale: [1, 1.12, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                />
              </g>
            </svg>
          </div>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl md:text-5xl font-serif font-black tracking-tight mb-4 text-[#1E1C1A] leading-tight"
        >
          No Dossier Found
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
          className="text-base md:text-lg font-serif italic text-[#7A7268] max-w-xl leading-relaxed mb-10"
        >
          Your travel dossier has not been generated yet. Please head to the AI Planner to build an interactive trip schedule.
        </motion.p>

        {/* Interactive Flight Arc Morph CTA Button (No Glowing Shadow) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14 relative group"
        >
          <Link
            href="/ai-planner/new?action=new"
            className="relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full font-sans text-xs font-bold uppercase tracking-[0.16em] bg-gradient-to-r from-[#fe7717] via-[#FF6B2C] to-[#e06307] text-white shadow-md hover:shadow-lg hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 overflow-hidden"
          >
            {/* Morphing Dark Obsidian Fill on Hover */}
            <div className="absolute inset-0 bg-[#1E1C1A] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none" />

            {/* SVG Flight Arc Path Drawing along Bottom Edge on Hover */}
            <svg className="absolute bottom-1 inset-x-4 w-[calc(100%-2rem)] h-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" viewBox="0 0 200 20">
              <path
                d="M 10 15 Q 100 2, 190 15"
                fill="none"
                stroke="#fe7717"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="transition-all duration-700"
              />
            </svg>

            {/* Main Label with Tracking Expansion */}
            <span className="relative z-10 font-black transition-all duration-300 group-hover:tracking-[0.20em]">
              Create Itinerary in Planner
            </span>

            {/* Interactive Flight Takeoff Airplane Circle (Icon Animation Untouched) */}
            <div className="relative w-8 h-8 rounded-full bg-white text-[#fe7717] flex items-center justify-center shadow-md overflow-hidden shrink-0 group-hover:shadow-lg transition-all duration-300">
              {/* Rotating Orbit Accent Ring */}
              <div className="absolute inset-0.5 rounded-full border border-dashed border-[#fe7717]/30 animate-[spin_6s_linear_infinite] pointer-events-none" />

              {/* Cruising Airplane (Idling Float & Takeoff Out) */}
              <motion.div
                className="relative z-10 flex items-center justify-center"
                animate={{ y: [0, -1.5, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                <Plane className="w-4 h-4 fill-[#fe7717] stroke-[#fe7717] transition-all duration-500 group-hover:translate-x-7 group-hover:-translate-y-7 group-hover:opacity-0 group-hover:scale-110" />
              </motion.div>

              {/* Re-entry Flying Airplane (Sweep in on Hover) */}
              <Plane className="w-4 h-4 fill-[#fe7717] stroke-[#fe7717] absolute z-10 -translate-x-7 translate-y-7 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100 group-hover:scale-110" />
            </div>
          </Link>
        </motion.div>

        {/* Animated Editorial Travel Pass Templates Container */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.26, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-2xl bg-white/90 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-[#E6DFD5] shadow-[0_15px_50px_rgba(0,0,0,0.04)] text-left relative overflow-hidden"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-[#E6DFD5]/60">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#7A7268]">Popular Route Templates</span>
            <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-[#7A7268]/60">Quick Start</span>
          </div>

          {/* Luxury Travel Pass Cards */}
          <div className="flex flex-col gap-3.5">
            {SUGGESTED_TRIPS.map((trip, idx) => (
              <TripCard key={idx} trip={trip} idx={idx} />
            ))}
          </div>
        </motion.div>

      </main>

      {/* Clean Editorial Footer */}
      <footer className="py-8 text-center text-xs font-serif italic text-[#7A7268] border-t border-[#E6DFD5]/60 relative z-10 bg-[#FAF6F0]/80 backdrop-blur-xs">
        TripWise Private Travel Concierge · Published Dossier Guide
      </footer>
    </div>
  );
}
