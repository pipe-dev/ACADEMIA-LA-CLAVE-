import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import fs from 'fs';

if (typeof process !== 'undefined' && process.env) {
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  } catch {}
}

// Caché en memoria para enlaces de streaming directos (evita re-extracción en seek o replay)
const audioUrlCache = new Map<string, { url: string; expire: number }>();

function getAudioUrl(videoId: string): Promise<string> {
  const cached = audioUrlCache.get(videoId);
  if (cached && cached.expire > Date.now()) {
    return Promise.resolve(cached.url);
  }

  // 1. Soporte para microservicio / proxy extractor externo si está configurado en env
  const proxyBase = (typeof process !== 'undefined' && process.env ? (process.env.YT_AUDIO_PROXY_URL || process.env.NEXT_PUBLIC_YT_AUDIO_PROXY_URL) : undefined);
  if (proxyBase) {
    return fetch(`${proxyBase.replace(/\/$/, '')}/api/yt-audio-url?videoId=${encodeURIComponent(videoId)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error('Proxy returned ' + r.status);
        const data = await r.json();
        if (data.url) {
          audioUrlCache.set(videoId, { url: data.url, expire: Date.now() + 2 * 3600 * 1000 });
          return data.url;
        }
        throw new Error('No URL in proxy response');
      });
  }

  // 2. Si estamos en un entorno con child_process (Node.js en local o VPS)
  if (typeof execFile === 'function') {
    return new Promise((resolve, reject) => {
      let pythonExe = 'python';
      try {
        if (typeof fs !== 'undefined' && fs.existsSync && fs.existsSync('C:\\Python314\\python.exe')) {
          pythonExe = 'C:\\Python314\\python.exe';
        }
      } catch {}

      const args = [
        '-m', 'yt_dlp',
        '-g',
        '-f', '140/ba[ext=m4a]/ba[acodec^=mp4a]/ba/b',
        '--no-warnings',
        `https://www.youtube.com/watch?v=${videoId}`
      ];

      execFile(pythonExe, args, { timeout: 25000 }, (error, stdout) => {
        if (error) {
          return reject(error);
        }
        const lines = (stdout || '').trim().split('\n');
        const url = lines[lines.length - 1]?.trim();
        if (!url || !url.startsWith('http')) {
          return reject(new Error('No valid direct audio URL extracted'));
        }
        audioUrlCache.set(videoId, { url, expire: Date.now() + 2 * 3600 * 1000 });
        resolve(url);
      });
    });
  }

  return Promise.reject(new Error('Audio extraction requires local companion or proxy'));
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Range, Content-Type, Accept',
      'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
    }
  });
}

export async function HEAD(req: Request) {
  return GET(req);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');
    if (!videoId) {
      return new NextResponse("Missing videoId", { status: 400 });
    }

    let audioUrl: string;
    try {
      audioUrl = await getAudioUrl(videoId);
    } catch (extractErr: any) {
      return NextResponse.json(
        { error: extractErr.message || "Extraction unavailable", fallback: true },
        { 
          status: 503, 
          headers: { 
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD'
          } 
        }
      );
    }

    const rangeHeader = req.headers.get('range');
    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    };
    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader;
    }

    const upstreamRes = await fetch(audioUrl, {
      headers: fetchHeaders,
      redirect: 'follow'
    });

    if (upstreamRes.status === 403) {
      audioUrlCache.delete(videoId);
    }

    const responseHeaders = new Headers();
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
    responseHeaders.set('Access-Control-Allow-Headers', 'Range, Content-Type, Accept');
    responseHeaders.set('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
    responseHeaders.set('Accept-Ranges', 'bytes');

    const ct = upstreamRes.headers.get('content-type') || 'audio/mp4';
    responseHeaders.set('Content-Type', ct);

    const cl = upstreamRes.headers.get('content-length');
    if (cl) responseHeaders.set('Content-Length', cl);

    const cr = upstreamRes.headers.get('content-range');
    if (cr) responseHeaders.set('Content-Range', cr);

    if (req.method === 'HEAD') {
      return new NextResponse(null, {
        status: upstreamRes.status,
        headers: responseHeaders
      });
    }

    return new NextResponse(upstreamRes.body, {
      status: upstreamRes.status,
      headers: responseHeaders
    });
  } catch (error: any) {
    console.error("Error in /api/yt-audio:", error);
    return new NextResponse(error.message || "Error extracting audio", { 
      status: 500, 
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
        'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
      } 
    });
  }
}
