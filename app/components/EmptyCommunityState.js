import React from 'react';

export default function EmptyCommunityState() {
  return (
    <div className="relative overflow-hidden flex flex-col items-center justify-center bg-stone-50/50 rounded-3xl border border-stone-200 p-16 md:p-24 text-center group hover:bg-white transition-all duration-700 shadow-sm hover:shadow-2xl hover:shadow-[#F4703C]/10 hover:-translate-y-1">
      
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#F4703C]/0 rounded-full blur-[80px] group-hover:bg-[#F4703C]/5 group-hover:scale-150 transition-all duration-1000 ease-out pointer-events-none" />
      
      {/* Animated Icon Container */}
      <div className="relative z-10 w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-md shadow-stone-200/50 group-hover:-translate-y-2 group-hover:shadow-xl group-hover:shadow-[#F4703C]/20 transition-all duration-500 border border-stone-100">
        
        {/* Pulsing Ripple Effect */}
        <div className="absolute inset-0 border-2 border-[#F4703C]/0 rounded-full scale-100 group-hover:scale-[1.7] group-hover:border-[#F4703C]/30 transition-all duration-1000 ease-out opacity-100 group-hover:opacity-0" />
        <div className="absolute inset-0 border border-[#F4703C]/0 rounded-full scale-100 group-hover:scale-[2.2] group-hover:border-[#F4703C]/10 transition-all duration-1000 delay-100 ease-out opacity-100 group-hover:opacity-0" />
        
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-300 group-hover:text-[#F4703C] transition-colors duration-500 relative z-10">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          <line x1="12" y1="11" x2="12" y2="17"></line>
          <line x1="9" y1="14" x2="15" y2="14"></line>
        </svg>
      </div>

      {/* Text Content */}
      <h3 className="relative z-10 text-3xl font-serif font-bold text-stone-900 mb-4 tracking-tight group-hover:text-[#F4703C] transition-colors duration-500">
        Nothing shared yet
      </h3>
      <p className="relative z-10 text-stone-500 font-sans text-sm md:text-base max-w-sm mb-10 leading-relaxed transition-colors duration-500 group-hover:text-stone-600">
        Your travel diary is waiting to be written. Use our AI to craft your next perfect adventure, then share it with the world!
      </p>

      {/* Premium CTA Button */}
      <a 
        href="/ai-planner"
        className="relative z-10 group/btn inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#F4703C] to-[#E25C27] text-white rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_8px_20px_-6px_rgba(244,112,60,0.5)] hover:shadow-[0_14px_28px_-8px_rgba(244,112,60,0.6)] border border-white/10"
      >
        {/* Sweep Shine Effect */}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 transition-transform duration-1000 ease-in-out group-hover/btn:translate-x-full" />
        
        <span className="relative z-10 font-mono text-[11px] font-bold uppercase tracking-[0.15em] drop-shadow-sm mt-px">
          Plan My Trip
        </span>
        
        <div className="relative z-10 flex items-center justify-center bg-white/20 rounded-full p-1.5 transition-transform duration-500 group-hover/btn:translate-x-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </div>
      </a>
    </div>
  );
}
