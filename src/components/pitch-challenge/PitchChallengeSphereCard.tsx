'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Mic, Volume2, Sparkles, CheckCircle2 } from 'lucide-react';
import { voicePlayback, NoteInfo } from '../../utils/voicePlaybackService';
import { AudioParticleCanvas } from '../AudioParticleCanvas';

export interface PitchChallengeSphereCardProps {
  difficultyLabel: string;
  levelNumber: number;
  subtitle?: string;
  notes: NoteInfo[];
  challengeIndex: number;
  isTuningActive: boolean;
  detectedPitch: number | null;
  volume: number;
  isPitchMatched: boolean;
  tuningStatusMsg: string;
  activeTargetNote: NoteInfo;
  targetFreq: number;
  pitchDiff: number | null;
  gender?: 'masculino' | 'femenino';
  zenMode?: boolean;
  darkMode?: boolean;
  onToggleTuning: () => void;
}

export const PitchChallengeSphereCard: React.FC<PitchChallengeSphereCardProps> = ({
  difficultyLabel,
  levelNumber,
  subtitle,
  notes,
  challengeIndex,
  isTuningActive,
  detectedPitch,
  volume,
  isPitchMatched,
  tuningStatusMsg,
  activeTargetNote,
  targetFreq,
  pitchDiff,
  gender = 'femenino',
  zenMode = false,
  darkMode = false,
  onToggleTuning
}) => {
  let sphereStyle = zenMode
    ? 'bg-[#22252a] text-[#f0ebe1] border-2 border-[#e5b83b] shadow-[0_0_20px_rgba(229,184,59,0.25)] scale-100 ring-0'
    : 'bg-[#4648d4] dark:bg-[#5356e8] shadow-[#4648d4]/40 scale-100 ring-0';
  let badgeBorderColor = zenMode
    ? 'border-[#2e3138] bg-[#1f2125]'
    : 'border-slate-200/80 dark:border-slate-700';
  let statusTextColor = zenMode ? 'text-[#f0ebe1]' : 'text-slate-800 dark:text-slate-200';
  let statusIcon = (
    <Sparkles
      className={`w-3.5 h-3.5 ${zenMode ? 'text-[#e5b83b]' : 'text-indigo-500 dark:text-indigo-400'} animate-pulse`}
    />
  );

  if (isPitchMatched) {
    sphereStyle = zenMode
      ? 'bg-[#e5b83b] text-[#161719] shadow-[0_0_40px_rgba(229,184,59,0.9)] scale-110 ring-4 ring-[#f5d56b] animate-pulse'
      : 'bg-emerald-500 dark:bg-emerald-600 shadow-[0_0_40px_rgba(16,185,129,0.9)] scale-110 ring-4 ring-emerald-300 dark:ring-emerald-400 animate-pulse';
    badgeBorderColor = zenMode
      ? 'border-[#e5b83b] bg-[#e5b83b]/20'
      : 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/90 dark:bg-emerald-950/90';
    statusTextColor = zenMode ? 'text-[#e5b83b]' : 'text-emerald-800 dark:text-emerald-200';
    statusIcon = (
      <CheckCircle2
        className={`w-4 h-4 ${zenMode ? 'text-[#e5b83b]' : 'text-emerald-500'} animate-bounce`}
      />
    );
  } else if (pitchDiff !== null) {
    if (pitchDiff <= 12) {
      sphereStyle = zenMode
        ? 'bg-[#d8a728] text-[#161719] shadow-[0_0_30px_rgba(229,184,59,0.7)] scale-105 ring-4 ring-[#f5d56b]'
        : 'bg-amber-500 dark:bg-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.8)] scale-105 ring-4 ring-amber-300 dark:ring-amber-400/80';
      badgeBorderColor = zenMode
        ? 'border-[#d8a728] bg-[#d8a728]/20'
        : 'border-amber-300 dark:border-amber-700 bg-amber-50/90 dark:bg-amber-950/90';
      statusTextColor = zenMode ? 'text-[#f5d56b]' : 'text-amber-800 dark:text-amber-200';
      statusIcon = (
        <Sparkles
          className={`w-3.5 h-3.5 ${zenMode ? 'text-[#f5d56b]' : 'text-amber-500'} animate-pulse`}
        />
      );
    } else {
      sphereStyle = zenMode
        ? 'bg-[#2a2d34] text-[#ded9cf] border-2 border-[#e5b83b]/50 shadow-[0_0_20px_rgba(0,0,0,0.5)] scale-100 ring-2 ring-[#e5b83b]/30'
        : 'bg-rose-600 dark:bg-rose-600 shadow-[0_0_30px_rgba(225,29,72,0.8)] scale-100 ring-4 ring-rose-300 dark:ring-rose-500/80';
      badgeBorderColor = zenMode
        ? 'border-[#383c44] bg-[#26292f]'
        : 'border-rose-300 dark:border-rose-700 bg-rose-50/90 dark:bg-rose-950/90';
      statusTextColor = zenMode ? 'text-[#ded9cf]' : 'text-rose-800 dark:text-rose-200';
      statusIcon = (
        <Sparkles
          className={`w-3.5 h-3.5 ${zenMode ? 'text-[#e5b83b]' : 'text-rose-500'} animate-ping`}
        />
      );
    }
  }

  return (
    <div
      className={`rounded-3xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-3.5 transition-colors border ${
        zenMode
          ? 'bg-[#1f2125] border-[#2e3138]'
          : 'bg-white dark:bg-[#102034] border-slate-100 dark:border-[#1b2b3f]'
      }`}
    >
      {/* Header: Title on left, Escuchar & EN VIVO on right */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/70 border border-amber-200/80 dark:border-amber-800/80 text-amber-700 dark:text-amber-300 text-[11px] font-heading font-extrabold shrink-0">
              {difficultyLabel} • Nv {levelNumber}
            </span>
            {subtitle && (
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                {subtitle}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isTuningActive ? (
              <div
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl font-bold whitespace-nowrap border ${
                  zenMode
                    ? 'bg-[#26292f] text-[#e5b83b] border-[#e5b83b]/30'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full animate-ping ${zenMode ? 'bg-[#e5b83b]' : 'bg-emerald-500'}`}
                />
                <span>EN VIVO</span>
              </div>
            ) : (
              <button
                onClick={onToggleTuning}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                  zenMode
                    ? 'bg-[#26292f] text-[#e5b83b] border-[#e5b83b]/30 '
                    : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400   border-indigo-200/50 dark:border-indigo-800/50'
                }`}
                title="Activar micrófono para afinar"
              >
                <Mic
                  className={`w-3.5 h-3.5 ${zenMode ? 'text-[#e5b83b]' : 'text-indigo-500'} animate-pulse`}
                />
                <span>Activar</span>
              </button>
            )}
          </div>
        </div>

        {/* Note sequence dots and frequency counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
              Nota {challengeIndex + 1} de {notes.length}
            </span>
            <div className="flex items-center gap-1 ml-1">
              {notes.map((_, idx) => (
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
      </div>

      {/* Gauge Display with Particles & Dynamic Central Sphere */}
      <div
        className={`bg-[#e9f0ff] dark:bg-[#0b1828] ${zenMode ? 'zen-mode:bg-[#131d2a]' : ''} rounded-2xl p-4 border border-blue-100 dark:border-slate-800 relative min-h-[190px] flex flex-col justify-between overflow-hidden shadow-inner`}
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

        {/* Dynamic Center Sphere */}
        <div className="relative z-10 flex flex-col items-center my-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              voicePlayback.playVoiceNote(activeTargetNote, gender, 2.0);
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
            <span className="font-heading font-bold text-3xl tracking-wide leading-none drop-shadow-sm">
              {activeTargetNote.name}
            </span>
            <span className="text-[11px] font-semibold opacity-95 mt-1 bg-black/25 px-2.5 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
              <Volume2 className="w-3 h-3 opacity-80" />
              {detectedPitch ? `${detectedPitch} Hz` : `${targetFreq} Hz`}
            </span>
          </motion.button>

          {/* State Badge */}
          {isTuningActive ? (
            <div
              className={`mt-2.5 flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold shadow-md border transition-all duration-300 ${badgeBorderColor} ${statusTextColor}`}
            >
              {statusIcon}
              <span>{tuningStatusMsg}</span>
            </div>
          ) : (
            <button
              onClick={onToggleTuning}
              className={`mt-2 flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs ${
                zenMode
                  ? 'bg-[#26292f] text-[#e5b83b] border border-[#e5b83b]/40 '
                  : 'bg-white/95 dark:bg-[#102034]/95 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/70  '
              }`}
            >
              <Mic
                className={`w-3.5 h-3.5 ${zenMode ? 'text-[#e5b83b]' : 'text-indigo-500'} animate-pulse`}
              />
              <span>Toca para activar micrófono y afinar</span>
            </button>
          )}
        </div>

        {/* Equalizer Waveform Bars */}
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
