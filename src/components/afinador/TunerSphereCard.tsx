import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, Mic, X, Zap, ShieldCheck } from 'lucide-react';
import { AudioParticleCanvas } from '../AudioParticleCanvas';
import { AuraShieldRing } from '../AuraShieldRing';
import { ChromaticNoteButtonInfo, NoteInfo, voicePlayback, getOctaveIndicator } from '../../utils/voicePlaybackService';
import { Difficulty } from '../../data/tunerLevelsData';

interface TunerSphereCardProps {
  tunerMode: 'libre' | 'niveles';
  selectedDifficulty: Difficulty;
  currentLevel: number;
  comboCount: number;
  showComboAnimation: boolean;
  activeTargetNote: ChromaticNoteButtonInfo | NoteInfo;
  gender: 'masculino' | 'femenino';
  isTuningActive: boolean;
  detectedPitch: number | null;
  targetFreq: number;
  volume: number;
  tuningStatusMsg: string;
  isPitchMatched: boolean;
  ringProgress: number;
  sphereStyle: string;
  badgeBorderColor: string;
  statusTextColor: string;
  statusIcon: React.ReactNode;
  challengeIndex: number;
  challengeNotes: NoteInfo[];
  toggleTuning: () => void;
  onExitLevelToLibre: () => void;
  onPlayReferenceNote?: () => void;
  darkMode?: boolean;
  zenMode?: boolean;
}

export const TunerSphereCard: React.FC<TunerSphereCardProps> = ({
  tunerMode,
  selectedDifficulty,
  currentLevel,
  comboCount,
  showComboAnimation,
  activeTargetNote,
  gender,
  isTuningActive,
  detectedPitch,
  targetFreq,
  volume,
  tuningStatusMsg,
  isPitchMatched,
  ringProgress,
  sphereStyle,
  badgeBorderColor,
  statusTextColor,
  statusIcon,
  challengeIndex,
  challengeNotes,
  toggleTuning,
  onExitLevelToLibre,
  onPlayReferenceNote,
  darkMode = false,
  zenMode = false
}) => {
  return (
    <div
      id="tour-tuner-card"
      className={`rounded-3xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-3.5 transition-colors border ${
        zenMode
          ? 'bg-[#1f2125] border-[#2e3138]'
          : 'bg-white dark:bg-[#102034] border-slate-100 dark:border-[#1b2b3f]'
      }`}
    >
      {/* Header: Title on left, Escuchar & EN VIVO on right, dynamic subtitle below */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {tunerMode === 'libre' && (
              <h2
                className={`font-heading font-bold text-lg whitespace-nowrap truncate ${
                  zenMode ? 'text-[#f0ebe1]' : 'text-[#2c2abc] dark:text-[#c0c1ff]'
                }`}
              >
                Afinador Vocal
              </h2>
            )}
            {tunerMode === 'niveles' && (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/70 border border-amber-200/80 dark:border-amber-800/80 text-amber-700 dark:text-amber-300 text-[10px] font-heading font-extrabold shrink-0">
                {selectedDifficulty} • Nv {currentLevel}
              </span>
            )}
            {tunerMode === 'niveles' && comboCount >= 2 && (
              <span className="flex items-center gap-0.5 text-xs font-heading font-black text-amber-500 dark:text-amber-400 animate-bounce shrink-0">
                <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                x{comboCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                if (onPlayReferenceNote) onPlayReferenceNote();
                else voicePlayback.playVoiceNote(activeTargetNote, gender, 2.0);
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
              <div
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl font-bold whitespace-nowrap border ${
                  zenMode
                    ? 'bg-[#26292f] text-[#e5b83b] border-[#e5b83b]/30'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full animate-ping ${
                    zenMode ? 'bg-[#e5b83b]' : 'bg-emerald-500'
                  }`}
                />
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

            {tunerMode === 'niveles' && (
              <button
                onClick={onExitLevelToLibre}
                className="p-1 sm:p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700"
                title="Volver a Modo Libre"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {tunerMode === 'libre' ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {!isTuningActive
              ? 'Activa el micrófono abajo para evaluar tu voz'
              : detectedPitch
              ? `Detectando tu voz • ${tuningStatusMsg}`
              : `Escuchando en vivo... Canta ${activeTargetNote.name}`}
          </p>
        ) : (
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                Nota {challengeIndex + 1} de {challengeNotes.length}
              </span>
              <div className="flex items-center gap-1 ml-1">
                {challengeNotes.map((_, idx) => (
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
        )}
      </div>

      {/* Calentamiento banner (Solo en niveles cuando está en calentamiento) */}
      {tunerMode === 'niveles' && selectedDifficulty === 'Calentamiento' && (
        <div
          className={`flex items-center justify-between p-2.5 rounded-2xl border text-xs font-bold ${
            zenMode
              ? 'bg-[#22252a] border-[#2e3138] text-[#ded9cf]'
              : 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Calentamiento (Zona Segura • Sin perder vidas)</span>
          </div>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-heading font-extrabold">
            Libre
          </span>
        </div>
      )}

      {/* Gauge Display with Particles & Dynamic Central Sphere */}
      <div
        id="tour-tuner-gauge"
        className={`bg-[#e9f0ff] dark:bg-[#0b1828] ${
          zenMode ? 'zen-mode:bg-[#131d2a]' : ''
        } rounded-2xl p-4 border border-blue-100 dark:border-slate-800 relative min-h-[210px] flex flex-col justify-between overflow-hidden shadow-inner`}
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

        {/* Floating Combo Big Text */}
        <AnimatePresence>
          {showComboAnimation && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 10 }}
              animate={{ scale: 1.2, opacity: 1, y: -10 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="absolute inset-x-0 top-2 z-30 flex justify-center pointer-events-none"
            >
              <span className="text-2xl sm:text-3xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 drop-shadow-lg">
                ¡COMBO x{comboCount}! ⚡
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Center Sphere with Concentric Aura Shield Ring */}
        <div className="relative z-10 flex flex-col items-center my-2">
          <AuraShieldRing
            progress={ringProgress}
            isActive={isTuningActive}
            isMatched={isPitchMatched}
            zenMode={zenMode}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (onPlayReferenceNote) onPlayReferenceNote();
                else voicePlayback.playVoiceNote(activeTargetNote, gender, 2.0);
              }}
              title="Toca para escuchar voz real"
              className={`w-22 h-22 rounded-full flex flex-col items-center justify-center text-white shadow-xl transition-all duration-300 relative cursor-pointer ${sphereStyle}`}
              style={{
                transform:
                  isTuningActive && volume > 0.02
                    ? `scale(${1 + Math.min(0.18, volume * 1.5)})`
                    : undefined
              }}
            >
              {(() => {
                const targetArrow =
                  ('octaveArrow' in activeTargetNote && activeTargetNote.octaveArrow !== undefined)
                    ? activeTargetNote.octaveArrow
                    : getOctaveIndicator(activeTargetNote.octave, gender);
                return (
                  <span className="font-heading font-bold text-3xl tracking-wide leading-none drop-shadow-sm flex items-center justify-center">
                    <span>{activeTargetNote.name}</span>
                    {targetArrow && (
                      <span
                        className={`ml-1 text-base font-black select-none ${
                          targetArrow === 'up'
                            ? '-translate-y-1 text-amber-300'
                            : 'translate-y-1 text-sky-300'
                        }`}
                        title={targetArrow === 'up' ? 'Octava aguda (▲)' : 'Octava grave (▼)'}
                      >
                        {targetArrow === 'up' ? '▲' : '▼'}
                      </span>
                    )}
                  </span>
                );
              })()}
              <span className="text-[11px] font-semibold opacity-95 mt-1 bg-black/25 px-2.5 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
                <Volume2 className="w-3 h-3 opacity-80" />
                {detectedPitch ? `${detectedPitch} Hz` : `${targetFreq} Hz`}
              </span>
            </motion.button>
          </AuraShieldRing>

          {/* State Badge */}
          {isTuningActive ? (
            <div
              className={`mt-5 flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold shadow-md border transition-all duration-300 ${badgeBorderColor} ${statusTextColor}`}
            >
              {statusIcon}
              <span>{tuningStatusMsg}</span>
            </div>
          ) : (
            <button
              onClick={toggleTuning}
              className={`mt-5 flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs hover:scale-102 ${
                zenMode
                  ? 'bg-[#26292f] text-[#e5b83b] border border-[#e5b83b]/40 hover:bg-[#2e323a]'
                  : 'bg-white/95 dark:bg-[#102034]/95 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/70 hover:bg-indigo-50 dark:hover:bg-[#15273e]'
              }`}
            >
              <Mic
                className={`w-3.5 h-3.5 ${
                  zenMode ? 'text-[#e5b83b]' : 'text-indigo-500'
                } animate-pulse`}
              />
              <span>Toca para activar micrófono y afinar</span>
            </button>
          )}
        </div>

        {/* Equalizer Waveform Bars (h-12 w-6) */}
        <div className="relative z-10 flex items-end justify-center gap-2 h-12 pt-2">
          {[40, 65, 85, 45, 75, 95, 60].map((baseHeight, i) => {
            const dynamicHeight =
              isTuningActive && volume > 0.01
                ? Math.min(100, Math.max(20, baseHeight * (volume * 15)))
                : baseHeight * 0.4;
            return (
              <div
                key={i}
                className={`w-6 rounded-t-md transition-all duration-150 ${
                  zenMode
                    ? isPitchMatched
                      ? 'bg-[#e5b83b]'
                      : 'bg-[#383c44]'
                    : isPitchMatched
                    ? 'bg-emerald-400'
                    : 'bg-[#98a5f5]'
                }`}
                style={{ height: `${dynamicHeight}%` }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
