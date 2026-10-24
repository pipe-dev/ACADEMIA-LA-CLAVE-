'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { VoiceEvaluationResult } from '../types';
import { audioService } from '../utils/audioService';
import {
  getComfortableChromaticNotes,
  generateUserNotePool,
  getChromaticNoteByMidi,
  voicePlayback,
  ChromaticNoteButtonInfo,
} from '../utils/voicePlaybackService';
import { Activity, History, ArrowLeft } from 'lucide-react';
import { emitStreakEligibleAction } from '../utils/streakPrompt';
import { checkAndExpandVocalRange } from '../utils/vocalRangeHelper';
import { calculateCentsOff } from '../utils/pitchUtils';
import { VoiceEvalModalProps, PitchSample, TunerHistoryItem, VocalRangeSavedData } from './voice-eval/voiceEvalTypes';
import { computeVoiceEvaluation } from './voice-eval/voiceEvalScoring';
import { VoiceEvalPianoSelector } from './voice-eval/VoiceEvalPianoSelector';
import { VoiceEvalRecordingState } from './voice-eval/VoiceEvalRecordingState';
import { VoiceEvalResultsView } from './voice-eval/VoiceEvalResultsView';

const VOCAL_PRESETS: Record<string, VocalRangeSavedData> = {
  Bajo: { classification: 'Bajo', gender: 'masculino', noteMin: 'Mi2', noteMax: 'Mi4', minHz: 82.41, maxHz: 329.63 },
  Barítono: { classification: 'Barítono', gender: 'masculino', noteMin: 'La2', noteMax: 'Sol4', minHz: 110.0, maxHz: 392.0 },
  Tenor: { classification: 'Tenor', gender: 'masculino', noteMin: 'Do3', noteMax: 'La4', minHz: 130.81, maxHz: 440.0 },
  Alto: { classification: 'Contralto', gender: 'femenino', noteMin: 'Fa3', noteMax: 'Fa5', minHz: 174.61, maxHz: 698.46 },
  Contralto: { classification: 'Contralto', gender: 'femenino', noteMin: 'Fa3', noteMax: 'Fa5', minHz: 174.61, maxHz: 698.46 },
  Mezzosoprano: { classification: 'Mezzosoprano', gender: 'femenino', noteMin: 'La3', noteMax: 'La5', minHz: 220.0, maxHz: 880.0 },
  Soprano: { classification: 'Soprano', gender: 'femenino', noteMin: 'Do4', noteMax: 'Do6', minHz: 261.63, maxHz: 1046.5 },
};

function resolveClassification(stats?: any): string {
  if (stats?.vocalRange) return stats.vocalRange;
  if (stats?.vocalRangeData?.classification) return stats.vocalRangeData.classification;
  if (typeof window !== 'undefined') {
    try {
      const c = localStorage.getItem('laclave_vocal_range_classification');
      if (c) return c;
      const s = localStorage.getItem('laclave_vocal_range_saved');
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed?.classification) return parsed.classification;
      }
      const u = localStorage.getItem('laclave_user_stats_v6');
      if (u) {
        const parsed = JSON.parse(u);
        if (parsed?.vocalRange) return parsed.vocalRange;
        if (parsed?.vocalRangeData?.classification) return parsed.vocalRangeData.classification;
      }
    } catch {}
  }
  return 'Tenor';
}

function resolveGender(classification: string, stats?: any): 'masculino' | 'femenino' {
  const lower = (classification || '').toLowerCase();
  if (lower.includes('tenor') || lower.includes('barítono') || lower.includes('baritono') || lower.includes('bajo')) {
    return 'masculino';
  }
  if (lower.includes('soprano') || lower.includes('mezzosoprano') || lower.includes('mezzo') || lower.includes('contralto') || lower.includes('alto')) {
    return 'femenino';
  }
  if (stats?.vocalRangeData?.gender === 'masculino' || stats?.vocalRangeData?.gender === 'femenino') {
    return stats.vocalRangeData.gender;
  }
  if (typeof window !== 'undefined') {
    try {
      const g = localStorage.getItem('laclave_voice_gender');
      if (g === 'masculino' || g === 'femenino') return g;
    } catch {}
  }
  return 'masculino';
}

function resolveRangeData(classification: string, gender: 'masculino' | 'femenino', stats?: any): VocalRangeSavedData {
  if (stats?.vocalRangeData && stats.vocalRangeData.noteMin && stats.vocalRangeData.noteMax) {
    return {
      ...stats.vocalRangeData,
      classification: stats.vocalRangeData.classification || classification,
      gender: stats.vocalRangeData.gender || gender,
    };
  }
  if (typeof window !== 'undefined') {
    try {
      const s = localStorage.getItem('laclave_vocal_range_saved');
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed?.noteMin && parsed?.noteMax) {
          return {
            ...parsed,
            classification: parsed.classification || classification,
            gender: parsed.gender || gender,
          };
        }
      }
    } catch {}
  }
  const preset = VOCAL_PRESETS[classification] || VOCAL_PRESETS[gender === 'masculino' ? 'Tenor' : 'Mezzosoprano'];
  return { ...preset };
}

export const VoiceEvalModal: React.FC<VoiceEvalModalProps> = ({
  isOpen = true,
  onClose,
  isEmbeddedView = false,
  userStats,
}) => {
  const initialClassif = resolveClassification(userStats);
  const initialGender = resolveGender(initialClassif, userStats);
  const initialRange = resolveRangeData(initialClassif, initialGender, userStats);

  // Vocal range + gender guardados en la app. Controlan qué voces suenan y qué teclas se activan.
  const [effectiveRangeData, setEffectiveRangeData] = useState<VocalRangeSavedData>(initialRange);
  const [gender, setGender] = useState<'masculino' | 'femenino'>(initialGender);

  // Re-lee el rango calibrado cada vez que se abre el modal o cambian los stats para estar siempre sincronizado
  useEffect(() => {
    if (!isOpen && !isEmbeddedView) return;
    const classif = resolveClassification(userStats);
    const resolvedGen = resolveGender(classif, userStats);
    const resolvedRange = resolveRangeData(classif, resolvedGen, userStats);
    setGender(resolvedGen);
    setEffectiveRangeData(resolvedRange);
  }, [isOpen, isEmbeddedView, userStats]);

  // Precarga las grabaciones de voz real de la carpeta /public/sounds para el género del usuario
  useEffect(() => {
    if (isOpen || isEmbeddedView) voicePlayback.preloadNotes(gender);
  }, [gender, isOpen, isEmbeddedView]);

  // Pool completo de notas dentro del rango vocal detectado del usuario
  const userNotePool = useMemo(
    () => generateUserNotePool(effectiveRangeData, gender),
    [effectiveRangeData, gender]
  );

  const chromaticData = useMemo(
    () => getComfortableChromaticNotes(effectiveRangeData, gender),
    [effectiveRangeData, gender]
  );
  const { allNotes, naturalNotes, sharpNotes } = chromaticData;

  // Una nota solo suena con voz real si está dentro del rango vocal registrado
  const isNoteInRange = (note: ChromaticNoteButtonInfo): boolean =>
    userNotePool.some((p) => p.midi === note.midi);

  const blackKeyPositions = useMemo(
    () => [
      { note: sharpNotes[0], left: '14.2857%' }, // DO#
      { note: sharpNotes[1], left: '28.5714%' }, // RE#
      { note: sharpNotes[2], left: '57.1428%' }, // FA#
      { note: sharpNotes[3], left: '71.4285%' }, // SOL#
      { note: sharpNotes[4], left: '85.7142%' }, // LA#
    ],
    [sharpNotes]
  );

  // Nota objetivo por defecto: LA o primera nota cómoda alcanzable dentro de su rango
  const [selectedTargetNote, setSelectedTargetNote] = useState<ChromaticNoteButtonInfo>(() => {
    const chrom = getComfortableChromaticNotes(initialRange, initialGender);
    const pool = generateUserNotePool(initialRange, initialGender);
    const pick = (n: ChromaticNoteButtonInfo) => pool.some((p) => p.midi === n.midi);
    return (
      chrom.naturalNotes.find((n) => n.semitone === 9 && pick(n)) ||
      chrom.naturalNotes.find(pick) ||
      chrom.naturalNotes[0] ||
      chrom.allNotes[0]
    );
  });

  // Si el rango cambió y la nota seleccionada ya no se alcanza, se re-ajusta solo
  useEffect(() => {
    if (!isNoteInRange(selectedTargetNote)) {
      const laInRange = naturalNotes.find((n) => n.semitone === 9 && isNoteInRange(n));
      setSelectedTargetNote(
        laInRange || naturalNotes.find(isNoteInRange) || naturalNotes[0] || allNotes[0]
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userNotePool, naturalNotes, allNotes]);

  // Mini piano de arriba: notas Do...Mi (con sostenidos) una octava por encima del teclado principal.
  const miniPianoNotes = useMemo(() => {
    const cMain = naturalNotes.find((n) => n.semitone === 0);
    const nextOctave = (cMain?.octave ?? (gender === 'masculino' ? 3 : 4)) + 1;
    return [0, 1, 2, 3, 4].map((semitone) => getChromaticNoteByMidi((nextOctave + 1) * 12 + semitone, gender));
  }, [naturalNotes, gender]);

  const miniPianoWhiteKeys = useMemo(
    () => miniPianoNotes.filter((n) => !n.isSharp),
    [miniPianoNotes]
  );

  const miniBlackKeyPositions = useMemo(
    () => [
      { note: miniPianoNotes[1], left: '33.33%' }, // DO#
      { note: miniPianoNotes[3], left: '66.67%' }, // RE#
    ],
    [miniPianoNotes]
  );

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(5);
  const [livePitch, setLivePitch] = useState<number | null>(null);
  const [_liveVolume, setLiveVolume] = useState<number>(0);
  const [result, setResult] = useState<VoiceEvaluationResult | null>(null);

  // Tuner History Context state
  const [tunerHistory, setTunerHistory] = useState<TunerHistoryItem[]>([]);
  const pitchSamplesRef = useRef<PitchSample[]>([]);

  useEffect(() => {
    audioService.playOpenSound();

    try {
      const saved = localStorage.getItem('laclave_tuned_history');
      if (saved) {
        const parsed: TunerHistoryItem[] = JSON.parse(saved);
        setTunerHistory(parsed);
      }
    } catch (e) {
      console.warn('Could not read tuner history for voice evaluation:', e);
    }
  }, []);

  const handleClose = () => {
    audioService.playCloseSound();
    audioService.stopMicrophone();
    onClose();
  };

  const startTest = async () => {
    audioService.playClickSound();
    pitchSamplesRef.current = [];
    setLivePitch(null);
    setLiveVolume(0);

    const ok = await audioService.startMicrophone((pitchHz, vol) => {
      setLivePitch(pitchHz);
      setLiveVolume(vol);
      if (pitchHz > 60 && vol > 0.008) {
        pitchSamplesRef.current.push({
          pitchHz,
          volume: vol,
          timestamp: Date.now(),
        });
      }
    });

    if (!ok) {
      alert('Se requiere acceso al micrófono para evaluar tu voz.');
      return;
    }

    setIsRecording(true);
    setRecordingSeconds(5);
    setResult(null);
  };

  // Compute tuner history summary stats
  const totalTuned = tunerHistory.length;
  const avgDiffHz =
    totalTuned > 0
      ? tunerHistory.reduce((acc, item) => acc + item.diffHz, 0) / totalTuned
      : 0;

  const biasTrend: 'agudo' | 'grave' | 'equilibrado' =
    avgDiffHz > 0.4 ? 'agudo' : avgDiffHz < -0.4 ? 'grave' : 'equilibrado';

  // Find most practiced note in tuner history
  const noteCounts: Record<string, number> = {};
  tunerHistory.forEach((item) => {
    noteCounts[item.noteName] = (noteCounts[item.noteName] || 0) + 1;
  });

  let mostPracticedNote = 'LA';
  let maxCount = 0;
  Object.entries(noteCounts).forEach(([note, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostPracticedNote = note;
    }
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev <= 1) {
            audioService.stopMicrophone();
            setIsRecording(false);
            processEvaluationResult();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const processEvaluationResult = () => {
    const evalResult = computeVoiceEvaluation({
      samples: pitchSamplesRef.current,
      targetFreq: selectedTargetNote.frequency,
      selectedTargetNote,
      totalTuned,
      avgDiffHz,
      biasTrend,
      mostPracticedNote,
    });

    if (!evalResult.insufficientAudio) {
      emitStreakEligibleAction();
      audioService.playFrequency(587.33, 0.4);

      if (evalResult.pitchAccuracy >= 75) {
        const vocalPitches = pitchSamplesRef.current
          .filter((s) => s.pitchHz >= 50 && s.pitchHz <= 1200 && s.volume >= 0.012)
          .map((s) => s.pitchHz)
          .sort((a, b) => a - b);
        if (vocalPitches.length >= 10) {
          const medianSungHz = vocalPitches[Math.floor(vocalPitches.length / 2)];
          const centsDiff = Math.abs(calculateCentsOff(medianSungHz, selectedTargetNote.frequency));
          if (centsDiff <= 35) {
            checkAndExpandVocalRange(medianSungHz, selectedTargetNote.name, 'afinador');
          }
        }
      }
    }

    setResult(evalResult);
  };

  if (!isOpen && !isEmbeddedView) return null;

  const innerContent = (
    <div className="bg-white dark:bg-[#102034] rounded-3xl p-5 sm:p-6 w-full space-y-5 shadow-md relative border border-slate-100 dark:border-[#1b2b3f] transition-colors">
      {/* Navigation Header */}
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => {
            audioService.stopMicrophone();
            handleClose();
          }}
          className="py-1.5 px-2.5 sm:py-2 sm:px-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 transition-all cursor-pointer flex items-center gap-1.5 font-heading font-bold text-[11px] sm:text-xs shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 dark:text-sky-400" />
          <span className="hidden sm:inline">Volver a Gimnasio Vocal</span>
          <span className="sm:hidden">Volver</span>
        </button>

        <span className="text-[9px] sm:text-[10px] font-extrabold bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full uppercase tracking-wider shrink-0 text-right">
          Aparato IA Diagnóstico
        </span>
      </div>

      {/* Title Header */}
      <div className="flex items-center gap-3">
        <div className="organic-shape w-12 h-12 bg-[#eff4ff] dark:bg-slate-800 text-[#4648d4] dark:text-[#c0c1ff] flex items-center justify-center shadow-xs shrink-0">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold text-[#4648d4] dark:text-[#c0c1ff] uppercase tracking-wider">
              Diagnóstico Vocal Inteligente
            </span>
            {totalTuned > 0 && (
              <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                <History className="w-3 h-3" /> {totalTuned} en Afinador
              </span>
            )}
          </div>
          <h3 className="font-heading font-black text-xl text-[#0b1c30] dark:text-[#d3e4fe]">
            Evaluar mi Precisión Vocal
          </h3>
        </div>
      </div>

      {/* Pre-recording View */}
      {!result && !isRecording && (
        <VoiceEvalPianoSelector
          naturalNotes={naturalNotes}
          blackKeyPositions={blackKeyPositions}
          selectedTargetNote={selectedTargetNote}
          onSelectNote={setSelectedTargetNote}
          isNoteInRange={isNoteInRange}
          effectiveRangeData={effectiveRangeData}
          gender={gender}
          miniPianoWhiteKeys={miniPianoWhiteKeys}
          miniBlackKeyPositions={miniBlackKeyPositions}
          totalTuned={totalTuned}
          biasTrend={biasTrend}
          mostPracticedNote={mostPracticedNote}
          onStartTest={startTest}
        />
      )}

      {/* Active Recording State */}
      {isRecording && (
        <VoiceEvalRecordingState
          recordingSeconds={recordingSeconds}
          selectedTargetNoteName={selectedTargetNote.name}
          livePitch={livePitch}
        />
      )}

      {/* Evaluation Results */}
      {result && (
        <VoiceEvalResultsView
          result={result}
          selectedTargetNoteName={selectedTargetNote.name}
          onRetry={startTest}
          onClose={handleClose}
        />
      )}
    </div>
  );

  if (isEmbeddedView) {
    return <div className="w-full animate-fadeIn">{innerContent}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn cursor-pointer" onClick={onClose}>
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto cursor-default" onClick={(e) => e.stopPropagation()}>
        {innerContent}
      </div>
    </div>
  );
};

export default VoiceEvalModal;
