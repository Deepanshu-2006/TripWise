'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, Check, Trash2, RefreshCw, AlertTriangle, ShieldCheck, UserCheck } from 'lucide-react';
import { getStoredFlags, moderateFlag } from '../../lib/flaggingStore';

export default function FlaggingAdminModal({ isOpen, onClose, onUpdated }) {
  const [flags, setFlags] = useState([]);

  const refreshFlags = () => {
    setFlags(getStoredFlags());
  };

  useEffect(() => {
    if (isOpen) refreshFlags();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAction = (flagId, action) => {
    moderateFlag(flagId, action);
    refreshFlags();
    if (onUpdated) onUpdated();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[160000] flex items-center justify-center p-4 sm:p-6 pointer-events-auto">
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
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="relative w-full max-w-2xl bg-[#FAF6F0] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-white border-b border-[#E6DFD5] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#1E1C1A] text-white flex items-center justify-center shrink-0">
                <ShieldAlert className="w-4 h-4 text-[#FF6B2C]" />
              </div>
              <div>
                <h3 className="text-base font-serif font-black text-[#1E1C1A]">
                  Accuracy Moderation Queue
                </h3>
                <p className="text-xs font-sans text-[#7A7268]">
                  Review crowd-sourced reports & trust-weighted fast-tracks
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F5F0E8] border border-[#E6DFD5] flex items-center justify-center text-[#7A7268] hover:text-[#1E1C1A] hover:bg-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Queue List */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
            {flags.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#7A7268] font-mono">
                No active flags in moderation queue.
              </div>
            ) : (
              flags.map(flag => (
                <div
                  key={flag.id}
                  className="p-4 rounded-2xl bg-white border border-[#E6DFD5] shadow-2xs flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#1E1C1A]">{flag.placeTitle}</span>
                        {flag.isTrustVerified ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-mono font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Fast-Tracked
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-mono font-bold">
                            Standard Report
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono text-[#FF6B2C] font-bold mt-0.5 block">
                        Reason: {flag.reasonLabel}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-[#A89F91]">
                      {new Date(flag.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {flag.details && (
                    <p className="text-xs text-[#5F5E5A] bg-[#FAF6F0] p-2.5 rounded-xl border border-[#E6DFD5]/60 font-sans">
                      "{flag.details}"
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-[#E6DFD5]/40 text-xs">
                    <span className="text-[10px] text-[#7A7268]">
                      Reported by: <span className="font-bold text-[#1E1C1A]">{flag.submitterName}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAction(flag.id, 'dismiss')}
                        className="px-2.5 py-1 rounded-lg border border-[#E6DFD5] text-[#7A7268] hover:text-rose-600 hover:border-rose-200 text-[11px] font-bold transition-all cursor-pointer"
                      >
                        Dismiss
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction(flag.id, 'approve_update')}
                        className="px-3 py-1 rounded-lg bg-[#2FA66A] text-white text-[11px] font-bold hover:bg-[#258755] transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Check className="w-3 h-3" />
                        <span>Confirm &amp; Update Listing</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
