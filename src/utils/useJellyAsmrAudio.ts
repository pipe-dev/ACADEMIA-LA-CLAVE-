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

interface CartoonSqueakProfile {
  startFreq: number;
  peakFreq: number;
  endFreq: number;
  filterFreq: number;
  vol: number;
}

const CARTOON_SQUEAK_PROFILES: Record<CharacterId, CartoonSqueakProfile> = {
  morado: {
    startFreq: 220,
    peakFreq: 340,
    endFreq: 270,
    filterFreq: 1800,
    vol: 0.12,
  },
  fucsia: {
    startFreq: 340,
    peakFreq: 520,
    endFreq: 420,
    filterFreq: 2400,
    vol: 0.11,
  },
  amarillo: {
    startFreq: 480,
    peakFreq: 740,
    endFreq: 600,
    filterFreq: 2900,
    vol: 0.10,
  },
  naranja: {
    startFreq: 280,
    peakFreq: 420,
    endFreq: 330,
    filterFreq: 2100,
    vol: 0.11,
  },
};

interface CartoonBoingProfile {
  baseFreq: number;
  wobbleFreq: number;
  duration: number;
  vol: number;
}

const CARTOON_BOING_PROFILES: Record<CharacterId, CartoonBoingProfile> = {
  morado: {
    baseFreq: 118,
    wobbleFreq: 12,
    duration: 0.38,
    vol: 0.16,
  },
  fucsia: {
    baseFreq: 185,
    wobbleFreq: 15,
    duration: 0.32,
    vol: 0.14,
  },
  amarillo: {
    baseFreq: 275,
    wobbleFreq: 19,
    duration: 0.28,
    vol: 0.13,
  },
  naranja: {
    baseFreq: 150,
    wobbleFreq: 13.5,
    duration: 0.34,
    vol: 0.15,
  },
};

export interface UseJellyAsmrAudioReturn {
  getAudioContext: () => AudioContext | null;
  playCartoonSqueak: (character: CharacterId, volumeMultiplier?: number) => void;
  playCartoonStretch: (character: CharacterId, stretchProgress?: number) => void;
  playCartoonBoing: (character: CharacterId, intensity?: number) => void;
  playSquish: (character: CharacterId, intensity?: number, stretch?: number) => void;
  playDroplet: (character: CharacterId, pitchMultiplier?: number) => void;
  playBubbleHop: (character: CharacterId, hopNumber?: number) => void;
  playWinkPop: () => void;
  playValidationChime: () => void;
  playHappyHop: () => void;
  playSlideTransition: () => void;
  playErrorGlitch: () => void;
}

let globalAudioCtx: AudioContext | null = null;
let silentAudioEl: HTMLAudioElement | null = null;
let mediaStreamAudioEl: HTMLAudioElement | null = null;

// Audio inaudible de 1 muestra (WAV válido ultra-ligero)
const SILENT_WAV_BASE64 =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

let isAsmrSilentUnlocked = false;

/**
 * Activa la categoría 'Playback' a nivel de sistema operativo en iOS Safari y Android.
 * Esto anula el interruptor físico de silencio / Focus Mode / No Molestar en celulares,
 * garantizando que los sonidos se reproduzcan siempre a través de los altavoces multimedia.
 * Solo emite un pulso único al inicio y no mantiene elementos de audio en reproducción
 * para no activar la Dynamic Island en iOS ni la notificación multimedia en Android.
 */
function activatePlaybackCategory(ctx?: AudioContext | null) {
  if (typeof window === 'undefined') return;
  try {
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

    if (isAsmrSilentUnlocked) {
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      return;
    }
    isAsmrSilentUnlocked = true;

    if (!silentAudioEl) {
      silentAudioEl = document.createElement('audio');
      silentAudioEl.src = SILENT_WAV_BASE64;
      silentAudioEl.loop = false;
      silentAudioEl.volume = 0.001;
      silentAudioEl.setAttribute('playsinline', 'true');
      silentAudioEl.setAttribute('webkit-playsinline', 'true');
      silentAudioEl.style.position = 'fixed';
      silentAudioEl.style.pointerEvents = 'none';
      silentAudioEl.style.opacity = '0';
      silentAudioEl.style.width = '1px';
      silentAudioEl.style.height = '1px';
      silentAudioEl.style.bottom = '0';
      document.body?.appendChild(silentAudioEl);
    }
    silentAudioEl.play()
      .then(() => {
        setTimeout(() => {
          try {
            if (silentAudioEl) {
              silentAudioEl.pause();
              silentAudioEl.currentTime = 0;
              silentAudioEl.remove();
              silentAudioEl = null;
            }
            if ('mediaSession' in navigator) {
              navigator.mediaSession.playbackState = 'none';
            }
          } catch {}
        }, 80);
      })
      .catch(() => {});

    // Detener cualquier mediaStreamAudio previo para evitar que el sistema muestre reproductor activo
    if (mediaStreamAudioEl) {
      try {
        mediaStreamAudioEl.pause();
        mediaStreamAudioEl.srcObject = null;
        mediaStreamAudioEl.remove();
        mediaStreamAudioEl = null;
      } catch {}
    }
  } catch {}
}

function unlockWebAudio(ctx: AudioContext) {
  try {
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch {}
}

export function getSharedAudioContext(): AudioContext | null {
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
  activatePlaybackCategory(globalAudioCtx);
  unlockWebAudio(globalAudioCtx);
  return globalAudioCtx;
}

export function runWithAudioContext(callback: (ctx: AudioContext) => void) {
  const ctx = getSharedAudioContext();
  if (!ctx) return;
  if (ctx.state === 'running') {
    try {
      callback(ctx);
    } catch {}
  } else {
    ctx.resume().then(() => {
      try {
        if (ctx.state === 'running') {
          callback(ctx);
        }
      } catch {}
    }).catch(() => {});
  }
}

// Desbloqueo y activación inmediata en cualquier interacción física del usuario
if (typeof window !== 'undefined') {
  const forceAudioActive = () => {
    const ctx = getSharedAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    activatePlaybackCategory(ctx);
  };

  ['pointerdown', 'touchstart', 'mousedown', 'keydown', 'click'].forEach((evt) => {
    window.addEventListener(evt, forceAudioActive, {capture: true, passive: true});
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      forceAudioActive();
    }
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
      runWithAudioContext((ctx) => {
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
      });
    },
    [getPinkNoiseBuffer]
  );

  /**
   * Gota de agua organica (Minnaert bubble resonance)
   * Al cerrar la cavidad de fluido, la frecuencia asciende con extrema rapidez
   * creando el autentico "plop / bloop" de agua liquida real.
   */
  const playDroplet = useCallback(
    (character: CharacterId, pitchMultiplier = 1) => {
      runWithAudioContext((ctx) => {
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
      });
    },
    []
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
   * Tres saltitos de alegria (3 rebotes fluidos y alegres de burbujas en escala ascendente).
   */
  const playHappyHop = useCallback(() => {
    runWithAudioContext((ctx) => {
      const now = ctx.currentTime;

      // 3 saltitos de alegria coordinados con cada rebote fisico
      const hops = [
        { startF: 390, endF: 680, time: now, vol: 0.11, dur: 0.065 },
        { startF: 490, endF: 820, time: now + 0.23, vol: 0.13, dur: 0.065 },
        { startF: 590, endF: 960, time: now + 0.46, vol: 0.12, dur: 0.070 },
      ];

      hops.forEach(({ startF, endF, time, vol, dur }) => {
        // 1. Oscilador principal de burbuja alegre Minnaert
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(startF, time);
        osc.frequency.exponentialRampToValueAtTime(endF, time + 0.018);
        osc.frequency.exponentialRampToValueAtTime(Math.max(80, endF * 0.94), time + dur);

        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(vol, time + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + dur + 0.01);

        // 2. Micro-armonico superior calido para dar textura jugosa de pop
        const harmOsc = ctx.createOscillator();
        const harmGain = ctx.createGain();
        harmOsc.type = 'sine';
        harmOsc.frequency.setValueAtTime(startF * 1.85, time);
        harmOsc.frequency.exponentialRampToValueAtTime(endF * 1.85, time + 0.016);

        harmGain.gain.setValueAtTime(0.0001, time);
        harmGain.gain.linearRampToValueAtTime(vol * 0.28, time + 0.002);
        harmGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);

        harmOsc.connect(harmGain);
        harmGain.connect(ctx.destination);
        harmOsc.start(time);
        harmOsc.stop(time + 0.04);
      });
    });
  }, []);

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

  /**
   * Squeak tierno y esponjoso de muñeco de goma caricaturesco (Al presionar / tocar)
   */
  const playCartoonSqueak = useCallback(
    (character: CharacterId, volumeMultiplier = 1) => {
      runWithAudioContext((ctx) => {
        const now = ctx.currentTime;
        const profile = CARTOON_SQUEAK_PROFILES[character];
        if (!profile) return;

        const dur = 0.054;
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        // Onda triangular para cuerpo redondeado de goma inflable
        osc.type = 'triangle';

        // Inflexión de tono caricaturesco (salto alegre y suave asentamiento)
        osc.frequency.setValueAtTime(profile.startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(profile.peakFreq, now + 0.016);
        osc.frequency.exponentialRampToValueAtTime(profile.endFreq, now + dur);

        // Filtro pasa-bajos cálido para suavizar bordes digitales
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(profile.filterFreq, now);

        const peakVol = profile.vol * Math.max(0.4, Math.min(1.5, volumeMultiplier));
        oscGain.gain.setValueAtTime(0.0001, now);
        oscGain.gain.linearRampToValueAtTime(peakVol, now + 0.003);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + dur + 0.01);
      });
    },
    []
  );

  /**
   * Sonido caricaturesco de estiramiento elástico (Mientras se arrastra / estira hacia arriba)
   * Tensión cómica de goma que sube de tono elásticamente según la distancia
   */
  const playCartoonStretch = useCallback(
    (character: CharacterId, stretchProgress = 0.5) => {
      runWithAudioContext((ctx) => {
        const now = ctx.currentTime;
        const profile = CARTOON_SQUEAK_PROFILES[character];
        if (!profile) return;

        const dur = 0.058;
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle';

        // Tono ascendente elástico que sube marcadamente a medida que se estira más
        // stretchProgress crece con la distancia (0.4 -> 3.5+) permitiendo agudos comicos continuos
        const mult = 1 + Math.pow(Math.max(0.1, stretchProgress), 1.12) * 0.88;
        const startF = profile.startFreq * mult;
        const endF = profile.peakFreq * mult * 1.08;

        osc.frequency.setValueAtTime(startF, now);
        osc.frequency.exponentialRampToValueAtTime(endF, now + dur);

        filter.type = 'lowpass';
        // Ampliamos el filtro armónico para que los tonos más agudos brillen con claridad
        const maxFilter = Math.min(8500, profile.filterFreq * (1 + (mult - 1) * 0.72));
        filter.frequency.setValueAtTime(maxFilter, now);

        // Volumen suave y graduado para mantener el feedback comico sin saturacion
        const vol = Math.min(0.15, profile.vol * (0.75 + Math.min(1.5, mult - 1) * 0.15));
        oscGain.gain.setValueAtTime(0.0001, now);
        oscGain.gain.linearRampToValueAtTime(vol, now + 0.005);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + dur + 0.01);
      });
    },
    []
  );

  /**
   * Boing elástico oscilante con vibrato de resorte de gelatina (Al estirar y soltar)
   * Escala dinámicamente con la intensidad y distancia de estiramiento
   */
  const playCartoonBoing = useCallback(
    (character: CharacterId, intensity = 1) => {
      runWithAudioContext((ctx) => {
        const now = ctx.currentTime;
        const profile = CARTOON_BOING_PROFILES[character];
        if (!profile) return;

        const clampedIntensity = Math.max(0.35, Math.min(1.6, intensity));
        // Escala el tono y duración según la distancia del estiramiento
        const baseF = profile.baseFreq * (1 + (clampedIntensity - 1) * 0.22);
        const dur = profile.duration * Math.min(1.35, 0.82 + clampedIntensity * 0.28);
        const peakVol = profile.vol * Math.min(1.3, 0.72 + clampedIntensity * 0.38);

        // 1. Oscilador portador (Carrier) con tono de resorte de goma
        const carrier = ctx.createOscillator();
        const carrierGain = ctx.createGain();
        carrier.type = 'sine';

        // 2. Modulador LFO para el bamboleo cómico elástico (Wobble)
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(profile.wobbleFreq, now);

        // Amplitud de modulación elástica (decae suavemente hacia el final)
        const initialWobbleDepth = baseF * 0.36 * Math.min(1.3, clampedIntensity);
        lfoGain.gain.setValueAtTime(initialWobbleDepth, now);
        lfoGain.gain.exponentialRampToValueAtTime(1.0, now + dur);

        lfo.connect(lfoGain);
        lfoGain.connect(carrier.frequency);

        // Trayectoria de tono: salto cómico hacia arriba y caída oscilante
        carrier.frequency.setValueAtTime(baseF * 0.85, now);
        carrier.frequency.exponentialRampToValueAtTime(baseF * 1.25, now + 0.024);
        carrier.frequency.exponentialRampToValueAtTime(baseF, now + dur);

        // Envolvente de volumen del boing
        carrierGain.gain.setValueAtTime(0.0001, now);
        carrierGain.gain.linearRampToValueAtTime(peakVol, now + 0.004);
        carrierGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

        carrier.connect(carrierGain);
        carrierGain.connect(ctx.destination);

        // 3. Golpe táctil sutil de liberación de goma (sub-plop)
        const plop = ctx.createOscillator();
        const plopGain = ctx.createGain();
        plop.type = 'triangle';
        plop.frequency.setValueAtTime(baseF * 1.5, now);
        plop.frequency.exponentialRampToValueAtTime(baseF * 0.6, now + 0.022);

        plopGain.gain.setValueAtTime(0.0001, now);
        plopGain.gain.linearRampToValueAtTime(peakVol * 0.42, now + 0.002);
        plopGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.026);

        plop.connect(plopGain);
        plopGain.connect(ctx.destination);

        // Iniciar osciladores
        lfo.start(now);
        carrier.start(now);
        plop.start(now);

        const stopTime = now + dur + 0.02;
        lfo.stop(stopTime);
        carrier.stop(stopTime);
        plop.stop(now + 0.035);
      });
    },
    []
  );

  /**
   * Sonido caricaturesco de Error / Glitch (Al introducir contraseña errónea)
   * Combina un micro-glitch digital/analógico tartamudo (3 pulsos rápidos con textura de estática)
   * seguido de un zumbido disonante caricaturesco descendente ("bzz-zk / uh-oh").
   */
  const playErrorGlitch = useCallback(() => {
    runWithAudioContext((ctx) => {
      const now = ctx.currentTime;

      // 1. Micro-glitch digital inicial: 3 pulsos rápidos de frecuencias disonantes
      const glitchSteps = [
        { freq: 440, dur: 0.026, time: now, type: 'sawtooth' as OscillatorType, vol: 0.09 },
        { freq: 580, dur: 0.024, time: now + 0.028, type: 'square' as OscillatorType, vol: 0.07 },
        { freq: 290, dur: 0.035, time: now + 0.054, type: 'sawtooth' as OscillatorType, vol: 0.10 },
      ];

      glitchSteps.forEach(({ freq, dur, time, type, vol }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);

        // Filtro de banda para efecto de bitcrush / altavoz de radio retro
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1600, time);
        filter.Q.setValueAtTime(3.0, time);

        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(vol, time + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + dur + 0.01);
      });

      // 2. Transiente sutil de estática / glitch bitcrush (ruido rosa filtrado a alta frecuencia)
      const noiseBuf = getPinkNoiseBuffer(ctx);
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuf;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(2600, now);
      noiseFilter.Q.setValueAtTime(4.5, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.0001, now);
      noiseGain.gain.linearRampToValueAtTime(0.045, now + 0.004);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);

      noiseSrc.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noiseSrc.start(now);
      noiseSrc.stop(now + 0.075);

      // 3. Tono disonante cómico de error ("uh-oh" / descenso elástico gomoso)
      const buzzTime = now + 0.065;
      const buzzDur = 0.22;

      // Dos osciladores con intervalo de segunda menor produciendo batimiento caricaturesco
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const buzzGain = ctx.createGain();
      const buzzFilter = ctx.createBiquadFilter();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      // Caída cómica de tono (glissando descendente de decepción)
      osc1.frequency.setValueAtTime(195, buzzTime);
      osc1.frequency.exponentialRampToValueAtTime(115, buzzTime + buzzDur);

      osc2.frequency.setValueAtTime(208, buzzTime);
      osc2.frequency.exponentialRampToValueAtTime(122, buzzTime + buzzDur);

      buzzFilter.type = 'lowpass';
      buzzFilter.frequency.setValueAtTime(950, buzzTime);
      buzzFilter.frequency.exponentialRampToValueAtTime(450, buzzTime + buzzDur);

      buzzGain.gain.setValueAtTime(0.0001, buzzTime);
      buzzGain.gain.linearRampToValueAtTime(0.12, buzzTime + 0.008);
      buzzGain.gain.exponentialRampToValueAtTime(0.0001, buzzTime + buzzDur);

      osc1.connect(buzzFilter);
      osc2.connect(buzzFilter);
      buzzFilter.connect(buzzGain);
      buzzGain.connect(ctx.destination);

      osc1.start(buzzTime);
      osc2.start(buzzTime);
      osc1.stop(buzzTime + buzzDur + 0.02);
      osc2.stop(buzzTime + buzzDur + 0.02);
    });
  }, [getPinkNoiseBuffer]);

  return {
    getAudioContext,
    playCartoonSqueak,
    playCartoonStretch,
    playCartoonBoing,
    playSquish,
    playDroplet,
    playBubbleHop,
    playWinkPop,
    playValidationChime,
    playHappyHop,
    playSlideTransition,
    playErrorGlitch,
  };
}
