import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X, Navigation } from 'lucide-react';

export default function LiveAssistantNudge({ show, onAdjust, onDismiss, onSnooze }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm"
        >
          <div className="bg-[#1E1C1A] text-white p-5 rounded-4xl shadow-2xl border border-gray-700 relative overflow-hidden">
            {/* Background glowing orb effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6B2C] rounded-full blur-3xl opacity-20 -mr-10 -mt-10 pointer-events-none" />
            
            <button 
              onClick={onDismiss}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#FF6B2C]/20 flex items-center justify-center shrink-0">
                <Clock className="text-[#FF6B2C] w-5 h-5" />
              </div>
              <div className="pt-1">
                <h4 className="font-serif font-bold text-lg leading-tight mb-1">Running behind?</h4>
                <p className="text-sm text-gray-300 font-sans leading-snug pr-4">
                  It looks like you're behind schedule for today's plan. We can automatically adjust your remaining stops.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={onAdjust}
                className="flex-1 bg-[#FF6B2C] hover:bg-[#E55A1C] text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-lg shadow-[#FF6B2C]/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Navigation size={14} />
                Yes, adjust
              </button>
              <button 
                onClick={onSnooze}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors cursor-pointer"
              >
                No, I'm fine
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
