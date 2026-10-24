import assert from 'node:assert/strict';
import {
  calculateCentsOff,
  getOctaveDisplacement,
  DIFFICULTY_PITCH_TOLERANCES,
  FREE_MODE_PITCH_TOLERANCES
} from '../pitchUtils';

console.log('--- Running pitchUtils and tolerance tests ---');

// 1. User reported case: Singing 113 Hz against C3 (130.81 Hz)
const userC3 = 130.81;
const userDetected = 113;
const userCentsOff = calculateCentsOff(userDetected, userC3);
console.log(`C3 (130.81Hz) vs 113Hz: ${userCentsOff.toFixed(1)} cents`);

// 113 Hz should be roughly -253 cents (over 2.5 semitones flat!)
assert(userCentsOff < -250 && userCentsOff > -255, '113Hz against C3 should be ~ -253 cents');

// In Fácil mode, tolerance is 28 cents and nearMiss is 45 cents
const facilTols = DIFFICULTY_PITCH_TOLERANCES['Fácil'];
assert.equal(Math.abs(userCentsOff) <= facilTols.toleranceCents, false, '113Hz MUST NOT be marked in-tune for C3');
assert.equal(Math.abs(userCentsOff) <= facilTols.nearMissCents, false, '113Hz MUST NOT be in near-miss zone for C3');

// In Free mode (facil), tolerance is 28 cents
const freeFacil = FREE_MODE_PITCH_TOLERANCES['facil'];
assert.equal(Math.abs(userCentsOff) <= freeFacil.toleranceCents, false, '113Hz MUST NOT be in-tune in Modo Libre');

// 2. In-tune singing on C3 (130.81 Hz)
// Singing 131.5 Hz (just 9 cents sharp)
const inTuneC3 = calculateCentsOff(131.5, userC3);
assert(Math.abs(inTuneC3) <= facilTols.toleranceCents, '131.5Hz should be matched in Fácil mode');

// 3. Near-miss singing on C3: 133.5 Hz (~35 cents sharp)
const nearMissC3 = calculateCentsOff(133.5, userC3);
assert(Math.abs(nearMissC3) > facilTols.toleranceCents, '133.5Hz should NOT be matched in Fácil mode');
assert(Math.abs(nearMissC3) <= facilTols.nearMissCents, '133.5Hz SHOULD be in near-miss zone (no life penalty)');

// 4. Calentamiento tests
const calTols = DIFFICULTY_PITCH_TOLERANCES['Calentamiento'];
assert.equal(calTols.toleranceCents, 32, 'Calentamiento tolerance should be 32 cents');
// 113 Hz in Calentamiento MUST fail
assert.equal(Math.abs(userCentsOff) <= calTols.toleranceCents, false, '113Hz MUST fail in Calentamiento');

// 5. Test high pitch: A4 (440 Hz)
// 440 Hz + 100 cents (A#4) = 466.16 Hz
const aSharp4 = 466.16;
const aSharpCents = calculateCentsOff(aSharp4, 440);
assert(Math.abs(aSharpCents - 100) < 0.5, 'Semitone ratio should be ~100 cents');

// Maestro mode on A4: tolerance 8 cents. 442 Hz is 7.8 cents sharp.
const maestroTols = DIFFICULTY_PITCH_TOLERANCES['Maestro'];
const a442Cents = calculateCentsOff(442, 440);
assert(Math.abs(a442Cents) <= maestroTols.toleranceCents, '442Hz should pass Maestro mode');
const a443Cents = calculateCentsOff(443, 440);
assert(Math.abs(a443Cents) > maestroTols.toleranceCents, '443Hz should fail Maestro mode');

// 6. Test octave displacement helper
const c4Hz = 261.63;
const c3Hz = 130.81;
const c5Hz = 523.25;
const c2Hz = 65.41;

assert.equal(getOctaveDisplacement(c4Hz, c4Hz), 0, 'Same octave should yield displacement 0');
assert.equal(getOctaveDisplacement(c3Hz, c4Hz), -1, 'C3 against C4 should yield displacement -1');
assert.equal(getOctaveDisplacement(c5Hz, c4Hz), 1, 'C5 against C4 should yield displacement 1');
assert.equal(getOctaveDisplacement(c2Hz, c4Hz), -2, 'C2 against C4 should yield displacement -2');
console.log('Octave displacement tests passed');

console.log('ALL pitchUtils tests passed successfully!');
