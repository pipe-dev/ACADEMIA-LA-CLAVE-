'use client';
import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../utils/audioService';
import { Wind, Play, Pause, RotateCcw, Sparkles, CheckCircle2, Activity } from 'lucide-react';
import confetti from 'canvas-confetti';

export interface BreathingTechnique {
  id: string;
  name: string;
  subtitle: string;
  category: 'Rehabilitación' | 'Control Vocal' | 'Relajación';
  description: string;
  instructions: string;
  phases: {
    type: 'inhale' | 'hold_full' | 'exhale' | 'hold_empty';
    duration: number; // in seconds
    label: string;
    detail: string;
  }[];
}

export const BREATHING_TECHNIQUES: BreathingTechnique[] = [
  {
    id: 'pursed-lips',
    name: 'Labios Fruncidos',
    subtitle: 'Rehabilitación Pulmonar y Presión Positiva',
    category: 'Rehabilitación',
    description: 'Inhala por la nariz y exhala por la boca con labios fruncidos como soplando suavemente una vela sin apagarla.',
    instructions: 'Genera presión de aire retrógrada para mantener abiertas las vías respiratorias y oxigenar al máximo.',
    phases: [
      { type: 'inhale', duration: 4, label: 'Inhala por la nariz', detail: 'Siente cómo se expande tu abdomen' },
      { type: 'exhale', duration: 8, label: 'Exhala con labios fruncidos', detail: 'Sopla suavemente como hacia una vela' }
    ]
  },
  {
    id: 'siseo-15s',
    name: 'Ejercicio del Siseo ("S")',
    subtitle: 'Control de Apoyo y Aire Subglótico',
    category: 'Control Vocal',
    description: 'Emite un sonido de siseo "sssss..." constante y uniforme. Desarrolla resistencia en el diafragma.',
    instructions: 'Mantén el flujo de "S" lo más plano y parejo posible sin que tiemble.',
    phases: [
      { type: 'inhale', duration: 4, label: 'Inhala diafragmático', detail: 'Aire profundo a la zona abdominal' },
      { type: 'exhale', duration: 15, label: 'Sisea "ssssssss..."', detail: 'Dosifica el aire de forma constante' }
    ]
  },
  {
    id: 'tech-478',
    name: 'Técnica 4-7-8 Adaptada',
    subtitle: 'Fortalecimiento Alveolar y Calma Vocal',
    category: 'Rehabilitación',
    description: 'Inhala en 4s, retén el aire 7s para intercambio de gases, y exhala con labios casi cerrados en 8s.',
    instructions: 'Obliga a los músculos espiratorios a trabajar con resistencia suave.',
    phases: [
      { type: 'inhale', duration: 4, label: 'Inhala profundamente', detail: 'Aire por la nariz en 4 segundos' },
      { type: 'hold_full', duration: 7, label: 'Retén el aire', detail: 'Músculos relajados, alvéolos abiertos' },
      { type: 'exhale', duration: 8, label: 'Exhala con resistencia', detail: 'Labios en hendidura muy pequeña' }
    ]
  },
  {
    id: 'box-breathing',
    name: 'Respiración Cuadrada (4-4-4-4)',
    subtitle: 'Estabilidad Rítmica y Enfoque',
    category: 'Relajación',
    description: '4 tiempos iguales: Inhala, Retén, Exhala y Pausa al vacío. Equilibra el sistema nervioso.',
    instructions: 'Ritmo en 4 cuadrantes perfecto para antes de subir al escenario o cantar.',
    phases: [
      { type: 'inhale', duration: 4, label: 'Inhala', detail: 'Expansión rítmica de 4s' },
      { type: 'hold_full', duration: 4, label: 'Retén con aire', detail: 'Pausa llena de 4s' },
      { type: 'exhale', duration: 4, label: 'Exhala', detail: 'Vaciado suave de 4s' },
      { type: 'hold_empty', duration: 4, label: 'Pausa sin aire', detail: 'Pausa vacía de 4s' }
    ]
  },
  {
    id: 'triangular',
    name: 'Respiración Triangular (3-6-6)',
    subtitle: 'Capacidad Pulmonar Progresiva',
    category: 'Rehabilitación',
    description: 'Inhalación rápida de 3s, retención sostenida de 6s y exhalación controlada de 6s.',
    instructions: 'Optimiza la elasticidad pulmonar y fortalece el diafragma.',
    phases: [
      { type: 'inhale', duration: 3, label: 'Inhala en 3s', detail: 'Llenado diafragmático ágil' },
      { type: 'hold_full', duration: 6, label: 'Retén en 6s', detail: 'Mapeo de la presión interna' },
      { type: 'exhale', duration: 6, label: 'Exhala en 6s', detail: 'Desinflado uniforme' }
    ]
  },
  {
    id: 'anchorage-5510',
    name: 'Anclaje Vocal Avanzado (5-5-10)',
    subtitle: 'Resistencia Extrema para Cantantes',
    category: 'Control Vocal',
    description: '5s Inhala, 5s Retén, 10s Exhalación ultra-dosificada. Para fraseos largos sin fatiga.',
    instructions: 'Exhala manteniendo las costillas abiertas (anclaje intercostal).',
    phases: [
      { type: 'inhale', duration: 5, label: 'Inhala en 5s', detail: 'Expansión intercostal profunda' },
      { type: 'hold_full', duration: 5, label: 'Retén en 5s', detail: 'Anclaje dorsal activo' },
      { type: 'exhale', duration: 10, label: 'Exhala en 10s', detail: 'Control de aire extremo' }
    ]
  }
];

export const BreathingGameCard: React.FC = () => {
  const [selectedTechId, setSelectedTechId] = useState<string>('pursed-lips');
  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState<number>(0);
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState<number>(4);
  const [completedCycles, setCompletedCycles] = useState<number>(0);
  const [balloonColor, setBalloonColor] = useState<'pink' | 'cyan' | 'purple' | 'emerald'>('pink');

  const currentTech = BREATHING_TECHNIQUES.find(t => t.id === selectedTechId) || BREATHING_TECHNIQUES[0];
  const currentPhase = currentTech.phases[currentPhaseIdx];

  const intervalRef = useRef<number | null>(null);

  // Initialize phase when technique changes
  useEffect(() => {
    setIsActive(false);
    setCurrentPhaseIdx(0);
    setPhaseSecondsLeft(currentTech.phases[0].duration);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [selectedTechId]);

  // Main game loop
  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setPhaseSecondsLeft((prev) => {
        if (prev <= 1) {
          // Advance phase
          audioService.playSoftDing();
          const nextIdx = (currentPhaseIdx + 1) % currentTech.phases.length;
          setCurrentPhaseIdx(nextIdx);
          
          if (nextIdx === 0) {
            setCompletedCycles((c) => {
              const newCount = c + 1;
              if (newCount % 3 === 0) {
                confetti({
                  particleCount: 35,
                  spread: 60,
                  origin: { y: 0.7 }
                });
              }
              return newCount;
            });
          }

          return currentTech.phases[nextIdx].duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, currentPhaseIdx, currentTech]);

  const handleToggleActive = () => {
    audioService.playClickSound();
    if (!isActive) {
      setIsActive(true);
    } else {
      setIsActive(false);
    }
  };

  const handleReset = () => {
    audioService.playClickSound();
    setIsActive(false);
    setCurrentPhaseIdx(0);
    setPhaseSecondsLeft(currentTech.phases[0].duration);
    setCompletedCycles(0);
  };

  // Calculate smooth scale factor for balloon animation (0.5 to 1.15)
  const phaseTotal = currentPhase.duration;
  const phaseElapsed = phaseTotal - phaseSecondsLeft;
  const progressRatio = phaseElapsed / phaseTotal;

  let balloonScale = 0.55;
  let phaseGlowColor = 'rgba(244, 114, 182, 0.4)';
  let phaseStatusBadge = 'bg-pink-100 text-pink-800 dark:bg-pink-950/80 dark:text-pink-200 border-pink-300';

  if (currentPhase.type === 'inhale') {
    balloonScale = 0.50 + progressRatio * 0.65; // Expands smoothly to 1.15
    phaseGlowColor = 'rgba(59, 130, 246, 0.5)';
    phaseStatusBadge = 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-200 border-blue-300';
  } else if (currentPhase.type === 'hold_full') {
    balloonScale = 1.15 + Math.sin(Date.now() / 300) * 0.03; // Pulsing full
    phaseGlowColor = 'rgba(168, 85, 247, 0.6)';
    phaseStatusBadge = 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-200 border-purple-300';
  } else if (currentPhase.type === 'exhale') {
    balloonScale = 1.15 - progressRatio * 0.65; // Deflates smoothly back to 0.50
    phaseGlowColor = 'rgba(16, 185, 129, 0.5)';
    phaseStatusBadge = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 border-emerald-300';
  } else if (currentPhase.type === 'hold_empty') {
    balloonScale = 0.50 + Math.sin(Date.now() / 400) * 0.02; // Resting empty
    phaseGlowColor = 'rgba(245, 158, 11, 0.5)';
    phaseStatusBadge = 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200 border-amber-300';
  }

  // Color theme mappings for balloon latex gradient
  const balloonThemeMap = {
    pink: {
      gradient: 'from-pink-400 via-rose-500 to-red-600',
      knot: '#e11d48',
      shadow: 'rgba(244, 63, 94, 0.4)'
    },
    cyan: {
      gradient: 'from-cyan-400 via-sky-500 to-blue-600',
      knot: '#0284c7',
      shadow: 'rgba(14, 165, 233, 0.4)'
    },
    purple: {
      gradient: 'from-fuchsia-400 via-purple-500 to-indigo-600',
      knot: '#7c3aed',
      shadow: 'rgba(147, 51, 234, 0.4)'
    },
    emerald: {
      gradient: 'from-teal-300 via-emerald-500 to-green-600',
      knot: '#059669',
      shadow: 'rgba(16, 185, 129, 0.4)'
    }
  };

  const activeBalloonTheme = balloonThemeMap[balloonColor];

  return (
    <div 
      role="region" 
      aria-label="Ejercicios de Respiración y Rehabilitación Pulmonar"
      className="space-y-4 transition-colors relative"
    >
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-br from-teal-50 to-emerald-50/50 dark:from-teal-950/40 dark:to-emerald-950/30 p-3.5 sm:p-4 rounded-2xl border border-teal-100 dark:border-teal-900/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white shadow-sm shadow-pink-500/20 shrink-0">
            <Wind className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="font-heading font-black text-base text-[#0b1c30] dark:text-[#d3e4fe]">
                Ejercicios de Respiración
              </h3>
              <span className="text-[10px] font-extrabold bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800 px-2 py-0.5 rounded-full shrink-0">
                Globo Terapéutico
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Rehabilitación pulmonar y control de apoyo vocal
            </p>
          </div>
        </div>

        {/* Cycles Badge */}
        <div className="self-start sm:self-center bg-white dark:bg-[#0b1828] border border-slate-200/80 dark:border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {completedCycles} {completedCycles === 1 ? 'Ciclo' : 'Ciclos'}
          </span>
        </div>
      </div>

      {/* Selector de Técnicas de Respiración */}
      <div className="space-y-2">
        <label className="text-[11px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
          Técnicas de Resistencia y Rehabilitación:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {BREATHING_TECHNIQUES.map((tech) => {
            const isSelected = tech.id === selectedTechId;
            return (
              <button
                key={tech.id}
                onClick={() => {
                  audioService.playClickSound();
                  setSelectedTechId(tech.id);
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/50 dark:to-purple-950/50 border-pink-400 dark:border-pink-600 shadow-xs ring-2 ring-pink-300 dark:ring-pink-800'
                    : 'bg-[#f8fafc] dark:bg-[#0b1828] border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    {tech.category}
                  </span>
                  {isSelected ? (
                    <Sparkles className="w-4 h-4 text-pink-500 shrink-0" />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold">{tech.phases.length} fases</span>
                  )}
                </div>
                <div>
                  <h4 className="font-heading font-extrabold text-xs text-slate-800 dark:text-slate-100 leading-snug">
                    {tech.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
                    {tech.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Canvas of the Latex Balloon */}
      <div className="bg-gradient-to-b from-[#f8fafc] to-[#eef2ff] dark:from-[#0b1828] dark:to-[#09111c] rounded-3xl p-5 sm:p-6 border border-slate-200/70 dark:border-slate-800/90 flex flex-col items-center justify-center relative min-h-[300px] overflow-hidden">
        
        {/* Phase Badge */}
        <div 
          aria-live="polite" 
          className={`px-4 py-1.5 rounded-full border text-xs font-extrabold shadow-sm mb-3 transition-all duration-300 flex items-center gap-1.5 ${phaseStatusBadge}`}
        >
          <Activity className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span>{currentPhase.label}</span>
          <span className="opacity-60">({phaseSecondsLeft}s)</span>
        </div>

        {/* The Latex Balloon Stage */}
        <div className="relative w-52 h-52 sm:w-56 sm:h-56 flex items-center justify-center">
          
          {/* External Ripple Glow Rings */}
          <div 
            className="absolute rounded-full transition-all duration-700 ease-out pointer-events-none"
            style={{
              width: `${170 * balloonScale}px`,
              height: `${210 * balloonScale}px`,
              backgroundColor: phaseGlowColor,
              filter: 'blur(18px)',
              transform: `scale(${1 + Math.sin(Date.now() / 250) * 0.05})`
            }}
          />

          {/* Balloon Container with Scale transform */}
          <div 
            className="relative transition-transform duration-500 ease-out flex flex-col items-center justify-center"
            style={{
              transform: `scale(${balloonScale})`,
              filter: `drop-shadow(0 15px 25px ${activeBalloonTheme.shadow})`
            }}
          >
            {/* Balloon Body (3D Latex Spherical Gradient) */}
            <div className={`w-36 h-44 rounded-[50%_50%_50%_50%/40%_40%_60%_60%] bg-gradient-to-tr ${activeBalloonTheme.gradient} relative overflow-hidden flex items-center justify-center shadow-inner`}>
              
              {/* Glossy Specular Highlight (Upper Left 3D Shine) */}
              <div className="absolute top-3 left-4 w-12 h-16 bg-white/40 rounded-full blur-[2px] transform -rotate-25" />
              <div className="absolute top-5 left-7 w-4 h-6 bg-white/70 rounded-full blur-[1px] transform -rotate-25" />
              
              {/* Bottom Depth Shadow */}
              <div className="absolute bottom-0 inset-x-0 h-10 bg-black/20 blur-xs" />

              {/* Countdown Number inside Balloon */}
              <div className="z-10 text-center drop-shadow-md text-white">
                <span className="font-heading font-black text-4xl block leading-none">
                  {phaseSecondsLeft}
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-90 mt-1">
                  {currentPhase.type === 'inhale' ? 'INHALAR' : currentPhase.type === 'hold_full' ? 'RETENER' : currentPhase.type === 'exhale' ? 'EXHALAR' : 'PAUSA'}
                </span>
              </div>
            </div>

            {/* Balloon Latex Knot / Nozzle */}
            <div 
              className="w-5 h-3 rounded-b-md -mt-0.5 shadow-sm"
              style={{ backgroundColor: activeBalloonTheme.knot }}
            />

            {/* Balloon Hanging String */}
            <svg className="w-12 h-10 -mt-0.5 overflow-visible" viewBox="0 0 50 40">
              <path 
                d="M 25 0 Q 15 15 25 25 T 25 40" 
                fill="none" 
                stroke="#94a3b8" 
                strokeWidth="2" 
                strokeDasharray="3 2"
                className="opacity-70"
              />
            </svg>
          </div>

          {/* Exhale airflow particles effect */}
          {currentPhase.type === 'exhale' && (
            <div className="absolute bottom-4 inset-x-0 flex justify-center gap-1.5 animate-bounce">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 opacity-80 animate-ping" />
              <span className="w-2 h-2 rounded-full bg-emerald-300 opacity-90 animate-ping delay-75" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 opacity-80 animate-ping delay-150" />
            </div>
          )}
        </div>

        {/* Technique Detail Tip */}
        <div className="mt-2 text-center max-w-sm space-y-1">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {currentPhase.detail}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">
            {currentTech.instructions}
          </p>
        </div>

        {/* Color Palette Selector for the Balloon */}
        <div className="mt-3 sm:absolute sm:bottom-3 sm:right-3 flex items-center gap-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-full border border-slate-200 dark:border-slate-800">
          {(['pink', 'cyan', 'purple', 'emerald'] as const).map((c) => (
            <button
              key={c}
              onClick={() => {
                audioService.playClickSound();
                setBalloonColor(c);
              }}
              className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                c === 'pink' ? 'bg-pink-500' : c === 'cyan' ? 'bg-cyan-500' : c === 'purple' ? 'bg-purple-500' : 'bg-emerald-500'
              } ${balloonColor === c ? 'scale-125 ring-2 ring-white dark:ring-slate-900 shadow-xs' : 'opacity-70 hover:opacity-100'}`}
              title={`Color de Globo ${c}`}
            />
          ))}
        </div>
      </div>

      {/* Control Action Buttons */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={handleToggleActive}
          className={`flex-1 py-3 px-4 rounded-2xl font-heading font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md text-center whitespace-nowrap ${
            isActive
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
              : 'tactile-btn-primary text-white shadow-indigo-500/20'
          }`}
        >
          {isActive ? (
            <>
              <Pause className="w-4 h-4 fill-white shrink-0" />
              <span>Pausar Ejercicio</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white shrink-0" />
              <span>Iniciar Ejercicio</span>
            </>
          )}
        </button>

        <button
          onClick={handleReset}
          className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
          title="Reiniciar Ejercicio"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
