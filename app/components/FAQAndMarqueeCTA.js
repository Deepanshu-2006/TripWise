'use client';

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useAuth } from "@clerk/nextjs";

const faqData = [
  {
    question: "How does TripWise generate custom itineraries in 30 seconds?",
    answer: "Our AI engine simultaneously analyzes millions of real-time flight schedules, live hotel pricing, Michelin & local dining reviews, and seasonal weather patterns to craft optimal, logically routed day-by-day itineraries tailored to your exact taste."
  },
  {
    question: "Can I customize or re-order activities after the itinerary is built?",
    answer: "Absolutely! With our Real-Time Adjuster, you can effortlessly drag and drop activities, swap dining recommendations, or adjust pacing with a single click—and our intelligent timeline automatically recalculates travel times and routes instantly."
  },
  {
    question: "Is TripWise really free to use?",
    answer: "Yes! Creating your custom itinerary, exploring interactive maps, and collaborating with travel companions is 100% free. We also offer optional VIP concierge perks and direct booking guarantees for premium travelers."
  },
  {
    question: "How does TripWise handle dietary restrictions and accessibility?",
    answer: "During your quick 30-second onboarding questionnaire, you can specify gluten-free, vegan, halal, kosher, or wheelchair accessibility preferences. Our AI filters all restaurant, tour, and transit recommendations accordingly."
  },
  {
    question: "Can I export my itinerary to offline maps or my calendar?",
    answer: "Yes. With one click, you can export your complete day-by-day plan directly to Apple Wallet, Google Maps offline pins, or sync seamlessly with Apple Calendar, Google Calendar, and Outlook."
  }
];

const citiesTrack1 = [
  "PARIS", "TOKYO", "NEW YORK", "ROME", "BARCELONA", "KYOTO", "AMALFI", "LONDON", "ZURICH", "SANTORINI", "CAPE TOWN", "REYKJAVIK", "BALI", "SYDNEY"
];

const citiesTrack2 = [
  "VENICE", "LISBON", "PRAGUE", "AMSTERDAM", "DUBAI", "SEOUL", "BANFF", "FLORENCE", "MARRAKESH", "PATAGONIA", "CAIRO", "VIENNA", "HELSINKI", "ATHENS"
];

export default function FAQAndMarqueeCTA() {
  const { isSignedIn } = useAuth();
  const [openIdx, setOpenIdx] = useState(null);
  const contentRefs = useRef([]);
  const iconRefs = useRef([]);
  const buttonRef = useRef(null);
  const buttonTextRef = useRef(null);
  const ctaContainerRef = useRef(null);
  const marqueeTrack1Ref = useRef(null);
  const marqueeTrack2Ref = useRef(null);

  const [isFlying, setIsFlying] = useState(false);
  const plane1Ref = useRef(null);
  const plane2Ref = useRef(null);
  const plane3Ref = useRef(null);
  const wipeOverlayRef = useRef(null);

  const handleFlyTransition = (e) => {
    if (e) e.preventDefault();
    
    setIsFlying(true);
    
    const tl = gsap.timeline();

    // Plane 1: Swoops high and right
    tl.fromTo(plane1Ref.current, 
        { x: 0, y: 0, rotation: 0, scale: 0.5, opacity: 0 },
        { x: window.innerWidth * 0.6, ease: "power2.out", duration: 1.2, opacity: 1 }, 0
    ).to(plane1Ref.current, 
        { y: -window.innerHeight * 0.8, rotation: 75, scale: 2, ease: "power3.in", duration: 1.2 }, 0
    );

    // Plane 2: Swoops far right, lower
    tl.fromTo(plane2Ref.current, 
        { x: 0, y: 0, rotation: 0, scale: 0.3, opacity: 0 },
        { x: window.innerWidth * 0.8, ease: "power1.out", duration: 1.4, opacity: 1 }, 0.1
    ).to(plane2Ref.current, 
        { y: -window.innerHeight * 0.3, rotation: 85, scale: 1.2, ease: "power2.in", duration: 1.4 }, 0.1
    );

    // Plane 3: Swoops left and very high
    tl.fromTo(plane3Ref.current, 
        { x: 0, y: 0, rotation: 0, scale: 0.4, opacity: 0 },
        { x: -window.innerWidth * 0.4, ease: "power2.out", duration: 1.3, opacity: 1 }, 0.05
    ).to(plane3Ref.current, 
        { y: -window.innerHeight * 0.9, rotation: -45, scale: 1.5, ease: "power4.in", duration: 1.3 }, 0.05
    );

    // Cinematic Circle Wipe Transition
    tl.to(wipeOverlayRef.current, {
        scale: 250, // Massive scale to cover any screen
        opacity: 1,
        duration: 1.0,
        ease: "power3.inOut"
    }, 0.4);

    // Wait for the transition to finish
    setTimeout(() => {
        window.location.href = isSignedIn ? '/ai-planner' : '/sign-in';
    }, 1300);
  };

  // Handle Accordion Click with GSAP
  const toggleAccordion = (index) => {
    const isOpening = openIdx !== index;
    const prevIdx = openIdx;

    // Close previously open item
    if (prevIdx !== null && contentRefs.current[prevIdx]) {
      gsap.to(contentRefs.current[prevIdx], {
        height: 0,
        opacity: 0,
        duration: 0.4,
        ease: "power2.out"
      });
      if (iconRefs.current[prevIdx]) {
        gsap.to(iconRefs.current[prevIdx], {
          rotation: 0,
          duration: 0.4,
          ease: "power2.out"
        });
      }
    }

    // Open or close current item
    if (isOpening) {
      setOpenIdx(index);
      const target = contentRefs.current[index];
      if (target) {
        gsap.fromTo(target,
          { height: 0, opacity: 0 },
          {
            height: target.scrollHeight,
            opacity: 1,
            duration: 0.45,
            ease: "power3.out"
          }
        );
      }
      if (iconRefs.current[index]) {
        gsap.to(iconRefs.current[index], {
          rotation: 45,
          duration: 0.4,
          ease: "power3.out"
        });
      }
    } else {
      setOpenIdx(null);
    }
  };

  // Marquee & Pulsing Glow GSAP Effects
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Track 1: Scroll left to right continuously
      if (marqueeTrack1Ref.current) {
        gsap.to(marqueeTrack1Ref.current, {
          xPercent: -50,
          duration: 35,
          repeat: -1,
          ease: "none"
        });
      }

      // Track 2: Scroll right to left continuously
      if (marqueeTrack2Ref.current) {
        gsap.fromTo(marqueeTrack2Ref.current,
          { xPercent: -50 },
          {
            xPercent: 0,
            duration: 40,
            repeat: -1,
            ease: "none"
          }
        );
      }

      // Ambient Orange Glow Slow Pulse
      gsap.to(".cta-ambient-glow", {
        scale: 1.3,
        opacity: 0.85,
        duration: 4.5,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      });
    });

    return () => ctx.revert();
  }, []);

  // Magnetic Button MouseMove Attraction Listener
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!buttonRef.current || !buttonTextRef.current) return;

      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Distance from cursor to button center
      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;
      const distance = Math.hypot(distX, distY);

      // Proximity radius of 100px around the button's outer bounds
      const proximityRadius = 100 + rect.width / 2;

      if (distance < proximityRadius) {
        // Pull button slightly toward cursor (magnetic effect)
        const pullFactor = 0.35;
        const textPullFactor = 0.15;

        gsap.to(buttonRef.current, {
          x: distX * pullFactor,
          y: distY * pullFactor,
          duration: 0.35,
          ease: "power2.out",
          overwrite: "auto"
        });

        gsap.to(buttonTextRef.current, {
          x: distX * textPullFactor,
          y: distY * textPullFactor,
          duration: 0.35,
          ease: "power2.out",
          overwrite: "auto"
        });
      } else {
        // Snap back smoothly when cursor leaves proximity radius
        gsap.to(buttonRef.current, {
          x: 0,
          y: 0,
          duration: 0.7,
          ease: "elastic.out(1, 0.4)",
          overwrite: "auto"
        });

        gsap.to(buttonTextRef.current, {
          x: 0,
          y: 0,
          duration: 0.7,
          ease: "elastic.out(1, 0.4)",
          overwrite: "auto"
        });
      }
    };

    const handleMouseLeave = () => {
      if (!buttonRef.current || !buttonTextRef.current) return;
      gsap.to([buttonRef.current, buttonTextRef.current], {
        x: 0,
        y: 0,
        duration: 0.7,
        ease: "elastic.out(1, 0.4)",
        overwrite: "auto"
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="w-full bg-[#FFF8F5] overflow-hidden relative">
      {/* 1. FAQ Accordion Architecture */}
      <section className="py-24 md:py-32 max-w-4xl mx-auto px-4 md:px-8 relative z-10">
        <div className="text-center mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-[#FF5B1D] text-xs font-bold tracking-widest uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5B1D] animate-pulse" />
            CLARITY & PRECISION
          </div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-[#111827] tracking-tight mb-4">
            Got Questions? We Have Itineraries.
          </h2>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about how TripWise replaces weeks of open-tab research with instant, AI-perfected travel planning.
          </p>
        </div>

        {/* Vertical Stack of Borderless Accordion Rows */}
        <div className="space-y-2">
          {faqData.map((item, i) => {
            const isOpen = openIdx === i;
            return (
              <div
                key={i}
                className="group cursor-pointer transition-colors duration-200"
                style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}
                onClick={() => toggleAccordion(i)}
              >
                <div className="py-6 md:py-7 flex items-center justify-between gap-4">
                  <h3 className="text-lg md:text-xl font-bold text-[#111827] group-hover:text-[#FF5B1D] transition-colors duration-200">
                    {item.question}
                  </h3>
                  <div
                    ref={(el) => (iconRefs.current[i] = el)}
                    className="w-8 h-8 rounded-full bg-black/5 group-hover:bg-[#FF5B1D]/10 flex items-center justify-center shrink-0 transition-colors duration-200"
                  >
                    <svg
                      className="w-4 h-4 text-gray-700 group-hover:text-[#FF5B1D] transition-colors duration-200"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </div>

                <div
                  ref={(el) => (contentRefs.current[i] = el)}
                  className="h-0 opacity-0 overflow-hidden text-gray-600 text-base md:text-lg leading-relaxed pr-8"
                >
                  <div className="pb-7">
                    {item.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. The Final Marquee CTA Container */}
      <section
        ref={ctaContainerRef}
        className="relative w-full bg-[#0A0A0A] py-32 md:py-44 overflow-hidden flex flex-col items-center justify-center text-center select-none"
      >
        {/* Soft Ambient Orange Pulse Layer */}
        <div className="cta-ambient-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-87.5 md:w-162.5 h-62.5 md:h-112.5 rounded-full bg-[#F97316]/30 blur-[130px] md:blur-[180px] pointer-events-none z-0" />

        {/* Infinite Horizontal Dual-Track Marquee Background at Low Opacity */}
        <div className="absolute inset-0 flex flex-col justify-between py-12 pointer-events-none overflow-hidden z-0 opacity-15 md:opacity-20">
          {/* Track 1 (Left to Right) */}
          <div className="w-full overflow-hidden whitespace-nowrap flex">
            <div ref={marqueeTrack1Ref} className="inline-flex gap-8 items-center text-3xl md:text-6xl font-black text-white/40 tracking-wider">
              {citiesTrack1.concat(citiesTrack1).map((city, index) => (
                <span key={index} className="flex items-center gap-8">
                  <span>{city}</span>
                  <span className="w-2 h-2 rounded-full bg-[#FF5B1D]/60" />
                </span>
              ))}
            </div>
          </div>

          {/* Track 2 (Right to Left) */}
          <div className="w-full overflow-hidden whitespace-nowrap flex">
            <div ref={marqueeTrack2Ref} className="inline-flex gap-8 items-center text-3xl md:text-6xl font-black text-white/40 tracking-wider">
              {citiesTrack2.concat(citiesTrack2).map((city, index) => (
                <span key={index} className="flex items-center gap-8">
                  <span>{city}</span>
                  <span className="w-2 h-2 rounded-full bg-[#FF5B1D]/60" />
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Center Massive High-Contrast Text Block & Magnetic Button */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 flex flex-col items-center">
          <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-none mb-10 md:mb-14 drop-shadow-lg">
            Stop planning.<br />
            <span className="bg-linear-to-r from-white via-orange-100 to-[#FF5B1D] bg-clip-text text-transparent">
              Start traveling.
            </span>
          </h2>

          {/* 3. The Magnetic Button */}
          <div className="relative inline-block p-4">
            <button
              ref={buttonRef}
              onClick={handleFlyTransition}
              className={`group relative inline-flex items-center justify-center px-8 sm:px-12 py-5 sm:py-6 rounded-full bg-[#FF5B1D] text-white font-extrabold text-lg sm:text-2xl tracking-wide shadow-[0_0_50px_rgba(249,115,22,0.4)] transition-shadow duration-300 cursor-pointer overflow-visible border border-white/20 ${isFlying ? 'scale-95 shadow-[0_0_80px_rgba(249,115,22,0.8)]' : 'hover:bg-[#ff6c34] hover:shadow-[0_0_80px_rgba(249,115,22,0.6)]'}`}
            >
              {/* Button inner highlight sheen */}
              <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                <span className={`absolute inset-0 w-1/2 h-full bg-white/20 skew-x-[-25deg] -translate-x-full transition-transform duration-1000 ease-out pointer-events-none ${isFlying ? 'opacity-0' : 'group-hover:translate-x-[300%]'}`} />
              </div>

              {/* Parallax Button Text */}
              <span ref={buttonTextRef} className={`relative z-10 flex items-center gap-3 transition-colors duration-300 ${isFlying ? 'text-[#FF5B1D] opacity-0' : ''}`}>
                <span>[ Plan My Trip — It&apos;s Free ]</span>
                <svg
                  className={`w-6 h-6 transition-transform duration-300 ${isFlying ? 'translate-x-10 opacity-0' : 'group-hover:translate-x-1.5'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>

              {/* Plane 1 (Main, fast) */}
              <svg ref={plane1Ref} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-white z-50 pointer-events-none opacity-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.524-.46.529-.65-.013l-3.35-9.404-9.327-3.311Zm9.638 4.27 2.656 7.457 4.148-14.52-14.52 4.839 8.358 2.966c.277.098.423.238.455.514l-2.083 6.945-1.014-8.197Z" />
              </svg>
              
              {/* Plane 2 (Smaller, flies wider right) */}
              <svg ref={plane2Ref} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-[#FFF8F5] z-50 pointer-events-none opacity-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.524-.46.529-.65-.013l-3.35-9.404-9.327-3.311Zm9.638 4.27 2.656 7.457 4.148-14.52-14.52 4.839 8.358 2.966c.277.098.423.238.455.514l-2.083 6.945-1.014-8.197Z" />
              </svg>

              {/* Plane 3 (Medium, flies higher left) */}
              <svg ref={plane3Ref} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-[#FFE6DA] z-50 pointer-events-none opacity-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.524-.46.529-.65-.013l-3.35-9.404-9.327-3.311Zm9.638 4.27 2.656 7.457 4.148-14.52-14.52 4.839 8.358 2.966c.277.098.423.238.455.514l-2.083 6.945-1.014-8.197Z" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Cinematic Circle Wipe Transition Overlay */}
      <div 
          ref={wipeOverlayRef} 
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[20px] h-[20px] bg-[#0A0A0A] rounded-full z-[99999] pointer-events-none opacity-0 origin-center" 
      />
    </div>
  );
}
