'use client';

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Fallback-safe Avatar Component with vibrant initials badge
const CardAvatar = ({ src, initials, name }) => {
    const [imgError, setImgError] = useState(false);
    return (
        <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-md bg-gradient-to-br from-[#0D9488] via-[#14b8a6] to-[#FF5B1D] flex items-center justify-center text-white font-mono font-bold text-sm group-hover:scale-105 transition-transform duration-300">
            {!imgError ? (
                <img
                    src={src}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                />
            ) : (
                <span>{initials}</span>
            )}
        </div>
    );
};

// Circular Passport Stamp SVG Graphic
const PassportStamp = ({ stampText = "APPROVED", stampCode = "VERIFIED", color = "#0D9488" }) => (
    <div
        className="passport-stamp absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40 flex items-center justify-center select-none opacity-0"
        style={{ color, transform: 'rotate(-15deg) scale(2)' }}
    >
        <svg className="w-44 h-44 md:w-52 md:h-52 drop-shadow-md" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer rubber stamp ring with authentic distressed/uneven pattern */}
            <circle cx="80" cy="80" r="74" stroke="currentColor" strokeWidth="3.5" strokeDasharray="14 4 4 4 8 3 12 5" />
            <circle cx="80" cy="80" r="66" stroke="currentColor" strokeWidth="1.5" />

            {/* Inner decorative star dots */}
            <circle cx="80" cy="80" r="50" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 6" />

            {/* Center Banner */}
            <rect x="14" y="56" width="132" height="48" stroke="currentColor" strokeWidth="2.5" fill="white" fillOpacity="0.25" />
            <line x1="18" y1="62" x2="142" y2="62" stroke="currentColor" strokeWidth="1" />
            <line x1="18" y1="98" x2="142" y2="98" stroke="currentColor" strokeWidth="1" />

            {/* Center Main Text */}
            <text x="80" y="81" textAnchor="middle" fill="currentColor" fontFamily="monospace" fontWeight="900" fontSize="15" letterSpacing="1.5">
                {stampText}
            </text>
            <text x="80" y="93" textAnchor="middle" fill="currentColor" fontFamily="monospace" fontWeight="800" fontSize="9" letterSpacing="3">
                {stampCode}
            </text>

            {/* Top Curved Text */}
            <path id="stampTopArc" d="M 25,80 A 55,55 0 0,1 135,80" fill="none" />
            <text fill="currentColor" fontFamily="monospace" fontWeight="800" fontSize="9" letterSpacing="3">
                <textPath href="#stampTopArc" startOffset="50%" textAnchor="middle">
                    ★ TRIPWISE AI VERIFIED ★
                </textPath>
            </text>

            {/* Bottom Curved Text */}
            <path id="stampBottomArc" d="M 135,80 A 55,55 0 0,1 25,80" fill="none" />
            <text fill="currentColor" fontFamily="monospace" fontWeight="800" fontSize="9" letterSpacing="3">
                <textPath href="#stampBottomArc" startOffset="50%" textAnchor="middle">
                    INSTANT ROUTING • 2026
                </textPath>
            </text>
        </svg>
    </div>
);

export default function PassportGrid() {
    const sectionRef = useRef(null);
    const stickyRef = useRef(null);
    const conveyorRef = useRef(null);
    const expandedRef = useRef({});

    const cardsData = [
        {
            id: 1,
            name: "Sophia & Marcus Vance",
            handle: "@vance_travels • Verified Travelers",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            initials: "SV",
            route: "JFK ➔ FCO",
            routeLabel: "NYC to Rome",
            classCode: "AI-FIRST",
            seat: "01A",
            hoursSaved: "24.5",
            quote: "We used to spend at least 3 weeks with 40+ browser tabs open across Google Maps, Reddit threads, and travel blogs trying to coordinate our Amalfi Coast itinerary. TripWise built an optimized 10-day route with train timings and hotel clusters in literally 40 seconds.",
            tripTag: "10-Day Italy & Amalfi Coast • Generated in 42s",
            stampText: "ROMA • FCO",
            stampCode: "APPROVED",
            stampColor: "#0D9488", // Brand Teal
        },
        {
            id: 2,
            name: "Liam O'Connor",
            handle: "@liam_wanders • Tech Nomad",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
            initials: "LO",
            route: "SFO ➔ NRT",
            routeLabel: "SF to Tokyo",
            classCode: "AI-SELECT",
            seat: "14K",
            hoursSaved: "16.0",
            quote: "Figuring out Tokyo neighborhood logistics and transit passes used to take me days. TripWise mapped my hotels to subway lines instantly, avoiding rush hour crowds completely.",
            tripTag: "7-Day Tokyo Express • Generated in 18s",
            stampText: "TOKYO • NRT",
            stampCode: "VERIFIED",
            stampColor: "#FF5B1D", // Brand Orange
        },
        {
            id: 3,
            name: "Elena Rostova",
            handle: "@elena_arch • Architecture Lover",
            avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
            initials: "ER",
            route: "LHR ➔ BCN",
            routeLabel: "London to Barcelona",
            classCode: "AI-SELECT",
            seat: "08F",
            hoursSaved: "12.5",
            quote: "I needed an itinerary focused purely on Gaudí architecture and optimal lighting hours for photography. TripWise custom-tailored the exact route I needed without any generic tourist trap fluff.",
            tripTag: "5-Day Barcelona Arts • Generated in 25s",
            stampText: "ESPAÑA • BCN",
            stampCode: "APPROVED",
            stampColor: "#2563EB", // Royal Blue
        },
        {
            id: 4,
            name: "David & Sarah Jenkins",
            handle: "@jenkins_family • Family Adventures",
            avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
            initials: "DJ",
            route: "ORD ➔ ZRH",
            routeLabel: "Chicago to Zurich",
            classCode: "AI-FIRST",
            seat: "02C",
            hoursSaved: "32.0",
            quote: "Planning a multi-city Swiss Alps train trip for a family of four with two toddlers seemed impossible. TripWise calculated scenic train transfers, stroller-friendly paths, and nap-time windows automatically.",
            tripTag: "12-Day Swiss Alps Rail Trip • Generated in 55s",
            stampText: "SUISSE • ZRH",
            stampCode: "VERIFIED",
            stampColor: "#059669", // Emerald Green
        },
        {
            id: 5,
            name: "Aisha Patel",
            handle: "@aisha_luxe • Solo Explorer",
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
            initials: "AP",
            route: "DXB ➔ DPS",
            routeLabel: "Dubai to Bali",
            classCode: "AI-FIRST",
            seat: "04A",
            hoursSaved: "21.0",
            quote: "I wanted a balance of Ubud yoga retreats and Uluwatu beach clubs without spending hours cross-referencing traffic times in Bali. TripWise organized my days geographically so I never spent more than 30 minutes in a taxi.",
            tripTag: "14-Day Bali Escape • Generated in 38s",
            stampText: "BALI • DPS",
            stampCode: "APPROVED",
            stampColor: "#9333EA", // Purple
        },
        {
            id: 6,
            name: "Carlos & Elena M.",
            handle: "@carlos_m • Foodie Travelers",
            avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
            initials: "CM",
            route: "MIA ➔ CDG",
            routeLabel: "Miami to Paris",
            classCode: "AI-SELECT",
            seat: "12B",
            hoursSaved: "19.5",
            quote: "Finding Michelin bib-gourmand bistros close to museum reservations used to be a full-time job. TripWise synced dining with sightseeing flawlessly, giving us walkable gourmet routes.",
            tripTag: "6-Day Paris Culinary • Generated in 22s",
            stampText: "PARIS • CDG",
            stampCode: "VERIFIED",
            stampColor: "#E11D48", // Rose Red
        }
    ];

    useEffect(() => {
        if (!sectionRef.current || !stickyRef.current || !conveyorRef.current) return;
        gsap.registerPlugin(ScrollTrigger);

        const ctx = gsap.context(() => {
            const conveyorEl = conveyorRef.current;
            const cards = conveyorEl.querySelectorAll(".luggage-tag-card");

            // Calculate total translation distance so every card passes smoothly through center stage
            const getScrollDistance = () => {
                const totalWidth = conveyorEl.scrollWidth;
                const viewportWidth = window.innerWidth;
                return Math.max(1200, totalWidth - viewportWidth);
            };

            let totalScrollDistance = getScrollDistance();

            ScrollTrigger.create({
                trigger: sectionRef.current,
                pin: stickyRef.current,
                start: "top top",
                end: "+=2400px", // Generous scrolling runway for 6 cards
                scrub: 1, // Smooth conveyor belt scrubbing
                invalidateOnRefresh: true,
                onRefresh: () => {
                    totalScrollDistance = getScrollDistance();
                },
                onUpdate: (self) => {
                    const progress = self.progress;

                    // 1. Translate conveyor belt horizontally from right to left
                    const currentX = -progress * totalScrollDistance;
                    gsap.set(conveyorEl, { x: currentX });

                    // 2. Center Stage Scanner Logic: Check each card's distance from viewport center!
                    const viewportCenter = window.innerWidth / 2;

                    cards.forEach((cardEl, idx) => {
                        const rect = cardEl.getBoundingClientRect();
                        const cardCenter = rect.left + rect.width / 2;
                        const dist = Math.abs(cardCenter - viewportCenter);

                        // If card is within 220px of center stage, expand it into Boarding Pass!
                        const isCenter = dist < 220;
                        const wasExpanded = expandedRef.current[idx];

                        if (isCenter && !wasExpanded) {
                            expandedRef.current[idx] = true;

                            // Elevate & scale card container
                            gsap.to(cardEl, { scale: 1.06, duration: 0.5, ease: "back.out(1.4)", overwrite: "auto", zIndex: 50 });

                            // Hide dark minimal Luggage Tag state
                            gsap.to(cardEl.querySelector(".tag-state"), {
                                opacity: 0, scale: 0.9, duration: 0.35, pointerEvents: "none", overwrite: "auto"
                            });

                            // Reveal & expand bright Boarding Pass state
                            gsap.to(cardEl.querySelector(".pass-state"), {
                                opacity: 1, scale: 1, duration: 0.45, pointerEvents: "auto", overwrite: "auto"
                            });

                            // Slam down colored ink passport stamp!
                            const stamp = cardEl.querySelector(".passport-stamp");
                            if (stamp) {
                                gsap.fromTo(stamp,
                                    { scale: 2.8, opacity: 0, rotation: -35 },
                                    { scale: 1, opacity: 0.22, rotation: -15, duration: 0.7, delay: 0.15, ease: "elastic.out(1, 0.35)", overwrite: "auto" }
                                );
                            }
                        } else if (!isCenter && wasExpanded) {
                            expandedRef.current[idx] = false;

                            // Return to normal scale & z-index
                            gsap.to(cardEl, { scale: 1, duration: 0.45, ease: "power2.out", overwrite: "auto", zIndex: 20 });

                            // Reveal dark minimal Luggage Tag state
                            gsap.to(cardEl.querySelector(".tag-state"), {
                                opacity: 1, scale: 1, duration: 0.4, pointerEvents: "auto", overwrite: "auto"
                            });

                            // Hide Boarding Pass state
                            gsap.to(cardEl.querySelector(".pass-state"), {
                                opacity: 0, scale: 0.95, duration: 0.3, pointerEvents: "none", overwrite: "auto"
                            });

                            // Hide stamp
                            const stamp = cardEl.querySelector(".passport-stamp");
                            if (stamp) {
                                gsap.to(stamp, { opacity: 0, scale: 2, duration: 0.3, overwrite: "auto" });
                            }
                        }
                    });
                }
            });
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="bg-[#FFF8F5] relative overflow-hidden border-t border-brand-dark/5">
            {/* Pinned Sticky Viewport Container */}
            <div ref={stickyRef} className="h-screen w-full flex flex-col justify-between py-12 md:py-16 relative overflow-hidden select-none">
                
                {/* Ambient background glow decoration */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 -translate-y-1/2 w-96 h-96 rounded-full bg-[#0D9488]/5 blur-[140px]" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[#FF5B1D]/5 blur-[140px]" />
                </div>

                {/* Top Section Header */}
                <div className="text-center px-4 max-w-3xl mx-auto flex flex-col items-center relative z-30 shrink-0">
                    {/* Micro-Badge */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#0D9488]/10 text-[#0D9488] rounded-full font-mono text-[10px] font-black tracking-widest uppercase mb-3 shadow-2xs border border-[#0D9488]/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] animate-pulse" />
                        Live Baggage Claim • Verified Reviews
                    </div>

                    {/* Section Title */}
                    <h2 className="text-3xl md:text-5xl font-bold text-brand-dark tracking-tight leading-none font-serif uppercase">
                        Trusted by <span className="relative inline-block text-[#0D9488] normal-case font-serif italic font-bold">
                            Modern Travelers
                            <svg className="absolute -bottom-1.5 left-0 w-full h-1.5 text-[#0D9488]/40" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0,5 C30,9 70,2 100,6" stroke="currentColor" strokeWidth="8" strokeLinecap="round" fill="none" />
                            </svg>
                        </span>
                    </h2>

                    {/* Subtitle */}
                    <p className="text-sm md:text-base text-brand-dark/60 max-w-xl mt-3 tracking-wide leading-relaxed">
                        See how TripWise is eliminating hours of open-tab research worldwide. Scroll down to inspect luggage tags on the conveyor belt.
                    </p>
                </div>

                {/* Center Conveyor Belt Track Line (.carousel-track) */}
                <div className="carousel-track absolute top-1/2 left-0 right-0 -translate-y-1/2 h-24 bg-gradient-to-r from-transparent via-[#1C1B1B]/5 to-transparent border-t border-b border-[#0D9488]/20 pointer-events-none z-10 flex items-center justify-between overflow-hidden">
                    {/* Animated conveyor belt markings / rails */}
                    <div className="w-full flex items-center justify-between px-4 opacity-40">
                        {Array.from({ length: 50 }).map((_, i) => (
                            <div key={i} className="flex flex-col items-center gap-1.5">
                                <div className="w-1 h-3 bg-[#0D9488]/60 rounded-full" />
                                <div className="w-1.5 h-1.5 rounded-full bg-[#FF5B1D]/50" />
                                <div className="w-1 h-3 bg-[#0D9488]/60 rounded-full" />
                            </div>
                        ))}
                    </div>

                    {/* Center Stage Scanner Indicator Marker */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-80 bg-gradient-to-r from-transparent via-[#0D9488]/15 to-transparent border-x border-[#0D9488]/30 flex flex-col items-center justify-between py-1">
                        <span className="text-[9px] font-mono tracking-widest text-[#0D9488] font-bold uppercase bg-[#FFF8F5] px-2.5 py-0.5 rounded-full border border-[#0D9488]/30 shadow-2xs">
                            ▼ SCANNER STAGE ▼
                        </span>
                        <span className="text-[9px] font-mono tracking-widest text-[#0D9488] font-bold uppercase bg-[#FFF8F5] px-2.5 py-0.5 rounded-full border border-[#0D9488]/30 shadow-2xs">
                            ▲ SCANNER STAGE ▲
                        </span>
                    </div>
                </div>

                {/* Moving Horizontal Conveyor Belt Container (.conveyor-row) */}
                <div className="relative flex-1 w-full flex items-center z-20 overflow-visible">
                    <div
                        ref={conveyorRef}
                        className="conveyor-row absolute left-0 flex items-center gap-16 sm:gap-24 md:gap-32 pl-[60vw] pr-[50vw] will-change-transform"
                    >
                        {cardsData.map((card) => (
                            <div
                                key={card.id}
                                className="luggage-tag-card relative shrink-0 transition-all duration-500 will-change-transform"
                                style={{ width: '400px', height: '440px' }}
                            >
                                {/* Layer 1: Minimal Dark Glassmorphism Luggage Tag (.tag-state) */}
                                <div className="tag-state absolute inset-0 bg-[#1C1B1B]/95 backdrop-blur-md border-2 border-white/20 rounded-3xl p-6 flex flex-col justify-between text-white shadow-2xl z-20 transition-all duration-500 group">
                                    {/* Top Luggage Strap / Loop Icon */}
                                    <div className="w-16 h-5 bg-[#333030] rounded-full mx-auto -mt-10 mb-2 border border-white/30 shadow-lg flex items-center justify-center shrink-0">
                                        <div className="w-6 h-2 bg-[#1C1B1B] rounded-full border border-white/10" />
                                    </div>

                                    {/* Top Header: Avatar + User Info */}
                                    <div className="flex items-center gap-3.5 border-b border-white/10 pb-4">
                                        <CardAvatar src={card.avatar} initials={card.initials} name={card.name} />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-white text-base leading-snug truncate">{card.name}</span>
                                                <span className="w-4 h-4 rounded-full bg-[#0D9488] text-white flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                                            </div>
                                            <span className="text-xs text-white/60 block font-mono mt-0.5 truncate">{card.handle}</span>
                                        </div>
                                    </div>

                                    {/* Center: Large Sleek Luggage Tag Typography */}
                                    <div className="my-auto py-4 text-center">
                                        <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-[10px] font-mono uppercase tracking-widest text-[#0D9488] font-black mb-3 border border-white/10">
                                            LUGGAGE TAG #{card.id < 10 ? `0${card.id}` : card.id}
                                        </div>
                                        <div className="text-3xl font-mono font-black tracking-tight text-white flex items-center justify-center gap-2 mb-2">
                                            <span>{card.route.split(" ➔ ")[0]}</span>
                                            <span className="text-[#FF5B1D]">➔</span>
                                            <span>{card.route.split(" ➔ ")[1]}</span>
                                        </div>
                                        <span className="text-xs font-mono text-white/70 uppercase block tracking-wider">
                                            {card.routeLabel}
                                        </span>
                                        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center gap-2">
                                            <span className="text-xs font-mono text-[#0D9488] font-bold">HOURS SAVED:</span>
                                            <span className="text-xl font-mono font-black text-[#FF5B1D]">{card.hoursSaved} HRS</span>
                                        </div>
                                    </div>

                                    {/* Footer: Barcode + Status */}
                                    <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-white/60">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-pulse shrink-0" />
                                            <span>IN TRANSIT TO SCANNER</span>
                                        </div>
                                        <span className="tracking-widest">TW-{card.id}982</span>
                                    </div>
                                </div>

                                {/* Layer 2: Full Expanded Boarding Pass Layout (.pass-state) */}
                                <div className="pass-state absolute inset-0 bg-white/98 backdrop-blur-md border-2 border-[#0D9488]/60 rounded-3xl p-6 flex flex-col justify-between text-brand-dark shadow-[0_25px_60px_rgba(13,148,136,0.25)] opacity-0 pointer-events-none scale-95 z-30 transition-all duration-500 overflow-hidden">
                                    
                                    {/* Passport Stamp Overlay */}
                                    <PassportStamp stampText={card.stampText} stampCode={card.stampCode} color={card.stampColor} />

                                    {/* Top Header: User info + Route Badge */}
                                    <div className="flex items-center justify-between gap-3 border-b border-[#4B4745]/15 pb-3.5 relative z-10">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <CardAvatar src={card.avatar} initials={card.initials} name={card.name} />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-bold text-[#1C1B1B] text-base leading-snug truncate">{card.name}</span>
                                                    <span className="w-4 h-4 rounded-full bg-[#0D9488] text-white flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                                                </div>
                                                <span className="text-xs text-[#4B4745]/80 block font-mono mt-0.5 truncate">{card.handle}</span>
                                            </div>
                                        </div>

                                        <div className="shrink-0 px-2.5 py-1 rounded-full bg-[#0D9488]/10 border border-[#0D9488]/25 font-mono text-xs font-bold text-[#0D9488] shadow-2xs">
                                            {card.route}
                                        </div>
                                    </div>

                                    {/* Testimonial Quote */}
                                    <p className="text-[#1C1B1B]/90 text-sm leading-relaxed font-sans italic my-auto relative pl-3 py-2 z-10">
                                        <span className="text-[#FF5B1D] font-serif text-3xl leading-none absolute -left-1 -top-0 select-none opacity-50">“</span>
                                        {card.quote}
                                    </p>

                                    {/* Ticket Stub Cutout Divider */}
                                    <div className="relative h-px w-full bg-transparent my-2 shrink-0 z-10">
                                        <div className="absolute inset-x-0 -top-px border-t-2 border-dashed border-[#4B4745]/25" />
                                        <div className="absolute -left-8 -top-3 w-6 h-6 rounded-full bg-[#FFF8F5] border-r border-[#4B4745]/20 shadow-inner" />
                                        <div className="absolute -right-8 -top-3 w-6 h-6 rounded-full bg-[#FFF8F5] border-l border-[#4B4745]/20 shadow-inner" />
                                    </div>

                                    {/* Ticket Stub Footer: Data Label & Barcode */}
                                    <div className="bg-[#FF5B1D]/5 p-3.5 rounded-xl flex items-center justify-between relative z-10 shrink-0">
                                        <div>
                                            <span className="text-[9px] font-mono uppercase tracking-widest text-[#4B4745] font-bold block">
                                                HOURS SAVED
                                            </span>
                                            <div className="text-2xl font-mono font-black text-[#FF5B1D] leading-none mt-0.5">
                                                {card.hoursSaved} HRS
                                            </div>
                                            <span className="text-[9px] font-mono text-[#1C1B1B]/70 font-semibold block mt-0.5">
                                                {card.tripTag}
                                            </span>
                                        </div>

                                        {/* Barcode */}
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-[2px] opacity-75">
                                                {[2, 1, 3, 1, 2, 3, 1, 2, 1, 3, 2, 1, 2, 3, 1, 2].map((w, i) => (
                                                    <div key={i} className="h-6 bg-[#1C1B1B] rounded-3xs" style={{ width: `${w}px` }} />
                                                ))}
                                            </div>
                                            <span className="text-[8px] font-mono tracking-widest text-[#4B4745]/80 mt-1 uppercase">
                                                TW-{card.id}982-AI
                                            </span>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Scroll Hint */}
                <div className="text-center relative z-30 shrink-0">
                    <span className="text-xs font-mono text-brand-dark/50 uppercase tracking-widest flex items-center justify-center gap-2">
                        <span>←</span> Scroll Down to Inspect Conveyor Belt <span>→</span>
                    </span>
                </div>

            </div>
        </section>
    );
}
