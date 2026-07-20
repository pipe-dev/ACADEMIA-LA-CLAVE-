import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + " karaoke instrumental pista")}`;
    
    // El servidor hace el request directo a YouTube, sin CORS proxy
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
      return NextResponse.json({ videos: [] });
    }
    
    const data = JSON.parse(match[1]);
    const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents[0]?.itemSectionRenderer?.contents;
    
    if (!contents) {
      return NextResponse.json({ videos: [] });
    }

    const videos = [];
    for (const item of contents) {
      if (item.videoRenderer) {
        const vr = item.videoRenderer;
        const id = vr.videoId;
        const title = vr.title?.runs?.[0]?.text;
        const thumbnail = vr.thumbnail?.thumbnails?.[0]?.url;
        
        if (id && title) {
          videos.push({ id, title, thumbnail });
        }
      }
    }
    
    // Filtro Inteligente: Puntuar según coincidencia
    const keywords = ["karaoke", "instrumental", "pista", "sin voz", "backing track"];
    const scored = videos.map(v => {
      const lowerTitle = v.title.toLowerCase();
      let score = 0;
      keywords.forEach(kw => {
        if (lowerTitle.includes(kw)) score += 10;
      });
      // Penalizar covers o reacciones
      if (lowerTitle.includes("cover") && !lowerTitle.includes("karaoke")) score -= 5;
      if (lowerTitle.includes("reaccion") || lowerTitle.includes("reaction")) score -= 10;
      return { ...v, score };
    }).sort((a, b) => (b.score || 0) - (a.score || 0));
    
    // Devolver el Top 3
    return NextResponse.json({ videos: scored.slice(0, 3) });

  } catch (error) {
    console.error("Error searching YouTube:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
