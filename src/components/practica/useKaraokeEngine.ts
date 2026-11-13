import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { YouTubeEvent, YouTubePlayer } from 'react-youtube';
import { audioService } from '../../utils/audioService';
import { usePitchDetection } from '../../hooks/use-pitch-detection';
import { useVocalRemover } from '../../hooks/use-vocal-remover';
import { emitStreakEligibleAction } from '../../utils/streakPrompt';
import { emitQuestEvent } from '../../utils/dailyQuestsEngine';
import { CatalogTrack, saveKaraokeScore } from './practicaTypes';
import { useKaraokeScoring } from './useKaraokeScoring';
import { pickBestYtMatch } from './pickBestYtMatch';

interface UseKaraokeEngineParams {
  selectedTrack: CatalogTrack | null;
  isCourtesySongActive: boolean;
  onLoseLife?: (source: 'tuner' | 'academia' | 'karaoke') => void;
  onGainLife?: () => void;
  onUpdateQuestProgress?: (seconds: number) => void;
}

export function useKaraokeEngine({
  selectedTrack,
  isCourtesySongActive,
  onLoseLife,
  onGainLife,
  onUpdateQuestProgress
}: UseKaraokeEngineParams) {
  // ─── Screen Wake Lock API (Evita que el teléfono apague la pantalla cantando) ───
  const wakeLockRef = useRef<any>(null);

  const requestWakeLock = useCallback(async () => {
    try {
      if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && !wakeLockRef.current) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        wakeLockRef.current.addEventListener?.('release', () => {
          wakeLockRef.current = null;
        });
      }
    } catch {}
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      try {
        wakeLockRef.current.release?.();
      } catch {}
      wakeLockRef.current = null;
    }
  }, []);
  // ─── Estado del Reproductor YouTube & Motor Web Audio ───
  const [activeVideoId, setActiveVideoId] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(100);
  const [syncOffset, setSyncOffset] = useState<number>(0);

  // ─── Control Vocal en Tiempo Real ───
  const [vocalLevel, setVocalLevel] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('laclave_karaoke_vocal_level');
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          return parsed;
        }
      }
    }
    return 0; // 0% por defecto: Sin voz
  });
  const [useYtFallback, setUseYtFallback] = useState<boolean>(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isMicEnabled, setIsMicEnabled] = useState<boolean>(true);
  const [isPlaybackMode, setIsPlaybackMode] = useState<boolean>(false);

  const vocalRemover = useVocalRemover();
  const scoring = useKaraokeScoring();

  const {
    frequency,
    note,
    smoothedCentsOff,
    isDetecting,
    start: rawStartPitchDetection,
    stop: stopPitchDetection,
    audioBlobUrl,
    clearAudio
  } = usePitchDetection();

  // Envoltorio seguro que garantiza inyección de backingAnalyser (Bleed Gate) y salida a grabación
  // incluso si startPitchDetection se invoca sin argumentos desde la vista
  const startPitchDetection = useCallback(async (
    externalCtx?: AudioContext | null,
    trackOutputGain?: GainNode | null,
    isHeadphones?: boolean,
    userInitiated?: boolean,
    getBackingRms?: () => number
  ) => {
    const finalCtx = externalCtx !== undefined ? externalCtx : vocalRemover.getAudioContext();
    const finalTrackOutputGain = trackOutputGain !== undefined ? trackOutputGain : vocalRemover.getTrackOutputGain?.();
    const finalIsHeadphones = isHeadphones !== undefined ? isHeadphones : audioService.isUsingHeadphones();
    const finalUserInitiated = userInitiated !== undefined ? userInitiated : false;
    const finalGetBackingRms = getBackingRms !== undefined ? getBackingRms : vocalRemover.getBackingRms;
    return rawStartPitchDetection(finalCtx, finalTrackOutputGain, finalIsHeadphones, finalUserInitiated, finalGetBackingRms);
  }, [rawStartPitchDetection, vocalRemover]);

  // Refs de sincronización
  const playerRef = useRef<YouTubePlayer | null>(null);
  const rafRef = useRef<number | null>(null);
  const failedVideosRef = useRef<Set<string>>(new Set());
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);
  const hasCompletedRef = useRef<boolean>(false);
  // Boost de la grabación cantada (+5 dB ≈ x1.78) vía grafo Web Audio:
  // se conecta UNA sola vez al elemento <audio> cuando suena la voz
  const recordingBoostRef = useRef<{ ctx: AudioContext; gain: GainNode } | null>(null);

  // ─── Control de Nivel de Voz en Tiempo Real ───
  const handleSetVocalLevel = useCallback((val: number) => {
    audioService.playClickSound();
    const clamped = Math.max(0, Math.min(1, val));
    setVocalLevel(clamped);
    if (typeof window !== 'undefined') {
      localStorage.setItem('laclave_karaoke_vocal_level', String(clamped));
    }
    vocalRemover.setVocalVolume(clamped);
  }, [vocalRemover]);

  // ─── Control de Volumen General de la Música ───
  const handleSetVolume = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setVolume(clamped);
    vocalRemover.setMasterVolume(clamped);
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      playerRef.current.setVolume(clamped);
    }
  }, [vocalRemover]);

  // ─── Boost Web Audio de la Grabación Cantada (+13 dB) ───
  // element.volume nunca puede superar 1.0; para "hacerla más dura"
  // enrutamos el <audio> una única vez por un GainNode de 4.47 (+13 dB)
  // más un limitador que recorta los picos sin clipear la salida.
  // El grafo queda vivo para toda la sesión del motor (todas las
  // canciones reutilizan el mismo elemento → misma conexión).
  const ensureRecordingBoost = useCallback(() => {
    const el = audioPlaybackRef.current;
    if (recordingBoostRef.current) {
      if (recordingBoostRef.current.ctx.state === 'suspended') {
        recordingBoostRef.current.ctx.resume().catch(() => {});
      }
      return;
    }
    if (!el) return;
    try {
      // Fase 3: Reutilizar el AudioContext singleton unificado a 48000 Hz
      const ctx = audioService.getSharedContext();
      const source = ctx.createMediaElementSource(el);
      const gain = ctx.createGain();
      gain.gain.value = 4.47; // +13 dB (x4.47)

      // Limitador: con +13 dB los picos del mic superan el tope de salida;
      // el compressor corta solo las crestas (voz normal pasa sin tocar)
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -6;
      limiter.knee.value = 4;
      limiter.ratio.value = 16;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.2;
      source.connect(gain);
      gain.connect(limiter);
      limiter.connect(ctx.destination);
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      recordingBoostRef.current = { ctx, gain };
    } catch (err) {
      console.warn('No se pudo aplicar el boost a la grabación:', err);
      recordingBoostRef.current = null;
    }
  }, []);

  // El grafo se libera solo cuando el motor karaoke se desmonta
  useEffect(() => {
    return () => {
      releaseWakeLock();
      if (recordingBoostRef.current) {
        try {
          recordingBoostRef.current.gain.disconnect();
        } catch {}
        recordingBoostRef.current = null;
      }
    };
  }, []);

  // ─── Fin de Canción y Celebración Automática ───
  const handleSongCompleted = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;

    setIsPlaying(false);
      releaseWakeLock();
    setIsFinished(true);
    stopPitchDetection();

    if (!useYtFallback && vocalRemover.isReady) {
      vocalRemover.pause();
    } else if (playerRef.current) {
      try {
        playerRef.current.pauseVideo();
      } catch {}
    }

    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'none';
        if (navigator.mediaSession.metadata) {
          navigator.mediaSession.metadata = null;
        }
      } catch {}
    }

    const finalScore = scoring.scoreRef.current;
    const stars = scoring.calculateStars(finalScore);

    if (!isCourtesySongActive && !isPlaybackMode) {
      if (stars <= 2) {
        if (onLoseLife) onLoseLife('karaoke');
      } else if (stars === 5) {
        if (onGainLife) onGainLife();
      }
    }

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4648d4', '#10b981', '#fbbf24', '#ec4899']
      });
    } catch {}

    emitStreakEligibleAction();
    emitQuestEvent('KARAOKE_COMPLETED', 1);

    if (selectedTrack) {
      saveKaraokeScore({
        videoId: activeVideoId,
        trackName: selectedTrack.title,
        artistName: selectedTrack.artist,
        score: finalScore,
        stars,
        date: Date.now()
      }).catch((err: unknown) => console.error('Error guardando en historial:', err));
    }

    emitStreakEligibleAction();
  }, [
    useYtFallback,
    vocalRemover,
    scoring,
    isCourtesySongActive,
    isPlaybackMode,
    onLoseLife,
    onGainLife,
    selectedTrack,
    activeVideoId,
    stopPitchDetection
  ]);

  // ─── Bucle de Tiempo a 60 FPS con requestAnimationFrame ───
  const updatePlaybackTime = useCallback(() => {
    let t = 0;
    if (isPlaybackMode && audioPlaybackRef.current) {
      t = audioPlaybackRef.current.currentTime || 0;
    } else if (!useYtFallback && vocalRemover.isReady) {
      t = vocalRemover.getCurrentTime() || 0;
    } else if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      t = playerRef.current.getCurrentTime() || 0;
    }

    if (t > 0 || isPlaying) {
      setCurrentTime(t);
    }

    const trackDur = !useYtFallback ? vocalRemover.duration : duration;
    if (isPlaying && !hasCompletedRef.current && trackDur > 5 && t >= trackDur - 0.25) {
      handleSongCompleted();
      return;
    }

    if (isPlaying) {
      rafRef.current = requestAnimationFrame(updatePlaybackTime);
    }
  }, [isPlaying, isPlaybackMode, useYtFallback, vocalRemover, duration, handleSongCompleted]);

  useEffect(() => {
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(updatePlaybackTime);
    } else if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, updatePlaybackTime]);

  // ─── Acumulador de Minutos de Práctica Real en Karaoke ───
  const practiceSecondsAccumRef = useRef<number>(0);
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      practiceSecondsAccumRef.current += 1;
      if (practiceSecondsAccumRef.current >= 60) {
        if (onUpdateQuestProgress) onUpdateQuestProgress(60);
        practiceSecondsAccumRef.current = 0;
      }
    }, 1000);
    return () => {
      clearInterval(interval);
      if (practiceSecondsAccumRef.current > 0) {
        if (onUpdateQuestProgress) onUpdateQuestProgress(practiceSecondsAccumRef.current);
        practiceSecondsAccumRef.current = 0;
      }
    };
  }, [isPlaying, onUpdateQuestProgress]);

  useEffect(() => {
    if (!useYtFallback && vocalRemover.isReady) {
      setIsPlaying(vocalRemover.isPlaying);
      if (vocalRemover.isPlaying) {
        setAutoplayBlocked(false);
      } else if (!hasCompletedRef.current && !isFinished) {
        vocalRemover.play().then((started) => {
          if (started) {
            setIsPlaying(true);
            requestWakeLock();
            setAutoplayBlocked(false);
          }
        }).catch(() => {});
      }
    }
  }, [useYtFallback, vocalRemover.isReady, vocalRemover.isPlaying, isFinished]);

  useEffect(() => {
    if (!useYtFallback && vocalRemover.duration > 0) {
      setDuration(vocalRemover.duration);
    }
  }, [useYtFallback, vocalRemover.duration]);

  useEffect(() => {
    if (!useYtFallback && vocalRemover.isFinished && !isFinished) {
      handleSongCompleted();
    }
  }, [useYtFallback, vocalRemover.isFinished, isFinished, handleSongCompleted]);

  useEffect(() => {
    if (vocalRemover.error) {
      console.warn('[KaraokeEngine] Aviso en Web Audio:', vocalRemover.error);
      // Erradicado fallback a YouTube para preservar 100% el motor DSP y la cancelación vocal
    }
  }, [vocalRemover.error]);

  // Manejo de YouTube
  const handlePlayerReady = useCallback((e: YouTubeEvent) => {
    playerRef.current = e.target;
    try {
      e.target.unMute();
      e.target.setVolume(volume);
      e.target.setPlaybackQuality?.('tiny');
      e.target.playVideo();
    } catch {}
    setIsReady(true);
    setDuration(e.target.getDuration() || 0);
  }, [volume]);

  const handlePlayerStateChange = useCallback((e: YouTubeEvent) => {
    const state = e.data;
    if (state === 1) {
      setIsPlaying(true);
      setDuration(e.target.getDuration() || 0);
      setAutoplayBlocked(false);

      // YouTube a veces reincide y sube la calidad al alcanzar play
      try {
        e.target.setPlaybackQuality?.('tiny');
      } catch {}

      if (isMicEnabled && !isDetecting && !isPlaybackMode) {
        if (audioService.hasLiveMicrophoneStream() || audioService.isMicActive()) {
          startPitchDetection(
            null,
            vocalRemover.getTrackOutputGain?.(),
            audioService.isUsingHeadphones(),
            false,
            vocalRemover.getBackingRms
          );
        }
      }
      if (isPlaybackMode && audioPlaybackRef.current) {
        ensureRecordingBoost();
        audioPlaybackRef.current.play().catch(console.error);
      }
    } else if (state === 2 || state === 3) {
      if (state === 2) setIsPlaying(false);
      if (isPlaybackMode && audioPlaybackRef.current) {
        audioPlaybackRef.current.pause();
      }
    } else if (state === 0) {
      handleSongCompleted();
    }
  }, [ensureRecordingBoost, handleSongCompleted, isDetecting, isMicEnabled, isPlaybackMode, startPitchDetection, vocalRemover]);

  const handlePlayerError = useCallback(async (e: any) => {
    console.warn('YouTube Error:', e?.data);
    failedVideosRef.current.add(activeVideoId);
    if (!selectedTrack) return;

    try {
      const q = encodeURIComponent(`${selectedTrack.artist} ${selectedTrack.title} karaoke`);
      const res = await fetch(`/api/yt-search?q=${q}`);
      if (res.ok) {
        const videos = await res.json();
        if (Array.isArray(videos)) {
          const candidates = videos.filter((v: any) => !failedVideosRef.current.has(v.id));
          const bestMatch = pickBestYtMatch(candidates, selectedTrack.artist, selectedTrack.title);
          const alternate = bestMatch || candidates[0];
          if (alternate && alternate.id) {
            setActiveVideoId(alternate.id);
          }
        }
      }
    } catch (err) {
      console.warn('Fallo al buscar alternativa de YouTube:', err);
    }
  }, [activeVideoId, selectedTrack]);

  // Pausa segura de todas las fuentes de audio (Web Audio, YouTube, voz grabada y micrófono)
  // Se conserva el PlaybackContext activo (sin ctx.suspend()) para evitar reconfiguración de hardware
  const pausePlayback = useCallback(() => {
    try {
      vocalRemover.pause();
    } catch {}

    if (playerRef.current) {
      try {
        playerRef.current.pauseVideo?.();
      } catch {}
    }

    if (audioPlaybackRef.current) {
      try {
        audioPlaybackRef.current.pause?.();
      } catch {}
    }

    try {
      stopPitchDetection();
    } catch {}

    setIsPlaying(false);

    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'paused';
      } catch {}
    }
  }, [vocalRemover, stopPitchDetection]);

  // Pausar inmediatamente cuando el usuario se sale de la app, bloquea la pantalla o cambia de pestaña (igual que en AcademiaView)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pausePlayback();
      }
    };

    const handlePageHide = () => {
      pausePlayback();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [pausePlayback]);

  // Controles
  const togglePlay = useCallback(async () => {
    audioService.playClickSound();
    if (autoplayBlocked) {
      setAutoplayBlocked(false);
    }

    // Modo autoevaluación: alternar reproducción de la grabación del alumno
    if (isPlaybackMode && audioPlaybackRef.current) {
      if (isPlaying) {
        audioPlaybackRef.current.pause();
        setIsPlaying(false);
        releaseWakeLock();
      } else {
        ensureRecordingBoost();
        audioPlaybackRef.current.play().catch(console.error);
        setIsPlaying(true);
        requestWakeLock();
      }
      return;
    }

    if (!useYtFallback) {
      if (vocalRemover.isPlaying) {
        pausePlayback();
      } else {
        if (isMicEnabled && !isDetecting && !isPlaybackMode) {
          await startPitchDetection(
            null,
            vocalRemover.getTrackOutputGain?.(),
            audioService.isUsingHeadphones(),
            true,
            vocalRemover.getBackingRms
          ).catch(() => {});
        }
        await vocalRemover.ensureContextActive?.();
        const started = await vocalRemover.play();
        if (started) {
          setIsPlaying(true);
          setAutoplayBlocked(false);
          if (isPlaybackMode && audioPlaybackRef.current) {
            ensureRecordingBoost();
            audioPlaybackRef.current.play().catch(console.error);
          }
        } else {
          setAutoplayBlocked(true);
        }
      }
      return;
    }

    if (playerRef.current) {
      const state = playerRef.current.getPlayerState();
      if (state === 1) {
        pausePlayback();
      } else {
        if (isMicEnabled && !isDetecting && !isPlaybackMode) {
          startPitchDetection(
            null,
            vocalRemover.getTrackOutputGain?.(),
            audioService.isUsingHeadphones(),
            true,
            vocalRemover.getBackingRms
          ).catch(() => {});
        }
        playerRef.current.playVideo();
        setIsPlaying(true);
        if (isPlaybackMode && audioPlaybackRef.current) {
          ensureRecordingBoost();
          audioPlaybackRef.current.play().catch(console.error);
        }
      }
    }
  }, [autoplayBlocked, isDetecting, isMicEnabled, isPlaybackMode, pausePlayback, startPitchDetection, useYtFallback, vocalRemover]);

  const toggleMic = useCallback(async () => {
    audioService.playClickSound();
    if (isDetecting && isMicEnabled) {
      stopPitchDetection();
      setIsMicEnabled(false);
      vocalRemover.setMasterVolume(volume);
      if (typeof window !== 'undefined') {
        localStorage.setItem('laclave_karaoke_mic_enabled', 'false');
      }
    } else {
      const wasPlayingBeforeMic = vocalRemover.isPlaying || isPlaying;
      setIsMicEnabled(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('laclave_karaoke_mic_enabled', 'true');
      }
      vocalRemover.ensureContextActive?.();
      const ok = await startPitchDetection(
        null,
        vocalRemover.getTrackOutputGain?.(),
        audioService.isUsingHeadphones(),
        true,
        vocalRemover.getBackingRms
      );
      if (!ok) {
        setIsMicEnabled(false);
      }
      vocalRemover.setMasterVolume(volume);

      // Si la música estaba sonando antes de activar el micrófono,
      // reanudar inmediatamente el reproductor para contrarrestar la pausa que iOS WebKit aplica al ejecutar getUserMedia()
      if (wasPlayingBeforeMic) {
        await vocalRemover.ensureContextActive?.();
        await vocalRemover.play();
      }
    }
  }, [isDetecting, isMicEnabled, isPlaying, startPitchDetection, stopPitchDetection, vocalRemover, volume]);

  const handlePlayRecording = useCallback(() => {
    audioService.playClickSound();
    setIsPlaybackMode(true);
    hasCompletedRef.current = false;
    setIsFinished(false);

    // Pausar la pista en vivo para evitar duplicar el audio con la grabación
    if (!useYtFallback) {
      vocalRemover.pause();
    } else if (playerRef.current) {
      try { playerRef.current.pauseVideo(); } catch {}
    }

    setIsPlaying(true);
    requestWakeLock();
    if (audioPlaybackRef.current) {
      ensureRecordingBoost();
      audioPlaybackRef.current.currentTime = 0;
      audioPlaybackRef.current.play().catch(console.error);
    }
  }, [ensureRecordingBoost, requestWakeLock, useYtFallback, vocalRemover]);

  const handleReplaySong = useCallback(async () => {
    setIsPlaybackMode(false);
    if (audioPlaybackRef.current) {
      try {
        audioPlaybackRef.current.pause();
        audioPlaybackRef.current.currentTime = 0;
      } catch {}
    }
    hasCompletedRef.current = false;
    setIsFinished(false);
    scoring.resetScoring();
    setCurrentTime(0);

    // Al pulsar Replay siempre se entra con el micrófono activo
    setIsMicEnabled(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('laclave_karaoke_mic_enabled', 'true');
    }

    if (!isDetecting) {
      await startPitchDetection(
        null,
        vocalRemover.getTrackOutputGain?.(),
        audioService.isUsingHeadphones(),
        true,
        vocalRemover.getBackingRms
      ).catch(() => {});
    }

    if (!useYtFallback && vocalRemover.isReady) {
      vocalRemover.setTime(0);
      await vocalRemover.ensureContextActive?.();
      await vocalRemover.play();
    } else if (playerRef.current) {
      try {
        playerRef.current.seekTo(0);
        playerRef.current.playVideo();
      } catch {}
    }
    setIsPlaying(true);
  }, [isDetecting, isMicEnabled, scoring, startPitchDetection, useYtFallback, vocalRemover]);

  const resetKaraokeSession = useCallback(() => {
    setIsPlaying(false);
    vocalRemover.destroy();
    if (playerRef.current) {
      try {
        playerRef.current.stopVideo();
      } catch {}
    }
    if (audioPlaybackRef.current) {
      try {
        audioPlaybackRef.current.pause();
        audioPlaybackRef.current.removeAttribute('src');
        audioPlaybackRef.current.load();
      } catch {}
    }
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'none';
        if (navigator.mediaSession.metadata) {
          navigator.mediaSession.metadata = null;
        }
      } catch {}
    }
    stopPitchDetection();
    audioService.stopMicrophone(true);
    clearAudio();
    scoring.resetScoring();
    hasCompletedRef.current = false;
    setIsFinished(false);
    setAutoplayBlocked(false);
    setUseYtFallback(false);
    failedVideosRef.current.clear();
  }, [clearAudio, scoring, stopPitchDetection, vocalRemover]);

  return {
    activeVideoId,
    setActiveVideoId,
    isPlaying,
    setIsPlaying,
    isReady,
    currentTime,
    setCurrentTime,
    duration,
    volume,
    syncOffset,
    setSyncOffset,
    vocalLevel,
    handleSetVocalLevel,
    handleSetVolume,
    useYtFallback,
    setUseYtFallback,
    autoplayBlocked,
    setAutoplayBlocked,
    score: scoring.score,
    comboCount: scoring.comboCount,
    multiplier: scoring.multiplier,
    comboTexts: scoring.comboTexts,
    earnedStars: scoring.earnedStars,
    maxCombo: scoring.maxComboRef.current,
    handleHitUpdate: scoring.handleHitUpdate,
    isFinished,
    setIsFinished,
    isMicEnabled,
    setIsMicEnabled,
    isPlaybackMode,
    setIsPlaybackMode,
    frequency,
    note,
    smoothedCentsOff,
    isDetecting,
    startPitchDetection,
    stopPitchDetection,
    audioBlobUrl,
    clearAudio,
    vocalRemover,
    playerRef,
    audioPlaybackRef,
    failedVideosRef,
    hasCompletedRef,
    togglePlay,
    pausePlayback,
    toggleMic,
    handleSongCompleted,
    handlePlayRecording,
    handleReplaySong,
    resetKaraokeSession,
    handlePlayerReady,
    handlePlayerStateChange,
    handlePlayerError
  };
}
