'use client';

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValueEvent } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useAuth } from "@clerk/nextjs";
import ProfileDropdown, { DropdownTripCard } from './ProfileDropdown';
import { supabase } from '../../lib/supabase';

function Header() {
    const { isSignedIn, userId } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // For My Itinerary trips in mobile menu
    const [userTrips, setUserTrips] = useState([]);
    const [showMobileTrips, setShowMobileTrips] = useState(false);
    const [isLoadingTrips, setIsLoadingTrips] = useState(false);
    
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileMenuOpen]);

    useEffect(() => {
        if (isMobileMenuOpen && isSignedIn && userId && userTrips.length === 0) {
            async function loadTrips() {
                try {
                    setIsLoadingTrips(true);
                    const { data, error } = await supabase
                        .from('trips')
                        .select('id, destination_name, itinerary_data, created_at')
                        .eq('user_id', userId)
                        .order('created_at', { ascending: false })
                        .limit(5);

                    if (!error && data) {
                        setUserTrips(data);
                    }
                } catch (e) {
                    console.warn("Failed to load user trips:", e);
                } finally {
                    setIsLoadingTrips(false);
                }
            }
            loadTrips();
        }
    }, [isMobileMenuOpen, isSignedIn, userId]);
    
    // Continuous Scroll Interpolation
    const { scrollY } = useScroll();
    const rawProgress = useTransform(scrollY, [0, 120], [0, 1]);
    const progress = useSpring(rawProgress, { stiffness: 300, damping: 30, restDelta: 0.001 });

    useMotionValueEvent(scrollY, "change", (latest) => {
        let threshold = 60;
        if (isHomePage) {
            const heroSec = document.getElementById('hero-section');
            if (heroSec) {
                threshold = heroSec.offsetHeight - window.innerHeight - 20;
            }
        }
        if (latest > threshold && !isScrolled) setIsScrolled(true);
        else if (latest <= threshold && isScrolled) setIsScrolled(false);
    });

    const pathname = usePathname();
    const isHomePage = pathname === '/';
    
    // Interpolated Values
    const headerTop = useTransform(progress, [0, 1], ["12px", "10px"]);
    const headerMaxWidth = useTransform(progress, [0, 1], ["1152px", "740px"]); // 1152px = max-w-6xl
    
    const headerBgLight = useTransform(progress, [0, 1], ["rgba(255,255,255,0.6)", "rgba(255,255,255,0.85)"]);
    
    const darkBgStart = "rgba(10,10,10,0.95)";
    const darkBgEnd = "rgba(10,10,10,0.98)";
    const headerBgDark = useTransform(progress, [0, 1], [darkBgStart, darkBgEnd]);
    
    const headerShadowLight = useTransform(progress, [0, 1], ["0 12px 40px rgba(0,0,0,0.06)", "0 16px 48px rgba(0,0,0,0.08)"]);
    const headerShadowDark = useTransform(progress, [0, 1], ["0 16px 48px rgba(0,0,0,0.35)", "0 16px 48px rgba(0,0,0,0.40)"]);
    
    const headerBlur = useTransform(progress, [0, 1], ["blur(12px)", "blur(12px)"]);

    const navGap = useTransform(progress, [0, 1], ["16px", "24px"]);
    const desktopNavGap = useTransform(progress, [0, 1], ["32px", "24px"]);
    
    const logoWidth = useTransform(progress, [0, 1], ["120px", "0px"]);
    const logoOpacity = useTransform(progress, [0, 0.8], [1, 0]);
    const logoMargin = useTransform(progress, [0, 1], ["8px", "0px"]);
    const logoScale = useTransform(progress, [0, 1], [1, 0.85]);

    const trackingRaw = useTransform(progress, [0, 1], [0.16, 0.1]);
    const navTracking = useTransform(trackingRaw, v => `${v}em`);
    
    // Refs for GSAP animation
    const wipeOverlayRef = useRef(null);


    const isLightPage = pathname?.startsWith('/planner') && !pathname?.startsWith('/planner-sidebar');

    // Removed duplicate unoptimized scroll listener.
    return (
        <>
        <motion.header 
            style={{
                top: headerTop,
                maxWidth: headerMaxWidth,
                backgroundColor: isLightPage ? headerBgLight : headerBgDark,
                boxShadow: isLightPage ? headerShadowLight : headerShadowDark,
                backdropFilter: headerBlur,
                WebkitBackdropFilter: headerBlur,
            }}
            className={`fixed left-0 right-0 z-9999 mx-auto border rounded-full w-[calc(100%-2rem)] transition-colors duration-300 ${
                isLightPage
                    ? "border-[#ECE8E2] hover:border-[#FF6B2C]/30"
                    : "border-white/20 hover:border-white/30"
            }`}>
            <motion.div style={{ gap: navGap }} className={`px-4 md:px-6 flex items-center justify-between h-15`}>
                {/* Left Side: Destinations & AI Planner (Desktop) */}
                <motion.div style={{ gap: desktopNavGap }} className={`hidden md:flex items-center justify-start`}>
                    {['Destinations', 'AI Planner'].map((item) => {
                        const itemPath = item === 'AI Planner' ? '/ai-planner/new' : item === 'Destinations' ? '/destinations' : `#${item.toLowerCase().replace(' ', '-')}`;
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
                                    <span className="absolute top-0 -right-2.5 w-1.5 h-1.5 bg-[#FF6B2C] rounded-full shadow-[0_0_8px_rgba(255,107,44,0.6)]" />
                                )}
                                {isActive && (
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FF6B2C] rounded-full" />
                                )}
                            </motion.a>
                        );
                    })}
                </motion.div>

                {/* Center: Logo (Centered on desktop, left on mobile) */}
                <a id="main-navbar-logo" href="/" className="header-logo flex items-center justify-center cursor-pointer group select-none shrink-0 relative" style={{ left: isScrolled ? '0px' : '0px' }}>
                    {/* Icon Part (Always visible, height stays constant h-16) */}
                    <div className="h-16 w-16 shrink-0 flex items-center justify-center">
                        <svg id="navbar-logo-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 object-contain transition-transform duration-300 group-hover:scale-105">
                            <path
                                d="M24 170 C 70 135, 105 105, 168 42"
                                fill="none"
                                stroke="#8CA3A8"
                                strokeWidth="4"
                                strokeDasharray="3 12"
                                strokeLinecap="round"
                            />
                            <circle cx="24" cy="170" r="9" fill="#0D9488" />
                            <g id="navbar-plane" transform="translate(136,28) rotate(45)">
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
                <div className={`flex items-center justify-end gap-4 md:gap-8 lg:gap-10 shrink-0`}>
                    
                    {/* Desktop Only Text Links */}
                    <div className="hidden md:flex items-center gap-8 lg:gap-10">
                        {isSignedIn && (() => {
                            const isActive = pathname === '/ai-planner';
                            return (
                                <motion.a
                                    href="/ai-planner"
                                    style={{ letterSpacing: navTracking }}
                                    className={`font-mono text-[11px] font-bold ${
                                        isActive
                                            ? 'text-[#FF6B2C]' 
                                            : isLightPage ? 'text-[#1F1F1F]/80 hover:text-[#FF6B2C]' : 'text-white/60 hover:text-[#fe7717]'
                                    } relative py-2 ${!isActive ? 'nav-link-underline' : ''} uppercase whitespace-nowrap flex items-center`}
                                >
                                    My Trips
                                    {isActive && (
                                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FF6B2C] rounded-full" />
                                    )}
                                </motion.a>
                            );
                        })()}
                        {(() => {
                            const isActive = pathname === '/community' || pathname?.startsWith('/community/');
                            return (
                                <motion.a
                                    href="/community"
                                    style={{ letterSpacing: navTracking }}
                                    className={`font-mono text-[11px] font-bold ${
                                        isActive
                                            ? 'text-[#FF6B2C]' 
                                            : isLightPage ? 'text-[#1F1F1F]/80 hover:text-[#FF6B2C]' : 'text-white/60 hover:text-[#fe7717]'
                                    } relative py-2 ${!isActive ? 'nav-link-underline' : ''} uppercase whitespace-nowrap flex items-center`}
                                >
                                    Community
                                    {isActive && (
                                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FF6B2C] rounded-full" />
                                    )}
                                </motion.a>
                            );
                        })()}
                        
                        <div className="flex items-center shrink-0">
                            {isSignedIn ? (
                                <ProfileDropdown isLightPage={isLightPage} isScrolled={isScrolled} />
                            ) : (
                                <a href="/sign-in" className={`font-mono text-[11px] font-bold ${isLightPage ? 'text-[#1F1F1F] hover:text-[#FF6B2C]' : 'text-white hover:text-[#FF6B2C]'} uppercase tracking-widest transition-colors py-2 relative nav-link-underline -mt-0.5`}>
                                    Sign In
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Mobile Navigation Toggle (Hamburger) */}
                    <div className="md:hidden flex items-center">
                        <button 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className={`p-2 focus:outline-none flex flex-col justify-center items-center gap-1.5 z-10000`}
                        >
                            <span className={`block w-6 h-0.5 rounded-full transition-transform duration-300 ${isMobileMenuOpen ? 'bg-white rotate-45 translate-y-2' : (isLightPage ? 'bg-[#1F1F1F]' : 'bg-white')}`} />
                            <span className={`block w-6 h-0.5 rounded-full transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-0' : (isLightPage ? 'bg-[#1F1F1F]' : 'bg-white')}`} />
                            <span className={`block w-6 h-0.5 rounded-full transition-transform duration-300 ${isMobileMenuOpen ? 'bg-white -rotate-45 -translate-y-2' : (isLightPage ? 'bg-[#1F1F1F]' : 'bg-white')}`} />
                        </button>
                    </div>

                    {/* CTA removed as per user request */}
                </div>
            </motion.div>

            {/* Cinematic Circle Wipe Transition Overlay */}
            <div 
                ref={wipeOverlayRef} 
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-[#0A0A0A] rounded-full z-99999 pointer-events-none opacity-0 origin-center" 
            />
        </motion.header>

        {/* Mobile Menu Overlay */}
        <div 
            id="mobile-menu-scroll-container"
            className={`md:hidden fixed inset-0 h-dvh bg-[#070709]/98 backdrop-blur-3xl z-9998 flex flex-col items-start justify-start pt-32 pb-8 px-8 overflow-y-auto transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none -translate-y-4'}`}
            style={{ left: 0, right: 0, top: 0, bottom: 0 }}
        >
            {/* Navigation Links */}
            <div className="flex flex-col items-start gap-2 w-full mt-4">
                {[
                    { name: 'Destinations', path: '/destinations' },
                    { name: 'AI Planner', path: '/ai-planner/new' },
                    { name: 'Community', path: '/community' },
                    ...(isSignedIn ? [
                        { name: 'My Trips', path: '/ai-planner' },
                        { name: 'My Itinerary', action: 'toggleTrips' }
                    ] : [])
                ].map((item, index) => (
                    item.action === 'toggleTrips' ? (
                        <div key={item.name} className="w-full flex flex-col">
                            <button 
                                onClick={() => {
                                    const nextState = !showMobileTrips;
                                    setShowMobileTrips(nextState);
                                    if (nextState) {
                                        setTimeout(() => {
                                            const container = document.getElementById('mobile-menu-scroll-container');
                                            if (container) container.scrollBy({ top: 250, behavior: 'smooth' });
                                        }, 150);
                                    }
                                }}
                                className="group flex flex-col w-full py-4 border-b border-white/5 active:bg-white/5 transition-colors text-left"
                            >
                                <div className="flex items-start justify-between w-full">
                                    <div className="flex items-start gap-4">
                                        <span className="font-mono text-[#FF5B1D] text-xs font-bold tracking-widest mt-1.5 opacity-80">0{index + 1}</span>
                                        <span className="text-4xl sm:text-5xl font-sans font-extrabold tracking-tighter uppercase text-white group-active:text-[#FF5B1D] transition-colors">{item.name}</span>
                                    </div>
                                    <div className={`mt-2 transform transition-transform duration-300 ${showMobileTrips ? 'rotate-180' : ''}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF5B1D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                    </div>
                                </div>
                            </button>
                            <AnimatePresence>
                                {showMobileTrips && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex flex-col gap-3 pt-4 pl-4 overflow-hidden"
                                    >
                                        {isLoadingTrips ? (
                                            <div className="text-white/60 font-mono text-sm pl-4 pb-4">Loading trips...</div>
                                        ) : userTrips.length > 0 ? (
                                            <div className="pb-4 flex flex-col gap-3">
                                                {userTrips.map((trip, idx) => (
                                                    <DropdownTripCard
                                                        key={trip.id}
                                                        trip={trip}
                                                        idx={idx}
                                                        onSelect={(t) => {
                                                            if (typeof window !== 'undefined') {
                                                                const actualData = typeof t.itinerary_data === 'string' ? t.itinerary_data : JSON.stringify(t.itinerary_data);
                                                                localStorage.setItem('tripwise_itinerary', actualData);
                                                                localStorage.setItem('tripwise_trip_id', t.id);
                                                                window.location.href = `/itinerary?trip_id=${t.id}`;
                                                            }
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-white/60 font-mono text-sm pl-4 mb-4">
                                                No active trips found. <a href="/ai-planner" className="text-[#FF6B2C] underline">Go to My Trips</a>.
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <a 
                            key={item.name} 
                            href={item.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="group flex flex-col w-full py-4 border-b border-white/5 active:bg-white/5 transition-colors"
                        >
                            <div className="flex items-start gap-4">
                                <span className="font-mono text-[#FF5B1D] text-xs font-bold tracking-widest mt-1.5 opacity-80">0{index + 1}</span>
                                <span className="text-4xl sm:text-5xl font-sans font-extrabold tracking-tighter uppercase text-white group-active:text-[#FF5B1D] transition-colors">{item.name}</span>
                            </div>
                        </a>
                    )
                ))}
            </div>

            {/* Bottom Account Footer */}
            <div className="w-full mt-auto pt-10 pb-12 flex flex-col items-center justify-center shrink-0">
                {isSignedIn ? (
                    <div className="flex items-center justify-between w-full px-2 py-4 bg-white/5 rounded-2xl border border-white/10">
                        <span className="font-mono text-[10px] tracking-widest uppercase text-white/50 pl-4">Account</span>
                        <div className="scale-110 origin-right pr-4"><ProfileDropdown isLightPage={false} isScrolled={true} openUpwards={true} /></div>
                    </div>
                ) : (
                    <a href="/sign-in" className="w-full bg-[#FF5B1D] text-[#070709] text-center py-4.5 rounded-2xl font-bold text-lg transition-transform active:scale-95 shadow-[0_0_30px_rgba(255,91,29,0.2)] uppercase tracking-widest" onClick={() => setIsMobileMenuOpen(false)}>
                        Sign In
                    </a>
                )}
            </div>
        </div>
        </>
    )
}

export default Header