import React from 'react';

export default function CommunityCTA() {
  return (
    <div className="bg-stone-900 text-white py-24 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Decorators */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[140%] bg-[#F4703C]/5 blur-[120px] rounded-full rotate-12" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[40%] h-[100%] bg-blue-500/5 blur-[100px] rounded-full -rotate-12" />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h2 className="text-[#F4703C] font-mono font-bold text-xs md:text-sm uppercase tracking-[0.2em] mb-6">
          Contribute
        </h2>

        <h3 className="text-4xl md:text-5xl lg:text-6xl font-serif font-extrabold mb-8 leading-tight">
          Your trip could inspire <br className="hidden md:block" /> the next traveler.
        </h3>

        <p className="text-stone-400 font-mono text-sm md:text-base uppercase tracking-widest mb-10 max-w-2xl mx-auto">
          Join 12,000+ travelers sharing real itineraries
        </p>

        <button className="group relative inline-flex items-center justify-center px-8 sm:px-12 py-5 sm:py-6 rounded-full bg-[#FF5B1D] hover:bg-[#ff6c34] text-white font-extrabold text-lg sm:text-2xl tracking-wide shadow-[0_0_50px_rgba(249,115,22,0.4)] hover:shadow-[0_0_80px_rgba(249,115,22,0.6)] transition-shadow duration-300 cursor-pointer overflow-hidden border border-white/20 mx-auto">
          {/* Sweeping Shine Effect */}
          <span className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-[-25deg] -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out pointer-events-none"></span>
          
          <span className="relative z-10 flex items-center gap-3">
            <span>[ Share Your Trip ]</span>
            <svg className="w-6 h-6 transition-transform duration-300 group-hover:translate-x-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
}
