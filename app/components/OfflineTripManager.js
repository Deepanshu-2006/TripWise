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
      <div className="relative inline-flex items-center gap-1.5 shrink-0">
        {isAvailable ? (
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Available Offline Badge (Expanding on Hover) */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowModal(true)}
              className="group/btn relative overflow-hidden flex items-center h-[34px] rounded-full px-2.5 border border-emerald-500/40 bg-emerald-50 hover:bg-emerald-100 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer shadow-2xs shrink-0"
            >
              <CloudCheck className="w-[15px] h-[15px] text-emerald-600 shrink-0 relative z-10" />
              <span className="max-w-0 opacity-0 whitespace-nowrap overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/btn:max-w-[150px] group-hover/btn:opacity-100 group-hover/btn:ml-2 text-[10px] font-bold text-emerald-800 relative z-0 -translate-x-3 group-hover/btn:translate-x-0">
                Offline ✓
              </span>
            </motion.button>
            
            {/* Outdated Warning Chip if Stale */}
            {isStale && (
              <span 
                onClick={() => setShowModal(true)}
                className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold cursor-pointer shrink-0"
                title="Your offline copy may be outdated. Click to refresh."
              >
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                <span>Outdated</span>
              </span>
            )}
          </div>
        ) : (
          /* Make Available Offline Toggle Button (Expanding on Hover) */
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="group/offline relative overflow-hidden flex items-center h-[34px] rounded-full px-2.5 border border-white/20 bg-gradient-to-br from-[#FF6B2C] to-[#FFA057] shadow-[0_4px_12px_-2px_rgba(255,107,44,0.4)] hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_6px_16px_-4px_rgba(255,107,44,0.5)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer active:scale-95 shrink-0"
          >
            <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none" />
            <CloudOff className="w-[15px] h-[15px] text-white relative z-10 shrink-0" strokeWidth={2.5} />
            <span className="max-w-0 opacity-0 whitespace-nowrap overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/offline:max-w-[150px] group-hover/offline:opacity-100 group-hover/offline:ml-2 text-[10px] font-bold text-white relative z-0 -translate-x-3 group-hover/offline:translate-x-0">
              Download Trip
            </span>
          </button>
        )}

        {/* Sync Progress / Initializing Toast (Now rendered inline) */}
      </div>

      {/* MODAL SHEET FOR OFFLINE DOWNLOAD / MANAGING PACK (Portal to document.body) */}
      {/* MODAL SHEET FOR OFFLINE DOWNLOAD / MANAGING PACK (Portal to document.body) */}
      {isMounted && createPortal(
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center p-0 sm:p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isDownloading && handleCloseModal()}
                className="fixed inset-0 bg-[#1E1C1A]/40 backdrop-blur-xs"
              />

              {/* Dialog Card */}
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="relative w-full sm:max-w-md bg-[#FAF6F0] rounded-t-3xl sm:rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.2)] border border-[#E6DFD5] text-[#1E1C1A] z-10 overflow-hidden flex flex-col max-h-[90vh]"
              >
                {/* Mobile Drag Indicator */}
                <div className="pt-3 pb-1 flex justify-center sm:hidden">
                  <div className="w-10 h-1 rounded-full bg-[#D8D0C5]" />
                </div>

                {/* Header */}
                <div className="px-6 pt-4 pb-4 flex items-center justify-between border-b border-[#E6DFD5]/70">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#1E1C1A] text-white flex items-center justify-center shadow-xs shrink-0">
                      <CloudCheck className="w-4.5 h-4.5 text-[#FAF6F0]" strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#1E1C1A]">
                        Offline Availability
                      </h3>
                      <p className="text-[11px] text-[#7A7268] font-sans">
                        TripWise Dossier & Cached Assets
                      </p>
                    </div>
                  </div>

                  {!isDownloading && (
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="w-8 h-8 rounded-full bg-white hover:bg-[#FAF6F0] border border-[#E6DFD5] flex items-center justify-center text-[#7A7268] hover:text-[#1E1C1A] transition-colors cursor-pointer select-none"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Body Content */}
                <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
                  {/* Status & Footprint Card */}
                  <div className="p-4 rounded-2xl bg-white border border-[#E6DFD5] shadow-xs flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-[#8C827A]">
                        Storage Footprint
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-serif text-2xl font-bold text-[#1E1C1A] tracking-tight">
                          {sizeEstimate.replace(/[^0-9.~]/g, '') || '~45'}
                        </span>
                        <span className="text-xs font-mono font-bold text-[#7A7268]">
                          {sizeEstimate.replace(/[0-9.~]/g, '').trim() || 'MB'}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#8C827A] mt-0.5">
                        Maps, high-res photos & dossier
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {isAvailable ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 stroke-[2.5]" /> Cached Ready
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-[#FAF6F0] border border-[#E6DFD5] text-[#7A7268] text-[9px] font-mono font-bold uppercase tracking-wider">
                          Ready to Pack
                        </span>
                      )}
                      {isAvailable && formatLastSynced() && (
                        <span className="text-[9px] font-mono text-[#8C827A]">
                          Synced {formatLastSynced()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stale Warning Banner */}
                  {isStale && isAvailable && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-center gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="leading-snug text-[11px]">
                        Local dossier is over 24h old. Refresh to sync latest itinerary updates.
                      </span>
                    </div>
                  )}

                  {/* Checklist Card */}
                  <div className="rounded-2xl bg-white border border-[#E6DFD5] p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-[#E6DFD5]/60 pb-2.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8C827A]">
                        Included In Offline Pack
                      </span>
                      <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        5 Assets Included
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      {[
                        { title: 'Full Itinerary Dossier', desc: 'All days, activities, notes & AI insights' },
                        { title: 'Basecamp & Venue Photos', desc: 'Pre-cached high resolution media' },
                        { title: 'Offline Vector Map Tiles', desc: 'Viewed bounding box, stops & coordinates' },
                        { title: 'Emergency Directory', desc: 'Consulates, local emergency & police cards' },
                        { title: 'Travel & Packing Lists', desc: 'Gear checklists & visa documentation' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2.5">
                          <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-[#1E1C1A] text-[11.5px] leading-tight">
                              {item.title}
                            </span>
                            <span className="text-[10px] text-[#8C827A] leading-tight mt-0.5">
                              {item.desc}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Excluded Note */}
                    <div className="pt-2 border-t border-[#E6DFD5]/50 flex items-start gap-1.5 text-[10px] text-[#8C827A]">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-stone-300 shrink-0 mt-1" />
                      <p className="leading-snug">
                        Dynamic features (live AI generation & price tracking) require cellular data or Wi-Fi.
                      </p>
                    </div>
                  </div>

                  {/* Download Progress State */}
                  {isDownloading && (
                    <div className="p-4 rounded-2xl bg-white border border-[#E6DFD5] space-y-2.5 shadow-xs">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] font-mono text-[#1E1C1A] font-bold animate-pulse">
                          {currentStepText}
                        </span>
                        <span className="font-mono text-xs font-bold text-[#FF6B2C]">
                          {downloadProgress}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#FAF6F0] rounded-full overflow-hidden border border-[#E6DFD5]">
                        <motion.div
                          className="h-full bg-gradient-to-r from-[#FF6B2C] to-[#FFA057] rounded-full"
                          initial={{ width: '0%' }}
                          animate={{ width: `${downloadProgress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Footer */}
                <div className="px-6 py-4 border-t border-[#E6DFD5]/70 bg-white/50 flex items-center justify-between gap-3">
                  {isAvailable ? (
                    <>
                      <button
                        type="button"
                        onClick={handleRemoveOfflinePack}
                        disabled={isDownloading}
                        className="text-[11px] font-bold text-red-600/80 hover:text-red-700 transition-colors cursor-pointer disabled:opacity-50 select-none"
                      >
                        Remove Local Copy
                      </button>

                      <button
                        type="button"
                        onClick={handleStartDownload}
                        disabled={isDownloading}
                        className="px-5 py-2.5 rounded-full bg-[#1E1C1A] hover:bg-[#FF6B2C] text-white text-[11px] font-bold uppercase tracking-wider transition-colors duration-300 flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs select-none"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isDownloading ? 'animate-spin' : ''}`} />
                        <span>{isDownloading ? 'Syncing...' : 'Update Pack'}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        disabled={isDownloading}
                        className="px-4 py-2.5 rounded-full bg-white hover:bg-[#FAF6F0] border border-[#E6DFD5] text-[#7A7268] hover:text-[#1E1C1A] text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer select-none"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={handleStartDownload}
                        disabled={isDownloading}
                        className="flex-1 sm:flex-none px-6 py-2.5 rounded-full bg-[#1E1C1A] hover:bg-[#FF6B2C] text-white text-[11px] font-bold uppercase tracking-wider transition-colors duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs select-none"
                      >
                        <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce' : ''}`} />
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
