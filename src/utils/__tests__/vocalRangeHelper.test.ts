import assert from 'node:assert/strict';
import { getEvaluationComparison, recordVocalRangeEvaluation, VocalRangeData } from '../vocalRangeHelper';

console.log('--- Running vocalRangeHelper tests ---');

// Mock localStorage in Node environment
const storage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, value: string) => { storage[key] = String(value); },
  removeItem: (key: string) => { delete storage[key]; },
  clear: () => {
    for (const k of Object.keys(storage)) delete storage[k];
  }
};

(globalThis as any).window = {
  dispatchEvent: () => true
};
(globalThis as any).CustomEvent = class CustomEvent {
  detail: any;
  constructor(_name: string, opts?: any) {
    this.detail = opts?.detail;
  }
};
(globalThis as any).localStorage = mockLocalStorage;

// Scenario: User has a historical best record of Do2 to Do6 saved
mockLocalStorage.clear();
const initialSaved: VocalRangeData = {
  minHz: 65,
  maxHz: 1046,
  noteMin: 'Do2',
  noteMax: 'Do6',
  classification: 'Barítono',
  gender: 'masculino'
};
mockLocalStorage.setItem('laclave_vocal_range_saved', JSON.stringify(initialSaved));

// Test 1: getEvaluationComparison when current test is Sol2 (98 Hz) to Fa#4 (370 Hz)
const comparison = getEvaluationComparison(98, 370);
assert.equal(comparison.type, 'protected', 'Test within historical bounds must return protected record type');
assert.equal(comparison.title, 'Calibración Completada: Récord Protegido');
assert.ok(comparison.message.includes('Do2 - Do6'), 'Protected message must mention previous record Do2 - Do6');
assert.equal(comparison.newMinNote, 'Sol2', 'Comparison must record actual tested min note Sol2');
assert.equal(comparison.newMaxNote, 'Fa#4', 'Comparison must record actual tested max note Fa#4');

// Test 2: recordVocalRangeEvaluation saves REAL test in history and PROTECTED record in saved profile
const evalTest: VocalRangeData = {
  minHz: 98,
  maxHz: 370,
  noteMin: 'Sol2',
  noteMax: 'Fa#4',
  classification: 'Barítono',
  gender: 'masculino'
};
const ratchetedRecord: VocalRangeData = {
  minHz: 65,
  maxHz: 1046,
  noteMin: 'Do2',
  noteMax: 'Do6',
  classification: 'Barítono',
  gender: 'masculino'
};

const savedResult = recordVocalRangeEvaluation(evalTest, ratchetedRecord);

// Check that returned and persisted active range is the protected record
assert.equal(savedResult.noteMin, 'Do2', 'Active profile must protect minimum record Do2');
assert.equal(savedResult.noteMax, 'Do6', 'Active profile must protect maximum record Do6');

const savedInStorage = JSON.parse(mockLocalStorage.getItem('laclave_vocal_range_saved') || '{}');
assert.equal(savedInStorage.noteMin, 'Do2');
assert.equal(savedInStorage.noteMax, 'Do6');

// Check that history records the REAL evaluated test (Sol2 to Fa#4, NOT Do2 to Do6!)
const historyInStorage = JSON.parse(mockLocalStorage.getItem('laclave_vocal_range_history_v1') || '[]');
assert.equal(historyInStorage.length, 1, 'Should have 1 history entry');
const entry = historyInStorage[0];
assert.equal(entry.noteMin, 'Sol2', 'History entry must record real tested Sol2');
assert.equal(entry.noteMax, 'Fa#4', 'History entry must record real tested Fa#4');
assert.equal(entry.minPitch, 98, 'History minPitch must be real 98 Hz');
assert.equal(entry.maxPitch, 370, 'History maxPitch must be real 370 Hz');
assert.equal(entry.octaves, 1.9, 'History octaves must be real ~1.9');

console.log('All vocalRangeHelper tests passed successfully!');
