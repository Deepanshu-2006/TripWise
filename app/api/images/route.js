import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function fetchWikipediaImage(query) {
  try {
    const res = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query + ' landscape')}&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url&format=json`);
    if (res.ok) {
      const json = await res.json();
      const pages = json.query?.pages;
      if (pages) {
        const pageId = Object.keys(pages)[0];
        if (pageId && pageId !== '-1' && pages[pageId].imageinfo && pages[pageId].imageinfo.length > 0) {
          return [pages[pageId].imageinfo[0].url];
        }
      }
    }
  } catch (e) {
    console.error('Wikipedia fallback error:', e);
  }
  return null;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const count = parseInt(searchParams.get('count') || '5', 10);

  const fallbacks = [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80'
  ];

  if (!q) {
    return NextResponse.json({ images: fallbacks });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

  if (apiKey) {
    try {
      // 1. Text Search to get place_id
      const searchRes = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&key=${apiKey}`);
      
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        
        if (searchData.results && searchData.results.length > 0) {
          const placeId = searchData.results[0].place_id;
          
          // 2. Place Details to get multiple photos
          const detailsRes = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${apiKey}`);
          
          if (detailsRes.ok) {
            const detailsData = await detailsRes.json();
            const photos = detailsData.result?.photos;
            
            if (photos && photos.length > 0) {
              // Prefer landscape photos (width > height) for carousels
              const landscapePhotos = photos.filter(p => p.width > p.height * 1.1);
              // Use landscape photos first, then pad with the rest if we need more
              const selectedPhotos = [...landscapePhotos, ...photos.filter(p => p.width <= p.height * 1.1)].slice(0, count);
              
              const photoUrls = selectedPhotos.map(
                photo => `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${photo.photo_reference}&key=${apiKey}`
              );
              return NextResponse.json({ images: photoUrls });
            }
          }
        }
      }
    } catch (e) {
      console.error('Google Places API error:', e);
    }
  }

  // Fallback to Wikipedia if Places API fails, returns no photos, or no API key
  const wikipediaUrls = await fetchWikipediaImage(q);
  if (wikipediaUrls) {
    return NextResponse.json({ images: wikipediaUrls });
  }

  // Final fallback
  return NextResponse.json({ images: fallbacks });
}
