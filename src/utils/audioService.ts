import { logger } from './logger';
import { emitMicActive } from './micEvents';

/**
 * Web Audio API helper for synthesized piano/vocal notes, button feedback sound effects,
 * and microphone pitch detection using autocorrelation.
 */

function createSilentWav(sampleRate: number = 44100): string {
  try {
    const arrayBuffer = new ArrayBuffer(10);
    const dataView = new DataView(arrayBuffer);
    dataView.setUint32(0, sampleRate, true);
    dataView.setUint32(4, sampleRate, true);
    dataView.setUint16(8, 1, true);
    const missing = window.btoa(String.fromCharCode(...new Uint8Array(arrayBuffer))).slice(0, 13);
    return `data:audio/wav;base64,UklGRisAAABXQVZFZm10IBAAAAABAAEA${missing}AgAZGF0YQcAAACAgICAgICAAAA=`;
  } catch {
    return 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
  }
}

class AudioService {
  private ctx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micSourceNode: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isListening: boolean = false;
  private isPausedForPlayback: boolean = false;
  private lastPitchCallback: ((pitchHz: number, volume: number) => void) | null = null;
  private micSessionId: number = 0;
  private micPauseResumeTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private isPitchLoopRunning: boolean = false;
  private unlockAudioEl: HTMLAudioElement | null = null;
  private isSilentUnlocked: boolean = false;
  public onMicPauseChange?: (isPaused: boolean) => void;

  constructor() {
    if (typeof window !== 'undefined') {
      // Audio Session Category: Playback (permite sonido con interruptor de silencio y modos de enfoque en iOS/Android)
      if ('audioSession' in navigator) {
        try {
          (navigator as unknown as { audioSession: { type: string } }).audioSession.type = 'playback';
        } catch {}
      }
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.playbackState = 'none';
        } catch {}
      }

      const USER_EVENTS = ['touchstart', 'touchend', 'click', 'mousedown', 'keydown', 'pointerdown'];
      const unlockHandler = () => {
        this.unlockForMobileSilentMode();
        USER_EVENTS.forEach(ev => {
          window.removeEventListener(ev, unlockHandler, { capture: true });
        });
      };

      USER_EVENTS.forEach(ev => {
        window.addEventListener(ev, unlockHandler, { capture: true, passive: true });
      });

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
      });
    }
  }

  /**
   * Desbloquea Web Audio API para sonar a traves de altavoces multimedia aun cuando
   * el dispositivo este en modo silencio fisico (mute switch en iPhone) o modo enfoque/no molestar (Android e iOS).
   * Solo ejecuta el pulso HTML5 una unica vez para no secuestrar la Dynamic Island de iOS ni el reproductor de Android.
   */
  public unlockForMobileSilentMode() {
    if (typeof window === 'undefined') return;

    // Si ya fue desbloqueado, solo reanudar contexto si estuviera suspendido
    if (this.isSilentUnlocked) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }
    this.isSilentUnlocked = true;

    // 1. Audio Session: Playback
    if ('audioSession' in navigator) {
      try {
        (navigator as unknown as { audioSession: { type: string } }).audioSession.type = 'playback';
      } catch {}
    }
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'none';
      } catch {}
    }

    // 2. Elemento HTML5 de audio inaudible de un unico pulso para iniciar el subsistema multimedia
    if (!this.unlockAudioEl) {
      try {
        this.unlockAudioEl = document.createElement('audio');
        this.unlockAudioEl.src = createSilentWav(44100);
        this.unlockAudioEl.loop = false;
        this.unlockAudioEl.volume = 0.001;
        this.unlockAudioEl.setAttribute('playsinline', 'true');
        this.unlockAudioEl.setAttribute('webkit-playsinline', 'true');
        this.unlockAudioEl.style.position = 'fixed';
        this.unlockAudioEl.style.pointerEvents = 'none';
        this.unlockAudioEl.style.opacity = '0';
        this.unlockAudioEl.style.width = '1px';
        this.unlockAudioEl.style.height = '1px';
        this.unlockAudioEl.style.bottom = '0';
        document.body?.appendChild(this.unlockAudioEl);
      } catch {}
    }
    if (this.unlockAudioEl) {
      this.unlockAudioEl.play()
        .then(() => {
          setTimeout(() => {
            try {
              if (this.unlockAudioEl) {
                this.unlockAudioEl.pause();
                this.unlockAudioEl.currentTime = 0;
                this.unlockAudioEl.remove();
                this.unlockAudioEl = null;
              }
              if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'none';
              }
            } catch {}
          }, 80);
        })
        .catch(() => {});
    }

    // 3. Web Audio Context initialization & buffer trigger
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        logger.info('Audio', 'AudioContext creado correctamente');
      }
    }
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      try {
        const buffer = this.ctx.createBuffer(1, 1, 22050);
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        source.start(0);
      } catch {}
    }
    this.isSilentUnlocked = true;
  }

  private initCtx() {
    if (!this.isSilentUnlocked) {
      this.unlockForMobileSilentMode();
    }
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      logger.info('Audio', 'AudioContext creado correctamente');
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        logger.info('Audio', 'AudioContext reanudado');
      }).catch((err) => {
        logger.warn('Audio', 'Error al reanudar AudioContext', err);
      });
    }
  }

  public getAudioContext(): AudioContext | null {
    this.initCtx();
    return this.ctx;
  }

  /**
   * Play a musical frequency note with pleasant harmonic synthesizer envelope.
   * Includes harmonic mix (fundamental sine + warm triangle overtone) so small mobile speakers
   * reproduce the note loudly and clearly even on low-frequency notes.
   */
  public playFrequency(freq: number, duration: number = 1.0) {
    try {
      this.unlockForMobileSilentMode();
      this.initCtx();
      if (!this.ctx) return;

      if (this.isListening && !this.isPausedForPlayback) {
        this.pauseMicrophoneForPlayback(Math.round(duration * 1000 + 200));
      }

      const osc = this.ctx.createOscillator();
      const oscHarmonic = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const harmGain = this.ctx.createGain();

      // Fundamental sine
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      // Warm 2nd harmonic for phone speakers
      oscHarmonic.type = 'triangle';
      oscHarmonic.frequency.setValueAtTime(freq * 2, this.ctx.currentTime);

      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.85, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      harmGain.gain.setValueAtTime(0.0001, now);
      harmGain.gain.linearRampToValueAtTime(0.22, now + 0.04);
      harmGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      oscHarmonic.connect(harmGain);
      gain.connect(this.ctx.destination);
      harmGain.connect(this.ctx.destination);

      osc.start(now);
      oscHarmonic.start(now);
      osc.stop(now + duration);
      oscHarmonic.stop(now + duration);
    } catch (e) {
      console.warn('Audio playback not allowed yet or failed', e);
    }
  }

  /**
   * Play safe soft metallic ding sound for interactive task completion and button feedback
   */
  public playSoftDing() {
    this.vibrate(18);
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // Warm C5 tone
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, now); // Soft G5 harmonic (quint)

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.22);
      osc2.stop(now + 0.22);
    } catch {
      // Ignore
    }
  }

  /**
   * Plays a sequence of notes (frequencies) as a clear piano reference for solfege scales
   */
  public playScaleSequence(
    frequencies: number[],
    noteDurationMs: number = 380,
    onStep?: (index: number) => void,
    onComplete?: () => void
  ): () => void {
    this.unlockForMobileSilentMode();
    this.initCtx();
    let isCancelled = false;
    const timeoutIds: number[] = [];

    frequencies.forEach((freq, idx) => {
      const tid = window.setTimeout(() => {
        if (isCancelled) return;
        this.playFrequency(freq, 0.45);
        this.vibrate(12);
        if (onStep) onStep(idx);
        if (idx === frequencies.length - 1 && onComplete) {
          const compTid = window.setTimeout(() => {
            if (!isCancelled) onComplete();
          }, noteDurationMs);
          timeoutIds.push(compTid);
        }
      }, idx * noteDurationMs);
      timeoutIds.push(tid);
    });

    return () => {
      isCancelled = true;
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }

  /**
   * Safe Haptic Vibration feedback
   */
  public vibrate(pattern: number | number[] = 15) {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Differentiated haptic vibration for pitch tuning success
   */
  public vibrateSuccess() {
    this.vibrate([20, 35, 25]);
  }

  /**
   * Differentiated haptic vibration for pitch error / off-key detection
   */
  public vibrateError() {
    this.vibrate([70, 50, 70]);
  }

  /**
   * Differentiated subtle haptic vibration when holding pitch in tune
   */
  public vibrateInTune() {
    this.vibrate([12]);
  }

  /**
   * Differentiated subtle haptic vibration when holding pitch in tune
   */
  public vibrateHold() {
    this.vibrate(10);
  }

  /**
   * Triumphant 3-star epic fanfare & melody with Web Audio API synthesis
   */
  public play3StarFanfare() {
    this.vibrate([40, 40, 50, 50, 80, 50, 150]);
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // 1. Ascending Brass/Vocal Fanfare Melody: G4 -> C5 -> E5 -> G5 -> C6 -> E6 -> Grand Chord!
      const melodyNotes = [
        { freq: 392.00, timeOffset: 0.00, duration: 0.18 }, // G4
        { freq: 523.25, timeOffset: 0.16, duration: 0.18 }, // C5
        { freq: 659.25, timeOffset: 0.32, duration: 0.18 }, // E5
        { freq: 783.99, timeOffset: 0.48, duration: 0.22 }, // G5
        { freq: 1046.50, timeOffset: 0.70, duration: 0.35 }, // C6
        { freq: 1318.51, timeOffset: 0.95, duration: 0.45 }, // E6
        { freq: 1567.98, timeOffset: 1.20, duration: 1.40 }, // G6 Grand Peak!
      ];

      melodyNotes.forEach(note => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle'; // Rich brass/vocal timbre
        osc.frequency.setValueAtTime(note.freq, now + note.timeOffset);

        gain.gain.setValueAtTime(0, now + note.timeOffset);
        gain.gain.linearRampToValueAtTime(0.35, now + note.timeOffset + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.timeOffset + note.duration);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + note.timeOffset);
        osc.stop(now + note.timeOffset + note.duration);
      });

      // 2. Grand Victory Harmony Chord at 1.2s (C5 + E5 + G5 + C6 + E6)
      const chordFreqs = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      chordFreqs.forEach(freq => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + 1.20);

        gain.gain.setValueAtTime(0, now + 1.20);
        gain.gain.linearRampToValueAtTime(0.2, now + 1.25);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.50);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + 1.20);
        osc.stop(now + 2.50);
      });

      // 3. Sparkling Harp/Glockenspiel Glisten Effect (rapid high sparkles)
      const sparkleNotes = [1567.98, 1760.00, 1975.53, 2093.00, 2349.32, 2637.02];
      sparkleNotes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + 1.40 + idx * 0.08);

        gain.gain.setValueAtTime(0, now + 1.40 + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.12, now + 1.40 + idx * 0.08 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.40 + idx * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + 1.40 + idx * 0.08);
        osc.stop(now + 1.40 + idx * 0.08 + 0.25);
      });

      // 4. Sub-Bass Triumph Impact (130.81Hz - C3)
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(130.81, now + 1.20);

      bassGain.gain.setValueAtTime(0, now + 1.20);
      bassGain.gain.linearRampToValueAtTime(0.4, now + 1.22);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 2.40);

      bassOsc.connect(bassGain);
      bassGain.connect(this.ctx.destination);

      bassOsc.start(now + 1.20);
      bassOsc.stop(now + 2.40);
    } catch {
      // Ignore
    }
  }

  /**
   * Star 1 Arpeggio Note: C5 (523.25Hz) hopeful ascending base
   */
  public playStar1ArpeggioNote() {
    this.vibrate(20);
    try {
      this.initCtx();
      if (!this.ctx) return;
      this.playFrequency(523.25, 0.35); // C5
    } catch {
      // Ignore
    }
  }

  /**
   * Star 2 Arpeggio Note: E5 -> G5 (659Hz -> 784Hz) ascending harmony step
   */
  public playStar2ArpeggioNote() {
    this.vibrate([25, 30, 35]);
    try {
      this.initCtx();
      if (!this.ctx) return;
      this.playFrequency(659.25, 0.30); // E5
      setTimeout(() => {
        this.playFrequency(783.99, 0.35); // G5
      }, 140);
    } catch {
      // Ignore
    }
  }

  /**
   * Cheerful 2-star chime
   */
  public play2StarChime() {
    this.playStar2ArpeggioNote();
  }

  /**
   * Sad defeat song for 1 or 0 stars (melancholic minor-key slide down + wobble)
   */
  public playSadDefeatSound() {
    this.vibrate([150, 100, 200, 100, 300]);
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Tragic descending minor notes: E4 -> C4 -> A3 -> F3 -> Low Defeat Slide
      const sadNotes = [
        { freq: 329.63, timeOffset: 0.00, duration: 0.28 }, // E4
        { freq: 261.63, timeOffset: 0.25, duration: 0.28 }, // C4
        { freq: 220.00, timeOffset: 0.50, duration: 0.32 }, // A3
        { freq: 174.61, timeOffset: 0.80, duration: 0.40 }, // F3
      ];

      sadNotes.forEach(note => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(note.freq, now + note.timeOffset);

        gain.gain.setValueAtTime(0, now + note.timeOffset);
        gain.gain.linearRampToValueAtTime(0.25, now + note.timeOffset + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.timeOffset + note.duration);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + note.timeOffset);
        osc.stop(now + note.timeOffset + note.duration);
      });

      // Low Sad Trombone/Cello Pitch Slide (220Hz sliding down to 130.81Hz)
      const slideOsc = this.ctx.createOscillator();
      const slideGain = this.ctx.createGain();
      slideOsc.type = 'sawtooth';
      slideOsc.frequency.setValueAtTime(220.00, now + 1.15); // A3
      slideOsc.frequency.exponentialRampToValueAtTime(130.81, now + 2.10); // Low C3 defeat slide

      slideGain.gain.setValueAtTime(0, now + 1.15);
      slideGain.gain.linearRampToValueAtTime(0.3, now + 1.20);
      slideGain.gain.exponentialRampToValueAtTime(0.001, now + 2.20);

      slideOsc.connect(slideGain);
      slideGain.connect(this.ctx.destination);

      slideOsc.start(now + 1.15);
      slideOsc.stop(now + 2.20);
    } catch {
      // Ignore
    }
  }

  /**
   * Cartoon comedy "Sad Trombone / Wa-Wa-Wa-Waaah" mockery sound for 0 stars
   */
  public playMockeryWawawaSound() {
    this.vibrate([100, 80, 100, 80, 100, 80, 400]);
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Classic cartoon "wa-wa-wa-waaah" pitch sequence: D4 -> C#4 -> C4 -> B3 sliding to D3
      const notes = [
        { freq: 293.66, timeOffset: 0.00, duration: 0.28 }, // D4 "Wa"
        { freq: 277.18, timeOffset: 0.32, duration: 0.28 }, // C#4 "Wa"
        { freq: 261.63, timeOffset: 0.64, duration: 0.28 }, // C4 "Wa"
      ];

      notes.forEach(note => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(note.freq, now + note.timeOffset);

        // Add funny pitch bend wobble to each "Wa"
        osc.frequency.linearRampToValueAtTime(note.freq - 12, now + note.timeOffset + note.duration);

        gain.gain.setValueAtTime(0, now + note.timeOffset);
        gain.gain.linearRampToValueAtTime(0.3, now + note.timeOffset + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.timeOffset + note.duration);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + note.timeOffset);
        osc.stop(now + note.timeOffset + note.duration);
      });

      // The final long downward "Waaaaaah..." slide (B3 246.94Hz -> D3 146.83Hz)
      const slideOsc = this.ctx.createOscillator();
      const slideGain = this.ctx.createGain();
      slideOsc.type = 'sawtooth';
      slideOsc.frequency.setValueAtTime(246.94, now + 0.98); // B3
      slideOsc.frequency.exponentialRampToValueAtTime(146.83, now + 2.20); // D3 low mockery slide

      slideGain.gain.setValueAtTime(0, now + 0.98);
      slideGain.gain.linearRampToValueAtTime(0.35, now + 1.05);
      slideGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.30);

      slideOsc.connect(slideGain);
      slideGain.connect(this.ctx.destination);

      slideOsc.start(now + 0.98);
      slideOsc.stop(now + 2.30);
    } catch {
      // Ignore
    }
  }

  public playRetrySound() {
    this.playSadDefeatSound();
  }

  /**
   * Sound effect for losing a heart/life (subtle descending tone)
   */
  public playHeartLostSound() {
    this.vibrate([60, 40, 70]);
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.35);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Ignore
    }
  }

  /**
   * Sound effect for gaining/recovering a heart/life (bright arpeggiated chord)
   */
  public playHeartGainedSound() {
    this.vibrate([40, 30, 80]);
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Bright C-Major arpeggio: C4 (261.63), E4 (329.63), G4 (392.00), C5 (523.25)
      const notes = [
        { freq: 261.63, delay: 0.00, dur: 0.20 },
        { freq: 329.63, delay: 0.08, dur: 0.20 },
        { freq: 392.00, delay: 0.16, dur: 0.22 },
        { freq: 523.25, delay: 0.24, dur: 0.40 }
      ];

      notes.forEach(({ freq, delay, dur }) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);

        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(0.2, now + delay + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + delay);
        osc.stop(now + delay + dur);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Play UI tap click feedback
   */
  public playClickSound() {
    this.vibrate(12);
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.05);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Ignore
    }
  }

  /**
   * Play view/tab transition sweep sound
   */
  public playTransitionSound() {
    this.vibrate(10);
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.12);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // Ignore
    }
  }

  /**
   * Play modal or card opening sound
   */
  public playOpenSound() {
    this.vibrate(15);
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.09);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Ignore
    }
  }

  /**
   * Play modal or card closing sound
   */
  public playCloseSound() {
    this.vibrate(15);
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(330, now + 0.08);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Ignore
    }
  }

  /**
   * Play cheerful double coin ping for earning XP
   */
  public playXpGainSound() {
    this.vibrate([25, 40, 25]);
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1318.51, now); // E6
      osc1.frequency.setValueAtTime(1975.53, now + 0.08); // B6

      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.25);
    } catch {
      // Ignore
    }
  }

  /**
   * Play real-time flame swell sound as user swipes up to ignite streak (0.0 to 1.0)
   */
  public playFlameSwellSound(progress: number) {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const freq = 220 + progress * 660; // 220Hz -> 880Hz pitch swell

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      const vol = Math.min(0.22, 0.05 + progress * 0.17);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);

      if (Math.random() < 0.3) {
        this.vibrate(Math.round(8 + progress * 15));
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Play triumphant multi-layered streak ignition fanfare and flame woosh burst
   */
  public playStreakIgnitionSound() {
    this.vibrate([40, 60, 40, 100, 50, 150]);
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Layer 1: Flame Woosh Swell (Lowpass Noise Filter)
      const bufferSize = this.ctx.sampleRate * 0.8;
      const noiseBuf = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const out = noiseBuf.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        out[i] = (Math.random() * 2 - 1) * 0.2;
      }
      const noiseSrc = this.ctx.createBufferSource();
      noiseSrc.buffer = noiseBuf;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(150, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(1800, now + 0.4);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.001, now);
      noiseGain.gain.linearRampToValueAtTime(0.3, now + 0.2);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      noiseSrc.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noiseSrc.start(now);

      // Layer 2: Brassy Celebratory Chord Arpeggio (C5 -> E5 -> G5 -> C6 -> E6)
      const chordNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      chordNotes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        const startTime = now + idx * 0.08;
        const duration = idx === chordNotes.length - 1 ? 0.9 : 0.25;

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.28, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });

      // Layer 3: High Sparkling Harmonics (G6 -> C7 chime)
      const highChimes = [1567.98, 2093.00];
      highChimes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + 0.35 + idx * 0.1);

        const startTime = now + 0.35 + idx * 0.1;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.6);
      });

    } catch {
      // Ignore
    }
  }

  /**
   * Play atmospheric Zen Mode transition chime in 432 Hz tuning
   */
  public playZenChimeSound() {
    this.vibrate([40, 80, 120]);
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // 432 Hz Tuning Scale: C4 (256.87), G4 (384.87), C5 (513.74), E5 (647.27)
      const frequencies = [256.87, 384.87, 513.74, 647.27];
      frequencies.forEach((freq, index) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.08);

        gain.gain.setValueAtTime(0, now + index * 0.08);
        gain.gain.linearRampToValueAtTime(0.12, now + index * 0.08 + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + 1.8);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + 1.8);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Play triumphant fanfare sound when completing a lesson
   */
  public playLessonCompleteSound() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);

        const startTime = now + idx * 0.09;
        const duration = idx === notes.length - 1 ? 0.6 : 0.18;

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Play sparkling victory fanfare when unlocking a badge
   */
  public playBadgeUnlockedSound() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [783.99, 1046.50, 1318.51, 1567.98]; // G5, C6, E6, G6

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        const startTime = now + idx * 0.07;
        const duration = 0.4;

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Play majestic level up arpeggio chord
   */
  public playLevelUpSound() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Majestic major 9th arpeggio (C5, E5, G5, B5, D6, C6)
      const notes = [523.25, 659.25, 783.99, 987.77, 1174.66, 1046.50];

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = idx === notes.length - 1 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        const startTime = now + idx * 0.08;
        const duration = idx === notes.length - 1 ? 0.8 : 0.25;

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.35, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Start microphone input listening for tuner
   */
  public async startMicrophone(onPitchDetected: (pitchHz: number, volume: number) => void): Promise<boolean> {
    try {
      this.initCtx();
      if (!this.ctx) return false;
      if (this.ctx.state === 'suspended') {
        try { await this.ctx.resume(); } catch {}
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('Microphone access is not supported or restricted in this environment.');
        return false;
      }

      // Track session and store callback for seamless resumption
      const sessionId = ++this.micSessionId;
      this.lastPitchCallback = onPitchDetected;
      this.isListening = true;
      this.isPausedForPlayback = false;

      if (this.micPauseResumeTimeoutId) {
        clearTimeout(this.micPauseResumeTimeoutId);
        this.micPauseResumeTimeoutId = null;
      }

      // Clean up any lingering previous source nodes or streams before acquiring new one
      if (this.micSourceNode) {
        try { this.micSourceNode.disconnect(); } catch {}
        this.micSourceNode = null;
      }
      if (this.micStream) {
        this.micStream.getTracks().forEach(t => { try { t.stop(); } catch {} });
        this.micStream = null;
      }

      // 1. Modern iOS 17+ / iOS 18 Web Audio Session Category: Play-and-Record
      if (typeof navigator !== 'undefined' && 'audioSession' in navigator) {
        try {
          (navigator as any).audioSession.type = 'play-and-record';
        } catch {}
      }

      // 2. Solicitud de micrófono optimizada para MÚSICA y CANTO (evita filtros de llamada que degradan notas)
      let stream: MediaStream;
      try {
        const audioConstraints: MediaTrackConstraints = {
          echoCancellation: { ideal: false },
          noiseSuppression: { ideal: false },
          autoGainControl: { ideal: false }
        };
        stream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
          video: false
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      }

      // 3. CRITICAL RACE CONDITION GUARD:
      // Si el usuario presionó detener micrófono o inició otra sesión mientras getUserMedia estaba en vuelo:
      if (this.micSessionId !== sessionId || !this.isListening) {
        if (stream) {
          stream.getTracks().forEach(t => { try { t.stop(); } catch {} });
        }
        if (typeof navigator !== 'undefined' && 'audioSession' in navigator) {
          try {
            (navigator as any).audioSession.type = 'playback';
          } catch {}
        }
        if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
          try {
            navigator.mediaSession.playbackState = 'none';
          } catch {}
        }
        return false;
      }

      this.micStream = stream;

      // Confirmar sesión play-and-record
      if (typeof navigator !== 'undefined' && 'audioSession' in navigator) {
        try {
          (navigator as any).audioSession.type = 'play-and-record';
        } catch {}
      }

      this.micSourceNode = this.ctx.createMediaStreamSource(this.micStream);
      if (!this.analyser) {
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 2048;
      }
      this.micSourceNode.connect(this.analyser);

      emitMicActive(true);
      this.detectPitchLoop(onPitchDetected);
      return true;
    } catch (err: any) {
      this.isListening = false;
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        console.warn('Microphone permission denied by user or browser policy.');
      } else {
        console.warn('Could not initialize microphone:', err?.message || err);
      }
      return false;
    }
  }

  public isMicListening(): boolean {
    return this.isListening;
  }

  public isMicPausedForPlayback(): boolean {
    return this.isPausedForPlayback;
  }

  public isMicTemporarilyMuted(): boolean {
    return this.isPausedForPlayback;
  }

  /**
   * Temporarily releases the microphone hardware so that reference notes
   * (synthesized piano or real human vocal samples) play through the bottom stereo loudspeaker
   * at 100% full volume with ZERO ducking or earpiece telephony routing.
   * When the note finishes, the microphone automatically resumes listening seamlessly.
   */
  public pauseMicrophoneForPlayback(durationMs: number = 2300): void {
    if (!this.isListening) {
      if (typeof navigator !== 'undefined' && 'audioSession' in navigator) {
        try {
          (navigator as any).audioSession.type = 'playback';
        } catch {}
      }
      if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
        try {
          navigator.mediaSession.playbackState = 'none';
        } catch {}
      }
      return;
    }

    this.isPausedForPlayback = true;
    if (this.onMicPauseChange) {
      try { this.onMicPauseChange(true); } catch {}
    }

    if (this.micPauseResumeTimeoutId) {
      clearTimeout(this.micPauseResumeTimeoutId);
      this.micPauseResumeTimeoutId = null;
    }

    // 1. Liberar físicamente la captura de hardware para que iOS salga de play-and-record
    if (this.micSourceNode) {
      try { this.micSourceNode.disconnect(); } catch {}
      this.micSourceNode = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => {
        try { track.stop(); } catch {}
      });
      this.micStream = null;
    }

    // 2. Restaurar audio a modo playback para permitir sonido en silencio/enfoque
    if (typeof navigator !== 'undefined' && 'audioSession' in navigator) {
      try {
        (navigator as any).audioSession.type = 'playback';
      } catch {}
    }
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'none';
      } catch {}
    }

    const currentSessionId = this.micSessionId;

    // 3. Reanudar micrófono de forma completamente automática y silenciosa al terminar la nota
    this.micPauseResumeTimeoutId = setTimeout(async () => {
      this.micPauseResumeTimeoutId = null;
      if (this.isListening && this.isPausedForPlayback && this.micSessionId === currentSessionId) {
        this.isPausedForPlayback = false;
        if (this.onMicPauseChange) {
          try { this.onMicPauseChange(false); } catch {}
        }
        if (this.lastPitchCallback) {
          await this.startMicrophone(this.lastPitchCallback);
        }
      }
    }, durationMs);
  }

  /**
   * Alias de compatibilidad hacia atrás
   */
  public muteMicTemporarily(durationMs: number = 2200): void {
    this.pauseMicrophoneForPlayback(durationMs);
  }

  public stopMicrophone() {
    this.micSessionId++;
    this.isListening = false;
    this.isPausedForPlayback = false;

    if (this.micPauseResumeTimeoutId) {
      clearTimeout(this.micPauseResumeTimeoutId);
      this.micPauseResumeTimeoutId = null;
    }

    if (this.onMicPauseChange) {
      try { this.onMicPauseChange(false); } catch {}
    }

    if (this.micSourceNode) {
      try { this.micSourceNode.disconnect(); } catch {}
      this.micSourceNode = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => {
        try { track.stop(); } catch {}
      });
      this.micStream = null;
    }

    // Restaurar sesión de audio a playback para mantener sonido en silencio/enfoque
    if (typeof navigator !== 'undefined' && 'audioSession' in navigator) {
      try {
        (navigator as any).audioSession.type = 'playback';
      } catch {}
    }
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'none';
      } catch {}
    }

    emitMicActive(false);
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  private lastPitchDetectTime: number = 0;
  private timeDomainBuffer: Float32Array = new Float32Array(2048);
  private autoCorrelateBuf: Float32Array = new Float32Array(2048);

  private detectPitchLoop(callback: (pitchHz: number, volume: number) => void) {
    if (this.isPitchLoopRunning) return;
    this.isPitchLoopRunning = true;

    const loop = () => {
      if (!this.isListening || this.isPausedForPlayback || !this.analyser || !this.ctx) {
        this.isPitchLoopRunning = false;
        return;
      }

      const now = performance.now();
      // Throttle pitch analysis loop to ~30 FPS (every 33ms) on high-refresh 120Hz displays (like iPhone Pro)
      if (now - this.lastPitchDetectTime >= 33) {
        this.lastPitchDetectTime = now;

        if (this.timeDomainBuffer.length !== this.analyser.fftSize) {
          this.timeDomainBuffer = new Float32Array(this.analyser.fftSize);
        }
        this.analyser.getFloatTimeDomainData(this.timeDomainBuffer);

        // Calculate RMS volume
        let sum = 0;
        const len = this.timeDomainBuffer.length;
        for (let i = 0; i < len; i++) {
          const val = this.timeDomainBuffer[i];
          sum += val * val;
        }
        const rms = Math.sqrt(sum / len);

        // Autocorrelation pitch detection
        const pitch = this.autoCorrelate(this.timeDomainBuffer, this.ctx.sampleRate);

        callback(pitch, rms);
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  private autoCorrelate(buf: Float32Array, sampleRate: number): number {
    const SIZE = buf.length;
    let sumRms = 0;

    for (let i = 0; i < SIZE; i++) {
      const val = buf[i];
      sumRms += val * val;
    }
    const rms = Math.sqrt(sumRms / SIZE);
    if (rms < 0.01) return -1; // signal too weak

    // Trim weak edges without array slicing / allocation
    let r1 = 0, r2 = SIZE - 1;
    const thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buf[i]) < thres) { r1 = i; break; }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
    }

    const trimmedSize = r2 - r1;
    if (trimmedSize < 128) return -1;

    // Use preallocated buffer for autocorrelation values
    if (this.autoCorrelateBuf.length < trimmedSize) {
      this.autoCorrelateBuf = new Float32Array(trimmedSize);
    }
    const c = this.autoCorrelateBuf;
    c.fill(0, 0, trimmedSize);

    // Bound lag range to human vocal range: 50Hz to 1200Hz
    const minPeriod = Math.max(12, Math.floor(sampleRate / 1200));
    const maxPeriod = Math.min(trimmedSize - 1, Math.ceil(sampleRate / 50));

    for (let i = minPeriod; i <= maxPeriod; i++) {
      let sum = 0;
      const endJ = trimmedSize - i;
      for (let j = 0; j < endJ; j += 2) {
        sum += buf[r1 + j] * buf[r1 + j + i];
      }
      c[i] = sum * 2;
    }

    // Find peak correlation
    let maxval = -1, maxpos = -1;
    for (let i = minPeriod; i <= maxPeriod; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }

    if (maxpos < minPeriod || maxpos >= maxPeriod) return -1;

    let T0 = maxpos;
    const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);

    return sampleRate / T0;
  }

  // AMBIENT NATURE SOUND ENGINE (Web Audio API - 432 Hz Tuning)
  private ambientGain: GainNode | null = null;
  private ambientNoiseNode: AudioBufferSourceNode | null = null;
  private ambientOscillators: OscillatorNode[] = [];
  private padGainNodes: GainNode[] = [];
  private ambientLfo: OscillatorNode | null = null;
  private thunderTimer: any = null;
  private chordProgressionTimer: any = null;
  private currentChordIndex: number = 0;
  private isAmbientOn: boolean = false;

  /**
   * Calculates exact frequency in Hz relative to A4 = 432 Hz reference tuning
   * @param semitonesFromA4 semitone distance from A4 (0 = 432 Hz)
   */
  public getFreq432(semitonesFromA4: number): number {
    return Number((432 * Math.pow(2, semitonesFromA4 / 12)).toFixed(2));
  }

  /**
   * Synthesize soft distant thunder rumble ("rayos suaves")
   */
  public playSoftThunderSound() {
    if (!this.ctx || !this.isAmbientOn) return;
    try {
      const now = this.ctx.currentTime;
      // Lowpass filtered noise rumble for distant thunder
      const bufferSize = this.ctx.sampleRate * 2.5; // 2.5s thunder
      const noiseBuf = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuf.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.15;
      }

      const noiseSrc = this.ctx.createBufferSource();
      noiseSrc.buffer = noiseBuf;

      const thunderFilter = this.ctx.createBiquadFilter();
      thunderFilter.type = 'lowpass';
      thunderFilter.frequency.setValueAtTime(90, now);
      thunderFilter.frequency.exponentialRampToValueAtTime(40, now + 2.2);

      const thunderGain = this.ctx.createGain();
      thunderGain.gain.setValueAtTime(0.001, now);
      thunderGain.gain.linearRampToValueAtTime(0.12, now + 0.3); // soft swell
      thunderGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

      // Low sub-bass sine layer for thunder depth (43.2 Hz sub octave)
      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(43.2, now); // 43.2 Hz sub
      subOsc.frequency.exponentialRampToValueAtTime(32, now + 2.0);

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.linearRampToValueAtTime(0.15, now + 0.2);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

      noiseSrc.connect(thunderFilter);
      thunderFilter.connect(thunderGain);
      if (this.ambientGain) {
        thunderGain.connect(this.ambientGain);
        subGain.connect(this.ambientGain);
      } else {
        thunderGain.connect(this.ctx.destination);
        subGain.connect(this.ctx.destination);
      }

      subOsc.connect(subGain);

      noiseSrc.start(now);
      subOsc.start(now);
      noiseSrc.stop(now + 2.5);
      subOsc.stop(now + 2.5);
    } catch {
      // Ignore
    }
  }

  /**
   * Start synthesized ambient nature soundscape (gentle breeze/rain, soft thunder & 432 Hz meditative pads)
   */
  public startAmbientNatureSound() {
    if (this.isAmbientOn) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      this.isAmbientOn = true;

      // Master Ambient Gain Node
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.001, now);
      this.ambientGain.gain.linearRampToValueAtTime(0.20, now + 1.5); // smooth fade in
      this.ambientGain.connect(this.ctx.destination);

      // Synthesize Pink/Rain Noise using AudioBuffer
      const bufferSize = this.ctx.sampleRate * 4; // 4 seconds looped noise
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.025;
        b6 = white * 0.115926;
      }

      this.ambientNoiseNode = this.ctx.createBufferSource();
      this.ambientNoiseNode.buffer = noiseBuffer;
      this.ambientNoiseNode.loop = true;

      // Biquad Filter for soft rain / wind frequency sculpting
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380, now);

      // LFO modulation to simulate swaying breeze
      this.ambientLfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      this.ambientLfo.frequency.setValueAtTime(0.08, now); // slow 0.08 Hz cycle
      lfoGain.gain.setValueAtTime(120, now);

      this.ambientLfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      this.ambientNoiseNode.connect(filter);
      filter.connect(this.ambientGain);

      this.ambientNoiseNode.start(now);
      this.ambientLfo.start(now);

      // Sequenced 432 Hz Ambient Pad Chord Progression (Slow morph every 8.5 seconds)
      // Progressions defined in semitones relative to A4 (0 = 432 Hz reference fundamental)
      // Bright, high-register crystalline pads (A3 to E5) to avoid low sub-rumble
      const padProgressions = [
        // Chord 0: Am9 Crystalline (A3, E4, A4 @ 432Hz, C5, E5)
        { semitones: [-12, -5, 0, 3, 7], types: ['sine', 'sine', 'sine', 'sine', 'sine'] as OscillatorType[], gains: [0.05, 0.04, 0.06, 0.04, 0.03] },

        // Chord 1: Fmaj9 Celestial (C4, F4, A4 @ 432Hz, C5, E5)
        { semitones: [-9, -4, 0, 3, 7], types: ['sine', 'sine', 'sine', 'sine', 'sine'] as OscillatorType[], gains: [0.05, 0.04, 0.05, 0.04, 0.03] },

        // Chord 2: Cadd9 Luminous (G3, C4, E4, G4, D5)
        { semitones: [-14, -9, -5, -2, 5], types: ['sine', 'sine', 'sine', 'sine', 'sine'] as OscillatorType[], gains: [0.05, 0.04, 0.05, 0.04, 0.03] },

        // Chord 3: G6/9 Serenity (G3, B3, D4, G4, A4 @ 432Hz)
        { semitones: [-14, -10, -7, -2, 0], types: ['sine', 'sine', 'sine', 'sine', 'sine'] as OscillatorType[], gains: [0.05, 0.04, 0.04, 0.05, 0.05] }
      ];

      this.ambientOscillators = [];
      this.padGainNodes = [];
      this.currentChordIndex = 0;

      const initialChord = padProgressions[0];

      initialChord.semitones.forEach((semitones, idx) => {
        const osc = this.ctx!.createOscillator();
        const padGain = this.ctx!.createGain();

        osc.type = initialChord.types[idx];
        const initialFreq = this.getFreq432(semitones);
        osc.frequency.setValueAtTime(initialFreq, now);

        // Gentle detune for rich analog pad texture
        const detuneCents = (idx % 2 === 0 ? 1 : -1) * (2 + idx);
        osc.detune.setValueAtTime(detuneCents, now);

        // Slow swelling envelope
        padGain.gain.setValueAtTime(0.001, now);
        padGain.gain.linearRampToValueAtTime(initialChord.gains[idx], now + 2.5);

        osc.connect(padGain);
        padGain.connect(this.ambientGain!);

        osc.start(now);
        this.ambientOscillators.push(osc);
        this.padGainNodes.push(padGain);
      });

      // Slowly morph pad chord progression every 8.5 seconds with a smooth 4.2-second crossfade
      this.chordProgressionTimer = setInterval(() => {
        if (!this.isAmbientOn || !this.ctx) return;

        this.currentChordIndex = (this.currentChordIndex + 1) % padProgressions.length;
        const targetProgression = padProgressions[this.currentChordIndex];
        const morphNow = this.ctx.currentTime;
        const morphDuration = 4.2; // 4.2s slow smooth transition

        this.ambientOscillators.forEach((osc, idx) => {
          if (idx < targetProgression.semitones.length) {
            const targetFreq = this.getFreq432(targetProgression.semitones[idx]);
            const targetGain = targetProgression.gains[idx];

            // Smooth frequency ramp to new chord
            osc.frequency.cancelScheduledValues(morphNow);
            osc.frequency.setValueAtTime(osc.frequency.value, morphNow);
            osc.frequency.linearRampToValueAtTime(targetFreq, morphNow + morphDuration);

            // Gentle breathing gain swell during chord shift
            if (this.padGainNodes[idx]) {
              const pGain = this.padGainNodes[idx];
              pGain.gain.cancelScheduledValues(morphNow);
              pGain.gain.setValueAtTime(pGain.gain.value, morphNow);
              pGain.gain.linearRampToValueAtTime(targetGain * 0.7, morphNow + morphDuration * 0.4);
              pGain.gain.linearRampToValueAtTime(targetGain, morphNow + morphDuration);
            }
          }
        });
      }, 8500);

      // Trigger first soft thunder rumble after 3 seconds, then periodically every 14s
      setTimeout(() => {
        if (this.isAmbientOn) this.playSoftThunderSound();
      }, 3000);

      this.thunderTimer = setInterval(() => {
        if (this.isAmbientOn) {
          this.playSoftThunderSound();
        }
      }, 14000);

    } catch (e) {
      console.warn('Failed to start ambient nature sound:', e);
      this.isAmbientOn = false;
    }
  }

  /**
   * Stop synthesized ambient nature soundscape
   */
  public stopAmbientNatureSound() {
    if (!this.isAmbientOn && !this.ambientGain) return;
    try {
      this.isAmbientOn = false;
      if (this.thunderTimer) {
        clearInterval(this.thunderTimer);
        this.thunderTimer = null;
      }
      if (this.chordProgressionTimer) {
        clearInterval(this.chordProgressionTimer);
        this.chordProgressionTimer = null;
      }
      if (this.ctx && this.ambientGain) {
        const now = this.ctx.currentTime;
        this.ambientGain.gain.linearRampToValueAtTime(0.0001, now + 1.0); // smooth 1s fade out

        setTimeout(() => {
          try {
            if (this.ambientNoiseNode) {
              this.ambientNoiseNode.stop();
              this.ambientNoiseNode.disconnect();
              this.ambientNoiseNode = null;
            }
            if (this.ambientLfo) {
              this.ambientLfo.stop();
              this.ambientLfo.disconnect();
              this.ambientLfo = null;
            }
            this.ambientOscillators.forEach((osc) => {
              try {
                osc.stop();
                osc.disconnect();
              } catch {
                // Ignore
              }
            });
            this.ambientOscillators = [];
            this.padGainNodes.forEach((pg) => {
              try {
                pg.disconnect();
              } catch {
                // Ignore
              }
            });
            this.padGainNodes = [];
            if (this.ambientGain) {
              this.ambientGain.disconnect();
              this.ambientGain = null;
            }
          } catch {
            // Ignore cleanup errors
          }
        }, 1100);
      }
    } catch {
      this.isAmbientOn = false;
    }
  }

  public isAmbientNaturePlaying(): boolean {
    return this.isAmbientOn;
  }

  public playOrbChargeSound() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 1.5);
      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 1.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 1.5);
    } catch {
      // Ignore
    }
  }

  public playOrbShatterSound() {
    this.vibrate([60, 80, 100]);
    try {
      this.initCtx();
      if (!this.ctx) return;
      // Sub-bass impact
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.8);
      gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.8);
    } catch {
      // Ignore
    }
  }

  public playXpTickSound() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Ignore
    }
  }

  public playUnitVictoryFanfare() {
    this.vibrate([40, 60, 40, 80, 120]);
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.2, this.ctx!.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.12 + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + idx * 0.12);
        osc.stop(this.ctx!.currentTime + idx * 0.12 + 0.4);
      });
    } catch {
      // Ignore
    }
  }

  public playRubberStretchSound(level: number = 1) {
    this.vibrate(level === 3 ? [60, 80, 120] : [30, 40]);
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const duration = level === 1 ? 0.35 : level === 2 ? 0.55 : 0.9;
      const startFreq = level === 1 ? 140 : level === 2 ? 200 : 260;
      const endFreq = level === 1 ? 380 : level === 2 ? 650 : 1150;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

      if (level === 3) {
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(25, now);
        lfoGain.gain.setValueAtTime(15, now);
        lfo.connect(osc.frequency);
        lfo.start(now);
        lfo.stop(now + duration);
      }

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(level === 3 ? 0.35 : 0.25, now + duration * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Ignore
    }
  }

  public playDryCrackSound(level: number = 1) {
    this.vibrate(level === 3 ? [40, 60, 80, 120] : level === 2 ? [30, 50, 70] : [25, 40]);
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const duration = level === 1 ? 0.09 : level === 2 ? 0.16 : 0.28;

      // 1. Dry snap noise burst (wood/root cracking snap)
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(level === 1 ? 2400 : level === 2 ? 1800 : 1200, now);
      filter.Q.setValueAtTime(level === 3 ? 3.5 : 2.5, now);

      const noiseGain = this.ctx.createGain();
      const vol = level === 1 ? 0.3 : level === 2 ? 0.5 : 0.75;
      noiseGain.gain.setValueAtTime(vol, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noiseSource.start(now);

      // 2. Tonal impact snap layer (rapid pitch drop for sharp dry crack)
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(level === 1 ? 950 : level === 2 ? 750 : 550, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + duration * 0.8);

      oscGain.gain.setValueAtTime(vol * 0.6, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.8);

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Ignore
    }
  }

  public playRubberStrainOverloadSound() {
    this.vibrate([30, 40, 50, 70, 90, 120]);
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const pitches = [400, 550, 720, 950];
      pitches.forEach((startFreq, idx) => {
        const offset = idx * 0.08;
        const dur = 0.09;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(startFreq, now + offset);
        osc.frequency.exponentialRampToValueAtTime(startFreq * 1.5, now + offset + dur);

        gain.gain.setValueAtTime(0.25, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + dur);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + offset);
        osc.stop(now + offset + dur);
      });
    } catch {
      // Ignore
    }
  }

  public playDryExplosionPopSound(level: number = 3) {
    this.vibrate(level === 3 ? [80, 100, 140, 180, 240] : level === 2 ? [50, 70, 90] : [40, 60]);
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Number of pops based on level: level 1 = 1 pop, level 2 = 3 pops, level 3 = 6 pops (muy fuerte)
      const popOffsets = level === 1 
        ? [0] 
        : level === 2 
        ? [0, 0.09, 0.18] 
        : [0, 0.06, 0.12, 0.18, 0.25, 0.33];

      const popPitches = [1600, 1300, 1900, 1100, 1750, 1400];
      const masterVol = level === 3 ? 1.0 : level === 2 ? 0.75 : 0.55;

      popOffsets.forEach((offset, idx) => {
        const t = now + offset;
        const dur = level === 3 ? 0.22 : 0.16;
        const bufferSize = Math.floor(this.ctx!.sampleRate * dur);
        const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
        }

        const noise = this.ctx!.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx!.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(popPitches[idx % popPitches.length], t);
        filter.Q.setValueAtTime(3.2, t);

        const gain = this.ctx!.createGain();
        gain.gain.setValueAtTime(masterVol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx!.destination);
        noise.start(t);

        // Sub impact on each pop (deeper for level 3)
        const osc = this.ctx!.createOscillator();
        const oscGain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(level === 3 ? 160 + idx * 10 : 130, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + dur);
        oscGain.gain.setValueAtTime(masterVol * 0.8, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(oscGain);
        oscGain.connect(this.ctx!.destination);
        osc.start(t);
        osc.stop(t + dur);
      });
    } catch {
      // Ignore
    }
  }

  public playWindWhooshSound() {
    this.vibrate([40, 60]);
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const duration = 0.95;

      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(200, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + duration * 0.45);
      filter.frequency.exponentialRampToValueAtTime(150, now + duration);
      filter.Q.setValueAtTime(1.8, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.exponentialRampToValueAtTime(0.65, now + duration * 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + duration);
    } catch {
      // Ignore
    }
  }

  /**
   * Sound of liquid / water filling a container smoothly from left to right.
   * Sweeps resonant acoustic frequency upwards from 280Hz to 820Hz with gentle bubbly pops.
   */
  public playWaterFillSound(durationSeconds: number = 1.8) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const dur = durationSeconds;

      // 1. Rising liquid stream: acoustic noise filtered through sweeping bandpass resonance
      const bufferSize = Math.floor(this.ctx.sampleRate * dur);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(280, now);
      bandpass.frequency.exponentialRampToValueAtTime(820, now + dur);
      bandpass.Q.setValueAtTime(4.2, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.24, now + 0.12);
      gain.gain.setValueAtTime(0.24, now + dur - 0.12);
      gain.gain.linearRampToValueAtTime(0.001, now + dur);

      noise.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + dur);

      // 2. Liquid bubble pops popping at rising frequencies
      const bubbleCount = 8;
      for (let i = 0; i < bubbleCount; i++) {
        const bubbleTime = now + (i / bubbleCount) * dur * 0.92 + 0.05;
        const bubbleFreq = 380 + i * 55 + (Math.random() * 40 - 20);
        const osc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(bubbleFreq, bubbleTime);
        osc.frequency.exponentialRampToValueAtTime(bubbleFreq * 1.35, bubbleTime + 0.04);
        bGain.gain.setValueAtTime(0.14, bubbleTime);
        bGain.gain.exponentialRampToValueAtTime(0.001, bubbleTime + 0.045);
        osc.connect(bGain);
        bGain.connect(this.ctx.destination);
        osc.start(bubbleTime);
        osc.stop(bubbleTime + 0.045);
      }
    } catch {
      // Ignore
    }
  }

  public playUnitUnlockSound() {
    this.vibrate([50, 70, 100, 160]);
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 1. Mechanical padlock snap
      const snapOsc = this.ctx.createOscillator();
      const snapGain = this.ctx.createGain();
      snapOsc.type = 'triangle';
      snapOsc.frequency.setValueAtTime(1800, now);
      snapOsc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
      snapGain.gain.setValueAtTime(0.7, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      snapOsc.connect(snapGain);
      snapGain.connect(this.ctx.destination);
      snapOsc.start(now);
      snapOsc.stop(now + 0.08);

      // 2. Triumphant rising arpeggio (C5, E5, G5, C6)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const t = now + 0.12 + idx * 0.11;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(t);
        osc.stop(t + 0.5);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Play crystal-clear resonant victory bell / success chime when the first node illuminates
   * Features metallic strike transient, warm harmonic partials (C6, E6, G6, C7), and a 1.6s shimmering decay.
   */
  public playSuccessBellSound = () => {
    this.vibrate([40, 90, 150]);
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 1. Initial metallic bell strike transient
      const strikeOsc = this.ctx.createOscillator();
      const strikeGain = this.ctx.createGain();
      strikeOsc.type = 'triangle';
      strikeOsc.frequency.setValueAtTime(3200, now);
      strikeOsc.frequency.exponentialRampToValueAtTime(1600, now + 0.04);
      strikeGain.gain.setValueAtTime(0.28, now);
      strikeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      strikeOsc.connect(strikeGain);
      strikeGain.connect(this.ctx.destination);
      strikeOsc.start(now);
      strikeOsc.stop(now + 0.04);

      // 2. Resonant Bell Harmonics (Warm, celebratory, crystal-clear chime)
      const partials = [
        { freq: 1046.50, gain: 0.40, decay: 1.6 }, // C6 Fundamental Chime
        { freq: 1318.51, gain: 0.28, decay: 1.4 }, // E6 Major third sweetness
        { freq: 1567.98, gain: 0.24, decay: 1.2 }, // G6 Perfect fifth warmth
        { freq: 2093.00, gain: 0.16, decay: 0.9 }, // C7 Crystal shimmer
        { freq: 3135.96, gain: 0.08, decay: 0.6 }  // G7 Sparkle
      ];

      partials.forEach(({ freq, gain, decay }) => {
        const osc = this.ctx!.createOscillator();
        const g = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(gain, now + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, now + decay);

        osc.connect(g);
        g.connect(this.ctx!.destination);

        osc.start(now);
        osc.stop(now + decay);
      });
    } catch {
      // Ignore
    }
  };
}

export const audioService = new AudioService();
if (typeof window !== 'undefined') {
  (window as any).audioService = audioService;
}

// Standalone function export for guaranteed Turbopack HMR binding and resilient execution
export const playSuccessBellSound = () => {
  if (typeof audioService.playSuccessBellSound === 'function') {
    audioService.playSuccessBellSound();
  }
};

