'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { audioService } from '../utils/audioService';
import { SOLFEGE_NOTES } from '../data/academyData';
import { SolfegeNote } from '../types';
import { 
  Target, Mic, Trophy, Volume2, Activity, ArrowLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StabilityChallengeModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onGrantXp?: (amount: number) => void;
  isEmbeddedView?: boolean;
}

export const StabilityChallengeModal: React.FC<StabilityChallengeModalProps> = ({
  isOpen = true,
  onClose,
  onGrantXp,
  isEmbeddedView = false
}) => {
  const [selectedNote, setSelectedNote] = useState<SolfegeNote>(SOLFEGE_NOTES[0]); // DO (261.63 Hz)
  const [toleranceHz] = useState<number>(3.5); // Tight tolerance range ±3.5 Hz

  // Challenge phase: 'setup' | 'singing' | 'results'
  const [phase, setPhase] = useState<'setup' | 'singing' | 'results'>('setup');

  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [inTuneSeconds, setInTuneSeconds] = useState<number>(0);
  const [currentPitch, setCurrentPitch] = useState<number | null>(null);
  const [pitchDiff, setPitchDiff] = useState<number | null>(null);
  const [isCurrentlyInTune, setIsCurrentlyInTune] = useState<boolean>(false);

  // Results metrics
  const [finalScore, setFinalScore] = useState<number>(0);
  const [xpMultiplier, setXpMultiplier] = useState<number>(1.0);
  const [earnedXp, setEarnedXp] = useState<number>(0);

  const timerRef = useRef<number | null>(null);
  const lastVibeRef = useRef<number>(0);

  // Reset state on close
  useEffect(() => {
    if (!isOpen && !isEmbeddedView) {
      audioService.stopMicrophone();
      if (timerRef.current) clearInterval(timerRef.current);
      setPhase('setup');
      setTimeLeft(10);
      setInTuneSeconds(0);
      setCurrentPitch(null);
      setPitchDiff(null);
      setIsCurrentlyInTune(false);
    }
  }, [isOpen, isEmbeddedView]);

  if (!isOpen && !isEmbeddedView) return null;

  const handlePlayReferenceNote = () => {
    audioService.playClickSound();
    audioService.playFrequency(selectedNote.frequency, 1.5);
  };

  const startChallenge = async () => {
    audioService.playClickSound();
    setPhase('singing');
    setTimeLeft(10);
    setInTuneSeconds(0);
    setCurrentPitch(null);
    setPitchDiff(null);
    setIsCurrentlyInTune(false);

    let inTuneTicks = 0;

    const micSuccess = await audioService.startMicrophone((pitchHz) => {
      if (pitchHz > 60 && pitchHz < 900) {
        setCurrentPitch(Math.round(pitchHz));
        const diff = Math.abs(pitchHz - selectedNote.frequency);
        setPitchDiff(Number(diff.toFixed(1)));

        // Strict tolerance range
        if (diff <= toleranceHz) {
          setIsCurrentlyInTune(true);
          inTuneTicks += 0.1;
          const roundedSec = Number((inTuneTicks).toFixed(1));
          setInTuneSeconds(roundedSec);

          const now = Date.now();
          if (now - lastVibeRef.current > 800) {
            audioService.vibrateInTune();
            lastVibeRef.current = now;
          }
        } else {
          setIsCurrentlyInTune(false);
          const now = Date.now();
          if (diff > toleranceHz * 3 && now - lastVibeRef.current > 1200) {
            audioService.vibrateError();
            lastVibeRef.current = now;
          }
        }
      }
    });

    if (!micSuccess) {
      alert('Se requiere acceso al micrófono para el Desafío de Estabilidad.');
      setPhase('setup');
      return;
    }

    let remaining = 10;
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = window.setInterval(() => {
      remaining -= 1;
      setTimeLeft(remaining);

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        audioService.stopMicrophone();
        finishChallenge(inTuneTicks);
      }
    }, 1000);
  };

  const finishChallenge = (heldSeconds: number) => {
    setPhase('results');
    const clampedHeld = Math.min(10, Math.max(0, Number(heldSeconds.toFixed(1))));

    // Calculate Multiplier:
    // 0s - 3s -> 1.0x
    // 3s - 6s -> 1.5x
    // 6s - 8.5s -> 2.0x
    // 8.5s - 10s -> 3.0x PERFECT
    let mult = 1.0;
    if (clampedHeld >= 8.5) mult = 3.0;
    else if (clampedHeld >= 6.0) mult = 2.0;
    else if (clampedHeld >= 3.0) mult = 1.5;

    const baseAmount = 25;
    const totalGrantedXp = Math.round(baseAmount * mult);

    setFinalScore(clampedHeld);
    setXpMultiplier(mult);
    setEarnedXp(totalGrantedXp);

    if (mult >= 2.0) {
      audioService.playBadgeUnlockedSound();
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
    } else {
      audioService.playSoftDing();
    }

    if (onGrantXp) {
      onGrantXp(totalGrantedXp);
    }
  };

  const innerContent = (
    <div className="bg-white dark:bg-[#102034] w-full rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-[#1b2b3f] shadow-md space-y-5 relative">
      {/* Navigation Header */}
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => {
            audioService.playCloseSound();
            onClose();
          }}
          className="py-1.5 px-2.5 sm:py-2 sm:px-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-1.5 font-heading font-bold text-[11px] sm:text-xs shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
          <span className="hidden sm:inline">Volver a Gimnasio Vocal</span>
          <span className="sm:hidden">Volver</span>
        </button>

        <span className="text-[9px] sm:text-[10px] font-extrabold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full uppercase tracking-wider shrink-0 text-right">
          Aparato de Estabilidad
        </span>
      </div>

      {/* Title Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300 shrink-0">
          <Target className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-heading font-black text-xl text-[#0b1c30] dark:text-[#d3e4fe]">
            Desafío de Estabilidad Vocal
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Sostén la nota elegida fija durante 10s con estricta precisión de afinación
          </p>
        </div>
      </div>

        {/* PHASE: SETUP */}
        {phase === 'setup' && (
          <div className="space-y-4">
            {/* Note Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Selecciona la nota del desafío:
                </label>
                <button
                  onClick={handlePlayReferenceNote}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Escuchar Nota</span>
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {SOLFEGE_NOTES.map((note) => {
                  const isSel = selectedNote.name === note.name;
                  return (
                    <button
                      key={note.name}
                      onClick={() => {
                        audioService.playClickSound();
                        setSelectedNote(note);
                      }}
                      className={`p-2.5 rounded-2xl font-heading font-extrabold text-xs text-white flex flex-col items-center justify-center transition-all cursor-pointer ${
                        isSel ? 'ring-4 ring-indigo-400 scale-105 shadow-md' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: note.bgColor }}
                    >
                      <span>{note.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Info Cards on Multiplier Rewards */}
            <div className="bg-[#f8fafc] dark:bg-[#0b1828] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                Multiplicadores de XP por Retención
              </span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-white dark:bg-[#102034] border border-slate-200 dark:border-slate-800">
                  <span className="font-extrabold text-slate-600 dark:text-slate-300 block">3.0s - 5.9s</span>
                  <span className="text-indigo-600 font-black">1.5x XP</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-[#102034] border border-slate-200 dark:border-slate-800">
                  <span className="font-extrabold text-slate-600 dark:text-slate-300 block">6.0s - 8.4s</span>
                  <span className="text-amber-500 font-black">2.0x XP</span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-[#102034] border border-slate-200 dark:border-slate-800">
                  <span className="font-extrabold text-slate-600 dark:text-slate-300 block">8.5s - 10s</span>
                  <span className="text-emerald-500 font-black">3.0x XP</span>
                </div>
              </div>
            </div>

            <button
              onClick={startChallenge}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-heading font-extrabold text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Mic className="w-5 h-5 fill-white" />
              <span>¡Iniciar Desafío (10s)!</span>
            </button>
          </div>
        )}

        {/* PHASE: SINGING / COUNTDOWN */}
        {phase === 'singing' && (
          <div className="space-y-6 text-center py-2">
            {/* Visual Countdown Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-sm font-extrabold shadow-2xs">
              <Activity className="w-4 h-4 animate-spin text-indigo-500" />
              <span>Cuenta Regresiva: {timeLeft}s</span>
            </div>

            {/* Visual Stability Dial/Box */}
            <div className={`p-6 rounded-3xl transition-all duration-300 text-white space-y-3 relative overflow-hidden ${
              isCurrentlyInTune 
                ? 'bg-gradient-to-b from-emerald-600 to-teal-700 ring-4 ring-emerald-300 shadow-lg' 
                : 'bg-slate-900 border border-slate-800'
            }`}>
              <span className="text-xs text-slate-300 font-bold block">
                Tono Objetivo: {selectedNote.name}
              </span>

              <div className="font-heading font-black text-6xl tracking-widest">
                {selectedNote.name}
              </div>

              {currentPitch ? (
                <div className="space-y-1">
                  <span className={`text-xs font-black px-3 py-1 rounded-full ${
                    isCurrentlyInTune ? 'bg-white text-emerald-800' : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                  }`}>
                    {isCurrentlyInTune ? '¡DENTRO DEL RANGO PERFECTO!' : 'Ajustando afinación...'}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate-400 animate-pulse">
                  Escuchando tono por micrófono...
                </p>
              )}

              {/* Progress Bar for Held Time */}
              <div className="w-full bg-black/30 h-3 rounded-full overflow-hidden mt-4">
                <div 
                  className="bg-white h-full transition-all duration-200" 
                  style={{ width: `${(inTuneSeconds / 10) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-white/80">
                Tiempo Retenido Fijo: {inTuneSeconds.toFixed(1)}s / 10s
              </span>
            </div>
          </div>
        )}

        {/* PHASE: RESULTS */}
        {phase === 'results' && (
          <div className="space-y-5 text-center">
            <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-700 text-white space-y-2">
              <Trophy className="w-10 h-10 text-amber-300 mx-auto animate-bounce" />
              <h4 className="font-heading font-black text-xl">
                ¡Desafío Completado!
              </h4>
              <p className="text-xs text-indigo-100">
                Mantuviste la nota {selectedNote.name} estable durante {finalScore}s
              </p>
            </div>

            {/* Score Stats */}
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="p-4 rounded-2xl bg-[#f8fafc] dark:bg-[#0b1828] border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                  Multiplicador Conquistado
                </span>
                <span className="font-heading font-black text-2xl text-amber-500 block">
                  {xpMultiplier.toFixed(1)}x XP
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Bonus de Precisión
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#f8fafc] dark:bg-[#0b1828] border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                  XP Ganada
                </span>
                <span className="font-heading font-black text-2xl text-emerald-500 block">
                  +{earnedXp} XP
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Agregada a tu perfil
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                audioService.playClickSound();
                setPhase('setup');
              }}
              className="w-full py-3 rounded-2xl bg-[#4648d4] hover:bg-indigo-600 text-white font-heading font-extrabold text-xs shadow-md transition-all active:scale-98 cursor-pointer"
            >
              ¡Intentar de Nuevo!
            </button>
          </div>
        )}
    </div>
  );

  if (isEmbeddedView) {
    return <div className="w-full animate-fadeIn">{innerContent}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn cursor-pointer" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto cursor-default"
      >
        {innerContent}
      </motion.div>
    </div>
  );
};

export default StabilityChallengeModal;
