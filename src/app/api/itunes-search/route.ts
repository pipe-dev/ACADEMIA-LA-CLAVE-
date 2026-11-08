import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || "").trim();

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  // 1. Intentar primero con Deezer API (rápido, sin bloqueos de IP en Cloudflare y con portadas 500x500 HD)
  try {
    const deezerUrl = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=20`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(deezerUrl, { signal: controller.signal }).finally(() => clearTimeout(timer));

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.data) && data.data.length > 0) {
        const tracks = data.data.map((item: any) => ({
          id: `dz_${item.id}`,
          title: item.title || '',
          artist: item.artist?.name || 'Artista',
          thumbnail: item.album?.cover_big || item.album?.cover_medium || '',
          previewUrl: item.preview || ''
        }));

        return NextResponse.json(tracks, {
          headers: {
            'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }
  } catch (dzErr) {
    console.warn('[song-search] Error en Deezer, intentando iTunes:', dzErr);
  }

  // 2. Respaldo secundario: iTunes Search API
  try {
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=15`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(itunesUrl, {
      headers: {
        "Accept": "application/json, text/javascript, */*",
        "User-Agent": "AfinApp-Music/1.0"
      },
      signal: controller.signal
    }).finally(() => clearTimeout(timer));

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.results) && data.results.length > 0) {
        const tracks = data.results.map((item: any) => ({
          id: item.trackId ? item.trackId.toString() : String(Math.random()),
          title: item.trackName || '',
          artist: item.artistName || 'Artista',
          thumbnail: item.artworkUrl100 ? item.artworkUrl100.replace('100x100', '600x600') : '',
          previewUrl: item.previewUrl || ''
        }));

        return NextResponse.json(tracks, {
          headers: {
            'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }
  } catch (itunesErr) {
    console.warn('[song-search] Error en iTunes:', itunesErr);
  }

  return NextResponse.json([], { headers: { 'Access-Control-Allow-Origin': '*' } });
}
