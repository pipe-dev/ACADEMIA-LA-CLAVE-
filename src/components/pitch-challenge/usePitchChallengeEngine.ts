'use client';

import { useState, useEffect, useRef } from 'react';
import { audioService } from '../../utils/audioService';
import { NoteInfo } from '../../utils/voicePlaybackService';
import { checkAndExpandVocalRange } from '../../utils/vocalRangeHelper';

export interface UsePitchChallengeEngineProps {
  notes: NoteInfo[];
  toleranceCents?: number;
  onSuccess: () => void;
}

export function usePitchChallengeEngine({
  notes,
  toleranceCents = 45,
  onSuccess
}: UsePitchChallengeEngineProps) {
  const [challengeIndex, setChallengeIndex] = useState<number>(0);
  const [completedChallengeNotes, setCompletedChallengeNotes] = useState<Set<number>>(new Set());

  // Real-time audio detection states
  const [isTuningActive, setIsTuningActive] = useState<boolean>(false);
  const [detectedPitch, setDetectedPitch] = useState<number | null>(null);
  const [volume, setVolume] = useState<number>(0);
  const [isPitchMatched, setIsPitchMatched] = useState<boolean>(false);
  const [tuningStatusMsg, setTuningStatusMsg] = useState<string>('Escuchando voz...');

  // Track sustained in-tune hold (~650ms to validate note cleanly without penalty bars)
  const inTuneSinceRef = useRef<number | null>(null);
  const lastStateUpdateRef = useRef<number>(0);
  const lastVibeTimeRef = useRef<number>(0);

  // Active target note
  const activeTargetNote = notes[challengeIndex] || notes[0];
  const targetFreq = activeTargetNote ? activeTargetNote.frequency : 440;
  const pitchDiff = (isTuningActive && detectedPitch && detectedPitch > 40)
    ? Math.abs(detectedPitch - targetFreq)
    : null;

  // Refs for real-time microphone callback
  const activeTargetNoteRef = useRef<NoteInfo>(activeTargetNote);
  const toleranceCentsRef = useRef<number>(toleranceCents);
  const notesRef = useRef<NoteInfo[]>(notes);
  const challengeIndexRef = useRef<number>(challengeIndex);
  const onSuccessRef = useRef<() => void>(onSuccess);

  useEffect(() => { activeTargetNoteRef.current = activeTargetNote; }, [activeTargetNote]);
  useEffect(() => { toleranceCentsRef.current = toleranceCents; }, [toleranceCents]);
  useEffect(() => { notesRef.current = notes; }, [notes]);
  useEffect(() => { challengeIndexRef.current = challengeIndex; }, [challengeIndex]);
  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);

  // Real-time microphone listening loop
  const startMic = async () => {
    const success = await audioService.startMicrophone((pitchHz, vol) => {
      const nowTime = Date.now();
      if (nowTime - lastStateUpdateRef.current < 35) return;
      lastStateUpdateRef.current = nowTime;

      setVolume(vol);
      const currTarget = activeTargetNoteRef.current;
      if (!currTarget) return;

      if (pitchHz > 50 && pitchHz < 1000) {
        setDetectedPitch(Math.round(pitchHz));
        const cents = 1200 * Math.log2(pitchHz / currTarget.frequency);
        const isMatched = Math.abs(cents) <= toleranceCentsRef.current;
        setIsPitchMatched(isMatched);

        if (isMatched) {
          setTuningStatusMsg('¡AFINACIÓN PERFECTA!');
          if (nowTime - lastVibeTimeRef.current > 1200) {
            lastVibeTimeRef.current = nowTime;
            audioService.vibrateSuccess();
          }

          if (!inTuneSinceRef.current) {
            inTuneSinceRef.current = nowTime;
          } else if (nowTime - inTuneSinceRef.current >= 650) {
            inTuneSinceRef.current = null;
            // Note completed!
            audioService.playSoftDing();
            audioService.vibrateSuccess();

            if (currTarget?.name) {
              checkAndExpandVocalRange(pitchHz, currTarget.name, 'academia');
            }

            const currIdx = challengeIndexRef.current;
            const allNotes = notesRef.current;

            setCompletedChallengeNotes(prev => new Set(prev).add(currIdx));

            if (currIdx + 1 < allNotes.length) {
              setChallengeIndex(currIdx + 1);
            } else {
              // Level victory!
              audioService.playSuccessBellSound();
              audioService.stopMicrophone();
              setIsTuningActive(false);
              setTimeout(() => {
                onSuccessRef.current();
              }, 450);
            }
          }
        } else {
          inTuneSinceRef.current = null;
          if (pitchHz < currTarget.frequency) {
            setTuningStatusMsg('Muy grueso ↑ Sube el tono');
          } else {
            setTuningStatusMsg('Muy delgado ↓ Baja el tono');
          }
        }
      } else {
        inTuneSinceRef.current = null;
        setDetectedPitch(null);
        setIsPitchMatched(false);
        setTuningStatusMsg('Escuchando voz...');
      }
    });

    if (success) {
      setIsTuningActive(true);
    }
  };

  const toggleTuning = () => {
    audioService.playClickSound();
    if (isTuningActive) {
      audioService.stopMicrophone();
      setIsTuningActive(false);
      setDetectedPitch(null);
      setIsPitchMatched(false);
      setTuningStatusMsg('Micrófono en pausa');
    } else {
      startMic();
    }
  };

  // Auto-start microphone on mount and stop on unmount
  useEffect(() => {
    startMic();
    return () => {
      audioService.stopMicrophone();
    };
  }, []);

  return {
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
    toggleTuning,
    startMic
  };
}
