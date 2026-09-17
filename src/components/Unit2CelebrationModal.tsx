import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../utils/audioService';

interface Unit2CelebrationModalProps {
  isOpen: boolean;
  onContinue: () => void;
}

// Synthesizes a high-resonance crystal wine glass acoustic chime (E7 / 2637 Hz)
const playCrystalChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Fundamental crystal tone (E7 ~ 2637 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2637, now);
    osc1.frequency.exponentialRampToValueAtTime(2632, now + 1.8);
    gain1.gain.setValueAtTime(0.28, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    // Harmonic overtone (octave: 5274 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(5274, now);
    gain2.gain.setValueAtTime(0.08, now);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

    // High crystalline sparkle (7911 Hz)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(7911, now);
    gain3.gain.setValueAtTime(0.03, now);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    osc1.connect(gain1);
    osc2.connect(gain2);
    osc3.connect(gain3);
    gain1.connect(ctx.destination);
    gain2.connect(ctx.destination);
    gain3.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    osc1.stop(now + 1.8);
    osc2.stop(now + 0.9);
    osc3.stop(now + 0.4);

    setTimeout(() => {
      try { ctx.close(); } catch (_) {}
    }, 2000);
  } catch (err) {
    console.warn("Crystal chime audio error:", err);
  }
};

export const Unit2CelebrationModal: React.FC<Unit2CelebrationModalProps> = ({ isOpen, onContinue }) => {
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isShattered, setIsShattered] = useState(false);
  const reqRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  // --- 3D Touch Interactivity & Physics State ---
  const [isInteracting, setIsInteracting] = useState(false);
  const [touchRotX, setTouchRotX] = useState(0);
  const [touchRotY, setTouchRotY] = useState(0);
  const [isJiggling, setIsJiggling] = useState(false);

  const rotRef = useRef({ x: 0, y: 0 });
  const velRef = useRef({ x: 0, y: 0 });
  const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isDraggingRef = useRef(false);
  const physicsAnimRef = useRef<number>();
  const jiggleTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (physicsAnimRef.current) cancelAnimationFrame(physicsAnimRef.current);
      if (jiggleTimeoutRef.current) clearTimeout(jiggleTimeoutRef.current);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    isDraggingRef.current = true;
    setIsInteracting(true);

    if (physicsAnimRef.current) cancelAnimationFrame(physicsAnimRef.current);

    const now = performance.now();
    pointerStartRef.current = { x: e.clientX, y: e.clientY, time: now };
    lastPointerRef.current = { x: e.clientX, y: e.clientY, time: now };
    velRef.current = { x: 0, y: 0 };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !lastPointerRef.current) return;

    const now = performance.now();
    const dt = Math.max(1, now - lastPointerRef.current.time);
    const dx = e.clientX - lastPointerRef.current.x;
    const dy = e.clientY - lastPointerRef.current.y;

    velRef.current.y = (dx / dt) * 14;
    velRef.current.x = (-dy / dt) * 10;

    rotRef.current.y += dx * 0.7;
    const newRotX = rotRef.current.x - dy * 0.4;
    rotRef.current.x = Math.max(-22, Math.min(22, newRotX));

    lastPointerRef.current = { x: e.clientX, y: e.clientY, time: now };
    setTouchRotX(rotRef.current.x);
    setTouchRotY(rotRef.current.y);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}

    const now = performance.now();
    const start = pointerStartRef.current;

    // Check tap: displacement < 8px and duration < 250ms
    if (start) {
      const dist = Math.hypot(e.clientX - start.x, e.clientY - start.y);
      const duration = now - start.time;
      if (dist < 8 && duration < 250) {
        playCrystalChime();
        setIsJiggling(true);
        if (jiggleTimeoutRef.current) clearTimeout(jiggleTimeoutRef.current);
        jiggleTimeoutRef.current = setTimeout(() => setIsJiggling(false), 450);
      }
    }

    // Run momentum inertia & spring-back loop
    const runPhysics = () => {
      // 1. Inertia on Y with smooth friction damping
      rotRef.current.y += velRef.current.y;
      velRef.current.y *= 0.94;

      // 2. Spring-back on X (damped harmonic oscillator returning to 0)
      const springForce = -0.09 * rotRef.current.x;
      velRef.current.x = (velRef.current.x + springForce) * 0.85;
      rotRef.current.x += velRef.current.x;

      setTouchRotX(rotRef.current.x);
      setTouchRotY(rotRef.current.y);

      const isSettledY = Math.abs(velRef.current.y) < 0.04;
      const isSettledX = Math.abs(rotRef.current.x) < 0.15 && Math.abs(velRef.current.x) < 0.04;

      if (isSettledY && isSettledX) {
        setIsInteracting(false);
      } else {
        physicsAnimRef.current = requestAnimationFrame(runPhysics);
      }
    };

    physicsAnimRef.current = requestAnimationFrame(runPhysics);
  };

  useEffect(() => {
    if (!isOpen) return;
    return () => {
      if (isActive) audioService.stopMicrophone();
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [isOpen, isActive]);

  const handleStart = async () => {
    lastTimeRef.current = performance.now();
    
    const success = await audioService.startMicrophone((pitchHz, vol) => {
      const now = performance.now();
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;

      setProgress(prev => {
        if (prev >= 100) return prev; // Stop processing if shattered

        let newProg = prev;
        // The volume from audioService is often small (e.g., 0.01 - 0.1).
        if (vol > 0.015) {
          newProg += (dt / 4500) * 100; // takes 4.5s to reach 100
        } else if (newProg > 0) {
           // Slowly drain if they stop singing, so it doesn't stay at 99 forever
           newProg -= (dt / 2000) * 10; 
        }

        newProg = Math.max(0, Math.min(100, newProg));

        if (newProg >= 100) {
          setIsShattered(true);
          audioService.stopMicrophone();
        }
        return newProg;
      });
    });

    if (success) {
      setIsActive(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0b1828] overflow-hidden select-none">
      {/* Technical Grid Background from AfinadorView */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1b2b3f_1px,transparent_1px),linear-gradient(to_bottom,#1b2b3f_1px,transparent_1px)] bg-[size:24px_24px] bg-center opacity-60 pointer-events-none" />

      {/* Subtle Central Glow Behind Glass */}
      <div className="absolute w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none -translate-y-6" />

      {!isShattered ? (
        <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-6">
          <h2 className="text-white font-heading font-black text-2xl mb-8 text-center drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] leading-tight tracking-wide">
            Rompe la copa con tu nota más aguda
          </h2>
          
          {/* Progress / Tension Bar */}
          <div className="w-full h-3.5 bg-slate-900/80 border border-slate-700/80 rounded-full overflow-hidden mb-12 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] p-0.5">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full transition-all duration-75 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* 3D Crystal Wine Glass Container with Progressive Cracking & Direct Touch Interaction */}
          <div 
            className={`relative flex flex-col items-center select-none my-2 cursor-grab active:cursor-grabbing touch-none ${progress > 60 ? 'animate-shake' : ''} ${isJiggling ? 'animate-crystal-ping' : ''}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <svg
              viewBox="0 0 200 310"
              className="w-[200px] h-[310px] overflow-visible filter drop-shadow-[0_20px_45px_rgba(0,0,0,0.85)]"
            >
              <defs>
                {/* Floor Drop Shadow Blur */}
                <filter id="floorShadowBlur" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="6" />
                </filter>
                
                {/* Soft Glass Caustic Filters */}
                <filter id="subtleBlur" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="0.7" />
                </filter>
                <filter id="silkyRefraction" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="1.4" />
                </filter>
                <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="2.0" />
                </filter>
                <filter id="diffuseGlow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="3.8" />
                </filter>

                {/* Interior Clip Path for Background Refraction / Optical Distortion */}
                <clipPath id="bowlInteriorClip">
                  <path
                    d="M 58,32 
                       C 54,80 50,135 74,168 
                       C 86,183 95,188 97,192 
                       L 103,192 
                       C 105,188 114,183 126,168 
                       C 150,135 146,80 142,32 
                       A 42 8.5 0 0 1 58 32 Z"
                  />
                </clipPath>

                {/* Soft Volumetric Glass Body Gradient */}
                <linearGradient id="glassBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.30" />
                  <stop offset="18%" stopColor="#cffafe" stopOpacity="0.10" />
                  <stop offset="48%" stopColor="#ffffff" stopOpacity="0.03" />
                  <stop offset="72%" stopColor="#0891b2" stopOpacity="0.08" />
                  <stop offset="92%" stopColor="#38bdf8" stopOpacity="0.14" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.22" />
                </linearGradient>

                {/* Seamless Crystal Meniscus Gradient (No harsh lines) */}
                <linearGradient id="solidCrystalCore" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.0" />
                  <stop offset="35%" stopColor="#38bdf8" stopOpacity="0.12" />
                  <stop offset="70%" stopColor="#0284c7" stopOpacity="0.20" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.32" />
                </linearGradient>

                {/* Soft Primary Left Studio Glare (Feathered edges) */}
                <linearGradient id="primaryLeftGlare" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                  <stop offset="25%" stopColor="#e0f2fe" stopOpacity="0.70" />
                  <stop offset="65%" stopColor="#bae6fd" stopOpacity="0.30" />
                  <stop offset="90%" stopColor="#ffffff" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>

                {/* Soft Diffuse Ambient Glare */}
                <linearGradient id="softAmbientGlare" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
                  <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>

                {/* Right Edge Soft Rim Refraction */}
                <linearGradient id="rightEdgeGlare" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
                  <stop offset="35%" stopColor="#38bdf8" stopOpacity="0.25" />
                  <stop offset="80%" stopColor="#ffffff" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                </linearGradient>

                {/* Soft 3D Cylindrical Stem Shader */}
                <linearGradient id="stemShader" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#082f49" stopOpacity="0.35" />
                  <stop offset="25%" stopColor="#ffffff" stopOpacity="0.70" />
                  <stop offset="50%" stopColor="#bae6fd" stopOpacity="0.35" />
                  <stop offset="78%" stopColor="#0369a1" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#082f49" stopOpacity="0.45" />
                </linearGradient>

                {/* Soft Beveled Base Radial Gradient */}
                <radialGradient id="baseBevelGrad" cx="50%" cy="30%" r="65%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
                  <stop offset="40%" stopColor="#0284c7" stopOpacity="0.16" />
                  <stop offset="75%" stopColor="#0b172a" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.75" />
                </radialGradient>

                {/* Crack Glow Filter */}
                <filter id="crackGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* 1. Floor Ambient Occlusion Shadow */}
              <g 
                className={isInteracting ? '' : 'animate-luxury-shadow-sync'}
                style={isInteracting ? {
                  transform: `translate(${touchRotY * 0.12}px, 0px) scale(${1 + Math.sin((touchRotY * Math.PI) / 180) * 0.05}, 1)`,
                  transformOrigin: '100px 282px',
                  transition: isDraggingRef.current ? 'none' : 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)'
                } : undefined}
              >
                <ellipse
                  cx="100"
                  cy="282"
                  rx="65"
                  ry="13"
                  fill="#000000"
                  opacity="0.8"
                  filter="url(#floorShadowBlur)"
                />
                <ellipse
                  cx="100"
                  cy="280"
                  rx="44"
                  ry="8"
                  fill="#022a30"
                  opacity="0.55"
                  filter="url(#floorShadowBlur)"
                />
              </g>

              {/* 3D FLOATING LUXURY GLASS VESSEL WITH DIRECT TOUCH INTERACTION */}
              <g 
                className={isInteracting ? '' : 'animate-luxury-rotate-y'}
                style={isInteracting ? {
                  transform: `perspective(1000px) rotateX(${touchRotX}deg) rotateY(${touchRotY}deg) translateY(-2px)`,
                  transformStyle: 'preserve-3d',
                  transition: isDraggingRef.current ? 'none' : 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)'
                } : undefined}
              >
                {/* 2. OPTICAL BACKGROUND REFRACTION (Realistic glass volume bending actual background) */}
                <g clipPath="url(#bowlInteriorClip)">
                  {/* Dense background occlusion: completely blocks straight background grid from passing straight through */}
                  <rect x="40" y="20" width="120" height="180" fill="#0b1828" opacity="0.94" />
                  {/* Soft crystal cavity depth */}
                  <rect x="40" y="20" width="120" height="180" fill="url(#glassBodyGrad)" opacity="0.40" />

                  {/* Refracted Background Grid: exact optical continuation of the real background grid */}
                  <g className="animate-refraction-angle-shift" filter="url(#silkyRefraction)">
                    {/* Verticals bent by cylindrical crystal volume (Matching #1b2b3f background grid) */}
                    <g stroke="#1b2b3f" strokeWidth="1" opacity="0.80">
                      <path d="M 52,60 C 48,95 54,135 72,165" fill="none" />
                      <path d="M 76,32 C 66,75 64,125 84,175" fill="none" />
                      <path d="M 100,32 L 100,185" fill="none" strokeWidth="1.1" />
                      <path d="M 124,32 C 134,75 136,125 116,175" fill="none" />
                      <path d="M 148,60 C 152,95 146,135 128,165" fill="none" />
                    </g>
                    {/* Subtle crystal dispersion / chromatic sheen on refracted verticals */}
                    <g stroke="rgba(56, 189, 248, 0.22)" strokeWidth="0.8" opacity="0.55">
                      <path d="M 76,32 C 66,75 64,125 84,175" fill="none" />
                      <path d="M 124,32 C 134,75 136,125 116,175" fill="none" />
                    </g>

                    {/* Horizontals bowed downward by spherical lens curvature (Connecting to background grid lines at edges) */}
                    <g stroke="#1b2b3f" strokeWidth="1" opacity="0.80">
                      <path d="M 57,56 Q 100,66 143,56" fill="none" />
                      <path d="M 53,80 Q 100,94 147,80" fill="none" />
                      <path d="M 53,104 Q 100,122 147,104" fill="none" strokeWidth="1.1" />
                      <path d="M 56,128 Q 100,148 144,128" fill="none" />
                      <path d="M 65,152 Q 100,170 135,152" fill="none" />
                    </g>
                    {/* Subtle crystal dispersion edge on refracted horizontals */}
                    <g stroke="rgba(56, 189, 248, 0.20)" strokeWidth="0.8" opacity="0.55">
                      <path d="M 53,80 Q 100,94 147,80" fill="none" />
                      <path d="M 53,104 Q 100,122 147,104" fill="none" />
                      <path d="M 56,128 Q 100,148 144,128" fill="none" />
                    </g>
                  </g>
                </g>

                {/* 3. Solid Crystal Meniscus (Seamlessly blended, zero harsh outlines) */}
                <path
                  d="M 74,152 
                     C 85,168 93,178 97,192 
                     L 103,192 
                     C 107,178 115,168 126,152 
                     C 114,160 105,163 100,163 
                     C 95,163 86,160 74,152 Z"
                  fill="url(#solidCrystalCore)"
                  stroke="none"
                  filter="url(#subtleBlur)"
                />

                {/* 4. Internal Resonance Liquid / Sound Aura (Pulsing volume) */}
                <path
                  d="M 62,95 C 60,135 75,165 97,184 L 103,184 C 125,165 140,135 138,95 C 125,100 110,102 100,102 C 90,102 75,100 62,95 Z"
                  fill="url(#glassBodyGrad)"
                  className="transition-all duration-150"
                  filter="url(#subtleBlur)"
                  style={{
                    opacity: Math.min(0.80, 0.10 + (progress / 100) * 0.70),
                    transform: `scale(${1 + (progress / 100) * 0.04})`,
                    transformOrigin: '100px 184px'
                  }}
                />

                {/* 5. Main Crystal Bowl Outer Volume */}
                <path
                  d="M 58,32 
                     C 54,80 50,135 74,168 
                     C 86,183 95,188 97,192 
                     L 103,192 
                     C 105,188 114,183 126,168 
                     C 150,135 146,80 142,32 
                     A 42 8.5 0 0 1 58 32 Z"
                  fill="url(#glassBodyGrad)"
                />

                {/* 6. Soft Refractive Edge Glow (Replaces harsh wireframe lines) */}
                <path
                  d="M 58,32 
                     C 54,80 50,135 74,168 
                     C 86,183 95,188 97,192 
                     L 103,192 
                     C 105,188 114,183 126,168 
                     C 150,135 146,80 142,32"
                  fill="none"
                  stroke="rgba(255,255,255,0.22)"
                  strokeWidth="1.2"
                  filter="url(#subtleBlur)"
                />

                {/* 7. Soft Back Rim Ellipse */}
                <ellipse
                  cx="100"
                  cy="32"
                  rx="42"
                  ry="8.5"
                  fill="none"
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth="1.2"
                  filter="url(#subtleBlur)"
                />

                {/* 8. Front Lip Highlight Arc (Soft diffused studio light) */}
                <path
                  d="M 58,32 A 42 8.5 0 0 0 142 32"
                  fill="none"
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  filter="url(#softGlow)"
                />
                <path
                  d="M 59,32 A 41 8.3 0 0 0 141 32"
                  fill="none"
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />

                {/* 9. Specular Caustics - Studio Glare smoothly shifting with rotation and touch */}
                <g 
                  className={isInteracting ? '' : 'animate-caustic-rotate-shift'}
                  style={isInteracting ? {
                    transform: `translate(${-touchRotY * 0.35}px, ${touchRotX * 0.2}px)`,
                    transition: isDraggingRef.current ? 'none' : 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)'
                  } : undefined}
                >
                  {/* Wide ambient bloom */}
                  <path
                    d="M 68,44 C 64,82 62,120 78,148"
                    fill="none"
                    stroke="url(#softAmbientGlare)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    opacity="0.4"
                    filter="url(#diffuseGlow)"
                  />
                  {/* Mid-feathered glare strip */}
                  <path
                    d="M 64,40 C 60,80 57,126 76,155 C 83,165 89,173 95,182"
                    fill="none"
                    stroke="url(#primaryLeftGlare)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    opacity="0.80"
                    filter="url(#subtleBlur)"
                  />
                  {/* Soft core highlight */}
                  <path
                    d="M 65,42 C 62,78 59,122 75,150"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    opacity="0.75"
                  />
                </g>

                {/* 10. Right Side Soft Rim Ambient Refraction */}
                <path
                  d="M 137,38 C 140,75 139,120 125,152 C 120,163 113,172 105,182"
                  fill="none"
                  stroke="url(#rightEdgeGlare)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  filter="url(#subtleBlur)"
                />

                {/* 11. Fluted Crystal Stem with Smooth Parabolic Blend */}
                <path
                  d="M 94,188 
                     C 96,192 97,196 97,202 
                     L 97,252 
                     C 97,258 92,264 84,270 
                     L 116,270 
                     C 108,264 103,258 103,252 
                     L 103,202 
                     C 103,196 104,192 106,188 
                     Z"
                  fill="url(#stemShader)"
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth="0.8"
                />
                {/* Stem Center Soft Specular Highlight (Diffused, not harsh) */}
                <line
                  x1="99.5"
                  y1="192"
                  x2="99.5"
                  y2="260"
                  stroke="rgba(255,255,255,0.75)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  filter="url(#subtleBlur)"
                />

                {/* 12. Soft Beveled Crystal Foot Base */}
                {/* Foot Disc Volume */}
                <ellipse
                  cx="100"
                  cy="274"
                  rx="48"
                  ry="10.5"
                  fill="url(#baseBevelGrad)"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="1.2"
                />
                {/* Foot Inner Bevel Refraction (Soft blur, no wireframe) */}
                <ellipse
                  cx="100"
                  cy="271"
                  rx="38"
                  ry="7.5"
                  fill="none"
                  stroke="rgba(255,255,255,0.22)"
                  strokeWidth="1"
                  filter="url(#subtleBlur)"
                />
                {/* Foot Front Rim Soft Crescent Glow */}
                <path
                  d="M 56,275 A 48 10.5 0 0 0 144 275"
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  filter="url(#softGlow)"
                />
                <path
                  d="M 57,275 A 47 10.3 0 0 0 143 275"
                  fill="none"
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />

                {/* 13. Sound Resonance Waves (Pulsing when singing into microphone) */}
                {isActive && (
                  <>
                    <ellipse
                      cx="100"
                      cy="32"
                      rx={42 + (progress % 22)}
                      ry={8.5 + (progress % 4.5)}
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth="1.6"
                      className="opacity-70 animate-ping pointer-events-none"
                      style={{ animationDuration: '1.1s' }}
                    />
                    <circle
                      cx="100"
                      cy="120"
                      r={18 + progress * 0.45}
                      fill="none"
                      stroke="#7dd3fc"
                      strokeWidth="1.2"
                      className="opacity-35 animate-pulse pointer-events-none"
                    />
                  </>
                )}

                {/* 14. PROGRESSIVE FRACTURE CRACKS (Spiderweb cracks with radiant core) */}
                {/* Phase 1: Hairline Fractures (> 30% progress) */}
                {progress >= 30 && (
                  <g filter="url(#crackGlow)" className="animate-fadeIn">
                    <path
                      d="M 100,105 L 94,120 L 104,136 L 98,154 M 94,120 L 80,126 L 72,138"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M 100,105 L 94,120 L 104,136 L 98,154 M 94,120 L 80,126 L 72,138"
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                )}

                {/* Phase 2: Spreading Spiderweb Cracks (> 60% progress) */}
                {progress >= 60 && (
                  <g filter="url(#crackGlow)" className="animate-fadeIn">
                    <path
                      d="M 104,136 L 118,142 L 126,132 L 136,145 M 118,142 L 114,160 L 102,172"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M 104,136 L 118,142 L 126,132 L 136,145 M 118,142 L 114,160 L 102,172"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M 94,80 L 100,105 L 110,88 L 118,70"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </g>
                )}

                {/* Phase 3: Critical Structural Failure Fractures (> 85% progress) */}
                {progress >= 85 && (
                  <g filter="url(#crackGlow)">
                    <path
                      d="M 72,138 L 62,150 L 58,162 M 100,32 L 95,55 L 82,72 M 142,32 L 132,60 L 126,75 L 134,100"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M 72,138 L 62,150 L 58,162 M 100,32 L 95,55 L 82,72 M 142,32 L 132,60 L 126,75 L 134,100"
                      fill="none"
                      stroke="#e0f2fe"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Glowing core sparks */}
                    <circle cx="104" cy="136" r="4" fill="#ffffff" className="animate-ping" />
                    <circle cx="94" cy="120" r="3" fill="#38bdf8" />
                  </g>
                )}
              </g>
            </svg>
          </div>

          {!isActive ? (
            <button 
              onClick={handleStart} 
              className="mt-14 px-8 py-4 rounded-full font-heading font-black text-base uppercase tracking-wider text-white bg-[#00b4d8] hover:bg-[#0096c7] shadow-[0_5px_0_0_#0077b6] active:translate-y-1 active:shadow-[0_1px_0_0_#0077b6] transition-all cursor-pointer"
            >
              Activar Micrófono
            </button>
          ) : (
            <div className="mt-12 flex flex-col items-center gap-1.5 animate-pulse">
              <span className="text-cyan-300 font-bold text-sm tracking-wide">
                ¡Canta ahora con tu voz más aguda!
              </span>
              <span className="text-slate-400 text-xs font-medium">
                {progress > 0 ? `Carga: ${Math.round(progress)}%` : 'Esperando tu voz...'}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="relative z-10 flex flex-col items-center justify-center animate-fade-in px-4">
          {/* Shards (CSS explosion) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="w-5 h-5 bg-white/70 border border-cyan-200 transform rotate-45 translate-x-28 -translate-y-28 opacity-0 animate-[shatter_1.2s_ease-out_forwards]"></div>
             <div className="w-8 h-4 bg-white/60 border border-white transform -rotate-12 -translate-x-32 -translate-y-16 opacity-0 animate-[shatter_1.2s_ease-out_forwards_0.1s]"></div>
             <div className="w-4 h-10 bg-cyan-200/80 transform rotate-[70deg] translate-x-16 -translate-y-40 opacity-0 animate-[shatter_1.2s_ease-out_forwards_0.18s]"></div>
             <div className="w-6 h-6 bg-white/70 transform -rotate-45 -translate-x-36 translate-y-16 opacity-0 animate-[shatter_1.2s_ease-out_forwards_0.15s]"></div>
             <div className="w-9 h-3 bg-white/80 transform rotate-12 translate-x-36 translate-y-28 opacity-0 animate-[shatter_1.2s_ease-out_forwards_0.05s]"></div>
             <div className="w-3 h-7 bg-cyan-300/80 transform rotate-45 -translate-x-12 translate-y-36 opacity-0 animate-[shatter_1.2s_ease-out_forwards_0.22s]"></div>
          </div>

          <div className="relative z-50 flex flex-col items-center justify-center w-full max-w-sm">
            <div className="w-full p-1 sm:p-[5px] rounded-full bg-[#0f172a] shadow-[inset_0_4px_6px_-2px_rgba(0,0,0,0.7)] border border-slate-800">
              <div className="w-full p-1.5 flex flex-col items-center justify-center rounded-full bg-[#090d16] shadow-[inset_0_16px_20px_-4px_rgba(0,0,0,0.8),_inset_0_-2px_4px_rgba(255,255,255,0.05)] border border-slate-900">
                <button
                  onClick={onContinue}
                  className="w-full flex items-center justify-center px-6 py-4 rounded-full transition-all duration-75 relative border border-transparent btn-3d bg-[#4648d4] text-white shadow-[0px_4px_0px_0px_rgba(30,30,120,1)] hover:brightness-110 active:translate-y-[2px] active:shadow-[0px_2px_0px_0px_rgba(30,30,120,1)] group cursor-pointer"
                >
                  <div className="flex flex-col items-center text-center gap-0.5">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-indigo-200 drop-shadow-sm leading-tight">
                      UNIDAD 3
                    </span>
                    <span className="text-base sm:text-lg font-black text-white drop-shadow-md leading-tight">
                      CONTINUAR A LA UNIDAD 3
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
