'use client';

import React from 'react';
import { BreathingTechnique } from './breathingTypes';

export interface BreathingTechniqueSelectorProps {
  techniques: BreathingTechnique[];
  selectedTechId: string;
  onSelectTechnique: (id: string) => void;
}

export const BreathingTechniqueSelector: React.FC<BreathingTechniqueSelectorProps> = ({
  techniques,
  selectedTechId,
  onSelectTechnique
}) => {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
        Técnicas de Resistencia y Rehabilitación:
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {techniques.map((tech) => {
          const isSelected = tech.id === selectedTechId;
          return (
            <button
              key={tech.id}
              onClick={() => onSelectTechnique(tech.id)}
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
                {!isSelected && (
                  <span className="text-[10px] text-slate-400 font-bold">
                    {tech.phases.length} fases
                  </span>
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
  );
};
