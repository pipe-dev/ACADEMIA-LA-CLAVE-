'use client';

import {useCallback, useRef} from 'react';

export type CharacterId = 'morado' | 'fucsia' | 'amarillo' | 'naranja';

const CHARACTER_PROFILES: Record<
  CharacterId,
  {baseFreq: number; filterQ: number; decay: number}
> = {
  morado: {baseFreq: 180, filterQ: 4.5, decay: 0.16},
  fucsia: {baseFreq: 520, filterQ: 3.2, decay: 0.12},
  amarillo: {baseFreq: 400, filterQ: 3.8, decay: 0.14},
  naranja: {baseFreq: 220, filterQ: 4.0, decay: 0.15},
};

export interface UseJellyAsmrAudioReturn {
  playSquish: (character: CharacterId, intensity?: number, stretch?: number) => void;
  playDroplet: (character: CharacterId, pitchMultiplier?: number) => void;
  playWinkPop: () => void;
  playValidationChime: () => void;
}

export function useJellyAsmrAudio(): UseJellyAsmrAudioReturn {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as {webkitAudioContext: typeof AudioContext})
          .webkitAudioContext;
      if (!AudioCtx) return null;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  const playSquish = useCallback(
    (character: CharacterId, intensity = 1, stretch = 0) => {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const profile = CHARACTER_PROFILES[character];
        const clampedIntensity = Math.max(0.2, Math.min(intensity, 2.5));
        const stretchBonus = Math.max(-0.4, Math.min(stretch, 1.2));

        // 1. Oscilador principal en barrido descendente
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'triangle';

        const startFreq = profile.baseFreq * (1 + stretchBonus * 0.4);
        const endFreq = Math.max(60, startFreq * 0.45);
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(
          endFreq,
          now + profile.decay * 0.9
        );

        // 2. Filtro paso-bajo resonante simulando viscosidad
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.setValueAtTime(profile.filterQ, now);
        filter.frequency.setValueAtTime(1400 * clampedIntensity, now);
        filter.frequency.exponentialRampToValueAtTime(
          200,
          now + profile.decay
        );

        // 3. Envolvente de volumen orgánico
        const peakGain = 0.18 * Math.min(clampedIntensity, 1.5);
        oscGain.gain.setValueAtTime(0.001, now);
        oscGain.gain.linearRampToValueAtTime(peakGain, now + 0.02);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + profile.decay);

        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + profile.decay + 0.05);

        setTimeout(() => {
          try {
            osc.disconnect();
            filter.disconnect();
            oscGain.disconnect();
          } catch {}
        }, (profile.decay + 0.1) * 1000);
      } catch {}
    },
    [getAudioContext]
  );

  const playDroplet = useCallback(
    (character: CharacterId, pitchMultiplier = 1) => {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const profile = CHARACTER_PROFILES[character];
        const dur = 0.07;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';

        const startF = profile.baseFreq * 2.2 * pitchMultiplier;
        const endF = Math.max(90, startF * 0.28);
        osc.frequency.setValueAtTime(startF, now);
        osc.frequency.exponentialRampToValueAtTime(endF, now + dur);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.14, now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + dur + 0.02);

        setTimeout(() => {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch {}
        }, (dur + 0.05) * 1000);
      } catch {}
    },
    [getAudioContext]
  );

  const playWinkPop = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.05);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {}
  }, [getAudioContext]);

  const playValidationChime = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const chords = [523.25, 659.25, 783.99]; // Acorde mayor C5 - E5 - G5 líquido
      chords.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const delay = idx * 0.04;
        const dur = 0.18;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * 0.9, now + delay);
        osc.frequency.exponentialRampToValueAtTime(freq, now + delay + 0.03);

        gain.gain.setValueAtTime(0.0001, now + delay);
        gain.gain.linearRampToValueAtTime(0.07, now + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + dur + 0.02);
      });
    } catch {}
  }, [getAudioContext]);

  return {
    playSquish,
    playDroplet,
    playWinkPop,
    playValidationChime,
  };
}
