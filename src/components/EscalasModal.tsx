'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { audioService } from '../utils/audioService';
import { QUICK_SCALES } from '../data/academyData';
import { SolfegeNote } from '../types';
import { SOLFEGE_NOTES } from '../data/academyData';
import { Music2, Play, Pause, ArrowLeft } from 'lucide-react';
import { emitQuestEvent } from '../utils/dailyQuestsEngine';
import { emitStreakEligibleAction } from '../utils/streakPrompt';

interface EscalasModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSelectNote?: (note: SolfegeNote) => void;
  isEmbeddedView?: boolean;
}

export const EscalasModal: React.FC<EscalasModalProps> = ({
  isOpen = true,
  onClose,
  onSelectNote,
  isEmbeddedView = false
}) => {
  const [selectedScaleId, setSelectedScaleId] = useState<string>(QUICK_SCALES[0].id);
  const [isPlayingScale, setIsPlayingScale] = useState<boolean>(false);
  const [activeScaleStepIndex, setActiveScaleStepIndex] = useState<number | null>(null);

  const cancelScaleRef = useRef<(() => void) | null>(null);

  const activeScale = QUICK_SCALES.find(s => s.id === selectedScaleId) || QUICK_SCALES[0];

  useEffect(() => {
    if (!isOpen && !isEmbeddedView) {
      if (cancelScaleRef.current) {
        cancelScaleRef.current();
        cancelScaleRef.current = null;
      }
      setIsPlayingScale(false);
      setActiveScaleStepIndex(null);
    }
  }, [isOpen, isEmbeddedView]);

  if (!isOpen && !isEmbeddedView) return null;

  const handlePlayScaleSequence = (scaleItem: typeof activeScale) => {
    if (isPlayingScale) {
      if (cancelScaleRef.current) {
        cancelScaleRef.current();
        cancelScaleRef.current = null;
      }
      setIsPlayingScale(false);
      setActiveScaleStepIndex(null);
      return;
    }

    setIsPlayingScale(true);
    audioService.playClickSound();

    const cancelFn = audioService.playScaleSequence(
      scaleItem.notes.map(n => n.frequency),
      380,
      (index) => {
        setActiveScaleStepIndex(index);
      },
      () => {
        setIsPlayingScale(false);
        setActiveScaleStepIndex(null);
        cancelScaleRef.current = null;
        emitStreakEligibleAction();
        emitQuestEvent('SCALE_TRAINED', 1);
      }
    );

    cancelScaleRef.current = cancelFn;
  };

  const fundamentalScales = QUICK_SCALES.filter(
    s => s.category === 'fundamental' || ['c-major', 'c-minor', 'pentatonic', 'arpeggio'].includes(s.id)
  );
  const modalScales = QUICK_SCALES.filter(
    s => s.category === 'modal' || !['c-major', 'c-minor', 'pentatonic', 'arpeggio'].includes(s.id)
  );

  const innerContent = (
    <div className="bg-white dark:bg-[#102034] w-full rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-[#1b2b3f] shadow-md space-y-5 relative">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => {
            audioService.playCloseSound();
            onClose();
          }}
          className="py-1.5 px-2.5 sm:py-2 sm:px-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 transition-all cursor-pointer flex items-center gap-1.5 font-heading font-bold text-[11px] sm:text-xs shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-600 dark:text-cyan-400" />
          <span className="hidden sm:inline">Volver a Gimnasio Vocal</span>
          <span className="sm:hidden">Volver</span>
        </button>

        <span className="text-[9px] sm:text-[10px] font-extrabold bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full uppercase tracking-wider shrink-0 text-right">
          Aparato de Solfeo
        </span>
      </div>

      {/* Main Title Banner */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-300 shrink-0">
          <Music2 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-heading font-black text-xl text-[#0b1c30] dark:text-[#d3e4fe]">
            Escalas Rápidas Vocales
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Referencia auditiva de escalas y modos
          </p>
        </div>
      </div>

      {/* Play Action Header */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-[#0b1828] border border-slate-200/80 dark:border-slate-800">
        <div>
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
            Escala Seleccionada
          </span>
          <span className="font-heading font-bold text-sm text-slate-800 dark:text-slate-200">
            {activeScale.name}
          </span>
        </div>

        <button
          onClick={() => {
            audioService.unlockForMobileSilentMode();
            handlePlayScaleSequence(activeScale);
          }}
          className={`px-4 py-2 rounded-full text-xs font-heading font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
            isPlayingScale
              ? 'bg-amber-500 text-white animate-pulse shadow-amber-500/40'
              : 'bg-indigo-600  text-white shadow-indigo-600/30'
          }`}
        >
          {isPlayingScale ? (
            <>
              <Pause className="w-4 h-4 fill-white" />
              <span>Pausar Escala</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Escuchar Escala</span>
            </>
          )}
        </button>
      </div>

      {/* Interactive Note Keys - Prominent at the top for immediate access */}
      <div className="bg-[#f8fafc] dark:bg-[#0b1828] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            Notas: {activeScale.name}
          </span>
          <span className="text-[10px] font-semibold text-indigo-500">
            Toca para emitir tono
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {activeScale.notes.map((note, idx) => {
            const isCurrentPlaying = isPlayingScale && activeScaleStepIndex === idx;

            return (
              <button
                key={`${note.name}-${idx}`}
                onClick={() => {
                  audioService.unlockForMobileSilentMode();
                  audioService.playClickSound();
                  audioService.playFrequency(note.frequency, 0.85);
                  if (onSelectNote) {
                    const foundSolfege = SOLFEGE_NOTES.find(sn => sn.name === note.name) || {
                      name: note.name,
                      letter: note.name.charAt(0),
                      frequency: note.frequency,
                      bgColor: note.color,
                      shadowColor: note.color
                    };
                    onSelectNote(foundSolfege);
                  }
                }}
                className={`p-2.5 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center border ${
                  isCurrentPlaying
                    ? 'bg-[#4648d4] text-white border-[#4648d4] shadow-md scale-105 ring-2 ring-amber-400'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 '
                }`}
                title={`Cantar ${note.name}`}
              >
                <span className="text-xs font-black">{note.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bloque 1: Escalas Fundamentales (4) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
            Escalas y Patrones Fundamentales
          </label>
          <span className="text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
            4 Básicas
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {fundamentalScales.map((scale) => {
            const isSelected = scale.id === selectedScaleId;
            return (
              <button
                key={scale.id}
                onClick={() => {
                  audioService.unlockForMobileSilentMode();
                  if (isPlayingScale && cancelScaleRef.current) {
                    cancelScaleRef.current();
                    cancelScaleRef.current = null;
                    setIsPlayingScale(false);
                    setActiveScaleStepIndex(null);
                  }
                  audioService.playClickSound();
                  audioService.playFrequency(scale.notes[0].frequency, 0.6);
                  setSelectedScaleId(scale.id);
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-400 dark:border-indigo-600 shadow-xs ring-2 ring-indigo-400/30'
                    : 'bg-[#f8fafc] dark:bg-[#0b1828] border-slate-200/80 dark:border-slate-800 '
                }`}
              >
                <span className={`font-heading font-bold text-xs block ${
                  isSelected ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-200'
                }`}>
                  {scale.name}
                </span>
                <span className="text-[10px] text-slate-400 font-medium line-clamp-2 block mt-0.5">
                  {scale.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bloque 2: Modos Griegos & Blues (8) */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
            Modos Griegos & Blues
          </label>
          <span className="text-[10px] font-extrabold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
            8 Modos
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {modalScales.map((scale) => {
            const isSelected = scale.id === selectedScaleId;
            return (
              <button
                key={scale.id}
                onClick={() => {
                  audioService.unlockForMobileSilentMode();
                  if (isPlayingScale && cancelScaleRef.current) {
                    cancelScaleRef.current();
                    cancelScaleRef.current = null;
                    setIsPlayingScale(false);
                    setActiveScaleStepIndex(null);
                  }
                  audioService.playClickSound();
                  audioService.playFrequency(scale.notes[0].frequency, 0.6);
                  setSelectedScaleId(scale.id);
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-50/90 dark:bg-purple-950/70 border-purple-400 dark:border-purple-600 shadow-xs ring-2 ring-purple-400/30'
                    : 'bg-[#f8fafc] dark:bg-[#0b1828] border-slate-200/80 dark:border-slate-800 '
                }`}
              >
                <span className={`font-heading font-bold text-xs block ${
                  isSelected ? 'text-purple-900 dark:text-purple-200' : 'text-slate-800 dark:text-slate-200'
                }`}>
                  {scale.name}
                </span>
                <span className="text-[10px] text-slate-400 font-medium line-clamp-2 block mt-0.5">
                  {scale.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>
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

export default EscalasModal;
