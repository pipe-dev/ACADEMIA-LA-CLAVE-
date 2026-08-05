'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { SolfegeNote, UserStats } from '../types';
import { SOLFEGE_NOTES } from '../data/academyData';
import { audioService } from '../utils/audioService';
import { RotateCcw, Mic, MicOff, Volume2, CheckCircle2, Sparkles, History, Music2, ChevronDown, ChevronUp, SlidersHorizontal, Swords, Target } from 'lucide-react';
import { AudioParticleCanvas } from './AudioParticleCanvas';
import { PitchStabilityChart } from './PitchStabilityChart';
import { DueloRapidoModal } from './DueloRapidoModal';
import { StabilityChallengeModal } from './StabilityChallengeModal';
import { EscalasModal } from './EscalasModal';
import { BreathingModal } from './BreathingModal';
import { VocalRangeModal } from './VocalRangeModal';
import { VoiceEvalModal } from './VoiceEvalModal';

interface TunedHistoryItem {
  id: string;
  noteName: string;
  noteColor: string;
  targetFreq: number;
  detectedFreq: number;
  diffHz: number;
  timestamp: string;
}

interface AfinadorViewProps {
  userStats: UserStats;
  darkMode?: boolean;
  zenMode?: boolean;
  onUpdateQuestProgress?: (notesTunedCount: number) => void;
  onUpdateStats?: (updated: Partial<UserStats>) => void;
}

export const AfinadorView: React.FC<AfinadorViewProps> = ({ darkMode = false, zenMode = false, onUpdateQuestProgress, onUpdateStats }) => {
  const [selectedNote, setSelectedNote] = useState<SolfegeNote>(SOLFEGE_NOTES[5]); // LA (440 Hz) default
  const [difficulty, setDifficulty] = useState<'facil' | 'medio' | 'dificil'>('medio');
  const [isTuningActive, setIsTuningActive] = useState<boolean>(false);
  const [detectedPitch, setDetectedPitch] = useState<number | null>(null);
  const [volume, setVolume] = useState<number>(0);
  const [tuningStatusMsg, setTuningStatusMsg] = useState<string>('Escuchando voz...');
  const [isPitchMatched, setIsPitchMatched] = useState<boolean>(false);
  const [isExtraToolsOpen, setIsExtraToolsOpen] = useState<boolean>(false);

  // Active full-screen sub-view inside Afinador tab
  const [activeSubView, setActiveSubView] = useState<'escalas' | 'respiracion' | 'estabilidad' | 'duelo' | 'tesitura' | 'evaluacion' | null>(null);

  const [tunedHistory, setTunedHistory] = useState<TunedHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('laclave_tuned_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const lastVibeTimeRef = useRef<number>(0);
  const lastStateUpdateRef = useRef<number>(0);

  // Frequency tolerance based on difficulty
  const tolerance = difficulty === 'facil' ? 15 : difficulty === 'medio' ? 8 : 4;

  // Refs to prevent stale closures inside real-time audioService callback
  const selectedNoteRef = useRef<SolfegeNote>(selectedNote);
  const toleranceRef = useRef<number>(tolerance);
  const onUpdateQuestProgressRef = useRef(onUpdateQuestProgress);

  useEffect(() => {
    selectedNoteRef.current = selectedNote;
  }, [selectedNote]);

  useEffect(() => {
    toleranceRef.current = tolerance;
  }, [tolerance]);

  useEffect(() => {
    onUpdateQuestProgressRef.current = onUpdateQuestProgress;
  }, [onUpdateQuestProgress]);

  // Compute pitch accuracy state for sphere badge feedback
  const pitchDiff = (isTuningActive && detectedPitch && detectedPitch > 40) ? Math.abs(detectedPitch - selectedNote.frequency) : null;
  
  let sphereStyle = 'bg-[#4648d4] dark:bg-[#5356e8] shadow-[#4648d4]/40 scale-100 ring-0';
  let badgeBorderColor = 'border-slate-200/80 dark:border-slate-700';
  let statusTextColor = 'text-slate-800 dark:text-slate-200';
  let statusIcon = <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 animate-pulse" />;

  if (isPitchMatched) {
    sphereStyle = 'bg-emerald-500 dark:bg-emerald-600 shadow-[0_0_40px_rgba(16,185,129,0.9)] scale-110 ring-4 ring-emerald-300 dark:ring-emerald-400 animate-pulse';
    badgeBorderColor = 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/90 dark:bg-emerald-950/90';
    statusTextColor = 'text-emerald-800 dark:text-emerald-200';
    statusIcon = <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-bounce" />;
  } else if (pitchDiff !== null) {
    if (pitchDiff <= tolerance * 2.5) {
      // AMARILLO - Cerca de la nota
      sphereStyle = 'bg-amber-500 dark:bg-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.8)] scale-105 ring-4 ring-amber-300 dark:ring-amber-400/80';
      badgeBorderColor = 'border-amber-300 dark:border-amber-700 bg-amber-50/90 dark:bg-amber-950/90';
      statusTextColor = 'text-amber-800 dark:text-amber-200';
      statusIcon = <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />;
    } else {
      // ROJO - Desafinado / Lejos de la nota
      sphereStyle = 'bg-rose-600 dark:bg-rose-600 shadow-[0_0_30px_rgba(225,29,72,0.8)] scale-100 ring-4 ring-rose-300 dark:ring-rose-500/80';
      badgeBorderColor = 'border-rose-300 dark:border-rose-700 bg-rose-50/90 dark:bg-rose-950/90';
      statusTextColor = 'text-rose-800 dark:text-rose-200';
      statusIcon = <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-ping" />;
    }
  }

  const startTuningMic = async () => {
    if (isTuningActive) return true;
    const success = await audioService.startMicrophone((pitchHz, vol) => {
      const nowTime = Date.now();
      // Throttle React state updates to ~30 FPS max on high-refresh 120Hz mobile screens
      if (nowTime - lastStateUpdateRef.current < 35) return;
      lastStateUpdateRef.current = nowTime;

      setVolume(vol);
      if (pitchHz > 50 && pitchHz < 1000) {
        setDetectedPitch(Math.round(pitchHz));

        const currentTargetNote = selectedNoteRef.current;
        const currentTolerance = toleranceRef.current;

        // Check if pitch matches target
        const diff = Math.abs(pitchHz - currentTargetNote.frequency);
        const nowTime = Date.now();

        if (diff <= currentTolerance) {
          setIsPitchMatched(true);
          setTuningStatusMsg('¡AFINACIÓN PERFECTA!');
          
          // Differentiated Success Vibration Pattern
          if (nowTime - lastVibeTimeRef.current > 1200) {
            audioService.vibrateSuccess();
            lastVibeTimeRef.current = nowTime;
          }

          if (onUpdateQuestProgressRef.current) {
            onUpdateQuestProgressRef.current(1);
          }

          // Record into last 5 tuned notes history
          setTunedHistory(prev => {
            const lastItem = prev[0];
            if (lastItem && lastItem.noteName === currentTargetNote.name && (nowTime - Number(lastItem.id.split('-')[1]) < 3000)) {
              return prev;
            }
            audioService.playSoftDing();
            const newEntry: TunedHistoryItem = {
              id: `${currentTargetNote.name}-${nowTime}`,
              noteName: currentTargetNote.name,
              noteColor: currentTargetNote.bgColor,
              targetFreq: currentTargetNote.frequency,
              detectedFreq: Math.round(pitchHz),
              diffHz: Math.round(diff),
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            const updated = [newEntry, ...prev].slice(0, 5);
            localStorage.setItem('laclave_tuned_history', JSON.stringify(updated));
            return updated;
          });
        } else if (pitchHz < currentTargetNote.frequency) {
          setIsPitchMatched(false);
          setTuningStatusMsg('Muy grueso ↑ Sube el tono');
          
          // Differentiated Error Vibration Pattern for noticeable off-key
          if (diff > currentTolerance * 2.5 && nowTime - lastVibeTimeRef.current > 1500) {
            audioService.vibrateError();
            lastVibeTimeRef.current = nowTime;
          }
        } else {
          setIsPitchMatched(false);
          setTuningStatusMsg('Muy delgado ↓ Baja el tono');

          // Differentiated Error Vibration Pattern for noticeable off-key
          if (diff > currentTolerance * 2.5 && nowTime - lastVibeTimeRef.current > 1500) {
            audioService.vibrateError();
            lastVibeTimeRef.current = nowTime;
          }
        }
      }
    });

    if (success) {
      setIsTuningActive(true);
      return true;
    } else {
      setIsTuningActive(false);
      setTuningStatusMsg('Permiso de micrófono no otorgado');
      return false;
    }
  };

  const handleSelectNote = async (note: SolfegeNote) => {
    selectedNoteRef.current = note;
    setSelectedNote(note);
    setIsPitchMatched(false);
    setDetectedPitch(null);
    setTuningStatusMsg('Escuchando voz...');
    // Play note frequency audio
    audioService.playFrequency(note.frequency, 1.2);

    // Auto-activate microphone if not active
    if (!isTuningActive) {
      await startTuningMic();
    }
  };

  const toggleTuning = async () => {
    audioService.playClickSound();
    if (isTuningActive) {
      audioService.stopMicrophone();
      setIsTuningActive(false);
      setDetectedPitch(null);
    } else {
      await startTuningMic();
    }
  };

  const handleReset = () => {
    audioService.playClickSound();
    setIsPitchMatched(false);
    setDetectedPitch(null);
    setTuningStatusMsg('Escuchando voz...');
  };

  useEffect(() => {
    return () => {
      audioService.stopMicrophone();
    };
  }, []);

  // Sub-views rendered full-screen inside the Afinador tab (header & navbar remain visible)
  if (activeSubView === 'escalas') {
    return (
      <div className="pb-28 pt-4 px-4 max-w-md mx-auto animate-fadeIn">
        <EscalasModal
          isEmbeddedView={true}
          onClose={() => setActiveSubView(null)}
          onSelectNote={handleSelectNote}
        />
      </div>
    );
  }

  if (activeSubView === 'respiracion') {
    return (
      <div className="pb-28 pt-4 px-4 max-w-md mx-auto animate-fadeIn">
        <BreathingModal
          isEmbeddedView={true}
          onClose={() => setActiveSubView(null)}
        />
      </div>
    );
  }

  if (activeSubView === 'estabilidad') {
    return (
      <div className="pb-28 pt-4 px-4 max-w-md mx-auto animate-fadeIn">
        <StabilityChallengeModal
          isEmbeddedView={true}
          onClose={() => setActiveSubView(null)}
        />
      </div>
    );
  }

  if (activeSubView === 'duelo') {
    return (
      <div className="pb-28 pt-4 px-4 max-w-md mx-auto animate-fadeIn">
        <DueloRapidoModal
          isEmbeddedView={true}
          onClose={() => setActiveSubView(null)}
        />
      </div>
    );
  }

  if (activeSubView === 'tesitura') {
    return (
      <div className="pb-28 pt-4 px-4 max-w-md mx-auto animate-fadeIn">
        <VocalRangeModal
          isEmbeddedView={true}
          onClose={() => setActiveSubView(null)}
          onSaveRange={(rangeData) => {
            onUpdateStats?.({
              vocalRange: rangeData.classification,
              vocalRangeData: rangeData
            });
            setActiveSubView(null);
          }}
        />
      </div>
    );
  }

  if (activeSubView === 'evaluacion') {
    return (
      <div className="pb-28 pt-4 px-4 max-w-md mx-auto animate-fadeIn">
        <VoiceEvalModal
          isEmbeddedView={true}
          onClose={() => setActiveSubView(null)}
        />
      </div>
    );
  }

  return (
    <div className="pb-28 pt-4 px-4 max-w-md mx-auto space-y-5 animate-fadeIn">
      {/* Top Vocal Tuner Card */}
      <div id="tour-tuner-card" className="bg-white dark:bg-[#102034] rounded-3xl p-5 border border-slate-100 dark:border-[#1b2b3f] shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-4 transition-colors">
        {/* Card Title & Status */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-lg text-[#2c2abc] dark:text-[#c0c1ff]">
              Afinador Vocal
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Encuentra tu frecuencia perfecta
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 text-xs px-3 py-1 rounded-full font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>ACTIVO</span>
          </div>
        </div>

        {/* Pitch Display Visualizer */}
        <div id="tour-tuner-gauge" className="bg-[#e9f0ff] dark:bg-[#0b1828] zen-mode:bg-[#131d2a] rounded-2xl p-4 border border-blue-100 dark:border-slate-800 relative min-h-[190px] flex flex-col justify-between overflow-hidden shadow-inner">
          {/* Subtle Grid background lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#dce7fe_1px,transparent_1px),linear-gradient(to_bottom,#dce7fe_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1b2b3f_1px,transparent_1px),linear-gradient(to_bottom,#1b2b3f_1px,transparent_1px)] bg-[size:24px_24px] opacity-50 pointer-events-none" />

          {/* Interactive Audio Reactive Particle Canvas */}
          <AudioParticleCanvas
            isTuningActive={isTuningActive}
            detectedPitch={detectedPitch}
            volume={volume}
            isPitchMatched={isPitchMatched}
            selectedNoteName={selectedNote.name}
            targetFrequency={selectedNote.frequency}
            darkMode={darkMode}
            zenMode={zenMode}
          />

          {/* Active Target Pitch Circle Badge */}
          <div className="relative z-10 flex flex-col items-center my-2">
            <div 
              className={`w-22 h-22 rounded-full flex flex-col items-center justify-center text-white shadow-xl transition-all duration-300 relative ${sphereStyle}`}
              style={{
                transform: isTuningActive && volume > 0.02 ? `scale(${1 + Math.min(0.18, volume * 1.5)})` : undefined
              }}
            >
              <span className="font-heading font-bold text-3xl tracking-wide leading-none drop-shadow-sm">
                {selectedNote.name}
              </span>
              <span className="text-[11px] font-semibold opacity-95 mt-1 bg-black/25 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                {detectedPitch ? `${detectedPitch} Hz` : `${selectedNote.frequency} Hz`}
              </span>
            </div>

            {/* Target vs Detected Pitch Indicator */}
            {isTuningActive && (
              <div className={`mt-2.5 text-xs font-bold px-3.5 py-1 rounded-full shadow-md backdrop-blur-md flex items-center gap-1.5 border transition-all duration-300 ${badgeBorderColor} ${statusTextColor}`}>
                {statusIcon}
                <span>{tuningStatusMsg}</span>
              </div>
            )}
          </div>

          {/* Simulated Frequency Graph Bars */}
          <div className="relative z-10 flex items-end justify-center gap-2 h-12 pt-2">
            {[40, 65, 85, 45, 75, 95, 60].map((baseHeight, idx) => {
              const activeHeight = isTuningActive && volume > 0.01 
                ? Math.min(100, Math.max(20, baseHeight * (volume * 15))) 
                : baseHeight * 0.4;
              return (
                <div
                  key={idx}
                  className={`w-6 rounded-t-md transition-all duration-150 ${
                    isPitchMatched ? 'bg-emerald-400' : 'bg-[#98a5f5]'
                  }`}
                  style={{ height: `${activeHeight}%` }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Solfège Note Buttons Grid (DO, RE, MI, FA, SOL, LA, SI) */}
      <div id="tour-tuner-reference" className="bg-white dark:bg-[#102034] rounded-3xl p-5 border border-slate-100 dark:border-[#1b2b3f] shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-4 transition-colors">
        {/* Top 4 Notes (DO, RE, MI, FA) */}
        <div className="grid grid-cols-4 gap-3 justify-items-center">
          {SOLFEGE_NOTES.slice(0, 4).map((note) => {
            const isSelected = selectedNote.name === note.name;
            return (
              <div key={note.name} className="flex flex-col items-center">
                <motion.button
                  onClick={() => handleSelectNote(note)}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className={`organic-shape w-14 h-14 font-heading font-extrabold text-white text-sm flex items-center justify-center cursor-pointer ${
                    isSelected ? 'ring-4 ring-indigo-300 dark:ring-indigo-500 scale-105 shadow-md' : 'opacity-90 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: note.bgColor,
                    boxShadow: isSelected 
                      ? `0 6px 0 0 ${note.shadowColor}, 0 0 15px ${note.bgColor}88` 
                      : `0 4px 0 0 ${note.shadowColor}`
                  }}
                >
                  {note.name}
                </motion.button>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
                  {note.letter}
                </span>
              </div>
            );
          })}
        </div>

        {/* Bottom 3 Notes (SOL, LA, SI) */}
        <div className="flex justify-center gap-5 pt-1">
          {SOLFEGE_NOTES.slice(4).map((note) => {
            const isSelected = selectedNote.name === note.name;
            return (
              <div key={note.name} className="flex flex-col items-center">
                <motion.button
                  onClick={() => handleSelectNote(note)}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className={`organic-shape-alt w-14 h-14 font-heading font-extrabold text-white text-sm flex items-center justify-center cursor-pointer ${
                    isSelected ? 'ring-4 ring-indigo-300 dark:ring-indigo-500 scale-105 shadow-md' : 'opacity-90 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: note.bgColor,
                    boxShadow: isSelected 
                      ? `0 6px 0 0 ${note.shadowColor}, 0 0 15px ${note.bgColor}88` 
                      : `0 4px 0 0 ${note.shadowColor}`
                  }}
                >
                  {note.name}
                </motion.button>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
                  {note.letter}
                </span>
              </div>
            );
          })}
        </div>

        {/* Difficulty Pill Controls */}
        <div className="bg-[#eff4ff] dark:bg-[#0b1828] p-1.5 rounded-full flex items-center justify-between border border-slate-200/80 dark:border-slate-800 mt-2">
          {(['facil', 'medio', 'dificil'] as const).map((level) => {
            const isSel = difficulty === level;
            const labels = { facil: 'Fácil', medio: 'Medio', dificil: 'Difícil' };
            return (
              <button
                key={level}
                onClick={() => {
                  audioService.playClickSound();
                  setDifficulty(level);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
                  isSel
                    ? 'bg-white dark:bg-[#102034] text-[#2c2abc] dark:text-[#c0c1ff] shadow-xs border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-[#c6c5d7] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {labels[level]}
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={toggleTuning}
            className={`w-full py-3.5 rounded-2xl font-heading font-bold text-sm tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 ${
              isTuningActive 
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-[0_5px_0_0_#991b1b]' 
                : 'tactile-btn-primary'
            }`}
          >
            {isTuningActive ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>Activar</span>
              </>
            )}
          </button>
        </div>


      </div>

      {/* Pitch Stability Line Graph (Last 5 Seconds Pitch Tracking) */}
      <PitchStabilityChart
        isTuningActive={isTuningActive}
        detectedPitch={detectedPitch}
        targetFrequency={selectedNote.frequency}
        targetNoteName={selectedNote.name}
        tolerance={tolerance}
        darkMode={darkMode}
      />

      {/* Menú Desplegable de Herramientas de Práctica (Aparatos y Programas) */}
      <div id="tour-tuner-apparatus" className="space-y-4 pt-1">
        <button
          onClick={() => {
            audioService.playClickSound();
            setIsExtraToolsOpen(!isExtraToolsOpen);
          }}
          className="w-full py-4 px-5 rounded-3xl bg-white dark:bg-[#102034] border border-slate-200/80 dark:border-[#1b2b3f] shadow-sm hover:shadow-md active:scale-[0.98] min-h-[56px] touch-manipulation flex items-center justify-between text-left transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-[#4648d4] dark:text-[#c0c1ff] group-hover:scale-105 transition-transform">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-sm text-[#0b1c30] dark:text-[#d3e4fe]">
                  Aparatos y Programas de Práctica
                </h3>
                <span className="text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                  7 Herramientas
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Test vocal, escalas, ejercicios de respiración, duelos y diagnóstico
              </p>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 transition-colors">
            {isExtraToolsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>

        {/* Contenido Desplegable (Grid Completo de Tarjetas de Programas e Historial) */}
        <div className={`space-y-5 transition-all duration-300 ${isExtraToolsOpen ? 'block animate-fadeIn' : 'hidden'}`}>
          {/* Main Program & Apparatus Link Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Tesitura Vocal en Vivo */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                audioService.playOpenSound();
                setActiveSubView('tesitura');
              }}
              className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 text-white shadow-md hover:shadow-indigo-500/20 flex items-center justify-between text-left cursor-pointer transition-all group"
            >
              <div className="space-y-0.5 pr-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-200 block drop-shadow-xs">
                  TEST VOCAL
                </span>
                <span className="text-base font-heading font-black text-white block">
                  Rango vocal rápido
                </span>
                <span className="text-xs text-purple-100/90 font-medium block">
                  Encuentra tu nota más baja y más aguda
                </span>
              </div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </motion.button>

            {/* 2. Evaluación de Precisión */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                audioService.playOpenSound();
                setActiveSubView('evaluacion');
              }}
              className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-700 text-white shadow-md hover:shadow-blue-500/20 flex items-center justify-between text-left cursor-pointer transition-all group"
            >
              <div className="space-y-0.5 pr-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-200 block drop-shadow-xs">
                  Análisis Inteligente
                </span>
                <span className="text-base font-heading font-black text-white block">
                  Evaluación de Precisión
                </span>
                <span className="text-xs text-indigo-100/90 font-medium block">
                  Puntuación y reseña de tu tono
                </span>
              </div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </motion.button>

            {/* 3. Escalas Rápidas Vocales */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                audioService.playOpenSound();
                setActiveSubView('escalas');
              }}
              className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-white shadow-md hover:shadow-cyan-500/20 flex items-center justify-between text-left cursor-pointer transition-all group"
            >
              <div className="space-y-0.5 pr-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-200 block drop-shadow-xs">
                  Solfeo y Audición
                </span>
                <span className="text-base font-heading font-black text-white block">
                  Escalas Rápidas Vocales
                </span>
                <span className="text-xs text-cyan-100/90 font-medium block">
                  Referencia auditiva para solfeo
                </span>
              </div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                <Music2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </motion.button>

            {/* 4. Ejercicios de Respiración */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                audioService.playOpenSound();
                setActiveSubView('respiracion');
              }}
              className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-teal-600 via-emerald-600 to-green-600 text-white shadow-md hover:shadow-emerald-500/20 flex items-center justify-between text-left cursor-pointer transition-all group"
            >
              <div className="space-y-0.5 pr-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-200 block drop-shadow-xs">
                  Control Diafragmático
                </span>
                <span className="text-base font-heading font-black text-white block">
                  Ejercicios de Respiración
                </span>
                <span className="text-xs text-emerald-100/90 font-medium block">
                  Visualizador y ejercicios de respiración
                </span>
              </div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </motion.button>

            {/* 5. Desafío de Estabilidad */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                audioService.playOpenSound();
                setActiveSubView('estabilidad');
              }}
              className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-md hover:shadow-purple-500/20 flex items-center justify-between text-left cursor-pointer transition-all group"
            >
              <div className="space-y-0.5 pr-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-fuchsia-200 block drop-shadow-xs">
                  Desafío de Retención
                </span>
                <span className="text-base font-heading font-black text-white block">
                  Desafío de Estabilidad (10s)
                </span>
                <span className="text-xs text-fuchsia-100/90 font-medium block">
                  Retén la nota fija y multiplica tu XP
                </span>
              </div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </motion.button>

            {/* 6. Duelo Rápido Vocal */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                audioService.playOpenSound();
                setActiveSubView('duelo');
              }}
              className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white shadow-md hover:shadow-orange-500/20 flex items-center justify-between text-left cursor-pointer transition-all group"
            >
              <div className="space-y-0.5 pr-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-200 block drop-shadow-xs">
                  Competencia Vocal
                </span>
                <span className="text-base font-heading font-black text-white block">
                  Duelo Rápido Vocal
                </span>
                <span className="text-xs text-amber-100/90 font-medium block">
                  Desafía a un amigo o a la IA
                </span>
              </div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                <Swords className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </motion.button>
          </div>

          {/* Historial de Notas Afinadas */}
          <div id="sec-historial" className="bg-white dark:bg-[#102034] rounded-3xl p-5 border border-slate-100 dark:border-[#1b2b3f] shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-[#0b1c30] dark:text-[#d3e4fe]">
                    Historial de Precisión
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Últimas 5 notas afinadas con éxito
                  </p>
                </div>
              </div>
              {tunedHistory.length > 0 && (
                <button 
                  onClick={() => {
                    setTunedHistory([]);
                    localStorage.removeItem('laclave_tuned_history');
                    audioService.playClickSound();
                  }}
                  className="text-[11px] font-bold text-slate-400 hover:text-rose-500 transition-colors px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                >
                  Limpiar
                </button>
              )}
            </div>

            {tunedHistory.length === 0 ? (
              <div className="bg-[#f8fafc] dark:bg-[#0b1828] p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Sin notas afinadas aún en este historial
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Activa el micrófono y canta una nota con precisión para guardar tus logros.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {tunedHistory.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-[#f8fafc] dark:bg-[#0b1828] border border-slate-100 dark:border-slate-800/80 hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span 
                        className="w-9 h-9 rounded-xl text-white font-heading font-extrabold text-xs flex items-center justify-center shadow-xs"
                        style={{ backgroundColor: item.noteColor }}
                      >
                        {item.noteName}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {item.detectedFreq} Hz
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            (Meta: {item.targetFreq} Hz)
                          </span>
                        </div>
                        <span className="text-[10px] font-medium text-slate-400 block">
                          {item.timestamp}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 px-2.5 py-1 rounded-full text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{item.diffHz === 0 ? 'Perfecto' : `±${item.diffHz} Hz`}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
