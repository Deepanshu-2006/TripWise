'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CloudOff, 
  CloudCheck, 
  RefreshCw, 
  Check, 
  X, 
  HardDrive, 
  ShieldAlert, 
  Map, 
  Image as ImageIcon, 
  FileText, 
  AlertTriangle,
  Sparkles,
  Download
} from 'lucide-react';
import { 
  getOfflinePack, 
  removeOfflinePack, 
  isOfflinePackStale, 
  estimatePackSize, 
  buildAndSaveOfflinePack,
  autoRefreshOfflinePackIfStale 
} from '../../lib/offlineManager';

export default function OfflineTripManager({
  tripId = 'default_trip',
  itinerary,
  expenses = [],
  emergencyData = null,
  packingList = null,
  visaReqs = null,
  onRefreshData,
  externalIsOpen = false,
  onCloseExternal
}) {
  const [offlinePack, setOfflinePack] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [sizeEstimate, setSizeEstimate] = useState('~45MB');
  const [currentStepText, setCurrentStepText] = useState('Initializing download...');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync external open state if controlled externally
  useEffect(() => {
    if (externalIsOpen) {
      setShowModal(true);
    }
  }, [externalIsOpen]);

  // Read current offline pack state on mount
  useEffect(() => {
    const pack = getOfflinePack(tripId);
    setOfflinePack(pack);
    setIsStale(isOfflinePackStale(tripId, 24));
    setSizeEstimate(estimatePackSize(itinerary));

    // Attempt silent background refresh if connected & >24h old
    if (pack && itinerary) {
      autoRefreshOfflinePackIfStale(tripId, async () => ({
        itinerary,
        expenses,
        emergencyData,
        packingList,
        visaReqs
      }));
    }
  }, [tripId, itinerary, expenses, emergencyData, packingList, visaReqs]);

  // Handle Offline Cache Download
  const handleStartDownload = async () => {
    setIsDownloading(true);
    setDownloadProgress(10);
    setCurrentStepText('Saving structured itinerary & AI insights...');

    try {
      await buildAndSaveOfflinePack({
        tripId,
        itinerary,
        expenses,
        emergencyData,
        packingList,
        visaReqs,
        onProgress: (percent) => {
          setDownloadProgress(percent);
          if (percent < 30) {
            setCurrentStepText('Saving structured itinerary & AI insights...');
          } else if (percent < 70) {
            setCurrentStepText('Pre-caching destination photos & activity thumbnails...');
          } else if (percent < 95) {
            setCurrentStepText('Caching Emergency Info & Visa checklists...');
          } else {
            setCurrentStepText('Finalizing offline pack...');
          }
        }
      });

      const updated = getOfflinePack(tripId);
      setOfflinePack(updated);
      setIsStale(false);
      setTimeout(() => {
        setIsDownloading(false);
        setShowModal(false);
      }, 500);
    } catch (err) {
      console.error('Failed to download offline pack:', err);
      setIsDownloading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    if (onCloseExternal) onCloseExternal();
  };

  // Handle Remove Offline Pack
  const handleRemoveOfflinePack = () => {
    removeOfflinePack(tripId);
    setOfflinePack(null);
    handleCloseModal();
  };

  const isAvailable = Boolean(offlinePack && offlinePack.isAvailableOffline);

  // Format last synced date string
  const formatLastSynced = () => {
    if (!offlinePack?.cachedAt) return null;
    const date = new Date(offlinePack.cachedAt);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* HEADER ACTION BUTTON TOGGLE / BADGE */}
      <div className="relative inline-flex items-center gap-1.5">
        {isAvailable ? (
          <div className="flex items-center gap-1.5">
            {/* Available Offline Badge */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-emerald-500/40 bg-emerald-50 text-emerald-800 text-xs font-sans font-bold hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs"
            >
              <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Available Offline ✓</span>
            </motion.button>

            {/* Last Synced / Refresh Action */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setShowModal(true)}
              title={`Last synced: ${formatLastSynced()}`}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-[#E6DFD5] bg-white text-[11px] font-sans text-gray-600 hover:bg-[#F5F0E8] transition-all cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 text-[#FF6B2C]" />
              <span className="hidden md:inline">{formatLastSynced()}</span>
            </motion.button>

            {/* Outdated Warning Chip if Stale */}
            {isStale && (
              <span 
                onClick={() => setShowModal(true)}
                className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold cursor-pointer"
                title="Your offline copy may be outdated. Click to refresh."
              >
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                <span>Outdated</span>
              </span>
            )}
          </div>
        ) : (
          /* Make Available Offline Toggle Button */
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="group/offline relative inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-white/20 bg-gradient-to-r from-[#FF6B2C] via-[#FFA057] to-[#FF6B2C] bg-[length:200%_auto] text-xs font-sans font-bold text-white shadow-[0_4px_12px_-2px_rgba(255,107,44,0.4)] hover:-translate-y-1 hover:scale-[1.02] hover:animate-[bg-shift_2s_ease-in-out_infinite,pulse-shadow_1.5s_infinite] transition-all duration-300 ease-out cursor-pointer active:scale-95"
          >
            {/* Inner Glow to make the button look 3D */}
            <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none" />
            
            <div className="relative flex items-center justify-center">
               <CloudOff className="w-4 h-4 relative z-10 group-hover/offline:-translate-y-0.5 group-hover/offline:scale-110 group-hover/offline:drop-shadow-[0_2px_4px_rgba(255,255,255,0.5)] transition-all duration-300 mr-0.5" />
            </div>
            
            <span className="relative z-10 tracking-wide drop-shadow-sm group-hover/offline:text-white">Make Available Offline</span>
            
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes bg-shift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
              @keyframes pulse-shadow {
                0% { box-shadow: 0 0 0 0 rgba(255, 107, 44, 0.6), 0 8px 24px -4px rgba(255, 107, 44, 0.7); }
                70% { box-shadow: 0 0 0 12px rgba(255, 107, 44, 0), 0 8px 24px -4px rgba(255, 107, 44, 0.7); }
                100% { box-shadow: 0 0 0 0 rgba(255, 107, 44, 0), 0 8px 24px -4px rgba(255, 107, 44, 0.7); }
              }
            `}} />
          </button>
        )}
      </div>

      {/* MODAL SHEET FOR OFFLINE DOWNLOAD / MANAGING PACK (Portal to document.body) */}
      {isMounted && createPortal(
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
              {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDownloading && handleCloseModal()}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            />

            {/* Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="relative w-full max-w-md bg-[#FAF6F0] rounded-3xl p-6 shadow-2xl border border-[#E6DFD5] text-[#1E1C1A] z-10 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E6DFD5]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-[#FF6B2C]/15 flex items-center justify-center text-[#FF6B2C]">
                    <CloudCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold">Offline Availability</h3>
                    <p className="text-xs text-gray-500 font-sans">TripWise Offline Dossier & Assets</p>
                  </div>
                </div>

                {!isDownloading && (
                  <button
                    onClick={handleCloseModal}
                    className="w-8 h-8 rounded-full bg-white border border-[#E6DFD5] flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Body */}
              <div className="py-4 space-y-4 font-sans text-xs">
                {/* Status Indicator */}
                {isAvailable ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 flex items-start gap-3">
                    <CloudCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-sm">Trip Cached & Ready Offline</p>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        Last synced: {formatLastSynced()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-[#FF6B2C]/10 border border-[#FF6B2C]/30 text-[#1E1C1A] flex items-start gap-3">
                    <HardDrive className="w-5 h-5 text-[#FF6B2C] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-sm text-[#FF6B2C]">Estimated Storage Size</p>
                      <p className="text-xs font-bold text-[#1E1C1A] mt-0.5">{sizeEstimate}</p>
                    </div>
                  </div>
                )}

                {/* Stale Warning Banner */}
                {isStale && isAvailable && (
                  <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-400/50 text-amber-950 flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Your offline copy may be outdated. Reconnect and refresh to update.</span>
                  </div>
                )}

                {/* What Gets Cached Checklist */}
                <div className="bg-white/80 rounded-2xl p-3.5 border border-[#E6DFD5] space-y-2">
                  <p className="font-bold text-gray-700 text-xs tracking-wide uppercase text-[10px]">
                    What Gets Cached for Offline Access
                  </p>
                  
                  <div className="grid grid-cols-1 gap-2 text-[11px]">
                    <div className="flex items-center gap-2 text-gray-800">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Full Itinerary (All days, activities, descriptions & AI insights)</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-800">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Destination & Hotel Basecamp Photos</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-800">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Offline Map Tiles (Viewed bounding box & stops)</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-800">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Emergency Info & Embassy Directory (Critical)</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-800">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Packing List & Visa Requirements</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-400 line-through">
                      <X className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span>Price Tracking & Live AI Generation (Requires Internet)</span>
                    </div>
                  </div>
                </div>

                {/* Download Progress Bar */}
                {isDownloading && (
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-[11px] font-bold text-gray-700">
                      <span>{currentStepText}</span>
                      <span>{downloadProgress}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#FF6B2C] to-amber-500 rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: `${downloadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Footer */}
              <div className="pt-3 border-t border-[#E6DFD5] flex items-center justify-between gap-3">
                {isAvailable ? (
                  <>
                    <button
                      type="button"
                      onClick={handleRemoveOfflinePack}
                      disabled={isDownloading}
                      className="px-3.5 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-bold transition-all cursor-pointer"
                    >
                      Remove Offline Copy
                    </button>

                    <button
                      type="button"
                      onClick={handleStartDownload}
                      disabled={isDownloading}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF6B2C] hover:bg-[#E55A1C] text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isDownloading ? 'animate-spin' : ''}`} />
                      <span>{isDownloading ? 'Downloading...' : 'Refresh Offline Data'}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      disabled={isDownloading}
                      className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-200/50 text-xs font-bold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleStartDownload}
                      disabled={isDownloading}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#FF6B2C] hover:bg-[#E55A1C] text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
                      <span>{isDownloading ? 'Downloading...' : 'Start Download'}</span>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </>
  );
}
