'use client';

import React, { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useAuth } from "@clerk/nextjs";
import ProfileDropdown from './ProfileDropdown';

function Header() {
    const { isSignedIn } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isFlying, setIsFlying] = useState(false);
    
    // Continuous Scroll Interpolation
    const { scrollY } = useScroll();
    const rawProgress = useTransform(scrollY, [0, 120], [0, 1]);
    const progress = useSpring(rawProgress, { stiffness: 300, damping: 30, restDelta: 0.001 });

    useMotionValueEvent(progress, "change", (latest) => {
        if (latest > 0.5 && !isScrolled) setIsScrolled(true);
        else if (latest <= 0.5 && isScrolled) setIsScrolled(false);
    });

    // Interpolated Values
    const headerTop = useTransform(progress, [0, 1], ["12px", "10px"]);
    const headerMaxWidth = useTransform(progress, [0, 1], ["1152px", "740px"]); // 1152px = max-w-6xl
    
    const headerBgLight = useTransform(progress, [0, 1], ["rgba(255,255,255,0.6)", "rgba(255,255,255,0.85)"]);
    const headerBgDark = useTransform(progress, [0, 1], ["rgba(17,17,17,0.5)", "rgba(20,20,20,0.85)"]);
    
    const headerShadowLight = useTransform(progress, [0, 1], ["0 12px 40px rgba(0,0,0,0.06)", "0 16px 48px rgba(0,0,0,0.08)"]);
    const headerShadowDark = useTransform(progress, [0, 1], ["0 12px 40px rgba(0,0,0,0.25)", "0 16px 48px rgba(0,0,0,0.38)"]);
    
    const headerBlur = useTransform(progress, [0, 1], ["blur(8px)", "blur(12px)"]);

    const navGap = useTransform(progress, [0, 1], ["16px", "24px"]);
    const desktopNavGap = useTransform(progress, [0, 1], ["32px", "24px"]);
    
    const logoWidth = useTransform(progress, [0, 1], ["120px", "0px"]);
    const logoOpacity = useTransform(progress, [0, 0.8], [1, 0]);
    const logoMargin = useTransform(progress, [0, 1], ["8px", "0px"]);
    const logoScale = useTransform(progress, [0, 1], [1, 0.85]);

    const trackingRaw = useTransform(progress, [0, 1], [0.16, 0.1]);
    const navTracking = useTransform(trackingRaw, v => `${v}em`);
    
    // Refs for GSAP animation
    const plane1Ref = useRef(null);
    const plane2Ref = useRef(null);
    const plane3Ref = useRef(null);
    const wipeOverlayRef = useRef(null);

    const handleFlyTransition = (e) => {
        if (e) e.preventDefault();
        
        setIsFlying(true);
        
        const tl = gsap.timeline();

        // Plane 1: Swoops high and right
        tl.fromTo(plane1Ref.current, 
            { x: 0, y: 0, rotation: 0, scale: 0.5, opacity: 0 },
            { x: window.innerWidth * 0.6, ease: "power2.out", duration: 1.2, opacity: 1 }, 0
        ).to(plane1Ref.current, 
            { y: -window.innerHeight * 0.8, rotation: 75, scale: 2, ease: "power3.in", duration: 1.2 }, 0
        );

        // Plane 2: Swoops far right, lower
        tl.fromTo(plane2Ref.current, 
            { x: 0, y: 0, rotation: 0, scale: 0.3, opacity: 0 },
            { x: window.innerWidth * 0.8, ease: "power1.out", duration: 1.4, opacity: 1 }, 0.1
        ).to(plane2Ref.current, 
            { y: -window.innerHeight * 0.3, rotation: 85, scale: 1.2, ease: "power2.in", duration: 1.4 }, 0.1
        );

        // Plane 3: Swoops left and very high
        tl.fromTo(plane3Ref.current, 
            { x: 0, y: 0, rotation: 0, scale: 0.4, opacity: 0 },
            { x: -window.innerWidth * 0.4, ease: "power2.out", duration: 1.3, opacity: 1 }, 0.05
        ).to(plane3Ref.current, 
            { y: -window.innerHeight * 0.9, rotation: -45, scale: 1.5, ease: "power4.in", duration: 1.3 }, 0.05
        );

        // Cinematic Circle Wipe Transition
        tl.to(wipeOverlayRef.current, {
            scale: 250, // Massive scale to cover any screen from the header
            opacity: 1,
            duration: 1.0,
            ease: "power3.inOut"
        }, 0.4);

        // Wait for the transition to finish
        setTimeout(() => {
            window.location.href = isSignedIn ? '/ai-planner/new' : '/sign-in';
        }, 1300);
    };
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
        <motion.header 
            style={{
                top: headerTop,
                maxWidth: headerMaxWidth,
                backgroundColor: isLightPage ? headerBgLight : headerBgDark,
                boxShadow: isLightPage ? headerShadowLight : headerShadowDark,
                backdropFilter: headerBlur,
                WebkitBackdropFilter: headerBlur,
            }}
            className={`fixed left-0 right-0 z-50 mx-auto border rounded-full w-[calc(100%-2rem)] transition-colors duration-300 ${
            isScrolled
                ? isLightPage
                    ? "border-[#ECE8E2] hover:border-[#FF6B2C]/30"
                    : "border-white/20 hover:border-white/30"
                : isLightPage
                    ? "border-[#ECE8E2] hover:border-[#FF6B2C]/30"
                    : "border-white/15 hover:border-white/25"
        }`}>
            <motion.div style={{ gap: navGap }} className={`px-4 md:px-6 flex items-center justify-between h-15`}>
                {/* Left Side: Destinations & AI Planner (Desktop) */}
                <motion.div style={{ gap: desktopNavGap }} className={`hidden md:flex items-center justify-start`}>
                    {['Destinations', 'AI Planner'].map((item) => {
                        const itemPath = item === 'AI Planner' ? '/ai-planner' : item === 'Destinations' ? '/destinations' : `#${item.toLowerCase().replace(' ', '-')}`;
                        const isActive = pathname === itemPath || pathname?.startsWith(`${itemPath}/`);
                        // Placeholder for actual drafts data
                        const hasActiveDrafts = item === 'AI Planner' && isSignedIn; 
                        
                        return (
                            <motion.a
                                key={item}
                                href={itemPath}
                                style={{ letterSpacing: navTracking }}
                                className={`font-mono text-[11px] font-bold ${
                                    isActive
                                        ? 'text-[#FF6B2C]' 
                                        : isLightPage ? 'text-[#1F1F1F]/80 hover:text-[#FF6B2C]' : 'text-white/70 hover:text-[#FF7A1A]'
                                } relative py-2 ${!isActive ? 'nav-link-underline' : ''} uppercase whitespace-nowrap flex items-center`}
                            >
                                {item}
                                {hasActiveDrafts && (
                                    <span className="absolute -top-0 -right-2.5 w-1.5 h-1.5 bg-[#FF6B2C] rounded-full shadow-[0_0_8px_rgba(255,107,44,0.6)]" />
                                )}
                                {isActive && (
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FF6B2C] rounded-full" />
                                )}
                            </motion.a>
                        );
                    })}
                </motion.div>

                {/* Center: Logo (Centered on desktop, left on mobile) */}
                <a href="/" className="header-logo flex items-center justify-center cursor-pointer group select-none shrink-0 relative" style={{ left: isScrolled ? '0px' : '0px' }}>
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
                    <motion.div
                        style={{
                            width: logoWidth,
                            opacity: logoOpacity,
                            marginLeft: logoMargin,
                            scale: logoScale,
                            transformOrigin: "left center"
                        }}
                        className="flex flex-col items-start overflow-hidden"
                    >
                        <span className={`font-sans font-extrabold text-[22px] tracking-tight leading-none ${isLightPage ? 'text-[#1F1F1F]' : 'text-white'} select-none whitespace-nowrap`}>
                            Trip<span className="text-[#FF6B2C]">Wise</span>
                        </span>
                        <span className="font-sans font-bold text-[8px] tracking-[0.2em] text-[#8CA3A8] select-none whitespace-nowrap mt-1 leading-none">
                            AI TRIP PLANNER
                        </span>
                    </motion.div>
                </a>

                {/* Right Side: Community, Avatar, Get Started */}
                <div className={`flex items-center justify-end gap-8 lg:gap-10 shrink-0`}>
                    
                    {/* Desktop Only Text Links */}
                    <div className="hidden md:flex items-center gap-8 lg:gap-10">
                        <motion.a
                            href="/community"
                            style={{ letterSpacing: navTracking }}
                            className={`font-mono text-[11px] font-bold ${isLightPage ? 'text-[#1F1F1F]/80 hover:text-[#FF6B2C]' : 'text-white/60 hover:text-[#fe7717]'} relative py-2 nav-link-underline uppercase whitespace-nowrap`}
                        >
                            Community
                        </motion.a>
                        
                        {/* Account Controls */}
                        <div className="flex items-center shrink-0">
                            {isSignedIn ? (
                                <ProfileDropdown isLightPage={isLightPage} isScrolled={isScrolled} />
                            ) : (
                                <a href="/sign-in" className={`font-mono text-[11px] font-bold ${isLightPage ? 'text-[#1F1F1F] hover:text-[#FF6B2C]' : 'text-white hover:text-[#FF6B2C]'} uppercase tracking-widest transition-colors py-2 relative nav-link-underline`}>
                                    Sign In
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Primary CTA */}
                    <button
                        onClick={handleFlyTransition}
                        className={`group relative px-5 py-3 bg-gradient-to-r from-[#FF6B2C] to-[#FF8A4C] text-white font-bold text-[11px] rounded-full transition-all duration-300 transform cursor-pointer uppercase tracking-[0.2em] whitespace-nowrap shrink-0 border border-[#FF8A4C]/50 flex items-center justify-center overflow-visible ${isFlying ? 'scale-95 shadow-[0_0_30px_rgba(255,107,44,0.6)]' : 'hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,107,44,0.4)] hover:shadow-[0_0_30px_rgba(255,107,44,0.6)]'}`}
                    >
                        <span className={`relative z-10 drop-shadow-sm transition-colors duration-300 ${isFlying ? 'opacity-0' : 'opacity-100'}`}>
                            {isSignedIn ? 'Start New Trip' : 'Plan My Trip'}
                        </span>
                        {/* Hover glow overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transition-opacity duration-300 rounded-full ${isFlying ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`} />

                        {/* Plane 1 (Main, fast) */}
                        <svg ref={plane1Ref} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-white z-50 pointer-events-none opacity-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.524-.46.529-.65-.013l-3.35-9.404-9.327-3.311Zm9.638 4.27 2.656 7.457 4.148-14.52-14.52 4.839 8.358 2.966c.277.098.423.238.455.514l-2.083 6.945-1.014-8.197Z" />
                        </svg>
                        
                        {/* Plane 2 (Smaller, flies wider right) */}
                        <svg ref={plane2Ref} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-[#FFF8F5] z-50 pointer-events-none opacity-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.524-.46.529-.65-.013l-3.35-9.404-9.327-3.311Zm9.638 4.27 2.656 7.457 4.148-14.52-14.52 4.839 8.358 2.966c.277.098.423.238.455.514l-2.083 6.945-1.014-8.197Z" />
                        </svg>

                        {/* Plane 3 (Medium, flies higher left) */}
                        <svg ref={plane3Ref} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-[#FFE6DA] z-50 pointer-events-none opacity-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.524-.46.529-.65-.013l-3.35-9.404-9.327-3.311Zm9.638 4.27 2.656 7.457 4.148-14.52-14.52 4.839 8.358 2.966c.277.098.423.238.455.514l-2.083 6.945-1.014-8.197Z" />
                        </svg>
                    </button>
                </div>
            </motion.div>

            {/* Cinematic Circle Wipe Transition Overlay */}
            <div 
                ref={wipeOverlayRef} 
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[20px] h-[20px] bg-[#0A0A0A] rounded-full z-[99999] pointer-events-none opacity-0 origin-center" 
            />
        </motion.header>
    )
}

export default Header