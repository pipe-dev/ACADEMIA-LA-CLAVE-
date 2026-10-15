'use client';
import React from 'react';
import { LessonNode } from '../../types';
import { CheckCircle2, Trophy } from 'lucide-react';

interface LessonSuccessViewProps {
  node: LessonNode;
  onClaimLesson: () => void;
}

export const LessonSuccessView: React.FC<LessonSuccessViewProps> = ({
  node,
  onClaimLesson
}) => {
  const getSuccessDescription = () => {
    const title = node.title.toLowerCase();
    if (title.includes('respiración') || title.includes('aire')) {
      return 'Has demostrado excelente control de aire y capacidad pulmonar.';
    }
    if (title.includes('afinación') || title.includes('oído') || title.includes('notas')) {
      return 'Tu oído musical y precisión están mejorando notablemente.';
    }
    if (title.includes('vibrato') || title.includes('técnica')) {
      return 'Has aplicado la técnica vocal con gran dominio.';
    }
    if (title.includes('apoyo') || title.includes('diafragma')) {
      return 'Excelente uso de tu soporte vocal y musculatura.';
    }
    if (title.includes('calentamiento') || title.includes('relajación')) {
      return 'Tus cuerdas vocales están listas y saludables para cantar.';
    }
    return `Has dominado los conceptos de ${node.title} con gran éxito.`;
  };

  return (
    <div className="py-4 text-center space-y-4">
      <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="space-y-1">
        <h4 className="font-heading font-bold text-xl text-[#0b1c30] dark:text-[#d3e4fe]">
          ¡Lección Completada!
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 px-4">
          {getSuccessDescription()}
        </p>
      </div>

      {node.status === 'completed' ? (
        <div className="inline-flex items-center gap-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 px-4 py-2 rounded-full font-bold text-sm">
          <CheckCircle2 className="w-4 h-4 text-slate-500 dark:text-slate-500" />
          <span>Repaso Finalizado</span>
        </div>
      ) : (
        <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 px-4 py-2 rounded-full font-bold text-sm">
          <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>+{node.xpReward} XP Recompensados</span>
        </div>
      )}

      <button
        onClick={onClaimLesson}
        className="w-full py-3.5 rounded-full tactile-btn-success font-heading font-bold text-sm cursor-pointer shadow-md"
      >
        Continuar
      </button>
    </div>
  );
};
