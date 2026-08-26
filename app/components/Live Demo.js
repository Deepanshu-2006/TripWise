'use client';

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function RealTimeAdjuster() {
    const sectionRef = useRef(null);
    const phoneRef = useRef(null);
    const cursorRef = useRef(null);
    const generateBtnRef = useRef(null);
    const timelineRef = useRef(null);
    const cardRefs = useRef([]);
    const timelineObjRef = useRef(null);
    const laserSheenRef = useRef(null);
    const screenContentRef = useRef(null);
    const islandRef = useRef(null);
    const phoneShadowRef = useRef(null);
    const promptTextRef = useRef(null);

    const [isDelayed, setIsDelayed] = useState(false);
    const [isAdjusting, setIsAdjusting] = useState(false);

    const fullPrompt = "3 days in Rome... heavy on authentic local food, find hidden gems, keep it highly budget-friendly.";

    // Helper to calculate exact button center relative to the phone container
    const getButtonCoords = () => {
        const btn = generateBtnRef.current;
        const phone = phoneRef.current;
        if (!btn || !phone) return { x: 100, y: 350 };
        const btnRect = btn.getBoundingClientRect();
        const phoneRect = phone.getBoundingClientRect();
        return {
            x: btnRect.left - phoneRect.left + (btnRect.width / 2),
            y: btnRect.top - phoneRect.top + (btnRect.height / 2),
        };
    };

    // Handle Manual Trigger / Replay
    const handleToggleDelay = () => {
        setIsDelayed(prev => !prev);
    };

    // Setup Initial states & GSAP timeline choreography
    useEffect(() => {
        let mm = gsap.matchMedia();

        mm.add({
            isDesktop: "(min-width: 1024px)",
            isMobile: "(max-width: 1023px)"
        }, (context) => {
            let { isDesktop } = context.conditions;

            // Set initial state of cursor
            gsap.set(cursorRef.current, {
                x: 80,
                y: 220,
                opacity: 0,
                scale: 1,
            });

            // Set initial state of phone suspended above the viewport
            gsap.set(phoneRef.current, {
                y: -180,
                rotateX: 18,
                scale: 0.82,
                opacity: 0,
                filter: 'blur(10px)',
                transformPerspective: 1200,
                transformOrigin: 'center top',
            });

            // Set initial state of ground shadow
            if (phoneShadowRef.current) {
                gsap.set(phoneShadowRef.current, {
                    scale: 0.4,
                    opacity: 0,
                });
            }

            // Set initial screen state: pitch black OLED before power-on
            if (screenContentRef.current) {
                gsap.set(screenContentRef.current, {
                    opacity: 0,
                });
            }

            // Set initial state of laser sheen sweep
            if (laserSheenRef.current) {
                gsap.set(laserSheenRef.current, {
                    y: -220,
                    opacity: 0,
                });
            }

            // Set initial 3D spatial extrusion state of timeline cards (originating from inside phone screen)
            gsap.set('.timeline-card', {
                opacity: 0,
                scale: 0.84,
                x: isDesktop ? -85 : 0,
                y: isDesktop ? 15 : 150, // Start much lower (inside phone screen) on mobile
                rotateY: isDesktop ? -20 : 0,
                rotateX: isDesktop ? 4 : 25, // Tilted back on mobile
                filter: 'blur(8px)',
                transformPerspective: 1400,
                transformOrigin: isDesktop ? 'left center' : 'top center',
            });

            // Instantiate master timeline
            const tl = gsap.timeline({ 
                paused: true
            });
            timelineObjRef.current = tl;

            // 0. Phone Gravity Drop: Phone drops from above with Apple-grade momentum & landing bounce
            tl.to(phoneRef.current, {
                y: 0,
                rotateX: 0,
                scale: isDesktop ? 1 : 0.8,
                opacity: 1,
                filter: 'blur(0px)',
                duration: 0.85,
                ease: 'back.out(1.6)',
            }, 0.05);

            if (phoneShadowRef.current) {
                tl.to(phoneShadowRef.current, {
                    scale: 1,
                    opacity: 0.6,
                    duration: 0.85,
                    ease: 'power2.out',
                }, 0.05);
            }

            // 1. OLED Power-On & Laser Sheen Sweep across the screen
            if (screenContentRef.current) {
                tl.to(screenContentRef.current, {
                    opacity: 1,
                    duration: 0.4,
                    ease: 'power2.inOut',
                }, 0.82);
            }

            if (laserSheenRef.current) {
                tl.fromTo(laserSheenRef.current, 
                    { y: -220, opacity: 1 },
                    { y: 580, opacity: 0, duration: 0.65, ease: 'power2.out' },
                    0.82
                );
            }

            if (islandRef.current) {
                tl.to(islandRef.current, {
                    scaleX: 1.18,
                    scaleY: 1.12,
                    duration: 0.15,
                    yoyo: true,
                    repeat: 1,
                    ease: 'power2.inOut',
                }, 0.88);
            }

            // 2. Simulate typing text in input field (direct DOM update with zero React re-render jitter)
            const promptObj = { chars: 0 };
            tl.to(promptObj, {
                chars: fullPrompt.length,
                duration: 2.7,
                ease: 'none',
                onUpdate: function () {
                    const isForward = !tl.reversed();
                    const count = Math.floor(promptObj.chars);
                    if (promptTextRef.current) {
                        promptTextRef.current.textContent = isForward ? fullPrompt.slice(0, count) : '';
                    }
                }
            }, 1.35);

            // 3. Animate cursor moving to the Generate button
            tl.to(cursorRef.current, {
                x: () => getButtonCoords().x,
                y: () => getButtonCoords().y,
                opacity: 1,
                duration: 0.55,
                ease: 'power2.out',
            }, 4.15);

            // 4. Trigger button click animation & phone container 3D projection tilt
            tl.to(generateBtnRef.current, {
                scale: 0.95,
                backgroundColor: '#E04F18',
                duration: 0.1,
                yoyo: true,
                repeat: 1,
            }, 4.75);

            tl.to(cursorRef.current, {
                scale: 0.8,
                duration: 0.1,
                yoyo: true,
                repeat: 1,
            }, 4.75);

            // Phone tilts in 3D to project cards out into spatial plane, sides intensely glow with TripWise Orange
            tl.to(phoneRef.current, {
                scale: isDesktop ? 1.03 : 0.83,
                rotateY: 7,
                rotateX: -3,
                borderColor: '#FF5B1D',
                boxShadow: '0 0 0 1px rgba(255, 91, 29, 1), 0 0 0 4px rgba(255, 91, 29, 0.4), 0 30px 80px 0px rgba(0, 0, 0, 0.6), 0 0 100px 20px rgba(255, 91, 29, 0.6), inset 0 0 40px 0px rgba(255, 91, 29, 0.3)',
                duration: 0.35,
                ease: 'power2.out',
            }, 4.8);

            // Fade cursor out after click
            tl.to(cursorRef.current, {
                opacity: 0,
                duration: 0.2,
            }, 4.95);

            // 5. Recalculating micro-state: Loader overlays the list
            tl.call(() => {
                const isForward = !tl.reversed();
                setIsAdjusting(isForward);
            }, null, 5.05);

            tl.to({}, { duration: 0.35 }, 5.05); // delay window

            tl.call(() => {
                setIsAdjusting(false);
            }, null, 5.4);

            // 6. 3D Spatial Extrusion Cascade: Cards float out from phone screen into real-world Z-plane
            tl.to('.timeline-card', {
                opacity: 1,
                scale: 1,
                x: 0,
                y: 0,
                rotateY: 0,
                rotateX: 0,
                filter: 'blur(0px)',
                stagger: 0.16,
                duration: 0.85,
                ease: 'back.out(1.1)',
            }, 5.4);

            // Phone settles back smoothly as cards lock into place, glow animates off
            tl.to(phoneRef.current, {
                scale: isDesktop ? 1 : 0.8,
                rotateY: 0,
                rotateX: 0,
                borderColor: '#4A4950',
                boxShadow: '0 0 0 1px rgba(44, 43, 48, 1), 0 0 0 4px rgba(18, 17, 20, 1), 0 30px 70px -15px rgba(0, 0, 0, 0.6), 0 0 60px 0px rgba(255, 91, 29, 0.12), inset 0 0 0px 0px rgba(255, 91, 29, 0)',
                opacity: isDesktop ? 1 : 0.25,
                duration: 0.8,
                ease: 'power2.out',
            }, 5.95);

        }, sectionRef);

        return () => mm.revert();
    }, []);

    // Control timeline based on state
    useEffect(() => {
        if (!timelineObjRef.current) return;
        if (isDelayed) {
            timelineObjRef.current.play();
        } else {
            // Clean up typed text DOM instantly on reset
            if (promptTextRef.current) {
                promptTextRef.current.textContent = '';
            }
            timelineObjRef.current.reverse();
        }
    }, [isDelayed]);

    const innerContainerRef = useRef(null);

    // Listen to slide overlay progress from FigmaPinnedSlide to close animatedly
    useEffect(() => {
        const handleOverlayProgress = (e) => {
            const progress = e.detail; // 0 to 1

            // Animate phone falling back and fading out
            if (phoneRef.current) {
                gsap.set(phoneRef.current, {
                    scale: 1 - (progress * 0.4), // Shrink to 0.6
                    rotateX: progress * -45, // Tilt backwards
                    y: progress * 150, // Move down
                });
            }

            if (phoneShadowRef.current) {
                gsap.set(phoneShadowRef.current, {
                    scale: 1 - (progress * 0.5),
                });
            }

            // Animate timeline scaling out and fading
            if (timelineRef.current) {
                gsap.set(timelineRef.current, {
                    x: progress * -80, // Slide left
                    scale: 1 - (progress * 0.15), // Shrink slightly
                });
            }

            // Fade out the entire content of the section smoothly
            if (innerContainerRef.current) {
                gsap.set(innerContainerRef.current, {
                    opacity: Math.max(0, 1 - (progress * 1.5)), // Fades out completely by 66% progress
                });
            }
        };

        window.addEventListener('slide-overlay-progress', handleOverlayProgress);
        return () => window.removeEventListener('slide-overlay-progress', handleOverlayProgress);
    }, []);

    // ScrollTrigger to auto-play when user scrolls in and smoothly recede when scrolling out
    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);

        const trigger = ScrollTrigger.create({
            trigger: sectionRef.current,
            start: 'top 75%',
            onEnter: () => {
                setIsDelayed(true);
            },
            onLeaveBack: () => {
                setIsDelayed(false);
            }
        });

        return () => {
            trigger.kill();
        };
    }, []);

    return (
        <section ref={sectionRef} className="pt-12 md:pt-16 pb-48 md:pb-12 bg-transparent relative">
            {/* Ambient decorative glowing spots */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 -translate-y-1/2 w-87.5 h-87.5 rounded-full bg-[#FF5B1D]/3 blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-100 h-100 rounded-full bg-[#FF5B1D]/2 blur-[130px]" />
            </div>

            <div ref={innerContainerRef} className="max-w-6xl mx-auto px-6 relative z-10 will-change-transform">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-6 md:mb-8">
                    <div className="hidden md:inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#FF5B1D]/10 border border-[#FF5B1D]/20 text-[#FF5B1D] font-mono text-[11px] font-bold tracking-wider uppercase rounded-full mb-3 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF5B1D] animate-pulse" />
                        ✦ TYPE &amp; MAGIC
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-brand-dark leading-tight">
                        From a Single Sentence to a Perfect Itinerary
                    </h2>
                    <p className="text-xs sm:text-sm text-secondary-text mt-2 leading-relaxed max-w-xl mx-auto">
                        Type exactly how you want to travel. No forms, no rigid filters. Just pure AI tailoring.
                    </p>
                </div>

                {/* Mobile ONLY: Timeline Header moved above the grid so it doesn't overlap the phone */}
                <div className="lg:hidden flex items-center justify-between border-b border-brand-dark/5 pb-3 mb-6 relative z-50">
                    <div>
                        <h3 className="font-extrabold text-brand-dark text-lg md:text-xl leading-tight">Tailored Rome Itinerary</h3>
                        <p className="invisible text-[11px] text-secondary-text mt-0.5 font-medium">Prompt-compiled Day 1 routing</p>
                    </div>
                    <button
                        onClick={handleToggleDelay}
                        className="px-4 py-2 bg-brand-dark hover:bg-brand-dark/90 text-white font-mono text-[9px] font-bold uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-[0.98] select-none flex items-center gap-1.5 cursor-pointer pointer-events-auto"
                    >
                        <span>{isDelayed ? '⚡ RESET ITINERARY' : '🔥 Run Prompt'}</span>
                    </button>
                </div>

                {/* Main Split Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-12 items-start lg:items-center relative">

                    {/* Left Column: Realistic iPhone Titanium Frame */}
                    <div className="col-start-1 row-start-1 lg:col-span-5 flex flex-col items-center justify-center py-2 relative z-10 -mt-12 lg:mt-0">
                        {/* Ground Contact Shadow */}
                        <div
                            ref={phoneShadowRef}
                            className="absolute -bottom-3 w-56 h-7 rounded-full bg-black/50 blur-xl pointer-events-none z-0 will-change-transform"
                        />

                        <div
                            ref={phoneRef}
                            className="relative w-64 h-[495px] sm:w-66 sm:h-[505px] md:w-68 md:h-[515px] rounded-[46px] bg-gradient-to-br from-[#403f44] via-[#1c1b1f] to-[#2d2c31] border-[1px] border-[#5a5960] will-change-transform z-10 p-[6px]"
                            style={{
                                boxShadow: '0 0 0 1px rgba(0,0,0,0.8), 0 0 0 3px #18171a, 0 0 0 4.5px rgba(255,255,255,0.1), 0 40px 80px -15px rgba(0, 0, 0, 0.7), 0 0 80px 0px rgba(255, 91, 29, 0.15), inset 0 0 15px rgba(255,255,255,0.05)',
                            }}
                        >
                            {/* Physical Hardware Side Buttons (Titanium Finish) */}
                            {/* Left Side: Action Button */}
                            <div className="absolute -left-[3px] top-24 w-[3px] h-6 bg-gradient-to-l from-[#1c1b1f] to-[#403f44] rounded-l-[2px] shadow-[inset_1px_0_1px_rgba(255,255,255,0.2)]" />
                            {/* Left Side: Volume Up */}
                            <div className="absolute -left-[3px] top-36 w-[3px] h-12 bg-gradient-to-l from-[#1c1b1f] to-[#403f44] rounded-l-[2px] shadow-[inset_1px_0_1px_rgba(255,255,255,0.2)]" />
                            {/* Left Side: Volume Down */}
                            <div className="absolute -left-[3px] top-52 w-[3px] h-12 bg-gradient-to-l from-[#1c1b1f] to-[#403f44] rounded-l-[2px] shadow-[inset_1px_0_1px_rgba(255,255,255,0.2)]" />
                            {/* Right Side: Power Button */}
                            <div className="absolute -right-[3px] top-40 w-[3px] h-16 bg-gradient-to-r from-[#1c1b1f] to-[#403f44] rounded-r-[2px] shadow-[inset_-1px_0_1px_rgba(255,255,255,0.2)]" />

                            {/* Antenna Bands */}
                            <div className="absolute top-0 left-16 w-2 h-[6px] bg-[#0F0E11] z-0" />
                            <div className="absolute top-0 right-16 w-2 h-[6px] bg-[#0F0E11] z-0" />
                            <div className="absolute bottom-0 left-16 w-2 h-[6px] bg-[#0F0E11] z-0" />
                            <div className="absolute bottom-0 right-16 w-2 h-[6px] bg-[#0F0E11] z-0" />

                            {/* Cursor arrow element (absolute relative to phone mockup wrapper) */}
                            <div
                                ref={cursorRef}
                                className="mouse-cursor absolute pointer-events-none z-50 w-3 h-5 opacity-0"
                                style={{
                                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))',
                                    transformOrigin: 'top left',
                                    top: 0,
                                    left: 0,
                                }}
                            >
                                <svg viewBox="0 0 24 24" className="w-full h-full fill-[#000000] stroke-white stroke-1">
                                    <path d="M4.5 2.5 L22.5 12.5 L14.5 14.5 L20.5 20.5 L17.5 22.5 L11.5 16.5 L4.5 20.5 Z" />
                                </svg>
                            </div>

                            {/* Inner Screen Display */}
                            <div className="relative w-full h-full bg-[#000000] rounded-[40px] overflow-hidden border-[4px] border-[#0A090C] shadow-inner flex flex-col justify-between text-white font-sans">
                                
                                {/* Realistic Glass Reflection Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none z-40" />
                                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-40" />

                                {/* OLED Power-On Laser Sheen Beam */}
                                <div
                                    ref={laserSheenRef}
                                    className="absolute -inset-x-20 h-44 pointer-events-none z-50 will-change-transform opacity-0"
                                    style={{
                                        transform: 'rotate(-20deg)',
                                        background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.95) 49%, #FF5B1D 50%, rgba(255,255,255,0.95) 51%, rgba(255,255,255,0.06) 75%, transparent 100%)',
                                        boxShadow: '0 0 45px 12px rgba(255, 91, 29, 0.55), 0 0 90px 25px rgba(255, 255, 255, 0.4)',
                                    }}
                                />

                                {/* iPhone 15 Pro Dynamic Island */}
                                <div 
                                    ref={islandRef}
                                    className="absolute top-2 left-1/2 -translate-x-1/2 w-[100px] h-7 rounded-full bg-black z-30 flex items-center justify-between px-2.5 shadow-[0_4px_12px_rgba(0,0,0,1)] will-change-transform origin-center"
                                >
                                    {/* Front Camera Lens */}
                                    <div className="w-3 h-3 rounded-full bg-[#0d0c10] border border-white/5 flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40 shadow-[0_0_3px_#3b82f6]" />
                                    </div>
                                    {/* FaceID & Recording Dot */}
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-[#111]" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]" />
                                    </div>
                                </div>

                                {/* Screen Content Wrapper (Powers on with laser sheen) */}
                                <div ref={screenContentRef} className="w-full h-full flex flex-col justify-between will-change-transform">
                                    {/* iOS Status Bar */}
                                    <div className="pt-2.5 px-5 flex items-center justify-between z-20 text-white select-none shrink-0">
                                        <span className="text-[10.5px] font-bold tracking-tight font-sans">9:41</span>
                                        <div className="flex items-center gap-1.5 opacity-90">
                                            {/* Wi-Fi Icon */}
                                            <svg className="w-3 h-3 text-bold fill-current" viewBox="0 0 24 24">
                                                <path d="M12 3c-4.97 0-9.5 2.01-12.8 5.28l1.4 1.42C3.62 6.74 7.6 5 12 5c4.4 0 8.38 1.74 11.4 4.7l1.4-1.42C21.5 5.01 16.97 3 12 3zm0 5c-3.59 0-6.83 1.46-9.19 3.82l1.41 1.41C6.15 11.3 9.04 10 12 10c2.96 0 5.85 1.3 7.78 3.23l1.41-1.41C18.83 9.46 15.59 8 12 8zm0 5c-2.21 0-4.21.9-5.66 2.34l1.41 1.41C8.84 15.66 10.34 15 12 15c1.66 0 3.16.66 4.24 1.76l1.41-1.41C16.21 13.9 14.21 13 12 13zm0 5l-2.83 2.83C10.02 21.68 10.98 22 12 22s1.98-.32 2.83-1.17L12 18z"/>
                                            </svg>
                                            {/* Battery Icon */}
                                            <div className="flex items-center">
                                                <div className="w-4.5 h-2.5 border border-white/70 rounded-[3px] p-[1px] flex items-center">
                                                    <div className="w-full h-full bg-white rounded-[1px]" />
                                                </div>
                                                <div className="w-0.5 h-1 bg-white/70 rounded-r-[1px]" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* App Header */}
                                    <div className="flex justify-between items-center mt-3 px-4 pb-2.5 border-b border-white/10 shrink-0 z-10">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-[#FF5B1D] shadow-[0_0_6px_#FF5B1D]" />
                                            <span className="text-[10.5px] font-black tracking-widest text-white">TRIPWISE</span>
                                        </div>
                                        <span className="px-2 py-0.5 rounded-full bg-[#FF5B1D]/15 border border-[#FF5B1D]/30 text-[#FF5B1D] text-[7px] font-bold tracking-widest uppercase shadow-2xs">PROMPT COMPILER</span>
                                    </div>

                                    {/* Active prompt mockup card */}
                                    <div className="flex-1 flex flex-col justify-center px-4 py-2 relative z-10">
                                        <div className="rounded-2xl border border-white/15 bg-linear-to-b from-white/8 to-white/2 backdrop-blur-xl p-3.5 relative shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-[8.5px] font-extrabold text-white/60 uppercase tracking-widest flex items-center gap-1">
                                                    <span className="text-[#FF5B1D]">✦</span> Custom Travel Request
                                                </label>
                                                <span className="text-[7.5px] font-mono text-white/30">AI v2.1</span>
                                            </div>

                                            {/* Style for smooth terminal cursor blink */}
                                            <style>{`
                                                @keyframes cursor-smooth-blink {
                                                    0%, 100% { opacity: 1; }
                                                    50% { opacity: 0.15; }
                                                }
                                            `}</style>

                                            <div
                                                className="relative min-h-20 bg-[#0A090C]/90 rounded-xl border border-white/10 p-3 leading-relaxed select-none shadow-inner"
                                                style={{
                                                    fontFamily: "system-ui, 'SF Pro Display', -apple-system, sans-serif",
                                                    fontSize: '12px',
                                                    color: '#F3F3F5',
                                                    textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                                                }}
                                            >
                                                <span ref={promptTextRef} className="font-normal" />
                                                <span 
                                                    className="inline-block w-1.5 h-3.5 bg-[#FF5B1D] ml-0.5 align-middle rounded-xs"
                                                    style={{
                                                        animation: 'cursor-smooth-blink 0.9s ease-in-out infinite',
                                                    }}
                                                />
                                            </div>

                                            {/* Action Button */}
                                            <button
                                                ref={generateBtnRef}
                                                className="generate-btn mt-3.5 w-full py-3 bg-linear-to-r from-[#FF5B1D] to-[#E04F18] hover:from-[#FF7843] hover:to-[#FF5B1D] text-white rounded-xl font-mono text-[8.5px] font-bold tracking-widest uppercase flex items-center justify-center gap-2 select-none transition-all duration-300 shadow-[0_4px_20px_rgba(255,91,29,0.35)] active:scale-95 border border-white/20"
                                            >
                                                <span>Generate Itinerary</span>
                                                <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                                                    <path d="M5 13h11.86l-5.43 5.43 1.42 1.42L21.14 12l-8.29-7.85-1.42 1.42L16.86 11H5v2z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Status Footer & Home Indicator */}
                                    <div className="flex flex-col items-center justify-end pb-1.5 shrink-0 z-20">
                                        <div className="text-center text-white/30 text-[7.5px] font-mono tracking-widest uppercase mb-1.5">
                                            TripWise Tailor Engine v2.1
                                        </div>
                                        {/* iOS Home Indicator Bar */}
                                        <div className="w-28 h-1 bg-white/40 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Tailored Itinerary Timeline */}
                    <div ref={timelineRef} className="col-start-1 row-start-1 lg:col-start-auto lg:row-start-auto lg:col-span-7 flex flex-col gap-4 relative z-50 -mt-11 lg:mt-0 pointer-events-none lg:pointer-events-auto">

                        <div className="hidden lg:flex items-center justify-between border-b border-brand-dark/5 pb-3">
                            <div>
                                <h3 className="font-extrabold text-brand-dark text-lg md:text-xl leading-tight">Tailored Rome Itinerary</h3>
                                <p className="text-[11px] text-secondary-text mt-0.5 font-medium">Prompt-compiled Day 1 routing</p>
                            </div>

                            {/* Trigger Controls (RESET ITINERARY) */}
                            <button
                                onClick={handleToggleDelay}
                                className="px-4 py-2 bg-brand-dark hover:bg-brand-dark/90 text-white font-mono text-[9px] font-bold uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-[0.98] select-none flex items-center gap-1.5 cursor-pointer"
                            >
                                <span>{isDelayed ? '⚡ RESET ITINERARY' : '🔥 Run Prompt'}</span>
                            </button>
                        </div>

                        {/* Interactive Timeline List */}
                        <div 
                            className="relative pl-7 flex flex-col gap-2.5 sm:gap-3"
                            style={{ perspective: '1400px', transformStyle: 'preserve-3d' }}
                        >
                            {/* Dotted Vertical Line Connector */}
                            <div className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-brand-dark/5 border-l border-dashed border-brand-dark/15" />

                            {/* Recalculating Micro-State Glass Overlay */}
                            {isAdjusting && (
                                <div className="absolute inset-0 bg-[#FFF8F5]/60 backdrop-blur-[2px] flex items-center justify-center z-20 transition-all duration-300 rounded-2xl border border-brand-dark/5">
                                    <div className="bg-[#1C1B1B] text-white rounded-full px-4 py-2 border border-white/10 flex items-center gap-2 shadow-xl">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF5B1D] animate-ping" />
                                        <span className="font-mono text-[8.5px] font-bold tracking-widest uppercase text-white/95">Tailoring Itinerary...</span>
                                    </div>
                                </div>
                            )}

                            {/* Event 1: Flight Landing */}
                            <div
                                ref={el => { cardRefs.current[0] = el; }}
                                className="timeline-card card-flight relative p-3 md:p-4 rounded-xl border border-brand-dark/10 bg-white/95 backdrop-blur-sm shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-md hover:border-[#FF5B1D]/35 cursor-default"
                            >
                                {/* Dot Icon */}
                                <div className="absolute -left-9.5 top-4 w-5 h-5 rounded-full bg-[#FFF8F5] border-2 border-brand-dark/20 flex items-center justify-center z-10 text-[9px] font-black font-sans shadow-2xs">
                                    01
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="time-flight text-[11px] font-mono font-bold leading-none text-[#FF5B1D]">09:30</span>
                                        <span className="text-[8.5px] font-sans font-bold text-secondary-text/50 uppercase tracking-widest leading-none">Arrival</span>
                                    </div>
                                    <h4 className="text-xs md:text-sm font-extrabold text-brand-dark leading-tight">Rome Fiumicino Airport (FCO) Arrival</h4>
                                    <p className="text-[10.5px] text-secondary-text mt-0.5 leading-snug">Airport express train ticket automatically added to digital wallet.</p>
                                </div>

                                {/* Custom tag */}
                                <div className="badge-flight shrink-0 px-2 py-0.5 border border-brand-dark/15 bg-brand-dark/5 text-brand-dark/70 rounded font-mono text-[7.5px] font-bold tracking-wider uppercase select-none">
                                    09:30 AM — ARRIVAL
                                </div>
                            </div>

                            {/* Event 2: Hotel Check-In */}
                            <div
                                ref={el => { cardRefs.current[1] = el; }}
                                className="timeline-card relative p-3 md:p-4 rounded-xl border border-brand-dark/10 bg-white/95 backdrop-blur-sm shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-md hover:border-[#FF5B1D]/35 cursor-default"
                            >
                                <div className="absolute -left-9.5 top-4 w-5 h-5 rounded-full bg-[#FFF8F5] border-2 border-brand-dark/20 flex items-center justify-center z-10 text-[9px] font-black font-sans shadow-2xs">
                                    02
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="time-hotel text-[11px] font-mono font-bold leading-none text-green-600">12:30</span>
                                        <span className="text-[8.5px] font-sans font-bold text-secondary-text/50 uppercase tracking-widest leading-none">Hotel</span>
                                    </div>
                                    <h4 className="text-xs md:text-sm font-extrabold text-brand-dark leading-tight">Hotel check-in: Generator Rome</h4>
                                    <p className="text-[10.5px] text-secondary-text mt-0.5 leading-snug">Highly rated budget accommodation selected near main transit hubs.</p>
                                </div>

                                {/* Custom Budget tag */}
                                <div className="badge-hotel shrink-0 px-2 py-0.5 border border-green-500/20 bg-green-500/5 text-green-600 rounded font-mono text-[7.5px] font-bold tracking-wider uppercase select-none flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                                    BUDGET MATCH
                                </div>
                            </div>

                            {/* Event 3: Colosseum Guided Tour */}
                            <div
                                ref={el => { cardRefs.current[2] = el; }}
                                className="timeline-card card-tour relative p-3 md:p-4 rounded-xl border border-brand-dark/10 bg-white/95 backdrop-blur-sm shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-md hover:border-[#FF5B1D]/35 cursor-default"
                            >
                                <div className="absolute -left-9.5 top-4 w-5 h-5 rounded-full bg-[#FFF8F5] border-2 border-brand-dark/20 flex items-center justify-center z-10 text-[9px] font-black font-sans shadow-2xs">
                                    03
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="time-tour text-[11px] font-mono font-bold leading-none text-blue-600">15:00</span>
                                        <span className="text-[8.5px] font-sans font-bold text-secondary-text/50 uppercase tracking-widest leading-none">Activity</span>
                                    </div>
                                    <h4 className="text-xs md:text-sm font-extrabold text-brand-dark leading-tight">Colosseum Skip-the-Line Visit</h4>
                                    <p className="text-[10.5px] text-secondary-text mt-0.5 leading-snug">Scheduled during low-crowd afternoon window to optimize walking route.</p>
                                </div>

                                {/* Optimized route badge */}
                                <div className="badge-tour shrink-0 px-2 py-0.5 border border-blue-500/20 bg-blue-500/5 text-blue-600 rounded font-mono text-[7.5px] font-bold tracking-wider uppercase select-none flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                                    OPTIMIZED ROUTE
                                </div>
                            </div>

                            {/* Event 4: Trastevere Dinner Reservation */}
                            <div
                                ref={el => { cardRefs.current[3] = el; }}
                                className="timeline-card card-dinner relative p-3 md:p-4 rounded-xl border border-brand-dark/10 bg-white/95 backdrop-blur-sm shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-md hover:border-[#FF5B1D]/35 cursor-default"
                            >
                                <div className="absolute -left-9.5 top-4 w-5 h-5 rounded-full bg-[#FFF8F5] border-2 border-brand-dark/20 flex items-center justify-center z-10 text-[9px] font-black font-sans shadow-2xs">
                                    04
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="time-dinner text-[11px] font-mono font-bold leading-none text-[#FF5B1D]">19:30</span>
                                        <span className="text-[8.5px] font-sans font-bold text-secondary-text/50 uppercase tracking-widest leading-none">Dining</span>
                                    </div>
                                    <h4 className="text-xs md:text-sm font-extrabold text-brand-dark leading-tight">Dinner at Da Enzo Al 29</h4>
                                    <p className="text-[10.5px] text-secondary-text mt-0.5 leading-snug">Hyper-local Trastevere dining spot serving authentic Roman pasta.</p>
                                </div>

                                {/* Custom Local Gem tag */}
                                <div className="badge-dinner shrink-0 px-2 py-0.5 border border-orange-500/20 bg-orange-500/5 text-[#FF5B1D] rounded font-mono text-[7.5px] font-bold tracking-wider uppercase select-none flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-[#FF5B1D] animate-pulse" />
                                    LOCAL GEM
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
