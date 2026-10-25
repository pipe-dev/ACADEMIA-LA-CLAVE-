/**
 * Ranking de resultados de búsqueda de canciones para el catálogo de
 * Práctica. Regla clave: los resultados deben ser ESA canción (tokens del
 * TÍTULO presentes en el query) — nunca otra canción solo porque el
 * artista coincida, ni otra canción con el mismo nombre de otro
 * intérprete. Devuelve la oficial primero y una versión complementaria
 * (cover / remix / en vivo...) después. Si nada califica, devuelve []
 * para que el llamador conserve la lista original sin romper búsquedas
 * genéricas (artista solo, género, etc.).
 */
export interface SongSearchItem {
  id: string;
  title: string;
  artist: string;
}

const VERSION_MARKERS = [
  'cover',
  'live',
  'en vivo',
  'remix',
  'acustic',
  'karaoke',
  'unplugged',
  'concierto',
  'sesion',
  'instrumental',
  'sped up',
  'slowed'
];

const normalize = (s: string) =>
  (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function rankSongSearch<T extends SongSearchItem>(
  items: T[],
  query: string,
  max: number = 2
): T[] {
  const tokens = normalize(query)
    .split(/\s+/)
    .filter((t) => t.length >= 2);
  if (!tokens.length || !Array.isArray(items) || items.length === 0) return [];

  const phrase = normalize(query);

  interface ScoredItem {
    item: T;
    score: number;
    isVersion: boolean;
    index: number;
  }

  const qualified: ScoredItem[] = [];
  const seenKeys = new Set<string>();

  items.forEach((item, index) => {
    const titleNorm = normalize(item.title);
    const artistNorm = normalize(item.artist);

    // Duplicados (mismo título + artista, p.ej. mismo tema en 2 discos)
    const key = `${titleNorm}|${artistNorm}`;
    if (seenKeys.has(key)) return;
    seenKeys.add(key);

    const titleMatches = tokens.filter((t) => titleNorm.includes(t)).length;
    const artistMatches = tokens.filter((t) => artistNorm.includes(t)).length;
    const titleAll = titleMatches === tokens.length;

    // La canción debe pegar por TÍTULO; si el query traia tokens de
    // artista, el artista también debe pegar (evita "Nocturno —
    // Arisa Vedra" al buscar "a su tiempo arisa", y evita "A Su Tiempo —
    // Pedro Miguel" que es otra canción con el mismo nombre).
    const qualifies = titleMatches >= 1 && (artistMatches >= 1 || titleAll);
    if (!qualifies) return;

    const score =
      titleMatches * 3 +
      artistMatches * 2 +
      (titleNorm === phrase ? 4 : titleNorm.includes(phrase) ? 2 : 0);

    const isVersion = VERSION_MARKERS.some((m) => titleNorm.includes(m));
    qualified.push({ item, score, isVersion, index });
  });

  if (qualified.length === 0) return [];

  // Oficial primero (sin marcadores de versión), complemento después
  const officials = qualified
    .filter((q) => !q.isVersion)
    .sort((a, b) => b.score - a.score || a.index - b.index);
  const versions = qualified
    .filter((q) => q.isVersion)
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const official = officials[0] || null;
  const complement = versions[0] || officials[1] || null;

  const out: T[] = [];
  [official, complement].forEach((entry) => {
    if (entry) out.push(entry.item);
  });
  return out.slice(0, max);
}
