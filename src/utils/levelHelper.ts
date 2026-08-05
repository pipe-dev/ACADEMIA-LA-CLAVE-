/**
 * Level title helper based on singer progression
 */
export function getLevelTitle(level: number): string {
  const titles = [
    'Vocalista Principiante',
    'Aficionado al Canto',
    'Vocalista Prometedor',
    'Cantante Talentoso',
    'Tenor / Soprano Entrenado',
    'Maestro de Resonancia',
    'Virtuoso de la Voz',
    'Maestro Solfista',
    'Astro Vocal',
    'Leyenda de La Clave'
  ];
  if (level <= 0) return titles[0];
  return titles[Math.min(level - 1, titles.length - 1)] || `Nivel ${level} Vocal`;
}
