'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import Image from 'next/image';

function StickyGemCard({ gem, index, totalCards, showcaseProgress, children }) {
  const containerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const { scrollYProgress: rawStackProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "start -100%"]
  });
  const stackProgress = useSpring(rawStackProgress, { stiffness: 100, damping: 20, restDelta: 0.001 });

  const stackScale = useTransform(stackProgress, [0, 1], [1, 0.88]);
  const stackOpacity = useTransform(stackProgress, [0, 1], [1, 0.3]);
  const stackRotateX = useTransform(stackProgress, [0, 1], [0, -12]);
  const stackY = useTransform(stackProgress, [0, 1], [0, -30]);
  
  // Calculate final fan angle safely bounded. 
  // Restore dramatic 15 degree fan-out to match CommunityFeed!
  const normalizedIndex = totalCards > 1 ? (index / (totalCards - 1)) * 2 - 1 : 0; // -1 to 1
  const targetRotate = normalizedIndex * 15; 
  const rotate = useTransform(showcaseProgress, [0, 1], [0, targetRotate]);
  
  // Dynamic offset: 90px on mobile, 180px on desktop
  const baseOffset = isMobile ? 90 : 180;
  const stickyTop = baseOffset + index * (isMobile ? 8 : 20); // tighter vertical stacking on mobile

  return (
    <motion.div
      ref={containerRef}
      className="sticky w-full mb-10"
      style={{
        top: `${stickyTop}px`,
        zIndex: index + 10,
        scale: stackScale,
        opacity: stackOpacity,
        rotateX: stackRotateX,
        y: stackY,
        rotate,
        transformOrigin: "top center"
      }}
    >
      {children}
    </motion.div>
  );
}
import { getGems, submitGem, upvoteGem, seedGems } from '../actions/gems';

export default function HiddenGemsWall() {
  const [gems, setGems] = useState([]);
  const [upvotedGems, setUpvotedGems] = useState(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGem, setNewGem] = useState({ location: '', description: '', imageUrl: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const feedRef = useRef(null);
  const { scrollYProgress: rawFeedProgress } = useScroll({
    target: feedRef,
    offset: ["start start", "end end"]
  });
  const showcaseProgress = useSpring(rawFeedProgress, { stiffness: 100, damping: 20, restDelta: 0.001 });

  useEffect(() => {
    async function loadGems() {
      const data = await getGems();
      setGems(data || []);
      setIsLoading(false);
    }
    loadGems();
  }, []);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await seedGems();
      const data = await getGems();
      setGems(data || []);
    } catch (e) {
      alert(e.message);
    } finally {
      setIsSeeding(false);
    }
  };

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

  const handleUpvote = async (e, gemId) => {
    e.stopPropagation();
    const isUpvoted = upvotedGems.has(gemId);
    const incrementBy = isUpvoted ? -1 : 1;

    // Optimistic UI update
    setGems(prevGems => prevGems.map(gem => {
      if (gem.id === gemId) {
        return { ...gem, upvotes: gem.upvotes + incrementBy };
      }
      return gem;
    }));

    const newUpvoted = new Set(upvotedGems);
    if (isUpvoted) {
      newUpvoted.delete(gemId);
    } else {
      newUpvoted.add(gemId);
    }
    setUpvotedGems(newUpvoted);

    try {
      await upvoteGem(gemId, incrementBy);
    } catch (err) {
      console.error(err);
      // Revert optimistic update on error
      setGems(prevGems => prevGems.map(gem => {
        if (gem.id === gemId) {
          return { ...gem, upvotes: gem.upvotes - incrementBy };
        }
        return gem;
      }));
      const revertedUpvoted = new Set(newUpvoted);
      if (isUpvoted) revertedUpvoted.add(gemId);
      else revertedUpvoted.delete(gemId);
      setUpvotedGems(revertedUpvoted);
    }
  };

  const handleSubmitGem = async () => {
    if (!newGem.location || !newGem.description) return;
    
    setIsSubmitting(true);
    try {
      const height = ['h-64', 'h-72', 'h-80', 'h-96'][Math.floor(Math.random() * 4)];
      const fallbackImage = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&auto=format&fit=crop&q=80';
      const finalImage = newGem.imageUrl || fallbackImage;
      
      await submitGem(newGem.location, newGem.description, finalImage, height);
      
      setIsModalOpen(false);
      setNewGem({ location: '', description: '', imageUrl: '' });
      
      const data = await getGems();
      setGems(data || []);
    } catch (e) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [activeGemIndex, setActiveGemIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') {
        setActiveGemIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setActiveGemIndex(prev => Math.min(gems.length - 1, prev + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gems.length]);

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
          className="group relative inline-flex items-center gap-3 px-7 py-3.5 bg-linear-to-r from-[#F4703C] to-[#E25C27] text-white rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_8px_20px_-6px_rgba(244,112,60,0.5)] hover:shadow-[0_14px_28px_-8px_rgba(244,112,60,0.6)] border border-white/10 cursor-pointer"
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

      {/* Main Content */}
      <div className="relative" ref={feedRef}>
      {isLoading ? (
        <div className="py-20 flex justify-center items-center h-96">
          <div className="text-stone-400 font-mono text-sm animate-pulse flex flex-col items-center gap-4">
            Loading hidden gems...
          </div>
        </div>
      ) : gems.length === 0 ? (
        <div className="py-20 flex justify-center items-center h-96">
          <div className="text-stone-400 font-mono text-sm flex flex-col items-center gap-4">
            No gems found. Be the first to share one!
            <button onClick={handleSeed} disabled={isSeeding} className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg text-xs font-bold transition-colors">
              {isSeeding ? 'Seeding...' : 'Seed Sample Gems'}
            </button>
          </div>
        </div>
      ) : isMobile ? (
        <div className="relative w-full max-w-4xl mx-auto flex flex-col pb-32" style={{ perspective: 1200 }}>
          {gems.map((gem, idx) => (
            <StickyGemCard 
              key={gem.id} 
              gem={gem} 
              index={idx} 
              totalCards={gems.length} 
              showcaseProgress={showcaseProgress}
            >
              <motion.div 
                initial={{ opacity: 0, rotateX: -40, y: 40 }}
                animate={{ opacity: 1, rotateX: 0, y: 0 }}
                exit={{ opacity: 0, rotateX: 40, y: 40 }}
                transition={{ duration: 0.7, type: 'spring', bounce: 0.4 }}
                whileHover={{ y: -5 }}
                className={`relative rounded-3xl overflow-hidden group cursor-pointer h-80 sm:h-96 md:h-112.5 bg-stone-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)]`}
              >
            <Image 
              src={gem.image_url || gem.imageUrl} 
              alt={gem.location}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
              
              {/* Darkening Overlay & Gradients */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-500 z-10" />
              <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent opacity-90 z-10" />
              <div className="absolute inset-0 bg-linear-to-b from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
              
              {/* Top Bar: User & Upvotes */}
              <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-20">
                <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-y-2 group-hover:translate-y-0">
                  <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-[10px] font-bold font-mono uppercase shadow-sm">
                    {gem.submitter_name?.charAt(0)}
                  </div>
                  <span className="text-white/90 text-[10px] font-mono font-bold uppercase tracking-wider drop-shadow-md">
                    @{gem.submitter_name}
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
            
              </motion.div>
            </StickyGemCard>
          ))}
        </div>
      ) : (
        <div className="relative w-full py-4 select-none">
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[340px] bg-linear-to-r from-[#F4703C]/20 via-[#E25C27]/15 to-rose-500/15 blur-3xl rounded-full pointer-events-none -z-10 animate-pulse" />

          {/* Peek Carousel Track (Clipped cleanly within the column) */}
          <div className="relative w-full overflow-hidden rounded-3xl py-2">
            <div 
              className="relative w-full h-[430px] flex items-center justify-center select-none"
            >
              {gems.map((gem, idx) => {
                const offset = idx - activeGemIndex;
                const isCenter = offset === 0;
                const isVisible = Math.abs(offset) <= 1;

                if (!isVisible) return null;

                const x = isCenter ? '0%' : offset > 0 ? 'calc(100% + 24px)' : 'calc(-100% - 24px)';
                const scale = isCenter ? 1 : 0.94;
                const opacity = isCenter ? 1 : 0.55;
                const zIndex = isCenter ? 30 : 20;

                return (
                  <motion.div
                    key={gem.id}
                    onClick={() => {
                      if (!isCenter) setActiveGemIndex(idx);
                    }}
                    drag={isCenter ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.12}
                    onDragEnd={(e, { offset: dragOffset, velocity }) => {
                      if (dragOffset.x < -40 || velocity.x < -300) {
                        if (activeGemIndex < gems.length - 1) setActiveGemIndex(prev => prev + 1);
                      } else if (dragOffset.x > 40 || velocity.x > 300) {
                        if (activeGemIndex > 0) setActiveGemIndex(prev => prev - 1);
                      }
                    }}
                    animate={{ x, scale, opacity }}
                    transition={{
                      type: 'spring',
                      stiffness: 420,
                      damping: 34,
                      mass: 0.5
                    }}
                    style={{ zIndex }}
                    className={`absolute w-[78%] sm:w-[74%] max-w-[480px] h-[390px] sm:h-[410px] md:h-[420px] rounded-3xl overflow-hidden bg-stone-900 border border-stone-200/50 cursor-pointer ${
                      isCenter 
                        ? 'pointer-events-auto cursor-grab active:cursor-grabbing shadow-[0_16px_45px_-10px_rgba(0,0,0,0.18)] hover:shadow-[0_24px_55px_-10px_rgba(244,112,60,0.22)]' 
                        : 'pointer-events-auto hover:opacity-85 shadow-none'
                    }`}
                  >
                    <Image 
                      src={gem.image_url || gem.imageUrl} 
                      alt={gem.location || 'Hidden Gem'}
                      fill
                      className="object-cover transition-transform duration-700 ease-out hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 480px"
                    />
                    
                    {/* Darkening Scrims */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/45 to-black/20 opacity-90 z-10" />
                    
                    {/* Dimmer overlay on peek cards */}
                    {!isCenter && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[0.5px] z-15 transition-opacity" />
                    )}
                    
                    {/* Top Bar */}
                    <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-20 gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-white/25 backdrop-blur-md border border-white/35 flex items-center justify-center text-white text-[10px] font-bold font-mono uppercase shadow-sm">
                          {gem.submitter_name?.charAt(0)}
                        </div>
                        <span className="text-white/90 text-[10px] font-mono font-bold uppercase tracking-wider drop-shadow-sm">
                          @{gem.submitter_name}
                        </span>
                      </div>
                      
                      {/* Upvote Pill */}
                      <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => handleUpvote(e, gem.id)}
                        className={`backdrop-blur-md border rounded-full px-3 py-1 transition-all duration-300 flex items-center gap-1.5 shadow-md cursor-pointer ${
                          upvotedGems.has(gem.id) 
                            ? 'bg-[#F4703C] border-[#F4703C] text-white shadow-[#F4703C]/40 ring-2 ring-[#F4703C]/30' 
                            : 'bg-white/25 border-white/40 text-white hover:bg-[#F4703C] hover:border-[#F4703C]'
                        }`}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${upvotedGems.has(gem.id) ? 'scale-110' : ''}`}>
                          <path d="M12 19V5M5 12l7-7 7 7"/>
                        </svg>
                        <span className="text-[11px] font-bold font-mono mt-px">{gem.upvotes}</span>
                      </motion.button>
                    </div>
                    
                    {/* Bottom Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 flex flex-col justify-end z-20">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white w-max mb-2.5 shadow-sm">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span className="text-[9px] font-bold uppercase tracking-widest font-mono mt-px">
                          {gem.location}
                        </span>
                      </div>
                      
                      <h4 className={`text-white font-serif text-xl sm:text-2xl leading-snug drop-shadow-md transition-all duration-300 ${
                        isCenter ? 'opacity-100 max-h-24' : 'opacity-0 max-h-0 overflow-hidden pointer-events-none'
                      }`}>
                        "{gem.description}"
                      </h4>
                    </div>
                  </motion.div>
                );
              })}

              {/* Left Button */}
              {activeGemIndex > 0 && (
                <motion.button
                  whileHover={{ scale: 1.12, x: -2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setActiveGemIndex(prev => Math.max(0, prev - 1))}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-stone-900 shadow-[0_8px_25px_rgba(0,0,0,0.18)] border border-stone-200/80 flex items-center justify-center transition-shadow hover:shadow-[0_12px_30px_rgba(244,112,60,0.25)] cursor-pointer group"
                  aria-label="Previous gem"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </motion.button>
              )}

              {/* Right Button */}
              {activeGemIndex < gems.length - 1 && (
                <motion.button
                  whileHover={{ scale: 1.12, x: 2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setActiveGemIndex(prev => Math.min(gems.length - 1, prev + 1))}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-stone-900 shadow-[0_8px_25px_rgba(0,0,0,0.18)] border border-stone-200/80 flex items-center justify-center transition-shadow hover:shadow-[0_12px_30px_rgba(244,112,60,0.25)] cursor-pointer group"
                  aria-label="Next gem"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </motion.button>
              )}
            </div>
          </div>

          {/* Bottom Pagination & Progress Controls */}
          <div className="mt-8 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold text-stone-400 uppercase tracking-widest">
                {String(activeGemIndex + 1).padStart(2, '0')} / {String(gems.length).padStart(2, '0')}
              </span>
              <span className="text-stone-300 font-mono">·</span>
              <span className="text-[11px] font-mono font-bold text-[#F4703C] uppercase tracking-wider">
                {gems[activeGemIndex]?.location}
              </span>
            </div>

            {/* Morphing Dots / Pills */}
            <div className="flex items-center gap-1.5 bg-stone-100/80 backdrop-blur-md p-1.5 rounded-full border border-stone-200/60">
              {gems.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveGemIndex(i)}
                  className="relative h-2 rounded-full cursor-pointer focus:outline-none transition-all"
                  style={{ width: activeGemIndex === i ? '28px' : '8px' }}
                  aria-label={`Go to gem ${i + 1}`}
                >
                  <div className="w-full h-full rounded-full bg-stone-300/80 hover:bg-stone-400 transition-colors" />
                  {activeGemIndex === i && (
                    <motion.div
                      layoutId="activeGemPill"
                      className="absolute inset-0 bg-[#F4703C] rounded-full shadow-[0_2px_8px_rgba(244,112,60,0.4)]"
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-stone-400 text-[10px] font-mono uppercase tracking-widest">
              <span>Use</span>
              <kbd className="px-1.5 py-0.5 bg-stone-100 border border-stone-200 rounded text-stone-600 font-bold">←</kbd>
              <kbd className="px-1.5 py-0.5 bg-stone-100 border border-stone-200 rounded text-stone-600 font-bold">→</kbd>
              <span>or drag</span>
            </div>
          </div>
        </div>
      )}
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
                           <Image src={newGem.imageUrl} alt="Preview" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
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
                    disabled={isSubmitting || !newGem.location || !newGem.description}
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
