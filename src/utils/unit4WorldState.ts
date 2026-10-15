// Estado compartido entre Unit4Game (progreso) y Unit4SkyCelebration (cielo).
export const unit4World = {
  phase: 'ready' as 'ready' | 'playing' | 'dead' | 'winning',
  score: 0,
};