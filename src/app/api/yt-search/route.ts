import { NextResponse } from 'next/server';

if (typeof process !== 'undefined' && process.env) {
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  } catch {}
}

const badKeywords = [
  "mix", "compilacion", "compilación", "enganchado", "enganchados", "recopilacion", 
  "recopilación", "lo mejor de", "grandes exitos", "grandes éxitos", "mejores clasicos",
  "mejores clásicos", "album", "álbum", "discografia", "discografía", "playlist", 
  "viejitas", "romanticos", "románticos", "clasicos", "clásicos", "exitos", "éxitos"
];

function parseDurationSeconds(lengthText: string): number {
  if (!lengthText) return 0;
  const parts = lengthText.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

/**
 * Búsqueda vía YouTube Innertube API (JSON oficial sin bloqueo de raspado HTML)
 */
async function searchInnertube(query: string) {
  try {
    const res = await fetch('https://www.youtube.com/youtubei/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'X-YouTube-Client-Name': '1',
        'X-YouTube-Client-Version': '2.20240410.01.00',
        'Origin': 'https://www.youtube.com'
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'WEB',
            clientVersion: '2.20240410.01.00',
            hl: 'es',
            gl: 'ES',
            utcOffsetMinutes: 0
          }
        },
        query
      }),
      signal: AbortSignal.timeout(6000)
    });

    if (!res.ok) return null;
    const data = await res.json();
    const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents;
    if (!Array.isArray(contents)) return null;

    const videos: Array<{ id: string; title: string; thumbnail?: string; channel?: string }> = [];
    for (const item of contents) {
      if (item.videoRenderer) {
        const vr = item.videoRenderer;
        const id = vr.videoId;
        const title = vr.title?.runs?.[0]?.text || '';
        const thumbnail = vr.thumbnail?.thumbnails?.[0]?.url;
        const channel = vr.ownerText?.runs?.[0]?.text || vr.longBylineText?.runs?.[0]?.text || 'YouTube Channel';
        const lengthText = vr.lengthText?.simpleText || '';

        const durationSeconds = parseDurationSeconds(lengthText);
        const isLong = durationSeconds > 600; // > 10 mins
        const isMixTitle = !query.toLowerCase().includes('mix') && badKeywords.some(kw => title.toLowerCase().includes(kw));

        if (id && title && !isLong && !isMixTitle) {
          videos.push({ id, title, thumbnail, channel });
        }
      }
    }
    return videos;
  } catch (err) {
    console.warn('[yt-search] Innertube search error, falling back:', err);
    return null;
  }
}

/**
 * Fallback a raspado HTML tradicional de youtube.com/results
 */
async function searchHtmlScraper(query: string) {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!response.ok) return null;
    const html = await response.text();
    const match = html.match(/ytInitialData\s*=\s*(\{.*?\});\s*<\/script>/);
    if (!match) return null;

    const data = JSON.parse(match[1]);
    const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents;
    if (!Array.isArray(contents)) return null;

    const videos: Array<{ id: string; title: string; thumbnail?: string; channel?: string }> = [];
    for (const item of contents) {
      if (item.videoRenderer) {
        const vr = item.videoRenderer;
        const id = vr.videoId;
        const title = vr.title?.runs?.[0]?.text || '';
        const thumbnail = vr.thumbnail?.thumbnails?.[0]?.url;
        const channel = vr.ownerText?.runs?.[0]?.text || vr.longBylineText?.runs?.[0]?.text || 'YouTube Channel';
        const lengthText = vr.lengthText?.simpleText || '';

        const durationSeconds = parseDurationSeconds(lengthText);
        const isLong = durationSeconds > 600;
        const isMixTitle = !query.toLowerCase().includes('mix') && badKeywords.some(kw => title.toLowerCase().includes(kw));

        if (id && title && !isLong && !isMixTitle) {
          videos.push({ id, title, thumbnail, channel });
        }
      }
    }
    return videos;
  } catch (err) {
    console.warn('[yt-search] Scraper search error:', err);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || "").trim();

  if (!query) {
    return NextResponse.json({ error: "Missing or empty query" }, { status: 400 });
  }

  try {
    const normalized = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const lower = normalized.toLowerCase();
    const isSpecial = lower.includes("letra") || lower.includes("lyrics") || lower.includes("audio") || lower.includes("karaoke") || lower.includes("instrumental") || lower.includes("pista");
    const finalQuery = isSpecial ? normalized : `${normalized} letra`;

    // 1. Intentar primero con la API Innertube (rápida, estructurada y sin bloqueos)
    let videos = await searchInnertube(finalQuery);

    // 2. Fallback a raspado HTML si Innertube no devolvió resultados
    if (!videos || videos.length === 0) {
      videos = await searchHtmlScraper(finalQuery);
    }

    return NextResponse.json((videos || []).slice(0, 12), {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    });
  } catch (error) {
    console.error("Error searching YouTube:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
