'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { audioService } from '../utils/audioService';
import {
  voicePlayback,
  generateUserNotePool,
  getComfortableChromaticNotes,
  ChromaticNoteButtonInfo
} from '../utils/voicePlaybackService';
import {
  Difficulty,
  ChallengeDifficulty,
  difficultyLevels,
  rhythmPatterns
} from '../data/tunerLevelsData';
import { PitchStabilityChart } from './PitchStabilityChart';
import { TunerRhythmView } from './TunerRhythmView';
import { getTimeToNextLife } from '../utils/livesEngine';
import { AfinadorViewProps, TunerSubView } from './afinador/afinadorTypes';
import { useAfinadorPitch } from './afinador/useAfinadorPitch';
import { useAfinadorLevels } from './afinador/useAfinadorLevels';
import { TunerSphereCard } from './afinador/TunerSphereCard';
import { ChromaticKeyboard } from './afinador/ChromaticKeyboard';
import { TunerToolsAccordion } from './afinador/TunerToolsAccordion';
import { TunerHistorySection } from './afinador/TunerHistorySection';
import { TunerSubViewsOrchestrator } from './afinador/TunerSubViewsOrchestrator';
import { TunerModals } from './afinador/TunerModals';
import { TunerLivesLockedGate } from './afinador/TunerLivesLockedGate';

export const AfinadorView: React.FC<AfinadorViewProps> = ({
  userStats,
  darkMode = false,
  zenMode = false,
  onUpdateQuestProgress,
  onUpdateStats,
  onLoseLife,
  onOpenRecoveryExam,
  onOpenStore
}) => {
  // ─── 1. Vocal Range Calibration State ──────────────────────────────
  const [effectiveRangeData, setEffectiveRangeData] = useState(() => {
    if (userStats.vocalRangeData) return userStats.vocalRangeData;
    try {
      const saved = localStorage.getItem('laclave_vocal_range_saved');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [gender, setGender] = useState<'masculino' | 'femenino'>(() => {
    try {
      const saved = localStorage.getItem('laclave_voice_gender');
      if (saved === 'masculino' || saved === 'femenino') return saved;
      const savedRange = localStorage.getItem('laclave_vocal_range_saved');
      if (savedRange) {
        const parsed = JSON.parse(savedRange);
        if (parsed.gender === 'masculino' || parsed.gender === 'femenino') return parsed.gender;
        if (
          parsed.classification === 'Bajo' ||
          parsed.classification === 'Barítono' ||
          parsed.classification === 'Tenor'
        ) {
          return 'masculino';
        }
      }
    } catch {}
    return 'femenino';
  });

  const [isRangeRequiredModalOpen, setIsRangeRequiredModalOpen] = useState<boolean>(
    !effectiveRangeData
  );

  useEffect(() => {
    voicePlayback.preloadNotes(gender);
  }, [gender]);

  useEffect(() => {
    if (userStats.vocalRangeData) {
      setEffectiveRangeData(userStats.vocalRangeData);
      setIsRangeRequiredModalOpen(false);
    }
  }, [userStats.vocalRangeData]);

  // ─── 2. Adaptive Note Pool & 12 Chromatic Notes ──────────────────
  const userNotePool = useMemo(() => {
    return generateUserNotePool(effectiveRangeData, gender);
  }, [effectiveRangeData, gender]);

  const chromaticData = useMemo(() => {
    return getComfortableChromaticNotes(effectiveRangeData, gender);
  }, [effectiveRangeData, gender]);

  const { allNotes, naturalNotes, sharpNotes } = chromaticData;

  const blackKeyPositions = useMemo(
    () => [
      { note: sharpNotes[0], left: '14.2857%' },
      { note: sharpNotes[1], left: '28.5714%' },
      { note: sharpNotes[2], left: '57.1428%' },
      { note: sharpNotes[3], left: '71.4285%' },
      { note: sharpNotes[4], left: '85.7142%' }
    ],
    [sharpNotes]
  );

  // ─── 3. Tuner Mode & Note Selection ──────────────────────────────
  const [tunerMode, setTunerMode] = useState<'libre' | 'niveles'>('libre');
  const [selectedNote, setSelectedNote] = useState<ChromaticNoteButtonInfo>(
    () => naturalNotes[0] || allNotes[0]
  );
  const [difficulty, setDifficulty] = useState<'facil' | 'medio' | 'dificil'>('medio');

  useEffect(() => {
    if (allNotes.length > 0) {
      setSelectedNote(prev => {
        const matching = allNotes.find(b => b.name === prev.name);
        return matching || naturalNotes[0] || allNotes[0];
      });
    }
  }, [allNotes, naturalNotes]);

  // ─── 4. Sub-Views & Tools ─────────────────────────────────────────
  const [isExtraToolsOpen, setIsExtraToolsOpen] = useState<boolean>(false);
  const [activeSubView, setActiveSubView] = useState<TunerSubView>(null);

  useEffect(() => {
    if (activeSubView) {
      window.scrollTo(0, 0);
    }
  }, [activeSubView]);

  // ─── 5. Pitch Controls Bridge Ref ────────────────────────────────
  const pitchControlsRef = useRef<{
    startTuningMic: () => Promise<boolean>;
    stopTuningMic: () => void;
    resetTugOfWar: (val?: number) => void;
    setGracePeriod: (ms: number) => void;
    setIsLevelFailed: (failed: boolean) => void;
  } | null>(null);

  // ─── 6. Gamified Levels Hook (defined first with live challenge state) ──
  const levelsHook = useAfinadorLevels({
    userNotePool,
    gender,
    userStats,
    onUpdateStats,
    onOpenRecoveryExam,
    onTuningStart: () => { pitchControlsRef.current?.startTuningMic(); },
    onTuningStop: () => { pitchControlsRef.current?.stopTuningMic(); },
    resetTugOfWar: (val) => { pitchControlsRef.current?.resetTugOfWar(val); },
    setGracePeriod: (ms) => { pitchControlsRef.current?.setGracePeriod(ms); },
    setIsLevelFailed: (failed) => { pitchControlsRef.current?.setIsLevelFailed(failed); },
    setTunerMode,
    setDifficulty
  });

  const activeTargetNote =
    tunerMode === 'libre'
      ? selectedNote
      : levelsHook.challengeNotes[levelsHook.challengeIndex] || selectedNote;

  // ─── 7. Pitch Detection Hook (receives LIVE challenge target & notes) ─
  const pitchHook = useAfinadorPitch({
    tunerMode,
    selectedNote,
    activeTargetNote,
    selectedDifficulty: levelsHook.selectedDifficulty,
    difficulty,
    challengeNotes: levelsHook.challengeNotes,
    challengeIndex: levelsHook.challengeIndex,
    userLives: userStats.lives ?? 1,
    zenMode,
    onUpdateQuestProgress,
    onLoseLife,
    onNoteCompletedInChallenge: levelsHook.handleNoteCompletedInChallenge,
    onOpenRecoveryExam
  });

  // Keep bridge ref pointing to latest pitchHook handlers
  pitchControlsRef.current = {
    startTuningMic: pitchHook.startTuningMic,
    stopTuningMic: pitchHook.stopTuningMic,
    resetTugOfWar: pitchHook.resetTugOfWar,
    setGracePeriod: pitchHook.setGracePeriod,
    setIsLevelFailed: pitchHook.setIsLevelFailed
  };

  const handlePlayReferenceNote = useCallback(() => {
    pitchHook.registerPlayedNote(activeTargetNote.name);
    voicePlayback.playVoiceNote(activeTargetNote, gender, 2.0);
  }, [activeTargetNote, gender, pitchHook]);

  const handleSelectNote = (note: ChromaticNoteButtonInfo) => {
    if (tunerMode === 'niveles') {
      const isTarget = activeTargetNote.name.toUpperCase() === note.name.toUpperCase();
      if (!isTarget) return;
      pitchHook.registerPlayedNote(activeTargetNote.name);
      voicePlayback.playVoiceNote(activeTargetNote, gender, 2.0);
      return;
    }

    setSelectedNote(note);
    pitchHook.setIsPitchMatched(false);
    pitchHook.setDetectedPitch(null);
    pitchHook.registerPlayedNote(note.name);
    voicePlayback.playVoiceNote(
      { name: note.displayName || note.name, midi: note.midi, frequency: note.frequency, octave: note.octave },
      gender,
      2.0
    );
  };

  const handleSaveManualRange = (data: {
    classification: string; noteMin: string; noteMax: string; minHz: number; maxHz: number; gender: 'masculino' | 'femenino';
  }) => {
    const rangeData = { classification: data.classification, noteMin: data.noteMin, noteMax: data.noteMax, minHz: data.minHz, maxHz: data.maxHz };
    setEffectiveRangeData(rangeData);
    setGender(data.gender);
    setIsRangeRequiredModalOpen(false);

    try {
      localStorage.setItem('laclave_vocal_range_saved', JSON.stringify(rangeData));
      localStorage.setItem('laclave_vocal_range_classification', data.classification);
      localStorage.setItem('laclave_voice_gender', data.gender);
    } catch {}

    if (onUpdateStats) {
      onUpdateStats({
        vocalRange: data.classification,
        vocalRangeData: rangeData
      });
    }
  };

  // Passive countdown for 0 lives
  const [timeToNextLife, setTimeToNextLife] = useState<{ remainingMs: number; formatted: string }>(() =>
    getTimeToNextLife(userStats)
  );

  useEffect(() => {
    if ((userStats.lives ?? 1) > 0) return;
    setTimeToNextLife(getTimeToNextLife(userStats));
    const timer = setInterval(() => {
      setTimeToNextLife(getTimeToNextLife(userStats));
    }, 1000);
    return () => clearInterval(timer);
  }, [userStats.lives, userStats.lastLifeLostAt]);

  useEffect(() => {
    if ((userStats.lives ?? 1) <= 0 && pitchHook.isTuningActive) {
      pitchHook.stopTuningMic();
    }
  }, [userStats.lives, pitchHook.isTuningActive, pitchHook.stopTuningMic]);

  useEffect(() => {
    return () => {
      audioService.stopMicrophone();
      voicePlayback.stopActiveSound();
    };
  }, []);

  const isRhythmActive =
    tunerMode === 'niveles' &&
    levelsHook.selectedDifficulty !== 'Calentamiento' &&
    difficultyLevels[levelsHook.selectedDifficulty as ChallengeDifficulty]?.[levelsHook.currentLevel - 1] === 0;

  // Maestro rhythm levels use the hardest patterns (220-250 BPM)
  const rhythmPatternIndex =
    levelsHook.selectedDifficulty === 'Maestro'
      ? levelsHook.currentLevel + 14
      : levelsHook.currentLevel;

  // ─── 7. Early Returns for Sub-Views ───────────────────────────────
  if (activeSubView) {
    return (
      <TunerSubViewsOrchestrator
        activeSubView={activeSubView}
        onClose={() => setActiveSubView(null)}
        onGrantXp={(amount) => {
          if (onUpdateStats) {
            onUpdateStats({ xp: (userStats.xp || 0) + amount });
          }
        }}
        onSaveVocalRange={(rangeData) => {
          setEffectiveRangeData(rangeData);
          if (rangeData.gender) {
            setGender(rangeData.gender);
            try { localStorage.setItem('laclave_voice_gender', rangeData.gender); } catch {}
            voicePlayback.preloadNotes(rangeData.gender);
          }
          setIsRangeRequiredModalOpen(false);
          if (onUpdateStats) {
            onUpdateStats({
              vocalRange: rangeData.classification,
              vocalRangeData: rangeData
            });
          }
        }}
      />
    );
  }

  // ─── 8. Main View Render ─────────────────────────────────────────
  return (
    <div className="pb-6 pt-0 px-2 sm:px-4 max-w-md mx-auto space-y-2 sm:space-y-2.5 animate-fadeIn relative -mt-4 sm:-mt-3">
      {/* ─── Modals Group (Calibration, Level Select, Win, Defeat, Video) ─── */}
      <TunerModals
        isRangeRequiredModalOpen={isRangeRequiredModalOpen}
        onStartAssessment={() => {
          setIsRangeRequiredModalOpen(false);
          setActiveSubView('tesitura');
        }}
        onManualSelectRange={handleSaveManualRange}
        isLevelSelectOpen={levelsHook.isLevelSelectOpen}
        onCloseLevelSelect={() => levelsHook.setIsLevelSelectOpen(false)}
        selectedDifficulty={levelsHook.selectedDifficulty}
        onSelectDifficulty={levelsHook.setSelectedDifficulty}
        onStartLevel={levelsHook.startLevel}
        levelProgress={levelsHook.levelProgress}
        userStreak={userStats.streak || 0}
        isWinModalOpen={levelsHook.isWinModalOpen}
        currentLevel={levelsHook.currentLevelRef.current || levelsHook.currentLevel}
        winStars={levelsHook.winStars}
        winXp={levelsHook.winXp}
        onNextLevel={levelsHook.handleNextLevel}
        onReplayLevel={() => levelsHook.startLevel(levelsHook.selectedDifficultyRef.current, levelsHook.currentLevelRef.current)}
        onCloseWinModal={() => {
          levelsHook.setIsWinModalOpen(false);
          levelsHook.setIsLevelSelectOpen(true);
        }}
        isLevelFailed={pitchHook.isLevelFailed}
        userLives={userStats.lives ?? 1}
        onRetryLevel={() => {
          pitchHook.setIsLevelFailed(false);
          levelsHook.startLevel(levelsHook.selectedDifficulty, levelsHook.currentLevel);
        }}
        onExitLevelToLibre={() => {
          pitchHook.setIsLevelFailed(false);
          setTunerMode('libre');
        }}
        onOpenRecoveryExam={onOpenRecoveryExam}
        onOpenStore={onOpenStore}
        showEasyWinVideo={levelsHook.showEasyWinVideo}
        onCloseEasyWinVideo={() => {
          levelsHook.setShowEasyWinVideo(false);
          levelsHook.setIsLevelSelectOpen(true);
        }}
        zenMode={zenMode}
      />

      {/* Vocal Range Mini Header */}
      {effectiveRangeData && (
        <div className="flex items-center justify-between px-2 py-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${zenMode ? 'bg-[#e5b83b]' : 'bg-indigo-500'}`} />
            <span>
              Tesitura: <strong className="font-bold text-slate-700 dark:text-slate-300">{effectiveRangeData.classification}</strong>{' '}
              <span className="opacity-75">({effectiveRangeData.noteMin} - {effectiveRangeData.noteMax})</span>
            </span>
          </div>
          <button
            onClick={() => setActiveSubView('tesitura')}
            className={`text-[10px] font-bold hover:underline transition-colors cursor-pointer ${
              zenMode ? 'text-[#e5b83b] hover:text-[#f5d56b]' : 'text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400'
            }`}
          >
            Recalibrar
          </button>
        </div>
      )}

      {/* ─── 0-Lives Locked Gate or Active Tuner/Rhythm View ─── */}
      {(userStats.lives ?? 1) <= 0 ? (
        <TunerLivesLockedGate
          timeToNextLifeFormatted={timeToNextLife.formatted}
          onOpenRecoveryExam={onOpenRecoveryExam}
          onOpenStore={onOpenStore}
          zenMode={zenMode}
        />
      ) : isRhythmActive ? (
        <TunerRhythmView
          level={levelsHook.currentLevel}
          pattern={rhythmPatterns[rhythmPatternIndex] || rhythmPatterns[7]}
          bpm={80 + (rhythmPatternIndex - 7) * 10}
          onSuccess={(score) => levelsHook.handleLevelVictory(score)}
          onFail={() => {
            if (onLoseLife) {
              onLoseLife('tuner');
            }
          }}
          onExit={() => setTunerMode('libre')}
        />
      ) : (
        <>
          {/* ─── Tuner Visualizer Card ─── */}
          <TunerSphereCard
            tunerMode={tunerMode}
            selectedDifficulty={levelsHook.selectedDifficulty}
            currentLevel={levelsHook.currentLevel}
            comboCount={levelsHook.comboCount}
            showComboAnimation={levelsHook.showComboAnimation}
            activeTargetNote={activeTargetNote}
            gender={gender}
            isTuningActive={pitchHook.isTuningActive}
            detectedPitch={pitchHook.detectedPitch}
            targetFreq={activeTargetNote.frequency}
            volume={pitchHook.volume}
            tuningStatusMsg={pitchHook.tuningStatusMsg}
            isPitchMatched={pitchHook.isPitchMatched}
            ringProgress={pitchHook.ringProgress}
            sphereStyle={pitchHook.sphereStyle}
            badgeBorderColor={pitchHook.badgeBorderColor}
            statusTextColor={pitchHook.statusTextColor}
            statusIcon={pitchHook.statusIcon}
            challengeIndex={levelsHook.challengeIndex}
            challengeNotes={levelsHook.challengeNotes}
            toggleTuning={pitchHook.toggleTuning}
            onPlayReferenceNote={handlePlayReferenceNote}
            onExitLevelToLibre={() => {
              audioService.playClickSound();
              pitchHook.stopTuningMic();
              setTunerMode('libre');
            }}
            darkMode={darkMode}
            zenMode={zenMode}
          />

          {/* ─── Chromatic Piano Keyboard ─── */}
          <ChromaticKeyboard
            tunerMode={tunerMode}
            selectedNote={selectedNote}
            activeTargetNote={activeTargetNote}
            naturalNotes={naturalNotes}
            blackKeyPositions={blackKeyPositions}
            challengeNotes={levelsHook.challengeNotes}
            completedChallengeNotes={levelsHook.completedChallengeNotes}
            challengeIndex={levelsHook.challengeIndex}
            onSelectNote={handleSelectNote}
            difficulty={difficulty}
            onSelectDifficulty={(d, targetDiff) => {
              audioService.playClickSound();
              if ((userStats.lives ?? 1) <= 0) {
                if (onOpenRecoveryExam) onOpenRecoveryExam();
                return;
              }
              setDifficulty(d);
              levelsHook.setSelectedDifficulty(targetDiff);
              levelsHook.setIsLevelSelectOpen(true);
            }}
            isTuningActive={pitchHook.isTuningActive}
            onToggleTuning={pitchHook.toggleTuning}
            zenMode={zenMode}
          />

          {/* ─── Pitch Stability Chart ─── */}
          <PitchStabilityChart
            isTuningActive={pitchHook.isTuningActive}
            detectedPitch={pitchHook.detectedPitch}
            targetFrequency={activeTargetNote.frequency}
            targetNoteName={activeTargetNote.name}
            toleranceCents={pitchHook.toleranceCents}
            darkMode={darkMode}
          />
        </>
      )}

      {/* ─── Accordion: Practice Apparatus & Tools ─── */}
      <TunerToolsAccordion
        isOpen={isExtraToolsOpen}
        onToggleOpen={() => setIsExtraToolsOpen(prev => !prev)}
        onSelectTool={(tool) => setActiveSubView(tool)}
        zenMode={zenMode}
      />

      {/* ─── Precision History Section ─── */}
      <TunerHistorySection
        tunedHistory={pitchHook.tunedHistory}
        onClearHistory={pitchHook.clearHistory}
        zenMode={zenMode}
      />
    </div>
  );
};
