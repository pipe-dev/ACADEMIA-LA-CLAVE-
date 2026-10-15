// src/components/unit2-celebration/glassAudio.ts

import { audioService } from '../../utils/audioService';

// Synthesizes a high-impact acoustic glass fracture and crystalline ringing sound
export const playGlassShatterSound = () => {
  try {
    const ctx = audioService.getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    // 1. Initial Explosive Fracture Transient (Filtered High-Pass Noise Burst)
    const bufferSize = Math.floor(ctx.sampleRate * 0.16);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.03));
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const hpFilter = ctx.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.setValueAtTime(3200, now);
    hpFilter.frequency.exponentialRampToValueAtTime(1600, now + 0.14);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.75, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    noiseSource.connect(hpFilter);
    hpFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSource.start(now);

    // 2. High-Q Crystalline Shimmering Ringing Overtones (Micro-fragments chiming)
    const harmonicPings = [3600, 4920, 6400, 8150, 9800, 11600, 13200];
    harmonicPings.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';

      const jitter = (Math.random() - 0.5) * 180;
      osc.frequency.setValueAtTime(freq + jitter, now);
      osc.frequency.exponentialRampToValueAtTime((freq + jitter) * 0.85, now + 0.65);

      const delay = Math.random() * 0.035;
      const duration = 0.22 + Math.random() * 0.45;
      const initialVol = 0.045 + Math.random() * 0.05;

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.setValueAtTime(initialVol, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + duration + 0.05);
    });
  } catch (err) {
    console.warn('Glass shatter audio error:', err);
  }
};

// Synthesizes a high-resonance crystal wine glass acoustic chime (E7 / 2637 Hz)
export const playCrystalChime = () => {
  try {
    const ctx = audioService.getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    // Fundamental crystal tone (E7 ~ 2637 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2637, now);
    osc1.frequency.exponentialRampToValueAtTime(2632, now + 1.8);
    gain1.gain.setValueAtTime(0.28, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    // Harmonic overtone (octave: 5274 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(5274, now);
    gain2.gain.setValueAtTime(0.08, now);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

    // High crystalline sparkle (7911 Hz)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(7911, now);
    gain3.gain.setValueAtTime(0.03, now);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    osc1.connect(gain1);
    osc2.connect(gain2);
    osc3.connect(gain3);
    gain1.connect(ctx.destination);
    gain2.connect(ctx.destination);
    gain3.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    osc1.stop(now + 1.8);
    osc2.stop(now + 0.9);
    osc3.stop(now + 0.4);
  } catch (err) {
    console.warn('Crystal chime audio error:', err);
  }
};

// Synthesizes a realistic physical crystal glass floor landing sound
export const playGlassLandingSound = () => {
  try {
    const ctx = audioService.getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    // 1. Transient floor contact knock
    const oscThump = ctx.createOscillator();
    const gainThump = ctx.createGain();
    oscThump.type = 'triangle';
    oscThump.frequency.setValueAtTime(170, now);
    oscThump.frequency.exponentialRampToValueAtTime(42, now + 0.09);
    gainThump.gain.setValueAtTime(0.38, now);
    gainThump.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    oscThump.connect(gainThump);
    gainThump.connect(ctx.destination);
    oscThump.start(now);
    oscThump.stop(now + 0.12);

    // 2. Crystal acoustic ring from impact (fundamental resonance E7 ~ 2637 Hz)
    const oscRing1 = ctx.createOscillator();
    const gainRing1 = ctx.createGain();
    oscRing1.type = 'sine';
    oscRing1.frequency.setValueAtTime(2637, now);
    oscRing1.frequency.exponentialRampToValueAtTime(2630, now + 1.4);
    gainRing1.gain.setValueAtTime(0.30, now);
    gainRing1.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
    oscRing1.connect(gainRing1);
    gainRing1.connect(ctx.destination);
    oscRing1.start(now);
    oscRing1.stop(now + 1.4);

    // 3. Harmonic overtone (octave 5274 Hz)
    const oscRing2 = ctx.createOscillator();
    const gainRing2 = ctx.createGain();
    oscRing2.type = 'sine';
    oscRing2.frequency.setValueAtTime(5274, now);
    gainRing2.gain.setValueAtTime(0.09, now);
    gainRing2.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    oscRing2.connect(gainRing2);
    gainRing2.connect(ctx.destination);
    oscRing2.start(now);
    oscRing2.stop(now + 0.7);

    // 4. Secondary crystalline chime (B7 ~ 3951 Hz)
    const oscRing3 = ctx.createOscillator();
    const gainRing3 = ctx.createGain();
    oscRing3.type = 'sine';
    oscRing3.frequency.setValueAtTime(3951, now);
    gainRing3.gain.setValueAtTime(0.05, now);
    gainRing3.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    oscRing3.connect(gainRing3);
    gainRing3.connect(ctx.destination);
    oscRing3.start(now);
    oscRing3.stop(now + 0.4);
  } catch (err) {
    console.warn('Glass landing sound error:', err);
  }
};
