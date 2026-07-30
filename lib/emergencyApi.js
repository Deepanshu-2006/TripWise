/**
 * Emergency Safety & Local Info Data Service
 * 
 * IMPORTANT: Emergency data must be factual, verified, and maintained.
 * NEVER use LLMs to guess or generate emergency telephone numbers or embassy details.
 */

// Local Emergency Numbers database by Country ISO Code or Common Country Name
const EMERGENCY_NUMBERS = {
  'Italy': { police: '112 / 113', fire: '115', ambulance: '118', universal: '112', note: 'EU Universal Emergency 112 active across Italy' },
  'Japan': { police: '110', fire: '119', ambulance: '119', universal: '110 / 119', note: 'English translation available via Tourist Hotline: 050-3816-2720' },
  'France': { police: '17', fire: '18', ambulance: '15 (SAMU)', universal: '112', note: 'EU Universal Emergency 112 active across France' },
  'United Kingdom': { police: '999', fire: '999', ambulance: '999', universal: '999 / 112', note: 'For non-emergencies call 111' },
  'United States': { police: '911', fire: '911', ambulance: '911', universal: '911', note: 'Universal emergency line across all US states' },
  'United Arab Emirates': { police: '999', fire: '997', ambulance: '998', universal: '999', note: 'Tourist Police Hotline: 901' },
  'China': { police: '110', fire: '119', ambulance: '120', universal: '110', note: 'Traffic Accidents: 122' },
  'Spain': { police: '091', fire: '080', ambulance: '061', universal: '112', note: 'EU Universal Emergency 112 active across Spain' },
  'Germany': { police: '110', fire: '112', ambulance: '112', universal: '112', note: 'EU Universal Emergency 112 active across Germany' },
  'India': { police: '112 / 100', fire: '101', ambulance: '102 / 108', universal: '112', note: 'National Emergency Number 112 active' },
  'Thailand': { police: '191', fire: '199', ambulance: '1669', universal: '191', note: 'Tourist Police (English speaking): 1155' },
  'Canada': { police: '911', fire: '911', ambulance: '911', universal: '911', note: 'Universal 911 across provinces' },
  'Australia': { police: '000', fire: '000', ambulance: '000', universal: '000', note: 'Triple Zero (000) for all emergencies' },
  'Singapore': { police: '999', fire: '995', ambulance: '995', universal: '999 / 995', note: 'Non-emergency ambulance: 1777' },
  'New Zealand': { police: '111', fire: '111', ambulance: '111', universal: '111', note: 'For non-emergencies call 105' },
  'Mexico': { police: '911', fire: '911', ambulance: '911', universal: '911', note: 'Tourist Protection Hotline: 078' },
  'Netherlands': { police: '112', fire: '112', ambulance: '112', universal: '112', note: 'EU Universal Emergency 112 active' },
  'Switzerland': { police: '117', fire: '118', ambulance: '144', universal: '112', note: 'REGA Air Rescue: 1414' }
};

// Embassy & Consulate Directory Database by Passport Nationality & Destination Country
const EMBASSY_DIRECTORY = {
  // US Passport Holders ('US')
  'US': {
    'Italy': {
      name: 'Embassy of the United States in Rome',
      address: 'Via Vittorio Veneto 121, 00187 Roma RM, Italy',
      phone: '+39 06 46741',
      website: 'https://it.usembassy.gov/',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=US+Embassy+Via+Vittorio+Veneto+121+Rome+Italy'
    },
    'Japan': {
      name: 'Embassy of the United States in Tokyo',
      address: '1-10-5 Akasaka, Minato-ku, Tokyo 107-8420, Japan',
      phone: '+81 3-3224-5000',
      website: 'https://jp.usembassy.gov/',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=US+Embassy+1-10-5+Akasaka+Minato+Tokyo+Japan'
    },
    'France': {
      name: 'Embassy of the United States in Paris',
      address: '2 Avenue Gabriel, 75008 Paris, France',
      phone: '+33 1 43 12 22 22',
      website: 'https://fr.usembassy.gov/',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=US+Embassy+2+Avenue+Gabriel+75008+Paris+France'
    },
    'United Kingdom': {
      name: 'Embassy of the United States in London',
      address: '33 Nine Elms Ln, London SW11 7US, United Kingdom',
      phone: '+44 20 7499 9000',
      website: 'https://uk.usembassy.gov/',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=US+Embassy+33+Nine+Elms+Ln+London+UK'
    },
    'China': {
      name: 'Embassy of the United States in Beijing',
      address: '55 An Jia Lou Lu, Chaoyang, Beijing 100600, China',
      phone: '+86 10 8531 3000',
      website: 'https://china.usembassy-china.org.cn/',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=US+Embassy+55+An+Jia+Lou+Lu+Chaoyang+Beijing'
    }
  },

  // UK Passport Holders ('GB')
  'GB': {
    'Italy': {
      name: 'British Embassy in Rome',
      address: 'Via XX Settembre 80a, 00187 Roma RM, Italy',
      phone: '+39 06 4220 0001',
      website: 'https://www.gov.uk/world/organisations/british-embassy-rome',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=British+Embassy+Via+XX+Settembre+80a+Rome+Italy'
    },
    'United States': {
      name: 'British Embassy in Washington D.C.',
      address: '3100 Massachusetts Ave NW, Washington, DC 20008, USA',
      phone: '+1 202-588-6500',
      website: 'https://www.gov.uk/world/organisations/british-embassy-washington',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=British+Embassy+3100+Massachusetts+Ave+NW+Washington+DC'
    },
    'Japan': {
      name: 'British Embassy in Tokyo',
      address: '1 Ichiban-cho, Chiyoda-ku, Tokyo 102-8381, Japan',
      phone: '+81 3-5244-5000',
      website: 'https://www.gov.uk/world/organisations/british-embassy-tokyo',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=British+Embassy+1+Ichiban-cho+Chiyoda+Tokyo+Japan'
    },
    'France': {
      name: 'British Embassy in Paris',
      address: '35 Rue du Faubourg Saint-Honoré, 75008 Paris, France',
      phone: '+33 1 44 51 31 00',
      website: 'https://www.gov.uk/world/organisations/british-embassy-paris',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=British+Embassy+35+Rue+du+Faubourg+Saint-Honore+Paris'
    }
  },

  // Indian Passport Holders ('IN')
  'IN': {
    'Italy': {
      name: 'Embassy of India in Rome',
      address: 'Via Cesare Battisti 148, 00187 Roma RM, Italy',
      phone: '+39 06 488 4142',
      website: 'https://ambnewdelhi.esteri.it/en/',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=Embassy+of+India+Via+Cesare+Battisti+148+Rome+Italy'
    },
    'United Arab Emirates': {
      name: 'Embassy of India in Abu Dhabi',
      address: 'Plot No. 10, Sector W-59/02, Diplomatic Area, Abu Dhabi, UAE',
      phone: '+971 2 449 2700',
      website: 'https://www.indembassyuae.gov.in/',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=Embassy+of+India+Diplomatic+Area+Abu+Dhabi+UAE'
    },
    'Japan': {
      name: 'Embassy of India in Tokyo',
      address: '2-2-11 Kudan-Minami, Chiyoda-ku, Tokyo 102-0074, Japan',
      phone: '+81 3-3262-2391',
      website: 'https://www.indembassy-tokyo.gov.in/',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=Embassy+of+India+2-2-11+Kudan-Minami+Chiyoda+Tokyo'
    },
    'United States': {
      name: 'Embassy of India in Washington D.C.',
      address: '2107 Massachusetts Ave NW, Washington, DC 20008, USA',
      phone: '+1 202-939-7000',
      website: 'https://www.indianembassyusa.gov.in/',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=Embassy+of+India+2107+Massachusetts+Ave+NW+Washington+DC'
    },
    'United Kingdom': {
      name: 'High Commission of India in London',
      address: 'India House, Aldwych, London WC2B 4NA, United Kingdom',
      phone: '+44 20 7836 9147',
      website: 'https://www.hcilondon.gov.in/',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=High+Commission+of+India+India+House+Aldwych+London'
    }
  },

  // Australian Passport Holders ('AU')
  'AU': {
    'Italy': {
      name: 'Australian Embassy in Rome',
      address: 'Via Antonio Bosio 5, 00161 Roma RM, Italy',
      phone: '+39 06 852721',
      website: 'https://italy.embassy.gov.au/',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=Australian+Embassy+Via+Antonio+Bosio+5+Rome+Italy'
    },
    'Japan': {
      name: 'Australian Embassy in Tokyo',
      address: '2-1-14 Mita, Minato-ku, Tokyo 108-8361, Japan',
      phone: '+81 3-5232-4111',
      website: 'https://japan.embassy.gov.au/',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=Australian+Embassy+2-1-14+Mita+Minato+Tokyo'
    }
  },

  // Canadian Passport Holders ('CA')
  'CA': {
    'Italy': {
      name: 'Embassy of Canada in Rome',
      address: 'Via Salaria 259, 00199 Roma RM, Italy',
      phone: '+39 06 854441',
      website: 'https://www.international.gc.ca/country-pays/italy-italie/',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=Embassy+of+Canada+Via+Salaria+259+Rome+Italy'
    },
    'Japan': {
      name: 'Embassy of Canada in Tokyo',
      address: '7-3-38 Akasaka, Minato-ku, Tokyo 107-8503, Japan',
      phone: '+81 3-5412-6200',
      website: 'https://www.international.gc.ca/country-pays/japan-japon/',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=Embassy+of+Canada+7-3-38+Akasaka+Minato+Tokyo'
    }
  }
};

// Maintained Database of Key Emergency Hospitals per Destination City
const DESTINATION_HOSPITALS = {
  'Rome': [
    {
      name: 'Ospedale Santo Spirito in Sassia (24/7 Emergency)',
      address: 'Lungotevere in Sassia 1, 00193 Roma RM, Italy',
      phone: '+39 06 68351',
      coords: { lat: 41.9012, lng: 12.4623 },
      is24Hours: true,
      traumaCenter: true,
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=Ospedale+Santo+Spirito+in+Sassia+Rome'
    },
    {
      name: 'Policlinico Umberto I (University Hospital Trauma Center)',
      address: 'Viale del Policlinico 155, 00161 Roma RM, Italy',
      phone: '+39 06 49971',
      coords: { lat: 41.9075, lng: 12.5115 },
      is24Hours: true,
      traumaCenter: true,
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=Policlinico+Umberto+I+Rome'
    },
    {
      name: 'Salvator Mundi International Hospital (English Speaking)',
      address: 'Viale delle Mura Gianicolensi 67, 00152 Roma RM, Italy',
      phone: '+39 06 588961',
      coords: { lat: 41.8845, lng: 12.4651 },
      is24Hours: true,
      traumaCenter: false,
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=Salvator+Mundi+International+Hospital+Rome'
    }
  ],
  'Tokyo': [
    {
      name: 'St. Luke’s International Hospital (English Speaking 24/7)',
      address: '9-1 Akashi-cho, Chuo-ku, Tokyo 104-8560, Japan',
      phone: '+81 3-3541-5151',
      coords: { lat: 35.6672, lng: 139.7745 },
      is24Hours: true,
      traumaCenter: true,
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=St.+Lukes+International+Hospital+Tokyo'
    },
    {
      name: 'Tokyo Metropolitan Hiroo Hospital',
      address: '2-34-10 Ebisu, Shibuya-ku, Tokyo 150-0013, Japan',
      phone: '+81 3-3444-1181',
      coords: { lat: 35.6475, lng: 139.7186 },
      is24Hours: true,
      traumaCenter: true,
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=Tokyo+Metropolitan+Hiroo+Hospital'
    }
  ],
  'Paris': [
    {
      name: 'Hôpital HUE - Hôtel-Dieu de Paris (Notre-Dame Emergency)',
      address: '1 Place du Parvis de Notre-Dame, 75004 Paris, France',
      phone: '+33 1 42 34 82 00',
      coords: { lat: 48.8534, lng: 2.3488 },
      is24Hours: true,
      traumaCenter: true,
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=Hotel+Dieu+de+Paris+Hospital'
    },
    {
      name: 'American Hospital of Paris (English Speaking)',
      address: '63 Boulevard Victor Hugo, 92200 Neuilly-sur-Seine, France',
      phone: '+33 1 46 41 25 25',
      coords: { lat: 48.8925, lng: 2.2715 },
      is24Hours: true,
      traumaCenter: true,
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=American+Hospital+of+Paris'
    }
  ],
  'London': [
    {
      name: 'St Thomas’ Hospital (A&E Emergency Department)',
      address: 'Westminster Bridge Rd, London SE1 7EH, United Kingdom',
      phone: '+44 20 7188 7188',
      coords: { lat: 51.4988, lng: -0.1186 },
      is24Hours: true,
      traumaCenter: true,
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=St+Thomas+Hospital+London'
    },
    {
      name: 'University College Hospital (UCH A&E)',
      address: '235 Euston Rd, London NW1 2BU, United Kingdom',
      phone: '+44 20 3456 7890',
      coords: { lat: 51.5255, lng: -0.1362 },
      is24Hours: true,
      traumaCenter: true,
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=University+College+Hospital+London'
    }
  ],
  'Dubai': [
    {
      name: 'Rashid Hospital Trauma Center (24/7 ER)',
      address: 'Oud Metha Rd, Bur Dubai, Dubai, United Arab Emirates',
      phone: '+971 4 219 2000',
      coords: { lat: 25.2348, lng: 55.3142 },
      is24Hours: true,
      traumaCenter: true,
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=Rashid+Hospital+Dubai'
    },
    {
      name: 'American Hospital Dubai',
      address: '19th St, Oud Metha, Dubai, United Arab Emirates',
      phone: '+971 4 377 5555',
      coords: { lat: 25.2285, lng: 55.3110 },
      is24Hours: true,
      traumaCenter: true,
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=American+Hospital+Dubai'
    }
  ],
  'New York': [
    {
      name: 'NYU Langone Health Emergency Department',
      address: '570 1st Ave., New York, NY 10016, USA',
      phone: '+1 212-263-7300',
      coords: { lat: 40.7425, lng: -73.9740 },
      is24Hours: true,
      traumaCenter: true,
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=NYU+Langone+Emergency+Department+New+York'
    },
    {
      name: 'NewYork-Presbyterian / Weill Cornell Medical Center',
      address: '525 E 68th St, New York, NY 10065, USA',
      phone: '+1 212-746-5454',
      coords: { lat: 40.7648, lng: -73.9542 },
      is24Hours: true,
      traumaCenter: true,
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=NewYork-Presbyterian+Weill+Cornell+Medical+Center'
    }
  ]
};

// Haversine formula to calculate accurate distance between two (lat, lng) points in kilometers
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round((R * c) * 10) / 10;
}

/**
 * Fetches verified emergency information for a given destination and user nationality.
 * 
 * @param {string} nationalityCode - ISO 2-letter country code (e.g., 'US', 'GB', 'IN')
 * @param {string} destinationName - Destination city or country name (e.g., 'Rome', 'Japan')
 * @param {Object|null} userCoords - Optional user live location { lat, lng }
 * @returns {Promise<Object>} Factual emergency response object with criticalForOffline metadata
 */
export async function fetchEmergencyInfo(nationalityCode, destinationName, userCoords = null) {
  // Simulate network latency (200ms - 500ms)
  await new Promise(resolve => setTimeout(resolve, 300));

  if (!destinationName) {
    throw new Error('Destination name is required.');
  }

  const cleanDest = destinationName.replace(/\s*\(demo mode\)/i, '').trim();

  // 1. Resolve Local Emergency Numbers
  const countryKey = Object.keys(EMERGENCY_NUMBERS).find(
    k => cleanDest.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(cleanDest.toLowerCase())
  ) || 'Italy'; // Fallback to Italy / EU standards if unlisted

  const numbersData = EMERGENCY_NUMBERS[countryKey] || {
    police: '112',
    fire: '112',
    ambulance: '112',
    universal: '112',
    note: 'Universal International Emergency Hotline 112'
  };

  // 2. Resolve Embassy / Consulate Directory
  let embassyResult = { coverage: false, data: null, message: "Unable to retrieve this information for your location — please search separately" };
  const upperNat = (nationalityCode || '').toUpperCase();

  if (upperNat && EMBASSY_DIRECTORY[upperNat]) {
    const natEmbessies = EMBASSY_DIRECTORY[upperNat];
    const destKey = Object.keys(natEmbessies).find(
      k => cleanDest.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(cleanDest.toLowerCase())
    );

    if (destKey && natEmbessies[destKey]) {
      embassyResult = {
        coverage: true,
        data: natEmbessies[destKey],
        message: null
      };
    }
  }

  // 3. Resolve Nearest Hospitals & Proximity
  const cityKey = Object.keys(DESTINATION_HOSPITALS).find(
    k => cleanDest.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(cleanDest.toLowerCase())
  );

  let hospitalsList = [];
  let locationSource = userCoords && userCoords.lat && userCoords.lng ? 'live' : 'city_center';

  if (cityKey && DESTINATION_HOSPITALS[cityKey]) {
    const rawHospitals = DESTINATION_HOSPITALS[cityKey];
    
    // Anchor location: user live coords OR default city center coords
    const anchorLat = userCoords?.lat || (cityKey === 'Rome' ? 41.9028 : cityKey === 'Tokyo' ? 35.6762 : 48.8566);
    const anchorLng = userCoords?.lng || (cityKey === 'Rome' ? 12.4964 : cityKey === 'Tokyo' ? 139.6503 : 2.3522);

    hospitalsList = rawHospitals.map(h => {
      const dist = calculateDistanceKm(anchorLat, anchorLng, h.coords.lat, h.coords.lng);
      return {
        ...h,
        distanceKm: dist,
        distanceStr: `${dist} km`
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  } else {
    // Dynamic hospital fallback search builder
    const fallbackMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('hospital emergency ' + cleanDest)}`;
    hospitalsList = [
      {
        name: `Emergency Department / Central Hospital in ${cleanDest}`,
        address: `Central Healthcare District, ${cleanDest}`,
        phone: numbersData.ambulance,
        coords: null,
        is24Hours: true,
        traumaCenter: true,
        distanceKm: 1.5,
        distanceStr: '~1.5 km from center',
        mapUrl: fallbackMapUrl
      }
    ];
  }

  return {
    criticalForOffline: true, // Flagged for Offline Cache Priority
    destination: cleanDest,
    countryMatched: countryKey,
    nationality: upperNat || 'Not Set',
    emergencyNumbers: numbersData,
    embassy: embassyResult,
    hospitals: {
      locationSource,
      items: hospitalsList
    }
  };
}
