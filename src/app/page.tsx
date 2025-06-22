import { NotePads } from '@/components/note-pads';
import { Tuner } from '@/components/tuner';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold font-headline text-primary">Perfect Pitch</h1>
        <p className="text-muted-foreground mt-2">Sing or play a note, and we'll tell you if you're in tune.</p>
      </div>
      <Tuner />
      <NotePads />
    </main>
  );
}
