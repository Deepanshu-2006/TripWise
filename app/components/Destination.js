'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function Destination() {
    const containerRef = useRef(null);
    const [sliderPos, setSliderPos] = useState(20); // starts at 20% on load
    const [isRevealed, setIsRevealed] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [headerVisible, setHeaderVisible] = useState(false);

    // Dynamic state values for the counting stats
    const [daysPlanned, setDaysPlanned] = useState(0);
    const [stopsAdded, setStopsAdded] = useState(0);
    const [timeTaken, setTimeTaken] = useState("0.0");

    // Typewriter state
    const [typedText, setTypedText] = useState("");

    // Initial load animation: divider starts at 20%, pauses 600ms, then slides smoothly to 50% using spring deceleration
    useEffect(() => {
        setHeaderVisible(true);

        const timer = setTimeout(() => {
            let currentVal = 20;
            const targetVal = 50;

            const tick = () => {
                const diff = targetVal - currentVal;
                if (Math.abs(diff) > 0.05) {
                    currentVal += diff * 0.06; // Approaching the target gradually by moving 6% of the remaining distance per frame
                    setSliderPos(currentVal);
                    requestAnimationFrame(tick);
                } else {
                    setSliderPos(targetVal);
                }
            };
            requestAnimationFrame(tick);
        }, 600);

        return () => clearTimeout(timer);
    }, []);

    // Watch slider position to trigger reveals once right side opens past 40% (sliderPos < 60)
    useEffect(() => {
        if (sliderPos < 60 && !isRevealed) {
            setIsRevealed(true);
        }
    }, [sliderPos, isRevealed]);

    // Typewriter effect sequence
    useEffect(() => {
        if (!isRevealed) return;

        const fullText = "10 days in Italy, mix of history and food";
        let idx = 0;

        const interval = setInterval(() => {
            idx++;
            setTypedText(fullText.substring(0, idx));
            if (idx >= fullText.length) {
                clearInterval(interval);
            }
        }, 60);

        return () => clearInterval(interval);
    }, [isRevealed]);

    // Ticking stat counters triggered by the reveal, running over 1200ms total
    useEffect(() => {
        if (!isRevealed) return;

        const duration = 1200;
        const start = performance.now();

        const tickStats = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);

            // Days planned (0 to 10)
            setDaysPlanned(Math.floor(progress * 10));

            // Stops added (0 to 24 in steps of 2)
            const rawStops = Math.floor(progress * 24);
            setStopsAdded(Math.floor(rawStops / 2) * 2);

            // Time taken (counts up to 1.2s)
            setTimeTaken((progress * 1.2).toFixed(1));

            if (progress < 1) {
                requestAnimationFrame(tickStats);
            } else {
                setDaysPlanned(10);
                setStopsAdded(24);
                setTimeTaken("1.2");
            }
        };

        requestAnimationFrame(tickStats);
    }, [isRevealed]);

    // Drag calculation handlers (mouse/touch)
    const handleMove = (clientX) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        let percentage = (x / rect.width) * 100;

        // Minimum position is 5%, maximum position is 95%
        if (percentage < 5) percentage = 5;
        if (percentage > 95) percentage = 95;
        setSliderPos(percentage);
    };

    const handleMouseDown = () => {
        setIsDragging(true);
    };

    const handleTouchStart = () => {
        setIsDragging(true);
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            handleMove(e.clientX);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        const handleTouchMove = (e) => {
            if (!isDragging) return;
            if (e.touches && e.touches[0]) {
                handleMove(e.touches[0].clientX);
            }
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleTouchMove);
            window.addEventListener('touchend', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, [isDragging]);

    return (
        <section className="relative w-full flex flex-col items-center justify-center select-none font-sans py-12 md:py-16 px-4 md:px-8 border-t border-brand-dark/5 bg-transparent animate-fade-in">
            {/* Embedded styles for alternate tab jitter, blinking typewriter cursor, slow sticky notes wobble, and clicking frantic cursor */}
            <style>{`
                @keyframes tab-jitter {
                    0%, 100% { transform: translate(0, 0); }
                    20% { transform: translate(-2px, 0); }
                    60% { transform: translate(2px, 0); }
                }
                .animate-tab-jitter {
                    animation: tab-jitter 0.12s linear infinite;
                }
                @keyframes cursor-blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
                .animate-cursor-blink {
                    animation: cursor-blink 0.7s step-end infinite;
                }
                @keyframes dot-pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(0.9); }
                }
                .animate-dot-pulse {
                    animation: dot-pulse 1.2s ease-in-out infinite;
                }
                @keyframes wobble-yellow {
                    0%, 100% { transform: rotate(-3deg); }
                    50% { transform: rotate(-5deg); }
                }
                @keyframes wobble-pink {
                    0%, 100% { transform: rotate(2deg); }
                    50% { transform: rotate(0deg); }
                }
                @keyframes wobble-blue {
                    0%, 100% { transform: rotate(-1.5deg); }
                    50% { transform: rotate(-3.5deg); }
                }
                .animate-wobble-yellow { animation: wobble-yellow 4s ease-in-out infinite; }
                .animate-wobble-pink { animation: wobble-pink 4.2s ease-in-out infinite; }
                .animate-wobble-blue { animation: wobble-blue 3.8s ease-in-out infinite; }

                @keyframes frantic-cursor {
                    0%, 100% { left: 25%; top: 35%; transform: scale(1); }
                    14% { left: 25%; top: 35%; transform: scale(0.8); }
                    16% { left: 70%; top: 25%; transform: scale(1); }
                    30% { left: 70%; top: 25%; transform: scale(0.8); }
                    32% { left: 40%; top: 75%; transform: scale(1); }
                    46% { left: 40%; top: 75%; transform: scale(0.8); }
                    48% { left: 60%; top: 50%; transform: scale(1); }
                    62% { left: 60%; top: 50%; transform: scale(0.8); }
                    64% { left: 15%; top: 60%; transform: scale(1); }
                    78% { left: 15%; top: 60%; transform: scale(0.8); }
                    80% { left: 55%; top: 40%; transform: scale(1); }
                    95% { left: 55%; top: 40%; transform: scale(0.8); }
                }
                .animate-frantic-cursor {
                    animation: frantic-cursor 3.2s infinite;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

            {/* Centered Heading */}
            <div
                className={`text-center mb-10 md:mb-12 transition-all duration-1000 transform shrink-0 flex flex-col items-center ${
                    headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
                }`}
            >
                {/* Micro badge */}
                <span className="text-[10px] font-bold text-[#FF5B1D] tracking-[0.25em] uppercase mb-3 leading-none select-none">
                    The TripWise Difference
                </span>
                
                <h2 className="text-3xl md:text-[32px] font-semibold text-brand-dark tracking-tight leading-none">
                    Trip planning, <span className="text-[#FF5B1D] font-extrabold relative inline-block">reimagined</span>
                </h2>

                {/* Subtitle pill badge */}
                <div className="inline-flex items-center gap-1.5 mt-3.5 px-3 py-1 bg-[#FF5B1D]/5 border border-[#FF5B1D]/10 text-[#FF5B1D] rounded-full text-xs font-semibold tracking-wide select-none shadow-sm">
                    <span className="animate-pulse">↔</span>
                    <span>Drag the slider to compare</span>
                </div>
            </div>

            {/* 500px Fixed Height Split Canvas */}
            <div
                ref={containerRef}
                className="relative w-full max-w-5xl h-[500px] rounded-3xl overflow-hidden border border-brand-dark/10 bg-transparent"
            >
                
                {/* ========================================================
                    LEFT SIDE: THE OLD WAY (Chaotic Red-Black Slate)
                   ======================================================== */}
                <div className="absolute inset-0 w-full h-full bg-[#1a0f0f] flex items-center justify-center p-4 md:p-8 overflow-hidden select-none z-10">
                    
                    {/* Floating label badge */}
                    <div className="absolute top-4 left-4 z-40 px-3 py-1 bg-[#7f1d1d] text-[#fca5a5] rounded-full font-mono text-[9px] font-black uppercase tracking-widest leading-none">
                        The old way
                    </div>

                    {/* Browser Mockup Window */}
                    <div className="relative w-full max-w-lg bg-white border border-red-950/20 rounded-2xl shadow-2xl flex flex-col h-[82%] z-20 overflow-hidden transform rotate-[-0.8deg]">
                        
                        {/* Browser Tab Bar */}
                        <div className="flex flex-col bg-[#2d1515] p-2 shrink-0 border-b border-red-950/20 select-none">
                            <div className="flex gap-1.5 items-center px-1 mb-2">
                                <span className="w-2 h-2 rounded-full bg-red-400" />
                                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                                <span className="w-2 h-2 rounded-full bg-green-400" />
                            </div>
                            
                            {/* Browser Tabs list */}
                            <div className="flex gap-1 items-end overflow-x-auto no-scrollbar px-1">
                                {[
                                    { title: 'Flights - Google', active: true, jitter: false },
                                    { title: 'Hotels.com', active: false, jitter: true },
                                    { title: 'TripAdvisor', active: false, jitter: false },
                                    { title: 'Rome things to do', active: false, jitter: true },
                                    { title: 'Currency', active: false, jitter: false },
                                    { title: '+8 more', active: false, jitter: true }
                                ].map((tab, idx) => (
                                    <div
                                        key={idx}
                                        className={`px-2.5 py-1 rounded-t-[6px] font-mono text-[9px] font-bold border-t border-x leading-none shrink-0 truncate max-w-[85px] cursor-default flex items-center justify-between ${
                                            tab.active 
                                                ? 'bg-white border-red-950/15 text-red-700 h-[24px]' 
                                                : 'bg-[#402020] border-transparent text-red-200/50 h-[20px]'
                                        } ${tab.jitter ? 'animate-tab-jitter' : ''}`}
                                    >
                                        <span>{tab.title}</span>
                                        <span className="ml-1 opacity-35 hover:opacity-100 font-sans text-[7px]">×</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Browser Address URL Mock */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FCFAF7] border-b border-red-950/10 text-[8.5px] font-mono shrink-0 select-none text-red-950/30">
                            <span>🔒</span>
                            <span className="flex-1 bg-white border border-red-950/10 rounded px-1.5 py-0.5 text-red-950/50 truncate">
                                https://www.google.com/search?q=rome+travel+planning+stressful
                            </span>
                        </div>

                        {/* Google Doc Format Editor Ribbon */}
                        <div className="flex gap-2.5 px-3 py-1 bg-[#FAF8F5] border-b border-brand-dark/10 text-[8px] font-mono text-brand-dark/40 select-none items-center shrink-0">
                            <span className="font-bold border-r border-brand-dark/10 pr-2">File</span>
                            <span>Edit</span>
                            <span>View</span>
                            <span className="hidden sm:inline">Insert</span>
                            <span className="hidden sm:inline">Format</span>
                            <span className="bg-white border border-brand-dark/10 rounded px-1 text-brand-dark/50 font-sans text-[7.5px] py-0.5 ml-auto leading-none">
                                Arial ➔ 11pt
                            </span>
                        </div>

                        {/* Browser main content area (Messy Google Doc) */}
                        <div className="flex-1 p-3.5 bg-white overflow-hidden relative flex flex-col text-brand-dark">
                            <div className="border-b border-brand-dark/10 pb-1.5 mb-2 flex justify-between items-center select-none">
                                <span className="font-sans font-bold text-[10px] text-brand-dark/65">📄 Italy Trip Notes.doc</span>
                                <span className="text-[7.5px] text-brand-dark/30 font-mono">3 days ago</span>
                            </div>

                            <ul className="list-none pl-1.5 text-[11px] leading-relaxed flex flex-col gap-1.5 font-serif select-none">
                                <li className="line-through text-brand-dark/35">Book flights early (?)</li>
                                <li className="text-brand-dark/85">Hotel near colosseum??? check price</li>
                                <li className="text-red-600 font-extrabold tracking-wide">WHERE IS PASSPORT</li>
                                <li className="line-through text-brand-dark/35">Day 1 - Rome - Day 2 - Florence??</li>
                                <li className="text-brand-dark/85 font-black">Budget: $1000? $2000? idk</li>
                            </ul>

                            <div className="mt-auto border-t border-brand-dark/5 pt-1.5 text-[8.5px] text-brand-dark/35 italic select-none">
                                Last edited 3 days ago...
                            </div>
                        </div>
                    </div>

                    {/* Three absolute Sticky Notes with frosted paper tapes */}
                    <div className="absolute top-[12%] right-[10%] w-24 h-24 bg-[#FEF08A] border border-yellow-300 shadow-md p-3 z-30 font-mono text-[9px] text-yellow-900 leading-tight select-none animate-wobble-yellow">
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-3.5 bg-white/20 border border-white/10 backdrop-blur-[1px] rotate-[-2deg]" />
                        <span>check visa?? need photos</span>
                    </div>

                    <div className="absolute bottom-[20%] right-[6%] w-24 h-24 bg-[#FECDD3] border border-pink-300 shadow-md p-3 z-30 font-mono text-[9px] text-pink-900 leading-tight select-none animate-wobble-pink">
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-3.5 bg-white/20 border border-white/10 backdrop-blur-[1px] rotate-[3deg]" />
                        <span>hotel near colosseum?</span>
                    </div>

                    <div className="absolute bottom-[10%] left-[6%] w-24 h-24 bg-[#BFDBFE] border border-blue-300 shadow-md p-3 z-30 font-mono text-[9px] text-blue-900 leading-tight select-none animate-wobble-blue">
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-3.5 bg-white/20 border border-white/10 backdrop-blur-[1px] rotate-[-1deg]" />
                        <span>budget ??? too much!!</span>
                    </div>

                    {/* Frantic mouse cursor SVG with click pulse element */}
                    <div className="absolute pointer-events-none z-30 animate-frantic-cursor select-none" style={{ width: '20px', height: '20px' }}>
                        <span className="absolute -left-1 -top-1 w-5 h-5 rounded-full border border-red-500 bg-red-500/10 animate-ping opacity-75" />
                        <svg viewBox="0 0 24 24" className="w-full h-full fill-red-600 drop-shadow-[0_2px_6px_rgba(220,38,38,0.4)]">
                            <path d="M4 2 L22 12 L14 14 L20 20 L17 22 L11 16 L4 20 Z" />
                        </svg>
                    </div>
                </div>

                {/* ========================================================
                    RIGHT SIDE: WITH TRIPWISE (Clip-path Reveal Gradient)
                   ======================================================== */}
                <div
                    className="absolute inset-0 w-full h-full bg-[#f0f4ff] flex flex-col justify-between p-4 md:p-6 overflow-hidden select-none z-20"
                    style={{
                        clipPath: `inset(0 0 0 ${sliderPos}%)`
                    }}
                >
                    {/* Badge */}
                    <div className="absolute top-4 right-4 z-40 px-3 py-1 bg-[#FF5B1D] text-white rounded-full font-mono text-[9px] font-black uppercase tracking-widest leading-none">
                        With TripWise
                    </div>

                    {/* Dashboard Layout panels */}
                    <div className="w-full max-w-xl mx-auto flex flex-col gap-3.5 mt-6 select-none">
                        
                        {/* 1. Search Bar Card */}
                        <div className="w-full bg-white border border-[#FF5B1D]/10 rounded-[10px] py-2.5 px-3.5 flex items-center gap-3 shadow-sm shrink-0 select-none">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5B1D] shrink-0" />
                            <p className="font-mono text-xs font-bold leading-none text-brand-dark flex items-center select-none">
                                <span>{typedText}</span>
                                <span className="ml-0.5 inline-block w-1 h-3.5 bg-[#FF5B1D] animate-cursor-blink" />
                            </p>
                        </div>

                        {/* 2. AI Status line */}
                        <div className="flex items-center gap-2 px-1 select-none shrink-0">
                            <span className="w-2 h-2 rounded-full bg-[#FF5B1D] animate-dot-pulse shrink-0" />
                            <span className="font-mono text-[11px] font-bold text-[#FF5B1D] tracking-wide uppercase leading-none">
                                AI building your itinerary...
                            </span>
                        </div>

                        {/* 3. Three Itinerary day cards stacked */}
                        <div className="flex flex-col gap-2.5 select-none shrink-0">
                            {[
                                { d: 'D1', title: 'Rome — Colosseum and Forum', sub: '9am Colosseum · 1pm Palatine Hill · 7pm Trastevere dinner', delay: 100 },
                                { d: 'D2', title: 'Florence — Art and architecture', sub: 'Uffizi Gallery · Ponte Vecchio · local trattoria', delay: 350 },
                                { d: 'D3', title: 'Amalfi Coast — scenic drive', sub: 'Positano · Ravello viewpoint · sunset at Amalfi', delay: 600 }
                            ].map((card, idx) => (
                                <div
                                    key={idx}
                                    className={`bg-white border border-brand-dark/5 border-l-[3px] border-l-[#FF5B1D] rounded-[10px] py-2.5 px-3.5 flex items-center justify-between shadow-sm transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-md hover:border-l-4 hover:border-l-[#FF5B1D] ${
                                        isRevealed 
                                            ? 'opacity-100 translate-y-0' 
                                            : 'opacity-0 translate-y-4 pointer-events-none'
                                    }`}
                                    style={{
                                        transitionDelay: isRevealed ? `${card.delay}ms` : '0ms'
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Day label badge */}
                                        <div className="w-6 h-6 rounded bg-orange-500/10 flex items-center justify-center font-mono text-[10px] font-black text-[#FF5B1D]">
                                            {card.d}
                                        </div>
                                        <div className="flex flex-col select-none">
                                            <span className="text-[12px] font-medium text-brand-dark leading-tight">{card.title}</span>
                                            <span className="text-[10px] text-brand-dark/45 mt-0.5 leading-none">{card.sub}</span>
                                        </div>
                                    </div>
                                    <span className="px-1.5 py-0.5 bg-green-500/10 text-green-600 rounded font-mono text-[7px] font-black tracking-widest leading-none uppercase flex items-center gap-1 select-none">
                                        <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                                        Ready
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* 4. Row of three equal stat boxes */}
                        <div className="grid grid-cols-3 gap-3.5 select-none mt-1.5 shrink-0">
                            {[
                                { val: daysPlanned, label: 'Days planned' },
                                { val: stopsAdded, label: 'Stops added' },
                                { val: `${timeTaken}s`, label: 'Time taken' }
                            ].map((stat, idx) => (
                                <div
                                    key={idx}
                                    className={`bg-white border border-brand-dark/5 rounded-[10px] p-3.5 flex flex-col justify-center items-center shadow-sm text-center hover:border-[#FF5B1D]/30 transition-all duration-300 hover:scale-[1.02] cursor-default transform ${
                                        isRevealed 
                                            ? 'opacity-100 translate-y-0' 
                                            : 'opacity-0 translate-y-4 pointer-events-none'
                                    }`}
                                    style={{
                                        transitionDelay: isRevealed ? `${750 + idx * 100}ms` : '0ms'
                                    }}
                                >
                                    <span className="text-xl md:text-2xl font-black text-[#FF5B1D] font-mono leading-none tracking-tight">
                                        {stat.val}
                                    </span>
                                    <span className="text-[8.5px] font-mono font-bold text-brand-dark/40 uppercase tracking-wide mt-1.5 leading-none">
                                        {stat.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* INTERACTIVE DIVIDER CONTAINER (Wider target area for easier touch & click dragging) */}
                <div
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                    className="absolute top-0 bottom-0 w-8 -ml-4 z-30 cursor-ew-resize flex items-center justify-center pointer-events-auto"
                    style={{
                        left: `${sliderPos}%`
                    }}
                >
                    {/* Visible 3px Divider Line */}
                    <div className={`w-[3px] h-full transition-all duration-200 ${
                        isDragging ? 'bg-[#FF5B1D] shadow-[0_0_12px_rgba(255,91,29,0.6)]' : 'bg-white'
                    }`} />

                    {/* Drag Handle Circular Button */}
                    <div className={`absolute w-10 h-10 bg-white border rounded-full flex items-center justify-center pointer-events-none z-40 transition-all duration-200 ${
                        isDragging ? 'border-[#FF5B1D] scale-105 shadow-[#FF5B1D]/20 shadow-lg' : 'border-gray-200 shadow-md'
                    }`}>
                        {/* Gray chevron arrows left/right */}
                        <svg viewBox="0 0 24 24" className={`w-5 h-5 fill-none transition-colors duration-200 ${
                            isDragging ? 'stroke-[#FF5B1D]' : 'stroke-gray-400'
                        }`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M 8 16 L 4 12 L 8 8 M 16 16 L 20 12 L 16 8" />
                        </svg>
                    </div>
                </div>

            </div>
        </section>
    );
}