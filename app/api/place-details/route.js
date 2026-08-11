import { NextResponse } from 'next/server';
// Force recompile 1
export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  
  if (!q) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  let apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (apiKey) apiKey = apiKey.replace(/^"|"$/g, '');

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 500 });
  }

  try {
    // 1. Text Search to get place_id
    const searchRes = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&key=${apiKey}`);
    
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      
      if (searchData.results && searchData.results.length > 0) {
        const placeId = searchData.results[0].place_id;
        const location = searchData.results[0].geometry?.location;
        const address = searchData.results[0].formatted_address;
        
        // 2. Place Details to get multiple photos
        const detailsRes = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${apiKey}`);
        
        let photoUrls = [];
        if (detailsRes.ok) {
          const detailsData = await detailsRes.json();
          const photos = detailsData.result?.photos;
          
          if (photos && photos.length > 0) {
            // Prefer landscape photos (width > height) for carousels
            const landscapePhotos = photos.filter(p => p.width > p.height * 1.1);
            // Use landscape photos first, then pad with the rest if we need more
            const selectedPhotos = [...landscapePhotos, ...photos.filter(p => p.width <= p.height * 1.1)].slice(0, 10);
            
            photoUrls = selectedPhotos.map(
              photo => `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${photo.photo_reference}&key=${apiKey}`
            );
          }
        }
        
        return NextResponse.json({ 
          coordinates: location,
          address: address,
          photos: photoUrls 
        });
      }
    }
  } catch (e) {
    console.error('Google Places API error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
