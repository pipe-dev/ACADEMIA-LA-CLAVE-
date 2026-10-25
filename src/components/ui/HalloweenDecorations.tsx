'use client';
import React from 'react';
import { motion } from 'motion/react';
import { useSeasonalEventActive } from '../../utils/seasonalEvents';

/**
 * Compuerta estacional: todo componente hijo solo se renderiza cuando su temporada está activa.
 */
const HalloweenGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isHalloweenActive = useSeasonalEventActive('halloween');
  if (!isHalloweenActive) return null;
  return <>{children}</>;
};

/**
 * Witch hat icon to overlay on the avatar
 */
export const WitchHat: React.FC<{ className?: string }> = ({ className = '' }) => (
  <HalloweenGate>
    <div className={`pointer-events-none select-none ${className}`}>
      <img
        src="/images/halloween/witch-hat.webp"
        alt="Sombrero de bruja"
        className="block w-full h-auto max-w-none origin-bottom"
      />
    </div>
  </HalloweenGate>
);

/**
 * Bat flying over the AFINAPP logo (optimized asset from user image)
 */
export const LogoBat: React.FC<{ className?: string }> = ({ className = '' }) => (
  <HalloweenGate>
    <div className={`pointer-events-none select-none ${className} animate-[batEntrance_0.9s_cubic-bezier(0.22,1,0.36,1)_0.4s_both]`}>
      <div className="origin-bottom animate-[batHeaderIdle_4.2s_ease-in-out_1.3s_infinite]">
        <img
          src="/images/halloween/bat-header.webp"
          alt="Murciélago"
          className="block w-full h-auto max-w-none drop-shadow-xs origin-bottom"
        />
      </div>
    </div>
  </HalloweenGate>
);

export const LogoBatAndSpider = LogoBat;

/**
 * Optimized spider hanging on thread from letter
 */
export const HangingSpider: React.FC<{
  threadHeight?: string;
  className?: string;
  spiderWidth?: string;
}> = ({
  threadHeight = 'h-7',
  className = '',
  spiderWidth = 'w-5'
}) => (
  <HalloweenGate>
    <div
      className={`flex flex-col items-center origin-top pointer-events-none select-none ${className} animate-[spiderSwing_3.8s_ease-in-out_1.15s_both_infinite]`}
    >
      {/* El hilo crece desde la P y empuja a la araña hacia abajo */}
      <motion.div
        className="overflow-hidden"
        initial={{ height: 0 }}
        animate={{ height: 'auto' }}
        transition={{ delay: 0.25, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={`w-[1.2px] ${threadHeight} bg-[#30122c] dark:bg-purple-200/80`} />
      </motion.div>
      {/* La araña sale de la P y luego mantiene un balanceo propio */}
      <div className="origin-top animate-[spiderPopIn_0.55s_ease-out_0.45s_both]">
        <img
          src="/images/halloween/spider-body.webp"
          alt="Arañita"
          className={`${spiderWidth} h-auto -mt-[1px] max-w-none select-none drop-shadow-xs origin-top animate-[spiderBodySwing_2.6s_ease-in-out_1.15s_both_infinite]`}
        />
      </div>
    </div>
  </HalloweenGate>
);

/**
 * Corner Spiderweb (for header top corners)
 */
export const SpiderWebCorner: React.FC<{ position?: 'left' | 'right'; className?: string }> = ({ position = 'left', className = '' }) => {
  const isLeft = position === 'left';
  return (
    <HalloweenGate>
      <img
        src="/images/halloween/spider-web.webp"
        alt="Telaraña"
        className={`pointer-events-none select-none z-0 ${isLeft ? '' : 'scale-x-[-1]'} ${className}`}
      />
    </HalloweenGate>
  );
};

/**
 * Friendly Ghost Floating next to Node 2
 */
export const CuteGhost: React.FC<{ className?: string }> = ({ className = '' }) => (
  <HalloweenGate>
    <motion.div
      animate={{ y: [0, -8, 0], rotate: [0, 2, -2, 0] }}
      transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
      className={`pointer-events-none select-none ${className}`}
    >
      <svg
      width="64"
      height="64"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-[0_8px_16px_rgba(148,163,184,0.35)]"
    >
      {/* Ghost Body */}
      <path
        d="M28 50 C28 26 40 14 58 14 C76 14 84 26 84 50 C84 66 84 76 80 82 C76 88 71 82 66 82 C61 82 58 87 52 87 C46 87 43 82 38 82 C33 82 30 87 26 83 C23 79 28 66 28 50 Z"
        fill="#ffffff"
      />
      {/* Left arm waving */}
      <path
        d="M32 50 C22 46 16 48 18 54 C20 58 26 57 30 55"
        fill="#ffffff"
      />
      {/* Right arm waving */}
      <path
        d="M80 50 C90 46 96 48 94 54 C92 58 86 57 82 55"
        fill="#ffffff"
      />
      {/* Cute Big Eyes */}
      <ellipse cx="50" cy="40" rx="3.5" ry="5.5" fill="#1e1b4b" />
      <ellipse cx="66" cy="40" rx="3.5" ry="5.5" fill="#1e1b4b" />
      <circle cx="51.5" cy="38" r="1.5" fill="#ffffff" />
      <circle cx="67.5" cy="38" r="1.5" fill="#ffffff" />

      {/* Rosy Cheeks */}
      <ellipse cx="43" cy="48" rx="4" ry="2.5" fill="#f472b6" opacity="0.6" />
      <ellipse cx="73" cy="48" rx="4" ry="2.5" fill="#f472b6" opacity="0.6" />

      {/* Cute Open Mouth */}
      <ellipse cx="58" cy="49" rx="3.5" ry="5" fill="#be123c" />
      <ellipse cx="58" cy="51.5" rx="2.5" ry="2" fill="#fda4af" />
      </svg>
      </motion.div>
    </HalloweenGate>
  );

/**
 * Autumn Leaf (Orange, Burgundy, Amber)
 */
export const AutumnLeaf: React.FC<{
  variant?: 'orange' | 'burgundy' | 'amber';
  size?: number;
  rotation?: number;
  className?: string;
}> = ({ variant = 'orange', size = 20, rotation = 0, className = '' }) => {
  const colorMap = {
    orange: '#ea580c',
    burgundy: '#831843',
    amber: '#d97706'
  };
  const color = colorMap[variant] || colorMap.orange;

  return (
    <HalloweenGate>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transform: `rotate(${rotation}deg)` }}
        className={`pointer-events-none select-none drop-shadow-2xs ${className}`}
      >
        <path
          d="M12 2 C14 7 19 8 21 12 C18 13 18 17 15 19 C13 18 11 20 12 22 C10 21 8 19 8 17 C5 17 4 14 2 12 C5 9 8 8 12 2 Z"
          fill={color}
        />
        <path
          d="M12 4 L12 21"
          stroke="#ffffff"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.35"
        />
      </svg>
    </HalloweenGate>
  );
};

/**
 * 4-Point Magic Sparkle Star
 */
export const SparkleStar: React.FC<{
  color?: string;
  size?: number;
  className?: string;
}> = ({ color = '#8b5cf6', size = 16, className = '' }) => (
  <HalloweenGate>
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none select-none animate-pulse ${className}`}
    >
      <path
        d="M12 0 C12 7 17 12 24 12 C17 12 12 17 12 24 C12 17 7 12 0 12 C7 12 12 7 12 0 Z"
        fill={color}
      />
    </svg>
  </HalloweenGate>
);

/**
 * Bat resting on top-right of the "Evaluar mi voz" button (optimized asset from user image)
 */
export const FabBatOnWeb: React.FC<{ className?: string }> = ({ className = '' }) => (
  <HalloweenGate>
    <div className={`absolute -top-5 sm:-top-5.5 -right-1 sm:-right-2 w-14 sm:w-16 pointer-events-none z-30 select-none ${className}`}>
      <div className="origin-bottom animate-[fabBatIdle_7.5s_ease-in-out_infinite]">
        <img
          src="/images/halloween/bat-eval-nofeet.webp"
          alt="Murciélago evaluador"
          className="block w-full h-auto max-w-none drop-shadow-md origin-bottom"
        />
      </div>
    </div>
  </HalloweenGate>
);

/**
 * Spiderweb hanging under the streak, hearts and zen header buttons (optimized asset from user image)
 */
export const HeaderButtonsSpiderWeb: React.FC<{ className?: string }> = ({ className = '' }) => (
  <HalloweenGate>
    <img
      src="/images/halloween/web-header-buttons.webp"
      alt="Telaraña de botones"
      className={`absolute top-[2px] left-0 w-full h-auto pointer-events-none select-none z-0 ${className}`}
    />
  </HalloweenGate>
);

/**
 * Telaraña blanca para el botón "Evaluar mi voz" (FAB de Academia).
 * Reutiliza el webp de la esquina: espejado, rotado y filtrado a blanco.
 */
export const EvalFabSpiderWeb: React.FC<{ className?: string }> = ({ className = '' }) => (
  <HalloweenGate>
    <img
      src="/images/halloween/spider-web.webp"
      alt=""
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
      style={{
        filter: 'brightness(0) invert(1)',
        opacity: 1,
        // Espejo horizontal primero y luego giro: el hub queda arriba a la derecha
        // y los hilos barren hacia abajo-izquierda, al contrario que la red del corner.
        transform: 'rotate(-50deg) scaleX(-1)',
      }}
    />
  </HalloweenGate>
);

