import { NextResponse } from 'next/server';

// Bypass local SSL issues on some Windows machines/antiviruses
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export interface CatalogTrack {
  id: string;
  rank: number;
  title: string;
  artist: string;
  category: string;
  genre: string;
  thumbnail: string;
}

export interface TopTracksResponse {
  top100: CatalogTrack[];
  secular100: CatalogTrack[];
  christian100: CatalogTrack[];
  allTracks: CatalogTrack[];
}

// Caché en memoria para respuesta instantánea (TTL: 1 hora)
let cachedBundle: TopTracksResponse | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

function cleanTrackTitle(title: string): string {
  return (title || '')
    .replace(/\s*\(feat\..*?\)/i, '')
    .replace(/\s*\[feat\..*?\)/i, '')
    .replace(/\s*\(en vivo.*?\)/i, '')
    .replace(/\s*\(live.*?\)/i, '')
    .trim();
}

function classifyGenre(rawCategory: string): string {
  const cat = (rawCategory || '').toLowerCase();
  if (cat.includes('urbano') || cat.includes('rap') || cat.includes('hip-hop') || cat.includes('reggaeton') || cat.includes('trap')) {
    return 'Urbano Latino';
  }
  if (cat.includes('mexicana') || cat.includes('banda') || cat.includes('corridos') || cat.includes('ranchera') || cat.includes('norteñ')) {
    return 'Música Mexicana';
  }
  if (cat.includes('rock') || cat.includes('metal') || cat.includes('alternativa') || cat.includes('punk')) {
    return 'Rock en Español';
  }
  if (cat.includes('pop') || cat.includes('balada') || cat.includes('latina') || cat.includes('cantautor') || cat.includes('bolero')) {
    return 'Pop & Baladas';
  }
  return 'Del Momento';
}

function buildBalancedTop100(secularTracks: CatalogTrack[], christianTracks: CatalogTrack[]): CatalogTrack[] {
  // Patrón alterno de 4 a 6 seculares por 1 o 2 cristianas (el Top 100 original que ya teníamos para "Todos")
  const pattern = [5, 1, 4, 1, 5, 2, 6, 1, 4, 1, 5, 2, 6, 1, 4, 1, 5, 2, 6, 1, 5, 1, 4, 2, 5, 1, 6, 1, 5, 2];
  const top100: CatalogTrack[] = [];
  const seen = new Set<string>();

  let sIdx = 0;
  let cIdx = 0;

  for (let p = 0; p < pattern.length && top100.length < 100; p++) {
    const isSecular = p % 2 === 0;
    const count = pattern[p];

    for (let k = 0; k < count && top100.length < 100; k++) {
      if (isSecular) {
        while (sIdx < secularTracks.length) {
          const track = secularTracks[sIdx++];
          const key = `${track.artist.toLowerCase()} - ${track.title.toLowerCase()}`;
          if (!seen.has(key)) {
            seen.add(key);
            const rank = top100.length + 1;
            top100.push({ ...track, id: `top_${rank}`, rank });
            break;
          }
        }
      } else {
        while (cIdx < christianTracks.length) {
          const track = christianTracks[cIdx++];
          const key = `${track.artist.toLowerCase()} - ${track.title.toLowerCase()}`;
          if (!seen.has(key)) {
            seen.add(key);
            const rank = top100.length + 1;
            top100.push({ ...track, id: `top_${rank}`, rank });
            break;
          }
        }
      }
    }
  }

  while (top100.length < 100 && sIdx < secularTracks.length) {
    const track = secularTracks[sIdx++];
    const key = `${track.artist.toLowerCase()} - ${track.title.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      const rank = top100.length + 1;
      top100.push({ ...track, id: `top_${rank}`, rank });
    }
  }

  while (top100.length < 100 && cIdx < christianTracks.length) {
    const track = christianTracks[cIdx++];
    const key = `${track.artist.toLowerCase()} - ${track.title.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      const rank = top100.length + 1;
      top100.push({ ...track, id: `top_${rank}`, rank });
    }
  }

  return top100;
}

export async function GET(req: Request) {
  const now = Date.now();
  const { searchParams } = new URL(req.url);
  const genreParam = (searchParams.get('genre') || searchParams.get('category') || '').toLowerCase();

  // Si la caché está vigente, responder de inmediato
  if (cachedBundle && (now - lastCacheTime < CACHE_TTL_MS)) {
    if (genreParam === 'christian' || genreParam === 'cristiana' || genreParam === '22') {
      return NextResponse.json(cachedBundle.christian100);
    }
    if (genreParam === 'secular' || genreParam === 'del_momento') {
      return NextResponse.json(cachedBundle.secular100);
    }
    return NextResponse.json(cachedBundle);
  }

  try {
    // Consultar en paralelo los feeds de Apple Music:
    // 1. Top Canciones México
    // 2. Top Canciones Latinas (para completar exactamente a 100 seculares)
    // 3. Top Canciones Cristianas (100 canciones)
    const [secularRes, usLatinRes, christianRes] = await Promise.all([
      fetch('https://itunes.apple.com/mx/rss/topsongs/limit=100/json', {
        headers: { 'User-Agent': 'AfinApp-Karaoke/1.0' },
        next: { revalidate: 3600 }
      }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('https://itunes.apple.com/us/rss/topsongs/limit=50/genre=1119/json', {
        headers: { 'User-Agent': 'AfinApp-Karaoke/1.0' },
        next: { revalidate: 3600 }
      }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('https://itunes.apple.com/mx/rss/topsongs/limit=100/genre=22/json', {
        headers: { 'User-Agent': 'AfinApp-Karaoke/1.0' },
        next: { revalidate: 3600 }
      }).then(r => r.ok ? r.json() : null).catch(() => null)
    ]);

    // 1. Procesar exactamente 100 canciones seculares
    const secularRaw: any[] = [
      ...(secularRes?.feed?.entry || []),
      ...(usLatinRes?.feed?.entry || [])
    ];
    const secular100: CatalogTrack[] = [];
    const seenSec = new Set<string>();

    for (let i = 0; i < secularRaw.length && secular100.length < 100; i++) {
      const e = secularRaw[i];
      const rawCat = (e.category?.attributes?.label || '').toLowerCase();
      if (rawCat.includes('cristian') || rawCat.includes('gospel') || rawCat.includes('christian')) {
        continue;
      }
      const rawTitle = e['im:name']?.label || '';
      const title = cleanTrackTitle(rawTitle);
      const artist = e['im:artist']?.label || 'Artista';
      const key = `${artist.toLowerCase()} - ${title.toLowerCase()}`;

      if (!seenSec.has(key)) {
        seenSec.add(key);
        const rawImg = e['im:image']?.[2]?.label || e['im:image']?.[1]?.label || '';
        const thumbnail = rawImg.replace(/\/\d+x\d+bb/, '/600x600bb');
        const genre = classifyGenre(rawCat);
        const rank = secular100.length + 1;

        secular100.push({
          id: `sec_${rank}`,
          rank,
          title,
          artist,
          category: 'Del Momento',
          genre,
          thumbnail
        });
      }
    }

    // 2. Procesar 100 cristianas
    const christianRaw: any[] = christianRes?.feed?.entry || [];
    const christian100: CatalogTrack[] = [];
    const seenChr = new Set<string>();

    for (let i = 0; i < christianRaw.length; i++) {
      const e = christianRaw[i];
      const rawTitle = e['im:name']?.label || '';
      const title = cleanTrackTitle(rawTitle);
      const artist = e['im:artist']?.label || 'Artista Cristiano';
      const key = `${artist.toLowerCase()} - ${title.toLowerCase()}`;

      if (!seenChr.has(key)) {
        seenChr.add(key);
        const rawImg = e['im:image']?.[2]?.label || e['im:image']?.[1]?.label || '';
        const thumbnail = rawImg.replace(/\/\d+x\d+bb/, '/600x600bb');
        const rank = christian100.length + 1;

        christian100.push({
          id: `c_${rank}`,
          rank,
          title,
          artist,
          category: 'Música Cristiana',
          genre: 'Música Cristiana',
          thumbnail
        });
      }
    }

    // 3. Construir el Top 100 que ya teníamos (el equilibrado para "Todos")
    const top100 = buildBalancedTop100(secular100, christian100);

    // 4. Construir la lista total de ~200 canciones para los filtros genéricos
    const allTracks: CatalogTrack[] = [];
    const seenAll = new Set<string>();
    for (const t of secular100) {
      const key = `${t.artist.toLowerCase()} - ${t.title.toLowerCase()}`;
      if (!seenAll.has(key)) {
        seenAll.add(key);
        allTracks.push(t);
      }
    }
    for (const t of christian100) {
      const key = `${t.artist.toLowerCase()} - ${t.title.toLowerCase()}`;
      if (!seenAll.has(key)) {
        seenAll.add(key);
        allTracks.push(t);
      }
    }

    const bundle: TopTracksResponse = {
      top100,
      secular100,
      christian100,
      allTracks
    };

    cachedBundle = bundle;
    lastCacheTime = now;

    const cacheHeaders = {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
    };

    if (genreParam === 'christian' || genreParam === 'cristiana' || genreParam === '22') {
      return NextResponse.json(christian100, { headers: cacheHeaders });
    }
    if (genreParam === 'secular' || genreParam === 'del_momento') {
      return NextResponse.json(secular100, { headers: cacheHeaders });
    }
    return NextResponse.json(bundle, { headers: cacheHeaders });
  } catch (err: any) {
    console.error('Error fetching catalog bundle:', err);
    if (cachedBundle) {
      return NextResponse.json(cachedBundle, {
        headers: { 'Cache-Control': 'public, s-maxage=300' }
      });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
