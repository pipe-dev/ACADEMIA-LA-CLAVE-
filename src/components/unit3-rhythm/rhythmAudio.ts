import { audioService } from '../../utils/audioService';

let audioCtx: AudioContext | null = null;
let isMuted = false;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  audioService.unlockForMobileSilentMode();
  const shared = audioService.getAudioContext();
  if (shared) return shared;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function setRhythmAudioMuted(muted: boolean) {
  isMuted = muted;
}

// Punchy, deep acoustic bass drum
export function playBassDrum(isAccent = false) {
  if (isMuted) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(isAccent ? 140 : 110, now);
  osc.frequency.exponentialRampToValueAtTime(38, now + 0.14);

  gain.gain.setValueAtTime(isAccent ? 0.75 : 0.55, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

  // Soft membrane thud transient
  const bufferSize = Math.floor(ctx.sampleRate * 0.03);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.008));
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(400, now);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.3, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(now);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.17);
}

// Sparkling crystal/splash percussive chime on slicing a purple sphere
export function playSphereSlice(step = 1) {
  if (isMuted) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Base harmonic frequencies for steps 1, 2, 3
  const freqs = [880, 1108.73, 1318.51]; // A5, C#6, E6
  const f = freqs[(step - 1) % freqs.length] || 880;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(f, now);
  osc.frequency.exponentialRampToValueAtTime(f * 0.95, now + 0.18);

  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  // Shimmer overtone
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(f * 2, now);
  gain2.gain.setValueAtTime(0.18, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);

  osc.start(now);
  osc2.start(now);
  osc.stop(now + 0.21);
  osc2.stop(now + 0.21);
}

// Rapid 4-stroke drum roll buildup before beat 4
export function playDrumRollBuildup() {
  if (isMuted) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const subBeats = [0, 0.08, 0.16, 0.24];
  subBeats.forEach((delay, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120 + idx * 25, now + delay);
    osc.frequency.exponentialRampToValueAtTime(50, now + delay + 0.06);

    gain.gain.setValueAtTime(0.25 + idx * 0.12, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.065);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + delay);
    osc.stop(now + delay + 0.07);
  });
}

// Explosive crash cymbal & triumphant chord on slicing golden sphere
export function playGoldenCrashFanfare() {
  if (isMuted) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Crash cymbal noise
  const duration = 1.6;
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.45));
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const hpFilter = ctx.createBiquadFilter();
  hpFilter.type = 'highpass';
  hpFilter.frequency.setValueAtTime(3200, now);
  hpFilter.frequency.exponentialRampToValueAtTime(1400, now + 0.8);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.5, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  noise.connect(hpFilter);
  hpFilter.connect(gain);
  gain.connect(ctx.destination);
  noise.start(now);

  // Ascending golden triad: D4, F#4, A4, D5
  const notes = [293.66, 369.99, 440.0, 587.33];
  notes.forEach((freq, idx) => {
    const delay = idx * 0.09;
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + delay);

    noteGain.gain.setValueAtTime(0.0001, now + delay);
    noteGain.gain.linearRampToValueAtTime(0.28, now + delay + 0.04);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 1.2);

    osc.connect(noteGain);
    noteGain.connect(ctx.destination);
    osc.start(now + delay);
    osc.stop(now + delay + 1.25);
  });
}

// Metallic katana / saber swoosh cut (noise band-sweep + inharmonic metal "shing")
export function playBladeSwoosh(intensity = 1) {
  if (isMuted) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const duration = 0.5;

  // 1. Air swoosh body: filtered noise with a fast upward bandpass sweep, then decay
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.12));
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 1.4;
  bp.frequency.setValueAtTime(900, now);
  bp.frequency.exponentialRampToValueAtTime(6500, now + 0.16);
  bp.frequency.exponentialRampToValueAtTime(1200, now + duration);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.0001, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.55 * intensity, now + 0.05);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  noise.connect(bp);
  bp.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(now);
  noise.stop(now + duration + 0.02);

  // 2. Metallic "shing": inharmonic partials of a struck metal bar (saber edge)
  const overtones = [1, 2.76, 5.4, 8.9];
  const base = 420;
  overtones.forEach((ratio, idx) => {
    const osc = ctx.createOscillator();
    const og = ctx.createGain();
    osc.type = 'triangle';
    const freq = base * ratio;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.98, now + 0.2);

    const amp = (0.11 / (idx + 1)) * intensity;
    og.gain.setValueAtTime(amp, now);
    og.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc.connect(og);
    og.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  });
}

// Muted dull thud when ball bounces without being sliced
export function playDullBounce() {
  if (isMuted) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(80, now);
  osc.frequency.exponentialRampToValueAtTime(35, now + 0.08);

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.09);
}
