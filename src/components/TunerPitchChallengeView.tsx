'use client';

import React from 'react';
import { TunerPitchChallengeViewProps } from './pitch-challenge/pitchChallengeTypes';
import { usePitchChallengeEngine } from './pitch-challenge/usePitchChallengeEngine';
import { PitchChallengeSphereCard } from './pitch-challenge/PitchChallengeSphereCard';
import { PitchChallengeKeyboard } from './pitch-challenge/PitchChallengeKeyboard';

export { type TunerPitchChallengeViewProps };

export const TunerPitchChallengeView: React.FC<TunerPitchChallengeViewProps> = ({
  difficultyLabel,
  levelNumber,
  subtitle,
  notes,
  toleranceCents = 45,
  gender = 'femenino',
  vocalRangeData,
  zenMode = false,
  darkMode = false,
  onSuccess
}) => {
  const {
    challengeIndex,
    completedChallengeNotes,
    isTuningActive,
    detectedPitch,
    volume,
    isPitchMatched,
    tuningStatusMsg,
    activeTargetNote,
    targetFreq,
    pitchDiff,
    toggleTuning
  } = usePitchChallengeEngine({
    notes,
    toleranceCents,
    onSuccess
  });

  return (
    <div className="space-y-3 sm:space-y-3.5">
      <PitchChallengeSphereCard
        difficultyLabel={difficultyLabel}
        levelNumber={levelNumber}
        subtitle={subtitle}
        notes={notes}
        challengeIndex={challengeIndex}
        isTuningActive={isTuningActive}
        detectedPitch={detectedPitch}
        volume={volume}
        isPitchMatched={isPitchMatched}
        tuningStatusMsg={tuningStatusMsg}
        activeTargetNote={activeTargetNote}
        targetFreq={targetFreq}
        pitchDiff={pitchDiff}
        gender={gender}
        zenMode={zenMode}
        darkMode={darkMode}
        onToggleTuning={toggleTuning}
      />

      <PitchChallengeKeyboard
        notes={notes}
        challengeIndex={challengeIndex}
        completedChallengeNotes={completedChallengeNotes}
        activeTargetNote={activeTargetNote}
        vocalRangeData={vocalRangeData}
        gender={gender}
        zenMode={zenMode}
        darkMode={darkMode}
      />
    </div>
  );
};

export default TunerPitchChallengeView;
