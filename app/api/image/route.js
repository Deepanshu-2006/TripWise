import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const TRANSPARENT_PIXEL_BASE64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  const getTransparentResponse = () => {
    return new NextResponse(Buffer.from(TRANSPARENT_PIXEL_BASE64, 'base64'), {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'public, max-age=86400'
      }
    });
  };

  if (!q) {
    return getTransparentResponse();
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

  if (apiKey) {
    try {
      let searchQuery = q;
      
      // Intelligent landmark mapping for famous cities to ensure iconic hero backgrounds
      const lowercaseQ = (q || '').toLowerCase();
      const landmarks = {
        'paris': 'Eiffel Tower, Paris',
        'rome': 'Colosseum, Rome',
        'london': 'Big Ben, London',
        'new york': 'Statue of Liberty, New York',
        'tokyo': 'Tokyo Tower, Tokyo',
        'dubai': 'Burj Khalifa, Dubai',
        'sydney': 'Sydney Opera House, Sydney',
        'rio': 'Christ the Redeemer, Rio de Janeiro',
        'agra': 'Taj Mahal, Agra',
        'cairo': 'Pyramids of Giza, Cairo'
      };

      for (const [city, landmark] of Object.entries(landmarks)) {
        if (lowercaseQ.includes(city)) {
          searchQuery = landmark;
          break;
        }
      }

      // 1. Text Search to get place_id
      const searchRes = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`);
      
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        
        if (searchData.results && searchData.results.length > 0) {
          const placeId = searchData.results[0].place_id;
          
          // 2. Place Details to get photos
          const detailsRes = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${apiKey}`);
          
          if (detailsRes.ok) {
            const detailsData = await detailsRes.json();
            const photos = detailsData.result?.photos;
            
            if (photos && photos.length > 0) {
              // Find the first landscape photo (width > height) for a better hero background
              let bestPhoto = photos.find(p => p.width > p.height * 1.2);
              if (!bestPhoto) bestPhoto = photos[0]; // fallback to first if no good landscape found
              
              // Return super high quality image
              const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&photo_reference=${bestPhoto.photo_reference}&key=${apiKey}`;
              return NextResponse.redirect(photoUrl);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching image from Google Places:', error);
    }
  }

  // Fallback to a transparent pixel if Google Places is missing or failed
  return getTransparentResponse();
}
