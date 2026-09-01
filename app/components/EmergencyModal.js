'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert } from 'lucide-react';
import EmergencyInfoView from './EmergencyInfoView';

export default function EmergencyModal({ isOpen, onClose, destinationName, passportNationality }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

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

  if (!isOpen || !mounted) return null;

  return createPortal(
    <AnimatePresence>
      <div
        data-lenis-prevent="true"
        className="fixed inset-0 z-999999 flex items-end sm:items-center justify-center p-0 sm:p-6 font-sans overflow-hidden"
      >
        
        {/* BACKDROP */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-stone-900/65 backdrop-blur-sm"
        />

        {/* MODAL / BOTTOM SHEET CONTAINER */}
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
          drag="y"
          dragDirectionLock
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 1 }}
          dragMomentum={false}
          onDragEnd={(e, info) => {
            // Balanced thresholds: close gracefully on a moderate swipe
            if (info.offset.y > 100 || info.velocity.y > 300) {
              onClose();
            }
          }}
          className="relative w-full max-w-2xl h-[85dvh] sm:h-[85vh] bg-[#FDFDFB] rounded-t-[32px] sm:rounded-[32px] shadow-[0_0_40px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden z-10"
        >
          {/* MODAL HEADER WITH DRAG HANDLE */}
          <div className="flex flex-col border-b border-[#F0EFEB] bg-[#FDFDFB] shrink-0">
            {/* DRAG HANDLE (Mobile only) */}
            <div className="w-full flex justify-center pt-3 sm:hidden">
              <div className="w-10 h-1.5 bg-[#EBE8E0] rounded-full" />
            </div>
            
            <div className="flex items-center justify-between px-6 sm:px-8 py-5 sm:py-6">
              <div>
                <h3 className="font-black text-lg sm:text-xl text-stone-900 tracking-tight leading-none">
                  Emergency &amp; Safety
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="font-mono text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors"
              >
                Close
              </button>
            </div>
          </div>

          {/* MODAL BODY CONTENT */}
          <div
            data-lenis-prevent="true"
            className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-8"
          >
            <EmergencyInfoView
              destinationName={destinationName}
              passportNationality={passportNationality}
            />
          </div>
        </motion.div>

      </div>
    </AnimatePresence>,
    document.body
  );
}
