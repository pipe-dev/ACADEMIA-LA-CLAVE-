'use client';

export interface NoteInfo {
  name: string;      // e.g. "Do"
  letter: string;    // e.g. "C"
  octave: number;    // e.g. 3
  frequency: number; // e.g. 130.81
  fullName: string;  // e.g. "Do3"
  midi: number;      // e.g. 48
  octaveArrow?: 'up' | 'down' | null; // ▲ = aguda; ▼ = grave; null = base
}

export interface ChromaticNoteButtonInfo {
  name: string;        // 'DO', 'DO#', etc.
  displayName: string; // 'Do', 'Do#', etc.
  letter: string;      // 'C', 'C#', etc.
  isSharp: boolean;    // true for sostenidas (#)
  semitone: number;    // 0 to 11
  octave: number;
  frequency: number;
  fullName: string;    // 'Do3', 'Do#3'
  americanFullName: string; // 'C3', 'Cs3'
  midi: number;
  bgColor: string;
  shadowColor: string;
  hasRecording: boolean; // true = existe MP3 real del género en public/sounds/; false = se cubre con sintetizador
  octaveArrow: 'up' | 'down' | null; // ▲ = octava aguda (> base); ▼ = grave (< base); null = octava base (3 masc / 4 fem)
}

// Backward-compatible alias
export type SolfegeButtonInfo = ChromaticNoteButtonInfo;

export const noteStrings = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];
export const americanNoteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/**
 * Base 12 chromatic note definitions with harmonious color scheme
 */
export const chromaticBase = [
  { name: 'DO', displayName: 'Do', letter: 'C', fileKey: 'C', isSharp: false, semitone: 0, bgColor: '#ef4444', shadowColor: '#b91c1c' },
  { name: 'DO#', displayName: 'Do#', letter: 'C#', fileKey: 'Cs', isSharp: true, semitone: 1, bgColor: '#e11d48', shadowColor: '#9f1239' },
  { name: 'RE', displayName: 'Re', letter: 'D', fileKey: 'D', isSharp: false, semitone: 2, bgColor: '#f97316', shadowColor: '#c2410c' },
  { name: 'RE#', displayName: 'Re#', letter: 'D#', fileKey: 'Ds', isSharp: true, semitone: 3, bgColor: '#d97706', shadowColor: '#92400e' },
  { name: 'MI', displayName: 'Mi', letter: 'E', fileKey: 'E', isSharp: false, semitone: 4, bgColor: '#eab308', shadowColor: '#a16207' },
  { name: 'FA', displayName: 'Fa', letter: 'F', fileKey: 'F', isSharp: false, semitone: 5, bgColor: '#22c55e', shadowColor: '#15803d' },
  { name: 'FA#', displayName: 'Fa#', letter: 'F#', fileKey: 'Fs', isSharp: true, semitone: 6, bgColor: '#0d9488', shadowColor: '#115e59' },
  { name: 'SOL', displayName: 'Sol', letter: 'G', fileKey: 'G', isSharp: false, semitone: 7, bgColor: '#06b6d4', shadowColor: '#0e7490' },
  { name: 'SOL#', displayName: 'Sol#', letter: 'G#', fileKey: 'Gs', isSharp: true, semitone: 8, bgColor: '#2563eb', shadowColor: '#1d4ed8' },
  { name: 'LA', displayName: 'La', letter: 'A', fileKey: 'A', isSharp: false, semitone: 9, bgColor: '#6366f1', shadowColor: '#4338ca' },
  { name: 'LA#', displayName: 'La#', letter: 'A#', fileKey: 'As', isSharp: true, semitone: 10, bgColor: '#7c3aed', shadowColor: '#5b21b6' },
  { name: 'SI', displayName: 'Si', letter: 'B', fileKey: 'B', isSharp: false, semitone: 11, bgColor: '#8b5cf6', shadowColor: '#6d28d9' }
];

/**
 * Returns the gender-aware octave direction indicator:
 * - Masculino: Octava base = 3 (A3). Octava 2 (A2) = 'down' (▼ grave). Octava 4 (A4) = 'up' (▲ aguda).
 * - Femenino:  Octava base = 4 (A4). Octava 3 (A3) = 'down' (▼ grave). Octava 5 (C5) = 'up' (▲ aguda).
 */
export function getOctaveIndicator(
  octave: number,
  gender: 'masculino' | 'femenino' = 'femenino'
): 'up' | 'down' | null {
  const baseOctave = gender === 'masculino' ? 3 : 4;
  if (octave > baseOctave) return 'up';
  if (octave < baseOctave) return 'down';
  return null;
}

/**
 * Rangos canónicos de las 6 clasificaciones vocales fisiológicas:
 * Masculinas: Bajo, Barítono, Tenor (grabaciones disponibles G2..B4)
 * Femeninas: Contralto, Mezzosoprano, Soprano (grabaciones disponibles A3..Fs5)
 */
export const CLASSIFICATION_RANGES: Record<
  string,
  { noteMin: string; noteMax: string; gender: 'masculino' | 'femenino'; minHz: number; maxHz: number }
> = {
  Bajo: { noteMin: 'Mi2', noteMax: 'Mi4', gender: 'masculino', minHz: 82, maxHz: 330 },
  Barítono: { noteMin: 'La2', noteMax: 'Sol4', gender: 'masculino', minHz: 110, maxHz: 392 },
  Tenor: { noteMin: 'Do3', noteMax: 'Do5', gender: 'masculino', minHz: 130, maxHz: 523 },
  Contralto: { noteMin: 'Fa3', noteMax: 'Fa5', gender: 'femenino', minHz: 174, maxHz: 698 },
  Mezzosoprano: { noteMin: 'La3', noteMax: 'La5', gender: 'femenino', minHz: 220, maxHz: 880 },
  Soprano: { noteMin: 'Do4', noteMax: 'Do6', gender: 'femenino', minHz: 261, maxHz: 1046 }
};

/**
 * Physical voice audio recordings limits (public/sounds/)
 * Masculino: G2 (MIDI 43) to B4 (MIDI 71) = 29 audios
 * Femenino: A3 (MIDI 57) to F#5 (MIDI 78) = 22 audios
 */
export const VOCAL_AUDIO_LIMITS = {
  masculino: {
    minMidi: 43, // G2
    maxMidi: 71, // B4
    minNote: 'G2',
    maxNote: 'B4',
    defaultMinMidi: 43, // G2 (cobertura total de los 29 audios)
    defaultMaxMidi: 71  // B4
  },
  femenino: {
    minMidi: 57, // A3
    maxMidi: 78, // F#5 (Fs5)
    minNote: 'A3',
    maxNote: 'Fs5',
    defaultMinMidi: 57, // A3 (cobertura total de los 22 audios)
    defaultMaxMidi: 78  // F#5
  }
} as const;

/**
 * Parses note name like "Do3", "Fa#4", "C4", "A2" to MIDI number
 */
export function noteNameToMidi(noteName: string): number {
  const match = noteName.match(/^([A-Za-z#]+)(\d+)$/);
  if (!match) return 60; // Default C4
  const namePart = match[1];
  const octave = parseInt(match[2], 10);

  let semitone = 0;
  const spanishIdx = noteStrings.findIndex(s => s.toLowerCase() === namePart.toLowerCase());
  if (spanishIdx !== -1) {
    semitone = spanishIdx;
  } else {
    const americanIdx = americanNoteStrings.findIndex(a => a.toLowerCase() === namePart.toLowerCase());
    if (americanIdx !== -1) semitone = americanIdx;
  }

  return (octave + 1) * 12 + semitone;
}

/**
 * Shape accepted by the pool helpers (physical range of the user, optional).
 */
export type VoiceRangeData = {
  noteMin?: string;
  noteMax?: string;
  minHz?: number;
  maxHz?: number;
  classification?: string;
  gender?: 'masculino' | 'femenino';
} | null | undefined;

interface UserRangeWindow {
  activeGender: 'masculino' | 'femenino';
  /** Ventana cruda del usuario ANTES del clamp contra las grabaciones. */
  rawMinMidi: number;
  rawMaxMidi: number;
}

/**
 * Resolves the active gender: explicit rangeData.gender > classification (male voices) > localStorage > default.
 */
function resolveVoiceGender(
  rangeData: VoiceRangeData,
  gender: 'masculino' | 'femenino'
): 'masculino' | 'femenino' {
  if (rangeData?.gender) return rangeData.gender;
  if (rangeData?.classification === 'Bajo' || rangeData?.classification === 'Barítono' || rangeData?.classification === 'Tenor') {
    return 'masculino';
  }
  if (rangeData?.classification === 'Contralto' || rangeData?.classification === 'Mezzosoprano' || rangeData?.classification === 'Soprano') {
    return 'femenino';
  }
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('laclave_voice_gender');
      if (saved === 'masculino' || saved === 'femenino') return saved;
    } catch {}
  }
  return gender;
}

/**
 * Resolves the user's RAW vocal window (before clamping to the physical recordings).
 */
function resolveUserRangeWindow(rangeData: VoiceRangeData, gender: 'masculino' | 'femenino'): UserRangeWindow {
  const activeGender = resolveVoiceGender(rangeData, gender);
  const limits = VOCAL_AUDIO_LIMITS[activeGender];
  const classPreset = rangeData?.classification ? CLASSIFICATION_RANGES[rangeData.classification] : null;

  let rawMinMidi: number = classPreset ? noteNameToMidi(classPreset.noteMin) : limits.defaultMinMidi;
  let rawMaxMidi: number = classPreset ? noteNameToMidi(classPreset.noteMax) : limits.defaultMaxMidi;

  if (rangeData?.noteMin) {
    rawMinMidi = noteNameToMidi(rangeData.noteMin);
  } else if (rangeData?.minHz && rangeData.minHz > 40) {
    rawMinMidi = Math.round(12 * Math.log2(rangeData.minHz / 440) + 69);
  }

  if (rangeData?.noteMax) {
    rawMaxMidi = noteNameToMidi(rangeData.noteMax);
  } else if (rangeData?.maxHz && rangeData.maxHz > 40) {
    rawMaxMidi = Math.round(12 * Math.log2(rangeData.maxHz / 440) + 69);
  }

  return { activeGender, rawMinMidi, rawMaxMidi };
}

/**
 * Generates the full pool of chromatic NoteInfo objects strictly within the user's detected
 * vocal range and constrained to the physical audio recordings in public/sounds/.
 */
export function generateUserNotePool(
  rangeData?: VoiceRangeData,
  gender: 'masculino' | 'femenino' = 'femenino'
): NoteInfo[] {
  const { activeGender, rawMinMidi, rawMaxMidi } = resolveUserRangeWindow(rangeData, gender);
  const limits = VOCAL_AUDIO_LIMITS[activeGender];

  // Hard clamp strictly within the physical audio recordings limits [limits.minMidi, limits.maxMidi]
  let minMidi: number = Math.max(limits.minMidi, Math.min(rawMinMidi, limits.maxMidi - 4));
  let maxMidi: number = Math.min(limits.maxMidi, Math.max(rawMaxMidi, minMidi + 4));

  const pool: NoteInfo[] = [];
  for (let m = minMidi; m <= maxMidi; m++) {
    const name = noteStrings[m % 12];
    const letter = americanNoteStrings[m % 12];
    const octave = Math.floor(m / 12) - 1;
    const frequency = 440 * Math.pow(2, (m - 69) / 12);
    pool.push({
      name,
      letter,
      octave,
      frequency: Math.round(frequency * 100) / 100,
      fullName: `${name}${octave}`,
      midi: m,
      octaveArrow: getOctaveIndicator(octave, activeGender)
    });
  }

  return pool;
}

/**
 * Returns all 12 chromatic notes (naturals + sostenidas) placed in the octave that best fits
 * the user's vocal range or the requested forcedOctave.
 * Supports multi-octave navigation by returning availableOctaves and currentOctave.
 */
export function getComfortableChromaticNotes(
  rangeData?: VoiceRangeData,
  gender: 'masculino' | 'femenino' = 'femenino',
  forcedOctave?: number
): {
  allNotes: ChromaticNoteButtonInfo[];
  naturalNotes: ChromaticNoteButtonInfo[];
  sharpNotes: ChromaticNoteButtonInfo[];
  availableOctaves: number[];
  currentOctave: number;
} {
  const pool = generateUserNotePool(rangeData, gender);
  const { activeGender, rawMinMidi, rawMaxMidi } = resolveUserRangeWindow(rangeData, gender);
  const limits = VOCAL_AUDIO_LIMITS[activeGender];

  // Extraer octavas presentes en el pool de este usuario
  const octSet = new Set<number>();
  pool.forEach(n => octSet.add(n.octave));
  if (octSet.size === 0) {
    octSet.add(activeGender === 'masculino' ? 3 : 4);
  }
  const minPossibleOct = Math.floor(limits.minMidi / 12) - 1;
  const maxPossibleOct = Math.floor(limits.maxMidi / 12) - 1;
  if (forcedOctave !== undefined && forcedOctave >= minPossibleOct && forcedOctave <= maxPossibleOct) {
    octSet.add(forcedOctave);
  }
  const availableOctaves = Array.from(octSet).sort((a, b) => a - b);

  const lo = Math.min(rawMinMidi, rawMaxMidi);
  const hi = Math.max(rawMinMidi, rawMaxMidi);
  const centerMidi = Math.floor((lo + hi) / 2);

  const octaveSpanStart = (octave: number) => (octave + 1) * 12; // Do de esa octava
  const octaveSpanMiddle = (octave: number) => octaveSpanStart(octave) + 5.5;
  const closeToCenter = (a: number, b: number) =>
    Math.abs(octaveSpanMiddle(a) - centerMidi) - Math.abs(octaveSpanMiddle(b) - centerMidi);
  const fitsRecordings = (octave: number) =>
    octaveSpanStart(octave) >= limits.minMidi && octaveSpanStart(octave) + 11 <= limits.maxMidi;
  const fitsUserWindow = (octave: number) =>
    octaveSpanStart(octave) >= lo && octaveSpanStart(octave) + 11 <= hi;

  let preferredOctave: number;
  if (forcedOctave !== undefined && (availableOctaves.includes(forcedOctave) || (forcedOctave >= minPossibleOct && forcedOctave <= maxPossibleOct))) {
    preferredOctave = forcedOctave;
  } else {
    // 1) Octava completa dentro del rango del usuario y de las grabaciones, más cercana al centro
    const tier1 = availableOctaves.filter(o => fitsRecordings(o) && fitsUserWindow(o)).sort(closeToCenter);
    // 2) Octava completa dentro de las grabaciones, más cercana al centro
    const tier2 = availableOctaves.filter(o => fitsRecordings(o)).sort(closeToCenter);
    // 3) Octava disponible más cercana al centro
    const tier3 = [...availableOctaves].sort(closeToCenter);
    preferredOctave = tier1[0] ?? tier2[0] ?? tier3[0] ?? (activeGender === 'masculino' ? 3 : 4);
  }

  const allNotes: ChromaticNoteButtonInfo[] = chromaticBase.map(item => {
    const midi = (preferredOctave + 1) * 12 + item.semitone;
    const hasRecording = midi >= limits.minMidi && midi <= limits.maxMidi;
    const octave = Math.floor(midi / 12) - 1;
    const frequency = Math.round(440 * Math.pow(2, (midi - 69) / 12) * 100) / 100;
    const fullName = `${item.displayName}${octave}`;
    const americanFullName = `${item.fileKey}${octave}`;
    const octaveArrow = getOctaveIndicator(octave, activeGender);

    return {
      name: item.name,
      displayName: item.displayName,
      letter: item.letter,
      isSharp: item.isSharp,
      semitone: item.semitone,
      octave,
      frequency,
      fullName,
      americanFullName,
      midi,
      bgColor: item.bgColor,
      shadowColor: item.shadowColor,
      hasRecording,
      octaveArrow
    };
  });

  return {
    allNotes,
    naturalNotes: allNotes.filter(n => !n.isSharp),
    sharpNotes: allNotes.filter(n => n.isSharp),
    availableOctaves,
    currentOctave: preferredOctave
  };
}

/**
 * Builds a single ChromaticNoteButtonInfo for an arbitrary MIDI note in its TRUE octave:
 * no octave mirroring. If the note falls outside the physical recordings it is flagged
 * with hasRecording = false and covered by the synthesizer at its real frequency.
 */
export function getChromaticNoteByMidi(midi: number, gender: 'masculino' | 'femenino' = 'femenino'): ChromaticNoteButtonInfo {
  const limits = VOCAL_AUDIO_LIMITS[gender];
  const m = midi;
  const item = chromaticBase[((m % 12) + 12) % 12];
  const octave = Math.floor(m / 12) - 1;
  const frequency = Math.round(440 * Math.pow(2, (m - 69) / 12) * 100) / 100;
  const hasRecording = m >= limits.minMidi && m <= limits.maxMidi;

  return {
    name: item.name,
    displayName: item.displayName,
    letter: item.letter,
    isSharp: item.isSharp,
    semitone: item.semitone,
    octave,
    frequency,
    fullName: `${item.displayName}${octave}`,
    americanFullName: `${item.fileKey}${octave}`,
    midi: m,
    bgColor: item.bgColor,
    shadowColor: item.shadowColor,
    hasRecording,
    octaveArrow: getOctaveIndicator(octave, gender)
  };
}

/**
 * Backward compatibility: returns the 7 natural solfege notes or all notes
 */
export function getComfortableSolfegeNotes(
  rangeData?: VoiceRangeData,
  gender: 'masculino' | 'femenino' = 'femenino'
): SolfegeButtonInfo[] {
  return getComfortableChromaticNotes(rangeData, gender).allNotes;
}
