'use server'

export async function fetchRealHotels(destination) {
  if (!destination) {
    return { error: 'Missing destination' };
  }

  let apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (apiKey) apiKey = apiKey.replace(/^"|"$/g, '');

  if (!apiKey) {
    return { error: 'Missing API key' };
  }

  try {
    const q = `hotels in ${destination}`;
    const searchRes = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&type=lodging&key=${apiKey}`);
    
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      
      if (searchData.results && searchData.results.length > 0) {
        const hotels = searchData.results.slice(0, 8).map(place => {
          let photoUrl = null;
          let photos = [];
          if (place.photos && place.photos.length > 0) {
            photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${place.photos[0].photo_reference}&key=${apiKey}`;
            photos = place.photos.slice(0, 5).map(p => `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${p.photo_reference}&key=${apiKey}`);
          }
          
          return {
            name: place.name,
            rating: place.rating || 4.0,
            reviewCount: place.user_ratings_total || 0,
            address: place.formatted_address,
            image: photoUrl,
            photos: photos,
            coordinates: place.geometry?.location
          };
        });
        
        return { hotels };
      }
    }
  } catch (e) {
    console.error('Google Places API error:', e);
    return { error: 'Internal server error' };
  }
  
  return { hotels: [] };
}

export async function getPlaceDetails(query) {
  if (!query) {
    return { error: 'Missing query' };
  }

  let apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (apiKey) apiKey = apiKey.replace(/^"|"$/g, '');

  if (!apiKey) {
    return { error: 'Missing API key' };
  }

  try {
    const searchRes = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`);
    
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      
      if (searchData.results && searchData.results.length > 0) {
        const place = searchData.results[0];
        
        let photos = [];
        // If place_id is available, fetch Place Details for up to 10 photos
        if (place.place_id) {
          const detailsRes = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=photos,rating,user_ratings_total,formatted_address,geometry&key=${apiKey}`);
          if (detailsRes.ok) {
            const detailsData = await detailsRes.json();
            if (detailsData.result && detailsData.result.photos && detailsData.result.photos.length > 0) {
              photos = detailsData.result.photos.slice(0, 10).map(p => `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${p.photo_reference}&key=${apiKey}`);
            }
          }
        }
        
        // Fallback to textsearch photo if details failed
        if (photos.length === 0 && place.photos && place.photos.length > 0) {
          photos = place.photos.slice(0, 5).map(p => `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${p.photo_reference}&key=${apiKey}`);
        }
        
        return {
          name: place.name,
          rating: place.rating,
          reviewCount: place.user_ratings_total,
          address: place.formatted_address,
          photos: photos,
          coordinates: place.geometry?.location
        };
      }
    }
  } catch (e) {
    console.error('Google Places API error in getPlaceDetails:', e);
    return { error: 'Internal server error' };
  }
  
  return { error: 'Not found' };
}
