'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import gsap from 'gsap';
import { CuteCharacterFucsia } from './CuteCharacterFucsia';
import styles from './CuteCharacterFucsia.module.css';

export interface CuteCharacterFucsiaAnimatedRef {
  replay: () => void;
}

interface CuteCharacterFucsiaAnimatedProps {
  autoPlay?: boolean;
  onComplete?: () => void;
}

export const CuteCharacterFucsiaAnimated = forwardRef<
  CuteCharacterFucsiaAnimatedRef,
  CuteCharacterFucsiaAnimatedProps
>(({ autoPlay = true, onComplete }, ref) => {
  const carrierRef = useRef<HTMLDivElement>(null);
  const rotatorRef = useRef<HTMLDivElement>(null);
  const squashRef = useRef<HTMLDivElement>(null);
  const faceRef = useRef<HTMLDivElement>(null);
  const shadowContactRef = useRef<HTMLDivElement>(null);
  const shadowAmbientRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const buildTimeline = () => {
    if (!carrierRef.current || !rotatorRef.current || !squashRef.current) return null;

    const carrier = carrierRef.current;
    const rotator = rotatorRef.current;
    const squash = squashRef.current;
    const face = faceRef.current;
    const shadowContact = shadowContactRef.current;
    const shadowAmbient = shadowAmbientRef.current;

    const tl = gsap.timeline({
      paused: !autoPlay,
      onComplete,
    });

    // 0. ESTADO INICIAL: Colgado del techo invertido a la derecha
    tl.set(carrier, { x: 120, y: -450 })
      .set(rotator, { rotation: 198, transformOrigin: 'center center' })
      .set(squash, { scaleX: 1, scaleY: 1, skewX: 0, transformOrigin: 'bottom center' })
      .set(face, { y: 0, x: 0 })
      .set(shadowContact, { scaleX: 0.25, opacity: 0.05 })
      .set(shadowAmbient, { scaleX: 0.25, opacity: 0.03 });

    // =========================================================================
    // FASE 1: ENTRADA PENDULAR EN ONDAS SINUSOIDALES (Derecha -> Izquierda -> Retorno)
    // El cuerpo viaja mientras ondula continuamente en ciclos sinusoidales
    // =========================================================================

    // Traslación general suave en X de derecha a izquierda
    tl.to(carrier, { x: -80, duration: 0.75, ease: 'sine.inOut' }, 'swingLeft')
      // Onda sinusoidal en Y (ondulación vertical de cresta y valle)
      .to(carrier, { y: -475, duration: 0.38, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 'swingLeft')
      // Onda sinusoidal de rotación pendular
      .to(rotator, { rotation: 160, duration: 0.75, ease: 'sine.inOut' }, 'swingLeft')
      // ONDULACIÓN DE AGUA 1: Skew sinusoidal (el cuerpo serpentea como líquido)
      .to(squash, { skewX: 24, duration: 0.38, ease: 'sine.inOut' }, 'swingLeft')
      .to(squash, { skewX: -12, duration: 0.37, ease: 'sine.inOut' })
      // ONDULACIÓN DE AGUA 1: Volumen sinusoidal (se estira y comprime como ola)
      .to(squash, { scaleY: 1.18, scaleX: 0.85, duration: 0.38, ease: 'sine.inOut' }, 'swingLeft')
      .to(squash, { scaleY: 0.90, scaleX: 1.12, duration: 0.37, ease: 'sine.inOut' }, 'swingLeft+=0.38')
      // Arrastre sinusoidal de los ojos
      .to(face, { x: 8, duration: 0.38, ease: 'sine.inOut' }, 'swingLeft')
      .to(face, { x: -4, duration: 0.37, ease: 'sine.inOut' }, 'swingLeft+=0.38');

    // Retorno sinusoidal hacia el centro de soltado (x: 0)
    tl.to(carrier, { x: 0, duration: 0.60, ease: 'sine.inOut' }, 'swingReturn')
      .to(carrier, { y: -455, duration: 0.30, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 'swingReturn')
      .to(rotator, { rotation: 196, duration: 0.60, ease: 'sine.inOut' }, 'swingReturn')
      // ONDULACIÓN DE AGUA 2: Skew inverso sinusoidal
      .to(squash, { skewX: -26, duration: 0.30, ease: 'sine.inOut' }, 'swingReturn')
      .to(squash, { skewX: 6, duration: 0.30, ease: 'sine.inOut' })
      // ONDULACIÓN DE AGUA 2: Volumen sinusoidal inverso
      .to(squash, { scaleY: 1.20, scaleX: 0.84, duration: 0.30, ease: 'sine.inOut' }, 'swingReturn')
      .to(squash, { scaleY: 0.92, scaleX: 1.10, duration: 0.30, ease: 'sine.inOut' }, 'swingReturn+=0.30')
      .to(face, { x: -8, duration: 0.30, ease: 'sine.inOut' }, 'swingReturn')
      .to(face, { x: 2, duration: 0.30, ease: 'sine.inOut' }, 'swingReturn+=0.30');

    // =========================================================================
    // FASE 2: VOLTERETA DE 180° Y CAÍDA ONDULANDO COMO AGUA
    // El personaje da la vuelta completa y cae bamboleándose en ondas sinusoidales
    // =========================================================================

    // Anticipación de soltado: contracción elástica hacia el techo
    tl.to(squash, { scaleY: 0.88, scaleX: 1.14, duration: 0.08, ease: 'sine.out' });

    // Caída en Y acelerada
    tl.to(carrier, { y: 0, duration: 0.45, ease: 'power3.in' }, 'fallAndFlip')
      // Giro de 180° hasta quedar vertical en 360° (0°)
      .to(rotator, { rotation: 360, duration: 0.45, ease: 'sine.inOut' }, 'fallAndFlip')

      // ONDA SINUSOIDAL EN X DURANTE LA CAÍDA (bamboleo líquido de lado a lado)
      .to(carrier, { x: 16, duration: 0.15, ease: 'sine.inOut' }, 'fallAndFlip')
      .to(carrier, { x: -14, duration: 0.15, ease: 'sine.inOut' })
      .to(carrier, { x: 0, duration: 0.15, ease: 'sine.inOut' })

      // ONDULACIÓN DE CUERPO EN EL AIRE (el líquido ondea en forma de onda mientras gira)
      .to(squash, { skewX: 20, duration: 0.15, ease: 'sine.inOut' }, 'fallAndFlip')
      .to(squash, { skewX: -18, duration: 0.15, ease: 'sine.inOut' })
      .to(squash, { skewX: 0, duration: 0.15, ease: 'sine.inOut' })

      // Estiramiento vertical en el aire tipo lágrima de agua antes de chocar
      .to(squash, { scaleY: 1.40, scaleX: 0.72, duration: 0.18, ease: 'sine.in' }, 'fallAndFlip+=0.27')
      .to(face, { x: 0, y: -4, duration: 0.25, ease: 'sine.out' }, 'fallAndFlip')
      .to(shadowContact, { scaleX: 0.80, opacity: 0.25, duration: 0.25, ease: 'sine.in' }, 'fallAndFlip+=0.20');

    // =========================================================================
    // FASE 3: IMPACTO Y DISIPACIÓN SINUSOIDAL PURA (Harmonic Damped Wave)
    // El impacto se propaga en ondas senoidales amortiguadas de alta frecuencia
    // =========================================================================

    // Semi-ciclo 0: Aplastamiento violento contra el piso (Splash / Valle)
    tl.to(squash, { scaleY: 0.38, scaleX: 1.72, skewX: 0, duration: 0.05, ease: 'sine.out' }, 'hit')
      .to(shadowContact, { scaleX: 1.80, opacity: 0.65, duration: 0.05, ease: 'sine.out' }, 'hit')
      .to(shadowAmbient, { scaleX: 1.55, opacity: 0.35, duration: 0.05, ease: 'sine.out' }, 'hit')
      .to(face, { y: 20, duration: 0.07, ease: 'sine.out' }, 'hit+=0.01')

      // Semi-ciclo 1: Cresta explosiva hacia arriba con torsión sinusoidal
      .to(squash, { scaleY: 1.38, scaleX: 0.72, skewX: -9, duration: 0.07, ease: 'sine.inOut' })
      .to(face, { y: -12, duration: 0.07, ease: 'sine.inOut' }, '<')
      .to(shadowContact, { scaleX: 0.72, opacity: 0.20, duration: 0.07, ease: 'sine.inOut' }, '<')

      // Semi-ciclo 2: Valle de compresión secundaria
      .to(squash, { scaleY: 0.68, scaleX: 1.34, skewX: 7, duration: 0.07, ease: 'sine.inOut' })
      .to(face, { y: 10, duration: 0.07, ease: 'sine.inOut' }, '<')
      .to(shadowContact, { scaleX: 1.35, opacity: 0.52, duration: 0.07, ease: 'sine.inOut' }, '<')

      // Semi-ciclo 3: Cresta amortiguada
      .to(squash, { scaleY: 1.22, scaleX: 0.82, skewX: -5, duration: 0.06, ease: 'sine.inOut' })
      .to(face, { y: -6, duration: 0.06, ease: 'sine.inOut' }, '<')
      .to(shadowContact, { scaleX: 0.82, opacity: 0.26, duration: 0.06, ease: 'sine.inOut' }, '<')

      // Semi-ciclo 4: Valle amortiguado
      .to(squash, { scaleY: 0.85, scaleX: 1.15, skewX: 3.5, duration: 0.06, ease: 'sine.inOut' })
      .to(face, { y: 4, duration: 0.06, ease: 'sine.inOut' }, '<')
      .to(shadowContact, { scaleX: 1.15, opacity: 0.42, duration: 0.06, ease: 'sine.inOut' }, '<')

      // Semi-ciclo 5: Micro-cresta
      .to(squash, { scaleY: 1.08, scaleX: 0.93, skewX: -2, duration: 0.05, ease: 'sine.inOut' })
      .to(face, { y: -2, duration: 0.05, ease: 'sine.inOut' }, '<')
      .to(shadowContact, { scaleX: 0.93, opacity: 0.32, duration: 0.05, ease: 'sine.inOut' }, '<')

      // Semi-ciclo 6: Micro-valle
      .to(squash, { scaleY: 0.96, scaleX: 1.04, skewX: 1, duration: 0.05, ease: 'sine.inOut' })
      .to(face, { y: 1, duration: 0.05, ease: 'sine.inOut' }, '<')
      .to(shadowContact, { scaleX: 1.04, opacity: 0.37, duration: 0.05, ease: 'sine.inOut' }, '<')

      // Asentamiento final al punto neutro (0,0)
      .to(squash, { scaleY: 1.0, scaleX: 1.0, skewX: 0, duration: 0.15, ease: 'sine.out' })
      .to(face, { y: 0, duration: 0.15, ease: 'sine.out' }, '<')
      .to(shadowContact, { scaleX: 1.0, opacity: 0.38, duration: 0.15, ease: 'sine.out' }, '<')
      .to(shadowAmbient, { scaleX: 1.0, opacity: 0.22, duration: 0.15, ease: 'sine.out' }, '<');

    // =========================================================================
    // FASE 4: RESPIRACIÓN SINUSOIDAL INFINITA EN REPOSO (Idle vivo continuo)
    // El personaje nunca está estático: respira con una suave onda senoidal viva
    // =========================================================================
    tl.to(squash, {
      scaleY: 1.03,
      scaleX: 0.97,
      duration: 1.6,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })
      .to(
        squash,
        {
          skewX: 1.5,
          duration: 2.1,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        },
        '<'
      )
      .to(
        shadowContact,
        {
          scaleX: 1.05,
          opacity: 0.40,
          duration: 1.6,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        },
        '<'
      );

    return tl;
  };

  useEffect(() => {
    timelineRef.current = buildTimeline();

    return () => {
      timelineRef.current?.kill();
    };
  }, []);

  useImperativeHandle(ref, () => ({
    replay: () => {
      if (timelineRef.current) {
        timelineRef.current.restart();
      }
    },
  }));

  return (
    <div className={styles.stage}>
      <div ref={shadowAmbientRef} className={styles['shadow-ambient']} />
      <div ref={shadowContactRef} className={styles['shadow-contact']} />

      <div ref={carrierRef} className={styles.carrier}>
        <div ref={rotatorRef} className={styles.rotator}>
          <div ref={squashRef} className={styles.squash}>
            <CuteCharacterFucsia showShadows={false} faceRef={faceRef} />
          </div>
        </div>
      </div>
    </div>
  );
});

CuteCharacterFucsiaAnimated.displayName = 'CuteCharacterFucsiaAnimated';
