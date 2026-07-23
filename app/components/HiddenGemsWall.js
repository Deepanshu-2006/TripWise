'use client';

import React from 'react';

const MOCK_GEMS = [
  {
    id: 1,
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
    description: 'A tiny basement speakeasy serving the best natural wines.',
    location: 'Shibuya, Tokyo',
    username: 'wanderlust99',
    upvotes: 124,
    height: 'h-64',
  },
  {
    id: 2,
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
    description: 'Family-run trattoria tucked away in a quiet alley.',
    location: 'Trastevere, Rome',
    username: 'pasta_lover',
    upvotes: 89,
    height: 'h-80',
  },
  {
    id: 3,
    imageUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&auto=format&fit=crop&q=80',
    description: 'Secret sunset viewing spot with panoramic city views.',
    location: 'Montmartre, Paris',
    username: 'sunset_chaser',
    upvotes: 210,
    height: 'h-72',
  },
  {
    id: 4,
    imageUrl: 'https://images.unsplash.com/photo-1473081556163-2a17de81fc97?w=600&auto=format&fit=crop&q=80',
    description: 'Abandoned botanical garden reclaimed by nature.',
    location: 'Sintra, Portugal',
    username: 'green_explorer',
    upvotes: 342,
    height: 'h-96',
  },
  {
    id: 5,
    imageUrl: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=600&auto=format&fit=crop&q=80',
    description: 'Underground indie bookstore with rare first editions.',
    location: 'Brooklyn, NY',
    username: 'bookworm_travels',
    upvotes: 56,
    height: 'h-64',
  }
];

export default function HiddenGemsWall() {
  return (
    <div className="py-16">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h2 className="text-[#F4703C] font-mono font-bold text-xs uppercase tracking-[0.2em] mb-3">
            Local Hidden Gems
          </h2>
          <h3 className="text-3xl font-serif font-bold text-stone-900 mb-2 leading-tight">
            Uncover Local Secrets
          </h3>
          <p className="text-stone-500 text-sm">Off the beaten path spots shared by the community.</p>
        </div>
        <button className="group relative inline-flex items-center gap-3 px-7 py-3.5 bg-gradient-to-r from-[#F4703C] to-[#E25C27] text-white rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_8px_20px_-6px_rgba(244,112,60,0.5)] hover:shadow-[0_14px_28px_-8px_rgba(244,112,60,0.6)] border border-white/10">
          {/* Sweep Shine Effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 transition-transform duration-1000 ease-in-out group-hover:translate-x-full" />
          
          <div className="relative z-10 flex items-center justify-center bg-white/20 rounded-full p-1 transition-transform duration-500 group-hover:rotate-180">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </div>
          <span className="relative z-10 font-mono text-[11px] font-bold uppercase tracking-[0.15em] drop-shadow-sm pr-1 mt-px">
            Submit a Hidden Gem
          </span>
        </button>
      </div>

      {/* Masonry/Columns Grid */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
        {MOCK_GEMS.map((gem) => (
          <div 
            key={gem.id} 
            className="break-inside-avoid mb-6 relative group rounded-3xl overflow-hidden bg-stone-900 cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-[#F4703C]/30 hover:-translate-y-2 transition-all duration-500 border border-stone-200/50"
          >
            {/* Full Image Background */}
            <div className={`relative w-full ${gem.height}`}>
              <img 
                src={gem.imageUrl} 
                alt={gem.location}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              />
              
              {/* Darkening Overlay & Gradients */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-500 z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90 z-10" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
              
              {/* Top Bar: User & Upvotes */}
              <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-20">
                <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-y-2 group-hover:translate-y-0">
                  <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-[10px] font-bold font-mono uppercase shadow-sm">
                    {gem.username.charAt(0)}
                  </div>
                  <span className="text-white/90 text-[10px] font-mono font-bold uppercase tracking-wider drop-shadow-md">
                    @{gem.username}
                  </span>
                </div>
                
                {/* Upvote Pill */}
                <button className="bg-white/20 backdrop-blur-md hover:bg-[#F4703C] hover:border-[#F4703C] text-white border border-white/30 rounded-full px-3 py-1.5 transition-all duration-300 flex items-center gap-1.5 group/btn shadow-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover/btn:-translate-y-0.5 transition-transform">
                    <path d="M12 19V5M5 12l7-7 7 7"/>
                  </svg>
                  <span className="text-xs font-bold font-mono mt-px">{gem.upvotes}</span>
                </button>
              </div>
              
              {/* Bottom Content: Location & Description */}
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 flex flex-col justify-end z-20">
                {/* Location Pill */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 w-max mb-3 group-hover:bg-[#F4703C] group-hover:border-[#F4703C] group-hover:text-white transition-all duration-300 shadow-sm">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span className="text-[10px] font-bold uppercase tracking-widest font-mono mt-px">
                    {gem.location}
                  </span>
                </div>
                
                <h4 className="text-white font-serif text-xl sm:text-2xl leading-tight group-hover:text-white transition-colors duration-300 drop-shadow-md">
                  "{gem.description}"
                </h4>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
