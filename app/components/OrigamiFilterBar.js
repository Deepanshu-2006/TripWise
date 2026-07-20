'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OrigamiFilterBar({ children }) {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [phase, setPhase] = useState('initial'); 
  // Phases: 'initial', 'flying', 'unfold_wings', 'unfold_body', 'stretch', 'settled'

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
      setShouldAnimate(true);
      
      setPhase('flying');
      
      // Part 1: Outer wings unfold
      setTimeout(() => setPhase('unfold_wings'), 1000);
      
      // Part 2: Body opens into a flat letter/paper
      setTimeout(() => setPhase('unfold_body'), 1600);
      
      // Part 3: The letter stretches into the long filter bar
      setTimeout(() => setPhase('stretch'), 2200);
      
      // Part 4: Settle and show real UI
      setTimeout(() => {
        setPhase('settled');
      }, 2700);
    } else {
      setPhase('settled');
    }
  }, []);

  if (phase === 'initial') {
    return <div className="invisible">{children}</div>;
  }

  if (phase === 'settled' && !shouldAnimate) {
    return <>{children}</>;
  }

  // --- SVG MORPH POINTS ---
  // ViewBox is 1200x120. Center is X=600.
  
  const phases = {
    flying: {
      wing_L: "600,-50 600,-50 550,100 450,130",
      body_L: "600,-50 600,-50 600,150 550,100",
      body_R: "600,-50 600,-50 650,100 600,150",
      wing_R: "600,-50 600,-50 750,130 650,100",
      color_L_outer: "#f88732",
      color_L_inner: "#fe7717",
      color_R_inner: "#e86912",
      color_R_outer: "#d65f0e",
      opacity: 1
    },
    unfold_wings: {
      wing_L: "450,-30 600,-50 550,100 350,100",
      body_L: "600,-50 600,-50 600,150 550,100",
      body_R: "600,-50 600,-50 650,100 600,150",
      wing_R: "600,-50 750,-30 850,100 650,100",
      color_L_outer: "#fca360",
      color_L_inner: "#fe7717",
      color_R_inner: "#e86912",
      color_R_outer: "#fa9548",
      opacity: 1
    },
    unfold_body: {
      wing_L: "400,-20 500,-20 500,140 400,140",
      body_L: "500,-20 600,-20 600,140 500,140",
      body_R: "600,-20 700,-20 700,140 600,140",
      wing_R: "700,-20 800,-20 800,140 700,140",
      color_L_outer: "#ffffff",
      color_L_inner: "#ffffff",
      color_R_inner: "#ffffff",
      color_R_outer: "#ffffff",
      opacity: 1
    },
    stretch: {
      wing_L: "0,0 300,0 300,120 0,120",
      body_L: "300,0 600,0 600,120 300,120",
      body_R: "600,0 900,0 900,120 600,120",
      wing_R: "900,0 1200,0 1200,120 900,120",
      color_L_outer: "#ffffff",
      color_L_inner: "#ffffff",
      color_R_inner: "#ffffff",
      color_R_outer: "#ffffff",
      opacity: 0 // Fade out as the real bar fades in
    }
  };

  const current = phases[phase] || phases.stretch;

  return (
    <div className="relative w-full">
      {/* SVG Morph Container */}
      <AnimatePresence>
        {phase !== 'settled' && (
          <motion.div
            className="absolute inset-0 z-50 pointer-events-none flex justify-center items-center"
            initial={{ x: '50vw', y: '-40vh', rotateZ: -30, scale: 0.6 }}
            animate={{ x: 0, y: 0, rotateZ: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 1.0, 
              ease: [0.25, 1, 0.5, 1] 
            }}
          >
            <div className="relative w-full max-w-6xl mx-auto h-[120px]">
              <svg 
                viewBox="0 0 1200 120" 
                preserveAspectRatio="none"
                className="w-full h-full drop-shadow-[0_12px_30px_rgba(254,119,23,0.3)] overflow-visible"
              >
                {/* Left Wing (Outer) */}
                <motion.polygon
                  animate={{ 
                    points: current.wing_L,
                    fill: current.color_L_outer,
                    opacity: current.opacity
                  }}
                  transition={{ duration: 0.5, type: 'spring', bounce: 0.2 }}
                  style={{ stroke: 'rgba(0,0,0,0.02)', strokeWidth: 1 }}
                />
                
                {/* Left Body (Inner) */}
                <motion.polygon
                  animate={{ 
                    points: current.body_L,
                    fill: current.color_L_inner,
                    opacity: current.opacity
                  }}
                  transition={{ duration: 0.5, type: 'spring', bounce: 0.2 }}
                  style={{ stroke: 'rgba(0,0,0,0.02)', strokeWidth: 1 }}
                />

                {/* Right Body (Inner) */}
                <motion.polygon
                  animate={{ 
                    points: current.body_R,
                    fill: current.color_R_inner,
                    opacity: current.opacity
                  }}
                  transition={{ duration: 0.5, type: 'spring', bounce: 0.2 }}
                  style={{ stroke: 'rgba(0,0,0,0.02)', strokeWidth: 1 }}
                />

                {/* Right Wing (Outer) */}
                <motion.polygon
                  animate={{ 
                    points: current.wing_R,
                    fill: current.color_R_outer,
                    opacity: current.opacity
                  }}
                  transition={{ duration: 0.5, type: 'spring', bounce: 0.2 }}
                  style={{ stroke: 'rgba(0,0,0,0.02)', strokeWidth: 1 }}
                />
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The real filter bar UI */}
      <motion.div
        className={`relative ${phase === 'settled' ? 'pointer-events-auto' : 'pointer-events-none'}`}
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: (phase === 'stretch' || phase === 'settled') ? 1 : 0, 
        }}
        transition={{ duration: 0.4, delay: phase === 'stretch' ? 0.2 : 0 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
