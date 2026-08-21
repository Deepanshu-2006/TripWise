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
    default: { label: 'Off', color: 'text-stone-500', bg: 'bg-stone-100' },
    granted: { label: 'Active', color: 'text-emerald-700', bg: 'bg-emerald-50' },
    denied: { label: 'Blocked', color: 'text-red-600', bg: 'bg-red-50' },
  };
  const cfg = configs[status] || configs.default;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-sans font-medium uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ─── Notification Toggle Card ─────────────────────────────────────────────────

function NotificationCard({ icon, title, description, enabled, onToggle, disabled, tag }) {
  return (
    <div className={`flex items-center gap-3.5 py-3.5 border-b border-stone-100 last:border-0 ${disabled ? 'opacity-50' : ''}`}>
      {/* Icon */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
        enabled && !disabled ? 'bg-stone-100 text-stone-900' : 'bg-stone-100 text-stone-400'
      }`}>
        {icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-sans font-medium text-stone-900 leading-tight">{title}</p>
        <p className="text-[11px] text-stone-500 font-sans mt-0.5 leading-snug">{description}</p>
      </div>

      {/* Toggle */}
      <button
        onClick={disabled ? undefined : onToggle}
        aria-label={enabled ? `Disable ${title}` : `Enable ${title}`}
        className={`relative w-[42px] h-6 rounded-full transition-colors duration-300 shrink-0 focus:outline-none ${
          disabled ? 'cursor-not-allowed' : 'cursor-pointer'
        } ${enabled && !disabled ? 'bg-stone-900' : 'bg-stone-200'}`}
      >
        <motion.span
          layout
          animate={{ x: enabled && !disabled ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-[2px] left-0 w-5 h-5 bg-white rounded-full shadow-sm"
        />
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NotificationsPanel({ isOpen, onClose, itinerary }) {
  const [permission, setPermission] = useState('default');
  const [isRequesting, setIsRequesting] = useState(false);
  const [prefs, setPrefs] = useState({ tripCountdown: true, morningDigest: true, priceAlerts: false });
  const [testFired, setTestFired] = useState(false);

  const destination = itinerary?.destinationName || itinerary?.destination || 'your trip';
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
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.8 }}
            onDragEnd={(e, { offset, velocity }) => {
              if (offset.y > 100 || velocity.y > 400) {
                onClose();
              }
            }}
            className="fixed z-[9999] inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:max-w-[380px] flex flex-col max-h-[90vh] sm:max-h-[85vh]"
          >
            <div className="bg-white rounded-t-[32px] sm:rounded-3xl shadow-[0_-12px_48px_rgba(0,0,0,0.1)] sm:shadow-[0_24px_64px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05)] flex flex-col h-full overflow-hidden">

              {/* ── Header ── */}
              <div className="relative px-6 pt-5 pb-4 shrink-0 z-10 flex flex-col items-center border-b border-stone-100">
                {/* Mobile Drag Pill */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-stone-200 sm:hidden" />
                
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-stone-500" strokeWidth={2} />
                </button>

                <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center mb-3 mt-2 sm:mt-0 text-stone-800">
                  {isDenied ? (
                    <BellOff className="w-6 h-6" strokeWidth={1.5} />
                  ) : (
                    <Bell className="w-6 h-6" strokeWidth={1.5} />
                  )}
                </div>
                
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-serif font-medium text-stone-900 tracking-tight">
                    Smart Notifications
                  </h2>
                  <PermissionBadge status={permission} />
                </div>
                <p className="text-xs text-stone-500 font-sans">
                  Trip reminders for {destination}
                </p>
              </div>

              {/* ── Scrollable Body ── */}
              <div className="p-5 sm:p-6 space-y-6 overflow-y-auto relative z-0 flex-1 overscroll-contain pb-safe-8 sm:pb-6">
                
                {/* ── Denied state ── */}
                {isDenied && (
                  <div className="flex gap-3 p-4 bg-red-50 rounded-2xl border border-red-100">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" strokeWidth={1.5} />
                    <div>
                      <p className="text-sm font-sans font-medium text-red-900">Notifications blocked</p>
                      <p className="text-xs text-red-700 font-sans mt-1 leading-relaxed">
                        To re-enable: open your browser settings → Site settings → Notifications → find this site and allow.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Default state — enable prompt ── */}
                {!isGranted && !isDenied && (
                  <div className="flex flex-col gap-4 pt-1">
                    <p className="text-[13px] text-stone-600 font-sans text-center px-4 leading-relaxed">
                      Get trip countdowns, morning activity briefings, and price drop alerts — right from your browser.
                    </p>

                    <button
                      onClick={requestPermission}
                      disabled={isRequesting}
                      className="w-full py-3.5 rounded-xl bg-stone-900 text-white text-[13px] font-sans font-medium hover:bg-stone-800 transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isRequesting ? 'Requesting permission...' : 'Enable Notifications'}
                    </button>
                  </div>
                )}

                {/* ── Notification Cards ── */}
                <div className="px-2">
                  <NotificationCard
                    icon={<Plane className="w-4 h-4" strokeWidth={2} />}
                    title="Trip Countdown"
                    description={startDate ? 'Alert 24h before departure' : 'Add a start date for this alert'}
                    enabled={prefs.tripCountdown}
                    onToggle={() => updatePref('tripCountdown', !prefs.tripCountdown)}
                    disabled={!isGranted}
                  />

                  <NotificationCard
                    icon={<Sun className="w-4 h-4" strokeWidth={2} />}
                    title="Morning Digest"
                    description="Daily 8 AM briefing on today's activities"
                    enabled={prefs.morningDigest}
                    onToggle={() => updatePref('morningDigest', !prefs.morningDigest)}
                    disabled={!isGranted}
                  />

                  <NotificationCard
                    icon={<TrendingDown className="w-4 h-4" strokeWidth={2} />}
                    title="Price Drop Alerts"
                    description="When tracked flights or hotels drop in price"
                    enabled={prefs.priceAlerts}
                    onToggle={() => updatePref('priceAlerts', !prefs.priceAlerts)}
                    disabled={!isGranted}
                  />
                </div>

                {/* ── Test notification button (only when granted) ── */}
                {isGranted && (
                  <button
                    onClick={handleTestNotification}
                    className="w-full py-3 rounded-xl bg-stone-50 hover:bg-stone-100 text-[13px] font-sans font-medium text-stone-800 flex items-center justify-center gap-2 transition-colors cursor-pointer border border-stone-200"
                  >
                    {testFired ? (
                      <span className="text-emerald-600 flex items-center gap-2">
                        <Check className="w-4 h-4" strokeWidth={2.5} /> Notification sent!
                      </span>
                    ) : (
                      'Send a test notification'
                    )}
                  </button>
                )}

                {/* ── Footer ── */}
                <div className="pt-2">
                  <p className="text-[10px] text-[#7A7268]/80 font-sans text-center leading-relaxed max-w-[280px] mx-auto">
                    Notifications are local — no data is sent to any server.
                    {isDenied ? '' : ' They only fire when your browser is running.'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
