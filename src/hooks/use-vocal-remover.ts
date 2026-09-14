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
  
  // Nodos DSP Mid/Side con Crossover de Frecuencias
  const vocalGainRef = useRef<GainNode | null>(null);
  const bassGainRef = useRef<GainNode | null>(null);
  const airGainRef = useRef<GainNode | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  // Nodos DSP para supresión adaptativa A + C
  const midAnalyserRef = useRef<AnalyserNode | null>(null);
  const corridorFilterRef = useRef<BiquadFilterNode | null>(null);
  const notchFilterRef = useRef<BiquadFilterNode | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Niveles guardados para reactualización fluida
  const vocalLevelRef = useRef<number>(0);
  const drumBoostRef = useRef<number>(1.4); // 1.4 = +3 dB de pegada rítmica por defecto

  // Detener el bucle de procesamiento FFT en tiempo real
  const stopDspLoop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  // Iniciar el bucle de procesamiento FFT en tiempo real (A + C)
  const startDspLoop = useCallback(() => {
    stopDspLoop();
    const analyser = midAnalyserRef.current;
    const ctx = audioContextRef.current;
    const corridor = corridorFilterRef.current;
    const notch = notchFilterRef.current;
    if (!analyser || !ctx || !corridor || !notch) return;

    const bufferLength = analyser.frequencyBinCount;
    const freqData = new Float32Array(bufferLength);
    const sampleRate = ctx.sampleRate || 44100;
    const binWidth = sampleRate / analyser.fftSize;

    // Rango vocal de inteligibilidad y formantes
    const minVocalBin = Math.max(0, Math.floor(300 / binWidth));
    const maxVocalBin = Math.min(bufferLength - 1, Math.ceil(3500 / binWidth));
    const formantMinBin = Math.max(0, Math.floor(550 / binWidth));
    const formantMaxBin = Math.min(bufferLength - 1, Math.ceil(2600 / binWidth));

    const loop = () => {
      if (!audioRef.current || audioRef.current.paused || audioRef.current.ended) {
        const now = ctx.currentTime;
        corridor.gain.setTargetAtTime(0, now, 0.05);
        notch.gain.setTargetAtTime(0, now, 0.05);
        return;
      }

      const vocalLvl = vocalLevelRef.current;
      const now = ctx.currentTime;

      // Si el usuario subió el slider a >= 0.90, sonido original sin interferir filtros
      if (vocalLvl >= 0.90) {
        corridor.gain.setTargetAtTime(0, now, 0.05);
        notch.gain.setTargetAtTime(0, now, 0.05);
        rafIdRef.current = requestAnimationFrame(loop);
        return;
      }

      analyser.getFloatFrequencyData(freqData);

      // Calcular energía y formante dominante en el canal Mid (voz seca)
      let sumEnergy = 0;
      let count = 0;
      let maxDb = -Infinity;
      let peakBin = formantMinBin;

      for (let i = minVocalBin; i <= maxVocalBin; i++) {
        const db = freqData[i];
        if (db > -100 && isFinite(db)) {
          sumEnergy += Math.pow(10, db / 20);
          count++;
        }
        if (i >= formantMinBin && i <= formantMaxBin && db > maxDb) {
          maxDb = db;
          peakBin = i;
        }
      }

      const avgLinear = count > 0 ? sumEnergy / count : 0.0001;
      const avgDb = 20 * Math.log10(avgLinear);

      // Umbral vocal VAD (-52 dB corte inferior, -18 dB nivel fuerte)
      const voiceThreshold = -52;
      const maxVoiceDb = -18;

      if (avgDb > voiceThreshold) {
        const rawIntensity = Math.min(1.0, Math.max(0, (avgDb - voiceThreshold) / (maxVoiceDb - voiceThreshold)));
        // Supresión proporcional a la intensidad vocal y a cuánto bajó el usuario el slider (1 - vocalLevel)
        const suppressionAmount = (1.0 - vocalLvl) * (0.40 + 0.60 * rawIntensity);

        // Opción C: Corredor vocal adaptativo (hasta -14 dB centrado en 1400 Hz)
        const targetCorridorGain = -14.0 * suppressionAmount;
        corridor.gain.setTargetAtTime(targetCorridorGain, now, 0.025);

        // Opción A: Notch de formante dominante (hasta -12 dB centrado en el armónico activo)
        const targetNotchGain = -12.0 * suppressionAmount;
        const targetFreq = peakBin * binWidth;
        notch.gain.setTargetAtTime(targetNotchGain, now, 0.025);
        notch.frequency.setTargetAtTime(targetFreq, now, 0.035);
      } else {
        // Pausa vocal / instrumental: liberamos los filtros para que los instrumentos laterales suenen al 100%
        corridor.gain.setTargetAtTime(0, now, 0.08);
        notch.gain.setTargetAtTime(0, now, 0.08);
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);
  }, [stopDspLoop]);

  const updateMix = useCallback((vocalLvl: number, drumBoostLvl: number) => {
    const clampedVocal = Math.max(0, Math.min(1, vocalLvl));
    const clampedDrum = Math.max(0.5, Math.min(2.5, drumBoostLvl));
    vocalLevelRef.current = clampedVocal;
    drumBoostRef.current = clampedDrum;

    const ctx = audioContextRef.current;
    const now = ctx ? ctx.currentTime : 0;

    // 1. Canal vocal central: Se atenúa según el nivel elegido
    if (vocalGainRef.current) {
      if (ctx) {
        vocalGainRef.current.gain.setTargetAtTime(clampedVocal, now, 0.015);
      } else {
        vocalGainRef.current.gain.value = clampedVocal;
      }
    }

    // 2. Frecuencias bajas (< 200 Hz: Bombo, Bajo, Cuerpo de percusión):
    // Cuando el nivel de voz baja hacia 0, la batería y el bajo se mantienen 100% activos con el factor de refuerzo
    if (bassGainRef.current) {
      const targetBass = (1.0 - clampedVocal) * clampedDrum;
      if (ctx) {
        bassGainRef.current.gain.setTargetAtTime(targetBass, now, 0.015);
      } else {
        bassGainRef.current.gain.value = targetBass;
      }
    }

    // 3. Frecuencias altas (> 7.0 kHz: Platillos, hi-hats desde el canal lateral):
    if (airGainRef.current) {
      const targetAir = (1.0 - clampedVocal) * 0.70;
      if (ctx) {
        airGainRef.current.gain.setTargetAtTime(targetAir, now, 0.015);
      } else {
        airGainRef.current.gain.value = targetAir;
      }
    }

    // Reset suave de filtros si se elige voz completa
    if (clampedVocal >= 0.90 && corridorFilterRef.current && notchFilterRef.current) {
      if (ctx) {
        corridorFilterRef.current.gain.setTargetAtTime(0, now, 0.02);
        notchFilterRef.current.gain.setTargetAtTime(0, now, 0.02);
      }
    }
  }, []);

  const destroy = useCallback(() => {
    stopDspLoop();
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
    midAnalyserRef.current = null;
    corridorFilterRef.current = null;
    notchFilterRef.current = null;
    vocalGainRef.current = null;
    bassGainRef.current = null;
    airGainRef.current = null;
    bassFilterRef.current = null;
    masterGainRef.current = null;
    setIsPlaying(false);
    setIsReady(false);
    setCurrentTime(0);
    setDuration(0);
    setError(null);
    setIsFinished(false);
  }, [stopDspLoop]);

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
      audio.src = audioUrl;
      audioRef.current = audio;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const source = ctx.createMediaElementSource(audio);
      const splitter = ctx.createChannelSplitter(2);
      source.connect(splitter);

      // ─── 1. Matriz Mid = 0.5*(L + R) ───
      // Todo el contenido del centro (voz, bombo, bajo, caja)
      const midGainL = ctx.createGain();
      const midGainR = ctx.createGain();
      midGainL.gain.value = 0.5;
      midGainR.gain.value = 0.5;

      const midBus = ctx.createGain();
      splitter.connect(midGainL, 0);
      splitter.connect(midGainR, 1);
      midGainL.connect(midBus);
      midGainR.connect(midBus);

      // ─── 1.1 Analyser FFT en el canal Mid para Detección Vocal ───
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.5;
      midBus.connect(analyser);
      midAnalyserRef.current = analyser;

      // ─── 2. Matriz Side: L_side = 0.5*(L - R) ───
      // Instrumentos y arreglos estéreo laterales
      const sideGainL = ctx.createGain();
      const sideGainR = ctx.createGain();
      sideGainL.gain.value = 0.5;
      sideGainR.gain.value = -0.5;

      const sidePreBus = ctx.createGain();
      splitter.connect(sideGainL, 0);
      splitter.connect(sideGainR, 1);
      sideGainL.connect(sidePreBus);
      sideGainR.connect(sidePreBus);

      // ─── 2.1 Supresión Dinámica A + C en el Canal Side ───
      // Filtro C: Corredor vocal adaptativo (peaking amplio en 1400 Hz)
      const corridorFilter = ctx.createBiquadFilter();
      corridorFilter.type = 'peaking';
      corridorFilter.frequency.value = 1400;
      corridorFilter.Q.value = 0.8;
      corridorFilter.gain.value = 0; // Se modula dinámicamente de 0 a -14 dB
      corridorFilterRef.current = corridorFilter;

      // Filtro A: Notch adaptativo de formantes dominantes (peaking estrecho móvil)
      const notchFilter = ctx.createBiquadFilter();
      notchFilter.type = 'peaking';
      notchFilter.frequency.value = 1100;
      notchFilter.Q.value = 2.8;
      notchFilter.gain.value = 0; // Se modula dinámicamente de 0 a -12 dB
      notchFilterRef.current = notchFilter;

      // Conexión en cascada: PreBus -> Corredor C -> Notch A -> Bus Side Filtrado
      sidePreBus.connect(corridorFilter);
      corridorFilter.connect(notchFilter);
      const sideFilteredBus = notchFilter;

      // Generar L_side y R_side en fase estéreo correcta
      const sideBusL = ctx.createGain();
      sideFilteredBus.connect(sideBusL);

      const sideInvert = ctx.createGain();
      sideInvert.gain.value = -1.0;
      const sideBusR = ctx.createGain();
      sideFilteredBus.connect(sideInvert);
      sideInvert.connect(sideBusR);

      // ─── 3. Crossover de Bombo & Bajo (Kick Drum & Bass Preservation) ───
      // < 200 Hz mantiene sub-bajo y bombo sin filtrar cuerpo pectoral de la voz
      const bassFilter = ctx.createBiquadFilter();
      bassFilter.type = 'lowpass';
      bassFilter.frequency.value = 200;
      bassFilter.Q.value = 0.707;
      midBus.connect(bassFilter);

      const bassGain = ctx.createGain();
      bassFilter.connect(bassGain);
      bassFilterRef.current = bassFilter;
      bassGainRef.current = bassGain;

      // ─── 4. Crossover de Platillos & Brillo (Hi-hats, Cymbals) ───
      // Se alimenta desde el canal lateral para NO colar sibilancias ("s", "ch") de la voz del Mid
      const airFilter = ctx.createBiquadFilter();
      airFilter.type = 'highpass';
      airFilter.frequency.value = 7000;
      airFilter.Q.value = 0.707;
      sideFilteredBus.connect(airFilter);

      const airGain = ctx.createGain();
      airFilter.connect(airGain);
      airGainRef.current = airGain;

      // ─── 5. Canal de Voz Principal (Center Mid Vocal Band) ───
      const vocalGain = ctx.createGain();
      midBus.connect(vocalGain);
      vocalGainRef.current = vocalGain;

      // Aplicar ganancias iniciales con el algoritmo Mid/Side
      vocalLevelRef.current = initialVocalLevel;
      drumBoostRef.current = initialDrumBoost;
      updateMix(initialVocalLevel, initialDrumBoost);

      // ─── 6. Suma Estéreo a la Salida ───
      const outL = ctx.createGain();
      const outR = ctx.createGain();

      sideBusL.connect(outL);
      bassGain.connect(outL);
      airGain.connect(outL);
      vocalGain.connect(outL);

      sideBusR.connect(outR);
      bassGain.connect(outR);
      airGain.connect(outR);
      vocalGain.connect(outR);

      const merger = ctx.createChannelMerger(2);
      outL.connect(merger, 0, 0);
      outR.connect(merger, 0, 1);

      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.85;
      merger.connect(masterGain);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

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
      audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
      audio.addEventListener('play', () => {
        setIsPlaying(true);
        setIsFinished(false);
        startDspLoop();
      });
      audio.addEventListener('pause', () => {
        setIsPlaying(false);
        stopDspLoop();
      });
      audio.addEventListener('ended', () => { 
        setIsPlaying(false); 
        setIsFinished(true); 
        stopDspLoop();
      });
      audio.addEventListener('error', () => {
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
          startDspLoop();
        }).catch((err) => {
          console.warn('Autoplay bloqueado por el navegador (requiere interacción táctil):', err);
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al inicializar Web Audio');
    }
  }, [initialVideoId, destroy, updateMix, startDspLoop, stopDspLoop]);

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
      startDspLoop();
      return true;
    } catch (err) {
      console.warn('Autoplay bloqueado por el navegador (requiere interacción táctil):', err);
      return false;
    }
  }, [startDspLoop]);

  const pause = useCallback(() => {
    stopDspLoop();
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  }, [stopDspLoop]);

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
