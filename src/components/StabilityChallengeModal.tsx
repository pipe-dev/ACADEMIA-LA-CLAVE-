'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Target, ArrowLeft } from 'lucide-react';
import { audioService } from '../utils/audioService';
import { StabilityChallengeModalProps } from './stability/stabilityTypes';
import { useStabilityEngine } from './stability/useStabilityEngine';
import { StabilitySetupView } from './stability/StabilitySetupView';
import { StabilitySingingView } from './stability/StabilitySingingView';
import { StabilityResultsView } from './stability/StabilityResultsView';

export { type StabilityChallengeModalProps };

export const StabilityChallengeModal: React.FC<StabilityChallengeModalProps> = ({
  isOpen = true,
  onClose,
  onGrantXp,
  isEmbeddedView = false
}) => {
  const {
    phase,
    gender,
    effectiveRangeData,
    availableOctaves,
    currentOctave,
    selectedOctave,
    setSelectedOctave,
    naturalNotes,
    sharpNotes,
    selectedNote,
    setSelectedNote,
    isNoteInRange,
    startChallenge,
    handleRetry,
    handleChangeNote,
    cleanup,
    timeLeft,
    inTuneSeconds,
    currentPitch,
    centsOff,
    isCurrentlyInTune,
    trailPoints,
    toleranceCents,
    finalScore,
    xpMultiplier,
    earnedXp,
    stabilityPercent
  } = useStabilityEngine({
    isOpen,
    isEmbeddedView,
    onGrantXp
  });

  const innerContent = (
    <div className="bg-white dark:bg-[#102034] w-full rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-[#1b2b3f] shadow-md space-y-5 relative">
      {/* ─── Navigation Header ─── */}
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => {
            audioService.playCloseSound();
            cleanup();
            onClose();
          }}
          className="py-1.5 px-2.5 sm:py-2 sm:px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-1.5 font-heading font-bold text-[11px] sm:text-xs shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
          <span className="hidden sm:inline">Volver a Gimnasio Vocal</span>
          <span className="sm:hidden">Volver</span>
        </button>

        <span className="text-[9px] sm:text-[10px] font-extrabold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full uppercase tracking-wider shrink-0 text-right">
          Aparato de Estabilidad
        </span>
      </div>

      {/* ─── Title Header ─── */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300 shrink-0">
          <Target className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-heading font-black text-xl text-[#0b1c30] dark:text-[#d3e4fe]">
            Desafío de Estabilidad Vocal
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Sostén la nota elegida fija durante 10s con estricta precisión de afinación
          </p>
        </div>
      </div>

      {/* ─── PHASE: SETUP ─── */}
      {phase === 'setup' && (
        <StabilitySetupView
          naturalNotes={naturalNotes}
          sharpNotes={sharpNotes}
          availableOctaves={availableOctaves}
          currentOctave={currentOctave}
          selectedOctave={selectedOctave}
          onSelectOctave={setSelectedOctave}
          selectedNote={selectedNote}
          onSelectNote={setSelectedNote}
          isNoteInRange={isNoteInRange}
          gender={gender}
          effectiveRangeData={effectiveRangeData}
          toleranceCents={toleranceCents}
          onStartChallenge={startChallenge}
        />
      )}

      {/* ─── PHASE: SINGING / COUNTDOWN ─── */}
      {phase === 'singing' && (
        <StabilitySingingView
          timeLeft={timeLeft}
          isCurrentlyInTune={isCurrentlyInTune}
          selectedNote={selectedNote}
          currentPitch={currentPitch}
          centsOff={centsOff}
          inTuneSeconds={inTuneSeconds}
          trailPoints={trailPoints}
          toleranceCents={toleranceCents}
        />
      )}

      {/* ─── PHASE: RESULTS ─── */}
      {phase === 'results' && (
        <StabilityResultsView
          selectedNote={selectedNote}
          finalScore={finalScore}
          xpMultiplier={xpMultiplier}
          earnedXp={earnedXp}
          stabilityPercent={stabilityPercent}
          onRetry={handleRetry}
          onChangeNote={handleChangeNote}
        />
      )}
    </div>
  );

  if (isEmbeddedView) {
    return <div className="w-full animate-fadeIn">{innerContent}</div>;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fadeIn cursor-pointer"
      onClick={() => {
        cleanup();
        onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto cursor-default"
      >
        {innerContent}
      </motion.div>
    </div>
  );
};

export default StabilityChallengeModal;
