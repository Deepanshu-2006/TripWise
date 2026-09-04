'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

export default function TripCard({
  authorName,
  authorAvatar,
  destination,
  title,
  duration,
  coverImage,
  tags = [],
  saveCount = 0,
  upvoteCount = 0,
  onSave,
  onUnsave,
  variant = 'standard',
  className = '',
  tilt = 0,
  isActive = true
}) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const [isForking, setIsForking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [clonedTripId, setClonedTripId] = useState(null);
  const [localSaveCount, setLocalSaveCount] = useState(saveCount);

  const handleSaveClick = async (e) => {
    e.preventDefault();
    if (isSaving || (!onSave && !onUnsave)) return;
    setIsSaving(true);
    try {
      if (hasSaved && onUnsave && clonedTripId) {
        await onUnsave(clonedTripId);
        setHasSaved(false);
        setClonedTripId(null);
        setLocalSaveCount(prev => prev - 1);
      } else if (!hasSaved && onSave) {
        const res = await onSave();
        if (res && res.newTripId) setClonedTripId(res.newTripId);
        setHasSaved(true);
        setLocalSaveCount(prev => prev + 1);
      }
    } catch (e) {
      console.error('Failed to save/unsave trip', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleForkClick = (e) => {
    e.preventDefault();
    if (isForking || isSuccess) return;
    setIsForking(true);
    setTimeout(() => {
      setIsForking(false);
      setIsSuccess(true);
      setTimeout(() => {
        const prompt = `Plan a ${duration} trip to ${destination}`;
        router.push(`/ai-planner/new?action=new&prompt=${encodeURIComponent(prompt)}`);
      }, 800);
    }, 1200);
  };

  // 0. COVERFLOW 3D CINEMATIC VARIANT (For Apple-style Horizontal 3D Carousel)
  if (variant === 'coverflow') {
    return (
      <>
        <div
          className={`relative group w-full h-[390px] sm:h-[410px] md:h-[420px] rounded-3xl overflow-hidden transition-colors duration-200 bg-stone-900 border border-white/20 select-none ${
            isActive 
              ? 'ring-1 ring-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.35)]' 
              : 'shadow-none opacity-90'
          } ${className}`}
        >
          {/* Cover Image */}
          {!imgError ? (
            <img
              src={coverImage}
              alt={destination}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-stone-900 text-white">
              <span className="font-mono text-sm uppercase tracking-widest">{destination}</span>
            </div>
          )}

          {/* Premium Dark Gradient Scrims */}
          <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/45 to-black/20 opacity-90 transition-opacity z-10" />
          
          {/* Flanking Card Dimmer Overlay */}
          {!isActive && (
            <div className="absolute inset-0 bg-black/65 backdrop-blur-[1px] z-15 transition-opacity duration-300" />
          )}

          {/* Top Bar (Cleanly shown on active card, faded on flanking cards) */}
          <div className={`absolute top-4 left-4 right-4 flex items-center justify-between z-20 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(tags || []).slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="bg-white/20 backdrop-blur-md text-white border border-white/25 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-[0.12em]"
                >
                  {tag}
                </span>
              ))}
            </div>

            <span className="bg-black/65 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wide border border-white/25 shadow-sm">
              {duration}
            </span>
          </div>

          {/* Bottom Editorial Content */}
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 z-20 flex flex-col justify-end">
            {/* Author Profile (Only on active card) */}
            <div className={`flex items-center gap-2 mb-2 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <img
                src={authorAvatar}
                alt={authorName}
                className="w-6 h-6 rounded-full object-cover border border-white/40 shadow-xs shrink-0"
              />
              <span className="text-white/85 text-[10px] font-mono font-bold uppercase tracking-[0.15em] drop-shadow-sm">
                @{authorName || 'Traveler'}
              </span>
            </div>

            {/* Destination Title */}
            <h3 className={`font-serif font-bold text-white leading-tight mb-1.5 tracking-tight drop-shadow-md transition-all duration-300 ${
              isActive 
                ? 'text-2xl sm:text-3xl opacity-100 group-hover:text-[#F4703C]' 
                : 'text-lg sm:text-xl opacity-90'
            }`}>
              {destination}
            </h3>

            {/* Tagline / Description (Cleanly shown ONLY on active card, completely hidden on flanking cards) */}
            <p className={`text-white/75 text-xs sm:text-sm leading-relaxed font-light line-clamp-2 max-w-md drop-shadow-sm transition-all duration-300 ${
              isActive ? 'opacity-100 max-h-20 mb-4' : 'opacity-0 max-h-0 mb-0 overflow-hidden pointer-events-none'
            }`}>
              "{title || `An unforgettable ${duration} journey discovering culture, food, and secret spots across ${destination}.`}"
            </p>

            {/* Bottom Actions Row (Only visible & interactive on active card) */}
            <div className={`flex items-center justify-between pt-3 border-t border-white/20 transition-all duration-300 ${
              isActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none max-h-0 overflow-hidden border-transparent pt-0'
            }`}>
              {/* Stats: Upvotes & Saves */}
              <div className="flex items-center gap-3.5">
                <span className="flex items-center gap-1.5 text-white/90 text-[11px] font-mono font-bold">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#F4703C]">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                  <span>{upvoteCount}</span>
                </span>

                <button
                  onClick={handleSaveClick}
                  className={`flex items-center gap-1.5 text-[11px] font-mono font-bold transition-colors cursor-pointer ${hasSaved ? 'text-[#F4703C]' : 'text-white/80 hover:text-white'}`}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill={hasSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>{localSaveCount}</span>
                </button>
              </div>

              {/* Fork CTA */}
              <button
                onClick={handleForkClick}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.12em] transition-all duration-300 shadow-md cursor-pointer ${
                  isSuccess
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-stone-900 hover:bg-[#F4703C] hover:text-white hover:shadow-lg hover:shadow-[#F4703C]/30'
                }`}
              >
                {isForking ? (
                  <>
                    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Forking</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Forked!</span>
                  </>
                ) : (
                  <>
                    <span>Fork Itinerary</span>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Global Toast Overlay */}
        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {(isForking || isSuccess) && (
              <motion.div
                className="fixed bottom-20 sm:bottom-10 left-1/2 z-[9999] flex items-center justify-center pointer-events-none"
                initial={{ opacity: 0, y: 30, x: '-50%', scale: 0.95 }}
                animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
                exit={{ opacity: 0, y: 20, x: '-50%', scale: 0.95 }}
                transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
              >
                <div className="bg-white shadow-[0_16px_40px_-10px_rgba(0,0,0,0.15)] rounded-full p-1.5 pr-5 flex items-center gap-3 pointer-events-auto border border-stone-100">
                  {isForking ? (
                    <>
                      <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center shrink-0">
                        <svg className="animate-spin h-4 w-4 text-stone-700" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-100" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </div>
                      <span className="text-stone-800 text-[13px] font-semibold tracking-tight">Forking to AI Planner...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                        <svg className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-stone-800 text-[13px] font-semibold tracking-tight">Trip forked successfully</span>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </>
    );
  }

  // 1. BILLBOARD HERO VARIANT (Full 2-column wide landscape magazine card)
  if (variant === 'billboard') {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -6 }}
          className={`relative group w-full bg-white rounded-4xl overflow-hidden border border-stone-200/80 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.08)] hover:shadow-[0_24px_50px_-12px_rgba(244,112,60,0.22)] transition-all duration-500 ease-out grid grid-cols-1 md:grid-cols-12 ${className}`}
        >
          {/* Left Column: Rich Panoramic Image (7 cols) */}
          <div className="relative md:col-span-7 h-72 sm:h-80 md:h-full min-h-[340px] overflow-hidden bg-stone-100">
            {!imgError ? (
              <img
                src={coverImage}
                alt={destination}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-stone-100">
                <span className="font-mono text-xs text-stone-400 uppercase tracking-widest">{destination}</span>
              </div>
            )}

            {/* Gradient Scrim */}
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/20 opacity-70 group-hover:opacity-50 transition-opacity" />

            {/* Duration Tag */}
            <div className="absolute top-4 right-4">
              <span className="bg-black/65 backdrop-blur-md text-white px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wide border border-white/20">
                {duration}
              </span>
            </div>

            {/* Vibe Tags at Bottom of Image */}
            <div className="absolute bottom-4 left-4 flex flex-wrap gap-1.5">
              {(tags || []).slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="bg-black/40 backdrop-blur-md text-white/90 border border-white/20 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-[0.12em]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Right Column: Editorial Details (5 cols) */}
          <div className="relative md:col-span-5 p-7 sm:p-8 flex flex-col justify-between bg-linear-to-b from-white to-[#FDFBF7]">
            <div>
              {/* Creator & Verified Badge */}
              <div className="flex items-center gap-2.5 mb-4">
                <img
                  src={authorAvatar}
                  alt={authorName}
                  className="w-7 h-7 rounded-full object-cover border border-stone-200 shadow-xs shrink-0"
                />
                <div className="flex flex-col">
                  <span className="text-stone-800 text-[11px] font-mono font-bold uppercase tracking-[0.15em] truncate">
                    {authorName || 'Explorer'}
                  </span>
                  <span className="text-stone-400 text-[9px] font-mono uppercase tracking-wider">
                    Community Creator
                  </span>
                </div>
              </div>

              {/* Destination Title */}
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 leading-tight mb-2 tracking-tight group-hover:text-[#F4703C] transition-colors duration-300">
                {destination}
              </h3>

              {/* Tagline / Title */}
              <p className="text-stone-600 text-sm leading-relaxed mb-6 font-normal line-clamp-3">
                "{title || `An immersive ${duration} journey discovering hidden gems and iconic spots across ${destination}.`}"
              </p>
            </div>

            {/* Bottom Actions & Stats */}
            <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Upvotes */}
                <span className="flex items-center gap-1.5 text-stone-500 text-[12px] font-mono">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#F4703C]">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                  <span className="font-bold text-stone-700">{upvoteCount}</span>
                </span>

                {/* Bookmark Save */}
                <button
                  onClick={handleSaveClick}
                  className={`flex items-center gap-1.5 text-[12px] font-mono transition-colors cursor-pointer ${hasSaved ? 'text-[#F4703C]' : 'text-stone-400 hover:text-stone-700'}`}
                >
                  {isSaving ? (
                    <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={hasSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  )}
                  <span className="font-bold text-stone-700">{localSaveCount}</span>
                </button>
              </div>

              {/* Fork CTA */}
              <button
                onClick={handleForkClick}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-[0.14em] transition-all duration-300 shadow-sm cursor-pointer ${
                  isSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-900 text-white hover:bg-[#F4703C] hover:shadow-md hover:shadow-[#F4703C]/20'
                }`}
              >
                {isForking ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Forking</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Forked!</span>
                  </>
                ) : (
                  <>
                    <span>Fork Itinerary</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Global Toast Overlay */}
        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {(isForking || isSuccess) && (
              <motion.div
                className="fixed bottom-20 sm:bottom-10 left-1/2 z-[9999] flex items-center justify-center pointer-events-none"
                initial={{ opacity: 0, y: 30, x: '-50%', scale: 0.95 }}
                animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
                exit={{ opacity: 0, y: 20, x: '-50%', scale: 0.95 }}
                transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
              >
                <div className="bg-white shadow-[0_16px_40px_-10px_rgba(0,0,0,0.15)] rounded-full p-1.5 pr-5 flex items-center gap-3 pointer-events-auto border border-stone-100">
                  {isForking ? (
                    <>
                      <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center shrink-0">
                        <svg className="animate-spin h-4 w-4 text-stone-700" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-100" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </div>
                      <span className="text-stone-800 text-[13px] font-semibold tracking-tight">Forking to AI Planner...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                        <svg className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-stone-800 text-[13px] font-semibold tracking-tight">Trip forked successfully</span>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </>
    );
  }

  // 2. PORTRAIT STORYBOOK VARIANT (Tall 4:5 vertical photo card with overlaid typography)
  if (variant === 'portrait') {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -8, rotate: 0 }}
          style={{ rotate: tilt }}
          className={`relative group w-full h-[460px] rounded-4xl overflow-hidden shadow-[0_10px_35px_-8px_rgba(0,0,0,0.1)] hover:shadow-[0_25px_50px_-12px_rgba(244,112,60,0.25)] transition-all duration-500 ease-out border border-white/30 cursor-pointer ${className}`}
        >
          {/* Full-bleed Cover Photo */}
          {!imgError ? (
            <img
              src={coverImage}
              alt={destination}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-stone-800 text-stone-300">
              <span className="font-mono text-xs uppercase tracking-widest">{destination}</span>
            </div>
          )}

          {/* Dark Luxury Gradient Scrims */}
          <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/40 to-black/20 opacity-90 group-hover:opacity-80 transition-opacity" />

          {/* Top Bar */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
            <div className="flex flex-wrap gap-1.5">
              {(tags || []).slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="bg-white/20 backdrop-blur-md text-white border border-white/25 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-[0.12em]"
                >
                  {tag}
                </span>
              ))}
            </div>
            <span className="bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wide border border-white/20">
              {duration}
            </span>
          </div>

          {/* Bottom Editorial Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 z-20 flex flex-col justify-end">
            <div className="flex items-center gap-2 mb-2">
              <img
                src={authorAvatar}
                alt={authorName}
                className="w-6 h-6 rounded-full object-cover border border-white/40 shadow-xs shrink-0"
              />
              <span className="text-white/80 text-[10px] font-mono uppercase tracking-[0.15em] truncate">
                @{authorName || 'traveler'}
              </span>
            </div>

            <h3 className="text-2xl font-serif font-bold text-white leading-tight mb-2 tracking-tight group-hover:text-[#F4703C] transition-colors">
              {destination}
            </h3>

            <p className="text-white/70 text-xs line-clamp-2 mb-4 font-light">
              "{title || `Explore the hidden corners of ${destination}.`}"
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-white/15">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-white/80 text-[11px] font-mono">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#F4703C]">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                  <span className="font-bold">{upvoteCount}</span>
                </span>
                <button
                  onClick={handleSaveClick}
                  className={`flex items-center gap-1 text-[11px] font-mono transition-colors cursor-pointer ${hasSaved ? 'text-[#F4703C]' : 'text-white/70 hover:text-white'}`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill={hasSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="font-bold">{localSaveCount}</span>
                </button>
              </div>

              <button
                onClick={handleForkClick}
                className={`px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md border transition-all cursor-pointer ${
                  isSuccess 
                    ? 'bg-emerald-500 border-emerald-500 text-white' 
                    : 'bg-white/20 border-white/30 text-white hover:bg-[#F4703C] hover:border-[#F4703C]'
                }`}
              >
                {isForking ? 'Forking...' : isSuccess ? 'Forked!' : 'Fork Trip'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Global Toast Overlay */}
        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {(isForking || isSuccess) && (
              <motion.div
                className="fixed bottom-20 sm:bottom-10 left-1/2 z-[9999] flex items-center justify-center pointer-events-none"
                initial={{ opacity: 0, y: 30, x: '-50%', scale: 0.95 }}
                animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
                exit={{ opacity: 0, y: 20, x: '-50%', scale: 0.95 }}
                transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
              >
                <div className="bg-white shadow-[0_16px_40px_-10px_rgba(0,0,0,0.15)] rounded-full p-1.5 pr-5 flex items-center gap-3 pointer-events-auto border border-stone-100">
                  {isForking ? (
                    <>
                      <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center shrink-0">
                        <svg className="animate-spin h-4 w-4 text-stone-700" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-100" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </div>
                      <span className="text-stone-800 text-[13px] font-semibold tracking-tight">Forking to AI Planner...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                        <svg className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-stone-800 text-[13px] font-semibold tracking-tight">Trip forked successfully</span>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </>
    );
  }

  // 3. STANDARD & TILTED SCRAPBOOK VARIANT (Default for desktop mosaic and mobile fan deck)
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        whileHover={{ y: -6, rotate: 0 }}
        style={{ rotate: tilt }}
        className={`relative group w-full bg-white rounded-3xl overflow-hidden border border-stone-200/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_45px_-10px_rgba(244,112,60,0.18)] transition-all duration-500 ${className}`}
      >
        {/* Cover Image — 16:9 crop */}
        <div className="relative w-full aspect-video overflow-hidden bg-stone-100">
          {!imgError ? (
            <img
              src={coverImage}
              alt={destination}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-stone-100">
              <span className="font-mono text-xs text-stone-400 uppercase tracking-widest">{destination}</span>
            </div>
          )}

          {/* Vibe tags — top-left, minimal pill */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {(tags || []).slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="bg-white/90 backdrop-blur-sm text-stone-700 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-[0.12em] shadow-sm"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Duration — top-right */}
          <div className="absolute top-3 right-3">
            <span className="bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wide">
              {duration}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="px-5 pt-4 pb-5">
          {/* Author row */}
          <div className="flex items-center gap-2 mb-3">
            <img
              src={authorAvatar}
              alt={authorName}
              className="w-6 h-6 rounded-full object-cover border border-stone-200 shrink-0"
            />
            <span className="text-stone-400 text-[11px] font-mono uppercase tracking-[0.15em] truncate">
              {authorName || 'Anonymous'}
            </span>
          </div>

          {/* Destination title */}
          <h3 className="text-xl font-serif font-bold text-stone-900 leading-tight mb-4 tracking-tight group-hover:text-[#F4703C] transition-colors">
            {destination || 'Mystery Location'}
          </h3>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3">
            {/* Stats */}
            <div className="flex items-center gap-4">
              {/* Upvotes */}
              <span className="flex items-center gap-1.5 text-stone-400 text-[12px] font-mono">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
                <span className="font-bold text-stone-600">{upvoteCount}</span>
              </span>

              {/* Saves */}
              <button
                onClick={handleSaveClick}
                className={`flex items-center gap-1.5 text-[12px] font-mono transition-colors cursor-pointer ${hasSaved ? 'text-[#F4703C]' : 'text-stone-400 hover:text-stone-700'}`}
              >
                {isSaving ? (
                  <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill={hasSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                )}
                <span className="font-bold text-stone-600">{localSaveCount}</span>
              </button>
            </div>

            {/* Fork CTA */}
            <button
              onClick={handleForkClick}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.1em] transition-all duration-300 shrink-0 cursor-pointer ${
                isSuccess
                  ? 'bg-[#F4703C] text-white'
                  : 'bg-stone-900 text-white hover:bg-stone-700'
              }`}
            >
              {isForking ? (
                <>
                  <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Forking</span>
                </>
              ) : isSuccess ? (
                <>
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Forked!</span>
                </>
              ) : (
                <span>Fork Trip</span>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Global Toast Overlay via Portal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {(isForking || isSuccess) && (
            <motion.div
              className="fixed bottom-20 sm:bottom-10 left-1/2 z-[9999] flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0, y: 30, x: '-50%', scale: 0.95 }}
              animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
              exit={{ opacity: 0, y: 20, x: '-50%', scale: 0.95 }}
              transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
            >
              <div className="bg-white shadow-[0_16px_40px_-10px_rgba(0,0,0,0.15)] rounded-full p-1.5 pr-5 flex items-center gap-3 pointer-events-auto border border-stone-100">
                {isForking ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center shrink-0">
                      <svg className="animate-spin h-4 w-4 text-stone-700" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-100" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                    <span className="text-stone-800 text-[13px] font-semibold tracking-tight">Forking to AI Planner...</span>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                      <svg className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-stone-800 text-[13px] font-semibold tracking-tight">Trip forked successfully</span>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
