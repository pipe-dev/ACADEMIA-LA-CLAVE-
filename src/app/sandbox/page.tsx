"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePitchDetection } from "@/hooks/use-pitch-detection";
import { PolygraphCanvas, NoteData, CurvePoint } from "@/components/practica/polygraph-canvas";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Play, Square, Magnet, Zap, RotateCcw, Activity } from "lucide-react";

const MOCK_MELODY: NoteData[] = [
  { start: 1.0, end: 2.5, pitch: 'C4', midi: 60 },
  { start: 2.8, end: 4.5, pitch: 'E4', midi: 64 },
  { start: 4.5, end: 6.0, pitch: 'G4', midi: 67 },
  { start: 6.5, end: 10.0, pitch: 'C5', midi: 72 },
];

const generateMockCurve = (): CurvePoint[] => {
  const curve: CurvePoint[] = [];
  
  MOCK_MELODY.forEach((note, i) => {
      const duration = note.end - note.start;
      const pointsCount = Math.floor(duration * 30);
      
      for (let p = 0; p <= pointsCount; p++) {
          const t = note.start + (p / 30);
          let midi = note.midi;
          
          // Vibrato en notas largas (después de 0.4s)
          if (duration > 1.0) {
              const timeInNote = t - note.start;
              if (timeInNote > 0.4) {
                 midi += Math.sin((timeInNote - 0.4) * Math.PI * 2 * 5) * 0.4;
              }
          }
          curve.push({ time: t, midi });
      }
      
      // Glissando (Portamento) hacia la siguiente nota si están muy cerca
      if (i < MOCK_MELODY.length - 1) {
          const nextNote = MOCK_MELODY[i + 1];
          const gap = nextNote.start - note.end;
          if (gap > 0 && gap <= 0.5) {
              const slidePoints = Math.floor(gap * 30);
              for (let p = 1; p < slidePoints; p++) {
                  const t = note.end + (p / 30);
                  const progress = p / slidePoints;
                  const smooth = progress * progress * (3 - 2 * progress); // Ease-in-out
                  const slideMidi = note.midi + (nextNote.midi - note.midi) * smooth;
                  curve.push({ time: t, midi: slideMidi });
              }
          }
      }
  });
  
  return curve;
};

const MOCK_CURVE = generateMockCurve();

export default function SandboxPage() {
  const { frequency, isDetecting, start, stop, rms } = usePitchDetection();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [mode, setMode] = useState<'A' | 'B' | 'C'>('C');

  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // Score System (Porcentaje 0-100%)
  const totalPossibleSeconds = MOCK_MELODY.reduce((acc, note) => acc + (note.end - note.start), 0);
  const scoreRef = useRef(0);
  const comboFramesRef = useRef(0);
  const scoreUIRef = useRef<HTMLDivElement>(null);
  const comboUIRef = useRef<HTMLDivElement>(null);

  const handleHitUpdate = (isHit: boolean) => {
    if (isHit) {
       comboFramesRef.current += 1;
       // Sumamos la fracción de segundo (1 frame a 30fps)
       scoreRef.current += (1 / 30); 
    } else {
       comboFramesRef.current = 0; 
    }

    if (scoreUIRef.current) {
       let percentage = (scoreRef.current / totalPossibleSeconds) * 100;
       if (percentage > 100) percentage = 100; // Cap visual
       scoreUIRef.current.innerText = percentage.toFixed(0) + "%";
    }
    if (comboUIRef.current) {
       const mult = Math.min(Math.floor(comboFramesRef.current / 30) + 1, 4);
       if (comboFramesRef.current > 30) {
           comboUIRef.current.innerText = `x${mult} Combo!`;
           comboUIRef.current.style.opacity = '1';
           comboUIRef.current.style.color = '#34d399';
       } else {
           comboUIRef.current.style.opacity = '0.5';
           comboUIRef.current.style.color = '#94a3b8';
           comboUIRef.current.innerText = `Racha...`;
       }
    }
  };

  useEffect(() => {
    if (isPlaying) {
      if (startTimeRef.current === null) {
         startTimeRef.current = performance.now() - (currentTime * 1000);
      }
      
      let lastTimerUpdate = 0;
      const fpsInterval = 1000 / 30;

      const updateTimer = (now: number) => {
        rafRef.current = requestAnimationFrame(updateTimer);

        if (!lastTimerUpdate) lastTimerUpdate = now;
        const deltaTime = now - lastTimerUpdate;
        
        if (deltaTime < fpsInterval) return;
        lastTimerUpdate = now - (deltaTime % fpsInterval);

        const elapsed = (now - startTimeRef.current!) / 1000;
        setCurrentTime(elapsed);
      };
      
      rafRef.current = requestAnimationFrame(updateTimer);
    } else {
      startTimeRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying]);

  const handleStartPractice = async () => {
    if (!isDetecting) {
      await start();
    }
    setIsPlaying(true);
    setCurrentTime(0);
    startTimeRef.current = null;
    scoreRef.current = 0;
    comboFramesRef.current = 0;
    if (scoreUIRef.current) scoreUIRef.current.innerText = "0%";
    if (comboUIRef.current) {
      comboUIRef.current.innerText = "Racha...";
      comboUIRef.current.style.opacity = '0.5';
    }
  };

  const handleStopPractice = () => {
    if (isDetecting) stop();
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 flex flex-col gap-6 text-white font-sans items-center justify-center">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        
        {/* Cabecera con Puntaje */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-emerald-400 drop-shadow-md mb-1">Laboratorio del Polígrafo</h1>
            <p className="text-slate-400 text-sm">
              Paso 3: Puntaje y VFX. ¡Acierta a las notas para subir tu racha!
            </p>
          </div>
          
          <div className="text-right bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-end min-w-[200px]">
            <div 
               ref={comboUIRef} 
               className="text-sm font-bold text-slate-400 uppercase tracking-widest transition-all duration-200"
            >
              Racha...
            </div>
            <div 
               ref={scoreUIRef} 
               className="text-5xl font-black text-white font-mono drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]"
            >
              0%
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800">
          
          {/* Unified Controls */}
          <div className="flex gap-4">
            <button 
              onClick={handleStartPractice}
              className={`px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                isPlaying 
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-900' 
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
              }`}
            >
              {isPlaying ? (
                <>
                  <RotateCcw className="w-5 h-5" />
                  Reiniciar Práctica
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  Iniciar Práctica
                </>
              )}
            </button>
            {(isPlaying || isDetecting) && (
              <button 
                onClick={handleStopPractice}
                className="px-6 py-2 bg-slate-800 text-slate-300 rounded-lg font-bold hover:bg-slate-700 hover:text-white transition-all flex items-center gap-2"
              >
                <Square className="w-5 h-5 fill-current" />
                Detener
              </button>
            )}
          </div>

          <div className="flex gap-2 bg-black/40 p-1 rounded-lg border border-slate-800">
            <Button
              variant="ghost"
              onClick={() => setMode('A')}
              className={`h-10 px-4 flex gap-2 ${mode === 'A' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Zap className="w-4 h-4" /> Libre
            </Button>
            <Button
              variant="ghost"
              onClick={() => setMode('B')}
              className={`h-10 px-4 flex gap-2 ${mode === 'B' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Magnet className="w-4 h-4" /> Ladrillos
            </Button>
            <Button
              variant="ghost"
              onClick={() => setMode('C')}
              className={`h-10 px-4 flex gap-2 ${mode === 'C' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Activity className="w-4 h-4" /> Curvas
            </Button>
          </div>
          

        </div>

        <div className="bg-black/50 p-2 rounded-2xl border-4 border-slate-900 shadow-2xl">
          <PolygraphCanvas 
            frequency={frequency} 
            isDetecting={isDetecting} 
            currentTime={currentTime}
            melodyData={MOCK_MELODY}
            curveData={MOCK_CURVE}
            polygraphMode={mode}
            onHitUpdate={handleHitUpdate}
          />
        </div>
        
        <div className="text-center font-mono text-slate-500 text-xl">
          00:{currentTime.toFixed(2).padStart(5, '0')}
        </div>
      </div>
    </div>
  );
}
