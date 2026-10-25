'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { YouTubeProps } from 'react-youtube';
import { motion } from 'motion/react';
const YouTube = dynamic<YouTubeProps>(() => import('react-youtube').then((mod) => mod.default as any), { ssr: false });
import { ArrowLeft, Zap } from 'lucide-react';
import { audioService } from '../utils/audioService';
import { fetchLyrics, TrackLyrics, LyricLine } from '../lib/fetch-lyrics';
import { getTimeToNextLife, MAX_LIVES } from '../utils/livesEngine';
import { CatalogTrack, PracticaViewProps } from './practica/practicaTypes';
import {
  RECOMMENDED_TRACKS,
  DEFAULT_SECULAR_TRACKS,
  DEFAULT_CHRISTIAN_TRACKS,
  FALLBACK_LYRICS,
  LOADING_TIPS
} from './practica/practicaCatalogData';
import { PracticaCatalogView } from './practica/PracticaCatalogView';
import { KaraokeStageHero } from './practica/KaraokeStageHero';
import { KaraokeControlsPanel } from './practica/KaraokeControlsPanel';
import { KaraokeLoadingOverlay } from './practica/KaraokeLoadingOverlay';
import { KaraokeResultsModal } from './practica/KaraokeResultsModal';
import { KaraokeNoLivesModal } from './practica/KaraokeNoLivesModal';
import { useKaraokeEngine } from './practica/useKaraokeEngine';
import {
  YtSearchVideo,
  getTopYtMatches,
  getQualifyingYtMatches
} from './practica/pickBestYtMatch';
import { rankSongSearch } from './practica/songSearchRank';
import { VideoPickerModal } from './practica/VideoPickerModal';

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

  // Picker de las 2 mejores versiones de YouTube al abrir una canción nueva
  const [videoOptions, setVideoOptions] = useState<YtSearchVideo[] | null>(null);
  const [videoOptionsCacheKey, setVideoOptionsCacheKey] = useState<string>('');

  // Complemento de canción específica traído desde la búsqueda de YouTube
  const [ytComplement, setYtComplement] = useState<CatalogTrack | null>(null);
  const [isSongSearch, setIsSongSearch] = useState<boolean>(false);
  const ytVideoIdByTrackIdRef = useRef<Map<string, string>>(new Map());
  // Nombre limpio (título sin "(cover)" etc. + artista real) por tarjeta yt_
  const ytCleanNamesRef = useRef<Map<string, { title: string; artist: string }>>(new Map());
  const loadingTrackIdRef = useRef<string | null>(null);

  const [timeToNextLife, setTimeToNextLife] = useState<{ remainingMs: number; formatted: string }>(() =>
    getTimeToNextLife(userStats)
  );

  useEffect(() => {
    if (!showNoLivesModal || (userStats.lives ?? MAX_LIVES) >= MAX_LIVES) return;
    setTimeToNextLife(getTimeToNextLife(userStats));
    const timer = setInterval(() => {
      setTimeToNextLife(getTimeToNextLife(userStats));
    }, 1000);
    return () => clearInterval(timer);
  }, [showNoLivesModal, userStats]);

  // ─── Estado de Catálogo y Búsqueda ───
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<CatalogTrack[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [top100Tracks, setTop100Tracks] = useState<CatalogTrack[]>(RECOMMENDED_TRACKS);
  const [secularTracks, setSecularTracks] = useState<CatalogTrack[]>(DEFAULT_SECULAR_TRACKS);
  const [christianTracks, setChristianTracks] = useState<CatalogTrack[]>(DEFAULT_CHRISTIAN_TRACKS);
  const [allTracks, setAllTracks] = useState<CatalogTrack[]>(() => [...DEFAULT_SECULAR_TRACKS, ...DEFAULT_CHRISTIAN_TRACKS]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(false);

  // ─── Estado de Carga y Selección de Pista ───
  const [selectedTrack, setSelectedTrack] = useState<CatalogTrack | null>(null);
  const [isLoadingTrack, setIsLoadingTrack] = useState<boolean>(false);
  const [loadingStatusMsg, setLoadingStatusMsg] = useState<string>('');
  const [loadingTipIndex, setLoadingTipIndex] = useState<number>(0);
  const [stageImageFailed, setStageImageFailed] = useState<boolean>(false);

  // ─── Estado de Letras ───
  const [trackLyrics, setTrackLyrics] = useState<TrackLyrics | null>(null);
  const [parsedLyrics, setParsedLyrics] = useState<LyricLine[]>([]);

  // ─── Motor de Karaoke (Web Audio, Pitch, Grabación, Puntos) ───
  const engine = useKaraokeEngine({
    selectedTrack,
    isCourtesySongActive,
    onLoseLife,
    onGainLife,
    onUpdateQuestProgress
  });

  const lastFirstTipRef = useRef<number>(-1);
  const lastShownTipRef = useRef<number>(-1);

  // Cita motivacional aleatoria fija por pista
  const currentFallbackLyric = useMemo(() => {
    return FALLBACK_LYRICS[Math.floor(Math.random() * FALLBACK_LYRICS.length)];
  }, [selectedTrack?.id]);

  // Scroll to top al seleccionar canción
  useEffect(() => {
    if (selectedTrack) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [selectedTrack]);

  // Cargar catálogo desde la API
  // Limpia videoIds viejos guardados sin validar (podrían estar equivocados)
  useEffect(() => {
    try {
      const legacyKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('yt_audio_') && !key.startsWith('yt_audio_v2_')) {
          legacyKeys.push(key);
        }
      }
      legacyKeys.forEach((key) => localStorage.removeItem(key));
    } catch {
      // localStorage bloqueado: no es crítico
    }
  }, []);

  useEffect(() => {
    setIsLoadingCatalog(true);
    fetch('/api/top-tracks')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (data.top100 && Array.isArray(data.top100) && data.top100.length > 0) {
            setTop100Tracks(data.top100);
            if (Array.isArray(data.secular100) && data.secular100.length > 0) {
              setSecularTracks(data.secular100);
            }
            if (Array.isArray(data.christian100) && data.christian100.length > 0) {
              setChristianTracks(data.christian100);
            }
            if (Array.isArray(data.allTracks) && data.allTracks.length > 0) {
              setAllTracks(data.allTracks);
            }
          } else if (Array.isArray(data) && data.length > 0) {
            setTop100Tracks(data);
            setAllTracks(data);
          }
        }
      })
      .catch((err) => console.warn('Error cargando catálogo:', err))
      .finally(() => setIsLoadingCatalog(false));
  }, []);

  // Rotación aleatoria de tips durante la carga
  useEffect(() => {
    if (!isLoadingTrack) return;

    const generateShuffledIndices = (excludeFirst?: number) => {
      const indices = Array.from({ length: LOADING_TIPS.length }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
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

  // Normalizador de texto para búsqueda insensible a acentos, mayúsculas y espacios
  const normalizeForSearch = useCallback((str: string) => {
    return (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }, []);

  // Búsqueda en iTunes (Debounced)
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      setIsSongSearch(false);
      setYtComplement(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/itunes-search?q=${encodeURIComponent(trimmed)}`);
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
            // Solo ESA canción: oficial + complemento; nada que sea otra
            // canción solo porque coincida el artista
            const ranked = rankSongSearch(mapped, trimmed);
            setIsSongSearch(ranked.length > 0);
            setYtComplement(null);
            setSearchResults(ranked.length > 0 ? ranked : mapped);
          }
        }
      } catch (err) {
        console.warn('Error en búsqueda de iTunes:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Complemento desde YouTube: cuando una búsqueda de canción específica
  // solo trae 1 resultado válido, pedimos a yt-search las alternativas y
  // agregamos la mejor como segunda tarjeta (aunque no traiga carátula).
  useEffect(() => {
    if (!isSongSearch || searchResults.length >= 2 || !searchResults[0]) {
      setYtComplement((prev) => (prev ? null : prev));
      return;
    }

    const baseTrack = searchResults[0];
    let cancelled = false;

    // Quita marcadores de versión del título ("(Cover)", etc.) y las colas
    // de video tipo "A su tiempo || arisa (letra)" para no contaminar el
    // query de YouTube ni el puntaje de match
    const cleanedTitle =
      baseTrack.title
        .split('|')[0]
        .replace(/\((?:cover|live|remix|acoustic|acustic[oa]s?|en vivo|karaoke)\s*[^)]*\)/gi, '')
        .trim() ||
      baseTrack.title;

    fetch(`/api/yt-search?q=${encodeURIComponent(`${baseTrack.artist} ${cleanedTitle} audio`)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((videos) => {
        if (cancelled) return;
        const matches = Array.isArray(videos)
          ? getQualifyingYtMatches(videos, baseTrack.artist, cleanedTitle, 1)
          : [];
        const best = matches[0];
        if (!(best && best.id)) return;

        const trackId = `yt_${best.id}`;
        const complementKey = `${normalizeForSearch(best.title)}|${
          normalizeForSearch(best.channel || baseTrack.artist)
        }`;
        const baseKey = `${normalizeForSearch(baseTrack.title)}|${normalizeForSearch(baseTrack.artist)}`;
        if (complementKey === baseKey) return; // duplicado de la ya mostrada

        ytVideoIdByTrackIdRef.current.set(trackId, best.id);
        ytCleanNamesRef.current.set(trackId, {
          title: cleanedTitle,
          artist: baseTrack.artist
        });
        setYtComplement({
          id: trackId,
          title: best.title,
          artist: best.channel || baseTrack.artist,
          thumbnail: best.thumbnail || '',
          category: baseTrack.category || 'Pop Latino'
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isSongSearch, searchResults, searchQuery, normalizeForSearch]);

  // Catálogo filtrado (Instantáneo en local + iTunes)
  const displayedCatalog = useMemo(() => {
    const q = normalizeForSearch(searchQuery);

    if (q) {
      // 1. Buscar de inmediato en todo el catálogo local (secular, cristiano y top 100)
      const seenKeys = new Set<string>();
      const combinedPool = [...allTracks, ...top100Tracks].filter((t) => {
        const key = `${normalizeForSearch(t.title)}|${normalizeForSearch(t.artist)}`;
        if (seenKeys.has(key)) return false;
        seenKeys.add(key);
        return true;
      });

      const localMatches = combinedPool.filter((t) => {
        const titleNorm = normalizeForSearch(t.title);
        const artistNorm = normalizeForSearch(t.artist);
        const genreNorm = normalizeForSearch(t.genre || '');
        const catNorm = normalizeForSearch(t.category || '');
        return (
          titleNorm.includes(q) ||
          artistNorm.includes(q) ||
          genreNorm.includes(q) ||
          catNorm.includes(q)
        );
      });

      // 2. Anexar resultados externos de iTunes sin duplicar
      const merged = [...localMatches];
      if (searchResults.length > 0) {
        for (const ext of searchResults) {
          const key = `${normalizeForSearch(ext.title)}|${normalizeForSearch(ext.artist)}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            merged.push(ext);
          }
        }
      }

      // Solo ESA canción: oficial + complemento (si nada califica —
      // búsquedas de artista/género — la lista unida queda tal cual)
      const ranked = rankSongSearch(merged, searchQuery);
      if (ranked.length > 0) {
        const withComplement = [...ranked];
        if (
          ytComplement &&
          !withComplement.some(
            (t) =>
              `${normalizeForSearch(t.title)}|${normalizeForSearch(t.artist)}` ===
              `${normalizeForSearch(ytComplement.title)}|${normalizeForSearch(ytComplement.artist)}`
          )
        ) {
          withComplement.push(ytComplement);
        }
        return withComplement;
      }
      return merged;
    }

    // Modo normal sin búsqueda: filtrar por pestañas de categoría
    if (selectedCategory === 'Todos') {
      return top100Tracks;
    }
    if (selectedCategory === 'Del Momento') {
      return secularTracks.length > 0 ? secularTracks : top100Tracks.filter((t) => t.category === 'Del Momento');
    }
    if (selectedCategory === 'Música Cristiana') {
      return christianTracks.length > 0
        ? christianTracks
        : top100Tracks.filter((t) => t.category === 'Música Cristiana');
    }
    return allTracks.filter((t) => t.genre === selectedCategory || t.category === selectedCategory);
  }, [
    searchQuery,
    normalizeForSearch,
    searchResults,
    selectedCategory,
    top100Tracks,
    secularTracks,
    christianTracks,
    allTracks,
    ytComplement
  ]);

  // Arranca la reproducción con el videoId ya elegido (mismo flujo que
  // siempre: initAudio → play → detección de tono → melodía).
  const startKaraokePlayback = async (videoId: string) => {
    try {
      engine.setActiveVideoId(videoId);

      await engine.vocalRemover.initAudio(videoId, engine.vocalLevel, 1.4, true);
      engine.vocalRemover.setMasterVolume(engine.volume);

      const started = await engine.vocalRemover.play();
      if (started) {
        engine.setIsPlaying(true);
        engine.setAutoplayBlocked(false);
        if (engine.isMicEnabled && !engine.isDetecting && !engine.isPlaybackMode) {
          engine.startPitchDetection(engine.vocalRemover.getAudioContext());
        }
      } else {
        engine.setAutoplayBlocked(true);
      }

    } catch (err) {
      console.warn('Error resolviendo audio oficial:', err);
      engine.setUseYtFallback(true);
      engine.setActiveVideoId('1q3ND4XPzIg');
    } finally {
      setIsLoadingTrack(false);
      setLoadingStatusMsg('');
    }
  };

  // El usuario eligió una de las 2 mejores versiones del picker
  const handleChooseVideo = async (video: YtSearchVideo) => {
    setVideoOptions(null);
    const cacheKey = videoOptionsCacheKey;
    if (!video?.id || !cacheKey) return;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(cacheKey, video.id);
      }
    } catch {
      // localStorage bloqueado: reproducimos igual
    }
    setIsLoadingTrack(true);
    setLoadingStatusMsg('Preparando pista y reproductor...');
    await startKaraokePlayback(video.id);
  };

  // Selección de canción y resolución
  const handleSelectTrack = async (track: CatalogTrack) => {
    audioService.playClickSound();

    if ((userStats.lives ?? 1) <= 0) {
      if (userStats.hasUsedCourtesySong) {
        audioService.playSadDefeatSound();
        setShowNoLivesModal(true);
        return;
      }
      setIsCourtesySongActive(true);
      if (onUseCourtesySong) {
        onUseCourtesySong();
      }
    } else {
      setIsCourtesySongActive(false);
    }

    setIsLoadingTrack(true);
    setLoadingStatusMsg('Buscando pista de estudio...');
    setStageImageFailed(false);
    engine.resetKaraokeSession();

    // Tarjetas de YouTube: la etapa, el cache y las letras se muestran con
    // el título/artista LIMPIOS de la canción real (sin "|| arisa (letra)"
    // ni el nombre del canal). Si no encuentra sincronización, las letras
    // estáticas salen de la canción correcta igual.
    let songTitle = track.title;
    let songArtist = track.artist;
    if (track.id.startsWith('yt_')) {
      const clean = ytCleanNamesRef.current.get(track.id);
      if (clean) {
        songTitle = clean.title;
        songArtist = clean.artist;
      }
    }
    setSelectedTrack({ ...track, title: songTitle, artist: songArtist });

    const normArtist = songArtist.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const normTitle = songTitle.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const queryKey = `${normArtist} ${normTitle} audio`;
    // Prefijo v2: los IDs cacheados con el prefijo viejo ya no se leen
    const cacheKey = `yt_audio_v2_${normArtist}_${normTitle}`;

    setLoadingStatusMsg('Preparando pista y reproductor...');
    let resolvedVideoId: string | null = null;
    if (typeof window !== 'undefined') {
      resolvedVideoId = localStorage.getItem(cacheKey);
    }

    // Tarjetas inyectadas desde YouTube ya traen el videoId resuelto
    if (!resolvedVideoId && track.id.startsWith('yt_')) {
      const mappedId = ytVideoIdByTrackIdRef.current.get(track.id);
      if (mappedId) {
        resolvedVideoId = mappedId;
        if (typeof window !== 'undefined') {
          localStorage.setItem(cacheKey, mappedId);
        }
      }
    }

    try {
      const [lyricsRes, searchRes] = await Promise.all([
        fetchLyrics(songTitle, songArtist).catch(() => null),
        resolvedVideoId
          ? Promise.resolve(null)
          : fetch(`/api/yt-search?q=${encodeURIComponent(queryKey)}`)
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null)
      ]);

      if (lyricsRes) {
        setTrackLyrics(lyricsRes);
        setParsedLyrics(lyricsRes.parsedLyrics || []);
      } else {
        setTrackLyrics(null);
        setParsedLyrics([]);
      }

      // Versión ya elegida y cacheada: reproducción directa
      if (resolvedVideoId) {
        await startKaraokePlayback(resolvedVideoId);
        return;
      }

      // Versión nueva: mostramos las 2 mejores opciones para que el
      // usuario elija (YouTube a veces desplaza la correcta).
      if (Array.isArray(searchRes) && searchRes.length > 0) {
        const topMatches = getTopYtMatches(searchRes, songArtist, songTitle, 2);
        if (topMatches.length >= 2) {
          setVideoOptions(topMatches);
          setVideoOptionsCacheKey(cacheKey);
          return;
        }
        // Un solo resultado válido: se juega directo
        const onlyOne = topMatches[0] || searchRes[0];
        if (onlyOne?.id) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(cacheKey, String(onlyOne.id));
          }
          await startKaraokePlayback(String(onlyOne.id));
          return;
        }
      }

      // Sin resultados en YouTube: pista de respaldo histórica
      await startKaraokePlayback('1q3ND4XPzIg');
    } catch (err) {
      console.warn('Error resolviendo audio oficial:', err);
      engine.setUseYtFallback(true);
      engine.setActiveVideoId('1q3ND4XPzIg');
    } finally {
      setIsLoadingTrack(false);
      setLoadingStatusMsg('');
    }
  };

  const handleExitToCatalog = useCallback(() => {
    audioService.playClickSound();
    engine.resetKaraokeSession();
    setSelectedTrack(null);
  }, [engine]);

  // Sincronización de Letras de 3 Líneas
  const activeLyricIndex = useMemo(() => {
    if (parsedLyrics.length === 0) return -1;
    const adjustedTime = engine.currentTime + engine.syncOffset;
    return parsedLyrics.findIndex((line, idx) => {
      const nextLine = parsedLyrics[idx + 1];
      return adjustedTime >= line.time && (!nextLine || adjustedTime < nextLine.time);
    });
  }, [parsedLyrics, engine.currentTime, engine.syncOffset]);

  return (
    <div
      className={`pb-6 ${
        selectedTrack ? 'pt-0' : 'pt-2'
      } px-3 sm:px-4 max-w-md mx-auto space-y-4 animate-fadeIn`}
    >
      {/* Reproductor YouTube Oculto para fallback */}
      <div className="absolute -top-[9999px] -left-[9999px] w-1 h-1 overflow-hidden pointer-events-none">
        {engine.useYtFallback && engine.activeVideoId && (
          <YouTube
            videoId={engine.activeVideoId}
            opts={{
              width: '100',
              height: '100',
              playerVars: { autoplay: 1, controls: 0, modestbranding: 1 }
            }}
            onReady={engine.handlePlayerReady}
            onStateChange={engine.handlePlayerStateChange}
            onError={engine.handlePlayerError}
          />
        )}
        {engine.audioBlobUrl && (
          <audio ref={engine.audioPlaybackRef} src={engine.audioBlobUrl} preload="auto" />
        )}
      </div>

      {/* ─── VISTA 1: EXPLORACIÓN Y CATÁLOGO DE CANCIONES ─── */}
      {!selectedTrack ? (
        <PracticaCatalogView
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            audioService.playClickSound();
            setSelectedCategory(cat);
          }}
          displayedCatalog={displayedCatalog}
          isLoadingCatalog={isLoadingCatalog}
          isSearching={isSearching}
          onSelectTrack={handleSelectTrack}
          zenMode={zenMode}
        />
      ) : (
        /* ─── VISTA 2: ESCENARIO KARAOKE INTERACTIVO ─── */
        <div className="space-y-3.5">
          {/* Barra Superior con Regreso y Marcador de Puntos */}
          <div className="flex items-center justify-between gap-2 -mt-2.5 sm:-mt-3">
            <button
              onClick={handleExitToCatalog}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-white dark:bg-[#102034] border border-slate-200/80 dark:border-[#1b2b3f] text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors shadow-xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Catálogo</span>
            </button>

            {/* Marcador de Puntos y Multiplicador */}
            <div className="flex items-center gap-2">
              {engine.comboCount >= 3 && (
                <motion.span
                  key={engine.comboCount}
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-heading font-black text-[10px] tracking-wide flex items-center gap-1 shadow-xs"
                >
                  <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950 animate-pulse" />
                  <span>
                    {engine.comboCount} {engine.multiplier > 1 ? `x${engine.multiplier}` : 'Combo'}
                  </span>
                </motion.span>
              )}
              <div
                className={`px-3 py-1 rounded-full font-heading font-black text-xs border ${
                  zenMode
                    ? 'bg-[#26292f] border-[#2e3138] text-[#e5b83b]'
                    : 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-200/80 dark:border-indigo-800/80 text-[#2c2abc] dark:text-[#c0c1ff]'
                }`}
              >
                {engine.score.toLocaleString()} pts
              </div>
            </div>
          </div>

          {/* Banner de la Canción con Carátula y Letras Integradas */}
          <KaraokeStageHero
            selectedTrack={selectedTrack}
            stageImageFailed={stageImageFailed}
            onStageImageError={() => setStageImageFailed(true)}
            comboTexts={engine.comboTexts}
            parsedLyrics={parsedLyrics}
            activeLyricIndex={activeLyricIndex}
            plainLyrics={trackLyrics?.plainLyrics}
            fallbackLyric={currentFallbackLyric}
            currentTime={engine.currentTime}
            duration={engine.duration}
            isPlaying={engine.isPlaying}
            onTogglePlay={engine.togglePlay}
            autoplayBlocked={engine.autoplayBlocked}
            isDetecting={engine.isDetecting}
            noteName={engine.note.name}
            noteOctave={engine.note.octave}
            zenMode={zenMode}
          />

          {/* Controles de Afinación, Polígrafo y Sincronización */}
          <KaraokeControlsPanel
            frequency={engine.frequency}
            isDetecting={engine.isDetecting}
            currentTime={engine.currentTime}
            syncOffset={engine.syncOffset}
            onHitUpdate={engine.handleHitUpdate}
            vocalLevel={engine.vocalLevel}
            onSetVocalLevel={engine.handleSetVocalLevel}
            useYtFallback={engine.useYtFallback}
            isMicEnabled={engine.isMicEnabled}
            onToggleMic={engine.toggleMic}
            onSetSyncOffset={engine.setSyncOffset}
            onExitToCatalog={handleExitToCatalog}
          />
        </div>
      )}

      {/* ─── OVERLAY DE CARGA ─── */}
      <KaraokeLoadingOverlay
        isLoadingTrack={isLoadingTrack}
        loadingStatusMsg={loadingStatusMsg}
        loadingTipIndex={loadingTipIndex}
        loadingTips={LOADING_TIPS}
      />

      {/* ─── MODAL DE RESULTADOS ─── */}
      <KaraokeResultsModal
        isFinished={engine.isFinished}
        trackTitle={selectedTrack?.title}
        earnedStars={engine.earnedStars}
        score={engine.score}
        maxCombo={engine.maxCombo}
        isCourtesySongActive={isCourtesySongActive}
        userLives={userStats.lives ?? 1}
        audioBlobUrl={engine.audioBlobUrl}
        onPlayRecording={engine.handlePlayRecording}
        onReplaySong={engine.handleReplaySong}
        onExitToCatalog={handleExitToCatalog}
        onOpenRecoveryExam={onOpenRecoveryExam}
        onOpenStore={onOpenStore}
      />

      {/* ─── MODAL DE SIN VIDAS ─── */}
      <KaraokeNoLivesModal
        isOpen={showNoLivesModal}
        timeToNextLifeFormatted={timeToNextLife.formatted}
        onClose={() => setShowNoLivesModal(false)}
        onOpenRecoveryExam={onOpenRecoveryExam}
        onOpenStore={onOpenStore}
        zenMode={zenMode}
      />

      {/* ─── MODAL DE 2 MEJORES VERSIONES ─── */}
      <VideoPickerModal
        isOpen={videoOptions !== null}
        options={videoOptions || []}
        track={
          selectedTrack
            ? { artist: selectedTrack.artist, title: selectedTrack.title }
            : null
        }
        zenMode={zenMode}
        onSelect={handleChooseVideo}
        onClose={() => {
          // videoOptions captura SIEMPRE: era el bug del modal pegado
          setVideoOptions(null);
          engine.resetKaraokeSession();
          setSelectedTrack(null);
        }}
      />
    </div>
  );
};

export default PracticaView;
