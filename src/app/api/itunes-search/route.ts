import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || "").trim();

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=15`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      headers: {
        "Accept": "application/json, text/javascript, */*",
        "User-Agent": "AfinApp-Music/1.0"
      },
      signal: controller.signal
    }).finally(() => clearTimeout(timer));

    if (!res.ok) {
      console.warn(`[itunes-search] Status: ${res.status}`);
      return NextResponse.json({ error: "Failed to fetch from iTunes" }, { status: 502 });
    }

    const data = await res.json();
    
    if (!data.results || data.results.length === 0) {
      return NextResponse.json([]);
    }

    const tracks = data.results.map((item: any) => {
      // Mejorar la calidad de la carátula de 100x100 a 600x600
      const highResArtwork = item.artworkUrl100 ? item.artworkUrl100.replace('100x100', '600x600') : '';
      
      return {
        id: item.trackId ? item.trackId.toString() : String(Math.random()),
        title: item.trackName || '',
        artist: item.artistName || 'Artista',
        thumbnail: highResArtwork,
        previewUrl: item.previewUrl || ''
      };
    });

    return NextResponse.json(tracks, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400'
      }
    });
  } catch (error: any) {
    console.error("iTunes search error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
