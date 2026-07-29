'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [gems, setGems] = useState(MOCK_GEMS);
  const [upvotedGems, setUpvotedGems] = useState(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGem, setNewGem] = useState({ location: '', description: '', imageUrl: '' });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewGem(prev => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpvote = (e, gemId) => {
    e.stopPropagation();
    setGems(prevGems => prevGems.map(gem => {
      if (gem.id === gemId) {
        const isUpvoted = upvotedGems.has(gemId);
        const nextUpvotes = isUpvoted ? gem.upvotes - 1 : gem.upvotes + 1;
        
        const newUpvoted = new Set(upvotedGems);
        if (isUpvoted) {
          newUpvoted.delete(gemId);
        } else {
          newUpvoted.add(gemId);
        }
        setUpvotedGems(newUpvoted);
        
        return { ...gem, upvotes: nextUpvotes };
      }
      return gem;
    }));
  };

  const handleSubmitGem = () => {
    if (!newGem.location || !newGem.description) return;
    
    const submittedGem = {
      id: Date.now(),
      imageUrl: newGem.imageUrl || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&auto=format&fit=crop&q=80',
      description: newGem.description,
      location: newGem.location,
      username: 'You',
      upvotes: 1,
      height: ['h-64', 'h-72', 'h-80', 'h-96'][Math.floor(Math.random() * 4)],
    };
    
    setGems(prev => [submittedGem, ...prev]);
    setIsModalOpen(false);
    setNewGem({ location: '', description: '', imageUrl: '' });
  };

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
        <button 
          onClick={() => setIsModalOpen(true)}
          className="group relative inline-flex items-center gap-3 px-7 py-3.5 bg-linear-to-r from-[#F4703C] to-[#E25C27] text-white rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_8px_20px_-6px_rgba(244,112,60,0.5)] hover:shadow-[0_14px_28px_-8px_rgba(244,112,60,0.6)] border border-white/10"
        >
          {/* Sweep Shine Effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-linear-to-r from-transparent via-white/20 to-transparent skew-x-12 transition-transform duration-1000 ease-in-out group-hover:translate-x-full" />
          
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
        {gems.map((gem) => (
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
              <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent opacity-90 z-10" />
              <div className="absolute inset-0 bg-linear-to-b from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
              
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
                <button 
                  onClick={(e) => handleUpvote(e, gem.id)}
                  className={`backdrop-blur-md border rounded-full px-3 py-1.5 transition-all duration-300 flex items-center gap-1.5 group/btn shadow-sm ${
                    upvotedGems.has(gem.id) 
                      ? 'bg-[#F4703C] border-[#F4703C] text-white' 
                      : 'bg-white/20 border-white/30 text-white hover:bg-[#F4703C] hover:border-[#F4703C]'
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${upvotedGems.has(gem.id) ? '' : 'group-hover/btn:-translate-y-0.5'}`}>
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

      {/* Submit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl z-10 overflow-hidden"
            >
              <h3 className="text-2xl font-serif font-bold text-stone-900 mb-6">Share a Hidden Gem</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-stone-500 mb-2">Location / City</label>
                  <input 
                    type="text"
                    value={newGem.location}
                    onChange={(e) => setNewGem({...newGem, location: e.target.value})}
                    placeholder="e.g. Secret Beach, Bali"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-900 focus:outline-none focus:border-[#F4703C] focus:ring-1 focus:ring-[#F4703C] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-stone-500 mb-2">Description (Max 100 chars)</label>
                  <textarea 
                    value={newGem.description}
                    onChange={(e) => setNewGem({...newGem, description: e.target.value})}
                    placeholder="Why is it special?"
                    maxLength={100}
                    rows={3}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-900 focus:outline-none focus:border-[#F4703C] focus:ring-1 focus:ring-[#F4703C] transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-stone-500 mb-2">Upload Photo (Optional)</label>
                  
                  <div className="relative">
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full bg-stone-50 border border-stone-200 border-dashed rounded-xl px-4 py-4 flex flex-col items-center justify-center text-stone-500 hover:border-[#F4703C] hover:text-[#F4703C] transition-colors group">
                      {newGem.imageUrl ? (
                        <div className="relative w-full h-32 rounded-lg overflow-hidden">
                           <img src={newGem.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-bold text-sm">
                             Click to change
                           </div>
                        </div>
                      ) : (
                        <>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                          </svg>
                          <span className="text-sm font-semibold">Click or drag image here</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 flex items-center justify-end gap-3">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 text-sm font-bold text-stone-500 hover:text-stone-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSubmitGem}
                    disabled={!newGem.location || !newGem.description}
                    className="px-6 py-2.5 bg-[#F4703C] hover:bg-[#E25C27] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-full shadow-sm transition-all"
                  >
                    Post Gem
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
