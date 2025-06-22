"use client";

import { useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { usePitchDetection } from "@/hooks/use-pitch-detection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function Tuner() {
  const { note, frequency, centsOff, isDetecting, start, stop } = usePitchDetection();
  const [showDetails, setShowDetails] = useState(false);

  const handleToggle = () => {
    if (isDetecting) {
      stop();
    } else {
      start();
    }
  };

  const isInTune = Math.abs(centsOff) < 10;
  // The needle moves up to 90 degrees left or right. 50 cents = 90deg, so 1 cent = 1.8deg.
  const needleRotation = centsOff * 1.8;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      <Card className="w-full relative overflow-hidden shadow-lg border-2 border-primary/20">
        <CardContent className="p-6 flex flex-col items-center justify-center">
          {isDetecting ? (
            <div className="w-full h-80 flex flex-col items-center justify-between">
              {/* Tuner Dial */}
              <div className="relative w-64 h-32 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full">
                  <div 
                    className="w-[200%] aspect-square rounded-full border-4 border-muted absolute bottom-0 left-1/2 -translate-x-1/2"
                    style={{
                      borderColor: 'hsl(var(--muted))',
                    }}
                  ></div>
                   <div 
                    className={cn(
                      "w-[190%] aspect-square rounded-full border-t-4 border-transparent absolute bottom-0 left-1/2 -translate-x-1/2 transition-colors duration-300",
                      isInTune && "border-t-accent"
                    )}
                    style={{
                      transform: `rotate(-45deg)`,
                      borderTopColor: isInTune ? 'hsl(var(--accent))' : 'transparent',
                    }}
                   ></div>
                </div>
                 {/* Needle */}
                <div
                  className="absolute bottom-0 left-1/2 w-px h-28 origin-bottom transition-transform duration-200 ease-out"
                  style={{ transform: `rotate(${needleRotation}deg)` }}
                >
                  <div
                    className={cn(
                      "w-full h-full transition-colors duration-300",
                      isInTune ? "bg-accent" : "bg-foreground"
                    )}
                  ></div>
                </div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary"></div>
              </div>
              
              {/* Note Display */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Detected Note</p>
                <div
                  className={cn(
                    "text-8xl font-bold transition-colors duration-300",
                    isInTune ? "text-accent" : "text-primary"
                  )}
                >
                  {note.name || "--"}
                </div>
                 <p className={cn("font-mono text-lg", isInTune ? "text-accent" : "text-muted-foreground")}>
                   {centsOff !== 0 ? `${centsOff.toFixed(1)} cents` : "In Tune"}
                </p>
              </div>

              {/* Frequency Display */}
               <div className="text-center font-mono">
                  <p className="text-muted-foreground text-sm">Frequency</p>
                  <p className="text-2xl">{frequency > 0 ? `${frequency.toFixed(2)} Hz` : "0.00 Hz"}</p>
                </div>

            </div>
          ) : (
            <div className="w-full h-80 flex flex-col items-center justify-center gap-4">
              <MicOff className="w-24 h-24 text-muted-foreground/50" />
              <p className="text-muted-foreground">Tuner is off</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleToggle} size="lg" className="rounded-full w-48 h-16 shadow-lg">
        {isDetecting ? <MicOff className="mr-2" /> : <Mic className="mr-2" />}
        {isDetecting ? "Stop" : "Start"} Tuning
      </Button>
    </div>
  );
}
