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
import {useJellyAsmrAudio, CharacterId} from '../../utils/useJellyAsmrAudio';
import styles from './CuteCharactersStatic.module.css';

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
  const [caravanKey, setCaravanKey] = useState(0);
  const caravanAudibleRef = useRef(false);

  // Seguimiento del cursor activo tras completar la caravana de entrada (~1.9s)
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const t = setTimeout(() => setReady(true), 1950);
    return () => clearTimeout(t);
  }, [caravanKey]);

  const {
    getAudioContext,
    playSquish,
    playDroplet,
    playWinkPop,
    playValidationChime,
  } = useJellyAsmrAudio();

  // Sonido de aterrizaje identico al toque táctil (Squish + Droplet / Bloop)
  const playHopSound = useCallback(
    (character: CharacterId, hopIndex: number) => {
      const mult = hopIndex === 1 ? 0.92 : hopIndex === 3 ? 1.12 : 1.0;
      playSquish(character, 1.0 * mult);
      playDroplet(character, mult);
    },
    [playSquish, playDroplet]
  );

  // Verificacion de AudioContext y desbloqueo transparente en fase de captura
  useEffect(() => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'running') {
      caravanAudibleRef.current = true;
    }

    const unlockOnGesture = () => {
      const activeCtx = getAudioContext();
      if (activeCtx) {
        activeCtx.resume().then(() => {
          if (!caravanAudibleRef.current) {
            caravanAudibleRef.current = true;
            setCaravanKey((k) => k + 1);
          }
        }).catch(() => {});
      }
    };

    const events = ['pointerdown', 'touchstart', 'mousedown', 'keydown'];
    events.forEach((evt) => {
      window.addEventListener(evt, unlockOnGesture, {capture: true, passive: true});
    });

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, unlockOnGesture, {capture: true});
      });
    };
  }, [getAudioContext]);

  // Sincronizacion de audio ASMR con los 3 aterrizajes agiles de cada personaje
  useEffect(() => {
    const soundTimers = [
      // Morado (delays: 80ms + landings a 235ms, 568ms, 882ms)
      setTimeout(() => playHopSound('morado', 1), 315),
      setTimeout(() => playHopSound('morado', 2), 650),
      setTimeout(() => playHopSound('morado', 3), 960),
      // Fucsia (delays: 340ms + landings a 235ms, 568ms, 882ms)
      setTimeout(() => playHopSound('fucsia', 1), 575),
      setTimeout(() => playHopSound('fucsia', 2), 910),
      setTimeout(() => playHopSound('fucsia', 3), 1220),
      // Amarillo (delays: 600ms + landings a 235ms, 568ms, 882ms)
      setTimeout(() => playHopSound('amarillo', 1), 835),
      setTimeout(() => playHopSound('amarillo', 2), 1170),
      setTimeout(() => playHopSound('amarillo', 3), 1480),
      // Naranja (delays: 860ms + landings a 235ms, 568ms, 882ms)
      setTimeout(() => playHopSound('naranja', 1), 1095),
      setTimeout(() => playHopSound('naranja', 2), 1430),
      setTimeout(() => playHopSound('naranja', 3), 1740),
    ];
    return () => soundTimers.forEach(clearTimeout);
  }, [playHopSound, caravanKey]);

  const [blinkMorado, setBlinkMorado] = useState(false);
  const [blinkFucsia, setBlinkFucsia] = useState(false);
  const [blinkAmarillo, setBlinkAmarillo] = useState(false);
  const [blinkNaranja, setBlinkNaranja] = useState(false);
  const [winkAmarillo, setWinkAmarillo] = useState(false);

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

  // Al destapar el ojo de la contraseña, se inclinan con curiosidad hacia el campo
  const effExcited = error
    ? 0
    : reveal
      ? 1
      : excited && !shy ? 1 : 0;

  const effProgress = reveal
    ? 0.75
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
      if (active) playHopSound('morado', 2);
      else playDroplet('morado');
      handleTouchPress(clientX, clientY, active);
    },
    [playHopSound, playDroplet, handleTouchPress]
  );

  const naranjaRef = useRef<CuteCharacterNaranjaRef>(null);

  const handleNaranjaTouch = useCallback(
    (clientX: number, clientY: number, active: boolean) => {
      if (active) {
        naranjaRef.current?.poke();
        playHopSound('naranja', 2);
      } else {
        playDroplet('naranja');
      }
      handleTouchPress(clientX, clientY, active);
    },
    [playHopSound, playDroplet, handleTouchPress]
  );

  const fucsiaBlushRef = useRef<CuteCharacterFucsiaRef>(null);

  const handleFucsiaTouch = useCallback(
    (clientX: number, clientY: number, active: boolean) => {
      if (active) {
        fucsiaBlushRef.current?.blush();
        playHopSound('fucsia', 2);
      } else {
        playDroplet('fucsia');
      }
      handleTouchPress(clientX, clientY, active);
    },
    [playHopSound, playDroplet, handleTouchPress]
  );

  const handleAmarilloTouch = useCallback(
    (clientX: number, clientY: number, active: boolean) => {
      if (active) playHopSound('amarillo', 2);
      else playDroplet('amarillo');
      handleTouchPress(clientX, clientY, active);
    },
    [playHopSound, playDroplet, handleTouchPress]
  );

  const moradoNode = (
    <CuteCharacterTactileCage
      config={JELLY_PRESET_MORADO}
      onRippleTrigger={handleRippleTrigger}
      onTouchPress={handleMoradoTouch}
    >
      <CharacterMorado typing={typing} error={error} blink={blinkMorado} />
    </CuteCharacterTactileCage>
  );

  const fucsiaNode = (
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
  );

  const amarilloNode = (
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
  );

  const naranjaNode = (
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
  );

  const characterSlots: CharacterSlot[] = [
    {
      left: 144.375,
      bottom: 0,
      zIndex: 10,
      scale: 1.04534,
      scaleY: 1.5,
      origin: 'bottom right',
      character: moradoNode,
    },
    {
      left: 294,
      bottom: 30,
      zIndex: 20,
      scale: 1,
      origin: 'bottom left',
      character: fucsiaNode,
    },
    {
      left: 440,
      bottom: 35,
      zIndex: 50,
      scale: 1.12,
      origin: 'bottom left',
      character: amarilloNode,
    },
    {
      left: -50,
      bottom: 30.56,
      zIndex: 40,
      scale: 1.408,
      scaleY: 1.472,
      origin: 'bottom left',
      character: naranjaNode,
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

  const finalLookX = submitHovered
    ? 0.35
    : reveal
    ? 0.65
    : excited
    ? 0.65
    : ready
    ? look.x
    : 0;

  const finalLookY = submitHovered
    ? 0.65
    : reveal
    ? 0.15
    : excited
    ? -0.1
    : ready
    ? look.y
    : 0;

  return (
    <div
      ref={wrapRef}
      className={`relative w-full select-none pointer-events-none ${className}`}
      style={{
        height: DESIGN_HEIGHT * scale,
        overflow: 'visible',
        zIndex: 30,
      }}
    >
      <div
        className="absolute top-0 left-0 pointer-events-none"
        style={{
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          overflow: 'visible',
          zIndex: 30,
          ['--dir']: 1,
          ['--look-x']: finalLookX,
          ['--look-y']: finalLookY,
          ['--shy']: effShy,
          ['--excited']: effExcited,
          ['--typing']: typing ? 1 : 0,
          ['--typing-progress']: effProgress,
        } as React.CSSProperties}
      >
        {characterSlots.map((slot, index) => {
          const caravanClass =
            index === 0
              ? styles.hopMorado
              : index === 1
              ? styles.hopFucsia
              : index === 2
              ? styles.hopAmarillo
              : styles.hopNaranja;

          return (
            <div
              key={`${index}-${caravanKey}`}
              className="absolute pointer-events-auto"
              style={{
                left: slot.left,
                bottom: slot.bottom,
                zIndex: slot.zIndex,
                transform: `scale(${slot.scale}, ${slot.scaleY ?? slot.scale})`,
                transformOrigin: slot.origin,
              } as React.CSSProperties}
            >
              <div className={caravanClass}>
                {slot.character}
              </div>
            </div>
          );
        })}
        <CuteTactileCanvas
          ref={tactileCanvasRef}
          width={DESIGN_WIDTH}
          height={DESIGN_HEIGHT}
        />
      </div>
    </div>
  );
};

