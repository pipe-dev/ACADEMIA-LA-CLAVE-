import { NextResponse } from 'next/server';

// Bypass local SSL issues on some Windows machines/antiviruses
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || "").trim();

  if (!query) {
    return NextResponse.json({ error: "Missing or empty query" }, { status: 400 });
  }

  try {
    const finalQuery = query.toLowerCase().includes("letra") || query.toLowerCase().includes("lyrics") || query.toLowerCase().includes("audio") ? query : `${query} letra`;
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(finalQuery)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch from YouTube" }, { status: 500 });
    }
    
    const html = await response.text();
    const match = html.match(/ytInitialData\s*=\s*(\{.*?\});\s*<\/script>/);
    
    if (!match) {
      return NextResponse.json([]);
    }
    
    const data = JSON.parse(match[1]);
    const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents[0]?.itemSectionRenderer?.contents;
    
    if (!contents) {
      return NextResponse.json([]);
    }

    const badKeywords = [
      "mix", "compilacion", "compilación", "enganchado", "enganchados", "recopilacion", 
      "recopilación", "lo mejor de", "grandes exitos", "grandes éxitos", "mejores clasicos",
      "mejores clásicos", "album", "álbum", "discografia", "discografía", "playlist", 
      "viejitas", "romanticos", "románticos", "clasicos", "clásicos", "exitos", "éxitos"
    ];

    const videos = [];
    for (const item of contents) {
      if (item.videoRenderer) {
        const vr = item.videoRenderer;
        const id = vr.videoId;
        const title = vr.title?.runs?.[0]?.text || "";
        const thumbnail = vr.thumbnail?.thumbnails?.[0]?.url;
        const channel = vr.ownerText?.runs?.[0]?.text || vr.longBylineText?.runs?.[0]?.text || 'YouTube Channel';
        const lengthText = vr.lengthText?.simpleText || "";

        // Check if duration is over 10 minutes (e.g. "12:34" or "1:05:20")
        const parts = lengthText.split(':').map(Number);
        const durationSeconds = parts.length === 3 ? parts[0]*3600 + parts[1]*60 + parts[2] : parts.length === 2 ? parts[0]*60 + parts[1] : 0;
        const isLong = durationSeconds > 600; // > 10 mins

        // Check for bad mix keywords (only if query doesn't explicitly ask for mix)
        const isMixTitle = !query.toLowerCase().includes("mix") && badKeywords.some(kw => title.toLowerCase().includes(kw));

        if (id && title && !isLong && !isMixTitle) {
          videos.push({ id, title, thumbnail, channel });
        }
      }
    }
    
    return NextResponse.json(videos.slice(0, 12));

  } catch (error) {
    console.error("Error searching YouTube:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
