// src/components/unit4-flappy/unit4Audio.ts
// Cableado de sonido de Unit 4. Unit4Game NO importa sonidos directamente:
// llama a estos métodos de alto nivel y aquí se mapean a la síntesis de
// flappyAudio. Así todo el sonido vive aparte y Unit4Game queda por debajo
// del tope de 500 líneas por archivo.
import {
  playCreditsBellSound, playCupCenterSound, playDeathSound, playFlapSound,
  playFloorHitSound, playGoldenPipeAppearSound, playMeteorFallSound,
  playMeteorImpactSound, playNearMissSound, playPanSound, playPipeHitSound,
  playPointSound, playRecordSound, playStartSound, playStreakIgniteSound,
  playTrophyRiseSound, startFlappyAmbient, stopFlappyAmbient,
  unlockFlappyAudio,
} from './flappyAudio';
import { PROGRESS_EVERY } from './unit4Config';
import type { WinState } from './unit4Types';

let lastWinStage: WinState['stage'] | null = null;

export const unit4Audio = {
  flap(score: number) {
    playFlapSound(score);
  },

  unlock() {
    unlockFlappyAudio();
  },

  start() {
    unlockFlappyAudio();
    playStartSound();
    startFlappyAmbient();
  },

  /** Punto sumado: nota + casi-choque opcional + ignición de racha. */
  point(count: number, nearMiss: boolean) {
    playPointSound(count - 1);
    if (nearMiss) playNearMissSound(Math.random() < 0.5 ? -1 : 1);
    if (count >= PROGRESS_EVERY && count % PROGRESS_EVERY === 0) {
      playStreakIgniteSound(Math.floor(count / PROGRESS_EVERY));
    }
  },

  goldenPipe() {
    playGoldenPipeAppearSound();
  },

  meteorFall() {
    playMeteorFallSound();
  },

  meteorImpact() {
    playMeteorImpactSound();
  },

  /** Un disparo por cambio de etapa de la cinemática. */
  winStage(stage: WinState['stage']) {
    if (stage === lastWinStage) return;
    lastWinStage = stage;
    if (stage === 'trophy') playTrophyRiseSound();
    else if (stage === 'center') playCupCenterSound();
    else if (stage === 'return' || stage === 'fly' || stage === 'pan') {
      playPanSound();
    }
  },

  /** Arranca la victoria: corta el ambiente y arma la etapa inicial 'shake'. */
  startWin() {
    stopFlappyAmbient();
    lastWinStage = 'shake';
  },

  die(cause: 'pipe' | 'floor', newRecord: boolean) {
    stopFlappyAmbient();
    if (cause === 'floor') playFloorHitSound();
    else playPipeHitSound();
    playDeathSound();
    if (newRecord) window.setTimeout(() => playRecordSound(), 620);
  },

  credits() {
    playCreditsBellSound();
  },

  reset() {
    lastWinStage = null;
  },

  stop() {
    stopFlappyAmbient();
  },
};
