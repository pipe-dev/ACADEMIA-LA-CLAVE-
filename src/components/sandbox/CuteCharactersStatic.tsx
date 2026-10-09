'use client';

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  CharacterMorado,
  CharacterFucsia,
  CharacterAmarillo,
  CharacterNaranja,
} from './characters';
import type {
  CuteCharacterFucsiaRef,
  CuteCharacterFucsiaAnimatedRef,
  CuteCharacterNaranjaRef,
} from './characters';
import {CuteCharacterTactileCage} from './CuteCharacterTactileCage';
import {
  JELLY_PRESET_MORADO,
  JELLY_PRESET_FUCSIA,
  JELLY_PRESET_AMARILLO,
  JELLY_PRESET_NARANJA,
} from './useTactileJellyPhysics';
import {CuteTactileCanvas, CuteTactileCanvasRef} from './CuteTactileCanvas';

export type {CuteCharacterFucsiaAnimatedRef};

export interface CuteCharactersStaticProps {
  className?: string;
  excited?: boolean;
  shy?: boolean;
  reveal?: boolean;
  error?: boolean;
  typing?: boolean;
  typingProgress?: number;
  animateFucsia?: boolean;
  fucsiaRef?: React.Ref<CuteCharacterFucsiaAnimatedRef>;
  /** True cuando la contrasena es visible y lleva >=5 caracteres: los blobs
      hacen la secuencia del email INVERTIDA (se retiran a la posicion inicial). */
  backInput?: boolean;
}

/**
 * CuteCharactersStatic
 * Escenario de los 4 personajes agrupados, cada uno construido con su HTML/CSS
 * original (public/4personajes) sin alterar medidas, gradientes ni sombras.
 * Cada personaje tiene respiracion sinusoidal viva con parametros asincronos.
 */
const DESIGN_WIDTH = 640;
const DESIGN_HEIGHT = 705;
const DEFAULT_SCALE = 420 / DESIGN_WIDTH;

interface CharacterSlot {
  left: number;
  bottom: number;
  zIndex: number;
  scale: number;
  scaleY?: number;
  origin: string;
  character: React.ReactNode;
}

export const CuteCharactersStatic: React.FC<CuteCharactersStaticProps> = ({
  className = '',
  excited = false,
  shy = false,
  reveal = false,
  error = false,
  typing = false,
  typingProgress = 0,
  animateFucsia = true,
  fucsiaRef,
  backInput = false,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [look, setLook] = useState({x: 0, y: 0});
  // Seguimiento del cursor activo SOLO despues de que los 4 terminan el saludo
  // (los asentidos terminan ~5.2s; liberamos un poco despues).
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 5400);
    return () => clearTimeout(t);
  }, []);

  // Coreografia del ojo de ver contrasena:
  // 1) abren los ojos 2) saltan de alegria (rebote aleatorio por personaje)
  // 3) luego se estiran a la derecha con progreso creciente para seguir viendo
  const [see, setSee] = useState({armed: false, progress: 0});
  const [jump, setJump] = useState<(number[] | null)[] | null>(null);

  useEffect(() => {
    if (!reveal) {
      setSee({armed: false, progress: 0});
      setJump(null);
      return;
    }

    setJump([
      [-(24 + Math.random() * 24), 0.6 + Math.random() * 0.4, 0.05 + Math.random() * 0.28],
      [-(24 + Math.random() * 24), 0.6 + Math.random() * 0.4, 0.05 + Math.random() * 0.28],
      [-(24 + Math.random() * 24), 0.6 + Math.random() * 0.4, 0.05 + Math.random() * 0.28],
      [-(24 + Math.random() * 24), 0.6 + Math.random() * 0.4, 0.05 + Math.random() * 0.28],
    ]);

    let rafId: number | null = null;
    const t = setTimeout(() => {
      setSee({armed: true, progress: 0});
      let start: number | null = null;
      const step = (now: number) => {
        if (start === null) start = now;
        const p = Math.min(1, (now - start) / 700);
        setSee((prev) => ({...prev, progress: p}));
        if (p < 1) {
          rafId = requestAnimationFrame(step);
        }
      };
      rafId = requestAnimationFrame(step);
    }, 1150);

    return () => {
      clearTimeout(t);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [reveal]);

  const effShy = error ? 0 : reveal ? 0 : shy ? 1 : 0;

  const effExcited = error
    ? 0
    : reveal && see.armed
      ? 1
      : excited && !shy ? 1 : 0;
  const effProgress = reveal && see.armed
    ? see.progress
    : typingProgress;

  const handleLook = (e: MouseEvent) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
    const y = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height) * 2 - 1));
    setLook({x, y});
  };

  const tactileCanvasRef = useRef<CuteTactileCanvasRef>(null);

  const handleRippleTrigger = useCallback(
    (clientX: number, clientY: number, intensity: number) => {
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const currentScale = rect.width / DESIGN_WIDTH;
      const stageX = (clientX - rect.left) / currentScale;
      const stageY = (clientY - rect.top) / currentScale;
      tactileCanvasRef.current?.spawnRipple(stageX, stageY, intensity);
    },
    []
  );

  const handleTouchPress = useCallback(
    (clientX: number, clientY: number, active: boolean) => {
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const currentScale = rect.width / DESIGN_WIDTH;
      const stageX = (clientX - rect.left) / currentScale;
      const stageY = (clientY - rect.top) / currentScale;
      tactileCanvasRef.current?.setTouchGlow(stageX, stageY, active);
    },
    []
  );

  const naranjaRef = useRef<CuteCharacterNaranjaRef>(null);

  const handleNaranjaTouch = useCallback(
    (clientX: number, clientY: number, active: boolean) => {
      if (active) naranjaRef.current?.poke();
      handleTouchPress(clientX, clientY, active);
    },
    [handleTouchPress]
  );

  const fucsiaBlushRef = useRef<CuteCharacterFucsiaRef>(null);

  const handleFucsiaTouch = useCallback(
    (clientX: number, clientY: number, active: boolean) => {
      if (active) fucsiaBlushRef.current?.blush();
      handleTouchPress(clientX, clientY, active);
    },
    [handleTouchPress]
  );

  const characterSlots: CharacterSlot[] = [
    {
      left: 144.375,
      bottom: 0,
      zIndex: 10,
      scale: 1.04534,
      scaleY: 1.5,
      origin: 'bottom right',
      character: (
<CuteCharacterTactileCage
            config={JELLY_PRESET_MORADO}
            className={reveal ? 'hop-cage' : ''}
            onRippleTrigger={handleRippleTrigger}
            onTouchPress={handleTouchPress}
          >
            <CharacterMorado typing={typing} error={error} />
          </CuteCharacterTactileCage>
      ),
    },
    {
      left: 294,
      bottom: 30,
      zIndex: 20,
      scale: 1,
      origin: 'bottom left',
      character: (
<CuteCharacterTactileCage
            config={JELLY_PRESET_FUCSIA}
            className={reveal ? 'hop-cage' : ''}
            onRippleTrigger={handleRippleTrigger}
            onTouchPress={handleFucsiaTouch}
          >
            <CharacterFucsia
              error={error}
              animate={animateFucsia && !!fucsiaRef}
              animatedRef={fucsiaRef}
              fucsiaRef={fucsiaBlushRef}
            />
          </CuteCharacterTactileCage>
      ),
    },
    {
      left: 440,
      bottom: 35,
      zIndex: 30,
      scale: 1,
      origin: 'bottom left',
      character: (
<CuteCharacterTactileCage
            config={JELLY_PRESET_AMARILLO}
            className={reveal ? 'hop-cage' : ''}
            onRippleTrigger={handleRippleTrigger}
            onTouchPress={handleTouchPress}
          >
            <CharacterAmarillo
              typing={typing}
              shy={shy && !reveal && !error}
              error={error}
            />
          </CuteCharacterTactileCage>
      ),
    },
    {
      left: -50,
      bottom: 30.56,
      zIndex: 40,
      scale: 1.408,
      scaleY: 1.472,
      origin: 'bottom left',
      character: (
<CuteCharacterTactileCage
          config={JELLY_PRESET_NARANJA}
          className={reveal ? 'hop-cage' : ''}
          onRippleTrigger={handleRippleTrigger}
          onTouchPress={handleNaranjaTouch}
        >
          <CharacterNaranja ref={naranjaRef} typing={typing} error={error} />
        </CuteCharacterTactileCage>
      ),
    },
  ];

  useEffect(() => {
    window.addEventListener('mousemove', handleLook);
    return () => window.removeEventListener('mousemove', handleLook);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const update = () => {
      const width = el.clientWidth;
      if (width > 0) {
        setScale(width / DESIGN_WIDTH);
      }
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      className={`relative w-full select-none overflow-visible ${className}`}
      style={{height: DESIGN_HEIGHT * scale}}
    >
      <div
        className="absolute top-0 left-0 overflow-visible"
        style={{
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          ['--look-x']: ready ? look.x : 0,
          ['--look-y']: ready ? look.y : 0,
          ['--shy']: effShy,
          ['--excited']: effExcited,
          ['--typing']: typing ? 1 : 0,
          ['--typing-progress']: effProgress,
        } as React.CSSProperties}
      >
        {characterSlots.map((slot, index) => (
          <div
            key={index}
            className="absolute"
            style={{
              left: slot.left,
              bottom: slot.bottom,
              zIndex: slot.zIndex,
              transform: `scale(${slot.scale}, ${slot.scaleY ?? slot.scale})`,
              transformOrigin: slot.origin,
              ['--hop-h']: jump?.[index]?.[0] ? `${jump[index][0]}px` : '0px',
              ['--hop-dur']: jump?.[index]?.[1] ? `${jump[index][1]}s` : '0s',
              ['--hop-delay']: jump?.[index]?.[2] ? `${jump[index][2]}s` : '0s',
            } as React.CSSProperties}
          >
            {slot.character}
          </div>
        ))}
        <CuteTactileCanvas
          ref={tactileCanvasRef}
          width={DESIGN_WIDTH}
          height={DESIGN_HEIGHT}
        />
      </div>
    </div>
  );
};
