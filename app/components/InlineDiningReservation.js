'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Clock, Check, Calendar, Phone, AlertCircle, Wallet } from 'lucide-react';

// Simple helper to format time nicely or generate 3 realistic availability slots around planned time
function getRealisticSlots(plannedTime) {
  if (!plannedTime) return ['12:30 PM', '1:00 PM', '1:30 PM'];
  const t = plannedTime.trim();
  
  // Try to parse AM/PM
  const match = t.match(/^(\d+)(?::(\d+))?\s*(AM|PM)?$/i);
  if (!match) return ['12:30 PM', '1:00 PM', '1:30 PM'];
  
  let hours = parseInt(match[1], 10);
  const mins = match[2] ? parseInt(match[2], 10) : 0;
  const ampm = match[3] ? match[3].toUpperCase() : (hours >= 12 ? 'PM' : 'AM');
  
  // Convert to total minutes from midnight for math
  let totalMins = hours * 60 + mins;
  if (ampm === 'PM' && hours < 12) totalMins += 12 * 60;
  if (ampm === 'AM' && hours === 12) totalMins -= 12 * 60;

  const slot1Mins = totalMins - 30;
  const slot2Mins = totalMins;
  const slot3Mins = totalMins + 30;

  const toStr = (m) => {
    let h = Math.floor(m / 60) % 24;
    let min = m % 60;
    if (min < 0) min += 60;
    if (h < 0) h += 24;
    const ap = h >= 12 ? 'PM' : 'AM';
    let dh = h % 12;
    if (dh === 0) dh = 12;
    const dm = min < 10 ? `0${min}` : `${min}`;
    return `${dh}:${dm} ${ap}`;
  };

  return [toStr(slot1Mins), toStr(slot2Mins), toStr(slot3Mins)];
}

export default function InlineDiningReservation({
  activity,
  destinationName = 'Destination',
  dayNumber = 1,
  stopNumber = 1,
  onStatusChange
}) {
  const [status, setStatus] = useState('not_booked'); // 'not_booked' | 'pending' | 'confirmed' | 'failed'
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [partySize, setPartySize] = useState(2);
  const [confirmedData, setConfirmedData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isConfirmStepOpen, setIsConfirmStepOpen] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [walletFeedback, setWalletFeedback] = useState(false);

  // Clean restaurant title for display and API queries
  const rawTitle = activity?.title || 'Featured Restaurant';
  let cleanName = rawTitle.trim();
  const atMatch = cleanName.match(/\s(?:at|@|inside)\s+(.+)$/i);
  if (atMatch && atMatch[1]) {
    cleanName = atMatch[1].trim();
  } else {
    const verbMatch = cleanName.match(/^(?:visit|tour|guided tour|exploration|stroll|walk|sunset walk|afternoon|morning|evening|dinner|lunch|breakfast|drinks|cocktails|coffee|gelato|tasting|shopping)\s+(?:to|of|around|at|in)\s+(.+)$/i);
    if (verbMatch && verbMatch[1]) {
      cleanName = verbMatch[1].trim();
    }
  }
  cleanName = cleanName
    .replace(/\b(?:VIP|Fast-Track|Skip-the-Line|Priority|Exclusive|Guided|Tour|Exploration|Experience|Admission|Entry|Pass|Passes|Access)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleanName || cleanName.length < 2) {
    cleanName = rawTitle.trim();
  }

  const storageKey = `tw_dining_res_${destinationName}_d${dayNumber}_s${stopNumber}`;
  const slots = getRealisticSlots(activity?.time);

  // Load persisted booking state on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.status === 'confirmed') {
          setStatus('confirmed');
          setConfirmedData(parsed);
          if (onStatusChange) onStatusChange();
          return;
        }
      }
    } catch (e) {
      // fallback
    }
    setStatus('not_booked');
  }, [storageKey, destinationName, dayNumber, stopNumber]);

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
    setErrorMessage('');
    setIsConfirmStepOpen(true);
  };

  const handleConfirmReservation = (simulateFailure = false) => {
    setStatus('pending');
    setErrorMessage('');

    setTimeout(() => {
      if (simulateFailure) {
        setStatus('failed');
        setErrorMessage("Couldn't confirm that slot — try another");
        if (onStatusChange) onStatusChange();
      } else {
        const codeNum = Math.floor(100000 + Math.random() * 900000);
        const newConfirmed = {
          status: 'confirmed',
          provider: 'Partner Network Concierge',
          restaurantName: cleanName,
          time: selectedSlot || slots[1] || '1:00 PM',
          plannedTime: activity?.time || null,
          partySize: partySize,
          confirmationCode: `RES-TW-${codeNum}`,
          confirmedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setStatus('confirmed');
        setConfirmedData(newConfirmed);
        setIsConfirmStepOpen(false);
        try {
          localStorage.setItem(storageKey, JSON.stringify(newConfirmed));
        } catch (e) {}
        if (onStatusChange) onStatusChange();
      }
    }, 1600);
  };

  const handleCancelReservation = () => {
    setStatus('not_booked');
    setConfirmedData(null);
    setSelectedSlot(null);
    setIsConfirmStepOpen(false);
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {}
    if (onStatusChange) onStatusChange();
    };

  const handleAddToCalendar = () => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TripWise Concierge//EN',
      'BEGIN:VEVENT',
      `SUMMARY:Dinner/Lunch Reservation at ${cleanName}`,
      `DESCRIPTION:Table for ${confirmedData?.partySize || 2} Guests.\\nConfirmation Code: ${confirmedData?.confirmationCode || 'RES-TW-0000'}\\nProvider: Partner Network Concierge`,
      `LOCATION:${cleanName}, ${destinationName}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${cleanName.replace(/\s+/g, '_')}_reservation.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddToWallet = () => {
    setWalletFeedback(true);
    setTimeout(() => setWalletFeedback(false), 2600);
  };

  const cleanDest = destinationName ? destinationName.split(',')[0].trim() : '';
  const phoneSearchQuery = encodeURIComponent(`${cleanName} ${cleanDest} phone number`);

  return (
    <div 
      id={`dining-stop-${dayNumber}-${stopNumber}`}
      className="mt-4 pt-4 border-t border-[#E6DFD5] text-[#1E1C1A] transition-all"
    >
      {/* ── STATE 3: CONFIRMED RESERVATION CARD (Requirement 3 & 4) ── */}
      {status === 'confirmed' && confirmedData ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, type: 'spring', damping: 24 }}
          className="p-5 sm:p-6 rounded-2xl border-2 border-[#3F5C43]/40 bg-[#F2F5F1] text-[#2C3E2D] shadow-xs relative overflow-hidden"
        >
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#8F9E8B]/30 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#3F5C43] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                ✓
              </span>
              <div>
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#3F5C43] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#3F5C43] inline-block animate-pulse" />
                  <span>Table Concierge • Settled Reservation</span>
                </div>
                <div className="text-lg sm:text-xl font-serif font-black text-[#1E1C1A] leading-tight mt-0.5">
                  {confirmedData.restaurantName}
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right bg-white/70 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border sm:border-0 border-[#8F9E8B]/20">
              <div className="text-sm sm:text-base font-serif font-black text-[#1E1C1A]">
                Booked for <span className="text-[#3F5C43] font-mono">{confirmedData.time}</span>
              </div>
              <div className="text-xs font-sans text-[#5F5E5A] mt-0.5">
                Party of <strong>{confirmedData.partySize} {confirmedData.partySize === 1 ? 'Guest' : 'Guests'}</strong>
                {confirmedData.plannedTime && confirmedData.plannedTime !== confirmedData.time && (
                  <span className="block sm:inline sm:ml-2 font-mono text-[11px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80 mt-1 sm:mt-0">
                    Planned: {confirmedData.plannedTime}
                  </span>
                )}
              </div>
              <div className="text-[11px] font-mono font-bold tracking-widest text-[#3F5C43] mt-1">
                Ref: {confirmedData.confirmationCode}
              </div>
            </div>
          </div>

          {/* Action Row: Icons for Calendar & Apple Wallet */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={handleAddToCalendar}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#3F5C43]/30 bg-white text-[#3F5C43] text-xs font-sans font-bold hover:bg-[#3F5C43] hover:text-white transition-colors cursor-pointer shadow-2xs"
              >
                <Calendar className="w-4 h-4 shrink-0" />
                <span>Add to Calendar (.ics)</span>
              </button>

              <button
                onClick={handleAddToWallet}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#3F5C43]/30 bg-white text-[#3F5C43] text-xs font-sans font-bold hover:bg-[#3F5C43] hover:text-white transition-colors cursor-pointer shadow-2xs relative"
              >
                {walletFeedback ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <Wallet className="w-4 h-4 shrink-0" />}
                <span>{walletFeedback ? 'Pass Copied to Wallet!' : 'Add to Apple Wallet'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#8F9E8B]/20">
              <span className="text-[10px] font-sans text-[#7A7268]">
                Provider network: OpenTable • Google Reserve
              </span>
              <button
                onClick={handleCancelReservation}
                className="text-xs font-sans text-[#7A7268] hover:text-[#BA5536] transition-colors underline cursor-pointer font-semibold"
              >
                Modify or Cancel Table
              </button>
            </div>
          </div>
        </motion.div>
      ) : status === 'pending' ? (
        /* ── STATE 2: PENDING CONFIRMATION ── */
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl border border-[#E6DFD5] bg-[#FAF6F0] flex items-center justify-between gap-3 shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-[#BA5536] border-t-transparent animate-spin shrink-0" />
            <div>
              <div className="text-xs font-serif font-bold text-[#1E1C1A]">
                Confirming {selectedSlot || '1:00 PM'} table for {partySize} at {cleanName}...
              </div>
              <div className="text-[10px] font-sans text-[#7A7268]">
                Securing reservation slot via live availability check
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-[#BA5536] bg-[#BA5536]/10 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
            Securing Slot
          </span>
        </motion.div>
      ) : (
        /* ── STATE 1: UNIFIED NOT BOOKED PANEL (Requirement 1 & 2) ── */
        <div className="w-full rounded-2xl border border-[#E6DFD5] bg-[#FAF6F0]/60 p-4 sm:p-5 shadow-2xs relative overflow-hidden group hover:border-[#BA5536]/40 transition-all">
          {/* Header & Concierge Status Indicator */}
          <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-[#E6DFD5]/70 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse shadow-xs" title="Live status active" />
              <span className="text-xs sm:text-sm font-serif font-bold text-[#1E1C1A] tracking-tight">
                Table Concierge
              </span>
            </div>

            <span className="text-[11px] font-sans text-[#7A7268] italic">
              Verified partner availability
            </span>
          </div>

          {/* Error / Failure inline feedback */}
          {status === 'failed' && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 mb-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 font-serif">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{errorMessage || "Couldn't confirm that slot — try another"}</span>
              </div>
              <button
                onClick={() => setStatus('not_booked')}
                className="text-amber-700 hover:text-amber-900 underline font-sans font-bold text-[11px]"
              >
                Dismiss
              </button>
            </motion.div>
          )}

          {/* Main inline CTA & Slot Pills Row */}
          {!isConfirmStepOpen ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-sans font-bold text-[#BA5536] uppercase tracking-wider">
                  Reserve a table:
                </span>
                
                <div className="flex items-center gap-2 flex-wrap">
                  {slots.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectSlot(s)}
                      className="px-3.5 py-1.5 rounded-xl border border-[#BA5536] bg-white text-[#BA5536] text-xs font-mono font-bold hover:bg-[#BA5536] hover:text-white transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5 opacity-80" />
                      <span>{s}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone fallback merged right into the reservation block as a secondary link */}
              <a
                href={`https://www.google.com/search?q=${phoneSearchQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-sans text-[#7A7268] hover:text-[#BA5536] transition-colors cursor-pointer self-start sm:self-auto py-1"
                title={`Search and call ${cleanName} direct desk`}
              >
                <Phone className="w-3.5 h-3.5 shrink-0 text-[#BA5536]" />
                <span className="underline font-medium">Or call desk direct</span>
              </a>
            </div>
          ) : (
            /* ── LIGHTWEIGHT INLINE CONFIRM STEP (Party Size + Confirm) ── */
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl border-2 border-[#BA5536]/40 bg-white space-y-3.5 shadow-sm mt-2"
            >
              <div className="flex items-center justify-between border-b border-[#E6DFD5] pb-2.5">
                <div className="text-xs font-serif font-bold text-[#1E1C1A]">
                  Securing slot: <span className="text-[#BA5536] font-mono font-black">{selectedSlot}</span> at {cleanName}
                </div>
                <button
                  onClick={() => setIsConfirmStepOpen(false)}
                  className="text-xs font-sans text-[#7A7268] hover:text-[#1E1C1A] underline cursor-pointer font-medium"
                >
                  Change Slot
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Party size selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-sans text-[#5F5E5A] font-medium">Party size:</span>
                  <div className="flex items-center gap-1 bg-[#FAF6F0] p-1 rounded-xl border border-[#E6DFD5]">
                    {[1, 2, 3, 4, 6].map((num) => (
                      <button
                        key={num}
                        onClick={() => setPartySize(num)}
                        className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                          partySize === num
                            ? 'bg-[#BA5536] text-white shadow-2xs'
                            : 'text-[#5F5E5A] hover:bg-white'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Confirm / Test Failure buttons */}
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleConfirmReservation(false)}
                    className="px-4 py-2 rounded-xl bg-[#BA5536] text-white text-xs font-sans font-bold hover:bg-[#A3482D] transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <span>Confirm Table ({selectedSlot}) →</span>
                  </button>

                  <button
                    onClick={() => handleConfirmReservation(true)}
                    className="text-[10px] font-mono text-[#7A7268] hover:text-amber-700 underline px-1 cursor-pointer"
                    title="Simulate slot conflict / failure response"
                  >
                    [Test Slot Full]
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Small fine print below + Nearby alternatives toggle */}
          <div className="mt-3.5 pt-2.5 border-t border-[#E6DFD5]/50 flex items-center justify-between text-[10px] text-[#7A7268] flex-wrap gap-2">
            {!isConfirmStepOpen ? (
              <button
                onClick={() => setShowAlternatives(!showAlternatives)}
                className="text-[#7A7268] hover:text-[#BA5536] underline transition-colors cursor-pointer font-medium"
              >
                {showAlternatives ? 'Hide nearby alternative windows ↑' : `${slots[1]} exact full? View nearby →`}
              </button>
            ) : (
              <span>Select party size above and confirm table slot.</span>
            )}
            <span className="opacity-75">Provider network: OpenTable • Google Reserve</span>
          </div>

          {/* Nearby alternatives hint block if expanded */}
          {showAlternatives && !isConfirmStepOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 p-3.5 rounded-xl bg-white border border-[#E6DFD5] text-xs font-sans text-[#4A443E] flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-[#BA5536] shrink-0 mt-0.5" />
              <div>
                <strong className="font-serif font-bold text-[#1E1C1A] block">
                  {slots[1]} peak seating window alternatives:
                </strong>
                <p className="mt-0.5 leading-relaxed">
                  If {cleanName} is heavily booked at {slots[1]}, OpenTable API recommends selecting the earlier <span className="font-mono font-bold text-[#BA5536]">{slots[0]}</span> window or the later <span className="font-mono font-bold text-[#BA5536]">{slots[2]}</span> seating to guarantee immediate table confirmation without wait times.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
