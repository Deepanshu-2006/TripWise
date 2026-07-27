import React, { useState } from 'react';
import { CloudRain, Users, Sun, Umbrella, ThermometerSun, Snowflake, AlertCircle, CalendarRange } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

// Static config for some common destinations, with a fallback
const SEASONAL_DATA = {
  'kyoto': {
    summary: 'April–May and October–November offer the best weather with stunning foliage; avoid July–August due to peak humidity and rain.',
    months: [
      { month: 'Jan', tier: 'Fair', temp: '5°C avg', rain: 'Low rainfall', crowd: 'Low crowds' },
      { month: 'Feb', tier: 'Fair', temp: '6°C avg', rain: 'Low rainfall', crowd: 'Low crowds' },
      { month: 'Mar', tier: 'Good', temp: '10°C avg', rain: 'Moderate rainfall', crowd: 'Moderate crowds' },
      { month: 'Apr', tier: 'Ideal', temp: '15°C avg', rain: 'Moderate rainfall', crowd: 'Very crowded' },
      { month: 'May', tier: 'Ideal', temp: '20°C avg', rain: 'Moderate rainfall', crowd: 'Moderate crowds' },
      { month: 'Jun', tier: 'Avoid', temp: '24°C avg', rain: 'High rainfall', crowd: 'Low crowds', reason: 'rain' },
      { month: 'Jul', tier: 'Avoid', temp: '28°C avg', rain: 'High rainfall', crowd: 'High crowds', reason: 'heat' },
      { month: 'Aug', tier: 'Avoid', temp: '29°C avg', rain: 'Moderate rainfall', crowd: 'High crowds', reason: 'heat' },
      { month: 'Sep', tier: 'Good', temp: '25°C avg', rain: 'High rainfall', crowd: 'Moderate crowds' },
      { month: 'Oct', tier: 'Ideal', temp: '19°C avg', rain: 'Moderate rainfall', crowd: 'High crowds' },
      { month: 'Nov', tier: 'Ideal', temp: '13°C avg', rain: 'Low rainfall', crowd: 'Very crowded' },
      { month: 'Dec', tier: 'Fair', temp: '8°C avg', rain: 'Low rainfall', crowd: 'Low crowds' },
    ]
  },
  'default': {
    summary: 'Spring and Autumn offer the best balance of pleasant weather and manageable crowds. Summer is peak season, so expect higher prices and busy attractions.',
    months: [
      { month: 'Jan', tier: 'Fair', temp: 'Cool', rain: 'Average', crowd: 'Low' },
      { month: 'Feb', tier: 'Fair', temp: 'Fair', rain: 'Average', crowd: 'Low' },
      { month: 'Mar', tier: 'Good', temp: 'Mild', rain: 'Average', crowd: 'Moderate' },
      { month: 'Apr', tier: 'Ideal', temp: 'Pleasant', rain: 'Low', crowd: 'Moderate' },
      { month: 'May', tier: 'Ideal', temp: 'Warm', rain: 'Low', crowd: 'Moderate' },
      { month: 'Jun', tier: 'Good', temp: 'Very Warm', rain: 'Average', crowd: 'High' },
      { month: 'Jul', tier: 'Avoid', temp: 'Hot', rain: 'Low', crowd: 'Peak', reason: 'crowds' },
      { month: 'Aug', tier: 'Avoid', temp: 'Hot', rain: 'Low', crowd: 'Peak', reason: 'crowds' },
      { month: 'Sep', tier: 'Ideal', temp: 'Warm', rain: 'Average', crowd: 'Moderate' },
      { month: 'Oct', tier: 'Ideal', temp: 'Pleasant', rain: 'Average', crowd: 'Moderate' },
      { month: 'Nov', tier: 'Good', temp: 'Cool', rain: 'Average', crowd: 'Low' },
      { month: 'Dec', tier: 'Fair', temp: 'Cold', rain: 'Average', crowd: 'High' },
    ]
  }
};

// Parse a YYYY-MM-DD string safely (avoids UTC offset issues)
function parseDateStr(str) {
  if (!str) return null;
  const parts = str.split('-');
  if (parts.length !== 3) return null;
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

// Format a date as "Mon D, YYYY"
function formatShort(date) {
  if (!date) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function SeasonalCalendar({ destinationName = '', startDate, endDate }) {
  const [hoveredMonth, setHoveredMonth] = useState(null);
  
  const currentMonthIndex = new Date().getMonth();

  // Normalize destination name
  const destKey = destinationName.toLowerCase().split(',')[0].trim();
  const data = SEASONAL_DATA[destKey] || SEASONAL_DATA['default'];

  // Parse trip date strings into Date objects
  const tripStart = parseDateStr(startDate);
  const tripEnd = parseDateStr(endDate);
  const hasTripDates = !!(tripStart && tripEnd);

  // Determine which month indices are covered by the trip
  const tripMonthIndices = new Set();
  if (hasTripDates) {
    const cur = new Date(tripStart.getFullYear(), tripStart.getMonth(), 1);
    const endMonth = new Date(tripEnd.getFullYear(), tripEnd.getMonth(), 1);
    while (cur <= endMonth) {
      tripMonthIndices.add(cur.getMonth());
      cur.setMonth(cur.getMonth() + 1);
    }
  }

  const getTierStyles = (tier) => {
    switch (tier) {
      case 'Ideal': return { bg: 'bg-[#FF6B2C]', border: 'border-[#FF6B2C]' };
      case 'Good':  return { bg: 'bg-[#FFB088]', border: 'border-[#FFB088]' };
      case 'Fair':  return { bg: 'bg-[#E6DFD5]', border: 'border-[#D4CFC9]' };
      case 'Avoid': return { bg: 'bg-stone-700',  border: 'border-stone-800' };
      default:      return { bg: 'bg-stone-200',  border: 'border-stone-300' };
    }
  };

  const getReasonIcon = (reason) => {
    if (reason === 'heat')   return <Sun       className="w-3.5 h-3.5 text-amber-300" />;
    if (reason === 'rain')   return <Umbrella  className="w-3.5 h-3.5 text-blue-300"  />;
    if (reason === 'crowds') return <Users     className="w-3.5 h-3.5 text-rose-300"  />;
    if (reason === 'cold')   return <Snowflake className="w-3.5 h-3.5 text-sky-200"   />;
    return <AlertCircle className="w-3.5 h-3.5 text-stone-400" />;
  };

  return (
    <div className="w-full bg-[#FAF6F0] rounded-3xl p-6 md:p-8 border border-[#E6DFD5] shadow-sm mb-12">
      {/* Header */}
      <div className="flex flex-col gap-1.5 mb-5">
        <span className="text-[11px] font-mono uppercase tracking-[0.15em] text-[#FF6B2C] font-bold">
          SEASONAL GUIDE
        </span>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-2xl font-serif font-black text-[#1E1C1A] tracking-tight">
            Best Time to Visit
          </h3>
          {/* Trip Date Badge */}
          {hasTripDates && (
            <div className="flex items-center gap-2 bg-[#1E1C1A] text-white rounded-full px-3 py-1.5 shadow-sm">
              <CalendarRange className="w-3.5 h-3.5 text-[#FF6B2C] shrink-0" />
              <span className="text-[11px] font-bold font-mono tracking-wide">
                {formatShort(tripStart)} – {formatShort(tripEnd)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* AI Insight */}
      <div className="mb-8 rounded-xl p-4 bg-[#FF6B2C]/[0.05] border border-[#FF6B2C]/15 flex items-start gap-3">
        <div className="shrink-0 w-6 h-6 rounded-full bg-white border border-[#FF6B2C]/20 flex items-center justify-center shadow-xs mt-0.5">
          <span className="text-[11px]">🌤️</span>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B2C] block mb-0.5">AI Insight</span>
          <p className="text-sm font-medium text-[#1E1C1A] leading-relaxed">{data.summary}</p>
        </div>
      </div>

      {/* Month Strip */}
      <div className="relative">
        <div className="flex gap-2 md:gap-3 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory custom-scrollbar -mx-2 px-2 md:mx-0 md:px-0">
          {data.months.map((m, idx) => {
            const styles = getTierStyles(m.tier);
            const isCurrent = idx === currentMonthIndex;
            const isTripMonth = tripMonthIndices.has(idx);

            return (
              <div
                key={m.month}
                className="relative flex flex-col items-center gap-2 shrink-0 snap-center w-14 md:w-auto md:flex-1"
                onMouseEnter={() => setHoveredMonth(idx)}
                onMouseLeave={() => setHoveredMonth(null)}
              >
                {/* Indicator above strip */}
                {isTripMonth ? (
                  <span className="text-[11px] mb-0.5 leading-none" title="Your trip">✈️</span>
                ) : (
                  <div className={`h-1.5 w-1.5 rounded-full mb-1 transition-opacity ${isCurrent ? 'bg-[#1E1C1A] opacity-100' : 'opacity-0'}`} />
                )}

                {/* Strip Segment */}
                <div
                  className={[
                    'w-full h-12 md:h-14 rounded-xl flex items-center justify-center transition-transform cursor-crosshair border',
                    styles.bg, styles.border,
                    isCurrent && !isTripMonth ? 'ring-2 ring-offset-2 ring-offset-[#FAF6F0] ring-[#1E1C1A]' : '',
                    isTripMonth ? 'ring-2 ring-offset-2 ring-offset-[#FAF6F0] ring-[#FF6B2C] scale-105 shadow-lg' : '',
                    'hover:scale-105 hover:shadow-md',
                  ].join(' ')}
                >
                  {m.tier === 'Avoid' && getReasonIcon(m.reason)}
                </div>

                {/* Month Label */}
                <span className={`text-[11px] font-mono font-bold mt-1 ${isTripMonth ? 'text-[#FF6B2C]' : isCurrent ? 'text-[#1E1C1A]' : 'text-[#7A7268]'}`}>
                  {m.month}
                </span>

                {/* Tooltip */}
                <AnimatePresence>
                  {hoveredMonth === idx && (
                    <div className="absolute bottom-[4.5rem] left-1/2 -translate-x-1/2 w-48 bg-[#1E1C1A] text-white p-3 rounded-xl shadow-xl z-50 pointer-events-none origin-bottom animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/10">
                        <span className="font-bold text-sm font-sans">{m.month}</span>
                        <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-md ${
                          m.tier === 'Ideal' ? 'bg-[#FF6B2C]/20 text-[#FF6B2C]' :
                          m.tier === 'Good'  ? 'bg-amber-500/20 text-amber-400'  :
                          m.tier === 'Avoid' ? 'bg-rose-500/20 text-rose-400'   :
                          'bg-white/10 text-stone-300'
                        }`}>
                          {m.tier}
                        </span>
                      </div>
                      {isTripMonth && (
                        <div className="mb-2 flex items-center gap-1.5 text-[#FF6B2C] text-[10px] font-bold uppercase tracking-wide">
                          <span>✈️</span> Your Trip
                        </div>
                      )}
                      <div className="space-y-1.5 text-xs text-stone-300 font-sans">
                        <div className="flex items-center gap-2">
                          <ThermometerSun className="w-3.5 h-3.5 text-stone-400" />
                          <span>{m.temp}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CloudRain className="w-3.5 h-3.5 text-stone-400" />
                          <span>{m.rain}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-stone-400" />
                          <span>{m.crowd}</span>
                        </div>
                      </div>
                      {/* Arrow */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1E1C1A] rotate-45 -mt-1.5" />
                    </div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-start gap-4 md:gap-6 mt-2 pt-5 border-t border-[#E6DFD5]/60">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#FF6B2C]" />
          <span className="text-xs text-[#7A7268] font-semibold font-sans">Ideal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#FFB088]" />
          <span className="text-xs text-[#7A7268] font-semibold font-sans">Good</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#E6DFD5]" />
          <span className="text-xs text-[#7A7268] font-semibold font-sans">Fair</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-stone-700 flex items-center justify-center">
            <AlertCircle className="w-2 h-2 text-stone-300" />
          </div>
          <span className="text-xs text-[#7A7268] font-semibold font-sans">Avoid/Peak</span>
        </div>
        {hasTripDates && (
          <div className="flex items-center gap-2">
            <span className="text-[11px]">✈️</span>
            <span className="text-xs text-[#FF6B2C] font-semibold font-sans">Your Trip</span>
          </div>
        )}
      </div>
    </div>
  );
}
