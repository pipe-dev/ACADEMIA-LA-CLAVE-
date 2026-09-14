'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { audioService } from '../utils/audioService';
import { calculateCentsOff } from '../utils/pitchUtils';
import { SOLFEGE_NOTES } from '../data/academyData';
import { SolfegeNote } from '../types';
import { FriendItem } from './FriendsSection';
import { 
  Swords, Mic, Trophy, Zap, Volume2, Sparkles, User, Flame, ArrowLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DueloRapidoModalProps {
  isOpen?: boolean;
  onClose: () => void;
  opponent?: FriendItem | null;
  onGrantXp?: (amount: number) => void;
  isEmbeddedView?: boolean;
}

export interface DuelResult {
  id: string;
  timestamp: string;
  noteName: string;
  opponentName: string;
  player1Score: number;
  player2Score: number;
  player1StabilitySec: number;
  player2StabilitySec: number;
  won: boolean;
}

export const DueloRapidoModal: React.FC<DueloRapidoModalProps> = ({
  isOpen = true,
  onClose,
  opponent = null,
  onGrantXp,
  isEmbeddedView = false
}) => {
  const [selectedNote, setSelectedNote] = useState<SolfegeNote>(SOLFEGE_NOTES[4]); // SOL (392 Hz)
  const [mode, setMode] = useState<'simulated' | 'local'>('simulated');
  const [selectedOpponentName, setSelectedOpponentName] = useState<string>(opponent ? opponent.name : 'Camila Ríos');

  // Game state: 'setup' | 'player1_singing' | 'player2_singing' | 'results'
  const [gameState, setGameState] = useState<'setup' | 'player1_singing' | 'player2_singing' | 'results'>('setup');

  // Player 1 Stats
  const [p1TimeLeft, setP1TimeLeft] = useState<number>(10);
  const [p1InTuneSeconds, setP1InTuneSeconds] = useState<number>(0);
  const [p1CurrentPitch, setP1CurrentPitch] = useState<number | null>(null);
  const [p1PitchDiff, setP1PitchDiff] = useState<number | null>(null);
  const [p1Score, setP1Score] = useState<number>(0);

  // Player 2 Stats
  const [p2TimeLeft, setP2TimeLeft] = useState<number>(10);
  const [p2InTuneSeconds, setP2InTuneSeconds] = useState<number>(0);
  const [p2CurrentPitch, setP2CurrentPitch] = useState<number | null>(null);
  const [_p2PitchDiff, setP2PitchDiff] = useState<number | null>(null);
  const [p2Score, setP2Score] = useState<number>(0);

  // General active status
  const [_statusText, setStatusText] = useState<string>('Mantén la nota lo más estable posible');
  const [p1Won, setP1Won] = useState<boolean>(false);

  // Refs for tracking pitch in loops
  const timerRef = useRef<number | null>(null);
  const lastVibeRef = useRef<number>(0);

  useEffect(() => {
    if (opponent) {
      setSelectedOpponentName(opponent.name);
    }
  }, [opponent]);

  // Clean up mic on modal close
  useEffect(() => {
    if (!isOpen && !isEmbeddedView) {
      audioService.stopMicrophone();
      if (timerRef.current) clearInterval(timerRef.current);
      setGameState('setup');
    }
  }, [isOpen, isEmbeddedView]);

  if (!isOpen && !isEmbeddedView) return null;

  const handlePlayReferenceSound = () => {
    audioService.playClickSound();
    audioService.playFrequency(selectedNote.frequency, 1.5);
  };

  const startPlayer1Turn = async () => {
    audioService.playClickSound();
    setP1InTuneSeconds(0);
    setP1TimeLeft(10);
    setP1CurrentPitch(null);
    setP1PitchDiff(null);
    setGameState('player1_singing');
    setStatusText('¡Canta ahora! Mantén la nota ' + selectedNote.name);

    let inTuneTicks = 0;

    const micSuccess = await audioService.startMicrophone((pitchHz) => {
      if (pitchHz > 60 && pitchHz < 900) {
        setP1CurrentPitch(Math.round(pitchHz));
        const centsOff = calculateCentsOff(pitchHz, selectedNote.frequency);
        const absCents = Math.abs(centsOff);
        const diffHz = Math.abs(pitchHz - selectedNote.frequency);
        setP1PitchDiff(Math.round(diffHz));

        // Tolerancia musical estándar: ±25 cents
        if (absCents <= 25) {
          inTuneTicks += 0.1;
          const currentInTuneSec = Number((inTuneTicks).toFixed(1));
          setP1InTuneSeconds(currentInTuneSec);

          const now = Date.now();
          if (now - lastVibeRef.current > 1000) {
            audioService.vibrateSuccess();
            lastVibeRef.current = now;
          }
        } else if (absCents > 45) {
          const now = Date.now();
          if (now - lastVibeRef.current > 1200) {
            audioService.vibrateError();
            lastVibeRef.current = now;
          }
        }
      }
    });

    if (!micSuccess) {
      alert('Por favor autoriza el micrófono para jugar el Duelo Rápido.');
      setGameState('setup');
      return;
    }

    // 10 second countdown timer for Player 1
    let remaining = 10;
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = window.setInterval(() => {
      remaining -= 1;
      setP1TimeLeft(remaining);

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        audioService.stopMicrophone();

        // Calculate final score for P1
        const calculatedP1Score = Math.min(100, Math.round(inTuneTicks * 10));
        setP1Score(calculatedP1Score);

        if (mode === 'simulated') {
          startSimulatedPlayer2Turn(calculatedP1Score);
        } else {
          setGameState('player2_singing');
          setStatusText(`Turno de ${selectedOpponentName}. ¡Pasa el micrófono!`);
        }
      }
    }, 1000);
  };

  const startLocalPlayer2Turn = async () => {
    audioService.playClickSound();
    setP2InTuneSeconds(0);
    setP2TimeLeft(10);
    setP2CurrentPitch(null);
    setP2PitchDiff(null);
    setStatusText(`¡Canta ${selectedOpponentName}! Mantén la nota ${selectedNote.name}`);

    let inTuneTicks = 0;

    const micSuccess = await audioService.startMicrophone((pitchHz) => {
      if (pitchHz > 60 && pitchHz < 900) {
        setP2CurrentPitch(Math.round(pitchHz));
        const centsOff = calculateCentsOff(pitchHz, selectedNote.frequency);
        const absCents = Math.abs(centsOff);
        const diffHz = Math.abs(pitchHz - selectedNote.frequency);
        setP2PitchDiff(Math.round(diffHz));

        // Tolerancia musical estándar: ±25 cents
        if (absCents <= 25) {
          inTuneTicks += 0.1;
          setP2InTuneSeconds(Number((inTuneTicks).toFixed(1)));
          const now = Date.now();
          if (now - lastVibeRef.current > 1000) {
            audioService.vibrateSuccess();
            lastVibeRef.current = now;
          }
        }
      }
    });

    if (!micSuccess) {
      alert('No se pudo iniciar el micrófono para el Jugador 2.');
      setGameState('setup');
      return;
    }

    let remaining = 10;
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = window.setInterval(() => {
      remaining -= 1;
      setP2TimeLeft(remaining);

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        audioService.stopMicrophone();

        const calculatedP2Score = Math.min(100, Math.round(inTuneTicks * 10));
        setP2Score(calculatedP2Score);
        finishDuel(p1Score, calculatedP2Score, p1InTuneSeconds, Number((inTuneTicks).toFixed(1)));
      }
    }, 1000);
  };

  const startSimulatedPlayer2Turn = (finalP1Score: number) => {
    setGameState('player2_singing');
    setStatusText(`${selectedOpponentName} está cantando en vivo...`);

    let remaining = 10;
    let simTicks = 0;

    // Simulated Bot AI behavior based on opponent level
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = window.setInterval(() => {
      remaining -= 1;
      setP2TimeLeft(remaining);

      // Simulate pitch stability
      const simulatedInTune = Math.random() > 0.3; // 70% pitch match rate
      if (simulatedInTune) {
        simTicks += 0.8;
        const fakeFreq = selectedNote.frequency + (Math.random() * 4 - 2);
        setP2CurrentPitch(Math.round(fakeFreq));
        setP2PitchDiff(Math.round(Math.abs(fakeFreq - selectedNote.frequency)));
        setP2InTuneSeconds(Number((simTicks).toFixed(1)));
      } else {
        const fakeFreq = selectedNote.frequency + (Math.random() * 18 - 9);
        setP2CurrentPitch(Math.round(fakeFreq));
        setP2PitchDiff(Math.round(Math.abs(fakeFreq - selectedNote.frequency)));
      }

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        
        // Dynamic simulated score that creates exciting close duels
        const baseSimScore = Math.floor(Math.random() * 30) + 55;
        const finalP2Score = Math.min(100, Math.max(30, baseSimScore));
        setP2Score(finalP2Score);

        finishDuel(finalP1Score, finalP2Score, p1InTuneSeconds, Number((simTicks).toFixed(1)));
      }
    }, 1000);
  };

  const finishDuel = (p1S: number, p2S: number, p1Sec: number, p2Sec: number) => {
    setGameState('results');
    const isWinner = p1S >= p2S;
    setP1Won(isWinner);

    if (isWinner) {
      audioService.playBadgeUnlockedSound();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      if (onGrantXp) onGrantXp(50);
    } else {
      audioService.playSoftDing();
    }

    // Record Duel History in LocalStorage
    try {
      const historyItem: DuelResult = {
        id: `duel_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        noteName: selectedNote.name,
        opponentName: selectedOpponentName,
        player1Score: p1S,
        player2Score: p2S,
        player1StabilitySec: p1Sec,
        player2StabilitySec: p2Sec,
        won: isWinner
      };

      const existing = localStorage.getItem('laclave_duel_history');
      const list = existing ? JSON.parse(existing) : [];
      const updated = [historyItem, ...list].slice(0, 10);
      localStorage.setItem('laclave_duel_history', JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save duel history:', e);
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
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400" />
          <span className="hidden sm:inline">Volver a Gimnasio Vocal</span>
          <span className="sm:hidden">Volver</span>
        </button>

        <span className="text-[9px] sm:text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full uppercase tracking-wider shrink-0 text-right">
          Aparato Competitivo
        </span>
      </div>

      {/* Title Banner */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-300 shrink-0">
          <Swords className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-heading font-black text-xl text-[#0b1c30] dark:text-[#d3e4fe]">
            Duelo Rápido Vocal
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Compara estabilidad y precisión afinando la misma nota
          </p>
        </div>
      </div>

        {/* SETUP PHASE */}
        {gameState === 'setup' && (
          <div className="space-y-4">
            {/* Target Note Picker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  1. Selecciona la Nota del Duelo:
                </label>
                <button
                  onClick={handlePlayReferenceSound}
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

            {/* Mode Picker */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                2. Modo de Duelo:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    audioService.playClickSound();
                    setMode('simulated');
                  }}
                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    mode === 'simulated'
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                      : 'bg-[#f8fafc] dark:bg-[#0b1828] border-slate-200 dark:border-slate-800 text-slate-500'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Vs Amigo Guardado</span>
                </button>

                <button
                  onClick={() => {
                    audioService.playClickSound();
                    setMode('local');
                  }}
                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    mode === 'local'
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                      : 'bg-[#f8fafc] dark:bg-[#0b1828] border-slate-200 dark:border-slate-800 text-slate-500'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  <span>Pasa el Micrófono (2p)</span>
                </button>
              </div>
            </div>

            {/* Opponent Selection */}
            <div className="bg-[#f8fafc] dark:bg-[#0b1828] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                Oponente
              </span>
              <div className="flex items-center justify-between">
                <span className="font-heading font-extrabold text-sm text-[#0b1c30] dark:text-[#d3e4fe]">
                  {selectedOpponentName}
                </span>
                <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  Listo para cantar
                </span>
              </div>
            </div>

            {/* Launch Button */}
            <button
              onClick={startPlayer1Turn}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-heading font-extrabold text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-5 h-5 fill-white" />
              <span>¡Comenzar Duelo Rápido!</span>
            </button>
          </div>
        )}

        {/* PLAYER 1 SINGING PHASE */}
        {gameState === 'player1_singing' && (
          <div className="space-y-5 text-center py-2">
            <div className="inline-block px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-xs font-extrabold">
              Tiempo Restante: {p1TimeLeft}s
            </div>

            {/* Large Note Target Visualizer */}
            <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-3 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-28 h-28 bg-amber-500/20 rounded-full blur-xl pointer-events-none" />

              <span className="text-xs text-slate-400 font-bold block">
                Tono Objetivo: {selectedNote.name}
              </span>
              <div className="font-heading font-black text-5xl tracking-widest text-amber-400">
                {selectedNote.name}
              </div>

              {p1CurrentPitch ? (
                <div className="space-y-1">
                  <span className={`text-xs font-extrabold ${
                    p1PitchDiff && p1PitchDiff <= 6 ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {p1PitchDiff && p1PitchDiff <= 6 ? '¡AFINADO PERFECTO!' : 'Ajustando afinación...'}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate-400 animate-pulse">
                  Escuchando tu voz por el micrófono...
                </p>
              )}
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/60 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Tiempo en afinación: {p1InTuneSeconds.toFixed(1)} segundos</span>
            </div>
          </div>
        )}

        {/* PLAYER 2 SINGING / SIMULATED TURN PHASE */}
        {gameState === 'player2_singing' && (
          <div className="space-y-5 text-center py-2">
            <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold">
              Turno de {selectedOpponentName}: {p2TimeLeft}s
            </div>

            {mode === 'local' ? (
              <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-3">
                <span className="text-xs text-indigo-300 font-bold block">
                  Pasa el teléfono a {selectedOpponentName}
                </span>
                <div className="font-heading font-black text-4xl text-indigo-400">
                  {selectedNote.name}
                </div>

                {!p2CurrentPitch && (
                  <p className="text-xs text-slate-400 animate-pulse">
                    ¡Canta cuando estés listo!
                  </p>
                )}

                <button
                  onClick={startLocalPlayer2Turn}
                  className="mt-3 py-2.5 px-6 rounded-2xl bg-indigo-600 text-white font-bold text-xs cursor-pointer hover:bg-indigo-700"
                >
                  <Mic className="w-4 h-4 inline mr-1" />
                  Iniciar Grabación
                </button>
              </div>
            ) : (
              <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-3">
                <span className="text-xs text-indigo-300 font-bold block">
                  {selectedOpponentName} está cantando en vivo...
                </span>
                <div className="font-heading font-black text-5xl text-indigo-400">
                  {selectedNote.name}
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full transition-all duration-300" 
                    style={{ width: `${(p2InTuneSeconds / 10) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* RESULTS PHASE */}
        {gameState === 'results' && (
          <div className="space-y-5 text-center">
            {/* Banner Header */}
            <div className={`p-4 rounded-3xl text-white space-y-1 ${
              p1Won ? 'bg-gradient-to-r from-amber-500 to-emerald-600' : 'bg-gradient-to-r from-slate-700 to-slate-900'
            }`}>
              <Trophy className="w-8 h-8 text-amber-300 mx-auto animate-bounce" />
              <h4 className="font-heading font-black text-xl">
                {p1Won ? '¡VICTORIA EN EL DUELO!' : '¡Casi lo logras!'}
              </h4>
              <p className="text-xs text-white/90">
                {p1Won ? 'Demostraste mayor estabilidad de tono que tu oponente (+50 XP)' : 'Buen esfuerzo, practica más afinación y reintenta.'}
              </p>
            </div>

            {/* Side by Side Score Breakdown */}
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className={`p-4 rounded-2xl border ${
                p1Won ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300' : 'bg-[#f8fafc] dark:bg-[#0b1828] border-slate-200 dark:border-slate-800'
              }`}>
                <span className="text-[10px] font-extrabold uppercase text-amber-700 dark:text-amber-400 block">
                  TÚ (JUGADOR 1)
                </span>
                <span className="font-heading font-black text-2xl text-[#0b1c30] dark:text-[#d3e4fe] block">
                  {p1Score} pts
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Estabilidad: {p1InTuneSeconds.toFixed(1)}s
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#f8fafc] dark:bg-[#0b1828] border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                  {selectedOpponentName}
                </span>
                <span className="font-heading font-black text-2xl text-[#0b1c30] dark:text-[#d3e4fe] block">
                  {p2Score} pts
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Estabilidad: {p2InTuneSeconds.toFixed(1)}s
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                audioService.playClickSound();
                setGameState('setup');
              }}
              className="w-full py-3 rounded-2xl bg-[#4648d4] hover:bg-indigo-600 text-white font-heading font-extrabold text-xs shadow-md transition-all active:scale-98 cursor-pointer"
            >
              ¡Jugar Otro Duelo!
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

export default DueloRapidoModal;
