const { getTrip } = require('./app/actions/trips.js');
async function run() {
  const trip = await getTrip('b3f2a1f7-fb0e-456e-84c4-220fe3912e4c');
  const fs = require('fs');
  fs.writeFileSync('trip_debug.json', JSON.stringify(trip, null, 2));
}
run();
