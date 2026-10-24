'use client';

import { audioService } from './audioService';
import {
  NoteInfo,
  ChromaticNoteButtonInfo,
  SolfegeButtonInfo,
  noteStrings,
  americanNoteStrings,
  VOCAL_AUDIO_LIMITS,
  generateUserNotePool,
  getComfortableChromaticNotes,
  getChromaticNoteByMidi,
  getComfortableSolfegeNotes,
} from './vocalNotePool';
export {
  VOCAL_AUDIO_LIMITS,
  generateUserNotePool,
  getComfortableChromaticNotes,
  getChromaticNoteByMidi,
  getComfortableSolfegeNotes,
  noteStrings,
  americanNoteStrings,
};
export type {
  NoteInfo,
  ChromaticNoteButtonInfo,
  SolfegeButtonInfo,
};
export * from './vocalNotePool';

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
   * Preload and decode chromatic audio files into browser memory
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
   * with crystal-clear Web Audio Buffer playback and safe pitch-shifting.
   * If pitch shifting exceeds +/- 3 semitones (which causes demonic/chipmunk formant distortion),
   * it falls back to a clean synthesizer tone so reference notes always sound pristine.
   */
  public async playVoiceNote(
    note: { name?: string; midi?: number; frequency: number; octave?: number },
    gender?: 'masculino' | 'femenino',
    duration = 2.0
  ): Promise<void> {
    if (typeof window === 'undefined') return;

    audioService.unlockForMobileSilentMode();
    this.stopActiveSound();

    const ctx = this.getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {}
    }

    // Si el micrófono está activo en este momento (ej. en el Afinador), suspenderlo temporalmente
    // durante la duración de la nota para que el altavoz principal suene a pleno volumen estéreo
    // sin que iOS/Android aplique ducking telefónico ni el afinador se auto-afine con su propio parlante.
    if (audioService.isMicListening()) {
      audioService.pauseMicrophoneForPlayback(((duration || 2.0) * 1000) + 350);
    }

    // Determine target gender: prefer explicitly provided gender, otherwise localStorage
    let activeGender: 'masculino' | 'femenino' = gender || 'femenino';
    try {
      const saved = localStorage.getItem('laclave_voice_gender');
      if (saved === 'masculino' || saved === 'femenino') {
        if (!gender) {
          activeGender = saved;
        }
      }
    } catch {}

    const safeFreq = note.frequency > 20 ? note.frequency : 440;
    const midi = note.midi ?? Math.round(12 * Math.log2(safeFreq / 440) + 69);

    // Guard: si la nota está fuera de las grabaciones físicas reales (Masculino: G2-B4, Femenino: A3-Fs5),
    // no alterar ni forzar audios fuera de su rango; reproducir tono sintético limpio e inalterado.
    const limits = VOCAL_AUDIO_LIMITS[activeGender];
    if (midi < limits.minMidi || midi > limits.maxMidi) {
      audioService.playFrequency(note.frequency, duration);
      return;
    }

    const octave = note.octave ?? (Math.floor(midi / 12) - 1);
    const noteClassIdx = ((midi % 12) + 12) % 12;
    const americanName = americanNoteStrings[noteClassIdx];
    const americanFullName = `${americanName}${octave}`;
    const fileName = americanFullName.replace('#', 's');
    const audioKey = `${activeGender}_${fileName}`;
    const filePath = `/sounds/${audioKey}.mp3`;

    let buffer = this.bufferCache.get(audioKey);
    const playbackRate = 1.0;

    // 1. Cargar archivo de audio de la nota exacta
    if (!buffer) {
      try {
        const res = await fetch(filePath);
        if (res.ok) {
          const ab = await res.arrayBuffer();
          buffer = await ctx.decodeAudioData(ab);
          this.bufferCache.set(audioKey, buffer);
        }
      } catch (err) {
        // Fallback al sintetizador
      }
    }

    // 3. Play audio buffer with dynamics compressor and powerful gain envelope
    if (buffer) {
      try {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.setValueAtTime(playbackRate, ctx.currentTime);

        // Compresor dinámico para evitar saturación y mantener presencia y potencia sonora
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-14, ctx.currentTime);
        compressor.knee.setValueAtTime(10, ctx.currentTime);
        compressor.ratio.setValueAtTime(5, ctx.currentTime);
        compressor.attack.setValueAtTime(0.003, ctx.currentTime);
        compressor.release.setValueAtTime(0.20, ctx.currentTime);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(2.25, ctx.currentTime);

        const playDur = Math.min(buffer.duration / playbackRate, duration);
        gainNode.gain.setValueAtTime(2.25, ctx.currentTime + Math.max(0, playDur - 0.15));
        gainNode.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + playDur);

        source.connect(gainNode);
        gainNode.connect(compressor);
        compressor.connect(ctx.destination);

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

    // 4. Clean synthesizer fallback for extreme ranges (never distorts, pristine pitch reference)
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
