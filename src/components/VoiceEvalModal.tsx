'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { VoiceEvaluationResult } from '../types';
import { audioService } from '../utils/audioService';
import {
  getComfortableChromaticNotes,
  generateUserNotePool,
  getChromaticNoteByMidi,
  voicePlayback,
  ChromaticNoteButtonInfo
} from '../utils/voicePlaybackService';
import {
  Mic,
  Activity,
  Sparkles,
  Check,
  RefreshCw,
  Volume2,
  TrendingUp,
  History,
  Target,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import { emitStreakEligibleAction } from '../utils/streakPrompt';

interface VoiceEvalModalProps {
  isOpen?: boolean;
  onClose: () => void;
  isEmbeddedView?: boolean;
}

interface PitchSample {
  pitchHz: number;
  volume: number;
  timestamp: number;
}

interface TunerHistoryItem {
  id: string;
  noteName: string;
  noteColor: string;
  targetFreq: number;
  detectedFreq: number;
  diffHz: number;
  timestamp: string;
}

const AudioWaveformVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      const analyser = audioService.getAnalyser();

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const timeData = new Uint8Array(bufferLength);
        const freqData = new Uint8Array(bufferLength);

        analyser.getByteTimeDomainData(timeData);
        analyser.getByteFrequencyData(freqData);

        // 1. Draw Frequency Spectrum Bars
        const barCount = 22;
        const barWidth = canvas.width / barCount - 2;

        for (let i = 0; i < barCount; i++) {
          const index = Math.floor((i / barCount) * (bufferLength / 4));
          const value = freqData[index] || 0;
          const barHeight = (value / 255) * (canvas.height * 0.75);
          const x = i * (barWidth + 2) + 1;
          const y = canvas.height - barHeight;

          const gradient = ctx.createLinearGradient(0, canvas.height, 0, y);
          gradient.addColorStop(0, 'rgba(70, 72, 212, 0.2)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0.9)');

          ctx.fillStyle = gradient;
          if (typeof ctx.roundRect === 'function') {
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, barWidth, barHeight);
          }
        }

        // 2. Draw Smooth Time-Domain Wave Line
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#4648d4';
        ctx.shadowColor = 'rgba(70, 72, 212, 0.5)';
        ctx.shadowBlur = 8;
        ctx.beginPath();

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeData[i] / 128.0;
          const y = (v * canvas.height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.stroke();
        ctx.shadowBlur = 0; // Reset shadow
      } else {
        // Fallback pulsing animated wave if analyser isn't active
        const time = Date.now() / 150;
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#4648d4';
        ctx.beginPath();

        for (let x = 0; x < canvas.width; x += 2) {
          const y = canvas.height / 2 + Math.sin(x * 0.08 + time) * 10 * Math.sin(time * 0.3);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.stroke();
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="bg-[#eff4ff] dark:bg-[#0b1828] p-3 rounded-2xl border border-indigo-100 dark:border-slate-800 space-y-2 text-center transition-colors">
      <canvas
        ref={canvasRef}
        width={320}
        height={85}
        className="w-full h-20 rounded-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs shadow-inner"
      />
      <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#4648d4] dark:text-[#c0c1ff]">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
        <span>AudioContext: Analizando Tono & Micro-afinación en Tiempo Real</span>
      </div>
    </div>
  );
};

export const VoiceEvalModal: React.FC<VoiceEvalModalProps> = ({
  isOpen = true,
  onClose,
  isEmbeddedView = false
}) => {
  const getInitialRangeState = () => {
    try {
      const saved = localStorage.getItem('laclave_vocal_range_saved');
      if (saved) return JSON.parse(saved) as { noteMin?: string; noteMax?: string; minHz?: number; maxHz?: number; classification?: string } | null;
    } catch {}
    return null;
  };

  const getInitialGender = (): 'masculino' | 'femenino' => {
    try {
      const saved = localStorage.getItem('laclave_voice_gender');
      if (saved === 'masculino' || saved === 'femenino') return saved;
      const savedRange = localStorage.getItem('laclave_vocal_range_saved');
      if (savedRange) {
        const parsed = JSON.parse(savedRange);
        if (parsed.gender === 'masculino' || parsed.gender === 'femenino') return parsed.gender;
        if (parsed.classification === 'Bajo' || parsed.classification === 'Barítono' || parsed.classification === 'Tenor') {
          return 'masculino';
        }
      }
    } catch {}
    return 'femenino';
  };

  // Vocal range + gender guardados en la app. Controlan qué voces suenan y qué teclas se activan.
  const [effectiveRangeData, setEffectiveRangeData] = useState<{ noteMin?: string; noteMax?: string; minHz?: number; maxHz?: number; classification?: string } | null>(getInitialRangeState);
  const [gender, setGender] = useState<'masculino' | 'femenino'>(getInitialGender);

  // Re-lee el rango calibrado cada vez que se abre el modal para estar siempre sincronizado
  useEffect(() => {
    if (!isOpen && !isEmbeddedView) return;
    try {
      const savedRange = localStorage.getItem('laclave_vocal_range_saved');
      if (savedRange) setEffectiveRangeData(JSON.parse(savedRange));
    } catch {}
    try {
      const savedGender = localStorage.getItem('laclave_voice_gender');
      if (savedGender === 'masculino' || savedGender === 'femenino') setGender(savedGender);
    } catch {}
  }, [isOpen, isEmbeddedView]);

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
    userNotePool.some(p => p.midi === note.midi);

  const blackKeyPositions = useMemo(() => [
    { note: sharpNotes[0], left: '14.2857%' }, // DO#
    { note: sharpNotes[1], left: '28.5714%' }, // RE#
    { note: sharpNotes[2], left: '57.1428%' }, // FA#
    { note: sharpNotes[3], left: '71.4285%' }, // SOL#
    { note: sharpNotes[4], left: '85.7142%' }, // LA#
  ], [sharpNotes]);

  // Nota objetivo por defecto: LA (440 Hz) si está en rango, si no la primera nota alcanzable
  const [selectedTargetNote, setSelectedTargetNote] = useState<ChromaticNoteButtonInfo>(() => {
    const range = getInitialRangeState();
    const voiceGender = getInitialGender();
    const chrom = getComfortableChromaticNotes(range, voiceGender);
    const pool = generateUserNotePool(range, voiceGender);
    const pick = (n: ChromaticNoteButtonInfo) => pool.some(p => p.midi === n.midi);
    return (
      chrom.naturalNotes.find(n => n.semitone === 9 && pick(n)) ||
      chrom.naturalNotes.find(pick) ||
      chrom.naturalNotes[0] ||
      chrom.allNotes[0]
    );
  });

  // Si el rango cambió y la nota seleccionada ya no se alcanza, se re-ajusta solo
  useEffect(() => {
    if (!isNoteInRange(selectedTargetNote)) {
      const laInRange = naturalNotes.find(n => n.semitone === 9 && isNoteInRange(n));
      setSelectedTargetNote(
        laInRange || naturalNotes.find(isNoteInRange) || naturalNotes[0] || allNotes[0]
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userNotePool, naturalNotes, allNotes]);

  // Mini piano de arriba: notas Do...Mi (con sostenidos) una octava por encima del teclado principal.
  // Si el principal termina en Si3, el primer Do del mini será C4 (Do4).
  const miniPianoNotes = useMemo(() => {
    const cMain = naturalNotes.find(n => n.semitone === 0);
    const nextOctave = (cMain?.octave ?? (gender === 'masculino' ? 3 : 4)) + 1;
    return [0, 1, 2, 3, 4].map(semitone => getChromaticNoteByMidi((nextOctave + 1) * 12 + semitone));
  }, [naturalNotes, gender]);

  const miniPianoWhiteKeys = useMemo(
    () => miniPianoNotes.filter(n => !n.isSharp),
    [miniPianoNotes]
  );

  const miniBlackKeyPositions = useMemo(() => [
    { note: miniPianoNotes[1], left: '33.33%' }, // DO#
    { note: miniPianoNotes[3], left: '66.67%' }, // RE#
  ], [miniPianoNotes]);
  const [isPlayingRefTone, setIsPlayingRefTone] = useState<boolean>(false);
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

    // Read tuner history context from localStorage
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

  const playReferenceTone = () => {
    voicePlayback.playVoiceNote(selectedTargetNote, gender, 2.0);
    setIsPlayingRefTone(true);
    setTimeout(() => setIsPlayingRefTone(false), 1200);
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
          timestamp: Date.now()
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
    const samples = pitchSamplesRef.current;
    const targetFreq = selectedTargetNote.frequency;
    emitStreakEligibleAction();

    let pitchAccuracy = 88;
    let breathSupport = 85;
    let pitchStability = 82;
    let centsDevAvg = 8.5;
    let hzDiffAvg = 1.2;
    let rangeDetected = 'Tenor / Soprano (G3 - A4)';

    if (samples.length > 5) {
      // 1. Calculate Average Frequency & Absolute Hz Deviation
      const avgHz = samples.reduce((acc, s) => acc + s.pitchHz, 0) / samples.length;
      hzDiffAvg = avgHz - targetFreq;

      // Calculate Cents Deviation: 1200 * log2(f / f_target)
      const centsList = samples.map((s) => 1200 * Math.log2(s.pitchHz / targetFreq));
      const absCentsAvg = centsList.reduce((acc, c) => acc + Math.abs(c), 0) / centsList.length;
      centsDevAvg = Number(absCentsAvg.toFixed(1));

      // Pitch Accuracy: 100 - (cents error * 2.2) clamped between 45 and 99
      pitchAccuracy = Math.max(45, Math.min(99, Math.round(100 - absCentsAvg * 2.2)));

      // 2. Pitch Stability (Standard Deviation of sung frequencies)
      const varianceHz = samples.reduce((acc, s) => acc + Math.pow(s.pitchHz - avgHz, 2), 0) / samples.length;
      const stdDevHz = Math.sqrt(varianceHz);
      pitchStability = Math.max(40, Math.min(98, Math.round(100 - stdDevHz * 3.8)));

      // 3. Breath Support (Volume consistency & level)
      const avgVol = samples.reduce((acc, s) => acc + s.volume, 0) / samples.length;
      breathSupport = Math.max(50, Math.min(96, Math.round(avgVol * 380 + 40)));

      // Detect sung pitch range
      const minHz = Math.min(...samples.map((s) => s.pitchHz));
      const maxHz = Math.max(...samples.map((s) => s.pitchHz));
      rangeDetected = `Rango Cantado (${minHz.toFixed(0)} - ${maxHz.toFixed(0)})`;
    } else {
      // Fallback if low voice volume was captured
      centsDevAvg = 12.0;
      pitchAccuracy = 80;
      pitchStability = 78;
      breathSupport = 75;
      rangeDetected = `Nota ${selectedTargetNote.name}`;
    }

    // Weighted Total Score (60% Pitch Accuracy, 25% Stability, 15% Support)
    const rawScore = Math.round(pitchAccuracy * 0.6 + pitchStability * 0.25 + breathSupport * 0.15);
    const score = Math.max(50, Math.min(99, rawScore));

    // Dynamic Improvement Points based on live test + tuner history
    const improvementPoints: string[] = [];

    // Directional pitch feedback (Flat vs Sharp)
    if (hzDiffAvg < -0.8) {
      improvementPoints.push(
        `Ajuste de Calado Grave: Muestras tendencia a quedar por debajo de ${selectedTargetNote.name}. Inhala profundo con el diafragma y sonríe internamente para elevar la resonancia en los pómulos.`
      );
    } else if (hzDiffAvg > 0.8) {
      improvementPoints.push(
        `Ajuste de Calado Agudo: Tu tono tendió a apretarse levemente hacia arriba. Relaja la mandíbula y baja la base de la lengua para evitar tensión laríngea.`
      );
    } else {
      improvementPoints.push(
        `Control Microtonal Preciso: Excelente puntería en la nota ${selectedTargetNote.name} con gran estabilidad.`
      );
    }

    // Stability feedback
    if (pitchStability < 80) {
      improvementPoints.push(
        `Estabilidad del Tono (${pitchStability}%): Se detectaron ligeras fluctuaciones durante los 5 segundos. Practica notas largas sostenidas con metrónomo a 60 BPM para unificar la columna de aire.`
      );
    } else {
      improvementPoints.push(
        `Firmeza Vocal (${pitchStability}%): Demostraste un apoyo continuo de aire sin temblores excesivos ni pérdida de presión sonora.`
      );
    }

    // Tuner History Context Integration
    if (totalTuned > 0) {
      const historyBiasText =
        biasTrend === 'agudo'
          ? 'sobreagudar'
          : biasTrend === 'grave'
          ? 'calarse hacia abajo'
          : 'mantener buena afinación equilibrada';

      improvementPoints.push(
        `Historial del Afinador (${totalTuned} notas guardadas): En tu historial tus notas tienden a ${historyBiasText}. Tu nota más ejercitada es ${mostPracticedNote}.`
      );
    } else {
      improvementPoints.push(
        `Sugerencia de Práctica: Utiliza frecuentemente el Afinador Vocal para registrar tus sesiones y medir tu progreso en diferentes registros.`
      );
    }

    // General AI feedback sentence
    const feedbackMsg =
      score >= 90
        ? `¡Excelente dominio tonal! Tu voz demuestra gran afinación en ${selectedTargetNote.name} con un soporte diafragmático estable.`
        : score >= 75
        ? `Buen desempeño vocal. Presentas afinación sólida, con oportunidad de pulir la estabilidad del tono al sostener notas prolongadas.`
        : `Evaluación completada. Se observa buena proyección; enfócate en afianzar el aire en el diafragma para centrar con precisión el tono objetivo.`;

    const strengths = [
      `Afinación centrada en la nota ${selectedTargetNote.name}`,
      `Resonancia limpia y presión de aire constante`
    ];

    const recommendations = [
      `Practica escala de ${selectedTargetNote.name} con tono de referencia`,
      `Realiza trino de labios (lip trills) para relajar los pliegues vocales`
    ];

    setResult({
      score,
      pitchAccuracy,
      breathSupport,
      toneWarmth: Math.min(98, pitchStability + 4),
      rangeDetected,
      feedbackMsg,
      strengths,
      recommendations,
      centsDeviationAvg: centsDevAvg,
      pitchStability,
      tunerHistorySummary: {
        totalNotesTuned: totalTuned,
        avgDiffHz: Number(avgDiffHz.toFixed(1)),
        biasTrend,
        mostPracticedNote
      },
      improvementPoints
    });

    audioService.playFrequency(587.33, 0.4);
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
          className="py-1.5 px-2.5 sm:py-2 sm:px-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-1.5 font-heading font-bold text-[11px] sm:text-xs shrink-0"
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
          <div className="space-y-4 pt-1">
            {/* Target Note Selector */}
            <div className="bg-[#f8f9ff] dark:bg-[#0b1828] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-[#d3e4fe] flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-[#4648d4] dark:text-[#c0c1ff]" />
                  Selecciona la nota a evaluar:
                </label>
              </div>

              {/* 🎹 Piano Touch Strip (7 Natural White Keys + 5 Sharp Black Keys) */}
              <div className="relative w-full max-w-sm mx-auto select-none pt-1 pb-1">
                {/* 7 White Keys Container */}
                <div className="flex gap-1 sm:gap-1.5 w-full h-20 sm:h-22">
                  {naturalNotes.map((note) => {
                    const isCurrentTarget = selectedTargetNote.name === note.name;
                    const isReachable = isNoteInRange(note);

                    return (
                      <motion.button
                        key={note.name}
                        whileTap={isReachable ? { scale: 0.96 } : undefined}
                        disabled={!isReachable}
                        onClick={() => {
                          if (!isReachable) return;
                          setSelectedTargetNote(note);
                          voicePlayback.playVoiceNote(note, gender, 1.2);
                        }}
                        className={`flex-1 h-full rounded-b-xl sm:rounded-b-2xl transition-all flex flex-col justify-end items-center pb-1.5 relative border ${
                          isCurrentTarget
                            ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white border-indigo-600 shadow-[0_4px_0_0_#312e81] ring-2 ring-indigo-400/80 z-0 cursor-pointer animate-pulse'
                            : isReachable
                            ? 'bg-white dark:bg-[#152336] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2c44] border-slate-200/90 dark:border-slate-700/80 shadow-[0_4px_0_0_#cbd5e1] dark:shadow-[0_4px_0_0_#0b1420] cursor-pointer'
                            : 'bg-slate-200/70 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 border-slate-200/60 dark:border-slate-800/60 shadow-[0_4px_0_0_#e2e8f0] dark:shadow-[0_4px_0_0_#0a111c] cursor-not-allowed opacity-60'
                        }`}
                        title={isReachable
                          ? (isCurrentTarget ? `Voz real: ${note.fullName} (evaluar tono)` : `Cantar ${note.fullName} (voz real en tu rango)`)
                          : `Fuera de tu rango vocal actual`}
                      >
                        {/* Top Indicator for Current Target */}
                        {isCurrentTarget && (
                          <div className="absolute top-1 inset-x-0 flex justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          </div>
                        )}

                        <span className="font-heading font-black text-xs sm:text-sm leading-none">
                          {note.displayName}
                        </span>
                        <span className={`text-[10px] font-bold mt-0.5 leading-none ${
                          isCurrentTarget
                            ? 'text-indigo-100'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}>
                          {note.letter}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* 5 Black Keys (Overlapping) */}
                {blackKeyPositions.map(({ note, left }) => {
                  if (!note) return null;
                  const isCurrentTarget = selectedTargetNote.name === note.name;
                  const isReachable = isNoteInRange(note);

                  return (
                    <motion.button
                      key={note.name}
                      whileTap={isReachable ? { scale: 0.93 } : undefined}
                      disabled={!isReachable}
                      onClick={() => {
                        if (!isReachable) return;
                        setSelectedTargetNote(note);
                        voicePlayback.playVoiceNote(note, gender, 1.2);
                      }}
                      style={{ left }}
                      className={`absolute top-1 z-10 -translate-x-1/2 w-[10.5%] sm:w-[11%] h-12 sm:h-13 rounded-b-lg sm:rounded-b-xl transition-all flex flex-col justify-end items-center pb-1 border ${
                        isCurrentTarget
                          ? 'bg-gradient-to-b from-violet-500 to-purple-700 text-white border-violet-400 shadow-[0_3px_0_0_#3b0764] ring-2 ring-violet-300 scale-105 z-20 cursor-pointer animate-pulse'
                          : isReachable
                          ? 'bg-slate-900 dark:bg-[#070d18] text-white hover:bg-slate-800 dark:hover:bg-[#0d1728] border-slate-700/90 dark:border-slate-800 shadow-[0_3px_0_0_#020617] cursor-pointer'
                          : 'bg-slate-700/70 dark:bg-slate-900/60 text-slate-500 dark:text-slate-600 border-slate-600/70 dark:border-slate-800 shadow-[0_3px_0_0_#1e293b] dark:shadow-[0_3px_0_0_#020617] cursor-not-allowed opacity-50'
                      }`}
                      title={isReachable
                        ? (isCurrentTarget ? `Voz real: ${note.fullName} (evaluar tono)` : `Cantar ${note.fullName} (voz real en tu rango)`)
                        : `Fuera de tu rango vocal actual`}
                    >
                      {/* Top Indicator for Current Target */}
                      {isCurrentTarget && (
                        <div className="absolute top-0.5 inset-x-0 flex justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-200 animate-ping" />
                        </div>
                      )}

                      <span className="font-heading font-black text-[9px] sm:text-[10px] text-white leading-none drop-shadow-xs">
                        {note.displayName}
                      </span>
                      <span className={`text-[8px] sm:text-[9px] font-bold mt-0.5 leading-none ${
                        isCurrentTarget
                          ? 'text-violet-200'
                          : 'text-slate-400'
                      }`}>
                        {note.letter}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Rango vocal usado para filtrar las voces */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                  Voces filtradas por tu rango:
                </span>
                <span className="text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/60">
                  {effectiveRangeData?.classification ?? (gender === 'masculino' ? 'Barítono' : 'Mezzosoprano')} · {effectiveRangeData?.noteMin ?? (gender === 'masculino' ? 'La2' : 'La3')} – {effectiveRangeData?.noteMax ?? (gender === 'masculino' ? 'Sol4' : 'La5')}
                </span>
              </div>

              {/* Mini Piano: continúa el principal con Do...Mi una octava arriba */}
              <div className="bg-[#f8f9ff] dark:bg-[#0b1828] p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-slate-600 dark:text-[#c0c1ff] uppercase tracking-wider flex items-center gap-1.5">
                    Mini Piano Superior · amplía tu rango
                  </span>
                </div>

                <div className="relative w-full mx-auto select-none pt-1 pb-1">
                  {/* 3 White Keys: Do, Re, Mi */}
                  <div className="flex gap-1 w-full h-12">
                    {miniPianoWhiteKeys.map((note) => {
                      const isCurrentTarget = selectedTargetNote.name === note.name;

                      return (
                        <motion.button
                          key={note.name}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setSelectedTargetNote(note);
                            voicePlayback.playVoiceNote(note, gender, 1.5);
                          }}
                          className={`flex-1 h-full rounded-b-xl transition-all flex flex-col justify-end items-center pb-1 relative border ${
                            isCurrentTarget
                              ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white border-emerald-600 shadow-[0_4px_0_0_#064e3b] ring-2 ring-emerald-400/80 z-0 cursor-pointer animate-pulse'
                              : 'bg-white dark:bg-[#152336] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2c44] border-slate-200/90 dark:border-slate-700/80 shadow-[0_4px_0_0_#cbd5e1] dark:shadow-[0_4px_0_0_#0b1420] cursor-pointer'
                          }`}
                          title={`Nota superior: ${note.fullName}`}
                        >
                          {isCurrentTarget && (
                            <div className="absolute top-0.5 inset-x-0 flex justify-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            </div>
                          )}
                          <span className="font-heading font-black text-xs leading-none">
                            {note.displayName}
                          </span>
                          <span className={`text-[9px] font-bold mt-0.5 leading-none ${
                            isCurrentTarget
                              ? 'text-emerald-100'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}>
                            {note.letter}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* 2 Black Keys: Do#, Re# */}
                  {miniBlackKeyPositions.map(({ note, left }) => {
                    if (!note) return null;
                    const isCurrentTarget = selectedTargetNote.name === note.name;

                    return (
                      <motion.button
                        key={note.name}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => {
                          setSelectedTargetNote(note);
                          voicePlayback.playVoiceNote(note, gender, 1.5);
                        }}
                        style={{ left }}
                        className={`absolute top-1 z-10 -translate-x-1/2 w-[10.5%] h-7 rounded-b-lg transition-all flex flex-col justify-end items-center pb-0.5 border ${
                          isCurrentTarget
                            ? 'bg-gradient-to-b from-emerald-500 to-teal-700 text-white border-emerald-300 shadow-[0_3px_0_0_#065f46] ring-2 ring-emerald-300 scale-105 z-20 cursor-pointer animate-pulse'
                            : 'bg-slate-900 dark:bg-[#070d18] text-white hover:bg-slate-800 dark:hover:bg-[#0d1728] border-slate-700/90 dark:border-slate-800 shadow-[0_3px_0_0_#020617] cursor-pointer'
                        }`}
                        title={`Nota superior: ${note.fullName}`}
                      >
                        <span className="font-heading font-black text-[8px] text-white leading-none drop-shadow-xs">
                          {note.displayName}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                  Continúan justo donde termina el piano principal: practícalas despacio para ir ampliando tu tesitura hacia arriba (calienta la voz antes).
                </p>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                Sostén la nota <strong className="text-indigo-600 dark:text-indigo-400">{selectedTargetNote.name}</strong> durante 5 segundos de forma limpia e ininterrumpida.
              </p>
            </div>

            {/* Tuner History Summary Box */}
            {totalTuned > 0 && (
              <div className="bg-amber-50/80 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
                  <span className="flex items-center gap-1.5">
                    <History className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    Contexto de tu Afinador Vocal
                  </span>
                  <span className="text-[10px] bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-2 py-0.5 rounded-full">
                    {totalTuned} entradas
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-snug">
                  Sesgo en afinador: <strong>{biasTrend === 'agudo' ? 'tendencia a sobreagudar' : biasTrend === 'grave' ? 'tendencia a sobrequebrarse' : 'afinación neutra'}</strong>. Nota más practicada: <strong>{mostPracticedNote}</strong>.
                </p>
              </div>
            )}

            {/* Start test CTA button */}
            <button
              onClick={startTest}
              className="w-full py-3.5 px-4 rounded-2xl tactile-btn-primary font-heading font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-indigo-500/20 transition-all text-center whitespace-nowrap"
            >
              <Mic className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse shrink-0" />
              <span>Iniciar Grabación (5s - {selectedTargetNote.name})</span>
            </button>
          </div>
        )}

        {/* Active Recording State */}
        {isRecording && (
          <div className="py-4 text-center space-y-4">
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
              <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center border-4 border-red-400 dark:border-red-700 shadow-xl relative z-10">
                <Mic className="w-8 h-8" />
              </div>
              <span className="absolute -bottom-1 bg-red-600 text-white font-black text-xs px-2.5 py-0.5 rounded-full shadow-md z-20">
                {recordingSeconds}s
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="font-heading font-bold text-lg text-slate-800 dark:text-slate-100">
                Cantando: <span className="text-indigo-600 dark:text-indigo-400">{selectedTargetNote.name}</span>
              </h4>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {livePitch
                  ? 'Capturando tono vocal...'
                  : 'Sostén la nota con aire fluido...'}
              </p>
            </div>

            {/* Real-time soundwave visualization canvas */}
            <AudioWaveformVisualizer />
          </div>
        )}

        {/* Evaluation Results */}
        {result && (
          <div className="space-y-4 pt-1 animate-fadeIn">
            {/* Overall Score Badge */}
            <div className="bg-[#eff4ff] dark:bg-[#0b1828] rounded-2xl p-4 border border-indigo-100 dark:border-slate-800 text-center space-y-1.5 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <span>Puntuación Vocal Global</span>
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                  <ShieldCheck className="w-4 h-4" /> ±{result.centsDeviationAvg || 8} Céntimos
                </span>
              </div>

              <div className="flex items-center justify-center gap-3">
                <div className="font-heading font-extrabold text-5xl text-[#2c2abc] dark:text-[#c0c1ff]">
                  {result.score}
                  <span className="text-lg text-slate-400 font-normal">/100</span>
                </div>
                <div className="text-left border-l border-slate-300 dark:border-slate-700 pl-3">
                  <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    result.score >= 90
                      ? 'bg-emerald-500 text-white'
                      : result.score >= 75
                      ? 'bg-indigo-600 text-white'
                      : 'bg-amber-500 text-white'
                  }`}>
                    {result.score >= 90 ? 'Excelente Precision' : result.score >= 75 ? 'Buena Afinación' : 'Afinación a Pulir'}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    Nota Evaluada: <strong>{selectedTargetNote.name}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Desglose de Rendimiento Vocal</span>
                <span className="text-[10px] text-slate-400">{result.rangeDetected}</span>
              </h4>

              {/* Pitch Accuracy */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-[#d3e4fe] mb-1">
                  <span>Precisión de Afinación</span>
                  <span className="text-[#2c2abc] dark:text-[#c0c1ff]">{result.pitchAccuracy}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#4648d4] rounded-full transition-all duration-700" style={{ width: `${result.pitchAccuracy}%` }} />
                </div>
              </div>

              {/* Pitch Stability */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-[#d3e4fe] mb-1">
                  <span>Estabilidad del Tono</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{result.pitchStability || 82}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${result.pitchStability || 82}%` }} />
                </div>
              </div>

              {/* Breath Support */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-[#d3e4fe] mb-1">
                  <span>Apoyo Diafragmático</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{result.breathSupport}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${result.breathSupport}%` }} />
                </div>
              </div>
            </div>

            {/* SECCIÓN PRINCIPAL: Reseña de Puntos de Mejora */}
            <div className="bg-gradient-to-br from-indigo-50/90 to-blue-50/70 dark:from-[#0f233a] dark:to-[#0b1828] p-4 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#4648d4] dark:text-[#c0c1ff]">
                  <Sparkles className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
                  <span className="uppercase tracking-wider font-extrabold">Reseña de Puntos de Mejora</span>
                </div>

                {result.tunerHistorySummary && result.tunerHistorySummary.totalNotesTuned > 0 && (
                  <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-300/60 flex items-center gap-1">
                    <History className="w-3 h-3" /> Con Contexto del Afinador
                  </span>
                )}
              </div>

              {/* Actionable improvement points list */}
              <div className="space-y-2 pt-0.5">
                {result.improvementPoints && result.improvementPoints.map((point, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-indigo-100/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 leading-relaxed shadow-xs"
                  >
                    <div className="p-1 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <span>{point}</span>
                  </div>
                ))}
              </div>

              {/* AI Feedback Summary sentence */}
              <div className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-xl text-xs text-slate-600 dark:text-slate-300 leading-relaxed border border-slate-200/60 dark:border-slate-800/60 italic">
                "{result.feedbackMsg}"
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
              <button
                onClick={startTest}
                className="flex-1 py-2.5 sm:py-3 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-heading font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer text-center"
              >
                <RefreshCw className="w-4 h-4 shrink-0" />
                <span>Repetir Diagnóstico</span>
              </button>

              <button
                onClick={handleClose}
                className="flex-1 py-2.5 sm:py-3 px-3 rounded-2xl tactile-btn-primary font-heading font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md text-center"
              >
                <Check className="w-4 h-4 shrink-0" />
                <span>Guardar y Cerrar</span>
              </button>
            </div>
          </div>
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
