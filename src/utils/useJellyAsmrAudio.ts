'use client';

import {useCallback, useEffect, useRef} from 'react';

export type CharacterId = 'morado' | 'fucsia' | 'amarillo' | 'naranja';

interface CharacterAcousticProfile {
  subFreq: number;
  noiseFilterFreq: number;
  noiseFilterType: BiquadFilterType;
  dropletStartFreq: number;
  dropletEndFreq: number;
}

const ACOUSTIC_PROFILES: Record<CharacterId, CharacterAcousticProfile> = {
  morado: {
    subFreq: 72,
    noiseFilterFreq: 380,
    noiseFilterType: 'lowpass',
    dropletStartFreq: 260,
    dropletEndFreq: 460,
  },
  fucsia: {
    subFreq: 95,
    noiseFilterFreq: 720,
    noiseFilterType: 'bandpass',
    dropletStartFreq: 420,
    dropletEndFreq: 720,
  },
  amarillo: {
    subFreq: 122,
    noiseFilterFreq: 1050,
    noiseFilterType: 'bandpass',
    dropletStartFreq: 520,
    dropletEndFreq: 910,
  },
  naranja: {
    subFreq: 84,
    noiseFilterFreq: 490,
    noiseFilterType: 'lowpass',
    dropletStartFreq: 310,
    dropletEndFreq: 540,
  },
};

interface BubbleProfile {
  startFreq: number;
  endFreq: number;
  noiseFilterFreq: number;
  vol: number;
}

const BUBBLE_PROFILES: Record<CharacterId, BubbleProfile> = {
  morado: {
    startFreq: 260,
    endFreq: 390,
    noiseFilterFreq: 750,
    vol: 0.12,
  },
  fucsia: {
    startFreq: 370,
    endFreq: 550,
    noiseFilterFreq: 1100,
    vol: 0.13,
  },
  amarillo: {
    startFreq: 520,
    endFreq: 780,
    noiseFilterFreq: 1500,
    vol: 0.11,
  },
  naranja: {
    startFreq: 310,
    endFreq: 470,
    noiseFilterFreq: 900,
    vol: 0.13,
  },
};

export interface UseJellyAsmrAudioReturn {
  getAudioContext: () => AudioContext | null;
  playSquish: (character: CharacterId, intensity?: number, stretch?: number) => void;
  playDroplet: (character: CharacterId, pitchMultiplier?: number) => void;
  playBubbleHop: (character: CharacterId, hopNumber?: number) => void;
  playWinkPop: () => void;
  playValidationChime: () => void;
  playHappyHop: () => void;
  playSlideTransition: () => void;
}

let globalAudioCtx: AudioContext | null = null;

function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!globalAudioCtx) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as {webkitAudioContext: typeof AudioContext})
        .webkitAudioContext;
    if (!AudioCtx) return null;
    globalAudioCtx = new AudioCtx();
  }
  if (globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume().catch(() => {});
  }
  return globalAudioCtx;
}

// Desbloqueo pasivo global inmediato en la fase de captura (antes de cualquier stopPropagation)
if (typeof window !== 'undefined') {
  const globalUnlock = () => {
    if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume().catch(() => {});
    } else if (!globalAudioCtx) {
      getSharedAudioContext();
    }
  };
  ['pointerdown', 'touchstart', 'mousedown', 'keydown'].forEach((evt) => {
    window.addEventListener(evt, globalUnlock, {capture: true, passive: true});
  });
}

/**
 * Motor de Audio ASMR Procedural de Alta Fidelidad (Web Audio API)
 * Disena texturas tactiles acusticas organicas (impacto fisico de silicona/gel,
 * resonancia de cavidad de agua Minnaert, campana acustica armonica), eliminando
 * totalmente cualquier sonido electronico o de sintetizador artificial.
 */
export function useJellyAsmrAudio(): UseJellyAsmrAudioReturn {
  const pinkNoiseBufferRef = useRef<AudioBuffer | null>(null);

  const getAudioContext = useCallback(() => {
    return getSharedAudioContext();
  }, []);

  const getPinkNoiseBuffer = useCallback((ctx: AudioContext): AudioBuffer => {
    if (pinkNoiseBufferRef.current) return pinkNoiseBufferRef.current;
    const sampleRate = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < sampleRate; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    pinkNoiseBufferRef.current = buffer;
    return buffer;
  }, []);

  /**
   * Impacto fisico de compresion tactil (gel suave / silicona / malvavisco)
   * Combina transiente de friccion fisica (ruido rosa) + amortiguamiento sub-acustico.
   */
  const playSquish = useCallback(
    (character: CharacterId, intensity = 1, stretch = 0) => {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const profile = ACOUSTIC_PROFILES[character];
        const clampedIntensity = Math.max(0.4, Math.min(intensity, 2));
        const stretchShift = Math.max(-0.3, Math.min(stretch, 0.8));

        // 1. Transiente acustico de contacto en la piel del blob (~14ms de ruido rosa)
        const noiseBuf = getPinkNoiseBuffer(ctx);
        const noiseSrc = ctx.createBufferSource();
        noiseSrc.buffer = noiseBuf;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = profile.noiseFilterType;
        noiseFilter.frequency.setValueAtTime(
          profile.noiseFilterFreq * (1 + stretchShift * 0.25),
          now
        );
        noiseFilter.Q.setValueAtTime(2.2, now);

        const noiseGain = ctx.createGain();
        const noisePeak = 0.055 * clampedIntensity;
        noiseGain.gain.setValueAtTime(0.0001, now);
        noiseGain.gain.linearRampToValueAtTime(noisePeak, now + 0.002);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.016);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        noiseSrc.start(now);
        noiseSrc.stop(now + 0.022);

        // 2. Resonancia fisica corporal: onda pura amortiguada (sin componentes aserradas)
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'sine';

        const baseF = profile.subFreq * (1 + stretchShift * 0.3);
        osc.frequency.setValueAtTime(baseF, now);
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(38, baseF * 0.76),
          now + 0.065
        );

        const oscPeak = 0.15 * clampedIntensity;
        oscGain.gain.setValueAtTime(0.0001, now);
        oscGain.gain.linearRampToValueAtTime(oscPeak, now + 0.005);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);

        osc.connect(oscGain);
        oscGain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.085);
      } catch {}
    },
    [getAudioContext, getPinkNoiseBuffer]
  );

  /**
   * Gota de agua organica (Minnaert bubble resonance)
   * Al cerrar la cavidad de fluido, la frecuencia asciende con extrema rapidez
   * creando el autentico "plop / bloop" de agua liquida real.
   */
  const playDroplet = useCallback(
    (character: CharacterId, pitchMultiplier = 1) => {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const profile = ACOUSTIC_PROFILES[character];
        const mult = Math.max(0.75, Math.min(pitchMultiplier, 1.4));

        const startF = profile.dropletStartFreq * mult;
        const endF = profile.dropletEndFreq * mult;
        const dur = 0.052;

        // 1. Oscilador de cavidad liquida
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';

        osc.frequency.setValueAtTime(startF, now);
        osc.frequency.exponentialRampToValueAtTime(endF, now + 0.015);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.16, now + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + dur + 0.01);

        // 2. Segundo armonico calido que anade profundidad acustica al agua
        const harmOsc = ctx.createOscillator();
        const harmGain = ctx.createGain();
        harmOsc.type = 'sine';
        harmOsc.frequency.setValueAtTime(startF * 2, now);
        harmOsc.frequency.exponentialRampToValueAtTime(endF * 2, now + 0.015);

        harmGain.gain.setValueAtTime(0.0001, now);
        harmGain.gain.linearRampToValueAtTime(0.035, now + 0.003);
        harmGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.032);

        harmOsc.connect(harmGain);
        harmGain.connect(ctx.destination);
        harmOsc.start(now);
        harmOsc.stop(now + 0.036);
      } catch {}
    },
    [getAudioContext]
  );

  /**
   * Campanilla acustica cristalina de celesta / caja de musica
   * Armonicos inarmonicos naturales que suenan calidos, lujosos y relajantes.
   */
  const playValidationChime = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Dos notas armonicas: E5 (659.25Hz) seguida de B5 (987.77Hz)
      const notes = [
        {f: 659.25, time: now, dur: 0.6},
        {f: 987.77, time: now + 0.075, dur: 0.75},
      ];

      notes.forEach(({f, time, dur}) => {
        // Fundamental
        const osc1 = ctx.createOscillator();
        const g1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(f, time);

        g1.gain.setValueAtTime(0.0001, time);
        g1.gain.linearRampToValueAtTime(0.07, time + 0.006);
        g1.gain.exponentialRampToValueAtTime(0.0001, time + dur);

        osc1.connect(g1);
        g1.connect(ctx.destination);
        osc1.start(time);
        osc1.stop(time + dur + 0.02);

        // Armonico metalico sutil (brillo acustico de campana)
        const osc2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(f * 2.76, time);

        g2.gain.setValueAtTime(0.0001, time);
        g2.gain.linearRampToValueAtTime(0.012, time + 0.004);
        g2.gain.exponentialRampToValueAtTime(0.0001, time + dur * 0.4);

        osc2.connect(g2);
        g2.connect(ctx.destination);
        osc2.start(time);
        osc2.stop(time + dur * 0.45);
      });
    } catch {}
  }, [getAudioContext]);

  /**
   * Secuencia acustica de saltar de felicidad
   * Tres rebotes fluidos y alegres de burbujas en escala ascendente.
   */
  const playHappyHop = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const hops = [
        {startF: 390, endF: 640, time: now, vol: 0.09},
        {startF: 480, endF: 800, time: now + 0.08, vol: 0.11},
        {startF: 340, endF: 560, time: now + 0.16, vol: 0.08},
      ];

      hops.forEach(({startF, endF, time, vol}) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(startF, time);
        osc.frequency.exponentialRampToValueAtTime(endF, time + 0.018);

        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(vol, time + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.055);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.065);
      });
    } catch {}
  }, [getAudioContext]);

  /**
   * Pop sutil de burbuja de jabon
   */
  const playWinkPop = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(960, now + 0.014);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.048);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.055);
    } catch {}
  }, [getAudioContext]);

  /**
   * Salto con sonido de burbuja jugosa y pop de gelatina organica (Enfoque 2)
   * Sintesis procedural Minnaert con chirp ascendente rapido (18ms), amortiguamiento
   * elastico y micro-transiente de friccion fisica (ruido rosa filtrado).
   * Micro-afinacion segun el numero de salto:
   * 1: Tono ligeramente mas profundo (0.92x)
   * 2: Tono medio jugoso (1.00x)
   * 3: Pop mas redondo y brillante (1.10x)
   */
  const playBubbleHop = useCallback(
    (character: CharacterId, hopNumber = 1) => {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const profile = BUBBLE_PROFILES[character];
        if (!profile) return;

        const hopMultiplier =
          hopNumber === 1 ? 0.92 : hopNumber === 3 ? 1.10 : 1.0;

        const startF = profile.startFreq * hopMultiplier;
        const endF = profile.endFreq * hopMultiplier;
        const dur = 0.058;

        // 1. Transiente de impacto jugoso (3ms - 4ms de ruido rosa filtrado por paso bajo)
        const noiseBuf = getPinkNoiseBuffer(ctx);
        const noiseSrc = ctx.createBufferSource();
        noiseSrc.buffer = noiseBuf;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(profile.noiseFilterFreq, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.0001, now);
        noiseGain.gain.linearRampToValueAtTime(0.038 * (profile.vol / 0.12), now + 0.0015);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        noiseSrc.start(now);
        noiseSrc.stop(now + 0.016);

        // 2. Cavidad de fluido Minnaert: chirp ascendente rapido y curva exponencial amortiguada
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'sine';

        osc.frequency.setValueAtTime(startF, now);
        osc.frequency.exponentialRampToValueAtTime(endF, now + 0.018);
        osc.frequency.exponentialRampToValueAtTime(Math.max(80, endF * 0.92), now + dur);

        const peakVol = profile.vol;
        oscGain.gain.setValueAtTime(0.0001, now);
        oscGain.gain.linearRampToValueAtTime(peakVol, now + 0.003);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

        osc.connect(oscGain);
        oscGain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + dur + 0.01);

        // 3. Armonico superior calido (brillo de gelatina liquida / pop)
        const harmOsc = ctx.createOscillator();
        const harmGain = ctx.createGain();
        harmOsc.type = 'sine';

        harmOsc.frequency.setValueAtTime(startF * 1.88, now);
        harmOsc.frequency.exponentialRampToValueAtTime(endF * 1.88, now + 0.016);

        harmGain.gain.setValueAtTime(0.0001, now);
        harmGain.gain.linearRampToValueAtTime(peakVol * 0.22, now + 0.002);
        harmGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.032);

        harmOsc.connect(harmGain);
        harmGain.connect(ctx.destination);

        harmOsc.start(now);
        harmOsc.stop(now + 0.036);
      } catch {}
    },
    [getAudioContext, getPinkNoiseBuffer]
  );

  /**
   * Micro-deslizamiento acustico suave para la transicion de registro
   */
  const playSlideTransition = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const dur = 0.26;

      const noiseBuf = getPinkNoiseBuffer(ctx);
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1100, now);
      filter.frequency.exponentialRampToValueAtTime(360, now + dur);
      filter.Q.setValueAtTime(1.8, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.045, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      noiseSrc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noiseSrc.start(now);
      noiseSrc.stop(now + dur + 0.02);
    } catch {}
  }, [getAudioContext, getPinkNoiseBuffer]);

  return {
    getAudioContext,
    playSquish,
    playDroplet,
    playBubbleHop,
    playWinkPop,
    playValidationChime,
    playHappyHop,
    playSlideTransition,
  };
}
