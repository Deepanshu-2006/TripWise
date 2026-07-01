'use client';

import React, { useState } from 'react';

function FeaturesSelection() {
    const [activeTab, setActiveTab] = useState(0);

    const features = [
        {
            title: "Smart Day-by-Day Scheduling",
            tagline: "Maps pin places; ChatGPT writes static lists. TripWise designs functional schedules.",
            desc: "Instead of a simple map pin or a long text response, we map out a realistic daily path optimized for walking distances, peak visiting hours, and logical transit routes.",
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
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <path d="M22 2L11 13" />
                    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
            )
        }
    ];

    return (
        <section className="py-24 bg-[#FFF8F5] relative overflow-hidden select-none border-t border-brand-dark/5">
            {/* Background elements */}
            <div className="absolute top-1/4 left-0 w-96 h-96 bg-[#fe7717]/5 rounded-full filter blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-brand-teal/5 rounded-full filter blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Header Block */}
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <div className="inline-block px-5 py-2.5 bg-[#1C1B1B] backdrop-blur-md rounded-full shadow-md border border-white/20 text-[#fe7717] font-mono text-xs font-bold tracking-[0.16em] uppercase mb-6">
                        Why TripWise?
                    </div>
                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-brand-dark mb-5 leading-tight">
                        Beyond Map Pins &amp; Standard Prompts
                    </h2>
                    <p className="text-lg text-secondary-text font-medium leading-relaxed">
                        We built TripWise to solve what Google Maps &amp; ChatGPT ignore—combining real-time routing logic with actual local intelligence.
                    </p>
                </div>

                {/* Features Split Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
                    {/* Left Column: Interactive Selector List */}
                    <div className="lg:col-span-5 flex flex-col gap-4 justify-start">
                        {features.map((feature, idx) => {
                            const isActive = activeTab === idx;
                            return (
                                <div
                                    key={idx}
                                    onClick={() => setActiveTab(idx)}
                                    className={`p-6 rounded-2xl cursor-pointer border-l-4 transition-all duration-300 flex items-start gap-4 ${
                                        isActive 
                                            ? "bg-white border-[#fe7717] shadow-xl shadow-brand-coral/5 scale-[1.01]" 
                                            : "bg-transparent border-transparent hover:bg-white/40 hover:scale-[1.005]"
                                    }`}
                                >
                                    <div className={`p-3 rounded-xl shrink-0 transition-colors duration-300 ${
                                        isActive 
                                            ? "bg-[#fe7717] text-white" 
                                            : "bg-[#1C1B1B]/5 text-brand-dark/60"
                                    }`}>
                                        {feature.icon}
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <h3 className={`text-lg font-bold transition-colors duration-300 ${
                                            isActive ? "text-brand-dark" : "text-brand-dark/80"
                                        }`}>
                                            {feature.title}
                                        </h3>
                                        <p className={`text-xs font-semibold font-mono tracking-wide uppercase transition-colors duration-300 ${
                                            isActive ? "text-[#fe7717]" : "text-brand-teal"
                                        }`}>
                                            {feature.tagline}
                                        </p>
                                        <p className="text-sm text-secondary-text leading-relaxed mt-1">
                                            {feature.desc}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right Column: Live Mock UI Preview */}
                    <div className="lg:col-span-7 flex items-center justify-center relative min-h-125 lg:min-h-full">
                        <div className="w-full h-full bg-[#1C1B1B] border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col relative overflow-hidden shadow-2xl">
                            
                            {/* Inner Preview Window Shell */}
                            <div className="flex items-center gap-1.5 border-b border-white/10 pb-4 mb-6">
                                <span className="w-3.5 h-3.5 rounded-full bg-red-500/80" />
                                <span className="w-3.5 h-3.5 rounded-full bg-yellow-500/80" />
                                <span className="w-3.5 h-3.5 rounded-full bg-green-500/80" />
                                <span className="ml-4 font-mono text-xs text-white/40 tracking-wider">TRIPWISE_DASHBOARD_V4</span>
                            </div>

                            {/* PREVIEW CONTAINER 1: Smart Day-by-Day Scheduling */}
                            <div className={`flex flex-col flex-1 transition-all duration-500 ease-in-out absolute inset-x-6 md:inset-x-8 bottom-6 md:bottom-8 top-16 md:top-20 ${
                                activeTab === 0 ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
                            }`}>
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex flex-col">
                                        <span className="font-mono text-xs font-bold text-[#fe7717]">ACTIVE ITINERARY</span>
                                        <span className="text-xl font-extrabold text-white">Rome: Day 1 Exploration</span>
                                    </div>
                                    <span className="px-3 py-1 bg-brand-teal/20 text-brand-teal border border-brand-teal/30 rounded-full font-mono text-[10px] font-bold">14,200 STEPS EST.</span>
                                </div>

                                <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
                                    <div className="flex gap-4 relative">
                                        <div className="flex flex-col items-center">
                                            <div className="w-8 h-8 rounded-full bg-[#fe7717]/20 border border-[#fe7717]/40 flex items-center justify-center text-xs font-bold text-[#fe7717] z-10 shrink-0 font-mono">1</div>
                                            <div className="w-0.5 h-16 border-l border-dashed border-white/20 absolute top-8 left-4 -bottom-4" />
                                        </div>
                                        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="text-sm font-extrabold text-white leading-tight">Colosseum VIP Fast Track Tour</h4>
                                                <span className="font-mono text-[10px] font-bold text-white/50">09:30 AM</span>
                                            </div>
                                            <p className="text-xs text-white/60 leading-normal mb-2">Pre-booked skip-the-line entrance. Highly advised to visit before peak midday temperatures.</p>
                                            <div className="inline-flex items-center gap-1.5 text-[9px] font-bold text-green-400 bg-green-400/10 px-2.5 py-0.5 rounded-full w-fit uppercase font-mono">✓ Tickets Confirmed</div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 relative mt-2">
                                        <div className="flex flex-col items-center">
                                            <div className="w-8 h-8 rounded-full bg-brand-teal/20 border border-brand-teal/40 flex items-center justify-center text-xs font-bold text-brand-teal z-10 shrink-0 font-mono">2</div>
                                            <div className="w-0.5 h-16 border-l border-dashed border-white/20 absolute top-8 left-4 -bottom-4" />
                                        </div>
                                        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="text-sm font-extrabold text-white leading-tight">Lunch: Osteria da Fortunata</h4>
                                                <span className="font-mono text-[10px] font-bold text-white/50">12:45 PM</span>
                                            </div>
                                            <p className="text-xs text-white/60 leading-normal mb-2">Transit: 12-min walk from Forum Romanum. Hand-rolled strozzapreti pasta recommended.</p>
                                            <div className="inline-flex items-center gap-1.5 text-[9px] font-bold text-[#fe7717] bg-[#fe7717]/10 px-2.5 py-0.5 rounded-full w-fit uppercase font-mono">★ highly rated local spot</div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 relative mt-2">
                                        <div className="flex flex-col items-center">
                                            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-bold text-white/80 z-10 shrink-0 font-mono">3</div>
                                        </div>
                                        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="text-sm font-extrabold text-white leading-tight">Pantheon &amp; Piazza Navona</h4>
                                                <span className="font-mono text-[10px] font-bold text-white/50">03:00 PM</span>
                                            </div>
                                            <p className="text-xs text-white/60 leading-normal">Free entry. Explored in peak afternoon to take advantage of interior structural shade.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* PREVIEW CONTAINER 2: Local Hidden Gems */}
                            <div className={`flex flex-col flex-1 transition-all duration-500 ease-in-out absolute inset-x-6 md:inset-x-8 bottom-6 md:bottom-8 top-16 md:top-20 ${
                                activeTab === 1 ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
                            }`}>
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex flex-col">
                                        <span className="font-mono text-xs font-bold text-[#fe7717]">REAL-TIME CURATION</span>
                                        <span className="text-xl font-extrabold text-white">Hidden Gem Rerouting</span>
                                    </div>
                                    <span className="px-3 py-1 bg-[#fe7717]/20 text-[#fe7717] border border-[#fe7717]/30 rounded-full font-mono text-[10px] font-bold">120+ LOCAL CHEFS AGREE</span>
                                </div>

                                <div className="flex-1 flex flex-col md:grid md:grid-cols-2 gap-4 items-center">
                                    {/* Left: Tourist Trap Card */}
                                    <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col relative opacity-60">
                                        <div className="absolute top-3 right-3 px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded font-mono text-[8px] font-bold uppercase">Tourist Zone</div>
                                        <span className="text-xs font-bold font-mono text-white/40 mb-1">STANDARD RECOMMENDATION</span>
                                        <h4 className="text-base font-extrabold text-white mb-2 leading-tight">Caffè di Trevi</h4>
                                        <div className="flex items-center gap-1 mb-3">
                                            <span className="text-xs font-bold text-yellow-500">3.2 ★</span>
                                            <span className="text-white/40 text-[10px]">(850 reviews)</span>
                                        </div>
                                        <p className="text-xs text-white/50 leading-relaxed">
                                            "Overpriced, frozen carbonara. Charged €15 cover fee for simple table service near the monument."
                                        </p>
                                    </div>

                                    {/* Right: Hidden Gem Card */}
                                    <div className="w-full bg-white/5 border-2 border-brand-teal rounded-2xl p-5 flex flex-col relative shadow-xl shadow-brand-teal/5">
                                        <div className="absolute top-3 right-3 px-2 py-0.5 bg-brand-teal/20 text-brand-teal border border-brand-teal/30 rounded font-mono text-[8px] font-bold uppercase tracking-wider">Hidden Gem</div>
                                        <span className="text-xs font-bold font-mono text-brand-teal mb-1">TRIPWISE RECOMMENDS</span>
                                        <h4 className="text-base font-extrabold text-white mb-2 leading-tight">Osteria Romana</h4>
                                        <div className="flex items-center gap-1 mb-3">
                                            <span className="text-xs font-bold text-[#fe7717]">4.9 ★</span>
                                            <span className="text-white/40 text-[10px]">(64 locals voted)</span>
                                        </div>
                                        <p className="text-xs text-white/80 leading-relaxed">
                                            "Tucked in an alleyway 4 minutes away. Fresh hand-made pasta under €11, with complementary house wine."
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 p-3 bg-brand-teal/10 border border-brand-teal/20 rounded-xl flex items-center gap-3">
                                    <span className="text-lg">💡</span>
                                    <span className="text-xs text-white/80 leading-normal font-mono">
                                        Saved: <strong className="text-brand-teal font-extrabold">€45</strong> on dining costs &amp; cut queue waiting by <strong className="text-brand-teal font-extrabold">35 mins</strong>.
                                    </span>
                                </div>
                            </div>

                            {/* PREVIEW CONTAINER 3: Budget Optimization */}
                            <div className={`flex flex-col flex-1 transition-all duration-500 ease-in-out absolute inset-x-6 md:inset-x-8 bottom-6 md:bottom-8 top-16 md:top-20 ${
                                activeTab === 2 ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
                            }`}>
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex flex-col">
                                        <span className="font-mono text-xs font-bold text-[#fe7717]">FINANCIAL FORECASTING</span>
                                        <span className="text-xl font-extrabold text-white">Smart Budget Monitor</span>
                                    </div>
                                    <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full font-mono text-[10px] font-bold">$340 SAVED</span>
                                </div>

                                <div className="flex-1 flex flex-col md:grid md:grid-cols-12 gap-6 items-center">
                                    {/* Left: Progress ring metric */}
                                    <div className="md:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center text-center w-full h-full">
                                        <div className="relative w-28 h-28 flex items-center justify-center mb-3">
                                            {/* Outer progress path SVG */}
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle cx="56" cy="56" r="46" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" />
                                                <circle cx="56" cy="56" r="46" stroke="#0D9488" strokeWidth="8" fill="transparent" strokeDasharray="289" strokeDashoffset="46" />
                                            </svg>
                                            <div className="absolute flex flex-col items-center justify-center">
                                                <span className="text-xl font-black text-white font-mono">84%</span>
                                                <span className="text-[9px] font-bold text-white/40 uppercase">Spent</span>
                                            </div>
                                        </div>
                                        <span className="text-sm font-extrabold text-white">$1,680 / $2,000</span>
                                    </div>

                                    {/* Right: Categorical analysis */}
                                    <div className="md:col-span-7 flex flex-col gap-3.5 w-full">
                                        {[
                                            { name: "Hotels & Stays", amount: "$800", pct: "85%", color: "bg-brand-teal" },
                                            { name: "Flights & Transit", amount: "$520", pct: "90%", color: "bg-[#fe7717]" },
                                            { name: "Local Meals & Food", amount: "$360", pct: "72%", color: "bg-yellow-500" }
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex flex-col gap-1.5">
                                                <div className="flex justify-between items-center text-xs font-bold">
                                                    <span className="text-white/80">{item.name}</span>
                                                    <span className="text-white font-mono">{item.amount}</span>
                                                </div>
                                                <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                    <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: item.pct }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-4 p-3 bg-[#fe7717]/10 border border-[#fe7717]/20 rounded-xl flex items-center gap-3">
                                    <span className="text-lg">💰</span>
                                    <span className="text-xs text-white/85 leading-normal font-mono">
                                        <strong>Cost Alert</strong>: Switching the Rome $\rightarrow$ Florence train from 05:00 PM to 08:30 PM saves <strong className="text-[#fe7717] font-extrabold">$55</strong>. Apply automatically?
                                    </span>
                                </div>
                            </div>

                            {/* PREVIEW CONTAINER 4: Flight & Hotel Integration */}
                            <div className={`flex flex-col flex-1 transition-all duration-500 ease-in-out absolute inset-x-6 md:inset-x-8 bottom-6 md:bottom-8 top-16 md:top-20 ${
                                activeTab === 3 ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
                            }`}>
                                <div className="flex justify-between items-center mb-5">
                                    <div className="flex flex-col">
                                        <span className="font-mono text-xs font-bold text-[#fe7717]">SYSTEM SYNC</span>
                                        <span className="text-xl font-extrabold text-white">Live Booking Voucher</span>
                                    </div>
                                    <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full font-mono text-[10px] font-bold">ON TIME</span>
                                </div>

                                <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
                                    {/* Mock Flight Boarding Pass */}
                                    <div className="w-full bg-[#FFF8F5] text-brand-dark rounded-2xl overflow-hidden shadow-lg border border-white/10 flex flex-col">
                                        <div className="bg-[#1C1B1B] text-[#fe7717] px-4 py-2 border-b border-white/5 flex justify-between items-center">
                                            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">BOARDING PASS SYNC</span>
                                            <span className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded font-mono text-[8px] font-bold">LIVE STATUS</span>
                                        </div>
                                        <div className="p-4 flex justify-between items-center gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-2xl font-black font-sans leading-none tracking-tight">JFK</span>
                                                <span className="text-[9px] font-bold text-secondary-text uppercase mt-1 leading-none">New York</span>
                                            </div>
                                            
                                            {/* Airplane Connector SVG */}
                                            <div className="flex-1 flex items-center justify-center relative">
                                                <div className="w-full border-t border-dashed border-brand-dark/20" />
                                                <div className="absolute bg-[#FFF8F5] px-2 text-[#fe7717]">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 transform rotate-90">
                                                        <path d="M21 16V8a2 2 0 0 0-2-2h-5L9 2H7v4H4L2 8v2h2l5 4v4l-3 2v1h8v-1l-3-2v-4l5-4h2a2 2 0 0 1 2 2v8h2z" />
                                                    </svg>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end">
                                                <span className="text-2xl font-black font-sans leading-none tracking-tight">FCO</span>
                                                <span className="text-[9px] font-bold text-secondary-text uppercase mt-1 leading-none">Rome</span>
                                            </div>
                                        </div>
                                        <div className="px-4 pb-4 grid grid-cols-3 gap-2 border-t border-brand-dark/5 pt-3">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-bold text-secondary-text uppercase">Flight</span>
                                                <span className="text-xs font-extrabold text-brand-dark font-mono mt-0.5">AZ-405</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-bold text-secondary-text uppercase">Gate</span>
                                                <span className="text-xs font-extrabold text-brand-dark font-mono mt-0.5">G12</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[8px] font-bold text-secondary-text uppercase">Seat</span>
                                                <span className="text-xs font-extrabold text-[#fe7717] font-mono mt-0.5">14A</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mock Hotel Booking */}
                                    <div className="w-full bg-[#FFF8F5] text-brand-dark rounded-2xl overflow-hidden shadow-lg border border-white/10 flex flex-col">
                                        <div className="p-4 flex justify-between items-center gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-bold text-brand-teal uppercase font-mono tracking-wider">BOOKING CONFIRMED</span>
                                                <h4 className="text-base font-black text-brand-dark mt-0.5 tracking-tight">Hotel Quirinale Rome</h4>
                                                <span className="text-[10px] font-bold text-secondary-text mt-1">Check-in: Today at 14:00</span>
                                            </div>
                                            <span className="w-10 h-10 rounded-full bg-brand-teal/10 flex items-center justify-center text-[#fe7717] text-lg font-bold shrink-0">🛎️</span>
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