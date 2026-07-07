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

    // Sync animated plane position with highlight state of itinerary cards D1, D2, D3
    const [activeItineraryNode, setActiveItineraryNode] = useState(0);

    useEffect(() => {
        if (!isRevealed) return;
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = (Date.now() - startTime) % 4200;
            if (elapsed < 1400) {
                setActiveItineraryNode(0);
            } else if (elapsed < 2800) {
                setActiveItineraryNode(1);
            } else {
                setActiveItineraryNode(2);
            }
        }, 50);
        return () => clearInterval(interval);
    }, [isRevealed]);

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
        <section id="ai-planner" className="relative w-full flex flex-col items-center justify-center select-none font-sans py-12 md:py-16 px-4 md:px-8 border-t mt-5 border-brand-dark/5 bg-transparent animate-fade-in">
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
                @keyframes plane-flight-vertical {
                    0% { transform: translateY(-10px) rotate(180deg); opacity: 0; }
                    8% { opacity: 1; }
                    92% { opacity: 1; }
                    100% { transform: translateY(180px) rotate(180deg); opacity: 0; }
                }
            `}</style>

            {/* Centered Heading */}
            <div
                className={`text-center mb-10 md:mb-12 transition-all duration-1000 transform shrink-0 flex flex-col items-center ${
                    headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
                }`}
            >
                {/* Spaced Micro-Badge */}
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-orange-500/10 text-[#FF5B1D] rounded-full font-mono text-[12px] font-black tracking-widest uppercase mb-3.5 shadow-sm border border-orange-500/5 select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF5B1D] animate-pulse" />
                    TripWise Experience
                </div>
                
                <h2 className="text-3xl md:text-4xl font-bold text-brand-dark tracking-tight leading-none font-serif uppercase">
                    Trip planning,  <span className="relative inline-block text-[#FF5B1D] select-none text-3xl md:text-4xl normal-case font-serif italic font-bold">
                        reimagined
                        <svg className="absolute -bottom-1 left-0 w-full h-1 text-[#FF5B1D]/560" viewBox="0 0 100 10" preserveAspectRatio="none">
                            <path d="M0,5 C30,9 70,2 100,6" stroke="currentColor" strokeWidth="8" strokeLinecap="round" fill="none" />
                        </svg>
                    </span>
                </h2>

                <p className="text-xs md:text-sm text-brand-dark/50 max-w-md mt-4 tracking-wide select-none leading-relaxed">
                    Drag the slider to compare the chaotic manual way of planning a trip with the streamlined simplicity of TripWise AI.
                </p>
            </div>

            {/* 500px Fixed Height Split Canvas */}
            <div
                ref={containerRef}
                className="relative w-full max-w-5xl h-125 rounded-3xl overflow-hidden border border-brand-dark/10 bg-transparent"
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
                                        className={`px-2.5 py-1 rounded-t-md font-mono text-[9px] font-bold border-t border-x leading-none shrink-0 truncate max-w-21.25 cursor-default flex items-center justify-between ${
                                            tab.active 
                                                ? 'bg-white border-red-950/15 text-red-700 h-6' 
                                                : 'bg-[#402020] border-transparent text-red-200/50 h-5'
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
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-3.5 bg-white/20 border border-white/10 backdrop-blur-[1px] -rotate-2" />
                        <span>check visa?? need photos</span>
                    </div>

                    <div className="absolute bottom-[20%] right-[6%] w-24 h-24 bg-[#FECDD3] border border-pink-300 shadow-md p-3 z-30 font-mono text-[9px] text-pink-900 leading-tight select-none animate-wobble-pink">
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-3.5 bg-white/20 border border-white/10 backdrop-blur-[1px] rotate-3" />
                        <span>hotel near colosseum?</span>
                    </div>

                    <div className="absolute bottom-[10%] left-[6%] w-24 h-24 bg-[#BFDBFE] border border-blue-300 shadow-md p-3 z-30 font-mono text-[9px] text-blue-900 leading-tight select-none animate-wobble-blue">
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-3.5 bg-white/20 border border-white/10 backdrop-blur-[1px] -rotate-1" />
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
                        <div className="w-full bg-white border border-[#FF5B1D]/15 rounded-[10px] py-2 px-3 flex items-center justify-between shadow-sm shrink-0 select-none">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-2 h-2 rounded-full bg-[#FF5B1D] shrink-0 animate-pulse" />
                                <p className="font-mono text-xs font-bold leading-none text-brand-dark flex items-center select-none truncate">
                                    <span>{typedText}</span>
                                    <span className="ml-0.5 inline-block w-1.5 h-3.5 bg-[#FF5B1D] animate-cursor-blink" />
                                </p>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-white bg-[#FF5B1D] px-3 py-2 rounded-md leading-none shrink-0 uppercase select-none shadow-sm">
                                Generate
                            </span>
                        </div>

                        {/* 2. AI Status line - Cinematic Centered Divider with pulsing dot */}
                        <div className="w-full flex items-center justify-center gap-3.5 select-none shrink-0 py-1.5">
                            <div className="flex-1 h-px bg-brand-dark/10" />
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5B1D] animate-dot-pulse shrink-0 shadow-[0_0_8px_rgba(255,91,29,0.8)]" />
                                <span className="font-mono text-[10px] font-black text-[#FF5B1D] tracking-[0.2em] uppercase leading-none">
                                    AI building your itinerary
                                </span>
                            </div>
                            <div className="flex-1 h-px bg-brand-dark/10" />
                        </div>

                        {/* 3. Three Itinerary day cards stacked with route strip timeline */}
                        <div className="relative flex flex-col gap-3 select-none shrink-0 pl-7">
                            
                            {/* Dotted Route Line Connector between day nodes */}
                            <div className="absolute left-2.75 top-3.5 bottom-3.5 w-0.5 pointer-events-none z-0">
                                <div className="w-full h-full border-l-2 border-dashed border-[#FF5B1D]/25" />
                                {isRevealed && (
                                    <div 
                                        className="absolute -left-1.75 -top-2 pointer-events-none"
                                        style={{
                                            animation: 'plane-flight-vertical 4.2s linear infinite',
                                        }}
                                    >
                                        <svg viewBox="-20 0 56 78" fill="#FF5B1D" className="w-4 h-6 drop-shadow-[0_2px_4px_rgba(255,91,29,0.5)]">
                                            <path d="M0 34 L8 0 L16 34 L34 44 L34 52 L16 46 L13 64 L21 70 L21 76 L8 70 L-5 76 L-5 70 L3 64 L0 46 L-18 52 L-18 44 Z" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {[
                                { 
                                    d: 'D1', 
                                    title: 'Rome — Colosseum and Forum', 
                                    sub: '9am Colosseum · 1pm Palatine Hill · 7pm Trastevere dinner', 
                                    delay: 100,
                                    icon: (
                                        <svg className="w-3 h-3 text-[#FF5B1D] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    )
                                },
                                { 
                                    d: 'D2', 
                                    title: 'Florence — Art and architecture', 
                                    sub: 'Uffizi Gallery · Ponte Vecchio · local trattoria', 
                                    delay: 350,
                                    icon: (
                                        <svg className="w-3 h-3 text-[#FF5B1D] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.187L15 15l-5.187.904z" />
                                        </svg>
                                    )
                                },
                                { 
                                    d: 'D3', 
                                    title: 'Amalfi Coast — scenic drive', 
                                    sub: 'Positano · Ravello viewpoint · sunset at Amalfi', 
                                    delay: 600,
                                    icon: (
                                        <svg className="w-3 h-3 text-[#FF5B1D] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    )
                                }
                            ].map((card, idx) => {
                                const isNodeActive = isRevealed && activeItineraryNode === idx;
                                return (
                                    <div
                                        key={idx}
                                        className={`relative flex items-center justify-between transition-all duration-300 transform ${
                                            isRevealed 
                                                ? 'opacity-100 translate-y-0' 
                                                : 'opacity-0 translate-y-4 pointer-events-none'
                                        }`}
                                        style={{
                                            transitionDelay: isRevealed ? `${card.delay}ms` : '0ms'
                                        }}
                                    >
                                        {/* Left Node Badge (Aligned exactly over dotted line, highlights as plane passes) */}
                                        <div className={`absolute -left-7 w-6 h-6 rounded flex items-center justify-center font-mono text-[9px] font-black shrink-0 z-10 shadow-sm transition-all duration-300 ${
                                            isNodeActive
                                                ? 'bg-[#FF5B1D] text-white border border-[#FF5B1D] scale-110 shadow-[0_0_8px_rgba(255,91,29,0.5)]'
                                                : 'bg-orange-500/15 text-[#FF5B1D] border border-[#FF5B1D]/20'
                                        }`}>
                                            {card.d}
                                        </div>

                                        {/* Main Card (Highlights to simulate hover state as plane passes) */}
                                        <div className={`flex-1 rounded-[10px] py-2.5 px-3.5 flex items-center justify-between transition-all duration-300 ${
                                            isNodeActive
                                                ? 'bg-orange-500/1.5 border border-[#FF5B1D]/25 -translate-y-0.5 shadow-md shadow-orange-500/5'
                                                : 'bg-white border border-brand-dark/5 shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:border-[#FF5B1D]/20'
                                        }`}>
                                            <div className="flex flex-col select-none">
                                                <span className={`text-[12px] text-brand-dark leading-tight transition-all duration-300 ${isNodeActive ? 'font-black' : 'font-semibold'}`}>{card.title}</span>
                                                <span className="text-[10px] text-brand-dark/45 mt-1 leading-none flex items-center gap-1.5">
                                                    {card.icon}
                                                    <span>{card.sub}</span>
                                                </span>
                                            </div>
                                            <span className="px-1.5 py-0.5 bg-green-500/10 text-green-600 rounded font-mono text-[7px] font-black tracking-widest leading-none uppercase flex items-center gap-1 select-none shrink-0 ml-2">
                                                <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                                                Ready
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* 4. Row of three equal stat boxes - Premium Dark treatment with icons above values */}
                        <div className="grid grid-cols-3 gap-3.5 select-none mt-1.5 shrink-0">
                            {[
                                { 
                                    val: daysPlanned, 
                                    label: 'Days planned',
                                    icon: (
                                        <svg className="w-4 h-4 text-[#FF5B1D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    )
                                },
                                { 
                                    val: stopsAdded, 
                                    label: 'Stops added',
                                    icon: (
                                        <svg className="w-4 h-4 text-[#FF5B1D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    )
                                },
                                { 
                                    val: `${timeTaken}s`, 
                                    label: 'Time taken',
                                    icon: (
                                        <svg className="w-4 h-4 text-[#FF5B1D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    )
                                }
                            ].map((stat, idx) => (
                                <div
                                    key={idx}
                                    className={`bg-[#141312] border border-white/10 rounded-[10px] py-3.5 px-2 flex flex-col justify-center items-center text-center hover:border-[#FF5B1D]/45 transition-all duration-300 hover:scale-[1.02] cursor-default transform  ${
                                        isRevealed 
                                            ? 'opacity-100 translate-y-0' 
                                            : 'opacity-0 translate-y-4 pointer-events-none'
                                    }`}
                                    style={{
                                        transitionDelay: isRevealed ? `${750 + idx * 100}ms` : '0ms'
                                    }}
                                >
                                    <div className="mb-2 text-[#FF5B1D] shrink-0">
                                        {stat.icon}
                                    </div>
                                    <span className="text-xl md:text-2xl font-black text-white font-mono leading-none tracking-tight">
                                        {stat.val}
                                    </span>
                                    <span className="text-[7.5px] font-sans font-extrabold text-white/65 uppercase tracking-[0.15em] mt-2.5 leading-none">
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
                    <div className={`w-0.75 h-full transition-all duration-200 ${
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