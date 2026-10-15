import { NextResponse } from 'next/server';
import https from 'https';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const track_name = searchParams.get('track_name') || searchParams.get('title');
  const artist_name = searchParams.get('artist_name') || searchParams.get('artist');
  
  if (!q && !track_name) {
    return NextResponse.json({ error: "Missing query or track_name" }, { status: 400 });
  }

  const cacheHeaders = {
    'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800'
  };

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
    // 1. Si tenemos track_name y artist_name específicos, consultar /api/get (coincidencia exacta 100%)
    if (track_name && artist_name) {
      const lrclibGetUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(track_name)}&artist_name=${encodeURIComponent(artist_name)}`;
      const getRes = await fetchHttps(lrclibGetUrl);

      if (getRes.status === 200) {
        try {
          const exactTrack = JSON.parse(getRes.data);
          if (exactTrack && (exactTrack.syncedLyrics || exactTrack.plainLyrics)) {
            return NextResponse.json([exactTrack], { headers: cacheHeaders });
          }
        } catch (e) {
          console.error("LRCLIB /api/get parse error", e);
        }
      }

      // 2. Si /api/get no devolvió coincidencia exacta, buscar específicamente por track_name y artist_name
      const lrclibSearchSpecificUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(track_name)}&artist_name=${encodeURIComponent(artist_name)}`;
      const specificRes = await fetchHttps(lrclibSearchSpecificUrl);

      if (specificRes.status === 200) {
        try {
          const json = JSON.parse(specificRes.data);
          if (Array.isArray(json) && json.length > 0) {
            return NextResponse.json(json, { headers: cacheHeaders });
          }
        } catch (e) {
          console.error("LRCLIB specific search error", e);
        }
      }
    }

    // 3. Intentar con búsqueda general en lrclib.net
    const generalQuery = q || `${artist_name || ''} ${track_name || ''}`.trim();
    const lrclibUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(generalQuery)}`;
    const lrcRes = await fetchHttps(lrclibUrl);

    if (lrcRes.status === 200) {
      try {
        const json = JSON.parse(lrcRes.data);
        if (Array.isArray(json) && json.length > 0) {
          return NextResponse.json(json, { headers: cacheHeaders });
        }
      } catch (e) {
        console.error("LRCLIB JSON Parse error", e);
      }
    }

    // 4. Fallback a api.lyrics.ovh
    let artist = artist_name || "Desconocido";
    let title = (track_name || generalQuery).replace(/\(.*\)|\[.*\]/g, '').trim();

    // Usar iTunes Search API para normalizar el Artista y el Título si no se tienen
    if (!artist_name || artist === "Desconocido") {
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
          }], { headers: cacheHeaders });
        }
      } catch (e) {
        console.error("OVH JSON Parse error", e);
      }
    }

    // 5. Fallback a Genius Search y Extractor de Letras Estáticas
    try {
      const geniusQuery = `${artist} ${title}`.trim();
      const geniusSearchUrl = `https://genius.com/api/search/multi?q=${encodeURIComponent(geniusQuery)}`;
      const geniusRes = await fetchHttps(geniusSearchUrl);

      if (geniusRes.status === 200) {
        const geniusData = JSON.parse(geniusRes.data);
        const sections = geniusData.response?.sections || [];
        let hitPath = null;
        let hitTitle = title;
        let hitArtist = artist;

        for (const sec of sections) {
          if (sec.type === 'song' && Array.isArray(sec.hits) && sec.hits.length > 0) {
            const topHit = sec.hits[0].result;
            hitPath = topHit.path;
            hitTitle = topHit.title || title;
            hitArtist = topHit.artist_names || artist;
            break;
          }
        }

        if (hitPath) {
          const songPageRes = await fetchHttps(`https://genius.com${hitPath}`);
          if (songPageRes.status === 200) {
            const html = songPageRes.data;
            const containers = html.match(/data-lyrics-container="true"[^>]*>([\s\S]*?)<\/div>/g);
            if (containers && containers.length > 0) {
              let text = containers.map((c: string) => {
                return c
                  .replace(/^<div[^>]*>/i, '')
                  .replace(/^[^>]*>/, '')
                  .replace(/<\/div>$/i, '')
                  .replace(/<br\s*\/?>/gi, '\n')
                  .replace(/<\/p>/gi, '\n')
                  .replace(/<[^>]+>/g, '')
                  .replace(/&#x27;/g, "'")
                  .replace(/&amp;/g, '&')
                  .replace(/&quot;/g, '"');
              }).join('\n\n');

              text = text.replace(/^\d+\s+Contributors[\s\S]*?(Lyrics)?/i, '').trim();
              text = text.replace(/^Translations[\s\S]*?(Lyrics)?/i, '').trim();

              if (text && text.length > 20) {
                return NextResponse.json([{
                  id: Date.now(),
                  trackName: hitTitle,
                  artistName: hitArtist,
                  albumName: '',
                  duration: 0,
                  instrumental: false,
                  plainLyrics: text,
                  syncedLyrics: null
                }], { headers: cacheHeaders });
              }
            }
          }
        }
      }
    } catch (geniusErr) {
      console.error("Genius search error", geniusErr);
    }

    // Si todos los proveedores fallaron
    return NextResponse.json({ error: "No lyrics found globally" }, { status: 404 });
  } catch (error: any) {
    console.error("Lyrics API proxy error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
