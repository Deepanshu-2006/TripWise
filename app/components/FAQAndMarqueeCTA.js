'use client';

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from "@clerk/nextjs";
import FigmaReveal from "./FigmaReveal";
import TravelTelemetryBackground from "./TravelTelemetryBackground";
import HorizonWarp from "./HorizonWarp";

const faqNotes = [
  {
    id: 'memo-01',
    num: '01',
    category: '⚡ SPEED & AI',
    bg: '#FEF9C3', // Warm Canary Yellow
    borderColor: '#FDE047',
    pinColor: '#EF4444', // Red metallic pushpin
    tapeAngle: '-3deg',
    defaultRotate: -2.4,
    tag: '30-SEC ENGINE',
    question: "How does TripWise generate custom itineraries in 30 seconds?",
    answer: "Our multi-agent AI pipeline ingests your prompt and computes optimal logical paths by synchronizing live flight tables, hotel inventory, Michelin & local dining guides, and neighborhood opening hours simultaneously.",
    highlight: "✓ Multi-API parallel routing engine with zero wait time",
    stamp: "DISPATCH #849 • AI CORE",
    helpfulCount: 84
  },
  {
    id: 'memo-02',
    num: '02',
    category: '🎨 DRAG & DROP',
    bg: '#DCFCE7', // Mint Sage
    borderColor: '#86EFAC',
    pinColor: '#10B981', // Emerald green pin
    tapeAngle: '4deg',
    defaultRotate: 2.6,
    tag: 'REAL-TIME EDIT',
    question: "Can I customize or re-order activities after the itinerary is built?",
    answer: "Yes! Every itinerary is 100% interactive. Effortlessly drag and reorder stops, swap restaurants, or add custom notes. Our map geometry recalculates walk and transit times immediately.",
    highlight: "✓ Live map geometry recalculation on every edit",
    stamp: "FLEXIBLE TIMELINE",
    helpfulCount: 62
  },
  {
    id: 'memo-03',
    num: '03',
    category: '💎 ZERO COST',
    bg: '#FFE4E6', // Peach Blush
    borderColor: '#FDA4AF',
    pinColor: '#F43F5E', // Rose Gold pin
    tapeAngle: '-2deg',
    defaultRotate: -1.8,
    tag: '100% FREE',
    question: "Is TripWise really free to use?",
    answer: "Creating unlimited custom itineraries, discovering curated destinations, and syncing with co-travelers is 100% free. No credit card required, ever. Optional premium concierge add-ons are available for VIP hotel upgrades.",
    highlight: "✓ Unlimited free itineraries & co-traveler invites",
    stamp: "ZERO HIDDEN FEES",
    helpfulCount: 118
  },
  {
    id: 'memo-04',
    num: '04',
    category: '🥗 DIET & ACCESS',
    bg: '#E0F2FE', // Soft Sky Blue
    borderColor: '#7DD3FC',
    pinColor: '#0284C7', // Sapphire pin
    tapeAngle: '3deg',
    defaultRotate: 2.2,
    tag: 'ACCESSIBLE',
    question: "How does TripWise handle dietary restrictions and accessibility?",
    answer: "During your prompt or settings setup, specify vegan, halal, kosher, celiac, or mobility requirements. Our recommendations automatically exclude inaccessible venues and flag certified restaurants.",
    highlight: "✓ Verified accessibility checks & filtered menus",
    stamp: "INCLUSIVE TRAVEL ENGINE",
    helpfulCount: 47
  },
  {
    id: 'memo-05',
    num: '05',
    category: '📲 OFFLINE & SYNC',
    bg: '#EDE9FE', // Lilac Purple
    borderColor: '#C4B5FD',
    pinColor: '#8B5CF6', // Purple pin
    tapeAngle: '-4deg',
    defaultRotate: -2.8,
    tag: 'OFFLINE SYNC',
    question: "Can I export my itinerary to offline maps or my calendar?",
    answer: "1-click export sends your entire day-by-day routing into Apple Wallet passes, Google Maps saved pins, or synced ICS calendar invites for Google Calendar, Apple Calendar, and Outlook.",
    highlight: "✓ 1-click Apple Wallet pass & offline GPX export",
    stamp: "OFFLINE READY",
    helpfulCount: 93
  }
];



export default function FAQAndMarqueeCTA() {
  const { isSignedIn } = useAuth();
  const [openIdx, setOpenIdx] = useState(null); // All sticky notes start collapsed by default
  const [helpfulCounts, setHelpfulCounts] = useState(
    faqNotes.reduce((acc, n, i) => ({ ...acc, [i]: n.helpfulCount }), {})
  );
  const [helpfulClicked, setHelpfulClicked] = useState({});

  const noteRefs = useRef([]);
  const contentRefs = useRef([]);
  const polaroidRefs = useRef([]);
  const buttonRef = useRef(null);
  const buttonTextRef = useRef(null);
  const ctaContainerRef = useRef(null);

  const faqSectionRef = useRef(null);
  const faqHeaderRef = useRef(null);

  const [isFlying, setIsFlying] = useState(false);
  const plane1Ref = useRef(null);
  const plane2Ref = useRef(null);
  const plane3Ref = useRef(null);
  const wipeOverlayRef = useRef(null);

  const handleHelpfulClick = (e, index) => {
    e.stopPropagation();
    if (helpfulClicked[index]) return;
    setHelpfulClicked(prev => ({ ...prev, [index]: true }));
    setHelpfulCounts(prev => ({ ...prev, [index]: prev[index] + 1 }));
  };

  const handleFlyTransition = (e) => {
    if (e) e.preventDefault();
    
    setIsFlying(true);
    
    const tl = gsap.timeline();

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    tl.fromTo(plane1Ref.current, 
        { x: 0, y: 0, rotation: 0, scale: 0.5, opacity: 0 },
        { x: window.innerWidth * 0.6, ease: "power2.out", duration: 1.2, opacity: 1 }, 0
    ).to(plane1Ref.current, 
        { y: -window.innerHeight * (isMobile ? 0.5 : 0.8), rotation: 75, scale: 2, ease: "power3.in", duration: 1.2 }, 0
    );

    tl.fromTo(plane2Ref.current, 
        { x: 0, y: 0, rotation: 0, scale: 0.3, opacity: 0 },
        { x: window.innerWidth * 0.8, ease: "power1.out", duration: 1.4, opacity: 1 }, 0.1
    ).to(plane2Ref.current, 
        { y: -window.innerHeight * (isMobile ? 0.2 : 0.3), rotation: 85, scale: 1.2, ease: "power2.in", duration: 1.4 }, 0.1
    );

    tl.fromTo(plane3Ref.current, 
        { x: 0, y: 0, rotation: 0, scale: 0.4, opacity: 0 },
        { x: -window.innerWidth * 0.4, ease: "power2.out", duration: 1.3, opacity: 1 }, 0.05
    ).to(plane3Ref.current, 
        { y: -window.innerHeight * (isMobile ? 0.6 : 0.9), rotation: -45, scale: 1.5, ease: "power4.in", duration: 1.3 }, 0.05
    );

    tl.to(wipeOverlayRef.current, {
        scale: 250,
        opacity: 1,
        duration: 1.0,
        ease: "power3.inOut"
    }, 0.4);

    setTimeout(() => {
        window.location.href = isSignedIn ? '/ai-planner/new' : '/sign-in';
    }, 1300);
  };

  const getRotate = (idx) => (typeof window !== 'undefined' && window.innerWidth >= 1024) ? faqNotes[idx].defaultRotate : 0;

  // ✦ Fluid Origami Paper Unfold & Clean Accordion Expansion ✦
  const toggleStickyNote = (index) => {
    const isOpening = openIdx !== index;
    const prevIdx = openIdx;

    // 1. Smoothly fold up previously opened note
    if (prevIdx !== null && contentRefs.current[prevIdx]) {
      gsap.to(contentRefs.current[prevIdx], {
        height: 0,
        opacity: 0,
        duration: 0.25,
        ease: "power2.inOut",
        overwrite: 'auto',
      });
      if (noteRefs.current[prevIdx]) {
        gsap.to(noteRefs.current[prevIdx], {
          rotate: getRotate(prevIdx),
          scale: 1,
          y: 0,
          opacity: 1,
          duration: 0.3,
          ease: "power2.out",
          overwrite: 'auto',
        });
      }
    }

    // 2. Open target note with smooth fluid reveal
    if (isOpening) {
      setOpenIdx(index);

      // Kill any conflicting animations
      gsap.killTweensOf(noteRefs.current.filter(Boolean));

      // Active card unpins & pops slightly forward
      const activeEl = noteRefs.current[index];
      if (activeEl) {
        gsap.to(activeEl, {
          rotate: 0,
          scale: 1.015,
          y: -4,
          opacity: 1,
          duration: 0.3,
          ease: "power2.out",
          overwrite: 'auto',
        });

        // Pushpin Head Pulse
        const pinHead = activeEl.querySelector('.pushpin-head');
        if (pinHead) {
          gsap.fromTo(pinHead,
            { scale: 1, y: 0 },
            { scale: 1.3, y: -3, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.out' }
          );
        }
      }

      // Keep background notes crisp and fully visible — no screen dimming or flashing
      noteRefs.current.forEach((el, i) => {
        if (!el || i === index) return;
        gsap.to(el, {
          scale: 1,
          y: 0,
          opacity: 1,
          duration: 0.3,
          ease: "power2.out",
          overwrite: 'auto',
        });
      });

      // Target answer content: measure height cleanly without reflow snaps
      const target = contentRefs.current[index];
      if (target) {
        target.style.height = 'auto';
        const fullHeight = target.scrollHeight;
        target.style.height = '0px';

        gsap.fromTo(target,
          { height: 0, opacity: 0 },
          {
            height: fullHeight,
            opacity: 1,
            duration: 0.35,
            ease: "power2.out",
            overwrite: 'auto',
            onComplete: () => {
              target.style.height = 'auto';
            }
          }
        );

        // Staggered Takeaway Badge & Helpful Stamp Seal Reveal
        const takeaway = target.querySelector('.takeaway-badge');
        const stampBar = target.querySelector('.stamp-seal-bar');

        if (takeaway) {
          gsap.fromTo(takeaway,
            { x: -16, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.3, delay: 0.1, ease: "power2.out" }
          );
        }

        if (stampBar) {
          gsap.fromTo(stampBar,
            { scale: 1.1, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.3, delay: 0.15, ease: "power2.out" }
          );
        }
      }
    } else {
      setOpenIdx(null);
      // Restore all notes to normal state on corkboard
      noteRefs.current.forEach((el, i) => {
        if (!el) return;
        gsap.to(el, {
          rotate: getRotate(i),
          scale: 1,
          y: 0,
          opacity: 1,
          duration: 0.3,
          ease: "power2.out",
          overwrite: 'auto',
        });
      });
    }
  };

  const handleNoteHover = (index) => {
    if (openIdx !== null) return;
    const el = noteRefs.current[index];
    if (!el) return;

    gsap.to(el, {
      rotate: 0,
      scale: 1.03,
      y: -6,
      duration: 0.25,
      ease: "power2.out",
      overwrite: 'auto'
    });
  };

  const handleNoteLeave = (index) => {
    if (openIdx !== null) return;
    const el = noteRefs.current[index];
    if (!el) return;

    gsap.to(el, {
      rotate: getRotate(index),
      scale: 1,
      y: 0,
      duration: 0.35,
      ease: "power2.out",
      overwrite: 'auto'
    });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const section = faqSectionRef.current;
    const header = faqHeaderRef.current;
    if (!section) return;

    if (header) {
      gsap.set(header, {
        y: -30,
        opacity: 0,
      });
    }

    polaroidRefs.current.forEach((el, idx) => {
      if (!el) return;
      gsap.set(el, {
        y: -40,
        opacity: 0,
        rotate: idx === 0 ? -10 : 12,
        scale: 0.9,
      });
    });

    // ✦ Fast, Silky-Smooth Figma Smart-Animate Stagger Entrance ✦
    noteRefs.current.forEach((el, idx) => {
      if (!el) return;
      gsap.set(el, {
        y: 40,
        scale: 0.95,
        opacity: 0,
        rotate: getRotate(idx),
        force3D: true,
      });
    });

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      });

      if (header) {
        tl.to(header, {
          y: 0,
          opacity: 1,
          duration: 0.45,
          ease: 'power3.out',
        });
      }

      polaroidRefs.current.forEach((el) => {
        if (!el) return;
        tl.to(el, {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.45,
          ease: 'power3.out',
          force3D: true,
        }, '-=0.3');
      });

      const validNotes = noteRefs.current.filter(Boolean);
      if (validNotes.length) {
        tl.to(validNotes, {
          y: 0,
          scale: 1,
          opacity: 1,
          duration: 0.55,
          stagger: 0.06,
          ease: 'power3.out',
          force3D: true,
          onComplete: () => {
            // Floating loop for Rome & Kyoto Figma Showcase Cards only
            polaroidRefs.current.forEach((el, idx) => {
              if (!el) return;
              gsap.to(el, {
                y: '-=8',
                rotate: idx === 0 ? '-=1.8' : '+=1.8',
                duration: 3.8 + idx * 0.6,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
                delay: 0.2,
              });
            });
          }
        }, '-=0.3');
      }
    }, section);

    return () => ctx.revert();
  }, []);

  // Hardware-Accelerated Dynamic Mouse Parallax (only when no note is opened)
  const handleBoardMouseMove = (e) => {
    if (window.innerWidth < 1024 || openIdx !== null) return;
    const section = faqSectionRef.current;
    if (!section) return;
    const rect = section.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width - 0.5;
    const yRatio = (e.clientY - rect.top) / rect.height - 0.5;

    noteRefs.current.forEach((el, idx) => {
      if (!el) return;
      const depth = (idx % 3 + 1) * 3;
      gsap.to(el, {
        x: xRatio * depth,
        y: yRatio * depth,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    });

    polaroidRefs.current.forEach((el) => {
      if (!el) return;
      gsap.to(el, {
        x: xRatio * 8,
        y: yRatio * 8,
        duration: 0.35,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    });
  };

  const handleBoardMouseLeave = () => {
    if (window.innerWidth < 1024 || openIdx !== null) return;
    noteRefs.current.forEach((el, idx) => {
      if (!el) return;
      gsap.to(el, {
        x: 0,
        y: 0,
        rotate: getRotate(idx),
        duration: 0.4,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    });

    polaroidRefs.current.forEach((el) => {
      if (!el) return;
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.4,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!buttonRef.current || !buttonTextRef.current) return;

      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;
      const distance = Math.hypot(distX, distY);
      const proximityRadius = 100 + rect.width / 2;

      if (distance < proximityRadius) {
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
    <div className="w-full relative">
      <div 
        id="section-faq" 
        className="relative z-20 w-full max-w-full overflow-x-clip mt-0 rounded-t-[40px] md:rounded-t-[60px] border-t-2 border-[#FF5B1D] bg-[#FFF8F5]"
        style={{
          boxShadow: '0 -28px 70px -15px rgba(0,0,0,0.18), 0 -10px 30px -5px rgba(0,0,0,0.12), 0 -2px 14px rgba(255,91,29,0.45), inset 0 1px 0 rgba(255,255,255,0.98)',
        }}
      >
        {/* Top Luminous Laser Beam */}
        <div
          aria-hidden="true"
          className="absolute top-0 inset-x-0 h-[3px] pointer-events-none z-50"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,91,29,0.5) 10%, #FF5B1D 50%, rgba(255,91,29,0.5) 90%, transparent 100%)',
            boxShadow: '0 0 22px 3.5px rgba(255, 91, 29, 0.9), 0 2px 28px 5px rgba(255, 91, 29, 0.55)',
          }}
        />

        <section 
          ref={faqSectionRef} 
          onMouseMove={handleBoardMouseMove}
          onMouseLeave={handleBoardMouseLeave}
          className="relative py-24 md:py-32 pb-16 w-full z-10 select-none"
        >
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.035]"
            style={{
              backgroundImage: 'radial-gradient(#1E1B18 1.5px, transparent 1.5px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* ✦ FIGMA SHOWCASE DESTINATION CARD: ROME ✦ */}
          <div 
            ref={el => polaroidRefs.current[0] = el}
            className="absolute top-8 left-2 md:left-6 hidden lg:flex flex-col p-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.16)] border border-stone-200/90 rotate-[-10deg] z-0 pointer-events-none w-52 transition-transform duration-300 group"
          >
            {/* Figma Artboard Header */}
            <div className="flex items-center justify-between gap-1 mb-2 px-0.5">
              <div className="flex items-center gap-1.5 text-[9px] font-mono font-extrabold text-[#FF5B1D] tracking-widest uppercase">
                <span className="text-[11px]">❖</span>
                <span>FRAME • ROME_ITALY</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* Real Unsplash Photo Container with Dark Scrim Overlay */}
            <div className="w-full h-36 rounded-xl overflow-hidden relative shadow-inner p-3 flex flex-col justify-between group">
              <img 
                src="https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&auto=format&fit=crop&q=80" 
                alt="Rome Colosseum" 
                className="absolute inset-0 w-full h-full object-cover z-0"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-black/20 z-10" />

              <div className="relative z-20 flex justify-between items-center gap-1">
                <span className="px-2 py-0.5 rounded-full bg-black/60 text-white font-mono text-[9px] font-bold backdrop-blur-md border border-white/20 whitespace-nowrap">
                  ✈️ FCO • 8H 15M
                </span>
                <span className="px-1.5 py-0.5 rounded bg-white/90 text-stone-900 font-mono text-[8px] font-extrabold shadow-sm whitespace-nowrap">
                  LIVE AI
                </span>
              </div>
              
              <div className="relative z-20">
                <div className="text-white font-black text-sm drop-shadow-md leading-tight">Colosseum &amp; Trastevere</div>
                <div className="text-white/80 font-mono text-[9px] font-semibold mt-0.5">41.9028° N, 12.4964° E</div>
              </div>
            </div>

            {/* Bottom Info Bar */}
            <div className="mt-2.5 flex items-center justify-between text-stone-600 font-mono text-[9px] font-bold px-0.5">
              <span className="flex items-center gap-1">☀️ 24°C • SUNNY</span>
              <span className="text-[#FF5B1D]">DAY 1 • 19:30</span>
            </div>
          </div>

          {/* ✦ FIGMA SHOWCASE DESTINATION CARD: KYOTO ✦ */}
          <div 
            ref={el => polaroidRefs.current[1] = el}
            className="absolute top-12 right-2 md:right-6 hidden lg:flex flex-col p-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.16)] border border-stone-200/90 rotate-12 z-0 pointer-events-none w-52 transition-transform duration-300 group"
          >
            {/* Figma Artboard Header */}
            <div className="flex items-center justify-between gap-1 mb-2 px-0.5">
              <div className="flex items-center gap-1.5 text-[9px] font-mono font-extrabold text-[#FF5B1D] tracking-widest uppercase">
                <span className="text-[11px]">❖</span>
                <span>FRAME • KYOTO_JAPAN</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* Real Unsplash Photo Container with Dark Scrim Overlay */}
            <div className="w-full h-36 rounded-xl overflow-hidden relative shadow-inner p-3 flex flex-col justify-between group">
              <img 
                src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80" 
                alt="Kyoto Temple" 
                className="absolute inset-0 w-full h-full object-cover z-0"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-black/20 z-10" />

              <div className="relative z-20 flex justify-between items-center gap-1">
                <span className="px-2 py-0.5 rounded-full bg-black/60 text-white font-mono text-[9px] font-bold backdrop-blur-md border border-white/20 whitespace-nowrap">
                  ⛩️ KIX • 9H 40M
                </span>
                <span className="px-1.5 py-0.5 rounded bg-white/90 text-stone-900 font-mono text-[8px] font-extrabold shadow-sm whitespace-nowrap">
                  VERIFIED
                </span>
              </div>
              
              <div className="relative z-20">
                <div className="text-white font-black text-sm drop-shadow-md leading-tight">Arashiyama &amp; Gion</div>
                <div className="text-white/80 font-mono text-[9px] font-semibold mt-0.5">35.0116° N, 135.7681° E</div>
              </div>
            </div>

            {/* Bottom Info Bar */}
            <div className="mt-2.5 flex items-center justify-between text-stone-600 font-mono text-[9px] font-bold px-0.5">
              <span className="flex items-center gap-1">🌸 19°C • SPRING</span>
              <span className="text-[#FF5B1D]">DAY 3 • 10:15</span>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10">
            <div ref={faqHeaderRef} className="text-center mb-14 md:mb-18 md:will-change-transform">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FF5B1D]/10 border border-[#FF5B1D]/20 text-[#FF5B1D] text-xs font-bold tracking-widest uppercase mb-4 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5B1D] animate-pulse" />
                📌 TRAVEL PINBOARD • DISPATCHES &amp; QUERIES
              </div>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-[#111827] tracking-tight mb-4">
                Got Questions? Pinned on the Board.
              </h2>
              <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
                Everything you need to know before takeoff. Click any memo to unpin details, pricing breakdown, and offline sync.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-start relative">
              {faqNotes.map((note, i) => {
                const isOpen = openIdx === i;

                return (
                  <div
                    key={note.id}
                    ref={(el) => (noteRefs.current[i] = el)}
                    className={`sticky-note-card group relative cursor-pointer transition-shadow duration-300 rounded-2xl p-6 md:p-7 ${
                      isOpen 
                        ? 'z-50 shadow-[0_30px_70px_-12px_rgba(255,91,29,0.25)] ring-1 ring-[#FF5B1D]/40' 
                        : 'z-20 shadow-[0_12px_30px_-8px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)]'
                    }`}
                    style={{
                      backgroundColor: note.bg,
                      border: `1.5px solid ${note.borderColor}`,
                      transformOrigin: 'top center',
                    }}
                    onClick={() => toggleStickyNote(i)}
                    onMouseEnter={() => handleNoteHover(i)}
                    onMouseLeave={() => handleNoteLeave(i)}
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center">
                      <div 
                        className={`pushpin-head w-4.5 h-4.5 rounded-full relative transition-transform duration-300 ${
                          isOpen ? 'scale-125 shadow-lg' : 'shadow-md'
                        }`}
                        style={{
                          background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${note.pinColor} 55%, #181512 100%)`,
                          boxShadow: isOpen 
                            ? '0 6px 16px rgba(255,91,29,0.5)' 
                            : '0 4px 10px rgba(0,0,0,0.35)',
                        }}
                      >
                        <div className="absolute top-0.5 left-1 w-1.5 h-1.5 rounded-full bg-white/80 md:blur-[0.4px]" />
                      </div>
                    </div>

                    <div 
                      className="absolute -top-3 left-6 w-16 h-5 pointer-events-none z-20 opacity-85 md:backdrop-blur-[2px]"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(255,245,230,0.55) 100%)',
                        borderLeft: '1px dashed rgba(0,0,0,0.12)',
                        borderRight: '1px dashed rgba(0,0,0,0.12)',
                        transform: `rotate(${note.tapeAngle})`,
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                      }}
                    />

                    <div className="flex items-center justify-between gap-3 mb-4 select-none pt-1">
                      <span className="font-mono text-[9px] font-semibold tracking-widest text-stone-600 uppercase">
                        #{note.num} • {note.tag}
                      </span>
                      <span className={`text-[10px] font-mono font-bold uppercase transition-colors ${
                        isOpen ? 'text-[#FF5B1D]' : 'text-stone-600/60'
                      }`}>
                        {isOpen ? 'UNPINNED ▲' : 'PINNED ▼'}
                      </span>
                    </div>

                    <h3 className={`text-lg md:text-xl font-black leading-snug tracking-tight mb-2 transition-colors ${
                      isOpen ? 'text-[#FF5B1D]' : 'text-stone-900'
                    }`}>
                      {note.question}
                    </h3>

                    <div
                      ref={(el) => (contentRefs.current[i] = el)}
                      className="overflow-hidden"
                      style={{ overflowAnchor: 'none', height: 0, opacity: 0 }}
                    >
                      <div className="pt-5 pb-1 border-t border-stone-800/5 text-stone-800 text-sm md:text-[15px] leading-relaxed font-medium mt-5">
                        <p className="mb-5 opacity-90 text-stone-900">{note.answer}</p>
                        
                        <div className="pl-4 border-l-[1.5px] border-[#FF5B1D]/40 mb-6 py-0.5">
                          <span className="font-mono text-[9px] font-bold text-[#FF5B1D] uppercase tracking-widest block mb-1">Key Takeaway</span>
                          <span className="text-[13px] font-semibold text-stone-800">{note.highlight}</span>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-stone-800/5">
                          <button
                            onClick={(e) => handleHelpfulClick(e, i)}
                            className={`font-mono text-[9px] uppercase tracking-widest font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                              helpfulClicked[i]
                                ? 'text-[#FF5B1D]'
                                : 'text-stone-500 hover:text-stone-900'
                            }`}
                          >
                            <span>{helpfulClicked[i] ? 'Helpful' : 'Helpful?'}</span>
                            <span className="font-sans font-medium text-stone-400 tracking-normal">({helpfulCounts[i]})</span>
                          </button>

                          <span className="text-[9px] font-mono uppercase tracking-widest text-stone-400">{note.stamp}</span>
                        </div>
                      </div>
                    </div>

                    <div 
                      className="absolute bottom-0 right-0 w-5 h-5 pointer-events-none"
                      style={{
                        background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.06) 50%)',
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <HorizonWarp />

      <FigmaReveal id="section-cta" index={3} variant="dark">
        <section
          ref={ctaContainerRef}
          className="relative w-full bg-[#070709] min-h-[80vh] md:min-h-0 py-24 md:py-44 overflow-hidden flex flex-col items-center justify-center text-center select-none"
        >
        <TravelTelemetryBackground />

          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-30" viewBox="0 0 1200 600" preserveAspectRatio="none">
            <path d="M-100,500 Q 300,100 700,450 T 1300,100" fill="none" stroke="#FF5B1D" strokeWidth="2" strokeDasharray="8 8" className="animate-pulse" />
            <path d="M-100,100 Q 400,550 900,150 T 1300,500" fill="none" stroke="#FF8A5B" strokeWidth="1.5" strokeDasharray="6 6" />
          </svg>

          <div className="relative z-10 max-w-4xl mx-auto px-4 flex flex-col items-center">
            
            <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-none mb-12 md:mb-14 drop-shadow-lg">
            Stop planning.<br />
            <span className="bg-linear-to-r from-white via-orange-100 to-[#FF5B1D] bg-clip-text text-transparent animate-liquid-shimmer">
              Start traveling.
            </span>
          </h2>

            {/* 3. The Magnetic Button */}
            <div className="relative inline-block p-4">
              <button
                ref={buttonRef}
                onClick={handleFlyTransition}
                className={`group relative inline-flex items-center justify-center w-[85vw] max-w-70 sm:w-auto sm:max-w-none px-6 sm:px-12 py-4 sm:py-6 rounded-full bg-[#FF5B1D] text-white font-extrabold text-[15px] sm:text-2xl tracking-wide shadow-[0_0_50px_rgba(249,115,22,0.4)] transition-shadow duration-300 cursor-pointer overflow-visible border border-white/20 ${isFlying ? 'scale-95 shadow-[0_0_80px_rgba(249,115,22,0.8)]' : 'hover:bg-[#ff6c34] hover:shadow-[0_0_80px_rgba(249,115,22,0.6)]'}`}
              >
                {/* Button inner highlight sheen */}
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                  <span className={`absolute inset-0 w-1/2 h-full bg-white/20 skew-x-[-25deg] -translate-x-full transition-transform duration-1000 ease-out pointer-events-none ${isFlying ? 'opacity-0' : 'group-hover:translate-x-[300%]'}`} />
                </div>

                {/* Parallax Button Text */}
                <span ref={buttonTextRef} className={`relative z-10 flex items-center justify-center gap-2 sm:gap-3 transition-colors duration-300 w-full ${isFlying ? 'text-[#FF5B1D] opacity-0' : ''}`}>
                  <span className="hidden sm:inline">[ Plan My Trip — It&apos;s Free ]</span>
                  <span className="sm:hidden tracking-wider">Plan My Trip — Free</span>
                  <svg
                    className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 shrink-0 ${isFlying ? 'translate-x-10 opacity-0' : 'group-hover:translate-x-1.5'}`}
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
      </FigmaReveal>

      {/* Cinematic Circle Wipe Transition Overlay */}
      <div 
          ref={wipeOverlayRef} 
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-[#0A0A0A] rounded-full z-99999 pointer-events-none opacity-0 origin-center" 
      />
    </div>
  );
}
