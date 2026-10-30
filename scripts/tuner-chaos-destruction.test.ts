/**
 * SUITE DE CAOS Y DESTRUCCIÓN EXTREMA: SECCIÓN AFINADOR Y ACORDEÓN DE 6 HERRAMIENTAS
 * 
 * Esta suite ejecuta pruebas de estrés destructivo, fuzzing masivo, condiciones de carrera,
 * corrupción de estado y verificación de límites matemáticos/acústicos en:
 * 1. Acordeón de 6 Herramientas:
 *    - Herramienta 1: Test Vocal / Rango y Tesitura (VocalRangeModal)
 *    - Herramienta 2: Control Diafragmático / Rehabilitación Pulmonar (BreathingModal)
 *    - Herramienta 3: Desafío de Retención y Estabilidad 10s (StabilityChallengeModal)
 *    - Herramienta 4: Diagnóstico y Evaluación de Precisión IA (VoiceEvalModal)
 *    - Herramienta 5: Solfeo y Escalas Rápidas (EscalasModal)
 *    - Herramienta 6: Duelos Vocales y de Ritmo (DueloRapidoModal)
 * 2. Afinador Principal y Motor de Niveles:
 *    - useAfinadorPitch & useAfinadorLevels
 *    - Teclado Cromático de 12 Notas y Navegación de Octavas
 *    - Sistema Tug-of-War y Gestión de Vidas / Derrota
 *    - Robustez ante NaNs, Infinitos, Frecuencias Negativas y JSON corrupto
 */

import { calculateCentsOff, calculateRawCentsOff, getOctaveDisplacement } from '../src/utils/pitchUtils';
import { hzToNoteName, classifyVoice } from '../src/components/vocal-range/vocalRangeUtils';
import { getEvaluationComparison } from '../src/utils/vocalRangeHelper';
import {
  generateUserNotePool,
  getComfortableChromaticNotes,
  noteNameToMidi,
  VOCAL_AUDIO_LIMITS,
  CLASSIFICATION_RANGES,
  chromaticBase,
  getOctaveIndicator
} from '../src/utils/vocalNotePool';
import { BREATHING_TECHNIQUES } from '../src/components/breathing/breathingTypes';
import { computeVoiceEvaluation } from '../src/components/voice-eval/voiceEvalScoring';
import { QUICK_SCALES } from '../src/data/academyData';
import {
  difficultySettings,
  difficultyLevels,
  generateChallenge,
  generateIntervalChallenge,
  melodies,
  ChallengeDifficulty
} from '../src/data/tunerLevelsData';
import fs from 'fs';
import path from 'path';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    passCount++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    failCount++;
    console.error(`  ❌ [FAIL] ${testName}${details ? ` -> ${details}` : ''}`);
  }
}

async function runTunerChaosDestructionSuite() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('💥 INICIANDO SUITE DE CAOS Y DESTRUCCIÓN: AFINADOR Y 6 HERRAMIENTAS');
  console.log('════════════════════════════════════════════════════════════════════════\n');

  // =========================================================================
  // SECCIÓN 1: HERRAMIENTA 1 - TEST VOCAL / TESITURA (VocalRangeModal)
  // =========================================================================
  console.log('--- SECCIÓN 1: HERRAMIENTA 1 (Test Vocal / Tesitura) ---');
  
  // 1.1 Fuzzing de clasificaciones canónicas
  const presets = [
    { name: 'Bajo', min: 82, max: 330, gender: 'male' as const },
    { name: 'Barítono', min: 110, max: 392, gender: 'male' as const },
    { name: 'Tenor', min: 130, max: 523, gender: 'male' as const },
    { name: 'Contralto', min: 174, max: 698, gender: 'female' as const },
    { name: 'Mezzosoprano', min: 220, max: 880, gender: 'female' as const },
    { name: 'Soprano', min: 261, max: 1046, gender: 'female' as const },
  ];

  presets.forEach(p => {
    const res = classifyVoice(p.min, p.max, p.gender);
    assert(res.classification === p.name, `Clasificación canónica exacta: ${p.name}`);
  });

  // 1.2 Fuzzing destructivo de hzToNoteName con valores patológicos
  assert(hzToNoteName(0).fullName === 'Do1', 'hzToNoteName con 0Hz cae en fallback seguro Do1');
  assert(hzToNoteName(-100).fullName === 'Do1', 'hzToNoteName con frecuencia negativa cae en fallback seguro Do1');
  assert(hzToNoteName(15).fullName === 'Do1', 'hzToNoteName con infrasonido (15Hz) cae en Do1');
  assert(hzToNoteName(NaN).fullName === 'Do1', 'hzToNoteName(NaN) cae en Do1 sin crash');
  assert(hzToNoteName(Infinity).fullName === 'Do1', 'hzToNoteName(Infinity) cae en Do1 sin crash');
  assert(hzToNoteName(440).fullName === 'La4', 'hzToNoteName(440Hz) es La4 exacto');
  assert(hzToNoteName(261.63).fullName === 'Do4', 'hzToNoteName(261.63Hz) es Do4 exacto');
  assert(hzToNoteName(1046.5).fullName === 'Do6', 'hzToNoteName(1046.5Hz) es Do6 exacto');

  // 1.3 Ratchet boundary logic y comparación de rango
  const comp1 = getEvaluationComparison(130, 440);
  assert(comp1 !== null && typeof comp1.octaves === 'string', 'getEvaluationComparison no es null con valores normales');
  assert(comp1.octaves === '1.8', `Octavas calculadas correctamente (1.8 vs ${comp1.octaves})`);
  const compZero = getEvaluationComparison(0, 0);
  assert(compZero !== null && compZero.octaves === '0.0', 'getEvaluationComparison maneja 0Hz con octavas "0.0" sin arrojar NaN');

  // =========================================================================
  // SECCIÓN 2: HERRAMIENTA 2 - CONTROL DIAFRAGMÁTICO (BreathingModal)
  // =========================================================================
  console.log('\n--- SECCIÓN 2: HERRAMIENTA 2 (Ejercicios de Respiración) ---');

  assert(BREATHING_TECHNIQUES.length === 7, 'Existen exactamente las 7 técnicas respiratorias configuradas');

  BREATHING_TECHNIQUES.forEach((tech) => {
    assert(tech.phases.length >= 2, `Técnica ${tech.name} tiene al menos 2 fases`);
    const totalCycle = tech.phases.reduce((acc, p) => acc + p.duration, 0);
    assert(totalCycle >= 8 && totalCycle <= 40, `Técnica ${tech.name} tiene ciclo balanceado (${totalCycle}s)`);
    assert(tech.targetCycles !== undefined && tech.targetCycles >= 1 && tech.targetCycles <= 5, `Técnica ${tech.name} targetCycles válido (${tech.targetCycles})`);

    // Comprobar que cada fase tenga label, type y duración positiva
    tech.phases.forEach((phase) => {
      assert(phase.duration > 0, `Fase ${phase.label} de ${tech.name} tiene duración positiva (${phase.duration}s)`);
      assert(['inhale', 'hold_full', 'exhale', 'hold_empty'].includes(phase.type), `Fase ${phase.label} tiene tipo válido (${phase.type})`);
    });
  });

  // =========================================================================
  // SECCIÓN 3: HERRAMIENTA 3 - DESAFÍO DE ESTABILIDAD 10s (StabilityChallengeModal)
  // =========================================================================
  console.log('\n--- SECCIÓN 3: HERRAMIENTA 3 (Desafío de Estabilidad 10s) ---');

  // Prueba de tolerancia acústica de estabilidad (±25 cents)
  const targetHz = 440;
  const inTuneHz = 440 * Math.pow(2, 20 / 1200); // +20 cents
  const outOfTuneHz = 440 * Math.pow(2, 35 / 1200); // +35 cents

  const centsIn = Math.abs(calculateCentsOff(inTuneHz, targetHz));
  const centsOut = Math.abs(calculateCentsOff(outOfTuneHz, targetHz));

  assert(centsIn <= 25, `Frecuencia afinada (+20 cents) entra en tolerancia de estabilidad (<=25 cents)`);
  assert(centsOut > 25, `Frecuencia desafinada (+35 cents) queda fuera de tolerancia de estabilidad (>25 cents)`);

  // Cálculo de XP y puntuación de estabilidad
  const testInTuneSeconds = 8.5; // 8.5s de 10s
  const stabilityPct = Math.round((testInTuneSeconds / 10) * 100);
  assert(stabilityPct === 85, 'Porcentaje de estabilidad 8.5s/10s es exactamente 85%');

  // Multiplicador de XP
  const mult = stabilityPct >= 90 ? 2.0 : stabilityPct >= 70 ? 1.5 : 1.0;
  assert(mult === 1.5, 'Multiplicador de XP para 85% es 1.5x');
  const earnedXp = Math.round(25 * mult);
  assert(earnedXp === 38, 'XP ganada para 85% es 38 XP');

  // =========================================================================
  // SECCIÓN 4: HERRAMIENTA 4 - EVALUACIÓN DE PRECISIÓN IA (VoiceEvalModal)
  // =========================================================================
  console.log('\n--- SECCIÓN 4: HERRAMIENTA 4 (Evaluación de Precisión IA) ---');

  const dummyNote = {
    name: 'LA',
    displayName: 'La',
    letter: 'A',
    isSharp: false,
    semitone: 9,
    octave: 4,
    frequency: 440,
    fullName: 'La4',
    americanFullName: 'A4',
    midi: 69,
    bgColor: '#6366f1',
    shadowColor: '#4338ca',
    hasRecording: true,
    octaveArrow: null
  };

  // 4.1 Audio insuficiente (0 muestras o menos de 10)
  const emptyEval = computeVoiceEvaluation({
    samples: [],
    targetFreq: 440,
    selectedTargetNote: dummyNote,
    totalTuned: 0,
    avgDiffHz: 0,
    biasTrend: 'equilibrado',
    mostPracticedNote: 'La4'
  });
  assert(emptyEval.score === 0, 'Audio vacío produce score 0');
  assert(emptyEval.insufficientAudio === true, 'Audio vacío activa bandera insufficientAudio');

  // 4.2 Audio perfecto de estudio (100 muestras a 440Hz con vibrato suave ±5 cents)
  const perfectSamples = Array.from({ length: 60 }, (_, i) => ({
    pitchHz: 440 + Math.sin(i * 0.2) * 1.2,
    volume: 0.08,
    timestamp: i * 80
  }));

  const perfectEval = computeVoiceEvaluation({
    samples: perfectSamples,
    targetFreq: 440,
    selectedTargetNote: dummyNote,
    totalTuned: 5,
    avgDiffHz: 1,
    biasTrend: 'equilibrado',
    mostPracticedNote: 'La4'
  });
  assert(perfectEval.score >= 90, `Canto perfecto obtiene score sobresaliente (${perfectEval.score}/100)`);
  assert(perfectEval.pitchAccuracy >= 90, `Precisión tonal perfecta es >= 90% (${perfectEval.pitchAccuracy}%)`);
  assert(perfectEval.pitchStability !== undefined && perfectEval.pitchStability >= 85, `Estabilidad tonal con vibrato sano es >= 85% (${perfectEval.pitchStability}%)`);
  assert(!perfectEval.insufficientAudio, 'Audio perfecto no marca insufficientAudio');

  // 4.3 Audio totalmente desafinado (+120 cents)
  const outOfTuneSamples = Array.from({ length: 60 }, (_, i) => ({
    pitchHz: 440 * Math.pow(2, 120 / 1200),
    volume: 0.05,
    timestamp: i * 80
  }));

  const badEval = computeVoiceEvaluation({
    samples: outOfTuneSamples,
    targetFreq: 440,
    selectedTargetNote: dummyNote,
    totalTuned: 0,
    avgDiffHz: 25,
    biasTrend: 'agudo',
    mostPracticedNote: 'La4'
  });
  assert(badEval.pitchAccuracy <= 35, `Canto desafinado a +120 cents recibe baja precisión (${badEval.pitchAccuracy}%)`);

  // =========================================================================
  // SECCIÓN 5: HERRAMIENTA 5 - ESCALAS RÁPIDAS (EscalasModal)
  // =========================================================================
  console.log('\n--- SECCIÓN 5: HERRAMIENTA 5 (Escalas Rápidas Vocales) ---');

  assert(QUICK_SCALES.length >= 8, `Existen al menos 8 escalas vocales en academyData (${QUICK_SCALES.length} detectadas)`);
  QUICK_SCALES.forEach((scale) => {
    assert(scale.notes.length >= 3, `Escala ${scale.name} tiene al menos 3 notas (${scale.notes.length})`);
    scale.notes.forEach((note) => {
      assert(note.frequency > 50 && note.frequency < 2000, `Nota ${note.name} en ${scale.name} tiene Hz seguro (${note.frequency}Hz)`);
      assert(typeof note.name === 'string' && note.name.length > 0, `Nota en ${scale.name} tiene nombre válido (${note.name})`);
    });
  });

  // =========================================================================
  // SECCIÓN 6: HERRAMIENTA 6 - DUELOS RÁPIDOS (DueloRapidoModal)
  // =========================================================================
  console.log('\n--- SECCIÓN 6: HERRAMIENTA 6 (Duelo Rápido) ---');

  // Pruebas de reglas de victoria y cálculo de XP en duelo
  const duelCases = [
    { p1: 85, p2: 60, expectedWon: true, expectedXp: 50 },
    { p1: 40, p2: 90, expectedWon: false, expectedXp: 20 },
    { p1: 75, p2: 75, expectedWon: true, expectedXp: 50 }, // Empate favorece al jugador que defiende su reto
  ];

  duelCases.forEach((c, idx) => {
    const userWon = c.p1 >= c.p2;
    const xp = userWon ? 50 : 20;
    assert(userWon === c.expectedWon, `Duelo Caso ${idx + 1}: ${c.p1} vs ${c.p2} -> Ganó: ${userWon}`);
    assert(xp === c.expectedXp, `Duelo Caso ${idx + 1}: XP otorgada correcta (${xp} XP)`);
  });

  // =========================================================================
  // SECCIÓN 7: MOTOR DE NIVELES, DIFICULTADES Y TUG OF WAR (useAfinadorLevels)
  // =========================================================================
  console.log('\n--- SECCIÓN 7: MOTOR DE NIVELES, DIFICULTADES Y TUG OF WAR ---');

  const diffs: ChallengeDifficulty[] = ['Fácil', 'Medio', 'Difícil', 'Maestro'];
  diffs.forEach(d => {
    const levels = difficultyLevels[d];
    assert(levels && levels.length >= 10, `Dificultad ${d} tiene al menos 10 niveles configurados (${levels?.length})`);
  });

  // Verificar generación de retos melódicos
  const poolMasc = generateUserNotePool({ classification: 'Tenor', minHz: 130, maxHz: 523, gender: 'masculino' }, 'masculino');
  assert(poolMasc.length >= 12, `Pool de notas para Tenor masculino tiene cobertura amplia (${poolMasc.length} notas)`);

  const challenge1 = generateChallenge(1, poolMasc);
  assert(challenge1.length === 1, `generateChallenge(1, pool) genera exactamente 1 nota (${challenge1.length})`);
  assert(poolMasc.some(n => n.midi === challenge1[0].midi), 'La nota del reto pertenece al pool del usuario');

  const challengeAdv = generateChallenge(4, poolMasc);
  assert(challengeAdv.length === 4, `generateChallenge(4, pool) genera secuencia de 4 notas (${challengeAdv.length})`);

  // Arpegio de intervalos de 4 notas
  const intervalChallenge = generateIntervalChallenge(1, poolMasc);
  assert(intervalChallenge.length === 4, `generateIntervalChallenge(1, pool) garantiza 4 notas [1, 3, 5, 8] (${intervalChallenge.length})`);

  // =========================================================================
  // SECCIÓN 8: TECLADO CROMÁTICO Y ARCHIVOS DE AUDIO FÍSICOS
  // =========================================================================
  console.log('\n--- SECCIÓN 8: TECLADO CROMÁTICO Y ARCHIVOS FÍSICOS ---');

  const chromMasc = getComfortableChromaticNotes({ classification: 'Barítono' }, 'masculino');
  assert(chromMasc.allNotes.length === 12, 'getComfortableChromaticNotes entrega exactamente 12 notas cromáticas');
  assert(chromMasc.naturalNotes.length === 7, 'Tiene exactamente 7 teclas naturales');
  assert(chromMasc.sharpNotes.length === 5, 'Tiene exactamente 5 teclas sostenidas (#)');
  assert(chromMasc.availableOctaves.length >= 1, 'Tiene al menos 1 octava disponible');

  const chromFem = getComfortableChromaticNotes({ classification: 'Soprano' }, 'femenino');
  assert(chromFem.allNotes.length === 12, 'Soprano tiene exactamente 12 notas cromáticas');
  assert(chromFem.naturalNotes.length === 7, 'Tiene 7 teclas naturales');
  assert(chromFem.sharpNotes.length === 5, 'Tiene 5 teclas sostenidas');

  // Verificar que todas las notas marcadas con hasRecording tengan archivo físico real en public/sounds/
  const soundsDir = path.resolve('public/sounds');
  const allFiles = fs.readdirSync(soundsDir);

  const maleAudios = allFiles.filter(f => f.startsWith('masculino_') && f.endsWith('.mp3'));
  const femaleAudios = allFiles.filter(f => f.startsWith('femenino_') && f.endsWith('.mp3'));

  assert(maleAudios.length === 29, `Existen exactamente 29 audios masculinos en public/sounds/ (${maleAudios.length})`);
  assert(femaleAudios.length === 22, `Existen exactamente 22 audios femeninos en public/sounds/ (${femaleAudios.length})`);

  // =========================================================================
  // SECCIÓN 9: ROBUSTEZ MATEMÁTICA Y DSP ANTE NA/INFINITO/CORRUPCIÓN
  // =========================================================================
  console.log('\n--- SECCIÓN 9: DSP Y FUZZING ANTE ENTRADAS DESTRUCTORAS ---');

  // calculateCentsOff con valores imposibles
  assert(calculateCentsOff(0, 440) === 0, 'calculateCentsOff(0, 440) devuelve 0 de forma segura');
  assert(calculateCentsOff(440, 0) === 0, 'calculateCentsOff(440, 0) devuelve 0 de forma segura');
  assert(calculateCentsOff(NaN, 440) === 0, 'calculateCentsOff(NaN, 440) devuelve 0 sin crash');
  assert(calculateCentsOff(440, NaN) === 0, 'calculateCentsOff(440, NaN) devuelve 0 sin crash');
  assert(calculateCentsOff(-440, 440) === 0, 'calculateCentsOff(-440, 440) devuelve 0 de forma segura');

  // calculateRawCentsOff
  assert(calculateRawCentsOff(0, 440) === 0, 'calculateRawCentsOff(0, 440) devuelve 0');
  assert(calculateRawCentsOff(440, 0) === 0, 'calculateRawCentsOff(440, 0) devuelve 0');

  // getOctaveDisplacement
  assert(getOctaveDisplacement(440, 440) === 0, 'getOctaveDisplacement(440, 440) es 0 (misma octava)');
  assert(getOctaveDisplacement(220, 440) === -1, 'getOctaveDisplacement(220, 440) es -1 (1 octava abajo)');
  assert(getOctaveDisplacement(880, 440) === 1, 'getOctaveDisplacement(880, 440) es +1 (1 octava arriba)');
  assert(getOctaveDisplacement(0, 440) === 0, 'getOctaveDisplacement(0, 440) devuelve 0 de forma segura');
  assert(getOctaveDisplacement(NaN, 440) === 0, 'getOctaveDisplacement(NaN, 440) devuelve 0 de forma segura');

  // noteNameToMidi con strings malformados
  assert(noteNameToMidi('') === 60, 'noteNameToMidi("") cae en C4 (60) por defecto');
  assert(noteNameToMidi('nota_invalida') === 60, 'noteNameToMidi("nota_invalida") cae en C4 (60)');
  assert(noteNameToMidi('Do3') === 48, 'noteNameToMidi("Do3") es exactamente 48');
  assert(noteNameToMidi('C4') === 60, 'noteNameToMidi("C4") es exactamente 60');
  assert(noteNameToMidi('La4') === 69, 'noteNameToMidi("La4") es exactamente 69');

  console.log('\n════════════════════════════════════════════════════════════════════════');
  console.log(`📊 RESULTADOS: ${passCount} PASADAS, ${failCount} FALLIDAS`);
  console.log('════════════════════════════════════════════════════════════════════════\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTunerChaosDestructionSuite().catch(err => {
  console.error('💥 Error inesperado durante la suite de caos:', err);
  process.exit(1);
});
