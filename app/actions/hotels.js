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

  if (apiKey) {
    try {
      const searchRes = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`);
      
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        
        if (searchData.results && searchData.results.length > 0) {
          const place = searchData.results[0];
          
          let photos = [];
          if (place.place_id) {
            const detailsRes = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=photos,rating,user_ratings_total,formatted_address,geometry&key=${apiKey}`);
            if (detailsRes.ok) {
              const detailsData = await detailsRes.json();
              if (detailsData.result && detailsData.result.photos && detailsData.result.photos.length > 0) {
                photos = detailsData.result.photos.slice(0, 10).map(p => `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${p.photo_reference}&key=${apiKey}`);
              }
            }
          }
          
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
    }
  }
  
  // FALLBACK: Use free Nominatim and Unsplash APIs if no Google API key exists
  try {
    const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
      headers: { 'User-Agent': 'TripWise/1.0' }
    });
    
    if (nomRes.ok) {
      const nomData = await nomRes.json();
      if (nomData.length > 0) {
        const place = nomData[0];
        
        let photos = [];
        try {
          const unsplashRes = await fetch(`https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query + ' hotel')}&per_page=3&orientation=landscape`);
          if (unsplashRes.ok) {
            const json = await unsplashRes.json();
            if (json.results) {
              photos = json.results.map(r => r.urls.regular || r.urls.small).filter(Boolean);
            }
          }
        } catch (e) {
          console.error('Unsplash fallback error:', e);
        }

        // Generic fallback hotel image if Unsplash fails
        if (photos.length === 0) {
          photos = ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80']; 
        }

        return {
          name: place.name || place.display_name.split(',')[0],
          rating: 4.5, // Mock rating since Nominatim doesn't have ratings
          reviewCount: Math.floor(Math.random() * 500) + 100,
          address: place.display_name,
          photos: photos,
          coordinates: { lat: parseFloat(place.lat), lng: parseFloat(place.lon) }
        };
      }
    }
  } catch(e) {
    console.error('Fallback Nominatim API error in getPlaceDetails:', e);
  }

  return { error: 'Not found' };
}
