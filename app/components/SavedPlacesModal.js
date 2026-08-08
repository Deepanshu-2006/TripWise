import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bookmark, MapPin, ExternalLink, Clock } from 'lucide-react';

export default function SavedPlacesModal({ isOpen, onClose, savedStops, itinerary }) {
  if (!isOpen) return null;

  const savedActivities = [];
  if (itinerary && itinerary.days) {
    Object.entries(savedStops).forEach(([key, isSaved]) => {
      if (isSaved) {
        const [dayStr, stopStr] = key.split('-');
        const dayNum = parseInt(dayStr, 10);
        const stopNum = parseInt(stopStr, 10);
        const activity = itinerary.days[dayNum - 1]?.activities[stopNum - 1];
        if (activity) {
          savedActivities.push({ ...activity, dayNum, stopNum, key });
        }
      }
    });
  }

  return (
    <div className="fixed inset-0 z-[150000] flex items-center justify-center p-4 sm:p-6 pointer-events-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="relative w-full max-w-2xl bg-[#FAF6F0] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E6DFD5] flex items-center justify-between bg-white shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FFF0E8] text-[#FF6B2C] flex items-center justify-center shrink-0">
              <Bookmark className="w-5 h-5 fill-[#FF6B2C]" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-black text-[#1E1C1A]">
                Bookmarked Places
              </h3>
              <p className="text-xs font-sans text-[#7A7268] mt-0.5">
                {savedActivities.length} {savedActivities.length === 1 ? 'place' : 'places'} saved for this trip
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F5F0E8] border border-[#E6DFD5] flex items-center justify-center text-[#7A7268] hover:text-[#1E1C1A] hover:bg-white transition-all shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 space-y-4">
          {savedActivities.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex flex-col items-center justify-center py-20 text-center relative overflow-hidden rounded-3xl"
            >
              {/* Decorative background elements */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#FAF6F0] to-[#FFF0E8]/30 z-0" />
              
              <div className="relative z-10 mb-8">
                <motion.div 
                  animate={{ 
                    scale: [1, 1.15, 1],
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity,
                    ease: "easeInOut" 
                  }}
                  className="absolute inset-0 bg-[#FF6B2C] rounded-full blur-2xl"
                />
                
                <motion.div
                  animate={{ 
                    y: [0, -12, 0],
                    rotate: [0, -5, 5, 0]
                  }}
                  transition={{ 
                    y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                    rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className="relative bg-white w-24 h-24 rounded-3xl shadow-lg shadow-[#FF6B2C]/10 border border-[#FFF0E8] flex items-center justify-center"
                >
                  <Bookmark className="w-10 h-10 text-[#FF6B2C] fill-[#FF6B2C]/10" />
                  
                  {/* Floating sparkles */}
                  <motion.div
                    animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], y: [-10, -20], x: [10, 20] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    className="absolute top-2 right-2 w-2 h-2 bg-[#FFB088] rounded-full"
                  />
                  <motion.div
                    animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], y: [10, 20], x: [-10, -20] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}
                    className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-[#FF6B2C] rounded-full"
                  />
                </motion.div>
              </div>

              <motion.h4 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="text-2xl font-serif font-black text-[#1E1C1A] mb-3 relative z-10"
              >
                No bookmarks yet
              </motion.h4>
              
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="text-sm font-sans text-[#7A7268] max-w-[280px] leading-relaxed relative z-10"
              >
                Click the <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[#F5F0E8] mx-1"><Bookmark className="w-3 h-3 text-[#7A7268]" /></span> button on any activity to save it here for quick access.
              </motion.p>
            </motion.div>
          ) : (
            savedActivities.map(act => (
              <div key={act.key} className="bg-white rounded-2xl p-4 border border-[#E6DFD5] shadow-sm flex flex-col sm:flex-row gap-4 group hover:border-[#FF6B2C]/40 transition-colors">
                {act.thumbnailUrl ? (
                  <div className="w-full sm:w-28 h-32 sm:h-24 rounded-xl shrink-0 overflow-hidden bg-stone-100 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={act.thumbnailUrl} alt={act.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-wider">
                      Day {act.dayNum}
                    </div>
                  </div>
                ) : (
                  <div className="w-full sm:w-28 h-32 sm:h-24 rounded-xl shrink-0 bg-stone-100 flex items-center justify-center border border-[#E6DFD5]/50 relative">
                    <MapPin className="w-6 h-6 text-[#C8BFB2]" />
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-white border border-[#E6DFD5] text-[#7A7268] text-[9px] font-bold uppercase tracking-wider">
                      Day {act.dayNum}
                    </div>
                  </div>
                )}
                
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-base font-serif font-black text-[#1E1C1A] truncate">
                      {act.title}
                    </h4>
                    {act.googleMapsUrl && (
                      <a 
                        href={act.googleMapsUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="shrink-0 p-1.5 rounded-full bg-stone-50 text-[#7A7268] hover:text-[#FF6B2C] hover:bg-[#FFF0E8] transition-colors"
                        title="Open in Maps"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  
                  <p className="text-xs font-sans text-[#7A7268] line-clamp-2 mb-3 pr-2">
                    {act.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-[10px] font-sans font-bold uppercase tracking-widest text-[#C8BFB2]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      <span>{act.time}</span>
                    </div>
                    {act.category && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" />
                        <span>{act.category}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div className="h-4 w-full shrink-0"></div>
        </div>
      </motion.div>
    </div>
  );
}
