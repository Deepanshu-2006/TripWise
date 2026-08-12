'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * FigmaReveal — Luxury Studio Stacking Sheet & Spatial Transition
 * 
 * Provides an Apple/Figma keynote-level stacked layer transition:
 * - Negative overlap so the incoming section glides seamlessly over the receding section
 * - 3D spatial perspective staging (starts tilted in depth, scales from 0.92 → 1.0)
 * - Multi-layer diffusion ambient shadow & specular glass top border
 * - Glowing Figma laser beam on the leading edge
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
      scale: index === 0 ? 0.94 : 0.92,
      y: index === 0 ? 80 : 100,
      rotateX: index === 0 ? 3 : 5,
      opacity: 0.2,
      filter: 'blur(8px)',
      transformPerspective: 1600,
      transformOrigin: 'center top',
    });

    if (beam) {
      gsap.set(beam, { opacity: 0 });
    }

    const ctx = gsap.context(() => {
      // Smooth scrubbed Smart Animate timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: outer,
          start: 'top 90%',
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

      // Luminous selection beam flash on entry
      ScrollTrigger.create({
        trigger: outer,
        start: 'top 75%',
        once: true,
        onEnter: () => {
          if (!beam) return;
          gsap.timeline()
            .to(beam, { opacity: 1, duration: 0.35, ease: 'power2.out' })
            .to(beam, { opacity: 0.3, duration: 1.0, ease: 'power2.inOut' });
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
      style={{ perspective: '1600px' }}
    >
      <div
        ref={sheetRef}
        className="relative will-change-transform w-full bg-[#FFF8F5] rounded-t-[40px] md:rounded-t-[60px] border-t border-brand-dark/10 overflow-hidden"
        style={{
          boxShadow: '0 -35px 110px -20px rgba(0,0,0,0.08), 0 -50px 140px rgba(254,119,23,0.05), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 2px 10px rgba(254,119,23,0.03)',
        }}
      >
        {/* Top Luminous Laser Beam / Specular Edge */}
        <div
          ref={beamRef}
          aria-hidden="true"
          className="absolute top-0 inset-x-0 h-1 pointer-events-none z-50 transition-opacity duration-300"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, #fe7717 25%, #ff9c6d 50%, #fe7717 75%, transparent 100%)',
            boxShadow: '0 0 25px 3px rgba(254, 119, 23, 0.5), 0 0 50px 8px rgba(254, 119, 23, 0.2)',
          }}
        />
        {children}
      </div>
    </div>
  );
}
