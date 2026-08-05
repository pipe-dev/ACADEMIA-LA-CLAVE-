import { NextResponse } from 'next/server';
import https from 'https';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  
  if (!q) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  // Función auxiliar para petición con https.get
  const fetchHttps = (url: string): Promise<any> => {
    return new Promise((resolve) => {
      https.get(url, { 
        rejectUnauthorized: false,
        headers: {
          'User-Agent': 'AfinApp v1.0 (https://github.com/afinapp/afinapp)',
          'Accept-Encoding': 'identity'
        }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          resolve({ status: res.statusCode, data });
        });
      }).on('error', (err) => {
        resolve({ status: 500, error: err.message });
      });
    });
  };

  try {
    // 1. Intentar con lrclib.net primero
    const lrclibUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(q)}`;
    const lrcRes = await fetchHttps(lrclibUrl);

    if (lrcRes.status === 200) {
      try {
        const json = JSON.parse(lrcRes.data);
        if (json && json.length > 0) {
          return NextResponse.json(json);
        }
      } catch (e) {
        console.error("LRCLIB JSON Parse error", e);
      }
    }

    // 2. Fallback a api.lyrics.ovh
    let artist = "Desconocido";
    let title = q.replace(/\(.*\)|\[.*\]/g, '').trim();

    // Usar iTunes Search API para normalizar el Artista y el Título
    try {
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(title)}&entity=song&limit=1`;
      const itunesRes = await fetchHttps(itunesUrl);
      if (itunesRes.status === 200) {
        const itunesData = JSON.parse(itunesRes.data);
        if (itunesData.results && itunesData.results.length > 0) {
          artist = itunesData.results[0].artistName;
          title = itunesData.results[0].trackName;
        } else {
          // Fallback manual si iTunes no encuentra
          if (title.includes('-')) {
            const parts = title.split('-');
            artist = parts[0].trim();
            title = parts[1].trim();
          } else {
            const parts = title.split(' ');
            if (parts.length > 1) {
              artist = parts[0];
              title = parts.slice(1).join(' ');
            }
          }
        }
      }
    } catch (e) {
      console.error("iTunes API error", e);
    }

    const ovhUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
    const ovhRes = await fetchHttps(ovhUrl);

    if (ovhRes.status === 200) {
      try {
        const json = JSON.parse(ovhRes.data);
        if (json.lyrics) {
          return NextResponse.json([{
            id: Date.now(),
            trackName: title,
            artistName: artist,
            albumName: "",
            duration: 0,
            instrumental: false,
            plainLyrics: json.lyrics,
            syncedLyrics: null
          }]);
        }
      } catch (e) {
        console.error("OVH JSON Parse error", e);
      }
    }

    // Si ambos fallaron
    return NextResponse.json({ error: "No lyrics found globally" }, { status: 404 });
  } catch (error: any) {
    console.error("Lyrics API proxy error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
