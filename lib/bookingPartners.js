/**
 * BOOKING PARTNER DEEP-LINK MATRIX & CAPABILITY DIRECTORY
 * 
 * | Partner       | Category | Direct Deeplink Support | Fallback Mechanism | Disclosure Note |
 * | :------------ | :------- | :---------------------- | :----------------- | :-------------- |
 * | Skyscanner    | Flights  | ⚠️ Partial (60% API)    | Route & Date Search| "You'll see live search results for this route — exact flight and price may vary slightly." |
 * | Booking.com   | Hotels   | ✅ Supported (75% API)   | Hotel & City Search| "You'll see live search results for this location — exact availability and price may vary." |
 * 
 * RESOLUTION BEHAVIOR:
 * 1. Direct Deep-Link (isExact: true):
 *    - Used when partner API provides a verified direct listing/booking URL.
 *    - Button Copy: "Continue to Book on [Partner]"
 *    - Disclosure Note: null
 * 
 * 2. Search Fallback (isExact: false):
 *    - Used when partner API only supports route/destination pre-filled search.
 *    - Applies matching filters (origin, destination IATA, dates, stops filter, price sort).
 *    - Button Copy: "Search this flight on Skyscanner" / "View [Hotel Name] on Booking.com"
 *    - Disclosure Note: Honest user-facing notice setting clear expectations.
 */

import { getIataCode, formatSkyscannerDate } from './iataCodes.js';

export const getBookingLinkInfo = (destinationName, type = 'flight', selectedItem = null, config = {}) => {
  let cleanDest = (destinationName || 'Destination').replace(/\s*\(Demo Mode\)\s*/gi, '').split(',')[0].trim();
  const origin = (config.origin || 'JFK').toLowerCase();

  if (type === 'flight') {
    const partnerName = 'Skyscanner';

    // 1. True Direct Listing Deep-Link from Partner API Response
    if (selectedItem?.deeplink && selectedItem?.isExactDeeplink === true) {
      return {
        url: selectedItem.deeplink,
        isExact: true,
        partnerName,
        buttonText: `Continue to Book on ${partnerName}`,
        disclosureNote: null
      };
    }
    
    // 2. Pre-filled Route Search Fallback with Route, Dates, and Stops/Sort Filters
    const originIata = (getIataCode(origin) || 'jfk').toLowerCase();
    const destIata = (getIataCode(cleanDest) || 'fco').toLowerCase();
    const dateFormatted = formatSkyscannerDate(config.startDate || '2026-09-15');

    let fallbackUrl = `https://www.skyscanner.com/transport/flights/${originIata}/${destIata}/${dateFormatted}/`;
    
    // Apply matching filters to get user as close as possible to their selection
    const queryParams = [];
    if (selectedItem?.stops === 0) {
      queryParams.push('stops=direct');
    } else if (selectedItem?.stops === 1) {
      queryParams.push('stops=1-stop');
    }
    queryParams.push('sort=price');

    if (queryParams.length > 0) {
      fallbackUrl += `?${queryParams.join('&')}`;
    }

    return {
      url: fallbackUrl,
      isExact: false,
      partnerName,
      buttonText: `Search this flight on ${partnerName}`,
      disclosureNote: `You'll see live search results for this route — exact flight and price may vary slightly.`
    };
  } else {
    const partnerName = 'Booking.com';

    // 1. True Property-Level Direct Deep-Link
    if (selectedItem?.deeplink && selectedItem?.isExactDeeplink === true) {
      return {
        url: selectedItem.deeplink,
        isExact: true,
        partnerName,
        buttonText: `Continue to Book on ${partnerName}`,
        disclosureNote: null
      };
    }

    // 2. Pre-filled Search Fallback for Hotels
    const hotelName = selectedItem?.name;
    const hotelQuery = hotelName ? encodeURIComponent(`${hotelName} ${cleanDest}`) : encodeURIComponent(cleanDest);
    const checkin = config.startDate || '2026-09-15';
    const checkout = config.endDate || '2026-09-19';
    const fallbackUrl = `https://www.booking.com/searchresults.html?ss=${hotelQuery}&checkin=${checkin}&checkout=${checkout}`;

    return {
      url: fallbackUrl,
      isExact: false,
      partnerName,
      buttonText: hotelName ? `View ${hotelName} on ${partnerName}` : `Search hotels in ${cleanDest} on ${partnerName}`,
      disclosureNote: `You'll see live search results for this location — exact availability and price may vary.`
    };
  }
};

// Legacy backward compatibility export
export const getAffiliateBookingLink = (destinationName, type = 'flight') => {
  return getBookingLinkInfo(destinationName, type).url;
};
