'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, Download, MapPin, Map, Star, Calendar, Camera } from 'lucide-react';
import { getTripJournalEntries } from '../../lib/journalApi';
import { getTripExpenses, convertCurrency, getUserDisplayCurrency, formatCurrency } from '../../lib/expenseApi';
import { toPng } from 'html-to-image';

// --- Card Components ---

const IntroCard = ({ itinerary, heroPhoto }) => (
  <div className="w-full h-full relative flex flex-col justify-end p-8 bg-black">
    {heroPhoto && (
      <img src={heroPhoto} alt="Hero" className="absolute inset-0 w-full h-full object-cover opacity-60" />
    )}
    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
    
    <div className="relative z-10 text-white animate-in slide-in-from-bottom-10 fade-in duration-700">
      <span className="text-xs font-mono uppercase tracking-widest text-white/80 font-bold block mb-3">
        TripWise Recap
      </span>
      <h2 className="text-5xl font-serif font-black tracking-tight leading-none mb-3">
        {itinerary?.destinationName || 'Your Trip'}
      </h2>
      <p className="text-lg font-sans text-white/90">
        {itinerary?.days?.length || 0} unforgettable days.
      </p>
    </div>
  </div>
);

const RouteMapCard = ({ itinerary }) => {
  const allStops = itinerary?.days?.flatMap((d, i) => 
    d.activities.map(a => ({ ...a, day: i+1 }))
  ).filter(a => a.location || a.title).slice(0, 8) || []; // limit to 8 for visual sanity

  return (
    <div className="w-full h-full relative p-8 bg-[#FAF6F0] flex flex-col">
      <h3 className="text-2xl font-serif font-black text-[#1E1C1A] tracking-tight mb-8 mt-12 text-center">
        The Journey
      </h3>
      <div className="flex-1 relative mx-auto w-full max-w-xs flex flex-col justify-between py-10">
        {/* Connecting line */}
        <div className="absolute left-[19px] top-12 bottom-12 w-0.5 bg-gradient-to-b from-[#FF6B2C] to-[#3B82F6] opacity-30" />
        
        {allStops.map((stop, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.15 }}
            className="flex items-center gap-4 relative z-10"
          >
            <div className="w-10 h-10 rounded-full bg-white border-2 border-[#FF6B2C] flex items-center justify-center text-[#FF6B2C] shadow-sm shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-sans font-bold text-[#1E1C1A] truncate">{stop.title}</p>
              <p className="text-[10px] font-mono text-[#7A7268] uppercase tracking-wider truncate">Day {stop.day}</p>
            </div>
          </motion.div>
        ))}
        {allStops.length === 0 && (
          <div className="text-center text-[#7A7268] text-sm">No stops recorded.</div>
        )}
      </div>
    </div>
  );
};

const StatsCard = ({ stats }) => (
  <div className="w-full h-full relative p-8 bg-[#1E1C1A] flex flex-col justify-center items-center">
    <h3 className="text-2xl font-serif font-black text-white tracking-tight mb-12 text-center">
      By the Numbers
    </h3>
    
    <div className="grid grid-cols-2 gap-6 w-full max-w-xs">
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="col-span-2 bg-white/10 rounded-3xl p-6 text-center border border-white/10"
      >
        <div className="text-5xl font-black text-[#FF6B2C] font-serif mb-2">{stats.duration}</div>
        <div className="text-xs font-mono uppercase tracking-widest text-white/60 font-bold">Days Exploring</div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-white/10 rounded-3xl p-6 text-center border border-white/10"
      >
        <div className="text-3xl font-black text-white font-serif mb-2">{stats.stops}</div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-white/60 font-bold">Stops Visited</div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
        className="bg-white/10 rounded-3xl p-6 text-center border border-white/10"
      >
        <div className="text-3xl font-serif font-black text-[#FFF2B2]">{formatCurrency(stats.spent, getUserDisplayCurrency())}</div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-white/60 font-bold">Spent</div>
      </motion.div>
    </div>
  </div>
);

const HighlightCard = ({ item }) => (
  <div className="w-full h-full relative bg-stone-900 flex flex-col">
    {item.photo ? (
      <img src={item.photo} alt={item.title} className="absolute inset-0 w-full h-full object-cover opacity-80" />
    ) : (
      <div className="absolute inset-0 bg-[#FF6B2C]/20" />
    )}
    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />
    
    <div className="relative z-10 flex flex-col justify-end h-full p-8 text-white">
      <div className="flex items-center gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`w-4 h-4 ${i < (item.rating || 5) ? 'fill-[#FF6B2C] text-[#FF6B2C]' : 'fill-transparent text-white/30'}`} />
        ))}
      </div>
      <h3 className="text-3xl font-serif font-black tracking-tight leading-tight mb-2">
        {item.title}
      </h3>
      {item.note && (
        <p className="text-sm font-sans text-white/90 italic leading-relaxed line-clamp-4 border-l-2 border-[#FF6B2C] pl-3">
          "{item.note}"
        </p>
      )}
    </div>
  </div>
);

const OutroCard = ({ itinerary, heroPhoto, onDownload, isDownloading }) => (
  <div id="recap-outro-card" className="w-full h-full relative bg-[#FF6B2C] flex flex-col items-center justify-center p-8 overflow-hidden">
    {/* Decorative background shapes */}
    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
    <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />

    <div className="relative z-10 w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
      {heroPhoto && (
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg mb-4 -mt-12 bg-gray-200">
          <img src={heroPhoto} alt="Hero" className="w-full h-full object-cover" />
        </div>
      )}
      
      <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF6B2C] font-bold block mb-1">
        Trip Completed
      </span>
      <h3 className="text-2xl font-serif font-black text-[#1E1C1A] tracking-tight leading-tight mb-2">
        {itinerary?.destinationName || 'Destination'}
      </h3>
      <p className="text-xs text-[#7A7268] font-sans mb-6">
        {itinerary?.days?.length} Days • Unforgettable Memories
      </p>

      <div className="w-full pt-6 border-t border-[#E6DFD5] flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-serif font-black text-[#1E1C1A]">
          <Map className="w-4 h-4 text-[#FF6B2C]" /> TripWise
        </div>
        <div className="text-[10px] text-[#7A7268] uppercase tracking-wider font-bold">
          {new Date().getFullYear()} Recap
        </div>
      </div>
    </div>
    
    {/* Render buttons outside the capture container if possible, or hide them during capture.
        For simplicity, they are inside the div, but html-to-image can filter them by class */}
    <div className="absolute bottom-8 left-0 right-0 px-8 flex flex-col gap-3 z-20" data-html2canvas-ignore="true">
      <button 
        onClick={onDownload}
        disabled={isDownloading}
        className="w-full py-3.5 rounded-2xl bg-white text-[#FF6B2C] font-sans font-bold text-sm flex items-center justify-center gap-2 hover:bg-stone-50 transition-colors shadow-lg disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        {isDownloading ? 'Saving Image...' : 'Save to Camera Roll'}
      </button>
      <button 
        onClick={() => alert("Web link sharing is a planned feature! For now, please save the image to share.")}
        className="w-full py-3.5 rounded-2xl bg-black/20 text-white font-sans font-bold text-sm flex items-center justify-center gap-2 hover:bg-black/30 transition-colors"
      >
        <Share className="w-4 h-4" /> Share Link
      </button>
    </div>
  </div>
);


export default function TripRecapModal({ isOpen, onClose, itinerary, estBudget }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && itinerary) {
      const tripId = itinerary.id || itinerary.db_id || 'shared-trip';
      const journals = getTripJournalEntries(tripId);
      const expenses = getTripExpenses(tripId);

      // Compute stats
      const totalStops = itinerary.days?.reduce((acc, day) => acc + (day.activities?.length || 0), 0) || 0;
      const userCurr = getUserDisplayCurrency();
      const totalSpentBase = expenses.reduce((acc, exp) => acc + convertCurrency(exp.amount, exp.currency, userCurr), 0);
      const budgetNum = parseFloat(estBudget?.toString().replace(/[^0-9.]/g, '')) || 1450;
      
      const stats = {
        duration: itinerary.days?.length || 0,
        stops: totalStops,
        spent: totalSpentBase
      };

      // Determine Hero Photo (highest rated journal photo with an image, or fallback)
      let heroPhoto = 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80'; // generic fallback
      const photoEntries = journals.filter(j => j.photoUrls && j.photoUrls.length > 0);
      if (photoEntries.length > 0) {
        photoEntries.sort((a, b) => (b.personalRating || 0) - (a.personalRating || 0));
        heroPhoto = photoEntries[0].photoUrls[0];
      } else {
        // try to find first activity with a photo
        const actWithPhoto = itinerary.days?.flatMap(d => d.activities).find(a => a.image);
        if (actWithPhoto) heroPhoto = actWithPhoto.image;
      }

      // Build Slides
      const newSlides = [
        { type: 'intro', data: { heroPhoto, itinerary } },
        { type: 'map', data: { itinerary } },
        { type: 'stats', data: { stats } }
      ];

      // Add Highlights (top 2 journal entries with notes or photos)
      const topJournals = [...journals]
        .filter(j => j.personalRating >= 4 || j.photoUrls?.length > 0)
        .sort((a, b) => (b.personalRating || 0) - (a.personalRating || 0))
        .slice(0, 2);

      topJournals.forEach(j => {
        // Find activity title
        let actTitle = 'Memorable Stop';
        if (j.activityId) {
          const [dStr, sStr] = j.activityId.split('-');
          const dIdx = parseInt(dStr, 10) - 1;
          const sIdx = parseInt(sStr, 10) - 1;
          const act = itinerary.days?.[dIdx]?.activities?.[sIdx];
          if (act?.title) actTitle = act.title;
        }

        newSlides.push({
          type: 'highlight',
          data: {
            title: actTitle,
            note: j.note,
            photo: j.photoUrls?.[0],
            rating: j.personalRating
          }
        });
      });

      // Outro
      newSlides.push({ type: 'outro', data: { heroPhoto, itinerary } });

      setSlides(newSlides);
      setCurrentSlide(0);
    }
  }, [isOpen, itinerary]);

  // Auto-advance progress
  useEffect(() => {
    if (!isOpen || slides.length === 0) return;
    
    // Don't auto-advance the last slide so user can click share
    if (currentSlide === slides.length - 1) return;

    const timer = setTimeout(() => {
      setCurrentSlide(prev => (prev < slides.length - 1 ? prev + 1 : prev));
    }, 5000); // 5s per slide

    return () => clearTimeout(timer);
  }, [currentSlide, isOpen, slides.length]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const node = document.getElementById('recap-outro-card');
      const dataUrl = await toPng(node, { 
        quality: 0.95,
        filter: (el) => {
          // exclude elements with data-html2canvas-ignore
          if (el.getAttribute && el.getAttribute('data-html2canvas-ignore') === 'true') {
            return false;
          }
          return true;
        }
      });
      
      const link = document.createElement('a');
      link.download = `TripWise-Recap-${itinerary?.destinationName || 'Trip'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isMounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110000] flex items-center justify-center bg-black">
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:bg-black/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Story Container - forced aspect ratio for mobile-like stories */}
          <div className="relative w-full h-full max-w-md max-h-[900px] bg-stone-900 overflow-hidden sm:rounded-3xl sm:border border-stone-700 shadow-2xl flex flex-col">
            
            {/* Progress Bars */}
            <div className="absolute top-4 left-0 right-0 px-4 flex gap-1.5 z-40">
              {slides.map((_, idx) => (
                <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white"
                    initial={{ width: idx < currentSlide ? '100%' : '0%' }}
                    animate={{ width: idx === currentSlide ? '100%' : idx < currentSlide ? '100%' : '0%' }}
                    transition={{ 
                      duration: idx === currentSlide && idx !== slides.length - 1 ? 5 : 0, 
                      ease: "linear" 
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Tap areas for navigation */}
            <div className="absolute inset-0 z-30 flex">
              <div className="w-1/3 h-full" onClick={handlePrev} />
              <div className="w-2/3 h-full" onClick={handleNext} />
            </div>

            {/* Slide Content */}
            <div className="relative w-full h-full z-10 pointer-events-none">
              <AnimatePresence initial={false}>
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 pointer-events-auto" // allow clicking on outro card
                >
                  {slides[currentSlide]?.type === 'intro' && <IntroCard {...slides[currentSlide].data} />}
                  {slides[currentSlide]?.type === 'map' && <RouteMapCard {...slides[currentSlide].data} />}
                  {slides[currentSlide]?.type === 'stats' && <StatsCard {...slides[currentSlide].data} />}
                  {slides[currentSlide]?.type === 'highlight' && <HighlightCard item={slides[currentSlide].data} />}
                  {slides[currentSlide]?.type === 'outro' && (
                    <OutroCard 
                      {...slides[currentSlide].data} 
                      onDownload={handleDownload} 
                      isDownloading={isDownloading} 
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
