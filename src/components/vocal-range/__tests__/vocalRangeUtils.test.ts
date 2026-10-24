import assert from 'node:assert/strict';
import { classifyVoice, hzToNoteName } from '../vocalRangeUtils';
import { CLASSIFICATION_RANGES } from '../../../utils/vocalNotePool';

console.log('--- Running vocalRangeUtils and classifyVoice tests ---');

// 1. Canonical preset alignment tests:
// Every preset defined in CLASSIFICATION_RANGES must classify to its exact name.
for (const [name, preset] of Object.entries(CLASSIFICATION_RANGES)) {
  const gender = preset.gender === 'femenino' ? 'female' : 'male';
  const result = classifyVoice(preset.minHz, preset.maxHz, gender);
  console.log(`Preset ${name} (${preset.minHz}Hz - ${preset.maxHz}Hz, ${gender}) -> ${result.classification}`);
  assert.equal(
    result.classification,
    name,
    `Preset ${name} (${preset.minHz} - ${preset.maxHz} Hz) must classify as ${name}, got ${result.classification}`
  );
}

// 2. Female voice boundaries and edge cases
console.log('Testing female edge cases...');

// A Contralto with range 174 - 700 Hz (Fa3 - Fa5) must stay Contralto, NOT turn into Soprano
const contraltoReachingHigh = classifyVoice(174, 720, 'female');
assert.equal(contraltoReachingHigh.classification, 'Contralto', 'Contralto with strong chest tone must not become Soprano from reaching 720Hz');

// Mezzosoprano with standard range (200 - 850 Hz)
const standardMezzo = classifyVoice(200, 850, 'female');
assert.equal(standardMezzo.classification, 'Mezzosoprano', '200Hz - 850Hz female must be Mezzosoprano');

// Soprano with high floor (250 - 1000 Hz)
const highSoprano = classifyVoice(250, 1000, 'female');
assert.equal(highSoprano.classification, 'Soprano', '250Hz - 1000Hz female must be Soprano');

// Soprano who reaches 920 Hz with 210 Hz floor
const extendedSoprano = classifyVoice(210, 920, 'female');
assert.equal(extendedSoprano.classification, 'Soprano', 'Female reaching 920Hz with 210Hz floor should be Soprano');

// 3. Male voice boundaries and edge cases
console.log('Testing male edge cases...');

// Deep Bajo (75 - 340 Hz)
const deepBass = classifyVoice(75, 340, 'male');
assert.equal(deepBass.classification, 'Bajo', '75Hz - 340Hz male must be Bajo');

// Tenor with lowest note C3 (130 Hz) and highest note C5 (523 Hz)
const classicTenor = classifyVoice(130, 523, 'male');
assert.equal(classicTenor.classification, 'Tenor', 'Classic Tenor 130 - 523 Hz must be Tenor');

// Tenor with extended chest down to 115 Hz but reaching A4 (440 Hz) / B4 (493 Hz)
const highTenor = classifyVoice(115, 460, 'male');
assert.equal(highTenor.classification, 'Tenor', 'Tenor reaching 460Hz with 115Hz floor must be Tenor');

// True Baritone (105 - 390 Hz)
const pureBaritone = classifyVoice(105, 390, 'male');
assert.equal(pureBaritone.classification, 'Barítono', '105 - 390 Hz male must be Barítono');

// 4. hzToNoteName verification
console.log('Testing hzToNoteName...');
assert.equal(hzToNoteName(130.81).fullName, 'Do3', '130.81 Hz must be Do3');
assert.equal(hzToNoteName(261.63).fullName, 'Do4', '261.63 Hz must be Do4');
assert.equal(hzToNoteName(440.00).fullName, 'La4', '440 Hz must be La4');
assert.equal(hzToNoteName(82.41).fullName, 'Mi2', '82.41 Hz must be Mi2');

console.log('All vocalRangeUtils tests passed successfully!');
