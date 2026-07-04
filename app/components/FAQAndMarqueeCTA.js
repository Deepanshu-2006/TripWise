'use client';

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

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
  const [openIdx, setOpenIdx] = useState(null);
  const contentRefs = useRef([]);
  const iconRefs = useRef([]);
  const buttonRef = useRef(null);
  const buttonTextRef = useRef(null);
  const ctaContainerRef = useRef(null);
  const marqueeTrack1Ref = useRef(null);
  const marqueeTrack2Ref = useRef(null);

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
              className="group relative inline-flex items-center justify-center px-8 sm:px-12 py-5 sm:py-6 rounded-full bg-[#FF5B1D] hover:bg-[#ff6c34] text-white font-extrabold text-lg sm:text-2xl tracking-wide shadow-[0_0_50px_rgba(249,115,22,0.4)] hover:shadow-[0_0_80px_rgba(249,115,22,0.6)] transition-shadow duration-300 cursor-pointer overflow-hidden border border-white/20"
            >
              {/* Button inner highlight sheen */}
              <span className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-[-25deg] -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out pointer-events-none" />

              {/* Parallax Button Text */}
              <span ref={buttonTextRef} className="relative z-10 flex items-center gap-3">
                <span>[ Plan My Trip — It&apos;s Free ]</span>
                <svg
                  className="w-6 h-6 transition-transform duration-300 group-hover:translate-x-1.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
