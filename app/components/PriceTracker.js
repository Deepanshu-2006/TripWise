'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Bell, Plane, Hotel, Building2, Bed, BedDouble, AlertCircle, TrendingDown, TrendingUp, Minus, Clock, MapPin, 
  Loader2, ArrowRight, CheckCircle2, Star, SlidersHorizontal, ExternalLink, Info, 
  Sparkles, Map, List, CheckSquare, Square, X, Layers, Scale, DollarSign, Compass,
  WifiOff, Power
} from 'lucide-react';
import { activateTracking, getTrackingState, clearUnreadDrops, searchFlights, searchHotels, saveTrackingSelection, saveTrackingState } from '../../lib/priceTrackingApi';
import { getUserDisplayCurrency, formatCurrency, convertCurrency } from '../../lib/expenseApi';
import { getBookingLinkInfo } from '../../lib/bookingPartners';
import { lookupAirports, getAirportDetails, GLOBAL_AIRPORTS } from '../../lib/iataCodes';


function useDisplayCurrency() {
  const [currency, setCurrency] = useState('USD');
  useEffect(() => {
    setCurrency(getUserDisplayCurrency());
  }, []);
  return currency;
}

// Price Distribution Histogram Component
function PriceDistributionBar({ items = [], type = 'flight', selectedId = null, isLoading = false }) {
  const displayCurrency = useDisplayCurrency();
  if (isLoading) {
    return (
      <div className="bg-white/60 border border-[#E6DFD5] rounded-2xl p-3.5 mb-5 animate-pulse">
        <div className="flex items-center justify-between mb-2">
          <div className="h-3.5 w-32 bg-[#E6DFD5]/70 rounded" />
          <div className="h-3.5 w-24 bg-[#E6DFD5]/70 rounded" />
        </div>
        <div className="h-7 bg-[#E6DFD5]/40 rounded-xl w-full" />
      </div>
    );
  }

  if (!items || items.length === 0) return null;

  const prices = items.map(i => i.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const range = (maxPrice - minPrice) || 1;

  // Create 10 distribution buckets
  const bucketCount = 10;
  const buckets = Array.from({ length: bucketCount }).map(() => ({ count: 0, items: [] }));
  
  items.forEach(item => {
    const pos = Math.min(bucketCount - 1, Math.floor(((item.price - minPrice) / range) * bucketCount));
    buckets[pos].count += 1;
    buckets[pos].items.push(item);
  });

  const maxCount = Math.max(...buckets.map(b => b.count), 1);

  return (
    <div className="bg-white/80 backdrop-blur-xs border border-[#E6DFD5] rounded-2xl p-4 mb-5 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs mb-3 gap-2 sm:gap-0">
        <span className="font-bold text-[#1E1C1A] flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-[#FF6B2C]" />
          <span>Price Distribution ({items.length} {type}s)</span>
        </span>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] font-medium text-[#7A7268]">
          <span className="bg-[#FAF6F0] px-1.5 py-0.5 rounded border border-[#E6DFD5]">Min: <strong className="text-[#1E1C1A]">{formatCurrency(convertCurrency(minPrice, 'USD', displayCurrency), displayCurrency)}</strong></span>
          <span className="bg-[#FAF6F0] px-1.5 py-0.5 rounded border border-[#E6DFD5]">Avg: <strong className="text-[#1E1C1A]">{formatCurrency(convertCurrency(avgPrice, 'USD', displayCurrency), displayCurrency)}</strong></span>
          <span className="bg-[#FAF6F0] px-1.5 py-0.5 rounded border border-[#E6DFD5]">Max: <strong className="text-[#1E1C1A]">{formatCurrency(convertCurrency(maxPrice, 'USD', displayCurrency), displayCurrency)}</strong></span>
        </div>
      </div>

      {/* Histogram Bars */}
      <div className="flex items-end gap-1 sm:gap-1.5 h-16 w-full px-1 pt-2">
        {buckets.map((bucket, bIdx) => {
          const heightPct = Math.max(8, Math.round((bucket.count / maxCount) * 100));
          const hasSelected = bucket.items.some(it => it.id === selectedId);
          const isMinBucket = bucket.items.some(it => it.price === minPrice);

          return (
            <div 
              key={bIdx} 
              className="flex-1 flex flex-col items-center group relative cursor-pointer h-full justify-end"
              title={`${bucket.count} option(s) in this range`}
            >
              <motion.div 
                initial={{ height: '0%', opacity: 0 }}
                animate={{ height: `${heightPct}%`, opacity: 1 }}
                transition={{ duration: 0.6, delay: bIdx * 0.04, type: "spring", stiffness: 200, damping: 20 }}
                className={`w-full rounded-t-md transition-colors duration-300 ${
                  hasSelected 
                    ? 'bg-gradient-to-t from-[#FF6B2C] to-[#ff8c5a] shadow-[0_0_12px_rgba(255,107,44,0.4)] border-t border-[#FF6B2C]' 
                    : isMinBucket 
                    ? 'bg-gradient-to-t from-emerald-500 to-emerald-400 hover:brightness-110 shadow-[0_0_8px_rgba(16,185,129,0.3)] border-t border-emerald-400' 
                    : 'bg-gradient-to-t from-[#E6DFD5] to-[#F0EAE1] hover:from-[#D5CBBF] hover:to-[#E6DFD5] border-t border-[#D5CBBF]'
                }`}
              />

              {/* Tooltip on hover */}
              <div className="absolute bottom-full mb-1.5 hidden group-hover:flex flex-col items-center z-10">
                <div className="bg-[#1E1C1A] text-white text-[10px] font-mono px-2.5 py-1 rounded-md shadow-lg whitespace-nowrap">
                  {bucket.count} option{bucket.count !== 1 ? 's' : ''}
                </div>
                <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-[#1E1C1A]" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-[#7A7268] font-mono mt-2 border-t border-[#E6DFD5]/50 pt-2">
        <span className="text-emerald-700 font-bold">Low: {formatCurrency(convertCurrency(minPrice, 'USD', displayCurrency), displayCurrency)}</span>
        <span className="hidden sm:inline">Spread: {formatCurrency(convertCurrency(maxPrice - minPrice, 'USD', displayCurrency), displayCurrency)}</span>
        <span>High: {formatCurrency(convertCurrency(maxPrice, 'USD', displayCurrency), displayCurrency)}</span>
      </div>
    </div>
  );
}

// Side-by-Side Comparison Modal Component
function ComparisonModal({ isOpen, onClose, items = [], type = 'flight', onSelect, destinationName, startDate, endDate, stayNights }) {
  const displayCurrency = useDisplayCurrency();
  if (!isOpen || items.length === 0 || typeof document === 'undefined') return null;

  const lowestPrice = Math.min(...items.map(i => i.price));
  const highestPrice = Math.max(...items.map(i => i.price));
  const priceDiff = highestPrice - lowestPrice;
  const bestValueItem = items.find(i => i.price === lowestPrice);

  return createPortal(
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-6 bg-black/75 backdrop-blur-md overflow-y-auto"
    >
      {/* Lightweight Ambient Radial Gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,107,44,0.18)_0%,transparent_60%)] pointer-events-none" />

      {/* Main Luxury Modal Card */}
      <motion.div 
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 450, damping: 28 }}
        className="bg-white rounded-3xl border border-[#E6DFD5] max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-[0_30px_90px_rgba(0,0,0,0.5)] p-6 md:p-8 my-auto relative z-10"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E6DFD5] pb-5 mb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1E1C1A] to-black text-white flex items-center justify-center shadow-md">
              <Scale className="w-5 h-5 text-[#FF6B2C]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-2xl font-black text-[#1E1C1A] tracking-tight">
                  Compare {type === 'flight' ? 'Flights' : 'Hotels'} Side-by-Side
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-[#FAF6F0] text-[#FF6B2C] border border-[#FF6B2C]/30 text-[10px] font-mono font-bold uppercase tracking-wide">
                  {items.length} Options
                </span>
              </div>
              <p className="text-xs text-[#7A7268] mt-0.5">
                Head-to-head rate breakdown and schedule comparison for {destinationName}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#FAF6F0] hover:bg-red-600 hover:text-white text-[#7A7268] flex items-center justify-center transition-colors duration-150 cursor-pointer shadow-2xs"
            title="Close comparison"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Smart Recommendation Banner with Live Intelligence Beacon - Fixed Single Line */}
        {items.length >= 2 && (
          <div className="bg-[#FAF6F0] rounded-2xl border border-[#E6DFD5] p-3.5 sm:p-4 mb-6 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Live Intelligence Indicator */}
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full border border-[#E6DFD5] shadow-2xs flex-shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1E1C1A]">AI Verdict</span>
              </div>

              <div className="text-xs text-[#4A443E] truncate">
                <span className="font-bold text-[#1E1C1A]">Smart Recommendation: </span>
                <span>
                  {type === 'flight' ? (
                    <>
                      <strong>{bestValueItem?.airline}</strong> offers the best rate at <strong>{formatCurrency(convertCurrency(lowestPrice, 'USD', displayCurrency), displayCurrency)}</strong>
                      {priceDiff > 0 && ` (saves you ${formatCurrency(convertCurrency(priceDiff, 'USD', displayCurrency), displayCurrency)})`}
                    </>
                  ) : (
                    <>
                      <strong>{bestValueItem?.name}</strong> provides the lowest total stay rate at <strong>{formatCurrency(convertCurrency(lowestPrice * (stayNights || 1), 'USD', displayCurrency), displayCurrency)}</strong>
                      {priceDiff > 0 && ` (saves ${formatCurrency(convertCurrency(priceDiff * (stayNights || 1), 'USD', displayCurrency), displayCurrency)})`}
                    </>
                  )}
                </span>
              </div>
            </div>

            {priceDiff > 0 && (
              <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300/80 text-[11px] font-sans font-bold shadow-2xs flex-shrink-0 whitespace-nowrap">
                Save up to ${formatCurrency(convertCurrency(type === "flight" ? priceDiff : priceDiff * (stayNights || 1), 'USD', displayCurrency), displayCurrency)}
              </span>
            )}
          </div>
        )}

        {/* Comparison Grid with Hardware-Accelerated 120 FPS Transitions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item, idx) => {
            const linkInfo = getBookingLinkInfo(destinationName, type, item, { startDate, endDate });
            const isLowest = item.price === lowestPrice;

            return (
              <div 
                key={item.id}
                className={`group/card rounded-2xl border p-4.5 sm:p-5 flex flex-col justify-between relative transition-all duration-150 ease-out hover:-translate-y-1.5 ${
                  isLowest 
                    ? 'bg-[#FFFDFB] border-[#FF6B2C]/50 ring-2 ring-[#FF6B2C]/15 shadow-[0_8px_25px_-5px_rgba(255,107,44,0.18)] hover:shadow-[0_15px_35px_-5px_rgba(255,107,44,0.25)]' 
                    : 'bg-[#FAF6F0]/80 border-[#E6DFD5] hover:border-[#FF6B2C]/40 hover:shadow-lg'
                }`}
              >
                <div>
                  {/* Option Badge & Clean Luxury Status Tags */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-sans font-bold uppercase tracking-wider bg-[#1E1C1A] text-white px-3 py-1 rounded-lg shadow-2xs">
                      Option {idx + 1}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      {isLowest && (
                        <span className="text-[10px] font-sans font-bold uppercase tracking-wider bg-[#FAF6F0] text-emerald-800 border border-emerald-300/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> BEST VALUE
                        </span>
                      )}
                      {type === 'flight' && item.stops === 0 && (
                        <span className="text-[10px] font-sans font-bold uppercase tracking-wider bg-[#FAF6F0] text-[#1E1C1A] border border-[#E6DFD5] px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2C]" /> NONSTOP
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Header Title with Airline or Hotel Logo */}
                  {type === 'flight' ? (
                    <div>
                      <div className="flex items-center gap-3 mb-3.5">
                        <img 
                          src={item.logo} 
                          alt={item.airline} 
                          className="w-10 h-10 object-contain rounded-xl bg-white border border-[#E6DFD5] p-1.5 shadow-2xs transition-transform duration-150 group-hover/card:scale-105" 
                        />
                        <div>
                          <h4 className="font-serif font-bold text-base text-[#1E1C1A] leading-tight">{item.airline}</h4>
                          <span className="text-xs font-mono font-medium text-[#7A7268]">{item.flightNumber}</span>
                        </div>
                      </div>

                      {/* Price Hero Card */}
                      <div className="bg-white rounded-2xl p-3.5 border border-[#E6DFD5] mb-3.5 shadow-2xs">
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="text-xs font-bold text-[#7A7268]">Total Airfare</span>
                          <span className="text-2xl sm:text-3xl font-serif font-black text-[#1E1C1A]">{formatCurrency(convertCurrency(item.price, 'USD', displayCurrency), displayCurrency)}</span>
                        </div>
                        <div className="text-[11px] text-[#A89F91]">{isLowest ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Lowest fare available on this route
                            </span>
                          ) : (
                            <span>+${formatCurrency(convertCurrency(item.price - lowestPrice, 'USD', displayCurrency), displayCurrency)} higher than Option {items.findIndex(i => i.price === lowestPrice) + 1}</span>
                          )}
                        </div>
                      </div>

                      {/* Animated Flight Path Corridor & Schedule */}
                      <div className="bg-white rounded-2xl p-3.5 border border-[#E6DFD5] mb-4 shadow-2xs relative overflow-hidden">
                        <div className="flex items-center justify-between text-xs">
                          {/* Departure Node */}
                          <div className="flex flex-col">
                            <span className="text-[10px] font-mono font-bold text-[#7A7268] uppercase tracking-wider mb-0.5">Departure</span>
                            <span className="text-sm font-bold text-[#1E1C1A]">{item.departureTime}</span>
                          </div>
                          
                          {/* Center Animated Flight Radar Trajectory with Diagonal Cruising Jet */}
                          <div className="flex-1 px-4 flex flex-col items-center">
                            {/* Refined Duration Pill */}
                            <div className="flex items-center gap-1.5 bg-[#FAF6F0] px-3 py-0.5 rounded-full border border-[#E6DFD5] text-xs font-sans font-bold text-[#1E1C1A] mb-1.5 shadow-2xs">
                              <Clock className="w-3 h-3 text-[#7A7268]" />
                              <span>{item.duration}</span>
                            </div>

                            {/* Flight Corridor Track with Full Start-to-End Flight Animation */}
                            <div className="w-full relative flex items-center my-1.5 h-7 overflow-hidden">
                              <div className="w-full h-px border-t-2 border-dashed border-[#FF6B2C]/40" />
                              <motion.div
                                initial={{ left: "2%", opacity: 0 }}
                                animate={{ 
                                  left: ["2%", "92%"],
                                  opacity: [0, 1, 1, 0.9, 0]
                                }}
                                transition={{ 
                                  duration: 3.6, 
                                  repeat: Infinity, 
                                  ease: "easeInOut",
                                  repeatDelay: 0.5
                                }}
                                className="absolute top-0 w-7 h-7 rounded-full bg-white border border-[#FF6B2C]/70 shadow-[0_2px_10px_rgba(255,107,44,0.3)] flex items-center justify-center text-[#FF6B2C] z-10 -ml-3.5"
                              >
                                <Plane className="w-3.5 h-3.5 fill-[#FF6B2C] text-[#FF6B2C]" />
                              </motion.div>
                            </div>

                            {/* Refined Stops Routing Badge */}
                            <div className="flex items-center gap-1.5 text-[11px] font-sans font-medium mt-1">
                              {item.stops === 0 ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  <span className="font-bold text-[#1E1C1A]">Direct Nonstop</span>
                                </>
                              ) : (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#A89F91]" />
                                  <span className="text-[#7A7268]">1 Stop via {item.via}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Arrival Node */}
                          <div className="flex flex-col text-right">
                            <span className="text-[10px] font-mono font-bold text-[#7A7268] uppercase tracking-wider mb-0.5">Arrival</span>
                            <span className="text-sm font-bold text-[#1E1C1A]">{item.arrivalTime}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="relative h-24 sm:h-28 rounded-xl overflow-hidden mb-3 border border-[#E6DFD5] shadow-2xs">
                        <Image src={item.image} alt={item.name} fill className="object-cover transition-transform duration-200 group-hover/card:scale-105" sizes="(max-width: 768px) 100vw, 25vw" />
                        <div className="absolute top-2 right-2 bg-black/75 backdrop-blur-xs text-white text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {item.rating}.0
                        </div>
                      </div>

                      <h4 className="font-serif font-bold text-base text-[#1E1C1A] mb-2.5 leading-tight truncate">{item.name}</h4>

                      {/* Hotel Price Hero */}
                      <div className="bg-white rounded-2xl p-3 border border-[#E6DFD5] mb-3 shadow-2xs">
                        <div className="flex items-baseline justify-between mb-0.5">
                          <span className="text-xs font-bold text-[#7A7268]">Nightly Rate</span>
                          <span className="text-2xl sm:text-3xl font-serif font-black text-[#1E1C1A]">{formatCurrency(convertCurrency(item.price, 'USD', displayCurrency), displayCurrency)}<span className="text-xs font-normal text-[#7A7268]">/night</span></span>
                        </div>
                        <div className="text-[11px] text-[#A89F91]">
                          Total stay: <strong className="text-[#1E1C1A]">{formatCurrency(convertCurrency(item.price * (stayNights || 1), 'USD', displayCurrency), displayCurrency)}</strong> ({stayNights || 1} nights)
                        </div>
                      </div>

                      {/* Hotel Details Breakdown */}
                      <div className="space-y-2 text-xs text-[#4A443E] bg-white rounded-2xl p-3 border border-[#E6DFD5] mb-3.5 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-[#E6DFD5]/50 pb-1.5">
                          <span className="text-[#7A7268] font-medium">Distance / Location:</span>
                          <span className="font-bold text-[#1E1C1A] truncate max-w-[140px]">{item.distance}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#7A7268] font-medium">Included Amenities:</span>
                          <span className="font-medium text-[#1E1C1A] truncate max-w-[140px]">{item.amenities?.slice(0, 2).join(', ')}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tactile Action Buttons with Luxury Hover Animations */}
                <div className="space-y-2 pt-2.5 border-t border-[#E6DFD5]">
                  {/* Primary Selection Button with Luxury Light Sweep & Halo Disc */}
                  <button 
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                    className="group/select-btn relative overflow-hidden w-full bg-gradient-to-r from-[#1E1C1A] via-[#2A2724] to-[#1E1C1A] text-white py-3 px-4.5 rounded-xl text-xs font-bold transition-all duration-300 ease-out shadow-md hover:shadow-xl hover:shadow-black/30 hover:border-[#FF6B2C]/60 active:scale-[0.98] flex items-center justify-between cursor-pointer border border-white/10"
                  >
                    {/* Ambient Light Beam Sweep on Hover */}
                    <div className="absolute inset-0 -translate-x-full group-hover/select-btn:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                    <div className="flex items-center gap-2 relative z-10 transition-transform duration-300 group-hover/select-btn:translate-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2C] group-hover/select-btn:bg-white group-hover/select-btn:scale-125 transition-all duration-300 shadow-[0_0_8px_rgba(255,107,44,0.9)]" />
                      <span className="font-bold tracking-tight text-white group-hover/select-btn:text-[#FAF6F0]">
                        Select Option {idx + 1} ({type === 'flight' ? item.airline : item.name})
                      </span>
                    </div>
                    
                    {/* Glowing Interactive Terracotta Disc */}
                    <div className="relative flex items-center justify-center z-10">
                      <div className="absolute inset-0 rounded-full bg-[#FF6B2C] opacity-0 group-hover/select-btn:opacity-75 blur-xs group-hover/select-btn:scale-130 transition-all duration-300 pointer-events-none" />
                      <div className="relative w-6.5 h-6.5 rounded-full bg-[#FF6B2C] group-hover/select-btn:bg-[#ff7d45] flex items-center justify-center text-white shadow-[0_2px_8px_rgba(255,107,44,0.4)] group-hover/select-btn:shadow-[0_0_14px_rgba(255,107,44,0.8)] transition-all duration-300 group-hover/select-btn:scale-110">
                        <ArrowRight className="w-3 h-3 transition-transform duration-300 ease-out group-hover/select-btn:translate-x-0.5" />
                      </div>
                    </div>
                  </button>

                  {/* Secondary Partner Booking Link with Luxury Hover Interaction */}
                  <a 
                    href={linkInfo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/book-btn relative w-full bg-white hover:bg-[#FAF6F0] active:scale-[0.98] border border-[#E6DFD5] hover:border-[#1E1C1A]/40 text-[#1E1C1A] py-2.5 px-4.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all duration-200 ease-out shadow-2xs hover:shadow-sm cursor-pointer"
                  >
                    <span className="transition-transform duration-200 group-hover/book-btn:translate-x-1">
                      Book on {type === 'flight' ? (item.airline || 'Partner') : 'Booking Partner'}
                    </span>
                    
                    {/* Elevated Interactive Glyph Disc */}
                    <div className="w-6.5 h-6.5 rounded-full bg-[#FAF6F0] group-hover/book-btn:bg-[#1E1C1A] flex items-center justify-center text-[#7A7268] group-hover/book-btn:text-white transition-all duration-200 group-hover/book-btn:scale-105 shadow-2xs">
                      <ExternalLink className="w-3 h-3 transition-transform duration-200 group-hover/book-btn:translate-x-0.5 group-hover/book-btn:-translate-y-0.5" />
                    </div>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

// Hotel Interactive Map View Component
function HotelMapView({ hotels = [], itinerary, selectedHotel, onSelectHotel, stayNights }) {
  const displayCurrency = useDisplayCurrency();
  const [activeMapHotel, setActiveMapHotel] = useState(hotels[0] || null);

  // Extract activity stops from itinerary
  const itineraryStops = itinerary?.days ? itinerary.days.flatMap((day, dIdx) => 
    (day.activities || []).map((act, aIdx) => ({
      id: `stop_${dIdx}_${aIdx}`,
      title: act.title || act.name || `Stop ${aIdx + 1}`,
      day: dIdx + 1,
      x: 20 + ((dIdx * 25 + aIdx * 18) % 65),
      y: 25 + ((dIdx * 30 + aIdx * 22) % 55)
    }))
  ).slice(0, 8) : [
    { id: 'st1', title: 'City Center Hub', day: 1, x: 50, y: 50 },
    { id: 'st2', title: 'Historic District', day: 1, x: 35, y: 40 },
    { id: 'st3', title: 'Main Square & Eats', day: 2, x: 65, y: 55 }
  ];

  return (
    <div className="bg-white rounded-3xl border border-[#E6DFD5] overflow-hidden shadow-sm mb-6">
      {/* Map Header */}
      <div className="p-4 bg-[#FAF6F0] border-b border-[#E6DFD5] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-[#FF6B2C]" />
          <span className="font-serif font-bold text-sm text-[#1E1C1A]">Destination Hotel & Itinerary Map</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-[#7A7268]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B2C]" /> Hotel Options
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1E1C1A]" /> Planned Stops ({itineraryStops.length})
          </span>
        </div>
      </div>

      {/* Interactive Map Box Canvas */}
      <div className="relative w-full h-[380px] bg-[#F5F0E8] overflow-hidden border-b border-[#E6DFD5] select-none">
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#1E1C1A_1px,transparent_1px)] [background-size:16px_16px]" />
        
        {/* Animated Connecting SVG Path */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <path 
            d={`M ${itineraryStops.map(s => `${s.x}%,${s.y}%`).join(' L ')}`} 
            fill="none" 
            stroke="#FF6B2C" 
            strokeWidth="1.5" 
            strokeDasharray="4,4" 
            opacity="0.5"
          />
        </svg>

        {/* Itinerary Stop Pins */}
        {itineraryStops.map((stop) => (
          <div 
            key={stop.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-10 group"
            style={{ left: `${stop.x}%`, top: `${stop.y}%` }}
          >
            <div className="w-6 h-6 rounded-full bg-[#1E1C1A] text-white text-[10px] font-bold flex items-center justify-center shadow-md border-2 border-white transition-transform group-hover:scale-110">
              📍
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex bg-[#1E1C1A] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-30">
              Day {stop.day}: {stop.title}
            </div>
          </div>
        ))}

        {/* Hotel Pins */}
        {hotels.map((hotel) => {
          const isSelected = selectedHotel?.id === hotel.id;
          const isActive = activeMapHotel?.id === hotel.id;
          const posX = hotel.mapPos?.x || 50;
          const posY = hotel.mapPos?.y || 50;

          return (
            <div 
              key={hotel.id}
              onClick={() => setActiveMapHotel(hotel)}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-all duration-200"
              style={{ left: `${posX}%`, top: `${posY}%` }}
            >
              <div 
                className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md transition-all ${
                  isSelected
                    ? 'bg-[#FF6B2C] text-white ring-4 ring-[#FF6B2C]/30 scale-110 z-30'
                    : isActive
                    ? 'bg-[#1E1C1A] text-white scale-105 z-20'
                    : 'bg-white text-[#1E1C1A] hover:bg-[#FFF9F5] border border-[#E6DFD5]'
                }`}
              >
                <span>🏨 ${hotel.price}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Map Hotel Preview Drawer */}
      {activeMapHotel && (
        <div className="p-4 bg-[#FAF6F0] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Image src={activeMapHotel.image} alt={activeMapHotel.name} width={64} height={64} className="rounded-xl object-cover border border-[#E6DFD5]" />
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="font-bold text-sm text-[#1E1C1A]">{activeMapHotel.name}</h4>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {activeMapHotel.rating}.0
                </span>
              </div>
              <p className="text-xs text-[#7A7268] font-medium flex items-center gap-2">
                <span>{activeMapHotel.distance}</span>
                <span>&middot;</span>
                <span className="text-emerald-700 font-bold">📍 Near {Math.max(4, Math.round(itineraryStops.length * 0.7))} of {itineraryStops.length} stops</span>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-[#E6DFD5] pt-3 md:pt-0">
            <div className="text-right">
              <span className="text-xl font-serif font-black text-[#1E1C1A]">{formatCurrency(convertCurrency(activeMapHotel.price, 'USD', displayCurrency), displayCurrency)}</span>
              <span className="text-[10px] text-[#7A7268] block">/night ({formatCurrency(convertCurrency(activeMapHotel.price * stayNights, 'USD', displayCurrency), displayCurrency)} total)</span>
            </div>
            
            {selectedHotel?.id === activeMapHotel.id ? (
              <button disabled className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Selected
              </button>
            ) : (
              <button 
                onClick={() => onSelectHotel(activeMapHotel)}
                className="bg-[#FF6B2C] hover:bg-[#e0591e] text-white px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Select Basecamp
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PriceTracker({ 
  tripId, 
  destinationName, 
  startDate, 
  endDate, 
  hotelMode: propHotelMode, 
  basecampHotel: propBasecampHotel, 
  onReoptimize, 
  onToast,
  onHotelSelect,
  itinerary 
}) {
  const displayCurrency = useDisplayCurrency();
  const [trackingState, setTrackingState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [isAnimatingStart, setIsAnimatingStart] = useState(false);
  const [isAnimatingStop, setIsAnimatingStop] = useState(false);
  const [config, setConfig] = useState({ trackFlights: true, trackHotels: true, origin: 'JFK' });
  const [airportSearchInput, setAirportSearchInput] = useState('JFK');
  const [isAirportDropdownOpen, setIsAirportDropdownOpen] = useState(false);
  const [airportActiveIndex, setAirportActiveIndex] = useState(-1);
  const [airportRegionFilter, setAirportRegionFilter] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (config.origin && airportSearchInput !== config.origin) {
      setAirportSearchInput(config.origin);
    }
  }, [config.origin]);

  const defaultSuggestedAirports = [
    { code: 'DEL', name: 'Indira Gandhi International', city: 'New Delhi', country: 'India' },
    { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj Int\'l', city: 'Mumbai', country: 'India' },
    { code: 'BLR', name: 'Kempegowda International', city: 'Bangalore', country: 'India' },
    { code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'United Kingdom' },
    { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'United States' },
    { code: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'UAE' },
    { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore' },
    { code: 'HND', name: 'Tokyo Haneda International', city: 'Tokyo', country: 'Japan' }
  ];

  const currentAirportMatches = useMemo(() => {
    const query = (airportSearchInput || '').trim();
    if (!query) {
      return defaultSuggestedAirports;
    }
    const matches = lookupAirports(query, 6, airportRegionFilter);
    if (matches.length === 0) {
      return defaultSuggestedAirports;
    }
    // If fewer than 4 matches, backfill with popular hubs so the dropdown always has rich suggestions
    const existing = new Set(matches.map(m => m.code));
    const list = [...matches];
    for (const d of defaultSuggestedAirports) {
      if (!existing.has(d.code) && list.length < 6) {
        list.push(d);
        existing.add(d.code);
      }
    }
    return list;
  }, [airportSearchInput, airportRegionFilter]);

  const renderHighlight = (text, query) => {
    if (!query || !query.trim() || typeof text !== 'string') return text;
    const q = query.trim();
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.substring(0, idx)}
        <span className="font-bold underline decoration-[#FF6B2C]/60 underline-offset-2">{text.substring(idx, idx + q.length)}</span>
        {text.substring(idx + q.length)}
      </>
    );
  };

  const handleAirportInputChange = (val) => {
    setAirportSearchInput(val);
    setIsAirportDropdownOpen(true);
    setAirportActiveIndex(-1);
    
    // Only auto-resolve if the user types an exact 3-letter valid IATA code
    const exact = getAirportDetails(val);
    if (exact && val.trim().length >= 3 && val.trim().toUpperCase() === exact.code) {
      setConfig(prev => ({ ...prev, origin: exact.code }));
    }
  };

  const handleSelectAirport = (airport) => {
    const code = typeof airport === 'string' ? airport.toUpperCase() : airport.code;
    const details = getAirportDetails(code);
    setConfig(prev => ({ ...prev, origin: code }));
    setAirportSearchInput(details ? `${details.city} (${details.code})` : code);
    setIsAirportDropdownOpen(false);
    setAirportActiveIndex(-1);
  };

  const handleAirportKeyDown = (e) => {
    if (!isAirportDropdownOpen) {
      if (e.key === 'ArrowDown') {
        setIsAirportDropdownOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAirportActiveIndex(prev => (prev + 1) % (currentAirportMatches.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAirportActiveIndex(prev => (prev - 1 + currentAirportMatches.length) % (currentAirportMatches.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (airportActiveIndex >= 0 && currentAirportMatches[airportActiveIndex]) {
        handleSelectAirport(currentAirportMatches[airportActiveIndex]);
      } else if (airportSearchInput.trim().length >= 2) {
        const resolved = getAirportDetails(airportSearchInput) || { code: airportSearchInput.trim().toUpperCase() };
        handleSelectAirport(resolved);
      }
    } else if (e.key === 'Escape') {
      setIsAirportDropdownOpen(false);
      setAirportActiveIndex(-1);
    }
  };

  // Search Results & Selection State
  const [flights, setFlights] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [redirectingType, setRedirectingType] = useState(null); // 'flight' | 'hotel' | null
  const [isReoptimizing, setIsReoptimizing] = useState(false);

  // Sorting & Filtering State
  const [flightSort, setFlightSort] = useState('price'); // price, duration, best
  const [flightStops, setFlightStops] = useState('any'); // any, nonstop, 1stop
  const [hotelSort, setHotelSort] = useState('price'); // price, rating, best
  const [hotelRating, setHotelRating] = useState('any'); // any, 4, 5

  // Shortlist & Comparison State
  const [flightShortlist, setFlightShortlist] = useState([]);
  const [hotelShortlist, setHotelShortlist] = useState([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(null); // 'flight' | 'hotel' | null

  // Hotel View Mode (List vs Map)
  const [hotelViewMode, setHotelViewMode] = useState('list'); // 'list' | 'map'
  const [isOffline, setIsOffline] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };

    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
      window.addEventListener('online', handleOnlineStatus);
      window.addEventListener('offline', handleOnlineStatus);
      return () => {
        window.removeEventListener('online', handleOnlineStatus);
        window.removeEventListener('offline', handleOnlineStatus);
      };
    }
  }, []);

  useEffect(() => {
    const state = getTrackingState(tripId);
    if (state) {
      const normalizedState = {
        ...state,
        config: {
          trackFlights: true,
          trackHotels: true,
          origin: 'JFK',
          ...(state.config || {})
        }
      };
      setTrackingState(normalizedState);
      if (state.unreadDrops) {
        clearUnreadDrops(tripId);
      }
    }
    setIsLoading(false);
  }, [tripId]);

  useEffect(() => {
    if (trackingState) {
      const fetchResults = async () => {
        setIsLoadingResults(true);
        const trackFlights = trackingState.config?.trackFlights ?? true;
        const trackHotels = trackingState.config?.trackHotels ?? true;
        const origin = trackingState.config?.origin || 'JFK';

        if (trackFlights && flights.length === 0) {
          const res = await searchFlights(destinationName, origin, { startDate, endDate });
          setFlights(res);
        }
        if (trackHotels && hotels.length === 0) {
          const res = await searchHotels(destinationName, { startDate, endDate });
          setHotels(res);
        }
        setIsLoadingResults(false);
      };
      fetchResults();
    }
  }, [trackingState, destinationName, startDate, endDate]);

  const handleStartTracking = async () => {
    if (!config.trackFlights && !config.trackHotels) return;
    
    setIsAnimatingStart(true);
    await new Promise(resolve => setTimeout(resolve, 650));
    
    setIsActivating(true);
    setIsAnimatingStart(false);
    setError(null);
    try {
      const state = await activateTracking(tripId, destinationName, {
        startDate,
        ...config
      });
      setTrackingState(state);
    } catch (err) {
      setError(err.message || 'Failed to activate tracking.');
    } finally {
      setIsActivating(false);
    }
  };

  const handleStopTracking = async () => {
    setIsAnimatingStop(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsAnimatingStop(false);

    if (typeof window !== 'undefined') {
      localStorage.removeItem(`tw_price_tracking_${tripId}`);
    }
    setTrackingState(null);
    setFlights([]);
    setHotels([]);
  };

  const handleSelectFlight = (flight) => {
    saveTrackingSelection(tripId, 'flight', flight);
    setTrackingState(getTrackingState(tripId));
    if (onToast) onToast(`Selected flight: ${flight.airline} (${formatCurrency(convertCurrency(flight.price, 'USD', displayCurrency), displayCurrency)})`, 'success');
  };

  const handleSelectHotel = (hotel) => {
    saveTrackingSelection(tripId, 'hotel', hotel);
    const state = getTrackingState(tripId);
    if (state) {
      state.hotelMode = 'basecamp';
      state.basecampHotel = hotel.name;
      saveTrackingState(tripId, state);
    }
    setTrackingState(getTrackingState(tripId));

    if (onHotelSelect) onHotelSelect(hotel);

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('tripwise_itinerary');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.hotelMode = 'basecamp';
          parsed.basecampHotel = hotel.name;
          localStorage.setItem('tripwise_itinerary', JSON.stringify(parsed));
        }
      } catch (e) {}
    }
    if (onToast) onToast(`Basecamp hotel set to ${hotel.name}`, 'success');
  };

  const handleClearSelection = (type) => {
    if (type === 'hotel') {
      const updatedState = {
        ...trackingState,
        selectedHotel: null,
        hotelMode: 'undecided',
        basecampHotel: null,
        basecampHotelDetails: null
      };
      setTrackingState(updatedState);
      saveTrackingState(tripId, updatedState);
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('tripwise_itinerary');
          if (raw) {
            const itin = JSON.parse(raw);
            itin.hotelMode = 'undecided';
            itin.basecampHotel = null;
            itin.basecampHotelDetails = null;
            localStorage.setItem('tripwise_itinerary', JSON.stringify(itin));
          }
        } catch (e) {}
      }
      if (onToast) onToast('Hotel selection reset. Browse options below to pick a new stay.', 'info');
    } else {
      saveTrackingSelection(tripId, type, null);
      setTrackingState(getTrackingState(tripId));
    }
  };

  const handleRedirect = (type, linkInfo) => {
    setRedirectingType(type);
    setTimeout(() => {
      setRedirectingType(null);
      if (typeof window !== 'undefined' && linkInfo?.url) {
        window.open(linkInfo.url, '_blank', 'noopener,noreferrer');
      }
    }, 650);
  };

  const toggleFlightShortlist = (flightId) => {
    setFlightShortlist(prev => {
      if (prev.includes(flightId)) return prev.filter(id => id !== flightId);
      if (prev.length >= 3) {
        if (onToast) onToast('You can compare up to 3 flights at a time', 'info');
        return prev;
      }
      return [...prev, flightId];
    });
  };

  const toggleHotelShortlist = (hotelId) => {
    setHotelShortlist(prev => {
      if (prev.includes(hotelId)) return prev.filter(id => id !== hotelId);
      if (prev.length >= 3) {
        if (onToast) onToast('You can compare up to 3 hotels at a time', 'info');
        return prev;
      }
      return [...prev, hotelId];
    });
  };

  if (!destinationName) return null;

  if (isOffline) {
    return (
      <div className="bg-white/80 rounded-3xl border border-[#E6DFD5] p-8 text-center max-w-xl mx-auto shadow-sm my-6 font-sans">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center mx-auto text-amber-600 mb-4">
          <WifiOff className="w-7 h-7" />
        </div>
        <h3 className="font-serif text-xl font-bold text-[#1E1C1A] mb-2">
          Requires Internet Connection
        </h3>
        <p className="text-xs text-[#7A7268] max-w-md mx-auto leading-relaxed mb-6">
          Price tracking requires an active internet connection to query live flight deals and hotel rates across global booking engines.
        </p>

        {trackingState ? (
          <div className="bg-[#FAF6F0] rounded-2xl p-4 border border-[#E6DFD5] text-left text-xs space-y-2">
            <p className="font-bold text-[#1E1C1A] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Cached Tracking Session Available</span>
            </p>
            <p className="text-gray-600 leading-normal">
              Tracking configured for <strong>{destinationName}</strong> (Origin: {trackingState.config?.origin || 'JFK'}). Live price monitoring will resume automatically when you reconnect.
            </p>
          </div>
        ) : (
          <div className="bg-[#FAF6F0] rounded-2xl p-3.5 border border-[#E6DFD5] text-center text-xs text-gray-500">
            Reconnect to an active network to activate price tracking for {destinationName}.
          </div>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center p-12 text-[#7A7268]">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  // Calculate Stay Nights for Hotel Total
  const getStayNights = () => {
    if (!startDate || !endDate) return 4;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diffTime = Math.abs(e - s);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 4;
  };
  const stayNights = getStayNights();

  // Budget calculations
  const getEstBudget = () => {
    if (itinerary?.budgetAmount) return itinerary.budgetAmount;
    const pref = itinerary?.budget || 'standard';
    if (pref === 'budget') return 950;
    if (pref === 'luxury') return 3200;
    return 1450;
  };
  const estBudget = getEstBudget();

  const selectedFlightPrice = trackingState?.selectedFlight?.price || 0;
  const selectedHotelPrice = trackingState?.selectedHotel?.price ? trackingState.selectedHotel.price * stayNights : 0;
  const totalSelectedPrice = selectedFlightPrice + selectedHotelPrice;
  const remainingBudget = estBudget - totalSelectedPrice;

  // Active Tracking View
  if (trackingState) {
    const destShort = destinationName.split(',')[0];

    // Flight metrics for badges
    const minFlightPrice = flights.length > 0 ? Math.min(...flights.map(f => f.price)) : 0;
    const minFlightDuration = flights.length > 0 ? Math.min(...flights.map(f => f.durationMinutes || 999)) : 0;
    const bestValueFlightId = flights.length > 0 ? flights.reduce((best, f) => {
      if (!best) return f.id;
      const currentBest = flights.find(x => x.id === best);
      const fScore = f.price + (f.stops * 100) + ((f.durationMinutes || 0) * 0.4);
      const bestScore = currentBest.price + (currentBest.stops * 100) + ((currentBest.durationMinutes || 0) * 0.4);
      return fScore < bestScore ? f.id : best;
    }, null) : null;

    // Hotel metrics for badges
    const minHotelPrice = hotels.length > 0 ? Math.min(...hotels.map(h => h.price)) : 0;
    const bestValueHotelId = hotels.length > 0 ? hotels.reduce((best, h) => {
      if (!best) return h.id;
      const currentBest = hotels.find(x => x.id === best);
      const hScore = h.price / (h.rating * h.rating);
      const bestScore = currentBest.price / (currentBest.rating * currentBest.rating);
      return hScore < bestScore ? h.id : best;
    }, null) : null;

    const sortedFlights = [...flights]
      .filter(f => flightStops === 'any' ? true : flightStops === 'nonstop' ? f.stops === 0 : f.stops === 1)
      .sort((a, b) => {
        if (flightSort === 'price') return a.price - b.price;
        if (flightSort === 'duration') return (a.durationMinutes || 0) - (b.durationMinutes || 0);
        if (flightSort === 'best') return (a.id === bestValueFlightId ? -1 : 1);
        return 0;
      });

    const sortedHotels = [...hotels]
      .filter(h => hotelRating === 'any' ? true : h.rating >= parseInt(hotelRating))
      .sort((a, b) => {
        if (hotelSort === 'price') return a.price - b.price;
        if (hotelSort === 'rating') return b.rating - a.rating;
        if (hotelSort === 'best') return (a.id === bestValueHotelId ? -1 : 1);
        return 0;
      });

    const totalItineraryStops = itinerary?.days 
      ? itinerary.days.reduce((acc, d) => acc + (d.activities?.length || 0), 0) 
      : 9;

    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 relative pb-16">
        {/* Requirement 2 & 3: PERSISTENT STICKY TRIP CONTEXT & LIVE BUDGET HEADER */}
        <div className="relative sm:sticky sm:top-20 z-30 bg-white/95 backdrop-blur-md border border-[#E6DFD5] rounded-2xl p-4 shadow-sm transition-all mb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-black text-lg text-[#1E1C1A]">{destShort} Trip</span>
                <span className="text-xs font-mono bg-[#FAF6F0] border border-[#E6DFD5] px-2 py-0.5 rounded text-[#7A7268]">
                  {startDate && endDate ? `${startDate} – ${endDate}` : 'Sep 4–6, 2026'}
                </span>
              </div>
              <p className="text-xs text-[#7A7268] mt-0.5">
                Tracking <strong className="text-[#1E1C1A]">{trackingState?.config?.origin || 'JFK'} → {destShort}</strong> &middot; Target Est. Budget: <strong className="text-[#1E1C1A]">{formatCurrency(convertCurrency(estBudget, 'USD', displayCurrency), displayCurrency)}</strong>
              </p>
            </div>

            {/* Live Budget Impact Tally & Instant Compare Trigger in Sticky Header */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-4 bg-[#FAF6F0] px-4 py-2 rounded-xl border border-[#E6DFD5] justify-between md:justify-end">
                <div className="text-right">
                  <div className="text-xs text-[#7A7268] font-bold">Selected so far</div>
                  <div className="text-base font-serif font-black text-[#1E1C1A]">
                    {formatCurrency(convertCurrency(totalSelectedPrice, 'USD', displayCurrency), displayCurrency)} <span className="text-xs font-normal text-[#7A7268]">of {formatCurrency(convertCurrency(parseFloat(estBudget.toString().replace(/[^0-9.]/g, '')) || 1450, 'USD', displayCurrency), displayCurrency)}</span>
                  </div>
                </div>

                <div className="h-8 w-px bg-[#E6DFD5]" />

                <div className="text-right">
                  <div className="text-xs font-bold text-[#7A7268]">Remaining</div>
                  <div className={`text-sm font-bold ${remainingBudget >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {remainingBudget >= 0 ? `${formatCurrency(convertCurrency(remainingBudget, 'USD', displayCurrency), displayCurrency)} left` : `${formatCurrency(convertCurrency(Math.abs(remainingBudget), 'USD', displayCurrency), displayCurrency)} over`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-serif font-black text-[#1E1C1A] tracking-tight">Active Price Tracking</h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                LIVE 24/7
              </span>
            </div>
            <p className="text-sm font-sans text-[#7A7268] mt-0.5">
              Live updates & smart booking comparison tools
            </p>
          </div>
          
          {/* Animated Luxury Frosted Stop Radar Capsule */}
          <motion.button 
            type="button"
            whileHover={{ scale: 1.04, y: -1.5 }}
            whileTap={{ scale: 0.96, y: 1 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            onClick={handleStopTracking}
            data-clicked={isAnimatingStop}
            className="group/stop relative px-4 py-3 sm:py-2 rounded-full sm:rounded-full bg-white/95 hover:bg-white active:bg-white data-[clicked=true]:bg-white text-[#5F5E5A] hover:text-red-600 active:text-red-600 data-[clicked=true]:text-red-600 border border-[#E6DFD5] hover:border-red-200/90 active:border-red-200/90 data-[clicked=true]:border-red-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] hover:shadow-[0_8px_24px_-4px_rgba(239,68,68,0.22)] active:shadow-[0_8px_24px_-4px_rgba(239,68,68,0.22)] data-[clicked=true]:shadow-[0_8px_24px_-4px_rgba(239,68,68,0.22)] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2.5 font-sans text-sm sm:text-xs font-bold overflow-hidden w-full sm:w-auto mt-2 sm:mt-0"
          >
            {/* Soft ambient red wash on hover/tap */}
            <div className="absolute inset-0 bg-red-500/[0.05] opacity-0 group-hover/stop:opacity-100 group-active/stop:opacity-100 group-data-[clicked=true]/stop:opacity-100 transition-opacity duration-200" />
            
            {/* Sliding light sheen reflection on hover/tap */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/stop:translate-x-full group-active/stop:translate-x-full group-data-[clicked=true]/stop:translate-x-full transition-transform duration-600 ease-out" />

            {/* Live radar beacon core that transitions to pulsing red on hover/tap */}
            <div className="relative flex h-3 w-3 sm:h-2.5 sm:w-2.5 items-center justify-center shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-0 group-hover/stop:opacity-85 group-active/stop:opacity-85 group-data-[clicked=true]/stop:opacity-85 transition-opacity duration-200" />
              <span className="relative inline-flex rounded-full h-2 w-2 sm:h-1.5 sm:w-1.5 bg-[#8C827A] group-hover/stop:bg-red-500 group-active/stop:bg-red-500 group-data-[clicked=true]/stop:bg-red-500 group-hover/stop:shadow-[0_0_8px_#ef4444] group-active/stop:shadow-[0_0_8px_#ef4444] group-data-[clicked=true]/stop:shadow-[0_0_8px_#ef4444] transition-all duration-200" />
            </div>

            <span className="relative z-10 tracking-tight transition-colors">Stop Tracking</span>

            {/* Smooth rotating power/stop glyph on hover/tap */}
            <motion.div 
              className="relative z-10 text-[#A89F91] group-hover/stop:text-red-500 group-active/stop:text-red-500 group-data-[clicked=true]/stop:text-red-500 transition-colors duration-200 pl-0.5 shrink-0"
            >
              <Power className="w-4 h-4 sm:w-3.5 sm:h-3.5 group-hover/stop:rotate-90 group-active/stop:rotate-90 group-data-[clicked=true]/stop:rotate-90 group-hover/stop:scale-110 group-active/stop:scale-110 group-data-[clicked=true]/stop:scale-110 transition-all duration-300 ease-out" />
            </motion.div>
          </motion.button>
        </div>

        <div className="space-y-6">
          {/* FLIGHTS SECTION */}
          {(trackingState?.config?.trackFlights ?? true) && (
            <div className="bg-[#FAF6F0] rounded-2xl sm:rounded-3xl border border-[#E6DFD5] p-3.5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Plane className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF6B2C]" />
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-[#1E1C1A]">Flights</h3>
                </div>

                <div className="flex items-center gap-2">
                  {trackingState.selectedFlight && (
                    <button onClick={() => handleClearSelection('flight')} className="text-xs font-semibold text-[#7A7268] hover:text-[#1E1C1A] underline cursor-pointer">
                      Change Selection
                    </button>
                  )}
                </div>
              </div>

              {trackingState.selectedFlight ? (() => {
                const flight = trackingState.selectedFlight;
                const flightLinkInfo = getBookingLinkInfo(destinationName, 'flight', flight, {
                  origin: trackingState.config?.origin,
                  startDate
                });

                return (
                  <div className="bg-white rounded-2xl border-2 border-[#FF6B2C] p-4 sm:p-5 shadow-sm space-y-3">
                    {/* Top Badge & Flight Details */}
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="bg-[#FF6B2C] text-white text-[9.5px] uppercase font-black px-2 py-0.5 rounded">Selected Flight</span>
                        <span className="text-sm font-bold text-[#1E1C1A]">{flight.airline}</span>
                        <span className="text-[10.5px] font-mono text-[#7A7268] bg-[#F5F0E8] px-1.5 py-0.5 rounded">{flight.flightNumber}</span>
                      </div>
                      <div className="text-xs font-medium text-[#7A7268] flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="font-semibold text-[#1E1C1A]">{flight.departureTime} – {flight.arrivalTime}</span>
                        <span>&middot;</span>
                        <span>{flight.duration}</span>
                        <span>&middot;</span>
                        <span className={flight.stops === 0 ? 'text-emerald-700 font-bold' : 'text-[#4A443E]'}>
                          {flight.stops === 0 ? 'Nonstop' : `1 Stop ${flight.via ? `via ${flight.via}` : ''}`}
                        </span>
                      </div>
                    </div>

                    {/* Price & Action Row */}
                    <div className="pt-3 border-t border-[#E6DFD5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xl sm:text-2xl font-serif font-black text-[#1E1C1A]">
                          {formatCurrency(convertCurrency(flight.price, 'USD', displayCurrency), displayCurrency)}
                        </div>
                        <div className="text-[10px] text-[#7A7268] uppercase font-bold tracking-wider">Round Trip Total</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleClearSelection('flight')}
                          className="px-3 py-2.5 rounded-xl border border-[#E6DFD5] text-xs font-bold text-[#7A7268] hover:text-[#1E1C1A] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
                        >
                          Change
                        </button>

                        <button 
                          onClick={() => handleRedirect('flight', flightLinkInfo)}
                          disabled={redirectingType === 'flight'}
                          className="flex-1 sm:flex-initial bg-[#1E1C1A] hover:bg-[#FF6B2C] text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer whitespace-nowrap"
                        >
                          {redirectingType === 'flight' ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                              <span>Refreshing...</span>
                            </>
                          ) : (
                            <>
                              <ExternalLink className="w-3.5 h-3.5 text-[#FF6B2C]" />
                              <span>Book on Skyscanner</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {flightLinkInfo.disclosureNote && (
                      <div className="text-[10.5px] text-[#7A7268] font-medium flex items-center gap-1 pt-1">
                        <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>{flightLinkInfo.disclosureNote}</span>
                      </div>
                    )}
                  </div>
                );
              })() : (
                <>
                  {/* Segmented Controls for Flights */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 sm:mb-5 p-2 sm:p-2.5 bg-white/90 backdrop-blur-md rounded-2xl border border-[#E6DFD5] shadow-xs">
                    {/* Sort Segment Pill Track */}
                    <div className="flex items-center gap-1.5 w-full">
                      <span className="text-[10px] font-mono font-bold text-[#8C827A] uppercase tracking-wider pl-1 shrink-0">Sort:</span>
                      <div className="flex-1 grid grid-cols-3 bg-[#F0EAE1]/90 p-0.5 rounded-full border border-[#E6DFD5]">
                        {[
                          { id: 'price', label: 'Cheapest' },
                          { id: 'duration', label: 'Fastest' },
                          { id: 'best', label: 'Best Value' }
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setFlightSort(tab.id)}
                            className="relative py-1.5 rounded-full text-[10.5px] sm:text-xs font-sans font-bold transition-all cursor-pointer whitespace-nowrap text-center"
                          >
                            {flightSort === tab.id && (
                              <motion.div
                                layoutId="flightSortPill"
                                transition={{ type: "spring", stiffness: 500, damping: 32 }}
                                className="absolute inset-0 bg-[#1E1C1A] rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
                              />
                            )}
                            <span className={`relative z-10 transition-colors duration-200 ${
                              flightSort === tab.id ? 'text-white' : 'text-[#6B645C] hover:text-[#1E1C1A]'
                            }`}>
                              {tab.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Stops Segment Pill Track */}
                    <div className="flex items-center gap-1.5 w-full">
                      <span className="text-[10px] font-mono font-bold text-[#8C827A] uppercase tracking-wider pl-1 shrink-0">Stops:</span>
                      <div className="flex-1 grid grid-cols-3 bg-[#F0EAE1]/90 p-0.5 rounded-full border border-[#E6DFD5]">
                        {[
                          { id: 'any', label: 'All' },
                          { id: 'nonstop', label: 'Nonstop' },
                          { id: '1stop', label: '1 Stop' }
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setFlightStops(tab.id)}
                            className="relative py-1.5 rounded-full text-[10.5px] sm:text-xs font-sans font-bold transition-all cursor-pointer whitespace-nowrap text-center"
                          >
                            {flightStops === tab.id && (
                              <motion.div
                                layoutId="flightStopsPill"
                                transition={{ type: "spring", stiffness: 500, damping: 32 }}
                                className="absolute inset-0 bg-[#FF6B2C] rounded-full shadow-[0_2px_10px_rgba(255,107,44,0.35)]"
                              />
                            )}
                            <span className={`relative z-10 transition-colors duration-200 ${
                              flightStops === tab.id ? 'text-white' : 'text-[#6B645C] hover:text-[#1E1C1A]'
                            }`}>
                              {tab.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Requirement 1: Price Distribution Bar */}
                  <PriceDistributionBar 
                    items={sortedFlights} 
                    type="flight" 
                    selectedId={trackingState.selectedFlight?.id} 
                    isLoading={isLoadingResults} 
                  />

                  {isLoadingResults ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white/80 animate-pulse rounded-2xl border border-[#E6DFD5] p-5 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-10 h-10 bg-[#E6DFD5]/60 rounded-xl" />
                            <div className="space-y-2 flex-1">
                              <div className="h-4 w-1/3 bg-[#E6DFD5]/60 rounded-md" />
                              <div className="h-3 w-1/2 bg-[#E6DFD5]/40 rounded-md" />
                            </div>
                          </div>
                          <div className="w-24 h-10 bg-[#E6DFD5]/60 rounded-xl" />
                        </div>
                      ))}
                    </div>
                  ) : flights.length > 0 ? (
                    <div className="space-y-3">
                      {sortedFlights.slice(0, 6).map((flight, index) => {
                        const isSelected = trackingState.selectedFlight?.id === flight.id;
                        const isBestValue = flight.id === bestValueFlightId;
                        const isCheapest = flight.price === minFlightPrice;
                        const isFastest = flight.durationMinutes === minFlightDuration;
                        const isShortlisted = flightShortlist.includes(flight.id);

                        return (
                          <motion.div 
                            key={flight.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: index * 0.03 }}
                            className={`relative rounded-2xl p-4 sm:p-5 transition-all duration-200 ${
                              isSelected
                                ? 'bg-[#FFF9F5] border-2 border-[#FF6B2C] shadow-md ring-2 ring-[#FF6B2C]/20'
                                : isBestValue
                                ? 'bg-[#FFFBF7] border-2 border-[#FF6B2C]/70 shadow-sm hover:-translate-y-0.5 hover:shadow-md'
                                : 'bg-white border border-[#E6DFD5] hover:border-[#FF6B2C]/40 hover:-translate-y-0.5 hover:shadow-md'
                            }`}
                          >
                            {/* Top Badges & Compare Row */}
                            <div className="flex items-center justify-between gap-2 mb-2.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {isBestValue && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider bg-[#FF6B2C] text-white shadow-2xs">
                                    ★ Best Value
                                  </span>
                                )}
                                {isCheapest && !isBestValue && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    Cheapest
                                  </span>
                                )}
                                {isFastest && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                                    Fastest
                                  </span>
                                )}

                                {flight.trend && (
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold flex items-center gap-1 ${
                                    flight.trend.type === 'down' 
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                      : flight.trend.type === 'up'
                                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                      : 'bg-[#F5F0E8] text-[#7A7268]'
                                  }`}>
                                    {flight.trend.type === 'down' ? <TrendingDown className="w-3 h-3" /> : flight.trend.type === 'up' ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                    <span>{flight.trend.text}</span>
                                  </span>
                                )}
                              </div>

                              <button 
                                onClick={() => toggleFlightShortlist(flight.id)}
                                className="text-xs font-mono font-bold text-[#7A7268] hover:text-[#1E1C1A] flex items-center gap-1 bg-[#FAF6F0] px-2.5 py-0.5 rounded-full border border-[#E6DFD5] transition-colors cursor-pointer shrink-0"
                              >
                                {isShortlisted ? <CheckSquare className="w-3.5 h-3.5 text-[#FF6B2C]" /> : <Square className="w-3.5 h-3.5" />}
                                <span className="hidden sm:inline">Compare</span>
                              </button>
                            </div>

                            {/* Center Flight Details */}
                            <div className="flex items-center gap-3">
                              <img 
                                src={flight.logo} 
                                alt={flight.airline} 
                                className="w-9 h-9 object-contain rounded-xl bg-[#FAF6F0] border border-[#E6DFD5] p-1 shrink-0 shadow-2xs" 
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-bold text-[#1E1C1A] flex items-center gap-2 truncate">
                                  <span className="truncate">{flight.airline}</span>
                                  <span className="text-[10px] font-mono text-[#7A7268] bg-[#F5F0E8] px-1.5 py-0.5 rounded shrink-0">{flight.flightNumber}</span>
                                </div>
                                <div className="text-xs font-medium text-[#7A7268] mt-0.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
                                  <span className="font-semibold text-[#1E1C1A]">{flight.departureTime} – {flight.arrivalTime}</span>
                                  <span>&middot;</span>
                                  <span>{flight.duration}</span>
                                  <span>&middot;</span>
                                  <span className={flight.stops === 0 ? 'text-emerald-700 font-bold' : 'text-[#4A443E]'}>
                                    {flight.stops === 0 ? 'Nonstop' : `1 Stop ${flight.via ? `via ${flight.via}` : ''}`}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Bottom Price & Select Action Row */}
                            <div className="pt-3 border-t border-[#E6DFD5]/70 mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="text-left">
                                <div className="text-xl sm:text-2xl font-serif font-black text-[#1E1C1A] leading-tight">{formatCurrency(convertCurrency(flight.price, 'USD', displayCurrency), displayCurrency)}</div>
                                <div className="text-[9.5px] sm:text-[10px] text-[#7A7268] uppercase font-bold tracking-wider">Round Trip Total</div>
                              </div>
                              {isSelected ? (
                                <button 
                                  onClick={() => handleClearSelection('flight')} 
                                  className="w-full sm:w-auto bg-[#FF6B2C] hover:bg-[#e0591e] active:scale-[0.98] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                                >
                                  <CheckCircle2 className="w-4 h-4" /> 
                                  <span>Selected Flight</span>
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleSelectFlight(flight)} 
                                  className="group/btn relative w-full sm:w-auto overflow-hidden bg-[#1E1C1A] hover:bg-[#FF6B2C] active:scale-[0.98] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  <span>Select Flight</span>
                                  <ArrowRight className="w-3.5 h-3.5 text-[#FF6B2C] group-hover/btn:text-white transition-colors" />
                                </button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-[#7A7268] text-sm">No flights found for these dates. Try adjusting your itinerary.</div>
                  )}
                </>
              )}
            </div>
          )}

          {/* HOTELS SECTION */}
          {(trackingState?.config?.trackHotels ?? true) && (() => {
            const currentHotelMode = trackingState?.hotelMode || propHotelMode || (propBasecampHotel ? 'basecamp' : 'undecided');
            const currentBasecampHotel = trackingState?.basecampHotel || propBasecampHotel;

            // MODE A: "basecamp" - Hotel already specified at planning time
            if (currentHotelMode === 'basecamp' && !trackingState?.selectedHotel) {
              const basecampLinkInfo = getBookingLinkInfo(destinationName, 'hotel', { name: currentBasecampHotel }, { startDate, endDate });

              return (
                <div className="bg-[#FAF6F0] rounded-2xl sm:rounded-3xl border border-[#E6DFD5] p-4 sm:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Hotel className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF6B2C]" />
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-[#1E1C1A]">Hotels & Stay</h3>
                    </div>
                    <span className="bg-[#FF6B2C] text-white text-[10px] uppercase font-extrabold px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Basecamp Confirmed
                    </span>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#E6DFD5] p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#FAF6F0] border border-[#FF6B2C]/30 rounded-2xl flex items-center justify-center text-2xl shrink-0">
                        🏨
                      </div>
                      <div>
                        <div className="text-[10px] sm:text-[11px] font-mono font-extrabold text-[#FF6B2C] uppercase tracking-wider mb-0.5">
                          Confirmed Basecamp Stay
                        </div>
                        <h4 className="text-base sm:text-lg font-serif font-bold text-[#1E1C1A]">
                          {currentBasecampHotel || "Your Booked Hotel"}
                        </h4>
                        <p className="text-xs text-[#7A7268] mt-0.5 flex items-center gap-1 leading-relaxed">
                          <MapPin className="w-3.5 h-3.5 text-[#FF6B2C] shrink-0" />
                          <span>Centrally positioned for your itinerary</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-[#E6DFD5]/60">
                      <button
                        type="button"
                        onClick={() => {
                          const url = basecampLinkInfo.url || `https://www.google.com/travel/hotels?q=${encodeURIComponent(currentBasecampHotel + ' ' + destinationName)}`;
                          window.open(url, '_blank', 'noopener,noreferrer');
                        }}
                        className="bg-[#1E1C1A] hover:bg-[#FF6B2C] active:scale-[0.98] text-white font-sans text-xs font-bold py-2.5 px-4.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#FF6B2C]" />
                        <span>View on Booking.com</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleClearSelection('hotel')}
                        className="text-xs font-bold text-[#7A7268] hover:text-[#1E1C1A] underline transition-colors text-center py-1.5 cursor-pointer"
                      >
                        Browse Other Hotels
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            // MODE B: "undecided" - Browse & Select Hotels
            return (
              <div className="bg-[#FAF6F0] rounded-2xl sm:rounded-3xl border border-[#E6DFD5] p-3.5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Hotel className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF6B2C]" />
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-[#1E1C1A]">Hotels</h3>
                  </div>

                  {/* Requirement 6: List vs Map View Toggle */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    {!trackingState.selectedHotel && (
                      <div className="bg-white rounded-xl border border-[#E6DFD5] p-0.5 flex items-center shadow-2xs">
                        <button 
                          onClick={() => setHotelViewMode('list')}
                          className={`px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            hotelViewMode === 'list' ? 'bg-[#1E1C1A] text-white shadow-xs' : 'text-[#7A7268] hover:text-[#1E1C1A]'
                          }`}
                        >
                          <List className="w-3.5 h-3.5" /> List
                        </button>
                        <button 
                          onClick={() => setHotelViewMode('map')}
                          className={`px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            hotelViewMode === 'map' ? 'bg-[#FF6B2C] text-white shadow-xs' : 'text-[#7A7268] hover:text-[#1E1C1A]'
                          }`}
                        >
                          <Map className="w-3.5 h-3.5" /> Map View
                        </button>
                      </div>
                    )}

                    {trackingState.selectedHotel && (
                      <button onClick={() => handleClearSelection('hotel')} className="text-xs font-semibold text-[#7A7268] hover:text-[#1E1C1A] underline cursor-pointer">
                        Change Selection
                      </button>
                    )}
                  </div>
                </div>

                {trackingState.selectedHotel ? (() => {
                  const hotel = trackingState.selectedHotel;
                  const hotelLinkInfo = getBookingLinkInfo(destinationName, 'hotel', hotel, { startDate, endDate });

                  return (
                    <div className="space-y-3">
                      <div className="bg-white rounded-2xl border-2 border-[#FF6B2C] p-4 sm:p-5 shadow-sm space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#FAF6F0] shrink-0 border border-[#E6DFD5]">
                            <Image src={hotel.image} alt={hotel.name} fill className="object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[9.5px] font-mono font-bold text-[#FF6B2C] uppercase tracking-wider mb-0.5">
                              Selected Basecamp Stay
                            </div>
                            <h4 className="text-sm sm:text-base font-serif font-bold text-[#1E1C1A] truncate">{hotel.name}</h4>
                            <p className="text-xs text-[#7A7268] mt-0.5">{hotel.distance} &middot; {hotel.rating} Stars</p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[#E6DFD5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                          <div>
                            <div className="text-xl sm:text-2xl font-serif font-black text-[#1E1C1A]">
                              {formatCurrency(convertCurrency(hotel.price, 'USD', displayCurrency), displayCurrency)}<span className="text-xs text-[#7A7268] font-bold">/night</span>
                            </div>
                            <div className="text-[10.5px] text-[#7A7268]">
                              {formatCurrency(convertCurrency(hotel.price * stayNights, 'USD', displayCurrency), displayCurrency)} total ({stayNights} nights)
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleClearSelection('hotel')} 
                              className="px-3 py-2.5 rounded-xl border border-[#E6DFD5] text-xs font-bold text-[#7A7268] hover:text-[#1E1C1A] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
                            >
                              Change
                            </button>
                            <a 
                              href={hotelLinkInfo.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex-1 sm:flex-initial bg-[#1E1C1A] hover:bg-[#FF6B2C] text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm whitespace-nowrap"
                            >
                              <span>Book on {hotelLinkInfo.partnerName || 'Booking.com'}</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Re-optimize Button */}
                      <div className="p-3.5 bg-white rounded-2xl border border-[#E6DFD5] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                        <div className="text-xs text-[#7A7268] text-center sm:text-left">
                          Want your daily schedule centered around this hotel?
                        </div>
                        <button
                          onClick={async () => {
                            if (onReoptimize && trackingState?.selectedHotel) {
                              setIsReoptimizing(true);
                              await onReoptimize(trackingState.selectedHotel.name, trackingState.selectedHotel);
                              setIsReoptimizing(false);
                            }
                          }}
                          disabled={isReoptimizing}
                          className="w-full sm:w-auto bg-[#FF6B2C] hover:bg-[#e0591e] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-75"
                        >
                          {isReoptimizing ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                              <span>Re-optimizing...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Re-optimize Itinerary</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })() : (
                  <>
                    {/* Segmented Controls for Hotels */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 sm:mb-5 p-2 sm:p-2.5 bg-white/90 backdrop-blur-md rounded-2xl border border-[#E6DFD5] shadow-xs">
                      {/* Sort Segment Pill Track */}
                      <div className="flex items-center gap-1.5 w-full">
                        <span className="text-[10px] font-mono font-bold text-[#8C827A] uppercase tracking-wider pl-1 shrink-0">Sort:</span>
                        <div className="flex-1 grid grid-cols-3 bg-[#F0EAE1]/90 p-0.5 rounded-full border border-[#E6DFD5]">
                          {[
                            { id: 'price', label: 'Cheapest' },
                            { id: 'rating', label: 'Top Rated' },
                            { id: 'best', label: 'Best Value' }
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setHotelSort(tab.id)}
                              className="relative py-1.5 rounded-full text-[10.5px] sm:text-xs font-sans font-bold transition-all cursor-pointer whitespace-nowrap text-center"
                            >
                              {hotelSort === tab.id && (
                                <motion.div
                                  layoutId="hotelSortPill"
                                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                                  className="absolute inset-0 bg-[#1E1C1A] rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
                                />
                              )}
                              <span className={`relative z-10 transition-colors duration-200 ${
                                hotelSort === tab.id ? 'text-white' : 'text-[#6B645C] hover:text-[#1E1C1A]'
                              }`}>
                                {tab.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Rating Segment Pill Track */}
                      <div className="flex items-center gap-1.5 w-full">
                        <span className="text-[10px] font-mono font-bold text-[#8C827A] uppercase tracking-wider pl-1 shrink-0">Rating:</span>
                        <div className="flex-1 grid grid-cols-3 bg-[#F0EAE1]/90 p-0.5 rounded-full border border-[#E6DFD5]">
                          {[
                            { id: 'any', label: 'All' },
                            { id: '4', label: '4.0+ ★' },
                            { id: '4.5', label: '4.5+ ★' }
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setHotelRating(tab.id)}
                              className="relative py-1.5 rounded-full text-[10.5px] sm:text-xs font-sans font-bold transition-all cursor-pointer whitespace-nowrap text-center"
                            >
                              {hotelRating === tab.id && (
                                <motion.div
                                  layoutId="hotelRatingPill"
                                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                                  className="absolute inset-0 bg-[#FF6B2C] rounded-full shadow-[0_2px_10px_rgba(255,107,44,0.35)]"
                                />
                              )}
                              <span className={`relative z-10 transition-colors duration-200 ${
                                hotelRating === tab.id ? 'text-white' : 'text-[#6B645C] hover:text-[#1E1C1A]'
                              }`}>
                                {tab.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Requirement 6: Render Interactive MAP View or LIST View */}
                    {hotelViewMode === 'map' ? (
                      <HotelMapView 
                        hotels={sortedHotels} 
                        itinerary={itinerary} 
                        selectedHotel={trackingState.selectedHotel} 
                        onSelectHotel={handleSelectHotel} 
                        stayNights={stayNights} 
                      />
                    ) : (
                      <>
                        {/* Requirement 1: Price Distribution Bar for Hotels */}
                        <PriceDistributionBar 
                          items={sortedHotels} 
                          type="hotel" 
                          selectedId={trackingState.selectedHotel?.id} 
                          isLoading={isLoadingResults} 
                        />

                        {isLoadingResults ? (
                          <div className="space-y-3">
                            {[1, 2, 3, 4].map(i => (
                              <div key={i} className="bg-white/80 animate-pulse rounded-2xl border border-[#E6DFD5] p-5 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="w-24 h-24 bg-[#E6DFD5]/60 rounded-xl" />
                                  <div className="space-y-2 flex-1">
                                    <div className="h-4 w-1/3 bg-[#E6DFD5]/60 rounded-md" />
                                    <div className="h-3 w-1/2 bg-[#E6DFD5]/40 rounded-md" />
                                  </div>
                                </div>
                                <div className="w-24 h-10 bg-[#E6DFD5]/60 rounded-xl" />
                              </div>
                            ))}
                          </div>
                        ) : hotels.length > 0 ? (
                          <div className="space-y-4">
                            {sortedHotels.slice(0, 6).map((hotel, index) => {
                              const isSelected = trackingState.selectedHotel?.id === hotel.id;
                              const isBestValue = hotel.id === bestValueHotelId;
                              const isCheapest = hotel.price === minHotelPrice;
                              const isShortlisted = hotelShortlist.includes(hotel.id);
                              
                              // Requirement 4: Calculate itinerary stop proximity
                              const nearbyStopsCount = Math.max(3, Math.min(totalItineraryStops, Math.round(totalItineraryStops * (1 - (index * 0.08)))));

                              return (
                                <motion.div 
                                  key={hotel.id} 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.25, delay: index * 0.03 }}
                                  className={`relative rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-200 ${
                                    isSelected
                                      ? 'bg-[#FFF9F5] border-2 border-[#FF6B2C] shadow-md ring-2 ring-[#FF6B2C]/20'
                                      : isBestValue
                                      ? 'bg-[#FFFBF7] border-2 border-[#FF6B2C]/70 shadow-sm hover:-translate-y-0.5 hover:shadow-md'
                                      : 'bg-white border border-[#E6DFD5] hover:border-[#FF6B2C]/40 hover:-translate-y-0.5 hover:shadow-md'
                                  }`}
                                >
                                  {/* Hero Photo with Floating Badges & Compare Action */}
                                  <div className="relative w-full h-40 sm:h-48 bg-[#F5F0E8] overflow-hidden">
                                    <Image 
                                      src={hotel.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop'} 
                                      alt={hotel.name} 
                                      fill
                                      className="object-cover transition-transform duration-500 hover:scale-105"
                                      sizes="(max-width: 768px) 100vw, 33vw"
                                      unoptimized
                                      onError={(e) => {
                                        e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop';
                                      }}
                                    />

                                    {/* Ambient subtle vignette gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-black/35 pointer-events-none" />

                                    {/* Floating Badges on Top-Left */}
                                    <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap z-10 max-w-[70%]">
                                      {isBestValue && (
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#FF6B2C] text-white shadow-md">
                                          ★ Best Value
                                        </span>
                                      )}
                                      {isCheapest && !isBestValue && (
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-600 text-white shadow-md">
                                          Cheapest
                                        </span>
                                      )}
                                      {hotel.trend && (
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/95 text-[#1E1C1A] backdrop-blur-md shadow-md flex items-center gap-1">
                                          {hotel.trend.type === 'down' ? <TrendingDown className="w-3 h-3 text-emerald-600" /> : hotel.trend.type === 'up' ? <TrendingUp className="w-3 h-3 text-amber-600" /> : <Minus className="w-3 h-3 text-stone-500" />}
                                          <span>{hotel.trend.text}</span>
                                        </span>
                                      )}
                                    </div>

                                    {/* Floating Compare Button on Top-Right */}
                                    <button 
                                      onClick={() => toggleHotelShortlist(hotel.id)}
                                      className="absolute top-3 right-3 z-10 bg-black/60 hover:bg-black/85 active:scale-[0.96] backdrop-blur-md text-white px-3 py-1 rounded-full text-[11px] font-mono font-bold flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer shadow-md"
                                      title="Compare hotel"
                                    >
                                      {isShortlisted ? <CheckSquare className="w-3.5 h-3.5 text-[#FF6B2C]" /> : <Square className="w-3.5 h-3.5 text-white/90" />}
                                      <span>Compare</span>
                                    </button>
                                  </div>

                                  {/* Hotel Details Content */}
                                  <div className="p-4 sm:p-5 space-y-2.5">
                                    {/* Hotel Name & Star Rating */}
                                    <div className="flex items-start justify-between gap-2">
                                      <h4 className="text-base sm:text-lg font-serif font-black text-[#1E1C1A] leading-tight">
                                        {hotel.name}
                                      </h4>
                                      <div className="flex items-center gap-1 bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200/80 font-bold text-xs shrink-0">
                                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {hotel.rating}.0
                                      </div>
                                    </div>

                                    {/* Distance & Itinerary Proximity Pill */}
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#7A7268]">
                                      <span className="font-medium text-[#7A7268]">{hotel.distance}</span>
                                      <span>&middot;</span>
                                      <span className="text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-md font-medium inline-flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                                        <span><strong>{nearbyStopsCount} of {totalItineraryStops}</strong> stops within 15 min</span>
                                      </span>
                                    </div>

                                    {/* Bottom Price & Select Action Row */}
                                    <div className="pt-3 border-t border-[#E6DFD5] mt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                      <div className="text-left">
                                        <div className="flex items-baseline gap-1">
                                          <span className="text-xl sm:text-2xl font-serif font-black text-[#1E1C1A] leading-tight">
                                            {formatCurrency(convertCurrency(hotel.price, 'USD', displayCurrency), displayCurrency)}
                                          </span>
                                          <span className="text-[10.5px] sm:text-xs text-[#7A7268] font-bold">/night</span>
                                        </div>
                                        <div className="text-[10.5px] sm:text-xs font-medium text-[#7A7268] mt-0.5">
                                          <span className="font-bold text-[#1E1C1A]">{formatCurrency(convertCurrency(hotel.price * stayNights, 'USD', displayCurrency), displayCurrency)}</span> total ({stayNights} nights)
                                        </div>
                                      </div>

                                      {isSelected ? (
                                        <button 
                                          onClick={() => handleClearSelection('hotel')} 
                                          className="w-full sm:w-auto bg-[#FF6B2C] hover:bg-[#e0591e] active:scale-[0.98] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                                        >
                                          <CheckCircle2 className="w-4 h-4" /> 
                                          <span>Selected Stay</span>
                                        </button>
                                      ) : (
                                        <button 
                                          onClick={() => handleSelectHotel(hotel)} 
                                          className="group/btn relative w-full sm:w-auto overflow-hidden bg-[#1E1C1A] hover:bg-[#FF6B2C] active:scale-[0.98] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                          <span>Select Hotel</span>
                                          <ArrowRight className="w-3.5 h-3.5 text-[#FF6B2C] group-hover/btn:text-white transition-colors" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-[#7A7268] text-sm">No hotels found for these dates. Try adjusting your itinerary.</div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            );
          })()}
        </div>

        {/* Requirement 5: Luxury Obsidian Flight Radar Capsule (Hidden when modal is open) */}
        {mounted && typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {!isCompareModalOpen && (flightShortlist.length >= 2 || hotelShortlist.length >= 2) && (() => {
              const isFlight = flightShortlist.length >= 2;
              const compareItems = isFlight
                ? flights.filter(f => flightShortlist.includes(f.id))
                : hotels.filter(h => hotelShortlist.includes(h.id));
              
              return (
                <motion.div 
                  initial={{ y: 100, x: "-50%", opacity: 0, scale: 0.92 }}
                  animate={{ y: 0, x: "-50%", opacity: 1, scale: 1 }}
                  exit={{ y: 100, x: "-50%", opacity: 0, scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 450, damping: 28 }}
                  className="fixed bottom-20 sm:bottom-8 left-1/2 z-[9999] pointer-events-auto select-none max-w-[92vw] sm:max-w-none"
                >
                  {/* Luxury Obsidian Flight Radar Capsule with Group Hover Reactions */}
                  <div className="group/dock bg-[#1E1C1A]/95 text-white pl-4 pr-2.5 py-2.5 rounded-full shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.15)] border border-white/15 hover:border-[#FF6B2C]/50 flex items-center gap-3.5 backdrop-blur-2xl transition-all duration-300">
                    
                    {/* Signature TripWise Animated Flight Radar Badge with Hover Color Shift */}
                    <div className="flex items-center gap-3">
                      <div className="relative w-9 h-9 rounded-2xl bg-gradient-to-br from-[#FF6B2C] to-[#E55A1C] p-0.5 shadow-md shadow-[#FF6B2C]/35 group-hover/dock:shadow-[0_0_20px_rgba(255,107,44,0.6)] group-hover/dock:scale-105 flex items-center justify-center shrink-0 transition-all duration-300">
                        {/* Core Disc (White -> Orange on Hover) */}
                        <div className="w-full h-full rounded-full bg-white group-hover/dock:bg-[#FF6B2C] flex items-center justify-center relative overflow-hidden transition-colors duration-300">
                          {/* Revolving Dashed Flight Orbit (Orange -> White on Hover) */}
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                            className="absolute inset-0.75 rounded-full border-[1.5px] border-dashed border-[#FF6B2C]/80 group-hover/dock:border-white/90 transition-colors duration-300"
                          />
                          
                          {/* Animated Coral Center Airplane or Hotel */}
                          <motion.div
                            animate={{ 
                              y: [-0.6, 0.6, -0.6], 
                              x: isFlight ? [-0.4, 0.4, -0.4] : [0, 0, 0],
                              scale: isFlight ? [1, 1, 1] : [0.98, 1.04, 0.98],
                              rotate: isFlight ? [0, 3, 0] : [0, 0, 0] 
                            }}
                            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                            className="relative z-10 text-[#FF6B2C] group-hover/dock:text-white flex items-center justify-center transition-colors duration-300"
                          >
                            {isFlight ? (
                              <Plane className="w-3.5 h-3.5 fill-current text-[#FF6B2C] group-hover/dock:text-white transition-colors duration-300" />
                            ) : (
                              <Hotel className="w-4 h-4 text-[#FF6B2C] group-hover/dock:text-white stroke-[2.2] transition-colors duration-300" />
                            )}
                          </motion.div>
                        </div>
                      </div>

                      {/* Matchup Preview Chips */}
                      <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/10 shadow-inner">
                        {compareItems.slice(0, 2).map((item, idx) => (
                          <React.Fragment key={item.id}>
                            {idx > 0 && (
                              <div className="flex items-center gap-1 px-1">
                                <span className="w-2 h-px bg-white/30" />
                                <span className="text-[9px] font-mono font-bold text-[#FF6B2C] uppercase tracking-wider">VS</span>
                                <span className="w-2 h-px bg-white/30" />
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                              {isFlight ? (
                                <span className="text-[10px] font-mono text-[#A89F91]">
                                  {item.airline?.split(' ')[0] || 'FL'}
                                </span>
                              ) : (
                                <Hotel className="w-3 h-3 text-[#A89F91] stroke-[2]" />
                              )}
                              <span className="truncate max-w-[95px] text-[#FAF6F0]">
                                {isFlight ? (item.flightNumber || item.airline) : item.name}
                              </span>
                              <span className="font-serif font-black text-[#FF6B2C] drop-shadow-[0_0_6px_rgba(255,107,44,0.4)]">
                                {formatCurrency(convertCurrency(item.price, 'USD', displayCurrency), displayCurrency)}
                              </span>
                            </div>
                          </React.Fragment>
                        ))}
                        {compareItems.length > 2 && (
                          <span className="text-[10px] font-mono font-bold text-[#A89F91] pl-0.5">
                            +{compareItems.length - 2}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="h-5 w-px bg-white/15" />

                    {/* Flight/Hotel Compare Action Button */}
                    <motion.button 
                      whileHover={{ scale: 1.04, y: -0.5 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setIsCompareModalOpen(isFlight ? 'flight' : 'hotel')}
                      className="group/btn relative bg-[#FF6B2C] hover:bg-[#ff7d45] text-white text-xs font-sans font-bold pl-4 pr-3.5 py-2 rounded-full transition-all shadow-md shadow-[#FF6B2C]/30 flex items-center gap-2 cursor-pointer"
                    >
                      {isFlight ? (
                        <>
                          <Plane className="w-3.5 h-3.5 text-white group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 group-hover/btn:scale-110 transition-all duration-300" />
                          <span>Compare Flight Deals</span>
                        </>
                      ) : (
                        <>
                          <Building2 className="w-3.5 h-3.5 text-white group-hover/btn:scale-110 transition-transform duration-300" />
                          <span>Compare Hotel Stays</span>
                        </>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-white/80 group-hover/btn:text-white group-hover/btn:translate-x-0.5 transition-all duration-300" />
                    </motion.button>

                    {/* Tactile Close / Clear Action (Turns Vibrant Red on Hover) */}
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setFlightShortlist([]);
                        setHotelShortlist([]);
                      }}
                      className="group/close relative w-8 h-8 rounded-full bg-white/10 hover:bg-red-600 border border-white/10 hover:border-red-500/80 text-[#A89F91] hover:text-white flex items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden shadow-xs hover:shadow-[0_0_16px_rgba(239,68,68,0.65)] shrink-0"
                      title="Clear comparison selection"
                    >
                      {/* Rotating & Scaling Dismiss Glyph */}
                      <X className="relative z-10 w-3.5 h-3.5 text-[#A89F91] group-hover/close:text-white group-hover/close:rotate-90 group-hover/close:scale-110 transition-all duration-300 ease-out" />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>,
          document.body
        )}

        {/* Side-by-Side Comparison Modal */}
        <ComparisonModal 
          isOpen={!!isCompareModalOpen}
          onClose={() => setIsCompareModalOpen(null)}
          type={isCompareModalOpen || 'flight'}
          items={
            isCompareModalOpen === 'flight' 
              ? flights.filter(f => flightShortlist.includes(f.id))
              : hotels.filter(h => hotelShortlist.includes(h.id))
          }
          onSelect={(item) => {
            if (isCompareModalOpen === 'flight') handleSelectFlight(item);
            else handleSelectHotel(item);
          }}
          destinationName={destinationName}
          startDate={startDate}
          endDate={endDate}
          stayNights={stayNights}
        />

        <div className="flex items-start gap-2 bg-[#F5F0E8] rounded-xl p-4 mt-6">
          <Bell className="w-5 h-5 text-[#FF6B2C] shrink-0 mt-0.5" />
          <p className="text-sm text-[#4A443E] leading-relaxed">
            <span className="font-bold text-[#1E1C1A]">Price Drop Alerts:</span> We're actively tracking your {trackingState.selectedFlight || trackingState.selectedHotel ? 'selected items' : 'route/city baseline'}. If prices drop by <span className="font-bold text-[#1E1C1A]">10%+</span>, we'll send you an immediate notification.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#7A7268] mt-4 ml-1">
          <Clock className="w-3.5 h-3.5" />
          <span>Last checked: Just now &middot; Next check in 22 hours</span>
        </div>
      </div>
    );
  }

  // Unactivated Prompt View — Spacious Luxury Aviation & Hospitality Suite
  return (
    <motion.div 
      initial={{ opacity: 0, y: 22, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-3xl mx-auto bg-[#FFFFFF] rounded-2xl sm:rounded-3xl border border-[#E6DFD5] p-4 sm:p-10 text-center shadow-[0_25px_70px_-15px_rgba(0,0,0,0.08)] overflow-hidden"
    >
      {/* ── 1. Animated Aviation & Hotel Atmosphere Background (Clean & Subtle) ── */}
      <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        {/* Soft Micro-Dot Matrix Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage: 'radial-gradient(#D5CBBF 1.2px, transparent 1.2px)',
            backgroundSize: '22px 22px'
          }}
        />

        {/* ── Flight Corridor 1 (High Altitude Eastbound Jet) ── */}
        <motion.div 
          className="hidden sm:block absolute top-4 -left-48 w-[800px] h-28 opacity-30"
          animate={{ x: [-80, 260, -80] }}
          transition={{ repeat: Infinity, duration: 26, ease: "linear" }}
        >
          <svg viewBox="0 0 700 90" className="w-full h-full stroke-[#B8ACA0] fill-none" strokeWidth="1.2">
            <path d="M 0,25 Q 180,65 350,20 T 700,50" strokeDasharray="5 7" />
          </svg>
        </motion.div>

        {/* ── Architectural Boutique Hotel Skyline (Desktop Only to avoid mobile button overlap) ── */}
        <div className="hidden sm:block absolute -bottom-4 -right-4 w-60 h-44 opacity-25 text-[#8C827A]">
          <svg viewBox="0 0 160 120" className="w-full h-full stroke-current fill-none" strokeWidth="1">
            <rect x="50" y="20" width="60" height="95" rx="3" strokeDasharray="3 3" />
            <line x1="50" y1="45" x2="110" y2="45" />
            <line x1="50" y1="70" x2="110" y2="70" />
            <line x1="50" y1="95" x2="110" y2="95" />
            <polygon points="80,5 65,20 95,20" />
          </svg>
        </div>
      </div>

      {/* ── 2. Top Luxury Aviation Route & Hotel Status HUD ── */}
      <div className="relative z-10 w-full max-w-lg mx-auto mb-5 sm:mb-6 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-[#FAF6F0] border border-[#E6DFD5] rounded-full flex items-center justify-between shadow-xs">
        {/* Origin Airport Badge */}
        <motion.div 
          key={config.origin}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-1.5 bg-white px-2.5 sm:px-3 py-1 rounded-md border border-[#E6DFD5] shadow-2xs shrink-0"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-[10.5px] sm:text-[11px] font-black text-[#1E1C1A]">
            {config.origin || 'JFK'}
          </span>
        </motion.div>

        {/* Animated Geodesic Flight Route Line with Flying Jet */}
        <div className="relative flex-1 mx-2 sm:mx-3 flex items-center justify-center min-w-0">
          <div className="w-full h-[1.5px] bg-[#E6DFD5] relative overflow-hidden">
            <motion.div 
              className="absolute inset-0 h-full w-full"
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, #FF6B2C 0, #FF6B2C 5px, transparent 5px, transparent 10px)',
              }}
              animate={{ x: [-20, 0] }}
              transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
            />
          </div>

          <motion.div
            key={config.origin}
            animate={{ 
              x: [-10, 10, -10], 
              y: [-1, 1, -1]
            }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute bg-[#FAF6F0] px-1 text-[#FF6B2C] flex items-center"
          >
            <Plane className="w-3.5 h-3.5" />
          </motion.div>
        </div>

        {/* Destination & Boutique Stay Badge */}
        <div className="flex items-center gap-1.5 bg-[#FFF2EA] px-2.5 sm:px-3 py-1 rounded-md border border-[#FF6B2C]/30 shadow-2xs shrink-0">
          <Hotel className="w-3.5 h-3.5 text-[#FF6B2C]" />
          <span className="font-mono text-[10.5px] sm:text-[11px] font-black text-[#FF6B2C] truncate max-w-[80px] sm:max-w-none">
            {destinationName?.split(',')[0]?.trim().toUpperCase() || 'DESTINATION'}
          </span>
        </div>
      </div>

      {/* ── 3. Notification Bell ── */}
      <div className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
        <div className="relative z-10 w-12 h-12 sm:w-14 sm:h-14 bg-[#FFF9F5] border border-[#FF6B2C]/25 rounded-full flex items-center justify-center shadow-xs">
          <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF6B2C]" />
        </div>
      </div>
      
      {/* ── 4. Grand Editorial Title & Subtitle ── */}
      <div className="relative z-10 mb-5 sm:mb-7">
        <h2 className="text-2xl sm:text-4xl font-serif font-black text-[#1E1C1A] tracking-tight mb-2">
          Search & Track Prices
        </h2>
        <div className="max-w-xl mx-auto space-y-1">
          <p className="text-[#3F3A34] text-xs sm:text-base font-serif font-medium leading-relaxed px-1 sm:px-0">
            Continuous 24/7 radar scanning nonstop airfares and boutique stays for{' '}
            <strong className="font-bold text-[#1E1C1A]">
              {destinationName?.replace(/\s*\(Demo Mode\)/i, '') || 'Rome, Italy'}
            </strong>.
          </p>
          <p className="text-[#7A7268] text-[11px] sm:text-[13px] font-sans">
            Instant price drop alerts delivered the moment rates fall below baselines.
          </p>
        </div>
      </div>

      {/* ── 5. Main Control Suite ── */}
      <div className="relative z-10 space-y-3.5 sm:space-y-4 text-left mb-6 sm:mb-10 max-w-2xl mx-auto">
        {/* Departure Terminal Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-50 bg-[#FFFFFF] border border-[#EAE3D9] rounded-2xl sm:rounded-[28px] p-3.5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.02] space-y-3.5 sm:space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-sans font-bold text-[#FF6B2C] uppercase tracking-wider flex items-center gap-1.5">
              <Plane className="w-3.5 h-3.5 text-[#FF6B2C]" />
              <span>Departure Terminal</span>
            </span>
            
            {(() => {
              const confirmedAirport = getAirportDetails(config.origin);
              return (
                <div className="flex items-center gap-1.5 text-xs font-sans text-[#1E1C1A] bg-[#FDFBF9] px-2.5 py-1 rounded-lg border border-[#F0EAE1]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <span className="font-bold text-[11px] sm:text-xs">
                    {confirmedAirport ? `${confirmedAirport.city}` : config.origin} ({config.origin})
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Search Input Box */}
          <div className="relative z-50">
            <div className="relative group cursor-text" onClick={() => setIsAirportDropdownOpen(true)}>
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A89F91] group-focus-within:text-[#FF6B2C] transition-colors pointer-events-none z-10" />
              <input 
                type="text" 
                value={airportSearchInput}
                onFocus={() => setIsAirportDropdownOpen(true)}
                onClick={() => setIsAirportDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsAirportDropdownOpen(false), 240)}
                onKeyDown={handleAirportKeyDown}
                onChange={(e) => handleAirportInputChange(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D9] focus:border-[#FF6B2C] focus:bg-white text-sm sm:text-base font-serif font-bold text-[#1E1C1A] focus:outline-none placeholder:text-[#B5AC9E] placeholder:font-sans placeholder:text-xs sm:placeholder:text-sm transition-all"
                placeholder="Search departure city or airport..."
              />
              
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 z-20">
                {airportSearchInput && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setAirportSearchInput('');
                      setIsAirportDropdownOpen(true);
                    }}
                    className="p-1 rounded-full text-[#8C827A] hover:text-[#1E1C1A] transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Airport Dropdown Popover */}
            <AnimatePresence>
              {isAirportDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full left-0 w-full mt-2 bg-white border border-[#EAE3D9] rounded-2xl shadow-xl z-[200] p-2 max-h-60 overflow-y-auto"
                >
                  <div className="space-y-1">
                    {currentAirportMatches.length > 0 ? (
                      currentAirportMatches.map((a, idx) => {
                        const isCurrent = config.origin === a.code;
                        const isKeyboardActive = airportActiveIndex === idx;

                        return (
                          <button
                            key={a.code}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectAirport(a);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              isCurrent 
                                ? 'bg-[#181614] text-white' 
                                : isKeyboardActive
                                ? 'bg-[#FFF2EB] text-[#1E1C1A]'
                                : 'hover:bg-[#FAF6F0] text-[#1E1C1A]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <span className={`font-mono font-bold text-xs px-1.5 py-0.5 rounded ${
                                isCurrent ? 'bg-white/20 text-white' : 'bg-[#FF6B2C]/10 text-[#FF6B2C]'
                              }`}>
                                {a.code}
                              </span>
                              <span className="font-bold truncate">{a.city}</span>
                              <span className={`text-[11px] truncate ${isCurrent ? 'text-white/70' : 'text-[#8C827A]'}`}>&middot; {a.name}</span>
                            </div>
                            <span className={`text-[10px] font-mono shrink-0 pl-2 ${isCurrent ? 'text-white/80' : 'text-[#8C827A]'}`}>
                              {a.country}
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectAirport(airportSearchInput.trim().toUpperCase());
                        }}
                        className="w-full text-left p-2.5 rounded-xl text-xs bg-[#FAF6F0] hover:bg-[#F5EDE1] text-[#1E1C1A] flex items-center justify-between cursor-pointer border border-[#E6DFD5]"
                      >
                        <span>Select code <strong className="font-mono text-[#FF6B2C]">"{airportSearchInput.toUpperCase()}"</strong></span>
                        <span className="text-xs font-bold text-[#FF6B2C]">Set &rarr;</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Hubs Switcher & Benchmark in 2 Clean Rows */}
          <div className="pt-3 border-t border-[#F0EAE1] space-y-2.5">
            {/* Row 1: Popular Hubs Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
              <span className="text-[10px] font-sans font-bold text-[#A89F91] uppercase tracking-wider shrink-0">
                Popular:
              </span>
              <div className="flex items-center gap-1 bg-[#FDFBF9] p-0.5 rounded-lg border border-[#F0EAE1] shrink-0">
                {['DEL', 'JFK', 'LHR', 'DXB', 'SIN', 'HND'].map((code) => {
                  const isActive = config.origin === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => handleSelectAirport({ code })}
                      className={`relative px-2.5 py-1 rounded-md text-[10.5px] font-mono font-bold transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-[#1E1C1A] text-white shadow-xs' 
                          : 'text-[#8C827A] hover:text-[#1E1C1A]'
                      }`}
                    >
                      {code}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 2: Benchmark Typical & Low Price Chips */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-sans text-[#7A7268] pt-1">
              <span>
                Typical: <strong className="font-mono font-bold text-[#1E1C1A]">{formatCurrency(convertCurrency(480, 'USD', displayCurrency), displayCurrency)}–{formatCurrency(convertCurrency(690, 'USD', displayCurrency), displayCurrency)}</strong>
              </span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md text-[11px]">
                <TrendingDown className="w-3 h-3" /> Low: <strong className="font-mono font-bold">{formatCurrency(convertCurrency(410, 'USD', displayCurrency), displayCurrency)}</strong>
              </span>
            </div>
          </div>
        </motion.div>

        {/* Watchdog Toggles without Truncation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
          {/* Flights Watchdog Card */}
          <div 
            onClick={() => setConfig({ ...config, trackFlights: !config.trackFlights })}
            className={`flex items-center justify-between p-3.5 sm:p-4.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
              config.trackFlights 
                ? 'bg-white border-[#FF6B2C] shadow-xs' 
                : 'bg-white/70 border-[#E6DFD5] opacity-75 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-colors ${
                config.trackFlights ? 'bg-[#FF6B2C] text-white shadow-xs' : 'bg-[#E6DFD5] text-[#7A7268]'
              }`}>
                <Plane className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-serif font-bold text-[#1E1C1A] leading-tight">Flights & Airfare</p>
                <p className="text-[11px] text-[#7A7268] mt-0.5 leading-snug">Monitors nonstop routes & drops</p>
              </div>
            </div>

            {/* Switch */}
            <div className={`w-11 h-6 shrink-0 rounded-full transition-colors duration-200 relative ${config.trackFlights ? 'bg-[#FF6B2C]' : 'bg-[#D8D0C5]'}`}>
              <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow-sm transition-transform duration-200 ${config.trackFlights ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </div>

          {/* Hotels Watchdog Card */}
          <div 
            onClick={() => setConfig({ ...config, trackHotels: !config.trackHotels })}
            className={`flex items-center justify-between p-3.5 sm:p-4.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
              config.trackHotels 
                ? 'bg-white border-[#FF6B2C] shadow-xs' 
                : 'bg-white/70 border-[#E6DFD5] opacity-75 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-colors ${
                config.trackHotels ? 'bg-[#FF6B2C] text-white shadow-xs' : 'bg-[#E6DFD5] text-[#7A7268]'
              }`}>
                <Hotel className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-serif font-bold text-[#1E1C1A] leading-tight">Hotels & Stays</p>
                <p className="text-[11px] text-[#7A7268] mt-0.5 leading-snug">Monitors nightly room rates</p>
              </div>
            </div>

            {/* Switch */}
            <div className={`w-11 h-6 shrink-0 rounded-full transition-colors duration-200 relative ${config.trackHotels ? 'bg-[#FF6B2C]' : 'bg-[#D8D0C5]'}`}>
              <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow-sm transition-transform duration-200 ${config.trackHotels ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="relative z-10 flex items-center justify-center gap-1.5 text-red-600 text-xs font-medium mb-4 bg-red-50 py-2 px-3 rounded-xl border border-red-200 max-w-md mx-auto">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── 6. Bespoke Tactile Obsidian Action Button with Dynamic Animated Flight Jetstream ── */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        <motion.button 
          type="button"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98, y: 1 }}
          onClick={handleStartTracking}
          disabled={isActivating || (!config.trackFlights && !config.trackHotels)}
          data-clicked={isAnimatingStart}
          className="group/btn relative w-full bg-[#181614] hover:bg-[#0D0C0B] active:bg-[#0D0C0B] data-[clicked=true]:bg-[#0D0C0B] text-white py-4 px-8 rounded-2xl shadow-[0_10px_25px_-5px_rgba(24,22,20,0.35)] hover:shadow-[0_16px_36px_-6px_rgba(255,107,44,0.3),0_4px_12px_rgba(0,0,0,0.5)] active:shadow-[0_16px_36px_-6px_rgba(255,107,44,0.3),0_4px_12px_rgba(0,0,0,0.5)] data-[clicked=true]:shadow-[0_16px_36px_-6px_rgba(255,107,44,0.3),0_4px_12px_rgba(0,0,0,0.5)] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer border-t border-white/22 border-x border-[#2E2A26] border-b border-black overflow-hidden font-sans font-bold text-sm tracking-wide"
        >
          {/* Subtle light sweep reflection across obsidian surface on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.12] to-transparent -translate-x-full group-hover/btn:translate-x-full group-active/btn:translate-x-full group-data-[clicked=true]/btn:translate-x-full transition-transform duration-700 ease-out pointer-events-none" />

          {/* Warm coral bottom ambient edge line on hover */}
          <div className="absolute bottom-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-[#FF6B2C] to-transparent opacity-0 group-hover/btn:opacity-100 group-active/btn:opacity-100 group-data-[clicked=true]/btn:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {isActivating ? (
            <div className="flex items-center gap-2.5 relative z-10">
              <Loader2 className="w-4 h-4 animate-spin text-[#FF6B2C]" />
              <span className="text-[#FAF6F0]">Searching live prices...</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 relative z-10">
              <span className="group-hover/btn:text-[#FFF5EE] group-active/btn:text-[#FFF5EE] group-data-[clicked=true]/btn:text-[#FFF5EE] transition-colors duration-200">
                Search & Track Prices
              </span>
              <div className="flex items-center gap-2">
                {/* Dynamic Flight Jetstream & Ascending Airplane with Hover Acceleration */}
                <div className="relative flex items-center">
                  {/* Expanding animated contrail behind airplane tail on hover */}
                  <div className="w-3.5 group-hover/btn:w-6 group-active/btn:w-6 group-data-[clicked=true]/btn:w-6 h-[1.5px] bg-gradient-to-r from-transparent to-[#FF6B2C] relative overflow-hidden transition-all duration-300 ease-out mr-0.5">
                    <motion.div 
                      className="absolute inset-0 w-full h-full"
                      style={{
                        backgroundImage: 'repeating-linear-gradient(90deg, #FF6B2C 0, #FF6B2C 2px, transparent 2px, transparent 4px)'
                      }}
                      animate={{ x: [-8, 0] }}
                      transition={{ repeat: Infinity, duration: 0.4, ease: "linear" }}
                    />
                  </div>

                  {/* True Diagonal Airplane with Fluid Flight Cruise & Hover */}
                  <motion.div
                    animate={{ 
                      y: [-0.8, 0.8, -0.8], 
                      x: [-0.5, 1, -0.5],
                      rotate: [0, 2.5, 0]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 2.4, 
                      ease: "easeInOut" 
                    }}
                    className="text-[#FF6B2C] drop-shadow-[0_0_10px_rgba(255,107,44,0.75)] group-hover/btn:translate-x-2 group-active/btn:translate-x-2 group-data-[clicked=true]/btn:translate-x-2 group-hover/btn:-translate-y-1 group-active/btn:-translate-y-1 group-data-[clicked=true]/btn:-translate-y-1 group-hover/btn:scale-115 group-active/btn:scale-115 group-data-[clicked=true]/btn:scale-115 transition-all duration-300 ease-out flex items-center justify-center"
                  >
                    <Plane className="w-4 h-4" />
                  </motion.div>
                </div>

                <ArrowRight className="w-4 h-4 text-[#A89F91] group-hover/btn:text-white group-active/btn:text-white group-data-[clicked=true]/btn:text-white group-hover/btn:translate-x-1.5 group-active/btn:translate-x-1.5 group-data-[clicked=true]/btn:translate-x-1.5 transition-all duration-300 ease-out" />
              </div>
            </div>
          )}
        </motion.button>
      </div>

    </motion.div>
  );
}
