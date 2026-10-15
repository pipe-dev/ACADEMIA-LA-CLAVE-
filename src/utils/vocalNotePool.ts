'use client';

export interface NoteInfo {
  name: string;      // e.g. "Do"
  letter: string;    // e.g. "C"
  octave: number;    // e.g. 3
  frequency: number; // e.g. 130.81
  fullName: string;  // e.g. "Do3"
  midi: number;      // e.g. 48
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
 * Generates the full pool of chromatic NoteInfo objects within the user's detected vocal range [minMidi, maxMidi]
 */
export function generateUserNotePool(
  rangeData?: { noteMin?: string; noteMax?: string; minHz?: number; maxHz?: number; classification?: string; gender?: 'masculino' | 'femenino' } | null,
  gender: 'masculino' | 'femenino' = 'femenino'
): NoteInfo[] {
  let activeGender = gender;
  if (rangeData?.gender) {
    activeGender = rangeData.gender;
  } else if (rangeData?.classification === 'Bajo' || rangeData?.classification === 'Barítono' || rangeData?.classification === 'Tenor') {
    activeGender = 'masculino';
  } else if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('laclave_voice_gender');
      if (saved === 'masculino' || saved === 'femenino') activeGender = saved;
    } catch {}
  }

  let minMidi = activeGender === 'masculino' ? 45 : 57; // A2 for male, A3 for female default
  let maxMidi = activeGender === 'masculino' ? 67 : 81; // G4 for male, A5 for female default

  if (rangeData?.noteMin) {
    minMidi = noteNameToMidi(rangeData.noteMin);
  } else if (rangeData?.minHz && rangeData.minHz > 40) {
    minMidi = Math.round(12 * Math.log2(rangeData.minHz / 440) + 69);
  }

  if (rangeData?.noteMax) {
    maxMidi = noteNameToMidi(rangeData.noteMax);
  } else if (rangeData?.maxHz && rangeData.maxHz > 40) {
    maxMidi = Math.round(12 * Math.log2(rangeData.maxHz / 440) + 69);
  }

  // Safety clamp to reasonable human vocal range (A1 to C7)
  minMidi = Math.max(33, Math.min(minMidi, maxMidi - 4));
  maxMidi = Math.min(96, Math.max(maxMidi, minMidi + 4));

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
      midi: m
    });
  }

  return pool;
}

/**
 * Returns all 12 chromatic notes (naturals + sostenidas) placed in the most natural,
 * comfortable octave for the user's detected vocal range.
 */
export function getComfortableChromaticNotes(
  rangeData?: { noteMin?: string; noteMax?: string; minHz?: number; maxHz?: number; classification?: string; gender?: 'masculino' | 'femenino' } | null,
  gender: 'masculino' | 'femenino' = 'femenino'
): {
  allNotes: ChromaticNoteButtonInfo[];
  naturalNotes: ChromaticNoteButtonInfo[];
  sharpNotes: ChromaticNoteButtonInfo[];
} {
  let activeGender = gender;
  if (rangeData?.gender) {
    activeGender = rangeData.gender;
  } else if (rangeData?.classification === 'Bajo' || rangeData?.classification === 'Barítono' || rangeData?.classification === 'Tenor') {
    activeGender = 'masculino';
  } else if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('laclave_voice_gender');
      if (saved === 'masculino' || saved === 'femenino') activeGender = saved;
    } catch {}
  }

  const pool = generateUserNotePool(rangeData, activeGender);
  const midMidi = pool.length > 0 ? pool[Math.floor(pool.length / 2)].midi : (activeGender === 'masculino' ? 55 : 67);

  // Target octave for C based on midMidi:
  const preferredOctave = Math.floor(midMidi / 12) - 1;

  const allNotes: ChromaticNoteButtonInfo[] = chromaticBase.map(item => {
    let midi = (preferredOctave + 1) * 12 + item.semitone;
    // Check if within pool or adjust by octave
    const inPool = pool.find(p => p.midi === midi);
    if (!inPool) {
      const altLower = pool.find(p => p.midi === midi - 12);
      const altHigher = pool.find(p => p.midi === midi + 12);
      if (altLower) midi = midi - 12;
      else if (altHigher) midi = midi + 12;
    }
    const octave = Math.floor(midi / 12) - 1;
    const frequency = Math.round(440 * Math.pow(2, (midi - 69) / 12) * 100) / 100;
    const fullName = `${item.displayName}${octave}`;
    const americanFullName = `${item.fileKey}${octave}`;

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
      shadowColor: item.shadowColor
    };
  });

  return {
    allNotes,
    naturalNotes: allNotes.filter(n => !n.isSharp),
    sharpNotes: allNotes.filter(n => n.isSharp)
  };
}

/**
 * Builds a single ChromaticNoteButtonInfo for an arbitrary MIDI note.
 */
export function getChromaticNoteByMidi(midi: number): ChromaticNoteButtonInfo {
  const item = chromaticBase[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  const frequency = Math.round(440 * Math.pow(2, (midi - 69) / 12) * 100) / 100;

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
    midi,
    bgColor: item.bgColor,
    shadowColor: item.shadowColor
  };
}

/**
 * Backward compatibility: returns the 7 natural solfege notes or all notes
 */
export function getComfortableSolfegeNotes(
  rangeData?: { noteMin?: string; noteMax?: string; minHz?: number; maxHz?: number } | null,
  gender: 'masculino' | 'femenino' = 'femenino'
): SolfegeButtonInfo[] {
  return getComfortableChromaticNotes(rangeData, gender).allNotes;
}
