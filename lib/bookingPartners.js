/**
 * Mock Booking Partners API
 * Generates affiliate booking links based on the destination.
 */

export const getAffiliateBookingLink = (destinationName, type = 'flight') => {
  const query = encodeURIComponent(destinationName || 'Destination');
  if (type === 'flight') {
    return `https://www.skyscanner.com/transport/flights-from/anywhere/to/${query}`;
  } else {
    return `https://www.booking.com/searchresults.html?ss=${query}`;
  }
};
