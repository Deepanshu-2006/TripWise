import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const destination = searchParams.get('destination');
  
  if (!destination) {
    return NextResponse.json({ error: 'Missing destination' }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 500 });
  }

  try {
    // Text Search to get real hotels in the destination
    const q = `hotels in ${destination}`;
    const searchRes = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&type=lodging&key=${apiKey}`);
    
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      
      if (searchData.results && searchData.results.length > 0) {
        // Return top 8 hotels
        const hotels = searchData.results.slice(0, 8).map(place => {
          let photoUrl = null;
          if (place.photos && place.photos.length > 0) {
            photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${place.photos[0].photo_reference}&key=${apiKey}`;
          }
          
          return {
            name: place.name,
            rating: place.rating || 4.0,
            reviewCount: place.user_ratings_total || 0,
            address: place.formatted_address,
            image: photoUrl,
            coordinates: place.geometry?.location
          };
        });
        
        return NextResponse.json({ hotels });
      }
    }
  } catch (e) {
    console.error('Google Places API error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  
  return NextResponse.json({ hotels: [] });
}
