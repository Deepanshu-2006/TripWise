'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CONTRIBUTORS = [
  {
    id: 1,
    name: 'Elena R.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    badge: 'Verified Local',
    count: 142
  },
  {
    id: 2,
    name: 'Kenji S.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    badge: '100+ Itineraries',
    count: 128
  },
  {
    id: 3,
    name: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    badge: 'Verified Local',
    count: 95
  },
  {
    id: 4,
    name: 'Marcus T.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    badge: 'Top Reviewer',
    count: 87
  },
  {
    id: 5,
    name: 'Anna Kowalski',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    badge: '50+ Itineraries',
    count: 64
  },
  {
    id: 6,
    name: 'David Kim',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    badge: 'Verified Local',
    count: 58
  },
  {
    id: 7,
    name: 'Lisa Wong',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    badge: 'Photographer',
    count: 42
  },
  {
    id: 8,
    name: 'James Smith',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    badge: '10+ Itineraries',
    count: 31
  }
];

export default function TopContributors() {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleContributors = isExpanded ? CONTRIBUTORS : CONTRIBUTORS.slice(0, 5);
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #44403c;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #F4703C;
        }
      `}} />
      <div className="sticky top-[100px] h-fit w-full">
        <div className="relative bg-stone-900/95 backdrop-blur-2xl rounded-[2rem] p-6 md:p-8 shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-stone-700/50 flex flex-col overflow-hidden group/board">
          
          {/* Subtle top edge glow */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#F4703C]/30 to-transparent opacity-50" />

          {/* Header */}
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F4703C]/20 to-transparent flex items-center justify-center border border-[#F4703C]/30 group-hover/board:border-[#F4703C]/60 group-hover/board:shadow-[0_0_20px_rgba(244,112,60,0.2)] transition-all duration-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="url(#trophy-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-[pulse_3s_ease-in-out_infinite]">
                <defs>
                  <linearGradient id="trophy-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F97316" />
                    <stop offset="100%" stopColor="#EA580C" />
                  </linearGradient>
                </defs>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
            <div>
              <h3 className="text-[#F4703C] font-mono font-bold text-[11px] uppercase tracking-[0.2em]">
                Leaderboard
              </h3>
              <p className="text-white font-serif font-bold text-lg leading-none mt-1">Top Contributors</p>
            </div>
          </div>

          <div className={`flex flex-col max-h-[420px] overflow-y-auto overflow-x-hidden custom-scrollbar pr-4 relative z-10 ${visibleContributors.length > 5 ? '[mask-image:linear-gradient(to_bottom,black_calc(100%-40px),transparent_100%)] pb-8' : 'pb-2'}`}>
            {visibleContributors.map((user, index) => (
              <div key={user.id} className="relative group/row">
                {/* Custom separator line with subtle gradient fade */}
                {index !== 0 && (
                  <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-stone-700/50 to-transparent" />
                )}
                
                <div className="relative flex items-center justify-between py-4 px-3 rounded-2xl shrink-0 transition-all duration-300 hover:bg-stone-800/40 hover:scale-[1.02] cursor-pointer z-10 overflow-hidden">
                  {/* Subtle sweep background on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#F4703C]/0 via-[#F4703C]/5 to-transparent -translate-x-full group-hover/row:translate-x-0 transition-transform duration-500 ease-out z-0" />
                  
                  <div className="flex items-center gap-4 relative z-10">
                    {/* Ultra-Premium 3D Medals */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform duration-500 group-hover/row:scale-110 group-hover/row:rotate-[360deg] relative ${
                      index === 0 ? 'bg-gradient-to-br from-[#FFD700] via-[#FFA500] to-[#D97706] shadow-[inset_0_2px_5px_rgba(255,255,255,0.7),inset_0_-2px_5px_rgba(0,0,0,0.2),0_0_20px_rgba(245,158,11,0.4)] text-[#431407]' :
                      index === 1 ? 'bg-gradient-to-br from-[#F8FAFC] via-[#CBD5E1] to-[#94A3B8] shadow-[inset_0_2px_5px_rgba(255,255,255,0.9),inset_0_-2px_5px_rgba(0,0,0,0.2),0_0_20px_rgba(148,163,184,0.3)] text-[#0F172A]' :
                      index === 2 ? 'bg-gradient-to-br from-[#FDBA74] via-[#F97316] to-[#9A3412] shadow-[inset_0_2px_5px_rgba(255,255,255,0.5),inset_0_-2px_5px_rgba(0,0,0,0.3),0_0_20px_rgba(234,88,12,0.3)] text-[#FFF7ED]' :
                      'bg-stone-800 border border-stone-700 shadow-[inset_0_2px_4px_rgba(255,255,255,0.05)] text-stone-400 group-hover/row:border-stone-500 group-hover/row:text-stone-200'
                    }`}>
                      <span className="font-serif font-black text-sm tracking-tighter relative z-10">{index + 1}</span>
                      {index < 3 && (
                         <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/0 via-white/40 to-white/0 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300" />
                      )}
                    </div>
                    
                    {/* Avatar */}
                    <div className="relative">
                      {/* Avatar Glow Ring on Hover (placed BEFORE the image in DOM, or use negative z-index) */}
                      <div className="absolute inset-[-3px] rounded-full bg-gradient-to-tr from-[#F4703C] to-[#E25C27] opacity-0 group-hover/row:opacity-100 transition-opacity duration-500 blur-[2px]" />
                      <div className="absolute inset-[-1.5px] rounded-full bg-gradient-to-tr from-[#F4703C] to-[#E25C27] opacity-0 group-hover/row:opacity-100 transition-opacity duration-500" />
                      
                      <img 
                        src={user.avatar} 
                        alt={user.name}
                        className="w-12 h-12 rounded-full border border-stone-700 object-cover relative z-10"
                      />
                    </div>
                    
                    {/* Name & Pill */}
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-stone-200 font-serif font-bold text-base group-hover/row:text-white transition-colors duration-300">
                        {user.name}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-[0.1em] transition-colors duration-300 shadow-sm ${
                        user.badge.includes('Verified') 
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-900 group-hover/row:border-emerald-500/60' 
                          : 'bg-stone-800/80 text-stone-400 border border-stone-700 group-hover/row:border-stone-500/60'
                      }`}>
                        {user.badge}
                      </span>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex flex-col items-end relative z-10">
                    <span className="text-white font-mono font-bold text-lg group-hover/row:text-[#F4703C] transition-colors duration-300 drop-shadow-md">
                      {user.count}
                    </span>
                    <span className="text-stone-500 font-mono text-[9px] uppercase tracking-[0.2em] group-hover/row:text-stone-400 transition-colors duration-300">
                      Pts
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="group relative w-full mt-6 py-3.5 bg-stone-800 hover:bg-stone-800 text-stone-300 hover:text-white text-xs font-mono font-bold uppercase tracking-[0.2em] rounded-full overflow-hidden transition-all duration-300 shrink-0 border border-stone-700 hover:border-transparent shadow-sm hover:shadow-[0_8px_20px_rgba(244,112,60,0.2)] hover:-translate-y-0.5"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#F4703C] to-[#E25C27] opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out" />
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isExpanded ? 'Show Less' : 'View Full Leaderboard'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'group-hover:translate-x-1'}`}>
                {isExpanded ? (
                  <>
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </>
                ) : (
                  <>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </>
                )}
              </svg>
            </span>
          </button>
        </div>
    </div>
    </>
  );
}
