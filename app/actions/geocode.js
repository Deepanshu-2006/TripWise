'use server';

export async function geocodeDestination(destination) {
  if (!destination) return null;
  
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`, {
      headers: {
        'User-Agent': 'TripWiseApp/1.0 (admin@tripwise.com)',
      },
      // Cache the geocoding results aggressively to prevent rate limiting
      next: { revalidate: 604800 } 
    });
    
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error("Geocoding action failed:", error);
    return null;
  }
}
