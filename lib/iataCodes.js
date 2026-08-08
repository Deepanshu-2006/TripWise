/**
 * IATA Code Registry & Skyscanner URL Builder
 * Maps cities and airport names to valid 3-letter IATA airport/city codes.
 * Ensures Skyscanner deep-links never 404.
 */

export const GLOBAL_AIRPORTS = [
  // India & South Asia
  { code: 'DEL', name: 'Indira Gandhi International Airport', city: 'New Delhi', country: 'India', flag: '🇮🇳', aliases: ['igi', 'delhi', 'new delhi', 'del', 'palam'] },
  { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International', city: 'Mumbai', country: 'India', flag: '🇮🇳', aliases: ['mumbai', 'bombay', 'csia', 'bom', 'sahar'] },
  { code: 'BLR', name: 'Kempegowda International Airport', city: 'Bengaluru', country: 'India', flag: '🇮🇳', aliases: ['bangalore', 'bengaluru', 'kempegowda', 'blr'] },
  { code: 'MAA', name: 'Chennai International Airport', city: 'Chennai', country: 'India', flag: '🇮🇳', aliases: ['chennai', 'madras', 'maa', 'meenambakkam'] },
  { code: 'CCU', name: 'Netaji Subhash Chandra Bose International', city: 'Kolkata', country: 'India', flag: '🇮🇳', aliases: ['kolkata', 'calcutta', 'ccu', 'dum dum'] },
  { code: 'HYD', name: 'Rajiv Gandhi International Airport', city: 'Hyderabad', country: 'India', flag: '🇮🇳', aliases: ['hyderabad', 'rgia', 'hyd', 'shamshabad'] },
  { code: 'COK', name: 'Cochin International Airport', city: 'Kochi', country: 'India', flag: '🇮🇳', aliases: ['kochi', 'cochin', 'cok', 'nedumbassery'] },
  { code: 'AMD', name: 'Sardar Vallabhbhai Patel International', city: 'Ahmedabad', country: 'India', flag: '🇮🇳', aliases: ['ahmedabad', 'amd', 'gujarat'] },
  { code: 'GOI', name: 'Dabolim Airport / Goa', city: 'Goa', country: 'India', flag: '🇮🇳', aliases: ['goa', 'dabolim', 'goi', 'gox', 'mopa'] },
  { code: 'PNQ', name: 'Pune Airport', city: 'Pune', country: 'India', flag: '🇮🇳', aliases: ['pune', 'pnq', 'lohegaon'] },
  { code: 'JAI', name: 'Jaipur International Airport', city: 'Jaipur', country: 'India', flag: '🇮🇳', aliases: ['jaipur', 'jai', 'sanganer'] },
  { code: 'TRV', name: 'Trivandrum International Airport', city: 'Thiruvananthapuram', country: 'India', flag: '🇮🇳', aliases: ['trivandrum', 'thiruvananthapuram', 'trv'] },
  { code: 'CMB', name: 'Bandaranaike International Airport', city: 'Colombo', country: 'Sri Lanka', flag: '🇱🇰', aliases: ['colombo', 'cmb', 'katunayake'] },
  { code: 'KTM', name: 'Tribhuvan International Airport', city: 'Kathmandu', country: 'Nepal', flag: '🇳🇵', aliases: ['kathmandu', 'ktm', 'nepal'] },
  { code: 'DAC', name: 'Hazrat Shahjalal International', city: 'Dhaka', country: 'Bangladesh', flag: '🇧🇩', aliases: ['dhaka', 'dac', 'bangladesh'] },

  // Middle East
  { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'United Arab Emirates', flag: '🇦🇪', aliases: ['dubai', 'dxb', 'uae'] },
  { code: 'AUH', name: 'Zayed International Airport', city: 'Abu Dhabi', country: 'United Arab Emirates', flag: '🇦🇪', aliases: ['abu dhabi', 'auh', 'zayed'] },
  { code: 'DOH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar', flag: '🇶🇦', aliases: ['doha', 'doh', 'hamad', 'qatar'] },
  { code: 'RUH', name: 'King Khalid International Airport', city: 'Riyadh', country: 'Saudi Arabia', flag: '🇸🇦', aliases: ['riyadh', 'ruh', 'saudi'] },
  { code: 'JED', name: 'King Abdulaziz International Airport', city: 'Jeddah', country: 'Saudi Arabia', flag: '🇸🇦', aliases: ['jeddah', 'jed', 'mecca'] },
  { code: 'MCT', name: 'Muscat International Airport', city: 'Muscat', country: 'Oman', flag: '🇴🇲', aliases: ['muscat', 'mct', 'oman'] },
  { code: 'BAH', name: 'Bahrain International Airport', city: 'Manama', country: 'Bahrain', flag: '🇧🇭', aliases: ['bahrain', 'bah', 'manama'] },
  { code: 'KWI', name: 'Kuwait International Airport', city: 'Kuwait City', country: 'Kuwait', flag: '🇰🇼', aliases: ['kuwait', 'kwi'] },
  { code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey', flag: '🇹🇷', aliases: ['istanbul', 'ist', 'turkey', 'turkiye'] },
  { code: 'SAW', name: 'Sabiha Gökçen International', city: 'Istanbul', country: 'Turkey', flag: '🇹🇷', aliases: ['sabiha', 'saw', 'istanbul asian'] },

  // United States & North America
  { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'United States', flag: '🇺🇸', aliases: ['jfk', 'new york', 'nyc', 'kennedy', 'queens'] },
  { code: 'EWR', name: 'Newark Liberty International', city: 'Newark/NYC', country: 'United States', flag: '🇺🇸', aliases: ['ewr', 'newark', 'new jersey'] },
  { code: 'LGA', name: 'LaGuardia Airport', city: 'New York', country: 'United States', flag: '🇺🇸', aliases: ['lga', 'laguardia', 'new york'] },
  { code: 'SFO', name: 'San Francisco International', city: 'San Francisco', country: 'United States', flag: '🇺🇸', aliases: ['sfo', 'san francisco', 'bay area', 'california'] },
  { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'United States', flag: '🇺🇸', aliases: ['lax', 'los angeles', 'la', 'hollywood'] },
  { code: 'ORD', name: "O'Hare International Airport", city: 'Chicago', country: 'United States', flag: '🇺🇸', aliases: ['ord', 'chicago', "o'hare", 'ohare', 'illinois'] },
  { code: 'MIA', name: 'Miami International Airport', city: 'Miami', country: 'United States', flag: '🇺🇸', aliases: ['mia', 'miami', 'florida', 'south beach'] },
  { code: 'SEA', name: 'Seattle-Tacoma International', city: 'Seattle', country: 'United States', flag: '🇺🇸', aliases: ['sea', 'seattle', 'seatac', 'washington'] },
  { code: 'BOS', name: 'Logan International Airport', city: 'Boston', country: 'United States', flag: '🇺🇸', aliases: ['bos', 'boston', 'logan', 'massachusetts'] },
  { code: 'ATL', name: 'Hartsfield-Jackson Atlanta', city: 'Atlanta', country: 'United States', flag: '🇺🇸', aliases: ['atl', 'atlanta', 'hartsfield', 'georgia'] },
  { code: 'DFW', name: 'Dallas/Fort Worth International', city: 'Dallas', country: 'United States', flag: '🇺🇸', aliases: ['dfw', 'dallas', 'fort worth', 'texas'] },
  { code: 'IAH', name: 'George Bush Intercontinental', city: 'Houston', country: 'United States', flag: '🇺🇸', aliases: ['iah', 'houston', 'texas'] },
  { code: 'DEN', name: 'Denver International Airport', city: 'Denver', country: 'United States', flag: '🇺🇸', aliases: ['den', 'denver', 'colorado'] },
  { code: 'LAS', name: 'Harry Reid International', city: 'Las Vegas', country: 'United States', flag: '🇺🇸', aliases: ['las', 'las vegas', 'vegas', 'nevada'] },
  { code: 'YYZ', name: 'Toronto Pearson International', city: 'Toronto', country: 'Canada', flag: '🇨🇦', aliases: ['yyz', 'toronto', 'pearson', 'ontario', 'canada'] },
  { code: 'YVR', name: 'Vancouver International Airport', city: 'Vancouver', country: 'Canada', flag: '🇨🇦', aliases: ['yvr', 'vancouver', 'bc', 'canada'] },
  { code: 'YUL', name: 'Montréal-Trudeau International', city: 'Montreal', country: 'Canada', flag: '🇨🇦', aliases: ['yul', 'montreal', 'quebec', 'canada'] },
  { code: 'MEX', name: 'Benito Juárez International', city: 'Mexico City', country: 'Mexico', flag: '🇲🇽', aliases: ['mex', 'mexico city', 'cdmx', 'mexico'] },
  { code: 'CUN', name: 'Cancún International Airport', city: 'Cancún', country: 'Mexico', flag: '🇲🇽', aliases: ['cun', 'cancun', 'riviera maya', 'mexico'] },

  // Europe & UK
  { code: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom', flag: '🇬🇧', aliases: ['lhr', 'london', 'heathrow', 'uk', 'england'] },
  { code: 'LGW', name: 'London Gatwick Airport', city: 'London', country: 'United Kingdom', flag: '🇬🇧', aliases: ['lgw', 'gatwick', 'london'] },
  { code: 'STN', name: 'London Stansted Airport', city: 'London', country: 'United Kingdom', flag: '🇬🇧', aliases: ['stn', 'stansted', 'london'] },
  { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France', flag: '🇫🇷', aliases: ['cdg', 'paris', 'charles de gaulle', 'roissy', 'france'] },
  { code: 'ORY', name: 'Paris Orly Airport', city: 'Paris', country: 'France', flag: '🇫🇷', aliases: ['ory', 'orly', 'paris'] },
  { code: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands', flag: '🇳🇱', aliases: ['ams', 'amsterdam', 'schiphol', 'netherlands', 'holland'] },
  { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', flag: '🇩🇪', aliases: ['fra', 'frankfurt', 'germany', 'deutschland'] },
  { code: 'MUC', name: 'Munich Airport', city: 'Munich', country: 'Germany', flag: '🇩🇪', aliases: ['muc', 'munich', 'bayern', 'germany'] },
  { code: 'BER', name: 'Berlin Brandenburg Airport', city: 'Berlin', country: 'Germany', flag: '🇩🇪', aliases: ['ber', 'berlin', 'brandenburg', 'germany'] },
  { code: 'FCO', name: 'Leonardo da Vinci–Fiumicino', city: 'Rome', country: 'Italy', flag: '🇮🇹', aliases: ['fco', 'rome', 'roma', 'fiumicino', 'italy', 'italia'] },
  { code: 'MXP', name: 'Milan Malpensa Airport', city: 'Milan', country: 'Italy', flag: '🇮🇹', aliases: ['mxp', 'milan', 'milano', 'malpensa', 'italy'] },
  { code: 'MAD', name: 'Adolfo Suárez Madrid–Barajas', city: 'Madrid', country: 'Spain', flag: '🇪🇸', aliases: ['mad', 'madrid', 'barajas', 'spain', 'espana'] },
  { code: 'BCN', name: 'Josep Tarradellas Barcelona-El Prat', city: 'Barcelona', country: 'Spain', flag: '🇪🇸', aliases: ['bcn', 'barcelona', 'el prat', 'catalonia', 'spain'] },
  { code: 'ZRH', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland', flag: '🇨🇭', aliases: ['zrh', 'zurich', 'kloten', 'switzerland', 'swiss'] },
  { code: 'VIE', name: 'Vienna International Airport', city: 'Vienna', country: 'Austria', flag: '🇦🇹', aliases: ['vie', 'vienna', 'schwechat', 'austria'] },
  { code: 'DUB', name: 'Dublin Airport', city: 'Dublin', country: 'Ireland', flag: '🇮🇪', aliases: ['dub', 'dublin', 'ireland'] },
  { code: 'LIS', name: 'Humberto Delgado Airport', city: 'Lisbon', country: 'Portugal', flag: '🇵🇹', aliases: ['lis', 'lisbon', 'lisboa', 'portugal'] },
  { code: 'ATH', name: 'Athens International Airport', city: 'Athens', country: 'Greece', flag: '🇬🇷', aliases: ['ath', 'athens', 'eleftherios venizelos', 'greece'] },
  { code: 'CPH', name: 'Copenhagen Airport', city: 'Copenhagen', country: 'Denmark', flag: '🇩🇰', aliases: ['cph', 'copenhagen', 'kastrup', 'denmark'] },
  { code: 'ARN', name: 'Stockholm Arlanda Airport', city: 'Stockholm', country: 'Sweden', flag: '🇸🇪', aliases: ['arn', 'stockholm', 'arlanda', 'sweden'] },
  { code: 'OSL', name: 'Oslo Airport, Gardermoen', city: 'Oslo', country: 'Norway', flag: '🇳🇴', aliases: ['osl', 'oslo', 'gardermoen', 'norway'] },
  { code: 'HEL', name: 'Helsinki-Vantaa Airport', city: 'Helsinki', country: 'Finland', flag: '🇫🇮', aliases: ['hel', 'helsinki', 'vantaa', 'finland'] },
  { code: 'PRG', name: 'Václav Havel Airport Prague', city: 'Prague', country: 'Czech Republic', flag: '🇨🇿', aliases: ['prg', 'prague', 'czech'] },
  { code: 'WAW', name: 'Warsaw Chopin Airport', city: 'Warsaw', country: 'Poland', flag: '🇵🇱', aliases: ['waw', 'warsaw', 'chopin', 'poland'] },
  { code: 'BUD', name: 'Budapest Ferenc Liszt', city: 'Budapest', country: 'Hungary', flag: '🇭🇺', aliases: ['bud', 'budapest', 'hungary'] },

  // Asia-Pacific
  { code: 'HND', name: 'Tokyo Haneda Airport', city: 'Tokyo', country: 'Japan', flag: '🇯🇵', aliases: ['hnd', 'tokyo', 'haneda', 'japan'] },
  { code: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan', flag: '🇯🇵', aliases: ['nrt', 'narita', 'tokyo international'] },
  { code: 'KIX', name: 'Kansai International Airport', city: 'Osaka/Kyoto', country: 'Japan', flag: '🇯🇵', aliases: ['kix', 'osaka', 'kyoto', 'kansai', 'japan'] },
  { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore', flag: '🇸🇬', aliases: ['sin', 'singapore', 'changi'] },
  { code: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand', flag: '🇹🇭', aliases: ['bkk', 'bangkok', 'suvarnabhumi', 'thailand'] },
  { code: 'DMK', name: 'Don Mueang International', city: 'Bangkok', country: 'Thailand', flag: '🇹🇭', aliases: ['dmk', 'don mueang', 'bangkok domestic'] },
  { code: 'HKG', name: 'Hong Kong International', city: 'Hong Kong', country: 'Hong Kong', flag: '🇭🇰', aliases: ['hkg', 'hong kong', 'chek lap kok'] },
  { code: 'ICN', name: 'Incheon International Airport', city: 'Seoul', country: 'South Korea', flag: '🇰🇷', aliases: ['icn', 'seoul', 'incheon', 'korea'] },
  { code: 'KUL', name: 'Kuala Lumpur International', city: 'Kuala Lumpur', country: 'Malaysia', flag: '🇲🇾', aliases: ['kul', 'kuala lumpur', 'klia', 'malaysia'] },
  { code: 'DPS', name: 'Ngurah Rai International', city: 'Bali', country: 'Indonesia', flag: '🇮🇩', aliases: ['dps', 'bali', 'denpasar', 'indonesia'] },
  { code: 'CGK', name: 'Soekarno–Hatta International', city: 'Jakarta', country: 'Indonesia', flag: '🇮🇩', aliases: ['cgk', 'jakarta', 'soekarno', 'indonesia'] },
  { code: 'MNL', name: 'Ninoy Aquino International', city: 'Manila', country: 'Philippines', flag: '🇵🇭', aliases: ['mnl', 'manila', 'ninoy aquino', 'philippines'] },
  { code: 'SYD', name: 'Sydney Kingsford Smith', city: 'Sydney', country: 'Australia', flag: '🇦🇺', aliases: ['syd', 'sydney', 'australia', 'nsw'] },
  { code: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia', flag: '🇦🇺', aliases: ['mel', 'melbourne', 'tullamarine', 'australia'] },
  { code: 'BNE', name: 'Brisbane Airport', city: 'Brisbane', country: 'Australia', flag: '🇦🇺', aliases: ['bne', 'brisbane', 'queensland', 'australia'] },
  { code: 'AKL', name: 'Auckland Airport', city: 'Auckland', country: 'New Zealand', flag: '🇳🇿', aliases: ['akl', 'auckland', 'new zealand'] },
  { code: 'PVG', name: 'Shanghai Pudong International', city: 'Shanghai', country: 'China', flag: '🇨🇳', aliases: ['pvg', 'shanghai', 'pudong', 'china'] },
  { code: 'PEK', name: 'Beijing Capital International', city: 'Beijing', country: 'China', flag: '🇨🇳', aliases: ['pek', 'beijing', 'capital', 'china'] },
  { code: 'PKX', name: 'Beijing Daxing International', city: 'Beijing', country: 'China', flag: '🇨🇳', aliases: ['pkx', 'daxing', 'beijing new'] },
  { code: 'TPE', name: 'Taiwan Taoyuan International', city: 'Taipei', country: 'Taiwan', flag: '🇹🇼', aliases: ['tpe', 'taipei', 'taoyuan', 'taiwan'] },
  { code: 'SGN', name: 'Tan Son Nhat International', city: 'Ho Chi Minh City', country: 'Vietnam', flag: '🇻🇳', aliases: ['sgn', 'saigon', 'ho chi minh', 'vietnam'] },
  { code: 'HAN', name: 'Noi Bai International', city: 'Hanoi', country: 'Vietnam', flag: '🇻🇳', aliases: ['han', 'hanoi', 'noi bai', 'vietnam'] },

  // South America & Africa
  { code: 'GRU', name: 'São Paulo/Guarulhos International', city: 'São Paulo', country: 'Brazil', flag: '🇧🇷', aliases: ['gru', 'sao paulo', 'guarulhos', 'brazil'] },
  { code: 'GIG', name: 'Rio de Janeiro/Galeão', city: 'Rio de Janeiro', country: 'Brazil', flag: '🇧🇷', aliases: ['gig', 'rio', 'rio de janeiro', 'galeao'] },
  { code: 'EZE', name: 'Ministro Pistarini (Ezeiza)', city: 'Buenos Aires', country: 'Argentina', flag: '🇦🇷', aliases: ['eze', 'buenos aires', 'ezeiza', 'argentina'] },
  { code: 'BOG', name: 'El Dorado International', city: 'Bogotá', country: 'Colombia', flag: '🇨🇴', aliases: ['bog', 'bogota', 'el dorado', 'colombia'] },
  { code: 'LIM', name: 'Jorge Chávez International', city: 'Lima', country: 'Peru', flag: '🇵🇪', aliases: ['lim', 'lima', 'peru'] },
  { code: 'SCL', name: 'Arturo Merino Benítez', city: 'Santiago', country: 'Chile', flag: '🇨🇱', aliases: ['scl', 'santiago', 'chile'] },
  { code: 'JNB', name: 'O.R. Tambo International', city: 'Johannesburg', country: 'South Africa', flag: '🇿🇦', aliases: ['jnb', 'johannesburg', 'or tambo', 'south africa'] },
  { code: 'CPT', name: 'Cape Town International', city: 'Cape Town', country: 'South Africa', flag: '🇿🇦', aliases: ['cpt', 'cape town', 'south africa'] },
  { code: 'CAI', name: 'Cairo International Airport', city: 'Cairo', country: 'Egypt', flag: '🇪🇬', aliases: ['cai', 'cairo', 'egypt'] },
  { code: 'NBO', name: 'Jomo Kenyatta International', city: 'Nairobi', country: 'Kenya', flag: '🇰🇪', aliases: ['nbo', 'nairobi', 'kenya'] },
  { code: 'CMN', name: 'Mohammed V International', city: 'Casablanca', country: 'Morocco', flag: '🇲🇦', aliases: ['cmn', 'casablanca', 'morocco'] },
  { code: 'RAK', name: 'Marrakesh Menara Airport', city: 'Marrakech', country: 'Morocco', flag: '🇲🇦', aliases: ['rak', 'marrakech', 'marrakesh', 'morocco'] }
];

/**
 * Universal airport search & resolver function.
 * Matches code, name, city, country, or aliases (e.g. 'IGI' -> DEL, 'Heathrow' -> LHR).
 */
export const lookupAirports = (query = '', limit = 8) => {
  if (!query || typeof query !== 'string') return GLOBAL_AIRPORTS.slice(0, limit);

  const clean = query.trim().toLowerCase();
  if (!clean) return GLOBAL_AIRPORTS.slice(0, limit);

  // Exact code match prioritized
  const exactCode = GLOBAL_AIRPORTS.find(a => a.code.toLowerCase() === clean);
  if (exactCode) {
    const others = GLOBAL_AIRPORTS.filter(a => a.code.toLowerCase() !== clean && (
      a.city.toLowerCase().includes(clean) ||
      a.country.toLowerCase().includes(clean) ||
      a.name.toLowerCase().includes(clean) ||
      a.aliases.some(alias => alias.includes(clean))
    ));
    return [exactCode, ...others].slice(0, limit);
  }

  // Exact alias match prioritized (e.g. 'igi' -> DEL)
  const exactAlias = GLOBAL_AIRPORTS.find(a => a.aliases.includes(clean));
  if (exactAlias) {
    const others = GLOBAL_AIRPORTS.filter(a => a.code !== exactAlias.code && (
      a.code.toLowerCase().includes(clean) ||
      a.city.toLowerCase().includes(clean) ||
      a.country.toLowerCase().includes(clean) ||
      a.name.toLowerCase().includes(clean) ||
      a.aliases.some(alias => alias.includes(clean))
    ));
    return [exactAlias, ...others].slice(0, limit);
  }

  // Fuzzy matches
  const matches = GLOBAL_AIRPORTS.filter(a => {
    return (
      a.code.toLowerCase().startsWith(clean) ||
      a.city.toLowerCase().includes(clean) ||
      a.name.toLowerCase().includes(clean) ||
      a.country.toLowerCase().includes(clean) ||
      a.aliases.some(alias => alias.includes(clean))
    );
  });

  return matches.slice(0, limit);
};

/**
 * Resolves any airport code, alias, or city to its full airport metadata object.
 */
export const getAirportDetails = (query = '') => {
  if (!query || typeof query !== 'string') return null;
  const clean = query.trim().toLowerCase();

  // 1. Direct code
  const byCode = GLOBAL_AIRPORTS.find(a => a.code.toLowerCase() === clean);
  if (byCode) return byCode;

  // 2. Exact alias (e.g. IGI -> DEL, Heathrow -> LHR)
  const byAlias = GLOBAL_AIRPORTS.find(a => a.aliases.includes(clean));
  if (byAlias) return byAlias;

  // 3. Partial alias or city match
  const byCity = GLOBAL_AIRPORTS.find(a => a.city.toLowerCase().includes(clean) || a.aliases.some(al => al.includes(clean)));
  if (byCity) return byCity;

  return null;
};

export const CITY_TO_IATA = {
  // Built from global airports
  ...GLOBAL_AIRPORTS.reduce((acc, a) => {
    acc[a.city.toLowerCase()] = a.code.toLowerCase();
    acc[a.code.toLowerCase()] = a.code.toLowerCase();
    a.aliases.forEach(alias => {
      acc[alias.toLowerCase()] = a.code.toLowerCase();
    });
    return acc;
  }, {})
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
export const buildSkyscannerFlightUrl = ({ origin = 'jfk', destination = '', date = '2026-09-15', stops = null }) => {
  const originIata = (getIataCode(origin) || 'jfk').toLowerCase();
  const destIata = getIataCode(destination);
  const dateFormatted = formatSkyscannerDate(date);

  // Build clean Skyscanner route search URL (lowercase IATA + YYMMDD date)
  if (destIata) {
    let url = `https://www.skyscanner.com/transport/flights/${originIata}/${destIata.toLowerCase()}/${dateFormatted}/`;
    const queryParams = [];
    if (stops === 0) queryParams.push('stops=direct');
    else if (stops === 1) queryParams.push('stops=1-stop');
    queryParams.push('sort=price');

    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }

    return {
      url,
      isExact: true,
      destIata
    };
  }

  // Safety Fallback for unmapped destinations
  const cleanCity = destination.replace(/\s*\(Demo Mode\)\s*/gi, '').split(',')[0].trim();
  const fallbackUrl = `https://www.skyscanner.com/transport/flights-from/${originIata}/to/${encodeURIComponent(cleanCity.toLowerCase())}/`;

  return {
    url: fallbackUrl,
    isExact: false,
    destIata: null
  };
};
