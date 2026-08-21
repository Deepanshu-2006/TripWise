import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const origins = searchParams.get('origins');
    const destinations = searchParams.get('destinations');
    let mode = searchParams.get('mode') || 'transit'; // walk, taxi (driving), transit

    if (mode === 'walk') mode = 'walking';
    if (mode === 'taxi') mode = 'driving';

    if (!origins || !destinations) {
      return NextResponse.json({ error: 'Missing origins or destinations' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing Google Maps API Key' }, { status: 500 });
    }

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&mode=${mode}&key=${apiKey}`;
    
    let res = await fetch(url);
    let data = await res.json();

    // Fallback to driving if transit fails to find a route
    if (mode === 'transit' && data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'ZERO_RESULTS') {
      const url2 = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&mode=driving&key=${apiKey}`;
      res = await fetch(url2);
      data = await res.json();
      data._fallbackMode = 'driving';
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Distance Matrix API error:', error);
    return NextResponse.json({ error: 'Failed to fetch distance' }, { status: 500 });
  }
}
