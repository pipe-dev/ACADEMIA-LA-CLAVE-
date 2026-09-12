import {
  formatCountdown,
  calculateLifePrice,
  getTimeToNextLife,
  calculatePassiveRecharge,
  applyLifeDeduction,
  applyLifeAward,
  applyLifePurchase,
  MAX_LIVES,
  RECHARGE_INTERVAL_MS
} from '../livesEngine';
import { UserStats } from '../../types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ ${message}`);
  }
}

const mockStats: UserStats = {
  name: 'Test User',
  avatarUrl: '',
  levelTitle: 'Principiante',
  maxXP: 500,
  xp: 500,
  streak: 3,
  lives: 5,
  maxLives: 5,
  level: 1,
  lastLifeLostAt: null,
  lifePurchaseCount: 0,
  hasUsedCourtesySong: false
};

console.log('--- Testing livesEngine ---');

// 1. formatCountdown
assert(formatCountdown(0) === '00:00', 'formatCountdown(0) should be 00:00');
assert(formatCountdown(1000) === '00:01', 'formatCountdown(1000) should be 00:01');
assert(formatCountdown(65000) === '01:05', 'formatCountdown(65000) should be 01:05');
assert(formatCountdown(1200000) === '20:00', 'formatCountdown(20 min) should be 20:00');

// 2. calculateLifePrice (50 XP base, +25 each)
assert(calculateLifePrice(0) === 50, 'Price for 0 previous purchases is 50 XP');
assert(calculateLifePrice(1) === 75, 'Price for 1 previous purchase is 75 XP');
assert(calculateLifePrice(2) === 100, 'Price for 2 previous purchases is 100 XP');
assert(calculateLifePrice(3) === 125, 'Price for 3 previous purchases is 125 XP');

// 3. applyLifeDeduction
const now = 10000000;
const deducted1 = applyLifeDeduction(mockStats, now);
assert(deducted1.lives === 4, 'Life decreases from 5 to 4');
assert(deducted1.lastLifeLostAt === now, 'lastLifeLostAt is recorded');

const deducted2 = applyLifeDeduction(deducted1, now + 1000);
assert(deducted2.lives === 3, 'Life decreases from 4 to 3');
assert(deducted2.lastLifeLostAt === now, 'lastLifeLostAt remains unchanged when already lost');

// Deduct to 0
let zeroStats = { ...mockStats, lives: 0, lastLifeLostAt: now };
const belowZero = applyLifeDeduction(zeroStats, now + 2000);
assert(belowZero.lives === 0, 'Lives cannot fall below 0');

// 4. getTimeToNextLife
const timeStatus = getTimeToNextLife(deducted1, now + 5 * 60 * 1000); // 5 mins elapsed
assert(timeStatus.remainingMs === 15 * 60 * 1000, '15 minutes remaining');
assert(timeStatus.formatted === '15:00', 'Formatted time is 15:00');

// 5. calculatePassiveRecharge
// +20 mins = +1 life
const after20m = calculatePassiveRecharge(deducted2, now + RECHARGE_INTERVAL_MS);
assert(after20m.lives === 4, 'Recovered 1 life after 20 mins (from 3 to 4)');
assert(after20m.lastLifeLostAt === now + RECHARGE_INTERVAL_MS, 'lastLifeLostAt updated forward by 20 mins');

// +40 mins = +2 lives (reach 5)
const after40m = calculatePassiveRecharge(deducted2, now + 2 * RECHARGE_INTERVAL_MS);
assert(after40m.lives === 5, 'Recovered 2 lives after 40 mins (from 3 to 5)');
assert(after40m.lastLifeLostAt === null, 'lastLifeLostAt cleared at 5 lives');
assert(after40m.lifePurchaseCount === 0, 'lifePurchaseCount reset at 5 lives');

// +100 mins (overfill)
const after100m = calculatePassiveRecharge(deducted2, now + 5 * RECHARGE_INTERVAL_MS);
assert(after100m.lives === 5, 'Lives capped at 5');
assert(after100m.lastLifeLostAt === null, 'lastLifeLostAt is null');

// 6. applyLifePurchase
const lowXpStats = { ...deducted1, xp: 20 };
const purchaseFail = applyLifePurchase(lowXpStats);
assert(!purchaseFail.success, 'Purchase fails if not enough XP');
assert(purchaseFail.error === 'XP insuficiente', 'Error message is XP insuficiente');

const purchaseSuccess1 = applyLifePurchase(deducted1);
assert(purchaseSuccess1.success, 'Purchase succeeds with enough XP');
assert(purchaseSuccess1.cost === 50, 'First purchase costs 50 XP');
assert(purchaseSuccess1.updatedStats.xp === 450, 'XP deducted properly');
assert(purchaseSuccess1.updatedStats.lives === 5, 'Lives increased to 5');
assert(purchaseSuccess1.updatedStats.lifePurchaseCount === 0, 'lifePurchaseCount reset because lives reached 5');

// Consecutive purchases when lives is low (e.g. lives = 1)
const lowLivesStats = { ...mockStats, lives: 1, xp: 500, lastLifeLostAt: now };
const p1 = applyLifePurchase(lowLivesStats);
assert(p1.cost === 50 && p1.updatedStats.lives === 2 && p1.updatedStats.lifePurchaseCount === 1, 'P1 costs 50, lives 2, count 1');
const p2 = applyLifePurchase(p1.updatedStats);
assert(p2.cost === 75 && p2.updatedStats.lives === 3 && p2.updatedStats.lifePurchaseCount === 2, 'P2 costs 75, lives 3, count 2');

// 7. applyLifeAward
const awarded = applyLifeAward(lowLivesStats, 1);
assert(awarded.lives === 2, 'applyLifeAward adds 1 life');
const awardedMax = applyLifeAward(lowLivesStats, 10);
assert(awardedMax.lives === 5, 'applyLifeAward caps at 5');
assert(awardedMax.lastLifeLostAt === null, 'applyLifeAward clears lastLifeLostAt at 5');

console.log('🎉 ALL livesEngine TESTS PASSED!');
