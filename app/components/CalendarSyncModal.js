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
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

function OutlookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
      <rect x="1" y="4" width="14" height="16" rx="2" fill="#0078D4"/>
      <rect x="9" y="8" width="14" height="12" rx="2" fill="#28A8E8"/>
      <circle cx="9" cy="13" r="3.5" fill="white"/>
    </svg>
  );
}

function AnyCalIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
    <div className="flex items-center gap-3 py-2.5">
      <span className="text-base shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-sans font-medium text-stone-900 truncate">{activity.title}</p>
        <p className="text-[11px] text-stone-500 font-sans mt-0.5">{activity.time || 'Flexible time'}</p>
      </div>
      <span className="text-[11px] font-sans font-medium text-stone-400 shrink-0">Day {dayNum}</span>
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
                  <Calendar className="w-6 h-6" strokeWidth={1.5} />
                </div>
                
                <h2 className="text-xl font-serif font-medium text-stone-900 tracking-tight">
                  Sync to Calendar
                </h2>
                <p className="text-xs text-stone-500 font-sans mt-1">
                  {destination} · {eventCount} event{eventCount !== 1 ? 's' : ''}
                </p>
              </div>

              {/* ── Scrollable Body ── */}
              <div className="p-5 sm:p-6 space-y-6 overflow-y-auto relative z-0 flex-1 overscroll-contain pb-safe-8 sm:pb-6">
                <div>
                <div className="grid grid-cols-2 gap-3">
                  {PROVIDERS.map((provider) => {
                    const isDone = downloadedId === provider.id;
                    return (
                      <button
                        key={provider.id}
                        onClick={() => handleAction(provider)}
                        className="relative flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-transparent transition-colors cursor-pointer group"
                      >
                        <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center relative">
                          {isDone ? (
                            <motion.div
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="w-full h-full rounded-full bg-stone-900 flex items-center justify-center"
                            >
                              <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                            </motion.div>
                          ) : (
                            <div className="text-stone-800 transition-transform group-hover:scale-105 duration-300">
                              {providerIcons[provider.id]}
                            </div>
                          )}
                        </div>

                        <div className="text-center">
                          <p className="text-[13px] font-sans font-medium text-stone-800 leading-tight">
                            {provider.name}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                </div>

                {/* ── Event Filters ── */}
                <div className="flex justify-center gap-2 flex-wrap">
                  {[
                    { key: 'sightseeing', label: 'Sightseeing', icon: <MapPin className="w-3.5 h-3.5" strokeWidth={2} />, value: includeSightseeing, setter: setIncludeSightseeing },
                    { key: 'food', label: 'Dining', icon: <Utensils className="w-3.5 h-3.5" strokeWidth={2} />, value: includeFood, setter: setIncludeFood },
                    { key: 'transport', label: 'Transport', icon: <Plane className="w-3.5 h-3.5" strokeWidth={2} />, value: includeTransport, setter: setIncludeTransport },
                  ].map(filter => (
                    <button
                      key={filter.key}
                      onClick={() => filter.setter(v => !v)}
                      className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-full border transition-all duration-200 cursor-pointer overflow-hidden ${
                        filter.value 
                          ? 'bg-stone-900 border-stone-900 shadow-md' 
                          : 'bg-white border-stone-200 hover:bg-stone-50 hover:border-stone-300'
                      }`}
                    >
                      <div className={`transition-colors ${filter.value ? 'text-stone-300' : 'text-stone-400'}`}>
                        {filter.value ? <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} /> : filter.icon}
                      </div>
                      <span className={`text-[12px] font-sans font-medium transition-colors ${filter.value ? 'text-white' : 'text-stone-600'}`}>
                        {filter.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* ── Event Preview Toggle ── */}
                <div className="pt-2 border-t border-stone-100">
                  <button
                    onClick={() => setShowPreview(v => !v)}
                    className="w-full flex items-center justify-between py-2 transition-colors cursor-pointer group"
                  >
                    <span className="text-sm font-sans font-medium text-stone-800">
                      View itinerary preview
                    </span>
                    <motion.div animate={{ rotate: showPreview ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-4 h-4 text-stone-400 group-hover:text-stone-700 transition-colors" />
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
                        <div className="pt-3 pb-1 space-y-1">
                          {previewEvents.map((item, i) => (
                            <EventPreviewItem key={i} activity={item.activity} dayNum={item.dayNum} />
                          ))}

                          {previewEvents.length === 0 && (
                            <p className="text-sm text-stone-500 font-sans py-4 text-center">
                              No activities match the selected filters.
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── Footer note ── */}
                <div className="pt-2">
                  <p className="text-xs text-stone-400 font-sans text-center leading-relaxed">
                    Sync is offline. No data leaves your device.
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
