
'use client';

import { useState, useEffect } from 'react';
import { Tuner, type NoteInfo } from '@/components/tuner';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const generateNotePool = (startMidi: number, endMidi: number): NoteInfo[] => {
    const notes: NoteInfo[] = [];
    for (let midi = startMidi; midi <= endMidi; midi++) {
        const octave = Math.floor(midi / 12) - 1;
        const name = noteStrings[midi % 12];
        const frequency = 440 * Math.pow(2, (midi - 69) / 12);
        notes.push({ name, octave, frequency, fullName: `${name}${octave}` });
    }
    return notes;
};


export function AppContainer() {
  const [pitchPreference, setPitchPreference] = useState<'grave' | 'agudo' | null>(null);
  const [gender, setGender] = useState<'masculino' | 'femenino' | null>(null);
  const [notePool, setNotePool] = useState<NoteInfo[] | null>(null);

  useEffect(() => {
    if (pitchPreference && gender) {
      let startMidi: number, endMidi: number;

      if (gender === 'masculino') {
        if (pitchPreference === 'grave') { // Baritone/Bass
          startMidi = 43; // G2
          endMidi = 67;   // G4
        } else { // Tenor
          startMidi = 48; // C3
          endMidi = 72;   // C5
        }
      } else { // Femenino
        if (pitchPreference === 'grave') { // Alto/Contralto
          startMidi = 53; // F3
          endMidi = 77;   // F5
        } else { // Soprano
          startMidi = 57; // A3
          endMidi = 81;   // A5
        }
      }
      
      const pool = generateNotePool(startMidi, endMidi);
      setNotePool(pool);
    }
  }, [pitchPreference, gender]);

  if (!notePool) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-4 gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary">Primero, cuéntanos sobre tu voz</h1>
          <p className="text-muted-foreground mt-2">Esto nos ayudará a ajustar los ejercicios a tu rango vocal.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 animate-in fade-in-50 duration-500">
          <Card className="w-full md:w-80">
            <CardHeader>
              <CardTitle className="text-center text-lg">¿Cómo sientes tu voz al cantar?</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button onClick={() => setPitchPreference('grave')} variant={pitchPreference === 'grave' ? 'default' : 'outline'} size="lg">Cómodo en graves</Button>
              <Button onClick={() => setPitchPreference('agudo')} variant={pitchPreference === 'agudo' ? 'default' : 'outline'} size="lg">Cómodo en agudos</Button>
            </CardContent>
          </Card>

          <Card className="w-full md:w-80">
            <CardHeader>
              <CardTitle className="text-center text-lg">¿Cuál es tu tipo de voz?</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button onClick={() => setGender('masculino')} variant={gender === 'masculino' ? 'default' : 'outline'} size="lg">Masculina</Button>
              <Button onClick={() => setGender('femenino')} variant={gender === 'femenino' ? 'default' : 'outline'} size="lg">Femenina</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold font-headline text-primary">Perfect Pitch Challenge</h1>
        <p className="text-muted-foreground mt-2">Escucha la nota, cántala y mantén la afinación para ganar.</p>
      </div>
      <Tuner notePool={notePool} />
    </main>
  );
}
