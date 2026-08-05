"use client";

import { Button } from "@/components/ui/button";
import { Play, Pause, FastForward, Rewind, Mic2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface PlayerControlsProps {
  isPlaying: boolean;
  isReady: boolean;
  syncOffset: number;
  onTogglePlay: () => void;
  onAdjustOffset: (amount: number) => void;
}

export function PlayerControls({
  isPlaying,
  isReady,
  syncOffset,
  onTogglePlay,
  onAdjustOffset,
}: PlayerControlsProps) {
  return (
    <div className="w-full px-6 py-4 flex flex-col items-center justify-center space-y-3">


      <div className="flex items-center justify-center space-x-4">
        <div className="flex items-center space-x-2 bg-black/50 rounded-full px-4 py-2 border border-white/10">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onAdjustOffset(-0.5)} 
            className="text-white/70 h-10 w-10 rounded-full"
            aria-label="Retrasar sincronización 0.5s"
          >
            <Rewind className="h-4 w-4" />
          </Button>
          <div className="flex flex-col items-center justify-center w-12">
            <span className="text-[10px] text-white/70 uppercase font-bold tracking-wider leading-none">Sync</span>
            <span className="text-sm text-white font-mono">{syncOffset > 0 ? '+' : ''}{syncOffset.toFixed(1)}s</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onAdjustOffset(0.5)} 
            className="text-white/70 h-10 w-10 rounded-full"
            aria-label="Adelantar sincronización 0.5s"
          >
            <FastForward className="h-4 w-4" />
          </Button>
        </div>

        <Button 
          onClick={onTogglePlay} 
          size="icon" 
          aria-label={isPlaying ? "Pausar canción" : "Reproducir canción"}
          className="h-14 w-14 rounded-full bg-primary shadow-[0_0_20px_rgba(var(--primary),0.5)]"
          disabled={!isReady}
        >
          {isPlaying ? <Pause className="h-6 w-6 text-primary-foreground" /> : <Play className="h-6 w-6 text-primary-foreground ml-1" />}
        </Button>
      </div>
    </div>
  );
}
