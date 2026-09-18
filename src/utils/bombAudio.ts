// src/utils/bombAudio.ts

let audioCtx: AudioContext | null = null;
let isMuted = false;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
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

export function setBombAudioMuted(muted: boolean) {
  isMuted = muted;
}

export function getBombAudioMuted(): boolean {
  return isMuted;
}

export function playTickSound(isUrgent = false) {
  if (isMuted) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(isUrgent ? 1200 : 800, now);
  osc.frequency.exponentialRampToValueAtTime(isUrgent ? 600 : 300, now + 0.035);

  gain.gain.setValueAtTime(isUrgent ? 0.25 : 0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.04);
}

export function playSwooshSound() {
  if (isMuted) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const bufferSize = Math.floor(ctx.sampleRate * 0.09);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(800, now);
  filter.frequency.exponentialRampToValueAtTime(2400, now + 0.08);
  filter.Q.setValueAtTime(3.0, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start(now);
}

export function playSnipRelaySound() {
  if (isMuted) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Sharp relay snap
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(110, now + 0.045);

  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  // Metallic click transient
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(2400, now);
  osc2.frequency.exponentialRampToValueAtTime(600, now + 0.025);
  gain2.gain.setValueAtTime(0.35, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);

  osc.start(now);
  osc2.start(now);
  osc.stop(now + 0.05);
  osc2.stop(now + 0.05);
}

export function playCircuitBuzzSound() {
  if (isMuted) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(75, now);
  osc.frequency.linearRampToValueAtTime(68, now + 0.18);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1400, now);

  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.19);
}

export function playPneumaticReleaseSound() {
  if (isMuted) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Mechanical clack
  const osc = ctx.createOscillator();
  const clackGain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);
  clackGain.gain.setValueAtTime(0.5, now);
  clackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  osc.connect(clackGain);
  clackGain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.09);

  // Steam hiss (filtered noise)
  const duration = 1.1;
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.4));
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2800, now);
  filter.frequency.exponentialRampToValueAtTime(350, now + duration);

  const steamGain = ctx.createGain();
  steamGain.gain.setValueAtTime(0.38, now);
  steamGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  noise.connect(filter);
  filter.connect(steamGain);
  steamGain.connect(ctx.destination);
  noise.start(now);
}

export function playVictoryFanfare() {
  if (isMuted) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Arpeggiated golden chord: D4 (293.66), F#4 (369.99), A4 (440.0), D5 (587.33)
  const notes = [
    { freq: 293.66, delay: 0.0, dur: 0.8 },
    { freq: 369.99, delay: 0.12, dur: 0.8 },
    { freq: 440.0, delay: 0.24, dur: 0.9 },
    { freq: 587.33, delay: 0.36, dur: 1.4 },
  ];

  notes.forEach(({ freq, delay, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + delay);

    gain.gain.setValueAtTime(0.0001, now + delay);
    gain.gain.linearRampToValueAtTime(0.22, now + delay + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);

    // Subtle overtone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, now + delay);
    gain2.gain.setValueAtTime(0.0001, now + delay);
    gain2.gain.linearRampToValueAtTime(0.08, now + delay + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur * 0.7);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc.start(now + delay);
    osc2.start(now + delay);
    osc.stop(now + delay + dur + 0.05);
    osc2.stop(now + delay + dur + 0.05);
  });
}

export function playTimeoutPuffSound() {
  if (isMuted) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(170, now);
  osc.frequency.exponentialRampToValueAtTime(35, now + 0.32);

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.33);
}
