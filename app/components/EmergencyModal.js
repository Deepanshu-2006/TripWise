'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert } from 'lucide-react';
import EmergencyInfoView from './EmergencyInfoView';

export default function EmergencyModal({ isOpen, onClose, destinationName, passportNationality }) {
  // Prevent background body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        data-lenis-prevent="true"
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 font-sans overflow-hidden"
      >
        
        {/* BACKDROP */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-stone-900/65 backdrop-blur-sm"
        />

        {/* MODAL / BOTTOM SHEET CONTAINER */}
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-4xl h-[88vh] sm:h-[85vh] bg-[#FAF6F0] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#E6DFD5] flex flex-col overflow-hidden z-10"
        >
          {/* MODAL HEADER */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6DFD5] bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FF6B2C] text-white flex items-center justify-center shadow-xs">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-black text-lg text-[#1E1C1A] tracking-tight">
                  Emergency Info &amp; Safety Concierge
                </h3>
                <p className="text-xs text-[#7A7268]">
                  {destinationName || 'Destination'} Safety Directory
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#FAF6F0] hover:bg-[#E6DFD5] text-[#1E1C1A] flex items-center justify-center transition-colors cursor-pointer"
              title="Close Emergency Info"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* MODAL BODY CONTENT */}
          <div
            data-lenis-prevent="true"
            className="flex-1 overflow-y-auto overscroll-contain p-6 md:p-8"
          >
            <EmergencyInfoView
              destinationName={destinationName}
              passportNationality={passportNationality}
            />
          </div>
        </motion.div>

      </div>
    </AnimatePresence>
  );
}
