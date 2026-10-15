/**
 * Pitch and tuning utility functions.
 * In musical acoustics and vocal pedagogy, pitch difference is always evaluated
 * in CENTS (logarithmic ratio), never in raw linear Hz.
 * 
 * 1 semitone = 100 cents.
 * 50 cents = 1 quarter-tone (the absolute physical boundary between two distinct notes).
 * Pedagogical vocal tolerances:
 * - Calentamiento: ±32 cents (gentle vocal onset, but strictly within the true note)
 * - Fácil: ±28 cents (friendly for beginners; never exceeds 45 cents)
 * - Medio: ±20 cents (good amateur/intermediate intonation)
 * - Difícil: ±12 cents (advanced conservatory level)
 * - Maestro: ±8 cents (professional studio/concert pitch)
 */

export function calculateCentsOff(detectedHz: number, targetHz: number, allowOctaveEquivalence: boolean = true): number {
  if (!detectedHz || !targetHz || detectedHz <= 0 || targetHz <= 0) return 0;
  const rawCents = 1200 * Math.log2(detectedHz / targetHz);
  if (!allowOctaveEquivalence) return rawCents;
  // Folds into [-600, +600] cents so that singing the note in an octave equivalent
  // or autocorrelation octave doubling/halving evaluates intonation accurately.
  return ((rawCents + 600) % 1200 + 1200) % 1200 - 600;
}

export function calculateRawCentsOff(detectedHz: number, targetHz: number): number {
  if (!detectedHz || !targetHz || detectedHz <= 0 || targetHz <= 0) return 0;
  return 1200 * Math.log2(detectedHz / targetHz);
}

export interface DifficultyTolerances {
  toleranceCents: number;
  nearMissCents: number;
}

export const DIFFICULTY_PITCH_TOLERANCES: Record<string, DifficultyTolerances> = {
  Calentamiento: {
    toleranceCents: 32,
    nearMissCents: 45
  },
  'Fácil': {
    toleranceCents: 28,
    nearMissCents: 45
  },
  'Medio': {
    toleranceCents: 20,
    nearMissCents: 35
  },
  'Difícil': {
    toleranceCents: 12,
    nearMissCents: 22
  },
  'Maestro': {
    toleranceCents: 8,
    nearMissCents: 14
  }
};

export const FREE_MODE_PITCH_TOLERANCES: Record<string, DifficultyTolerances> = {
  facil: {
    toleranceCents: 28,
    nearMissCents: 45
  },
  medio: {
    toleranceCents: 18,
    nearMissCents: 32
  },
  dificil: {
    toleranceCents: 10,
    nearMissCents: 20
  }
};
