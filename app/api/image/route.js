import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  // Default fallback image if nothing matches
  const fallback = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&q=80';

  if (!q) {
    return NextResponse.redirect(fallback);
  }

  try {
    const res = await fetch(`https://unsplash.com/napi/search/photos?query=${encodeURIComponent(q)}&per_page=1&orientation=landscape`, {
      cache: 'no-store'
    });
    
    if (res.ok) {
      const json = await res.json();
      const url = json.results?.[0]?.urls?.small || json.results?.[0]?.urls?.regular;

      if (url) {
        return NextResponse.redirect(url);
      }
    }
  } catch (e) {
    console.error('Image search error:', e);
  }

  return NextResponse.redirect(fallback);
}
