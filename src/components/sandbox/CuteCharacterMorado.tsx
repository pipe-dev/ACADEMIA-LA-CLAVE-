'use client';

import React, {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
} from 'react';
import gsap from 'gsap';
import styles from './CuteCharacterMorado.module.css';

export interface CuteCharacterMoradoProps {
  typing?: boolean;
  playIntroDrop?: boolean;
  onDropImpact?: () => void;
}

export interface CuteCharacterMoradoRef {
  setPinch: (active: boolean, localY: number, dx: number, dy: number) => void;
}

function getMoradoSinuousPath(
  s: number,
  w: number,
  waveAmp: number,
  pinchActive = false,
  pinchY = 200,
  pinchDx = 0,
  pinchDy = 0
): string {
  const clampedS = Math.max(-0.4, Math.min(0.95, s));
  const amp = Math.max(0, Math.min(1.5, waveAmp));

  // Ondas armonicas sinuosas amortiguadas (en reposo amp === 0, sinuosidad === 0)
  const sin1 = Math.sin(w) * amp;
  const sin2 = Math.sin(w + 1.8) * amp;
  const sin3 = Math.sin(w + 3.4) * amp;

  // Puntos base de las paredes: en reposo (s=0, amp=0) x1=232, x2=244, x3=248
  let x1 = 232 - 16 * clampedS - 12 * sin1;
  let x2 = 244 + 6 * clampedS + 14 * sin2;
  let x3 = 248 + 2 * clampedS + 10 * sin3;

  // Pared izquierda en reposo: xl1=18, xl2=6, xl3=2
  let xl1 = 18 + 16 * clampedS + 12 * sin1;
  let xl2 = 6 - 6 * clampedS - 14 * sin2;
  let xl3 = 2 - 2 * clampedS - 10 * sin3;

  // Asas Bézier intermedias para fluidez de curvas (en reposo: 242, 236, 242)
  let cpR1_x1 = 242 - 10 * clampedS + 9 * Math.sin(w + 0.8) * amp;
  let cpR1_x2 = x1 + 5 * Math.sin(w + 1.4) * amp;
  let cpR2_x1 = x1 + 4 - 8 * Math.sin(w + 2.0) * amp;
  let cpR2_x2 = x2 + 6 * Math.sin(w + 2.6) * amp;
  let cpR3_x1 = x2 - 2 - 7 * Math.sin(w + 3.0) * amp;
  let cpR3_x2 = x3 + 5 * Math.sin(w + 3.6) * amp;

  // Asas izquierdas (en reposo: 2, 8, 6, 14, 18, 8)
  let cpL3_x1 = xl3 - 5 * Math.sin(w + 3.6) * amp;
  let cpL3_x2 = xl2 + 2 + 7 * Math.sin(w + 3.0) * amp;
  let cpL2_x1 = xl2 - 6 * Math.sin(w + 2.6) * amp;
  let cpL2_x2 = xl1 - 4 + 8 * Math.sin(w + 2.0) * amp;
  let cpL1_x1 = xl1 - 5 * Math.sin(w + 1.4) * amp;
  let cpL1_x2 = 8 + 10 * clampedS - 9 * Math.sin(w + 0.8) * amp;

  let topY = 0;

  // Deformacion elastica localizada con sinuosidad al estirar (no rigida)
  const pullDist = Math.hypot(pinchDx, pinchDy);
  if (pinchActive || pullDist > 0.5) {
    const w1 = Math.exp(-Math.pow((160 - pinchY) / 75, 2));
    const w2 = Math.exp(-Math.pow((275 - pinchY) / 75, 2));
    const w3 = Math.exp(-Math.pow((360 - pinchY) / 75, 2));
    const wTop = Math.exp(-Math.pow((25 - pinchY) / 55, 2));

    const pullX = Math.max(-65, Math.min(65, pinchDx * 0.45));
    const pullY = Math.max(-45, Math.min(45, pinchDy * 0.45));

    // Ondulacion sinuosa a lo largo del perfil estirado para evitar aristas rigidas
    const sinStretch1 = Math.sin(w + (160 - pinchY) * 0.035);
    const sinStretch2 = Math.sin(w + (275 - pinchY) * 0.035);
    const sinStretch3 = Math.sin(w + (360 - pinchY) * 0.035);

    const wSpread1 = Math.exp(-Math.pow((160 - pinchY) / 130, 2));
    const wSpread2 = Math.exp(-Math.pow((275 - pinchY) / 130, 2));
    const wSpread3 = Math.exp(-Math.pow((360 - pinchY) / 130, 2));

    const disp1 = pullX * (w1 + 0.35 * sinStretch1 * wSpread1);
    const disp2 = pullX * (w2 + 0.35 * sinStretch2 * wSpread2);
    const disp3 = pullX * (w3 * 0.7 + 0.25 * sinStretch3 * wSpread3);

    if (pullX > 0) {
      x1 += disp1;
      x2 += disp2;
      x3 += disp3;
      cpR2_x1 += disp1 * 0.6;
      cpR2_x2 += disp2 * 0.6;
      xl1 += pullX * 0.16 * (w1 + 0.22 * sinStretch1);
      xl2 += pullX * 0.16 * (w2 + 0.22 * sinStretch2);
    } else if (pullX < 0) {
      xl1 += disp1;
      xl2 += disp2;
      xl3 += disp3;
      cpL2_x1 += disp2 * 0.6;
      cpL2_x2 += disp1 * 0.6;
      x1 += pullX * 0.16 * (w1 + 0.22 * sinStretch1);
      x2 += pullX * 0.16 * (w2 + 0.22 * sinStretch2);
    }

    if (pullY < 0) {
      topY += pullY * (wTop + 0.2 * Math.sin(w) * Math.min(1, pullDist / 20));
    }
  }

  return `M 46 ${topY} L 204 ${topY} Q 245 ${topY} 245 46 C ${cpR1_x1} 90 ${cpR1_x2} 120 ${x1} 160 C ${cpR2_x1} 200 ${cpR2_x2} 235 ${x2} 275 C ${cpR3_x1} 315 ${cpR3_x2} 350 ${x3} 382 Q ${x3} 400 ${x3 - 22} 400 L ${xl3 + 22} 400 Q ${xl3} 400 ${xl3} 382 C ${cpL3_x1} 350 ${cpL3_x2} 315 ${xl2} 275 C ${cpL2_x1} 235 ${cpL2_x2} 200 ${xl1} 160 C ${cpL1_x1} 120 ${cpL1_x2} 90 5 46 Q 5 ${topY} 46 ${topY} Z`;
}

export const CuteCharacterMorado = forwardRef<
  CuteCharacterMoradoRef,
  CuteCharacterMoradoProps
>(({playIntroDrop = true, onDropImpact}, ref) => {
  const rawId = useId();
  const clipId = `morado-sinuous-${rawId.replace(/:/g, '')}`;

  const dropRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  const squashRef = useRef(0);
  const velSquashRef = useRef(0);
  const wavePhaseRef = useRef(0);
  const waveAmpRef = useRef(0);
  const pinchRef = useRef({
    active: false,
    localY: 200,
    dx: 0,
    dy: 0,
    currentDx: 0,
    currentDy: 0,
    velDx: 0,
    velDy: 0,
  });
  const animFrameRef = useRef<number | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      setPinch: (active: boolean, localY: number, dx: number, dy: number) => {
        const p = pinchRef.current;
        p.active = active;
        p.localY = localY;
        p.dx = dx;
        p.dy = dy;
      },
    }),
    []
  );

  useEffect(() => {
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;

      // 1. Oscilador armonico amortiguado para el squash tras impacto o interaccion
      if (Math.abs(squashRef.current) > 0.002 || Math.abs(velSquashRef.current) > 0.01) {
        const springForce = -130 * squashRef.current - 9.5 * velSquashRef.current;
        velSquashRef.current += springForce * dt;
        squashRef.current += velSquashRef.current * dt;
      } else {
        squashRef.current = 0;
        velSquashRef.current = 0;
      }

      // 2. Dinamica elastica del estiramiento de piel local
      const p = pinchRef.current;
      if (p.active) {
        // Seguir suavemente la traccion de los dedos
        p.currentDx += (p.dx - p.currentDx) * Math.min(1, dt * 28);
        p.currentDy += (p.dy - p.currentDy) * Math.min(1, dt * 28);
        p.velDx = 0;
        p.velDy = 0;
        // Inyectar sinuosidad activa proporcional al estiramiento
        const stretchDist = Math.hypot(p.currentDx, p.currentDy);
        const stretchAmp = Math.min(1.2, stretchDist / 22);
        waveAmpRef.current = Math.max(waveAmpRef.current, stretchAmp);
      } else if (Math.abs(p.currentDx) > 0.05 || Math.abs(p.currentDy) > 0.05) {
        // Retorno elastico oscilatorio amortiguado al soltar
        const springX = -240 * p.currentDx - 14 * p.velDx;
        const springY = -240 * p.currentDy - 14 * p.velDy;
        p.velDx += springX * dt;
        p.velDy += springY * dt;
        p.currentDx += p.velDx * dt;
        p.currentDy += p.velDy * dt;
        // La velocidad de retroceso genera vibracion sinuosa de latigazo
        const recoilAmp = Math.min(1.0, Math.hypot(p.velDx, p.velDy) / 45);
        waveAmpRef.current = Math.max(waveAmpRef.current, recoilAmp);

        if (Math.abs(p.currentDx) < 0.05 && Math.abs(p.velDx) < 0.05) {
          p.currentDx = 0;
          p.velDx = 0;
        }
        if (Math.abs(p.currentDy) < 0.05 && Math.abs(p.velDy) < 0.05) {
          p.currentDy = 0;
          p.velDy = 0;
        }
      }

      // 3. Decaimiento de la amplitud de sinuosidad hacia el reposo
      if (waveAmpRef.current > 0.002) {
        if (!p.active) {
          waveAmpRef.current *= Math.exp(-dt * 3.4);
          if (waveAmpRef.current <= 0.002) {
            waveAmpRef.current = 0;
          }
        }
        wavePhaseRef.current += dt * (5.5 + waveAmpRef.current * 7.5);
      } else {
        waveAmpRef.current = 0;
      }

      // 4. Actualizar el path SVG en el DOM
      if (pathRef.current) {
        const d = getMoradoSinuousPath(
          squashRef.current,
          wavePhaseRef.current,
          waveAmpRef.current,
          p.active || Math.abs(p.currentDx) > 0.05 || Math.abs(p.currentDy) > 0.05,
          p.localY,
          p.currentDx,
          p.currentDy
        );
        pathRef.current.setAttribute('d', d);
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!playIntroDrop || !dropRef.current) return;

    const el = dropRef.current;
    // Mientras cae en el aire: activar ondulacion sinuosa previa al impacto
    waveAmpRef.current = 0.85;

    gsap.fromTo(
      el,
      {
        y: -240,
        scaleY: 1.18,
        scaleX: 0.86,
      },
      {
        y: 0,
        scaleY: 1,
        scaleX: 1,
        duration: 0.50,
        ease: 'power2.in',
        onUpdate: function () {
          waveAmpRef.current = Math.max(waveAmpRef.current, 0.9);
        },
        onComplete: () => {
          // Impacto en el suelo: explosion de sinuosidad y deformacion de gelatina densa
          squashRef.current = 0.95;
          velSquashRef.current = -16;
          waveAmpRef.current = 1.45; // Maxima sinuosidad y vibracion ondulatoria
          onDropImpact?.();

          // Rebote elastico secundario del contenedor
          gsap.fromTo(
            el,
            {scaleY: 0.74, scaleX: 1.28},
            {
              scaleY: 1,
              scaleX: 1,
              duration: 1.35,
              ease: 'elastic.out(1.15, 0.32)',
            }
          );
        },
      }
    );
  }, [playIntroDrop, onDropImpact]);

  const handleCharClick = () => {
    // Al tocarlo directamente, inyectar onda sinuosa y rebote de gelatina
    squashRef.current = Math.min(0.85, squashRef.current + 0.5);
    velSquashRef.current -= 9;
    waveAmpRef.current = Math.min(1.2, waveAmpRef.current + 0.85);
  };

  return (
    <div className={styles.stage} onClick={handleCharClick}>
      {/* Definicion vectorial del clip-path sinuoso dinamico */}
      <svg
        width="0"
        height="0"
        style={{
          position: 'absolute',
          width: 0,
          height: 0,
          pointerEvents: 'none',
        }}
      >
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <path
              ref={pathRef}
              d={getMoradoSinuousPath(0, 0, 0)}
            />
          </clipPath>
        </defs>
      </svg>

      <div ref={dropRef} className={styles.dropWrapper}>
        <div
          className={styles['purple-char']}
          style={
            {
              '--morado-clip': `url(#${clipId})`,
            } as React.CSSProperties
          }
        >
          <div className={styles.reach}></div>
          <div className={styles.face}>
            <div className={styles.eyes}>
              <div className={styles.eye}>
                <div className={styles.pupil}></div>
              </div>
              <div className={styles.eye}>
                <div className={styles.pupil}></div>
              </div>
            </div>
            <div className={styles['mouth-wrap']}>
              <div className={styles.mouth}>
                <svg
                  width="44"
                  height="14"
                  viewBox="-8 0 44 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={styles.mouthSvg}
                >
                  <path
                    d="M -4 3.5 Q 14 9 32 3.2"
                    stroke="#201a26"
                    strokeWidth="4.6"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <svg
                width="44"
                height="14"
                viewBox="-8 0 44 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={styles.oMouth}
              >
                <ellipse
                  cx="14"
                  cy="7"
                  rx="4.5"
                  ry="6"
                  fill="none"
                  stroke="#201a26"
                  strokeWidth="4.6"
                />
              </svg>
            </div>
          </div>
        </div>
        <div className={styles.zzz} aria-hidden="true">
          <span className={styles.z}>z</span>
          <span className={styles.z}>z</span>
          <span className={styles.z}>z</span>
        </div>
      </div>
    </div>
  );
});

CuteCharacterMorado.displayName = 'CuteCharacterMorado';
