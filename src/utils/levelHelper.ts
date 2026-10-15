/**
 * 20 Level Progression Tiers based on singer journey and achievements in AfinApp
 * Directly aligned with singing badges (Nivel 5, Nivel 10, Nivel 15+, Nivel 20).
 */
export interface LevelTier {
  level: number;
  title: string;
  baseXP: number;      // Total XP where this level begins
  nextLevelXP: number; // Total XP required to advance to next level
  description: string;
}

export const LEVEL_TIERS: LevelTier[] = [
  { level: 1, title: 'Vocalista Principiante', baseXP: 0, nextLevelXP: 100, description: 'Descubriendo afinación y respiración' },
  { level: 2, title: 'Aficionado al Canto', baseXP: 100, nextLevelXP: 220, description: 'Desarrollando colocación y oído musical' },
  { level: 3, title: 'Oído en Formación', baseXP: 220, nextLevelXP: 360, description: 'Afinando intervalos y notas clave' },
  { level: 4, title: 'Voz en Desarrollo', baseXP: 360, nextLevelXP: 520, description: 'Control de estabilidad y soporte diafragmático' },
  { level: 5, title: 'Vocalista Entrenado', baseXP: 520, nextLevelXP: 700, description: 'Dominio de escalas y agilidad melódica' }, // Badge 21
  { level: 6, title: 'Afinador Prometedor', baseXP: 700, nextLevelXP: 900, description: 'Precisión tonal consistente en micrófono' },
  { level: 7, title: 'Cantante Constante', baseXP: 900, nextLevelXP: 1120, description: 'Seguridad en ataques vocales y transiciones' }, // Cruza 1,000 XP (Badge 17)
  { level: 8, title: 'Voz Resonante', baseXP: 1120, nextLevelXP: 1360, description: 'Apertura de resonadores y proyección limpia' },
  { level: 9, title: 'Agilidad Melódica', baseXP: 1360, nextLevelXP: 1620, description: 'Flexibilidad en saltos de octava e intervalos' },
  { level: 10, title: 'Intérprete Técnico', baseXP: 1620, nextLevelXP: 1900, description: 'Afinación rigurosa y articulación vocal' }, // Badge 39
  { level: 11, title: 'Dominio Diafragmático', baseXP: 1900, nextLevelXP: 2200, description: 'Reserva de aire y soporte vocal constante' },
  { level: 12, title: 'Control de Tesitura', baseXP: 2200, nextLevelXP: 2520, description: 'Extensión de rango y paso de puente seguro' }, // Cruza 2,500 XP (Badge 37)
  { level: 13, title: 'Virtuoso Vocal', baseXP: 2520, nextLevelXP: 2860, description: 'Vibrato controlado y entonación brillante' },
  { level: 14, title: 'Maestro de Resonancia', baseXP: 2860, nextLevelXP: 3220, description: 'Equilibrio de voz mixta y brillo vocal' },
  { level: 15, title: 'Vocalista Avanzado', baseXP: 3220, nextLevelXP: 3600, description: 'Nivel élite para repertorio de alta exigencia' }, // Requisito Badge 50
  { level: 16, title: 'Maestro Solfista', baseXP: 3600, nextLevelXP: 4000, description: 'Lectura a primera vista y oído absoluto' },
  { level: 17, title: 'Voz Prodigio', baseXP: 4000, nextLevelXP: 4420, description: 'Facilidad en agudos extremos y graves profundos' },
  { level: 18, title: 'Astro Vocal', baseXP: 4420, nextLevelXP: 4860, description: 'Expresión artística y afinación inquebrantable' },
  { level: 19, title: 'Gran Maestro de la Voz', baseXP: 4860, nextLevelXP: 5000, description: 'A un paso de la cumbre vocal legendaria' },
  { level: 20, title: 'Leyenda de La Clave', baseXP: 5000, nextLevelXP: 5000, description: 'Máximo exponente y maestría total en La Clave' }, // Badge 38 & 40
];

export const MAX_APP_LEVEL = 20;

export function getLevelTitle(level: number): string {
  const tier = LEVEL_TIERS.find((t) => t.level === level);
  if (tier) return tier.title;
  if (level <= 0) return LEVEL_TIERS[0].title;
  return LEVEL_TIERS[LEVEL_TIERS.length - 1].title;
}

export interface LevelProgressDetails {
  level: number;
  levelTitle: string;
  totalXP: number;
  baseXP: number;
  nextLevelXP: number;
  currentXPInTier: number;
  tierSpan: number;
  xpToNext: number;
  percentage: number;
  nextTitle: string;
  isMaxLevel: boolean;
}

export function getLevelProgress(totalXP: number): LevelProgressDetails {
  const safeXP = Math.max(0, totalXP || 0);

  // Find corresponding tier
  let activeTier = LEVEL_TIERS[0];
  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    if (safeXP >= LEVEL_TIERS[i].baseXP) {
      activeTier = LEVEL_TIERS[i];
      break;
    }
  }

  const isMaxLevel = activeTier.level >= MAX_APP_LEVEL;
  const nextTier = LEVEL_TIERS.find((t) => t.level === activeTier.level + 1);

  const baseXP = activeTier.baseXP;
  const nextLevelXP = activeTier.nextLevelXP;
  const tierSpan = Math.max(1, nextLevelXP - baseXP);
  const currentXPInTier = isMaxLevel ? tierSpan : Math.min(tierSpan, safeXP - baseXP);
  const xpToNext = isMaxLevel ? 0 : Math.max(0, nextLevelXP - safeXP);
  const percentage = isMaxLevel
    ? 100
    : Math.min(100, Math.round((currentXPInTier / tierSpan) * 100));

  const nextTitle = nextTier ? nextTier.title : 'Nivel Legendario Máximo';

  return {
    level: activeTier.level,
    levelTitle: activeTier.title,
    totalXP: safeXP,
    baseXP,
    nextLevelXP,
    currentXPInTier,
    tierSpan,
    xpToNext,
    percentage,
    nextTitle,
    isMaxLevel,
  };
}

export function calculateLevelFromXP(totalXP: number): {
  level: number;
  levelTitle: string;
  maxXP: number;
} {
  const p = getLevelProgress(totalXP);
  return {
    level: p.level,
    levelTitle: p.levelTitle,
    maxXP: p.nextLevelXP,
  };
}
