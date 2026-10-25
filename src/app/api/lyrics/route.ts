import { NextResponse } from 'next/server';
import https from 'https';

if (typeof process !== 'undefined' && process.env) {
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  } catch {}
}

const LRCLIB_USER_AGENT = 'AfinApp-MusicPlayer/2.0 (https://afinapp.com; contact: soporte@afinapp.com)';

function cleanName(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')
    .replace(/\s*[-–—|]\s*.*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isDistinctiveTitle(title: string): boolean {
  const stopwords = new Set(['con', 'por', 'para', 'una', 'uno', 'los', 'las', 'les', 'del', 'que', 'sin', 'mas', 'pero', 'como']);
  const clean = cleanName(title).toLowerCase();
  const words = clean.split(/\s+/).filter(w => w.length > 2 && !stopwords.has(w));
  return words.length >= 2 || clean.length >= 14;
}

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

  const cleanTitle = cleanName(track_name || q || '');
  const cleanArtist = cleanName(artist_name || '');

  // Función de petición rápida con User-Agent verificado de LRCLIB
  const fetchData = async (url: string, headers: Record<string, string> = {}): Promise<{ status: number; data: string }> => {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': LRCLIB_USER_AGENT,
          'Accept': 'application/json, text/plain, text/html, */*',
          ...headers
        },
        signal: AbortSignal.timeout(4500)
      });
      const data = await res.text();
      return { status: res.status, data };
    } catch (err: any) {
      if (typeof https !== 'undefined' && typeof https.get === 'function') {
        try {
          return await new Promise((resolve) => {
            const req = https.get(url, { 
              rejectUnauthorized: false,
              timeout: 4500,
              headers: {
                'User-Agent': LRCLIB_USER_AGENT,
                ...headers
              }
            }, (res) => {
              let data = '';
              res.on('data', (chunk) => data += chunk);
              res.on('end', () => resolve({ status: res.statusCode || 500, data }));
            });
            req.on('error', () => resolve({ status: 500, data: '' }));
            req.on('timeout', () => { req.destroy(); resolve({ status: 408, data: '' }); });
          });
        } catch {}
      }
      return { status: 500, data: '' };
    }
  };

  try {
    // 1. Extraer variantes de artistas si es dueto o colaboración ("A & B", "A feat B")
    const artistsToTry: string[] = [];
    if (cleanArtist) {
      artistsToTry.push(cleanArtist);
      const splitArtists = cleanArtist
        .split(/&|,|\/|\bfeat\.?\b|\bft\.?\b|\by\b/i)
        .map(a => a.trim())
        .filter(a => a.length > 2 && a !== cleanArtist);
      artistsToTry.push(...splitArtists);
    }

    // 2. Intentar coincidencia directa 100% en LRCLIB /api/get
    if (cleanTitle && artistsToTry.length > 0) {
      for (const art of artistsToTry) {
        const lrclibGetUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(art)}`;
        const getRes = await fetchData(lrclibGetUrl);

        if (getRes.status === 200 && getRes.data) {
          try {
            const exactTrack = JSON.parse(getRes.data);
            if (exactTrack && (exactTrack.syncedLyrics || exactTrack.plainLyrics)) {
              return NextResponse.json([exactTrack], { headers: cacheHeaders });
            }
          } catch (e) {
            console.error("LRCLIB /api/get parse error", e);
          }
        }
      }

      // 3. Búsqueda específica por track_name Y artist_name
      for (const art of artistsToTry.slice(0, 2)) {
        const lrclibSearchSpecificUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(art)}`;
        const specificRes = await fetchData(lrclibSearchSpecificUrl);

        if (specificRes.status === 200 && specificRes.data) {
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

      // 4. Búsqueda combinada "Artista Título"
      const combinedQuery = `${artistsToTry[0]} ${cleanTitle}`;
      const lrclibCombinedUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(combinedQuery)}`;
      const combinedRes = await fetchData(lrclibCombinedUrl);

      if (combinedRes.status === 200 && combinedRes.data) {
        try {
          const json = JSON.parse(combinedRes.data);
          if (Array.isArray(json) && json.length > 0) {
            return NextResponse.json(json, { headers: cacheHeaders });
          }
        } catch (e) {
          console.error("LRCLIB combined search error", e);
        }
      }
    }

    // 5. Búsqueda por título si no se proveyó artista O si el título es distintivo
    // (Permite encontrar alabanzas/himnos/covers internacionales que están grabados por ministerios diferentes)
    if (cleanTitle && (!cleanArtist || isDistinctiveTitle(cleanTitle))) {
      const matchTrackName = (item: any): boolean => {
        if (!item || !item.trackName) return false;
        const it = cleanName(item.trackName).toLowerCase();
        const ct = cleanTitle.toLowerCase();
        return it === ct || it.includes(ct) || ct.includes(it);
      };

      const lrclibUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}`;
      const lrcRes = await fetchData(lrclibUrl);

      if (lrcRes.status === 200 && lrcRes.data) {
        try {
          const json = JSON.parse(lrcRes.data);
          if (Array.isArray(json) && json.length > 0) {
            const matches = json.filter(matchTrackName);
            if (matches.length > 0) {
              return NextResponse.json(matches, { headers: cacheHeaders });
            }
          }
        } catch (e) {
          console.error("LRCLIB track_name search error", e);
        }
      }

      // Búsqueda q con solo el título si track_name no arrojó resultados
      const lrclibGeneralUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(cleanTitle)}`;
      const lrcGenRes = await fetchData(lrclibGeneralUrl);

      if (lrcGenRes.status === 200 && lrcGenRes.data) {
        try {
          const json = JSON.parse(lrcGenRes.data);
          if (Array.isArray(json) && json.length > 0) {
            const matches = json.filter(matchTrackName);
            if (matches.length > 0) {
              return NextResponse.json(matches, { headers: cacheHeaders });
            }
          }
        } catch (e) {
          console.error("LRCLIB general search error", e);
        }
      }
    }

    // 6. Fallback a Genius para letras estáticas (con User-Agent y timeout seguro)
    if (cleanTitle) {
      try {
        const geniusQuery = cleanArtist ? `${cleanArtist} ${cleanTitle}`.trim() : cleanTitle;
        const geniusSearchUrl = `https://genius.com/api/search/multi?q=${encodeURIComponent(geniusQuery)}`;
        const geniusRes = await fetchData(geniusSearchUrl, {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        });

        if (geniusRes.status === 200 && geniusRes.data && geniusRes.data.startsWith('{')) {
          const geniusData = JSON.parse(geniusRes.data);
          const sections = geniusData.response?.sections || [];
          let hitPath = null;
          let hitTitle = cleanTitle;
          let hitArtist = cleanArtist;

          for (const sec of sections) {
            if (sec.type === 'song' && Array.isArray(sec.hits) && sec.hits.length > 0) {
              const topHit = sec.hits[0].result;
              const candArtist = (topHit.artist_names || '').toLowerCase();
              const isMatch = !cleanArtist || 
                candArtist.includes(cleanArtist.toLowerCase()) || 
                cleanArtist.toLowerCase().includes(candArtist) ||
                isDistinctiveTitle(cleanTitle);

              if (isMatch) {
                hitPath = topHit.path;
                hitTitle = topHit.title || cleanTitle;
                hitArtist = topHit.artist_names || cleanArtist;
                break;
              }
            }
          }

          if (hitPath) {
            const songPageRes = await fetchData(`https://genius.com${hitPath}`, {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            });
            if (songPageRes.status === 200 && songPageRes.data) {
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
    }

    return NextResponse.json({ error: "No lyrics found globally" }, { status: 404 });
  } catch (error: any) {
    console.error("Lyrics API proxy error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
