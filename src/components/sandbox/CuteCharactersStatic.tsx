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
import {useJellyAsmrAudio} from '../../utils/useJellyAsmrAudio';

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
  passwordLength?: number;
  emailValid?: boolean;
  submitHovered?: boolean;
  rememberChecked?: boolean;
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
  passwordLength = 0,
  emailValid = false,
  submitHovered = false,
  rememberChecked = false,
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

  const {playSquish, playDroplet, playWinkPop, playValidationChime} = useJellyAsmrAudio();

  const [blinkMorado, setBlinkMorado] = useState(false);
  const [blinkFucsia, setBlinkFucsia] = useState(false);
  const [blinkAmarillo, setBlinkAmarillo] = useState(false);
  const [blinkNaranja, setBlinkNaranja] = useState(false);
  const [winkAmarillo, setWinkAmarillo] = useState(false);

  // Coreografia de ver contrasena:
  // 1) Al destapar el ojo, se acercan fluidamente a mirar de cerca (transicion nativa CSS).
  // 2) A medida que se van escribiendo caracteres, van volviendo a la posicion inicial.
  // 3) Al escribir el 5to caracter ya quedan bien atras en la posicion de reposo original.
  // 4) Si se destapa el ojo con >=5 caracteres ya escritos, se acercan fluidamente por 1.2s y regresan.
  const [forcePeek, setForcePeek] = useState(false);

  useEffect(() => {
    if (reveal && passwordLength >= 5) {
      setForcePeek(true);
      const timer = setTimeout(() => {
        setForcePeek(false);
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      setForcePeek(false);
    }
  }, [reveal, passwordLength >= 5]);

  const effShy = error ? 0 : reveal ? 0 : shy ? 1 : 0;

  // Ciclos de parpadeo biologico asincrono (suspendido cuando estan dormidos)
  useEffect(() => {
    if (effShy === 1) return;

    const setupBlink = (
      setBlink: React.Dispatch<React.SetStateAction<boolean>>,
      minMs: number,
      maxMs: number
    ) => {
      let active = true;
      let timer: ReturnType<typeof setTimeout>;
      const run = () => {
        const delay = minMs + Math.random() * (maxMs - minMs);
        timer = setTimeout(() => {
          if (!active) return;
          setBlink(true);
          setTimeout(() => {
            if (active) setBlink(false);
          }, 130);
          run();
        }, delay);
      };
      run();
      return () => {
        active = false;
        clearTimeout(timer);
      };
    };

    const cM = setupBlink(setBlinkMorado, 3400, 6200);
    const cF = setupBlink(setBlinkFucsia, 3800, 6800);
    const cA = setupBlink(setBlinkAmarillo, 3200, 5900);
    const cN = setupBlink(setBlinkNaranja, 4000, 7200);

    return () => {
      cM();
      cF();
      cA();
      cN();
    };
  }, [effShy]);

  // Reaccion al validar email con exito
  const prevEmailValidRef = useRef(false);
  useEffect(() => {
    if (emailValid && !prevEmailValidRef.current) {
      playValidationChime();
    }
    prevEmailValidRef.current = !!emailValid;
  }, [emailValid, playValidationChime]);

  // Reaccion al alternar Recordarme (guiño de Amarillo + pop ASMR)
  const prevRememberRef = useRef(rememberChecked);
  useEffect(() => {
    if (rememberChecked !== prevRememberRef.current) {
      playWinkPop();
      setWinkAmarillo(true);
      const t = setTimeout(() => setWinkAmarillo(false), 280);
      return () => clearTimeout(t);
    }
    prevRememberRef.current = rememberChecked;
  }, [rememberChecked, playWinkPop]);

  // Progreso de acercamiento a la contrasena:
  // 0 chars: 1.0 (miran de cerca)
  // 1 char: 0.80
  // 2 chars: 0.60
  // 3 chars: 0.40
  // 4 chars: 0.20
  // 5+ chars: 0.0 (bien atras, en la posicion de reposo inicial)
  const retreatRatio = forcePeek ? 1 : Math.max(0, 1 - passwordLength / 5);

  const effExcited = error
    ? 0
    : reveal
      ? (retreatRatio > 0 ? 1 : 0)
      : excited && !shy ? 1 : 0;

  const effProgress = reveal
    ? retreatRatio
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
      playDroplet('fucsia', 1 + intensity * 0.2);
    },
    [playDroplet]
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

  const handleMoradoTouch = useCallback(
    (clientX: number, clientY: number, active: boolean) => {
      if (active) playSquish('morado', 1.1);
      else playDroplet('morado');
      handleTouchPress(clientX, clientY, active);
    },
    [playSquish, playDroplet, handleTouchPress]
  );

  const naranjaRef = useRef<CuteCharacterNaranjaRef>(null);

  const handleNaranjaTouch = useCallback(
    (clientX: number, clientY: number, active: boolean) => {
      if (active) {
        naranjaRef.current?.poke();
        playSquish('naranja', 1.0);
      } else {
        playDroplet('naranja');
      }
      handleTouchPress(clientX, clientY, active);
    },
    [playSquish, playDroplet, handleTouchPress]
  );

  const fucsiaBlushRef = useRef<CuteCharacterFucsiaRef>(null);

  const handleFucsiaTouch = useCallback(
    (clientX: number, clientY: number, active: boolean) => {
      if (active) {
        fucsiaBlushRef.current?.blush();
        playSquish('fucsia', 1.0);
      } else {
        playDroplet('fucsia');
      }
      handleTouchPress(clientX, clientY, active);
    },
    [playSquish, playDroplet, handleTouchPress]
  );

  const handleAmarilloTouch = useCallback(
    (clientX: number, clientY: number, active: boolean) => {
      if (active) playSquish('amarillo', 1.2);
      else playDroplet('amarillo');
      handleTouchPress(clientX, clientY, active);
    },
    [playSquish, playDroplet, handleTouchPress]
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
          onRippleTrigger={handleRippleTrigger}
          onTouchPress={handleMoradoTouch}
        >
          <CharacterMorado typing={typing} error={error} blink={blinkMorado} />
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
          onRippleTrigger={handleRippleTrigger}
          onTouchPress={handleFucsiaTouch}
        >
          <CharacterFucsia
            error={error}
            blink={blinkFucsia}
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
          onRippleTrigger={handleRippleTrigger}
          onTouchPress={handleAmarilloTouch}
        >
          <CharacterAmarillo
            typing={typing}
            shy={shy && !reveal && !error}
            error={error}
            blink={blinkAmarillo}
            wink={winkAmarillo}
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
          onRippleTrigger={handleRippleTrigger}
          onTouchPress={handleNaranjaTouch}
        >
          <CharacterNaranja
            ref={naranjaRef}
            typing={typing}
            error={error}
            blink={blinkNaranja}
          />
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

  const finalLookX = submitHovered ? 0.35 : ready ? look.x : 0;
  const finalLookY = submitHovered ? 0.65 : ready ? look.y : 0;

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
          ['--look-x']: finalLookX,
          ['--look-y']: finalLookY,
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
