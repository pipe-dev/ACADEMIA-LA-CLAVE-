"use client";

import { Mic, MicOff } from "lucide-react";
import { usePitchDetection } from "@/hooks/use-pitch-detection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const notes = [
  { name: "C", frequency: 261.63 },
  { name: "C#", frequency: 277.18 },
  { name: "D", frequency: 293.66 },
  { name: "D#", frequency: 311.13 },
  { name: "E", frequency: 329.63 },
  { name: "F", frequency: 349.23 },
  { name: "F#", frequency: 369.99 },
  { name: "G", frequency: 392.00 },
  { name: "G#", frequency: 415.30 },
  { name: "A", frequency: 440.00 },
  { name: "A#", frequency: 466.16 },
  { name: "B", frequency: 493.88 },
];

let audioContext: AudioContext | null = null;

const playNote = (frequency: number) => {
  if (typeof window !== 'undefined') {
    if (!audioContext || audioContext.state === 'closed') {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 1);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);
  }
};


export function Tuner() {
  const { note, frequency, centsOff, isDetecting, start, stop } = usePitchDetection();

  const handleToggle = () => {
    if (isDetecting) {
      stop();
    } else {
      start();
    }
  };

  const isInTune = Math.abs(centsOff) < 15;

  const radius = 160;
  const buttonSize = 64;
  const containerSize = radius * 2 + buttonSize;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg">
       <div
        className="relative flex items-center justify-center mt-8"
        style={{ width: `${containerSize}px`, height: `${containerSize}px` }}
      >
        {notes.map((n, i) => {
          const angle = (i / notes.length) * 2 * Math.PI - Math.PI / 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const isActive = note.name === n.name;

          return (
            <Button
              key={n.name}
              variant={isActive ? "default" : "outline"}
              className={cn(
                "absolute aspect-square h-16 w-16 rounded-full text-xl font-bold flex items-center justify-center transition-all duration-200 z-10",
                isActive ? "bg-accent text-accent-foreground scale-110" : "hover:scale-105 bg-card"
              )}
              style={{
                top: `calc(50% - ${buttonSize / 2}px)`,
                left: `calc(50% - ${buttonSize / 2}px)`,
                transform: `translate(${x}px, ${y}px)`,
              }}
              onClick={() => playNote(n.frequency)}
            >
              {n.name}
            </Button>
          );
        })}

        <Card className="w-64 h-64 rounded-full shadow-lg border-2 border-primary/20 flex items-center justify-center absolute">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
             {isDetecting ? (
              <div className="flex flex-col items-center justify-center">
                <p className="text-sm text-muted-foreground">Detected Note</p>
                <div
                  className={cn(
                    "text-7xl font-bold transition-colors duration-300",
                    isInTune ? "text-accent" : "text-primary"
                  )}
                >
                  {note.name || "--"}
                </div>
                 <p className={cn("font-mono text-base", isInTune ? "text-accent" : "text-muted-foreground")}>
                   {centsOff !== 0 ? `${centsOff.toFixed(1)} cents` : "In Tune"}
                </p>
                <div className="font-mono mt-2">
                  <p className="text-muted-foreground text-xs">Frequency</p>
                  <p className="text-xl">{frequency > 0 ? `${frequency.toFixed(2)} Hz` : "0.00 Hz"}</p>
                </div>
              </div>
            ) : (
                <div className="flex flex-col items-center justify-center gap-2">
                  <MicOff className="w-16 h-16 text-muted-foreground/50" />
                  <p className="text-muted-foreground">Tuner is off</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleToggle} size="lg" className="rounded-full w-48 h-16 shadow-lg mt-4">
        {isDetecting ? <MicOff className="mr-2" /> : <Mic className="mr-2" />}
        {isDetecting ? "Stop" : "Start"} Tuning
      </Button>
    </div>
  );
}
