'use client';

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

function Header() {
    const [isScrolled, setIsScrolled] = useState(false)
    const pathname = usePathname()
    const isLightPage = pathname?.startsWith('/planner') && !pathname?.startsWith('/planner-sidebar');

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
        <header className={`fixed left-0 right-0 z-50 transition-all duration-500 ease-out mx-auto backdrop-blur-2xl border rounded-full ${
            isScrolled
                ? isLightPage
                    ? "top-2.5 max-w-5xl w-[calc(100%-2.5rem)] bg-white border-[#ECE8E2] shadow-[0_16px_48px_rgba(0,0,0,0.08)] hover:border-[#FF6B2C]/30"
                    : "top-2.5 max-w-5xl w-[calc(100%-2.5rem)] bg-[#111111]/92 border-white/20 shadow-[0_16px_48px_rgba(0,0,0,0.38)] hover:border-white/30"
                : isLightPage
                    ? "top-3 max-w-350 w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] bg-white border-[#ECE8E2] shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)] hover:border-[#FF6B2C]/30"
                    : "top-3 max-w-350 w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] bg-[#111111]/85 border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.25)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.35)] hover:border-white/25"
        }`}>
            <div className="px-6 md:px-8 flex items-center justify-between md:grid md:grid-cols-3 transition-all duration-500 ease-in-out h-15">
                {/* Left Side: Destinations & AI Planner (Desktop) */}
                <div className={`hidden md:flex items-center justify-start transition-all duration-500 ${isScrolled ? "gap-6" : "gap-8"}`}>
                    {['Destinations', 'AI Planner'].map((item) => (
                    <a
                            key={item}
                            href={item === 'AI Planner' ? '/ai-planner' : item === 'Destinations' ? '/destinations' : `#${item.toLowerCase().replace(' ', '-')}`}
                            className={`font-mono text-[11px] font-bold ${isLightPage ? 'text-[#1F1F1F]/80 hover:text-[#FF6B2C]' : 'text-white/70 hover:text-[#FF7A1A]'} transition-all duration-300 relative py-2 nav-link-underline uppercase whitespace-nowrap ${
                                isScrolled ? "tracking-widest" : "tracking-[0.16em]"
                            }`}
                        >
                            {item}
                        </a>
                    ))}
                </div>

                {/* Center: Logo (Centered on desktop, left on mobile) */}
                <a href="/" className="header-logo flex items-center justify-start md:justify-center cursor-pointer group select-none">
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
                        <span className={`font-sans font-extrabold text-[22px] tracking-tight leading-none ${isLightPage ? 'text-[#1F1F1F]' : 'text-white'} select-none whitespace-nowrap`}>
                            Trip<span className="text-[#FF6B2C]">Wise</span>
                        </span>
                        <span className="font-sans font-bold text-[8px] tracking-[0.2em] text-[#8CA3A8] select-none whitespace-nowrap mt-1 leading-none">
                            AI TRIP PLANNER
                        </span>
                    </div>
                </a>

                {/* Right Side: My Trips, Community & Get Started */}
                <div className={`flex items-center justify-end transition-all duration-500 ${isScrolled ? "gap-4" : "gap-6"
                    }`}>
                    <div className={`hidden md:flex items-center transition-all duration-500 mr-2 ${isScrolled ? "gap-5" : "gap-8"
                        }`}>
                        {['My Trips', 'Community'].map((item) => (
                            <a
                                key={item}
                                href={`#${item.toLowerCase().replace(' ', '-')}`}
                                className={`font-mono text-[11px] font-bold ${isLightPage ? 'text-[#1F1F1F]/80 hover:text-[#FF6B2C]' : 'text-white/60 hover:text-[#fe7717]'} transition-all duration-500 relative py-2 nav-link-underline uppercase whitespace-nowrap ${isScrolled ? "tracking-widest" : "tracking-[0.16em]"
                                    }`}
                            >
                                {item}
                            </a>
                        ))}
                    </div>
                    <a
                        href="/ai-planner"
                        className="px-5 py-2.5 bg-linear-to-r from-[#FF6B2C] to-[#FF7A3D] hover:from-[#FF7A3D] hover:to-[#FF6B2C] text-white font-extrabold text-xs rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-[0_8px_24px_rgba(255,107,44,0.35)] uppercase tracking-wider whitespace-nowrap"
                    >
                        Plan My Trip
                    </a>
                </div>
            </div>
        </header>
    )
}

export default Header