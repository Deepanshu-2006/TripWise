'use client';

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Fallback-safe Avatar Component with vibrant initials badge
const CardAvatar = ({ src, initials, name }) => {
    const [imgError, setImgError] = useState(false);
    return (
        <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-md bg-linear-to-br from-[#0D9488] via-[#14b8a6] to-[#FF5B1D] flex items-center justify-center text-white font-mono font-bold text-sm group-hover:scale-105 transition-transform duration-300">
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
        className="passport-stamp absolute top-1/2 left-1/2 sm:left-3/5 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 flex items-center justify-center select-none opacity-0 transition-opacity duration-300 group-hover:opacity-25"
        style={{ color, transform: 'rotate(-15deg) scale(2)' }}
    >
        <svg className="w-44 h-44 md:w-52 md:h-52 drop-shadow-sm" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer rubber stamp ring with authentic distressed/uneven pattern */}
            <circle cx="80" cy="80" r="74" stroke="currentColor" strokeWidth="3.5" strokeDasharray="14 4 4 4 8 3 12 5" />
            <circle cx="80" cy="80" r="66" stroke="currentColor" strokeWidth="1.5" />

            {/* Inner decorative star dots */}
            <circle cx="80" cy="80" r="50" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 6" />

            {/* Center Banner */}
            <rect x="14" y="56" width="132" height="48" stroke="currentColor" strokeWidth="2.5" fill="white" fillOpacity="0.2" />
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
            quote: "We used to spend at least 3 weeks with 40+ browser tabs open across Google Maps, Reddit threads, and travel blogs trying to coordinate our Amalfi Coast itinerary. TripWise built an optimized 10-day route with train timings and hotel clusters in literally 40 seconds. It completely eliminated our pre-trip stress.",
            tripTag: "10-Day Italy & Amalfi Coast • Generated in 42s",
            stampText: "ROMA • FCO",
            stampCode: "APPROVED",
            stampColor: "#0D9488", // Brand Teal
            colSpanClass: "col-span-1 md:col-span-2 lg:col-span-2",
            layout: "horizontal", // Horizontal boarding pass
            splitCol: "left", // Left column split target
            rowClass: "row-1" // Row 1 item
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
            quote: "Figuring out Tokyo neighborhood logistics and transit passes used to take me days. TripWise mapped my hotels to subway lines instantly.",
            tripTag: "7-Day Tokyo Express • Generated in 18s",
            stampText: "TOKYO • NRT",
            stampCode: "VERIFIED",
            stampColor: "#FF5B1D", // Brand Orange
            colSpanClass: "col-span-1 md:col-span-1 lg:col-span-1",
            layout: "vertical", // Vertical boarding pass for 1-column fit
            splitCol: "right", // Right column split target
            rowClass: "row-1" // Row 1 item
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
            quote: "I needed an itinerary focused purely on Gaudí architecture and optimal lighting hours for photography. TripWise custom-tailored the exact route I needed without any fluff.",
            tripTag: "5-Day Barcelona Arts • Generated in 25s",
            stampText: "ESPAÑA • BCN",
            stampCode: "APPROVED",
            stampColor: "#2563EB", // Royal Blue
            colSpanClass: "col-span-1 md:col-span-1 lg:col-span-1",
            layout: "vertical",
            splitCol: "left",
            rowClass: "row-2" // Row 2 item
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
            quote: "Planning a multi-city Swiss Alps train trip for a family of four with two toddlers seemed impossible. TripWise calculated scenic train transfers, stroller-friendly paths, and nap-time windows automatically. We saved an entire weekend of frustrating research.",
            tripTag: "12-Day Swiss Alps Rail Trip • Generated in 55s",
            stampText: "SUISSE • ZRH",
            stampCode: "VERIFIED",
            stampColor: "#059669", // Emerald Green
            colSpanClass: "col-span-1 md:col-span-2 lg:col-span-2",
            layout: "horizontal",
            splitCol: "right",
            rowClass: "row-2" // Row 2 item
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
            colSpanClass: "col-span-1 md:col-span-2 lg:col-span-2",
            layout: "horizontal",
            splitCol: "left",
            rowClass: "row-3" // Row 3 item
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
            quote: "Finding Michelin bib-gourmand bistros close to museum reservations used to be a full-time job. TripWise synced dining with sightseeing flawlessly.",
            tripTag: "6-Day Paris Culinary • Generated in 22s",
            stampText: "PARIS • CDG",
            stampCode: "VERIFIED",
            stampColor: "#E11D48", // Rose Red
            colSpanClass: "col-span-1 md:col-span-1 lg:col-span-1",
            layout: "vertical",
            splitCol: "right",
            rowClass: "row-3" // Row 3 item
        }
    ];

    useEffect(() => {
        if (!sectionRef.current) return;
        gsap.registerPlugin(ScrollTrigger);

        const ctx = gsap.context(() => {
            // Initial states for ScrollTrigger reveal
            gsap.set(".boarding-pass", { y: 60, opacity: 0, scale: 0.95 });
            gsap.set(".passport-stamp", { scale: 2.5, opacity: 0, rotation: -25 });

            // 1. ScrollTrigger batch timeline to stagger card entries as they scroll into view
            ScrollTrigger.batch(".boarding-pass", {
                start: "top 85%",
                onEnter: (batch) => {
                    batch.forEach((card, i) => {
                        const stamp = card.querySelector(".passport-stamp");

                        gsap.fromTo(card,
                            { y: 60, opacity: 0, scale: 0.95 },
                            {
                                y: 0,
                                opacity: 1,
                                scale: 1,
                                duration: 0.75,
                                ease: "power3.out",
                                delay: i * 0.12,
                                onComplete: () => {
                                    if (stamp) {
                                        // High-energy spring scale animation simulating a passport stamp Slam
                                        gsap.fromTo(stamp,
                                            { scale: 2.5, opacity: 0, rotation: -25 },
                                            {
                                                scale: 1,
                                                opacity: 0.18,
                                                rotation: -15,
                                                duration: 0.9,
                                                ease: "elastic.out(1, 0.35)",
                                                onStart: () => {
                                                    // Subtle physical impact recoil on the card when stamped
                                                    gsap.fromTo(card,
                                                        { scale: 1 },
                                                        {
                                                            scale: 0.985,
                                                            duration: 0.08,
                                                            yoyo: true,
                                                            repeat: 1,
                                                            ease: "power2.inOut"
                                                        }
                                                    );
                                                }
                                            }
                                        );
                                    }
                                }
                            }
                        );
                    });
                },
                once: true
            });

            // 2. Natural Row-by-Row Split-Apart on Scroll (No Pinning, Natural Scrolling!)
            // As the user scrolls down, they see Row 1 -> as they scroll past it, Row 1 splits apart.
            // As they continue scrolling, they naturally see Row 2 -> as they scroll past it, Row 2 splits apart.
            // As they continue scrolling, they naturally see Row 3 -> as they scroll past it, Row 3 splits apart.
            [1, 2, 3].forEach((rowNum) => {
                const rowSelector = `.row-${rowNum}`;
                
                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: rowSelector,
                        start: "top 35%",
                        end: "bottom 5%",
                        scrub: 0.5,
                    }
                });

                tl.fromTo(`${rowSelector}.split-left`,
                    { x: 0, y: 0, rotation: 0, opacity: 1 },
                    { x: -600, y: 120, rotation: -15, opacity: 0, ease: "power1.inOut", immediateRender: false },
                    0
                );

                tl.fromTo(`${rowSelector}.split-right`,
                    { x: 0, y: 0, rotation: 0, opacity: 1 },
                    { x: 600, y: 120, rotation: 15, opacity: 0, ease: "power1.inOut", immediateRender: false },
                    0
                );

                tl.fromTo(`${rowSelector} .ticket-stub, ${rowSelector} .passport-stamp`,
                    { scale: 1, opacity: 1 },
                    { scale: 0.5, opacity: 0, ease: "power2.in", immediateRender: false },
                    0
                );
            });

        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="py-28 md:py-36 bg-[#FFF8F5] relative overflow-hidden border-t border-brand-dark/5">
            {/* Ambient background glow decoration */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/3 left-1/4 -translate-y-1/2 w-96 h-96 rounded-full bg-[#0D9488]/5 blur-[140px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[#FF5B1D]/5 blur-[140px]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16 md:mb-20 flex flex-col items-center section-header">
                    {/* Micro-Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0D9488]/10 text-[#0D9488] rounded-full font-mono text-[12px] font-black tracking-widest uppercase mb-4 shadow-2xs border border-[#0D9488]/20 select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] animate-pulse" />
                        Social Proof • Verified Passports
                    </div>

                    {/* Section Title */}
                    <h2 className="text-3xl md:text-5xl font-bold text-brand-dark tracking-tight leading-none font-serif uppercase">
                        Trusted by <span className="relative inline-block text-[#0D9488] select-none normal-case font-serif italic font-bold">
                            Modern Travelers
                            <svg className="absolute -bottom-1.5 left-0 w-full h-1.5 text-[#0D9488]/40" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0,5 C30,9 70,2 100,6" stroke="currentColor" strokeWidth="8" strokeLinecap="round" fill="none" />
                            </svg>
                        </span>
                    </h2>

                    {/* Subtitle */}
                    <p className="text-sm md:text-base text-brand-dark/60 max-w-xl mt-5 tracking-wide select-none leading-relaxed">
                        See how TripWise is eliminating hours of open-tab research worldwide.
                    </p>
                </div>

                {/* Responsive 3-Column Bento Grid Wrapper with generous gaps (gap: 32px -> gap-8) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {cardsData.map((card) => {
                        const isHorizontal = card.layout === "horizontal";

                        return (
                            <div
                                key={card.id}
                                className={`boarding-pass ${card.colSpanClass} ${card.rowClass} ${card.splitCol === "left" ? "split-left" : "split-right"} bg-white/95 backdrop-blur-md border border-[#4B4745]/15 hover:border-[#0D9488]/50 shadow-md hover:shadow-[0_20px_40px_rgba(13,148,136,0.12)] hover:-translate-y-2 transition-all duration-500 ease-out rounded-2xl flex ${
                                    isHorizontal ? "flex-col sm:flex-row sm:items-center justify-between" : "flex-col"
                                } relative overflow-hidden group`}
                            >
                                {/* Subtle Top Shimmer Accent on Hover */}
                                <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-transparent via-[#0D9488] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-30" />

                                {/* Passport Stamp block */}
                                <PassportStamp stampText={card.stampText} stampCode={card.stampCode} color={card.stampColor} />

                                {/* Main Body */}
                                <div className="flex-1 p-6 md:p-7 flex flex-col justify-between relative z-10">
                                    {/* Top Header: User info + Route Badge */}
                                    <div className={`flex ${isHorizontal ? "flex-col sm:flex-row sm:items-center justify-between" : "flex-col items-start"} gap-3.5 mb-4`}>
                                        <div className="flex items-center gap-3.5 min-w-0 max-w-full">
                                            <CardAvatar src={card.avatar} initials={card.initials} name={card.name} />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="font-bold text-[#1C1B1B] text-sm md:text-base leading-snug group-hover:text-[#0D9488] transition-colors duration-300">{card.name}</span>
                                                    {/* Verified Checkmark Badge */}
                                                    <span className="w-4 h-4 rounded-full bg-[#0D9488] text-white flex items-center justify-center text-[10px] shadow-2xs font-bold shrink-0" title="Verified Traveler">
                                                        ✓
                                                    </span>
                                                </div>
                                                <span className="text-xs text-[#4B4745]/80 block font-mono mt-0.5 truncate">{card.handle}</span>
                                            </div>
                                        </div>

                                        {/* Routing Tag Pill Badge */}
                                        <div className="shrink-0 max-w-full px-3 py-1.5 rounded-full bg-[#0D9488]/10 border border-[#0D9488]/25 flex items-center gap-2 font-mono text-xs font-bold text-[#0D9488] shadow-2xs group-hover:bg-[#0D9488] group-hover:text-white transition-all duration-300 group-hover:scale-105">
                                            <span className="tracking-wider shrink-0">{card.route}</span>
                                            <span className="text-[10px] opacity-75 font-sans truncate">({card.routeLabel})</span>
                                        </div>
                                    </div>

                                    {/* Testimonial Quote */}
                                    <p className="text-[#1C1B1B]/90 text-sm md:text-base leading-relaxed font-sans italic my-4 relative pl-2 group-hover:text-[#1C1B1B] transition-colors duration-300">
                                        <span className="text-[#FF5B1D] font-serif text-3xl leading-none absolute -left-2 -top-1 select-none opacity-50">“</span>
                                        {card.quote}
                                        <span className="text-[#FF5B1D] font-serif text-3xl leading-none select-none opacity-50 ml-1">”</span>
                                    </p>

                                    {/* Footer: Trip Tag & Timestamp */}
                                    <div className="flex items-center justify-between pt-4 border-t border-[#4B4745]/10 text-xs text-[#4B4745] font-mono mt-auto gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="w-2 h-2 rounded-full bg-[#FF5B1D] shrink-0 group-hover:scale-125 transition-transform duration-300" />
                                            <span className="font-semibold text-[#1C1B1B] truncate">{card.tripTag}</span>
                                        </div>
                                        <span className="opacity-70 font-bold tracking-wider shrink-0 hidden sm:inline group-hover:text-[#0D9488] transition-colors duration-300">AI ROUTED</span>
                                    </div>
                                </div>

                                {/* Dashed Divider Line with Semi-Circle Cutouts (Horizontal Layout) */}
                                {isHorizontal ? (
                                    <div className="hidden md:block relative w-px bg-transparent shrink-0">
                                        <div className="absolute inset-y-0 -left-px border-l-2 border-dashed border-[#4B4745]/25 group-hover:border-[#0D9488]/50 transition-colors duration-300" />
                                        {/* Top Notch Cutout */}
                                        <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-[#FFF8F5] border-b border-[#4B4745]/15 z-20 group-hover:border-[#0D9488]/40 transition-colors duration-300 shadow-inner" />
                                        {/* Bottom Notch Cutout */}
                                        <div className="absolute -bottom-3 -left-3 w-6 h-6 rounded-full bg-[#FFF8F5] border-t border-[#4B4745]/15 z-20 group-hover:border-[#0D9488]/40 transition-colors duration-300 shadow-inner" />
                                    </div>
                                ) : null}

                                {/* Dashed Divider Line with Cutouts (Vertical Layout or Mobile fallback) */}
                                <div className={`${isHorizontal ? "block md:hidden" : "block"} relative h-px w-full bg-transparent shrink-0`}>
                                    <div className="absolute inset-x-0 -top-px border-t-2 border-dashed border-[#4B4745]/25 group-hover:border-[#0D9488]/50 transition-colors duration-300" />
                                    {/* Left Notch Cutout */}
                                    <div className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-[#FFF8F5] border-r border-[#4B4745]/15 z-20 group-hover:border-[#0D9488]/40 transition-colors duration-300 shadow-inner" />
                                    {/* Right Notch Cutout */}
                                    <div className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-[#FFF8F5] border-l border-[#4B4745]/15 z-20 group-hover:border-[#0D9488]/40 transition-colors duration-300 shadow-inner" />
                                </div>

                                {/* Ticket Stub */}
                                <div className={`ticket-stub ${
                                    isHorizontal ? "md:w-48 bg-[#FF5B1D]/3 md:bg-transparent" : "w-full bg-[#FF5B1D]/3"
                                } p-5 md:p-6 flex flex-col justify-between items-center text-center relative shrink-0 z-10 group-hover:bg-[#FF5B1D]/6 transition-colors duration-300`}>
                                    {/* Top Gate / Seat Info */}
                                    <div className="w-full flex items-center justify-between text-[9px] font-mono font-bold text-[#4B4745]/80 uppercase tracking-wider mb-2 pb-2 border-b border-[#4B4745]/10">
                                        <span>CLS: {card.classCode}</span>
                                        <span>SEAT: {card.seat}</span>
                                    </div>

                                    {/* Center Prominent Data Label */}
                                    <div className="my-auto py-3">
                                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#4B4745] font-bold block mb-1">
                                            HOURS SAVED
                                        </span>
                                        <div className="text-3xl lg:text-4xl font-mono font-black text-[#FF5B1D] tracking-tight leading-none drop-shadow-2xs group-hover:scale-110 group-hover:text-[#0D9488] transition-all duration-300">
                                            {card.hoursSaved}
                                        </div>
                                        <span className="text-[9px] font-mono uppercase text-[#1C1B1B]/70 font-extrabold tracking-wider mt-1.5 block">
                                            HRS OF RESEARCH
                                        </span>
                                    </div>

                                    {/* Bottom Barcode */}
                                    <div className="w-full pt-3 border-t border-[#4B4745]/10 mt-2">
                                        <div className="w-full flex items-center justify-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                                            {[2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 2].map((w, idx) => (
                                                <div key={idx} className="h-5 bg-[#1C1B1B] rounded-3xs group-hover:bg-[#0D9488] transition-colors duration-300" style={{ width: `${w}px` }} />
                                            ))}
                                        </div>
                                        <div className="text-[8px] font-mono tracking-widest text-[#4B4745]/80 mt-1 uppercase group-hover:text-[#1C1B1B] transition-colors duration-300">
                                            TW-{card.id}982-AI
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
