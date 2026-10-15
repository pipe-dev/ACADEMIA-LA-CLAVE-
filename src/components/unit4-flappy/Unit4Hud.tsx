// src/components/unit4-flappy/Unit4Hud.tsx
// Overlays de Unit 4 (hint de inicio, pantalla de choque, badge de micrófono y
// modal de créditos). Separado de Unit4Game para mantener < 500 líneas por archivo.
'use client';

import React from 'react';
import { Hand, Mic } from 'lucide-react';
import { Phase } from './unit4Types';
import { Unit4CreditsModal } from './Unit4CreditsModal';

interface Unit4HudProps {
  phase: Phase;
  finalScore: number;
  finalRecord: number;
  micActive: boolean;
  showCredits: boolean;
  showTapHint: boolean;
  onRestart: () => void;
  onExit?: () => void;
}

export const Unit4Hud: React.FC<Unit4HudProps> = ({
  phase,
  finalScore,
  finalRecord,
  micActive,
  showCredits,
  showTapHint,
  onRestart,
  onExit,
}) => (
  <>
    {phase === 'ready' && (
      <div className="absolute top-[30%] left-1/2 -translate-x-1/2 z-[200] pointer-events-none select-none text-center text-white">
        <div className="text-2xl font-black tracking-wide drop-shadow-[0_2px_0_rgba(69,26,3,0.45)] whitespace-nowrap">
          Grítale al pato
        </div>
        <div className="text-xl font-bold tracking-wide drop-shadow-[0_2px_0_rgba(69,26,3,0.45)] opacity-90 whitespace-nowrap">
          para hacerlo volar
        </div>
      </div>
    )}

    {phase === 'dead' && (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none bg-amber-950/40">
        {showTapHint && (
          <div className="mb-1 mx-6 flex max-w-xs items-center gap-3 rounded-2xl bg-amber-50/95 px-4 py-3 text-left text-amber-950 shadow-xl">
            <Hand className="h-7 w-7 shrink-0 text-amber-600" />
            <div className="text-sm font-semibold leading-snug">
              ¿Se te dificultó? Solo{' '}
              <span className="font-black underline decoration-amber-500 decoration-2">
                toca la pantalla
              </span>{' '}
              y así controlas al pato.
            </div>
          </div>
        )}

        <div className="text-6xl font-black text-white drop-shadow-[0_3px_0_rgba(69,26,3,0.85)]">
          ¡Chocaste!
        </div>
        <div className="flex items-center gap-6 px-6 py-4 rounded-3xl bg-amber-900/80 text-amber-50 shadow-xl">
          <div className="text-center">
            <div className="text-xs uppercase tracking-wider opacity-70">
              Puntos
            </div>
            <div className="text-4xl font-black text-amber-300">
              {finalScore}
            </div>
          </div>
          <div className="w-px h-12 bg-white/25" />
          <div className="text-center">
            <div className="text-xs uppercase tracking-wider opacity-70">
              Récord
            </div>
            <div className="text-4xl font-black text-amber-300">
              {finalRecord}
            </div>
          </div>
        </div>
      </div>
    )}

    {micActive && phase !== 'ready' && (
      <div className="absolute top-4 right-4 pointer-events-none flex items-center gap-2 rounded-full bg-amber-950/60 px-3 py-1.5 text-amber-100 shadow-lg">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <Mic className="w-4 h-4" />
      </div>
    )}

    {showCredits && <Unit4CreditsModal onRestart={onRestart} onExit={onExit} />}
  </>
);
