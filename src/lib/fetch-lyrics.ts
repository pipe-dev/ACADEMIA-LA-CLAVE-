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

export async function fetchLyrics(query: string): Promise<TrackLyrics | null> {
  try {
    const cacheKey = `lyrics_cache_${query}`;
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
           return JSON.parse(cached);
        } catch(e) {}
      }
    }

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const response = await fetch(`${baseUrl}/api/lyrics?q=${encodeURIComponent(query)}`);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data || data.length === 0) return null;

    // Prioritize results that have synced lyrics
    const bestMatch = data.find((track: any) => track.syncedLyrics != null) || data[0];

    const parsedLyrics = bestMatch.syncedLyrics ? parseSyncedLyrics(bestMatch.syncedLyrics) : [];

    const result = {
      ...bestMatch,
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
