/**
 * Booking Partners Deep-Linking Resolution Engine
 * Handles exact listing deep-links vs. pre-filled fallback search URLs.
 */

import { buildSkyscannerFlightUrl } from './iataCodes.js';

export const getBookingLinkInfo = (destinationName, type = 'flight', selectedItem = null, config = {}) => {
  let cleanDest = (destinationName || 'Destination').replace(/\s*\(Demo Mode\)\s*/gi, '').split(',')[0].trim();
  const origin = (config.origin || 'JFK').toLowerCase();

  if (type === 'flight') {
    const partnerName = 'Skyscanner';

    if (selectedItem?.deeplink) {
      return {
        url: selectedItem.deeplink,
        isExact: selectedItem.isExactDeeplink ?? true,
        partnerName,
        buttonText: `Continue to Book on ${partnerName}`,
        disclosureNote: null
      };
    }
    
    // Resolve Skyscanner URL via IATA code registry & URL builder
    const flightUrlInfo = buildSkyscannerFlightUrl({
      origin,
      destination: cleanDest,
      date: config.startDate || '2026-09-15'
    });

    if (flightUrlInfo.isExact) {
      return {
        url: flightUrlInfo.url,
        isExact: true,
        partnerName,
        buttonText: `Search this route on ${partnerName}`,
        disclosureNote: null
      };
    }

    // Safety Fallback for unmapped city names
    return {
      url: flightUrlInfo.url,
      isExact: false,
      partnerName,
      buttonText: `Search on ${partnerName}`,
      disclosureNote: `Destination IATA code unavailable; pre-filled search opened on ${partnerName}.`
    };
  } else {
    const partnerName = 'Booking.com';
    if (selectedItem?.deeplink) {
      return {
        url: selectedItem.deeplink,
        isExact: selectedItem.isExactDeeplink ?? true,
        partnerName,
        buttonText: `Continue to Book on ${partnerName}`,
        disclosureNote: null
      };
    }

    // Property-level fallback search if hotel name is available
    if (selectedItem?.name) {
      const hotelQuery = encodeURIComponent(`${selectedItem.name} ${cleanDest}`);
      return {
        url: `https://www.booking.com/searchresults.html?ss=${hotelQuery}`,
        isExact: false,
        partnerName,
        buttonText: `View ${selectedItem.name} on ${partnerName}`,
        disclosureNote: `Prices and availability may vary slightly on ${partnerName}'s site.`
      };
    }

    // Generic city search fallback
    const destQuery = encodeURIComponent(cleanDest);
    return {
      url: `https://www.booking.com/searchresults.html?ss=${destQuery}`,
      isExact: false,
      partnerName,
      buttonText: `Search hotels in ${cleanDest} on ${partnerName}`,
      disclosureNote: `Prices and availability may vary slightly on ${partnerName}'s site.`
    };
  }
};

// Legacy backward compatibility export
export const getAffiliateBookingLink = (destinationName, type = 'flight') => {
  return getBookingLinkInfo(destinationName, type).url;
};


