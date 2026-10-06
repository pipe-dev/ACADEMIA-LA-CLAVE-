'use client';
import React from 'react';
import { Flame, Mic, Swords, Wifi, Zap } from 'lucide-react';
import { SolfegeNote } from '../../types';
import { DuelMode } from './dueloTypes';

interface DuelSingingViewProps {
  isPlayer1: boolean;
  selectedNote: SolfegeNote;
  selectedOpponentName: string;
  mode: DuelMode;
  p1TimeLeft: number;
  p1CurrentPitch: number | null;
  p1PitchDiff: number | null;
  p1InTuneSeconds: number;
  p2TimeLeft: number;
  p2CurrentPitch: number | null;
  p2PitchDiff?: number | null;
  p2InTuneSeconds: number;
  p1Score?: number;
  p2Score?: number;
  onStartLocalP2Turn: () => void;
}

interface PitchNeedleProps {
  centsDiff: number | null;
  currentPitch: number | null;
  targetFreq: number;
  isInTune: boolean;
  accentColor: 'emerald' | 'indigo';
  label: string;
}

const PitchNeedle: React.FC<PitchNeedleProps> = ({
  centsDiff,
  currentPitch,
  targetFreq: _targetFreq,
  isInTune,
  accentColor,
  label,
}) => {
  const hasVoice = currentPitch !== null && currentPitch > 40;
  const clampedCents = centsDiff !== null ? Math.max(-50, Math.min(50, centsDiff)) : 0;
  // Convert -50..+50 to 0%..100%
  const needlePercent = hasVoice ? ((clampedCents + 50) / 100) * 100 : 50;

  const isFlat = centsDiff !== null && centsDiff < -25;
  const isSharp = centsDiff !== null && centsDiff > 25;

  const statusText = !hasVoice
    ? 'Esperando voz...'
    : isInTune
    ? 'Afinado Perfecto'
    : isFlat
    ? 'Grave (Sube un poco)'
    : isSharp
    ? 'Agudo (Baja un poco)'
    : 'Ajustando tono';

  const statusColor = !hasVoice
    ? 'text-slate-400'
    : isInTune
    ? 'text-emerald-400 font-black'
    : isFlat
    ? 'text-amber-400 font-bold'
    : 'text-cyan-400 font-bold';

  const needleColor = !hasVoice
    ? 'bg-slate-500'
    : isInTune
    ? 'bg-emerald-400 shadow-[0_0_12px_#34d399]'
    : isFlat
    ? 'bg-amber-400 shadow-[0_0_10px_#fbbf24]'
    : 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]';

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-[11px] font-bold">
        <span className="text-slate-400">{label}</span>
        <span className="font-mono text-slate-300">
          {hasVoice ? `${currentPitch.toFixed(1)} Hz` : '-- Hz'}
        </span>
      </div>

      {/* Meter Track */}
      <div className="relative h-7 bg-slate-950 rounded-xl border border-white/10 px-2 flex items-center overflow-hidden">
        {/* Safe zone: center 50% between -25 and +25 cents (25% to 75% of track) */}
        <div className="absolute left-[25%] right-[25%] top-1 bottom-1 bg-emerald-500/15 rounded-md border-x border-emerald-500/30" />

        {/* Center line (0 cents) */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/30 -translate-x-1/2 z-10" />

        {/* Graduations */}
        <div className="absolute left-[25%] top-1 bottom-1 w-px bg-white/15" />
        <div className="absolute left-[75%] top-1 bottom-1 w-px bg-white/15" />

        {/* Moving Needle */}
        <div
          className={`absolute top-0.5 bottom-0.5 w-1.5 rounded-full transition-all duration-100 z-20 ${needleColor}`}
          style={{
            left: `${needlePercent}%`,
            transform: 'translateX(-50%)',
          }}
        />
      </div>

      {/* Dial Labels */}
      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono px-1">
        <span className={isFlat ? 'text-amber-400 font-black' : ''}>-50¢</span>
        <span className="text-emerald-400/80 font-bold">0¢ (Centro)</span>
        <span className={isSharp ? 'text-cyan-400 font-black' : ''}>+50¢</span>
      </div>

      {/* Diagnostic Badge */}
      <div className="pt-0.5">
        <span className={`inline-block text-[11px] px-2 py-0.5 rounded-lg bg-slate-900/80 border border-white/5 ${statusColor}`}>
          {hasVoice && centsDiff !== null ? (
            <>
              {centsDiff > 0 ? `+${centsDiff}` : centsDiff}¢ | {statusText}
            </>
          ) : (
            statusText
          )}
        </span>
      </div>
    </div>
  );
};

export const DuelSingingView: React.FC<DuelSingingViewProps> = ({
  isPlayer1,
  selectedNote,
  selectedOpponentName,
  mode,
  p1TimeLeft,
  p1CurrentPitch,
  p1PitchDiff,
  p1InTuneSeconds,
  p2TimeLeft,
  p2CurrentPitch,
  p2PitchDiff = null,
  p2InTuneSeconds,
  p1Score: _p1Score = 0,
  p2Score: _p2Score = 0,
  onStartLocalP2Turn,
}) => {
  const isP1InTune = p1PitchDiff !== null && Math.abs(p1PitchDiff) <= 25;
  const isP2InTune = p2PitchDiff !== null && Math.abs(p2PitchDiff) <= 25;

  const activeTimeLeft = isPlayer1 ? p1TimeLeft : p2TimeLeft;
  const isRealtime = mode === 'realtime_p2p';

  // Determine leader
  let leaderText = 'Empate tecnico en vivo';
  let leaderColor = 'text-slate-400 border-slate-700 bg-slate-800/40';
  if (p1InTuneSeconds > p2InTuneSeconds) {
    const diff = (p1InTuneSeconds - p2InTuneSeconds).toFixed(1);
    leaderText = `Vas a la cabeza (+${diff}s)`;
    leaderColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  } else if (p2InTuneSeconds > p1InTuneSeconds) {
    const diff = (p2InTuneSeconds - p1InTuneSeconds).toFixed(1);
    leaderText = `${selectedOpponentName} a la cabeza (+${diff}s)`;
    leaderColor = 'text-indigo-300 border-indigo-500/30 bg-indigo-500/10';
  }

  // Tug of war ratio
  const totalInTune = p1InTuneSeconds + p2InTuneSeconds;
  const p1Share = totalInTune > 0 ? (p1InTuneSeconds / totalInTune) * 100 : 50;

  // Local Pass the phone mode: turn 2 transition
  if (mode === 'local' && !isPlayer1) {
    return (
      <div className="space-y-5 text-center py-2">
        <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold">
          Turno de {selectedOpponentName}: {p2TimeLeft}s
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-4 border border-white/10">
          <span className="text-xs text-indigo-300 font-bold block">
            Pasa el telefono a {selectedOpponentName}
          </span>
          <div className="font-heading font-black text-5xl text-indigo-400">
            {selectedNote.name}
          </div>

          <PitchNeedle
            centsDiff={p2PitchDiff}
            currentPitch={p2CurrentPitch}
            targetFreq={selectedNote.frequency}
            isInTune={isP2InTune}
            accentColor="indigo"
            label={`Voz de ${selectedOpponentName}`}
          />

          {!p2CurrentPitch && (
            <p className="text-xs text-slate-400 animate-pulse pt-2">
              Toca el boton y canta con fuerza hacia el microfono
            </p>
          )}

          <button
            onClick={onStartLocalP2Turn}
            className="w-full mt-3 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            <Mic className="w-4 h-4" />
            Iniciar Grabacion de {selectedOpponentName}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Header: Target Note & Clock */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-heading font-black text-2xl">
            {selectedNote.name}
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>Nota Objetivo: {selectedNote.name}</span>
              <span className="text-[10px] font-mono text-amber-400">({selectedNote.frequency} Hz)</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
              {isRealtime ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Duelo en Vivo P2P</span>
                </>
              ) : (
                <>
                  <Swords className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Duelo contra {selectedOpponentName}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-xl text-xs font-bold border ${leaderColor}`}>
            {leaderText}
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-white/10 font-mono text-sm font-black text-white flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{activeTimeLeft}s</span>
          </div>
        </div>
      </div>

      {/* Dual Arena Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Player 1 Card (TÚ) */}
        <div className={`p-4 rounded-2xl bg-slate-900 border transition-all ${
          isP1InTune ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : 'border-white/10'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                TÚ
              </div>
              <div>
                <div className="text-xs font-black text-white">Tu Voz</div>
                <div className="text-[10px] text-slate-400">Microfono local</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-emerald-400">
                {p1InTuneSeconds.toFixed(1)}s afinado
              </span>
            </div>
          </div>

          <PitchNeedle
            centsDiff={p1PitchDiff}
            currentPitch={p1CurrentPitch}
            targetFreq={selectedNote.frequency}
            isInTune={isP1InTune}
            accentColor="emerald"
            label="Desviacion de Tu Voz"
          />

          <div className="mt-3.5 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-emerald-400" />
              Estabilidad
            </span>
            <div className="w-28 bg-slate-950 h-2 rounded-full overflow-hidden border border-white/10">
              <div
                className="bg-emerald-500 h-full transition-all duration-200"
                style={{ width: `${Math.min(100, (p1InTuneSeconds / 10) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Player 2 Card (RIVAL) */}
        <div className={`p-4 rounded-2xl bg-slate-900 border transition-all ${
          isP2InTune ? 'border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.15)]' : 'border-white/10'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
                VS
              </div>
              <div>
                <div className="text-xs font-black text-white truncate max-w-[130px]">{selectedOpponentName}</div>
                <div className="text-[10px] text-indigo-300">
                  {isRealtime ? 'Transmision P2P' : 'Rival Fantasma / IA'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-indigo-300">
                {p2InTuneSeconds.toFixed(1)}s afinado
              </span>
            </div>
          </div>

          <PitchNeedle
            centsDiff={p2PitchDiff}
            currentPitch={p2CurrentPitch}
            targetFreq={selectedNote.frequency}
            isInTune={isP2InTune}
            accentColor="indigo"
            label={`Desviacion de ${selectedOpponentName}`}
          />

          <div className="mt-3.5 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-indigo-400" />
              Estabilidad
            </span>
            <div className="w-28 bg-slate-950 h-2 rounded-full overflow-hidden border border-white/10">
              <div
                className="bg-indigo-500 h-full transition-all duration-200"
                style={{ width: `${Math.min(100, (p2InTuneSeconds / 10) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tug of War Bar */}
      <div className="p-3 rounded-2xl bg-slate-900/90 border border-white/5 space-y-1.5">
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
          <span className="text-emerald-400">Tu Presion ({p1Share.toFixed(0)}%)</span>
          <span className="text-indigo-300">Presion Rival ({(100 - p1Share).toFixed(0)}%)</span>
        </div>
        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex border border-white/5">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${p1Share}%` }}
          />
          <div
            className="bg-indigo-500 h-full transition-all duration-300"
            style={{ width: `${100 - p1Share}%` }}
          />
        </div>
      </div>
    </div>
  );
};
