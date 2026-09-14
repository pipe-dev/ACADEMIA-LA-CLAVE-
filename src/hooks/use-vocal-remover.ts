import { useState, useRef, useEffect, useCallback } from 'react';

export function useVocalRemover(initialVideoId?: string) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Nodos DSP Mid/Side con Preservación Quirúrgica de Batería, Bajo e Instrumentos
  const vocalCut1Ref = useRef<BiquadFilterNode | null>(null);
  const vocalCut2Ref = useRef<BiquadFilterNode | null>(null);
  const bassBoostRef = useRef<BiquadFilterNode | null>(null);
  const airBoostRef = useRef<BiquadFilterNode | null>(null);
  const sideGainRRef = useRef<GainNode | null>(null);
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

    // 1. Supresión selectiva en la banda vocal humana (Canal Central Mid)
    // Corta hasta -24 dB en 1050 Hz y -20 dB en 2600 Hz (frecuencias centrales de la voz humana)
    // Dejando intactos el bombo (< 200 Hz), el cuerpo del redoblante (200-300 Hz) y los brillos (> 4500 Hz)
    if (vocalCut1Ref.current) {
      const targetGain1 = -24.0 * suppression;
      if (ctx) vocalCut1Ref.current.gain.setTargetAtTime(targetGain1, now, 0.02);
      else vocalCut1Ref.current.gain.value = targetGain1;
    }

    if (vocalCut2Ref.current) {
      const targetGain2 = -20.0 * suppression;
      if (ctx) vocalCut2Ref.current.gain.setTargetAtTime(targetGain2, now, 0.02);
      else vocalCut2Ref.current.gain.value = targetGain2;
    }

    // 2. Refuerzo de Batería y Bajo (Bombo, Bajo eléctrico, Pegada rítmica en el Mid)
    // Al bajar la voz, se refuerza la base rítmica para que la batería nunca se apague en el altavoz
    if (bassBoostRef.current) {
      const targetBass = suppression * (clampedDrum - 0.9) * 4.5; // hasta ~3.5 dB de pegada
      if (ctx) bassBoostRef.current.gain.setTargetAtTime(targetBass, now, 0.02);
      else bassBoostRef.current.gain.value = targetBass;
    }

    // 3. Brillo de Platillos, Hi-hats y Chasquido de Redoblante (> 4500 Hz)
    if (airBoostRef.current) {
      const targetAir = suppression * 2.5; // +2.5 dB
      if (ctx) airBoostRef.current.gain.setTargetAtTime(targetAir, now, 0.02);
      else airBoostRef.current.gain.value = targetAir;
    }

    // 4. Rotación de polaridad adaptativa mono-compatible en el canal R:
    // A vocal = 0 -> +1.0 (en fase con L; elimina al 100% la anulación destructiva en celulares y altavoces mono)
    // A vocal = 1 -> -1.0 (restituye la matriz estéreo original L/R completa)
    if (sideGainRRef.current) {
      const targetSidePhaseR = 1.0 - 2.0 * clampedVocal;
      if (ctx) sideGainRRef.current.gain.setTargetAtTime(targetSidePhaseR, now, 0.02);
      else sideGainRRef.current.gain.value = targetSidePhaseR;
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
    vocalCut1Ref.current = null;
    vocalCut2Ref.current = null;
    bassBoostRef.current = null;
    airBoostRef.current = null;
    sideGainRRef.current = null;
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
      masterGainRef.current.gain.value = Math.max(0, Math.min(1, (vol / 100) * 0.85));
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
      audio.src = audioUrl;
      audioRef.current = audio;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const source = ctx.createMediaElementSource(audio);
      const splitter = ctx.createChannelSplitter(2);
      source.connect(splitter);

      // ─── 1. Matriz Mid = 0.5*(L + R) (Contiene Batería, Bombo, Caja, Bajo y Voz) ───
      const midGainL = ctx.createGain();
      const midGainR = ctx.createGain();
      midGainL.gain.value = 0.5;
      midGainR.gain.value = 0.5;

      const midBus = ctx.createGain();
      splitter.connect(midGainL, 0);
      splitter.connect(midGainR, 1);
      midGainL.connect(midBus);
      midGainR.connect(midBus);

      // ─── 1.1 Cadena de Procesamiento del Canal Central Mid ───
      // A) Refuerzo de Pegada y Cuerpo (Bajo & Bombo < 180 Hz)
      const bassBoost = ctx.createBiquadFilter();
      bassBoost.type = 'lowshelf';
      bassBoost.frequency.value = 180;
      bassBoost.gain.value = 0;
      bassBoostRef.current = bassBoost;

      // B) Notch de Formante Vocal Primario (Corta entre 400 y 1600 Hz: cuerpo de la voz)
      // Deja intactos los bajos del bombo/bajo (< 250 Hz) y los armónicos superiores
      const vocalCut1 = ctx.createBiquadFilter();
      vocalCut1.type = 'peaking';
      vocalCut1.frequency.value = 1050;
      vocalCut1.Q.value = 0.75;
      vocalCut1.gain.value = 0;
      vocalCut1Ref.current = vocalCut1;

      // C) Notch de Presencia Vocal Secundaria (Corta entre 1800 y 3800 Hz: brillo y consonantes de la voz)
      const vocalCut2 = ctx.createBiquadFilter();
      vocalCut2.type = 'peaking';
      vocalCut2.frequency.value = 2600;
      vocalCut2.Q.value = 0.90;
      vocalCut2.gain.value = 0;
      vocalCut2Ref.current = vocalCut2;

      // D) Brillo de Platillos, Hi-hats y Chasquido de Redoblante (> 4500 Hz)
      const airBoost = ctx.createBiquadFilter();
      airBoost.type = 'highshelf';
      airBoost.frequency.value = 4500;
      airBoost.gain.value = 0;
      airBoostRef.current = airBoost;

      // Conexión en serie del canal Mid:
      // midBus -> bassBoost -> vocalCut1 -> vocalCut2 -> airBoost -> midProcessed
      midBus.connect(bassBoost);
      bassBoost.connect(vocalCut1);
      vocalCut1.connect(vocalCut2);
      vocalCut2.connect(airBoost);
      const midProcessed = airBoost;

      // ─── 2. Matriz Side: 0.5*(L - R) (Guitarras, Teclados, Metales, Reverberación Estéreo) ───
      // En Side la voz central está NATURALMENTE ANULADA por cancelación de fase (L - R = 0).
      // NO aplicamos cortes destructivos para mantener el 100% de la fuerza de los instrumentos.
      const sideSplitterL = ctx.createGain();
      const sideSplitterR = ctx.createGain();
      sideSplitterL.gain.value = 0.5;
      sideSplitterR.gain.value = -0.5;

      const sideBus = ctx.createGain();
      splitter.connect(sideSplitterL, 0);
      splitter.connect(sideSplitterR, 1);
      sideSplitterL.connect(sideBus);
      sideSplitterR.connect(sideBus);

      // ─── 2.1 Salidas Estéreo con Rotación Adaptativa Mono-Compatible ───
      const sideBusL = ctx.createGain();
      sideBus.connect(sideBusL);

      const sidePhaseR = ctx.createGain();
      sidePhaseR.gain.value = 1.0 - 2.0 * initialVocalLevel;
      sideGainRRef.current = sidePhaseR;

      const sideBusR = ctx.createGain();
      sideBus.connect(sidePhaseR);
      sidePhaseR.connect(sideBusR);

      // ─── 3. Suma a la Salida Principal ───
      const outL = ctx.createGain();
      const outR = ctx.createGain();

      midProcessed.connect(outL);
      sideBusL.connect(outL);

      midProcessed.connect(outR);
      sideBusR.connect(outR);

      const merger = ctx.createChannelMerger(2);
      outL.connect(merger, 0, 0);
      outR.connect(merger, 0, 1);

      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.85;
      merger.connect(masterGain);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      // Aplicar ganancias iniciales con el algoritmo
      vocalLevelRef.current = initialVocalLevel;
      drumBoostRef.current = initialDrumBoost;
      updateMix(initialVocalLevel, initialDrumBoost);

      // Eventos de estado del elemento audio
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
    destroy, 
    isPlaying, 
    isReady, 
    currentTime, 
    duration, 
    error, 
    isFinished 
  };
}
