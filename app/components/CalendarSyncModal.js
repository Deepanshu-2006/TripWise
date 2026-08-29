'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Check, ChevronDown, Utensils, MapPin, Plane, RefreshCw } from 'lucide-react';
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
    name: 'Apple / Other',
    icon: null,
    color: '#1C1C1E',
    bg: '#F2F2F7',
    action: 'ics',
    label: 'Download .ics',
  },
];

// ─── SVG Icons for calendar providers ────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg viewBox="0 0 512 512" className="w-6 h-6">
      <path d="M387 117.5 265.7 104l-148.2 13.5L104 252.2 117.5 387l134.7 16.8L387 387l13.5-138.1z" style={{ fill: '#fff' }} transform="translate(3.75 3.75)"/>
      <path d="M176.55 330.35c-10.1-6.8-17-16.7-20.9-29.9l23.4-9.6c2.1 8.1 5.8 14.3 11.1 18.8 5.3 4.4 11.7 6.6 19.1 6.6 7.6 0 14.2-2.3 19.7-7s8.3-10.6 8.3-17.8q0-10.95-8.7-18c-5.8-4.6-13.1-7-21.8-7h-13.5v-23.1h12.1c7.5 0 13.8-2 18.9-6.1 5.1-4 7.7-9.6 7.7-16.6q0-9.45-6.9-15c-4.6-3.7-10.4-5.6-17.4-5.6-6.9 0-12.3 1.8-16.4 5.5-4 3.7-7 8.2-8.8 13.5l-23.1-9.6c3.1-8.7 8.7-16.4 16.9-23 8.3-6.6 18.8-10 31.6-10 9.5 0 18 1.8 25.5 5.5s13.5 8.8 17.8 15.2c4.3 6.5 6.4 13.8 6.4 21.9 0 8.3-2 15.2-6 21q-6 8.55-14.7 13.2v1.4c7.6 3.2 13.9 8.1 18.8 14.7s7.3 14.4 7.3 23.6-2.3 17.3-7 24.5c-4.6 7.2-11.1 12.8-19.2 16.9-8.2 4.1-17.4 6.2-27.6 6.2-11.6 0-22.5-3.4-32.6-10.2m143.4-116-25.5 18.6-12.8-19.5 46-33.2h17.7v156.7h-25.3v-122.6z" style={{ fill: '#1a73e8' }}/>
      <path d="M387 508.2 508.2 387l-60.6-27-60.6 27-27 60.6z" style={{ fill: '#ea4335' }} transform="translate(3.75 3.75)"/>
      <path d="m90.6 447.6 26.9 60.6H387V387H117.5z" style={{ fill: '#34a853' }} transform="translate(3.75 3.75)"/>
      <path d="M36.7-3.8C14.3-3.8-3.8 14.3-3.8 36.7V387l60.6 26.9 60.6-26.9V117.5H387l26.9-60.6L387-3.8z" style={{ fill: '#4285f4' }} transform="translate(3.75 3.75)"/>
      <path d="M-3.8 387v80.8c0 22.3 18.1 40.4 40.4 40.4h80.8V387z" style={{ fill: '#188038' }} transform="translate(3.75 3.75)"/>
      <path d="M387 117.5V387h121.3V117.5l-60.6-26.9z" style={{ fill: '#fbbc04' }} transform="translate(3.75 3.75)"/>
      <path d="M508.2 117.5V36.7c0-22.3-18.1-40.4-40.4-40.4H387v121.3h121.2z" style={{ fill: '#1967d2' }} transform="translate(3.75 3.75)"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-6 h-6 shadow-[0_1px_3px_rgba(0,0,0,0.1)] rounded-[20px]">
      <rect width="100" height="100" rx="20" fill="white" />
      <path d="M0 20 C0 8.95 8.95 0 20 0 L80 0 C91.05 0 100 8.95 100 20 L100 28 L0 28 Z" fill="#ff3b30"/>
      <text x="50" y="21" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="700" fontSize="15" fill="white" textAnchor="middle" letterSpacing="1">JUL</text>
      <text x="50" y="78" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="400" fontSize="58" fill="black" textAnchor="middle" letterSpacing="-2">17</text>
      <rect width="100" height="100" rx="20" fill="none" stroke="#E5E5EA" strokeWidth="1"/>
    </svg>
  );
}


const providerIcons = {
  google: <GoogleIcon />,
  apple: <AppleIcon />,
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
  const scrollContainerRef = useRef(null);
  const previewRef = useRef(null);

  const options = { includeFood, includeSightseeing, includeTransport };
  const eventCount = useMemo(() => countCalendarEvents(itinerary, options), [itinerary, options]);
  const destination = itinerary?.destination || itinerary?.destinationName || 'Your Trip';
  const days = itinerary?.days || [];

  const [isSynced, setIsSynced] = useState(false);
  const syncStorageKey = `tw_calendar_synced_${itinerary?.id || 'default'}`;

  useEffect(() => {
    if (isOpen) {
      setIsSynced(localStorage.getItem(syncStorageKey) === 'true');
    }
  }, [isOpen, syncStorageKey]);

  // Lock body scroll and Lenis when modal is open to prevent background scrolling bleed
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (typeof window !== 'undefined' && window.lenis) window.lenis.stop();
    } else {
      document.body.style.overflow = '';
      if (typeof window !== 'undefined' && window.lenis) window.lenis.start();
    }
    return () => {
      document.body.style.overflow = '';
      if (typeof window !== 'undefined' && window.lenis) window.lenis.start();
    };
  }, [isOpen]);

  const handleAction = (provider) => {
    if (provider.action === 'url') {
      // Google Calendar
      const url = getGoogleCalendarTripUrl(itinerary);
      window.open(url, '_blank', 'noopener,noreferrer');
      setDownloadedId(provider.id);
    } else {
      // ICS download
      const icsContent = generateICS(itinerary, options);
      const filename = getICSFilename(itinerary);
      downloadICS(icsContent, filename);
      setDownloadedId(provider.id);
    }
    
    // Mark as synced locally
    localStorage.setItem(syncStorageKey, 'true');
    setTimeout(() => {
      setDownloadedId(null);
      setIsSynced(true);
    }, 1500); // Show checkmark briefly before switching to success screen
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-9998"
          />

          {/* Modal */}
          <motion.div
            layout
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.8 }}
            onDragEnd={(_e, { offset, velocity }) => {
              if (offset.y > 100 || velocity.y > 400) {
                onClose();
              }
            }}
            className="fixed z-9999 inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:max-w-100 flex flex-col h-auto max-h-[90vh]"
          >
            <motion.div layout className="bg-white rounded-t-4xl sm:rounded-3xl shadow-[0_-12px_48px_rgba(0,0,0,0.1)] sm:shadow-[0_24px_64px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05)] flex flex-col h-auto max-h-full overflow-hidden">

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
              <div 
                ref={scrollContainerRef}
                className="p-5 sm:p-6 space-y-6 overflow-y-auto relative z-0 flex-1 overscroll-contain pb-safe-8 sm:pb-6"
                onPointerDownCapture={(e) => e.stopPropagation()}
                data-lenis-prevent="true"
              >
                <div>
                <AnimatePresence mode="wait">
                  {!isSynced ? (
                    <motion.div
                      key="options"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="grid grid-cols-2 gap-3"
                    >
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
                    </motion.div>
                  ) : (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="relative flex flex-col items-center justify-center py-8 px-6 bg-white border border-[#E6DFD5] shadow-sm rounded-3xl text-center overflow-hidden"
                    >
                      {/* Subtle premium gradient accent (Green for success) */}
                      <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-transparent via-emerald-500 to-transparent opacity-50" />
                      
                      <div className="relative w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4 border border-emerald-100 shadow-xs">
                        <motion.svg
                          viewBox="0 0 24 24"
                          className="w-7 h-7 text-emerald-600"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={3}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <motion.path
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
                            d="M20 6 9 17l-5-5"
                          />
                        </motion.svg>
                      </div>
                      
                      <h3 className="text-[17px] font-serif font-bold text-[#1E1C1A] tracking-tight mb-2">
                        Sync Initiated
                      </h3>
                      
                      <p className="text-[13px] text-[#7A7268] font-sans leading-relaxed max-w-55 mb-6">
                        Please ensure you complete the save process inside your calendar app.
                      </p>
                      
                      <button 
                        onClick={() => setIsSynced(false)}
                        className="group flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-[#7A7268] hover:text-[#FF6B2C] transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 transition-transform group-hover:rotate-180 duration-500" />
                        <span>Try again</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                <div ref={previewRef} className="pt-2 border-t border-stone-100">
                  <button
                    onClick={() => {
                      const opening = !showPreview;
                      setShowPreview(v => !v);
                      if (opening) {
                        // Wait for height animation to complete before scrolling to prevent jank
                        setTimeout(() => {
                          if (previewRef.current && scrollContainerRef.current) {
                            previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 300);
                      }
                    }}
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
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
