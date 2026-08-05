'use client';

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { WORLD_MAP_PATH } from './WorldMapPath';

const FLIGHT_ARCS = [
  // New York (approx 360, 180) to Rome (approx 640, 160)
  { d: "M 360 180 Q 500 80 640 160", label: "JFK ✈ FCO", duration: 7, delay: 0 },
  // London (approx 590, 130) to Tokyo (approx 1050, 180)
  { d: "M 590 130 Q 820 40 1050 180", label: "LHR ✈ HND", duration: 9, delay: 2 },
  // Paris (approx 600, 140) to Amalfi/Rome (approx 645, 165)
  { d: "M 600 140 Q 620 120 645 165", label: "CDG ✈ NAP", duration: 6, delay: 1 },
  // Tokyo (approx 1050, 180) to Sydney (approx 1090, 440)
  { d: "M 1050 180 Q 1120 300 1090 440", label: "HND ✈ SYD", duration: 8, delay: 3.5 }
];

export default function AnimatedCartographyBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { innerWidth, innerHeight } = window;
      setMousePos({
        x: (e.clientX / innerWidth - 0.5) * 20,
        y: (e.clientY / innerHeight - 0.5) * 20
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      
      {/* 1. World Map Vector Path Base Layer */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] scale-110">
        <svg viewBox="0 0 1200 600" className="w-full h-full object-cover">
          <path d={WORLD_MAP_PATH} fill="#1E1C1A" />
        </svg>
      </div>

      {/* 2. Interactive SVG Flight Arc Trajectories */}
      <svg 
        className="absolute inset-0 w-full h-full opacity-35" 
        viewBox="0 0 1200 600" 
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="flightGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF6B2C" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#FF6B2C" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FF6B2C" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {FLIGHT_ARCS.map((arc, idx) => (
          <g key={idx}>
            {/* Background static dashed arc */}
            <path
              d={arc.d}
              fill="none"
              stroke="#E6DFD5"
              strokeWidth="1.5"
              strokeDasharray="4 6"
            />
            {/* Animated glowing arc pulse */}
            <motion.path
              d={arc.d}
              fill="none"
              stroke="url(#flightGradient)"
              strokeWidth="2.5"
              strokeDasharray="80 300"
              initial={{ strokeDashoffset: 380 }}
              animate={{ strokeDashoffset: -380 }}
              transition={{
                repeat: Infinity,
                duration: arc.duration,
                delay: arc.delay,
                ease: "linear"
              }}
            />
          </g>
        ))}
      </svg>

      {/* 3. Parallax Floating Vintage Passport Stamps */}
      <motion.div 
        animate={{ x: mousePos.x * 0.8, y: mousePos.y * 0.8 }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
        className="absolute inset-0"
      >
        {/* Top-Left Stamp: ROME ENTRY */}
        <motion.div
          animate={{ y: [0, -12, 0], rotate: [-12, -10, -12] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-28 left-[8%] opacity-[0.14] border-2 border-dashed border-[#1E1C1A] rounded-full p-4 text-center font-mono text-[10px] font-bold text-[#1E1C1A] select-none"
        >
          <div className="border border-[#1E1C1A] rounded-full p-3">
            <div>★ ROME ★</div>
            <div className="text-[8px] my-0.5">14 SEP 2026</div>
            <div className="text-[7px] tracking-widest">PASSED / IMMIGRATION</div>
          </div>
        </motion.div>

        {/* Top-Right Stamp: TOKYO ENTRY */}
        <motion.div
          animate={{ y: [0, 14, 0], rotate: [15, 18, 15] }}
          transition={{ duration: 9.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-36 right-[10%] opacity-[0.12] border-2 border-[#1E1C1A] rounded-2xl p-4 text-center font-mono text-[10px] font-bold text-[#1E1C1A] select-none"
        >
          <div>NARITA AIRPORT</div>
          <div className="text-[12px] font-serif my-1">東京 · TOKYO</div>
          <div className="text-[8px] border-t border-[#1E1C1A] pt-1">LANDING PERMISSION</div>
        </motion.div>

        {/* Bottom-Left Stamp: PARIS CONTROL */}
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [6, 4, 6] }}
          transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-24 left-[12%] opacity-[0.11] border-2 border-double border-[#1E1C1A] rounded-xl p-3.5 text-center font-mono text-[9px] font-bold text-[#1E1C1A] select-none"
        >
          <div>AÉROPORT DE PARIS</div>
          <div className="text-[10px] font-serif italic my-0.5">Charles de Gaulle</div>
          <div className="text-[7px]">ENTRÉE · 04 OCT</div>
        </motion.div>

        {/* Bottom-Right Stamp: AMALFI COAST */}
        <motion.div
          animate={{ y: [0, 12, 0], rotate: [-8, -5, -8] }}
          transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="absolute bottom-32 right-[14%] opacity-[0.13] border-2 border-[#1E1C1A] rounded-full p-4 text-center font-mono text-[9px] font-bold text-[#1E1C1A] select-none"
        >
          <div>POSITANO</div>
          <div className="text-[11px] font-serif my-0.5">Amalfi Coast</div>
          <div className="text-[7px]">APPROVED STRESS-FREE</div>
        </motion.div>
      </motion.div>

      {/* 4. Subtle Topographic Contour Elevation Overlay */}
      <svg className="absolute bottom-0 inset-x-0 w-full h-48 opacity-[0.06]" viewBox="0 0 1200 200" fill="none">
        <path d="M 0 150 Q 300 80, 600 130 T 1200 100" stroke="#1E1C1A" strokeWidth="1.5" />
        <path d="M 0 170 Q 350 110, 700 150 T 1200 120" stroke="#1E1C1A" strokeWidth="1" />
        <path d="M 0 190 Q 400 130, 800 170 T 1200 140" stroke="#1E1C1A" strokeWidth="1" />
      </svg>
    </div>
  );
}
