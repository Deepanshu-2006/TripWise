/**
 * Automated Deep-Link Validation Test Suite
 * Validates generated Skyscanner & Booking.com deep-links against strict URL rules:
 * 1. Must use valid 3-letter lowercase IATA codes in path segments (never raw city names like 'Rome')
 * 2. Must format dates as 6-digit YYMMDD
 * 3. Must fall back safely to search URLs if IATA mapping is missing (no 404s)
 * 4. Must not contain unencoded spaces or malformed path segments
 */

import { buildSkyscannerFlightUrl, getIataCode, formatSkyscannerDate } from '../lib/iataCodes.js';
import { getBookingLinkInfo } from '../lib/bookingPartners.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASSED: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAILED: ${message}`);
    failed++;
  }
}

console.log('--- RUNNING DEEP-LINK VALIDATION TESTS ---\n');

// Test 1: IATA Code Resolution
console.log('Test Group 1: IATA Resolution');
assert(getIataCode('Rome, Italy') === 'fco', 'Rome resolves to fco');
assert(getIataCode('Paris, France') === 'cdg', 'Paris resolves to cdg');
assert(getIataCode('Tokyo, Japan') === 'hnd', 'Tokyo resolves to hnd');
assert(getIataCode('Unknown City 123') === null, 'Unknown city resolves to null (triggers safety fallback)');

// Test 2: Date Formatting (YYMMDD)
console.log('\nTest Group 2: Skyscanner Date Formatting');
assert(formatSkyscannerDate('2026-09-15') === '260915', '2026-09-15 formats to 260915');
assert(formatSkyscannerDate('2026-07-31') === '260731', '2026-07-31 formats to 260731');

// Test 3: Skyscanner URL Construction Rules
console.log('\nTest Group 3: Skyscanner Deep-Link Construction');
const romeFlight = buildSkyscannerFlightUrl({ origin: 'JFK', destination: 'Rome, Italy', date: '2026-07-31' });
assert(romeFlight.url === 'https://www.skyscanner.com/transport/flights/jfk/fco/260731/', 'Rome flight URL matches valid IATA & YYMMDD pattern');
assert(!romeFlight.url.includes('Rome') && !romeFlight.url.includes('rome'), 'URL contains NO raw city name in path');
assert(romeFlight.url === romeFlight.url.toLowerCase(), 'URL path is 100% lowercase');

// Test 4: Safety Fallback for Unknown Locations
console.log('\nTest Group 4: Safety Fallback Mechanism');
const unknownFlight = buildSkyscannerFlightUrl({ origin: 'JFK', destination: 'Atlantis', date: '2026-07-31' });
assert(unknownFlight.isExact === false, 'Unknown destination flagged as non-exact');
assert(unknownFlight.url === 'https://www.skyscanner.com/transport/flights-from/jfk/to/atlantis/', 'Unknown destination uses safe search-from URL fallback');

// Test 5: Integration with bookingPartners.js
console.log('\nTest Group 5: bookingPartners Integration');
const flightInfo = getBookingLinkInfo('Rome, Italy', 'flight', null, { origin: 'JFK', startDate: '2026-07-31' });
assert(flightInfo.url === 'https://www.skyscanner.com/transport/flights/jfk/fco/260731/', 'getBookingLinkInfo returns valid non-404 Skyscanner link');

console.log(`\n--- TEST SUMMARY ---`);
console.log(`Passed: ${passed} | Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
}
