'use client';
import React from 'react';
import { Trophy } from 'lucide-react';
import { DuelType } from './dueloTypes';

interface DuelResultsViewProps {
  p1Won: boolean;
  p1Score: number;
  p1InTuneSeconds?: number;
  p2Score: number;
  p2InTuneSeconds?: number;
  selectedOpponentName: string;
  duelType?: DuelType;
  onPlayAgain: () => void;
}

export const DuelResultsView: React.FC<DuelResultsViewProps> = ({
  p1Won,
  p1Score,
  p1InTuneSeconds = 0,
  p2Score,
  p2InTuneSeconds = 0,
  selectedOpponentName,
  duelType = 'pitch_duel',
  onPlayAgain,
}) => {
  const isSkyRun = duelType === 'sky_run_duel';
  const isRhythm = duelType === 'rhythm_duel';

  return (
    <div className="space-y-5 text-center">
      {/* Banner Header */}
      <div
        className={`p-4 rounded-3xl text-white space-y-1 ${
          p1Won
            ? 'bg-gradient-to-r from-amber-500 to-emerald-600'
            : 'bg-gradient-to-r from-slate-700 to-slate-900'
        }`}
      >
        <Trophy className="w-8 h-8 text-amber-300 mx-auto animate-bounce" />
        <h4 className="font-heading font-black text-xl">
          {p1Won
            ? isSkyRun
              ? '¡VICTORIA EN LA CARRERA CELESTE!'
              : isRhythm
              ? '¡VICTORIA EN EL DUELO DE TAMBOR!'
              : '¡VICTORIA EN EL DUELO!'
            : '¡Casi lo logras!'}
        </h4>
        <p className="text-xs text-white/90">
          {p1Won
            ? isSkyRun
              ? `Superaste el vuelo de tu oponente en los cielos (+50 XP)`
              : isRhythm
              ? `Cortaste mas esferas que tu oponente en el minuto de tambor (+50 XP)`
              : `Demostraste mayor estabilidad de tono que tu oponente (+50 XP)`
            : isSkyRun
            ? `${selectedOpponentName} esquivo mas obstaculos esta vez. ¡Vuelve a intentarlo!`
            : isRhythm
            ? `${selectedOpponentName} logro mas cortes esta vez. ¡Vuelve a intentarlo!`
            : `Buen esfuerzo, practica mas afinacion y reintenta.`}
        </p>
      </div>

      {/* Side by Side Score Breakdown */}
      <div className="grid grid-cols-2 gap-3 text-left">
        <div
          className={`p-4 rounded-2xl border ${
            p1Won
              ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300'
              : 'bg-[#f8fafc] dark:bg-[#0b1828] border-slate-200 dark:border-slate-800'
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase text-amber-700 dark:text-amber-400 block">
            TU (JUGADOR 1)
          </span>
          <span className="font-heading font-black text-2xl text-[#0b1c30] dark:text-[#d3e4fe] block">
            {p1Score} {isSkyRun ? 'tubos' : isRhythm ? 'esferas' : 'pts'}
          </span>
          <span className="text-xs font-bold text-slate-500">
            {isSkyRun
              ? `Distancia: ${p1Score * 120}m`
              : isRhythm
              ? 'Tiempo: 1 min'
              : `Estabilidad: ${p1InTuneSeconds.toFixed(1)}s`}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#f8fafc] dark:bg-[#0b1828] border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
            {selectedOpponentName}
          </span>
          <span className="font-heading font-black text-2xl text-[#0b1c30] dark:text-[#d3e4fe] block">
            {p2Score} {isSkyRun ? 'tubos' : isRhythm ? 'esferas' : 'pts'}
          </span>
          <span className="text-xs font-bold text-slate-500">
            {isSkyRun
              ? `Distancia: ${p2Score * 120}m`
              : isRhythm
              ? 'Tiempo: 1 min'
              : `Estabilidad: ${p2InTuneSeconds.toFixed(1)}s`}
          </span>
        </div>
      </div>

      <button
        onClick={onPlayAgain}
        className="w-full py-3 rounded-2xl bg-[#4648d4] hover:bg-indigo-600 text-white font-heading font-extrabold text-xs shadow-md transition-all active:scale-98 cursor-pointer"
      >
        ¡Jugar Otro Duelo!
      </button>
    </div>
  );
};
