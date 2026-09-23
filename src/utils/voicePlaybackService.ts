'use client';

import { audioService } from './audioService';

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

const noteStrings = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];
const americanNoteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export class VoicePlaybackService {
  private static instance: VoicePlaybackService;
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private currentBufferSource: AudioBufferSourceNode | null = null;
  private currentGainNode: GainNode | null = null;
  private preloadingPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): VoicePlaybackService {
    if (!VoicePlaybackService.instance) {
      VoicePlaybackService.instance = new VoicePlaybackService();
    }
    return VoicePlaybackService.instance;
  }

  public getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    return audioService.getAudioContext();
  }

  public stopActiveSound(): void {
    if (this.currentBufferSource) {
      try {
        this.currentBufferSource.stop(0);
        this.currentBufferSource.disconnect();
      } catch {}
      this.currentBufferSource = null;
    }
    if (this.currentGainNode) {
      try {
        this.currentGainNode.disconnect();
      } catch {}
      this.currentGainNode = null;
    }
  }

  /**
   * Preload and decode all 12 chromatic audio files into browser memory
   */
  public async preloadNotes(gender: 'masculino' | 'femenino' = 'femenino'): Promise<void> {
    if (typeof window === 'undefined') return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const keysToPreload = gender === 'masculino'
      ? [
          'C3', 'Cs3', 'D3', 'Ds3', 'E3', 'F3', 'Fs3', 'G3', 'Gs3', 'A3', 'As3', 'B3',
          'G2', 'Gs2', 'A2', 'As2', 'B2',
          'C4', 'Cs4', 'D4', 'Ds4', 'E4', 'F4', 'Fs4', 'G4', 'Gs4', 'A4', 'As4', 'B4'
        ]
      : [
          'C4', 'Cs4', 'D4', 'Ds4', 'E4', 'F4', 'Fs4', 'G4', 'Gs4', 'A4', 'As4', 'B4',
          'A3', 'As3', 'B3',
          'C5', 'Cs5', 'D5', 'Ds5', 'E5', 'F5', 'Fs5'
        ];

    const fetchPromises = keysToPreload.map(async key => {
      const audioKey = `${gender}_${key}`;
      if (this.bufferCache.has(audioKey)) return;
      try {
        const res = await fetch(`/sounds/${audioKey}.mp3`);
        if (res.ok) {
          const ab = await res.arrayBuffer();
          const decoded = await ctx.decodeAudioData(ab);
          this.bufferCache.set(audioKey, decoded);
        }
      } catch {
        // Ignored for non-essential octave edges
      }
    });

    this.preloadingPromise = Promise.all(fetchPromises).then(() => {});
    await this.preloadingPromise;
  }

  /**
   * Plays a note using real human voice recordings (/sounds/{gender}_{Note}.mp3)
   * with crystal-clear Web Audio Buffer playback and immediate synthesized fallback.
   */
  /**
   * Plays a note using real human voice recordings (/sounds/{gender}_{Note}.mp3)
   * with crystal-clear Web Audio Buffer playback and authentic pitch-shifted voice fallback.
   */
  public async playVoiceNote(
    note: { name?: string; midi?: number; frequency: number; octave?: number },
    gender?: 'masculino' | 'femenino',
    duration = 2.0
  ): Promise<void> {
    if (typeof window === 'undefined') return;

    this.stopActiveSound();

    const ctx = this.getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {}
    }

    // Resolve gender: prefer explicit argument, otherwise read persisted preference
    let activeGender: 'masculino' | 'femenino' = gender || 'femenino';
    try {
      const saved = localStorage.getItem('laclave_voice_gender');
      if (saved === 'masculino' || saved === 'femenino') {
        // If gender wasn't explicitly passed, or caller passed default 'femenino' while user saved 'masculino'
        if (!gender || saved === 'masculino') {
          activeGender = saved;
        }
      }
    } catch {}

    // Determine midi, octave and file name
    const midi = note.midi ?? Math.round(12 * Math.log2(note.frequency / 440) + 69);
    const octave = note.octave ?? (Math.floor(midi / 12) - 1);
    const americanName = americanNoteStrings[midi % 12];
    const americanFullName = `${americanName}${octave}`;
    const fileName = americanFullName.replace('#', 's');
    const audioKey = `${activeGender}_${fileName}`;
    const filePath = `/sounds/${audioKey}.mp3`;

    let buffer = this.bufferCache.get(audioKey);
    let playbackRate = 1.0;

    // If buffer not in memory cache yet, try on-demand fetch & decode
    if (!buffer) {
      try {
        const res = await fetch(filePath);
        if (res.ok) {
          const ab = await res.arrayBuffer();
          buffer = await ctx.decodeAudioData(ab);
          this.bufferCache.set(audioKey, buffer);
        }
      } catch (err) {
        console.warn(`[VoicePlayback] Failed to load voice audio for ${filePath}:`, err);
      }
    }

    // Fallback: If exact note file does not exist, find closest available note of the SAME gender
    // and pitch-shift it so it ALWAYS sounds like a real human voice of the chosen gender!
    if (!buffer) {
      const availableKeys = activeGender === 'masculino'
        ? [
            { key: 'G2', m: 43 }, { key: 'Gs2', m: 44 }, { key: 'A2', m: 45 }, { key: 'As2', m: 46 }, { key: 'B2', m: 47 },
            { key: 'C3', m: 48 }, { key: 'Cs3', m: 49 }, { key: 'D3', m: 50 }, { key: 'Ds3', m: 51 }, { key: 'E3', m: 52 },
            { key: 'F3', m: 53 }, { key: 'Fs3', m: 54 }, { key: 'G3', m: 55 }, { key: 'Gs3', m: 56 }, { key: 'A3', m: 57 },
            { key: 'As3', m: 58 }, { key: 'B3', m: 59 }, { key: 'C4', m: 60 }, { key: 'Cs4', m: 61 }, { key: 'D4', m: 62 },
            { key: 'Ds4', m: 63 }, { key: 'E4', m: 64 }, { key: 'F4', m: 65 }, { key: 'Fs4', m: 66 }, { key: 'G4', m: 67 },
            { key: 'Gs4', m: 68 }, { key: 'A4', m: 69 }, { key: 'As4', m: 70 }, { key: 'B4', m: 71 }
          ]
        : [
            { key: 'A3', m: 57 }, { key: 'As3', m: 58 }, { key: 'B3', m: 59 },
            { key: 'C4', m: 60 }, { key: 'Cs4', m: 61 }, { key: 'D4', m: 62 }, { key: 'Ds4', m: 63 }, { key: 'E4', m: 64 },
            { key: 'F4', m: 65 }, { key: 'Fs4', m: 66 }, { key: 'G4', m: 67 }, { key: 'Gs4', m: 68 }, { key: 'A4', m: 69 },
            { key: 'As4', m: 70 }, { key: 'B4', m: 71 }, { key: 'C5', m: 72 }, { key: 'Cs5', m: 73 }, { key: 'D5', m: 74 },
            { key: 'Ds5', m: 75 }, { key: 'E5', m: 76 }, { key: 'F5', m: 77 }, { key: 'Fs5', m: 78 }
          ];

      // Find note with the same pitch class (e.g., C4 for C3), or closest MIDI
      const sameClass = availableKeys.find(k => (k.m % 12) === (midi % 12));
      const closest = sameClass || availableKeys.reduce((prev, curr) =>
        Math.abs(curr.m - midi) < Math.abs(prev.m - midi) ? curr : prev
      );

      if (closest) {
        const fallbackAudioKey = `${activeGender}_${closest.key}`;
        let fallbackBuffer = this.bufferCache.get(fallbackAudioKey);
        if (!fallbackBuffer) {
          try {
            const res = await fetch(`/sounds/${fallbackAudioKey}.mp3`);
            if (res.ok) {
              const ab = await res.arrayBuffer();
              fallbackBuffer = await ctx.decodeAudioData(ab);
              this.bufferCache.set(fallbackAudioKey, fallbackBuffer);
            }
          } catch {}
        }

        if (fallbackBuffer) {
          buffer = fallbackBuffer;
          const semitoneDiff = midi - closest.m;
          playbackRate = Math.pow(2, semitoneDiff / 12);
        }
      }
    }

    // If decoded buffer is available, play via Web Audio graph
    if (buffer) {
      try {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.setValueAtTime(playbackRate, ctx.currentTime);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(1.40, ctx.currentTime);

        const playDur = Math.min(buffer.duration / playbackRate, duration);
        gainNode.gain.setValueAtTime(1.40, ctx.currentTime + Math.max(0, playDur - 0.15));
        gainNode.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + playDur);

        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        this.currentBufferSource = source;
        this.currentGainNode = gainNode;

        source.onended = () => {
          if (this.currentBufferSource === source) {
            this.currentBufferSource = null;
            this.currentGainNode = null;
          }
        };

        source.start(0);
        source.stop(ctx.currentTime + playDur);
        return;
      } catch (err) {
        console.warn('[VoicePlayback] Error starting audio buffer playback:', err);
      }
    }

    // Ultimate fallback if web audio buffer is completely unavailable
    audioService.playFrequency(note.frequency, duration);
  }

  /**
   * Percussion & Rhythm audio helpers
   */
  public playKick(time?: number): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const t = time ?? ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.12);

    gain.gain.setValueAtTime(1.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.12);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(50); } catch {}
    }
  }

  public playClap(time?: number): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const t = time ?? ctx.currentTime;

    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.Q.setValueAtTime(1.2, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(1.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(t);
    noise.stop(t + 0.15);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(30); } catch {}
    }
  }

  public playMetronomeTick(time?: number): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const t = time ?? ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1000, t);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  public playCompletionChime(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const t = ctx.currentTime;

    const notes = [1046.5, 1318.51]; // C6, E6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(freq, t + i * 0.08);
      gain.gain.setValueAtTime(0.2, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.4);
    });
  }
}

export const voicePlayback = VoicePlaybackService.getInstance();

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
 * Base 12 chromatic note definitions with harmonious color scheme
 */
const chromaticBase = [
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
 * Builds a single ChromaticNoteButtonInfo for an arbitrary MIDI note. Used to
 * create range-expansion bonus keys just above the user's vocal limit.
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
