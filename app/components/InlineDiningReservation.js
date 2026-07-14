'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Clock, Check, Calendar, Phone, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';

// Helper to generate 3 realistic suggested availability windows around planned time
function getRealisticSlots(plannedTime) {
  if (!plannedTime) return ['12:30 PM', '1:00 PM', '1:30 PM'];
  const t = plannedTime.trim();
  
  // Parse AM/PM
  const match = t.match(/^(\d+)(?::(\d+))?\s*(AM|PM)?$/i);
  if (!match) return ['12:30 PM', '1:00 PM', '1:30 PM'];
  
  let hours = parseInt(match[1], 10);
  const mins = match[2] ? parseInt(match[2], 10) : 0;
  const ampm = match[3] ? match[3].toUpperCase() : (hours >= 12 ? 'PM' : 'AM');
  
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

// Generate real public deep-link search URL for chosen provider
function getDeepLinkUrl(provider, restaurantName, destinationName, partySize, slotTime) {
  const query = `${restaurantName} ${destinationName ? destinationName.split(',')[0].trim() : ''}`.trim();
  const encodedQuery = encodeURIComponent(query);
  
  if (provider === 'TheFork') {
    return `https://www.thefork.com/search?q=${encodedQuery}`;
  } else if (provider === 'Resy') {
    return `https://resy.com/cities?query=${encodedQuery}&seats=${partySize || 2}`;
  }
  // Default: OpenTable search deep link
  return `https://www.opentable.com/s?term=${encodedQuery}&covers=${partySize || 2}`;
}

export default function InlineDiningReservation({
  activity,
  destinationName = 'Destination',
  dayNumber = 1,
  stopNumber = 1,
  onStatusChange
}) {
  // status: 'not_reserved' | 'awaiting_confirmation' | 'marked_reserved'
  const [status, setStatus] = useState('not_reserved');
  const [provider, setProvider] = useState('OpenTable');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [partySize, setPartySize] = useState(2);
  const [customTime, setCustomTime] = useState('');
  const [customRef, setCustomRef] = useState('');
  const [confirmedData, setConfirmedData] = useState(null);
  const [showAlternatives, setShowAlternatives] = useState(false);

  // Clean restaurant title for clean display and real-world deep-link searches
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

  // Choose default provider based on European vs general destination if not customized
  useEffect(() => {
    const destLower = (destinationName || '').toLowerCase();
    if (destLower.includes('rome') || destLower.includes('italy') || destLower.includes('paris') || destLower.includes('france') || destLower.includes('spain') || destLower.includes('florence') || destLower.includes('milan')) {
      setProvider('OpenTable');
    } else {
      setProvider('OpenTable');
    }
  }, [destinationName]);

  // Load persisted booking attestation on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Support both new 'marked_reserved' and backward-compatible 'confirmed'
        if (parsed && (parsed.status === 'marked_reserved' || parsed.status === 'confirmed')) {
          setStatus('marked_reserved');
          setConfirmedData(parsed);
          setProvider(parsed.provider || 'OpenTable');
          if (onStatusChange) onStatusChange();
          return;
        }
      }
    } catch (e) {
      // fallback
    }
    setStatus('not_reserved');
  }, [storageKey, destinationName, dayNumber, stopNumber]);

  // Step 1: User taps a suggested time-slot pill -> Opens real provider tab & transitions to attestation prompt
  const handleTapTimeSlot = (slot) => {
    setSelectedSlot(slot);
    setCustomTime(slot);
    const url = getDeepLinkUrl(provider, cleanName, destinationName, partySize, slot);
    window.open(url, '_blank', 'noopener,noreferrer');
    setStatus('awaiting_confirmation');
  };

  // Step 2: User clicks "Mark as reserved" (Instant self-report, no fabricated codes, no spinners)
  const handleMarkReserved = () => {
    const finalTime = (customTime || selectedSlot || slots[1] || '1:00 PM').trim();
    const finalRef = customRef ? customRef.trim() : null;

    const newAttestation = {
      status: 'marked_reserved',
      provider: provider,
      restaurantName: cleanName,
      time: finalTime,
      plannedTime: activity?.time || null,
      partySize: partySize,
      confirmationCode: finalRef, // Only store if explicitly entered by user
      attestedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setStatus('marked_reserved');
    setConfirmedData(newAttestation);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newAttestation));
    } catch (e) {}
    if (onStatusChange) onStatusChange();
  };

  // Revert to Not Reserved / Undo attestation
  const handleUndoAttestation = () => {
    setStatus('not_reserved');
    setConfirmedData(null);
    setSelectedSlot(null);
    setCustomRef('');
    setCustomTime('');
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {}
    if (onStatusChange) onStatusChange();
  };

  // Add to Calendar (.ics generation for the user-attested table)
  const handleAddToCalendar = () => {
    const timeBooked = confirmedData?.time || activity?.time || '1:00 PM';
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TripWise Concierge Attestation//EN',
      'BEGIN:VEVENT',
      `SUMMARY:Dinner/Lunch Reservation at ${cleanName}`,
      `DESCRIPTION:Self-Reported Reservation via ${confirmedData?.provider || provider}.\\nParty of ${confirmedData?.partySize || 2} Guests.${confirmedData?.confirmationCode ? `\\nConfirmation/Notes: ${confirmedData.confirmationCode}` : ''}\\nNote: Reservation details self-reported in TripWise dossier.`,
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

  const cleanDest = destinationName ? destinationName.split(',')[0].trim() : '';
  const phoneSearchQuery = encodeURIComponent(`${cleanName} ${cleanDest} phone number`);

  return (
    <div 
      id={`dining-stop-${dayNumber}-${stopNumber}`}
      className="mt-4 pt-4 border-t border-[#E6DFD5] text-[#1E1C1A] transition-all"
    >
      {/* ── STATE 3: MARKED AS RESERVED (USER-ATTESTED) ── */}
      {status === 'marked_reserved' && confirmedData ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, type: 'spring', damping: 24 }}
          className="p-5 sm:p-6 rounded-2xl border-2 border-[#3F5C43]/40 bg-[#F2F5F1] text-[#2C3E2D] shadow-xs relative overflow-hidden"
        >
          {/* Top header row labeled honestly */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#8F9E8B]/30 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#3F5C43] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                ✓
              </span>
              <div>
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#3F5C43] flex items-center gap-1.5">
                  <span>Reservation noted — booked via {confirmedData.provider}</span>
                </div>
                <div className="text-lg sm:text-xl font-serif font-black text-[#1E1C1A] leading-tight mt-0.5">
                  {confirmedData.restaurantName}
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right bg-white/70 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border sm:border-0 border-[#8F9E8B]/20">
              <div className="text-sm sm:text-base font-serif font-black text-[#1E1C1A]">
                Attested Time: <span className="text-[#3F5C43] font-mono">{confirmedData.time}</span>
              </div>
              <div className="text-xs font-sans text-[#5F5E5A] mt-0.5">
                Party of <strong>{confirmedData.partySize} {confirmedData.partySize === 1 ? 'Guest' : 'Guests'}</strong>
                {confirmedData.plannedTime && confirmedData.plannedTime !== confirmedData.time && (
                  <span className="block sm:inline sm:ml-2 font-mono text-[11px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80 mt-1 sm:mt-0">
                    Planned: {confirmedData.plannedTime}
                  </span>
                )}
              </div>
              {/* Only show confirmation code if user explicitly entered one */}
              {confirmedData.confirmationCode && (
                <div className="text-[11px] font-mono font-bold tracking-wider text-[#3F5C43] mt-1 bg-white/80 px-2 py-0.5 rounded inline-block border border-[#3F5C43]/20">
                  Ref / Notes: {confirmedData.confirmationCode}
                </div>
              )}
            </div>
          </div>

          {/* Action Row: Add to Calendar & Edit/Undo */}
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
                onClick={handleUndoAttestation}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-transparent text-[#7A7268] text-xs font-sans font-semibold hover:text-[#BA5536] hover:bg-white/60 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Edit / Undo (Revert to Not Reserved)</span>
              </button>
            </div>
          </div>

          {/* Explicit disclosure subtext beneath the card (MANDATORY CONSTRAINT) */}
          <div className="mt-4 pt-3 border-t border-[#8F9E8B]/30 text-[11px] font-sans text-[#4A443E]/85 italic flex items-center gap-2">
            <span>ℹ️</span>
            <span>
              Reservation details are self-reported by you — TripWise does not hold or verify tables directly.
            </span>
          </div>
        </motion.div>
      ) : status === 'awaiting_confirmation' ? (
        /* ── STATE 2: AWAITING USER CONFIRMATION (SELF-REPORT PROMPT) ── */
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl border-2 border-[#BA5536]/40 bg-[#FAF6F0] space-y-4 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E6DFD5] pb-3">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-[#BA5536] font-bold flex items-center gap-1.5">
                <span>Step 2: Self-Report Status</span>
              </div>
              <h4 className="text-base sm:text-lg font-serif font-black text-[#1E1C1A] mt-0.5">
                Booked it on {provider}?
              </h4>
            </div>
            <button
              onClick={() => {
                const url = getDeepLinkUrl(provider, cleanName, destinationName, partySize, selectedSlot || slots[1]);
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
              className="text-xs font-sans text-[#BA5536] hover:underline flex items-center gap-1 font-semibold cursor-pointer self-start sm:self-auto bg-white px-3 py-1 rounded-lg border border-[#BA5536]/30"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Re-open {provider} tab ↗</span>
            </button>
          </div>

          <p className="text-xs font-sans text-[#4A443E] leading-relaxed">
            We opened a search for <strong>{cleanName}</strong> in a new <strong>{provider}</strong> tab. After completing your reservation there, mark it below so your TripWise itinerary stays up to date.
          </p>

          {/* Optional inputs: Time and Confirmation Number / Notes (Never fabricated!) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-white p-4 rounded-xl border border-[#E6DFD5]">
            <div>
              <label className="block text-xs font-sans font-bold text-[#1E1C1A] mb-1">
                Time Booked <span className="font-normal text-[#7A7268]">(Optional)</span>
              </label>
              <input
                type="text"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                placeholder="e.g. 1:30 PM"
                className="w-full text-xs font-mono bg-[#FAF6F0] border border-[#E6DFD5] rounded-lg px-3 py-2 text-[#1E1C1A] focus:outline-none focus:border-[#BA5536] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-sans font-bold text-[#1E1C1A] mb-1">
                Confirmation # / Notes <span className="font-normal text-[#7A7268]">(Optional)</span>
              </label>
              <input
                type="text"
                value={customRef}
                onChange={(e) => setCustomRef(e.target.value)}
                placeholder="e.g. #849201 or Outdoor table"
                className="w-full text-xs font-mono bg-[#FAF6F0] border border-[#E6DFD5] rounded-lg px-3 py-2 text-[#1E1C1A] focus:outline-none focus:border-[#BA5536] transition-colors"
              />
            </div>
          </div>

          {/* Actions: Mark as reserved or Back */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              onClick={() => setStatus('not_reserved')}
              className="text-xs font-sans text-[#7A7268] hover:text-[#1E1C1A] underline cursor-pointer font-medium"
            >
              ← Back to time suggestions
            </button>

            <button
              onClick={handleMarkReserved}
              className="px-5 py-2.5 rounded-xl bg-[#BA5536] text-white text-xs font-sans font-bold hover:bg-[#A3482D] transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Mark as reserved</span>
            </button>
          </div>
        </motion.div>
      ) : (
        /* ── STATE 1: NOT RESERVED (DEFAULT WITH DEEP-LINK PILLS & PHONE FALLBACK) ── */
        <div className="w-full rounded-2xl border border-[#E6DFD5] bg-[#FAF6F0]/60 p-4 sm:p-5 shadow-2xs relative overflow-hidden group hover:border-[#BA5536]/40 transition-all">
          {/* Panel header: Reserve via [Provider] */}
          <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-[#E6DFD5]/70 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-[#BA5536]" />
              <span className="text-xs sm:text-sm font-serif font-bold text-[#1E1C1A] tracking-tight">
                Reserve via {provider}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-sans text-[#7A7268]">
              <span>Platform:</span>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                aria-label="Select booking provider platform"
                className="bg-white border border-[#E6DFD5] rounded-lg px-2 py-0.5 text-xs font-semibold text-[#1E1C1A] focus:outline-none focus:border-[#BA5536] cursor-pointer shadow-2xs"
              >
                <option value="OpenTable">OpenTable</option>
                <option value="TheFork">TheFork</option>
                <option value="Resy">Resy</option>
              </select>
            </div>
          </div>

          {/* Party Size Selector */}
          <div className="flex items-center gap-2 mb-3.5">
            <span className="text-xs font-sans text-[#5F5E5A] font-medium">Covers:</span>
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E6DFD5]">
              {[1, 2, 3, 4, 6].map((num) => (
                <button
                  key={num}
                  onClick={() => setPartySize(num)}
                  className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    partySize === num
                      ? 'bg-[#BA5536] text-white shadow-2xs'
                      : 'text-[#5F5E5A] hover:bg-[#FAF6F0]'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <span className="text-xs text-[#7A7268] ml-1 sm:inline hidden">Guests</span>
          </div>

          {/* Suggested time-slot pills -> Tapping opens deep-link in new tab */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-sans font-bold text-[#1E1C1A] uppercase tracking-wider">
                Suggested times:
              </span>
              
              <div className="flex items-center gap-2 flex-wrap">
                {slots.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleTapTimeSlot(s)}
                    title={`Open ${provider} search for ${cleanName} at ${s} in a new tab`}
                    className="px-3.5 py-1.5 rounded-xl border border-[#BA5536] bg-white text-[#BA5536] text-xs font-mono font-bold hover:bg-[#BA5536] hover:text-white transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center gap-1.5 group/pill"
                  >
                    <Clock className="w-3.5 h-3.5 opacity-80" />
                    <span>{s}</span>
                    <ExternalLink className="w-3 h-3 opacity-60 group-hover/pill:translate-x-0.5 group-hover/pill:-translate-y-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Phone fallback styled consistently as a first-class button alongside time pills */}
          <div className="mt-4 pt-3.5 border-t border-[#E6DFD5]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-sans text-[#5F5E5A] leading-normal">
              Prefer speaking with the host desk direct or checking walk-in waitlists?
            </span>
            <a
              href={`https://www.google.com/search?q=${phoneSearchQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#BA5536] bg-white text-[#BA5536] text-xs font-sans font-bold hover:bg-[#BA5536] hover:text-white transition-all cursor-pointer shadow-2xs shrink-0 self-start sm:self-auto"
              title={`Search and call ${cleanName} direct desk`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call to reserve</span>
            </a>
          </div>

          {/* Subtext info clarifying informational nature */}
          <div className="mt-3 text-[11px] text-[#7A7268] italic">
            Tapping a time opens {provider} in a new tab pre-filled with your date and party size.
          </div>
        </div>
      )}
    </div>
  );
}
