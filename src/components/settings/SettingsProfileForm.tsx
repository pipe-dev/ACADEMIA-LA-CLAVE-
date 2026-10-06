'use client';
import React from 'react';

interface SettingsProfileFormProps {
  name: string;
  onNameChange: (val: string) => void;
  vocalRange: string;
  onVocalRangeChange: (val: string) => void;
  sessionUser?: {
    email: string;
    daysRemaining: number;
  } | null;
}

export const SettingsProfileForm: React.FC<SettingsProfileFormProps> = ({
  name,
  onNameChange,
  vocalRange,
  onVocalRangeChange,
  sessionUser,
}) => {
  return (
    <div className="space-y-4">
      {sessionUser && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Suscripcion Academia
            </div>
            <div className="text-xs text-slate-300 font-mono mt-0.5">
              {sessionUser.email}
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {sessionUser.daysRemaining} dias restantes
          </span>
        </div>
      )}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 dark:text-[#c6c5d7] block">
          Nombre de Usuario
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full bg-[#f8f9ff] dark:bg-[#0b1828] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-[#d3e4fe] focus:outline-none focus:ring-2 focus:ring-[#4648d4] shadow-2xs"
          placeholder="Tu nombre o apodo"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 dark:text-[#c6c5d7] block">
          Clasificación Vocal Predeterminada
        </label>
        <select
          value={vocalRange}
          onChange={(e) => onVocalRangeChange(e.target.value)}
          className="w-full bg-[#f8f9ff] dark:bg-[#0b1828] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-[#d3e4fe] focus:outline-none focus:ring-2 focus:ring-[#4648d4] shadow-2xs cursor-pointer"
        >
          <option value="Soprano">Soprano (Agudo Femenino)</option>
          <option value="Mezzosoprano">Mezzosoprano (Medio Femenino)</option>
          <option value="Alto">Contralto / Alto (Grave Femenino)</option>
          <option value="Tenor">Tenor (Agudo Masculino)</option>
          <option value="Barítono">Barítono (Medio Masculino)</option>
          <option value="Bajo">Bajo (Grave Masculino)</option>
        </select>
      </div>
    </div>
  );
};
