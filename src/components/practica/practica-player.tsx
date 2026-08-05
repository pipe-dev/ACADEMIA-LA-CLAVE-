"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { TrackLyrics } from "@/lib/fetch-lyrics";
import { SyncedLyrics } from "./synced-lyrics";
import { PolygraphCanvas } from "./polygraph-canvas";
import { usePitchDetection } from "@/hooks/use-pitch-detection";
import { saveKaraokeScore } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import { PlayerControls } from "./player-controls";
import YouTube, { YouTubeEvent, YouTubePlayer } from "react-youtube";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";

interface PracticaPlayerProps {
  track: TrackLyrics;
  videoId: string;
  onClose: () => void;
}

export function PracticaPlayer({ track, videoId, onClose }: PracticaPlayerProps) {
  const [syncOffset, setSyncOffset] = useState(0); 
  const [isSyncing, setIsSyncing] = useState(true);
  const [score, setScore] = useState(0); // Mantenemos para el final
  
  // Mensaje motivacional rotativo si no hay letra
  const fallbackLyric = useMemo(() => {
    if (track.plainLyrics) return track.plainLyrics;
    const fallbacks = [
      "🎵\n\nSigue el ritmo de la melodía\n¡Tu voz es el instrumento principal!\n\n(Disfruta la pista)",
      "🎤\n\nCanta con el corazón\nDéjate llevar por la música\n\n(Improvisa tu propia versión)",
      "✨\n\nSiente la música correr por tus venas\n¡Es tu momento de brillar!\n\n(No necesitas la letra)",
      "🌟\n\nCierra los ojos y afina el alma\nEl polígrafo guiará tu voz\n\n(Tú eres el artista)",
      "🎶\n\nLa melodía es tu lienzo\nY tu voz es el pincel\n\n(Dibuja con tu canto)",
      "🔥\n\nConecta con la emoción del momento\nY canta sin miedo a equivocarte\n\n(Sigue la curva de tono)",
      "💡\n\nLas letras son solo palabras\n¡La afinación es la magia pura!\n\n(Tararea con sentimiento)",
      "🎧\n\nEscucha atentamente los acordes\nY deja que tu instinto te guíe\n\n(Hazlo a tu manera)",
      "💖\n\nCantar no requiere perfección\nSolo requiere pasión y aire\n\n(Disfruta cada nota)",
      "🚀\n\nEleva tu vibrato y tu energía\nLa pista instrumental te espera\n\n(Tú pones la voz)",
      "🎸\n\nCada nota que logras mantener\nEs un paso más cerca de la cima\n\n(Mantén el control)",
      "💎\n\nTu voz tiene un timbre único\nÚsalo para llenar este silencio\n\n(Haz que suene hermoso)",
      "🏆\n\nConcéntrate en la línea de tiempo\nLas estrellas doradas te esperan\n\n(¡A por el combo!)",
      "🎙️\n\nImagina que estás en un gran estadio\nSiente la ovación imaginaria\n\n(Canta fuerte y claro)",
      "🌊\n\nFluye con los cambios de ritmo\nSurfea sobre la armonía musical\n\n(Respira profundo y canta)"
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }, [track.plainLyrics, track.id]);
  
  // Framer Motion High-Performance Score
  const scoreRaw = useMotionValue(0);
  const scoreSpring = useSpring(scoreRaw, { stiffness: 100, damping: 15 });
  const displayScore = useTransform(scoreSpring, (v) => Math.round(v).toLocaleString());
  
  // Combo and Streak Management
  const streakRef = useRef(0);
  const multiplierRef = useRef(1);
  const [multiplierUI, setMultiplierUI] = useState(1);
  const [comboTexts, setComboTexts] = useState<{id: number, text: string, x: number}[]>([]);
  const comboTextId = useRef(0);
  
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  // Inicializamos activeVideoId verificando si existe un reemplazo aprendido previamente
  const [activeVideoId, setActiveVideoId] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`yt_replace_${videoId}`) || videoId;
    }
    return videoId;
  });

  const [retryCount, setRetryCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isPlaybackMode, setIsPlaybackMode] = useState(false);
  
  const playerRef = useRef<YouTubePlayer | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [melodyData, setMelodyData] = useState<any[]>([]);
  const [isLoadingMelody, setIsLoadingMelody] = useState(true);
  const recordedNotesRef = useRef<{ time: number, note: string }[]>([]);
  const currentTimeRef = useRef(0);
  const failedVideosRef = useRef<Set<string>>(new Set());

  const { frequency, note, smoothedCentsOff, isDetecting, start, stop, audioBlobUrl, clearAudio } = usePitchDetection();
  
  const handleClose = () => {
    clearAudio();
    onClose();
  };
  
  // Gamification Logic
  const handleScore = (isHit: boolean) => {
    if (isHit) {
      streakRef.current += 1;
      
      let newMult = 1;
      let comboMsg = "";
      if (streakRef.current === 150) { newMult = 4; comboMsg = "¡FUEGO! x4"; }
      else if (streakRef.current === 90) { newMult = 3; comboMsg = "¡Racha x3!"; }
      else if (streakRef.current === 30) { newMult = 2; comboMsg = "¡Perfecto! x2"; }
      else {
        if (streakRef.current >= 150) newMult = 4;
        else if (streakRef.current >= 90) newMult = 3;
        else if (streakRef.current >= 30) newMult = 2;
      }
      
      if (comboMsg) {
         comboTextId.current++;
         const newText = { id: comboTextId.current, text: comboMsg, x: Math.random() * 100 - 50 };
         setComboTexts(prev => [...prev, newText]);
         setTimeout(() => {
           setComboTexts(prev => prev.filter(t => t.id !== newText.id));
         }, 1500);
      }

      if (newMult !== multiplierRef.current) {
        multiplierRef.current = newMult;
        setMultiplierUI(newMult);
      }
      
      scoreRaw.set(scoreRaw.get() + (2 * multiplierRef.current));
      setScore(Math.round(scoreRaw.get()));
    } else {
      streakRef.current = 0;
      if (multiplierRef.current !== 1) {
        multiplierRef.current = 1;
        setMultiplierUI(1);
      }
    }
  };
  
  // Animation frame loop for strict currentTime sync
  const updateTime = () => {
    if (playerRef.current && isPlaying) {
      const t = playerRef.current.getCurrentTime() || 0;
      setCurrentTime(t);
      currentTimeRef.current = t;
      
      // Sincronización Maestro/Esclavo
      if (isPlaybackMode && audioRef.current) {
         if (Math.abs(audioRef.current.currentTime - t) > 0.3) {
            audioRef.current.currentTime = t;
         }
      }
      
      rafRef.current = requestAnimationFrame(updateTime);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(updateTime);
    } else if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying]);

  // Grabar notas cantadas para la comunidad (si no hay pista previa)
  useEffect(() => {
    if (isPlaying && isDetecting && note.name && note.octave) {
      recordedNotesRef.current.push({ 
        time: currentTimeRef.current, 
        note: `${note.name}${note.octave}` 
      });
    }
  }, [note, isPlaying, isDetecting]);

  useEffect(() => { return () => stop(); }, [stop]);

  useEffect(() => {
    const fetchOffset = async () => {
      try {
        const res = await fetch(`/api/karaoke-sync?videoId=${videoId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.offset) setSyncOffset(data.offset);
        }
      } catch (e) { } finally { setIsSyncing(false); }
    };
    fetchOffset();
  }, [videoId]);

  useEffect(() => {
    const pitchToMidi = (pitch: string) => {
      const noteStrings = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
      const midiOffsets = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      const match = pitch.match(/^([a-zA-Z#]+)(\d)$/);
      if (!match) return 60;
      const name = match[1];
      const octave = parseInt(match[2], 10);
      const index = noteStrings.indexOf(name);
      if (index === -1) return 60;
      return 12 * (octave + 1) + midiOffsets[index];
    };

    const transformSamplesToBlocks = (samples: any[]) => {
      if (!samples || samples.length === 0) return [];
      if (samples[0].start !== undefined) {
         return samples.map(s => ({...s, midi: s.midi || pitchToMidi(s.pitch)}));
      }
      
      const blocks = [];
      let currentBlock = { start: samples[0].time, end: samples[0].time, pitch: samples[0].note, midi: pitchToMidi(samples[0].note) };

      for (let i = 1; i < samples.length; i++) {
        const s = samples[i];
        if (s.note === currentBlock.pitch && (s.time - currentBlock.end) < 0.3) {
          currentBlock.end = s.time;
        } else {
          if (currentBlock.end - currentBlock.start > 0.1) {
            blocks.push(currentBlock);
          }
          currentBlock = { start: s.time, end: s.time, pitch: s.note, midi: pitchToMidi(s.note) };
        }
      }
      if (currentBlock.end - currentBlock.start > 0.1) {
        blocks.push(currentBlock);
      }
      return blocks;
    };

    const fetchMelodyData = async () => {
      setIsLoadingMelody(true);
      try {
        const cacheRes = await fetch(`/api/karaoke-melody?videoId=${activeVideoId}`);
        if (cacheRes.ok) {
          const cacheData = await cacheRes.json();
          if (cacheData && Array.isArray(cacheData.notes) && cacheData.notes.length > 0) {
            setMelodyData(transformSamplesToBlocks(cacheData.notes));
          } else {
            setMelodyData([]);
          }
        } else {
          setMelodyData([]);
        }
      } catch (e) {
        console.error("Error cargando melodía:", e);
        setMelodyData([]);
      } finally {
        setIsLoadingMelody(false);
      }
    };
    fetchMelodyData();
  }, [videoId]);

  const adjustOffset = async (amount: number) => {
    const newOffset = syncOffset + amount;
    setSyncOffset(newOffset);
    try {
      await fetch('/api/karaoke-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, offset: newOffset })
      });
    } catch (e) { }
  };

  const handleReady = (e: YouTubeEvent) => {
    playerRef.current = e.target;
    setIsReady(true);
  };
  
  const handleStateChange = (e: YouTubeEvent) => {
    const state = e.data;
    if (state === 1) {
      setIsPlaying(true);
      
      // Si el video actual es diferente al original (hubo un fallback) y funcionó, lo memorizamos
      if (activeVideoId !== videoId && typeof window !== 'undefined') {
        localStorage.setItem(`yt_replace_${videoId}`, activeVideoId);
      }
      
      if (!isDetecting && !isPlaybackMode) start();
      if (isPlaybackMode && audioRef.current) audioRef.current.play().catch(console.error);
    }
    else if (state === 2 || state === 3) {
      setIsPlaying(false);
      if (isPlaybackMode && audioRef.current) audioRef.current.pause();
    }
    else if (state === 0) {
      setIsPlaying(false);
      setIsFinished(true);
      if (!isPlaybackMode) {
        stop();
        
        // Calcular estrellas
        const finalScore = Math.round(scoreRaw.get());
        const thresholds = [1000, 3000, 5000, 10000, 20000];
        const stars = thresholds.filter(t => finalScore >= t).length;
        
        // Guardar el historial de escenario localmente
        saveKaraokeScore({
          videoId,
          trackName: track.trackName,
          artistName: track.artistName,
          score: finalScore,
          stars,
          date: Date.now()
        }).catch(err => console.error("Error guardando historial:", err));
      }

      // Guardar la melodía colaborativa si la pista estaba vacía
      if (melodyData.length === 0 && recordedNotesRef.current.length > 20) {
        fetch('/api/karaoke-melody', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            videoId, 
            notes: recordedNotesRef.current 
          })
        }).catch(err => console.error("Error guardando ghost roll colaborativo:", err));
      }
    }
  };

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
      if (!isDetecting && !isPlaybackMode) start();
    }
  };

  const handlePlayRecording = () => {
    setIsPlaybackMode(true);
    setIsFinished(false);
    playerRef.current?.seekTo(0);
    playerRef.current?.playVideo();
    if (audioRef.current) {
       audioRef.current.currentTime = 0;
       audioRef.current.play().catch(console.error);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950 overflow-hidden">
      
      {/* Hidden YouTube Player (Visually hidden to prevent browser throttling of 0 opacity iframes) */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden', pointerEvents: 'none' }}>
        <YouTube 
          videoId={activeVideoId} 
          opts={{ width: '200', height: '200', playerVars: { autoplay: 1, controls: 0, modestbranding: 1 } }} 
          onReady={handleReady} 
          onStateChange={handleStateChange} 
          onError={async (e: any) => {
            console.warn("YouTube Warning (Intentando alternativa):", e.data);
            failedVideosRef.current.add(activeVideoId);
            
            // Si el error es de copyright (150, 101) o cualquier otro, intentamos con otra versión silenciosamente
            try {
              // Hacemos una búsqueda amplia pidiendo 10 resultados
              const query = encodeURIComponent(track.artistName + ' ' + track.trackName + ' audio');
              const res = await fetch(`/api/yt-search?q=${query}&limit=10`);
              const videos = await res.json();
              
              if (videos && videos.length > 0) {
                 // Buscar el primer video que no hayamos intentado ya
                 const nextVideo = videos.find((v: any) => !failedVideosRef.current.has(v.id));
                 if (nextVideo) {
                   setActiveVideoId(nextVideo.id);
                   return; // Terminamos aquí, el componente se re-renderizará con el nuevo ID
                 }
              }
              
              // Si se agotaron los 'audio', buscamos 'lyric'
              const resLyric = await fetch(`/api/yt-search?q=${encodeURIComponent(track.artistName + ' ' + track.trackName + ' lyric')}&limit=10`);
              const videosLyric = await resLyric.json();
              if (videosLyric && videosLyric.length > 0) {
                 const nextLyricVideo = videosLyric.find((v: any) => !failedVideosRef.current.has(v.id));
                 if (nextLyricVideo) {
                   setActiveVideoId(nextLyricVideo.id);
                   return;
                 }
              }
              
              // Si de verdad no hay ninguna alternativa en YouTube, cerramos el player silenciosamente
              console.warn("Se agotaron todas las alternativas de YouTube.");
              onClose();
            } catch (err) {
              console.warn("Aviso buscando alternativas silenciosas:", err);
              onClose(); // Fallback final
            }
          }}
        />
        {audioBlobUrl && (
          <audio ref={audioRef} src={audioBlobUrl} preload="auto" style={{ display: 'none' }} />
        )}
      </div>

      {/* Zone 1: Header & Polygraph Canvas (30%) */}
      <div className="h-[30%] relative z-10 flex flex-col pt-4 px-4 sm:px-6 border-b border-white/5 bg-black/20 overflow-hidden min-h-0 shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-4">
            <h3 className="text-lg sm:text-xl font-bold text-white drop-shadow-md line-clamp-1">{track.trackName}</h3>
            <p className="text-sm text-white/70 line-clamp-1">{track.artistName}</p>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
            
            <div className="text-right relative">
              <p className="text-[10px] sm:text-xs font-semibold text-white/70 uppercase tracking-widest leading-none">Score</p>
              
              <div className="flex items-center justify-end gap-2 mt-1">
                <AnimatePresence>
                  {multiplierUI > 1 && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className={`px-2 py-0.5 rounded-full text-xs font-black shadow-lg ${
                        multiplierUI >= 4 ? 'bg-orange-500 text-white shadow-orange-500/50' :
                        multiplierUI >= 3 ? 'bg-amber-400 text-amber-950 shadow-amber-400/50' :
                        'bg-emerald-400 text-emerald-950 shadow-emerald-400/50'
                      }`}
                    >
                      x{multiplierUI}
                    </motion.div>
                  )}
                </AnimatePresence>
                <motion.p className="text-xl sm:text-3xl font-black text-emerald-400 drop-shadow-lg leading-none">
                  {displayScore}
                </motion.p>
              </div>

              {/* Textos flotantes de combo */}
              <div className="absolute right-0 top-full pointer-events-none z-50">
                <AnimatePresence>
                  {comboTexts.map(ct => (
                    <motion.div
                      key={ct.id}
                      initial={{ opacity: 0, y: 0, scale: 0.5, x: ct.x }}
                      animate={{ opacity: [0, 1, 0], y: -50, scale: 1.2, x: ct.x }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className={`absolute whitespace-nowrap font-black text-lg drop-shadow-[0_0_8px_rgba(0,0,0,0.8)] ${
                        ct.text.includes('FUEGO') ? 'text-orange-400' :
                        ct.text.includes('Racha') ? 'text-amber-400' :
                        'text-emerald-400'
                      }`}
                    >
                      {ct.text}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <Button variant="ghost" size="icon" onClick={handleClose} className="text-white rounded-full h-8 w-8 sm:h-10 sm:w-10">
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 relative mt-2 min-h-0">
          {isPlaybackMode ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 rounded-2xl border border-indigo-500/30">
               <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mb-3">
                 <div className="w-4 h-4 rounded-full bg-indigo-400 animate-ping absolute" />
                 <div className="w-6 h-6 rounded-full bg-indigo-500 relative z-10" />
               </div>
               <p className="text-indigo-300 font-bold text-sm tracking-widest uppercase">Reproduciendo tu grabación</p>
            </div>
          ) : (
              <PolygraphCanvas 
                frequency={frequency}
                isDetecting={isDetecting}
                currentTime={currentTime + syncOffset} 
                melodyData={melodyData} 
                onHitUpdate={handleScore}
              />
          )}
        </div>
      </div>

      {/* Zone 2: Synced Lyrics (50%) */}
      <div className="h-[50%] relative z-10 flex flex-col justify-center items-center overflow-hidden min-h-0 w-full shrink-0">
        {!isReady || isSyncing || isLoadingMelody ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse text-center">Cargando canción...</p>
          </div>
        ) : track.parsedLyrics && track.parsedLyrics.length > 0 ? (
          <SyncedLyrics lyrics={track.parsedLyrics} currentTime={currentTime + syncOffset} />
        ) : (
          <div className="flex-1 overflow-y-auto px-8 pb-8 pt-4 text-center flex flex-col items-center mask-image-fade" style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)' }}>
            <p className="text-xl leading-[2.5] text-white/80 whitespace-pre-wrap font-medium max-w-2xl text-center">
              {fallbackLyric}
            </p>
          </div>
        )}
      </div>

      {/* Zone 3: Player Controls (20%) */}
      <div className="h-[20%] relative z-30 bg-slate-950/90 border-t border-white/10 flex flex-col justify-center pb-[env(safe-area-inset-bottom)] overflow-hidden min-h-0 shrink-0">
        <PlayerControls 
          isPlaying={isPlaying} 
          isReady={isReady} 
          syncOffset={syncOffset}
          onTogglePlay={togglePlay} 
          onAdjustOffset={adjustOffset}
        />
      </div>

      <AnimatePresence>
        {isFinished && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 100 }}
              className="bg-slate-900 border border-emerald-900/50 rounded-3xl p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(16,185,129,0.15)] flex flex-col items-center relative overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />

              <h2 className="text-3xl font-black text-white mb-2 tracking-tight">¡Misión Cumplida!</h2>
              <p className="text-emerald-400/80 mb-6 font-medium">Esta es tu puntuación final</p>
              
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
                className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-emerald-300 to-emerald-600 drop-shadow-[0_0_25px_rgba(52,211,153,0.3)] mb-8"
              >
                {score.toLocaleString()}
              </motion.div>

              <div className="flex gap-2 mb-8">
                {[1000, 3000, 5000, 10000, 20000].map((threshold, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: score >= threshold ? 1 : 0.5, rotate: 0 }}
                    transition={{ delay: 0.5 + (i * 0.1), type: "spring" }}
                  >
                    <svg 
                      className={`w-10 h-10 ${score >= threshold ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]' : 'text-slate-700'}`} 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </motion.div>
                ))}
              </div>

              <div className="w-full space-y-3 relative z-10">
                {audioBlobUrl && !isPlaybackMode && (
                  <Button size="lg" onClick={handlePlayRecording} className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-full font-bold shadow-lg shadow-indigo-900/50 transition-all">
                    ▶️ Escuchar mi interpretación
                  </Button>
                )}
                <Button size="lg" onClick={handleClose} variant="outline" className="w-full rounded-full font-bold border-slate-700 hover:bg-slate-800 text-white">
                  Volver al Catálogo
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
