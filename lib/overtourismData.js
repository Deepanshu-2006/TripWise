/**
 * TripWise Curated Overtourism & Crowd Strain Dataset
 * Admin-managed dataset for qualitative crowd warnings and curated less-crowded alternatives.
 */

export const DESTINATION_OVERTOURISM_DATA = {
  rome: {
    destinationName: 'Rome',
    country: 'Italy',
    severity: 'high',
    warningText: 'High tourist strain season — popular landmarks experience peak crowding between 11am and 4pm.',
    peakMonths: ['May', 'June', 'July', 'August', 'September'],
    alternativeDestinations: [
      {
        name: 'Orvieto & Umbria',
        country: 'Italy',
        vibe: 'Historic Hilltown & Culinary',
        reason: 'Rich Etruscan & Medieval architecture with 75% fewer crowds, just 1 hour from Rome.'
      },
      {
        name: 'Verona',
        country: 'Italy',
        vibe: 'Roman Arenas & Renaissance Charm',
        reason: 'Preserved Roman amphitheater and romantic canals with manageable traveler density.'
      }
    ]
  },
  barcelona: {
    destinationName: 'Barcelona',
    country: 'Spain',
    severity: 'high',
    warningText: 'High seasonal visitor numbers — popular beaches and Gothic Quarter corridors see heavy foot traffic.',
    peakMonths: ['June', 'July', 'August', 'September'],
    alternativeDestinations: [
      {
        name: 'Girona',
        country: 'Spain',
        vibe: 'Medieval Ramparts & Gastronomy',
        reason: 'Stunning Jewish Quarter and riverfront houses with peaceful pedestrian streets.'
      },
      {
        name: 'Tarragona',
        country: 'Spain',
        vibe: 'Coastal Roman Ruins',
        reason: 'Uncrowded Roman amphitheater right on the Mediterranean shore.'
      }
    ]
  },
  kyoto: {
    destinationName: 'Kyoto',
    country: 'Japan',
    severity: 'high',
    warningText: 'Peak foliage & cherry blossom season — historic temple paths experience high morning density.',
    peakMonths: ['March', 'April', 'November'],
    alternativeDestinations: [
      {
        name: 'Nara & Uji',
        country: 'Japan',
        vibe: 'Ancient Temples & Matcha Trails',
        reason: 'Historic World Heritage temples surrounded by tranquil parklands.'
      },
      {
        name: 'Kanazawa',
        country: 'Japan',
        vibe: 'Traditional Geisha & Castle Gardens',
        reason: 'Authentic Edo-period district withKenroku-en garden without heavy tourist queues.'
      }
    ]
  },
  venice: {
    destinationName: 'Venice',
    country: 'Italy',
    severity: 'high',
    warningText: 'Extreme day-tripper volume — St. Mark’s Square & Rialto area experience bottlenecking.',
    peakMonths: ['May', 'June', 'July', 'August', 'September', 'October'],
    alternativeDestinations: [
      {
        name: 'Treviso & Burano',
        country: 'Italy',
        vibe: 'Quiet Canals & Prosecco Hills',
        reason: 'Charming canal city with authentic local osterias, just 30 minutes away.'
      }
    ]
  }
};

export const ATTRACTION_OVERTOURISM_DATA = [
  {
    id: 'trevi_fountain',
    titleKeywords: ['trevi', 'fountain of trevi', 'trevi fountain'],
    peakHours: '11:00 AM - 04:00 PM',
    warningText: 'Peak crowds 11am-4pm — fountain plaza gets heavily bottlenecked',
    severity: 'high',
    alternativeActivity: {
      title: 'Vicus Caprarius — Underground City of Water',
      description: 'Explore the serene Roman subterranean archaeological site where the underground aqueduct feeding the Trevi Fountain actually flows.',
      time: '11:30 AM',
      duration: '1.5 hrs',
      cost: 'From €9.00',
      category: 'Landmark',
      rating: 4.8,
      coordinates: { lat: 41.9009, lng: 12.4833 }
    }
  },
  {
    id: 'park_guell',
    titleKeywords: ['park güell', 'park guell', 'guell'],
    peakHours: '10:00 AM - 03:00 PM',
    warningText: 'Peak crowds 10am-3pm — long queue lines at mosaic terrace',
    severity: 'high',
    alternativeActivity: {
      title: 'Recinte Modernista de Sant Pau',
      description: 'Lesser-known UNESCO Modernist complex designed by Lluís Domènech i Montaner with serene mosaic gardens.',
      time: '10:30 AM',
      duration: '2 hrs',
      cost: 'From €16.00',
      category: 'Landmark',
      rating: 4.9,
      coordinates: { lat: 41.4116, lng: 2.1744 }
    }
  },
  {
    id: 'fushimi_inari',
    titleKeywords: ['fushimi inari', 'inari taisha', 'torii gates'],
    peakHours: '09:00 AM - 02:00 PM',
    warningText: 'Peak crowds 9am-2pm at lower shrine gates',
    severity: 'high',
    alternativeActivity: {
      title: 'Otagi Nenbutsu-ji Temple (Arashiyama)',
      description: 'Quiet hillside temple housing 1,200 unique moss-covered stone Arhat statues created by local sculptors.',
      time: '09:30 AM',
      duration: '2 hrs',
      cost: 'From ¥300',
      category: 'Landmark',
      rating: 4.9,
      coordinates: { lat: 35.0298, lng: 135.6622 }
    }
  },
  {
    id: 'colosseum',
    titleKeywords: ['colosseum', 'colosseo', 'flavian amphitheatre'],
    peakHours: '10:00 AM - 03:30 PM',
    warningText: 'Peak crowds 10am-3:30pm — security lines extend past archway',
    severity: 'moderate',
    alternativeActivity: {
      title: 'Baths of Caracalla & Circus Maximus',
      description: 'Massive, uncrowded imperial Roman bath complex with intact soaring brick vaults and ancient mosaic floors.',
      time: '10:30 AM',
      duration: '2 hrs',
      cost: 'From €8.00',
      category: 'Landmark',
      rating: 4.8,
      coordinates: { lat: 41.8792, lng: 12.4925 }
    }
  }
];

/**
 * Get destination overtourism warning info if available
 */
export function getDestinationOvertourismInfo(destName = '') {
  if (!destName) return null;
  const key = Object.keys(DESTINATION_OVERTOURISM_DATA).find(
    k => destName.toLowerCase().includes(k) || k.includes(destName.toLowerCase())
  );
  return key ? DESTINATION_OVERTOURISM_DATA[key] : null;
}

/**
 * Get attraction overtourism info if available
 */
export function getAttractionOvertourismInfo(activityTitle = '') {
  if (!activityTitle) return null;
  const lower = activityTitle.toLowerCase();
  return ATTRACTION_OVERTOURISM_DATA.find(item =>
    item.titleKeywords.some(kw => lower.includes(kw))
  ) || null;
}
