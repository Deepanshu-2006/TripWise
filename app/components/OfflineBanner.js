'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getOfflinePack, isOfflinePackStale } from '../../lib/offlineManager';

export default function OfflineBanner({ tripId = 'default_trip' }) {
  const [isOffline, setIsOffline] = useState(false);
  const [lastSyncedText, setLastSyncedText] = useState(null);
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      const offline = !navigator.onLine;
      setIsOffline(offline);

      // Check offline pack metadata
      const pack = getOfflinePack(tripId);
      if (pack && pack.cachedAt) {
        const date = new Date(pack.cachedAt);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        setLastSyncedText(`${dateStr} at ${timeStr}`);
      }

      setIsStale(isOfflinePackStale(tripId, 24));
    };

    updateOnlineStatus();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [tripId]);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed top-2 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none w-[92%] max-w-xl"
        >
          <div className="bg-[#1E1C1A]/95 backdrop-blur-md text-amber-300 px-4 py-2 rounded-2xl shadow-xl border border-amber-500/30 flex items-center justify-between gap-3 text-xs font-sans pointer-events-auto">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              </div>
              <span className="truncate">
                {isStale ? (
                  <span className="text-amber-200">
                    <strong className="text-amber-400 font-bold">Offline:</strong> Your offline copy may be outdated. Reconnect to update.
                  </span>
                ) : (
                  <span>
                    <strong className="text-white font-bold">You&apos;re offline</strong> — viewing cached data from{' '}
                    <span className="underline decoration-amber-400/50">{lastSyncedText || 'recent sync'}</span>.
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 text-[10px] text-amber-300">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Cached</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
