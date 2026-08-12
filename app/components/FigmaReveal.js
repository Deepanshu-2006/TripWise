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

    // Initial 3D perspective pre-scroll state
    gsap.set(sheet, {
      scale: index === 0 ? 0.94 : 0.90,
      y: index === 0 ? 80 : 130,
      rotateX: index === 0 ? 4 : 8,
      opacity: 0.15,
      filter: 'blur(10px)',
      transformPerspective: 1800,
      transformOrigin: 'center top',
    });

    if (beam) gsap.set(beam, { opacity: 0.9 });

    const ctx = gsap.context(() => {
      // Smooth scrubbed Smart Animate timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: outer,
          start: 'top 92%',
          end: 'top 22%',
          scrub: 0.6,
        },
      });

      tl.to(sheet, {
        opacity: 1,
        y: 0,
        scale: 1,
        rotateX: 0,
        filter: 'blur(0px)',
        duration: 1,
        ease: 'power2.out',
      });

      // Keep top laser beam vibrant throughout scroll
      ScrollTrigger.create({
        trigger: outer,
        start: 'top 85%',
        onEnter: () => {
          if (!beam) return;
          gsap.to(beam, { opacity: 1, duration: 0.35, ease: 'power2.out' });
        },
        onLeaveBack: () => {
          if (!beam) return;
          gsap.to(beam, { opacity: 0.75, duration: 0.35 });
        },
      });
    }, outer);

    return () => ctx.revert();
  }, [index]);

  return (
    <div 
      ref={outerRef} 
      id={id} 
      className={`relative z-20 w-full ${
        index === 0 ? '-mt-24 md:-mt-36' : '-mt-20 md:-mt-32'
      }`}
      style={{ perspective: '1800px' }}
    >
      <div
        ref={sheetRef}
        className="relative will-change-transform w-full bg-[#FFF8F5] rounded-t-[40px] md:rounded-t-[60px] border-t-2 border-[#FF5B1D]/40 overflow-hidden"
        style={{
          boxShadow: '0 -25px 60px -15px rgba(0,0,0,0.16), 0 -10px 30px -5px rgba(0,0,0,0.1), 0 -2px 12px rgba(255,91,29,0.35), inset 0 1px 0 rgba(255,255,255,0.98)',
        }}
      >
        {/* Top Luminous Laser Beam / Prominent Specular Edge Line */}
        <div
          ref={beamRef}
          aria-hidden="true"
          className="absolute top-0 inset-x-0 h-[3px] pointer-events-none z-50 transition-opacity duration-300"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,91,29,0.4) 10%, #FF5B1D 50%, rgba(255,91,29,0.4) 90%, transparent 100%)',
            boxShadow: '0 0 20px 3px rgba(255, 91, 29, 0.8), 0 2px 25px 5px rgba(255, 91, 29, 0.45)',
          }}
        />

        {children}
      </div>
    </div>
  );
}

