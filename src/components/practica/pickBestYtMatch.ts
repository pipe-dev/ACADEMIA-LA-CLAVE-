/**
 * Elige el mejor match de una búsqueda en YouTube comparando artista y
 * título contra el título del video + el canal. Evita aceptar a ciegas el
 * primer resultado: YouTube puede poner arriba otra canción con el mismo
 * nombre, un cover de otro intérprete, o desplazar la correcta por
 * popularidad (los rankings cambian por día, idioma y región).
 */
export interface YtSearchVideo {
  id: string;
  title: string;
  channel?: string;
  thumbnail?: string;
}

interface ScoredVideo {
  video: YtSearchVideo;
  score: number;
  index: number;
}

const stripAccentsLower = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function scoreVideos(
  videos: YtSearchVideo[],
  artist: string,
  title: string
): ScoredVideo[] {
  const artistTokens = stripAccentsLower(artist || '')
    .split(/\s+/)
    .filter((t) => t.length >= 3);
  const titlePhrase = stripAccentsLower(title || '');
  const titleTokens = stripAccentsLower(title || '')
    .split(/\s+/)
    .filter((t) => t.length >= 2);
  const artistPhrase = stripAccentsLower(artist || '');

  return videos.map((video, index) => {
    const hay = stripAccentsLower(`${video.title || ''} ${video.channel || ''}`);
    let score = 0;

    for (const token of artistTokens) {
      if (hay.includes(token)) score += 1;
    }
    if (artistPhrase && hay.includes(artistPhrase)) score += 2;

    for (const token of titleTokens) {
      if (hay.includes(token)) score += 1;
    }
    if (titlePhrase && hay.includes(titlePhrase)) score += 2;

    return { video, score, index };
  });
}

/**
 * Devuelve las `count` mejores versiones ordenadas por puntaje.
 * Empate de puntaje → respeta el orden de relevancia de YouTube.
 */
export function getTopYtMatches(
  videos: YtSearchVideo[],
  artist: string,
  title: string,
  count: number = 2
): YtSearchVideo[] {
  if (!Array.isArray(videos) || videos.length === 0) return [];
  return scoreVideos(videos, artist, title)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, count)
    .map((s) => s.video);
}

/** El mejor único match (fallback de errores del reproductor). */
export function pickBestYtMatch(
  videos: YtSearchVideo[],
  artist: string,
  title: string
): YtSearchVideo | null {
  return getTopYtMatches(videos, artist, title, 1)[0] ?? null;
}

/**
 * Variantes estrictas: SOLO candidatos con coincidencia real de
 * artista/título (puntaje > 0). Si nada califica, devuelve [] — usado
 * para inyectar complementos de YouTube al catálogo de búsqueda: nunca
 * debemos inyectar un video suelto que no sea la canción buscada.
 */
export function getQualifyingYtMatches(
  videos: YtSearchVideo[],
  artist: string,
  title: string,
  count: number = 2
): YtSearchVideo[] {
  if (!Array.isArray(videos) || videos.length === 0) return [];
  return scoreVideos(videos, artist, title)
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, count)
    .map((s) => s.video);
}
