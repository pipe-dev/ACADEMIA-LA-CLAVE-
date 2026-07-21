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
