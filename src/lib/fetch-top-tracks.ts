import { CatalogTrack } from '@/components/practica/practicaTypes';
import {
  DEFAULT_SECULAR_TRACKS,
  DEFAULT_CHRISTIAN_TRACKS,
  RECOMMENDED_TRACKS
} from '@/components/practica/practicaCatalogData';

export interface TopTracksResponse {
  top100: CatalogTrack[];
  secular100: CatalogTrack[];
  christian100: CatalogTrack[];
  allTracks: CatalogTrack[];
}

export function cleanTrackTitle(title: string): string {
  return (title || '')
    .replace(/\s*\(feat\..*?\)/i, '')
    .replace(/\s*\[feat\..*?\)/i, '')
    .replace(/\s*\(en vivo.*?\)/i, '')
    .replace(/\s*\(live.*?\)/i, '')
    .trim();
}

export function classifyGenre(rawCategory: string): string {
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

export function buildBalancedTop100(secularTracks: CatalogTrack[], christianTracks: CatalogTrack[]): CatalogTrack[] {
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

export function parseAppleRssFeed(
  secularRes: any,
  usLatinRes: any,
  christianRes: any
): TopTracksResponse {
  // 1. Procesar canciones seculares
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

  // Asegurar siempre 100 canciones seculares exactas
  for (const defTrack of DEFAULT_SECULAR_TRACKS) {
    if (secular100.length >= 100) break;
    const key = `${defTrack.artist.toLowerCase()} - ${defTrack.title.toLowerCase()}`;
    if (!seenSec.has(key)) {
      seenSec.add(key);
      const rank = secular100.length + 1;
      secular100.push({ ...defTrack, id: `sec_${rank}`, rank });
    }
  }

  // 2. Procesar canciones cristianas
  const christianRaw: any[] = christianRes?.feed?.entry || [];
  const christian100: CatalogTrack[] = [];
  const seenChr = new Set<string>();

  for (let i = 0; i < christianRaw.length && christian100.length < 100; i++) {
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

  // Asegurar siempre 100 canciones cristianas exactas
  for (const defTrack of DEFAULT_CHRISTIAN_TRACKS) {
    if (christian100.length >= 100) break;
    const key = `${defTrack.artist.toLowerCase()} - ${defTrack.title.toLowerCase()}`;
    if (!seenChr.has(key)) {
      seenChr.add(key);
      const rank = christian100.length + 1;
      christian100.push({ ...defTrack, id: `c_${rank}`, rank });
    }
  }

  // 3. Construir el Top 100 equilibrado para "Todos"
  let top100 = buildBalancedTop100(secular100, christian100);
  if (top100.length < 100) {
    for (const rec of RECOMMENDED_TRACKS) {
      if (top100.length >= 100) break;
      const key = `${rec.artist.toLowerCase()} - ${rec.title.toLowerCase()}`;
      if (!top100.some(t => `${t.artist.toLowerCase()} - ${t.title.toLowerCase()}` === key)) {
        const rank = top100.length + 1;
        top100.push({ ...rec, id: `top_${rank}`, rank });
      }
    }
  }

  // 4. Construir la lista total
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

  return {
    top100: top100.length > 0 ? top100 : (RECOMMENDED_TRACKS as CatalogTrack[]),
    secular100,
    christian100,
    allTracks
  };
}

export async function fetchDirectFromApple(): Promise<TopTracksResponse> {
  const [secularRes, usLatinRes, christianRes] = await Promise.all([
    fetch('https://itunes.apple.com/mx/rss/topsongs/limit=100/json')
      .then(r => r.ok ? r.json() : null)
      .catch(() => null),
    fetch('https://itunes.apple.com/us/rss/topsongs/limit=50/genre=1119/json')
      .then(r => r.ok ? r.json() : null)
      .catch(() => null),
    fetch('https://itunes.apple.com/mx/rss/topsongs/limit=100/genre=22/json')
      .then(r => r.ok ? r.json() : null)
      .catch(() => null)
  ]);

  return parseAppleRssFeed(secularRes, usLatinRes, christianRes);
}

function isFallbackData(data: TopTracksResponse | null | undefined): boolean {
  if (!data || !Array.isArray(data.top100) || data.top100.length === 0) return true;
  // Si la primera canción es "La Incondicional" de Luis Miguel, es el catálogo curado estático de respaldo
  const first = data.top100[0];
  if (first?.title === 'La Incondicional' && first?.artist === 'Luis Miguel') {
    return true;
  }
  return false;
}

/**
 * Obtiene el ranking real de las 100 canciones del momento.
 * 1. Intenta desde el endpoint interno `/api/top-tracks`.
 * 2. Si el servidor respondió con el catálogo estático de respaldo (Luis Miguel) o falló,
 *    el navegador consulta directamente los feeds de Apple Music RSS con CORS abierto.
 * 3. Garantiza siempre 100 canciones virales del momento sin depender de servidores intermedios.
 */
export async function fetchLiveTopTracks(): Promise<TopTracksResponse> {
  // 1. Intentar primero con la ruta de la app
  try {
    const res = await fetch('/api/top-tracks');
    if (res.ok) {
      const data: TopTracksResponse = await res.json();
      if (!isFallbackData(data)) {
        return data;
      }
    }
  } catch (err) {
    console.warn('[top-tracks] Error en /api/top-tracks, consultando Apple Music directamente:', err);
  }

  // 2. Si el servidor respondió con el respaldo estático (Luis Miguel) o falló,
  // el navegador consulta directamente los feeds de Apple Music (sin intermediario)
  try {
    const directData = await fetchDirectFromApple();
    if (!isFallbackData(directData)) {
      return directData;
    }
  } catch (err) {
    console.warn('[top-tracks] Error en consulta directa a Apple Music:', err);
  }

  // 3. Si todo lo anterior falla (ej. sin conexión a internet), devolver catálogo de respaldo
  return {
    top100: RECOMMENDED_TRACKS as CatalogTrack[],
    secular100: DEFAULT_SECULAR_TRACKS,
    christian100: DEFAULT_CHRISTIAN_TRACKS,
    allTracks: [...DEFAULT_SECULAR_TRACKS, ...DEFAULT_CHRISTIAN_TRACKS]
  };
}

/**
 * Búsqueda de canciones en iTunes con fallback directo en el cliente.
 */
export async function searchTracks(query: string): Promise<CatalogTrack[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // 1. Intentar primero el endpoint local
  try {
    const res = await fetch(`/api/itunes-search?q=${encodeURIComponent(trimmed)}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => ({
          id: item.id ? String(item.id) : String(Math.random()),
          title: item.title || '',
          artist: item.artist || 'Artista',
          category: item.category || 'Pop Latino',
          thumbnail: item.thumbnail || ''
        }));
      }
    }
  } catch {}

  // 2. Respaldo directo en el navegador a Apple iTunes API (CORS habilitado por Apple)
  try {
    const directUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(trimmed)}&entity=song&limit=15`;
    const res = await fetch(directUrl);
    if (res.ok) {
      const json = await res.json();
      if (json.results && Array.isArray(json.results)) {
        return json.results.map((item: any) => ({
          id: item.trackId ? String(item.trackId) : String(Math.random()),
          title: item.trackName || '',
          artist: item.artistName || 'Artista',
          category: 'Pop Latino',
          thumbnail: item.artworkUrl100 ? item.artworkUrl100.replace('100x100', '600x600') : ''
        }));
      }
    }
  } catch (err) {
    console.warn('[search] Error en búsqueda directa en iTunes:', err);
  }

  return [];
}
