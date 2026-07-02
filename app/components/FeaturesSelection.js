'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/* ─── Feature data ──────────────────────────────────────────────── */
const features = [
    {
        title: 'Smart Day-by-Day Scheduling',
        tagline: 'ACTIVE ITINERARY',
        desc: 'We map out a realistic daily path optimized for walking distances, peak visiting hours, and logical transit routes.',
        details: ['Optimal walking sequence & duration estimates', 'Crowd density avoidance visit windows'],
        color: '#0D9488',
        side: 'left',
        item: 'calendar',
        badge: '01',
        tilt: -11,
        scrollTarget: 0.25, // Scroll progress midpoint for click navigation
    },
    {
        title: 'Real-Time Flight & Hotel Integration',
        tagline: 'SYSTEM SYNC',
        desc: 'Seamlessly link your flight status, hotel coordinates, and check-in times. Delays automatically trigger schedule re-routing.',
        details: ['Live boarding pass status tracking', 'Automated delay re-routing suggestions'],
        color: '#fe7717',
        side: 'right',
        item: 'boarding-pass',
        badge: '02',
        tilt: 10,
        scrollTarget: 0.46,
    },
    {
        title: 'Budget Optimization',
        tagline: 'FINANCIAL FORECASTING',
        desc: 'Real-time cost estimations based on category caps. We automatically recommend cheaper transport timings and cost-effective stays.',
        details: ['Fare-saving flight & rail shift alerts', 'Category-cap automatic cost estimates'],
        color: '#0D9488',
        side: 'left',
        item: 'wallet',
        badge: '03',
        tilt: -7,
        scrollTarget: 0.66,
    },
    {
        title: 'Local Hidden Gems',
        tagline: 'REAL-TIME CURATION',
        desc: 'Powered by hyper-local review parsing, TripWise steers you away from tourist traps into authentic culinary spots and scenic detours.',
        details: ['Verified local-only eateries & views', 'Detours curated by local reviewers'],
        color: '#fe7717',
        side: 'right',
        item: 'camera',
        badge: '04',
        tilt: 9,
        scrollTarget: 0.88,
    },
];

/* ─── SVG Item Components ────────────────────────────────────────── */

function BoardingPass() {
    return (
        <svg width="158" height="90" viewBox="0 0 158 90" fill="none">
            <rect width="158" height="90" rx="10" fill="#FFF8F5" />
            <rect x="0.75" y="0.75" width="156.5" height="88.5" rx="9.25" stroke="#fe7717" strokeWidth="1.5" />
            <rect width="158" height="26" rx="10" fill="#1C1B1B" />
            <rect y="16" width="158" height="10" fill="#1C1B1B" />
            <text x="10" y="17" fill="#fe7717" fontSize="7.5" fontFamily="monospace" fontWeight="bold" letterSpacing="1">BOARDING PASS</text>
            <rect x="118" y="7" width="32" height="12" rx="6" fill="#22C55E" fillOpacity="0.2" />
            <text x="134" y="16" fill="#22C55E" fontSize="6" fontFamily="monospace" fontWeight="bold" textAnchor="middle">ON TIME</text>
            <text x="10" y="45" fill="#1C1B1B" fontSize="21" fontFamily="sans-serif" fontWeight="900" letterSpacing="-0.5">JFK</text>
            <text x="10" y="54" fill="#4B4745" fontSize="6" fontFamily="monospace" fontWeight="bold">NEW YORK</text>
            <line x1="64" y1="40" x2="90" y2="40" stroke="#fe7717" strokeWidth="1.5" strokeDasharray="3 2.5" />
            <path d="M88 37 L94 40 L88 43" fill="#fe7717" />
            <text x="148" y="45" fill="#1C1B1B" fontSize="21" fontFamily="sans-serif" fontWeight="900" letterSpacing="-0.5" textAnchor="end">FCO</text>
            <text x="148" y="54" fill="#4B4745" fontSize="6" fontFamily="monospace" fontWeight="bold" textAnchor="end">ROME</text>
            <circle cx="0" cy="62" r="7" fill="#FFF8F5" />
            <circle cx="158" cy="62" r="7" fill="#FFF8F5" />
            <line x1="7" y1="62" x2="151" y2="62" stroke="#1C1B1B" strokeWidth="1" strokeDasharray="4 3.5" opacity="0.15" />
            <text x="10" y="74" fill="#4B4745" fontSize="5.5" fontFamily="monospace" fontWeight="bold">FLIGHT</text>
            <text x="10" y="83" fill="#1C1B1B" fontSize="8.5" fontFamily="monospace" fontWeight="900">AZ-405</text>
            <text x="72" y="74" fill="#4B4745" fontSize="5.5" fontFamily="monospace" fontWeight="bold">GATE</text>
            <text x="72" y="83" fill="#1C1B1B" fontSize="8.5" fontFamily="monospace" fontWeight="900">G12</text>
            <text x="133" y="74" fill="#4B4745" fontSize="5.5" fontFamily="monospace" fontWeight="bold" textAnchor="end">SEAT</text>
            <text x="148" y="83" fill="#fe7717" fontSize="8.5" fontFamily="monospace" fontWeight="900" textAnchor="end">14A</text>
        </svg>
    );
}

function Wallet() {
    return (
        <svg width="130" height="85" viewBox="0 0 130 85" fill="none">
            <defs>
                <linearGradient id="walletGrad" x1="0" y1="0" x2="130" y2="85">
                    <stop offset="0%" stopColor="#1a2e2c" />
                    <stop offset="100%" stopColor="#1C1B1B" />
                </linearGradient>
            </defs>
            <rect width="130" height="85" rx="13" fill="url(#walletGrad)" />
            <rect x="0.75" y="0.75" width="128.5" height="83.5" rx="12.25" stroke="#0D9488" strokeWidth="1.5" />
            <rect x="12" y="18" width="32" height="23" rx="4" fill="#C8A951" opacity="0.88" />
            <line x1="12" y1="26" x2="44" y2="26" stroke="#8B7331" strokeWidth="0.8" opacity="0.55" />
            <line x1="12" y1="32" x2="44" y2="32" stroke="#8B7331" strokeWidth="0.8" opacity="0.55" />
            <line x1="23" y1="18" x2="23" y2="41" stroke="#8B7331" strokeWidth="0.8" opacity="0.55" />
            <line x1="31" y1="18" x2="31" y2="41" stroke="#8B7331" strokeWidth="0.8" opacity="0.55" />
            <path d="M96 24 Q106 29.5 96 35" stroke="#0D9488" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M99.5 19.5 Q115 29.5 99.5 39.5" stroke="#0D9488" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.45" />
            <text x="12" y="60" fill="white" fontSize="9" fontFamily="monospace" letterSpacing="2.5" opacity="0.7">•••• ••••</text>
            <text x="91" y="60" fill="white" fontSize="9" fontFamily="monospace" fontWeight="bold">4892</text>
            <text x="12" y="76" fill="white" fontSize="6.5" fontFamily="monospace" opacity="0.45">TRIPWISE BUDGET</text>
            <text x="118" y="76" fill="#0D9488" fontSize="6.5" fontFamily="monospace" fontWeight="bold" textAnchor="end">12/28</text>
        </svg>
    );
}

function VintageCamera() {
    return (
        <svg width="135" height="105" viewBox="0 0 135 105" fill="none">
            <rect x="4" y="26" width="127" height="72" rx="14" fill="#5C4033" />
            <rect x="4" y="26" width="127" height="72" rx="14" stroke="#7A5040" strokeWidth="1.5" />
            <rect x="38" y="12" width="59" height="22" rx="8" fill="#5C4033" stroke="#7A5040" strokeWidth="1.5" />
            <circle cx="67" cy="63" r="28" fill="#2A1A0E" />
            <circle cx="67" cy="63" r="25.5" fill="#1C1000" stroke="#7A5040" strokeWidth="1.5" />
            <circle cx="67" cy="63" r="19" fill="#0D1B2A" />
            <circle cx="67" cy="63" r="14" fill="#162535" />
            <circle cx="67" cy="63" r="8.5" fill="#0a1520" />
            <circle cx="59" cy="55" r="4" fill="white" opacity="0.1" />
            <circle cx="57" cy="53" r="2" fill="white" opacity="0.2" />
            <rect x="44" y="16" width="19" height="13" rx="4" fill="#2A1A0E" stroke="#6B4433" strokeWidth="1" />
            <rect x="84" y="16" width="12" height="9" rx="2.5" fill="#C8A951" opacity="0.82" />
            <circle cx="108" cy="36" r="8.5" fill="#7A5040" />
            <circle cx="108" cy="36" r="6" fill="#fe7717" />
            <circle cx="108" cy="36" r="3" fill="#C8602A" />
            <rect x="2" y="38" width="6" height="18" rx="3" fill="#4A3020" />
            <rect x="127" y="38" width="6" height="18" rx="3" fill="#4A3020" />
            <text x="108" y="82" fill="#7A5040" fontSize="5.5" fontFamily="serif" fontStyle="italic" textAnchor="middle" opacity="0.65">TripCam</text>
        </svg>
    );
}

function CalendarIcon() {
    const weeks = [
        [null, null, 1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10, 11, 12],
        [13, 14, 15, 16, 17, 18, 19],
        [20, 21, 22, 23, 24, 25, 26],
    ];
    return (
        <svg width="118" height="118" viewBox="0 0 118 118" fill="none">
            <rect width="118" height="118" rx="14" fill="white" />
            <rect x="0.75" y="0.75" width="116.5" height="116.5" rx="13.25" stroke="#0D9488" strokeWidth="1.5" />
            <rect width="118" height="33" rx="14" fill="#0D9488" />
            <rect y="19" width="118" height="14" fill="#0D9488" />
            <text x="59" y="21" fill="white" fontSize="11.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">JULY 2026</text>
            <rect x="29" y="0" width="8" height="15" rx="4" fill="#1C1B1B" />
            <rect x="81" y="0" width="8" height="15" rx="4" fill="#1C1B1B" />
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <text key={i} x={10 + i * 15} y="50" fill="#4B4745" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">{d}</text>
            ))}
            {weeks.map((week, wi) =>
                week.map((day, di) => {
                    if (!day) return null;
                    const cx = 10 + di * 15;
                    const cy = 64 + wi * 14;
                    const isToday = day === 15;
                    const hasDot = day === 8 || day === 22;
                    return (
                        <g key={`${wi}-${di}`}>
                            {isToday && <circle cx={cx} cy={cy} r="9" fill="#0D9488" />}
                            {hasDot && !isToday && <circle cx={cx} cy={cy + 6} r="2.5" fill="#fe7717" opacity="0.5" />}
                            <text x={cx} y={cy + 3} fill={isToday ? 'white' : '#1C1B1B'} fontSize="8.5" fontFamily="monospace" fontWeight={isToday ? 'bold' : 'normal'} textAnchor="middle">{day}</text>
                        </g>
                    );
                })
            )}
        </svg>
    );
}

/* ─── Lid interior lining (velvet quilted silk) ──────────────────── */
function SuitcaseLidInterior() {
    const cols = 9, rows = 7;
    const dw = 29, dh = 16;
    const diamonds = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = c * dw + (r % 2 === 1 ? dw / 2 : 0);
            const y = r * dh + 14;
            diamonds.push({ x, y, id: `${r}-${c}` });
        }
    }
    return (
        <svg width="260" height="138" viewBox="0 0 260 138" fill="none">
            {/* Velvet base */}
            <rect width="260" height="138" rx="20" fill="#380E1A" />
            <rect x="12" y="12" width="236" height="114" rx="14" fill="#4E1525" />
            {/* Quilted diamond pattern */}
            {diamonds.map(({ x, y, id }) => (
                <polygon
                    key={id}
                    points={`${x + dw / 2},${y} ${x + dw},${y + dh / 2} ${x + dw / 2},${y + dh} ${x},${y + dh / 2}`}
                    fill="none"
                    stroke="#7A2840"
                    strokeWidth="0.65"
                    opacity="0.55"
                />
            ))}
            {/* Tufting buttons */}
            {diamonds.filter((_, i) => i % 2 === 0).map(({ x, y, id }) => (
                <circle key={`b-${id}`} cx={x + dw / 2} cy={y + dh / 2} r="1.6" fill="#B04060" opacity="0.5" />
            ))}
            {/* Stitched border */}
            <rect x="16" y="16" width="228" height="106" rx="12" fill="none" stroke="#7A2840" strokeWidth="1" strokeDasharray="5 4" opacity="0.3" />
            {/* Document pocket */}
            <rect x="80" y="28" width="100" height="60" rx="8" fill="#2E0A14" opacity="0.55" stroke="#7A2840" strokeWidth="1" strokeDasharray="4 3.5" />
            <text x="130" y="60" fill="#9B3055" fontSize="7" fontFamily="monospace" fontWeight="bold" textAnchor="middle" opacity="0.7" letterSpacing="1">DOCUMENTS</text>
            <line x1="88" y1="72" x2="172" y2="72" stroke="#7A2840" strokeWidth="0.7" opacity="0.4" strokeDasharray="3 2.5" />
            <text x="130" y="82" fill="#7A2840" fontSize="5.5" fontFamily="monospace" textAnchor="middle" opacity="0.5">TripWise Co.</text>
            {/* Elastic strap */}
            <path d="M 45 105 Q 130 113 215 105" stroke="#7A2840" strokeWidth="2.5" fill="none" opacity="0.45" strokeLinecap="round" />
            {/* Strap buckle */}
            <rect x="122" y="103" width="16" height="10" rx="3" fill="#4E1525" stroke="#9B3055" strokeWidth="1" opacity="0.7" />
        </svg>
    );
}

/* ─── Suitcase exterior components ──────────────────────────────── */
function SuitcaseLid() {
    return (
        <svg width="260" height="138" viewBox="0 0 260 138" fill="none">
            <rect x="2" y="2" width="256" height="134" rx="20" fill="#8B5E3C" />
            <rect x="2" y="2" width="256" height="134" rx="20" stroke="#6B4525" strokeWidth="2" />
            <rect x="16" y="16" width="228" height="106" rx="14" fill="#9B6E4C" opacity="0.35" />
            <line x1="2" y1="46" x2="258" y2="46" stroke="#6B4525" strokeWidth="0.7" opacity="0.22" />
            <line x1="2" y1="92" x2="258" y2="92" stroke="#6B4525" strokeWidth="0.7" opacity="0.22" />
            <path d="M16 16 L32 16 L32 32" stroke="#7A5030" strokeWidth="1.2" fill="none" strokeDasharray="3 2" opacity="0.45" />
            <path d="M244 16 L228 16 L228 32" stroke="#7A5030" strokeWidth="1.2" fill="none" strokeDasharray="3 2" opacity="0.45" />
            <path d="M16 122 L32 122 L32 106" stroke="#7A5030" strokeWidth="1.2" fill="none" strokeDasharray="3 2" opacity="0.45" />
            <path d="M244 122 L228 122 L228 106" stroke="#7A5030" strokeWidth="1.2" fill="none" strokeDasharray="3 2" opacity="0.45" />
            <rect x="98" y="0" width="64" height="20" rx="10" fill="#7A5030" />
            <rect x="106" y="2" width="48" height="14" rx="7" fill="#5A3820" />
            <path d="M111 10 Q130 -28 149 10" stroke="#3D2810" strokeWidth="5.5" fill="none" strokeLinecap="round" />
            <path d="M111 10 Q130 -28 149 10" stroke="#9B6E4C" strokeWidth="3" fill="none" strokeLinecap="round" />
            <rect className="suitcase-clasp-left" x="30" y="112" width="28" height="20" rx="5" fill="#C8A951" />
            <rect x="34" y="115" width="20" height="14" rx="3" fill="#8B7331" opacity="0.38" />
            <circle cx="44" cy="122" r="3.5" fill="#8B7331" />
            <rect className="suitcase-clasp-right" x="202" y="112" width="28" height="20" rx="5" fill="#C8A951" />
            <rect x="206" y="115" width="20" height="14" rx="3" fill="#8B7331" opacity="0.38" />
            <circle cx="216" cy="122" r="3.5" fill="#8B7331" />
            <rect x="108" y="110" width="44" height="24" rx="7" fill="#C8A951" />
            <circle cx="130" cy="122" r="6.5" fill="#8B7331" />
            <rect x="127" y="124" width="6" height="8" rx="2" fill="#5A4010" />
            <circle cx="130" cy="121" r="2.2" fill="#C8A951" />
        </svg>
    );
}

function SuitcaseBody() {
    return (
        <svg width="260" height="190" viewBox="0 0 260 190" fill="none">
            <rect x="2" y="0" width="256" height="186" rx="20" fill="#7A5030" />
            <rect x="2" y="0" width="256" height="186" rx="20" stroke="#6B4525" strokeWidth="2" />
            <rect x="2" y="0" width="256" height="12" fill="#4A2F15" opacity="0.35" />
            <rect x="16" y="12" width="228" height="158" rx="14" fill="#8B5E3C" opacity="0.35" />
            
            {/* Added decorative travel items peeking from the body of the suitcase */}
            {/* Rolled Shirt / Fabric */}
            <rect x="32" y="12" width="55" height="24" rx="8" fill="#0D9488" opacity="0.8" />
            <line x1="32" y1="20" x2="87" y2="20" stroke="#0a6b62" strokeWidth="1" opacity="0.4" />
            <line x1="32" y1="28" x2="87" y2="28" stroke="#0a6b62" strokeWidth="1" opacity="0.4" />
            
            {/* Sunglasses sitting in the case */}
            <path d="M 160 15 C 165 15, 170 22, 165 28 C 160 32, 153 30, 150 25" stroke="#1C1B1B" strokeWidth="2.5" fill="none" opacity="0.85" />
            <path d="M 180 15 C 185 15, 190 22, 185 28 C 180 32, 173 30, 170 25" stroke="#1C1B1B" strokeWidth="2.5" fill="none" opacity="0.85" />
            <line x1="165" y1="22" x2="170" y2="22" stroke="#1C1B1B" strokeWidth="1.5" opacity="0.85" />

            {/* Map Corner */}
            <path d="M 90 12 L 140 12 L 125 38 L 80 30 Z" fill="#EAD5C3" opacity="0.75" />
            <path d="M 90 12 L 140 12 L 125 38 L 80 30 Z" fill="none" stroke="#D1B296" strokeWidth="0.8" opacity="0.75" />
            
            <line x1="2" y1="52" x2="258" y2="52" stroke="#6B4525" strokeWidth="0.7" opacity="0.22" />
            <line x1="2" y1="108" x2="258" y2="108" stroke="#6B4525" strokeWidth="0.7" opacity="0.22" />
            <line x1="2" y1="158" x2="258" y2="158" stroke="#6B4525" strokeWidth="0.7" opacity="0.22" />
            <path d="M16 12 L32 12 L32 28" stroke="#7A5030" strokeWidth="1.2" fill="none" strokeDasharray="3 2" opacity="0.45" />
            <path d="M244 12 L228 12 L228 28" stroke="#7A5030" strokeWidth="1.2" fill="none" strokeDasharray="3 2" opacity="0.45" />
            <path d="M16 174 L32 174 L32 158" stroke="#7A5030" strokeWidth="1.2" fill="none" strokeDasharray="3 2" opacity="0.45" />
            <path d="M244 174 L228 174 L228 158" stroke="#7A5030" strokeWidth="1.2" fill="none" strokeDasharray="3 2" opacity="0.45" />
            <rect className="suitcase-lock-left" x="30" y="0" width="28" height="20" rx="5" fill="#C8A951" />
            <rect x="34" y="4" width="20" height="14" rx="3" fill="#8B7331" opacity="0.38" />
            <circle cx="44" cy="10" r="3.5" fill="#8B7331" />
            <rect className="suitcase-lock-right" x="202" y="0" width="28" height="20" rx="5" fill="#C8A951" />
            <rect x="206" y="4" width="20" height="14" rx="3" fill="#8B7331" opacity="0.38" />
            <circle cx="216" cy="10" r="3.5" fill="#8B7331" />
            <rect x="108" y="0" width="44" height="24" rx="7" fill="#C8A951" />
            <circle cx="130" cy="12" r="6.5" fill="#8B7331" />
            <rect x="127" y="14" width="6" height="8" rx="2" fill="#5A4010" />
            <circle cx="130" cy="11" r="2.2" fill="#C8A951" />
            <text x="130" y="97" fill="#FFF8F5" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle" opacity="0.1" letterSpacing="4">TRIPWISE</text>
            <ellipse cx="52" cy="184" rx="20" ry="9" fill="#2A1A0E" />
            <ellipse cx="52" cy="184" rx="15" ry="6.5" fill="#3A2A1A" />
            <circle cx="52" cy="184" r="4" fill="#1C1000" />
            <ellipse cx="208" cy="184" rx="20" ry="9" fill="#2A1A0E" />
            <ellipse cx="208" cy="184" rx="15" ry="6.5" fill="#3A2A1A" />
            <circle cx="208" cy="184" r="4" fill="#1C1000" />
            <rect x="2" y="160" width="24" height="28" rx="5" fill="#C8A951" opacity="0.45" />
            <rect x="234" y="160" width="24" height="28" rx="5" fill="#C8A951" opacity="0.45" />
        </svg>
    );
}

/* ─── Feature card (with mouse-move hover glow) ─────────────────── */
function FeatureCard({ feature: f }) {
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setCoords({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    return (
        <div
            className="rounded-2xl p-5 border relative overflow-hidden transition-all duration-300 select-none cursor-default"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                background: '#FFFFFF',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderColor: `${f.color}28`,
                boxShadow: isHovered 
                    ? `0 20px 40px rgba(0, 0, 0, 0.08), 0 8px 20px rgba(0, 0, 0, 0.04), inset 0 0 1px 1px ${f.color}15`
                    : `0 10px 30px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02)`,
                transform: isHovered ? 'scale(1.02) translateY(-2px)' : 'scale(1)',
            }}
        >
            {/* Dynamic Hover Radial Light Highlight */}
            {isHovered && (
                <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                    style={{
                        background: `radial-gradient(150px circle at ${coords.x}px ${coords.y}px, ${f.color}15, transparent 80%)`,
                    }}
                />
            )}

            <div className="flex items-start gap-3 mb-3 relative z-10">
                <div className="w-1.5 h-10 rounded-full shrink-0 mt-0.5" style={{ background: f.color }} />
                <div className="min-w-0">
                    <p className="font-mono text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: f.color }}>
                        {f.tagline}
                    </p>
                    <h3 className="text-sm font-extrabold text-brand-dark leading-tight">{f.title}</h3>
                </div>
            </div>
            <p className="text-[11px] text-secondary-text leading-relaxed mb-3 relative z-10">{f.desc}</p>
            <div className="flex flex-col gap-1.5 border-t border-brand-dark/5 pt-3 relative z-10">
                {f.details.map((d, di) => (
                    <div key={di} className="flex items-center gap-2">
                        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke={f.color} strokeWidth="3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-[10px] font-mono font-semibold text-brand-dark/70">{d}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Main component ─────────────────────────────────────────────── */
function FeaturesSelection() {
    const containerRef  = useRef(null);
    const stickyRef     = useRef(null);
    const suitcaseWrapRef = useRef(null);
    const lidRef        = useRef(null);
    const interiorRef   = useRef(null);
    const shadowRef     = useRef(null);
    const headerRef     = useRef(null);
    const scrollHintRef = useRef(null);
    const progressFillRef = useRef(null);
    const canvasRef     = useRef(null); // canvas for particle explosions
    const stepDotRefs   = useRef([null, null, null, null]);
    const itemRefs      = useRef([null, null, null, null]);
    const cardRefs      = useRef([null, null, null, null]);

    // Active tab state updated dynamically onScroll or onClick
    const [activeTab, setActiveTab] = useState(0);
    const particlesArray = useRef([]);

    // Custom Scroll Trigger trigger click-navigation function
    const navigateToPhase = (scrollProgress) => {
        if (!containerRef.current) return;
        const totalHeight = containerRef.current.offsetHeight;
        const offsetTop = containerRef.current.offsetTop;
        const targetScroll = offsetTop + (scrollProgress * (totalHeight - window.innerHeight));
        
        window.scrollTo({
            top: targetScroll,
            behavior: 'smooth',
        });
    };

    // Canvas particle system implementation
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationId;

        const resizeCanvas = () => {
            canvas.width = canvas.parentElement.offsetWidth;
            canvas.height = canvas.parentElement.offsetHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        class Particle {
            constructor(x, y, color) {
                this.x = x;
                this.y = y;
                // Burst outwards and float upwards
                this.vx = (Math.random() - 0.5) * 6;
                this.vy = -Math.random() * 4 - 3;
                this.size = Math.random() * 4.5 + 2;
                this.alpha = 1;
                this.color = color;
                this.decay = Math.random() * 0.012 + 0.008;
                this.gravity = 0.05; // gentle downwards bend
            }
            update() {
                this.x += this.vx;
                this.vy += this.gravity;
                this.y += this.vy;
                this.alpha -= this.decay;
            }
            draw(c) {
                c.save();
                c.globalAlpha = this.alpha;
                c.shadowBlur = 12;
                c.shadowColor = this.color;
                c.fillStyle = this.color;
                c.beginPath();
                c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                c.fill();
                c.restore();
            }
        }

        const handleAnimation = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Render and update active particles
            for (let i = 0; i < particlesArray.current.length; i++) {
                const p = particlesArray.current[i];
                p.update();
                p.draw(ctx);
                if (p.alpha <= 0) {
                    particlesArray.current.splice(i, 1);
                    i--;
                }
            }

            // Continuous micro ambient sparkle from suitcase mouth when active
            if (Math.random() < 0.08) {
                const suitcaseX = canvas.width / 2;
                const suitcaseY = canvas.height / 2 + 30;
                particlesArray.current.push(new Particle(
                    suitcaseX + (Math.random() - 0.5) * 120,
                    suitcaseY,
                    Math.random() > 0.5 ? '#fe7717' : '#0D9488'
                ));
            }

            animationId = requestAnimationFrame(handleAnimation);
        };
        handleAnimation();

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resizeCanvas);
        };
    }, []);

    // Function to trigger particle explosions
    const triggerExplosion = (color) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2 + 10;
        
        // Spawn a ring/burst of colorful particles
        for (let i = 0; i < 35; i++) {
            const angle = Math.random() * Math.PI * 2;
            const force = Math.random() * 5 + 3;
            const p = {
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * force,
                vy: Math.sin(angle) * force - 2.5,
                size: Math.random() * 5 + 2.5,
                alpha: 1,
                color: color,
                decay: Math.random() * 0.016 + 0.009,
                gravity: 0.06,
                update() {
                    this.x += this.vx;
                    this.vy += this.gravity;
                    this.y += this.vy;
                    this.alpha -= this.decay;
                },
                draw(c) {
                    c.save();
                    c.globalAlpha = this.alpha;
                    c.shadowBlur = 12;
                    c.shadowColor = this.color;
                    c.fillStyle = this.color;
                    c.beginPath();
                    c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    c.fill();
                    c.restore();
                }
            };
            particlesArray.current.push(p);
        }
    };

    useEffect(() => {
        if (!containerRef.current || !stickyRef.current) return;
        gsap.registerPlugin(ScrollTrigger);

        const ctx = gsap.context(() => {
            /* ── Initial states ─────────────────────────────────── */
            gsap.set(lidRef.current, { rotationX: 0 });
            gsap.set(interiorRef.current, { opacity: 0 });
            gsap.set(suitcaseWrapRef.current, { scale: 0.82, opacity: 0, y: 40 });
            gsap.set(shadowRef.current, { scaleX: 0.8, opacity: 0.2 });
            gsap.set(progressFillRef.current, { width: '0%' });

            itemRefs.current.forEach((el) => {
                gsap.set(el, { y: 80, opacity: 0, scale: 0.7, rotateZ: 0, rotateY: 0, x: 0 });
            });
            cardRefs.current.forEach((el, i) => {
                gsap.set(el, { opacity: 0, x: features[i].side === 'right' ? 60 : -60 });
            });
            stepDotRefs.current.forEach((el, i) => {
                gsap.set(el, { scale: i === 0 ? 1.6 : 1, opacity: i === 0 ? 1 : 0.2 });
            });

            /* ── Main scroll timeline ─────────────────────────── */
            const tl = gsap.timeline();

            /* PHASE 0-15: Suitcase glides in + Pop lock shake */
            tl.to(suitcaseWrapRef.current, { scale: 1, opacity: 1, y: 0, duration: 15, ease: 'power3.out' }, 0);
            tl.to(shadowRef.current, { scaleX: 1, opacity: 0.45, duration: 15, ease: 'power2.out' }, 0);
            
            // Pop locks latch wiggles
            tl.to(suitcaseWrapRef.current, { x: -5, duration: 0.8, ease: 'power1.inOut' }, 9.5)
              .to(suitcaseWrapRef.current, { x: 5, duration: 0.8, ease: 'power1.inOut' }, 10.3)
              .to(suitcaseWrapRef.current, { x: -3, duration: 0.6, ease: 'power1.inOut' }, 11.1)
              .to(suitcaseWrapRef.current, { x: 0, duration: 0.6, ease: 'power1.out' }, 11.7);
            
            // Pop the metallic lock pins outwards
            tl.to('.suitcase-lock-left', { y: -2, scaleY: 1.15, duration: 1.5, ease: 'back.out(2)' }, 10.5)
              .to('.suitcase-lock-right', { y: -2, scaleY: 1.15, duration: 1.5, ease: 'back.out(2)' }, 10.5);
            tl.to('.suitcase-clasp-left', { rotate: -15, y: -4, transformOrigin: 'top center', duration: 2, ease: 'back.out(2)' }, 11.5)
              .to('.suitcase-clasp-right', { rotate: 15, y: -4, transformOrigin: 'top center', duration: 2, ease: 'back.out(2)' }, 11.5);

            tl.to(headerRef.current, { y: -26, opacity: 0, duration: 10, ease: 'power2.in' }, 7);
            tl.to(scrollHintRef.current, { opacity: 0, duration: 7, ease: 'power2.in' }, 5);
            tl.to(progressFillRef.current, { width: '6%', duration: 15 }, 0);

            /* PHASE 15-35: Lid cracks open (< 90°), calendar flies left */
            tl.to(lidRef.current, { rotationX: -58, duration: 22, ease: 'power2.inOut' }, 12);
            tl.to(shadowRef.current, { scaleX: 1.2, opacity: 0.38, duration: 22 }, 12);
            tl.to(itemRefs.current[0], {
                y: -250, x: -130,
                opacity: 1, scale: 1,
                rotateZ: features[0].tilt, rotateY: -6,
                duration: 17, ease: 'back.out(1.5)',
            }, 15);
            tl.call(() => triggerExplosion(features[0].color), null, 15);
            tl.to(cardRefs.current[0], { opacity: 1, x: 0, duration: 14, ease: 'power2.out' }, 20);
            tl.to(stepDotRefs.current[0], { scale: 1.6, opacity: 1, duration: 5 }, 15);
            tl.to(progressFillRef.current, { width: '28%', duration: 22 }, 13);

            /* PHASE 35-55: Calendar exits, lid past 90° → interior lining, boarding pass flies right */
            tl.to(itemRefs.current[0], { y: -400, opacity: 0, rotateZ: features[0].tilt * 1.8, duration: 10, ease: 'power2.in' }, 35);
            tl.to(cardRefs.current[0], { opacity: 0, x: -55, duration: 10, ease: 'power2.in' }, 35);
            tl.to(stepDotRefs.current[0], { scale: 1, opacity: 0.2, duration: 5 }, 35);
            tl.to(lidRef.current, { rotationX: -92, duration: 22, ease: 'power2.inOut' }, 33);
            tl.to(interiorRef.current, { opacity: 1, duration: 9, ease: 'power2.out' }, 37);
            tl.to(shadowRef.current, { scaleX: 1.35, opacity: 0.32, duration: 22 }, 33);
            tl.to(itemRefs.current[1], {
                y: -250, x: 130,
                opacity: 1, scale: 1,
                rotateZ: features[1].tilt, rotateY: 6,
                duration: 17, ease: 'back.out(1.5)',
            }, 38);
            tl.call(() => triggerExplosion(features[1].color), null, 38);
            tl.to(cardRefs.current[1], { opacity: 1, x: 0, duration: 14, ease: 'power2.out' }, 43);
            tl.to(stepDotRefs.current[1], { scale: 1.6, opacity: 1, duration: 5 }, 38);
            tl.to(progressFillRef.current, { width: '52%', duration: 22 }, 33);

            /* PHASE 55-75: Boarding pass exits, wallet flies left */
            tl.to(itemRefs.current[1], { y: -400, opacity: 0, rotateZ: features[1].tilt * 1.8, duration: 10, ease: 'power2.in' }, 55);
            tl.to(cardRefs.current[1], { opacity: 0, x: 55, duration: 10, ease: 'power2.in' }, 55);
            tl.to(stepDotRefs.current[1], { scale: 1, opacity: 0.2, duration: 5 }, 55);
            tl.to(lidRef.current, { rotationX: -108, duration: 22, ease: 'power2.inOut' }, 53);
            tl.to(shadowRef.current, { scaleX: 1.55, opacity: 0.28, duration: 22 }, 53);
            tl.to(itemRefs.current[2], {
                y: -250, x: -130,
                opacity: 1, scale: 1,
                rotateZ: features[2].tilt, rotateY: -6,
                duration: 17, ease: 'back.out(1.5)',
            }, 58);
            tl.call(() => triggerExplosion(features[2].color), null, 58);
            tl.to(cardRefs.current[2], { opacity: 1, x: 0, duration: 14, ease: 'power2.out' }, 63);
            tl.to(stepDotRefs.current[2], { scale: 1.6, opacity: 1, duration: 5 }, 58);
            tl.to(progressFillRef.current, { width: '76%', duration: 22 }, 53);

            /* PHASE 75-100: Wallet exits, camera flies right, lid flat open */
            tl.to(itemRefs.current[2], { y: -400, opacity: 0, rotateZ: features[2].tilt * 1.8, duration: 10, ease: 'power2.in' }, 75);
            tl.to(cardRefs.current[2], { opacity: 0, x: -55, duration: 10, ease: 'power2.in' }, 75);
            tl.to(stepDotRefs.current[2], { scale: 1, opacity: 0.2, duration: 5 }, 75);
            tl.to(lidRef.current, { rotationX: -120, duration: 25, ease: 'power1.inOut' }, 73);
            tl.to(shadowRef.current, { scaleX: 1.7, opacity: 0.22, duration: 25 }, 73);
            tl.to(itemRefs.current[3], {
                y: -250, x: 130,
                opacity: 1, scale: 1,
                rotateZ: features[3].tilt, rotateY: 6,
                duration: 17, ease: 'back.out(1.5)',
            }, 78);
            tl.call(() => triggerExplosion(features[3].color), null, 78);
            tl.to(cardRefs.current[3], { opacity: 1, x: 0, duration: 14, ease: 'power2.out' }, 83);
            tl.to(stepDotRefs.current[3], { scale: 1.6, opacity: 1, duration: 5 }, 78);
            tl.to(progressFillRef.current, { width: '100%', duration: 27 }, 73);

            ScrollTrigger.create({
                trigger: containerRef.current,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1.8,
                animation: tl,
                onUpdate: (self) => {
                    // Update active indices for progress bar visuals
                    const p = self.progress;
                    let activeIdx = 0;
                    if (p >= 0.35 && p < 0.55) activeIdx = 1;
                    else if (p >= 0.55 && p < 0.75) activeIdx = 2;
                    else if (p >= 0.75) activeIdx = 3;
                    setActiveTab(activeIdx);
                }
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    const itemMarginLeft = (type) => {
        if (type === 'boarding-pass') return '-79px';
        if (type === 'wallet')        return '-65px';
        if (type === 'camera')        return '-67px';
        return '-59px';
    };

    return (
        <section ref={containerRef} className="relative w-full h-[400vh] bg-[#FFF8F5]">

            {/* Float bob animation styling */}
            <style>{`
                @keyframes floatBob {
                    0%, 100% { transform: translateY(0px) rotate(0.4deg); }
                    35%      { transform: translateY(-10px) rotate(-0.4deg); }
                    70%      { transform: translateY(-5px) rotate(0.2deg); }
                }
                .item-bob { animation: floatBob 3.2s ease-in-out infinite; }
            `}</style>

            <div ref={stickyRef} className="sticky top-0 w-full h-screen overflow-hidden">

                {/* ── Particle System Canvas ── */}
                <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-30" />

                {/* ── Deep ambient glow ── */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-225 h-225 rounded-full blur-[200px]"
                        style={{ background: 'radial-gradient(circle, rgba(254,119,23,0.08) 0%, transparent 60%)' }} />
                    <div className="absolute top-1/3 left-1/5 w-96 h-96 rounded-full bg-[#0D9488]/5 blur-[120px]" />
                    <div className="absolute bottom-1/4 right-1/5 w-96 h-96 rounded-full bg-[#fe7717]/5 blur-[120px]" />
                </div>

                {/* ── Section header ── */}
                <div ref={headerRef} className="absolute top-14 md:top-16 left-1/2 -translate-x-1/2 text-center z-20 w-full px-6">
                    <div className="inline-block px-5 py-2 bg-[#1C1B1B] backdrop-blur-md rounded-full shadow-md border border-white/20 text-[#fe7717] font-mono text-[10px] font-bold tracking-[0.16em] uppercase mb-3">
                        ✦ Why TripWise?
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-brand-dark leading-tight">
                        Beyond Map Pins &amp; Standard Prompts
                    </h2>
                    <p className="text-sm text-secondary-text mt-1.5 font-medium opacity-55">
                        Scroll to unlock and explore details
                    </p>
                </div>

                {/* ── Ground shadow ── */}
                <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none" style={{ bottom: '17%', zIndex: 1 }}>
                    <div
                        ref={shadowRef}
                        style={{
                            width: '440px',
                            height: '44px',
                            background: 'radial-gradient(ellipse, rgba(0,0,0,0.22) 0%, transparent 72%)',
                            filter: 'blur(14px)',
                            transformOrigin: 'center center',
                        }}
                    />
                </div>

                {/* ── Main centered layout ── */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-full max-w-6xl mx-auto px-6 flex items-center justify-center h-full">

                        {/* Decorative orbit rings */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                            style={{ width: '530px', height: '530px', border: '1.5px dashed rgba(254,119,23,0.13)', borderRadius: '50%' }} />
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                            style={{ width: '640px', height: '640px', border: '1px dashed rgba(13,148,136,0.08)', borderRadius: '50%' }} />

                        {/* ── Suitcase + items (center) ── */}
                        <div
                            ref={suitcaseWrapRef}
                            className="relative flex flex-col items-center"
                            style={{ perspective: '1000px', perspectiveOrigin: '50% 55%' }}
                        >
                            {/* Floating items */}
                            {features.map((f, i) => (
                                <div
                                    key={`item-${i}`}
                                    ref={el => { itemRefs.current[i] = el; }}
                                    style={{
                                        position: 'absolute',
                                        top: '232px',
                                        left: '50%',
                                        marginLeft: itemMarginLeft(f.item),
                                        zIndex: 40,
                                        willChange: 'transform, opacity',
                                    }}
                                >
                                    {/* Number badge */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '-18px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: f.color,
                                        color: 'white',
                                        fontSize: '9px',
                                        fontFamily: 'monospace',
                                        fontWeight: '900',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        letterSpacing: '0.1em',
                                        zIndex: 50,
                                        boxShadow: `0 2px 8px ${f.color}50`,
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {f.badge}
                                    </div>
                                    
                                    <div
                                        className="item-bob"
                                        style={{
                                            filter: `drop-shadow(0 0 18px ${f.color}55) drop-shadow(0 18px 40px rgba(0,0,0,0.28))`,
                                        }}
                                    >
                                        {f.item === 'boarding-pass' && <BoardingPass />}
                                        {f.item === 'wallet'         && <Wallet />}
                                        {f.item === 'camera'         && <VintageCamera />}
                                        {f.item === 'calendar'       && <CalendarIcon />}
                                    </div>
                                </div>
                            ))}

                            {/* ── Suitcase (scaled 1.35×) ── */}
                            <div style={{ transform: 'scale(1.35)', transformOrigin: 'top center', display: 'inline-block' }}>
                                <div style={{ transformStyle: 'preserve-3d', position: 'relative' }}>

                                    {/* Velvet interior */}
                                    <div
                                        ref={interiorRef}
                                        style={{
                                            position: 'absolute',
                                            top: 0, left: 0, right: 0,
                                            zIndex: 2,
                                            pointerEvents: 'none',
                                        }}
                                    >
                                        <SuitcaseLidInterior />
                                    </div>

                                    {/* Lid */}
                                    <div
                                        ref={lidRef}
                                        style={{
                                            transformOrigin: 'bottom center',
                                            transformStyle: 'preserve-3d',
                                            willChange: 'transform',
                                            position: 'relative',
                                            zIndex: 8,
                                        }}
                                    >
                                        <SuitcaseLid />
                                    </div>

                                    {/* Body */}
                                    <div style={{ position: 'relative', zIndex: 10, marginTop: '-2px' }}>
                                        <SuitcaseBody />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Feature Cards: left-side features ── */}
                        {features.filter(f => f.side === 'left').map((f) => {
                            const i = features.indexOf(f);
                            return (
                                <div
                                    key={`card-${i}`}
                                    ref={el => { cardRefs.current[i] = el; }}
                                    className="absolute left-0 top-1/2 -translate-y-1/2 z-30"
                                    style={{ maxWidth: '262px', willChange: 'transform, opacity' }}
                                >
                                    <FeatureCard feature={f} />
                                </div>
                            );
                        })}

                        {/* ── Feature Cards: right-side features ── */}
                        {features.filter(f => f.side === 'right').map((f) => {
                            const i = features.indexOf(f);
                            return (
                                <div
                                    key={`card-${i}`}
                                    ref={el => { cardRefs.current[i] = el; }}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 z-30"
                                    style={{ maxWidth: '262px', willChange: 'transform, opacity' }}
                                >
                                    <FeatureCard feature={f} />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Scroll progress bar + interactive step dots (Hidden visually to preserve GSAP bindings safely) ── */}
                <div className="hidden absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-3 z-50" style={{ width: '290px' }}>
                    {/* Progress track */}
                    <div className="relative w-full h-0.75 rounded-full overflow-hidden" style={{ background: 'rgba(28,27,27,0.08)' }}>
                        <div
                            ref={progressFillRef}
                            className="absolute left-0 top-0 h-full rounded-full transition-all duration-100 ease-out"
                            style={{ width: '0%', background: 'linear-gradient(to right, #fe7717, #0D9488)' }}
                        />
                    </div>
                    {/* Step dots row */}
                    <div className="flex items-center justify-between w-full px-1">
                        {features.map((f, i) => {
                            const isCurrent = activeTab === i;
                            return (
                                <div 
                                    key={i} 
                                    className="flex flex-col items-center gap-1.5 cursor-pointer group"
                                    onClick={() => navigateToPhase(f.scrollTarget)}
                                >
                                    <div
                                        ref={el => { stepDotRefs.current[i] = el; }}
                                        className="transition-all duration-300 relative"
                                        style={{
                                            width: '9px', height: '9px',
                                            borderRadius: '50%',
                                            background: f.color,
                                            transformOrigin: 'center',
                                            boxShadow: isCurrent ? `0 0 10px ${f.color}aa` : 'none',
                                        }}
                                    >
                                        {/* Outer hover ring indicator */}
                                        <div className="absolute -inset-2 rounded-full border border-brand-dark/0 group-hover:border-brand-dark/15 scale-75 group-hover:scale-100 transition-all duration-200" />
                                    </div>
                                    <span
                                        className="font-mono font-bold transition-all duration-300 select-none"
                                        style={{ 
                                            fontSize: '8.5px', 
                                            color: f.color, 
                                            opacity: isCurrent ? 1 : 0.45, 
                                            letterSpacing: '0.08em',
                                            transform: isCurrent ? 'scale(1.1)' : 'scale(1)',
                                        }}
                                    >
                                        {f.badge}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Scroll hint: Scroll to Unlock ── */}
                <div
                    ref={scrollHintRef}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
                >
                    <span className="text-[9px] font-mono font-bold text-brand-dark/30 uppercase tracking-[0.18em] select-none">
                        Scroll to Unlock
                    </span>
                    <div className="w-5 h-8 rounded-full border border-brand-dark/12 flex items-start justify-center pt-1.5 bg-[#FFF8F5]/60 backdrop-blur-xs">
                        <div className="w-1 h-2 rounded-full bg-brand-dark/20 animate-bounce" />
                    </div>
                </div>
            </div>
        </section>
    );
}

export default FeaturesSelection;