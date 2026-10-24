import { getTodayStr } from './streakPrompt';
import { hzToNoteName, classifyVoice } from '../components/vocal-range/vocalRangeUtils';

export interface VocalRangeData {
  minHz?: number;
  maxHz?: number;
  noteMin: string;
  noteMax: string;
  classification: string;
  gender?: 'masculino' | 'femenino';
}

export interface VocalRangeHistoryEntry {
  id: string;
  date: string;
  label: string;          // e.g. 'Prueba 1', 'Expansión'
  minPitch: number;       // min Hz
  maxPitch: number;       // max Hz
  noteMin: string;        // e.g. 'Sol2'
  noteMax: string;        // e.g. 'Do5'
  octaves: number;        // e.g. 2.4
  rangeLabel: string;     // e.g. 'Barítono'
}

export interface ExpansionResult {
  expanded: boolean;
  expandedMin: boolean;
  expandedMax: boolean;
  previousMinNote?: string;
  previousMaxNote?: string;
  newMinNote: string;
  newMaxNote: string;
  newOctaves: number;
}

export type ComparisonFeedbackType = 'dual' | 'lowest' | 'highest' | 'protected' | 'first';

export interface EvaluationComparison {
  type: ComparisonFeedbackType;
  title: string;
  message: string;
  previousMinNote?: string;
  previousMaxNote?: string;
  newMinNote: string;
  newMaxNote: string;
  octaves: string;
}

const VOCAL_RANGE_HISTORY_KEY = 'laclave_vocal_range_history_v1';
const VOCAL_RANGE_SAVED_KEY = 'laclave_vocal_range_saved';
const VOCAL_RANGE_LAST_CHECK_KEY = 'laclave_last_vocal_range_check_date';
const VOCAL_RANGE_SNOOZED_KEY = 'laclave_vocal_range_snoozed_until';

const SIX_DAYS_MS = 6 * 24 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Converts a musical note string like "Sol2" or "Do5" to frequency in Hz.
 */
export function noteNameToHz(noteStr: string): number {
  if (!noteStr) return 0;
  const match = noteStr.trim().match(/^([A-Za-z#áéíóú]+)(\d)$/);
  if (!match) return 0;
  const name = match[1];
  const octave = parseInt(match[2], 10);

  const map: Record<string, number> = {
    'Do': 0, 'DO': 0, 'C': 0,
    'Do#': 1, 'DO#': 1, 'C#': 1, 'Reb': 1, 'REB': 1, 'Db': 1,
    'Re': 2, 'RE': 2, 'D': 2,
    'Re#': 3, 'RE#': 3, 'D#': 3, 'Mib': 3, 'MIB': 3, 'Eb': 3,
    'Mi': 4, 'MI': 4, 'E': 4,
    'Fa': 5, 'FA': 5, 'F': 5,
    'Fa#': 6, 'FA#': 6, 'F#': 6, 'Solb': 6, 'SOLB': 6, 'Gb': 6,
    'Sol': 7, 'SOL': 7, 'G': 7,
    'Sol#': 8, 'SOL#': 8, 'G#': 8, 'Lab': 8, 'LAB': 8, 'Ab': 8,
    'La': 9, 'LA': 9, 'A': 9,
    'La#': 10, 'LA#': 10, 'A#': 10, 'Sib': 10, 'SIB': 10, 'Bb': 10,
    'Si': 11, 'SI': 11, 'B': 11,
  };

  const semitone = map[name];
  if (semitone === undefined) return 0;

  const midi = (octave + 1) * 12 + semitone;
  return Math.round(440 * Math.pow(2, (midi - 69) / 12) * 10) / 10;
}

/**
 * Calculates the exact octaves between lowest and highest note or Hz.
 */
export function calculateOctaves(range: VocalRangeData | null): string {
  if (!range) return '-- Octavas';

  let minHz = range.minHz || 0;
  let maxHz = range.maxHz || 0;

  if (minHz <= 0 && range.noteMin) minHz = noteNameToHz(range.noteMin);
  if (maxHz <= 0 && range.noteMax) maxHz = noteNameToHz(range.noteMax);

  if (minHz > 0 && maxHz > minHz) {
    const oct = (Math.log2(maxHz / minHz)).toFixed(1);
    return `${oct} Octavas`;
  }

  return '-- Octavas';
}

/**
 * Saves a vocal range evaluation:
 * - Updates the operational saved range (laclave_vocal_range_saved) applying the ratchet rule
 *   to ensure historical records are never diminished (protecting the user's records).
 * - Appends the REAL evaluated measurement of this session to the evolution history
 *   (laclave_vocal_range_history) so the progress chart reflects what was actually sung.
 */
export function recordVocalRangeEvaluation(
  range: VocalRangeData,
  ratchetedSavedRange?: VocalRangeData
): VocalRangeData {
  if (typeof window === 'undefined') return range;
  try {
    let savedRange: VocalRangeData;

    if (ratchetedSavedRange) {
      savedRange = ratchetedSavedRange;
    } else {
      let finalMinHz = range.minHz || noteNameToHz(range.noteMin);
      let finalMaxHz = range.maxHz || noteNameToHz(range.noteMax);
      let finalNoteMin = range.noteMin;
      let finalNoteMax = range.noteMax;
      let finalClassification = range.classification;

      const rawPrev = localStorage.getItem(VOCAL_RANGE_SAVED_KEY);
      if (rawPrev) {
        const prev: VocalRangeData = JSON.parse(rawPrev);
        const prevMinHz = prev.minHz || noteNameToHz(prev.noteMin);
        const prevMaxHz = prev.maxHz || noteNameToHz(prev.noteMax);

        if (prevMinHz > 0 && (finalMinHz <= 0 || prevMinHz < finalMinHz)) {
          finalMinHz = prevMinHz;
          finalNoteMin = prev.noteMin || hzToNoteName(prevMinHz).fullName;
        }
        if (prevMaxHz > 0 && (finalMaxHz <= 0 || prevMaxHz > finalMaxHz)) {
          finalMaxHz = prevMaxHz;
          finalNoteMax = prev.noteMax || hzToNoteName(prevMaxHz).fullName;
        }
        const gender = range.gender || prev.gender || 'femenino';
        finalClassification = classifyVoice(finalMinHz, finalMaxHz, gender === 'femenino' ? 'female' : 'male').classification;
      }

      savedRange = {
        minHz: finalMinHz,
        maxHz: finalMaxHz,
        noteMin: finalNoteMin,
        noteMax: finalNoteMax,
        classification: finalClassification,
        gender: range.gender
      };
    }

    localStorage.setItem(VOCAL_RANGE_SAVED_KEY, JSON.stringify(savedRange));
    if (savedRange.classification) {
      localStorage.setItem('laclave_vocal_range_classification', savedRange.classification);
    }
    if (savedRange.gender) {
      localStorage.setItem('laclave_voice_gender', savedRange.gender);
    }

    markVocalRangeCheckCompleted();

    const savedHistory = localStorage.getItem(VOCAL_RANGE_HISTORY_KEY);
    const history: VocalRangeHistoryEntry[] = savedHistory ? JSON.parse(savedHistory) : [];

    let minHz = range.minHz || noteNameToHz(range.noteMin);
    let maxHz = range.maxHz || noteNameToHz(range.noteMax);
    if (minHz <= 0) minHz = 98;
    if (maxHz <= 0) maxHz = 523;

    const oct = parseFloat((Math.log2(maxHz / minHz)).toFixed(1)) || 2.0;
    const testNum = history.length + 1;

    const newEntry: VocalRangeHistoryEntry = {
      id: `eval-${Date.now()}`,
      date: getTodayStr(),
      label: `Prueba ${testNum}`,
      minPitch: Math.round(minHz),
      maxPitch: Math.round(maxHz),
      noteMin: range.noteMin,
      noteMax: range.noteMax,
      octaves: oct,
      rangeLabel: range.classification || 'Vocal',
    };

    history.push(newEntry);
    localStorage.setItem(VOCAL_RANGE_HISTORY_KEY, JSON.stringify(history));

    window.dispatchEvent(new CustomEvent('laclave_vocal_range_updated', {
      detail: { newRange: savedRange, evaluatedRange: range, history }
    }));

    return savedRange;
  } catch {
    return range;
  }
}

/**
 * Retrieves the vocal range evolution history.
 * If empty but a saved vocal range exists, bootstraps the initial entry.
 */
export function getVocalRangeHistory(currentRange?: VocalRangeData | null): VocalRangeHistoryEntry[] {
  let history: VocalRangeHistoryEntry[] = [];
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(VOCAL_RANGE_HISTORY_KEY);
      if (saved) history = JSON.parse(saved);
    }
  } catch {}

  if (history.length > 0) {
    return history;
  }

  // If no history yet, check if there is an existing saved vocal range
  const activeRange = currentRange || (() => {
    try {
      if (typeof window !== 'undefined') {
        const s = localStorage.getItem(VOCAL_RANGE_SAVED_KEY);
        return s ? JSON.parse(s) as VocalRangeData : null;
      }
    } catch {}
    return null;
  })();

  if (activeRange && activeRange.noteMin && activeRange.noteMax) {
    let minHz = activeRange.minHz || noteNameToHz(activeRange.noteMin);
    let maxHz = activeRange.maxHz || noteNameToHz(activeRange.noteMax);
    if (minHz <= 0) minHz = 98;
    if (maxHz <= 0) maxHz = 523;

    const oct = parseFloat((Math.log2(maxHz / minHz)).toFixed(1)) || 2.0;
    const initialEntry: VocalRangeHistoryEntry = {
      id: 'eval-initial',
      date: getTodayStr(),
      label: 'Prueba 1',
      minPitch: Math.round(minHz),
      maxPitch: Math.round(maxHz),
      noteMin: activeRange.noteMin,
      noteMax: activeRange.noteMax,
      octaves: oct,
      rangeLabel: activeRange.classification || 'Vocal',
    };

    return [initialEntry];
  }

  return [];
}

/**
 * Passive auto-expansion engine (unidirectional ratchet):
 * If a confirmed pitch is lower than minHz or higher than maxHz,
 * it expands the user's vocal boundary permanently.
 */
export function checkAndExpandVocalRange(
  pitchHz: number,
  noteName: string,
  source: 'afinador' | 'academia' | 'manual'
): ExpansionResult | null {
  if (typeof window === 'undefined' || !pitchHz || pitchHz < 50 || pitchHz > 1200) return null;

  try {
    const rawSaved = localStorage.getItem(VOCAL_RANGE_SAVED_KEY);
    if (!rawSaved) return null;

    const currentRange: VocalRangeData = JSON.parse(rawSaved);
    let currentMinHz = currentRange.minHz || noteNameToHz(currentRange.noteMin);
    let currentMaxHz = currentRange.maxHz || noteNameToHz(currentRange.noteMax);

    if (currentMinHz <= 0 || currentMaxHz <= 0) return null;

    const roundedHz = Math.round(pitchHz);
    let expandedMin = false;
    let expandedMax = false;

    // Ratchet rule: only expand outward
    if (roundedHz < currentMinHz) {
      expandedMin = true;
      currentMinHz = roundedHz;
    }
    if (roundedHz > currentMaxHz) {
      expandedMax = true;
      currentMaxHz = roundedHz;
    }

    if (!expandedMin && !expandedMax) {
      return null;
    }

    const minNoteInfo = hzToNoteName(currentMinHz);
    const maxNoteInfo = hzToNoteName(currentMaxHz);
    const octavesNum = parseFloat((Math.log2(currentMaxHz / currentMinHz)).toFixed(1));
    const gender = currentRange.gender === 'femenino' ? 'female' : 'male';
    const classificationObj = classifyVoice(currentMinHz, currentMaxHz, gender);

    const updatedRange: VocalRangeData = {
      minHz: currentMinHz,
      maxHz: currentMaxHz,
      noteMin: minNoteInfo.fullName,
      noteMax: maxNoteInfo.fullName,
      classification: classificationObj.classification,
      gender: currentRange.gender
    };

    localStorage.setItem(VOCAL_RANGE_SAVED_KEY, JSON.stringify(updatedRange));
    localStorage.setItem('laclave_vocal_range_classification', classificationObj.classification);

    // Append expansion milestone to history
    const savedHistory = localStorage.getItem(VOCAL_RANGE_HISTORY_KEY);
    const history: VocalRangeHistoryEntry[] = savedHistory ? JSON.parse(savedHistory) : [];

    const expansionEntry: VocalRangeHistoryEntry = {
      id: `exp-${Date.now()}`,
      date: getTodayStr(),
      label: expandedMin && expandedMax
        ? 'Doble Expansión'
        : expandedMin
        ? 'Expansión Grave'
        : 'Expansión Aguda',
      minPitch: currentMinHz,
      maxPitch: currentMaxHz,
      noteMin: minNoteInfo.fullName,
      noteMax: maxNoteInfo.fullName,
      octaves: octavesNum,
      rangeLabel: classificationObj.classification,
    };

    history.push(expansionEntry);
    localStorage.setItem(VOCAL_RANGE_HISTORY_KEY, JSON.stringify(history));

    const result: ExpansionResult = {
      expanded: true,
      expandedMin,
      expandedMax,
      previousMinNote: currentRange.noteMin,
      previousMaxNote: currentRange.noteMax,
      newMinNote: minNoteInfo.fullName,
      newMaxNote: maxNoteInfo.fullName,
      newOctaves: octavesNum
    };

    window.dispatchEvent(new CustomEvent('laclave_vocal_range_updated', {
      detail: { newRange: updatedRange, result, source }
    }));

    return result;
  } catch {
    return null;
  }
}

/**
 * 6-day calibration cadence checker
 */
export function isVocalRangeCheckDue(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const rawSaved = localStorage.getItem(VOCAL_RANGE_SAVED_KEY);
    if (!rawSaved) return false; // Needs initial calibration first

    // Check if snooze is active
    const snoozedUntilStr = localStorage.getItem(VOCAL_RANGE_SNOOZED_KEY);
    if (snoozedUntilStr) {
      const snoozedUntil = parseInt(snoozedUntilStr, 10);
      if (!isNaN(snoozedUntil) && Date.now() < snoozedUntil) {
        return false;
      }
    }

    const lastCheckStr = localStorage.getItem(VOCAL_RANGE_LAST_CHECK_KEY);
    if (!lastCheckStr) {
      // Has range but never checked cadence: consider due
      return true;
    }

    const lastCheckTime = parseInt(lastCheckStr, 10);
    if (isNaN(lastCheckTime)) return true;

    return (Date.now() - lastCheckTime) >= SIX_DAYS_MS;
  } catch {
    return false;
  }
}

export function snoozeVocalRangeCheck(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VOCAL_RANGE_SNOOZED_KEY, String(Date.now() + TWENTY_FOUR_HOURS_MS));
  } catch {}
}

export function markVocalRangeCheckCompleted(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VOCAL_RANGE_LAST_CHECK_KEY, String(Date.now()));
    localStorage.removeItem(VOCAL_RANGE_SNOOZED_KEY);
  } catch {}
}

/**
 * Compares an evaluation test result with previously saved records.
 * Returns 1 of 5 scenarios: dual, lowest, highest, protected, or first.
 */
export function getEvaluationComparison(newMinHz: number, newMaxHz: number): EvaluationComparison {
  const minNote = hzToNoteName(newMinHz).fullName;
  const maxNote = hzToNoteName(newMaxHz).fullName;
  const octavesStr = (Math.log2(newMaxHz / newMinHz)).toFixed(1);

  const createFirstRecord = (): EvaluationComparison => ({
    type: 'first',
    title: '¡Línea Base Registrada!',
    message: `Has establecido tu punto de partida con ${octavesStr} octavas (${minNote} a ${maxNote}). A partir de ahora, cada nota que cantes en Afinador y Academia ayudará a expandir tu voz.`,
    newMinNote: minNote,
    newMaxNote: maxNote,
    octaves: octavesStr
  });

  if (typeof window === 'undefined') {
    return createFirstRecord();
  }

  try {
    const rawSaved = localStorage.getItem(VOCAL_RANGE_SAVED_KEY);
    if (!rawSaved) {
      return createFirstRecord();
    }

    const prev: VocalRangeData = JSON.parse(rawSaved);
    const prevMinHz = prev.minHz || noteNameToHz(prev.noteMin);
    const prevMaxHz = prev.maxHz || noteNameToHz(prev.noteMax);

    const expandedMin = prevMinHz > 0 && newMinHz < prevMinHz;
    const expandedMax = prevMaxHz > 0 && newMaxHz > prevMaxHz;

    if (expandedMin && expandedMax) {
      return {
        type: 'dual',
        title: '¡Doble Expansión de Rango Vocal!',
        message: `¡Increíble! Rompiste tus límites tanto en graves como en agudos. Expandiste tu voz desde ${minNote} hasta ${maxNote}, alcanzando ${octavesStr} octavas. ¡Tus cuerdas vocales tienen mayor elasticidad y control!`,
        previousMinNote: prev.noteMin,
        previousMaxNote: prev.noteMax,
        newMinNote: minNote,
        newMaxNote: maxNote,
        octaves: octavesStr
      };
    }

    if (expandedMin) {
      return {
        type: 'lowest',
        title: '¡Nuevo Límite en Notas Graves!',
        message: `¡Excelente relajación laríngea! Lograste bajar hasta ${minNote}, ganando mayor profundidad y peso en tu registro bajo sin forzar.`,
        previousMinNote: prev.noteMin,
        previousMaxNote: prev.noteMax,
        newMinNote: minNote,
        newMaxNote: maxNote,
        octaves: octavesStr
      };
    }

    if (expandedMax) {
      return {
        type: 'highest',
        title: '¡Nuevo Récord en Notas Agudas!',
        message: `¡Espectacular soporte y proyección! Conquistaste la nota ${maxNote}, elevando tu techo vocal y ampliando tu tesitura hacia arriba.`,
        previousMinNote: prev.noteMin,
        previousMaxNote: prev.noteMax,
        newMinNote: minNote,
        newMaxNote: maxNote,
        octaves: octavesStr
      };
    }

    // Protected record: user did not expand, but historic record is safe!
    return {
      type: 'protected',
      title: 'Calibración Completada: Récord Protegido',
      message: `Tu mejor marca histórica sigue 100% protegida e intacta en ${prev.noteMin} - ${prev.noteMax}. La flexibilidad vocal cambia según la hora del día y el descanso; ¡mantener la voz activa es la clave para tu próxima expansión!`,
      previousMinNote: prev.noteMin,
      previousMaxNote: prev.noteMax,
      newMinNote: minNote,
      newMaxNote: maxNote,
      octaves: octavesStr
    };
  } catch {
    return {
      type: 'first',
      title: '¡Línea Base Registrada!',
      message: `Has establecido tu punto de partida con ${octavesStr} octavas (${minNote} a ${maxNote}).`,
      newMinNote: minNote,
      newMaxNote: maxNote,
      octaves: octavesStr
    };
  }
}
