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
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-2xl h-[85dvh] sm:h-[85vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10"
        >
          {/* MODAL HEADER */}
          <div className="flex items-center justify-between px-6 sm:px-8 py-6 border-b border-stone-100 bg-white shrink-0">
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
