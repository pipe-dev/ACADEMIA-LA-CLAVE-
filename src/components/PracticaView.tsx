'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { YouTubeProps } from 'react-youtube';
import { motion } from 'motion/react';
const YouTube = dynamic<YouTubeProps>(() => import('react-youtube').then((mod) => mod.default as any), { ssr: false });
import { ArrowLeft, Zap } from 'lucide-react';
import { audioService } from '../utils/audioService';
import { fetchLyrics, TrackLyrics, LyricLine } from '../lib/fetch-lyrics';
import { NoteData } from './practica/polygraph-canvas';
import { getTimeToNextLife, MAX_LIVES } from '../utils/livesEngine';
import { CatalogTrack, PracticaViewProps } from './practica/practicaTypes';
import {
  RECOMMENDED_TRACKS,
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
  const [secularTracks, setSecularTracks] = useState<CatalogTrack[]>([]);
  const [christianTracks, setChristianTracks] = useState<CatalogTrack[]>([]);
  const [allTracks, setAllTracks] = useState<CatalogTrack[]>(RECOMMENDED_TRACKS);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(false);

  // ─── Estado de Carga y Selección de Pista ───
  const [selectedTrack, setSelectedTrack] = useState<CatalogTrack | null>(null);
  const [isLoadingTrack, setIsLoadingTrack] = useState<boolean>(false);
  const [loadingStatusMsg, setLoadingStatusMsg] = useState<string>('');
  const [loadingTipIndex, setLoadingTipIndex] = useState<number>(0);
  const [stageImageFailed, setStageImageFailed] = useState<boolean>(false);

  // ─── Estado de Letras y Melodía ───
  const [trackLyrics, setTrackLyrics] = useState<TrackLyrics | null>(null);
  const [parsedLyrics, setParsedLyrics] = useState<LyricLine[]>([]);
  const [melodyData, setMelodyData] = useState<NoteData[]>([]);

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

  // Búsqueda en iTunes (Debounced)
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

  // Catálogo filtrado
  const displayedCatalog = useMemo(() => {
    if (searchQuery.trim() && searchResults.length > 0) {
      return searchResults;
    }
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
  }, [searchQuery, searchResults, selectedCategory, top100Tracks, secularTracks, christianTracks, allTracks]);

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
    setSelectedTrack(track);
    setStageImageFailed(false);
    engine.resetKaraokeSession();

    const normArtist = track.artist.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const normTitle = track.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const queryKey = `${normArtist} ${normTitle} audio`;
    const cacheKey = `yt_audio_${normArtist}_${normTitle}`;

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

      if (!resolvedVideoId && Array.isArray(searchRes) && searchRes.length > 0 && searchRes[0].id) {
        resolvedVideoId = String(searchRes[0].id);
        if (typeof window !== 'undefined') {
          localStorage.setItem(cacheKey, resolvedVideoId);
        }
      }

      const finalVideoId = resolvedVideoId || '1q3ND4XPzIg';
      engine.setActiveVideoId(finalVideoId);

      await engine.vocalRemover.initAudio(finalVideoId, engine.vocalLevel, 1.4, true);
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

      fetch(`/api/karaoke-melody?videoId=${finalVideoId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((mData) => {
          if (mData && Array.isArray(mData.notes)) {
            setMelodyData(mData.notes);
          } else {
            setMelodyData([]);
          }
        })
        .catch(() => setMelodyData([]));
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
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-white dark:bg-[#102034] border border-slate-200/80 dark:border-[#1b2b3f] text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors shadow-xs cursor-pointer"
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
            melodyData={melodyData}
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
    </div>
  );
};

export default PracticaView;
