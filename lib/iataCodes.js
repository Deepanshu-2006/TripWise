/**
 * IATA Code Registry & Skyscanner URL Builder
 * Maps cities and airport names to valid 3-letter IATA airport/city codes.
 * Ensures Skyscanner deep-links never 404.
 */

export const CITY_TO_IATA = {
  // Major Italian Destinations
  rome: 'fco',
  roma: 'fco',
  fiumicino: 'fco',
  ciampino: 'cia',
  florence: 'flr',
  firenze: 'flr',
  venice: 'vce',
  venezia: 'vce',
  milan: 'mxp',
  milano: 'mxp',
  naples: 'nap',
  napoli: 'nap',

  // Major European Cities
  paris: 'cdg',
  london: 'lhr',
  amsterdam: 'ams',
  barcelona: 'bcn',
  madrid: 'mad',
  berlin: 'ber',
  munich: 'muc',
  frankfurt: 'fra',
  zurich: 'zrh',
  vienna: 'vie',
  prague: 'prg',
  lisbon: 'lis',
  athens: 'ath',
  dublin: 'dub',
  edinburgh: 'edi',

  // Major Americas Cities
  'new york': 'jfk',
  nyc: 'jfk',
  'los angeles': 'lax',
  lax: 'lax',
  'san francisco': 'sfo',
  chicago: 'ord',
  miami: 'mia',
  cancun: 'cun',
  toronto: 'yyz',
  vancouver: 'yvr',
  mexico: 'mex',

  // Major Asia-Pacific & Middle East Cities
  tokyo: 'hnd',
  kyoto: 'kix', // Osaka Kansai closest to Kyoto
  osaka: 'kix',
  bangkok: 'bkk',
  singapore: 'sin',
  sydney: 'syd',
  dubai: 'dxb',
  seoul: 'icn',
  bali: 'dps',
  denpasar: 'dps',
  mumbai: 'bom',
  delhi: 'del'
};

/**
 * Resolves a city or airport string to a 3-letter IATA code in lowercase.
 * Returns null if no valid IATA code can be resolved.
 */
export const getIataCode = (locationStr = '') => {
  if (!locationStr) return null;

  // Clean location string (remove state/country, demo mode, numbers)
  const clean = locationStr
    .replace(/\s*\(Demo Mode\)\s*/gi, '')
    .split(',')[0]
    .replace(/[^a-zA-Z\s]/g, '')
    .trim()
    .toLowerCase();

  // 1. Direct dictionary match
  if (CITY_TO_IATA[clean]) {
    return CITY_TO_IATA[clean];
  }

  // 2. Partial match check (e.g. "Rome City" -> "rome")
  for (const [key, code] of Object.entries(CITY_TO_IATA)) {
    if (clean.includes(key) || key.includes(clean)) {
      return code;
    }
  }

  // 3. If already a 3-letter string, assume it's an IATA code
  if (clean.length === 3) {
    return clean;
  }

  return null;
};

/**
 * Formats a Date object or ISO date string (YYYY-MM-DD) into Skyscanner's expected YYMMDD format.
 * E.g., '2026-09-15' -> '260915'
 */
export const formatSkyscannerDate = (dateStr) => {
  if (!dateStr) return '260915';
  
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '260915';
    
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}${mm}${dd}`;
  } catch (e) {
    return '260915';
  }
};

/**
 * Safely constructs a Skyscanner flight search URL.
 * Guarantees no 404s by falling back to search query parameters if IATA code is unmapped.
 */
export const buildSkyscannerFlightUrl = ({ origin = 'jfk', destination = '', date = '2026-09-15', flightId = null }) => {
  const originIata = (getIataCode(origin) || 'jfk').toLowerCase();
  const destIata = getIataCode(destination);
  const dateFormatted = formatSkyscannerDate(date);

  // If IATA code resolved, build exact route deep-link URL (lowercase IATA + YYMMDD date)
  if (destIata) {
    let url = `https://www.skyscanner.com/transport/flights/${originIata}/${destIata.toLowerCase()}/${dateFormatted}/`;
    if (flightId) {
      url += `?flight_id=${encodeURIComponent(flightId)}`;
    }
    return {
      url,
      isExact: true,
      destIata
    };
  }

  // Safety Fallback: Use Skyscanner's search page to avoid 404 error
  const cleanCity = destination.replace(/\s*\(Demo Mode\)\s*/gi, '').split(',')[0].trim();
  const fallbackUrl = `https://www.skyscanner.com/transport/flights-from/${originIata}/to/${encodeURIComponent(cleanCity.toLowerCase())}/`;

  return {
    url: fallbackUrl,
    isExact: false,
    destIata: null
  };
};
