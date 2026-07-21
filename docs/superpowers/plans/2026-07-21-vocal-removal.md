# Vocal Removal (Apple Music Sing clone) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a real-time vocal volume slider ("Apple Music Sing" clone) using Web Audio API center-channel phase cancellation, powered by an Invidious audio proxy to bypass YouTube CORS.

**Architecture:** A new React custom hook (`useVocalRemover`) will fetch an MP3/M4A audio stream via an Invidious API instance and process it through the Web Audio API with a `GainNode` phase inversion matrix. The existing `PracticaPlayer` will use this hook to play audio and expose a `vocalVolume` state to a new slider in `PlayerControls`. The `react-youtube` iframe will be kept ONLY as a muted fallback to sync time if the proxy fails.

**Tech Stack:** React, Web Audio API, Shadcn UI Slider, Invidious API

## Global Constraints

- Must run smoothly on 2016-era mobile devices.
- Must fall back gracefully if Invidious proxies are blocked.
- UI must update in real-time.

---

### Task 1: Create Slider UI Component

**Files:**
- Create: `src/components/ui/slider.tsx`

**Interfaces:**
- Consumes: None
- Produces: Standard Shadcn UI Slider component exported as `Slider`

- [ ] **Step 1: Write minimal implementation**

```tsx
"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/slider.tsx
git commit -m "feat(ui): add Slider component for vocal volume control"
```

---

### Task 2: Implement `useVocalRemover` hook

**Files:**
- Create: `src/hooks/use-vocal-remover.ts`

**Interfaces:**
- Consumes: YouTube videoId
- Produces: `useVocalRemover` hook that returns `{ initAudio, togglePlay, setVocalVolume, isPlaying, isReady, currentTime, error, setTime }`

- [ ] **Step 1: Write minimal implementation**

```typescript
import { useState, useRef, useEffect } from 'react';

export function useVocalRemover(videoId: string) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const centerCancelGainRef = useRef<GainNode | null>(null);
  const originalGainRef = useRef<GainNode | null>(null);

  const initAudio = async () => {
    try {
      const instances = ["https://yewtu.be", "https://vid.puffyan.us", "https://invidious.flokinet.to"];
      let audioUrl = null;
      
      for (const instance of instances) {
        try {
          const res = await fetch(`${instance}/api/v1/videos/${videoId}`);
          if (res.ok) {
            const data = await res.json();
            const formats = data.adaptiveFormats || [];
            const audioFormats = formats.filter((f: any) => f.type?.startsWith('audio/'));
            if (audioFormats.length > 0) {
              audioFormats.sort((a: any, b: any) => parseInt(b.bitrate || '0') - parseInt(a.bitrate || '0'));
              audioUrl = audioFormats[0].url;
              break;
            }
          }
        } catch (e) { continue; }
      }

      if (!audioUrl) throw new Error("Could not fetch audio from proxies");

      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.src = audioUrl;
      audioRef.current = audio;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const source = ctx.createMediaElementSource(audio);
      
      // Center cancellation routing
      const splitter = ctx.createChannelSplitter(2);
      const merger = ctx.createChannelMerger(2);
      const inverter = ctx.createGain();
      inverter.gain.value = -1;

      source.connect(splitter);
      splitter.connect(inverter, 1); // Invert right channel
      
      // L + (-R) -> Center cancellation
      splitter.connect(merger, 0, 0); // L to L
      inverter.connect(merger, 0, 0); // -R to L
      splitter.connect(merger, 0, 1); // L to R (dual mono)
      inverter.connect(merger, 0, 1); // -R to R
      
      // Mix controls
      const originalGain = ctx.createGain();
      const centerCancelGain = ctx.createGain();
      
      originalGain.gain.value = 1; // Start with full vocals
      centerCancelGain.gain.value = 0;

      source.connect(originalGain);
      merger.connect(centerCancelGain);
      
      originalGain.connect(ctx.destination);
      centerCancelGain.connect(ctx.destination);
      
      originalGainRef.current = originalGain;
      centerCancelGainRef.current = centerCancelGain;

      audio.addEventListener('canplay', () => setIsReady(true));
      audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
      audio.addEventListener('play', () => setIsPlaying(true));
      audio.addEventListener('pause', () => setIsPlaying(false));
      
      audio.load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Audio load error');
    }
  };

  const setVocalVolume = (volume: number) => { // 0.0 to 1.0
    if (originalGainRef.current && centerCancelGainRef.current) {
      // Equal power crossfade
      originalGainRef.current.gain.value = Math.cos((1.0 - volume) * 0.5 * Math.PI);
      centerCancelGainRef.current.gain.value = Math.cos(volume * 0.5 * Math.PI);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !audioContextRef.current) return;
    if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };
  
  const setTime = (time: number) => {
    if (audioRef.current) audioRef.current.currentTime = time;
  };

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current?.removeAttribute('src');
      audioContextRef.current?.close();
    };
  }, []);

  return { initAudio, togglePlay, setVocalVolume, isPlaying, isReady, currentTime, error, setTime };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-vocal-remover.ts
git commit -m "feat(audio): add useVocalRemover hook for Web Audio center cancellation"
```

---

### Task 3: Update `player-controls.tsx` with Volume Slider

**Files:**
- Modify: `src/components/practica/player-controls.tsx:1-47`

**Interfaces:**
- Consumes: Slider component
- Produces: Updated PlayerControls with vocal volume prop

- [ ] **Step 1: Write minimal implementation**

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { Play, Pause, FastForward, Rewind, Mic2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface PlayerControlsProps {
  isPlaying: boolean;
  isReady: boolean;
  syncOffset: number;
  vocalVolume: number;
  onTogglePlay: () => void;
  onAdjustOffset: (amount: number) => void;
  onVolumeChange: (val: number) => void;
}

export function PlayerControls({
  isPlaying,
  isReady,
  syncOffset,
  vocalVolume,
  onTogglePlay,
  onAdjustOffset,
  onVolumeChange,
}: PlayerControlsProps) {
  return (
    <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black/90 to-transparent z-50 flex flex-col items-center justify-end pb-4 space-y-4">
      
      {/* Vocal Volume Slider */}
      <div className="flex items-center space-x-3 w-64 bg-black/50 px-4 py-2 rounded-full border border-white/10">
        <Mic2 className="h-4 w-4 text-white/50" />
        <Slider 
          value={[vocalVolume * 100]} 
          max={100} 
          step={1} 
          onValueChange={(vals) => onVolumeChange(vals[0] / 100)} 
          disabled={!isReady}
        />
        <span className="text-xs text-white/50 font-mono w-8">{Math.round(vocalVolume * 100)}%</span>
      </div>

      <div className="flex items-center justify-center space-x-4">
        <div className="flex items-center space-x-2 bg-black/50 rounded-full px-4 py-2 border border-white/10">
          <Button variant="ghost" size="icon" onClick={() => onAdjustOffset(-0.5)} className="text-white/70 hover:text-white h-8 w-8 rounded-full">
            <Rewind className="h-4 w-4" />
          </Button>
          <div className="flex flex-col items-center justify-center w-12">
            <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider leading-none">Sync</span>
            <span className="text-sm text-white font-mono">{syncOffset > 0 ? '+' : ''}{syncOffset.toFixed(1)}s</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onAdjustOffset(0.5)} className="text-white/70 hover:text-white h-8 w-8 rounded-full">
            <FastForward className="h-4 w-4" />
          </Button>
        </div>

        <Button 
          onClick={onTogglePlay} 
          size="icon" 
          className="h-14 w-14 rounded-full bg-primary hover:bg-primary/80 shadow-[0_0_20px_rgba(var(--primary),0.5)]"
          disabled={!isReady}
        >
          {isPlaying ? <Pause className="h-6 w-6 text-primary-foreground" /> : <Play className="h-6 w-6 text-primary-foreground ml-1" />}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/practica/player-controls.tsx
git commit -m "feat(ui): add vocal volume slider to player controls"
```

---

### Task 4: Integrate Hook into `practica-player.tsx`

**Files:**
- Modify: `src/components/practica/practica-player.tsx:1-200`

**Interfaces:**
- Consumes: `useVocalRemover`, Updated `PlayerControls`
- Produces: Playable component with volume control

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
