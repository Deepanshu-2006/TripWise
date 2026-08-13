'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * FigmaReveal — Luxury 3D Spatial Stacking Sheet Transition
 * 
 * Supports both vertical keynote un-docking ('bottom') and horizontal
 * Figma Smart-Animate slide-in ('right' -> slides from right to left).
 */
export default function FigmaReveal({ 
  children, 
  id, 
  index = 0, 
  variant = 'light',
  direction = 'bottom' // 'bottom' | 'right' | 'top' | 'zoom'
}) {
  const outerRef = useRef(null);
  const sheetRef = useRef(null);
  const topBeamRef = useRef(null);
  const leftBeamRef = useRef(null);

  const isDark = variant === 'dark';
  const isRight = direction === 'right';
  const isTop = direction === 'top';
  const isZoom = direction === 'zoom';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const outer = outerRef.current;
    const sheet = sheetRef.current;
    if (!outer || !sheet) return;

    if (isZoom) {
      // ✦ FIGMA SMOOTH SCALE REVEAL: Clean, Lag-Free Sheet Un-Docking ✦
      gsap.set(sheet, {
        scale: 0.94,
        y: 40,
        opacity: 0.9,
      });

      const ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: outer,
            start: 'top 92%',
            end: 'top 25%',
            scrub: 0.5,
          },
        });

        tl.to(sheet, {
          y: 0,
          scale: 1,
          opacity: 1,
          duration: 1,
          ease: 'power2.out',
        });
      }, outer);

      return () => ctx.revert();
    } else if (isRight) {
      // ✦ FIGMA SMART-ANIMATE: Slide In From Right (Right -> Left 3D Glide) ✦
      gsap.set(sheet, {
        xPercent: 55,
        y: 0,
        scale: 0.93,
        rotateY: -8,
        rotateZ: 1.2,
        opacity: 0.95,
        transformPerspective: 2000,
        transformOrigin: 'left center',
      });

      const ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: outer,
            start: 'top 92%',
            end: 'top 18%',
            scrub: 0.75,
          },
        });

        tl.to(sheet, {
          xPercent: 0,
          y: 0,
          scale: 1,
          rotateY: 0,
          rotateZ: 0,
          opacity: 1,
          duration: 1,
          ease: 'power2.out',
        });
      }, outer);

      return () => ctx.revert();
    } else if (isTop) {
      // ✦ FIGMA WALL DROP: Drop in from Up to Bottom ✦
      gsap.set(sheet, {
        scale: 0.92,
        y: -140,
        rotateX: -7,
        opacity: 0.9,
        transformPerspective: 1800,
        transformOrigin: 'center bottom',
      });

      const ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: outer,
            start: 'top 95%',
            end: 'top 20%',
            scrub: 0.7,
          },
        });

        tl.to(sheet, {
          y: 0,
          scale: 1,
          rotateX: 0,
          opacity: 1,
          duration: 1,
          ease: 'power2.out',
        });
      }, outer);

      return () => ctx.revert();
    } else {
      // ✦ FIGMA KEYNOTE: 3D Spatial Vertical Stacking Sheet (Bottom to Top) ✦
      gsap.set(sheet, {
        scale: index === 0 ? 0.94 : 0.90,
        y: index === 0 ? 80 : 120,
        rotateX: index === 0 ? 4 : 8,
        opacity: 1,
        transformPerspective: 1800,
        transformOrigin: 'center top',
      });

      const ctx = gsap.context(() => {
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
    }
  }, [index, isRight, isTop, isZoom]);

  return (
    <div 
      ref={outerRef} 
      id={id} 
      className={`relative z-20 w-full max-w-full overflow-x-clip ${
        index === 0 ? '-mt-24 md:-mt-36' : index === 3 ? '-mt-20 md:-mt-32' : index === 2 ? 'mt-0' : '-mt-20 md:-mt-32'
      }`}
      style={{ perspective: isRight ? '2200px' : '1800px' }}
    >
      <div
        ref={sheetRef}
        className={`relative will-change-transform transform-gpu w-full ${
          isDark ? 'bg-[#0A0A0A]' : 'bg-[#FFF8F5]'
        } ${
          isRight
            ? 'rounded-t-[40px] md:rounded-t-[60px] rounded-l-[40px] md:rounded-l-[60px] border-t-2 border-l-2 border-[#FF5B1D]'
            : 'rounded-t-[40px] md:rounded-t-[60px] border-t-2 border-[#FF5B1D]'
        } overflow-hidden`}
        style={{
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transformStyle: 'preserve-3d',
          boxShadow: isRight
            ? isDark
              ? '-35px -20px 85px -15px rgba(0,0,0,0.88), -10px 0 35px -5px rgba(0,0,0,0.7), -3px 0 20px rgba(255,91,29,0.7)'
              : '-30px -15px 75px -15px rgba(0,0,0,0.22), -10px 0 32px -5px rgba(0,0,0,0.14), -3px 0 16px rgba(255,91,29,0.5), inset 1px 1px 0 rgba(255,255,255,0.98)'
            : isDark
              ? '0 -35px 80px -15px rgba(0,0,0,0.85), 0 -10px 30px -5px rgba(0,0,0,0.7), 0 -2px 18px rgba(255,91,29,0.65)'
              : '0 -28px 70px -15px rgba(0,0,0,0.18), 0 -10px 30px -5px rgba(0,0,0,0.12), 0 -2px 14px rgba(255,91,29,0.45), inset 0 1px 0 rgba(255,255,255,0.98)',
        }}
      >
        {/* Top Luminous Laser Beam / Specular Edge Line */}
        <div
          ref={topBeamRef}
          aria-hidden="true"
          className="absolute top-0 inset-x-0 h-[3px] pointer-events-none z-50"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,91,29,0.5) 10%, #FF5B1D 50%, rgba(255,91,29,0.5) 90%, transparent 100%)',
            boxShadow: '0 0 22px 3.5px rgba(255, 91, 29, 0.9), 0 2px 28px 5px rgba(255, 91, 29, 0.55)',
          }}
        />

        {/* Left Leading Laser Beam (Active for Right-to-Left Slide) */}
        {isRight && (
          <div
            ref={leftBeamRef}
            aria-hidden="true"
            className="absolute top-0 bottom-0 left-0 w-[3px] pointer-events-none z-50"
            style={{
              background: 'linear-gradient(180deg, #FF5B1D 0%, rgba(255,91,29,0.7) 35%, rgba(255,91,29,0.2) 75%, transparent 100%)',
              boxShadow: '-4px 0 24px 4px rgba(255, 91, 29, 0.9), -2px 0 28px 6px rgba(255, 91, 29, 0.55)',
            }}
          />
        )}

        {children}
      </div>
    </div>
  );
}


