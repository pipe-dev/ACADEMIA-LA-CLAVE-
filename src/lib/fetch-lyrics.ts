export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export interface TrackLyrics {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string | null;
  syncedLyrics: string | null;
  parsedLyrics: LyricLine[];
}

function cleanString(str: string): string {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remover tildes y acentos
    .replace(/\([^)]*\)|\[[^\]]*\]/g, "") // remover paréntesis y corchetes (Video Oficial, etc.)
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isDistinctiveTitle(title: string): boolean {
  const stopwords = new Set(['con', 'por', 'para', 'una', 'uno', 'los', 'las', 'les', 'del', 'que', 'sin', 'mas', 'pero', 'como', 'de', 'la', 'el', 'en', 'un', 'y']);
  const clean = cleanString(title);
  const words = clean.split(/\s+/).filter(w => w.length > 2 && !stopwords.has(w));
  return words.length >= 2 || clean.length >= 14;
}

/**
 * Evalúa rigurosamente un candidato de letra para asegurar que pertenezca a la canción
 * y al artista solicitados. Protege títulos genéricos ("Creo en ti") exigiendo coincidencia
 * de artista, y permite canciones con títulos distintivos ("Perfume a tus pies", "La bondad de Dios")
 * cuando están registradas por ministerios originales o versiones autorizadas.
 */
function scoreLyricCandidate(targetTitle: string, targetArtist: string, candidate: any): number {
  if (!candidate || !candidate.trackName) return 0;

  // Descartar si el candidato no tiene ni letra sincronizada ni estática
  if (!candidate.syncedLyrics && !candidate.plainLyrics) {
    return 0;
  }

  const cleanTarget = cleanString(targetTitle);
  const cleanCand = cleanString(candidate.trackName);
  const cleanTargetArt = cleanString(targetArtist);
  const cleanCandArt = cleanString(candidate.artistName || '');

  // 1. VALIDACIÓN DEL ARTISTA
  let isArtistMatch = false;
  if (cleanTargetArt && cleanCandArt) {
    const targetArtWords = cleanTargetArt.split(' ').filter(w => w.length > 2);
    let artMatches = 0;
    for (const w of targetArtWords) {
      if (cleanCandArt.includes(w)) artMatches++;
    }

    const directInclude = cleanCandArt.includes(cleanTargetArt) || cleanTargetArt.includes(cleanCandArt);
    isArtistMatch = directInclude || artMatches > 0;

    // Si no coincide el artista:
    if (!isArtistMatch && targetArtWords.length > 0) {
      // Si el título es corto o genérico (ej. "Creo en ti", "Solo tú"), DESCALIFICAR rotundamente
      // para evitar que se mezclen canciones homónimas de otros artistas.
      if (!isDistinctiveTitle(targetTitle)) {
        return 0;
      }
      // Si el título sí es distintivo pero la coincidencia de título no es exacta, descalificar
      if (cleanTarget !== cleanCand) {
        return 0;
      }
    }
  }

  // 2. VALIDACIÓN DEL TÍTULO
  const targetWords = cleanTarget.split(' ').filter(w => w.length > 2);
  let wordMatches = 0;
  for (const w of targetWords) {
    if (cleanCand.includes(w)) wordMatches++;
  }

  // Descartar si el título no comparte ninguna palabra clave con la canción solicitada
  if (targetWords.length > 0 && wordMatches === 0) {
    return 0;
  }

  let score = 0;

  // Coincidencia de título
  if (cleanTarget === cleanCand) {
    score += 100;
  } else if (cleanCand.includes(cleanTarget) || cleanTarget.includes(cleanCand)) {
    score += 70;
  } else {
    score += (wordMatches / Math.max(targetWords.length, 1)) * 50;
  }

  // Coincidencia de artista: prioridad máxima al artista solicitado
  if (isArtistMatch) {
    if (cleanTargetArt === cleanCandArt) {
      score += 90;
    } else {
      score += 60;
    }
  }

  // Bonificación por letra sincronizada (preferida), pero valorar las estáticas
  if (candidate.syncedLyrics && candidate.syncedLyrics.trim().length > 10) {
    score += 30;
  } else if (candidate.plainLyrics && candidate.plainLyrics.trim().length > 10) {
    score += 15;
  }

  return score;
}

/**
 * Quita marcadores de video del título antes de buscar la letra:
 * "A su tiempo || arisa (letra)" → "A su tiempo"
 */
function stripVideoMarkers(title: string): string {
  const stripped = (title || '')
    .split('|')[0]
    .replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')
    .replace(/\s*[-–—]\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  return stripped || (title || '').trim();
}

export async function fetchLyrics(titleOrQuery: string, artist?: string): Promise<TrackLyrics | null> {
  try {
    const rawTitle = artist ? titleOrQuery : titleOrQuery.replace(/^.*?-/, '').trim();
    const title = stripVideoMarkers(rawTitle);
    const cleanArtist = artist || '';

    // Cache key v4 para invalidar y descartar cachés viejos
    const cacheKey = `lyrics_v4_${cleanString(title)}_${cleanString(cleanArtist)}`;
    if (typeof window !== 'undefined') {
      try {
        // Limpieza de claves obsoletas v2 y v3 si existen
        const v2Key = `lyrics_v2_${cleanString(title)}_${cleanString(cleanArtist)}`;
        const v3Key = `lyrics_v3_${cleanString(title)}_${cleanString(cleanArtist)}`;
        if (localStorage.getItem(v2Key)) localStorage.removeItem(v2Key);
        if (localStorage.getItem(v3Key)) localStorage.removeItem(v3Key);

        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (scoreLyricCandidate(title, cleanArtist, parsed) > 0) {
            return parsed;
          }
        }
      } catch(e) {}
    }

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    let url = `${baseUrl}/api/lyrics?q=${encodeURIComponent(titleOrQuery)}`;
    if (artist) {
      url = `${baseUrl}/api/lyrics?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}&q=${encodeURIComponent(`${artist} ${title}`)}`;
    }

    let data: any[] | null = null;
    try {
      const response = await fetch(url);
      if (response.ok) {
        data = await response.json();
      }
    } catch (e) {
      console.warn('[fetchLyrics] Error consultando /api/lyrics, intentando fallback directo:', e);
    }

    // Respaldo directo en el navegador hacia LRCLIB si el proxy de la API falló
    if (!data || !Array.isArray(data) || data.length === 0) {
      try {
        if (artist) {
          const directGet = await fetch(`https://lrclib.net/api/get?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`);
          if (directGet.ok) {
            const single = await directGet.json();
            if (single && (single.syncedLyrics || single.plainLyrics)) {
              data = [single];
            }
          }
          if (!data) {
            const directSearch = await fetch(`https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`);
            if (directSearch.ok) {
              const list = await directSearch.json();
              if (Array.isArray(list) && list.length > 0) {
                data = list;
              }
            }
          }
          if (!data) {
            const combinedSearch = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(`${artist} ${title}`)}`);
            if (combinedSearch.ok) {
              const list = await combinedSearch.json();
              if (Array.isArray(list) && list.length > 0) {
                data = list;
              }
            }
          }
        } else {
          const directSearch = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(titleOrQuery)}`);
          if (directSearch.ok) {
            const list = await directSearch.json();
            if (Array.isArray(list) && list.length > 0) {
              data = list;
            }
          }
        }
      } catch (directErr) {
        console.warn('[fetchLyrics] Error en fallback directo a LRCLIB:', directErr);
      }
    }

    if (!data || !Array.isArray(data) || data.length === 0) return null;

    // Evaluar y ordenar los candidatos según similitud real con el título y artista
    let bestMatch: any = null;
    let highestScore = -1;

    for (const candidate of data) {
      const score = scoreLyricCandidate(title, cleanArtist, candidate);
      if (score > highestScore) {
        highestScore = score;
        bestMatch = candidate;
      }
    }

    // Si el mejor candidato tiene puntaje 0 (es de otro artista o tema no coincidente), descartar
    if (!bestMatch || highestScore <= 0) {
      console.warn(`[fetchLyrics] Candidatos descartados por no coincidir con "${title}" de "${cleanArtist}"`);
      return null;
    }

    const parsedLyrics = bestMatch.syncedLyrics ? parseSyncedLyrics(bestMatch.syncedLyrics) : [];

    const result: TrackLyrics = {
      id: bestMatch.id || Date.now(),
      trackName: bestMatch.trackName || title,
      artistName: bestMatch.artistName || cleanArtist,
      albumName: bestMatch.albumName || '',
      duration: bestMatch.duration || 0,
      instrumental: !!bestMatch.instrumental,
      plainLyrics: bestMatch.plainLyrics || null,
      syncedLyrics: bestMatch.syncedLyrics || null,
      parsedLyrics,
    };
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(result));
      } catch {}
    }

    return result;
  } catch (error) {
    console.error("Error fetching lyrics:", error);
    return null;
  }
}

function parseSyncedLyrics(syncedLyrics: string): LyricLine[] {
  const lines = syncedLyrics.split('\n');
  const result: LyricLine[] = [];

  const timeRegex = /\[(\d{2}):(\d{2}\.\d{2,3})\]/;

  for (const line of lines) {
    const match = timeRegex.exec(line);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseFloat(match[2]);
      const timeInSeconds = (minutes * 60) + seconds;
      
      const text = line.replace(timeRegex, '').trim();
      
      if (text) {
        result.push({
          time: timeInSeconds,
          text
        });
      }
    }
  }

  return result;
}
