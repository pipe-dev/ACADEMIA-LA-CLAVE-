import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import fs from 'fs';

// Caché en memoria para enlaces de streaming directos (evita re-extracción en seek o replay)
interface CachedAudio {
  url: string;
  userAgent: string;
  expire: number;
}
const audioUrlCache = new Map<string, CachedAudio>();

const INNERTUBE_CLIENTS = [
  {
    clientName: 'VISIONOS',
    clientVersion: '1.02',
    deviceMake: 'Apple',
    deviceModel: 'RealityDevice17,1',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_7_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15',
    osName: 'visionOS',
    osVersion: '26.5.23O471',
    clientNumber: '101'
  },
  {
    clientName: 'MWEB',
    clientVersion: '2.20240410.01.00',
    deviceMake: 'Apple',
    deviceModel: 'iPhone',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1',
    osName: 'iOS',
    osVersion: '17.4.1',
    clientNumber: '2'
  },
  {
    clientName: 'ANDROID_VR',
    clientVersion: '1.60.19',
    deviceMake: 'Oculus',
    deviceModel: 'Quest 3',
    userAgent: 'Mozilla/5.0 (Linux; Android 12; Quest 3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    osName: 'Android',
    osVersion: '12',
    clientNumber: '28'
  }
];

/**
 * Extractor nativo en JavaScript / Web Standards compatible con Cloudflare Workers, Edge y Node.js.
 * Utiliza clientes de YouTube Innertube para obtener URLs directas de audio sin cifrado JS.
 */
async function extractAudioUrlPureJs(videoId: string): Promise<{ url: string; userAgent: string } | null> {
  try {
    const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&bpctr=9999999999&has_verified=1`;
    const watchRes = await fetch(watchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!watchRes.ok) return null;
    const html = await watchRes.text();

    const visitorHeader = watchRes.headers.get('x-goog-visitor-id');
    const visitorMatch = html.match(/"VISITOR_DATA":\s*"([^"]+)"/) || html.match(/visitorData["']?\s*:\s*["']([^"']+)["']/);
    const visitorId = visitorHeader || (visitorMatch ? visitorMatch[1] : '');

    const stsMatch = html.match(/"signatureTimestamp":\s*(\d+)/);
    const sts = stsMatch ? parseInt(stsMatch[1], 10) : 20767;

    for (const client of INNERTUBE_CLIENTS) {
      try {
        const playerPayload = {
          context: {
            client: {
              clientName: client.clientName,
              clientVersion: client.clientVersion,
              ...(client.deviceMake ? { deviceMake: client.deviceMake } : {}),
              ...(client.deviceModel ? { deviceModel: client.deviceModel } : {}),
              userAgent: client.userAgent,
              ...(client.osName ? { osName: client.osName } : {}),
              ...(client.osVersion ? { osVersion: client.osVersion } : {}),
              hl: 'en',
              timeZone: 'UTC',
              utcOffsetMinutes: 0
            }
          },
          videoId,
          playbackContext: {
            contentPlaybackContext: {
              html5Preference: 'HTML5_PREF_WANTS',
              signatureTimestamp: sts
            }
          },
          contentCheckOk: true,
          racyCheckOk: true
        };

        const headers: Record<string, string> = {
          'User-Agent': client.userAgent,
          'Content-Type': 'application/json',
          'X-YouTube-Client-Name': client.clientNumber,
          'X-YouTube-Client-Version': client.clientVersion,
          'Origin': 'https://www.youtube.com'
        };
        if (visitorId) {
          headers['X-Goog-Visitor-Id'] = visitorId;
        }

        const playerRes = await fetch('https://www.youtube.com/youtubei/v1/player', {
          method: 'POST',
          headers,
          body: JSON.stringify(playerPayload),
          signal: AbortSignal.timeout(10000)
        });

        if (!playerRes.ok) continue;
        const data = await playerRes.json();

        const formats = data.streamingData?.adaptiveFormats || [];
        const audioFormats = formats.filter((f: any) => f.mimeType?.includes('audio') && f.url);

        if (!audioFormats || audioFormats.length === 0) continue;

        // Priorizar itag 140 (audio/mp4 - 128kbps AAC) para compatibilidad total con Safari/iOS y Chrome/Android
        audioFormats.sort((a: any, b: any) => {
          if (a.itag === 140) return -1;
          if (b.itag === 140) return 1;
          return (b.bitrate || 0) - (a.bitrate || 0);
        });

        return {
          url: audioFormats[0].url,
          userAgent: client.userAgent
        };
      } catch {
        // Probar siguiente cliente
      }
    }

    return null;
  } catch (err) {
    console.warn('[yt-audio] Error en extractor pure JS:', err);
    return null;
  }
}

async function getAudioUrl(videoId: string, forceRefresh = false): Promise<{ url: string; userAgent: string }> {
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    throw new Error('Formato de videoId no valido.');
  }
  if (!forceRefresh) {
    const cached = audioUrlCache.get(videoId);
    if (cached && cached.expire > Date.now()) {
      return cached;
    }
  }

  // 1. Extractor nativo en JavaScript (funciona en Cloudflare Workers y Edge sin requerir Python)
  const pureJsResult = await extractAudioUrlPureJs(videoId);
  if (pureJsResult) {
    const entry: CachedAudio = {
      url: pureJsResult.url,
      userAgent: pureJsResult.userAgent,
      expire: Date.now() + 2 * 3600 * 1000
    };
    audioUrlCache.set(videoId, entry);
    return entry;
  }

  // 2. Soporte para microservicio / proxy extractor externo si está configurado en env
  const proxyBase = (typeof process !== 'undefined' && process.env ? (process.env.YT_AUDIO_PROXY_URL || process.env.NEXT_PUBLIC_YT_AUDIO_PROXY_URL) : undefined);
  if (proxyBase) {
    try {
      const res = await fetch(`${proxyBase.replace(/\/$/, '')}/api/yt-audio-url?videoId=${encodeURIComponent(videoId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          const entry: CachedAudio = {
            url: data.url,
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_7_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15',
            expire: Date.now() + 2 * 3600 * 1000
          };
          audioUrlCache.set(videoId, entry);
          return entry;
        }
      }
    } catch {}
  }

  // 3. Respaldo local con yt-dlp si child_process y Python están disponibles en el host
  if (typeof execFile === 'function') {
    return new Promise((resolve, reject) => {
      const pythonExe = process.env.PYTHON_PATH || 'python';

      const args = [
        '-m', 'yt_dlp',
        '-g',
        '-f', '140/ba[ext=m4a]/ba[acodec^=mp4a]/ba/b',
        '--no-warnings',
        `https://www.youtube.com/watch?v=${videoId}`
      ];

      execFile(/*turbopackIgnore: true*/ pythonExe, args, { timeout: 25000 }, (error, stdout) => {
        if (error) {
          return reject(error);
        }
        const lines = (stdout || '').trim().split('\n');
        const url = lines[lines.length - 1]?.trim();
        if (!url || !url.startsWith('http')) {
          return reject(new Error('No valid direct audio URL extracted'));
        }
        const entry: CachedAudio = {
          url,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          expire: Date.now() + 2 * 3600 * 1000
        };
        audioUrlCache.set(videoId, entry);
        resolve(entry);
      });
    });
  }

  throw new Error('No se pudo extraer la pista de audio de la canción.');
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
    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return NextResponse.json(
        { error: "Parametro videoId invalido o ausente. Se requieren 11 caracteres alfanumericos." },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    let audioInfo: { url: string; userAgent: string };
    try {
      audioInfo = await getAudioUrl(videoId);
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
      'User-Agent': audioInfo.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_7_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15',
    };
    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader;
    }

    let upstreamRes = await fetch(audioInfo.url, {
      headers: fetchHeaders,
      redirect: 'follow'
    });

    if (upstreamRes.status === 403) {
      audioUrlCache.delete(videoId);
      try {
        const refreshed = await getAudioUrl(videoId, true);
        const retryHeaders: Record<string, string> = {
          'User-Agent': refreshed.userAgent || fetchHeaders['User-Agent']
        };
        if (rangeHeader) retryHeaders['Range'] = rangeHeader;
        const retryRes = await fetch(refreshed.url, {
          headers: retryHeaders,
          redirect: 'follow'
        });
        if (retryRes.ok) {
          upstreamRes = retryRes;
        }
      } catch {}
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
