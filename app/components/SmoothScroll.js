'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function SmoothScroll({ children }) {
  const lenisRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    // Initialize Lenis with refined momentum and dampening for silky 60/120fps 3D scrolling
    const lenis = new Lenis({
      lerp: 0.08, // Liquid-smooth momentum interpolation
      duration: 1.2,
      smoothWheel: true,
      wheelMultiplier: 0.85, // Gentle, controlled scroll momentum
      touchMultiplier: 1.2,
      infinite: false,
    });

    lenisRef.current = lenis;

    // 1. Sync Lenis scroll with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // 2. Drive Lenis updates directly from GSAP's high-precision 60/120fps Ticker
    const updateTicker = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateTicker);

    // 3. Disable lagSmoothing so GSAP doesn't stutter or drop frames during intensive 3D transforms
    gsap.ticker.lagSmoothing(0);

    // Make lenis globally accessible for any subcomponents
    window.__lenis = lenis;

    return () => {
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);

  return <>{children}</>;
}
