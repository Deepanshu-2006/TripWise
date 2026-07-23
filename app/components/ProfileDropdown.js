'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Map, User as UserIcon, Settings, LogOut } from 'lucide-react';

export default function ProfileDropdown({ isLightPage, isScrolled }) {
    const { user, isLoaded } = useUser();
    const { signOut } = useClerk();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const prefersReducedMotion = useReducedMotion();

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

    // Log the resolved avatar data to the browser console for debugging
    useEffect(() => {
        console.log("[TripWise Avatar Debug]", {
            clerkImageUrl: user.imageUrl,
            googleImage: googleImage,
            finalResolvedUrl: avatarUrl,
            hasImageFlag: user.hasImage,
            externalAccounts: user.externalAccounts
        });
    }, [user]);

    // Match the exact typography and hover states of the nav links (My Trips, Community)
    const textClasses = `font-mono text-[11px] font-bold ${isLightPage ? 'text-[#1F1F1F]/80 group-hover:text-[#FF6B2C]' : 'text-white/60 group-hover:text-[#fe7717]'} transition-all duration-500 uppercase whitespace-nowrap ${isScrolled ? "tracking-widest" : "tracking-[0.16em]"}`;

    return (
        <div className="relative shrink-0" style={{ perspective: "1000px" }} ref={dropdownRef}>
            {/* The Avatar Trigger */}
            <div className="flex items-center gap-1.5 cursor-pointer group relative py-1" onClick={() => setIsOpen(!isOpen)}>
                
                {/* Avatar Bubble Container with Glow */}
                <div className="relative">
                    {/* Subtle glow ring on hover */}
                    <div className="absolute inset-[-3px] rounded-full bg-[#FF6B2C] opacity-0 group-hover:opacity-40 blur-[3px] transition-opacity duration-300 pointer-events-none" />
                    
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
                        {/* Compass Needle Diamond */}
                        <polygon points="12 2 16 12 12 22 8 12 12 2"></polygon>
                        {/* Center dividing line */}
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
                                    className="absolute top-[calc(100%+12px)] right-0 w-64 h-[255px] bg-[#0a0a0a]/98 ring-1 ring-white/10 rounded-2xl z-[99] pointer-events-none will-change-transform"
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
                                    y: prefersReducedMotion ? 0 : 12,
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
                            style={{ transformOrigin: "top right" }}
                            className="absolute top-[calc(100%+12px)] right-0 w-64 bg-[#0a0a0a]/98 ring-1 ring-white/10 rounded-2xl py-1.5 z-[100] overflow-hidden backdrop-blur-3xl will-change-transform shadow-[0_30px_80px_rgba(0,0,0,0.8)]"
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
                                    className="px-5 py-4 mb-1 border-b border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent"
                                >
                                <p className="text-[9px] text-white/30 font-mono tracking-[0.2em] uppercase mb-1.5">Signed in as</p>
                                <p className="text-[15px] font-medium text-white truncate">{fullName}</p>
                                <p className="text-[11px] text-white/40 truncate mt-0.5">{user.primaryEmailAddress?.emailAddress}</p>
                                </motion.div>
                                
                                {/* Links */}
                                <motion.div 
                                    variants={{
                                        hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 5 },
                                        visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } }
                                    }}
                                    className="py-1.5 flex flex-col gap-0.5"
                                >
                                    <a href="#my-trips" className="flex items-center gap-3 mx-2 px-3 py-2 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all">
                                        <Map size={16} className="opacity-50" />
                                        My Trips
                                    </a>
                                    <a href="/profile" className="flex items-center gap-3 mx-2 px-3 py-2 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all">
                                        <UserIcon size={16} className="opacity-50" />
                                        My Profile
                                    </a>
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
