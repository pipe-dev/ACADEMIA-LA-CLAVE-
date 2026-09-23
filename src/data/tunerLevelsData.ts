'use client';

import { NoteInfo } from '../utils/voicePlaybackService';

export type Difficulty = 'Calentamiento' | 'Fácil' | 'Medio' | 'Difícil' | 'Maestro';
export type ChallengeDifficulty = Exclude<Difficulty, 'Calentamiento'>;
export type ProgressState = Record<ChallengeDifficulty, Record<number, number>>; // 0 = not done, 1-3 = stars

export const difficultySettings: Record<Difficulty, { levelCount: number }> = {
  Calentamiento: { levelCount: 12 },
  Fácil: { levelCount: 12 },
  Medio: { levelCount: 16 },
  Difícil: { levelCount: 20 },
  Maestro: { levelCount: 10 }
};

// 0 indicates a rhythm level
export const difficultyLevels: Record<ChallengeDifficulty, number[]> = {
  Fácil: [3, 4, 4, 5, 5, 6, 0, 0, 0, 0, 0, 0], // 6 tuning/melody, 6 rhythm (7-12)
  Medio: [4, 5, 5, 6, 6, 6, 7, 7, 7, 7, 7, 7, 0, 0, 0, 0], // 12 tuning/interval/melody, 4 rhythm (13-16)
  Difícil: [5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 10, 0, 0, 0, 0, 0, 0, 0, 0], // 12 tuning, 8 rhythm
  Maestro: [6, 7, 8, 9, 10, 10, 0, 0, 0, 0] // 6 ultra-precise tuning (±10 cents), 4 high-BPM rhythm
};

export const mediumDifficultyChords = [
  { rootMidi: 60, type: 'major' }, // 1: C Major
  { rootMidi: 57, type: 'minor' }, // 2: A minor
  { rootMidi: 55, type: 'major' }, // 3: G Major
  { rootMidi: 52, type: 'minor' }, // 4: E minor
  { rootMidi: 53, type: 'major' }, // 5: F Major
  { rootMidi: 50, type: 'minor' }, // 6: D minor
  { rootMidi: 58, type: 'major' }, // 7: A Major
  { rootMidi: 61, type: 'minor' }, // 8: C# minor
  { rootMidi: 51, type: 'major' }, // 9: D# Major
  { rootMidi: 48, type: 'minor' }, // 10: C minor
  { rootMidi: 59, type: 'major' }, // 11: B Major
  { rootMidi: 56, type: 'minor' }  // 12: G# minor
];

export const melodies: Record<string, { midi: number; duration: number }[]> = {
  beethoven5: [
    { midi: 67, duration: 0.3 },
    { midi: 67, duration: 0.3 },
    { midi: 67, duration: 0.3 },
    { midi: 63, duration: 0.8 }
  ],
  twinkle: [
    { midi: 60, duration: 0.4 },
    { midi: 60, duration: 0.4 },
    { midi: 67, duration: 0.4 },
    { midi: 67, duration: 0.4 },
    { midi: 69, duration: 0.4 },
    { midi: 69, duration: 0.4 },
    { midi: 67, duration: 0.8 }
  ],
  happyBirthday: [
    { midi: 60, duration: 0.3 },
    { midi: 60, duration: 0.4 },
    { midi: 62, duration: 0.7 },
    { midi: 60, duration: 0.7 },
    { midi: 65, duration: 0.7 },
    { midi: 64, duration: 1.2 }
  ],
  maryHadALamb: [
    { midi: 64, duration: 0.4 },
    { midi: 62, duration: 0.4 },
    { midi: 60, duration: 0.4 },
    { midi: 62, duration: 0.4 },
    { midi: 64, duration: 0.4 },
    { midi: 64, duration: 0.4 },
    { midi: 64, duration: 0.8 }
  ]
};

export const rhythmPatterns: Record<number, { time: number; instrument: 'clap' | 'kick' }[]> = {
  // Fácil (Levels 7-12) - 80 to 130 BPM
  7: [ // 80 BPM
    { time: 0, instrument: 'kick' },
    { time: 1500, instrument: 'clap' }
  ],
  8: [ // 90 BPM
    { time: 0, instrument: 'kick' },
    { time: 666, instrument: 'kick' },
    { time: 1333, instrument: 'clap' }
  ],
  9: [ // 100 BPM
    { time: 0, instrument: 'kick' },
    { time: 1200, instrument: 'clap' }
  ],
  10: [ // 110 BPM
    { time: 0, instrument: 'kick' },
    { time: 1091, instrument: 'clap' }
  ],
  11: [ // 120 BPM
    { time: 0, instrument: 'kick' },
    { time: 500, instrument: 'clap' },
    { time: 1000, instrument: 'kick' },
    { time: 1500, instrument: 'clap' }
  ],
  12: [ // 130 BPM
    { time: 0, instrument: 'kick' },
    { time: 461, instrument: 'kick' },
    { time: 923, instrument: 'clap' },
    { time: 1846, instrument: 'kick' }
  ],
  // Medio (Levels 13-16) - 140 to 170 BPM
  13: [ // 140 BPM - Rock
    { time: 0, instrument: 'kick' },
    { time: 857, instrument: 'clap' },
    { time: 1714, instrument: 'kick' },
    { time: 2571, instrument: 'clap' }
  ],
  14: [ // 150 BPM
    { time: 0, instrument: 'kick' },
    { time: 400, instrument: 'kick' },
    { time: 800, instrument: 'clap' },
    { time: 1600, instrument: 'kick' },
    { time: 2400, instrument: 'clap' }
  ],
  15: [ // 160 BPM
    { time: 0, instrument: 'kick' },
    { time: 750, instrument: 'clap' },
    { time: 1125, instrument: 'kick' },
    { time: 1500, instrument: 'kick' },
    { time: 1875, instrument: 'clap' }
  ],
  16: [ // 170 BPM - Funk
    { time: 0, instrument: 'kick' },
    { time: 705, instrument: 'clap' },
    { time: 1411, instrument: 'kick' },
    { time: 1764, instrument: 'kick' },
    { time: 2470, instrument: 'clap' }
  ],
  // Difícil (Levels 17-20) - 180 to 210 BPM
  17: [
    { time: 0, instrument: 'kick' },
    { time: 666, instrument: 'clap' },
    { time: 1333, instrument: 'kick' },
    { time: 1666, instrument: 'kick' },
    { time: 2000, instrument: 'clap' },
    { time: 2666, instrument: 'kick' },
    { time: 3333, instrument: 'clap' }
  ],
  18: [
    { time: 0, instrument: 'kick' },
    { time: 315, instrument: 'kick' },
    { time: 631, instrument: 'clap' },
    { time: 947, instrument: 'kick' },
    { time: 1263, instrument: 'kick' },
    { time: 1578, instrument: 'clap' },
    { time: 2210, instrument: 'kick' },
    { time: 2842, instrument: 'clap' }
  ],
  19: [
    { time: 0, instrument: 'kick' },
    { time: 300, instrument: 'kick' },
    { time: 600, instrument: 'clap' },
    { time: 900, instrument: 'kick' },
    { time: 1200, instrument: 'kick' },
    { time: 1500, instrument: 'clap' },
    { time: 1800, instrument: 'kick' },
    { time: 2100, instrument: 'clap' }
  ],
  20: [
    { time: 0, instrument: 'kick' },
    { time: 285, instrument: 'kick' },
    { time: 571, instrument: 'clap' },
    { time: 857, instrument: 'kick' },
    { time: 1142, instrument: 'clap' },
    { time: 1428, instrument: 'kick' },
    { time: 1714, instrument: 'kick' },
    { time: 2000, instrument: 'clap' }
  ],
  // Maestro (Levels 21-24) - 220 to 250 BPM
  21: [ // 220 BPM
    { time: 0, instrument: 'kick' },
    { time: 272, instrument: 'kick' },
    { time: 545, instrument: 'clap' },
    { time: 1090, instrument: 'kick' },
    { time: 1363, instrument: 'kick' },
    { time: 1636, instrument: 'clap' }
  ],
  22: [ // 230 BPM
    { time: 0, instrument: 'kick' },
    { time: 130, instrument: 'kick' },
    { time: 260, instrument: 'clap' },
    { time: 520, instrument: 'kick' },
    { time: 780, instrument: 'clap' },
    { time: 1040, instrument: 'kick' },
    { time: 1300, instrument: 'clap' }
  ],
  23: [ // 240 BPM
    { time: 0, instrument: 'kick' },
    { time: 250, instrument: 'clap' },
    { time: 500, instrument: 'kick' },
    { time: 750, instrument: 'clap' },
    { time: 1000, instrument: 'kick' },
    { time: 1250, instrument: 'clap' },
    { time: 1500, instrument: 'kick' },
    { time: 1750, instrument: 'clap' }
  ],
  24: [ // 250 BPM
    { time: 0, instrument: 'kick' },
    { time: 240, instrument: 'kick' },
    { time: 480, instrument: 'clap' },
    { time: 720, instrument: 'kick' },
    { time: 960, instrument: 'clap' },
    { time: 1200, instrument: 'kick' },
    { time: 1680, instrument: 'kick' },
    { time: 1920, instrument: 'clap' }
  ]
};

export const completionPhrases = [
  '¡Perfecto!',
  '¡Bien hecho!',
  '¡En la nota!',
  '¡Sigue así!',
  '¡Increíble!',
  '¡Excelente afinación!'
];

/**
 * Randomly select `count` notes strictly from the user's vocal range pool,
 * sorted by frequency ascending.
 */
export function generateChallenge(count: number, pool: NoteInfo[]): NoteInfo[] {
  if (pool.length === 0) return [];
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, Math.min(count, pool.length));
  return selected.sort((a, b) => a.frequency - b.frequency);
}

/**
 * Generates an arpeggio interval challenge based on chord progression,
 * constrained to and transposed within the user's vocal pool.
 */
export function generateIntervalChallenge(level: number, pool: NoteInfo[]): NoteInfo[] {
  if (pool.length === 0) return [];
  const poolByMidi = new Map<number, NoteInfo>(pool.map(n => [n.midi, n]));
  const chordInfo = mediumDifficultyChords[(level - 1) % mediumDifficultyChords.length];

  if (!chordInfo) return generateChallenge(4, pool);

  const { rootMidi, type } = chordInfo;
  const poolMidMidi = pool[Math.floor(pool.length / 2)].midi;
  const targetOctave = Math.floor(poolMidMidi / 12) - 1;

  // Find root note in the pool near the user's middle octave
  let bestRoot: NoteInfo | undefined;
  for (let octOffset = 0; octOffset <= 3; octOffset++) {
    const candidates = [targetOctave - octOffset, targetOctave + octOffset];
    for (const oct of candidates) {
      const candidateMidi = (rootMidi % 12) + 12 * (oct + 1);
      if (poolByMidi.has(candidateMidi)) {
        bestRoot = poolByMidi.get(candidateMidi);
        break;
      }
    }
    if (bestRoot) break;
  }

  if (!bestRoot) {
    const rootName = pool.find(n => n.midi % 12 === rootMidi % 12);
    bestRoot = rootName || pool[0];
  }

  const intervals = type === 'major'
    ? [0, 4, 7, 12] // Root, 3M, 5J, Octave
    : [0, 3, 7, 12]; // Root, 3m, 5J, Octave

  const challengeNotes: NoteInfo[] = [];
  for (const interval of intervals) {
    const midi = bestRoot.midi + interval;
    const note = poolByMidi.get(midi);
    if (note) challengeNotes.push(note);
  }

  if (challengeNotes.length < 2) {
    return generateChallenge(4, pool);
  }

  return challengeNotes.sort((a, b) => a.frequency - b.frequency);
}
