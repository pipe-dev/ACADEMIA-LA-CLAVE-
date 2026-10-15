// src/components/main-app/Unit4Celebration.tsx
// Celebración de graduación de la Unidad 4: cielo animado + juego flappy por
// voz/tap. Se lanza al aprobar la Evaluación del Módulo 4 (u4-node33.5), replicando el
// patrón de las celebraciones de Unidad 1/2/3.
'use client';

import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Unit4SkyCelebration } from '../Unit4SkyCelebration';
import { Unit4Game } from '../Unit4Game';
import {
  isFlappyAudioMuted,
  setFlappyAudioMuted,
} from '../unit4-flappy/flappyAudio';

const MUTE_KEY = 'laclave_unit4_muted';

interface Unit4CelebrationProps {
  onExit: () => void;
}

export const Unit4Celebration: React.FC<Unit4CelebrationProps> = ({ onExit }) => {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(MUTE_KEY) === '1';
    setFlappyAudioMuted(saved);
    setMuted(saved);
  }, []);

  const toggleMute = () => {
    const next = !isFlappyAudioMuted();
    setFlappyAudioMuted(next);
    setMuted(next);
    localStorage.setItem(MUTE_KEY, next ? '1' : '0');
  };

  return (
    <>
      <Unit4SkyCelebration />
      <Unit4Game onExit={onExit} />
      <button
        onClick={toggleMute}
        aria-label={muted ? 'Activar sonido' : 'Silenciar'}
        className="fixed top-4 left-4 z-[300] flex h-11 w-11 items-center justify-center rounded-full bg-amber-950/60 text-amber-100 shadow-lg backdrop-blur-md transition-transform active:scale-95 hover:bg-amber-950/80"
      >
        {muted ? (
          <VolumeX className="h-5 w-5" />
        ) : (
          <Volume2 className="h-5 w-5" />
        )}
      </button>
    </>
  );
};
