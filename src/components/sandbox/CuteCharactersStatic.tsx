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
import styles from './CuteCharactersStatic.module.css';

export type {CuteCharacterFucsiaAnimatedRef};

export interface CuteCharactersStaticProps {
  className?: string;
  excited?: boolean;
  nameFocused?: boolean;
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
  mirrored?: boolean;
  caravanToRight?: boolean;
}

const CARAVAN_DELAYS = [0.65, 0.45, 0.25, 0.85];

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
  caravanShiftX?: number;
}

export const CuteCharactersStatic: React.FC<CuteCharactersStaticProps> = ({
  className = '',
  excited = false,
  nameFocused = false,
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
  mirrored = false,
  caravanToRight = false,
}) => {
  const [caravanDir, setCaravanDir] = useState<'right' | 'left' | 'idle'>(
    caravanToRight ? 'right' : 'idle'
  );
  const [settledGaze, setSettledGaze] = useState(caravanToRight);
  const prevCaravanRef = useRef(caravanToRight);

  useEffect(() => {
    if (caravanToRight && !prevCaravanRef.current) {
      setCaravanDir('right');
      setSettledGaze(false);
      const timer = setTimeout(() => {
        setSettledGaze(true);
      }, 2100);
      return () => clearTimeout(timer);
    } else if (!caravanToRight && prevCaravanRef.current) {
      setCaravanDir('left');
      setSettledGaze(false);
      const timer = setTimeout(() => {
        setCaravanDir('idle');
      }, 2100);
      return () => clearTimeout(timer);
    }
    prevCaravanRef.current = caravanToRight;
  }, [caravanToRight]);

  const isMirrored = mirrored || (caravanToRight && settledGaze);
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

  const {
    playSquish,
    playDroplet,
    playWinkPop,
    playValidationChime,
    playHappyHop,
  } = useJellyAsmrAudio();

  const [blinkMorado, setBlinkMorado] = useState(false);
  const [blinkFucsia, setBlinkFucsia] = useState(false);
  const [blinkAmarillo, setBlinkAmarillo] = useState(false);
  const [blinkNaranja, setBlinkNaranja] = useState(false);
  const [winkAmarillo, setWinkAmarillo] = useState(false);

  // Coordinacion de audio ASMR para cada aterrizaje de la caravana (ida y vuelta)
  useEffect(() => {
    if (caravanDir === 'idle') return;
    const timers: ReturnType<typeof setTimeout>[] = [];

    if (caravanDir === 'right') {
      // Amarillo: primer explorador en cruzar dando saltos agiles (delay 0.25s)
      timers.push(setTimeout(() => playDroplet('amarillo', 1.1), 450));
      timers.push(setTimeout(() => playDroplet('amarillo', 1.2), 800));
      timers.push(setTimeout(() => playSquish('amarillo', 1.0), 1400));

      // Fucsia: segundo personaje en cruzar con rebotes acuosos (delay 0.45s)
      timers.push(setTimeout(() => playDroplet('fucsia', 1.0), 650));
      timers.push(setTimeout(() => playDroplet('fucsia', 1.1), 1000));
      timers.push(setTimeout(() => playSquish('fucsia', 0.9), 1600));

      // Morado: tercer personaje con aterrizaje pesado (delay 0.65s)
      timers.push(setTimeout(() => playDroplet('morado', 1.0), 850));
      timers.push(setTimeout(() => playDroplet('morado', 1.1), 1200));
      timers.push(setTimeout(() => playSquish('morado', 1.3), 1800));

      // Naranja: cuarto personaje con saltitos ritmicos (delay 0.85s)
      timers.push(setTimeout(() => playDroplet('naranja', 1.0), 1050));
      timers.push(setTimeout(() => playDroplet('naranja', 1.1), 1400));
      timers.push(setTimeout(() => playSquish('naranja', 1.1), 2000));
    } else if (caravanDir === 'left') {
      // Regreso a la izquierda
      timers.push(setTimeout(() => playDroplet('amarillo', 1.0), 450));
      timers.push(setTimeout(() => playDroplet('amarillo', 1.1), 800));
      timers.push(setTimeout(() => playSquish('amarillo', 1.0), 1400));

      timers.push(setTimeout(() => playDroplet('fucsia', 1.0), 650));
      timers.push(setTimeout(() => playDroplet('fucsia', 1.1), 1000));
      timers.push(setTimeout(() => playSquish('fucsia', 0.9), 1600));

      timers.push(setTimeout(() => playDroplet('morado', 1.0), 850));
      timers.push(setTimeout(() => playDroplet('morado', 1.1), 1200));
      timers.push(setTimeout(() => playSquish('morado', 1.3), 1800));

      timers.push(setTimeout(() => playDroplet('naranja', 1.0), 1050));
      timers.push(setTimeout(() => playDroplet('naranja', 1.1), 1400));
      timers.push(setTimeout(() => playSquish('naranja', 1.1), 2000));
    }

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [caravanDir, playDroplet, playSquish]);

  // Coreografia del ojo de ver contrasena:
  // 1) abren los ojos 2) saltan 3 veces de alegria en su puesto (rebote aleatorio por personaje)
  // 3) luego se estiran con progreso creciente hacia la clave y miran fijamente
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
    playHappyHop();

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
  }, [reveal, playHappyHop]);

  // Si se destapa el ojo con >=4 caracteres ya escritos, se acercan a mirar por 1.2s tras completar los 3 saltos
  const [forcePeek, setForcePeek] = useState(false);

  useEffect(() => {
    if (reveal && passwordLength >= 4) {
      const timerPeek = setTimeout(() => {
        setForcePeek(true);
        const timerBack = setTimeout(() => {
          setForcePeek(false);
        }, 1200);
        return () => clearTimeout(timerBack);
      }, 1150);
      return () => clearTimeout(timerPeek);
    } else {
      setForcePeek(false);
    }
  }, [reveal, passwordLength >= 4]);

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
  // 1 char: 0.75
  // 2 chars: 0.50
  // 3 chars: 0.25
  // 4+ chars: 0.0 (bien atras, en la posicion de reposo inicial)
  const retreatRatio = forcePeek ? 1 : Math.max(0, 1 - passwordLength / 4);

  const effExcited = error
    ? 0
    : reveal
      ? (see.armed && retreatRatio > 0 ? 1 : 0)
      : excited && !shy ? 1 : 0;

  const effProgress = reveal
    ? (see.armed ? Math.min(see.progress, retreatRatio) : 0)
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

  const loginSlots: CharacterSlot[] = [
    {
      left: 144.375,
      bottom: 0,
      zIndex: 10,
      scale: 1.04534,
      scaleY: 1.5,
      origin: 'bottom right',
      caravanShiftX: 730.625,
      character: moradoNode,
    },
    {
      left: 294,
      bottom: 30,
      zIndex: 20,
      scale: 1,
      origin: 'bottom left',
      caravanShiftX: 502,
      character: fucsiaNode,
    },
    {
      left: 440,
      bottom: 35,
      zIndex: 30,
      scale: 1.12,
      origin: 'bottom left',
      caravanShiftX: 224,
      character: amarilloNode,
    },
    {
      left: -50,
      bottom: 30.56,
      zIndex: 40,
      scale: 1.408,
      scaleY: 1.472,
      origin: 'bottom left',
      caravanShiftX: 930,
      character: naranjaNode,
    },
  ];

  // Composicion espejo para la card de registro (blobs a la derecha mirando el formulario a la izquierda)
  // Distribuidos armonica y simetricamente a lo largo del canvas de 640px:
  // Amarillo en primer plano a la izquierda (cerca al formulario), Fucsia al medio, Morado alto detras, Naranja ancho en la esquina derecha.
  const mirroredSlots: CharacterSlot[] = [
    {
      left: 235,
      bottom: 0,
      zIndex: 10,
      scale: 1.04534,
      scaleY: 1.5,
      origin: 'bottom left',
      character: moradoNode,
    },
    {
      left: 156,
      bottom: 30,
      zIndex: 20,
      scale: 1,
      origin: 'bottom right',
      character: fucsiaNode,
    },
    {
      left: 24,
      bottom: 35,
      zIndex: 30,
      scale: 1.12,
      origin: 'bottom right',
      character: amarilloNode,
    },
    {
      left: 240,
      bottom: 30.56,
      zIndex: 40,
      scale: 1.408,
      scaleY: 1.472,
      origin: 'bottom right',
      character: naranjaNode,
    },
  ];

  const characterSlots: CharacterSlot[] = mirrored ? mirroredSlots : loginSlots;

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

  let finalLookX = 0;
  let finalLookY = 0;

  if (isMirrored) {
    // Modo Registro (blobs a la derecha mirando el formulario a la izquierda)
    if (caravanToRight && !settledGaze) {
      // Durante el salto inicial hacia la derecha en la caravana
      finalLookX = 0.4;
      finalLookY = 0;
    } else if (submitHovered) {
      // Mirando hacia el boton "Crear cuenta" abajo a la izquierda
      finalLookX = -0.65;
      finalLookY = 0.65;
    } else if (reveal && see.armed) {
      // Mirando con atencion y curiosidad hacia la contrasena destapada a la izquierda
      finalLookX = -0.75;
      finalLookY = 0.15;
    } else if (nameFocused) {
      // Mirando hacia el campo Nombre arriba a la izquierda
      finalLookX = -0.75;
      finalLookY = -0.2;
    } else if (excited) {
      // Mirando hacia el campo Correo al centro a la izquierda
      finalLookX = -0.75;
      finalLookY = -0.05;
    } else {
      // Reposo atento en modo registro observando el formulario a la izquierda
      finalLookX = -0.7;
      finalLookY = 0.05;
    }
  } else {
    // Modo Login
    if (submitHovered) {
      finalLookX = 0.35;
      finalLookY = 0.65;
    } else if (reveal && see.armed) {
      finalLookX = 0.65;
      finalLookY = 0.15;
    } else if (excited) {
      finalLookX = 0.65;
      finalLookY = -0.1;
    } else {
      finalLookX = ready ? look.x : 0;
      finalLookY = ready ? look.y : 0;
    }
  }

  const caravanClass =
    caravanDir === 'right'
      ? styles.caravanWrapper
      : caravanDir === 'left'
      ? styles.caravanReturn
      : '';

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
          ['--dir']: isMirrored ? -1 : 1,
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
            <div
              className={caravanClass}
              style={{
                ['--caravan-delay']: `${CARAVAN_DELAYS[index]}s`,
                ['--caravan-x']: `${slot.caravanShiftX ?? 605}px`,
              } as React.CSSProperties}
            >
              <div
                className={reveal && jump ? styles.hopCage : ''}
                style={{
                  ['--hop-h']: jump?.[index]?.[0] ? `${jump[index][0]}px` : '-40px',
                  ['--hop-dur']: jump?.[index]?.[1] ? `${jump[index][1]}s` : '0.7s',
                  ['--hop-delay']: jump?.[index]?.[2] ? `${jump[index][2]}s` : '0s',
                } as React.CSSProperties}
              >
                {slot.character}
              </div>
            </div>
          </div>
        ))}
        <CuteTactileCanvas
          ref={tactileCanvasRef}
          width={DESIGN_WIDTH * 2}
          height={DESIGN_HEIGHT}
        />
      </div>
    </div>
  );
};
