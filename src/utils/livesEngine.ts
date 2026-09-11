import { UserStats } from '../types';

export const MAX_LIVES = 5;
export const RECHARGE_INTERVAL_MS = 20 * 60 * 1000; // 20 minutos (1,200,000 ms)
export const BASE_LIFE_PRICE = 50;
export const PRICE_INCREMENT_PER_PURCHASE = 25;

/**
 * Formatea milisegundos en formato mm:ss (ej: 18:42)
 */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Calcula el precio dinámico de la siguiente vida según compras consecutivas
 */
export function calculateLifePrice(purchaseCount: number = 0): number {
  return BASE_LIFE_PRICE + Math.max(0, purchaseCount) * PRICE_INCREMENT_PER_PURCHASE;
}

/**
 * Calcula el tiempo restante para la próxima recarga pasiva
 */
export function getTimeToNextLife(
  stats: UserStats,
  now: number = Date.now()
): { remainingMs: number; formatted: string } {
  const currentLives = stats.lives ?? MAX_LIVES;
  const lastLostAt = stats.lastLifeLostAt;

  if (currentLives >= MAX_LIVES || !lastLostAt) {
    return { remainingMs: 0, formatted: '00:00' };
  }

  const elapsed = Math.max(0, now - lastLostAt);
  const remainder = elapsed % RECHARGE_INTERVAL_MS;
  const remainingMs = RECHARGE_INTERVAL_MS - remainder;

  return {
    remainingMs,
    formatted: formatCountdown(remainingMs)
  };
}

/**
 * Calcula la recarga pasiva de vidas basada en tiempo transcurrido (offline y online)
 */
export function calculatePassiveRecharge(
  stats: UserStats,
  now: number = Date.now()
): UserStats {
  const currentLives = stats.lives ?? MAX_LIVES;
  const lastLostAt = stats.lastLifeLostAt;

  if (currentLives >= MAX_LIVES || !lastLostAt) {
    if (currentLives >= MAX_LIVES && (lastLostAt !== null || stats.lifePurchaseCount !== 0 || stats.hasUsedCourtesySong)) {
      return {
        ...stats,
        lives: MAX_LIVES,
        lastLifeLostAt: null,
        lifePurchaseCount: 0,
        hasUsedCourtesySong: false
      };
    }
    return stats;
  }

  const elapsed = Math.max(0, now - lastLostAt);
  const livesToRecharge = Math.floor(elapsed / RECHARGE_INTERVAL_MS);

  if (livesToRecharge <= 0) {
    return stats;
  }

  const newLives = Math.min(MAX_LIVES, currentLives + livesToRecharge);
  const isFull = newLives >= MAX_LIVES;

  return {
    ...stats,
    lives: newLives,
    lastLifeLostAt: isFull ? null : lastLostAt + livesToRecharge * RECHARGE_INTERVAL_MS,
    lifePurchaseCount: isFull ? 0 : (stats.lifePurchaseCount ?? 0),
    hasUsedCourtesySong: isFull ? false : (stats.hasUsedCourtesySong ?? false)
  };
}

/**
 * Aplica la deducción de 1 vida y establece la marca de tiempo si es la primera perdida
 */
export function applyLifeDeduction(
  stats: UserStats,
  now: number = Date.now()
): UserStats {
  const currentLives = Math.max(0, stats.lives ?? MAX_LIVES);
  const newLives = Math.max(0, currentLives - 1);
  const currentLastLost = stats.lastLifeLostAt;

  return {
    ...stats,
    lives: newLives,
    lastLifeLostAt: currentLastLost === null || currentLastLost === undefined ? now : currentLastLost
  };
}

/**
 * Otorga una o más vidas (por ejemplo al sacar 5 estrellas o completar el examen de 7 pasos)
 */
export function applyLifeAward(
  stats: UserStats,
  amount: number = 1
): UserStats {
  const currentLives = stats.lives ?? MAX_LIVES;
  const newLives = Math.min(MAX_LIVES, currentLives + amount);
  const isFull = newLives >= MAX_LIVES;

  return {
    ...stats,
    lives: newLives,
    lastLifeLostAt: isFull ? null : stats.lastLifeLostAt,
    lifePurchaseCount: isFull ? 0 : (stats.lifePurchaseCount ?? 0),
    hasUsedCourtesySong: isFull ? false : (newLives > 0 ? false : (stats.hasUsedCourtesySong ?? false))
  };
}

/**
 * Ejecuta la compra de 1 vida con XP y escala el precio
 */
export function applyLifePurchase(
  stats: UserStats
): { success: boolean; updatedStats: UserStats; cost: number; error?: string } {
  const currentLives = stats.lives ?? MAX_LIVES;
  if (currentLives >= MAX_LIVES) {
    return { success: false, updatedStats: stats, cost: 0, error: 'Vidas al máximo' };
  }

  const purchaseCount = stats.lifePurchaseCount ?? 0;
  const cost = calculateLifePrice(purchaseCount);

  if ((stats.xp ?? 0) < cost) {
    return { success: false, updatedStats: stats, cost, error: 'XP insuficiente' };
  }

  const newLives = Math.min(MAX_LIVES, currentLives + 1);
  const isFull = newLives >= MAX_LIVES;

  const updatedStats: UserStats = {
    ...stats,
    xp: Math.max(0, (stats.xp ?? 0) - cost),
    lives: newLives,
    lastLifeLostAt: isFull ? null : stats.lastLifeLostAt,
    lifePurchaseCount: isFull ? 0 : purchaseCount + 1,
    hasUsedCourtesySong: false
  };

  return {
    success: true,
    updatedStats,
    cost
  };
}
