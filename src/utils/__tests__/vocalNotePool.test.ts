import assert from 'assert';
import fs from 'fs';
import path from 'path';
import {
  generateUserNotePool,
  getComfortableChromaticNotes,
  getChromaticNoteByMidi,
  VOCAL_AUDIO_LIMITS
} from '../vocalNotePool';
import { generateIntervalChallenge } from '../../data/tunerLevelsData';

console.log('--- Testing Vocal Note Pool physical limits ---');

// 1. Test male default pool
const maleDefault = generateUserNotePool(null, 'masculino');
assert(maleDefault.length > 0, 'Male pool should not be empty');
assert(maleDefault[0].midi >= VOCAL_AUDIO_LIMITS.masculino.minMidi, 'Male note cannot be below G2 (43)');
assert(maleDefault[maleDefault.length - 1].midi <= VOCAL_AUDIO_LIMITS.masculino.maxMidi, 'Male note cannot be above B4 (71)');
console.log('✅ Male default pool within [43, 71]: min =', maleDefault[0].midi, 'max =', maleDefault[maleDefault.length - 1].midi);

// 2. Test female default pool
const femaleDefault = generateUserNotePool(null, 'femenino');
assert(femaleDefault.length > 0, 'Female pool should not be empty');
assert(femaleDefault[0].midi >= VOCAL_AUDIO_LIMITS.femenino.minMidi, 'Female note cannot be below A3 (57)');
assert(femaleDefault[femaleDefault.length - 1].midi <= VOCAL_AUDIO_LIMITS.femenino.maxMidi, 'Female note cannot be above F#5 (78)');
console.log('✅ Female default pool within [57, 78]: min =', femaleDefault[0].midi, 'max =', femaleDefault[femaleDefault.length - 1].midi);

// 3. Test extreme user range clamping (e.g. C1 to C8)
const extremeRange = { noteMin: 'C1', noteMax: 'C8', minHz: 30, maxHz: 4000 };
const maleClamped = generateUserNotePool(extremeRange, 'masculino');
assert.strictEqual(maleClamped[0].midi, 43, 'Male min must clamp exactly to 43 (G2)');
assert.strictEqual(maleClamped[maleClamped.length - 1].midi, 71, 'Male max must clamp exactly to 71 (B4)');

const femaleClamped = generateUserNotePool(extremeRange, 'femenino');
assert.strictEqual(femaleClamped[0].midi, 57, 'Female min must clamp exactly to 57 (A3)');
assert.strictEqual(femaleClamped[femaleClamped.length - 1].midi, 78, 'Female max must clamp exactly to 78 (Fs5)');
console.log('✅ Extreme ranges properly clamped to physical bounds');

// 4. Test chromatic keyboard notes for male and female
const maleChrom = getComfortableChromaticNotes(null, 'masculino');
assert.strictEqual(maleChrom.allNotes.length, 12, 'Must have 12 chromatic notes');
maleChrom.allNotes.forEach(note => {
  assert(note.midi >= 43 && note.midi <= 71, `Male chromatic note ${note.fullName} (${note.midi}) out of bounds`);
});

const femaleChrom = getComfortableChromaticNotes(null, 'femenino');
assert.strictEqual(femaleChrom.allNotes.length, 12, 'Must have 12 chromatic notes');
femaleChrom.allNotes.forEach(note => {
  assert(note.midi >= 57 && note.midi <= 78, `Female chromatic note ${note.fullName} (${note.midi}) out of bounds`);
});
console.log('✅ Chromatic 12-key buttons strictly within physical audio limits');

// 5. Verify every note in the pool has a matching file in public/sounds
const soundsDir = path.resolve(process.cwd(), 'public/sounds');
if (fs.existsSync(soundsDir)) {
  for (const n of maleClamped) {
    const americanName = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B'][n.midi % 12];
    const fileName = `masculino_${americanName}${n.octave}.mp3`;
    const fullPath = path.join(soundsDir, fileName);
    assert(fs.existsSync(fullPath), `Missing audio file on disk: ${fileName}`);
  }

  for (const n of femaleClamped) {
    const americanName = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B'][n.midi % 12];
    const fileName = `femenino_${americanName}${n.octave}.mp3`;
    const fullPath = path.join(soundsDir, fileName);
    assert(fs.existsSync(fullPath), `Missing audio file on disk: ${fileName}`);
  }
  console.log('✅ 100% of generated notes have physical audio files in public/sounds/');
}

// 6. Personalized octave placement (keyed to each user's OWN range, not a fixed gender octave)
const bajoRange = { noteMin: 'Mi2', noteMax: 'Mi4', minHz: 82, maxHz: 330, classification: 'Bajo', gender: 'masculino' as const };
const bajoChrom = getComfortableChromaticNotes(bajoRange, 'masculino');
bajoChrom.allNotes.forEach(n => {
  assert(n.midi >= 43 && n.midi <= 64, `Bajo keyboard note ${n.fullName} (${n.midi}) escapes his own window`);
  assert(n.hasRecording, `Bajo note ${n.fullName} should have a real male recording`);
});
assert.strictEqual(bajoChrom.allNotes[0].midi, 48, 'Bajo keyboard should sit at Do3 (C3), low floor of his range');

const baritonoRange = { noteMin: 'La2', noteMax: 'Sol4', minHz: 98, maxHz: 400, classification: 'Barítono', gender: 'masculino' as const };
const baritonoChrom = getComfortableChromaticNotes(baritonoRange, 'masculino');
baritonoChrom.allNotes.forEach(n => {
  assert(n.midi >= 45 && n.midi <= 67, `Barítono keyboard note ${n.fullName} (${n.midi}) escapes his own window`);
  assert(n.hasRecording, `Barítono note ${n.fullName} should have a real male recording`);
});
assert.strictEqual(baritonoChrom.allNotes[0].midi, 48, 'Barítono keyboard should sit at Do3 — the only complete octave inside his window');

const tenorRange = { noteMin: 'Do3', noteMax: 'Do5', minHz: 130, maxHz: 520, classification: 'Tenor', gender: 'masculino' as const };
const tenorChrom = getComfortableChromaticNotes(tenorRange, 'masculino');
tenorChrom.allNotes.forEach(n => {
  assert(n.midi >= 48 && n.midi <= 72, `Tenor keyboard note ${n.fullName} (${n.midi}) escapes his own window`);
  assert(n.hasRecording, `Tenor note ${n.fullName} should have a real male recording`);
});
assert.strictEqual(tenorChrom.allNotes[0].midi, 60, 'Tenor keyboard should rise to Do4 (C4), his tessitura center — not the fixed male octave 3');

const contraltoRange = { noteMin: 'Fa3', noteMax: 'Fa5', minHz: 165, maxHz: 700, classification: 'Contralto', gender: 'femenino' as const };
const contraltoChrom = getComfortableChromaticNotes(contraltoRange, 'femenino');
contraltoChrom.allNotes.forEach(n => {
  assert(n.midi >= 53 && n.midi <= 77, `Contralto keyboard note ${n.fullName} (${n.midi}) escapes her own window`);
  assert(n.hasRecording, `Contralto note ${n.fullName} should have a real female recording`);
});
assert.strictEqual(contraltoChrom.allNotes[0].midi, 60, 'Contralto keyboard should sit at Do4 (C4), inside her range');

const mezzoRange = { noteMin: 'La3', noteMax: 'La5', minHz: 195, maxHz: 900, classification: 'Mezzosoprano', gender: 'femenino' as const };
const mezzoChrom = getComfortableChromaticNotes(mezzoRange, 'femenino');
mezzoChrom.allNotes.forEach(n => {
  assert(n.midi >= 57 && n.midi <= 81, `Mezzo keyboard note ${n.fullName} (${n.midi}) escapes her own window`);
  assert(n.hasRecording, `Mezzo note ${n.fullName} should have a real female recording`);
});
assert.strictEqual(mezzoChrom.allNotes[0].midi, 60, 'Mezzo keyboard should sit at Do4 (C4)');

const sopranoRange = { noteMin: 'Do4', noteMax: 'Do6', minHz: 260, maxHz: 1050, classification: 'Soprano', gender: 'femenino' as const };
const sopranoChrom = getComfortableChromaticNotes(sopranoRange, 'femenino');
sopranoChrom.allNotes.forEach(n => {
  assert(n.midi >= 60 && n.midi <= 84, `Soprano keyboard note ${n.fullName} (${n.midi}) escapes her own window`);
  assert(n.hasRecording, `Soprano note ${n.fullName} should have a real female recording`);
});
assert.strictEqual(sopranoChrom.allNotes[0].midi, 60, 'Soprano keyboard should sit at Do4 (C4)');

// 6b. Defaults (no range data): same comfortable octaves as before (male Do3, female Do4)
const maleChromDefault = getComfortableChromaticNotes(null, 'masculino');
assert.strictEqual(maleChromDefault.allNotes[0].midi, 48, 'Male default keyboard stays at Do3');
const femaleChromDefault = getComfortableChromaticNotes(null, 'femenino');
assert.strictEqual(femaleChromDefault.allNotes[0].midi, 60, 'Female default keyboard stays at Do4');
console.log('✅ Personalized octaves: Bajo+Barítono Do3 / Tenor Do4 / Contralto+Mezzo+Soprano Do4 / defaults intact');

// 6c. Narrow window (smaller than one octave): falls back to tier 2 — a full octave inside the recordings
const narrowRange = { noteMin: 'Do4', noteMax: 'Fa#4', minHz: 260, maxHz: 380, gender: 'femenino' as const };
const narrowChrom = getComfortableChromaticNotes(narrowRange, 'femenino');
assert(narrowChrom.allNotes.every(n => n.midi >= 60 && n.midi <= 71), 'Narrow window keyboard should use the full recorded octave Do4-Si4');
assert(narrowChrom.allNotes.every(n => n.hasRecording), 'Narrow window keyboard notes must all have recordings');
console.log('✅ Narrow windows fall back to a fully recorded octave (tier 2)');

// 7. getChromaticNoteByMidi keeps the TRUE octave (no mirroring) and flags missing recordings
const noMirrorHigh = getChromaticNoteByMidi(84, 'masculino'); // Do6 above male recordings
assert.strictEqual(noMirrorHigh.midi, 84, 'MIDI must NOT be mirrored (was 72 before)');
assert.strictEqual(noMirrorHigh.fullName, 'Do6', 'Octave-morph removed: the note stays Do6');
assert.strictEqual(noMirrorHigh.hasRecording, false, 'Do6 has no male mp3 → hasRecording false (synth covers it)');

const noMirrorLow = getChromaticNoteByMidi(41, 'masculino'); // Fa2 below male recordings
assert.strictEqual(noMirrorLow.midi, 41, 'Low out-of-range MIDI must NOT be mirrored (was 53 before)');
assert.strictEqual(noMirrorLow.fullName, 'Fa2', 'The note stays Fa2');
assert.strictEqual(noMirrorLow.hasRecording, false, 'Fa2 has no male mp3 → hasRecording false');

const inRangeNote = getChromaticNoteByMidi(64, 'masculino'); // Mi4
assert.strictEqual(inRangeNote.fullName, 'Mi4');
assert.strictEqual(inRangeNote.hasRecording, true, 'Mi4 is within male recordings (43-71)');

const femaleHighNote = getChromaticNoteByMidi(77, 'femenino'); // Fa5
assert.strictEqual(femaleHighNote.fullName, 'Fa5');
assert.strictEqual(femaleHighNote.hasRecording, true, 'Fa5 is within female recordings (57-78)');
console.log('✅ getChromaticNoteByMidi no longer morphs octaves; hasRecording flag correct');

// 8. Octave arrows: gender-aware visual disambiguation
// Masculino: base = octava 3 (neutral). Octava 2 = ▼ (grave). Octava 4 = ▲ (aguda).
// Femenino:  base = octava 4 (neutral). Octava 3 = ▼ (grave). Octava 5 = ▲ (aguda).

// Bajo y Barítono en octava base 3 no tienen flecha
bajoChrom.allNotes.forEach(n =>
  assert.strictEqual(n.octaveArrow, null, `Bajo key ${n.fullName} in base octave 3 must be neutral`)
);
baritonoChrom.allNotes.forEach(n =>
  assert.strictEqual(n.octaveArrow, null, `Barítono key ${n.fullName} in base octave 3 must be neutral`)
);
// Tenor en octava 4 (aguda masculina) muestra ▲
tenorChrom.allNotes.forEach(n =>
  assert.strictEqual(n.octaveArrow, 'up', `Tenor key ${n.fullName} in octave 4 must show ▲ (acute)`)
);

// Mujeres en octava base 4 no tienen flecha
contraltoChrom.allNotes.forEach(n => assert.strictEqual(n.octaveArrow, null));
mezzoChrom.allNotes.forEach(n => assert.strictEqual(n.octaveArrow, null));
sopranoChrom.allNotes.forEach(n => assert.strictEqual(n.octaveArrow, null));

// Pruebas individuales de notas por MIDI y género
assert.strictEqual(getChromaticNoteByMidi(45, 'masculino').octaveArrow, 'down', 'La2 masc → ▼ (grave)');
assert.strictEqual(getChromaticNoteByMidi(57, 'masculino').octaveArrow, null, 'La3 masc → neutral');
assert.strictEqual(getChromaticNoteByMidi(69, 'masculino').octaveArrow, 'up', 'La4 masc → ▲ (aguda)');
assert.strictEqual(getChromaticNoteByMidi(84, 'masculino').octaveArrow, 'up', 'Do6 masc → ▲ (acute)');
assert.strictEqual(getChromaticNoteByMidi(41, 'masculino').octaveArrow, 'down', 'Fa2 masc → ▼ (grave)');

assert.strictEqual(getChromaticNoteByMidi(57, 'femenino').octaveArrow, 'down', 'La3 fem → ▼ (grave contralto)');
assert.strictEqual(getChromaticNoteByMidi(69, 'femenino').octaveArrow, null, 'La4 fem → neutral');
assert.strictEqual(getChromaticNoteByMidi(77, 'femenino').octaveArrow, 'up', 'Fa5 fem → ▲ (aguda soprano)');

// 9. Multi-octave available navigation per voice type
assert.deepStrictEqual(bajoChrom.availableOctaves, [2, 3, 4], 'Bajo must access octaves 2, 3, 4');
assert.deepStrictEqual(baritonoChrom.availableOctaves, [2, 3, 4], 'Barítono must access octaves 2, 3, 4');
assert.deepStrictEqual(tenorChrom.availableOctaves, [3, 4], 'Tenor must access octaves 3, 4 (no octave 2 pedal)');
assert.deepStrictEqual(contraltoChrom.availableOctaves, [3, 4, 5], 'Contralto must access octaves 3, 4, 5');
assert.deepStrictEqual(mezzoChrom.availableOctaves, [3, 4, 5], 'Mezzo must access octaves 3, 4, 5');
assert.deepStrictEqual(sopranoChrom.availableOctaves, [4, 5], 'Soprano must access octaves 4, 5 (no octave 3 chest)');
console.log('✅ Octave arrows: gender-aware (Masc: 2▼ 3= 4▲ / Fem: 3▼ 4= 5▲) & multi-octave navigation verified');

// 10. forcedOctave safety: included and selected even when outside narrow user pool
const narrowUserRange = { noteMin: 'C3', noteMax: 'E3', minHz: 130, maxHz: 165 }; // Only octave 3
const forcedChrom = getComfortableChromaticNotes(narrowUserRange, 'masculino', 4);
assert(forcedChrom.availableOctaves.includes(4), 'forcedOctave 4 must be included in availableOctaves');
assert.strictEqual(forcedChrom.currentOctave, 4, 'currentOctave must equal forcedOctave 4');
assert.strictEqual(forcedChrom.allNotes.length, 12, 'Must have 12 notes in forced octave');
assert.strictEqual(forcedChrom.allNotes[0].fullName, 'Do4', 'First note in forced octave 4 must be Do4');
console.log('✅ forcedOctave safely added to availableOctaves and selected even for narrow pool');

// 11. generateIntervalChallenge never shrinks below 4 notes even on narrow pool
const narrowPool = generateUserNotePool({ noteMin: 'C3', noteMax: 'E3', minHz: 130, maxHz: 165 }, 'masculino');
const intervalChallenge = generateIntervalChallenge(1, narrowPool);
assert.strictEqual(intervalChallenge.length, 4, 'Interval challenge must always return 4 notes on narrow pool');
console.log('✅ generateIntervalChallenge guaranteed 4 notes on narrow pool (no shrinking)');

// 12. generateIntervalChallenge on full pool delivers true chord arpeggio (Root, 3rd, 5th, Octave)
const fullPool = generateUserNotePool(null, 'masculino');
const arpeggio = generateIntervalChallenge(1, fullPool);
assert.strictEqual(arpeggio.length, 4, 'Full pool must produce a 4-note chord arpeggio');
assert.strictEqual(arpeggio[3].midi - arpeggio[0].midi, 12, 'Arpeggio must span exactly 12 semitones (one octave)');
assert.strictEqual(arpeggio[2].midi - arpeggio[0].midi, 7, 'Third note in arpeggio must be a perfect 5th (+7 semitones)');
assert(
  arpeggio[1].midi - arpeggio[0].midi === 4 || arpeggio[1].midi - arpeggio[0].midi === 3,
  'Second note in arpeggio must be a major 3rd (+4) or minor 3rd (+3)'
);
console.log('✅ generateIntervalChallenge full pool delivers true ascending arpeggio [1, 3, 5, 8]');

console.log('🎉 ALL vocalNotePool tests passed successfully!');
