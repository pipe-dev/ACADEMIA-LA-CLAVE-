// src/components/duelo-rapido/DuelSetupView.tsx
// Selector de disciplina y configuracion de duelo (< 250 lineas)

'use client';
import React from 'react';
import { Volume2, User, Mic, Flame, Zap, Radio, Trophy, Music, Drum } from 'lucide-react';
import { SOLFEGE_NOTES } from '../../data/academyData';
import { SolfegeNote } from '../../types';
import { DuelMode, DuelType } from './dueloTypes';
import { audioService } from '../../utils/audioService';

interface DuelSetupViewProps {
  duelType: DuelType;
  onSelectDuelType: (type: DuelType) => void;
  selectedNote: SolfegeNote;
  onSelectNote: (note: SolfegeNote) => void;
  onPlayReferenceSound: () => void;
  mode: DuelMode;
  onSelectMode: (mode: DuelMode) => void;
  selectedOpponentName: string;
  opponentRecord?: number;
  opponentRhythmRecord?: number;
  onStartDuel: () => void;
}

export const DuelSetupView: React.FC<DuelSetupViewProps> = ({
  duelType,
  onSelectDuelType,
  selectedNote,
  onSelectNote,
  onPlayReferenceSound,
  mode,
  onSelectMode,
  selectedOpponentName,
  opponentRecord = 6,
  opponentRhythmRecord = 32,
  onStartDuel,
}) => {
  return (
    <div className="space-y-4">
      {/* 1. Selector de Disciplina */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          1. Disciplina de Desafio:
        </label>
        <div className="grid grid-cols-3 gap-2">
          {/* Opcion A: Afinacion Pura */}
          <button
            type="button"
            onClick={() => {
              audioService.playClickSound();
              onSelectDuelType('pitch_duel');
            }}
            className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
              duelType === 'pitch_duel'
                ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-500 text-amber-700 dark:text-amber-300 shadow-2xs'
                : 'bg-[#f8fafc] dark:bg-[#0b1828] border-slate-200 dark:border-slate-800 text-slate-500'
            }`}
          >
            <Music className="w-4 h-4 text-amber-500" />
            <span className="font-heading font-black text-xs text-center">Afinacion</span>
            <span className="text-[9px] text-slate-400 font-normal text-center">Sostener nota</span>
          </button>

          {/* Opcion B: Carrera Celeste (Unit 4) */}
          <button
            type="button"
            onClick={() => {
              audioService.playClickSound();
              onSelectDuelType('sky_run_duel');
            }}
            className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
              duelType === 'sky_run_duel'
                ? 'bg-purple-50 dark:bg-purple-950/70 border-purple-500 text-purple-700 dark:text-purple-300 shadow-2xs'
                : 'bg-[#f8fafc] dark:bg-[#0b1828] border-slate-200 dark:border-slate-800 text-slate-500'
            }`}
          >
            <Trophy className="w-4 h-4 text-purple-500" />
            <span className="font-heading font-black text-xs text-center">Carrera</span>
            <span className="text-[9px] text-slate-400 font-normal text-center">Vuelo Unit 4</span>
          </button>

          {/* Opcion C: Duelo de Tambor (Unit 3) */}
          <button
            type="button"
            onClick={() => {
              audioService.playClickSound();
              onSelectDuelType('rhythm_duel');
            }}
            className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
              duelType === 'rhythm_duel'
                ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                : 'bg-[#f8fafc] dark:bg-[#0b1828] border-slate-200 dark:border-slate-800 text-slate-500'
            }`}
          >
            <Drum className="w-4 h-4 text-emerald-500" />
            <span className="font-heading font-black text-xs text-center">Tambor 1m</span>
            <span className="text-[9px] text-slate-400 font-normal text-center">Corte Unit 3</span>
          </button>
        </div>
      </div>

      {/* 2. Configuracion segun la disciplina */}
      {duelType === 'pitch_duel' ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              2. Selecciona la Nota:
            </label>
            <button
              onClick={onPlayReferenceSound}
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
                    onSelectNote(note);
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
      ) : duelType === 'sky_run_duel' ? (
        <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 space-y-2">
          <div className="flex items-center gap-2 text-xs font-heading font-black text-purple-800 dark:text-purple-300">
            <Zap className="w-4 h-4 text-purple-600" />
            <span>Mecanica de Vuelo Flappy con la Voz:</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            Emite sonidos con tu voz para que tu pato dorado ascienda esquivando tubos. Veras al pato violeta de {selectedOpponentName} compitiendo a tu lado en tiempo real o en sombra fantasma hasta que choca (Record: {opponentRecord} tubos).
          </p>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
          <div className="flex items-center gap-2 text-xs font-heading font-black text-emerald-800 dark:text-emerald-300">
            <Drum className="w-4 h-4 text-emerald-600" />
            <span>Corte de Esferas a 1 Minuto:</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            Desliza para cortar las esferas que rebotan sobre el tambor durante 60 segundos. El que corte mas esferas en ese minuto gana el duelo (Record de {selectedOpponentName}: {opponentRhythmRecord} esferas).
          </p>
        </div>
      )}

      {/* 3. Selector de Modalidad */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          3. Modalidad de Enfrentamiento:
        </label>
        <div className="grid grid-cols-3 gap-2">
          {/* En Vivo P2P */}
          <button
            type="button"
            onClick={() => {
              audioService.playClickSound();
              onSelectMode('realtime_p2p');
            }}
            className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
              mode === 'realtime_p2p'
                ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-500 text-amber-700 dark:text-amber-300 shadow-2xs'
                : 'bg-[#f8fafc] dark:bg-[#0b1828] border-slate-200 dark:border-slate-800 text-slate-500'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span className="text-[10px] text-center font-extrabold">En Vivo P2P</span>
          </button>

          {/* Fantasma Asincrono */}
          <button
            type="button"
            onClick={() => {
              audioService.playClickSound();
              onSelectMode('simulated');
            }}
            className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
              mode === 'simulated'
                ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                : 'bg-[#f8fafc] dark:bg-[#0b1828] border-slate-200 dark:border-slate-800 text-slate-500'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="text-[10px] text-center font-extrabold">Fantasma</span>
          </button>

          {/* Local 2p (solo para afinacion) */}
          <button
            type="button"
            disabled={duelType === 'sky_run_duel'}
            onClick={() => {
              audioService.playClickSound();
              onSelectMode('local');
            }}
            className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
              duelType === 'sky_run_duel' ? 'opacity-40 cursor-not-allowed' : ''
            } ${
              mode === 'local'
                ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                : 'bg-[#f8fafc] dark:bg-[#0b1828] border-slate-200 dark:border-slate-800 text-slate-500'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span className="text-[10px] text-center font-extrabold">Local (2p)</span>
          </button>
        </div>
      </div>

      {/* Oponente y Ficha de Desafio */}
      <div className="bg-[#f8fafc] dark:bg-[#0b1828] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
        <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
          Rival Asignado
        </span>
        <div className="flex items-center justify-between">
          <span className="font-heading font-extrabold text-sm text-[#0b1c30] dark:text-[#d3e4fe]">
            {selectedOpponentName}
          </span>
          <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" />
            {duelType === 'sky_run_duel' ? `Record: ${opponentRecord} tubos` : 'Listo para cantar'}
          </span>
        </div>
      </div>

      {/* Boton de Inicio */}
      <button
        onClick={onStartDuel}
        className={`w-full py-3.5 rounded-2xl text-white font-heading font-extrabold text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer ${
          duelType === 'sky_run_duel'
            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
            : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
        }`}
      >
        <Zap className="w-5 h-5 fill-white" />
        <span>
          {duelType === 'sky_run_duel' ? '¡Despegar en Carrera Celeste!' : '¡Comenzar Duelo Rapido!'}
        </span>
      </button>
    </div>
  );
};
