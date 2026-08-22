'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Bell, ChevronRight, Sparkles } from 'lucide-react';

const STORAGE_KEY_PREFIX = 'tw_setup_done';

function getStorageKey(tripId) {
  return `${STORAGE_KEY_PREFIX}_${tripId || 'default'}`;
}

function loadDone(tripId) {
  try {
    const raw = localStorage.getItem(getStorageKey(tripId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function markDone(tripId, key) {
  try {
    const current = loadDone(tripId);
    current[key] = true;
    localStorage.setItem(getStorageKey(tripId), JSON.stringify(current));
  } catch {}
}

export default function TripSetupModal({ isOpen, onClose, itinerary, tripId, onOpenCalendar, onOpenNotifications }) {
  const [done, setDone] = useState({});
  const [notifPermission, setNotifPermission] = useState('default');

  useEffect(() => {
    if (!isOpen) return;
    setDone(loadDone(tripId));
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, [isOpen, tripId]);

  const calendarDone = done.calendar === true;
  const notifDone = done.notifications === true || notifPermission === 'granted';

  const pendingTasks = [
    !calendarDone && {
      key: 'calendar',
      icon: <Calendar className="w-4 h-4" strokeWidth={1.5} />,
      title: 'Calendar Sync',
      description: 'Export this itinerary to your personal calendar for seamless access during your trip.',
      cta: 'Sync Now',
      onAction: () => {
        markDone(tripId, 'calendar');
        setDone(prev => ({ ...prev, calendar: true }));
        onClose();
        if (onOpenCalendar) onOpenCalendar();
      },
    },
    !notifDone && {
      key: 'notifications',
      icon: <Bell className="w-4 h-4" strokeWidth={1.5} />,
      title: 'Trip Reminders',
      description: 'Receive morning briefings and departure countdowns directly to your device.',
      cta: 'Enable',
      onAction: () => {
        markDone(tripId, 'notifications');
        setDone(prev => ({ ...prev, notifications: true }));
        onClose();
        if (onOpenNotifications) onOpenNotifications();
      },
    },
  ].filter(Boolean);

  useEffect(() => {
    if (isOpen && pendingTasks.length === 0) {
      onClose();
    }
  }, [isOpen, pendingTasks.length]);

  const handleSkip = (key) => {
    markDone(tripId, key);
    setDone(prev => ({ ...prev, [key]: true }));
  };

  return (
    <AnimatePresence>
      {isOpen && pendingTasks.length > 0 && (
        <>
          {/* Desktop Backdrop (Hidden on mobile for lightweight feel) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="hidden sm:block fixed inset-0 bg-stone-900/40 backdrop-blur-md z-[9998]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -15 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed z-[9999] top-20 inset-x-4 sm:top-1/2 sm:left-1/2 sm:inset-x-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-[460px] pointer-events-auto"
          >
            <div className="bg-[#FAF6F0] rounded-[24px] sm:rounded-[28px] shadow-2xl overflow-hidden border border-[#E6DFD5] flex flex-col">

              {/* Header */}
              <div className="relative px-4 py-3 sm:px-8 sm:pt-8 sm:pb-6 border-b border-[#E6DFD5]/60 bg-white sm:bg-white flex flex-row sm:flex-col items-center sm:items-start justify-between sm:justify-start">
                
                {/* Mobile compact header content */}
                <div className="flex items-center gap-2 sm:hidden">
                  <div className="w-6 h-6 rounded-full bg-[#1E1C1A] flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-[#FAF6F0]" strokeWidth={1.5} />
                  </div>
                  <span className="text-[11px] font-bold text-[#1E1C1A] tracking-tight">
                    Finalize Trip Setup
                  </span>
                </div>

                <button
                  onClick={onClose}
                  className="sm:absolute sm:top-6 sm:right-6 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FAF6F0] sm:bg-transparent border border-[#E6DFD5] hover:bg-[#E6DFD5]/50 sm:hover:bg-[#FAF6F0] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7A7268]" strokeWidth={2} />
                </button>

                {/* Desktop header content */}
                <div className="hidden sm:flex items-center gap-2.5 mb-3">
                  <div className="w-6 h-6 rounded-full bg-[#1E1C1A] flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-[#FAF6F0]" strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#7A7268]">
                    Configuration
                  </span>
                </div>
                <h2 className="hidden sm:block text-[22px] font-serif font-bold text-[#1E1C1A] tracking-tight mt-1">
                  Finalize your itinerary
                </h2>
                <p className="hidden sm:block text-[13px] text-[#7A7268] font-sans mt-2 max-w-[300px] leading-relaxed">
                  {pendingTasks.length === 1 ? 'One final step remains' : `${pendingTasks.length} final steps remain`} to seamlessly integrate this trip with your devices.
                </p>
              </div>

              {/* Task List */}
              <div className="p-3 sm:px-8 sm:py-7 space-y-2 sm:space-y-4 bg-white sm:bg-[#FAF6F0] max-h-[50vh] sm:max-h-none overflow-y-auto">
                {pendingTasks.map((task, i) => (
                  <motion.div
                    key={task.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.4, ease: "easeOut" }}
                    className="relative flex flex-row sm:flex-col items-center sm:items-start gap-3 sm:gap-4 p-3 sm:p-5 rounded-[16px] sm:rounded-[20px] bg-[#FAF6F0] sm:bg-white border border-[#E6DFD5]/50 sm:border-[#E6DFD5] shadow-2xs sm:shadow-xs group"
                  >
                    {/* Mobile: Horizontal Row */}
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-[#E6DFD5] bg-white sm:bg-[#FAF6F0] text-[#1E1C1A] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                      {task.icon}
                    </div>

                    <div className="flex-1 min-w-0 pr-1 sm:pr-2 flex flex-col justify-center">
                      <p className="text-[12px] sm:text-[14px] font-bold sm:font-serif text-[#1E1C1A] truncate">{task.title}</p>
                      <p className="hidden sm:block text-[12px] text-[#7A7268] font-sans mt-1 leading-relaxed">{task.description}</p>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center gap-2 shrink-0 sm:w-full sm:pt-3 sm:border-t sm:border-[#E6DFD5]/50">
                      <button
                        onClick={task.onAction}
                        className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-[#1E1C1A] text-white text-[10px] font-bold uppercase tracking-wider transition-all hover:bg-[#FF6B2C] cursor-pointer shadow-sm"
                      >
                        {task.cta}
                      </button>
                      <button
                        onClick={() => handleSkip(task.key)}
                        className="hidden sm:block text-[10px] font-mono uppercase tracking-wider text-[#7A7268] hover:text-[#1E1C1A] transition-colors cursor-pointer px-2"
                      >
                        Skip
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Desktop Footer (Hidden on mobile) */}
              <div className="hidden sm:flex border-t border-[#E6DFD5] bg-white px-8 py-4 pb-4 items-center justify-between">
                <p className="text-[10px] font-mono uppercase tracking-wider text-[#7A7268]">Ignored steps won't return</p>
                <button
                  onClick={onClose}
                  className="text-[11px] font-bold font-sans text-[#1E1C1A] hover:text-[#FF6B2C] transition-colors cursor-pointer flex items-center gap-1"
                >
                  Review later <ChevronRight className="w-3 h-3" />
                </button>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
