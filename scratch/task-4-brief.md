### Task 4: Integrate Hook into `practica-player.tsx`

**Files:**
- Modify: `src/components/practica/practica-player.tsx:1-200`

**Interfaces:**
- Consumes: `useVocalRemover`, Updated `PlayerControls`
- Produces: Playable component with volume control

**Global Constraints & Design Philosophy:**
- *CRITICAL:* The code must be incredibly lightweight and optimized for 2016-2017 hardware (Nintendo 64 / Rareware philosophy). No unnecessary re-renders, strict memory management, and efficient use of Web Audio API hardware acceleration.

- [ ] **Step 1: Write minimal implementation**

```tsx
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
      try {
        const res = await fetch(`/api/karaoke-melody?videoId=${videoId}`);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.notes)) setMelodyData(data.notes);
        } else setMelodyError("Error de IA.");
      } catch (e) { setMelodyError("Error de Red."); } 
      finally { setIsLoadingMelody(false); }
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

  return (
    <div className="relative flex flex-col h-full bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950">
      <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black/80 to-transparent z-50 flex items-center justify-between px-6 pointer-events-none">
        <div>
          <h3 className="text-xl font-bold text-white drop-shadow-md">{track.trackName}</h3>
          <p className="text-white/70">{track.artistName}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 rounded-full pointer-events-auto">
          <X className="h-6 w-6" />
        </Button>
      </div>

      <div className="absolute top-0 right-0 opacity-0 pointer-events-none w-1 h-1 overflow-hidden z-0">
        <YouTube
          videoId={videoId}
          onReady={(e) => { setPlayer(e.target); e.target.mute(); }} // Muted Fallback/Timer
          opts={{ playerVars: { autoplay: 1, controls: 0, disablekb: 1, modestbranding: 1 } }}
        />
      </div>

      <div className="h-[40%] relative z-10 pt-20 px-6">
        <PolygraphCanvas 
          currentTime={currentTime + syncOffset} 
          userPitch={{ note: note.name ? `${note.name}${note.octave}` : null, centsOff: smoothedCentsOff }} 
          mockMelodyData={melodyData} 
          isDetecting={isDetecting}
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
        ) : (
          <SyncedLyrics track={track} currentTime={currentTime + syncOffset} />
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
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/practica/practica-player.tsx
git commit -m "feat(player): integrate Web Audio vocal remover and fallback"
```
