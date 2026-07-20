"use client";

import { useEffect, useRef } from "react";
import { usePitchDetection } from "@/hooks/use-pitch-detection";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PitchOverlay() {
  const { note, smoothedCentsOff, isDetecting, start, stop } = usePitchDetection();

  // Cleanup on unmount
  useEffect(() => {
    return () => stop();
  }, [stop]);

  return (
    <div className="absolute inset-x-0 bottom-24 flex flex-col items-center justify-center pointer-events-none z-40">
      <div className="bg-black/60 backdrop-blur-md px-6 py-4 rounded-full border border-white/10 flex items-center space-x-6 shadow-2xl pointer-events-auto">
        
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => isDetecting ? stop() : start()}
          className={`rounded-full transition-colors ${isDetecting ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
        >
          {isDetecting ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Button>

        <div className="flex flex-col items-center w-64">
          <div className="flex justify-between w-full text-xs font-medium text-white/50 mb-2">
            <span>b</span>
            <span className="text-xl text-white font-bold tracking-tighter w-12 text-center drop-shadow-md">
              {note.name ? `${note.name}${note.octave}` : "--"}
            </span>
            <span>#</span>
          </div>
          
          <div className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden">
            {/* Center target indicator */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-white/40 -translate-x-1/2 z-10" />
            
            {/* Moving pitch indicator */}
            <div 
              className="absolute top-0 bottom-0 w-2 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),1)] transition-all duration-75 ease-out z-20"
              style={{ 
                left: `calc(50% + ${Math.max(-50, Math.min(50, (smoothedCentsOff / 50) * 50))}%)`,
                transform: 'translateX(-50%)',
                opacity: note.name ? 1 : 0
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
