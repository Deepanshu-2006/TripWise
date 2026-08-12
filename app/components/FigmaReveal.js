'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * FigmaReveal — Luxury 3D Spatial Stacking Sheet Transition
 * 
 * Provides an authentic keynote / 3D spatial card transition:
 * - 3D spatial de-tilt & scale un-docking on scroll (rotateX: 8° → 0°, scale: 0.90 → 1.0)
 * - Negative section overlap so it seamlessly glides onto the preceding canvas
 * - Multi-layer diffusion ambient shadow & high-intensity top laser highlight beam
 */
export default function FigmaReveal({ children, id, index = 0 }) {
  const outerRef = useRef(null);
  const sheetRef = useRef(null);
  const beamRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const outer = outerRef.current;
    const sheet = sheetRef.current;
    const beam = beamRef.current;
    if (!outer || !sheet) return;

    // Initial 3D perspective pre-scroll state - divider is crisp and 100% visible from the very beginning
    gsap.set(sheet, {
      scale: index === 0 ? 0.94 : 0.90,
      y: index === 0 ? 80 : 120,
      rotateX: index === 0 ? 4 : 8,
      opacity: 1,
      transformPerspective: 1800,
      transformOrigin: 'center top',
    });

    if (beam) gsap.set(beam, { opacity: 1 });

    const ctx = gsap.context(() => {
      // Smooth scrubbed Smart Animate timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: outer,
          start: 'top 95%',
          end: 'top 20%',
          scrub: 0.65,
        },
      });

      tl.to(sheet, {
        y: 0,
        scale: 1,
        rotateX: 0,
        duration: 1,
        ease: 'power2.out',
      });
    }, outer);

    return () => ctx.revert();
  }, [index]);

  return (
    <div 
      ref={outerRef} 
      id={id} 
      className={`relative z-20 w-full ${
        index === 0 ? '-mt-24 md:-mt-36' : index === 2 ? '-mt-28 md:-mt-44' : '-mt-20 md:-mt-32'
      }`}
      style={{ perspective: '1800px' }}
    >
      <div
        ref={sheetRef}
        className="relative will-change-transform w-full bg-[#FFF8F5] rounded-t-[40px] md:rounded-t-[60px] border-t-2 border-[#FF5B1D] overflow-hidden"
        style={{
          boxShadow: '0 -28px 70px -15px rgba(0,0,0,0.18), 0 -10px 30px -5px rgba(0,0,0,0.12), 0 -2px 14px rgba(255,91,29,0.45), inset 0 1px 0 rgba(255,255,255,0.98)',
        }}
      >
        {/* Top Luminous Laser Beam / Prominent Specular Edge Line */}
        <div
          ref={beamRef}
          aria-hidden="true"
          className="absolute top-0 inset-x-0 h-[3px] pointer-events-none z-50"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,91,29,0.5) 10%, #FF5B1D 50%, rgba(255,91,29,0.5) 90%, transparent 100%)',
            boxShadow: '0 0 22px 3.5px rgba(255, 91, 29, 0.9), 0 2px 28px 5px rgba(255, 91, 29, 0.55)',
          }}
        />

        {children}
      </div>
    </div>
  );
}

