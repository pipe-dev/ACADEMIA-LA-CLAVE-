import { Badge, UserStats } from '../types';
import { ALL_50_SINGING_BADGES } from '../data/badgesData';

/**
 * Evaluates the 50 authentic singing badges against real, measurable user stats
 * and persistent performance data in AfinApp.
 */
export function evaluateBadges(stats: UserStats): Badge[] {
  if (typeof window === 'undefined') {
    return ALL_50_SINGING_BADGES.map((b) => ({ ...b, progress: 0, unlocked: false }));
  }

  // 1. Afinador Levels Progress
  let tunerProgress: Record<string, Record<string, number>> = {};
  try {
    const tp = localStorage.getItem('laclave_tuner_progress_v2');
    if (tp) tunerProgress = JSON.parse(tp);
  } catch {}

  const calentamientoCount = Object.keys(tunerProgress['Calentamiento'] || {}).length;
  const facilCount = Object.keys(tunerProgress['Fácil'] || {}).length;
  const medioCount = Object.keys(tunerProgress['Medio'] || {}).length;
  const dificilCount = Object.keys(tunerProgress['Difícil'] || {}).length;
  const maestroCount = Object.keys(tunerProgress['Maestro'] || {}).length;
  const totalTunerLevels = calentamientoCount + facilCount + medioCount + dificilCount + maestroCount;

  // 2. Duelo Rápido Wins
  let duelWins = 0;
  try {
    const dh = localStorage.getItem('laclave_duel_history');
    if (dh) {
      const list = JSON.parse(dh);
      duelWins = Array.isArray(list) ? list.filter((d: { won?: boolean }) => d.won).length : 0;
    }
  } catch {}

  // 3. Other verifiable tool scores
  const flappyScore = parseInt(localStorage.getItem('laclave_unit4_flappy_record') || '0', 10) || 0;
  const stabilityMaxSec = parseFloat(localStorage.getItem('laclave_stability_max_sec') || '0') || 0;
  const voiceEvalStars = parseInt(localStorage.getItem('laclave_voice_eval_stars') || '0', 10) || 0;
  const voiceEvalCount = parseInt(localStorage.getItem('laclave_voice_eval_completed_count') || '0', 10) || (voiceEvalStars > 0 ? 1 : 0);
  const breathingCount = parseInt(localStorage.getItem('laclave_breathing_completed_count') || '0', 10) || 0;
  const karaokeCount = parseInt(localStorage.getItem('laclave_karaoke_completed_count') || '0', 10) || 0;
  const notesListened = parseInt(localStorage.getItem('laclave_notes_listened_total') || '0', 10) || 0;
  const notesTuned = parseInt(localStorage.getItem('laclave_notes_tuned_total') || '0', 10) || 0;
  const maxCombo = parseInt(localStorage.getItem('laclave_tuner_max_combo') || '0', 10) || 0;

  const hasVocalRange = Boolean(
    stats.vocalRangeData ||
    localStorage.getItem('laclave_vocal_range_saved') ||
    localStorage.getItem('laclave_vocal_range_classification')
  );

  const unit1Completed = Boolean(localStorage.getItem('laclave_unit1_celebrated') === 'true' || (stats.lessonsCompleted && stats.lessonsCompleted >= 4));
  const unit2Completed = Boolean(localStorage.getItem('laclave_unit2_celebrated') === 'true' || (stats.lessonsCompleted && stats.lessonsCompleted >= 8));
  const unit3Completed = Boolean(localStorage.getItem('laclave_unit3_celebrated') === 'true' || (stats.lessonsCompleted && stats.lessonsCompleted >= 12));
  const unit4Completed = Boolean(localStorage.getItem('laclave_unit4_celebrated') === 'true' || (stats.lessonsCompleted && stats.lessonsCompleted >= 16));
  const unitsCelebratedCount = (unit1Completed ? 1 : 0) + (unit2Completed ? 1 : 0) + (unit3Completed ? 1 : 0) + (unit4Completed ? 1 : 0);

  return ALL_50_SINGING_BADGES.map((badge) => {
    let currentProgress = 0;

    switch (badge.id) {
      // 🟢 10 FÁCILES
      case 'badge_1': // Primer tono afinado
        currentProgress = notesTuned >= 1 ? 1 : 0;
        break;
      case 'badge_2': // Oído explorador (5 notas escuchadas)
        currentProgress = Math.min(5, notesListened);
        break;
      case 'badge_3': // Calibración vocal (Tesitura)
        currentProgress = hasVocalRange ? 1 : 0;
        break;
      case 'badge_4': // Primera lección
        currentProgress = Math.min(1, stats.lessonsCompleted || 0);
        break;
      case 'badge_5': // Respiración consciente
        currentProgress = breathingCount >= 1 ? 1 : 0;
        break;
      case 'badge_6': // Primeros 100 XP
        currentProgress = Math.min(100, stats.xp || 0);
        break;
      case 'badge_7': // Racha 3 días
        currentProgress = Math.min(3, stats.streak || 0);
        break;
      case 'badge_8': // Primer desafío afinador
        currentProgress = totalTunerLevels >= 1 ? 1 : 0;
        break;
      case 'badge_9': // Diagnóstico vocal (evaluación de voz)
        currentProgress = voiceEvalCount >= 1 ? 1 : 0;
        break;
      case 'badge_10': // Vuelo inicial (Flappy 5 pts)
        currentProgress = Math.min(5, flappyScore);
        break;

      // 🟡 20 MEDIAS
      case 'badge_11': // Combo x3
        currentProgress = Math.min(3, maxCombo);
        break;
      case 'badge_12': // 4 niveles calentamiento
        currentProgress = Math.min(4, calentamientoCount);
        break;
      case 'badge_13': // 6 niveles fácil
        currentProgress = Math.min(6, facilCount);
        break;
      case 'badge_14': // Racha 7 días
        currentProgress = Math.min(7, stats.streak || 0);
        break;
      case 'badge_15': // Racha 14 días
        currentProgress = Math.min(14, stats.streak || 0);
        break;
      case 'badge_16': // 500 XP
        currentProgress = Math.min(500, stats.xp || 0);
        break;
      case 'badge_17': // 1,000 XP
        currentProgress = Math.min(1000, stats.xp || 0);
        break;
      case 'badge_18': // Graduado Unidad 1
        currentProgress = unit1Completed ? 1 : 0;
        break;
      case 'badge_19': // Graduado Unidad 2
        currentProgress = unit2Completed ? 1 : 0;
        break;
      case 'badge_20': // Pulso firme (3 lecciones ritmo)
        currentProgress = Math.min(3, stats.lessonsCompleted || 0);
        break;
      case 'badge_21': // Nivel 5
        currentProgress = Math.min(5, stats.level || 1);
        break;
      case 'badge_22': // 30 min práctica
        currentProgress = Math.min(30, stats.practiceMinutes || 0);
        break;
      case 'badge_23': // 60 min práctica
        currentProgress = Math.min(60, stats.practiceMinutes || 0);
        break;
      case 'badge_24': // Voz estable (5s)
        currentProgress = Math.min(5, Math.floor(stabilityMaxSec));
        break;
      case 'badge_25': // Duelo rápido ganado
        currentProgress = duelWins >= 1 ? 1 : 0;
        break;
      case 'badge_26': // Flappy 15 pts
        currentProgress = Math.min(15, flappyScore);
        break;
      case 'badge_27': // Evaluación 2 estrellas
        currentProgress = Math.min(2, voiceEvalStars);
        break;
      case 'badge_28': // 10 lecciones
        currentProgress = Math.min(10, stats.lessonsCompleted || 0);
        break;
      case 'badge_29': // Karaoke inaugural (1 canción)
        currentProgress = Math.min(1, karaokeCount);
        break;
      case 'badge_30': // Precisión media afinador (1 nivel medio)
        currentProgress = medioCount >= 1 ? 1 : 0;
        break;

      // 🔴 20 DIFÍCILES
      case 'badge_31': // Combo maestro x5
        currentProgress = Math.min(5, maxCombo);
        break;
      case 'badge_32': // 8 niveles medio
        currentProgress = Math.min(8, medioCount);
        break;
      case 'badge_33': // 10 niveles difícil
        currentProgress = Math.min(10, dificilCount);
        break;
      case 'badge_34': // 14 niveles maestro
        currentProgress = Math.min(14, maestroCount);
        break;
      case 'badge_35': // Racha 30 días
        currentProgress = Math.min(30, stats.streak || 0);
        break;
      case 'badge_36': // Racha 60 días
        currentProgress = Math.min(60, stats.streak || 0);
        break;
      case 'badge_37': // 2,500 XP
        currentProgress = Math.min(2500, stats.xp || 0);
        break;
      case 'badge_38': // 5,000 XP
        currentProgress = Math.min(5000, stats.xp || 0);
        break;
      case 'badge_39': // Nivel 10
        currentProgress = Math.min(10, stats.level || 1);
        break;
      case 'badge_40': // Nivel 20
        currentProgress = Math.min(20, stats.level || 1);
        break;
      case 'badge_41': // Graduado Unidad 3
        currentProgress = unit3Completed ? 1 : 0;
        break;
      case 'badge_42': // Trofeo Flappy (30 pts)
        currentProgress = Math.min(30, flappyScore);
        break;
      case 'badge_43': // 180 min práctica
        currentProgress = Math.min(180, stats.practiceMinutes || 0);
        break;
      case 'badge_44': // Estabilidad 10s
        currentProgress = Math.min(10, Math.floor(stabilityMaxSec));
        break;
      case 'badge_45': // Evaluación 3 estrellas
        currentProgress = Math.min(3, voiceEvalStars >= 3 ? 3 : 0);
        break;
      case 'badge_46': // 25 lecciones
        currentProgress = Math.min(25, stats.lessonsCompleted || 0);
        break;
      case 'badge_47': // 4 unidades superadas
        currentProgress = Math.min(4, unitsCelebratedCount);
        break;
      case 'badge_48': // 100 notas afinadas
        currentProgress = Math.min(100, notesTuned);
        break;
      case 'badge_49': // 5 canciones karaoke
        currentProgress = Math.min(5, karaokeCount);
        break;
      case 'badge_50': // Leyenda Suprema (Nivel 15+, Racha 30d+, 4 unidades)
        currentProgress = ((stats.level || 1) >= 15 && (stats.streak || 0) >= 30 && unitsCelebratedCount >= 4) ? 1 : 0;
        break;
      default:
        currentProgress = 0;
    }

    const isUnlocked = currentProgress >= badge.maxProgress && badge.maxProgress > 0;

    return {
      ...badge,
      progress: currentProgress,
      unlocked: isUnlocked,
      unlockedAt: isUnlocked ? (badge.unlockedAt || new Date().toISOString()) : undefined,
    };
  });
}
