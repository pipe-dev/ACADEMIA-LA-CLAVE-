'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Sparkles, Volume2, ShieldCheck, ChevronRight, UserCheck } from 'lucide-react';
import { audioService } from '../utils/audioService';

interface TunerRangeRequiredModalProps {
  isOpen: boolean;
  onStartAssessment: () => void;
  onManualSelect: (data: { classification: string; noteMin: string; noteMax: string; minHz: number; maxHz: number; gender: 'masculino' | 'femenino' }) => void;
}

export const TunerRangeRequiredModal: React.FC<TunerRangeRequiredModalProps> = ({
  isOpen,
  onStartAssessment,
  onManualSelect
}) => {
  const [mounted, setMounted] = useState(false);
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const presets = [
    { label: 'Bajo (Voz masculina muy grave)', classification: 'Bajo', gender: 'masculino' as const, noteMin: 'Mi2', noteMax: 'Mi4', minHz: 82, maxHz: 330 },
    { label: 'Barítono (Voz masculina media - común)', classification: 'Barítono', gender: 'masculino' as const, noteMin: 'La2', noteMax: 'Sol4', minHz: 110, maxHz: 392 },
    { label: 'Tenor (Voz masculina aguda)', classification: 'Tenor', gender: 'masculino' as const, noteMin: 'Do3', noteMax: 'Do5', minHz: 130, maxHz: 523 },
    { label: 'Contralto (Voz femenina grave)', classification: 'Contralto', gender: 'femenino' as const, noteMin: 'Fa3', noteMax: 'Fa5', minHz: 174, maxHz: 698 },
    { label: 'Mezzosoprano (Voz femenina media - común)', classification: 'Mezzosoprano', gender: 'femenino' as const, noteMin: 'La3', noteMax: 'La5', minHz: 220, maxHz: 880 },
    { label: 'Soprano (Voz femenina aguda)', classification: 'Soprano', gender: 'femenino' as const, noteMin: 'Do4', noteMax: 'Do6', minHz: 261, maxHz: 1046 }
  ];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-[#102034] rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-[#1b2b3f] space-y-5 relative overflow-hidden"
      >
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-600 to-emerald-500" />

        {/* Icon & Title */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
            <Mic className="w-8 h-8 animate-pulse" />
          </div>
          <h3 className="text-xl font-heading font-black text-slate-900 dark:text-white">
            ¡Personaliza tu Afinador!
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
            Cada voz es un instrumento único. Para que las notas de práctica y los audios grabados coincidan con tu tesitura real y no lastimes tu garganta, necesitamos definir tu rango vocal.
          </p>
        </div>

        {/* Info Highlights */}
        <div className="bg-[#f8fafc] dark:bg-[#0b1828] rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Ejercicios dentro de tus notas cómodas</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Volume2 className="w-4 h-4 text-blue-500 shrink-0" />
            <span>Audios reales con tu mismo género vocal</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Afinación calibrada a tus octavas naturales</span>
          </div>
        </div>

        {!showManual ? (
          <div className="space-y-3 pt-1">
            <button
              onClick={() => {
                audioService.playClickSound();
                onStartAssessment();
              }}
              className="w-full py-4 px-5 rounded-2xl font-heading font-extrabold text-sm text-white bg-gradient-to-r from-[#4648d4] via-[#5356e8] to-emerald-500 shadow-[0_5px_0_0_#2c2abc] hover:shadow-[0_2px_0_0_#2c2abc] hover:translate-y-0.5 active:translate-y-1 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Mic className="w-5 h-5 text-white" />
              <span>🎤 Medir mi Rango Vocal en Vivo (30s)</span>
            </button>

            <button
              onClick={() => {
                audioService.playClickSound();
                setShowManual(true);
              }}
              className="w-full py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>O elegir mi tipo de voz manualmente</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Selecciona tu tipo de voz:</span>
              <button
                onClick={() => setShowManual(false)}
                className="text-[11px] font-semibold text-indigo-500 hover:underline cursor-pointer"
              >
                Volver a prueba en vivo
              </button>
            </div>
            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    audioService.playClickSound();
                    onManualSelect(preset);
                  }}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-[#0b1828] hover:bg-indigo-50/80 dark:hover:bg-indigo-950/50 border border-slate-200/80 dark:border-slate-800 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {preset.label}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Rango: {preset.noteMin} - {preset.noteMax} ({preset.gender === 'masculino' ? '👨 Hombre' : '👩 Mujer'})
                    </div>
                  </div>
                  <UserCheck className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>,
    document.body
  );
};
