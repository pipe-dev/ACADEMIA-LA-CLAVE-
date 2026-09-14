import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import https from 'https';
import fs from 'fs';
import { Readable } from 'stream';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Caché en memoria para enlaces de streaming directos (evita re-extracción en seek o replay)
const audioUrlCache = new Map<string, { url: string; expire: number }>();

function getAudioUrl(videoId: string): Promise<string> {
  const cached = audioUrlCache.get(videoId);
  if (cached && cached.expire > Date.now()) {
    return Promise.resolve(cached.url);
  }

  return new Promise((resolve, reject) => {
    const pythonExe = fs.existsSync('C:\\Python314\\python.exe') ? 'C:\\Python314\\python.exe' : 'python';
    const args = [
      '-m', 'yt_dlp',
      '--js-runtimes', 'node:node',
      '-g',
      '-f', '140/ba[ext=m4a]/ba[acodec^=mp4a]/ba/b',
      '--no-warnings',
      `https://www.youtube.com/watch?v=${videoId}`
    ];

    execFile(pythonExe, args, { timeout: 25000 }, (error, stdout) => {
      if (error) {
        // Intento de respaldo sin el flag de js-runtimes por si acaso
        const fallbackArgs = [
          '-m', 'yt_dlp',
          '-g',
          '-f', '140/ba[ext=m4a]/ba[acodec^=mp4a]/ba/b',
          '--no-warnings',
          `https://www.youtube.com/watch?v=${videoId}`
        ];
        execFile(pythonExe, fallbackArgs, { timeout: 25000 }, (fbErr, fbStdout) => {
          if (fbErr) return reject(fbErr);
          const lines = fbStdout.trim().split('\n');
          const url = lines[lines.length - 1]?.trim();
          if (!url || !url.startsWith('http')) {
            return reject(new Error('No valid direct audio URL extracted in fallback'));
          }
          audioUrlCache.set(videoId, { url, expire: Date.now() + 2 * 3600 * 1000 });
          resolve(url);
        });
        return;
      }
      const lines = stdout.trim().split('\n');
      const url = lines[lines.length - 1]?.trim();
      if (!url || !url.startsWith('http')) {
        return reject(new Error('No valid direct audio URL extracted'));
      }
      // Cachear por 2 horas (los tokens de googlevideo suelen durar ~6 horas)
      audioUrlCache.set(videoId, { url, expire: Date.now() + 2 * 3600 * 1000 });
      resolve(url);
    });
  });
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

    const audioUrl = await getAudioUrl(videoId);
    const rangeHeader = req.headers.get('range');

    return new Promise<NextResponse>((resolve) => {
      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      };
      if (rangeHeader) {
        headers['Range'] = rangeHeader;
      }

      const clientReq = https.get(audioUrl, {
        headers,
        rejectUnauthorized: false
      }, (upstreamRes) => {
        // Si el enlace de GoogleVideo expiró (403), purgamos la caché
        if (upstreamRes.statusCode === 403) {
          audioUrlCache.delete(videoId);
        }

        const responseHeaders = new Headers();
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
        responseHeaders.set('Access-Control-Allow-Headers', 'Range, Content-Type, Accept');
        responseHeaders.set('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
        responseHeaders.set('Accept-Ranges', 'bytes');

        const ct = upstreamRes.headers['content-type'] || 'audio/mp4';
        responseHeaders.set('Content-Type', ct);

        const cl = upstreamRes.headers['content-length'];
        if (cl) responseHeaders.set('Content-Length', cl);

        const cr = upstreamRes.headers['content-range'];
        if (cr) responseHeaders.set('Content-Range', cr);

        if (req.method === 'HEAD') {
          resolve(new NextResponse(null, {
            status: upstreamRes.statusCode || 200,
            headers: responseHeaders
          }));
          return;
        }

        const webStream = Readable.toWeb(upstreamRes) as ReadableStream;
        resolve(new NextResponse(webStream, {
          status: upstreamRes.statusCode || 200,
          headers: responseHeaders
        }));
      });

      clientReq.on('error', (err) => {
        resolve(new NextResponse(err.message || 'Stream error', { 
          status: 502, 
          headers: { 
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
            'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
          } 
        }));
      });
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
