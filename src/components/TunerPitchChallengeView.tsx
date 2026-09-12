'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  Volume2,
  Sparkles,
  CheckCircle2,
  Trophy,
  Heart,
  Zap
} from 'lucide-react';
import { audioService } from '../utils/audioService';
import {
  voicePlayback,
  NoteInfo,
  ChromaticNoteButtonInfo,
  getComfortableChromaticNotes
} from '../utils/voicePlaybackService';
import { AudioParticleCanvas } from './AudioParticleCanvas';

export interface TunerPitchChallengeViewProps {
  difficultyLabel: string;
  levelNumber: number;
  subtitle?: string;
  notes: NoteInfo[];
  toleranceCents?: number;
  gender?: 'masculino' | 'femenino';
  vocalRangeData?: any;
  zenMode?: boolean;
  darkMode?: boolean;
  onSuccess: () => void;
}

export const TunerPitchChallengeView: React.FC<TunerPitchChallengeViewProps> = ({
  difficultyLabel,
  levelNumber,
  subtitle,
  notes,
  toleranceCents = 45,
  gender = 'femenino',
  vocalRangeData,
  zenMode = false,
  darkMode = false,
  onSuccess
}) => {
  const [challengeIndex, setChallengeIndex] = useState<number>(0);
  const [completedChallengeNotes, setCompletedChallengeNotes] = useState<Set<number>>(new Set());

  // Real-time audio detection states
  const [isTuningActive, setIsTuningActive] = useState<boolean>(false);
  const [detectedPitch, setDetectedPitch] = useState<number | null>(null);
  const [volume, setVolume] = useState<number>(0);
  const [isPitchMatched, setIsPitchMatched] = useState<boolean>(false);
  const [tuningStatusMsg, setTuningStatusMsg] = useState<string>('Escuchando voz...');

  // Tug-of-War Precision Bar State
  const [tugOfWarProgress, setTugOfWarProgress] = useState<number>(50);
  const tugOfWarRef = useRef<number>(50);
  const lastStateUpdateRef = useRef<number>(0);
  const lastVibeTimeRef = useRef<number>(0);

  // Active target note
  const activeTargetNote = notes[challengeIndex] || notes[0];
  const targetFreq = activeTargetNote ? activeTargetNote.frequency : 440;
  const pitchDiff = (isTuningActive && detectedPitch && detectedPitch > 40)
    ? Math.abs(detectedPitch - targetFreq)
    : null;

  // Refs for real-time microphone callback
  const activeTargetNoteRef = useRef<NoteInfo>(activeTargetNote);
  const toleranceCentsRef = useRef<number>(toleranceCents);
  const notesRef = useRef<NoteInfo[]>(notes);
  const challengeIndexRef = useRef<number>(challengeIndex);
  const onSuccessRef = useRef<() => void>(onSuccess);

  useEffect(() => { activeTargetNoteRef.current = activeTargetNote; }, [activeTargetNote]);
  useEffect(() => { toleranceCentsRef.current = toleranceCents; }, [toleranceCents]);
  useEffect(() => { notesRef.current = notes; }, [notes]);
  useEffect(() => { challengeIndexRef.current = challengeIndex; }, [challengeIndex]);
  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);

  // Chromatic notes for Teclado Vocal touch strip
  const chromaticData = useMemo(() => {
    return getComfortableChromaticNotes(vocalRangeData, gender);
  }, [vocalRangeData, gender]);

  const { naturalNotes, sharpNotes } = chromaticData;

  const blackKeyPositions = useMemo(() => [
    { note: sharpNotes[0], left: '14.2857%' }, // DO#
    { note: sharpNotes[1], left: '28.5714%' }, // RE#
    { note: sharpNotes[2], left: '57.1428%' }, // FA#
    { note: sharpNotes[3], left: '71.4285%' }, // SOL#
    { note: sharpNotes[4], left: '85.7142%' }  // LA#
  ], [sharpNotes]);

  // Visual sphere colors and badge styling identical to AfinadorView
  let sphereStyle = zenMode
    ? 'bg-[#22252a] text-[#f0ebe1] border-2 border-[#e5b83b] shadow-[0_0_20px_rgba(229,184,59,0.25)] scale-100 ring-0'
    : 'bg-[#4648d4] dark:bg-[#5356e8] shadow-[#4648d4]/40 scale-100 ring-0';
  let badgeBorderColor = zenMode
    ? 'border-[#2e3138] bg-[#1f2125]'
    : 'border-slate-200/80 dark:border-slate-700';
  let statusTextColor = zenMode ? 'text-[#f0ebe1]' : 'text-slate-800 dark:text-slate-200';
  let statusIcon = <Sparkles className={`w-3.5 h-3.5 ${zenMode ? 'text-[#e5b83b]' : 'text-indigo-500 dark:text-indigo-400'} animate-pulse`} />;

  if (isPitchMatched) {
    sphereStyle = zenMode
      ? 'bg-[#e5b83b] text-[#161719] shadow-[0_0_40px_rgba(229,184,59,0.9)] scale-110 ring-4 ring-[#f5d56b] animate-pulse'
      : 'bg-emerald-500 dark:bg-emerald-600 shadow-[0_0_40px_rgba(16,185,129,0.9)] scale-110 ring-4 ring-emerald-300 dark:ring-emerald-400 animate-pulse';
    badgeBorderColor = zenMode
      ? 'border-[#e5b83b] bg-[#e5b83b]/20'
      : 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/90 dark:bg-emerald-950/90';
    statusTextColor = zenMode ? 'text-[#e5b83b]' : 'text-emerald-800 dark:text-emerald-200';
    statusIcon = <CheckCircle2 className={`w-4 h-4 ${zenMode ? 'text-[#e5b83b]' : 'text-emerald-500'} animate-bounce`} />;
  } else if (pitchDiff !== null) {
    if (pitchDiff <= 12) {
      sphereStyle = zenMode
        ? 'bg-[#d8a728] text-[#161719] shadow-[0_0_30px_rgba(229,184,59,0.7)] scale-105 ring-4 ring-[#f5d56b]'
        : 'bg-amber-500 dark:bg-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.8)] scale-105 ring-4 ring-amber-300 dark:ring-amber-400/80';
      badgeBorderColor = zenMode
        ? 'border-[#d8a728] bg-[#d8a728]/20'
        : 'border-amber-300 dark:border-amber-700 bg-amber-50/90 dark:bg-amber-950/90';
      statusTextColor = zenMode ? 'text-[#f5d56b]' : 'text-amber-800 dark:text-amber-200';
      statusIcon = <Sparkles className={`w-3.5 h-3.5 ${zenMode ? 'text-[#f5d56b]' : 'text-amber-500'} animate-pulse`} />;
    } else {
      sphereStyle = zenMode
        ? 'bg-[#2a2d34] text-[#ded9cf] border-2 border-[#e5b83b]/50 shadow-[0_0_20px_rgba(0,0,0,0.5)] scale-100 ring-2 ring-[#e5b83b]/30'
        : 'bg-rose-600 dark:bg-rose-600 shadow-[0_0_30px_rgba(225,29,72,0.8)] scale-100 ring-4 ring-rose-300 dark:ring-rose-500/80';
      badgeBorderColor = zenMode
        ? 'border-[#383c44] bg-[#26292f]'
        : 'border-rose-300 dark:border-rose-700 bg-rose-50/90 dark:bg-rose-950/90';
      statusTextColor = zenMode ? 'text-[#ded9cf]' : 'text-rose-800 dark:text-rose-200';
      statusIcon = <Sparkles className={`w-3.5 h-3.5 ${zenMode ? 'text-[#e5b83b]' : 'text-rose-500'} animate-ping`} />;
    }
  }

  // Real-time microphone listening loop
  const startMic = async () => {
    const success = await audioService.startMicrophone((pitchHz, vol) => {
      const nowTime = Date.now();
      if (nowTime - lastStateUpdateRef.current < 35) return;
      lastStateUpdateRef.current = nowTime;

      setVolume(vol);
      const currTarget = activeTargetNoteRef.current;
      if (!currTarget) return;

      if (pitchHz > 50 && pitchHz < 1000) {
        setDetectedPitch(Math.round(pitchHz));
        const cents = 1200 * Math.log2(pitchHz / currTarget.frequency);
        const isMatched = Math.abs(cents) <= toleranceCentsRef.current;
        setIsPitchMatched(isMatched);

        if (isMatched) {
          setTuningStatusMsg('¡AFINACIÓN PERFECTA!');
          if (nowTime - lastVibeTimeRef.current > 1200) {
            lastVibeTimeRef.current = nowTime;
            audioService.vibrateSuccess();
          }

          // Push Tug-of-War towards 100%
          tugOfWarRef.current = Math.min(100, tugOfWarRef.current + 3.0);
          setTugOfWarProgress(tugOfWarRef.current);

          if (tugOfWarRef.current >= 100) {
            // Note completed!
            audioService.playSoftDing();
            audioService.vibrateSuccess();
            const currIdx = challengeIndexRef.current;
            const allNotes = notesRef.current;

            setCompletedChallengeNotes(prev => new Set(prev).add(currIdx));

            if (currIdx + 1 < allNotes.length) {
              setChallengeIndex(currIdx + 1);
              tugOfWarRef.current = 50;
              setTugOfWarProgress(50);
            } else {
              // Level victory!
              audioService.playSuccessBellSound();
              audioService.stopMicrophone();
              setIsTuningActive(false);
              setTimeout(() => {
                onSuccessRef.current();
              }, 450);
            }
          }
        } else {
          if (pitchHz < currTarget.frequency) {
            setTuningStatusMsg('Muy grueso ↑ Sube el tono');
          } else {
            setTuningStatusMsg('Muy delgado ↓ Baja el tono');
          }
          // Gentle drop on off-pitch, clamp to 15%
          tugOfWarRef.current = Math.max(15, tugOfWarRef.current - 1.1);
          setTugOfWarProgress(tugOfWarRef.current);
        }
      } else {
        setDetectedPitch(null);
        setIsPitchMatched(false);
        setTuningStatusMsg('Escuchando voz...');
      }
    });

    if (success) {
      setIsTuningActive(true);
    }
  };

  const toggleTuning = () => {
    audioService.playClickSound();
    if (isTuningActive) {
      audioService.stopMicrophone();
      setIsTuningActive(false);
      setDetectedPitch(null);
      setIsPitchMatched(false);
      setTuningStatusMsg('Micrófono en pausa');
    } else {
      startMic();
    }
  };

  // Auto-start microphone on mount and stop on unmount
  useEffect(() => {
    startMic();
    return () => {
      audioService.stopMicrophone();
    };
  }, []);

  // Handle note selection on piano strip
  const handleKeyClick = (note: ChromaticNoteButtonInfo) => {
    if (activeTargetNote && activeTargetNote.name.toUpperCase() === note.name.toUpperCase()) {
      voicePlayback.playVoiceNote(activeTargetNote, gender, 2.0);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* ─── Tuner Visualizer Card (Exact Replica of AfinadorView) ─── */}
      <div className={`rounded-3xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-3.5 transition-colors border ${
        zenMode
          ? 'bg-[#1f2125] border-[#2e3138]'
          : 'bg-white dark:bg-[#102034] border-slate-100 dark:border-[#1b2b3f]'
      }`}>
        {/* Header: Title on left, Escuchar & EN VIVO on right */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/70 border border-amber-200/80 dark:border-amber-800/80 text-amber-700 dark:text-amber-300 text-[11px] font-heading font-extrabold shrink-0">
                {difficultyLabel} • Nv {levelNumber}
              </span>
              {subtitle && (
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                  {subtitle}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  voicePlayback.playVoiceNote(activeTargetNote, gender, 2.0);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs whitespace-nowrap ${
                  zenMode
                    ? 'bg-[#26292f] text-[#ded9cf] hover:bg-[#2e323a] border border-[#383c44]'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
                title="Escuchar audio de la nota"
              >
                <Volume2 className={`w-3.5 h-3.5 ${zenMode ? 'text-[#e5b83b]' : 'text-indigo-500'}`} />
                <span>Escuchar</span>
              </button>

              {isTuningActive ? (
                <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl font-bold whitespace-nowrap border ${
                  zenMode
                    ? 'bg-[#26292f] text-[#e5b83b] border-[#e5b83b]/30'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60'
                }`}>
                  <span className={`w-2 h-2 rounded-full animate-ping ${zenMode ? 'bg-[#e5b83b]' : 'bg-emerald-500'}`} />
                  <span>EN VIVO</span>
                </div>
              ) : (
                <button
                  onClick={toggleTuning}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                    zenMode
                      ? 'bg-[#26292f] text-[#e5b83b] border-[#e5b83b]/30 hover:bg-[#2e323a]'
                      : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border-indigo-200/50 dark:border-indigo-800/50'
                  }`}
                  title="Activar micrófono para afinar"
                >
                  <Mic className={`w-3.5 h-3.5 ${zenMode ? 'text-[#e5b83b]' : 'text-indigo-500'}`} />
                  <span>Activar</span>
                </button>
              )}
            </div>
          </div>

          {/* Note sequence dots and frequency counter */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                Nota {challengeIndex + 1} de {notes.length}
              </span>
              <div className="flex items-center gap-1 ml-1">
                {notes.map((_, idx) => (
                  <span
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx < challengeIndex
                        ? 'bg-emerald-500 shadow-xs'
                        : idx === challengeIndex
                        ? 'bg-indigo-600 dark:bg-indigo-400 scale-125 shadow-2xs ring-2 ring-indigo-300 dark:ring-indigo-600'
                        : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
            {isTuningActive && (
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                {detectedPitch ? `${detectedPitch} Hz` : 'Canta ahora...'}
              </span>
            )}
          </div>
        </div>

        {/* Tug-of-War Precision Bar */}
        <div className={`p-3 rounded-2xl border space-y-2 ${
          zenMode
            ? 'bg-[#22252a] border-[#2e3138]'
            : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-1.5 text-rose-500 font-heading">
              <Heart className="w-3.5 h-3.5 fill-rose-500" />
              <span>Derrota</span>
            </div>
            <span className="text-[11px] font-mono font-black text-slate-600 dark:text-slate-300">
              {Math.round(tugOfWarProgress)}%
            </span>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-heading">
              <Trophy className="w-3.5 h-3.5" />
              <span>Victoria</span>
            </div>
          </div>

          {/* Bar track */}
          <div className="relative h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            {/* Center 50% neutral marker */}
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-400 dark:bg-slate-500 z-10 opacity-70" />
            {/* Progress fill */}
            <div
              className={`h-full transition-all duration-100 ${
                tugOfWarProgress > 50
                  ? 'bg-gradient-to-r from-amber-400 to-emerald-500'
                  : 'bg-gradient-to-r from-rose-500 to-amber-400'
              }`}
              style={{ width: `${Math.max(0, Math.min(100, tugOfWarProgress))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400">
            <span>
              {isPitchMatched
                ? '¡Afinando! Empujando a la victoria...'
                : pitchDiff !== null
                ? '¡Desafinado! Corrige o retrocedes'
                : 'Silencio (Barra congelada)'}
            </span>
            <span className="font-semibold">
              {tugOfWarProgress <= 25 ? '¡PELIGRO CRÍTICO!' : tugOfWarProgress >= 75 ? '¡Casi completado!' : 'En equilibrio'}
            </span>
          </div>
        </div>

        {/* Gauge Display with Particles & Dynamic Central Sphere */}
        <div
          className={`bg-[#e9f0ff] dark:bg-[#0b1828] ${zenMode ? 'zen-mode:bg-[#131d2a]' : ''} rounded-2xl p-4 border border-blue-100 dark:border-slate-800 relative min-h-[190px] flex flex-col justify-between overflow-hidden shadow-inner`}
        >
          {/* Technical Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1b2b3f15_1px,transparent_1px),linear-gradient(to_bottom,#1b2b3f15_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1b2b3f_1px,transparent_1px),linear-gradient(to_bottom,#1b2b3f_1px,transparent_1px)] bg-[size:24px_24px] opacity-50 pointer-events-none" />

          {/* Audio Particle Canvas */}
          <AudioParticleCanvas
            isTuningActive={isTuningActive}
            detectedPitch={detectedPitch}
            volume={volume}
            isPitchMatched={isPitchMatched}
            selectedNoteName={activeTargetNote.name}
            targetFrequency={targetFreq}
            darkMode={darkMode}
            zenMode={zenMode}
          />

          {/* Dynamic Center Sphere */}
          <div className="relative z-10 flex flex-col items-center my-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                voicePlayback.playVoiceNote(activeTargetNote, gender, 2.0);
              }}
              title="Toca para escuchar voz real"
              className={`w-22 h-22 rounded-full flex flex-col items-center justify-center text-white shadow-xl transition-all duration-300 relative cursor-pointer ${sphereStyle}`}
              style={{
                transform: isTuningActive && volume > 0.02 ? `scale(${1 + Math.min(0.18, volume * 1.5)})` : undefined
              }}
            >
              <span className="font-heading font-bold text-3xl tracking-wide leading-none drop-shadow-sm">
                {activeTargetNote.name}
              </span>
              <span className="text-[11px] font-semibold opacity-95 mt-1 bg-black/25 px-2.5 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
                <Volume2 className="w-3 h-3 opacity-80" />
                {detectedPitch ? `${detectedPitch} Hz` : `${targetFreq} Hz`}
              </span>
            </motion.button>

            {/* State Badge */}
            {isTuningActive ? (
              <div className={`mt-2.5 flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold shadow-md border transition-all duration-300 ${badgeBorderColor} ${statusTextColor}`}>
                {statusIcon}
                <span>{tuningStatusMsg}</span>
              </div>
            ) : (
              <button
                onClick={toggleTuning}
                className={`mt-2 flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs hover:scale-102 ${
                  zenMode
                    ? 'bg-[#26292f] text-[#e5b83b] border border-[#e5b83b]/40 hover:bg-[#2e323a]'
                    : 'bg-white/95 dark:bg-[#102034]/95 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/70 hover:bg-indigo-50 dark:hover:bg-[#15273e]'
                }`}
              >
                <Mic className={`w-3.5 h-3.5 ${zenMode ? 'text-[#e5b83b]' : 'text-indigo-500'} animate-pulse`} />
                <span>Toca para activar micrófono y afinar</span>
              </button>
            )}
          </div>

          {/* Equalizer Waveform Bars */}
          <div className="relative z-10 flex items-end justify-center gap-2 h-12 pt-2">
            {[40, 65, 85, 45, 75, 95, 60].map((baseHeight, i) => {
              const dynamicHeight = isTuningActive && volume > 0.01
                ? Math.min(100, Math.max(20, baseHeight * (volume * 15)))
                : baseHeight * 0.4;
              return (
                <div
                  key={i}
                  className={`w-6 rounded-t-md transition-all duration-150 ${
                    zenMode
                      ? (isPitchMatched ? 'bg-[#e5b83b]' : 'bg-[#383c44]')
                      : (isPitchMatched ? 'bg-emerald-400' : 'bg-[#98a5f5]')
                  }`}
                  style={{ height: `${dynamicHeight}%` }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Teclado Vocal (Exact Touch Strip Replica) ─── */}
      <div className="bg-white dark:bg-[#102034] rounded-3xl p-3.5 sm:p-4 border border-slate-100 dark:border-[#1b2b3f] shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-3">
        <div className="flex items-center justify-between pb-1">
          <div className="flex flex-col gap-0.5">
            <span className="font-heading font-black text-xs sm:text-[13px] text-slate-800 dark:text-white leading-tight">
              Teclado Vocal
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              Toca la tecla activa para recordar su tono de referencia
            </span>
          </div>
        </div>

        {/* 🎹 Piano Touch Strip */}
        <div className="relative w-full max-w-sm mx-auto select-none pt-1 pb-1">
          {/* 7 White Keys */}
          <div className="flex gap-1 sm:gap-1.5 w-full h-20 sm:h-22">
            {naturalNotes.map((note) => {
              const isInChallenge = notes.some(cn => cn.name.toUpperCase() === note.name.toUpperCase());
              const isCurrentTarget = activeTargetNote.name.toUpperCase() === note.name.toUpperCase();
              const isCompleted = notes.some((cn, idx) =>
                completedChallengeNotes.has(idx) &&
                cn.name.toUpperCase() === note.name.toUpperCase() &&
                idx < challengeIndex
              );
              const isUnused = !isInChallenge;

              return (
                <motion.button
                  key={note.name}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleKeyClick(note)}
                  className={`flex-1 h-full rounded-b-xl sm:rounded-b-2xl transition-all flex flex-col justify-end items-center pb-1.5 relative border ${
                    isCurrentTarget
                      ? (zenMode
                          ? 'bg-[#e5b83b] text-[#161719] border-[#f5d56b] shadow-[0_4px_0_0_#9a7212] ring-2 ring-[#f5d56b] z-0 cursor-pointer animate-pulse font-black'
                          : 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white border-indigo-600 shadow-[0_4px_0_0_#312e81] ring-2 ring-indigo-400/80 z-0 cursor-pointer animate-pulse')
                      : isCompleted
                      ? (zenMode
                          ? 'bg-[#9ba2b0] text-[#141619] border-[#e5b83b]/60 shadow-[0_4px_0_0_#6c7380] cursor-pointer'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/80 shadow-[0_4px_0_0_#059669] dark:shadow-[0_4px_0_0_#064e3b] cursor-pointer')
                      : isInChallenge
                      ? (zenMode
                          ? 'bg-[#e2e6ed] text-[#141619] hover:bg-[#edf1f8] border-[#e5b83b] ring-1 ring-[#e5b83b]/60 shadow-[0_4px_0_0_#9ba2b0] cursor-pointer'
                          : 'bg-white dark:bg-[#152336] text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-[#1a2c44] border-indigo-200/90 dark:border-indigo-800/80 shadow-[0_4px_0_0_#cbd5e1] dark:shadow-[0_4px_0_0_#0b1420] ring-1 ring-indigo-400/30 cursor-pointer')
                      : (zenMode
                          ? 'bg-[#c8ccd4] text-[#141619] hover:bg-[#d8dce4] border-[#aeb4c0] shadow-[0_4px_0_0_#8e94a0] cursor-pointer'
                          : 'bg-white dark:bg-[#152336] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2c44] border-slate-200/90 dark:border-slate-700/80 shadow-[0_4px_0_0_#cbd5e1] dark:shadow-[0_4px_0_0_#0b1420] cursor-pointer')
                  }`}
                  title={isCurrentTarget ? `Tocar ${note.displayName} (recordar tono)` : `Nota ${note.displayName}`}
                >
                  {/* Top Indicator */}
                  {!isUnused && (
                    <div className="absolute top-1 inset-x-0 flex justify-center">
                      {isCompleted ? (
                        <span className={`text-[8px] font-black leading-none ${zenMode ? 'text-[#141619]' : 'text-emerald-500'}`}>✓</span>
                      ) : isCurrentTarget ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      ) : (
                        <span className={`w-1 h-1 rounded-full ${zenMode ? 'bg-[#7a580a]' : 'bg-indigo-400/70'}`} />
                      )}
                    </div>
                  )}

                  <span className={`font-heading font-black text-xs sm:text-sm leading-none ${
                    zenMode && isCurrentTarget ? 'text-[#161719]' : zenMode ? 'text-[#141619]' : ''
                  }`}>
                    {note.name}
                  </span>
                  <span className={`text-[10px] font-bold mt-0.5 leading-none ${
                    zenMode
                      ? (isCurrentTarget ? 'text-[#161719]' : isCompleted ? 'text-[#7a580a]' : 'text-[#4b5260]')
                      : (isCurrentTarget ? 'text-indigo-100' : isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500')
                  }`}>
                    {note.letter}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* 5 Black Keys */}
          {blackKeyPositions.map(({ note, left }) => {
            if (!note) return null;
            const isInChallenge = notes.some(cn => cn.name.toUpperCase() === note.name.toUpperCase());
            const isCurrentTarget = activeTargetNote.name.toUpperCase() === note.name.toUpperCase();
            const isCompleted = notes.some((cn, idx) =>
              completedChallengeNotes.has(idx) &&
              cn.name.toUpperCase() === note.name.toUpperCase() &&
              idx < challengeIndex
            );
            const isUnused = !isInChallenge;

            return (
              <motion.button
                key={note.name}
                whileTap={{ scale: 0.93 }}
                onClick={() => handleKeyClick(note)}
                style={{ left }}
                className={`absolute top-1 z-10 -translate-x-1/2 w-[10.5%] sm:w-[11%] h-12 sm:h-13 rounded-b-lg sm:rounded-b-xl transition-all flex flex-col justify-end items-center pb-1 border ${
                  isCurrentTarget
                    ? (zenMode
                        ? 'bg-[#e5b83b] text-[#161719] border-[#f5d56b] shadow-[0_3px_0_0_#9a7212] ring-2 ring-[#f5d56b] scale-105 z-20 cursor-pointer animate-pulse font-black'
                        : 'bg-gradient-to-b from-violet-500 to-purple-700 text-white border-violet-400 shadow-[0_3px_0_0_#3b0764] ring-2 ring-violet-300 scale-105 z-20 cursor-pointer animate-pulse')
                    : isCompleted
                    ? (zenMode
                        ? 'bg-[#2a2d34] text-[#f0ebe1] border-[#383c44] shadow-[0_3px_0_0_#141619] z-10 cursor-pointer'
                        : 'bg-emerald-800 dark:bg-emerald-900 text-emerald-100 border-emerald-600 shadow-[0_3px_0_0_#064e3b] z-10 cursor-pointer')
                    : isInChallenge
                    ? (zenMode
                        ? 'bg-[#141619] text-white hover:bg-[#1f2125] border-[#e5b83b]/40 shadow-[0_3px_0_0_#0a0b0d] cursor-pointer'
                        : 'bg-slate-900 dark:bg-[#070d18] text-white hover:bg-slate-800 dark:hover:bg-[#0d1728] border-purple-400/70 shadow-[0_3px_0_0_#020617] ring-1 ring-violet-400/40 cursor-pointer')
                    : (zenMode
                        ? 'bg-[#141619] text-[#ded9cf] hover:bg-[#1f2125] border-[#2e3138] shadow-[0_3px_0_0_#0a0b0d] cursor-pointer'
                        : 'bg-slate-900 dark:bg-[#070d18] text-white hover:bg-slate-800 dark:hover:bg-[#0d1728] border-slate-700/90 dark:border-slate-800 shadow-[0_3px_0_0_#020617] cursor-pointer')
                }`}
                title={isCurrentTarget ? `Tocar ${note.displayName} (recordar tono)` : `Nota ${note.displayName}`}
              >
                {!isUnused && (
                  <div className="absolute top-1 inset-x-0 flex justify-center">
                    {isCompleted ? (
                      <span className="text-[7px] font-black text-emerald-300 leading-none">✓</span>
                    ) : isCurrentTarget ? (
                      <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                    ) : (
                      <span className="w-1 h-1 rounded-full bg-purple-400/70" />
                    )}
                  </div>
                )}
                <span className="font-heading font-black text-[9px] sm:text-[10px] text-white leading-none">
                  {note.displayName}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TunerPitchChallengeView;
