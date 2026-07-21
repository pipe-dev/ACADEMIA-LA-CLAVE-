"use client";

import { useState, useEffect, useRef } from "react";
import YouTube, { YouTubeEvent, YouTubePlayer } from "react-youtube";
import { TrackLyrics } from "@/lib/fetch-lyrics";
import { SyncedLyrics } from "./synced-lyrics";
import { PolygraphCanvas } from "./polygraph-canvas";
import { usePitchDetection } from "@/hooks/use-pitch-detection";
import { Button } from "@/components/ui/button";
import { X, Loader2, PlayCircle } from "lucide-react";
import { PlayerControls } from "./player-controls";
import { useVocalRemover } from "@/hooks/use-vocal-remover";

interface PracticaPlayerProps {
  track: TrackLyrics;
  videoId: string;
  onClose: () => void;
}

export function PracticaPlayer({ track, videoId, onClose }: PracticaPlayerProps) {
  const [player, setPlayer] = useState<YouTubePlayer | null>(null);
  const [syncOffset, setSyncOffset] = useState(0); 
  const [isSyncing, setIsSyncing] = useState(true);
  const [vocalVolume, setVocalVolume] = useState(1.0);
  const [audioStarted, setAudioStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  const [melodyData, setMelodyData] = useState<any[]>([]);
  const [isLoadingMelody, setIsLoadingMelody] = useState(true);
  const [melodyError, setMelodyError] = useState<string | null>(null);

  const { note, smoothedCentsOff, isDetecting, start, stop } = usePitchDetection();
  
  // Custom Audio Hook
  const { 
    initAudio, togglePlay: audioTogglePlay, setVocalVolume: audioSetVocalVolume, 
    isPlaying: audioIsPlaying, isReady: audioIsReady, currentTime: audioTime, 
    error: audioError, setTime: audioSetTime 
  } = useVocalRemover(videoId);

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
    const fetchMelodyData = async () => {
      setIsLoadingMelody(true);
      setMelodyError(null);
      try {
        // Paso 1: Intentar caché (Google Sheets)
        const cacheRes = await fetch(`/api/karaoke-melody?videoId=${videoId}`);
        if (cacheRes.ok) {
          const cacheData = await cacheRes.json();
          if (cacheData && Array.isArray(cacheData.notes) && cacheData.notes.length > 0) {
            setMelodyData(cacheData.notes);
            setIsLoadingMelody(false);
            return; // ¡Cache hit! No necesitamos IA.
          }
        }

        // Paso 2: No hay caché → "Caballo de Troya"
        // 2a. Pedir URL de audio a Cobalt (proxy ligero, ~1KB)
        const cobaltRes = await fetch('/api/cobalt-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId }),
        });
        
        if (!cobaltRes.ok) {
          setMelodyError("No se pudo obtener el audio.");
          setIsLoadingMelody(false);
          return;
        }
        
        const { url: audioUrl } = await cobaltRes.json();
        if (!audioUrl) {
          setMelodyError("Cobalt no devolvió URL.");
          setIsLoadingMelody(false);
          return;
        }

        // 2b. Descargar audio directamente en el navegador (~3MB, NO pasa por Vercel)
        const audioRes = await fetch(audioUrl);
        if (!audioRes.ok) {
          setMelodyError("Error descargando audio.");
          setIsLoadingMelody(false);
          return;
        }
        const audioBlob = await audioRes.blob();

        // 2c. Subir audio directamente a Hugging Face Gradio API (~3MB, NO pasa por Vercel)
        const HF_SPACE = "https://daniel555-afinapp-melodia.hf.space";
        const formData = new FormData();
        formData.append('files', audioBlob, 'audio.mp3');
        
        // Gradio file upload endpoint
        const uploadRes = await fetch(`${HF_SPACE}/upload`, {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadRes.ok) {
          setMelodyError("Error subiendo a IA.");
          setIsLoadingMelody(false);
          return;
        }
        
        const uploadedFiles = await uploadRes.json();
        const filePath = uploadedFiles[0]; // Gradio returns array of paths

        // 2d. Llamar al endpoint de predicción de Gradio
        const predictRes = await fetch(`${HF_SPACE}/api/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: [{ path: filePath, orig_name: 'audio.mp3', size: audioBlob.size, mime_type: 'audio/mpeg' }],
          }),
        });

        if (!predictRes.ok) {
          setMelodyError("Error procesando con IA.");
          setIsLoadingMelody(false);
          return;
        }

        const predictData = await predictRes.json();
        const result = predictData?.data?.[0];
        
        if (result && Array.isArray(result.notes)) {
          setMelodyData(result.notes);
        } else if (result?.error) {
          setMelodyError(result.error);
        } else {
          setMelodyError("Respuesta inesperada de IA.");
        }
      } catch (e) { 
        console.error("Error en flujo de melodía:", e);
        setMelodyError("Error de Red."); 
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

  const handleStartAudio = async () => {
    setAudioStarted(true);
    await initAudio();
  };

  const togglePlay = () => {
    if (audioIsReady) {
      audioTogglePlay();
      if (!audioIsPlaying && !isDetecting) start();
    } else if (player) {
      // Fallback
      player.getPlayerState() === 1 ? player.pauseVideo() : player.playVideo();
      if (!isDetecting) start();
    }
  };
  
  const handleVolumeChange = (val: number) => {
    setVocalVolume(val);
    audioSetVocalVolume(val);
  };

  const isReady = audioStarted ? audioIsReady : Boolean(player);
  const isPlaying = audioStarted ? audioIsPlaying : (player?.getPlayerState() === 1);
  const currentTime = audioStarted && !audioError ? audioTime : (player ? player.getCurrentTime() : 0);

  const handleScore = (points: number) => {
    setScore(s => s + points);
  };

  return (
    <div className="relative flex flex-col h-full bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950">
      <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black/80 to-transparent z-50 flex items-center justify-between px-6 pointer-events-none">
        <div>
          <h3 className="text-xl font-bold text-white drop-shadow-md">{track.trackName}</h3>
          <p className="text-white/70">{track.artistName}</p>
        </div>
        <div className="flex items-center gap-6 pointer-events-auto">
          <div className="text-right">
            <p className="text-sm font-semibold text-white/70 uppercase tracking-widest">Score</p>
            <p className="text-3xl font-black text-emerald-400 drop-shadow-lg">{score.toLocaleString()}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 rounded-full">
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <div className="absolute top-0 right-0 opacity-0 pointer-events-none w-1 h-1 overflow-hidden z-0">
        <YouTube
          videoId={videoId}
          onReady={(e: any) => { setPlayer(e.target); e.target.mute(); }} // Muted Fallback/Timer
          onEnd={() => setIsFinished(true)}
          opts={{ playerVars: { autoplay: 1, controls: 0, disablekb: 1, modestbranding: 1 } }}
        />
      </div>

      <div className="h-[40%] relative z-10 pt-20 px-6">
        <PolygraphCanvas 
          currentTime={currentTime + syncOffset} 
          userPitch={{ note: note.name ? `${note.name}${note.octave}` : null, centsOff: smoothedCentsOff }} 
          mockMelodyData={melodyData} 
          isDetecting={isDetecting}
          onScore={handleScore}
        />
      </div>

      <div className="h-[40%] relative z-10 flex flex-col">
        {!audioStarted ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <Button onClick={handleStartAudio} size="lg" className="rounded-full px-8 py-6 bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20">
              <PlayCircle className="mr-2 h-6 w-6" />
              Cargar Audio Inteligente
            </Button>
            <p className="text-white/50 text-sm max-w-sm text-center">Iniciaremos el motor de audio para habilitar el control de voz (requiere interacción).</p>
          </div>
        ) : !isReady || isSyncing || isLoadingMelody ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse text-center">Cargando...</p>
          </div>
        ) : track.parsedLyrics && track.parsedLyrics.length > 0 ? (
          <SyncedLyrics lyrics={track.parsedLyrics} currentTime={currentTime + syncOffset} />
        ) : track.plainLyrics ? (
          <div className="flex-1 overflow-y-auto px-8 pb-32 pt-8 text-center flex flex-col items-center mask-image-fade" style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)' }}>
            <p className="text-xl leading-[2.5] text-white/80 whitespace-pre-wrap font-medium max-w-2xl text-center">
              {track.plainLyrics}
            </p>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-white/50 text-lg">Letra no disponible</p>
          </div>
        )}
      </div>

      <PlayerControls 
        isPlaying={isPlaying} 
        isReady={isReady} 
        syncOffset={syncOffset}
        vocalVolume={vocalVolume}
        onTogglePlay={togglePlay} 
        onAdjustOffset={adjustOffset}
        onVolumeChange={handleVolumeChange}
      />

      {isFinished && (
        <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-emerald-900 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl flex flex-col items-center">
            <h2 className="text-3xl font-black text-white mb-2">¡Completado!</h2>
            <p className="text-slate-400 mb-6">Esta es tu puntuación final</p>
            <div className="text-7xl font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)] mb-8">
              {score.toLocaleString()}
            </div>
            <Button size="lg" onClick={onClose} className="w-full bg-emerald-600 hover:bg-emerald-500 rounded-full font-bold">
              Volver al inicio
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
