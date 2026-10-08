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
  pinchActive = false,
  pinchY = 200,
  pinchDx = 0,
  pinchDy = 0
): string {
  const clampedS = Math.max(-0.4, Math.min(0.95, s));
  let x1 = 232 - 16 * clampedS - 5 * Math.sin(w);
  let x2 = 244 + 6 * clampedS + 6 * Math.sin(w + 1.8);
  let x3 = 248 + 2 * clampedS + 3 * Math.sin(w + 3.2);

  let xl1 = 250 - x1;
  let xl2 = 250 - x2;
  let xl3 = 250 - x3;

  let topY = 0;

  if (pinchActive) {
    // Gauss bell curve weighting based on proximity to grab height
    const w1 = Math.exp(-Math.pow((160 - pinchY) / 75, 2));
    const w2 = Math.exp(-Math.pow((275 - pinchY) / 75, 2));
    const w3 = Math.exp(-Math.pow((360 - pinchY) / 75, 2));
    const wTop = Math.exp(-Math.pow((25 - pinchY) / 55, 2));

    // Deformacion elastica local de la pared halada
    const pullX = Math.max(-60, Math.min(60, pinchDx * 0.45));
    const pullY = Math.max(-45, Math.min(45, pinchDy * 0.45));

    if (pullX > 0) {
      // Halando hacia la derecha: estirar pared derecha hacia afuera
      x1 += pullX * w1;
      x2 += pullX * w2;
      x3 += pullX * w3 * 0.7;
      // Pared contraria acompaña sutilmente
      xl1 += pullX * 0.16 * w1;
      xl2 += pullX * 0.16 * w2;
    } else if (pullX < 0) {
      // Halando hacia la izquierda: estirar pared izquierda hacia afuera
      xl1 += pullX * w1;
      xl2 += pullX * w2;
      xl3 += pullX * w3 * 0.7;
      // Pared contraria acompaña sutilmente
      x1 += pullX * 0.16 * w1;
      x2 += pullX * 0.16 * w2;
    }

    if (pullY < 0) {
      topY += pullY * wTop;
    }
  }

  return `M 46 ${topY} L 204 ${topY} Q 245 ${topY} 245 46 C ${242 - 10 * clampedS} 90 ${x1} 120 ${x1} 160 C ${x1 + 4} 200 ${x2} 235 ${x2} 275 C ${x2 - 2} 315 ${x3} 350 ${x3} 382 Q ${x3} 400 ${x3 - 22} 400 L ${xl3 + 22} 400 Q ${xl3} 400 ${xl3} 382 C ${xl3} 350 ${xl2 - 2} 315 ${xl2} 275 C ${xl2} 235 ${xl1 - 4} 200 ${xl1} 160 C ${xl1} 120 ${8 + 10 * clampedS} 90 5 46 Q 5 ${topY} 46 ${topY} Z`;
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
  const waveRef = useRef(0);
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

      // Oscilador armonico amortiguado para el squash tras impacto o interaccion
      const springForce = -130 * squashRef.current - 9.5 * velSquashRef.current;
      velSquashRef.current += springForce * dt;
      squashRef.current += velSquashRef.current * dt;

      // Ondulacion fluida continua de las paredes sinuosas
      waveRef.current += dt * 3.2;

      // Dinamica elastica del estiramiento de piel local
      const p = pinchRef.current;
      if (p.active) {
        // Seguir suavemente la traccion de los dedos
        p.currentDx += (p.dx - p.currentDx) * Math.min(1, dt * 28);
        p.currentDy += (p.dy - p.currentDy) * Math.min(1, dt * 28);
        p.velDx = 0;
        p.velDy = 0;
      } else if (Math.abs(p.currentDx) > 0.05 || Math.abs(p.currentDy) > 0.05) {
        // Retorno elastico oscilatorio amortiguado al soltar
        const springX = -220 * p.currentDx - 14 * p.velDx;
        const springY = -220 * p.currentDy - 14 * p.velDy;
        p.velDx += springX * dt;
        p.velDy += springY * dt;
        p.currentDx += p.velDx * dt;
        p.currentDy += p.velDy * dt;
        if (Math.abs(p.currentDx) < 0.05 && Math.abs(p.velDx) < 0.05) {
          p.currentDx = 0;
          p.velDx = 0;
        }
        if (Math.abs(p.currentDy) < 0.05 && Math.abs(p.velDy) < 0.05) {
          p.currentDy = 0;
          p.velDy = 0;
        }
      }

      if (pathRef.current) {
        const d = getMoradoSinuousPath(
          squashRef.current,
          waveRef.current,
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
    // Caida inicial suave por gravedad desde arriba
    gsap.fromTo(
      el,
      {
        y: -240,
        scaleY: 1.16,
        scaleX: 0.88,
      },
      {
        y: 0,
        scaleY: 1,
        scaleX: 1,
        duration: 0.48,
        ease: 'power2.in',
        onComplete: () => {
          // Momento del impacto en el suelo
          squashRef.current = 0.90;
          velSquashRef.current = -14;
          onDropImpact?.();

          // Rebote elastico secundario del contenedor
          gsap.fromTo(
            el,
            {scaleY: 0.78, scaleX: 1.25},
            {
              scaleY: 1,
              scaleX: 1,
              duration: 1.3,
              ease: 'elastic.out(1.15, 0.32)',
            }
          );
        },
      }
    );
  }, [playIntroDrop, onDropImpact]);

  const handleCharClick = () => {
    // Al tocarlo directamente, inyectar onda sinuosa
    squashRef.current = Math.min(0.8, squashRef.current + 0.45);
    velSquashRef.current -= 8;
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
              d={getMoradoSinuousPath(0, 0)}
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
