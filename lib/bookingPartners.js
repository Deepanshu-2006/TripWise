/**
 * Mock Booking Partners API
 * Generates affiliate booking links based on the destination.
 */

export const getAffiliateBookingLink = (destinationName, type = 'flight') => {
  // Strip out "(Demo Mode)" and take just the city name (before any comma) for better search results
  let cleanName = (destinationName || 'Destination').replace(/\s*\(Demo Mode\)\s*/gi, '');
  cleanName = cleanName.split(',')[0].trim();
  
  const query = encodeURIComponent(cleanName);
  if (type === 'flight') {
    return `https://www.skyscanner.com/transport/flights-from/anywhere/to/${query}`;
  } else {
    return `https://www.booking.com/searchresults.html?ss=${query}`;
  }
};
