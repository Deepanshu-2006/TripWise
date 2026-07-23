'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function TripCard({
  authorName,
  authorAvatar,
  destination,
  duration,
  coverImage,
  tags = [],
  saveCount = 0,
  upvoteCount = 0,
}) {
  const [imgError, setImgError] = useState(false);
  const [isForking, setIsForking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -60, y: 40, rotate: -8, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, y: 40, rotate: 8, scale: 0.8 }}
      transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
      className="relative group flex flex-col bg-stone-900 rounded-[2rem] overflow-hidden shadow-xl shadow-stone-200/50 hover:shadow-2xl hover:shadow-[#F4703C]/20 hover:-translate-y-1 transition-all duration-300 border border-stone-800"
    >
      {/* Full-Bleed Cover Image */}
      <div className="absolute inset-0 w-full h-full bg-stone-800">
        {!imgError ? (
          <img
            src={coverImage}
            alt={destination}
            onError={() => setImgError(true)}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s] ease-out"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center">
            <span className="text-stone-500 font-mono text-xs uppercase tracking-widest">{destination}</span>
          </div>
        )}
        {/* Seamless gradient overlay blending into the card body */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10 opacity-90 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* Card Content Overlay */}
      <div className="px-7 pb-8 pt-12 flex flex-col flex-grow relative z-10 h-full min-h-[440px] justify-end">
        
        {/* Top/Floating elements could go here, but we focus on bottom weight for cinematic feel */}
        
        <div className="flex flex-col mt-auto">
          {/* Author Row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative group/avatar">
              <img
                src={authorAvatar}
                alt={authorName}
                className="w-10 h-10 rounded-full border-2 border-white/20 object-cover relative z-10 shadow-lg group-hover/avatar:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover/avatar:opacity-100 blur-[4px] transition-opacity duration-300 z-0" />
            </div>
            <span className="text-stone-200 text-[11px] font-mono font-bold uppercase tracking-[0.2em] group-hover:text-white transition-colors drop-shadow-md">
              {authorName}
            </span>
          </div>

          {/* Title (Destination + Duration) */}
          <h3 className="text-3xl font-serif font-extrabold text-white mb-4 leading-tight transition-all duration-500 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-stone-300 drop-shadow-lg">
            {destination} &middot; {duration}
          </h3>

          {/* Tag Chips (Glassmorphic) */}
          <div className="flex flex-wrap gap-2 mb-6">
            {tags.map((tag) => (
              <span
                key={tag}
                className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-full uppercase font-mono text-[9px] tracking-[0.15em] font-bold backdrop-blur-md shadow-sm group-hover:border-white/40 transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Footer Row */}
          <div className="mt-2 flex items-center justify-between gap-x-2 gap-y-4 flex-wrap pt-5 border-t border-white/10">
            {/* Stats */}
            <div className="flex items-center gap-5 text-white/70 shrink-0">
              {/* Upvotes */}
              <button className="flex items-center gap-2 hover:text-white transition-colors group/btn">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="group-hover/btn:-translate-y-1 transition-transform duration-300"
                >
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
                <span className="text-[13px] font-bold font-mono">{upvoteCount}</span>
              </button>
              {/* Saves */}
              <button className="flex items-center gap-2 hover:text-white transition-colors group/btn">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="group-hover/btn:scale-110 transition-all duration-300"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                <span className="text-[13px] font-bold font-mono">{saveCount}</span>
              </button>
            </div>

            {/* Fork Button */}
            <button 
              onClick={(e) => {
                e.preventDefault();
                if (isForking || isSuccess) return;
                setIsForking(true);
                setTimeout(() => {
                  setIsForking(false);
                  setIsSuccess(true);
                  setTimeout(() => setIsSuccess(false), 3000);
                }, 1500);
              }}
              className={`relative inline-flex items-center justify-center gap-1.5 px-4 py-2.5 ${isSuccess ? 'bg-[#F4703C] text-white border-transparent' : 'bg-white/10 hover:bg-white backdrop-blur-sm border border-white/20 hover:border-transparent text-white hover:text-stone-900'} font-mono text-[9px] font-bold uppercase tracking-[0.15em] rounded-full transition-all duration-500 shadow-lg ${!isSuccess && 'hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:-translate-y-0.5'} group/fork overflow-hidden shrink-0 whitespace-nowrap`}
            >
               <span className="relative z-10 flex flex-col items-center leading-tight">
                 {isForking ? (
                   <span className="flex items-center gap-1.5">
                     <svg className="animate-spin h-3 w-3 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     Forking
                   </span>
                 ) : isSuccess ? (
                   <span className="flex items-center gap-1.5">
                     <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                     </svg>
                     Forked!
                   </span>
                 ) : (
                   <span>Fork Trip</span>
                 )}
               </span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
