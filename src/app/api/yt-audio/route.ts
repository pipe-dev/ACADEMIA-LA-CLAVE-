import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');
    if (!videoId) return new NextResponse("Missing videoId", { status: 400 });

    const instances = ["https://yewtu.be", "https://vid.puffyan.us", "https://invidious.flokinet.to"];
    let audioUrl = null;

    for (const instance of instances) {
      try {
        const res = await fetch(`${instance}/api/v1/videos/${videoId}`, { 
          headers: { 'User-Agent': 'Mozilla/5.0' } 
        });
        if (res.ok) {
          const data = await res.json();
          const formats = data.adaptiveFormats || [];
          const audioFormats = formats.filter((f: any) => f.type?.startsWith('audio/'));
          if (audioFormats.length > 0) {
            audioFormats.sort((a: any, b: any) => parseInt(b.bitrate || '0') - parseInt(a.bitrate || '0'));
            audioUrl = audioFormats[0].url;
            break;
          }
        }
      } catch (e) { continue; }
    }

    if (!audioUrl) {
      return new NextResponse("Could not fetch audio metadata from proxies", { status: 500 });
    }

    // Now proxy the audio stream
    const audioRes = await fetch(audioUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!audioRes.ok) {
      return new NextResponse("Failed to proxy audio stream", { status: audioRes.status });
    }

    const headers = new Headers(audioRes.headers);
    headers.set('Access-Control-Allow-Origin', '*');

    return new NextResponse(audioRes.body, {
      status: audioRes.status,
      headers: headers
    });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}
