'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flag, AlertTriangle, ShieldCheck, CheckCircle2, Send, Sparkles } from 'lucide-react';
import { REASON_OPTIONS, submitFlag } from '../../lib/flaggingStore';

export default function FlagModal({ isOpen, onClose, placeId, placeTitle = 'Activity / Place', onSubmitted }) {
  const [selectedReason, setSelectedReason] = useState('closed');
  const [details, setDetails] = useState('');
  const [isVerifiedUser, setIsVerifiedUser] = useState(true); // Default to local guide simulation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const newFlag = submitFlag({
        placeId,
        placeTitle,
        reason: selectedReason,
        details,
        submitterName: isVerifiedUser ? 'Verified Local Concierge' : 'Community Traveler',
        isTrustVerified: isVerifiedUser
      });

      setIsSubmitting(false);
      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        if (onSubmitted) onSubmitted(newFlag);
        onClose();
      }, 1400);
    }, 400);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[160000] flex items-center justify-center p-4 sm:p-6 pointer-events-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="relative w-full max-w-md bg-[#FAF6F0] rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-[#E6DFD5]"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-white border-b border-[#E6DFD5] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <Flag className="w-4 h-4 fill-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-serif font-black text-[#1E1C1A]">
                  Report Outdated Info
                </h3>
                <p className="text-xs font-sans text-[#7A7268] truncate max-w-[220px]">
                  {placeTitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F5F0E8] border border-[#E6DFD5] flex items-center justify-center text-[#7A7268] hover:text-[#1E1C1A] hover:bg-white transition-all shadow-2xs cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {isSuccess ? (
            /* Success View */
            <div className="p-8 flex flex-col items-center text-center gap-3 my-4 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h4 className="text-lg font-serif font-black text-[#1E1C1A]">Report Received!</h4>
              <p className="text-xs text-[#7A7268] max-w-xs leading-relaxed">
                {isVerifiedUser
                  ? '⚡ Fast-Track Verified: A caution warning has been published on this card for other travelers.'
                  : 'Your report has been queued for admin review. Thank you for keeping TripWise accurate!'}
              </p>
            </div>
          ) : (
            /* Form View */
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              {/* Reason Selector */}
              <div>
                <label className="block text-xs font-mono font-bold text-[#7A7268] uppercase tracking-wider mb-2">
                  Select Reason
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {REASON_OPTIONS.map(opt => {
                    const isSelected = selectedReason === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedReason(opt.id)}
                        className={`p-3 rounded-2xl border text-xs font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#FF6B2C] text-white border-[#FF6B2C] shadow-sm'
                            : 'bg-white border-[#E6DFD5] text-[#1E1C1A] hover:border-[#FF6B2C]/40'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Free Text Details */}
              <div>
                <label className="block text-xs font-mono font-bold text-[#7A7268] uppercase tracking-wider mb-1.5">
                  Additional Details (Optional)
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="e.g. Visited yesterday, door sign says closed until October for renovations..."
                  rows={3}
                  className="w-full p-3 rounded-xl bg-white border border-[#E6DFD5] focus:border-[#FF6B2C] focus:outline-none text-xs text-[#1E1C1A] placeholder:text-[#A89F91] resize-none shadow-2xs"
                />
              </div>

              {/* Trust Signal Fast-Track Switch */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-[#1E1C1A] block">Verified Local Fast-Track</span>
                    <span className="text-[10px] text-[#7A7268] leading-tight block">Instantly triggers caution banner for travelers</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isVerifiedUser}
                  onChange={(e) => setIsVerifiedUser(e.target.checked)}
                  className="w-4 h-4 accent-[#FF6B2C] cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-[#E6DFD5] bg-white text-[#7A7268] font-bold text-xs hover:bg-[#FAF6F0] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#FF6B2C] text-white font-bold text-xs hover:bg-[#E55A20] transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Report</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
