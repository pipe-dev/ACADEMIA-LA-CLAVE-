import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Hook DSP Tri-Banda de Alto Rendimiento para Cancelación Vocal y Preservación de Ritmo
 * 
 * Arquitectura Linkwitz-Riley de 3 bandas:
 * 1. Banda de Graves (< 200 Hz): Bombo y bajo eléctrico sumados a mono con fase 100% positiva.
 *    Inmune a la cancelación de fase; máxima pegada rítmica en altavoces de celular y audífonos.
 * 2. Banda Vocal Media (200 Hz – 6.500 Hz):
 *    - Mid (0.5 * (L + R)): Voz frontal seca, atenuada quirúrgicamente hasta -36 dB en modo Karaoke.
 *    - Side (0.5 * (L - R)): Estéreo y ambiente instrumental.
 *      * Modo mono-compatible: Ambos canales reciben fase positiva (cero cancelación en celular).
 *      * Decorrelación Haas de 6ms para audífonos (amplitud tridimensional sin fatiga).
 *      * Filtro dinámico de reverberación (Opción C): Atenúa -14 dB en 1.800 Hz a 0% de voz,
 *        extinguiendo la cola de reverb y coros laterales, y abriéndose suavemente hacia el 50%.
 * 3. Banda de Brillo (> 6.500 Hz): Platillos, hi-hats y aire estéreo preservados al 100%.
 * 4. Masterización: Makeup Gain dinámico (+3.8 dB a voz 0%) y compresor de estudio anti-distorsión.
 */
export function useVocalRemover(initialVideoId?: string) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // ─── Nodos DSP Tri-Banda ───
  // 1. Graves (< 200 Hz)
  const bassGainRef = useRef<GainNode | null>(null);

  // 2. Medios (200 Hz - 6.500 Hz)
  const midCenterGainRef = useRef<GainNode | null>(null);
  const sideReverbNotchRef = useRef<BiquadFilterNode | null>(null);
  const sideBusGainRef = useRef<GainNode | null>(null);

  // 3. Agudos (> 6.500 Hz)
  const highGainRef = useRef<GainNode | null>(null);

  // 4. Masterización
  const makeupGainRef = useRef<GainNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  // Niveles guardados
  const vocalLevelRef = useRef<number>(0);
  const drumBoostRef = useRef<number>(1.4); // 1.4 = pegada rítmica por defecto

  const updateMix = useCallback((vocalLvl: number, drumBoostLvl: number) => {
    const clampedVocal = Math.max(0, Math.min(1, vocalLvl));
    const clampedDrum = Math.max(0.5, Math.min(2.5, drumBoostLvl));
    vocalLevelRef.current = clampedVocal;
    drumBoostRef.current = clampedDrum;

    const ctx = audioContextRef.current;
    const now = ctx ? ctx.currentTime : 0;
    const suppression = 1.0 - clampedVocal; // 0 = voz original, 1 = karaoke total

    // 1. Ganancia del canal central Mid (Voz seca frontal)
    // Curva perceptual exponencial: a 0% cae a -36 dB (0.015x), a 100% llega a 0 dB (1.0x)
    if (midCenterGainRef.current) {
      const targetMidGain = Math.pow(clampedVocal, 1.8) * 0.985 + 0.015;
      if (ctx) midCenterGainRef.current.gain.setTargetAtTime(targetMidGain, now, 0.02);
      else midCenterGainRef.current.gain.value = targetMidGain;
    }

    // 2. Filtro dinámico de reverberación lateral (Opción C)
    // Atenúa hasta -14 dB en 1.800 Hz cuando la voz está en 0%, apagando el eco residual.
    // Entre 0% y 50% de voz se abre gradualmente hasta 0 dB (plano e inalterado de 50% a 100%).
    if (sideReverbNotchRef.current) {
      let targetReverbGain = 0;
      if (clampedVocal < 0.5) {
        const factor = (0.5 - clampedVocal) / 0.5; // 1.0 en 0%, 0.0 en 50%
        targetReverbGain = -14.0 * factor;
      }
      if (ctx) sideReverbNotchRef.current.gain.setTargetAtTime(targetReverbGain, now, 0.02);
      else sideReverbNotchRef.current.gain.value = targetReverbGain;
    }

    // 3. Ganancia del canal lateral Side (Guitarras, teclados y ambiente estéreo)
    // A 0% de voz eleva sutilmente los instrumentos laterales (+2.5 dB) para sostener la presencia
    if (sideBusGainRef.current) {
      const targetSideGain = 1.0 + (0.35 * suppression);
      if (ctx) sideBusGainRef.current.gain.setTargetAtTime(targetSideGain, now, 0.02);
      else sideBusGainRef.current.gain.value = targetSideGain;
    }

    // 4. Pegada del bombo y bajo eléctrico (Graves mono < 200 Hz)
    // Sostenido al 100% con refuerzo dinámico al suprimir la voz para máxima solidez rítmica
    if (bassGainRef.current) {
      const targetBass = clampedDrum * (1.0 + (0.25 * suppression));
      if (ctx) bassGainRef.current.gain.setTargetAtTime(targetBass, now, 0.02);
      else bassGainRef.current.gain.value = targetBass;
    }

    // 5. Compensador de ganancia adaptativo (Makeup Gain)
    // A 0% de voz compensa hasta +3.8 dB (1.55x) de energía acústica para evitar bajones de volumen
    if (makeupGainRef.current) {
      const targetMakeup = 1.0 + (0.55 * suppression);
      if (ctx) makeupGainRef.current.gain.setTargetAtTime(targetMakeup, now, 0.02);
      else makeupGainRef.current.gain.value = targetMakeup;
    }
  }, []);

  const destroy = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
      audioRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    bassGainRef.current = null;
    midCenterGainRef.current = null;
    sideReverbNotchRef.current = null;
    sideBusGainRef.current = null;
    highGainRef.current = null;
    makeupGainRef.current = null;
    compressorRef.current = null;
    masterGainRef.current = null;

    setIsPlaying(false);
    setIsReady(false);
    setCurrentTime(0);
    setDuration(0);
    setError(null);
    setIsFinished(false);
  }, []);

  const setVocalVolume = useCallback((volume: number) => {
    updateMix(volume, drumBoostRef.current);
  }, [updateMix]);

  const setDrumBoost = useCallback((boost: number) => {
    updateMix(vocalLevelRef.current, boost);
  }, [updateMix]);

  const setMasterVolume = useCallback((vol: number) => { // 0 a 100
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = Math.max(0, Math.min(1, vol / 100));
    }
  }, []);

  const initAudio = useCallback(async (
    videoIdToUse?: string, 
    initialVocalLevel: number = 0, 
    initialDrumBoost: number = 1.4,
    autoPlay: boolean = true
  ) => {
    const vid = videoIdToUse || initialVideoId;
    if (!vid) return;

    destroy();

    try {
      const audioUrl = `/api/yt-audio?videoId=${vid}`;

      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.preload = "auto";
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      audio.src = audioUrl;
      audioRef.current = audio;

      if (typeof navigator !== 'undefined' && 'audioSession' in navigator) {
        try {
          (navigator as any).audioSession.type = 'playback';
        } catch {}
      }

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const source = ctx.createMediaElementSource(audio);
      const splitter = ctx.createChannelSplitter(2);
      source.connect(splitter);

      const merger = ctx.createChannelMerger(2);

      // ═════════════════════════════════════════════════════════════════
      // 1. RUTA DE GRAVES (< 200 Hz): Bombo, Bajo Eléctrico y Subgrave
      // Linkwitz-Riley 24 dB/octava sumado en mono con polaridad positiva
      // ═════════════════════════════════════════════════════════════════
      const bassLp1L = ctx.createBiquadFilter();
      bassLp1L.type = 'lowpass';
      bassLp1L.frequency.value = 200;
      bassLp1L.Q.value = 0.707;

      const bassLp2L = ctx.createBiquadFilter();
      bassLp2L.type = 'lowpass';
      bassLp2L.frequency.value = 200;
      bassLp2L.Q.value = 0.707;

      const bassLp1R = ctx.createBiquadFilter();
      bassLp1R.type = 'lowpass';
      bassLp1R.frequency.value = 200;
      bassLp1R.Q.value = 0.707;

      const bassLp2R = ctx.createBiquadFilter();
      bassLp2R.type = 'lowpass';
      bassLp2R.frequency.value = 200;
      bassLp2R.Q.value = 0.707;

      splitter.connect(bassLp1L, 0);
      bassLp1L.connect(bassLp2L);

      splitter.connect(bassLp1R, 1);
      bassLp1R.connect(bassLp2R);

      // Suma mono exacta de graves
      const bassMonoL = ctx.createGain();
      const bassMonoR = ctx.createGain();
      bassMonoL.gain.value = 0.5;
      bassMonoR.gain.value = 0.5;

      const bassBus = ctx.createGain();
      bassLp2L.connect(bassMonoL);
      bassLp2R.connect(bassMonoR);
      bassMonoL.connect(bassBus);
      bassMonoR.connect(bassBus);

      const bassGain = ctx.createGain();
      bassGain.gain.value = initialDrumBoost;
      bassBus.connect(bassGain);
      bassGainRef.current = bassGain;

      // Inyección idéntica en fase a ambos canales (inmune a cancelación mono)
      bassGain.connect(merger, 0, 0); // Canal L
      bassGain.connect(merger, 0, 1); // Canal R

      // ═════════════════════════════════════════════════════════════════
      // 2. RUTA VOCAL MEDIA (200 Hz – 6.500 Hz)
      // Matriz Mid/Side quirúrgica con cancelación mono-compatible
      // ═════════════════════════════════════════════════════════════════
      // A) Extracción Mid = 0.5 * (L + R) (Voz frontal y centro instrumental)
      const midSumL = ctx.createGain();
      const midSumR = ctx.createGain();
      midSumL.gain.value = 0.5;
      midSumR.gain.value = 0.5;

      const midBus = ctx.createGain();
      splitter.connect(midSumL, 0);
      splitter.connect(midSumR, 1);
      midSumL.connect(midBus);
      midSumR.connect(midBus);

      // Filtros pasa-banda vocal para Mid
      const midHp = ctx.createBiquadFilter();
      midHp.type = 'highpass';
      midHp.frequency.value = 200;
      midHp.Q.value = 0.707;

      const midLp = ctx.createBiquadFilter();
      midLp.type = 'lowpass';
      midLp.frequency.value = 6500;
      midLp.Q.value = 0.707;

      const midCenterGain = ctx.createGain();
      midCenterGain.gain.value = Math.pow(initialVocalLevel, 1.8) * 0.985 + 0.015;
      midCenterGainRef.current = midCenterGain;

      midBus.connect(midHp);
      midHp.connect(midLp);
      midLp.connect(midCenterGain);

      // Enrutamiento del centro atenuado a L y R
      midCenterGain.connect(merger, 0, 0);
      midCenterGain.connect(merger, 0, 1);

      // B) Extracción Side = 0.5 * (L - R) (Estéreo instrumental sin voz central)
      const sideSubL = ctx.createGain();
      const sideSubR = ctx.createGain();
      sideSubL.gain.value = 0.5;
      sideSubR.gain.value = -0.5;

      const sideBus = ctx.createGain();
      splitter.connect(sideSubL, 0);
      splitter.connect(sideSubR, 1);
      sideSubL.connect(sideBus);
      sideSubR.connect(sideBus);

      // Filtros pasa-banda para Side
      const sideHp = ctx.createBiquadFilter();
      sideHp.type = 'highpass';
      sideHp.frequency.value = 200;
      sideHp.Q.value = 0.707;

      const sideLp = ctx.createBiquadFilter();
      sideLp.type = 'lowpass';
      sideLp.frequency.value = 6500;
      sideLp.Q.value = 0.707;

      // Filtro dinámico de reverberación (Opción C)
      const sideReverbNotch = ctx.createBiquadFilter();
      sideReverbNotch.type = 'peaking';
      sideReverbNotch.frequency.value = 1800;
      sideReverbNotch.Q.value = 1.0;
      sideReverbNotch.gain.value = initialVocalLevel < 0.5 ? -14.0 * ((0.5 - initialVocalLevel) / 0.5) : 0;
      sideReverbNotchRef.current = sideReverbNotch;

      const sideBusGain = ctx.createGain();
      sideBusGain.gain.value = 1.0 + (0.35 * (1.0 - initialVocalLevel));
      sideBusGainRef.current = sideBusGain;

      sideBus.connect(sideHp);
      sideHp.connect(sideLp);
      sideLp.connect(sideReverbNotch);
      sideReverbNotch.connect(sideBusGain);

      // Salida Side Mono-Compatible:
      // Canal L recibe Side directo en fase (+1.0)
      sideBusGain.connect(merger, 0, 0);

      // Canal R recibe Side decorrelado sutilmente con 6ms (Efecto Haas)
      // En audífonos suena amplio y estéreo; en altavoz de celular (mono) suma en fase sin cancelarse
      const sideDecorrelator = ctx.createDelay();
      sideDecorrelator.delayTime.value = 0.006; // 6 ms
      sideBusGain.connect(sideDecorrelator);
      sideDecorrelator.connect(merger, 0, 1);

      // ═════════════════════════════════════════════════════════════════
      // 3. RUTA DE AGUDOS Y AIRE (> 6.500 Hz): Platillos, Hi-Hats y Sizzle
      // Preservación estéreo nítida y cristalina
      // ═════════════════════════════════════════════════════════════════
      const highHpL = ctx.createBiquadFilter();
      highHpL.type = 'highpass';
      highHpL.frequency.value = 6500;
      highHpL.Q.value = 0.707;

      const highHpR = ctx.createBiquadFilter();
      highHpR.type = 'highpass';
      highHpR.frequency.value = 6500;
      highHpR.Q.value = 0.707;

      splitter.connect(highHpL, 0);
      splitter.connect(highHpR, 1);

      highHpL.connect(merger, 0, 0);
      highHpR.connect(merger, 0, 1);

      // ═════════════════════════════════════════════════════════════════
      // 4. CADENA DE MASTERIZACIÓN Y CONTROL DINÁMICO
      // merger -> makeupGain -> compressor -> masterGain -> destination
      // ═════════════════════════════════════════════════════════════════
      const makeupGain = ctx.createGain();
      makeupGain.gain.value = 1.0 + (0.55 * (1.0 - initialVocalLevel));
      makeupGainRef.current = makeupGain;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-8, ctx.currentTime);
      compressor.knee.setValueAtTime(6, ctx.currentTime);
      compressor.ratio.setValueAtTime(4.0, ctx.currentTime);
      compressor.attack.setValueAtTime(0.003, ctx.currentTime);
      compressor.release.setValueAtTime(0.12, ctx.currentTime);
      compressorRef.current = compressor;

      const masterGain = ctx.createGain();
      masterGain.gain.value = 1.0;
      masterGainRef.current = masterGain;

      merger.connect(makeupGain);
      makeupGain.connect(compressor);
      compressor.connect(masterGain);
      masterGain.connect(ctx.destination);

      // Aplicar ganancias iniciales exactas
      vocalLevelRef.current = initialVocalLevel;
      drumBoostRef.current = initialDrumBoost;
      updateMix(initialVocalLevel, initialDrumBoost);

      // Eventos de estado del elemento Audio
      audio.addEventListener('loadedmetadata', () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setDuration(audio.duration);
        }
      });
      audio.addEventListener('durationchange', () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setDuration(audio.duration);
        }
      });
      audio.addEventListener('canplay', () => setIsReady(true));
      audio.addEventListener('canplaythrough', () => setIsReady(true));
      audio.addEventListener('loadeddata', () => setIsReady(true));
      audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
      audio.addEventListener('play', () => {
        setIsPlaying(true);
        setIsFinished(false);
      });
      audio.addEventListener('pause', () => {
        setIsPlaying(false);
      });
      audio.addEventListener('ended', () => { 
        setIsPlaying(false); 
        setIsFinished(true); 
      });
      audio.addEventListener('error', () => {
        const mediaErr = audio.error;
        console.error('Error en elemento Audio Web Audio:', {
          code: mediaErr?.code,
          message: mediaErr?.message,
          src: audio.src
        });
        setError('No se pudo transmitir el audio sin procesar; conmutando al reproductor alternativo.');
      });
      
      audio.load();

      if (autoPlay) {
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        audio.play().then(() => {
          setIsPlaying(true);
          setIsFinished(false);
        }).catch((err) => {
          console.warn('Autoplay bloqueado por el navegador (requiere interacción táctil):', err);
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al inicializar Web Audio');
    }
  }, [initialVideoId, destroy, updateMix]);

  // Lectura continua de tiempo a 60 FPS para el bucle de animación
  const getCurrentTime = useCallback(() => {
    return audioRef.current ? audioRef.current.currentTime : 0;
  }, []);

  const play = useCallback(async (): Promise<boolean> => {
    if (!audioRef.current || !audioContextRef.current) return false;
    try {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      await audioRef.current.play();
      setIsPlaying(true);
      setIsFinished(false);
      return true;
    } catch (err) {
      console.warn('Autoplay bloqueado por el navegador (requiere interacción táctil):', err);
      return false;
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(async () => {
    if (!audioRef.current || !audioContextRef.current) return;
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    if (isPlaying) {
      pause();
    } else {
      await play();
    }
  }, [isPlaying, play, pause]);
  
  const setTime = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      if (audioRef.current.duration && time < audioRef.current.duration - 0.5) {
        setIsFinished(false);
      }
    }
  }, []);

  const getAudioContext = useCallback(() => {
    return audioContextRef.current;
  }, []);

  useEffect(() => {
    return () => {
      destroy();
    };
  }, [destroy]);

  return { 
    initAudio, 
    togglePlay, 
    play, 
    pause, 
    setVocalVolume, 
    setDrumBoost, 
    setMasterVolume, 
    setTime, 
    getCurrentTime, 
    getAudioContext,
    destroy, 
    isPlaying, 
    isReady, 
    currentTime, 
    duration, 
    error, 
    isFinished 
  };
}
