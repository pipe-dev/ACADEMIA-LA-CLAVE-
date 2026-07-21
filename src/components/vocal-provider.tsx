'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { type NoteInfo } from '@/components/tuner';
import { VocalRangeAssessor } from '@/components/vocal-range-assessor';
import { useInventory } from '@/hooks/use-inventory';
import { useProfile } from '@/hooks/use-profile';
import { dbLoad, dbSave } from '@/lib/db';
import { UserProfileDialog } from '@/components/user-profile-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Mic, Music, BarChart3, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const noteStrings = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];

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

interface VocalContextType {
  gender: 'masculino' | 'femenino' | null;
  pitchPreference: 'grave' | 'medio' | 'agudo' | null;
  notePool: NoteInfo[] | null;
  vocalRangeKey: string;
  setupStep: 'range' | 'profile' | 'ready';
  handleResetRange: () => void;
  setShowVocalAssessor: (val: boolean) => void;
}

const VocalContext = createContext<VocalContextType | undefined>(undefined);

export function useVocalContext() {
  const context = useContext(VocalContext);
  if (!context) {
    throw new Error('useVocalContext must be used within a VocalProvider');
  }
  return context;
}

export function VocalProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { equippedTheme } = useInventory();
  const { isLoaded: profileLoaded, isProfileSet } = useProfile();
  const pathname = usePathname();
  const router = useRouter();
  
  const [pitchPreference, setPitchPreference] = useState<'grave' | 'medio' | 'agudo' | null>(null);
  const [gender, setGender] = useState<'masculino' | 'femenino' | null>(null);
  
  const [notePool, setNotePool] = useState<NoteInfo[] | null>(null);
  const [vocalRangeKey, setVocalRangeKey] = useState<string>('');
  
  const [showVocalAssessor, setShowVocalAssessor] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [setupStep, setSetupStep] = useState<'range' | 'profile' | 'ready'>('range');
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  useEffect(() => {
    if (!profileLoaded) return;
    
    Promise.all([
      dbLoad<'masculino' | 'femenino'>('afinapp_user_gender'),
      dbLoad<'grave' | 'medio' | 'agudo'>('afinapp_user_pitch'),
    ]).then(([savedGender, savedPitch]) => {
      if (savedGender) setGender(savedGender);
      if (savedPitch) setPitchPreference(savedPitch);
      
      if (!savedGender || !savedPitch) {
         setSetupStep('range');
      } else if (!isProfileSet) {
         setSetupStep('profile');
         setShowProfileDialog(true);
      } else {
         setSetupStep('ready');
      }
      setIsInitializing(false);
    }).catch(() => setIsInitializing(false));
  }, [profileLoaded, isProfileSet]);

  // Apply equipped skin theme
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-rosegold', 'theme-sapphire', 'theme-galaxy');
    if (equippedTheme) root.classList.add(`theme-${equippedTheme}`);
    else if (gender === 'femenino') root.classList.add('theme-rosegold');
  }, [gender, equippedTheme]);

  // Compute note pool when range is known
  useEffect(() => {
    if (pitchPreference && gender && (setupStep === 'ready' || setupStep === 'range' || setupStep === 'profile')) {
      let startMidi: number, endMidi: number;
      const key = `vocalStudioProgress_${gender}_${pitchPreference}`;
      setVocalRangeKey(key);

      if (gender === 'masculino') {
        if (pitchPreference === 'grave') { // Barítono/Bajo
          startMidi = 43; // G2
          endMidi = 60;   // C4
        } else if (pitchPreference === 'medio') { // Voz media
          startMidi = 45; // A2
          endMidi = 65;   // F4
        } else { // Agudo
          startMidi = 48; // C3
          endMidi = 71;   // B4
        }
      } else { // Femenino
        if (pitchPreference === 'grave') { // Contralto
          startMidi = 57; // A3
          endMidi = 74;   // D5
        } else if (pitchPreference === 'medio') { // Voz media
          startMidi = 60; // C4
          endMidi = 79;   // G5
        } else { // Soprano
          startMidi = 62; // D4
          endMidi = 83;   // B5
        }
      }
      
      setNotePool(generateNotePool(startMidi, endMidi));
    }
  }, [pitchPreference, gender, setupStep]);

  const checkRangeAdvance = (g: typeof gender, p: typeof pitchPreference) => {
    if (g && p) {
      toast({ variant: "accent", title: "¡Perfecto!", description: "Hemos configurado tu rango vocal.", duration: 3000 });
      if (!isProfileSet) {
        setSetupStep('profile');
        setShowProfileDialog(true);
      } else {
        setSetupStep('ready');
      }
    }
  };

  const handleGenderSelect = (g: 'masculino' | 'femenino') => {
    setGender(g);
    dbSave('afinapp_user_gender', g);
    checkRangeAdvance(g, pitchPreference);
  };
  
  const handlePitchSelect = (p: 'grave' | 'medio' | 'agudo') => {
    setPitchPreference(p);
    dbSave('afinapp_user_pitch', p);
    checkRangeAdvance(gender, p);
  };

  const handleProfileComplete = () => {
     setShowProfileDialog(false);
     setSetupStep('ready');
  };

  const handleResetRange = () => {
     dbSave('afinapp_user_gender', null);
     dbSave('afinapp_user_pitch', null);
     setGender(null);
     setPitchPreference(null);
     setSetupStep('range');
     router.push('/');
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        toast({
          title: 'Sesión Cerrada',
          description: 'Has salido de la academia.',
        });
        router.push('/login');
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isInitializing || !profileLoaded) {
    return <main className="flex min-h-screen bg-background" />;
  }

  if (showVocalAssessor) {
    return (
      <main className="w-full h-[100dvh] bg-background text-foreground">
        <VocalRangeAssessor onClose={() => setShowVocalAssessor(false)} />
      </main>
    );
  }

  if (setupStep !== 'ready' || !notePool || !gender || !vocalRangeKey) {
    return (
      <main className="flex h-[100dvh] flex-col items-center justify-start bg-background text-foreground p-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <UserProfileDialog isOpen={showProfileDialog} onClose={handleProfileComplete} />

        {setupStep === 'range' && (
          <div className="w-full flex-col flex items-center justify-start pb-8">
            <div className="text-center mt-4 mb-6 sm:mt-12 sm:mb-8 animate-in fade-in zoom-in duration-500 shrink-0">
              <h1 className="text-3xl sm:text-5xl font-black text-foreground">AfinApp</h1>
              <p className="text-muted-foreground mt-1 sm:mt-4 max-w-md sm:max-w-xl text-sm sm:text-lg px-2">Ayúdanos a entender tu voz para personalizar tu experiencia.</p>
            </div>

            <div className="flex flex-col gap-4 sm:gap-6 w-full max-w-xs sm:max-w-sm animate-in fade-in-50 slide-in-from-bottom flex-shrink-0">
              <Card className="bg-card/50 border-2 border-transparent">
                  <CardHeader>
                      <CardTitle className="text-lg sm:text-xl font-semibold text-center">¿Cuál es tu tipo de voz?</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3">
                      <Button onClick={() => handleGenderSelect('masculino')} variant={gender === 'masculino' ? 'default' : 'secondary'} size="lg" className="h-14 text-sm sm:h-16 sm:text-base">Masculina</Button>
                      <Button onClick={() => handleGenderSelect('femenino')} variant={gender === 'femenino' ? 'default' : 'secondary'} size="lg" className="h-14 text-sm sm:h-16 sm:text-base">Femenina</Button>
                  </CardContent>
              </Card>

              <Card className="bg-card/50 border-2 border-transparent">
                  <CardHeader>
                      <CardTitle className="text-lg sm:text-xl font-semibold text-center">¿Cómo te sientes mejor al cantar?</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                      <Button onClick={() => handlePitchSelect('grave')} variant={pitchPreference === 'grave' ? 'default' : 'secondary'} size="lg" className="h-14 text-sm sm:h-16 sm:text-base">Cómodo en graves</Button>
                      <Button onClick={() => handlePitchSelect('medio')} variant={pitchPreference === 'medio' ? 'default' : 'secondary'} size="lg" className="h-14 text-sm sm:h-16 sm:text-base">Cómodo en medios (Voz media)</Button>
                      <Button onClick={() => handlePitchSelect('agudo')} variant={pitchPreference === 'agudo' ? 'default' : 'secondary'} size="lg" className="h-14 text-sm sm:h-16 sm:text-base">Cómodo en agudos</Button>
                  </CardContent>
              </Card>

              <div className="relative mt-8 mb-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">O para profesores</span>
                </div>
              </div>

              <Button 
                onClick={() => setShowVocalAssessor(true)} 
                variant="outline" 
                size="lg" 
                className="h-14 text-sm sm:h-16 sm:text-base border-primary/40 bg-primary/5 hover:bg-primary/20 text-primary font-bold w-full"
              >
                🎤 Evaluación Vocal Clínica
              </Button>
            </div>
          </div>
        )}
      </main>
    );
  }

  const isAcademyActive = pathname === '/' || pathname === '/clases';
  const isTunerActive = pathname === '/afinador';
  const isPracticaActive = pathname === '/practica';
  const isProgressActive = pathname === '/progreso';

  return (
    <VocalContext.Provider value={{
      gender,
      pitchPreference,
      notePool,
      vocalRangeKey,
      setupStep,
      handleResetRange,
      setShowVocalAssessor
    }}>
      <div className="flex flex-col min-h-[100dvh] bg-background relative pb-20">
        {/* Main Route Screen Area */}
        <div className="flex-grow overflow-y-auto relative pb-20">
          {children}
        </div>

        {/* Global Bottom Navigation Bar (Fixed Glassmorphic) */}
        <nav className="fixed bottom-0 inset-x-0 bg-card/95 backdrop-blur-lg border-t border-border/40 px-6 py-2.5 flex justify-around items-center z-[100] shadow-2xl">
          <Link
            href="/clases"
            className={cn(
              "flex flex-col items-center gap-1.5 py-1 px-3 rounded-2xl transition-all duration-300 outline-none select-none",
              isAcademyActive 
                ? "text-primary scale-105 font-black bg-primary/10" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <GraduationCap className="w-5 h-5" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Academia</span>
          </Link>

          <Link
            href="/afinador"
            className={cn(
              "flex flex-col items-center gap-1.5 py-1 px-3 rounded-2xl transition-all duration-300 outline-none select-none",
              isTunerActive 
                ? "text-primary scale-105 font-black bg-primary/10" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Mic className="w-5 h-5" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Afinador</span>
          </Link>

          <Link
            href="/practica"
            className={cn(
              "flex flex-col items-center gap-1.5 py-1 px-3 rounded-2xl transition-all duration-300 outline-none select-none",
              isPracticaActive 
                ? "text-primary scale-105 font-black bg-primary/10" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Music className="w-5 h-5" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Práctica</span>
          </Link>

          <Link
            href="/progreso"
            className={cn(
              "flex flex-col items-center gap-1.5 py-1 px-3 rounded-2xl transition-all duration-300 outline-none select-none",
              isProgressActive 
                ? "text-primary scale-105 font-black bg-primary/10" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Progreso</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-1.5 py-1 px-3 rounded-2xl transition-all duration-300 outline-none select-none text-muted-foreground hover:text-red-400"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Salir</span>
          </button>
        </nav>
      </div>
    </VocalContext.Provider>
  );
}
