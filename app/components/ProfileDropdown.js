import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Map, User as UserIcon, Settings, LogOut, ChevronRight, Calendar, Sparkles, FolderOpen, ChevronDown, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ─── 3D Hover Itinerary Trip Card ──────────────────────────────────────────
export function DropdownTripCard({ trip, idx, onSelect }) {
    const cardRef = useRef(null);
    const [hovered, setHovered] = useState(false);

    const onMouseMove = useCallback((e) => {
        const el = cardRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 10;
        el.style.setProperty('--rx', `${-y}deg`);
        el.style.setProperty('--ry', `${x}deg`);
    }, []);

    const onMouseLeave = useCallback(() => {
        setHovered(false);
        const el = cardRef.current;
        if (el) {
            el.style.setProperty('--rx', '0deg');
            el.style.setProperty('--ry', '0deg');
        }
    }, []);

    const dates = trip.itinerary_data?.dates || trip.itinerary_data?.travelDates || 'Custom Dates';
    const dest = trip.destination_name || trip.itinerary_data?.destinationName || 'Trip';
    const placesCount = trip.itinerary_data?.days?.reduce((acc, d) => acc + (d.activities?.length || 0), 0) || 9;
    const numStr = String(idx + 1).padStart(2, '0');

    return (
        <div style={{ perspective: '800px' }}>
            <button
                type="button"
                ref={cardRef}
                onClick={() => onSelect(trip)}
                onMouseMove={onMouseMove}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={onMouseLeave}
                style={{
                    '--rx': '0deg',
                    '--ry': '0deg',
                    transform: 'rotateX(var(--rx)) rotateY(var(--ry))',
                    transformStyle: 'preserve-3d',
                    transition: hovered
                        ? 'transform 0.08s linear, box-shadow 0.3s ease, border-color 0.3s ease'
                        : 'transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease, border-color 0.3s ease',
                }}
                className="group relative w-full text-left p-3 rounded-2xl bg-white/3 border border-white/8 overflow-hidden block will-change-transform cursor-pointer"
            >
                {/* ① Coral ink-wash sweep from left */}
                <span
                    aria-hidden
                    style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 'inherit',
                        background: 'linear-gradient(120deg, rgba(254,119,23,0.18) 0%, rgba(255,107,44,0.08) 100%)',
                        transform: hovered ? 'scaleX(1)' : 'scaleX(0)',
                        transformOrigin: 'left center',
                        transition: 'transform 0.45s cubic-bezier(0.16,1,0.3,1)',
                        pointerEvents: 'none',
                    }}
                />

                {/* ② Glowing border colour & shadow transition */}
                <span
                    aria-hidden
                    style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 'inherit',
                        boxShadow: hovered
                            ? '0 0 0 1.5px rgba(254,119,23,0.55), 0 8px 24px rgba(254,119,23,0.15)'
                            : '0 0 0 0px transparent',
                        transition: 'box-shadow 0.35s cubic-bezier(0.16,1,0.3,1)',
                        pointerEvents: 'none',
                    }}
                />

                {/* Card Content Row */}
                <div className="relative z-10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        {/* Number badge (01, 02, 03) */}
                        <div
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                background: hovered ? 'rgba(254,119,23,0.22)' : 'rgba(255,255,255,0.06)',
                                color: hovered ? '#fe7717' : 'rgba(255,255,255,0.5)',
                                fontFamily: 'monospace',
                                fontSize: 10,
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                transition: 'background 0.3s ease, color 0.3s ease',
                            }}
                        >
                            {numStr}
                        </div>

                        {/* Title, Subtitle & Monospace tags */}
                        <div>
                            <p
                                style={{
                                    fontFamily: 'serif',
                                    fontWeight: 800,
                                    fontSize: 13,
                                    letterSpacing: '-0.01em',
                                    color: hovered ? '#ffffff' : '#f5f5f5',
                                    transition: 'color 0.25s ease',
                                }}
                            >
                                {dest}
                            </p>
                            <p
                                style={{
                                    fontFamily: 'serif',
                                    fontStyle: 'italic',
                                    fontSize: 10.5,
                                    color: hovered ? '#fe7717' : 'rgba(255,255,255,0.45)',
                                    transition: 'color 0.25s ease',
                                    marginTop: 1,
                                }}
                            >
                                {dates}
                            </p>
                            <p
                                style={{
                                    fontFamily: 'monospace',
                                    fontSize: 8.5,
                                    fontWeight: 700,
                                    letterSpacing: '0.12em',
                                    textTransform: 'uppercase',
                                    color: hovered ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.3)',
                                    marginTop: 2,
                                }}
                            >
                                CONFIRMED · {placesCount} PLACES
                            </p>
                        </div>
                    </div>

                    {/* Circular right arrow button */}
                    <div
                        style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            background: hovered ? '#fe7717' : 'rgba(255,255,255,0.06)',
                            color: hovered ? '#ffffff' : 'rgba(255,255,255,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transform: hovered ? 'translateX(2px)' : 'translateX(0)',
                            transition: 'background 0.3s ease, color 0.3s ease, transform 0.3s cubic-bezier(0.16,1,0.3,1)',
                        }}
                    >
                        <ArrowRight size={12} />
                    </div>
                </div>
            </button>
        </div>
    );
}

export default function ProfileDropdown({ isLightPage, isScrolled, openUpwards = false }) {
    const { user, isLoaded } = useUser();
    const { signOut } = useClerk();
    const [isOpen, setIsOpen] = useState(false);
    const [userTrips, setUserTrips] = useState([]);
    const [showItinerarySubmenu, setShowItinerarySubmenu] = useState(false);
    const [isLoadingTrips, setIsLoadingTrips] = useState(false);
    const dropdownRef = useRef(null);
    const prefersReducedMotion = useReducedMotion();

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setShowItinerarySubmenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch user saved trips when dropdown opens
    useEffect(() => {
        if (isOpen && user) {
            async function loadTrips() {
                try {
                    setIsLoadingTrips(true);
                    const { data, error } = await supabase
                        .from('trips')
                        .select('id, destination_name, itinerary_data, created_at')
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false })
                        .limit(5);

                    if (!error && data) {
                        setUserTrips(data);
                    }
                } catch (e) {
                    console.warn("Failed to load user trips for dropdown:", e);
                } finally {
                    setIsLoadingTrips(false);
                }
            }
            loadTrips();
        }
    }, [isOpen, user]);

    if (!isLoaded || !user) return null;

    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'User';
    const initials = `${firstName.charAt(0)}${lastName ? lastName.charAt(0) : ''}`.toUpperCase() || 'U';
    const [imgError, setImgError] = useState(false);

    // Extract the most authentic avatar URL, prioritizing Google OAuth data over Clerk's default
    const googleAccount = user.externalAccounts?.find(acc => acc.provider === 'oauth_google' || acc.provider === 'google');
    const googleImage = googleAccount?.imageUrl || googleAccount?.avatarUrl || googleAccount?.picture;
    const avatarUrl = googleImage || user.imageUrl;
    const shouldAttemptImageLoad = Boolean(avatarUrl && !avatarUrl.includes('default_avatar'));

    const handleSelectTrip = (trip) => {
        if (typeof window !== 'undefined') {
            if (trip.itinerary_data) {
                const actualData = typeof trip.itinerary_data === 'string' ? trip.itinerary_data : JSON.stringify(trip.itinerary_data);
                localStorage.setItem('tripwise_itinerary', actualData);
            }
            if (trip.id) {
                localStorage.setItem('tripwise_trip_id', trip.id);
            }
            window.location.href = `/itinerary?trip_id=${trip.id}`;
        }
    };

    return (
        <div className="relative shrink-0" style={{ perspective: "1000px" }} ref={dropdownRef}>
            {/* The Avatar Trigger */}
            <div className="flex items-center gap-1.5 cursor-pointer group relative py-1" onClick={() => setIsOpen(!isOpen)}>
                
                {/* Avatar Bubble Container with Glow */}
                <div className="relative">
                    {/* Subtle glow ring on hover */}
                    <div className="absolute -inset-0.75 rounded-full bg-[#FF6B2C] opacity-0 group-hover:opacity-40 blur-[3px] transition-opacity duration-300 pointer-events-none" />
                    
                    {/* Avatar Bubble */}
                    <div className={`relative z-10 w-8 h-8 rounded-full overflow-hidden bg-[#FF6B2C] flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-[1.02] border border-transparent group-hover:border-white/20`}>
                        {shouldAttemptImageLoad && !imgError ? (
                            <img 
                                src={avatarUrl} 
                                alt="Profile" 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer"
                                crossOrigin="anonymous"
                                onError={(e) => {
                                    console.error("[TripWise Avatar Error] Image failed to load:", e);
                                    setImgError(true);
                                }}
                            />
                        ) : (
                            <span className="text-white text-[13px] font-bold font-sans tracking-normal select-none">
                                {initials}
                            </span>
                        )}
                    </div>
                </div>

                {/* Compass Needle */}
                <motion.div 
                    initial={false}
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10, mass: 1 }}
                    className={`flex items-center justify-center ${isLightPage && !isScrolled ? 'text-[#1F1F1F]/40 group-hover:text-[#FF6B2C]' : 'text-white/40 group-hover:text-[#FF6B2C]'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 16 12 12 22 8 12 12 2"></polygon>
                        <line x1="12" y1="2" x2="12" y2="22"></line>
                    </svg>
                </motion.div>
            </div>

            {/* The Custom Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Ghost Cards Stack */}
                        {!prefersReducedMotion && [0, 1, 2].map((i) => {
                            const startZ = -20 * (i + 1);
                            const startY = 4 * (i + 1);
                            const startOpacity = [0.4, 0.2, 0.08][i];
                            const startScale = [0.97, 0.94, 0.91][i];
                            
                            return (
                                <motion.div
                                    key={`ghost-${i}`}
                                    aria-hidden="true"
                                    initial={{ opacity: startOpacity, z: startZ, y: startY, scale: startScale }}
                                    animate={{ opacity: 0, z: startZ - 20 }}
                                    exit={{ opacity: 0, transition: { duration: 0 } }}
                                    transition={{ duration: 0.3, ease: "easeOut", delay: i * 0.03 }}
                                    className={`absolute ${openUpwards ? 'bottom-[calc(100%+12px)]' : 'top-[calc(100%+12px)]'} -right-6 w-72 h-63.75 bg-[#0a0a0a]/98 ring-1 ring-white/10 rounded-2xl z-[9999] pointer-events-none will-change-transform`}
                                />
                            );
                        })}

                        {/* Real Panel */}
                        <motion.div 
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={{
                                hidden: { 
                                    opacity: 0, 
                                    z: prefersReducedMotion ? 0 : -60,
                                    y: prefersReducedMotion ? 0 : (openUpwards ? -12 : 12),
                                    scale: prefersReducedMotion ? 1 : 0.9,
                                    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                                },
                                visible: { 
                                    opacity: 1, 
                                    z: 0,
                                    y: 0,
                                    scale: 1,
                                    boxShadow: "0 30px 80px rgba(0,0,0,0.8)",
                                    transition: { 
                                        type: "spring", 
                                        stiffness: 300, 
                                        damping: 30, 
                                        mass: 1 
                                    }
                                },
                                exit: { 
                                    opacity: 0, 
                                    z: prefersReducedMotion ? 0 : -60,
                                    scale: prefersReducedMotion ? 1 : 0.9, 
                                    transition: { duration: 0.15, ease: "easeOut" } 
                                }
                            }}
                            style={{ transformOrigin: openUpwards ? "bottom right" : "top right" }}
                            className={`absolute ${openUpwards ? 'bottom-[calc(100%+12px)]' : 'top-[calc(100%+12px)]'} -right-6 w-72 bg-[#0a0a0a]/98 ring-1 ring-white/10 rounded-2xl py-1.5 z-[10000] overflow-hidden backdrop-blur-3xl will-change-transform shadow-[0_30px_80px_rgba(0,0,0,0.8)]`}
                        >
                            
                            {/* Staggered Inner Content Wrapper */}
                            <motion.div
                                variants={{
                                    hidden: { opacity: 0 },
                                    visible: { 
                                        opacity: 1, 
                                        transition: { delayChildren: prefersReducedMotion ? 0 : 0.1, staggerChildren: 0.04 } 
                                    },
                                    exit: { opacity: 0, transition: { duration: 0.1 } }
                                }}
                            >
                                {/* User Info Header */}
                                <motion.div 
                                    variants={{
                                        hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 5 },
                                        visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } }
                                    }}
                                    className="px-5 py-4 mb-1 border-b border-white/5 bg-linear-to-b from-white/4 to-transparent"
                                >
                                <p className="text-[9px] text-white/30 font-mono tracking-[0.2em] uppercase mb-1.5">Signed in as</p>
                                <p className="text-[15px] font-medium text-white truncate">{fullName}</p>
                                <p className="text-[11px] text-white/40 truncate mt-0.5">{user.primaryEmailAddress?.emailAddress}</p>
                                </motion.div>
                                
                                {/* Links & Interactive Trip Selector */}
                                <motion.div 
                                    variants={{
                                        hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 5 },
                                        visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } }
                                    }}
                                    className="py-1.5 flex flex-col gap-1"
                                >
                                    {/* Main "My Itinerary" Button with Choices Dropdown Trigger */}
                                    <div className="mx-2 hidden md:block">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (userTrips.length > 0) {
                                                    setShowItinerarySubmenu(!showItinerarySubmenu);
                                                } else {
                                                    if (typeof window !== 'undefined') {
                                                        localStorage.removeItem('tripwise_itinerary');
                                                        localStorage.removeItem('tripwise_trip_id');
                                                        window.location.href = '/itinerary';
                                                    }
                                                }
                                            }}
                                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm text-[#FF6B2C] hover:bg-[#FF6B2C]/10 transition-all font-medium cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Map size={16} className="text-[#FF6B2C]" />
                                                <span>My Itinerary</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {userTrips.length > 0 && (
                                                    <span className="text-[10px] font-mono bg-[#FF6B2C]/20 text-[#FF6B2C] px-1.5 py-0.5 rounded-full font-bold">
                                                        {userTrips.length} {userTrips.length === 1 ? 'Trip' : 'Trips'}
                                                    </span>
                                                )}
                                                {userTrips.length > 0 && (
                                                    <motion.div 
                                                        initial={false}
                                                        animate={{ rotate: showItinerarySubmenu ? 180 : 0 }}
                                                        transition={{ type: "spring", stiffness: 220, damping: 12 }}
                                                        className="flex items-center justify-center text-[#FF6B2C]"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <polygon points="12 2 16 12 12 22 8 12 12 2"></polygon>
                                                            <line x1="12" y1="2" x2="12" y2="22"></line>
                                                        </svg>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </button>

                                        {/* Sub-menu Choice Selector for Multiple Trips */}
                                        <AnimatePresence>
                                            {showItinerarySubmenu && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="overflow-hidden bg-white/5 rounded-xl mt-1.5 p-1.5 border border-white/10 space-y-1 shadow-inner"
                                                >
                                                    <div className="flex items-center justify-between px-2.5 pt-1 pb-1.5">
                                                        <p className="text-[9px] font-mono text-white/40 tracking-widest uppercase">Select Itinerary to View</p>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2C] animate-pulse" />
                                                    </div>
                                                    
                                                    {isLoadingTrips ? (
                                                        <div className="p-3 text-center text-xs text-white/40 font-mono flex items-center justify-center gap-2">
                                                            <div className="w-3 h-3 border-2 border-[#FF6B2C] border-t-transparent rounded-full animate-spin" />
                                                            <span>Loading trips...</span>
                                                        </div>
                                                    ) : userTrips.length === 0 ? (
                                                        <div className="p-3 text-center">
                                                            <p className="text-xs text-white/60 mb-2 font-serif">No active trip dossier found</p>
                                                            <a
                                                                href="/itinerary"
                                                                className="inline-block px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#FF6B2C] hover:bg-[#FF6B2C]/80 transition-all shadow-xs"
                                                            >
                                                                Open Itinerary Page &rarr;
                                                            </a>
                                                        </div>
                                                    ) : (
                                                        userTrips.map((trip, idx) => (
                                                            <DropdownTripCard 
                                                                key={trip.id || idx} 
                                                                trip={trip} 
                                                                idx={idx} 
                                                                onSelect={handleSelectTrip} 
                                                            />
                                                        ))
                                                    )}

                                                    <a
                                                        href="/ai-planner"
                                                        className="flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold text-[#FF6B2C] bg-[#FF6B2C]/10 hover:bg-[#FF6B2C]/20 border border-[#FF6B2C]/20 hover:border-[#FF6B2C]/40 transition-all duration-300 mt-1.5 group"
                                                    >
                                                        <span className="group-hover:translate-x-0.5 transition-transform">View All Saved Trips</span>
                                                        <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                                    </a>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <a href="/settings" className="flex items-center gap-3 mx-2 px-3 py-2 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all">
                                        <Settings size={16} className="opacity-50" />
                                        Settings
                                    </a>
                                </motion.div>
                                
                                {/* Log Out */}
                                <motion.div 
                                    variants={{
                                        hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 5 },
                                        visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } }
                                    }}
                                    className="border-t border-white/5 py-1.5 mt-1"
                                >
                                    <button 
                                        onClick={() => signOut()}
                                        className="flex items-center gap-3 w-[calc(100%-16px)] text-left mx-2 px-3 py-2 rounded-xl text-sm text-[#FF6B2C]/90 hover:text-[#FF6B2C] hover:bg-[#FF6B2C]/10 transition-all"
                                    >
                                        <LogOut size={16} className="opacity-70" />
                                        Log Out
                                    </button>
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
