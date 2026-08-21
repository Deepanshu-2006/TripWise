'use server';

export async function getDistance(origins, destinations, requestedMode = 'transit') {
  try {
    let mode = requestedMode;
    // OSRM supports: driving, walking, cycling
    let osrmMode = 'driving';
    if (mode === 'walk') {
      osrmMode = 'walking';
      mode = 'walking';
    } else if (mode === 'taxi') {
      osrmMode = 'driving';
      mode = 'driving';
    } else {
      osrmMode = 'driving'; // default to driving for transit
    }

    if (!origins || !destinations) {
      return { error: 'Missing origins or destinations' };
    }

    // origins and destinations are in "lat,lng" format
    const [lat1, lng1] = origins.split(',');
    const [lat2, lng2] = destinations.split(',');
    
    // OSRM expects format: lng,lat;lng,lat
    const coordinates = `${lng1},${lat1};${lng2},${lat2}`;
    const url = `https://router.project-osrm.org/route/v1/${osrmMode}/${coordinates}?overview=false`;
    
    const res = await fetch(url);
    const data = await res.json();

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const distKm = (route.distance / 1000).toFixed(1); // route.distance is in meters
      let durMins = Math.round(route.duration / 60); // route.duration is in seconds
      
      // If requestedMode was transit, we fallback to driving time but maybe add a penalty
      let finalMode = mode;
      if (requestedMode === 'transit') {
        durMins = Math.round(durMins * 1.5); // Add transit penalty over driving
        finalMode = 'transit';
      } else if (requestedMode === 'taxi') {
        finalMode = 'taxi';
      } else if (requestedMode === 'walk') {
        finalMode = 'walk';
      }

      return {
        status: 'OK',
        rows: [
          {
            elements: [
              {
                status: 'OK',
                distance: { text: `${distKm} km` },
                duration: { value: durMins * 60, text: `${durMins} mins` }
              }
            ]
          }
        ],
        _fallbackMode: finalMode !== requestedMode ? finalMode : undefined
      };
    }

    return { error: 'Failed to fetch OSRM distance' };
  } catch (error) {
    console.error('OSRM API error:', error);
    return { error: 'Failed to fetch distance' };
  }
}
