import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Loader2, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { DESTINATIONS } from '../../lib/destinations';

// Helper: Get days in month
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
// Helper: Get day of week (0-6) of the first day of the month
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function TripsCalendarView({ trips }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [direction, setDirection] = useState(1);
    const prefersReducedMotion = useReducedMotion();
    
    // Popover state
    const [selectedTripPopover, setSelectedTripPopover] = useState(null);
    const popoverRef = useRef(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Close popover on escape or outside click
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setSelectedTripPopover(null);
        };
        const handleClickOutside = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) {
                setSelectedTripPopover(null);
            }
        };
        if (selectedTripPopover) {
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('mousedown', handleClickOutside);
        };
    }, [selectedTripPopover]);

    const handlePrevMonth = () => {
        setDirection(-1);
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setDirection(1);
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const handleToday = () => {
        setDirection(new Date() > currentDate ? 1 : -1);
        setCurrentDate(new Date());
    };

    // Calculate Grid dates
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Group dates into weeks
    const weeks = [];
    let currentWeek = Array(7).fill(null);
    let dayOfWeek = firstDay;
    
    days.forEach(day => {
        currentWeek[dayOfWeek] = day;
        if (dayOfWeek === 6 || day === daysInMonth) {
            weeks.push(currentWeek);
            currentWeek = Array(7).fill(null);
            dayOfWeek = 0;
        } else {
            dayOfWeek++;
        }
    });

    // Helper: Normalize dates to midnight for comparison
    const normalizeDate = (d) => {
        if (!d) return null;
        const normalized = new Date(d);
        normalized.setHours(0, 0, 0, 0);
        return normalized;
    };

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month, daysInMonth);

    // Filter trips that overlap with current month
    const tripsThisMonth = useMemo(() => {
        return trips.filter(t => {
            if (!t.startDate || !t.endDate) return false;
            const start = normalizeDate(t.startDate);
            const end = normalizeDate(t.endDate);
            return start <= monthEnd && end >= monthStart;
        });
    }, [trips, monthStart, monthEnd]);

    // Calculate gaps between trips globally for the current view
    const gapsThisMonth = useMemo(() => {
        const sorted = [...tripsThisMonth].sort((a, b) => normalizeDate(a.startDate) - normalizeDate(b.startDate));
        const gaps = [];
        for (let i = 0; i < sorted.length - 1; i++) {
            const currentEnd = normalizeDate(sorted[i].endDate);
            const nextStart = normalizeDate(sorted[i+1].startDate);
            if (nextStart > currentEnd) {
                const diffDays = Math.floor((nextStart - currentEnd) / (1000 * 60 * 60 * 24)) - 1;
                if (diffDays >= 5) {
                    gaps.push({ start: currentEnd, end: nextStart, days: diffDays });
                }
            }
        }
        return gaps;
    }, [tripsThisMonth]);

    const nearestUpcomingTrip = useMemo(() => {
        const now = normalizeDate(new Date());
        const upcoming = trips.filter(t => t.status?.toUpperCase() === 'CONFIRMED' && normalizeDate(t.startDate) >= now);
        return upcoming.sort((a, b) => normalizeDate(a.startDate) - normalizeDate(b.startDate))[0];
    }, [trips]);

    const getNextStep = (lastCompletedStep) => {
        const order = ['destination', 'preferences', 'itinerary', 'review'];
        if (!lastCompletedStep) return 'destination';
        const idx = order.indexOf(lastCompletedStep);
        if (idx === -1 || idx === order.length - 1) return 'review';
        return order[idx + 1];
    };

    const renderTripBar = (trip, isStart, isEnd, daysSpan, rowIdx) => {
        const destName = trip.destinationName ? trip.destinationName.split(',')[0] : 'Trip';
        const tStart = new Date(trip.startDate);
        const tEnd = new Date(trip.endDate);
        const formatOpts = { month: 'short', day: 'numeric' };
        const dayCount = Math.ceil((tEnd - tStart) / (1000 * 60 * 60 * 24)) + 1;
        const statusUp = trip.status?.toUpperCase();
        
        let barClass = "";
        if (statusUp === 'CONFIRMED' || statusUp === 'UPCOMING') {
            barClass = "bg-gradient-to-r from-[#FF6B2C] to-[#FF8C5A] text-white shadow-md border border-[#FF6B2C]/20";
        } else if (statusUp === 'DRAFT') {
            barClass = "bg-white/60 backdrop-blur-md border-2 border-dashed border-[#FF6B2C]/60 text-stone-700 shadow-sm";
        } else {
            barClass = "bg-stone-100/80 backdrop-blur-sm text-stone-500 border border-stone-300/50";
        }

        const roundedClass = `${isStart ? 'rounded-l-full pl-2.5' : 'pl-1 -ml-1 border-l-0'} ${isEnd ? 'rounded-r-full pr-2.5' : 'pr-1 -mr-1 border-r-0'}`;
        const tooltipText = `${destName} · ${tStart.toLocaleDateString('en-US', formatOpts)}–${tEnd.toLocaleDateString('en-US', { ...formatOpts, year: 'numeric'})} · ${dayCount} days · ${statusUp === 'CONFIRMED' || statusUp === 'UPCOMING' ? 'Confirmed' : statusUp === 'DRAFT' ? 'Draft' : 'Past'}`;

        // Find destination info for image
        const destInfo = DESTINATIONS.find(d => d.name.toLowerCase() === destName.toLowerCase());
        
        // Check if nearest upcoming trip
        const isNearest = nearestUpcomingTrip && nearestUpcomingTrip.db_id === trip.db_id && isStart;
        const daysUntil = isNearest ? Math.max(0, Math.ceil((tStart - normalizeDate(new Date())) / (1000 * 60 * 60 * 24))) : null;

        return (
            <div 
                key={`${trip.db_id}-${rowIdx}`}
                className={`absolute h-[28px] flex items-center z-10 transition-transform ${prefersReducedMotion ? '' : 'hover:scale-[1.01]'} hover:brightness-105 hover:z-20 origin-left`}
                style={{ 
                    top: `${rowIdx * 34 + 36}px`, // 36px offset for day number + padding
                    width: `calc(100% - 6px)`,
                    left: '3px'
                }}
                title={tooltipText}
            >
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setSelectedTripPopover({ trip, rect, destInfo });
                    }}
                    aria-label={`View details for ${destName}`}
                    className={`w-full h-full flex items-center ${barClass} ${roundedClass} text-[11px] font-bold overflow-hidden px-1 outline-none focus:ring-2 focus:ring-[#FF6B2C]/50 transition-colors`}
                >
                    <div className="flex items-center min-w-0 flex-1">
                        {isStart && destInfo?.imageUrl && (
                            <img src={destInfo.imageUrl} alt={destName} className="w-5 h-5 rounded-full object-cover shrink-0 mr-2 shadow-sm" />
                        )}
                        <span className="truncate tracking-wide">{isStart ? destName : '→ ' + destName}</span>
                        {isNearest && daysUntil !== null && (
                            <span className="ml-2 px-2 py-[2px] bg-white/90 text-[#FF6B2C] rounded-md text-[9px] font-bold uppercase tracking-widest shadow-sm shrink-0">
                                In {daysUntil} days
                            </span>
                        )}
                    </div>
                </button>
            </div>
        );
    };

    // Calculate stacking for a week
    const getWeekTrips = (week) => {
        const weekStartDay = week.find(d => d !== null);
        const weekEndDay = [...week].reverse().find(d => d !== null);
        if (!weekStartDay || !weekEndDay) return { events: [], rows: 0 };

        const weekStart = new Date(year, month, weekStartDay);
        const weekEnd = new Date(year, month, weekEndDay);
        
        // Find trips overlapping this week
        const overlappingTrips = tripsThisMonth.filter(t => {
            const tStart = normalizeDate(t.startDate);
            const tEnd = normalizeDate(t.endDate);
            return tStart <= weekEnd && tEnd >= weekStart;
        }).sort((a, b) => normalizeDate(a.startDate) - normalizeDate(b.startDate));

        const eventRows = [];
        const maxCols = 7;

        overlappingTrips.forEach(trip => {
            const tStart = normalizeDate(trip.startDate);
            const tEnd = normalizeDate(trip.endDate);

            // Calculate start and end indices within the week (0-6)
            let startCol = 0;
            if (tStart > weekStart) {
                const diff = Math.floor((tStart - weekStart) / (1000 * 60 * 60 * 24));
                startCol = week.findIndex(d => d === weekStartDay) + diff;
            } else {
                startCol = week.findIndex(d => d === weekStartDay);
            }

            let endCol = 6;
            if (tEnd < weekEnd) {
                const diff = Math.floor((weekEnd - tEnd) / (1000 * 60 * 60 * 24));
                endCol = week.findLastIndex(d => d === weekEndDay) - diff;
            } else {
                endCol = week.findLastIndex(d => d === weekEndDay);
            }

            // Find an empty row for this span
            let rowIndex = 0;
            let placed = false;
            while (!placed) {
                if (!eventRows[rowIndex]) {
                    eventRows[rowIndex] = Array(7).fill(null);
                }
                
                let canPlace = true;
                for (let i = startCol; i <= endCol; i++) {
                    if (eventRows[rowIndex][i] !== null) {
                        canPlace = false;
                        break;
                    }
                }

                if (canPlace) {
                    // Mark as occupied
                    for (let i = startCol; i <= endCol; i++) {
                        eventRows[rowIndex][i] = trip.db_id;
                    }
                    
                    const isStart = tStart >= weekStart;
                    const isEnd = tEnd <= weekEnd;
                    const span = endCol - startCol + 1;

                    eventRows[rowIndex].push({
                        trip,
                        startCol,
                        span,
                        isStart,
                        isEnd
                    });
                    placed = true;
                } else {
                    rowIndex++;
                }
            }
        });

        const overlappingGaps = typeof gapsThisMonth !== 'undefined' ? gapsThisMonth.filter(gap => {
            return gap.start <= weekEnd && gap.end >= weekStart;
        }) : [];

        overlappingGaps.forEach(gap => {
            let startCol = 0;
            if (gap.start > weekStart) {
                const diff = Math.floor((gap.start - weekStart) / (1000 * 60 * 60 * 24));
                startCol = week.findIndex(d => d === weekStartDay) + diff;
            } else {
                startCol = week.findIndex(d => d === weekStartDay);
            }

            let endCol = 6;
            if (gap.end < weekEnd) {
                const diff = Math.floor((weekEnd - gap.end) / (1000 * 60 * 60 * 24));
                endCol = week.findLastIndex(d => d === weekEndDay) - diff;
            } else {
                endCol = week.findLastIndex(d => d === weekEndDay);
            }

            if (startCol <= endCol) {
                let rowIndex = 0;
                let placed = false;
                while (!placed) {
                    if (!eventRows[rowIndex]) eventRows[rowIndex] = Array(7).fill(null);
                    let canPlace = true;
                    for (let i = startCol; i <= endCol; i++) {
                        if (eventRows[rowIndex][i] !== null) { canPlace = false; break; }
                    }
                    if (canPlace) {
                        for (let i = startCol; i <= endCol; i++) eventRows[rowIndex][i] = 'gap';
                        eventRows[rowIndex].push({
                            isGap: true,
                            text: `${gap.days} days until next trip`,
                            startCol,
                            span: endCol - startCol + 1
                        });
                        placed = true;
                    } else {
                        rowIndex++;
                    }
                }
            }
        });

        return {
            eventRows,
            rowCount: eventRows.length
        };
    };

    const isToday = (d) => {
        if (!d) return false;
        const today = new Date();
        return d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    };

    return (
        <div className="w-full">
            {/* Year Overview Strip */}
            <div className="hidden md:flex items-center justify-between mb-8 pb-4 border-b border-stone-200">
                {MONTHS.map((mName, mIdx) => {
                    const isCurrent = mIdx === month;
                    const monthTrips = trips.filter(t => normalizeDate(t.startDate)?.getMonth() === mIdx && normalizeDate(t.startDate)?.getFullYear() === year);
                    const hasConfirmed = monthTrips.some(t => t.status?.toUpperCase() === 'CONFIRMED' || t.status?.toUpperCase() === 'UPCOMING');
                    const hasDraft = monthTrips.some(t => t.status?.toUpperCase() === 'DRAFT');
                    
                    return (
                        <button 
                            key={mIdx}
                            onClick={() => {
                                setDirection(mIdx > month ? 1 : -1);
                                setCurrentDate(new Date(year, mIdx, 1));
                            }}
                            className={`flex flex-col items-center gap-1.5 px-3 py-1 outline-none focus:ring-2 focus:ring-[#FF6B2C]/50 rounded-lg group ${isCurrent ? '' : 'hover:bg-stone-50'}`}
                            aria-label={`Jump to ${mName} ${year}`}
                            tabIndex={0}
                        >
                            <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${isCurrent ? 'text-stone-900 border-b-2 border-[#FF6B2C] pb-0.5' : 'text-stone-400 group-hover:text-stone-600 pb-[4px]'}`}>
                                {mName.substring(0, 3)}
                            </span>
                            <div className="h-1.5 flex items-center justify-center">
                                {hasConfirmed ? (
                                    <div className="w-1.5 h-1.5 bg-[#FF6B2C] rounded-full" />
                                ) : hasDraft ? (
                                    <div className="w-1.5 h-1.5 border border-dashed border-[#FF6B2C] rounded-full" />
                                ) : null}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Header / Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="font-serif text-2xl text-stone-900 w-40">
                        {MONTHS[month]} {year}
                    </h2>
                    <div className="flex bg-white rounded-full border border-stone-200 shadow-sm p-1">
                        <button onClick={handlePrevMonth} className="p-1 hover:bg-stone-100 rounded-full transition-colors text-stone-600">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={handleNextMonth} className="p-1 hover:bg-stone-100 rounded-full transition-colors text-stone-600">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                    <button onClick={handleToday} className="px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-stone-900 border border-stone-200 hover:border-stone-300 rounded-full bg-white transition-all">
                        Today
                    </button>
                </div>
                
                {/* Legend */}
                <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest font-bold">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-[#FF6B2C] rounded-sm"></div><span className="text-stone-500">Confirmed</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-dashed border-[#FF6B2C]/50 bg-orange-50 rounded-sm"></div><span className="text-stone-500">Draft</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-stone-200 border border-stone-300/50 rounded-sm"></div><span className="text-stone-500">Past</span></div>
                </div>
            </div>

            {/* Desktop Grid View */}
            <div className="hidden md:block bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50/50">
                    {DAYS_OF_WEEK.map(d => (
                        <div key={d} className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-stone-400 text-center">
                            {d}
                        </div>
                    ))}
                </div>
                <div className="relative overflow-hidden">
                    <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                        <motion.div
                            key={`${year}-${month}`}
                            custom={direction}
                            initial={{ x: direction * 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -direction * 50, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="flex flex-col"
                        >
                            {weeks.map((week, wIdx) => {
                                const { eventRows, rowCount } = getWeekTrips(week);
                                const minHeightClass = Math.max(rowCount * 34 + 48, 120);
                                
                                return (
                                    <div key={wIdx} className="grid grid-cols-7 border-b border-stone-100 last:border-none relative" style={{ minHeight: `${minHeightClass}px` }}>
                                        {/* Background Cells */}
                                        {week.map((d, dIdx) => {
                                            const isTodayCell = isToday(d);
                                            return (
                                                <div key={dIdx} className={`border-r border-stone-100 last:border-none p-2 relative ${!d ? 'bg-stone-50/50' : (dIdx === 0 || dIdx === 6 ? 'bg-stone-900/[0.02]' : '')} ${isTodayCell ? 'bg-[#FF6B2C]/[0.03]' : ''}`}>
                                                    {d && (
                                                        <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mx-auto sm:mx-0 ${isTodayCell ? 'bg-[#FF6B2C] text-white shadow-md shadow-[#FF6B2C]/30 font-bold' : 'text-stone-600'}`}>
                                                            {d}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                        
                                        {/* Overlay Events */}
                                        {eventRows.map((row, rIdx) => {
                                            const events = row.filter(item => typeof item === 'object' && item !== null);
                                            return events.map((ev, evIdx) => (
                                                <div key={evIdx} className="absolute" style={{ left: `${(ev.startCol / 7) * 100}%`, width: `${(ev.span / 7) * 100}%` }}>
                                                    {ev.isGap ? (
                                                        <div className="absolute h-[28px] flex items-center justify-center text-[10px] uppercase tracking-widest text-stone-400 font-bold w-full" style={{ top: `${rIdx * 34 + 36}px` }}>
                                                            {ev.text}
                                                        </div>
                                                    ) : (
                                                        renderTripBar(ev.trip, ev.isStart, ev.isEnd, ev.span, rIdx)
                                                    )}
                                                </div>
                                            ));
                                        })}
                                    </div>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>

                    {/* Empty Month Overlay */}
                    {tripsThisMonth.length === 0 && (
                        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none">
                            <div className="bg-white/90 backdrop-blur-sm px-6 py-5 rounded-2xl shadow-sm border border-stone-200/50 flex flex-col items-center pointer-events-auto">
                                <CalendarIcon size={32} className="text-stone-300 mb-3" />
                                <p className="text-sm font-bold text-stone-600 mb-4">No trips this month</p>
                                <Link href="/destinations" className="text-xs font-bold bg-[#FF6B2C] text-white px-5 py-2.5 rounded-full shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all hover:bg-[#e85c21]">
                                    + Plan a Trip
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Agenda View */}
            <div className="md:hidden">
                <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                    <motion.div
                        key={`${year}-${month}-mobile`}
                        custom={direction}
                        initial={{ x: direction * 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -direction * 20, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="space-y-4"
                    >
                        {tripsThisMonth.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl border border-stone-200">
                                <CalendarIcon size={32} className="mx-auto text-stone-300 mb-3" />
                                <p className="text-sm font-medium text-stone-500">No trips planned for {MONTHS[month]}</p>
                            </div>
                        ) : (
                            tripsThisMonth
                                .sort((a, b) => normalizeDate(a.startDate) - normalizeDate(b.startDate))
                                .map(trip => {
                                    const tStart = new Date(trip.startDate);
                                    const tEnd = new Date(trip.endDate);
                                    const formatOpts = { month: 'short', day: 'numeric' };
                                    
                                    const statusUp = trip.status?.toUpperCase();
                                    const tripHref = statusUp === 'COMPLETED' 
                                        ? `/ai-planner/new?action=new&destination=${encodeURIComponent(trip.destinationName)}` 
                                        : `/ai-planner/new?action=view&trip_id=${trip.db_id}${statusUp === 'DRAFT' ? '&step=' + getNextStep(trip.lastCompletedStep) : ''}`;

                                    let barClass = "";
                                    let dotClass = "";
                                    if (statusUp === 'CONFIRMED' || statusUp === 'UPCOMING') {
                                        barClass = "bg-[#FF6B2C]/10 border border-[#FF6B2C]/30";
                                        dotClass = "bg-[#FF6B2C]";
                                    } else if (statusUp === 'DRAFT') {
                                        barClass = "border border-dashed border-[#FF6B2C]/40 bg-stone-50";
                                        dotClass = "bg-[#FF6B2C]/40";
                                    } else {
                                        barClass = "bg-stone-100 border border-stone-200";
                                        dotClass = "bg-stone-400";
                                    }

                                    return (
                                        <Link 
                                            href={tripHref} 
                                            key={trip.db_id} 
                                            className={`block p-4 rounded-2xl transition-all active:scale-[0.98] ${barClass}`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full mt-1.5 ${dotClass}`} />
                                                    <div>
                                                        <h4 className="font-bold text-stone-800">{trip.destinationName}</h4>
                                                        <p className="text-xs text-stone-500 font-mono mt-0.5">
                                                            {tStart.toLocaleDateString('en-US', formatOpts)} - {tEnd.toLocaleDateString('en-US', formatOpts)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-[9px] uppercase tracking-widest font-bold text-stone-400 mt-1">
                                                    {trip.status}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Popover */}
            <AnimatePresence>
                {selectedTripPopover && (
                    <motion.div
                        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        className="fixed z-50 bg-white rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.15)] overflow-hidden w-72 flex flex-col border border-stone-200/60"
                        style={{
                            top: Math.min(selectedTripPopover.rect.bottom + 10, typeof window !== 'undefined' ? window.innerHeight - 300 : 800),
                            left: Math.max(10, Math.min(selectedTripPopover.rect.left, typeof window !== 'undefined' ? window.innerWidth - 300 : 800))
                        }}
                        ref={popoverRef}
                    >
                        <div className="relative h-32 w-full bg-stone-100">
                            {selectedTripPopover.destInfo?.imageUrl ? (
                                <img src={selectedTripPopover.destInfo.imageUrl} alt={selectedTripPopover.trip.destinationName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-stone-200">
                                    <MapPin size={24} className="text-stone-400" />
                                </div>
                            )}
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                            
                            {/* Close button top right */}
                            <button 
                                onClick={() => setSelectedTripPopover(null)}
                                className="absolute top-3 right-3 p-1.5 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full transition-colors z-10"
                            >
                                <X size={14} />
                            </button>

                            {/* Title overlay */}
                            <div className="absolute bottom-3 left-4 right-4 text-white z-10">
                                <h4 className="font-serif font-bold text-xl leading-tight truncate drop-shadow-md">
                                    {selectedTripPopover.trip.destinationName.split(',')[0]}
                                </h4>
                                <div className="text-[10px] font-bold text-white/90 uppercase tracking-widest mt-0.5 drop-shadow-sm">
                                    {new Date(selectedTripPopover.trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(selectedTripPopover.trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-white flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 border shadow-sm ${
                                    selectedTripPopover.trip.status?.toUpperCase() === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    selectedTripPopover.trip.status?.toUpperCase() === 'DRAFT' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                    'bg-stone-50 text-stone-600 border-stone-200'
                                }`}>
                                    {selectedTripPopover.trip.status?.toUpperCase()}
                                </span>
                                <span className="text-[11px] font-bold text-stone-400 flex items-center gap-1">
                                    {Math.ceil((new Date(selectedTripPopover.trip.endDate) - new Date(selectedTripPopover.trip.startDate)) / (1000 * 60 * 60 * 24)) + 1} Days
                                </span>
                            </div>

                            <Link 
                                href={
                                    selectedTripPopover.trip.status?.toUpperCase() === 'COMPLETED'
                                    ? `/ai-planner/new?action=new&destination=${encodeURIComponent(selectedTripPopover.trip.destinationName)}`
                                    : `/ai-planner/new?action=view&trip_id=${selectedTripPopover.trip.db_id}${selectedTripPopover.trip.status?.toUpperCase() === 'DRAFT' ? '&step=' + getNextStep(selectedTripPopover.trip.lastCompletedStep) : ''}`
                                }
                                className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-[11px] font-bold uppercase tracking-[0.1em] transition-all hover:shadow-md flex items-center justify-center gap-2 mt-1"
                            >
                                View Itinerary
                                <ArrowRight size={14} />
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
