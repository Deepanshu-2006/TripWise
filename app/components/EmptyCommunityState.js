import React from 'react';

export default function EmptyCommunityState() {
  return (
    <div className="relative w-full overflow-hidden flex flex-col items-center justify-center bg-linear-to-br from-stone-50 to-stone-100/50 rounded-[3rem] border border-stone-200/60 p-16 md:p-24 text-center group hover:bg-white transition-all duration-700 shadow-sm hover:shadow-xl hover:shadow-[#F4703C]/10">

      {/* Decorative Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-size-[40px_40px] mask-[radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

      {/* Subtle Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-linear-to-tr from-[#F4703C]/0 via-[#F4703C]/5 to-transparent rounded-full blur-[80px] group-hover:scale-110 transition-all duration-1000 ease-out pointer-events-none" />

      {/* Floating Elements (Visible on Hover) */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Plane */}
        <div className="absolute top-[20%] left-[20%] text-[#F4703C]/30 opacity-0 -translate-y-8 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-1000 -rotate-12 ease-out">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </div>
        {/* Map Pin */}
        <div className="absolute bottom-[25%] left-[25%] text-stone-300 opacity-0 translate-y-8 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-1000 delay-100 ease-out">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
        </div>
        {/* Compass */}
        <div className="absolute top-[25%] right-[20%] text-stone-300 opacity-0 translate-x-8 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-1000 delay-200 rotate-12 ease-out">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
        </div>
        {/* Sun/Star */}
        <div className="absolute bottom-[20%] right-[25%] text-[#F4703C]/20 opacity-0 translate-y-8 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-1000 delay-300 ease-out">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
        </div>
      </div>

      {/* Animated Icon Container */}
      <div className="relative z-10 w-28 h-28 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center mb-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_rgba(244,112,60,0.15)] transition-all duration-500 border border-white">

        {/* Pulsing Ripple Effect */}
        <div className="absolute inset-0 border-2 border-[#F4703C]/0 rounded-full scale-100 group-hover:scale-[1.5] group-hover:border-[#F4703C]/40 transition-all duration-1000 ease-out opacity-100 group-hover:opacity-0" />
        <div className="absolute inset-0 border border-[#F4703C]/0 rounded-full scale-100 group-hover:scale-[2] group-hover:border-[#F4703C]/20 transition-all duration-1000 delay-100 ease-out opacity-100 group-hover:opacity-0" />

        {/* Icon */}
        <div className="relative z-10 w-14 h-14 bg-linear-to-br from-stone-100 to-stone-200 rounded-full flex items-center justify-center group-hover:from-[#F4703C]/10 group-hover:to-[#F4703C]/20 transition-colors duration-500">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400 group-hover:text-[#F4703C] transition-colors duration-500">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            <line x1="12" y1="11" x2="12" y2="17"></line>
            <line x1="9" y1="14" x2="15" y2="14"></line>
          </svg>
        </div>
      </div>

      {/* Text Content */}
      <h3 className="relative z-10 text-4xl font-serif font-bold text-stone-900 mb-4 tracking-tight group-hover:text-[#F4703C] transition-colors duration-500">
        Your Canvas is Blank
      </h3>
      <p className="relative z-10 text-stone-500 font-sans text-base max-w-md mb-10 leading-relaxed transition-colors duration-500 group-hover:text-stone-600">
        No trips shared yet! It's time to dream up your next big adventure. Use our AI to craft the perfect itinerary, then publish it here to inspire the world.
      </p>

      {/* Premium CTA Button */}
      <a
        href="/ai-planner"
        className="relative z-10 group/btn inline-flex items-center gap-4 px-8 py-4 bg-stone-900 hover:bg-stone-800 text-white rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-2xl hover:shadow-stone-900/20 border border-stone-800 hover:border-stone-700"
      >
        <span className="relative z-10 font-mono text-[11px] font-bold uppercase tracking-[0.2em] mt-px ml-2">
          Start Planning
        </span>

        <div className="relative z-10 flex items-center justify-center bg-white/10 rounded-full p-2 transition-transform duration-500 group-hover/btn:translate-x-1 group-hover/btn:bg-[#F4703C] group-hover/btn:text-white">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </div>
      </a>
    </div>
  );
}
