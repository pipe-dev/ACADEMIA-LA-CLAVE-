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
    start: startPitchDetection,
    stop: stopPitchDetection,
    audioBlobUrl,
    clearAudio
  } = usePitchDetection();

  // Refs de sincronización
  const playerRef = useRef<YouTubePlayer | null>(null);
  const rafRef = useRef<number | null>(null);
  const failedVideosRef = useRef<Set<string>>(new Set());
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);
  const hasCompletedRef = useRef<boolean>(false);

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

  // ─── Fin de Canción y Celebración Automática ───
  const handleSongCompleted = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;

    setIsPlaying(false);
    setIsFinished(true);
    stopPitchDetection();

    if (!useYtFallback && vocalRemover.isReady) {
      vocalRemover.pause();
    } else if (playerRef.current) {
      try {
        playerRef.current.pauseVideo();
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
    if (!useYtFallback && vocalRemover.isReady) {
      t = vocalRemover.getCurrentTime() || 0;
    } else if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      t = playerRef.current.getCurrentTime() || 0;
    }

    if (t > 0 || isPlaying) {
      setCurrentTime(t);

      if (isPlaybackMode && audioPlaybackRef.current) {
        if (Math.abs(audioPlaybackRef.current.currentTime - t) > 0.25) {
          audioPlaybackRef.current.currentTime = t;
        }
      }
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
      }
    }
  }, [useYtFallback, vocalRemover.isReady, vocalRemover.isPlaying]);

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
    if (vocalRemover.error && !useYtFallback) {
      console.warn('Fallo en Web Audio:', vocalRemover.error, 'Conmutando a YouTube fallback');
      setUseYtFallback(true);
    }
  }, [vocalRemover.error, useYtFallback]);

  // Manejo de YouTube
  const handlePlayerReady = useCallback((e: YouTubeEvent) => {
    playerRef.current = e.target;
    try {
      e.target.unMute();
      e.target.setVolume(volume);
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

      if (isMicEnabled && !isDetecting && !isPlaybackMode) {
        startPitchDetection(vocalRemover.getAudioContext());
      }
      if (isPlaybackMode && audioPlaybackRef.current) {
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
  }, [handleSongCompleted, isDetecting, isMicEnabled, isPlaybackMode, startPitchDetection, vocalRemover]);

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
          const alternate = videos.find((v: any) => !failedVideosRef.current.has(v.id));
          if (alternate && alternate.id) {
            setActiveVideoId(alternate.id);
          }
        }
      }
    } catch (err) {
      console.warn('Fallo al buscar alternativa de YouTube:', err);
    }
  }, [activeVideoId, selectedTrack]);

  // Controles
  const togglePlay = useCallback(async () => {
    audioService.playClickSound();
    if (autoplayBlocked) {
      setAutoplayBlocked(false);
    }

    if (!useYtFallback) {
      if (vocalRemover.isPlaying) {
        vocalRemover.pause();
        setIsPlaying(false);
        stopPitchDetection();
        if (isPlaybackMode && audioPlaybackRef.current) {
          audioPlaybackRef.current.pause();
        }
      } else {
        const started = await vocalRemover.play();
        if (started) {
          setIsPlaying(true);
          setAutoplayBlocked(false);
          if (isMicEnabled && !isDetecting && !isPlaybackMode) {
            startPitchDetection(vocalRemover.getAudioContext());
          }
          if (isPlaybackMode && audioPlaybackRef.current) {
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
        playerRef.current.pauseVideo();
        setIsPlaying(false);
        stopPitchDetection();
        if (isPlaybackMode && audioPlaybackRef.current) {
          audioPlaybackRef.current.pause();
        }
      } else {
        playerRef.current.playVideo();
        setIsPlaying(true);
        if (isMicEnabled && !isDetecting && !isPlaybackMode) {
          startPitchDetection(vocalRemover.getAudioContext());
        }
        if (isPlaybackMode && audioPlaybackRef.current) {
          audioPlaybackRef.current.play().catch(console.error);
        }
      }
    }
  }, [autoplayBlocked, isDetecting, isMicEnabled, isPlaybackMode, startPitchDetection, stopPitchDetection, useYtFallback, vocalRemover]);

  const toggleMic = useCallback(async () => {
    audioService.playClickSound();
    if (isMicEnabled) {
      stopPitchDetection();
      setIsMicEnabled(false);
    } else {
      setIsMicEnabled(true);
      if (isPlaying) {
        startPitchDetection(vocalRemover.getAudioContext());
      }
    }
  }, [isMicEnabled, isPlaying, startPitchDetection, stopPitchDetection, vocalRemover]);

  const handlePlayRecording = useCallback(() => {
    audioService.playClickSound();
    setIsPlaybackMode(true);
    hasCompletedRef.current = false;
    setIsFinished(false);
    if (!useYtFallback) {
      vocalRemover.setTime(0);
      vocalRemover.play();
    } else if (playerRef.current) {
      playerRef.current.seekTo(0);
      playerRef.current.playVideo();
    }
    setIsPlaying(true);
    if (audioPlaybackRef.current) {
      audioPlaybackRef.current.currentTime = 0;
      audioPlaybackRef.current.play().catch(console.error);
    }
  }, [useYtFallback, vocalRemover]);

  const handleReplaySong = useCallback(() => {
    hasCompletedRef.current = false;
    setIsFinished(false);
    scoring.resetScoring();
    setCurrentTime(0);
    if (!useYtFallback && vocalRemover.isReady) {
      vocalRemover.setTime(0);
      vocalRemover.play();
    } else if (playerRef.current) {
      try {
        playerRef.current.seekTo(0);
        playerRef.current.playVideo();
      } catch {}
    }
    setIsPlaying(true);
    if (isMicEnabled && !isDetecting) {
      startPitchDetection(vocalRemover.getAudioContext());
    }
  }, [isDetecting, isMicEnabled, scoring, startPitchDetection, useYtFallback, vocalRemover]);

  const resetKaraokeSession = useCallback(() => {
    setIsPlaying(false);
    vocalRemover.destroy();
    if (playerRef.current) {
      try {
        playerRef.current.stopVideo();
      } catch {}
    }
    stopPitchDetection();
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
