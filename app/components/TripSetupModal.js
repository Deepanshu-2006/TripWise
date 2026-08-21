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
      icon: <Calendar className="w-5 h-5" />,
      color: '#4285F4',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      title: 'Sync to Calendar',
      description: 'Add all your trip activities to Google or Apple Calendar.',
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
      icon: <Bell className="w-5 h-5" />,
      color: '#FF6B2C',
      bg: 'bg-orange-50',
      border: 'border-orange-100',
      iconBg: 'bg-orange-100',
      iconColor: 'text-[#FF6B2C]',
      title: 'Enable Trip Reminders',
      description: 'Get 24h departure countdowns & morning activity briefings.',
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="fixed z-[9999] inset-x-4 bottom-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-[420px]"
          >
            <div className="bg-white rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.06)] overflow-hidden">

              <div className="relative px-6 pt-6 pb-4">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-stone-500" strokeWidth={2} />
                </button>

                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-[#FF6B2C]/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[#FF6B2C]" />
                  </div>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#FF6B2C]">
                    Trip Setup
                  </span>
                </div>
                <h2 className="text-xl font-serif font-bold text-stone-900 tracking-tight mt-1">
                  A couple of things before you go ✈️
                </h2>
                <p className="text-[13px] text-stone-500 font-sans mt-1">
                  {pendingTasks.length === 1 ? 'One quick step left' : `${pendingTasks.length} quick steps`} to make your trip seamless.
                </p>
              </div>

              <div className="px-5 pb-5 space-y-3">
                {pendingTasks.map((task, i) => (
                  <motion.div
                    key={task.key}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08, type: 'spring', stiffness: 400, damping: 30 }}
                    className={`relative flex items-center gap-4 p-4 rounded-2xl border ${task.bg} ${task.border}`}
                  >
                    <div className={`w-11 h-11 rounded-2xl ${task.iconBg} ${task.iconColor} flex items-center justify-center shrink-0`}>
                      {task.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-sans font-semibold text-stone-900">{task.title}</p>
                      <p className="text-[11px] text-stone-500 font-sans mt-0.5 leading-snug">{task.description}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <button
                        onClick={task.onAction}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-white text-[11px] font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        style={{ backgroundColor: task.color }}
                      >
                        {task.cta}
                        <ChevronRight className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleSkip(task.key)}
                        className="text-[10px] font-sans text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                      >
                        Skip
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="border-t border-stone-100 px-5 py-3 flex items-center justify-between">
                <p className="text-[10px] text-stone-400 font-sans">Skipped items won&apos;t appear again.</p>
                <button
                  onClick={onClose}
                  className="text-[11px] font-sans font-medium text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                >
                  Do it later
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
