import { VoiceEvaluationResult } from '../../types';
import { PitchSample } from './voiceEvalTypes';
import { ChromaticNoteButtonInfo } from '../../utils/voicePlaybackService';
import { calculateCentsOff } from '../../utils/pitchUtils';

export interface EvalScoringParams {
  samples: PitchSample[];
  targetFreq: number;
  selectedTargetNote: ChromaticNoteButtonInfo;
  totalTuned: number;
  avgDiffHz: number;
  biasTrend: 'agudo' | 'grave' | 'equilibrado';
  mostPracticedNote: string;
}

const NOTE_NAMES_ES = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];

function midiToNoteString(midi: number): string {
  const noteIdx = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES_ES[noteIdx]}${octave}`;
}

export function computeVoiceEvaluation(params: EvalScoringParams): VoiceEvaluationResult {
  const {
    samples,
    targetFreq,
    selectedTargetNote,
    totalTuned,
    avgDiffHz,
    biasTrend,
    mostPracticedNote,
  } = params;

  // 1. Filter out background noise, silence, and non-vocal transients
  const vocalSamples = samples.filter((s) => s.pitchHz >= 65 && s.pitchHz <= 1400 && s.volume >= 0.012);

  if (vocalSamples.length < 10) {
    return {
      score: 0,
      pitchAccuracy: 0,
      breathSupport: 0,
      toneWarmth: 0,
      rangeDetected: `Nota ${selectedTargetNote.name}`,
      feedbackMsg: 'No se detectó suficiente señal de voz durante los 5 segundos de grabación. Canta más cerca del micrófono con volumen claro para obtener tu diagnóstico real.',
      strengths: [],
      recommendations: [
        'Acércate más al micrófono de tu dispositivo',
        'Canta la vocal con volumen audible y continuo (ej. "Aaaaa")',
        'Verifica que el micrófono tenga permiso concedido en el navegador',
      ],
      centsDeviationAvg: 0,
      pitchStability: 0,
      improvementPoints: [
        'Señal de audio insuficiente: No se registraron frecuencias estables para analizar.',
        'Sugerencia: Haz la prueba en un ambiente con poco ruido y emite un tono firme.',
      ],
      insufficientAudio: true,
    };
  }

  // Trim 10% from start and 10% from end to eliminate attack and breath release transients
  const startIdx = Math.floor(vocalSamples.length * 0.1);
  const endIdx = Math.max(startIdx + 8, Math.ceil(vocalSamples.length * 0.9));
  const sustainedSamples = vocalSamples.slice(startIdx, endIdx);

  // 2. Calculate Median Pitch
  const sortedPitches = [...sustainedSamples.map((s) => s.pitchHz)].sort((a, b) => a - b);
  const medianPitchHz = sortedPitches[Math.floor(sortedPitches.length / 2)];

  // 3. Octave Equivalence: evaluate error relative to the target note folded into [-600, +600] cents
  const centsDeviations = sustainedSamples.map((s) => calculateCentsOff(s.pitchHz, targetFreq, true));
  const absCentsDeviations = centsDeviations.map((c) => Math.abs(c));

  // Median absolute cents error
  const sortedAbsCents = [...absCentsDeviations].sort((a, b) => a - b);
  const medianAbsCents = sortedAbsCents[Math.floor(sortedAbsCents.length / 2)];
  const centsDevAvg = Number(medianAbsCents.toFixed(1));

  // 4. Pedagogical Pitch Accuracy curve
  let pitchAccuracy: number;
  if (medianAbsCents <= 15) {
    // 0 to 15 cents: 92% to 99% (Excellent studio intonation)
    pitchAccuracy = Math.round(99 - (medianAbsCents / 15) * 7);
  } else if (medianAbsCents <= 35) {
    // 15 to 35 cents: 78% to 92% (Good choral / amateur intonation)
    pitchAccuracy = Math.round(92 - ((medianAbsCents - 15) / 20) * 14);
  } else if (medianAbsCents <= 60) {
    // 35 to 60 cents: 55% to 78% (Noticeable quarter-tone error)
    pitchAccuracy = Math.round(78 - ((medianAbsCents - 35) / 25) * 23);
  } else if (medianAbsCents <= 110) {
    // 60 to 110 cents: 30% to 55% (Half semitone / wrong note)
    pitchAccuracy = Math.round(55 - ((medianAbsCents - 60) / 50) * 25);
  } else {
    // > 110 cents: Out of tune / wrong note
    pitchAccuracy = Math.max(15, Math.round(30 - ((medianAbsCents - 110) / 100) * 15));
  }

  // 5. Pitch Stability in Cents relative to singer's own sustained pitch
  const centsFromMedian = sustainedSamples.map((s) => Math.abs(1200 * Math.log2(s.pitchHz / medianPitchHz)));
  const sortedCentsFromMedian = [...centsFromMedian].sort((a, b) => a - b);
  const medianStabilityError = sortedCentsFromMedian[Math.floor(sortedCentsFromMedian.length / 2)];

  // Healthy vocal vibrato is ±15-30 cents. Wild wavers are > 45 cents.
  let pitchStability: number;
  if (medianStabilityError <= 18) {
    pitchStability = Math.round(98 - (medianStabilityError / 18) * 8);
  } else if (medianStabilityError <= 40) {
    pitchStability = Math.round(90 - ((medianStabilityError - 18) / 22) * 15);
  } else {
    pitchStability = Math.max(25, Math.round(75 - ((medianStabilityError - 40) / 40) * 50));
  }

  // 6. Breath Support: Consistency of vocal pressure
  const volumes = sustainedSamples.map((s) => s.volume);
  const avgVol = volumes.reduce((acc, v) => acc + v, 0) / volumes.length;
  const volVariance = volumes.reduce((acc, v) => acc + Math.pow(v - avgVol, 2), 0) / volumes.length;
  const volStdDev = Math.sqrt(volVariance);
  const volCoeffVar = avgVol > 0.001 ? volStdDev / avgVol : 1;

  const breathSupport = Math.max(
    40,
    Math.min(97, Math.round(95 - volCoeffVar * 40 + Math.min(10, avgVol * 150)))
  );

  // 7. Weighted Total Score
  const rawScore = Math.round(pitchAccuracy * 0.65 + pitchStability * 0.20 + breathSupport * 0.15);
  const score = Math.max(20, Math.min(99, rawScore));

  // 8. Detected sung note and octave
  const detectedMidi = Math.round(69 + 12 * Math.log2(medianPitchHz / 440));
  const detectedNoteStr = midiToNoteString(detectedMidi);
  const rangeDetected = `Nota Cantada: ${detectedNoteStr} (${Math.round(medianPitchHz)} Hz)`;

  // 9. Directional Feedback (Signed median cents off)
  const sortedSignedCents = [...centsDeviations].sort((a, b) => a - b);
  const medianSignedCents = sortedSignedCents[Math.floor(sortedSignedCents.length / 2)];

  const improvementPoints: string[] = [];

  if (medianSignedCents < -14) {
    improvementPoints.push(
      `Ajuste de Calado Grave: Tu tono se ubicó aproximadamente ${Math.abs(Math.round(medianSignedCents))} céntimos por debajo de la nota objetivo. Inhala profundo y proyecta el sonido hacia el paladar superior para elevar la afinación.`
    );
  } else if (medianSignedCents > 14) {
    improvementPoints.push(
      `Ajuste de Calado Agudo: Tu tono tendió a apretarse ${Math.round(medianSignedCents)} céntimos hacia arriba. Relaja la mandíbula y baja la base de la lengua para evitar tensión laríngea.`
    );
  } else {
    improvementPoints.push(
      `Control Tonal Preciso: Excelente puntería en la nota ${selectedTargetNote.name} con desviación mínima de ${Math.abs(Math.round(medianSignedCents))} céntimos.`
    );
  }

  // Stability feedback
  if (pitchStability < 75) {
    improvementPoints.push(
      `Estabilidad del Tono (${pitchStability}%): Se detectaron oscilaciones excesivas en la columna de aire. Practica notas largas sostenidas manteniendo el abdomen activo.`
    );
  } else {
    improvementPoints.push(
      `Firmeza Vocal (${pitchStability}%): Demostraste un apoyo continuo de aire sin temblores ni pérdida de presión sonora.`
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
      `Historial del Afinador (${totalTuned} notas registradas): En tus sesiones previas sueles ${historyBiasText}. Tu nota más ejercitada es ${mostPracticedNote}.`
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
      : score >= 55
      ? `Afinación aproximada. La nota tiene intención pero se desvía del centro tonal. Trabaja escalas lentas con referencia auditiva.`
      : `Nota fuera de afinación. Tu tono no coincidió con ${selectedTargetNote.name}. Escucha el sonido de referencia y canta la vocal con mayor apoyo de aire.`;

  const strengths = [
    score >= 70
      ? `Afinación centrada en la nota ${selectedTargetNote.name}`
      : `Intención vocal constante durante los 5 segundos`,
    `Presión de aire y proyección continuas`,
  ];

  const recommendations = [
    `Practica la nota ${selectedTargetNote.name} con tono de referencia previo`,
    `Realiza trino de labios (lip trills) para relajar los pliegues vocales antes de emitir sonido`,
  ];

  return {
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
      mostPracticedNote,
    },
    improvementPoints,
    insufficientAudio: false,
  };
}
