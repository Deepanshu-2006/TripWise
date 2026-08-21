'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, X, Check, Info, Plane, Sun, TrendingDown, ChevronRight, AlertCircle } from 'lucide-react';

// ─── Storage helpers ──────────────────────────────────────────────────────────

const PREFS_KEY = 'tw_notification_prefs';

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    tripCountdown: true,
    morningDigest: true,
    priceAlerts: false,
  };
}

function savePrefs(prefs) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch {}
}

// ─── Scheduling helpers ───────────────────────────────────────────────────────

/**
 * Send a SCHEDULE_NOTIFICATION message to the service worker.
 * The SW stores it and fires it via setTimeout (local-only MVP).
 */
async function scheduleLocalNotification({ title, body, tag, delayMs, icon = '/logo.png', url = '/itinerary' }) {
  if (!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.ready.catch(() => null);
  if (!reg) return;
  reg.active?.postMessage({
    type: 'SCHEDULE_NOTIFICATION',
    payload: { title, body, tag, delayMs, icon, url },
  });
}

/**
 * Fire an immediate test notification via the service worker.
 */
async function fireTestNotification(title, body) {
  if (!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.ready.catch(() => null);
  if (!reg) return;
  reg.active?.postMessage({
    type: 'SCHEDULE_NOTIFICATION',
    payload: {
      title,
      body,
      tag: `tw-test-${Date.now()}`,
      delayMs: 500,
      icon: '/logo.png',
      url: '/itinerary',
    },
  });
}

// ─── Permission Status Badge ──────────────────────────────────────────────────

function PermissionBadge({ status }) {
  const configs = {
    default: { label: 'Not enabled', color: 'text-[#7A7268]', bg: 'bg-[#F5F0E8]', dot: 'bg-[#7A7268]' },
    granted: { label: 'Active', color: 'text-emerald-700', bg: 'bg-emerald-50 border border-emerald-200', dot: 'bg-emerald-500 animate-pulse' },
    denied: { label: 'Blocked', color: 'text-red-600', bg: 'bg-red-50 border border-red-200', dot: 'bg-red-500' },
  };
  const cfg = configs[status] || configs.default;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9.5px] font-sans font-bold ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Notification Toggle Card ─────────────────────────────────────────────────

function NotificationCard({ icon, title, description, enabled, onToggle, disabled, tag }) {
  return (
    <motion.div
      layout
      className={`relative flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-200 ${
        enabled && !disabled
          ? 'bg-white border-[#E6DFD5] shadow-2xs'
          : 'bg-[#FAF6F0] border-[#E6DFD5]/60'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {/* Icon */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
        enabled && !disabled ? 'bg-[#FF6B2C]/10 text-[#FF6B2C]' : 'bg-[#E6DFD5]/60 text-[#7A7268]'
      }`}>
        {icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-sans font-bold text-[#1E1C1A] leading-tight">{title}</p>
        <p className="text-[10px] text-[#7A7268] font-sans mt-0.5 leading-snug">{description}</p>
      </div>

      {/* Toggle */}
      <button
        onClick={disabled ? undefined : onToggle}
        aria-label={enabled ? `Disable ${title}` : `Enable ${title}`}
        className={`relative w-10 h-5.5 rounded-full transition-all duration-300 shrink-0 focus:outline-none ${
          disabled ? 'cursor-not-allowed' : 'cursor-pointer'
        } ${enabled && !disabled ? 'bg-[#FF6B2C]' : 'bg-[#E6DFD5]'}`}
      >
        <motion.span
          layout
          animate={{ x: enabled && !disabled ? 18 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          className="absolute top-[2px] w-4.5 h-4.5 bg-white rounded-full shadow-sm"
        />
      </button>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NotificationsPanel({ isOpen, onClose, itinerary }) {
  const [permission, setPermission] = useState('default');
  const [isRequesting, setIsRequesting] = useState(false);
  const [prefs, setPrefs] = useState({ tripCountdown: true, morningDigest: true, priceAlerts: false });
  const [testFired, setTestFired] = useState(false);

  const destination = itinerary?.destination || 'your trip';
  const startDate = itinerary?.startDate;

  // Load current permission + prefs on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
    const stored = loadPrefs();
    setPrefs(stored);
  }, [isOpen]);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return;
    setIsRequesting(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        // Schedule a welcome notification
        await scheduleLocalNotification({
          title: '🔔 TripWise Notifications Enabled',
          body: `You'll get reminders for your trip to ${destination}!`,
          tag: 'tw-welcome',
          delayMs: 1500,
        });

        // Schedule trip countdown if startDate is set
        if (startDate && prefs.tripCountdown) {
          const [y, m, d] = startDate.split('-');
          const tripMs = new Date(+y, +m - 1, +d).getTime();
          const oneDayBefore = tripMs - 24 * 60 * 60 * 1000;
          const now = Date.now();
          if (oneDayBefore > now) {
            await scheduleLocalNotification({
              title: `✈️ ${destination} tomorrow!`,
              body: `Your TripWise adventure starts tomorrow. Check your packing list!`,
              tag: 'tw-countdown',
              delayMs: oneDayBefore - now,
            });
          }
        }
      }
    } finally {
      setIsRequesting(false);
    }
  }, [destination, startDate, prefs.tripCountdown]);

  const updatePref = (key, value) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    savePrefs(next);

    // Schedule/cancel when toggling individual prefs (only if permission granted)
    if (permission === 'granted' && value) {
      if (key === 'tripCountdown' && startDate) {
        const [y, m, d] = startDate.split('-');
        const tripMs = new Date(+y, +m - 1, +d).getTime();
        const oneDayBefore = tripMs - 24 * 60 * 60 * 1000;
        if (oneDayBefore > Date.now()) {
          scheduleLocalNotification({
            title: `✈️ ${destination} tomorrow!`,
            body: 'Your TripWise adventure starts tomorrow. Check your packing list!',
            tag: 'tw-countdown',
            delayMs: oneDayBefore - Date.now(),
          });
        }
      }
    }
  };

  const handleTestNotification = async () => {
    await fireTestNotification(
      `📋 TripWise: Today's ${destination} Highlights`,
      `You have ${itinerary?.days?.[0]?.activities?.length || 3} activities planned. Tap to see your itinerary!`
    );
    setTestFired(true);
    setTimeout(() => setTestFired(false), 3000);
  };

  const isGranted = permission === 'granted';
  const isDenied = permission === 'denied';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed z-[9999] inset-x-4 bottom-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-auto sm:w-full sm:max-w-md"
          >
            <div className="bg-[#FDFAF7] rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.22),0_0_0_1px_rgba(230,223,213,0.9)] overflow-hidden">

              {/* ── Header ── */}
              <div className="relative bg-gradient-to-br from-[#1E1C1A] via-[#2D2A26] to-[#3D3830] px-5 pt-5 pb-6 overflow-hidden">
                <div className="absolute -top-6 right-4 w-32 h-32 bg-[#FF6B2C]/15 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-20 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />

                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={isGranted ? { rotate: [0, -10, 10, -6, 6, 0] } : {}}
                      transition={{ delay: 0.4, duration: 0.7 }}
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg shrink-0 ${
                        isGranted
                          ? 'bg-gradient-to-br from-[#FF6B2C] to-[#E55A1C] shadow-[#FF6B2C]/30'
                          : isDenied
                          ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/30'
                          : 'bg-gradient-to-br from-[#3D3830] to-[#2D2A26] border border-white/10'
                      }`}
                    >
                      {isDenied ? (
                        <BellOff className="w-5.5 h-5.5 text-white" strokeWidth={2} />
                      ) : (
                        <Bell className="w-5.5 h-5.5 text-white" strokeWidth={2} />
                      )}
                    </motion.div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-serif font-black text-white leading-tight">
                          Smart Notifications
                        </h2>
                        <PermissionBadge status={permission} />
                      </div>
                      <p className="text-[11px] text-white/60 font-sans mt-0.5 leading-snug">
                        Trip reminders & price alerts for {destination}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0 mt-0.5 cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>

              {/* ── Body ── */}
              <div className="p-4 space-y-3">

                {/* ── Denied state ── */}
                {isDenied && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 p-3.5 bg-red-50 border border-red-200 rounded-2xl"
                  >
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" strokeWidth={2} />
                    <div>
                      <p className="text-[11.5px] font-sans font-bold text-red-700">Notifications are blocked</p>
                      <p className="text-[10px] text-red-600/80 font-sans mt-1 leading-relaxed">
                        To re-enable: open your browser settings → Site settings → Notifications → find this site and allow.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* ── Default state — enable prompt ── */}
                {!isGranted && !isDenied && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-3"
                  >
                    <div className="flex gap-3 p-3.5 bg-[#FFF8F4] border border-[#FF6B2C]/20 rounded-2xl">
                      <Info className="w-4 h-4 text-[#FF6B2C] mt-0.5 shrink-0" strokeWidth={2} />
                      <p className="text-[10.5px] text-[#5A4A38] font-sans leading-relaxed">
                        Enable notifications to get trip countdowns, morning activity briefings, and price drop alerts — all from your browser.
                      </p>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      whileHover={{ scale: 1.01 }}
                      onClick={requestPermission}
                      disabled={isRequesting}
                      className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#FF6B2C] to-[#E55A1C] text-white text-[13px] font-sans font-bold shadow-[0_8px_24px_-6px_rgba(255,107,44,0.5)] hover:shadow-[0_12px_28px_-6px_rgba(255,107,44,0.6)] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isRequesting ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                      ) : (
                        <Bell className="w-4 h-4" strokeWidth={2} />
                      )}
                      {isRequesting ? 'Requesting permission…' : 'Enable Notifications'}
                    </motion.button>
                  </motion.div>
                )}

                {/* ── Notification Cards ── */}
                <div className="space-y-2">
                  {!isGranted && !isDenied && (
                    <p className="text-[9.5px] font-mono font-black uppercase tracking-widest text-[#7A7268]">
                      What you'll get:
                    </p>
                  )}
                  {isGranted && (
                    <p className="text-[9.5px] font-mono font-black uppercase tracking-widest text-[#7A7268]">
                      Active alerts:
                    </p>
                  )}

                  <NotificationCard
                    icon={<Plane className="w-4 h-4" strokeWidth={2} />}
                    title="Trip Countdown"
                    description={
                      startDate
                        ? `Alert 24 hours before your ${destination} departure`
                        : 'Alert 24h before departure — add a start date to your trip'
                    }
                    enabled={prefs.tripCountdown}
                    onToggle={() => updatePref('tripCountdown', !prefs.tripCountdown)}
                    disabled={!isGranted}
                  />

                  <NotificationCard
                    icon={<Sun className="w-4 h-4" strokeWidth={2} />}
                    title="Morning Digest"
                    description="Daily 8 AM briefing: today's activities & first stop time"
                    enabled={prefs.morningDigest}
                    onToggle={() => updatePref('morningDigest', !prefs.morningDigest)}
                    disabled={!isGranted}
                  />

                  <NotificationCard
                    icon={<TrendingDown className="w-4 h-4" strokeWidth={2} />}
                    title="Price Drop Alerts"
                    description="Get notified when tracked flights or hotels drop in price"
                    enabled={prefs.priceAlerts}
                    onToggle={() => updatePref('priceAlerts', !prefs.priceAlerts)}
                    disabled={!isGranted}
                  />
                </div>

                {/* ── Test notification button (only when granted) ── */}
                {isGranted && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleTestNotification}
                    className="w-full py-2.5 px-4 rounded-xl bg-white border border-[#E6DFD5] hover:border-[#FF6B2C]/40 text-[11.5px] font-sans font-bold text-[#1E1C1A] flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer hover:shadow-sm group"
                  >
                    {testFired ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />
                        <span className="text-emerald-700">Notification sent!</span>
                      </>
                    ) : (
                      <>
                        <Bell className="w-3.5 h-3.5 text-[#FF6B2C] group-hover:animate-[wiggle_0.3s_ease]" strokeWidth={2} />
                        Send a test notification
                        <ChevronRight className="w-3 h-3 text-[#7A7268] group-hover:text-[#FF6B2C] transition-colors" />
                      </>
                    )}
                  </motion.button>
                )}

                {/* ── Footer ── */}
                <p className="text-[9px] text-[#7A7268]/60 font-sans text-center leading-relaxed">
                  Notifications are local — no data is sent to any server.
                  {isDenied ? '' : ' They only fire when your browser is running.'}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
