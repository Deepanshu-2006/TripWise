'use client';

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

function FeaturesSelection() {
    const [activeTab, setActiveTab] = useState(0);
    const [activePreviewTab, setActivePreviewTab] = useState(0);
    const containerRef = useRef(null);
    const stickyRef = useRef(null);
    const planeRef = useRef(null);
    const basePathRef = useRef(null);
    const activePathRef = useRef(null);
    const maskPathRef = useRef(null);
    const svgRef = useRef(null);
    const contentWrapperRef = useRef(null);
    const cardsContainerRef = useRef(null);



    useEffect(() => {
        if (!containerRef.current || !stickyRef.current) return;
        gsap.registerPlugin(ScrollTrigger);

        let mm = gsap.matchMedia();

        mm.add("all", () => {
            const ctx = gsap.context(() => {
            ScrollTrigger.create({
                trigger: containerRef.current,
                start: 'top top',
                end: 'bottom bottom',
                scrub: true,
                onUpdate: (self) => {
                    const rawProgress = self.progress;
                    
                    // Stage 1: Features & Airplane (0.0 to 0.60)
                    const featureProgress = Math.min(1.0, rawProgress / 0.60);
                    // Stage 2: Exit Layering / Slide Overlap (0.60 to 1.0)
                    const exitProgress = Math.max(0, (rawProgress - 0.60) / 0.40);

                    // 1. Map activeIdx and activePreviewTab based on when the plane reaches each checkpoint
                    // Plane completes its flight precisely as featureProgress reaches 1.0
                    const flightProgress = featureProgress;

                    let activeIdx = 0;
                    if (featureProgress >= 0.30 && featureProgress < 0.52) activeIdx = 1;
                    else if (featureProgress >= 0.52 && featureProgress < 0.72) activeIdx = 2;
                    else if (featureProgress >= 0.72) activeIdx = 3;
                    setActiveTab(activeIdx);

                    // Dashboard changes ONLY when the plane reaches its relative preview container
                    let activePreviewIdx = 0;
                    if (featureProgress >= 0.32 && featureProgress < 0.55) activePreviewIdx = 1;
                    else if (featureProgress >= 0.55 && featureProgress < 0.75) activePreviewIdx = 2;
                    else if (featureProgress >= 0.75) activePreviewIdx = 3;
                    setActivePreviewTab(activePreviewIdx);

                    const isDesktop = window.innerWidth >= 1024;
                    
                    if (!isDesktop) {
                        if (cardsContainerRef.current) {
                            const maxScroll = cardsContainerRef.current.scrollWidth - cardsContainerRef.current.clientWidth;
                            cardsContainerRef.current.scrollLeft = maxScroll * featureProgress;
                        }
                    } else {
                        // Plane Flight Path Coordinate Calculation
                        const logoEl = document.querySelector('.header-logo');
                        const stickyRect = stickyRef.current.getBoundingClientRect();
                        const cards = containerRef.current.querySelectorAll('.feature-card');
                        const preview = containerRef.current.querySelector('.preview-outer-container');

                        if (cards.length === 4 && preview && basePathRef.current && activePathRef.current && maskPathRef.current && planeRef.current) {
                            const previewRect = preview.getBoundingClientRect();
                            const previewLeftX = previewRect.left - stickyRect.left;

                            // Logo position
                            let logoX = stickyRect.width / 2;
                            let logoY = -40; // fallback value above header
                            if (logoEl) {
                                const logoRect = logoEl.getBoundingClientRect();
                                logoX = ((logoRect.left + logoRect.right) / 2 - stickyRect.left) + 25;
                                logoY = (logoRect.top + logoRect.bottom) / 2 - stickyRect.top;
                            }

                            const points = [];
                            
                            // Point 0: Header Logo
                            points.push({ x: logoX, y: logoY });

                            // Point 1: Card 0 (Row 0, Left)
                            {
                                const cardRect = cards[0].getBoundingClientRect();
                                const iconEl = cards[0].querySelector('.feature-icon');
                                let cardX, cardY;
                                if (iconEl) {
                                    const iconRect = iconEl.getBoundingClientRect();
                                    cardX = iconRect.right - stickyRect.left;
                                    cardY = (iconRect.top + iconRect.bottom) / 2 - stickyRect.top;
                                } else {
                                    cardX = cardRect.left + 40 - stickyRect.left;
                                    cardY = (cardRect.top + cardRect.bottom) / 2 - stickyRect.top;
                                }
                                points.push({ x: cardX, y: cardY });
                            }

                            // Point 2: Preview 1 (Row 1, Right)
                            {
                                const cardRect = cards[1].getBoundingClientRect();
                                const cardY = (cardRect.top + cardRect.bottom) / 2 - stickyRect.top;
                                points.push({ x: previewLeftX, y: cardY });
                            }

                            // Point 3: Card 2 (Row 2, Left)
                            {
                                const cardRect = cards[2].getBoundingClientRect();
                                const iconEl = cards[2].querySelector('.feature-icon');
                                let cardX, cardY;
                                if (iconEl) {
                                    const iconRect = iconEl.getBoundingClientRect();
                                    cardX = iconRect.right - stickyRect.left;
                                    cardY = (iconRect.top + iconRect.bottom) / 2 - stickyRect.top;
                                } else {
                                    cardX = cardRect.left + 40 - stickyRect.left;
                                    cardY = (cardRect.top + cardRect.bottom) / 2 - stickyRect.top;
                                }
                                points.push({ x: cardX, y: cardY });
                            }

                            // Point 4: Preview 3 (Row 3, Right)
                            {
                                const cardRect = cards[3].getBoundingClientRect();
                                const cardY = (cardRect.top + cardRect.bottom) / 2 - stickyRect.top;
                                points.push({ x: previewLeftX, y: cardY });
                            }

                            // Generate path string 'pathD'
                            let pathD = `M ${points[0].x} ${points[0].y}`;

                            // Segment 0: Logo to Card 0 S-curve (Swooping from Logo down-left to Card 0)
                            {
                                const p0 = points[0];
                                const p1 = points[1];
                                const cp1x = p0.x - (p0.x - p1.x) * 0.3;
                                const cp1y = p0.y + (p1.y - p0.y) * 0.6;
                                const cp2x = p1.x + 80;
                                const cp2y = p1.y - 80;
                                pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
                            }

                            // Segment 1: Card 0 to Preview 1 S-curve (Left to Right)
                            {
                                const p1 = points[1];
                                const p2 = points[2];
                                const cp1x = p1.x + 200;
                                const cp1y = p1.y + (p2.y - p1.y) * 0.2;
                                const cp2x = p2.x - 200;
                                const cp2y = p2.y - (p2.y - p1.y) * 0.2;
                                pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
                            }

                            // Segment 2: Preview 1 to Card 2 S-curve (Right to Left)
                            {
                                const p2 = points[2];
                                const p3 = points[3];
                                const cp1x = p2.x - 200;
                                const cp1y = p2.y + (p3.y - p2.y) * 0.2;
                                const cp2x = p3.x + 200;
                                const cp2y = p3.y - (p3.y - p2.y) * 0.2;
                                pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p3.x} ${p3.y}`;
                            }

                            // Segment 3: Card 2 to Preview 3 S-curve (Left to Right)
                            {
                                const p3 = points[3];
                                const p4 = points[4];
                                const cp1x = p3.x + 200;
                                const cp1y = p3.y + (p4.y - p3.y) * 0.2;
                                const cp2x = p4.x - 200;
                                const cp2y = p4.y - (p4.y - p3.y) * 0.2;
                                pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p4.x} ${p4.y}`;
                            }

                            // Apply the computed path dynamically
                            basePathRef.current.setAttribute('d', pathD);
                            activePathRef.current.setAttribute('d', pathD);
                            maskPathRef.current.setAttribute('d', pathD);

                            try {
                                const pathLength = basePathRef.current.getTotalLength();
                                const distance = pathLength * flightProgress;

                                // Locate plane coordinates along path
                                const point = basePathRef.current.getPointAtLength(distance);
                                const x = point.x;
                                const y = point.y;

                                // Locate plane rotation angle along path
                                const delta = 1;
                                const checkDist = Math.max(0, Math.min(pathLength, distance + delta));
                                const nextPoint = basePathRef.current.getPointAtLength(checkDist);
                                const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * (180 / Math.PI);

                                // Reveal active trail behind plane
                                maskPathRef.current.style.strokeDasharray = `${pathLength} ${pathLength}`;
                                maskPathRef.current.style.strokeDashoffset = pathLength * (1 - flightProgress);

                                planeRef.current.style.transform = `translate3d(${x - 16}px, ${y - 16}px, 0) rotate(${angle + 90}deg)`;
                                planeRef.current.style.display = 'block';
                            } catch (e) {
                                console.error("SVG serpentine path computation error", e);
                            }
                        }
                    }

                    // --- FIGMA TRANSITION: Exit Layering when Plane animation finishes ---
                    if (exitProgress > 0) {
                        // Softly recede into background (scale to 0.95, fade to 0.35, gentle blur)
                        if (contentWrapperRef.current) {
                            contentWrapperRef.current.style.opacity = Math.max(0.2, 1 - exitProgress * 0.75);
                            contentWrapperRef.current.style.transform = `translate3d(0, ${-exitProgress * 35}px, 0) scale(${1 - exitProgress * 0.04})`;
                            contentWrapperRef.current.style.filter = `blur(${exitProgress * 5}px)`;
                        }
                        // Plane fades out completely
                        if (planeRef.current) {
                            planeRef.current.style.opacity = Math.max(0, 1 - exitProgress / 0.6);
                        }
                        if (svgRef.current) {
                            svgRef.current.style.opacity = Math.max(0.2, 1 - exitProgress * 0.75);
                        }
                    } else {
                        if (contentWrapperRef.current) {
                            contentWrapperRef.current.style.opacity = 1;
                            contentWrapperRef.current.style.transform = 'translate3d(0, 0, 0) scale(1)';
                            contentWrapperRef.current.style.filter = 'blur(0px)';
                        }
                        if (svgRef.current) {
                            svgRef.current.style.opacity = 1;
                        }
                        let planeOpacity = 1;
                        if (featureProgress < 0.02) {
                            planeOpacity = featureProgress / 0.02;
                        }
                        planeRef.current.style.opacity = planeOpacity;
                    }
                }
            });
            }, containerRef);
            return () => ctx.revert();
        });

        return () => mm.revert();
    }, []);

    const handleTabClick = (idx) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const containerStart = rect.top + scrollTop;
        const containerHeight = rect.height;
        const pinRange = containerHeight - window.innerHeight;
        
        const targetProgress = idx === 0 ? 0.15 : idx === 1 ? 0.42 : idx === 2 ? 0.65 : 0.82;
        const targetY = containerStart + pinRange * targetProgress;
        
        window.scrollTo({
            top: targetY,
            behavior: 'smooth'
        });
    };

    const features = [
        {
            title: "Smart Day-by-Day Scheduling",
            tagline: "Maps pin places; ChatGPT writes static lists. TripWise designs functional schedules.",
            desc: "Instead of a simple map pin or a long text response, we map out a realistic daily path optimized for walking distances, peak visiting hours, and logical transit routes.",
            details: [
                "Optimal walking sequence & duration estimates",
                "Crowd density avoidance visit windows"
            ],
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                    <path d="M8 14h.01" />
                    <path d="M12 14h.01" />
                    <path d="M16 14h.01" />
                    <path d="M8 18h.01" />
                    <path d="M12 18h.01" />
                    <path d="M16 18h.01" />
                </svg>
            )
        },
        {
            title: "Local Hidden Gems",
            tagline: "Ditch the tourist traps. Uncover secrets loved by locals.",
            desc: "Powered by hyper-local review parsing and crowd-sourced data, TripWise steers you away from overpriced tourist zones into authentic culinary spots and scenic detours.",
            details: [
                "Verified local-only eateries & views",
                "Detours curated by local reviewers"
            ],
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
            )
        },
        {
            title: "Budget Optimization",
            tagline: "Set a budget limit. We optimize costs and plan details.",
            desc: "Real-time cost estimations based on category caps. We automatically recommend cheaper transport timings, cost-effective stays, and budget-friendly street-food spots.",
            details: [
                "Fare-saving flight & rail shift alerts",
                "Automatic category-cap cost estimates"
            ],
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
            )
        },
        {
            title: "Real-Time Flight & Hotel Integration",
            tagline: "Live status updates and reservations directly in your itinerary.",
            desc: "Seamlessly link your flight status, hotel coordinates, and check-in times. Any delays will automatically trigger schedule re-routing suggestions.",
            details: [
                "Live flight boarding pass status tracking",
                "Automated delay re-routing suggestions"
            ],
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <path d="M22 2L11 13" />
                    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
            )
        }
    ];

    return (
        <section ref={containerRef} className="relative w-full h-[400vh] lg:h-[350vh] bg-[#FFF8F5]">
            <div ref={stickyRef} className="sticky top-0 z-10 w-full h-[100svh] lg:h-screen overflow-hidden flex flex-col lg:flex-row items-center justify-center">
                {/* Background elements */}
                <div className="absolute top-1/4 left-0 w-96 h-96 bg-[#fe7717]/5 rounded-full filter blur-[100px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-brand-teal/5 rounded-full filter blur-[100px] pointer-events-none" />

                {/* SVG Dotted Trails */}
                <svg
                    ref={svgRef}
                    className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none z-30 transition-opacity duration-300"
                    style={{ overflow: 'visible' }}
                >
                    <defs>
                        <mask id="trail-mask" maskUnits="userSpaceOnUse">
                            <path
                                ref={maskPathRef}
                                fill="none"
                                stroke="white"
                                strokeWidth="10"
                                strokeLinecap="round"
                            />
                        </mask>
                    </defs>
                    {/* Light preview dots trail - hidden initially so line only draws behind plane */}
                    <path
                        ref={basePathRef}
                        fill="none"
                        stroke="#fe7717"
                        strokeWidth="2.5"
                        strokeDasharray="6 6"
                        strokeLinecap="round"
                        opacity="0"
                    />
                    {/* Active bright dots revealed behind the plane */}
                    <path
                        ref={activePathRef}
                        fill="none"
                        stroke="#fe7717"
                        strokeWidth="3.5"
                        strokeDasharray="6 6"
                        strokeLinecap="round"
                        mask="url(#trail-mask)"
                        className="drop-shadow-[0_0_4px_rgba(254,119,23,0.6)]"
                    />
                </svg>

                {/* Small Plane Element */}
                <div
                    ref={planeRef}
                    className="hidden lg:block absolute pointer-events-none z-45 transition-opacity duration-300"
                    style={{
                        width: '32px',
                        height: '32px',
                        left: 0,
                        top: 0,
                        transformOrigin: 'center center',
                        display: 'none',
                        opacity: 0,
                    }}
                >
                    <svg viewBox="-20 0 56 78" fill="#fe7717" className="w-8 h-8 drop-shadow-[0_2px_8px_rgba(254,119,23,0.5)]">
                        <path d="M0 34 L8 0 L16 34 L34 44 L34 52 L16 46 L13 64 L21 70 L21 76 L8 70 L-5 76 L-5 70 L3 64 L0 46 L-18 52 L-18 44 Z" />
                    </svg>
                </div>

                <div 
                    ref={contentWrapperRef} 
                    className="max-w-7xl mx-auto px-6 relative z-10 w-full h-full flex flex-col justify-start pt-[75px] sm:pt-[85px] lg:pt-16 pb-4 will-change-transform transition-all"
                >
                    {/* Header Block */}
                    <div className="text-center max-w-3xl mx-auto mb-2 md:mb-3">
                        <div className="inline-block px-4 py-1 bg-[#1C1B1B] backdrop-blur-md rounded-full shadow-md border border-white/20 text-[#fe7717] font-mono text-[10px] md:text-[12px] font-bold tracking-[0.16em] uppercase mb-1">
                            Why TripWise?
                        </div>
                        <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight text-brand-dark mb-0.5 leading-tight">
                            Beyond Map Pins &amp; Standard Prompts
                        </h2>
                    </div>

                    {/* Features Split Grid */}
                    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6 lg:items-center flex-1 min-h-0 w-full">
                        {/* Left Column: Interactive Selector List */}
                        <div 
                            ref={cardsContainerRef}
                            className="lg:col-span-5 flex flex-row lg:flex-col gap-4 lg:gap-1.5 overflow-hidden lg:overflow-visible pb-4 lg:pb-0 w-full order-last lg:order-first [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                        >
                            {features.map((feature, idx) => {
                                const isActive = activeTab === idx;
                                return (
                                    <div
                                        key={idx}
                                        data-idx={idx}
                                        onClick={() => handleTabClick(idx)}
                                        className={`feature-card shrink-0 w-[85vw] sm:w-[350px] lg:w-auto relative overflow-hidden p-4 lg:p-2.5 rounded-2xl lg:rounded-xl cursor-pointer transition-all duration-300 flex items-start gap-4 lg:gap-3 ${
                                            isActive 
                                                ? "bg-white shadow-lg shadow-brand-coral/5 scale-[1.01]" 
                                                : "bg-white/40 lg:bg-transparent hover:bg-white/40 hover:scale-[1.005]"
                                        }`}
                                    >
                                        {/* Perfect rounded left-side indicator border */}
                                        {isActive && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#fe7717]" />
                                        )}
                                        <div className={`feature-icon p-2 rounded-lg shrink-0 transition-colors duration-300 ${
                                            isActive 
                                                ? "bg-[#fe7717] text-white" 
                                                : "bg-[#1C1B1B]/5 text-brand-dark/60"
                                        }`}>
                                            {feature.icon}
                                        </div>
                                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                            <h3 className={`text-sm md:text-base font-bold leading-snug transition-colors duration-300 ${
                                                isActive ? "text-brand-dark" : "text-brand-dark/80"
                                            }`}>
                                                {feature.title}
                                            </h3>
                                            <p className={`text-[9px] md:text-[10px] font-semibold font-mono tracking-wide uppercase transition-colors duration-300 ${
                                                isActive ? "text-[#fe7717]" : "text-brand-teal"
                                            }`}>
                                                {feature.tagline}
                                            </p>
                                            <p className="text-[11px] md:text-xs text-secondary-text leading-normal mt-0.5">
                                                {feature.desc}
                                            </p>

                                            {/* Expanding active sub-details checkmark list */}
                                            <div 
                                                className={`hidden md:block overflow-hidden transition-all duration-300 ease-in-out ${
                                                    isActive ? 'max-h-64 opacity-100 mt-1.5' : 'max-h-0 opacity-0 pointer-events-none'
                                                }`}
                                            >
                                                <div className="flex flex-col gap-1 border-t border-brand-dark/5 pt-1.5 flex-wrap">
                                                    {feature.details.map((detail, dIdx) => (
                                                        <div key={dIdx} className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-mono font-bold text-brand-dark/75">
                                                            <svg className="w-3.5 h-3.5 text-[#fe7717] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            <span>{detail}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Right Column: Live Mock UI Preview */}
                        <div className="preview-outer-container lg:col-span-7 flex items-center justify-center relative w-full flex-1 min-h-[220px] sm:min-h-[240px] md:min-h-[300px] lg:flex-none lg:h-140 rounded-3xl overflow-hidden mt-0 lg:mt-0 mb-2 lg:mb-0 order-first lg:order-last shrink-0 lg:shrink-none">
                            <div className="w-full h-full bg-[#181819] border border-white/[0.06] rounded-3xl p-3 sm:p-5 md:p-7 flex flex-col relative overflow-hidden">
                                
                                {/* Minimal top bar */}
                                <div className="flex items-center justify-between border-b border-white/[0.05] pb-3 md:pb-4 mb-4 md:mb-5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#EC6735]" />
                                        <span className="font-mono text-[10px] text-white/25 tracking-[0.2em] uppercase">TripWise</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-1 h-1 rounded-full bg-white/[0.08]" />
                                        <div className="w-1 h-1 rounded-full bg-white/[0.08]" />
                                        <div className="w-1 h-1 rounded-full bg-white/[0.08]" />
                                    </div>
                                </div>

                                {/* PANEL 1 — Itinerary */}
                                <div className={`flex flex-col flex-1 transition-all duration-500 ease-in-out absolute inset-x-3 sm:inset-x-5 md:inset-x-7 bottom-3 md:bottom-5 top-11 md:top-[3.75rem] ${
                                    activePreviewTab === 0 ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
                                }`}>
                                    {/* Desktop */}
                                    <div className="hidden md:flex flex-col h-full">
                                        <div className="flex items-end justify-between mb-5">
                                            <div>
                                                <p className="font-mono text-[9px] text-[#EC6735] uppercase tracking-[0.2em] mb-2">Day 1 · Rome</p>
                                                <h4 className="text-2xl font-black text-white tracking-tight leading-none">Your Itinerary</h4>
                                            </div>
                                            <span className="text-[10px] font-mono text-white/20 mb-0.5">3 stops · 5.4 km</span>
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                            {[
                                                { time: '09:30', label: 'Colosseum VIP Tour', sub: 'Skip-the-line · Pre-booked', active: true },
                                                { time: '12:45', label: 'Osteria da Fortunata', sub: '12 min walk · Local favourite', active: false },
                                                { time: '15:00', label: 'Pantheon & Piazza Navona', sub: 'Free entry · 20 min transit', active: false },
                                            ].map((stop, i) => (
                                                <div key={i} className="flex gap-3">
                                                    {/* Fixed-width time column */}
                                                    <div className="w-9 shrink-0 pt-[3px]">
                                                        <span className={`font-mono text-[10px] tabular-nums block ${stop.active ? 'text-white/45' : 'text-white/18'}`}>{stop.time}</span>
                                                    </div>
                                                    {/* Rail */}
                                                    <div className="flex flex-col items-center">
                                                        <div className={`rounded-full shrink-0 mt-1.5 ${stop.active ? 'w-2 h-2 bg-[#EC6735]' : 'w-1.5 h-1.5 bg-white/15'}`} />
                                                        {i < 2 && <div className="w-px flex-1 bg-white/[0.06] my-1.5" />}
                                                    </div>
                                                    {/* Content */}
                                                    <div className={`flex-1 ${i < 2 ? 'pb-4' : ''}`}>
                                                        {stop.active ? (
                                                            <div className="border-l border-[#EC6735]/30 pl-3">
                                                                <span className="text-base font-bold text-white leading-tight block">{stop.label}</span>
                                                                <p className="text-[11px] text-white/40 mt-0.5">{stop.sub}</p>
                                                                <span className="text-[9px] font-mono text-[#EC6735]/70 mt-1.5 block tracking-wide">✓ Confirmed</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm font-normal text-white/25 leading-tight block pt-0.5">{stop.label}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="border-t border-white/[0.05] pt-3 flex items-center justify-between">
                                            <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Est. walking</span>
                                            <span className="text-sm font-bold text-white/40 font-mono tabular-nums">14,200 <span className="text-[10px] font-normal text-white/20">steps</span></span>
                                        </div>
                                    </div>
                                    {/* Mobile */}
                                    <div className="flex md:hidden flex-col h-full">
                                        <div className="flex items-baseline justify-between mb-4">
                                            <div>
                                                <p className="font-mono text-[9px] text-[#EC6735] uppercase tracking-[0.18em] mb-0.5">Day 1 · Rome</p>
                                                <span className="text-sm font-semibold text-white">Your Itinerary</span>
                                            </div>
                                            <span className="text-[10px] font-mono text-white/25">3 stops</span>
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                            {[
                                                { time: '09:30', label: 'Colosseum VIP Tour', confirmed: true, active: true },
                                                { time: '12:45', label: 'Osteria da Fortunata', confirmed: false, active: false },
                                            ].map((stop, i) => (
                                                <div key={i} className="flex gap-3">
                                                    <div className="flex flex-col items-center pt-[5px]">
                                                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${stop.active ? 'bg-[#EC6735]' : 'bg-white/20'}`} />
                                                        {i < 1 && <div className="w-px flex-1 bg-white/[0.07] mt-1.5 mb-1" />}
                                                    </div>
                                                    <div className="flex-1 pb-4">
                                                        <div className="flex items-baseline justify-between gap-2">
                                                            <span className={`text-sm font-medium ${stop.active ? 'text-white' : 'text-white/50'}`}>{stop.label}</span>
                                                            <span className="font-mono text-[10px] text-white/25 shrink-0">{stop.time}</span>
                                                        </div>
                                                        {stop.confirmed && <span className="text-[9px] font-mono text-[#EC6735]/70 mt-0.5 block">✓ Confirmed</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* PANEL 2 — Local Gems */}
                                <div className={`flex flex-col flex-1 transition-all duration-500 ease-in-out absolute inset-x-3 sm:inset-x-5 md:inset-x-7 bottom-3 md:bottom-5 top-11 md:top-[3.75rem] ${
                                    activePreviewTab === 1 ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
                                }`}>
                                    {/* Desktop */}
                                    <div className="hidden md:flex flex-col h-full">
                                        <div className="mb-5">
                                            <p className="font-mono text-[9px] text-[#EC6735] uppercase tracking-[0.2em] mb-2">Local Intelligence</p>
                                            <h4 className="text-2xl font-black text-white tracking-tight leading-none">Skip the<br/>Tourist Trap</h4>
                                        </div>
                                        <div className="flex-1 flex flex-col gap-3">
                                            {/* Rejected — entire row ghosted */}
                                            <div className="flex items-start gap-3.5 opacity-20">
                                                <div className="w-1.5 h-1.5 rounded-full bg-white mt-2 shrink-0" />
                                                <div className="flex-1">
                                                    <div className="flex items-baseline justify-between">
                                                        <span className="text-base font-medium text-white line-through">Caffè di Trevi</span>
                                                        <span className="text-[9px] font-mono text-white uppercase tracking-widest">Skip</span>
                                                    </div>
                                                    <p className="text-[11px] text-white mt-0.5">3.2 ★ · Tourist area · Overpriced</p>
                                                </div>
                                            </div>
                                            {/* Recommended — elevated with bg */}
                                            <div className="flex items-start gap-3.5 bg-white/[0.04] rounded-xl p-3.5 -mx-1">
                                                <div className="w-2 h-2 rounded-full bg-[#EC6735] mt-1.5 shrink-0" />
                                                <div className="flex-1">
                                                    <div className="flex items-baseline justify-between mb-2">
                                                        <span className="text-base font-bold text-white">Osteria Romana</span>
                                                        <span className="text-[9px] font-mono text-[#EC6735]/70 uppercase tracking-widest">Pick</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-2xl font-black text-white/70 font-mono leading-none">4.9</span>
                                                        <div>
                                                            <p className="text-[10px] text-white/45">4 min walk · Under €11</p>
                                                            <p className="text-[10px] text-white/25 mt-0.5 italic">Hand-made pasta, house wine</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="border-t border-white/[0.05] pt-3 flex items-center justify-between">
                                            <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Estimated savings</span>
                                            <span className="text-sm font-bold text-white/40">€45 <span className="text-[10px] font-normal text-white/20">· 35 min saved</span></span>
                                        </div>
                                    </div>
                                    {/* Mobile */}
                                    <div className="flex md:hidden flex-col h-full">
                                        <div className="mb-4">
                                            <p className="font-mono text-[9px] text-[#EC6735] uppercase tracking-[0.18em] mb-0.5">Local Intelligence</p>
                                            <span className="text-sm font-semibold text-white">Skip the Tourist Trap</span>
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                            <div className="flex items-start gap-3 py-3 border-b border-white/[0.05]">
                                                <div className="w-1.5 h-1.5 rounded-full bg-white/15 mt-1.5 shrink-0" />
                                                <div>
                                                    <span className="text-sm text-white/25 line-through block">Caffè di Trevi</span>
                                                    <span className="text-[10px] text-white/20 font-mono">3.2 ★ · Overpriced</span>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 py-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#EC6735] mt-1.5 shrink-0" />
                                                <div>
                                                    <span className="text-sm text-white font-medium block">Osteria Romana</span>
                                                    <span className="text-[10px] text-[#EC6735]/65 font-mono">4.9 ★ · Saved €45</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* PANEL 3 — Budget */}
                                <div className={`flex flex-col flex-1 transition-all duration-500 ease-in-out absolute inset-x-3 sm:inset-x-5 md:inset-x-7 bottom-3 md:bottom-5 top-11 md:top-[3.75rem] ${
                                    activePreviewTab === 2 ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
                                }`}>
                                    {/* Desktop */}
                                    <div className="hidden md:flex flex-col h-full">
                                        <div className="mb-4">
                                            <p className="font-mono text-[9px] text-[#EC6735] uppercase tracking-[0.2em] mb-2">Financial Overview</p>
                                            <h4 className="text-2xl font-black text-white tracking-tight leading-none">Budget Breakdown</h4>
                                        </div>
                                        {/* Hero number */}
                                        <div className="flex items-end gap-3 mb-4">
                                            <span className="text-[3rem] font-black text-white tracking-tight leading-none">$1,680</span>
                                            <div className="flex flex-col mb-1.5">
                                                <span className="text-[10px] font-mono text-white/25 leading-none mb-1">of $2,000</span>
                                                <span className="text-[9px] font-mono text-[#EC6735]/70 uppercase tracking-wide">$340 under budget</span>
                                            </div>
                                        </div>
                                        {/* Single segmented bar */}
                                        <div className="w-full h-1.5 rounded-full overflow-hidden flex gap-[2px] mb-5">
                                            <div className="h-full bg-white/45 rounded-l-full" style={{ width: '40%' }} />
                                            <div className="h-full bg-white/25" style={{ width: '26%' }} />
                                            <div className="h-full bg-white/15" style={{ width: '18%' }} />
                                            <div className="flex-1 h-full bg-white/[0.04] rounded-r-full" />
                                        </div>
                                        {/* Category list — no bars, just type */}
                                        <div className="flex-1 flex flex-col">
                                            {[
                                                { name: 'Hotels & Stays', amount: '$800', pct: '48%' },
                                                { name: 'Flights & Transit', amount: '$520', pct: '31%' },
                                                { name: 'Food & Dining', amount: '$360', pct: '21%' },
                                            ].map((item, i) => (
                                                <div key={item.name} className={`flex items-baseline justify-between py-2.5 ${i < 2 ? 'border-b border-white/[0.05]' : ''}`}>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-xs text-white/40">{item.name}</span>
                                                        <span className="text-[9px] font-mono text-white/20">{item.pct}</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-white/50 font-mono tabular-nums">{item.amount}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="border-t border-white/[0.05] pt-3">
                                            <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">Insight</p>
                                            <p className="text-xs text-white/40 leading-relaxed">
                                                Rome → Florence train shift saves <span className="text-[#EC6735] font-semibold">$55</span>. Apply?
                                            </p>
                                        </div>
                                    </div>
                                    {/* Mobile */}
                                    <div className="flex md:hidden flex-col h-full">
                                        <div className="mb-4">
                                            <p className="font-mono text-[9px] text-[#EC6735] uppercase tracking-[0.18em] mb-0.5">Financial Overview</p>
                                            <div className="flex items-end gap-2">
                                                <span className="text-2xl font-black text-white tracking-tight leading-none">$1,680</span>
                                                <span className="text-white/20 font-mono text-xs mb-0.5">/ $2,000</span>
                                            </div>
                                        </div>
                                        <div className="flex-1 flex flex-col gap-4">
                                            {[
                                                { name: 'Hotels', pct: 85 },
                                                { name: 'Flights', pct: 90 },
                                                { name: 'Food', pct: 72 },
                                            ].map((item) => (
                                                <div key={item.name}>
                                                    <div className="flex justify-between mb-1.5">
                                                        <span className="text-[11px] text-white/40">{item.name}</span>
                                                        <span className="text-[11px] font-mono text-white/25">{item.pct}%</span>
                                                    </div>
                                                    <div className="w-full h-px bg-white/[0.07]">
                                                        <div className="h-full bg-white/30" style={{ width: `${item.pct}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                            <p className="text-[10px] text-white/25 font-mono pt-2 border-t border-white/[0.05]">
                                                Train shift saves <span className="text-[#EC6735]">$55</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* PANEL 4 — Bookings */}
                                <div className={`flex flex-col flex-1 transition-all duration-500 ease-in-out absolute inset-x-3 sm:inset-x-5 md:inset-x-7 bottom-3 md:bottom-5 top-11 md:top-[3.75rem] ${
                                    activePreviewTab === 3 ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
                                }`}>
                                    {/* Desktop */}
                                    <div className="hidden md:flex flex-col h-full">
                                        <div className="mb-6">
                                            <p className="font-mono text-[9px] text-[#EC6735] uppercase tracking-[0.2em] mb-2">Live Sync</p>
                                            <h4 className="text-2xl font-black text-white tracking-tight leading-none">Booking Vouchers</h4>
                                        </div>
                                        <div className="flex-1 flex flex-col gap-2.5">
                                            {/* Flight */}
                                            <div className="border border-white/[0.07] rounded-2xl overflow-hidden">
                                                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.05]">
                                                    <span className="font-mono text-[9px] text-white/30 uppercase tracking-[0.15em]">Flight · AZ-405</span>
                                                    <span className="flex items-center gap-1.5 text-[9px] font-mono text-white/35">
                                                        <span className="w-1 h-1 rounded-full bg-white/30 animate-pulse" />
                                                        On Time
                                                    </span>
                                                </div>
                                                <div className="px-4 py-4 flex items-center justify-between gap-4">
                                                    <div>
                                                        <p className="text-2xl font-black text-white leading-none tracking-tight">JFK</p>
                                                        <p className="text-[10px] text-white/30 mt-1 font-mono">New York</p>
                                                    </div>
                                                    <div className="flex-1 flex flex-col items-center gap-1">
                                                        <div className="w-full h-px" style={{ backgroundImage: 'repeating-linear-gradient(to right, rgba(255,255,255,0.1) 0, rgba(255,255,255,0.1) 4px, transparent 4px, transparent 8px)' }} />
                                                        <span className="text-[#EC6735] text-xs">✈</span>
                                                        <span className="text-[9px] text-white/20 font-mono">8h 45m</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-black text-white leading-none tracking-tight">FCO</p>
                                                        <p className="text-[10px] text-white/30 mt-1 font-mono">Rome</p>
                                                    </div>
                                                </div>
                                                <div className="border-t border-dashed border-white/[0.05] px-4 py-3 flex items-center justify-between">
                                                    <div className="flex gap-6">
                                                        <div>
                                                            <p className="text-[9px] text-white/20 font-mono">Gate</p>
                                                            <p className="text-sm font-semibold text-white font-mono">G12</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] text-white/20 font-mono">Seat</p>
                                                            <p className="text-sm font-semibold text-[#EC6735] font-mono">14A</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[9px] text-white/20 font-mono">Departs</p>
                                                        <p className="text-sm font-semibold text-white font-mono">09:15</p>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Hotel */}
                                            <div className="flex items-center justify-between px-4 py-3.5 border border-white/[0.07] rounded-2xl">
                                                <div>
                                                    <p className="text-sm font-medium text-white">Hotel Quirinale</p>
                                                    <p className="text-[11px] text-white/30 mt-0.5">Check-in today · 14:00</p>
                                                </div>
                                                <span className="text-[9px] font-mono text-white/25">Confirmed</span>
                                            </div>
                                        </div>
                                        <div className="border-t border-white/[0.05] pt-3.5 mt-1">
                                            <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">4 bookings synced</p>
                                        </div>
                                    </div>
                                    {/* Mobile */}
                                    <div className="flex md:hidden flex-col h-full">
                                        <div className="mb-4">
                                            <p className="font-mono text-[9px] text-[#EC6735] uppercase tracking-[0.18em] mb-0.5">Live Sync</p>
                                            <span className="text-sm font-semibold text-white">Booking Vouchers</span>
                                        </div>
                                        <div className="flex-1 flex flex-col gap-2.5">
                                            <div className="border border-white/[0.07] rounded-xl p-3">
                                                <div className="flex items-center justify-between mb-2.5">
                                                    <span className="font-mono text-[9px] text-white/25">AZ-405</span>
                                                    <span className="text-[9px] font-mono text-white/25">On Time</span>
                                                </div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xl font-black text-white tracking-tight">JFK</span>
                                                    <span className="text-[#EC6735] text-xs">✈</span>
                                                    <span className="text-xl font-black text-white tracking-tight">FCO</span>
                                                </div>
                                                <p className="text-[9px] font-mono text-white/25">Gate G12 · Seat <span className="text-[#EC6735]">14A</span> · 09:15</p>
                                            </div>
                                            <div className="flex items-center justify-between px-3 py-2.5 border border-white/[0.07] rounded-xl">
                                                <div>
                                                    <p className="text-sm font-medium text-white">Hotel Quirinale</p>
                                                    <p className="text-[10px] text-white/30">Check-in 14:00</p>
                                                </div>
                                                <span className="text-[9px] font-mono text-white/30">Confirmed</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default FeaturesSelection;