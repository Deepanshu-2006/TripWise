/**
 * IATA Code Registry & Skyscanner URL Builder
 * Maps cities and airport names to valid 3-letter IATA airport/city codes.
 * Ensures Skyscanner deep-links never 404.
 */

export const GLOBAL_AIRPORTS = [
  // India & South Asia (Comprehensive Hubs)
  { code: 'DEL', name: 'Indira Gandhi International Airport', city: 'New Delhi', country: 'India', flag: '🇮🇳', region: 'India', aliases: ['igi', 'delhi', 'new delhi', 'del', 'palam', 'ncr'] },
  { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International', city: 'Mumbai', country: 'India', flag: '🇮🇳', region: 'India', aliases: ['mumbai', 'bombay', 'csia', 'bom', 'sahar', 'santa cruz'] },
  { code: 'BLR', name: 'Kempegowda International Airport', city: 'Bengaluru', country: 'India', flag: '🇮🇳', region: 'India', aliases: ['bangalore', 'bengaluru', 'kempegowda', 'blr', 'kial'] },
  { code: 'MAA', name: 'Chennai International Airport', city: 'Chennai', country: 'India', flag: '🇮🇳', region: 'India', aliases: ['chennai', 'madras', 'maa', 'meenambakkam'] },
  { code: 'CCU', name: 'Netaji Subhash Chandra Bose International', city: 'Kolkata', country: 'India', flag: '🇮🇳', region: 'India', aliases: ['kolkata', 'calcutta', 'ccu', 'dum dum'] },
  { code: 'HYD', name: 'Rajiv Gandhi International Airport', city: 'Hyderabad', country: 'India', flag: '🇮🇳', region: 'India', aliases: ['hyderabad', 'rgia', 'hyd', 'shamshabad', 'secunderabad'] },
  { code: 'COK', name: 'Cochin International Airport', city: 'Kochi', country: 'India', flag: '🇮🇳', region: 'India', aliases: ['kochi', 'cochin', 'cok', 'nedumbassery', 'kerala'] },
  { code: 'AMD', name: 'Sardar Vallabhbhai Patel International', city: 'Ahmedabad', country: 'India', flag: '🇮🇳', region: 'India', aliases: ['ahmedabad', 'amd', 'gujarat'] },
  { code: 'GOI', name: 'Dabolim Airport / Goa', city: 'Goa', country: 'India', flag: '🇮🇳', region: 'India', aliases: ['goa', 'dabolim', 'goi', 'gox', 'mopa', 'north goa', 'south goa'] },
  { code: 'PNQ', name: 'Pune International Airport', city: 'Pune', country: 'India', flag: '🇮🇳', region: 'India', aliases: ['pune', 'pnq', 'lohegaon'] },
  { code: 'JAI', name: 'Jaipur International Airport', city: 'Jaipur', country: 'India', flag: '🇮🇳', region: 'India', aliases: ['jaipur', 'jai', 'sanganer', 'rajasthan', 'pink city'] },
  { code: 'LKO', name: 'Chaudhary Charan Singh International', city: 'Lucknow', country: 'India', flag: '🇮🇳', region: 'India', aliases: ['lucknow', 'lko', 'amausi', 'uttar pradesh'] },
  { code: 'IXC', name: 'Shaheed Bhagat Singh International', city: 'Chandigarh', country: 'India', flag: '🇮🇳', region: 'India', aliases: ['chandigarh', 'ixc', 'mohali', 'punjab', 'haryana'] },
  { code: 'ATQ', name: 'Sri Guru Ram Dass Jee International', city: 'Amritsar', country: 'India', flag: '🇮🇳', region: 'India', aliases: ['amritsar', 'atq', 'punjab', 'golden temple'] },
  { code: 'SXR', name: 'Sheikh ul-Alam International', city: 'Srinagar', country: 'India', flag: '🇮🇳', region: 'India', aliases: ['srinagar', 'sxr', 'kashmir'] },
  { code: 'GAU', name: 'Lokpriya Gopinath Bordoloi International', city: 'Guwahati', country: 'India', flag: '🇮🇳', region: 'India', aliases: ['guwahati', 'gau', 'assam', 'northeast'] },
  { code: 'TRV', name: 'Trivandrum International Airport', city: 'Thiruvananthapuram', country: 'India', flag: '🇮🇳', region: 'India', aliases: ['trivandrum', 'thiruvananthapuram', 'trv', 'kerala'] },
  { code: 'VTZ', name: 'Visakhapatnam Airport', city: 'Visakhapatnam', country: 'India', flag: '🇮🇳', region: 'India', aliases: ['visakhapatnam', 'vizag', 'vtz', 'andhra'] },
  { code: 'IDR', name: 'Devi Ahilyabai Holkar Airport', city: 'Indore', country: 'India', flag: '🇮🇳', region: 'India', aliases: ['indore', 'idr', 'madhya pradesh'] },
  { code: 'VNS', name: 'Lal Bahadur Shastri International', city: 'Varanasi', country: 'India', flag: '🇮🇳', region: 'India', aliases: ['varanasi', 'banaras', 'kashi', 'vns', 'babatpur'] },
  { code: 'PAT', name: 'Jay Prakash Narayan Airport', city: 'Patna', country: 'India', flag: '🇮🇳', region: 'India', aliases: ['patna', 'pat', 'bihar'] },
  { code: 'BBI', name: 'Biju Patnaik International', city: 'Bhubaneswar', country: 'India', flag: '🇮🇳', region: 'India', aliases: ['bhubaneswar', 'bbi', 'odisha'] },
  { code: 'CMB', name: 'Bandaranaike International Airport', city: 'Colombo', country: 'Sri Lanka', flag: '🇱🇰', region: 'Asia', aliases: ['colombo', 'cmb', 'katunayake', 'sri lanka'] },
  { code: 'KTM', name: 'Tribhuvan International Airport', city: 'Kathmandu', country: 'Nepal', flag: '🇳🇵', region: 'Asia', aliases: ['kathmandu', 'ktm', 'nepal', 'himalayas'] },
  { code: 'DAC', name: 'Hazrat Shahjalal International', city: 'Dhaka', country: 'Bangladesh', flag: '🇧🇩', region: 'Asia', aliases: ['dhaka', 'dac', 'bangladesh'] },

  // Middle East
  { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'United Arab Emirates', flag: '🇦🇪', region: 'Middle East', aliases: ['dubai', 'dxb', 'uae', 'emirates'] },
  { code: 'AUH', name: 'Zayed International Airport', city: 'Abu Dhabi', country: 'United Arab Emirates', flag: '🇦🇪', region: 'Middle East', aliases: ['abu dhabi', 'auh', 'zayed', 'uae', 'etihad'] },
  { code: 'DOH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar', flag: '🇶🇦', region: 'Middle East', aliases: ['doha', 'doh', 'hamad', 'qatar', 'qatar airways'] },
  { code: 'RUH', name: 'King Khalid International Airport', city: 'Riyadh', country: 'Saudi Arabia', flag: '🇸🇦', region: 'Middle East', aliases: ['riyadh', 'ruh', 'saudi', 'saudia'] },
  { code: 'JED', name: 'King Abdulaziz International Airport', city: 'Jeddah', country: 'Saudi Arabia', flag: '🇸🇦', region: 'Middle East', aliases: ['jeddah', 'jed', 'mecca', 'makkah', 'saudi'] },
  { code: 'MCT', name: 'Muscat International Airport', city: 'Muscat', country: 'Oman', flag: '🇴🇲', region: 'Middle East', aliases: ['muscat', 'mct', 'oman'] },
  { code: 'BAH', name: 'Bahrain International Airport', city: 'Manama', country: 'Bahrain', flag: '🇧🇭', region: 'Middle East', aliases: ['bahrain', 'bah', 'manama'] },
  { code: 'KWI', name: 'Kuwait International Airport', city: 'Kuwait City', country: 'Kuwait', flag: '🇰🇼', region: 'Middle East', aliases: ['kuwait', 'kwi'] },
  { code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey', flag: '🇹🇷', region: 'Europe', aliases: ['istanbul', 'ist', 'turkey', 'turkiye', 'turkish'] },
  { code: 'SAW', name: 'Sabiha Gökçen International', city: 'Istanbul', country: 'Turkey', flag: '🇹🇷', region: 'Europe', aliases: ['sabiha', 'saw', 'istanbul asian'] },

  // United States & North America
  { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'United States', flag: '🇺🇸', region: 'Americas', aliases: ['jfk', 'new york', 'nyc', 'kennedy', 'queens', 'ny'] },
  { code: 'EWR', name: 'Newark Liberty International', city: 'Newark/NYC', country: 'United States', flag: '🇺🇸', region: 'Americas', aliases: ['ewr', 'newark', 'new jersey', 'nyc'] },
  { code: 'LGA', name: 'LaGuardia Airport', city: 'New York', country: 'United States', flag: '🇺🇸', region: 'Americas', aliases: ['lga', 'laguardia', 'new york', 'nyc'] },
  { code: 'SFO', name: 'San Francisco International', city: 'San Francisco', country: 'United States', flag: '🇺🇸', region: 'Americas', aliases: ['sfo', 'san francisco', 'bay area', 'california', 'silicon valley'] },
  { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'United States', flag: '🇺🇸', region: 'Americas', aliases: ['lax', 'los angeles', 'la', 'hollywood', 'california'] },
  { code: 'ORD', name: "O'Hare International Airport", city: 'Chicago', country: 'United States', flag: '🇺🇸', region: 'Americas', aliases: ['ord', 'chicago', "o'hare", 'ohare', 'illinois'] },
  { code: 'MIA', name: 'Miami International Airport', city: 'Miami', country: 'United States', flag: '🇺🇸', region: 'Americas', aliases: ['mia', 'miami', 'florida', 'south beach'] },
  { code: 'SEA', name: 'Seattle-Tacoma International', city: 'Seattle', country: 'United States', flag: '🇺🇸', region: 'Americas', aliases: ['sea', 'seattle', 'seatac', 'washington'] },
  { code: 'BOS', name: 'Logan International Airport', city: 'Boston', country: 'United States', flag: '🇺🇸', region: 'Americas', aliases: ['bos', 'boston', 'logan', 'massachusetts'] },
  { code: 'ATL', name: 'Hartsfield-Jackson Atlanta', city: 'Atlanta', country: 'United States', flag: '🇺🇸', region: 'Americas', aliases: ['atl', 'atlanta', 'hartsfield', 'georgia'] },
  { code: 'DFW', name: 'Dallas/Fort Worth International', city: 'Dallas', country: 'United States', flag: '🇺🇸', region: 'Americas', aliases: ['dfw', 'dallas', 'fort worth', 'texas'] },
  { code: 'IAH', name: 'George Bush Intercontinental', city: 'Houston', country: 'United States', flag: '🇺🇸', region: 'Americas', aliases: ['iah', 'houston', 'texas'] },
  { code: 'DEN', name: 'Denver International Airport', city: 'Denver', country: 'United States', flag: '🇺🇸', region: 'Americas', aliases: ['den', 'denver', 'colorado'] },
  { code: 'LAS', name: 'Harry Reid International', city: 'Las Vegas', country: 'United States', flag: '🇺🇸', region: 'Americas', aliases: ['las', 'las vegas', 'vegas', 'nevada'] },
  { code: 'YYZ', name: 'Toronto Pearson International', city: 'Toronto', country: 'Canada', flag: '🇨🇦', region: 'Americas', aliases: ['yyz', 'toronto', 'pearson', 'ontario', 'canada'] },
  { code: 'YVR', name: 'Vancouver International Airport', city: 'Vancouver', country: 'Canada', flag: '🇨🇦', region: 'Americas', aliases: ['yvr', 'vancouver', 'bc', 'canada'] },
  { code: 'YUL', name: 'Montréal-Trudeau International', city: 'Montreal', country: 'Canada', flag: '🇨🇦', region: 'Americas', aliases: ['yul', 'montreal', 'quebec', 'canada'] },
  { code: 'MEX', name: 'Benito Juárez International', city: 'Mexico City', country: 'Mexico', flag: '🇲🇽', region: 'Americas', aliases: ['mex', 'mexico city', 'cdmx', 'mexico'] },
  { code: 'CUN', name: 'Cancún International Airport', city: 'Cancún', country: 'Mexico', flag: '🇲🇽', region: 'Americas', aliases: ['cun', 'cancun', 'riviera maya', 'mexico'] },

  // Europe & UK
  { code: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom', flag: '🇬🇧', region: 'Europe', aliases: ['lhr', 'london', 'heathrow', 'uk', 'england', 'britain'] },
  { code: 'LGW', name: 'London Gatwick Airport', city: 'London', country: 'United Kingdom', flag: '🇬🇧', region: 'Europe', aliases: ['lgw', 'gatwick', 'london'] },
  { code: 'STN', name: 'London Stansted Airport', city: 'London', country: 'United Kingdom', flag: '🇬🇧', region: 'Europe', aliases: ['stn', 'stansted', 'london'] },
  { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France', flag: '🇫🇷', region: 'Europe', aliases: ['cdg', 'paris', 'charles de gaulle', 'roissy', 'france'] },
  { code: 'ORY', name: 'Paris Orly Airport', city: 'Paris', country: 'France', flag: '🇫🇷', region: 'Europe', aliases: ['ory', 'orly', 'paris'] },
  { code: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands', flag: '🇳🇱', region: 'Europe', aliases: ['ams', 'amsterdam', 'schiphol', 'netherlands', 'holland'] },
  { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', flag: '🇩🇪', region: 'Europe', aliases: ['fra', 'frankfurt', 'germany', 'deutschland'] },
  { code: 'MUC', name: 'Munich Airport', city: 'Munich', country: 'Germany', flag: '🇩🇪', region: 'Europe', aliases: ['muc', 'munich', 'bayern', 'germany'] },
  { code: 'BER', name: 'Berlin Brandenburg Airport', city: 'Berlin', country: 'Germany', flag: '🇩🇪', region: 'Europe', aliases: ['ber', 'berlin', 'brandenburg', 'germany'] },
  { code: 'FCO', name: 'Leonardo da Vinci–Fiumicino', city: 'Rome', country: 'Italy', flag: '🇮🇹', region: 'Europe', aliases: ['fco', 'rome', 'roma', 'fiumicino', 'italy', 'italia'] },
  { code: 'MXP', name: 'Milan Malpensa Airport', city: 'Milan', country: 'Italy', flag: '🇮🇹', region: 'Europe', aliases: ['mxp', 'milan', 'milano', 'malpensa', 'italy'] },
  { code: 'MAD', name: 'Adolfo Suárez Madrid–Barajas', city: 'Madrid', country: 'Spain', flag: '🇪🇸', region: 'Europe', aliases: ['mad', 'madrid', 'barajas', 'spain', 'espana'] },
  { code: 'BCN', name: 'Josep Tarradellas Barcelona-El Prat', city: 'Barcelona', country: 'Spain', flag: '🇪🇸', region: 'Europe', aliases: ['bcn', 'barcelona', 'el prat', 'catalonia', 'spain'] },
  { code: 'ZRH', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland', flag: '🇨🇭', region: 'Europe', aliases: ['zrh', 'zurich', 'kloten', 'switzerland', 'swiss'] },
  { code: 'VIE', name: 'Vienna International Airport', city: 'Vienna', country: 'Austria', flag: '🇦🇹', region: 'Europe', aliases: ['vie', 'vienna', 'schwechat', 'austria'] },
  { code: 'DUB', name: 'Dublin Airport', city: 'Dublin', country: 'Ireland', flag: '🇮🇪', region: 'Europe', aliases: ['dub', 'dublin', 'ireland'] },
  { code: 'LIS', name: 'Humberto Delgado Airport', city: 'Lisbon', country: 'Portugal', flag: '🇵🇹', region: 'Europe', aliases: ['lis', 'lisbon', 'lisboa', 'portugal'] },
  { code: 'ATH', name: 'Athens International Airport', city: 'Athens', country: 'Greece', flag: '🇬🇷', region: 'Europe', aliases: ['ath', 'athens', 'eleftherios venizelos', 'greece'] },
  { code: 'CPH', name: 'Copenhagen Airport', city: 'Copenhagen', country: 'Denmark', flag: '🇩🇰', region: 'Europe', aliases: ['cph', 'copenhagen', 'kastrup', 'denmark'] },
  { code: 'ARN', name: 'Stockholm Arlanda Airport', city: 'Stockholm', country: 'Sweden', flag: '🇸🇪', region: 'Europe', aliases: ['arn', 'stockholm', 'arlanda', 'sweden'] },
  { code: 'OSL', name: 'Oslo Airport, Gardermoen', city: 'Oslo', country: 'Norway', flag: '🇳🇴', region: 'Europe', aliases: ['osl', 'oslo', 'gardermoen', 'norway'] },
  { code: 'HEL', name: 'Helsinki-Vantaa Airport', city: 'Helsinki', country: 'Finland', flag: '🇫🇮', region: 'Europe', aliases: ['hel', 'helsinki', 'vantaa', 'finland'] },
  { code: 'PRG', name: 'Václav Havel Airport Prague', city: 'Prague', country: 'Czech Republic', flag: '🇨🇿', region: 'Europe', aliases: ['prg', 'prague', 'czech'] },
  { code: 'WAW', name: 'Warsaw Chopin Airport', city: 'Warsaw', country: 'Poland', flag: '🇵🇱', region: 'Europe', aliases: ['waw', 'warsaw', 'chopin', 'poland'] },
  { code: 'BUD', name: 'Budapest Ferenc Liszt', city: 'Budapest', country: 'Hungary', flag: '🇭🇺', region: 'Europe', aliases: ['bud', 'budapest', 'hungary'] },

  // Asia-Pacific
  { code: 'HND', name: 'Tokyo Haneda Airport', city: 'Tokyo', country: 'Japan', flag: '🇯🇵', region: 'Asia', aliases: ['hnd', 'tokyo', 'haneda', 'japan'] },
  { code: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan', flag: '🇯🇵', region: 'Asia', aliases: ['nrt', 'narita', 'tokyo international'] },
  { code: 'KIX', name: 'Kansai International Airport', city: 'Osaka/Kyoto', country: 'Japan', flag: '🇯🇵', region: 'Asia', aliases: ['kix', 'osaka', 'kyoto', 'kansai', 'japan'] },
  { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore', flag: '🇸🇬', region: 'Asia', aliases: ['sin', 'singapore', 'changi'] },
  { code: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand', flag: '🇹🇭', region: 'Asia', aliases: ['bkk', 'bangkok', 'suvarnabhumi', 'thailand'] },
  { code: 'DMK', name: 'Don Mueang International', city: 'Bangkok', country: 'Thailand', flag: '🇹🇭', region: 'Asia', aliases: ['dmk', 'don mueang', 'bangkok domestic'] },
  { code: 'HKG', name: 'Hong Kong International', city: 'Hong Kong', country: 'Hong Kong', flag: '🇭🇰', region: 'Asia', aliases: ['hkg', 'hong kong', 'chek lap kok'] },
  { code: 'ICN', name: 'Incheon International Airport', city: 'Seoul', country: 'South Korea', flag: '🇰🇷', region: 'Asia', aliases: ['icn', 'seoul', 'incheon', 'korea'] },
  { code: 'KUL', name: 'Kuala Lumpur International', city: 'Kuala Lumpur', country: 'Malaysia', flag: '🇲🇾', region: 'Asia', aliases: ['kul', 'kuala lumpur', 'klia', 'malaysia'] },
  { code: 'DPS', name: 'Ngurah Rai International', city: 'Bali', country: 'Indonesia', flag: '🇮🇩', region: 'Asia', aliases: ['dps', 'bali', 'denpasar', 'indonesia'] },
  { code: 'CGK', name: 'Soekarno–Hatta International', city: 'Jakarta', country: 'Indonesia', flag: '🇮🇩', region: 'Asia', aliases: ['cgk', 'jakarta', 'soekarno', 'indonesia'] },
  { code: 'MNL', name: 'Ninoy Aquino International', city: 'Manila', country: 'Philippines', flag: '🇵🇭', region: 'Asia', aliases: ['mnl', 'manila', 'ninoy aquino', 'philippines'] },
  { code: 'SYD', name: 'Sydney Kingsford Smith', city: 'Sydney', country: 'Australia', flag: '🇦🇺', region: 'Oceania', aliases: ['syd', 'sydney', 'australia', 'nsw'] },
  { code: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia', flag: '🇦🇺', region: 'Oceania', aliases: ['mel', 'melbourne', 'tullamarine', 'australia'] },
  { code: 'BNE', name: 'Brisbane Airport', city: 'Brisbane', country: 'Australia', flag: '🇦🇺', region: 'Oceania', aliases: ['bne', 'brisbane', 'queensland', 'australia'] },
  { code: 'AKL', name: 'Auckland Airport', city: 'Auckland', country: 'New Zealand', flag: '🇳🇿', region: 'Oceania', aliases: ['akl', 'auckland', 'new zealand'] },
  { code: 'PVG', name: 'Shanghai Pudong International', city: 'Shanghai', country: 'China', flag: '🇨🇳', region: 'Asia', aliases: ['pvg', 'shanghai', 'pudong', 'china'] },
  { code: 'PEK', name: 'Beijing Capital International', city: 'Beijing', country: 'China', flag: '🇨🇳', region: 'Asia', aliases: ['pek', 'beijing', 'capital', 'china'] },
  { code: 'PKX', name: 'Beijing Daxing International', city: 'Beijing', country: 'China', flag: '🇨🇳', region: 'Asia', aliases: ['pkx', 'daxing', 'beijing new'] },
  { code: 'TPE', name: 'Taiwan Taoyuan International', city: 'Taipei', country: 'Taiwan', flag: '🇹🇼', region: 'Asia', aliases: ['tpe', 'taipei', 'taoyuan', 'taiwan'] },
  { code: 'SGN', name: 'Tan Son Nhat International', city: 'Ho Chi Minh City', country: 'Vietnam', flag: '🇻🇳', region: 'Asia', aliases: ['sgn', 'saigon', 'ho chi minh', 'vietnam'] },
  { code: 'HAN', name: 'Noi Bai International', city: 'Hanoi', country: 'Vietnam', flag: '🇻🇳', region: 'Asia', aliases: ['han', 'hanoi', 'noi bai', 'vietnam'] },

  // South America & Africa
  { code: 'GRU', name: 'São Paulo/Guarulhos International', city: 'São Paulo', country: 'Brazil', flag: '🇧🇷', region: 'Americas', aliases: ['gru', 'sao paulo', 'guarulhos', 'brazil'] },
  { code: 'GIG', name: 'Rio de Janeiro/Galeão', city: 'Rio de Janeiro', country: 'Brazil', flag: '🇧🇷', region: 'Americas', aliases: ['gig', 'rio', 'rio de janeiro', 'galeao'] },
  { code: 'EZE', name: 'Ministro Pistarini (Ezeiza)', city: 'Buenos Aires', country: 'Argentina', flag: '🇦🇷', region: 'Americas', aliases: ['eze', 'buenos aires', 'ezeiza', 'argentina'] },
  { code: 'BOG', name: 'El Dorado International', city: 'Bogotá', country: 'Colombia', flag: '🇨🇴', region: 'Americas', aliases: ['bog', 'bogota', 'el dorado', 'colombia'] },
  { code: 'LIM', name: 'Jorge Chávez International', city: 'Lima', country: 'Peru', flag: '🇵🇪', region: 'Americas', aliases: ['lim', 'lima', 'peru'] },
  { code: 'SCL', name: 'Arturo Merino Benítez', city: 'Santiago', country: 'Chile', flag: '🇨🇱', region: 'Americas', aliases: ['scl', 'santiago', 'chile'] },
  { code: 'JNB', name: 'O.R. Tambo International', city: 'Johannesburg', country: 'South Africa', flag: '🇿🇦', region: 'Africa', aliases: ['jnb', 'johannesburg', 'or tambo', 'south africa'] },
  { code: 'CPT', name: 'Cape Town International', city: 'Cape Town', country: 'South Africa', flag: '🇿🇦', region: 'Africa', aliases: ['cpt', 'cape town', 'south africa'] },
  { code: 'CAI', name: 'Cairo International Airport', city: 'Cairo', country: 'Egypt', flag: '🇪🇬', region: 'Africa', aliases: ['cai', 'cairo', 'egypt'] },
  { code: 'NBO', name: 'Jomo Kenyatta International', city: 'Nairobi', country: 'Kenya', flag: '🇰🇪', region: 'Africa', aliases: ['nbo', 'nairobi', 'kenya'] },
  { code: 'CMN', name: 'Mohammed V International', city: 'Casablanca', country: 'Morocco', flag: '🇲🇦', region: 'Africa', aliases: ['cmn', 'casablanca', 'morocco'] },
  { code: 'RAK', name: 'Marrakesh Menara Airport', city: 'Marrakech', country: 'Morocco', flag: '🇲🇦', region: 'Africa', aliases: ['rak', 'marrakech', 'marrakesh', 'morocco'] }
];

/**
 * Universal airport search & scoring resolver.
 * High scores for exact code, exact alias, prefix, and substring matches.
 */
export const lookupAirports = (query = '', limit = 8, regionFilter = null) => {
  if (!query && !regionFilter) return GLOBAL_AIRPORTS.slice(0, limit);

  const clean = (query || '').trim().toLowerCase();
  
  let pool = GLOBAL_AIRPORTS;
  if (regionFilter && regionFilter !== 'all') {
    pool = pool.filter(a => a.region === regionFilter || (regionFilter === 'India' && a.country === 'India'));
  }

  if (!clean) return pool.slice(0, limit);

  // Score each airport
  const scored = pool.map(a => {
    let score = 0;
    const codeLower = a.code.toLowerCase();
    const cityLower = a.city.toLowerCase();
    const nameLower = a.name.toLowerCase();
    const countryLower = a.country.toLowerCase();

    // 1. Exact IATA code match
    if (codeLower === clean) score += 1000;
    // 2. Exact alias match (e.g. 'igi' -> DEL)
    else if (a.aliases?.includes(clean)) score += 850;
    // 3. Exact city match
    else if (cityLower === clean) score += 700;
    // 4. Code starts with query
    else if (codeLower.startsWith(clean)) score += 600;
    // 5. City starts with query
    else if (cityLower.startsWith(clean)) score += 500;
    // 6. Name starts with or contains query
    else if (nameLower.startsWith(clean)) score += 400;
    else if (nameLower.includes(clean)) score += 300;
    // 7. City contains query
    else if (cityLower.includes(clean)) score += 250;
    // 8. Country contains query
    else if (countryLower.includes(clean)) score += 200;
    // 9. Aliases start with or contain query
    else if (a.aliases?.some(al => al.startsWith(clean))) score += 180;
    else if (a.aliases?.some(al => al.includes(clean))) score += 120;

    return { airport: a, score };
  });

  const matches = scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.airport);

  return matches.slice(0, limit);
};

/**
 * Resolves an airport code, exact alias, or exact city to its full airport metadata object.
 * Strictly avoids loose partial matching to prevent accidental random city selection while typing.
 */
export const getAirportDetails = (query = '') => {
  if (!query || typeof query !== 'string') return null;
  const clean = query.trim().toLowerCase();
  if (clean.length < 2) return null;

  // 1. Exact IATA code (e.g. DEL, JFK, LHR, BOM)
  const byCode = GLOBAL_AIRPORTS.find(a => a.code.toLowerCase() === clean);
  if (byCode) return byCode;

  // 2. Exact alias (e.g. IGI -> DEL, Heathrow -> LHR, Kempegowda -> BLR)
  const byAlias = GLOBAL_AIRPORTS.find(a => a.aliases?.map(al => al.toLowerCase()).includes(clean));
  if (byAlias) return byAlias;

  // 3. Exact city name (e.g. Delhi, London, Tokyo, Mumbai, Paris, Rome)
  const byCityExact = GLOBAL_AIRPORTS.find(a => a.city.toLowerCase() === clean);
  if (byCityExact) return byCityExact;

  // 4. Exact airport name
  const byNameExact = GLOBAL_AIRPORTS.find(a => a.name.toLowerCase() === clean);
  if (byNameExact) return byNameExact;

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
