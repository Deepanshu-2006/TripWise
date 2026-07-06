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

    const [isDelayed, setIsDelayed] = useState(false);
    const [isAdjusting, setIsAdjusting] = useState(false);
    const [typedPrompt, setTypedPrompt] = useState('');

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
        const ctx = gsap.context(() => {
            // Set initial state of cursor
            gsap.set(cursorRef.current, {
                x: 80,
                y: 220,
                opacity: 0,
                scale: 1,
            });

            // Set initial state of timeline cards (hidden initially)
            gsap.set('.timeline-card', {
                opacity: 0,
                scale: 0.95,
                y: 15,
            });

            // Instantiate master timeline
            const tl = gsap.timeline({ paused: true });
            timelineObjRef.current = tl;

            // 1. Simulate typing text in input field
            const promptObj = { chars: 0 };
            tl.to(promptObj, {
                chars: fullPrompt.length,
                duration: 3.2,
                ease: 'none',
                onUpdate: function () {
                    const isForward = !tl.reversed();
                    const count = Math.floor(promptObj.chars);
                    setTypedPrompt(isForward ? fullPrompt.slice(0, count) : '');
                }
            }, 0.2);

            // 2. Animate cursor moving to the Generate button
            tl.to(cursorRef.current, {
                x: () => getButtonCoords().x,
                y: () => getButtonCoords().y,
                opacity: 1,
                duration: 0.6,
                ease: 'power2.out',
            }, 3.5);

            // 3. Trigger button click animation & phone container pulse
            tl.to(generateBtnRef.current, {
                scale: 0.95,
                backgroundColor: '#E04F18',
                duration: 0.1,
                yoyo: true,
                repeat: 1,
            }, 4.1);

            tl.to(cursorRef.current, {
                scale: 0.8,
                duration: 0.1,
                yoyo: true,
                repeat: 1,
            }, 4.1);

            // Phone visual pulse on emit
            tl.to(phoneRef.current, {
                scale: 1.02,
                borderColor: 'rgba(255, 91, 29, 0.4)',
                boxShadow: '0 0 45px rgba(255, 91, 29, 0.25)',
                duration: 0.15,
                yoyo: true,
                repeat: 1,
                ease: 'power1.inOut',
            }, 4.2);

            // Fade cursor out after click
            tl.to(cursorRef.current, {
                opacity: 0,
                duration: 0.2,
            }, 4.3);

            // 4. Recalculating micro-state: Loader overlays the list (0.3s delay)
            tl.call(() => {
                const isForward = !tl.reversed();
                setIsAdjusting(isForward);
            }, null, 4.4);

            tl.to({}, { duration: 0.35 }, 4.4); // delay window

            tl.call(() => {
                setIsAdjusting(false);
            }, null, 4.75);

            // 5. Staggered cascade of timeline cards popping into view
            tl.to('.timeline-card', {
                opacity: 1,
                scale: 1,
                y: 0,
                stagger: 0.22,
                duration: 0.55,
                ease: 'back.out(1.2)',
            }, 4.75);

        }, sectionRef);

        return () => ctx.revert();
    }, []);
    // Control timeline based on state
    useEffect(() => {
        if (!timelineObjRef.current) return;
        if (isDelayed) {
            timelineObjRef.current.play();
        } else {
            // Clean up typed text state instantly on reset
            setTypedPrompt('');
            timelineObjRef.current.reverse();
        }
    }, [isDelayed]);

    // ScrollTrigger to auto-play when user scrolls in
    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);

        const trigger = ScrollTrigger.create({
            trigger: sectionRef.current,
            start: 'top 65%',
            onEnter: () => {
                setIsDelayed(true);
            },
            onLeaveBack: () => {
                setIsDelayed(false);
            }
        });

        return () => trigger.kill();
    }, []);

    return (
        <section ref={sectionRef} className="pt-30 pb-32 bg-[#FFF8F5] relative overflow-hidden border-t border-brand-dark/5">
            {/* Ambient decorative glowing spots */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 -translate-y-1/2 w-87.5 h-87.5 rounded-full bg-[#FF5B1D]/3 blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-100 h-100 rounded-full bg-[#FF5B1D]/2 blur-[130px]" />
            </div>

            <div className="max-w-6xl mx-auto px-6 relative z-10">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-block px-4 py-1.5 bg-[#FF5B1D]/10 border border-[#FF5B1D]/20 text-[#FF5B1D] font-mono text-[9px] font-bold tracking-wider uppercase rounded-full mb-4">
                        ✦ TYPE &amp; MAGIC
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-brand-dark leading-tight">
                        From a Single Sentence to a Perfect Itinerary
                    </h2>
                    <p className="text-sm text-secondary-text mt-4 leading-relaxed mb-16 max-w-2xl mx-auto">
                        Type exactly how you want to travel. No forms, no rigid filters. Just pure AI tailoring.
                    </p>
                </div>

                {/* Main Split Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

                    {/* Left Column: Simulated Phone Frame */}
                    <div className="lg:col-span-5 flex flex-col items-center justify-center">
                        <div
                            ref={phoneRef}
                            className="relative w-71.25 h-137.5 rounded-[48px] border-12 border-[#1C1B1E] bg-[#111012] shadow-2xl overflow-hidden transition-all duration-500"
                            style={{
                                boxShadow: '0 25px 60px -15px rgba(28,27,27,0.15), 0 0 50px rgba(255, 91, 29, 0.05)',
                            }}
                        >
                            {/* iPhone Dynamic Island */}
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-26 h-6 rounded-full bg-black z-30 flex items-center justify-end px-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#FF5B1D]/80 animate-pulse" />
                            </div>

                            {/* Cursor arrow element (absolute relative to phone mockup wrapper) */}
                            <div
                                ref={cursorRef}
                                className="mouse-cursor absolute pointer-events-none z-30 w-5 h-5 opacity-0"
                                style={{
                                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
                                    transformOrigin: 'top left',
                                    top: 0,
                                    left: 0,
                                }}
                            >
                                <svg viewBox="0 0 24 24" className="w-full h-full fill-[#FF5B1D] stroke-white stroke-1">
                                    <path d="M4.5 2.5 L22.5 12.5 L14.5 14.5 L20.5 20.5 L17.5 22.5 L11.5 16.5 L4.5 20.5 Z" />
                                </svg>
                            </div>

                            {/* Phone Screen App Canvas */}
                            <div className="absolute inset-0 bg-[#0A090B] p-5 flex flex-col justify-between text-white font-sans">

                                {/* App Header */}
                                <div className="flex justify-between items-center mt-8 border-b border-white/5 pb-3 shrink-0">
                                    <span className="text-[12px] font-black tracking-widest text-[#FF5B1D]">TRIPWISE</span>
                                    <span className="px-2.5 py-0.5 rounded-full bg-[#FF5B1D]/10 border border-[#FF5B1D]/20 text-[#FF5B1D] text-[7px] font-bold tracking-widest uppercase">PROMPT COMPILER</span>
                                </div>

                                {/* Active prompt mockup card */}
                                <div className="flex-1 flex flex-col justify-center gap-4 py-4 relative z-10">

                                    <div className="rounded-2xl border border-white/10 bg-white/3 backdrop-blur-xl p-4.5 relative shadow-inner">
                                        <label className="block text-[8px] font-bold text-white/40 uppercase tracking-widest mb-2.5">Custom Travel Request</label>

                                        <div
                                            className="relative min-h-27.5 bg-black/60 rounded-xl border border-white/10 p-3 leading-normal select-none shadow-inner"
                                            style={{
                                                fontFamily: "system-ui, 'SF Mono', Monaco, Consolas, monospace",
                                                fontSize: '12.5px',
                                                opacity: 0.95,
                                                color: '#FFFFFF'
                                            }}
                                        >
                                            {typedPrompt}
                                            <span className="inline-block w-1.5 h-3.5 bg-[#FF5B1D] animate-pulse ml-0.5" />
                                        </div>

                                        {/* Action Button */}
                                        <button
                                            ref={generateBtnRef}
                                            className="generate-btn mt-4.5 w-full py-3 bg-linear-to-r from-[#FF5B1D] to-[#E04F18] hover:from-[#FF7843] hover:to-[#FF5B1D] text-white rounded-xl font-mono text-[8.5px] font-bold tracking-widest uppercase flex items-center justify-center gap-1.5 select-none transition-all duration-300 shadow-[0_0_20px_rgba(255,91,29,0.3)]"
                                            style={{
                                                boxShadow: '0 4px 20px rgba(255, 91, 29, 0.35)',
                                            }}
                                        >
                                            <span>Generate Itinerary</span>
                                            <span className="text-[10px]">✦</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Status Footer details */}
                                <div className="text-center text-white/20 text-[7px] font-mono tracking-widest uppercase mb-1">
                                    TripWise Tailor Engine v2.1
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Tailored Itinerary Timeline */}
                    <div ref={timelineRef} className="lg:col-span-7 flex flex-col gap-6">

                        <div className="flex items-center justify-between border-b border-brand-dark/5 pb-4">
                            <div>
                                <h3 className="font-extrabold text-brand-dark text-xl leading-tight">Tailored Rome Itinerary</h3>
                                <p className="text-xs text-secondary-text mt-1 font-medium">Prompt-compiled Day 1 routing</p>
                            </div>

                            {/* Trigger Controls (RESET ITINERARY) */}
                            <button
                                onClick={handleToggleDelay}
                                className="px-5 py-2.5 bg-brand-dark hover:bg-brand-dark/90 text-white font-mono text-[10px] font-bold uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-[0.98] select-none flex items-center gap-2 cursor-pointer"
                            >
                                <span>{isDelayed ? '⚡ RESET ITINERARY' : '🔥 Run Prompt'}</span>
                            </button>
                        </div>

                        {/* Interactive Timeline List */}
                        <div className="relative pl-8 flex flex-col gap-4 min-h-75">
                            {/* Dotted Vertical Line Connector */}
                            <div className="absolute left-2.75 top-3 bottom-3 w-0.5 bg-brand-dark/5 border-l border-dashed border-brand-dark/15" />

                            {/* Recalculating Micro-State Glass Overlay */}
                            {isAdjusting && (
                                <div className="absolute inset-0 bg-[#FFF8F5]/60 backdrop-blur-[2px] flex items-center justify-center z-20 transition-all duration-300 rounded-2xl border border-brand-dark/5">
                                    <div className="bg-[#1C1B1B] text-white rounded-full px-5 py-2.5 border border-white/10 flex items-center gap-2.5 shadow-xl">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF5B1D] animate-ping" />
                                        <span className="font-mono text-[9px] font-bold tracking-widest uppercase text-white/95">Tailoring Itinerary...</span>
                                    </div>
                                </div>
                            )}

                            {/* Event 1: Flight Landing */}
                            <div
                                ref={el => { cardRefs.current[0] = el; }}
                                className="timeline-card card-flight relative p-5 rounded-2xl border border-brand-dark/5 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)] flex items-start justify-between gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-[#FF5B1D]/20"
                            >
                                {/* Dot Icon */}
                                <div className="absolute -left-10 top-5.5 w-6 h-6 rounded-full bg-[#FFF8F5] border-2 border-brand-dark/20 flex items-center justify-center z-10 text-[10px] font-black font-sans shadow-sm">
                                    01
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="time-flight text-xs font-mono font-bold leading-none text-[#FF5B1D]">09:30</span>
                                        <span className="text-[9px] font-sans font-bold text-secondary-text/50 uppercase tracking-widest leading-none">Arrival</span>
                                    </div>
                                    <h4 className="text-sm md:text-base font-extrabold text-brand-dark">Rome Fiumicino Airport (FCO) Arrival</h4>
                                    <p className="text-[11.5px] text-secondary-text mt-1 leading-relaxed">Airport express train ticket automatically added to digital wallet.</p>
                                </div>

                                {/* Custom tag */}
                                <div className="badge-flight shrink-0 px-2.5 py-1 border border-brand-dark/15 bg-brand-dark/5 text-brand-dark/70 rounded font-mono text-[8px] font-bold tracking-wider uppercase select-none">
                                    09:30 AM — ARRIVAL
                                </div>
                            </div>

                            {/* Event 2: Hotel Check-In */}
                            <div
                                ref={el => { cardRefs.current[1] = el; }}
                                className="timeline-card relative p-5 rounded-2xl border border-brand-dark/5 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)] flex items-start justify-between gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-[#FF5B1D]/20"
                            >
                                <div className="absolute -left-10 top-5.5 w-6 h-6 rounded-full bg-[#FFF8F5] border-2 border-brand-dark/20 flex items-center justify-center z-10 text-[10px] font-black font-sans shadow-sm">
                                    02
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="time-hotel text-xs font-mono font-bold leading-none text-green-600">12:30</span>
                                        <span className="text-[9px] font-sans font-bold text-secondary-text/50 uppercase tracking-widest leading-none">Hotel</span>
                                    </div>
                                    <h4 className="text-sm md:text-base font-extrabold text-brand-dark">Hotel check-in: Generator Rome</h4>
                                    <p className="text-[11.5px] text-secondary-text mt-1 leading-relaxed">Highly rated budget accommodation selected near main transit hubs.</p>
                                </div>

                                {/* Custom Budget tag */}
                                <div className="badge-hotel shrink-0 px-2.5 py-1 border border-green-500/20 bg-green-500/5 text-green-600 rounded font-mono text-[8px] font-bold tracking-wider uppercase select-none flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    BUDGET MATCH
                                </div>
                            </div>

                            {/* Event 3: Colosseum Guided Tour */}
                            <div
                                ref={el => { cardRefs.current[2] = el; }}
                                className="timeline-card card-tour relative p-5 rounded-2xl border border-brand-dark/5 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)] flex items-start justify-between gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-[#FF5B1D]/20"
                            >
                                <div className="absolute -left-10 top-5.5 w-6 h-6 rounded-full bg-[#FFF8F5] border-2 border-brand-dark/20 flex items-center justify-center z-10 text-[10px] font-black font-sans shadow-sm">
                                    03
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="time-tour text-xs font-mono font-bold leading-none text-blue-600">15:00</span>
                                        <span className="text-[9px] font-sans font-bold text-secondary-text/50 uppercase tracking-widest leading-none">Activity</span>
                                    </div>
                                    <h4 className="text-sm md:text-base font-extrabold text-brand-dark">Colosseum Skip-the-Line Visit</h4>
                                    <p className="text-[11.5px] text-secondary-text mt-1 leading-relaxed">Scheduled during low-crowd afternoon window to optimize walking route.</p>
                                </div>

                                {/* Optimized route badge */}
                                <div className="badge-tour shrink-0 px-2.5 py-1 border border-blue-500/20 bg-blue-500/5 text-blue-600 rounded font-mono text-[8px] font-bold tracking-wider uppercase select-none flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                    OPTIMIZED ROUTE
                                </div>
                            </div>

                            {/* Event 4: Trastevere Dinner Reservation */}
                            <div
                                ref={el => { cardRefs.current[3] = el; }}
                                className="timeline-card card-dinner relative p-5 rounded-2xl border border-brand-dark/5 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)] flex items-start justify-between gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-[#FF5B1D]/20"
                            >
                                <div className="absolute -left-10 top-5.5 w-6 h-6 rounded-full bg-[#FFF8F5] border-2 border-brand-dark/20 flex items-center justify-center z-10 text-[10px] font-black font-sans shadow-sm">
                                    04
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="time-dinner text-xs font-mono font-bold leading-none text-[#FF5B1D]">19:30</span>
                                        <span className="text-[9px] font-sans font-bold text-secondary-text/50 uppercase tracking-widest leading-none">Dining</span>
                                    </div>
                                    <h4 className="text-sm md:text-base font-extrabold text-brand-dark">Dinner at Da Enzo Al 29</h4>
                                    <p className="text-[11.5px] text-secondary-text mt-1 leading-relaxed">Hyper-local Trastevere dining spot serving authentic Roman pasta.</p>
                                </div>

                                {/* Local gem badge */}
                                <div className="badge-dinner shrink-0 px-2.5 py-1 border border-[#FF5B1D]/25 bg-[#FF5B1D]/5 text-[#FF5B1D] rounded font-mono text-[8px] font-bold tracking-wider uppercase select-none flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF5B1D] animate-pulse" />
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
