"use client";

import { Button } from "@/components/ui/button";

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

export function NotePads() {
  return (
    <div className="w-full max-w-md mt-8">
      <h2 className="text-2xl font-bold text-center mb-4 text-primary">Reference Notes</h2>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {notes.map((note) => (
          <Button
            key={note.name}
            variant="outline"
            className="aspect-square h-auto w-full text-2xl font-bold"
            onClick={() => playNote(note.frequency)}
          >
            {note.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
