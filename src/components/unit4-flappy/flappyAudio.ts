// src/components/unit4-flappy/flappyAudio.ts
// Sintetiza TODO el paisaje sonoro del Flappy de Unit 4 con Web Audio API.
// Sin archivos de audio: 100% osciladores + ruido filtrado (mismo patrón que
// audioService / glassAudio / rhythmAudio del proyecto).
//
// Dos paletas de diseño: "dopamínico" = recompensas con pitch que ESCALA con
// la racha (escala pentatónica ascendente + ching cada 5 puntos) y un payoff
// enorme al ganar; "ASMR" = whooshes de aire, pops húmedos, crujidos filtrados
// y un ambiente suave de cielo.

import { audioService } from '../../utils/audioService';

// ---------------------------------------------------------------- master chain

let muted = false;
let master: GainNode | null = null;
let comp: DynamicsCompressorNode | null = null;
let outGain: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let ambient: {
  src: AudioBufferSourceNode;
  src2: AudioBufferSourceNode;
  lfo: OscillatorNode;
  lfoGain: GainNode;
  filter: BiquadFilterNode;
  g: GainNode;
} | null = null;

/**
 * Devuelve { ctx, out } con una cadena maestra optimizada y de ultrabaja latencia:
 * fuentes -> master -> outGain -> destination.
 * Eliminamos el compresor pesado en móviles de gama baja para evitar retardos
 * de procesamiento y cortes de buffer en Android/iOS.
 */
const graph = () => {
  const ctx = audioService.getAudioContext();
  if (!ctx) return null;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  if (!master || master.context !== ctx) {
    noiseBuf = null;
    outGain = ctx.createGain();
    outGain.gain.value = 1.9;
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(outGain);
    outGain.connect(ctx.destination);
  }
  if (muted && master) master.gain.value = 0;
  return { ctx, out: master as GainNode };
};

/** Desbloqueo directo en primer gesto táctil para Safari iOS y Chrome Android */
export const unlockFlappyAudio = () => {
  const ctx = audioService.getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
};

/** Buffer de ruido blanco optimizado y reutilizable (0.5s, ultraligero en RAM). */
const getNoise = (ctx: AudioContext) => {
  if (!noiseBuf) {
    const len = Math.floor(ctx.sampleRate * 0.5);
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf as AudioBuffer;
};

/** Capa de ruido blanco con filtro swept: la base de todos los whoosh/pops. */
const noiseLayer = (
  g: ReturnType<typeof graph>,
  opts: {
    type?: BiquadFilterType;
    f0: number;
    f1: number;
    dur: number;
    vol: number;
    q?: number;
    attack?: number;
    pan?: number;
  }
) => {
  if (!g) return;
  const { ctx, out } = g;
  const src = ctx.createBufferSource();
  src.buffer = getNoise(ctx);
  src.loop = true;
  const filt = ctx.createBiquadFilter();
  filt.type = opts.type || 'bandpass';
  filt.Q.value = opts.q ?? 1.1;
  const atk = opts.attack ?? 0.006;
  filt.frequency.setValueAtTime(opts.f0, ctx.currentTime);
  filt.frequency.exponentialRampToValueAtTime(
    Math.max(40, opts.f1),
    ctx.currentTime + opts.dur
  );
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(opts.vol, ctx.currentTime + atk);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + opts.dur);
  src.connect(filt);
  let tail: AudioNode = filt;
  if (opts.pan !== undefined && (ctx as any).createStereoPanner) {
    const p = ctx.createStereoPanner();
    p.pan.value = opts.pan;
    filt.connect(p);
    tail = p;
  }
  tail.connect(gain);
  gain.connect(out);
  src.start();
  src.stop(ctx.currentTime + opts.dur + 0.05);
};

/** Capa tonal: oscilador con envolvente ADSR simplificada y barrido de pitch. */
const toneLayer = (
  g: ReturnType<typeof graph>,
  opts: {
    type?: OscillatorType;
    f0: number;
    f1?: number;
    dur: number;
    vol: number;
    at?: number; // attack
    delay?: number;
    glide?: 'exp' | 'lin';
  }
) => {
  if (!g) return;
  const { ctx, out } = g;
  const t0 = ctx.currentTime + (opts.delay ?? 0);
  const osc = ctx.createOscillator();
  osc.type = opts.type || 'sine';
  osc.frequency.setValueAtTime(opts.f0, t0);
  if (opts.f1 !== undefined) {
    if (opts.glide === 'lin') {
      osc.frequency.linearRampToValueAtTime(opts.f1, t0 + opts.dur);
    } else {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, opts.f1),
        t0 + opts.dur
      );
    }
  }
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(opts.vol, t0 + (opts.at ?? 0.005));
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
  osc.connect(gain);
  gain.connect(out);
  osc.start(t0);
  osc.stop(t0 + opts.dur + 0.05);
};

/** Escalas para las recompensas: pentatónica (puntos) y mayor (victoria). */
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26];
const C5 = 523.25;
const semi = (base: number, n: number) => base * Math.pow(2, n / 12);

/** Jitter aleatorio para que ninguna repetición suene idéntica (grainy/ASMR). */
const jitter = (amt: number) => 1 + (Math.random() - 0.5) * 2 * amt;

// ------------------------------------------------------------------- silencio

export const setFlappyAudioMuted = (v: boolean) => {
  muted = v;
  const g = graph();
  if (g && master) {
    master.gain.cancelScheduledValues(g.ctx.currentTime);
    master.gain.setTargetAtTime(v ? 0 : 1, g.ctx.currentTime, 0.05);
  }
  if (v) stopFlappyAmbient();
};

export const isFlappyAudioMuted = () => muted;

// ------------------------------------------------------------------ gameplay

let flapSide = 1;

/**
 * Aleteo del pato (cuando SUBE): SOLO el whoosh de aire, sin ningún otro
 * sonido encima. Ataque rápido = golpe de ala y barrido ascendente. El paneo
 * alterna izquierda/derecha para sentirse como las dos alas batiendo, y la
 * altura sube un poco con el score -> el flap "acelera" contigo.
 */
export const playFlapSound = (score = 0) => {
  if (muted) return;
  const g = graph();
  if (!g) return;
  const heat = Math.min(1, score / 25);
  const k = jitter(0.06) * (1 + heat * 0.2);
  const side = (flapSide = -flapSide);
  // SOLO el whoosh del aleteo, sin acompañamiento.
  noiseLayer(g, {
    f0: 560 * k,
    f1: 3400 * k,
    dur: 0.2,
    vol: 0.6,
    q: 1.15,
    attack: 0.008,
    pan: side * 0.32,
  });
};

/**
 * Punto scored: la nota SUBE por la pentatónica según la racha y cada 5
 * puntos suma un "ching" de brillo + vibración. Es el motor dopamínico.
 */
export const playPointSound = (streak: number) => {
  if (muted) return;
  const g = graph();
  if (!g) return;
  const idx = Math.min(PENTA.length - 1, Math.max(0, streak));
  const f = semi(C5, PENTA[idx]) * jitter(0.012);
  toneLayer(g, { type: 'triangle', f0: f, dur: 0.26, vol: 0.14 });
  toneLayer(g, {
    type: 'sine',
    f0: f * 2,
    dur: 0.16,
    vol: 0.07,
    delay: 0.012,
  });
  if (streak > 0 && streak % 5 === 0) {
    // ching de cada 5: glissando corto + brillo agudo
    toneLayer(g, { type: 'sine', f0: f, f1: f * 1.5, dur: 0.12, vol: 0.08 });
    noiseLayer(g, { f0: 5200, f1: 8200, dur: 0.3, vol: 0.026, q: 2.2 });
    audioService.vibrate(10);
  } else {
    audioService.vibrate(6);
  }
};

/** Ignición de racha cada PROGRESS_EVERY: sub que sube + arpegio mayor. */
export const playStreakIgniteSound = (tier = 1) => {
  if (muted) return;
  const g = graph();
  if (!g) return;
  const root = semi(C5, Math.min(12, (tier - 1) * 3));
  toneLayer(g, { type: 'sawtooth', f0: 110, f1: 440, dur: 0.5, vol: 0.05 });
  [0, 4, 7, 12].forEach((n, i) =>
    toneLayer(g, {
      type: 'triangle',
      f0: semi(root, n),
      dur: 0.34,
      vol: 0.07,
      delay: i * 0.045,
    })
  );
  noiseLayer(g, { f0: 300, f1: 5000, dur: 0.42, vol: 0.03, q: 0.8 });
  audioService.vibrate([12, 30, 18]);
};

/** Rozamiento: pasó raspando. Whoosh paneado (el "ohhh" de casi-chocar). */
export const playNearMissSound = (side: -1 | 1 = 1) => {
  if (muted) return;
  const g = graph();
  if (!g) return;
  noiseLayer(g, {
    f0: 2600,
    f1: 380,
    dur: 0.24,
    vol: 0.07,
    q: 1.4,
    pan: side * 0.7,
  });
  audioService.vibrate(8);
};

/** Chocaste contra un tubo: squelch húmedo + golpe grave (ASMR pop). */
export const playPipeHitSound = () => {
  if (muted) return;
  const g = graph();
  if (!g) return;
  noiseLayer(g, { type: 'lowpass', f0: 1900, f1: 260, dur: 0.24, vol: 0.16, q: 0.7 });
  noiseLayer(g, { type: 'highpass', f0: 2400, f1: 5200, dur: 0.05, vol: 0.05 });
  toneLayer(g, { type: 'triangle', f0: 210, f1: 62, dur: 0.3, vol: 0.2 });
  audioService.vibrate([45, 40, 60]);
};

/** Impacto contra el pasto: golpe apagado y blando. */
export const playFloorHitSound = () => {
  if (muted) return;
  const g = graph();
  if (!g) return;
  toneLayer(g, { type: 'sine', f0: 165, f1: 44, dur: 0.2, vol: 0.19 });
  noiseLayer(g, { type: 'lowpass', f0: 700, f1: 180, dur: 0.16, vol: 0.09 });
  audioService.vibrate(35);
};

/** Muerte: "womp" descendente con filtro que se cierra ( tristemente suave). */
export const playDeathSound = () => {
  if (muted) return;
  const g = graph();
  if (!g) return;
  toneLayer(g, {
    type: 'sawtooth',
    f0: 330,
    f1: 74,
    dur: 0.62,
    vol: 0.075,
    glide: 'exp',
  });
  toneLayer(g, { type: 'sine', f0: 165, f1: 41, dur: 0.55, vol: 0.1 });
  noiseLayer(g, { type: 'lowpass', f0: 1200, f1: 200, dur: 0.5, vol: 0.05 });
};

/** Récord superado: arpegio agudo de destello. */
export const playRecordSound = () => {
  if (muted) return;
  const g = graph();
  if (!g) return;
  [12, 16, 19, 24].forEach((n, i) =>
    toneLayer(g, {
      type: 'sine',
      f0: semi(C5, n),
      dur: 0.3,
      vol: 0.075,
      delay: i * 0.06,
    })
  );
  noiseLayer(g, { f0: 6000, f1: 9500, dur: 0.4, vol: 0.02, q: 2.4 });
  audioService.vibrate([14, 34, 22, 40]);
};

/** Empezar partida: barrido de aire ascendente + díada brillante. */
export const playStartSound = () => {
  if (muted) return;
  const g = graph();
  if (!g) return;
  noiseLayer(g, { f0: 280, f1: 3200, dur: 0.36, vol: 0.06, q: 0.8 });
  toneLayer(g, { type: 'sine', f0: C5, dur: 0.2, vol: 0.085 });
  toneLayer(g, { type: 'sine', f0: semi(C5, 4), dur: 0.24, vol: 0.075, delay: 0.05 });
  audioService.vibrate(16);
};

// -------------------------------------------------------------------- meta

/** La tubería dorada aparece: anticipación brillante + sub que infla. */
export const playGoldenPipeAppearSound = () => {
  if (muted) return;
  const g = graph();
  if (!g) return;
  noiseLayer(g, { f0: 400, f1: 7000, dur: 0.85, vol: 0.035, q: 0.7 });
  toneLayer(g, { type: 'sawtooth', f0: 70, f1: 165, dur: 0.85, vol: 0.05 });
  [0, 4, 7, 11, 12].forEach((n, i) =>
    toneLayer(g, {
      type: 'sine',
      f0: semi(C5, n),
      dur: 0.7 - i * 0.06,
      vol: 0.06,
      delay: i * 0.08,
    })
  );
  audioService.vibrate([18, 40, 30]);
};

/** El meteorito cae: silbido Doppler descendente + rugido que crece. */
export const playMeteorFallSound = () => {
  if (muted) return;
  const g = graph();
  if (!g) return;
  toneLayer(g, {
    type: 'sawtooth',
    f0: 1900,
    f1: 300,
    dur: 0.75,
    vol: 0.05,
    glide: 'exp',
  });
  toneLayer(g, { type: 'sine', f0: 58, f1: 96, dur: 0.75, vol: 0.11 });
  noiseLayer(g, { type: 'lowpass', f0: 400, f1: 2200, dur: 0.7, vol: 0.05 });
  audioService.vibrate(20);
};

/** Impacto del meteorito: BOOM + escombros + cola metálica. El clímax. */
export const playMeteorImpactSound = () => {
  if (muted) return;
  const g = graph();
  if (!g) return;
  toneLayer(g, { type: 'sine', f0: 130, f1: 26, dur: 0.75, vol: 0.26 });
  toneLayer(g, { type: 'triangle', f0: 78, f1: 30, dur: 0.5, vol: 0.15 });
  noiseLayer(g, { type: 'lowpass', f0: 2800, f1: 120, dur: 0.55, vol: 0.19, q: 0.6 });
  noiseLayer(g, { type: 'highpass', f0: 1800, f1: 5200, dur: 0.1, vol: 0.07 });
  // esquirlas doradas
  for (let i = 0; i < 5; i++) {
    toneLayer(g, {
      type: 'sine',
      f0: semi(C5, PENTA[Math.floor(Math.random() * PENTA.length)]) * jitter(0.2),
      dur: 0.12,
      vol: 0.035,
      delay: 0.02 + Math.random() * 0.18,
    });
  }
  audioService.vibrate([70, 50, 90]);
};

/** La copa dorada emerge: campanas pentatónicas beating + brillo. */
export const playTrophyRiseSound = () => {
  if (muted) return;
  const g = graph();
  if (!g) return;
  [0, 2, 4, 7, 9, 12].forEach((n, i) => {
    const f = semi(C5, n + 12);
    toneLayer(g, { type: 'sine', f0: f, dur: 0.85, vol: 0.07, delay: i * 0.07 });
    toneLayer(g, {
      type: 'triangle',
      f0: f * 1.005,
      dur: 0.8,
      vol: 0.04,
      delay: i * 0.07,
    });
  });
  noiseLayer(g, { f0: 4000, f1: 9000, dur: 1.1, vol: 0.02, q: 2.6 });
  audioService.vibrate([20, 45, 25, 45, 30]);
};

/** La copa llega al centro: acorde mayor + sub + destello. Recompensa máxima. */
export const playCupCenterSound = () => {
  if (muted) return;
  const g = graph();
  if (!g) return;
  toneLayer(g, { type: 'sine', f0: 98, f1: 65, dur: 0.9, vol: 0.14 });
  [0, 4, 7, 12, 16].forEach((n, i) =>
    toneLayer(g, {
      type: 'triangle',
      f0: semi(C5, n),
      dur: 1.1 - i * 0.08,
      vol: 0.085,
      delay: i * 0.035,
    })
  );
  toneLayer(g, { type: 'sine', f0: C5 * 2, f1: C5 * 3, dur: 0.5, vol: 0.05 });
  noiseLayer(g, { f0: 5000, f1: 10500, dur: 0.9, vol: 0.026, q: 2.8 });
  audioService.vibrateSuccess();
};

/** El mundo se corre al pan: barrido largo de aire. */
export const playPanSound = () => {
  if (muted) return;
  const g = graph();
  if (!g) return;
  noiseLayer(g, { f0: 3200, f1: 180, dur: 0.85, vol: 0.07, q: 0.9 });
  toneLayer(g, { type: 'sine', f0: 200, f1: 70, dur: 0.8, vol: 0.06 });
};

/** Fin de los créditos: campana en 432 Hz (afinación zen del proyecto). */
export const playCreditsBellSound = () => {
  if (muted) return;
  const g = graph();
  if (!g) return;
  const f = audioService.getFreq432(-9); // C4 a 432 Hz
  toneLayer(g, { type: 'sine', f0: f, dur: 2.2, vol: 0.13 });
  toneLayer(g, { type: 'sine', f0: f * 2, dur: 1.5, vol: 0.055 });
  toneLayer(g, { type: 'sine', f0: f * 3.02, dur: 1.0, vol: 0.03, delay: 0.01 });
  toneLayer(g, { type: 'sine', f0: f * 4.98, dur: 0.6, vol: 0.02, delay: 0.02 });
  audioService.vibrateSuccess();
};

// ------------------------------------------------------------------- ambiente

/**
 * Ambiente de cielo: DESACTIVADO. El viento de ruido filtrado resultaba
 * molesto (siseo/ruido blanco de fondo), así que ya no se inicia. Se conserva
 * la API por compatibilidad con las llamadas existentes.
 */
export const startFlappyAmbient = () => {
  // Sin ambiente de fondo: se quitó el ruido blanco a petición del usuario.
};

export const stopFlappyAmbient = () => {
  if (!ambient) return;
  const a = ambient;
  ambient = null;
  const ctx = a.src.context;
  try {
    a.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.4);
    a.src.stop(ctx.currentTime + 1.2);
    a.src2.stop(ctx.currentTime + 1.2);
    a.lfo.stop(ctx.currentTime + 1.2);
  } catch {
    // si ya estaban detenidos, nada que limpiar
  }
};

export const isFlappyAmbientPlaying = () => ambient !== null;