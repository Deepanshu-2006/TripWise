'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

export default function TripCard({
  authorName,
  authorAvatar,
  destination,
  duration,
  coverImage,
  tags = [],
  saveCount = 0,
  upvoteCount = 0,
  onSave,
  onUnsave
}) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const [isForking, setIsForking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [clonedTripId, setClonedTripId] = useState(null);
  const [localSaveCount, setLocalSaveCount] = useState(saveCount);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative group w-full bg-white rounded-3xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-md transition-shadow duration-500"
      >
        {/* Cover Image — 16:9 crop, no overlay */}
        <div className="relative w-full aspect-video overflow-hidden bg-stone-100">
          {!imgError ? (
            <img
              src={coverImage}
              alt={destination}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
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
          <h3 className="text-xl font-serif font-bold text-stone-900 leading-tight mb-4 tracking-tight">
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
                onClick={async (e) => {
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
                }}
                className={`flex items-center gap-1.5 text-[12px] font-mono transition-colors ${hasSaved ? 'text-[#F4703C]' : 'text-stone-400 hover:text-stone-700'}`}
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
              onClick={(e) => {
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
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.1em] transition-all duration-300 shrink-0 ${
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
