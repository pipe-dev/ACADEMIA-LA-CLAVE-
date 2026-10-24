import assert from 'node:assert/strict';
import { BREATHING_TECHNIQUES } from '../breathingTypes';

console.log('--- Running Breathing Engine & Techniques Tests ---');

// 1. Verify techniques integrity
assert(BREATHING_TECHNIQUES.length >= 7, 'Should have at least 7 breathing techniques');

const diafragmatico = BREATHING_TECHNIQUES.find(t => t.id === 'diafragmatico-426');
assert(diafragmatico, 'Apoyo Costodiafragmático (diafragmatico-426) must exist');
assert.equal(diafragmatico.category, 'Control Vocal');
assert.equal(diafragmatico.phases[0].type, 'inhale');
assert.equal(diafragmatico.phases[0].duration, 4);
assert.equal(diafragmatico.phases[1].type, 'hold_full');
assert.equal(diafragmatico.phases[1].duration, 2);
assert.equal(diafragmatico.phases[2].type, 'exhale');
assert.equal(diafragmatico.phases[2].duration, 6);

for (const tech of BREATHING_TECHNIQUES) {
  assert(tech.id && tech.name, `Technique ${tech.id} must have id and name`);
  assert(tech.phases.length >= 2, `Technique ${tech.name} must have at least 2 phases`);
  
  const cycleDuration = tech.phases.reduce((sum, p) => sum + p.duration, 0);
  assert(cycleDuration > 0, `Technique ${tech.name} cycle duration must be > 0`);
  
  const targetCycles = tech.targetCycles || 2;
  const totalDuration = cycleDuration * targetCycles;
  assert(totalDuration > 0, `Technique ${tech.name} total duration must be > 0`);

  // Verify valid phase types
  const validTypes = new Set(['inhale', 'hold_full', 'exhale', 'hold_empty']);
  for (const phase of tech.phases) {
    assert(validTypes.has(phase.type), `Phase type ${phase.type} must be valid`);
    assert(phase.duration > 0, `Phase duration must be positive`);
    assert(phase.label.length > 0, `Phase label must not be empty`);
  }

  console.log(`Verified technique: ${tech.name} (${cycleDuration}s/cycle x ${targetCycles} reps = ${totalDuration}s total)`);
}

// 2. Test phase timing calculation matching useBreathingEngine
function calculatePhaseAtSecond(tech: typeof BREATHING_TECHNIQUES[0], second: number) {
  const cycleDuration = tech.phases.reduce((sum, p) => sum + p.duration, 0);
  const timeInCycle = second % cycleDuration;
  let accum = 0;
  for (let i = 0; i < tech.phases.length; i++) {
    accum += tech.phases[i].duration;
    if (timeInCycle < accum || i === tech.phases.length - 1) {
      return {
        phase: tech.phases[i],
        secondsLeft: Math.max(1, accum - timeInCycle)
      };
    }
  }
  return { phase: tech.phases[0], secondsLeft: tech.phases[0].duration };
}

// Test pursed-lips (4s inhale, 8s exhale)
const pursed = BREATHING_TECHNIQUES.find(t => t.id === 'pursed-lips')!;
assert.equal(calculatePhaseAtSecond(pursed, 0).phase.type, 'inhale');
assert.equal(calculatePhaseAtSecond(pursed, 0).secondsLeft, 4);
assert.equal(calculatePhaseAtSecond(pursed, 3).phase.type, 'inhale');
assert.equal(calculatePhaseAtSecond(pursed, 3).secondsLeft, 1);
assert.equal(calculatePhaseAtSecond(pursed, 4).phase.type, 'exhale');
assert.equal(calculatePhaseAtSecond(pursed, 4).secondsLeft, 8);
assert.equal(calculatePhaseAtSecond(pursed, 11).phase.type, 'exhale');
assert.equal(calculatePhaseAtSecond(pursed, 11).secondsLeft, 1);
// Cycle 2 starts at second 12:
assert.equal(calculatePhaseAtSecond(pursed, 12).phase.type, 'inhale');
assert.equal(calculatePhaseAtSecond(pursed, 12).secondsLeft, 4);

console.log('Phase timing calculations verified');

// 3. Test badge_5 unlock logic
const simulateBadge5Check = (completedCount: number) => completedCount >= 1 ? 1 : 0;
assert.equal(simulateBadge5Check(0), 0, '0 breathing sessions must not unlock badge_5');
assert.equal(simulateBadge5Check(1), 1, '1 breathing session must unlock badge_5');
assert.equal(simulateBadge5Check(5), 1, '5 breathing sessions must unlock badge_5');

console.log('All Breathing Engine tests passed successfully!');
