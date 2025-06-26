
'use client';

import { useState, useEffect } from 'react';
import { Tuner, type NoteInfo } from '@/components/tuner';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";

const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const generateNotePool = (startMidi: number, endMidi: number): NoteInfo[] => {
    const notes: NoteInfo[] = [];
    for (let midi = startMidi; midi <= endMidi; midi++) {
        const octave = Math.floor(midi / 12) - 1;
        const name = noteStrings[midi % 12];
        const frequency = 440 * Math.pow(2, (midi - 69) / 12);
        notes.push({ name, octave, frequency, fullName: `${name}${octave}`, midi });
    }
    return notes;
};

export function AppContainer() {
  const { toast } = useToast();
  const [pitchPreference, setPitchPreference] = useState<'grave' | 'agudo' | null>(null);
  const [gender, setGender] = useState<'masculino' | 'femenino' | null>(null);
  const [notePool, setNotePool] = useState<NoteInfo[] | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (gender === 'femenino') {
      root.classList.add('theme-rosegold');
    } else {
      root.classList.remove('theme-rosegold');
    }
  }, [gender]);

  useEffect(() => {
    if (pitchPreference && gender) {
      let startMidi: number, endMidi: number;

      if (gender === 'masculino') {
        if (pitchPreference === 'grave') { // Barítono/Bajo
          startMidi = 43; // G2
          endMidi = 60;   // C4
        } else { // Tenor
          startMidi = 48; // C3
          endMidi = 71;   // B4
        }
      } else { // Femenino
        if (pitchPreference === 'grave') { // Alto/Contralto
          startMidi = 57; // A3
          endMidi = 74;   // D5
        } else { // Soprano
          startMidi = 62; // D4
          endMidi = 83;   // B5
        }
      }
      
      const pool = generateNotePool(startMidi, endMidi);
      setNotePool(pool);
      
      toast({
        variant: "accent",
        title: "¡Perfecto!",
        description: "Hemos configurado tu rango vocal.",
        duration: 4000,
      });

      setIsReady(true);
    }
  }, [pitchPreference, gender, toast]);

  if (isReady && notePool && gender) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-4">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold font-headline text-foreground">Desafío de Afinación</h1>
          <p className="text-muted-foreground mt-2 text-lg">Escucha y canta la nota para ganar.</p>
        </div>
        <Tuner notePool={notePool} gender={gender} />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-4 sm:p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground">Bienvenido a Vocal Studio</h1>
        <p className="text-muted-foreground mt-3 max-w-xl text-lg">Para comenzar, ayúdanos a entender tu voz para personalizar tu experiencia.</p>
      </div>

      <div className="flex flex-col gap-8 w-full max-w-md animate-in fade-in-50 duration-500">
        <Card className="bg-card/50 border-2 border-transparent">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-center">¿Cómo te sientes mejor al cantar?</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button onClick={() => setPitchPreference('grave')} variant={pitchPreference === 'grave' ? 'default' : 'secondary'} size="lg" className="h-16 text-base">Cómodo en graves</Button>
            <Button onClick={() => setPitchPreference('agudo')} variant={pitchPreference === 'agudo' ? 'default' : 'secondary'} size="lg" className="h-16 text-base">Cómodo en agudos</Button>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-2 border-transparent">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-center">¿Cuál es tu tipo de voz?</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button onClick={() => setGender('masculino')} variant={gender === 'masculino' ? 'default' : 'secondary'} size="lg" className="h-16 text-base">Masculina</Button>
            <Button onClick={() => setGender('femenino')} variant={gender === 'femenino' ? 'default' : 'secondary'} size="lg" className="h-16 text-base">Femenina</Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
