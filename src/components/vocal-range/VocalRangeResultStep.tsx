'use client';
import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Music, CheckCircle2, RefreshCw, Award, Trophy, ArrowDown, ArrowUp, ShieldCheck } from 'lucide-react';
import { VoiceClassification } from './vocalRangeTypes';
import { EvaluationComparison } from '../../utils/vocalRangeHelper';

interface VocalRangeResultStepProps {
  vocalEval: VoiceClassification;
  octavesRange: string;
  lowestNote: string;
  highestNote: string;
  isSavedSuccess: boolean;
  comparison?: EvaluationComparison;
  onRepeat: () => void;
  onSave: () => void;
}

export const VocalRangeResultStep: React.FC<VocalRangeResultStepProps> = ({
  vocalEval,
  octavesRange,
  lowestNote,
  highestNote,
  isSavedSuccess,
  comparison,
  onRepeat,
  onSave
}) => {
  return (
    <div className="space-y-4 pt-1 animate-fadeIn">
      {/* Header Result Badge */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-[#0b1828] dark:to-[#171b29] p-5 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 text-center space-y-2">
        <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 px-2.5 py-1 rounded-full inline-block">
          Tu Clasificación Vocal
        </span>

        <h2 className="font-heading font-extrabold text-2xl text-[#0b1c30] dark:text-[#d3e4fe]">
          {vocalEval.classification}
        </h2>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xs mx-auto">
          {vocalEval.description}
        </p>

        {/* Rango en Octavas Pill */}
        <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-2xl shadow-xs mt-1">
          <Music className="w-4 h-4 text-purple-500" />
          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
            Rango: {octavesRange} Octavas
          </span>
        </div>
      </div>

      {/* Notes Breakdown (Grave vs Aguda) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#f8fafc] dark:bg-[#0b1828] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Nota Más Grave
          </span>
          <span className="font-heading font-extrabold text-lg text-indigo-600 dark:text-indigo-400 block">
            {lowestNote}
          </span>
        </div>

        <div className="bg-[#f8fafc] dark:bg-[#0b1828] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Nota Más Aguda
          </span>
          <span className="font-heading font-extrabold text-lg text-purple-600 dark:text-purple-400 block">
            {highestNote}
          </span>
        </div>
      </div>

      {/* Comparison Feedback Card */}
      {comparison && (
        <div className={`p-4 rounded-2xl border space-y-1.5 animate-fadeIn ${
          comparison.type === 'dual'
            ? 'bg-gradient-to-r from-emerald-50 to-amber-50 dark:from-emerald-950/40 dark:to-amber-950/30 border-emerald-300 dark:border-emerald-800'
            : comparison.type === 'lowest'
            ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800'
            : comparison.type === 'highest'
            ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800'
            : comparison.type === 'protected'
            ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
            : 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800'
        }`}>
          <div className="flex items-center gap-2">
            {comparison.type === 'dual' && <Trophy className="w-4 h-4 text-amber-500 shrink-0" />}
            {comparison.type === 'lowest' && <ArrowDown className="w-4 h-4 text-indigo-500 shrink-0" />}
            {comparison.type === 'highest' && <ArrowUp className="w-4 h-4 text-purple-500 shrink-0" />}
            {comparison.type === 'protected' && <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />}
            {comparison.type === 'first' && <Award className="w-4 h-4 text-indigo-500 shrink-0" />}

            <h4 className={`text-xs font-black uppercase tracking-wider ${
              comparison.type === 'dual'
                ? 'text-emerald-900 dark:text-emerald-300'
                : comparison.type === 'lowest'
                ? 'text-indigo-900 dark:text-indigo-300'
                : comparison.type === 'highest'
                ? 'text-purple-900 dark:text-purple-300'
                : comparison.type === 'protected'
                ? 'text-blue-900 dark:text-blue-300'
                : 'text-indigo-900 dark:text-indigo-300'
            }`}>
              {comparison.title}
            </h4>
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {comparison.message}
          </p>
        </div>
      )}

      {/* Practical Vocal Tips */}
      <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Consejos de Entrenamiento para tu Tesitura:</span>
        </h4>
        <ul className="space-y-1.5 pt-1">
          {vocalEval.tips.map((tip, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        {!isSavedSuccess && (
          <button
            onClick={onRepeat}
            className="py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-heading font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Repetir</span>
          </button>
        )}

        {isSavedSuccess ? (
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 350 }}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 12, stiffness: 400, delay: 0.05 }}
              className="p-1 bg-white/20 rounded-full"
            >
              <CheckCircle2 className="w-5 h-5 text-white stroke-[3]" />
            </motion.div>
            <span>¡Rango Sincronizado Con Éxito!</span>
          </motion.div>
        ) : (
          <button
            onClick={onSave}
            className="flex-1 py-3.5 rounded-2xl tactile-btn-primary font-heading font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all"
          >
            <Award className="w-4 h-4 text-amber-300" />
            <span>Guardar en mi Perfil</span>
          </button>
        )}
      </div>
    </div>
  );
};
