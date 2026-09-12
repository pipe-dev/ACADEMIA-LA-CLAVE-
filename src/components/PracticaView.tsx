'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import YouTube, { YouTubeEvent, YouTubePlayer } from 'react-youtube';
import { 
  Search, Play, Pause, Mic, MicOff, LogOut, 
  Music2, Star, Zap, Trophy, RotateCcw, Headphones, ArrowLeft, Loader2, 
  CheckCircle2, FileText, Volume2, VolumeX, Sparkles, Heart, Clock, Lock
} from 'lucide-react';
import { UserStats } from '../types';
import { audioService } from '../utils/audioService';
import { usePitchDetection } from '../hooks/use-pitch-detection';
import { fetchLyrics, TrackLyrics, LyricLine } from '../lib/fetch-lyrics';
import { saveKaraokeScore } from '../lib/db';
import { emitStreakEligibleAction } from '../utils/streakPrompt';
import { PolygraphCanvas, NoteData } from './practica/polygraph-canvas';
import { useVocalRemover } from '../hooks/use-vocal-remover';
import { Slider } from './ui/slider';
import { getTimeToNextLife } from '../utils/livesEngine';

export interface CatalogTrack {
  id: string;
  rank?: number;
  title: string;
  artist: string;
  category: string;
  genre?: string;
  thumbnail: string;
}

// ─── Catálogo Curado de Alta Calidad (Miniaturas Oficiales Apple Music Verificadas) ───
const RECOMMENDED_TRACKS: CatalogTrack[] = [
  { 
    id: "r1", 
    title: "La Incondicional", 
    artist: "Luis Miguel", 
    category: "Balada",
    thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/27/56/16/275616ef-8e2f-4b5c-7c6f-87bbe5b81314/mzi.vdosoaak.jpg/600x600bb.jpg" 
  },
  { 
    id: "r2", 
    title: "Rayando el Sol", 
    artist: "Maná", 
    category: "Rock en Español",
    thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/b2/27/d8/b227d8b8-21c2-79f4-18ef-4e90f281f965/s06.gqkqqnvt.jpg/600x600bb.jpg" 
  },
  { 
    id: "r3", 
    title: "Mientes Tan Bien", 
    artist: "Sin Bandera", 
    category: "Balada",
    thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/52/05/bc/5205bc20-2e70-7e86-cbaf-2796191a9644/mzi.fkqxcawi.jpg/600x600bb.jpg" 
  },
  { 
    id: "r4", 
    title: "Antología", 
    artist: "Shakira", 
    category: "Pop Latino",
    thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/91/ee/39/91ee3991-dff9-fce3-f8ca-b3a62886c96e/886444007801.jpg/600x600bb.jpg" 
  },
  { 
    id: "r5", 
    title: "En Cambio No", 
    artist: "Laura Pausini", 
    category: "Balada",
    thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/a1/4d/cf/a14dcf3c-0bfb-146b-3afd-b8c965d06af5/mzi.sdhqplhz.jpg/600x600bb.jpg" 
  },
  { 
    id: "r6", 
    title: "Sálvame", 
    artist: "RBD", 
    category: "Pop Latino",
    thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/bf/be/1a/bfbe1a54-27f9-7609-6572-c7feec96094d/20UMGIM74536.rgb.jpg/600x600bb.jpg" 
  },
  { 
    id: "r7", 
    title: "Dejaría Todo", 
    artist: "Chayanne", 
    category: "Balada",
    thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/ce/23/e8/ce23e806-38ae-94a0-54a8-fa8e95738c82/886443422612.jpg/600x600bb.jpg" 
  },
  { 
    id: "r8", 
    title: "Noviembre Sin Ti", 
    artist: "Reik", 
    category: "Pop Latino",
    thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/fd/22/aa/fd22aa0f-42cb-c4ce-3140-1318e134c3ee/mzi.uahtvkpr.jpg/600x600bb.jpg" 
  },
  { 
    id: "r9", 
    title: "El Triste", 
    artist: "José José", 
    category: "Balada",
    thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/3a/24/13/3a241361-9783-cb2e-a93f-791ae323d0f2/743214944325.jpg/600x600bb.jpg" 
  },
  { 
    id: "r10", 
    title: "Corazón Partío", 
    artist: "Alejandro Sanz", 
    category: "Pop Latino",
    thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music/e0/69/65/mzi.wefyxwke.jpg/600x600bb.jpg" 
  },
  { 
    id: "r11", 
    title: "Creo en Ti", 
    artist: "Reik", 
    category: "Balada",
    thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/97/43/f0/9743f0e2-f4bd-3f66-a05e-2f86330e430b/dj.ztnpydrb.jpg/600x600bb.jpg" 
  },
  { 
    id: "r12", 
    title: "Entra En Mi Vida", 
    artist: "Sin Bandera", 
    category: "Balada",
    thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/d5/07/77/d507779f-0ae5-2566-ee50-a9cb62112e4d/886443673328.jpg/600x600bb.jpg" 
  },
  { 
    id: "r13", 
    title: "A Puro Dolor", 
    artist: "Son By Four", 
    category: "Balada",
    thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/58/2d/6e/582d6e20-569f-f657-2af4-1200704d8f3d/mzi.dofscbdu.jpg/600x600bb.jpg" 
  },
  { 
    id: "r14", 
    title: "La Camisa Negra", 
    artist: "Juanes", 
    category: "Pop Latino",
    thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/21/1d/ad/211dad4f-69f6-9ac3-4c3b-3116dd3de4d4/06UMGIM24053.rgb.jpg/600x600bb.jpg" 
  },
  { 
    id: "r15", 
    title: "Mientes", 
    artist: "Camila", 
    category: "Balada",
    thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/43/74/48/43744887-d066-1705-3a7f-0bfba1c17f2b/mzi.crhraapt.jpg/600x600bb.jpg" 
  },
  { 
    id: "r16", 
    title: "Color Esperanza", 
    artist: "Diego Torres", 
    category: "Pop Latino",
    thumbnail: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/9e/d6/8a/9ed68ac5-9179-81a6-9450-2128fbe94520/mzi.bsrsvaiv.jpg/600x600bb.jpg" 
  }
];

// Citas motivacionales cuando una pista no contiene letra sincronizada
const FALLBACK_LYRICS = [
  "🎵 Sigue el ritmo de la melodía — ¡Tu voz es el instrumento principal!",
  "🎤 Canta con el corazón y déjate llevar por la armonía musical.",
  "✨ Siente la música correr por tus venas — ¡Es tu momento de brillar!",
  "🌟 Cierra los ojos y afina el alma — Sigue las notas y disfruta la música.",
  "🎶 La melodía es tu lienzo y tu voz es el pincel: ¡dibuja cada nota!",
  "🔥 Conecta con la emoción del momento y canta sin miedo a equivocarte.",
  "💡 Las letras son solo palabras: ¡la precisión tonal es la verdadera magia!",
  "🎧 Escucha atentamente los acordes y deja que tu instinto vocal te guíe.",
  "💖 Cantar no requiere perfección: requiere pasión, aire y apoyo diafragmático.",
  "🚀 Eleva tu vibrato y tu energía — ¡Disfruta la pista instrumental!"
];

// 10 Textos para hacer amena la espera (Divertidas, Autoestima/Orgullo, Técnicas)
const LOADING_TIPS = [
  "Calentando cuerdas vocales... y avisando a los vecinos 🎤😅",
  "Tu voz es única e irrepetible: nadie en el mundo canta con tu misma esencia 🌟👑",
  "Tip vocal: Apoya el aire desde el diafragma y relaja los hombros para no tensionar 🌬️🧘",
  "Afinando el autotune mental... ¡aunque con tu talento natural no hace falta! 😉✨",
  "Cantar no se trata de no fallar notas, sino de transmitir lo que llevas en el pecho ❤️🔥",
  "Si se escapa un gallito, diremos con elegancia que fue un adorno estilístico 🐔🕶️",
  "Tip vocal: Abre bien la mandíbula y relaja el cuello; la voz necesita espacio para resonar 🗣️💡",
  "Olvídate de la timidez: este escenario es seguro y viniste a disfrutar tu propia voz 🚀🙌",
  "Descargando y guardando en tu memoria local para que cantes sin interrupciones ⚡💾",
  "Respira profundo, conecta con la emoción y ¡prepárate para dar un conciertazo! 🎵🎉"
];

interface PracticaViewProps {
  userStats: UserStats;
  onUpdateQuestProgress?: (seconds: number) => void;
  zenMode?: boolean;
  onLoseLife?: (source: 'tuner' | 'academia' | 'karaoke') => void;
  onGainLife?: () => void;
  onUseCourtesySong?: () => void;
  onOpenRecoveryExam?: () => void;
  onOpenStore?: () => void;
}

export const PracticaView: React.FC<PracticaViewProps> = ({ 
  userStats, 
  onUpdateQuestProgress,
  zenMode = false,
  onLoseLife,
  onGainLife,
  onUseCourtesySong,
  onOpenRecoveryExam,
  onOpenStore
}) => {
  // ─── Estado de Vidas y Canción de Cortesía ───
  const [isCourtesySongActive, setIsCourtesySongActive] = useState<boolean>(false);
  const [showNoLivesModal, setShowNoLivesModal] = useState<boolean>(false);

  // Countdown pasivo de vidas
  const [timeToNextLife, setTimeToNextLife] = useState<{ remainingMs: number; formatted: string }>(() =>
    getTimeToNextLife(userStats)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeToNextLife(getTimeToNextLife(userStats));
    }, 1000);
    return () => clearInterval(timer);
  }, [userStats]);
  // ─── Estado de Catálogo y Búsqueda ───
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<CatalogTrack[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [top100Tracks, setTop100Tracks] = useState<CatalogTrack[]>(RECOMMENDED_TRACKS);
  const [secularTracks, setSecularTracks] = useState<CatalogTrack[]>([]);
  const [christianTracks, setChristianTracks] = useState<CatalogTrack[]>([]);
  const [allTracks, setAllTracks] = useState<CatalogTrack[]>(RECOMMENDED_TRACKS);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(false);

  // ─── Estado de Carga y Selección de Pista ───
  const [selectedTrack, setSelectedTrack] = useState<CatalogTrack | null>(null);
  const [isLoadingTrack, setIsLoadingTrack] = useState<boolean>(false);
  const [loadingStatusMsg, setLoadingStatusMsg] = useState<string>('');
  const [loadingTipIndex, setLoadingTipIndex] = useState<number>(0);

  // ─── Estado del Reproductor YouTube & Motor Web Audio ───
  const [activeVideoId, setActiveVideoId] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(85);
  const [syncOffset, setSyncOffset] = useState<number>(0); // Nudge timing in seconds

  // ─── Control Vocal en Tiempo Real (Cancelación de Centro sobre Pista Oficial) ───
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
    return 0; // 0% por defecto: Sin voz (Karaoke puro en sincronía)
  });
  const [useYtFallback, setUseYtFallback] = useState<boolean>(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState<boolean>(false);
  const vocalRemover = useVocalRemover();

  // ─── Estado de Letras y Melodía ───
  const [trackLyrics, setTrackLyrics] = useState<TrackLyrics | null>(null);
  const [parsedLyrics, setParsedLyrics] = useState<LyricLine[]>([]);
  const [melodyData, setMelodyData] = useState<NoteData[]>([]);

  // ─── Gamificación: Puntos, Combos y Marcador ───
  const [score, setScore] = useState<number>(0);
  const [comboCount, setComboCount] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [comboTexts, setComboTexts] = useState<{ id: number; text: string; color: string }[]>([]);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [earnedStars, setEarnedStars] = useState<number>(0);

  // ─── Micrófono, Tono y Grabación ───
  const [isMicEnabled, setIsMicEnabled] = useState<boolean>(true);
  const [isPlaybackMode, setIsPlaybackMode] = useState<boolean>(false);
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());
  const [stageImageFailed, setStageImageFailed] = useState<boolean>(false);

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

  // Refs de sincronización en tiempo real
  const playerRef = useRef<YouTubePlayer | null>(null);
  const rafRef = useRef<number | null>(null);
  const failedVideosRef = useRef<Set<string>>(new Set());
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);
  const comboIdCounter = useRef<number>(0);
  const lastFirstTipRef = useRef<number>(-1);
  const lastShownTipRef = useRef<number>(-1);
  const hitFramesCountRef = useRef<number>(0);
  const missFramesCountRef = useRef<number>(0);
  const maxComboRef = useRef<number>(0);

  // Cita motivacional aleatoria fija por pista
  const currentFallbackLyric = useMemo(() => {
    return FALLBACK_LYRICS[Math.floor(Math.random() * FALLBACK_LYRICS.length)];
  }, [selectedTrack?.id]);

  // Al entrar a una canción, llevar la vista al inicio de la pantalla
  useEffect(() => {
    if (selectedTrack) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [selectedTrack]);

  // Cargar el paquete completo del catálogo (Top 100 equilibrado, 100 seculares, 100 cristianas y ~200 total)
  useEffect(() => {
    setIsLoadingCatalog(true);
    fetch('/api/top-tracks')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (data.top100 && Array.isArray(data.top100)) {
            setTop100Tracks(data.top100);
            setSecularTracks(data.secular100 || []);
            setChristianTracks(data.christian100 || []);
            setAllTracks(data.allTracks || data.top100);
          } else if (Array.isArray(data)) {
            setTop100Tracks(data);
            setAllTracks(data);
          }
        }
      })
      .catch((err) => console.warn('Error cargando catálogo:', err))
      .finally(() => setIsLoadingCatalog(false));
  }, []);

  // Rotar los 10 textos con barajado dinámico (Fisher-Yates) evitando que el primero se repita consecutivamente
  useEffect(() => {
    if (!isLoadingTrack) return;

    // Generar permutación aleatoria evitando que el primer elemento repita el anterior
    const generateShuffledIndices = (excludeFirst?: number) => {
      const indices = Array.from({ length: LOADING_TIPS.length }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      // Si la primera posición coincide con la que apareció de primera en la carga anterior, intercambiarla
      if (excludeFirst !== undefined && indices[0] === excludeFirst && indices.length > 1) {
        const swapIdx = 1 + Math.floor(Math.random() * (indices.length - 1));
        [indices[0], indices[swapIdx]] = [indices[swapIdx], indices[0]];
      }
      return indices;
    };

    const queue = generateShuffledIndices(lastFirstTipRef.current);
    const initialTip = queue[0];
    lastFirstTipRef.current = initialTip;
    lastShownTipRef.current = initialTip;
    setLoadingTipIndex(initialTip);

    let step = 1;
    const interval = setInterval(() => {
      if (step >= queue.length) {
        const newQueue = generateShuffledIndices(lastShownTipRef.current);
        queue.splice(0, queue.length, ...newQueue);
        step = 0;
      }
      const nextIdx = queue[step];
      lastShownTipRef.current = nextIdx;
      setLoadingTipIndex(nextIdx);
      step++;
    }, 2800);

    return () => clearInterval(interval);
  }, [isLoadingTrack]);

  // ─── Búsqueda en iTunes (Debounced) ───
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/itunes-search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const mapped: CatalogTrack[] = data.map((item: any) => ({
              id: item.id || String(Math.random()),
              title: item.title,
              artist: item.artist,
              category: 'Pop Latino',
              thumbnail: item.thumbnail || ''
            }));
            setSearchResults(mapped);
          }
        }
      } catch (err) {
        console.warn('Error en búsqueda de iTunes:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Catálogo filtrado según la especificación:
  // 1. "Todos": El Top 100 equilibrado que ya teníamos
  // 2. "Del Momento": Las 100 canciones seculares
  // 3. "Música Cristiana": Las 100 canciones de música cristiana
  // 4. Filtros genéricos: Encasillan de la lista total de las 200 canciones
  const displayedCatalog = useMemo(() => {
    if (searchQuery.trim() && searchResults.length > 0) {
      return searchResults;
    }
    if (selectedCategory === 'Todos') {
      return top100Tracks;
    }
    if (selectedCategory === 'Del Momento') {
      return secularTracks.length > 0 ? secularTracks : top100Tracks.filter(t => t.category === 'Del Momento');
    }
    if (selectedCategory === 'Música Cristiana') {
      return christianTracks.length > 0 ? christianTracks : top100Tracks.filter(t => t.category === 'Música Cristiana');
    }
    return allTracks.filter(t => t.genre === selectedCategory || t.category === selectedCategory);
  }, [searchQuery, searchResults, selectedCategory, top100Tracks, secularTracks, christianTracks, allTracks]);

  // ─── Selección de Canción y Resolución Silenciosa ───
  const handleSelectTrack = async (track: CatalogTrack) => {
    audioService.playClickSound();

    // 0 Lives Gate & Courtesy Song Check
    if ((userStats.lives ?? 1) <= 0) {
      if (userStats.hasUsedCourtesySong) {
        audioService.playSadDefeatSound();
        setShowNoLivesModal(true);
        return;
      }
      // Allowed: This is the user's single courtesy song
      setIsCourtesySongActive(true);
      if (onUseCourtesySong) {
        onUseCourtesySong();
      }
    } else {
      setIsCourtesySongActive(false);
    }

    setIsLoadingTrack(true);
    setLoadingStatusMsg('Buscando pista de estudio...');
    setSelectedTrack(track);
    setStageImageFailed(false);
    setIsFinished(false);
    setIsPlaybackMode(false);
    setScore(0);
    setComboCount(0);
    setMultiplier(1);
    hitFramesCountRef.current = 0;
    missFramesCountRef.current = 0;
    maxComboRef.current = 0;
    setCurrentTime(0);
    clearAudio();
    vocalRemover.destroy();
    setUseYtFallback(false);
    setAutoplayBlocked(false);
    failedVideosRef.current.clear();

    const normArtist = track.artist.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const normTitle = track.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    const queryKey = `${normArtist} ${normTitle} audio`;
    const cacheKey = `yt_audio_${normArtist}_${normTitle}`;

    // 1. Descargar Letras Sincronizadas y Resolver Audio en Paralelo para Carga Inmediata
    setLoadingStatusMsg('Preparando pista y reproductor...');
    let resolvedVideoId: string | null = null;
    if (typeof window !== 'undefined') {
      resolvedVideoId = localStorage.getItem(cacheKey);
    }

    try {
      const [lyricsRes, searchRes] = await Promise.all([
        fetchLyrics(track.title, track.artist).catch(() => null),
        resolvedVideoId 
          ? Promise.resolve(null)
          : fetch(`/api/yt-search?q=${encodeURIComponent(queryKey)}`)
              .then(r => r.ok ? r.json() : null)
              .catch(() => null)
      ]);

      if (lyricsRes) {
        setTrackLyrics(lyricsRes);
        setParsedLyrics(lyricsRes.parsedLyrics || []);
      } else {
        setTrackLyrics(null);
        setParsedLyrics([]);
      }

      if (!resolvedVideoId && Array.isArray(searchRes) && searchRes.length > 0 && searchRes[0].id) {
        resolvedVideoId = String(searchRes[0].id);
        if (typeof window !== 'undefined') {
          localStorage.setItem(cacheKey, resolvedVideoId);
        }
      }

      const finalVideoId = resolvedVideoId || '1q3ND4XPzIg';
      setActiveVideoId(finalVideoId);

      // Inicializar Web Audio con autoPlay = true y pegada de batería fija potente (1.4x / +3dB)
      await vocalRemover.initAudio(finalVideoId, vocalLevel, 1.4, true);

      // Reproducción inmediata
      const started = await vocalRemover.play();
      if (started) {
        setIsPlaying(true);
        setAutoplayBlocked(false);
        if (isMicEnabled && !isDetecting && !isPlaybackMode) {
          startPitchDetection();
        }
      } else {
        setAutoplayBlocked(true);
      }

      // Cargar melodía de afinación en segundo plano sin retrasar el audio
      fetch(`/api/karaoke-melody?videoId=${finalVideoId}`)
        .then(r => r.ok ? r.json() : null)
        .then(mData => {
          if (mData && Array.isArray(mData.notes)) {
            setMelodyData(mData.notes);
          } else {
            setMelodyData([]);
          }
        })
        .catch(() => {
          setMelodyData([]);
        });
    } catch (err) {
      console.warn('Error resolviendo audio oficial:', err);
      setUseYtFallback(true);
      setActiveVideoId('1q3ND4XPzIg');
    } finally {
      setIsLoadingTrack(false);
      setLoadingStatusMsg('');
    }
  };

  // ─── Control de Nivel de Voz en Tiempo Real (0.0 = Sin Voz, 1.0 = Original) ───
  const handleSetVocalLevel = (val: number) => {
    audioService.playClickSound();
    const clamped = Math.max(0, Math.min(1, val));
    setVocalLevel(clamped);
    if (typeof window !== 'undefined') {
      localStorage.setItem('laclave_karaoke_vocal_level', String(clamped));
    }
    vocalRemover.setVocalVolume(clamped);
  };

  // ─── Control de Volumen General de la Música ───
  const handleSetVolume = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setVolume(clamped);
    vocalRemover.setMasterVolume(clamped);
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      playerRef.current.setVolume(clamped);
    }
  };

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

      // Sincronizar audio de grabación si está en modo playback
      if (isPlaybackMode && audioPlaybackRef.current) {
        if (Math.abs(audioPlaybackRef.current.currentTime - t) > 0.25) {
          audioPlaybackRef.current.currentTime = t;
        }
      }
    }

    if (isPlaying) {
      rafRef.current = requestAnimationFrame(updatePlaybackTime);
    }
  }, [isPlaying, isPlaybackMode, useYtFallback, vocalRemover]);

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

  // Sincronizar estado de reproducción desde Web Audio de manera unidireccional
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
    if (!useYtFallback && vocalRemover.isFinished && isPlaying) {
      handleSongCompleted();
    }
  }, [useYtFallback, vocalRemover.isFinished, isPlaying]);

  useEffect(() => {
    if (vocalRemover.error && !useYtFallback) {
      console.warn('Fallo en Web Audio:', vocalRemover.error, 'Conmutando a YouTube fallback');
      setUseYtFallback(true);
    }
  }, [vocalRemover.error, useYtFallback]);

  // Actualizar progreso de misiones cada 15 segundos de canto activo
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      if (onUpdateQuestProgress) {
        onUpdateQuestProgress(15);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [isPlaying, onUpdateQuestProgress]);

  // ─── Manejadores de Eventos del Reproductor YouTube ───
  const handlePlayerReady = (e: YouTubeEvent) => {
    playerRef.current = e.target;
    try {
      e.target.unMute();
      e.target.setVolume(volume);
    } catch {}
    setIsReady(true);
    setDuration(e.target.getDuration() || 0);
  };

  const handlePlayerStateChange = (e: YouTubeEvent) => {
    const state = e.data;
    // 1 = Reproduciendo
    if (state === 1) {
      setIsPlaying(true);
      setDuration(e.target.getDuration() || 0);
      setAutoplayBlocked(false);

      if (isMicEnabled && !isDetecting && !isPlaybackMode) {
        startPitchDetection();
      }
      if (isPlaybackMode && audioPlaybackRef.current) {
        audioPlaybackRef.current.play().catch(console.error);
      }
    }
    // 2 = Pausado
    else if (state === 2 || state === 3) {
      if (state === 2) setIsPlaying(false);
      if (isPlaybackMode && audioPlaybackRef.current) {
        audioPlaybackRef.current.pause();
      }
    }
    // 0 = Terminado
    else if (state === 0) {
      handleSongCompleted();
    }
  };

  // Error de video: reintento silencioso con otra versión (evita error 150/101 de copyright)
  const handlePlayerError = async (e: any) => {
    console.warn('YouTube Error (Intentando versión alternativa):', e?.data);
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
            return;
          }
        }
      }
    } catch (err) {
      console.warn('Fallo al buscar alternativa de YouTube:', err);
    }
  };

  // ─── Fin de Canción y Celebración ───
  const handleSongCompleted = () => {
    setIsPlaying(false);
    setIsFinished(true);
    stopPitchDetection();

    const finalScore = score;
    const stars = finalScore >= 3000 ? 5 : finalScore >= 1800 ? 4 : finalScore >= 900 ? 3 : finalScore >= 300 ? 2 : 1;
    setEarnedStars(stars);

    // Reglas de Vidas:
    // Exención estricta de canción de cortesía:
    // "si el usuario canta muy bien su ultima canción de cortesia y se saca 5 estrellas no pasa nada, no recupera vidas ya que solo era de cortesia"
    if (isCourtesySongActive) {
      // No gana vidas aunque obtenga 5 estrellas
    } else {
      if (stars <= 2) {
        if (onLoseLife) {
          onLoseLife('karaoke');
        }
      } else if (stars === 5) {
        if (onGainLife) {
          onGainLife();
        }
      }
    }

    // Confeti triunfal
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4648d4', '#10b981', '#fbbf24', '#ec4899']
      });
    } catch {}

    // Guardar en base de datos IndexedDB
    if (selectedTrack) {
      saveKaraokeScore({
        videoId: activeVideoId,
        trackName: selectedTrack.title,
        artistName: selectedTrack.artist,
        score: finalScore,
        stars,
        date: Date.now()
      }).catch(err => console.error('Error guardando en historial:', err));
    }

    // Disparar racha diaria
    emitStreakEligibleAction();
  };

  // ─── Controles de Reproducción Unificados ───
  const togglePlay = async () => {
    audioService.playClickSound();
    if (autoplayBlocked) {
      setAutoplayBlocked(false);
    }

    if (!useYtFallback && vocalRemover.isReady) {
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
          if (isMicEnabled && !isDetecting && !isPlaybackMode) {
            startPitchDetection();
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
          startPitchDetection();
        }
        if (isPlaybackMode && audioPlaybackRef.current) {
          audioPlaybackRef.current.play().catch(console.error);
        }
      }
    }
  };


  // Píldora de activación de micrófono
  const toggleMic = async () => {
    audioService.playClickSound();
    if (isMicEnabled) {
      stopPitchDetection();
      setIsMicEnabled(false);
    } else {
      setIsMicEnabled(true);
      if (isPlaying) {
        startPitchDetection();
      }
    }
  };

  // ─── Detección de Aciertos y Puntuación en Tiempo Real ───
  const handleHitUpdate = (isHit: boolean) => {
    if (isHit) {
      missFramesCountRef.current = 0;
      hitFramesCountRef.current += 1;

      // Cada ~5 cuadros de afinación sostenida (~80ms):
      // Ritmo ágil, sensible y muy satisfactorio al cantar
      if (hitFramesCountRef.current >= 5) {
        hitFramesCountRef.current = 0;

        setComboCount(prev => {
          const nextCombo = prev + 1;
          if (nextCombo > maxComboRef.current) {
            maxComboRef.current = nextCombo;
          }

          let newMult = 1;
          let comboMsg = '';

          // Umbrales de combo claros y visibles con el Rayo ⚡
          if (nextCombo >= 35) {
            newMult = 4;
            comboMsg = '¡RAYO! x4 ⚡';
          } else if (nextCombo >= 18) {
            newMult = 3;
            comboMsg = '¡Racha x3! ⚡';
          } else if (nextCombo >= 6) {
            newMult = 2;
            comboMsg = '¡Genial! x2';
          }

          if (newMult !== multiplier) {
            setMultiplier(newMult);
          }

          if (comboMsg && (nextCombo === 6 || nextCombo === 18 || nextCombo === 35 || nextCombo % 20 === 0)) {
            const id = ++comboIdCounter.current;
            setComboTexts(curr => [...curr.slice(-2), { id, text: comboMsg, color: 'text-amber-300' }]);
            setTimeout(() => {
              setComboTexts(curr => curr.filter(t => t.id !== id));
            }, 1400);
          }

          return nextCombo;
        });

        // 12 puntos por acierto con multiplicador
        setScore(prev => prev + (12 * multiplier));
      }
    } else {
      missFramesCountRef.current += 1;

      // Tolerancia: La racha se mantiene durante pausas de respiración cortas (~450ms / 28 cuadros)
      if (missFramesCountRef.current > 28) {
        hitFramesCountRef.current = 0;
        setComboCount(0);
        if (multiplier !== 1) {
          setMultiplier(1);
        }
      }
    }
  };

  // ─── Sincronización de Letras de 3 Líneas ───
  const activeLyricIndex = useMemo(() => {
    if (parsedLyrics.length === 0) return -1;
    const adjustedTime = currentTime + syncOffset;
    return parsedLyrics.findIndex((line, idx) => {
      const nextLine = parsedLyrics[idx + 1];
      return adjustedTime >= line.time && (!nextLine || adjustedTime < nextLine.time);
    });
  }, [parsedLyrics, currentTime, syncOffset]);

  // Salir y volver al catálogo
  const handleExitToCatalog = () => {
    audioService.playClickSound();
    setIsPlaying(false);
    vocalRemover.destroy();
    if (playerRef.current) {
      try {
        playerRef.current.stopVideo();
      } catch {}
    }
    stopPitchDetection();
    clearAudio();
    setSelectedTrack(null);
    hitFramesCountRef.current = 0;
    missFramesCountRef.current = 0;
    maxComboRef.current = 0;
    setIsFinished(false);
    setAutoplayBlocked(false);
    setUseYtFallback(false);
  };

  // Escuchar la propia voz grabada tras finalizar
  const handlePlayRecording = () => {
    audioService.playClickSound();
    setIsPlaybackMode(true);
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
  };

  // Formato mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // ─── RENDERIZADO ───
  return (
    <div className={`pb-28 ${selectedTrack ? 'pt-0' : 'pt-4'} px-3 sm:px-4 max-w-md mx-auto space-y-4 animate-fadeIn`}>
      {/* Reproductor de YouTube Oculto (Fallback si Web Audio no está disponible) */}
      <div className="absolute -top-[9999px] -left-[9999px] w-1 h-1 overflow-hidden pointer-events-none">
        {useYtFallback && activeVideoId && (
          <YouTube
            videoId={activeVideoId}
            opts={{
              width: '100',
              height: '100',
              playerVars: { autoplay: 1, controls: 0, modestbranding: 1 }
            }}
            onReady={handlePlayerReady}
            onStateChange={handlePlayerStateChange}
            onError={handlePlayerError}
          />
        )}
        {audioBlobUrl && (
          <audio ref={audioPlaybackRef} src={audioBlobUrl} preload="auto" />
        )}
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* VISTA 1: EXPLORACIÓN Y CATÁLOGO DE CANCIONES                        */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {!selectedTrack ? (
        <div className="space-y-4">
          {/* Header del Catálogo */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`font-heading font-black text-2xl ${zenMode ? 'text-[#f0ebe1]' : 'text-[#2c2abc] dark:text-[#c0c1ff]'}`}>
                Karaoke & Práctica
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Canta con la letra en pantalla y mira si aciertas cada nota
              </p>
            </div>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${
              zenMode
                ? 'bg-[#26292f] text-[#e5b83b] border border-[#2e3138]'
                : 'bg-[#eff4ff] dark:bg-slate-800 text-[#4648d4] dark:text-[#c0c1ff]'
            }`}>
              <Music2 className="w-5 h-5" />
            </div>
          </div>

          {/* Barra de Búsqueda */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              {isSearching ? <Loader2 className={`w-5 h-5 animate-spin ${zenMode ? 'text-[#e5b83b]' : 'text-[#4648d4]'}`} /> : <Search className="w-5 h-5" />}
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar canción, artista o género..."
              className={`w-full bg-white dark:bg-[#102034] border border-slate-200/80 dark:border-[#1b2b3f] rounded-full py-3.5 pl-11 pr-10 text-sm font-medium text-slate-800 dark:text-[#d3e4fe] placeholder-slate-400 shadow-2xs focus:outline-none transition-colors ${
                zenMode ? 'focus:ring-2 focus:ring-[#e5b83b]' : 'focus:ring-2 focus:ring-[#4648d4]'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <LogOut className="w-4 h-4 rotate-180" />
              </button>
            )}
          </div>

          {/* Categorías de Filtro */}
          {!searchQuery && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {['Todos', 'Del Momento', 'Música Cristiana', 'Pop & Baladas', 'Urbano Latino', 'Rock en Español', 'Música Mexicana'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    audioService.playClickSound();
                    setSelectedCategory(cat);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? (zenMode
                          ? 'bg-[#e5b83b] text-[#161719] shadow-sm scale-102 font-black border border-[#f5d56b]'
                          : 'bg-[#4648d4] text-white shadow-sm scale-102')
                      : (zenMode
                          ? 'bg-[#1f2125] text-[#ded9cf] border border-[#2e3138] hover:bg-[#26292f]'
                          : 'bg-white dark:bg-[#102034] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-[#1b2b3f] hover:bg-slate-50 dark:hover:bg-slate-800')
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Lista de Canciones del Catálogo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span>
                  {searchQuery 
                    ? 'Resultados de Búsqueda' 
                    : selectedCategory === 'Todos'
                    ? `Top 100 Éxitos (${displayedCatalog.length})`
                    : selectedCategory === 'Del Momento'
                    ? `Del Momento · 100 Éxitos (${displayedCatalog.length})`
                    : selectedCategory === 'Música Cristiana'
                    ? `Música Cristiana · Top 100 (${displayedCatalog.length})`
                    : `${selectedCategory} (${displayedCatalog.length})`}
                </span>
                {!searchQuery && (
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                    zenMode
                      ? 'bg-[#26292f] text-[#e5b83b] border-[#e5b83b]/30'
                      : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${zenMode ? 'bg-[#e5b83b]' : 'bg-emerald-500'}`} />
                    En Vivo
                  </span>
                )}
              </h3>
              {isLoadingCatalog && (
                <div className={`flex items-center gap-1 text-[11px] font-medium animate-pulse ${
                  zenMode ? 'text-[#e5b83b]' : 'text-[#4648d4]'
                }`}>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Actualizando...</span>
                </div>
              )}
            </div>

            {isLoadingCatalog && displayedCatalog.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Loader2 className={`w-6 h-6 animate-spin mx-auto ${
                  zenMode ? 'text-[#e5b83b]' : 'text-[#4648d4]'
                }`} />
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Cargando catálogo musical...
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {displayedCatalog.map((track) => (
                  <motion.button
                    key={track.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectTrack(track)}
                    className="w-full bg-white dark:bg-[#102034] p-3 rounded-2xl border border-slate-100 dark:border-[#1b2b3f] shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex items-center justify-between gap-3 text-left transition-all hover:border-indigo-200 dark:hover:border-indigo-900/60 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Carátula */}
                      <div className="w-13 h-13 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 relative shadow-xs">
                        {track.thumbnail && !failedImageIds.has(track.id) ? (
                          <img
                            src={track.thumbnail}
                            alt={track.title}
                            onError={() => setFailedImageIds(prev => new Set(prev).add(track.id))}
                            className={`w-full h-full object-cover group-hover:scale-105 transition-transform ${
                              zenMode ? 'grayscale contrast-110 brightness-90' : ''
                            }`}
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${zenMode ? 'bg-[#1f2125] text-[#e5b83b]' : 'bg-indigo-50 dark:bg-slate-800 text-indigo-400'}`}>
                            <Music2 className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      {/* Info de Canción */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {track.rank && (
                            <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-md shrink-0 ${
                              zenMode
                                ? 'bg-[#26292f] text-[#f5d56b] border border-[#e5b83b]/30'
                                : track.rank === 1 
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300' 
                                : track.rank === 2
                                ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300'
                                : track.rank === 3
                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border border-orange-300'
                                : 'bg-indigo-50 dark:bg-[#0b1828] text-indigo-600 dark:text-indigo-400'
                            }`}>
                              #{track.rank}
                            </span>
                          )}
                          <h4 className="font-heading font-black text-sm text-slate-900 dark:text-white truncate">
                            {track.title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {track.artist}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`inline-block text-[9px] font-bold px-2 py-0.2 rounded-full ${
                            zenMode
                              ? 'bg-[#26292f] text-[#f5d56b] border border-[#e5b83b]/20'
                              : track.category === 'Música Cristiana'
                              ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border border-purple-200/50'
                              : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                          }`}>
                            {track.category}
                          </span>
                          {track.genre && track.genre !== track.category && (
                            <span className="inline-block text-[9px] font-medium text-slate-400 truncate">
                              • {track.genre}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Botón de Play Táctil */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors shadow-xs ${
                      zenMode
                        ? 'bg-[#26292f] text-[#e5b83b] group-hover:bg-[#e5b83b] group-hover:text-[#161719]'
                        : 'bg-[#eff4ff] dark:bg-slate-800 text-[#4648d4] dark:text-[#c0c1ff] group-hover:bg-[#4648d4] group-hover:text-white'
                    }`}>
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ═════════════════════════════════════════════════════════════════════ */
        /* VISTA 2: ESCENARIO KARAOKE INTERACTIVO (NUEVO REDISEÑO)            */
        /* ═════════════════════════════════════════════════════════════════════ */
        <div className="space-y-3.5">
          {/* Barra Superior con Regreso y Marcador de Puntos */}
          <div className="flex items-center justify-between gap-2 -mt-2.5 sm:-mt-3">
            <button
              onClick={handleExitToCatalog}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-white dark:bg-[#102034] border border-slate-200/80 dark:border-[#1b2b3f] text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors shadow-xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Catálogo</span>
            </button>

            {/* Marcador de Puntos y Multiplicador */}
            <div className="flex items-center gap-2">
              {comboCount >= 3 && (
                <motion.span
                  key={comboCount}
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-heading font-black text-[10px] tracking-wide flex items-center gap-1 shadow-xs"
                >
                  <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950 animate-pulse" />
                  <span>{comboCount} {multiplier > 1 ? `x${multiplier}` : 'Combo'}</span>
                </motion.span>
              )}
              <div className={`px-3 py-1 rounded-full font-heading font-black text-xs border ${
                zenMode
                  ? 'bg-[#26292f] border-[#2e3138] text-[#e5b83b]'
                  : 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-200/80 dark:border-indigo-800/80 text-[#2c2abc] dark:text-[#c0c1ff]'
              }`}>
                {score.toLocaleString()} pts
              </div>
            </div>
          </div>

          {/* Banner de la Canción con Carátula Ampliada y Letras Integradas */}
          <div className="relative bg-slate-950 rounded-3xl overflow-hidden shadow-xl min-h-[380px] sm:min-h-[440px] p-5 flex flex-col justify-between border border-slate-200/50 dark:border-slate-800/80">
            {/* Imagen de Fondo con Mayor Visibilidad de la Carátula */}
            {selectedTrack.thumbnail && !stageImageFailed ? (
              <img
                src={selectedTrack.thumbnail}
                alt={selectedTrack.title}
                onError={() => setStageImageFailed(true)}
                className={`absolute inset-0 w-full h-full object-cover opacity-80 filter blur-[0.5px] scale-105 ${
                  zenMode ? 'grayscale contrast-110 brightness-90' : ''
                }`}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={`absolute inset-0 ${
                zenMode ? 'bg-gradient-to-br from-[#1a1c20] via-[#141619] to-[#0f1012]' : 'bg-gradient-to-br from-indigo-950 via-slate-900 to-[#102034]'
              }`} />
            )}
            {/* Overlay Suave para que se Aprecie la Carátula Manteniendo Legibles las Letras */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/50 pointer-events-none" />

            {/* Notificaciones Flotantes de Combo Desvinculadas del Flujo */}
            <div className="absolute top-3 right-3 z-30 pointer-events-none flex flex-col items-end gap-1.5">
              <AnimatePresence>
                {comboTexts.map(c => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 8, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1.05 }}
                    exit={{ opacity: 0, y: -14, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="font-heading font-black text-xs text-amber-300 bg-black/80 backdrop-blur-md border border-amber-400/80 px-2.5 py-0.5 rounded-full shadow-lg"
                  >
                    {c.text}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* ─── ZONA CENTRAL: LETRAS SINCRONIZADAS O LETRA ESTÁTICA ─── */}
            <div className="relative z-10 my-auto py-2 text-center flex flex-col items-center justify-center space-y-2 w-full">
              {parsedLyrics.length > 0 ? (
                <div className="w-full max-w-md mx-auto space-y-2 px-1">
                  {/* Línea Anterior */}
                  <p className="text-xs sm:text-sm text-white/50 italic line-clamp-1 transition-all drop-shadow-sm">
                    {activeLyricIndex > 0 ? parsedLyrics[activeLyricIndex - 1]?.text : '...'}
                  </p>

                  {/* Línea Actual Resaltada */}
                  <div className="py-0.5">
                    <motion.h4
                      key={activeLyricIndex}
                      initial={{ scale: 0.94, opacity: 0.7 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.25 }}
                      className="font-heading font-black text-lg sm:text-xl text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] leading-snug tracking-wide"
                    >
                      "{activeLyricIndex >= 0 ? parsedLyrics[activeLyricIndex]?.text : 'Prepárate para cantar...'}"
                    </motion.h4>
                  </div>

                  {/* Línea Siguiente */}
                  <p className="text-xs sm:text-sm text-white/50 italic line-clamp-1 transition-all drop-shadow-sm">
                    {activeLyricIndex < parsedLyrics.length - 1 ? parsedLyrics[activeLyricIndex + 1]?.text : '—'}
                  </p>
                </div>
              ) : trackLyrics?.plainLyrics ? (
                /* ─── MODO LETRA ESTÁTICA SCROLLEABLE ─── */
                <div className="w-full max-w-sm mx-auto flex flex-col items-center px-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-2 rounded-full bg-black/60 backdrop-blur-md border border-indigo-400/40 text-indigo-200 text-[11px] font-heading font-black tracking-wide shadow-sm">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Letra Completa</span>
                    <span className="text-white/60 font-normal">• Sigue las notas en pantalla</span>
                  </div>
                  <div className="w-full max-h-36 sm:max-h-44 overflow-y-auto px-4 py-2.5 rounded-2xl bg-black/55 backdrop-blur-md border border-white/15 shadow-inner text-center space-y-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/30 [&::-webkit-scrollbar-thumb]:rounded-full select-text">
                    <p className="text-xs sm:text-sm text-white/95 font-medium leading-relaxed whitespace-pre-line">
                      {trackLyrics.plainLyrics}
                    </p>
                  </div>
                </div>
              ) : (
                /* ─── PISTA PURAMENTE INSTRUMENTAL O SIN LETRA ─── */
                <div className="py-2 space-y-1.5 px-3 max-w-xs mx-auto">
                  <Music2 className="w-6 h-6 text-indigo-300 mx-auto animate-bounce" />
                  <p className="text-xs sm:text-sm font-heading font-bold text-white drop-shadow-md">
                    {currentFallbackLyric}
                  </p>
                  <p className="text-[10px] text-white/60">Pista instrumental — Sigue el ritmo y las notas</p>
                </div>
              )}
            </div>

            {/* Fila Inferior: Información del Tema y Botón de Play 3D */}
            <div className="relative z-10 flex items-end justify-between gap-3 pt-2">
              <div className="space-y-1 min-w-0 max-w-[72%]">
<h3 className="font-heading font-black text-white text-base sm:text-lg leading-snug drop-shadow-md truncate">
                  {selectedTrack.title}
                </h3>
                <p className="text-xs text-slate-300 font-medium truncate">
                  {selectedTrack.artist}
                </p>
                <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                  <span className="text-[10px] bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-white font-bold border border-white/10">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                  {isDetecting && note.name && (
                    <span className="text-[10px] bg-emerald-500/90 text-white font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <CheckCircle2 className="w-3 h-3" />
                      {note.name}{note.octave}
                    </span>
                  )}
                </div>
              </div>

              {/* Botón Circular 3D de Play/Pausa */}
              <div className="relative flex flex-col items-center">
                <button
                  onClick={togglePlay}
                  className="organic-shape w-14 h-14 bg-[#4648d4] text-white flex items-center justify-center press-effect transition-all cursor-pointer shadow-[0_5px_0_0_#282a9e] group border-2 border-white/30 shrink-0"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-white ml-0 group-active:scale-90 transition-transform" />
                  ) : (
                    <Play className="w-6 h-6 fill-white ml-0.5 group-active:scale-90 transition-transform" />
                  )}
                </button>
                {autoplayBlocked && !isPlaying && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute -top-7 right-0 whitespace-nowrap bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 animate-pulse pointer-events-none"
                  >
                    <span>▶ Tocar para iniciar</span>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* ─── POLÍGRAFO DE AFINACIÓN EN TIEMPO REAL ─── */}
          <div className="bg-white dark:bg-[#102034] rounded-3xl p-3.5 border border-slate-100 dark:border-[#1b2b3f] shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Tus Notas en Pantalla
              </span>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${isDetecting ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  {isDetecting ? 'Micrófono Activo' : 'Micrófono Inactivo'}
                </span>
              </div>
            </div>

            {/* Lienzo Canvas del Polígrafo */}
            <div className="h-24 sm:h-28 w-full max-w-sm mx-auto rounded-lg overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-slate-950">
              <PolygraphCanvas
                frequency={frequency}
                isDetecting={isDetecting}
                currentTime={currentTime + syncOffset}
                melodyData={melodyData}
                onHitUpdate={handleHitUpdate}
              />
            </div>
          </div>

          {/* ─── CONTROL MINIMALISTA DE VOZ ─── */}
          <div className="bg-white dark:bg-[#102034] rounded-2xl px-4 py-2.5 border border-slate-100 dark:border-[#1b2b3f] shadow-xs flex items-center gap-3 transition-colors">
            <button
              type="button"
              onClick={() => handleSetVocalLevel(vocalLevel > 0 ? 0 : 1)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
              title={vocalLevel === 0 ? "Activar voz" : "Silenciar voz"}
            >
              {vocalLevel === 0 ? (
                <VolumeX className="w-4 h-4 text-slate-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#4648d4] dark:text-[#c0c1ff]" />
              )}
            </button>

            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
              Voz
            </span>

            <Slider
              value={[Math.round(vocalLevel * 100)]}
              min={0}
              max={100}
              step={1}
              onValueChange={(vals) => handleSetVocalLevel(vals[0] / 100)}
              className="flex-1 cursor-pointer"
            />

            <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 w-9 text-right shrink-0">
              {Math.round(vocalLevel * 100)}%
            </span>
          </div>


          {/* ─── BARRA COMPACTA: MICRÓFONO & CALIBRACIÓN DE LETRAS (CERO SCROLL) ─── */}
          <div className="bg-white dark:bg-[#102034] rounded-2xl p-2.5 px-4 border border-slate-100 dark:border-[#1b2b3f] shadow-xs flex items-center justify-between gap-3 transition-colors">
            {/* Control de Micrófono */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={toggleMic}
                className="flex items-center gap-2 cursor-pointer group"
                title={isMicEnabled ? "Desactivar Micrófono" : "Activar Micrófono"}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isMicEnabled ? 'bg-indigo-50 dark:bg-indigo-950/60 text-[#4648d4] dark:text-[#c0c1ff]' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}>
                  {isMicEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </div>
                <span className="font-heading font-semibold text-xs text-[#0b1c30] dark:text-[#d3e4fe]">
                  {isMicEnabled ? 'Micrófono Activo' : 'Micrófono Inactivo'}
                </span>
              </button>
            </div>

            {/* Ajuste fino de sincronización de letras */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#0b1828] p-1 px-2 rounded-xl border border-slate-100 dark:border-[#1b2b3f]">
              <span className="text-[10px] font-bold text-slate-400">Letras:</span>
              <button
                onClick={() => setSyncOffset(s => s - 0.5)}
                className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-colors cursor-pointer text-[11px] shadow-2xs"
                title="Atrasar letra 0.5s"
              >
                -0.5s
              </button>
              <span className="font-mono text-[11px] font-black text-[#2c2abc] dark:text-[#c0c1ff] min-w-[28px] text-center">
                {syncOffset > 0 ? `+${syncOffset}s` : `${syncOffset}s`}
              </span>
              <button
                onClick={() => setSyncOffset(s => s + 0.5)}
                className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-colors cursor-pointer text-[11px] shadow-2xs"
                title="Adelantar letra 0.5s"
              >
                +0.5s
              </button>
            </div>
          </div>

          {/* Botón Salir */}
          <button
            onClick={handleExitToCatalog}
            className="w-full bg-[#eff4ff] dark:bg-[#0b1828] text-[#2c2abc] dark:text-[#c0c1ff] border border-slate-200 dark:border-slate-800 py-3.5 rounded-full font-heading font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-100 dark:hover:bg-slate-800 active:scale-98 transition-all cursor-pointer shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Elegir Otra Canción</span>
          </button>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* OVERLAY DE CARGA DE PISTA                                           */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isLoadingTrack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              transition={{ duration: 0.25 }}
              className="bg-white dark:bg-[#102034] rounded-3xl p-6 sm:p-7 max-w-xs sm:max-w-sm w-full space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col items-center relative overflow-hidden"
            >
              {/* Resplandores decorativos de fondo */}
              <div className="absolute -top-12 -left-12 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-28 h-28 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Spinner animado */}
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center shadow-xs">
                  <Loader2 className="w-7 h-7 text-[#4648d4] dark:text-[#c0c1ff] animate-spin" />
                </div>
              </div>

              {/* Título & Estado Técnico */}
              <div className="space-y-1 w-full text-center">
                <h4 className="font-heading font-black text-lg text-slate-900 dark:text-white">
                  Preparando Escenario
                </h4>
                {loadingStatusMsg && (
                  <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    <span>{loadingStatusMsg}</span>
                  </p>
                )}
              </div>

              {/* Burbuja con los 10 textos rotativos con animación fluida */}
              <div className="w-full bg-slate-50 dark:bg-[#0b1828] rounded-2xl p-3.5 sm:p-4 border border-slate-100 dark:border-slate-800/80 min-h-[78px] flex items-center justify-center shadow-2xs">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={loadingTipIndex}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="text-xs font-heading font-medium text-slate-700 dark:text-slate-200 leading-relaxed text-center"
                  >
                    "{LOADING_TIPS[loadingTipIndex]}"
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Indicador de progreso de puntos */}
              <div className="flex items-center justify-center gap-1 pt-0.5">
                {LOADING_TIPS.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      idx === loadingTipIndex
                        ? 'w-4 bg-[#4648d4] dark:bg-[#818cf8]'
                        : 'w-1 bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* MODAL DE RESULTADOS AL TERMINAR LA CANCIÓN                           */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isFinished && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 text-center"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-[#102034] rounded-3xl p-6 max-w-sm w-full space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative"
            >
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 border-2 border-amber-400 flex items-center justify-center mx-auto shadow-md">
                <Trophy className="w-8 h-8 text-amber-500 animate-bounce" />
              </div>

              <div className="space-y-1">
                <h3 className="font-heading font-black text-2xl text-slate-900 dark:text-white">
                  ¡Gran Interpretación!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Has completado <strong className="text-indigo-600 dark:text-indigo-400">{selectedTrack?.title}</strong>
                </p>
              </div>

              {/* Estrellas Obtenidas */}
              <div className="flex justify-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((starIdx) => (
                  <Star
                    key={starIdx}
                    className={`w-7 h-7 ${
                      starIdx <= earnedStars
                        ? 'text-amber-400 fill-amber-400 scale-110 drop-shadow-md'
                        : 'text-slate-300 dark:text-slate-700'
                    } transition-all`}
                  />
                ))}
              </div>

              {/* Puntuación y Mejor Racha */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-[#eff4ff] dark:bg-[#0b1828] rounded-2xl border border-indigo-100 dark:border-indigo-900/60 flex flex-col items-center justify-center">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                    Puntaje Total
                  </span>
                  <p className="text-xl sm:text-2xl font-heading font-black text-[#2c2abc] dark:text-[#c0c1ff]">
                    {score.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200/80 dark:border-amber-800/60 flex flex-col items-center justify-center">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
                    Mejor Racha
                  </span>
                  <p className="text-xl sm:text-2xl font-heading font-black text-amber-600 dark:text-amber-400">
                    {maxComboRef.current}
                  </p>
                </div>
              </div>

              {/* Resultado en Vidas */}
              {isCourtesySongActive ? (
                <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-bold text-center">
                  <span>Canción de cortesía finalizada (No otorga vidas)</span>
                </div>
              ) : earnedStars <= 2 ? (
                <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-center gap-2">
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  <span>Desempeño bajo: -1 Vida</span>
                </div>
              ) : earnedStars === 5 ? (
                <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                  <Heart className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                  <span>¡5 Estrellas de excelencia! +1 Vida ganada</span>
                </div>
              ) : (
                <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold text-center">
                  <span>Buen intento • Vidas protegidas</span>
                </div>
              )}

              {/* Botones de Acción */}
              <div className="space-y-2 pt-2">
                {audioBlobUrl && (
                  <button
                    onClick={handlePlayRecording}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md hover:brightness-105 active:scale-98 transition-all"
                  >
                    <Headphones className="w-4 h-4" />
                    <span>Escuchar mi Grabación</span>
                  </button>
                )}

                {(userStats.lives ?? 1) > 0 ? (
                  <button
                    onClick={() => {
                      setIsFinished(false);
                      setScore(0);
                      setComboCount(0);
                      setMultiplier(1);
                      hitFramesCountRef.current = 0;
                      missFramesCountRef.current = 0;
                      maxComboRef.current = 0;
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
                        startPitchDetection();
                      }
                    }}
                    className="w-full py-3 rounded-xl bg-[#4648d4] text-white font-heading font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_0_0_#282a9e] hover:brightness-105 active:scale-98 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Cantar de Nuevo</span>
                  </button>
                ) : (
                  <>
                    {onOpenRecoveryExam && (
                      <button
                        onClick={() => {
                          audioService.playClickSound();
                          setIsFinished(false);
                          handleExitToCatalog();
                          onOpenRecoveryExam();
                        }}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition-all"
                      >
                        <Zap className="w-4 h-4 text-emerald-200 fill-emerald-200" />
                        <span>Entrenar para ganar 1 vida (Gratis)</span>
                      </button>
                    )}
                    {onOpenStore && (
                      <button
                        onClick={() => {
                          audioService.playClickSound();
                          setIsFinished(false);
                          handleExitToCatalog();
                          onOpenStore();
                        }}
                        className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-heading font-bold text-xs cursor-pointer transition-colors"
                      >
                        Recargar en la Tienda
                      </button>
                    )}
                  </>
                )}

                <button
                  onClick={handleExitToCatalog}
                  className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-heading font-bold text-xs cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Elegir Otra Canción
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Modal: Sin Vidas en Karaoke (Cortesía ya consumida) ─── */}
      {showNoLivesModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className={`rounded-3xl p-6 max-w-sm w-full space-y-4 border shadow-2xl text-center ${
            zenMode
              ? 'bg-[#1f2125] border-[#2e3138]'
              : 'bg-white dark:bg-[#102034] border-rose-200 dark:border-rose-900/60'
          }`}>
            <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center mx-auto text-rose-500 shadow-sm">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-heading font-black text-slate-800 dark:text-white">
                Sin Vidas para Cantar
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Has agotado tu canción de cortesía. Para seguir cantando en el karaoke, requieres al menos 1 vida.
              </p>
            </div>

            {/* Passive timer countdown */}
            <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-left max-w-xs mx-auto ${
              zenMode
                ? 'bg-[#22252a] border-[#2e3138]'
                : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/40'
            }`}>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Recarga pasiva en
                </span>
              </div>
              <span className="text-xs font-mono font-black text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg">
                {timeToNextLife.formatted}
              </span>
            </div>

            <div className="space-y-2 pt-2">
              {onOpenRecoveryExam && (
                <button
                  onClick={() => {
                    audioService.playClickSound();
                    setShowNoLivesModal(false);
                    onOpenRecoveryExam();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-heading font-bold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-emerald-200 fill-emerald-200" />
                  <span>Entrenar para ganar 1 vida (Gratis)</span>
                </button>
              )}

              {onOpenStore && (
                <button
                  onClick={() => {
                    audioService.playClickSound();
                    setShowNoLivesModal(false);
                    onOpenStore();
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl font-heading font-bold text-xs border active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    zenMode
                      ? 'bg-[#26292f] text-[#ded9cf] hover:bg-[#2e323a] border-[#383c44]'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>Recargar en la Tienda</span>
                </button>
              )}

              <button
                onClick={() => {
                  audioService.playClickSound();
                  setShowNoLivesModal(false);
                }}
                className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                Volver al catálogo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticaView;

