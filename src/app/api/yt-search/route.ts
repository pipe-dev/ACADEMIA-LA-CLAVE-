import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    
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

    const videos = [];
    for (const item of contents) {
      if (item.videoRenderer) {
        const vr = item.videoRenderer;
        const id = vr.videoId;
        const title = vr.title?.runs?.[0]?.text;
        const thumbnail = vr.thumbnail?.thumbnails?.[0]?.url;
        const channel = vr.ownerText?.runs?.[0]?.text || vr.longBylineText?.runs?.[0]?.text || 'YouTube Channel';
        
        if (id && title) {
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
