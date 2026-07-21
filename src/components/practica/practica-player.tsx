"use client";

import { useState, useEffect, useRef } from "react";
import YouTube, { YouTubeEvent, YouTubePlayer } from "react-youtube";
import { TrackLyrics } from "@/lib/fetch-lyrics";
import { SyncedLyrics } from "./synced-lyrics";
import { PolygraphCanvas } from "./polygraph-canvas";
import { usePitchDetection } from "@/hooks/use-pitch-detection";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import { PlayerControls } from "./player-controls";

interface PracticaPlayerProps {
  track: TrackLyrics;
  videoId: string;
  onClose: () => void;
}

export function PracticaPlayer({ track, videoId, onClose }: PracticaPlayerProps) {
  const [player, setPlayer] = useState<YouTubePlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [syncOffset, setSyncOffset] = useState(0); // in seconds
  const [isSyncing, setIsSyncing] = useState(true);

  const { note, smoothedCentsOff, isDetecting, start, stop } = usePitchDetection();

  useEffect(() => {
    return () => stop();
  }, [stop]);

  const userPitch = {
    note: note.name ? `${note.name}${note.octave}` : null,
    centsOff: smoothedCentsOff,
  };

  // 1. Cargar la Memoria Colectiva (Crowdsourcing)
  useEffect(() => {
    const fetchOffset = async () => {
      try {
        const res = await fetch(`/api/karaoke-sync?videoId=${videoId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.offset) setSyncOffset(data.offset);
        }
      } catch (e) {
        console.error("Error loading sync offset", e);
      } finally {
        setIsSyncing(false);
      }
    };
    fetchOffset();
  }, [videoId]);

  // 2. Guardar en la Memoria Colectiva cuando el usuario ajusta
  const adjustOffset = async (amount: number) => {
    const newOffset = syncOffset + amount;
    setSyncOffset(newOffset);
    
    // Guardar asincrónicamente en la API
    try {
      await fetch('/api/karaoke-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, offset: newOffset })
      });
    } catch (e) {
      console.error("Error saving sync offset", e);
    }
  };

  // Poll current time frequently for smooth lyrics scrolling
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && player) {
      interval = setInterval(async () => {
        try {
          const time = await player.getCurrentTime();
          setCurrentTime(time);
        } catch (e) {
          // Player might not be ready yet
        }
      }, 50); // 20fps update for smooth syncing
    }
    return () => clearInterval(interval);
  }, [isPlaying, player]);

  const handleReady = (e: YouTubeEvent) => {
    setPlayer(e.target);
    setIsReady(true);
    e.target.playVideo();
  };

  const handleStateChange = (e: YouTubeEvent) => {
    // 1 = playing, 2 = paused
    setIsPlaying(e.data === 1);
  };

  const togglePlay = () => {
    if (!player) return;
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950">
      {/* Top Header */}
      <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black/80 to-transparent z-50 flex items-center justify-between px-6 pointer-events-none">
        <div>
          <h3 className="text-xl font-bold text-white drop-shadow-md">{track.trackName}</h3>
          <p className="text-white/70">{track.artistName}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 rounded-full pointer-events-auto">
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Hidden/Tiny YouTube Player */}
      <div className="absolute top-0 right-0 opacity-0 pointer-events-none w-1 h-1 overflow-hidden z-0">
        <YouTube
          videoId={videoId}
          onReady={handleReady}
          onStateChange={handleStateChange}
          opts={{
            height: '10',
            width: '10',
            playerVars: {
              autoplay: 1,
              controls: 0,
              disablekb: 1,
              modestbranding: 1,
            },
          }}
        />
      </div>

      {/* Top Zone: 40% height */}
      <div className="h-[40%] relative z-10 pt-20 px-6">
        <PolygraphCanvas 
          currentTime={currentTime + syncOffset} 
          userPitch={userPitch} 
          mockMelodyData={[]} 
        />
      </div>

      {/* Middle Zone: 40% height */}
      <div className="h-[40%] relative z-10 flex flex-col">
        {!isReady || isSyncing ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse">Cargando pista y sincronización...</p>
          </div>
        ) : (
          <SyncedLyrics lyrics={track.parsedLyrics} currentTime={currentTime + syncOffset} />
        )}
      </div>

      {/* Bottom Zone: 20% height */}
      <div className="h-[20%] relative z-10">
        <PlayerControls
          isPlaying={isPlaying}
          isReady={isReady}
          syncOffset={syncOffset}
          onTogglePlay={togglePlay}
          onAdjustOffset={adjustOffset}
        />
      </div>
    </div>
  );
}
