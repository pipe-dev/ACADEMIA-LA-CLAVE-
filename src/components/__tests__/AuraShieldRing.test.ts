import assert from 'node:assert/strict';
import { calculateAuraDashOffset, getBadgeVisibility } from '../AuraShieldRing';

console.log('--- Testing AuraShieldRing helpers ---');

// Radius 52 -> circumference = 2 * Math.PI * 52 ≈ 326.7256
const radius = 52;
const circumference = 2 * Math.PI * radius;

// 1. Arc offset calculations
const offset100 = calculateAuraDashOffset(100, radius);
assert(Math.abs(offset100 - 0) < 0.01, '100% progress should have ~0 offset (full circle)');

const offset0 = calculateAuraDashOffset(0, radius);
assert(Math.abs(offset0 - circumference) < 0.01, '0% progress should have offset equal to circumference (empty)');

const offset50 = calculateAuraDashOffset(50, radius);
assert(Math.abs(offset50 - circumference * 0.5) < 0.01, '50% progress should be half circumference');

// 2. Badge visibility thresholds
// Neutral zone: 30 < progress < 75 -> NO badges visible
const midVisibility = getBadgeVisibility(50);
assert.equal(midVisibility.showVictory, false, '50% should not show victory badge');
assert.equal(midVisibility.showDanger, false, '50% should not show danger badge');

const boundary40 = getBadgeVisibility(40);
assert.equal(boundary40.showVictory, false, '40% should not show victory badge');
assert.equal(boundary40.showDanger, false, '40% should not show danger badge');

// Victory zone: progress >= 75 -> Trophy badge visible
const victory75 = getBadgeVisibility(75);
assert.equal(victory75.showVictory, true, '75% should show victory badge');
assert.equal(victory75.showDanger, false, '75% should not show danger badge');

const victory90 = getBadgeVisibility(90);
assert.equal(victory90.showVictory, true, '90% should show victory badge');
assert.equal(victory90.showDanger, false, '90% should not show danger badge');

// Danger zone: progress <= 30 -> Heart badge visible
const danger30 = getBadgeVisibility(30);
assert.equal(danger30.showVictory, false, '30% should not show victory badge');
assert.equal(danger30.showDanger, true, '30% should show danger badge');

const danger10 = getBadgeVisibility(10);
assert.equal(danger10.showVictory, false, '10% should not show victory badge');
assert.equal(danger10.showDanger, true, '10% should show danger badge');

console.log('🎉 ALL AuraShieldRing tests passed!');
