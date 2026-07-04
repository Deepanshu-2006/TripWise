'use client';

import React, { useState, useEffect } from 'react'

function Header() {
    const [isScrolled, setIsScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            const heroSec = document.getElementById('hero-section')
            if (heroSec) {
                // The scroll animation ends when the user reaches the end of the pinned section.
                const pinDuration = heroSec.offsetHeight - window.innerHeight
                if (window.scrollY >= pinDuration - 20) {
                    setIsScrolled(true)
                } else {
                    setIsScrolled(false)
                }
            } else {
                if (window.scrollY > 20) {
                    setIsScrolled(true)
                } else {
                    setIsScrolled(false)
                }
            }
        }
        window.addEventListener('scroll', handleScroll)
        handleScroll()
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <header className={`fixed left-0 right-0 z-50 transition-all duration-500 ease-in-out mx-auto backdrop-blur-md border border-white/10 rounded-full ${isScrolled
                ? "top-2 max-w-4xl w-[calc(100%-4rem)] bg-[#0C0C0E]/95 shadow-2xl shadow-black/40"
                : "top-4 max-w-7xl w-[calc(100%-2rem)] bg-[#0C0C0E]/90 shadow-xl shadow-black/20"
            }`}>
            <div className="px-6 flex items-center justify-between md:grid md:grid-cols-3 transition-all duration-500 ease-in-out h-15">
                {/* Left Side: Destinations & AI Planner (Desktop) */}
                <div className={`hidden md:flex items-center justify-start transition-all duration-500 ${isScrolled ? "gap-5" : "gap-8"
                    }`}>
                    {['Destinations', 'AI Planner'].map((item) => (
                        <a
                            key={item}
                            href={`#${item.toLowerCase().replace(' ', '-')}`}
                            className={`font-mono text-[11px] font-bold text-white/60 hover:text-[#fe7717] transition-all duration-500 relative py-2 nav-link-underline uppercase whitespace-nowrap ${isScrolled ? "tracking-widest" : "tracking-[0.16em]"
                                }`}
                        >
                            {item}
                        </a>
                    ))}
                </div>

                {/* Center: Logo (Centered on desktop, left on mobile) */}
                <div className="header-logo flex items-center justify-start md:justify-center cursor-pointer group select-none">
                    {/* Icon Part (Always visible, height stays constant h-16) */}
                    <div className="h-16 w-16 shrink-0 flex items-center justify-center">
                        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 object-contain transition-transform duration-300 group-hover:scale-105">
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

                    {/* Text Part (Collapses horizontally on scroll) */}
                    <div
                        className="flex flex-col items-start transition-all duration-500 ease-in-out overflow-hidden"
                        style={{
                            width: isScrolled ? "0px" : "120px",
                            opacity: isScrolled ? 0 : 1,
                            marginLeft: isScrolled ? "0px" : "8px"
                        }}
                    >
                        <span className="font-sans font-extrabold text-[22px] tracking-tight leading-none text-white select-none whitespace-nowrap">
                            Trip<span className="text-[#fe7717]">Wise</span>
                        </span>
                        <span className="font-sans font-bold text-[8px] tracking-[0.2em] text-[#8CA3A8] select-none whitespace-nowrap mt-1 leading-none">
                            AI TRIP PLANNER
                        </span>
                    </div>
                </div>

                {/* Right Side: My Trips, Community & Get Started */}
                <div className={`flex items-center justify-end transition-all duration-500 ${isScrolled ? "gap-4" : "gap-6"
                    }`}>
                    <div className={`hidden md:flex items-center transition-all duration-500 mr-2 ${isScrolled ? "gap-5" : "gap-8"
                        }`}>
                        {['My Trips', 'Community'].map((item) => (
                            <a
                                key={item}
                                href={`#${item.toLowerCase().replace(' ', '-')}`}
                                className={`font-mono text-[11px] font-bold text-white/60 hover:text-[#fe7717] transition-all duration-500 relative py-2 nav-link-underline uppercase whitespace-nowrap ${isScrolled ? "tracking-widest" : "tracking-[0.16em]"
                                    }`}
                            >
                                {item}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Header