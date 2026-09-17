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
    .replace(/\(.*\)|\[.*\]/g, "") // remover paréntesis y corchetes (Video Oficial, etc.)
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreLyricCandidate(targetTitle: string, targetArtist: string, candidate: any): number {
  if (!candidate || !candidate.trackName) return 0;

  const cleanTarget = cleanString(targetTitle);
  const cleanCand = cleanString(candidate.trackName);
  const cleanTargetArt = cleanString(targetArtist);
  const cleanCandArt = cleanString(candidate.artistName || '');

  const targetWords = cleanTarget.split(' ').filter(w => w.length > 2);
  let wordMatches = 0;
  for (const w of targetWords) {
    if (cleanCand.includes(w)) wordMatches++;
  }

  // Descartar por completo si el título no comparte ninguna palabra clave con la canción solicitada
  if (targetWords.length > 0 && wordMatches === 0) {
    return 0;
  }

  let score = 0;

  // Coincidencia exacta o parcial del título
  if (cleanTarget === cleanCand) {
    score += 100;
  } else if (cleanCand.includes(cleanTarget) || cleanTarget.includes(cleanCand)) {
    score += 70;
  } else {
    score += (wordMatches / Math.max(targetWords.length, 1)) * 50;
  }

  // Coincidencia del artista
  if (cleanTargetArt && cleanCandArt) {
    if (cleanCandArt.includes(cleanTargetArt) || cleanTargetArt.includes(cleanCandArt)) {
      score += 40;
    }
  }

  // Descartar si el candidato no contiene ni letra sincronizada ni estática
  if (!candidate.syncedLyrics && !candidate.plainLyrics) {
    return 0;
  }

  // Priorizar pistas con letras sincronizadas (lrc con timestamps), pero valorar las estáticas
  if (candidate.syncedLyrics) {
    score += 25;
  } else if (candidate.plainLyrics) {
    score += 10;
  }

  return score;
}

export async function fetchLyrics(titleOrQuery: string, artist?: string): Promise<TrackLyrics | null> {
  try {
    const title = artist ? titleOrQuery : titleOrQuery.replace(/^.*?-/, '').trim();
    const cleanArtist = artist || '';

    // Cache key v2 para invalidar cachés erróneos anteriores en los dispositivos
    const cacheKey = `lyrics_v2_${cleanString(title)}_${cleanString(cleanArtist)}`;
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (scoreLyricCandidate(title, cleanArtist, parsed) > 0) {
            return parsed;
          }
        } catch(e) {}
      }
    }

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    let url = `${baseUrl}/api/lyrics?q=${encodeURIComponent(titleOrQuery)}`;
    if (artist) {
      url = `${baseUrl}/api/lyrics?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}&q=${encodeURIComponent(`${artist} ${title}`)}`;
    }

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
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

    // Si el mejor candidato tiene puntaje 0 (es otra canción sin relación), descartar
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
      localStorage.setItem(cacheKey, JSON.stringify(result));
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
