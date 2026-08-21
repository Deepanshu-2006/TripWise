'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Download, ExternalLink, Check, ChevronDown, ChevronUp, Utensils, MapPin, Plane } from 'lucide-react';
import { generateICS, downloadICS, getGoogleCalendarTripUrl, getICSFilename, countCalendarEvents } from '../../lib/calendarSync';

// ─── Calendar Provider Configs ───────────────────────────────────────────────

const PROVIDERS = [
  {
    id: 'google',
    name: 'Google Calendar',
    icon: null, // SVG inline below
    color: '#4285F4',
    bg: '#EBF2FF',
    action: 'url',
    label: 'Add to Google',
  },
  {
    id: 'apple',
    name: 'Apple Calendar',
    icon: null,
    color: '#1C1C1E',
    bg: '#F2F2F7',
    action: 'ics',
    label: 'Download .ics',
  },
  {
    id: 'outlook',
    name: 'Outlook',
    icon: null,
    color: '#0078D4',
    bg: '#E6F2FB',
    action: 'ics',
    label: 'Download .ics',
  },
  {
    id: 'other',
    name: 'Any Calendar',
    icon: null,
    color: '#FF6B2C',
    bg: '#FFF2EC',
    action: 'ics',
    label: 'Download .ics',
  },
];

// ─── SVG Icons for calendar providers ────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

function OutlookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
      <rect x="1" y="4" width="14" height="16" rx="2" fill="#0078D4"/>
      <rect x="9" y="8" width="14" height="12" rx="2" fill="#28A8E8"/>
      <circle cx="9" cy="13" r="3.5" fill="white"/>
    </svg>
  );
}

function AnyCalIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="#FF6B2C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <line x1="8" y1="14" x2="8" y2="14" strokeWidth="2.5"/>
      <line x1="12" y1="14" x2="12" y2="14" strokeWidth="2.5"/>
      <line x1="16" y1="14" x2="16" y2="14" strokeWidth="2.5"/>
      <line x1="8" y1="18" x2="8" y2="18" strokeWidth="2.5"/>
      <line x1="12" y1="18" x2="12" y2="18" strokeWidth="2.5"/>
    </svg>
  );
}

const providerIcons = {
  google: <GoogleIcon />,
  apple: <AppleIcon />,
  outlook: <OutlookIcon />,
  other: <AnyCalIcon />,
};

// ─── Event Preview Item ───────────────────────────────────────────────────────

function EventPreviewItem({ activity, dayNum }) {
  const cat = (activity.category || '').toLowerCase();
  const isFood = cat.includes('dining') || cat.includes('food') || cat.includes('restaurant') || cat.includes('cafe');
  const isTransport = cat.includes('transport') || cat.includes('transit');
  const emoji = isFood ? '🍽️' : isTransport ? '🚌' : '📍';

  return (
    <div className="flex items-center gap-2.5 py-2 border-b border-[#E6DFD5]/50 last:border-0">
      <span className="text-sm shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-sans font-semibold text-[#1E1C1A] truncate">{activity.title}</p>
        {activity.time && (
          <p className="text-[10px] text-[#7A7268] font-mono mt-0.5">{activity.time}</p>
        )}
      </div>
      <span className="text-[9px] font-mono text-[#7A7268]/70 shrink-0">Day {dayNum}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CalendarSyncModal({ isOpen, onClose, itinerary }) {
  const [downloadedId, setDownloadedId] = useState(null);
  const [includeFood, setIncludeFood] = useState(true);
  const [includeSightseeing, setIncludeSightseeing] = useState(true);
  const [includeTransport, setIncludeTransport] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const options = { includeFood, includeSightseeing, includeTransport };
  const eventCount = useMemo(() => countCalendarEvents(itinerary, options), [itinerary, options]);
  const destination = itinerary?.destination || 'Your Trip';
  const days = itinerary?.days || [];

  const handleAction = (provider) => {
    if (provider.action === 'url') {
      // Google Calendar
      const url = getGoogleCalendarTripUrl(itinerary);
      window.open(url, '_blank', 'noopener,noreferrer');
      setDownloadedId(provider.id);
      setTimeout(() => setDownloadedId(null), 3000);
    } else {
      // ICS download
      const icsContent = generateICS(itinerary, options);
      const filename = getICSFilename(itinerary);
      downloadICS(icsContent, filename);
      setDownloadedId(provider.id);
      setTimeout(() => setDownloadedId(null), 3000);
    }
  };

  // Build preview events list
  const previewEvents = useMemo(() => {
    const events = [];
    days.forEach((day, dayIdx) => {
      const dayNum = day.dayNumber || dayIdx + 1;
      (day.activities || []).forEach(act => {
        const cat = (act.category || '').toLowerCase();
        const isFood = cat.includes('dining') || cat.includes('food') || cat.includes('restaurant') || cat.includes('cafe');
        const isTransport = cat.includes('transport') || cat.includes('transit');
        if (isFood && !includeFood) return;
        if (isTransport && !includeTransport) return;
        if (!isFood && !isTransport && !includeSightseeing) return;
        events.push({ activity: act, dayNum });
      });
    });
    return events;
  }, [days, includeFood, includeSightseeing, includeTransport]);

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

          {/* Modal */}
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
                {/* Decorative background glow */}
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-[#FF6B2C]/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-4 left-8 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Animated calendar icon */}
                    <motion.div
                      animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
                      transition={{ delay: 0.4, duration: 0.6 }}
                      className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FF6B2C] to-[#E55A1C] flex items-center justify-center shadow-lg shadow-[#FF6B2C]/30 shrink-0"
                    >
                      <Calendar className="w-5.5 h-5.5 text-white" strokeWidth={2.2} />
                    </motion.div>

                    <div>
                      <h2 className="text-base font-serif font-black text-white leading-tight">
                        Sync to Calendar
                      </h2>
                      <p className="text-[11px] text-white/60 font-sans mt-0.5 leading-snug">
                        {destination} · {eventCount} event{eventCount !== 1 ? 's' : ''}
                        {itinerary?.startDate ? (
                          <span className="ml-1 opacity-70">· {days.length} days</span>
                        ) : (
                          <span className="ml-1 text-amber-400/80"> · add start date for exact times</span>
                        )}
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

              {/* ── Calendar Provider Grid ── */}
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-[10px] font-mono font-black uppercase tracking-widest text-[#7A7268] mb-3">
                    Choose your calendar
                  </p>

                  <div className="grid grid-cols-2 gap-2.5">
                    {PROVIDERS.map((provider) => {
                      const isDone = downloadedId === provider.id;
                      return (
                        <motion.button
                          key={provider.id}
                          whileTap={{ scale: 0.96 }}
                          whileHover={{ y: -1 }}
                          onClick={() => handleAction(provider)}
                          style={{ '--provider-color': provider.color, '--provider-bg': provider.bg }}
                          className="relative flex flex-col items-center gap-2 p-3.5 rounded-2xl border border-[#E6DFD5] bg-white hover:border-[--provider-color]/40 hover:shadow-[0_4px_16px_-4px_var(--provider-color,rgba(0,0,0,0.1))] transition-all duration-200 cursor-pointer overflow-hidden group"
                        >
                          {/* Subtle background fill on hover */}
                          <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{ background: provider.bg }}
                          />

                          {isDone ? (
                            <motion.div
                              initial={{ scale: 0.5, rotate: -20 }}
                              animate={{ scale: 1, rotate: 0 }}
                              className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center relative z-10"
                            >
                              <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                            </motion.div>
                          ) : (
                            <div className="relative z-10">{providerIcons[provider.id]}</div>
                          )}

                          <div className="text-center relative z-10">
                            <p className="text-[11px] font-sans font-bold text-[#1E1C1A] leading-tight">
                              {isDone ? (provider.action === 'url' ? 'Opened!' : 'Downloaded!') : provider.name}
                            </p>
                            <p className="text-[9.5px] text-[#7A7268] font-mono mt-0.5">
                              {isDone ? '✓ done' : provider.label}
                            </p>
                          </div>

                          {/* Action icon */}
                          {!isDone && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-60 transition-opacity">
                              {provider.action === 'url' ? (
                                <ExternalLink className="w-3 h-3 text-[#7A7268]" />
                              ) : (
                                <Download className="w-3 h-3 text-[#7A7268]" />
                              )}
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Event Filters ── */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9.5px] font-mono font-black uppercase tracking-widest text-[#7A7268] shrink-0">
                    Include:
                  </span>
                  {[
                    { key: 'sightseeing', label: 'Sightseeing', icon: <MapPin className="w-2.5 h-2.5" />, value: includeSightseeing, setter: setIncludeSightseeing, color: '#FF6B2C' },
                    { key: 'food', label: 'Dining', icon: <Utensils className="w-2.5 h-2.5" />, value: includeFood, setter: setIncludeFood, color: '#059669' },
                    { key: 'transport', label: 'Transport', icon: <Plane className="w-2.5 h-2.5" />, value: includeTransport, setter: setIncludeTransport, color: '#6366F1' },
                  ].map(filter => (
                    <button
                      key={filter.key}
                      onClick={() => filter.setter(v => !v)}
                      style={{
                        background: filter.value ? `${filter.color}15` : 'transparent',
                        borderColor: filter.value ? `${filter.color}60` : '#E6DFD5',
                        color: filter.value ? filter.color : '#7A7268',
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded-full border text-[9.5px] font-sans font-bold transition-all duration-150 cursor-pointer"
                    >
                      {filter.icon}
                      {filter.label}
                      {filter.value && <Check className="w-2.5 h-2.5" strokeWidth={2.5} />}
                    </button>
                  ))}
                </div>

                {/* ── Event Preview Toggle ── */}
                <button
                  onClick={() => setShowPreview(v => !v)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#E6DFD5] hover:border-[#FF6B2C]/30 transition-colors cursor-pointer group"
                >
                  <span className="text-[11px] font-sans font-semibold text-[#1E1C1A]">
                    Preview {eventCount} calendar event{eventCount !== 1 ? 's' : ''}
                  </span>
                  <motion.div animate={{ rotate: showPreview ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-3.5 h-3.5 text-[#7A7268] group-hover:text-[#FF6B2C] transition-colors" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {showPreview && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-xl border border-[#E6DFD5] bg-white overflow-y-auto max-h-48 px-3">
                        {/* Summary event */}
                        <div className="flex items-center gap-2.5 py-2 border-b border-[#E6DFD5]/50">
                          <span className="text-sm shrink-0">✈️</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-sans font-semibold text-[#1E1C1A] truncate">
                              Trip to {destination}
                            </p>
                            <p className="text-[10px] text-[#7A7268] font-mono mt-0.5">All-day · Full trip span</p>
                          </div>
                          <span className="text-[9px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full shrink-0">Summary</span>
                        </div>

                        {previewEvents.map((item, i) => (
                          <EventPreviewItem key={i} activity={item.activity} dayNum={item.dayNum} />
                        ))}

                        {previewEvents.length === 0 && (
                          <p className="text-[11px] text-[#7A7268] font-sans py-3 text-center">
                            No activities match the selected filters
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Footer note ── */}
                <p className="text-[9.5px] text-[#7A7268]/70 font-sans text-center leading-relaxed">
                  .ics files work with Google Calendar, Apple Calendar, Outlook & more.
                  All syncing is done offline — no data leaves your device.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
