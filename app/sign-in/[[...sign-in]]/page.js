'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SignIn } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";

// --- Main Page ---

export default function SignInPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeDestIdx, setActiveDestIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Desktop only: Auto-rotate showcase destinations every 6 seconds (resets on manual selection)
  useEffect(() => {
    if (isMobile || isPaused) return;
    const timer = setInterval(() => {
      setActiveDestIdx((prev) => (prev + 1) % 4);
    }, 6000);
    return () => clearInterval(timer);
  }, [isMobile, isPaused, activeDestIdx]);

  if (!isMounted) {
    return <div className="min-h-screen bg-[#050505]" />;
  }

  if (isMobile) {
    // 4 separate sets of unique photos — no repeats across any carousel
    const topImages = [
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&auto=format&fit=crop", // sunlit forest
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop", // tropical beach
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&auto=format&fit=crop", // swiss mountains
      "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&auto=format&fit=crop", // paris at night
    ];
    const bottomImages = [
      "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&auto=format&fit=crop", // tokyo city night
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&auto=format&fit=crop", // mountain lake
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&auto=format&fit=crop", // beach waves sunset
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&auto=format&fit=crop", // aerial mountains
    ];
    const leftImages = [
      "https://images.unsplash.com/photo-1548013146-72479768bada?w=600&auto=format&fit=crop", // taj mahal
      "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=600&auto=format&fit=crop", // venice canal
      "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&auto=format&fit=crop", // iceland northern lights
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=600&auto=format&fit=crop", // italy fields
    ];
    const rightImages = [
      "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&auto=format&fit=crop", // india colorful
      "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&auto=format&fit=crop", // new york skyline
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&auto=format&fit=crop", // bali resort pool
      "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600&auto=format&fit=crop", // santorini greece
    ];

    return (
      <div className="min-h-[100dvh] flex flex-col bg-[#050505] relative overflow-hidden">

        {/* Pure CSS keyframe animations — zero JS, pure GPU */}
        <style>{`
          @keyframes scrollLeft {
            0%   { transform: translateX(0) translateZ(0); }
            100% { transform: translateX(-50%) translateZ(0); }
          }
          @keyframes scrollRight {
            0%   { transform: translateX(-50%) translateZ(0); }
            100% { transform: translateX(0) translateZ(0); }
          }
          @keyframes scrollUp {
            0%   { transform: translateY(0) translateZ(0); }
            100% { transform: translateY(-50%) translateZ(0); }
          }
          @keyframes scrollDown {
            0%   { transform: translateY(-50%) translateZ(0); }
            100% { transform: translateY(0) translateZ(0); }
          }
          .strip-top    { animation: scrollLeft  28s linear infinite; will-change: transform; }
          .strip-bottom { animation: scrollRight 28s linear infinite; will-change: transform; }
          .strip-left   { animation: scrollUp    22s linear infinite; will-change: transform; }
          .strip-right  { animation: scrollDown  22s linear infinite; will-change: transform; }
        `}</style>
        
        {/* 4 Clockwise Carousel Strips — pure CSS, GPU composited */}
        <div className="absolute top-0 left-0 w-full h-[100dvh] overflow-hidden bg-[#050505]">

          {/* TOP → left to right */}
          <div className="absolute top-0 left-0 w-full h-[18vh] overflow-hidden">
            <div className="strip-top flex h-full w-max gap-2 items-center px-1">
              {[...topImages, ...topImages].map((src, i) => (
                <div key={`t${i}`} className="flex-shrink-0 w-[42vw] h-[14vh] rounded-2xl overflow-hidden border border-white/10">
                  <img src={src} alt="" className="w-full h-full object-cover opacity-80" loading="eager" decoding="async" />
                </div>
              ))}
            </div>
          </div>

          {/* BOTTOM ← right to left */}
          <div className="absolute bottom-0 left-0 w-full h-[18vh] overflow-hidden">
            <div className="strip-bottom flex h-full w-max gap-2 items-center px-1">
              {[...bottomImages, ...bottomImages].map((src, i) => (
                <div key={`b${i}`} className="flex-shrink-0 w-[42vw] h-[14vh] rounded-2xl overflow-hidden border border-white/10">
                  <img src={src} alt="" className="w-full h-full object-cover opacity-80" loading="eager" decoding="async" />
                </div>
              ))}
            </div>
          </div>

          {/* LEFT ↑ bottom to top */}
          <div className="absolute left-[-5vw] top-0 w-[42vw] h-[100dvh] overflow-hidden">
            <div className="strip-left flex flex-col w-full h-max gap-2 py-1">
              {[...leftImages, ...leftImages].map((src, i) => (
                <div key={`l${i}`} className="flex-shrink-0 w-full h-[14vh] rounded-2xl overflow-hidden border border-white/10">
                  <img src={src} alt="" className="w-full h-full object-cover opacity-80" loading="eager" decoding="async" />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT ↓ top to bottom */}
          <div className="absolute right-[-5vw] top-0 w-[42vw] h-[100dvh] overflow-hidden">
            <div className="strip-right flex flex-col w-full h-max gap-2 py-1">
              {[...rightImages, ...rightImages].map((src, i) => (
                <div key={`r${i}`} className="flex-shrink-0 w-full h-[14vh] rounded-2xl overflow-hidden border border-white/10">
                  <img src={src} alt="" className="w-full h-full object-cover opacity-80" loading="eager" decoding="async" />
                </div>
              ))}
            </div>
          </div>

          {/* Dark center so form pops */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.65)_25%,transparent_100%)] pointer-events-none" />
          {/* Edge feather */}
          <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(5,5,5,1)] pointer-events-none" />
        </div>

        {/* Center: Apple Liquid Glass Premium Form */}
        <div className="flex-1 flex flex-col justify-center px-4 relative z-10">
          
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.25, delay: 0.1 }}
            className="w-full max-w-sm mx-auto bg-white/40 backdrop-blur-3xl backdrop-saturate-150 shadow-[0_30px_70px_rgba(0,0,0,0.35)] rounded-[28px] px-4.5 py-4 relative"
          >
            {/* Apple Liquid Glass Layering: Gradient border, specular inset highlight, and glossy shine */}
            <div className="absolute inset-0 rounded-[28px] border border-white/60 pointer-events-none" />
            <div className="absolute inset-0 rounded-[28px] shadow-[inset_0_1px_1px_rgba(255,255,255,1),inset_0_20px_40px_rgba(255,255,255,0.3)] bg-gradient-to-br from-white/30 via-transparent to-white/10 pointer-events-none" />

            {/* Logo and Creative Copy (Clear Visual Hierarchy for Mobile) */}
            <div className="mb-4 flex flex-col items-center text-center relative z-10 select-none">
              {/* Tier 1: Brand Anchor */}
              <div className="flex items-center justify-center -ml-1 mb-2">
                 <div className="h-9 w-9 shrink-0 flex items-center justify-center">
                    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 object-contain">
                        <path
                            d="M24 170 C 70 135, 105 105, 168 42"
                            fill="none"
                            stroke="#8CA3A8"
                            strokeWidth="4"
                            strokeDasharray="3 12"
                            strokeLinecap="round"
                        />
                        <circle cx="24" cy="170" r="9" fill="#0D9488" />
                        <g transform="translate(136,28) rotate(45)">
                            <path
                                d="M0 34 L8 0 L16 34 L34 44 L34 52 L16 46 L13 64 L21 70 L21 76 L8 70 L-5 76 L-5 70 L3 64 L0 46 L-18 52 L-18 44 Z"
                                fill="#fe7717"
                            />
                        </g>
                    </svg>
                 </div>
                 <div className="flex flex-col items-start -ml-1">
                    <span className="font-sans font-extrabold text-[20px] tracking-tight leading-none text-[#1C1B1B]">
                        Trip<span className="text-[#FF6B2C]">Wise</span>
                    </span>
                    <span className="font-sans font-extrabold text-[8.5px] tracking-[0.22em] text-[#4B4745] mt-1 leading-none uppercase">
                        AI Trip Planner
                    </span>
                 </div>
              </div>

              {/* Tier 2: Primary Greeting Headline */}
              <h3 className="!font-sans text-[20px] font-bold text-[#1C1B1B] tracking-tight leading-tight mb-1">
                Welcome back
              </h3>

              {/* Tier 3: Subtitle */}
              <p className="text-[#1C1B1B]/60 text-[12.5px] font-normal leading-tight px-2">
                Sign in to continue your journey.
              </p>
            </div>

            <div className="relative z-10">
              <SignIn 
                  appearance={{
                    variables: {
                      colorPrimary: '#fe7717',
                      colorBackground: '#FFF8F5', 
                      colorInputBackground: 'rgba(255,255,255,0.8)',
                      colorInputText: '#1C1B1B',
                      colorText: '#1C1B1B',
                      colorTextSecondary: '#666666',
                    },
                    elements: {
                      rootBox: "!w-full",
                      cardBox: "!shadow-none !border-none !bg-transparent !w-full !max-w-full !overflow-visible",
                      card: "!bg-transparent !shadow-none !border-none !p-0 !w-full !max-w-full !overflow-visible",
                      main: "!w-full !max-w-full !p-0 !overflow-visible",
                      headerTitle: "!hidden",
                      headerSubtitle: "!hidden", 
                      formButtonPrimary: "!bg-[#1C1B1B] hover:!bg-[#1C1B1B]/90 !text-white !text-[13.5px] !font-bold !rounded-xl !py-2.5 !mt-0.5 transition-all !shadow-md !shadow-black/10 !border-none !w-full",
                      formFieldLabel: "!hidden", 
                      formFieldInput: "!bg-white/80 !border !border-white/60 !text-[#1C1B1B] !rounded-xl !px-4 !py-2.5 !mb-2 focus:!ring-2 focus:!ring-[#fe7717]/40 focus:!border-[#fe7717] placeholder:!text-black/40 transition-all !w-full !text-[13.5px] !shadow-sm",
                      footer: "!bg-transparent !p-0 !mt-2.5",
                      footerActionText: "!text-black/50 !text-[12px]",
                      footerActionLink: "!text-[#1C1B1B] hover:!text-[#fe7717] !text-[12px] !font-bold",
                      socialButtonsBlockButton: "!bg-white/80 !border !border-white/60 hover:!bg-white !text-[#1C1B1B] transition-all !rounded-xl !py-2.5 !w-full !mb-2 !shadow-sm",
                      socialButtonsBlockButtonText: "!font-sans !font-bold !text-[13.5px] !text-[#1C1B1B]",
                      dividerLine: "!bg-black/10 !my-1.5",
                      dividerText: "!text-black/40 !font-sans !text-[11px] !px-3",
                      formFieldAction: "!text-[#fe7717] hover:!text-[#e56814] !text-xs !font-bold !absolute !right-4 !top-0 !-mt-5",
                      identityPreviewText: "!text-[#1C1B1B]",
                      identityPreviewEditButton: "!text-[#fe7717]"
                    }
                  }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // --- Desktop Curated Travel Photography Showcase (Optimized for 60fps GPU performance) ---
  const desktopColumns = [
    [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=420&auto=format&fit=crop&q=75", // tropical beach
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=420&auto=format&fit=crop&q=75", // swiss mountains
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=420&auto=format&fit=crop&q=75", // paris street
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=420&auto=format&fit=crop&q=75", // sunlit forest
    ],
    [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=420&auto=format&fit=crop&q=75", // mountain lake
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=420&auto=format&fit=crop&q=75", // beach sunset
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=420&auto=format&fit=crop&q=75", // aerial mountains
      "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=420&auto=format&fit=crop&q=75", // london bridge sunset
    ],
    [
      "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=420&auto=format&fit=crop&q=75", // taj mahal reflecting pool
      "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=420&auto=format&fit=crop&q=75", // venice turquoise canal
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=420&auto=format&fit=crop&q=75", // cinque terre
      "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=420&auto=format&fit=crop&q=75", // iceland aurora
    ],
    [
      "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=420&auto=format&fit=crop&q=75", // india palace
      "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=420&auto=format&fit=crop&q=75", // new york skyline
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=420&auto=format&fit=crop&q=75", // bali resort
      "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=420&auto=format&fit=crop&q=75", // santorini caldera
    ],
    [
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=420&auto=format&fit=crop&q=75", // santorini white roofs
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=420&auto=format&fit=crop&q=75", // dubai burj
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=420&auto=format&fit=crop&q=75", // lake boat
      "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=420&auto=format&fit=crop&q=75", // turquoise cove
    ],
    [
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=420&auto=format&fit=crop&q=75", // yosemite valley
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=420&auto=format&fit=crop&q=75", // london bridge
      "https://images.unsplash.com/photo-1517824806704-9040b037703b?w=420&auto=format&fit=crop&q=75", // mountain road
    ],
  ];

  // Curated rotating destinations for desktop keynote card (100% unique, never used anywhere else in TripWise)
  const showcaseDestinations = [
    {
      region: "DOLOMITES, ITALY",
      location: "Lago di Braies • South Tyrol",
      day: "Day 2",
      headline: "Every great journey begins with a plan.",
      subtitle: "Bespoke routes, hidden neighborhood spots, and effortless travel in one place.",
      image: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1200&auto=format&fit=crop&q=85",
      alt: "Lago di Braies, Dolomites, Italy"
    },
    {
      region: "LOFOTEN, NORWAY",
      location: "Skagsanden • Aurora Borealis",
      day: "Day 4",
      headline: "Chasing horizons where arctic skies come alive.",
      subtitle: "Smart weather forecasting, scenic detours, and untamed northern landscapes.",
      image: "https://images.unsplash.com/photo-1507272931001-fc06c17e4f43?w=1200&auto=format&fit=crop&q=85",
      alt: "Lofoten Islands Aurora Borealis, Norway"
    },
    {
      region: "ISTANBUL, TURKEY",
      location: "Sultanahmet • Bosphorus Sunset",
      day: "Day 1",
      headline: "Where ancient crossroads meet modern wanderlust.",
      subtitle: "Curated local alleys, culinary secrets, and seamless multi-city bookings.",
      image: "https://images.unsplash.com/photo-1527838832700-5059252407fa?w=1200&auto=format&fit=crop&q=85",
      alt: "Blue Mosque at sunset, Istanbul, Turkey"
    },
    {
      region: "BAA ATOLL, MALDIVES",
      location: "Overwater Sanctuary • Crystal Lagoon",
      day: "Day 3",
      headline: "Find stillness across crystal-clear turquoise waters.",
      subtitle: "Personalized leisure pacing, hidden reef excursions, and stress-free stays.",
      image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200&auto=format&fit=crop&q=85",
      alt: "Maldives overwater bungalows in crystal lagoon"
    }
  ];

  return (
    <div id="desktop-signin-root" className="min-h-screen w-full flex flex-col items-center justify-center bg-[#070709] relative overflow-hidden select-none">
      
      {/* Pure CSS 60FPS GPU Keyframe Animations for Vertical Canvas Strips */}
      <style>{`
        @keyframes colScrollUp {
          0%   { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(0, -50%, 0); }
        }
        @keyframes colScrollDown {
          0%   { transform: translate3d(0, -50%, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        .col-stream-0 { animation: colScrollUp 38s linear infinite; will-change: transform; transform: translate3d(0,0,0); backface-visibility: hidden; }
        .col-stream-1 { animation: colScrollDown 44s linear infinite; will-change: transform; transform: translate3d(0,0,0); backface-visibility: hidden; }
        .col-stream-2 { animation: colScrollUp 48s linear infinite; will-change: transform; transform: translate3d(0,0,0); backface-visibility: hidden; }
        .col-stream-3 { animation: colScrollDown 42s linear infinite; will-change: transform; transform: translate3d(0,0,0); backface-visibility: hidden; }
        .col-stream-4 { animation: colScrollUp 36s linear infinite; will-change: transform; transform: translate3d(0,0,0); backface-visibility: hidden; }
        .col-stream-5 { animation: colScrollDown 46s linear infinite; will-change: transform; transform: translate3d(0,0,0); backface-visibility: hidden; }

        /* Desktop-ONLY Overrides: Scoped strictly to #desktop-signin-root so mobile is never affected */
        #desktop-signin-root .cl-card,
        #desktop-signin-root .cl-cardBox,
        #desktop-signin-root .cl-rootBox,
        #desktop-signin-root .cl-main,
        #desktop-signin-root .cl-footer,
        #desktop-signin-root .cl-footerAction,
        #desktop-signin-root .cl-footerPages {
          background: transparent !important;
          background-color: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }

        /* Desktop-ONLY: Make Apple icon crisp brilliant white on dark buttons */
        #desktop-signin-root .cl-socialButtonsBlockButton__apple svg,
        #desktop-signin-root .cl-socialButtonsBlockButton__apple img,
        #desktop-signin-root .cl-socialButtonsBlockButton__appleIcon,
        #desktop-signin-root .cl-socialButtonsProviderIcon__apple,
        #desktop-signin-root .cl-socialButtonsBlockButtonProviderIcon__apple,
        #desktop-signin-root button[data-provider="apple"] svg,
        #desktop-signin-root button[data-provider="apple"] img,
        #desktop-signin-root button[data-provider="oauth_apple"] svg,
        #desktop-signin-root button[data-provider="oauth_apple"] img,
        #desktop-signin-root .cl-socialButtonsBlockButton[data-provider="apple"] svg,
        #desktop-signin-root .cl-socialButtonsBlockButton[data-provider="oauth_apple"] svg {
          fill: #ffffff !important;
          color: #ffffff !important;
          filter: brightness(0) invert(1) !important;
        }

        /* Desktop-ONLY: Make Last Used badge visible & styled in warm amber */
        #desktop-signin-root .cl-badge,
        #desktop-signin-root .cl-socialButtonsBlockButtonBadge,
        #desktop-signin-root [class*="badge"],
        #desktop-signin-root [class*="Badge"],
        #desktop-signin-root [data-localization-key="badge__lastUsed"],
        #desktop-signin-root div[class*="badge"] {
          background-color: rgba(255, 91, 29, 0.3) !important;
          color: #FFC096 !important;
          border: 1px solid rgba(255, 91, 29, 0.6) !important;
          font-weight: 700 !important;
          font-size: 11px !important;
          border-radius: 9999px !important;
          padding: 2px 9px !important;
          visibility: visible !important;
          opacity: 1 !important;
          display: inline-flex !important;
          align-items: center !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
        }
      `}</style>

      {/* ✦ Full-Screen Ambient Moving Travel Photography Canvas (Hardware Accelerated) ✦ */}
      <div className="absolute inset-0 w-full h-full overflow-hidden flex gap-4 px-3 pointer-events-none opacity-95 transform-gpu">
        {desktopColumns.map((colImages, colIdx) => (
          <div key={colIdx} className="flex-1 min-w-[15vw] h-[200vh] overflow-hidden">
            <div className={`col-stream-${colIdx} flex flex-col gap-4 w-full`}>
              {[...colImages, ...colImages].map((src, imgIdx) => (
                <div 
                  key={imgIdx} 
                  className="w-full h-[300px] rounded-3xl overflow-hidden border border-white/20 shadow-2xl shrink-0 relative bg-stone-900/60 transform-gpu"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <img 
                    src={src} 
                    alt="Travel destination" 
                    className="w-full h-full object-cover" 
                    loading="lazy" 
                    decoding="async" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/5" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Soft Vignette + 2.5px Lens Blur on Static Layer (Single GPU Compositor Pass) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.20)_0%,rgba(7,7,9,0.60)_100%)] backdrop-blur-[2.5px] pointer-events-none z-1" />

      {/* Top Floating Navigation Bar */}
      <div className="absolute top-7 left-8 z-30 pointer-events-auto">
        <Link 
          href="/" 
          className="group flex items-center gap-2.5 px-4.5 py-2.5 rounded-full bg-black/45 hover:bg-black/70 backdrop-blur-2xl border border-white/15 hover:border-white/30 text-white/90 hover:text-white text-xs font-semibold tracking-wide transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-1">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Return to TripWise</span>
        </Link>
      </div>

      {/* ✦ Desktop Masterpiece: Wide Luxury Travel Terminal Keynote Card ✦ */}
      <div className="relative z-20 w-full max-w-5xl px-4 my-auto pointer-events-auto">
        <motion.div 
          initial={{ opacity: 0, y: 35, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.2 }}
          className="w-full bg-[#111113]/90 backdrop-blur-xl border border-white/15 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.08)] rounded-[36px] overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative transform-gpu"
        >
          {/* Subtle Ambient Specular Rim Light */}
          <div className="absolute inset-0 rounded-[36px] shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.25),inset_0_24px_48px_rgba(255,255,255,0.05)] pointer-events-none z-30" />

          {/* LEFT COLUMN: Clean Editorial Travel Photography (7 Cols) with Auto-Switching Destinations */}
          <div 
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="lg:col-span-7 relative min-h-[440px] lg:min-h-[580px] p-8 lg:p-12 flex flex-col justify-between overflow-hidden group"
          >
            {/* Background Destination Photos with Hardware Accelerated Cinematic Motion */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              <AnimatePresence initial={false}>
                <motion.div 
                  key={activeDestIdx}
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: 0.85,
                    scale: [1.02, 1.12],
                  }}
                  exit={{ 
                    opacity: 0,
                    transition: { duration: 1.2, ease: "easeInOut" }
                  }}
                  transition={{ 
                    opacity: { duration: 1.2, ease: "easeInOut" },
                    scale: { duration: 7, ease: "linear" }
                  }}
                  className="absolute inset-0 will-change-transform transform-gpu"
                  style={{ backfaceVisibility: 'hidden', transform: 'translate3d(0,0,0)' }}
                >
                  <img 
                    src={showcaseDestinations[activeDestIdx].image} 
                    alt={showcaseDestinations[activeDestIdx].alt} 
                    className="w-full h-full object-cover" 
                    loading="eager" 
                    decoding="async" 
                  />
                </motion.div>
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E11] via-[#0E0E11]/45 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#111113]/90 z-10 pointer-events-none" />
            </div>

            {/* Hidden image preloader for 0-latency instant crossfades */}
            <div className="hidden" aria-hidden="true">
              {showcaseDestinations.map(d => (
                <img key={d.image} src={d.image} alt="" />
              ))}
            </div>

            {/* Top Simple Location Identifier */}
            <div className="relative z-20 h-5 flex items-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeDestIdx}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="flex items-center gap-2"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#FF5B1D] shrink-0">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span className="text-xs font-mono tracking-widest text-white/75 uppercase font-semibold">
                    {showcaseDestinations[activeDestIdx].region}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Center Human Travel Heading */}
            <div className="relative z-20 my-auto py-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeDestIdx + "-content"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                >
                  <h2 className="text-3xl lg:text-4xl xl:text-[42px] font-serif font-bold text-white leading-[1.18] tracking-tight mb-3 drop-shadow-md">
                    {showcaseDestinations[activeDestIdx].headline}
                  </h2>
                  <p className="text-white/70 text-sm lg:text-base leading-relaxed max-w-md font-light">
                    {showcaseDestinations[activeDestIdx].subtitle}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Minimal Location Note */}
            <div className="relative z-20 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/40 font-mono">
              <AnimatePresence mode="wait">
                <motion.span
                  key={activeDestIdx + "-loc"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {showcaseDestinations[activeDestIdx].location}
                </motion.span>
              </AnimatePresence>
              <AnimatePresence mode="wait">
                <motion.span 
                  key={activeDestIdx + "-day"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-white/30"
                >
                  {showcaseDestinations[activeDestIdx].day}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT COLUMN: Ultra-Clean Sign-In Panel (5 Cols) */}
          <div className="lg:col-span-5 p-8 lg:p-10 flex flex-col justify-center bg-[#0E0E11]/90 backdrop-blur-2xl relative border-t lg:border-t-0 lg:border-l border-white/10">
            {/* Brand Logo Header (Tier 1: Brand Anchor) */}
            <div className="flex items-center gap-2.5 mb-7 select-none">
              <div className="h-9 w-9 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 object-contain">
                  <path
                    d="M24 170 C 70 135, 105 105, 168 42"
                    fill="none"
                    stroke="#8CA3A8"
                    strokeWidth="4"
                    strokeDasharray="3 12"
                    strokeLinecap="round"
                  />
                  <circle cx="24" cy="170" r="9" fill="#0D9488" />
                  <g transform="translate(136,28) rotate(45)">
                    <path
                      d="M0 34 L8 0 L16 34 L34 44 L34 52 L16 46 L13 64 L21 70 L21 76 L8 70 L-5 76 L-5 70 L3 64 L0 46 L-18 52 L-18 44 Z"
                      fill="#fe7717"
                    />
                  </g>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-sans font-extrabold text-[19px] tracking-tight leading-none text-white">
                  Trip<span className="text-[#FF6B2C]">Wise</span>
                </span>
                <span className="font-sans font-bold text-[7.5px] tracking-[0.25em] text-[#8CA3A8] mt-1 leading-none uppercase">
                  AI Trip Planner
                </span>
              </div>
            </div>

            {/* Greeting & Context Group (Tier 2: Primary Content Heading) */}
            <div className="mb-6">
              <h3 className="!font-sans text-2xl lg:text-[25px] font-bold text-white tracking-tight leading-tight">
                Welcome back
              </h3>
              <p className="text-white/50 text-[13.5px] font-normal leading-relaxed mt-1.5">
                Sign in to continue your journey.
              </p>
            </div>

            {/* Clerk Sign In component styled in TripWise Signature Luxury Tokens */}
            <div className="relative z-10">
              <SignIn 
                appearance={{
                  variables: {
                    colorPrimary: '#FF5B1D',
                    colorBackground: 'transparent', 
                    colorInputBackground: 'rgba(255,255,255,0.06)',
                    colorInputText: '#FFFFFF',
                    colorText: '#FFFFFF',
                    colorTextSecondary: '#A1A1AA',
                  },
                  elements: {
                    rootBox: "!w-full !flex !justify-center",
                    cardBox: "!shadow-none !border-none !bg-transparent !w-full !max-w-full !overflow-visible",
                    card: "!bg-transparent !shadow-none !border-none !p-0 !w-full !max-w-full !overflow-visible",
                    main: "!w-full !max-w-full !p-0 !overflow-visible",
                    headerTitle: "!hidden",
                    headerSubtitle: "!hidden", 
                    formButtonPrimary: "!bg-gradient-to-r !from-[#FF5B1D] !to-[#FF7A45] hover:!opacity-95 active:!scale-[0.99] !text-white !text-[14px] !font-bold !rounded-2xl !py-3.5 !mt-1 transition-all !shadow-[0_8px_25px_rgba(255,91,29,0.35)] !border-none !w-full cursor-pointer",
                    formFieldLabel: "!hidden", 
                    formFieldInput: "!bg-white/8 hover:!bg-white/12 focus:!bg-white/12 !border !border-white/15 focus:!border-[#FF5B1D] !text-white !rounded-2xl !px-5 !py-3.5 !mb-3 focus:!ring-2 focus:!ring-[#FF5B1D]/40 placeholder:!text-white/35 transition-all !w-full !text-[14.5px] !shadow-sm",
                    footer: "!bg-transparent !border-none !shadow-none !p-0 !mt-4",
                    footerAction: "!bg-transparent !border-none !shadow-none !p-0",
                    footerPages: "!bg-transparent !border-none !shadow-none !p-0",
                    footerActionText: "!text-white/50 !text-[13px]",
                    footerActionLink: "!text-[#FF5B1D] hover:!text-[#FF7A45] !text-[13px] !font-bold transition-colors",
                    socialButtonsBlockButton: "!bg-white/8 hover:!bg-white/15 hover:!border-white/25 !border !border-white/15 !text-white transition-all !rounded-2xl !py-3.5 !w-full !mb-2.5 !shadow-sm cursor-pointer",
                    socialButtonsBlockButtonText: "!font-sans !font-bold !text-[14px] !text-white",
                    socialButtonsBlockButtonBadge: "!bg-[#FF5B1D]/25 !text-[#FFB37C] !border !border-[#FF5B1D]/50 !font-sans !font-bold !rounded-full !px-2.5 !py-0.5 !text-[11px] !shadow-sm !visible !opacity-100",
                    badge: "!bg-[#FF5B1D]/25 !text-[#FFB37C] !border !border-[#FF5B1D]/50 !font-sans !font-bold !rounded-full !px-2.5 !py-0.5 !text-[11px] !shadow-sm !visible !opacity-100",
                    dividerLine: "!bg-white/10",
                    dividerText: "!text-white/40 !font-sans !text-[12px] !font-medium !px-4",
                    formFieldAction: "!text-[#FF5B1D] hover:!text-[#FF7A45] !text-xs !font-bold !absolute !right-4 !top-0 !-mt-6",
                    identityPreviewText: "!text-white !font-medium",
                    identityPreviewEditButton: "!text-[#FF5B1D] hover:!text-[#FF7A45]"
                  }
                }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
