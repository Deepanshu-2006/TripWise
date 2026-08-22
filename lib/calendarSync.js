/**
 * TripWise Calendar Sync Utility
 * Generates RFC 5545-compliant .ics files from trip itinerary data.
 * Works entirely client-side — no external APIs or keys required.
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a JS Date as YYYYMMDD for all-day events */
function formatDateOnly(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/** Format a JS Date + time string (HH:MM) as YYYYMMDDTHHmmss */
function formatDateTime(date, timeStr) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  // Parse time string like "9:00 AM", "14:30", "09:00 am"
  let hours = 9, mins = 0;
  if (timeStr) {
    const cleaned = timeStr.trim().toLowerCase();
    const match = cleaned.match(/(\d+):(\d+)\s*(am|pm)?/);
    if (match) {
      hours = parseInt(match[1], 10);
      mins = parseInt(match[2], 10);
      if (match[3] === 'pm' && hours < 12) hours += 12;
      if (match[3] === 'am' && hours === 12) hours = 0;
    }
  }
  const hh = String(hours).padStart(2, '0');
  const mm = String(mins).padStart(2, '0');
  return `${y}${m}${d}T${hh}${mm}00`;
}

/** Parse duration string like "2 hrs", "90 min", "1.5 hr" → minutes */
function parseDurationMinutes(durationStr) {
  if (!durationStr) return 90;
  const lower = durationStr.toLowerCase();
  const hoursMatch = lower.match(/(\d+\.?\d*)\s*hr/);
  const minsMatch = lower.match(/(\d+)\s*min/);
  let total = 0;
  if (hoursMatch) total += Math.round(parseFloat(hoursMatch[1]) * 60);
  if (minsMatch) total += parseInt(minsMatch[1], 10);
  return total > 0 ? total : 90;
}

/** Add minutes to a formatted datetime string */
function addMinutesToDatetime(datetimeStr, minutes) {
  const y = parseInt(datetimeStr.substring(0, 4));
  const mo = parseInt(datetimeStr.substring(4, 6)) - 1;
  const d = parseInt(datetimeStr.substring(6, 8));
  const h = parseInt(datetimeStr.substring(9, 11));
  const mi = parseInt(datetimeStr.substring(11, 13));
  const date = new Date(y, mo, d, h, mi + minutes);
  return formatDateTime(date, `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`);
}

/** Fold long lines per RFC 5545 (max 75 octets, continuation with HTAB) */
function foldLine(line) {
  if (line.length <= 75) return line;
  const chunks = [];
  let remaining = line;
  while (remaining.length > 75) {
    chunks.push(remaining.substring(0, 75));
    remaining = remaining.substring(75);
  }
  if (remaining) chunks.push(remaining);
  return chunks.join('\r\n\t');
}

/** Escape special characters for ICS text fields */
function escapeICS(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

/** Generate a unique UID for calendar events */
function generateUID(seed) {
  const hash = btoa(seed + Date.now()).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
  return `${hash}@tripwise.app`;
}

// ─── ICS Generation ───────────────────────────────────────────────────────────

/**
 * Generate a complete .ics string from a TripWise itinerary object.
 *
 * @param {Object} itinerary — the full itinerary data object
 * @param {Object} options — { includeFood, includeSightseeing, includeTransport }
 * @returns {string} — RFC 5545 compliant .ics content
 */
export function generateICS(itinerary, options = {}) {
  const {
    includeFood = true,
    includeSightseeing = true,
    includeTransport = false,
  } = options;

  if (!itinerary) return '';

  const days = itinerary.days || [];
  const destination = itinerary.destination || itinerary.destinationName || 'My Trip';
  const startDateStr = itinerary.startDate; // "YYYY-MM-DD" or null

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    foldLine(`PRODID:-//TripWise//AI Travel Planner//EN`),
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    foldLine(`X-WR-CALNAME:TripWise — ${escapeICS(destination)}`),
    'X-WR-TIMEZONE:UTC',
  ];

  // ── All-day trip summary event ────────────────────────────────────────────
  if (days.length > 0) {
    const tripStart = startDateStr
      ? (() => { const [y, m, d] = startDateStr.split('-'); return new Date(+y, +m - 1, +d); })()
      : new Date();

    const tripEnd = new Date(tripStart);
    tripEnd.setDate(tripEnd.getDate() + days.length);

    lines.push('BEGIN:VEVENT');
    lines.push(foldLine(`UID:trip-summary-${generateUID(destination)}`));
    lines.push(`DTSTART;VALUE=DATE:${formatDateOnly(tripStart)}`);
    lines.push(`DTEND;VALUE=DATE:${formatDateOnly(tripEnd)}`);
    const titleText = destination === 'My Trip' ? '✈️ My Trip' : `✈️ Trip to ${destination}`;
    lines.push(foldLine(`SUMMARY:${escapeICS(titleText)}`));
    
    const tagline = itinerary.tagline ? `\\n\\n${escapeICS(itinerary.tagline)}` : '';
    const descText = `Your ${days.length}-day trip planned with TripWise AI! ✨${tagline}\\n\\nView your full interactive itinerary in the TripWise app.`;
    lines.push(foldLine(`DESCRIPTION:${descText}`));
    lines.push('TRANSP:TRANSPARENT');
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  }

  // ── Per-day, per-activity events ──────────────────────────────────────────
  days.forEach((day, dayIdx) => {
    const dayNum = day.dayNumber || dayIdx + 1;
    const dayDate = (() => {
      if (startDateStr) {
        const [y, m, d] = startDateStr.split('-');
        const date = new Date(+y, +m - 1, +d);
        date.setDate(date.getDate() + dayIdx);
        return date;
      }
      const date = new Date();
      date.setDate(date.getDate() + dayIdx);
      return date;
    })();

    const activities = day.activities || [];

    activities.forEach((act, actIdx) => {
      // Filter by category
      const categoryLower = (act.category || '').toLowerCase();
      const isFood = categoryLower.includes('dining') || categoryLower.includes('food') || categoryLower.includes('restaurant') || categoryLower.includes('cafe');
      const isTransport = categoryLower.includes('transport') || categoryLower.includes('transit') || categoryLower.includes('transfer') || categoryLower.includes('airport');

      if (isFood && !includeFood) return;
      if (isTransport && !includeTransport) return;
      if (!isFood && !isTransport && !includeSightseeing) return;

      const dtStart = formatDateTime(dayDate, act.time || act.startTime);
      const durationMins = parseDurationMinutes(act.duration || act.estimatedDuration);
      const dtEnd = addMinutesToDatetime(dtStart, durationMins);

      const categoryEmoji = isFood ? '🍽️' : isTransport ? '🚌' : '📍';
      const summary = `${categoryEmoji} ${act.title || 'Activity'} (Day ${dayNum})`;

      const descParts = [];
      if (act.description) descParts.push(act.description);
      if (act.highlights?.length) descParts.push(`Highlights: ${act.highlights.join(', ')}`);
      if (act.estimatedCost) descParts.push(`Est. Cost: ${act.estimatedCost}`);
      if (act.rating) descParts.push(`Rating: ${act.rating}⭐`);
      descParts.push('Planned with TripWise AI ✈️');

      const location = act.address || act.location || act.title || '';

      lines.push('BEGIN:VEVENT');
      lines.push(foldLine(`UID:day${dayNum}-act${actIdx}-${generateUID(act.title || '')}`));
      lines.push(`DTSTART:${dtStart}`);
      lines.push(`DTEND:${dtEnd}`);
      lines.push(foldLine(`SUMMARY:${escapeICS(summary)}`));
      if (location) lines.push(foldLine(`LOCATION:${escapeICS(location)}`));
      if (descParts.length) lines.push(foldLine(`DESCRIPTION:${escapeICS(descParts.join('\\n'))}`));
      lines.push('STATUS:CONFIRMED');
      lines.push('END:VEVENT');
    });
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Trigger a browser download of an .ics file.
 *
 * @param {string} icsContent — the ICS string from generateICS()
 * @param {string} filename — e.g. "paris-trip.ics"
 */
export function downloadICS(icsContent, filename = 'tripwise-trip.ics') {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Generate a Google Calendar "Add Event" URL for the entire trip (all-day event).
 *
 * @param {Object} itinerary
 * @returns {string} — Google Calendar URL
 */
export function getGoogleCalendarTripUrl(itinerary) {
  if (!itinerary) return 'https://calendar.google.com';

  const destination = itinerary.destination || itinerary.destinationName || 'My Trip';
  const days = itinerary.days || [];
  const startDateStr = itinerary.startDate;

  const startDate = startDateStr
    ? (() => { const [y, m, d] = startDateStr.split('-'); return new Date(+y, +m - 1, +d); })()
    : new Date();

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + Math.max(days.length, 1));

  const startFmt = formatDateOnly(startDate);
  const endFmt = formatDateOnly(endDate);

  const titleText = destination === 'My Trip' ? '✈️ My Trip' : `✈️ Trip to ${destination}`;
  const title = encodeURIComponent(titleText);
  
  const tagline = itinerary.tagline ? `\n\n${itinerary.tagline}` : '';
  const detailsText = `Your ${days.length}-day trip planned with TripWise AI! ✨${tagline}\n\nView your full interactive itinerary in the TripWise app.`;
  const details = encodeURIComponent(detailsText);
  const location = encodeURIComponent(destination !== 'My Trip' ? destination : '');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startFmt}/${endFmt}&details=${details}&location=${location}`;
}

/**
 * Get a pretty filename for the ICS download.
 */
export function getICSFilename(itinerary) {
  const dest = (itinerary?.destination || itinerary?.destinationName || 'trip')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `tripwise-${dest}.ics`;
}

/**
 * Count the total events that will be generated for a given itinerary.
 */
export function countCalendarEvents(itinerary, options = {}) {
  const { includeFood = true, includeSightseeing = true, includeTransport = false } = options;
  if (!itinerary?.days) return 0;

  let count = 1; // +1 for the summary all-day event
  itinerary.days.forEach(day => {
    (day.activities || []).forEach(act => {
      const cat = (act.category || '').toLowerCase();
      const isFood = cat.includes('dining') || cat.includes('food') || cat.includes('restaurant') || cat.includes('cafe');
      const isTransport = cat.includes('transport') || cat.includes('transit') || cat.includes('transfer');
      if (isFood && !includeFood) return;
      if (isTransport && !includeTransport) return;
      if (!isFood && !isTransport && !includeSightseeing) return;
      count++;
    });
  });
  return count;
}
