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
  const bodyRef = useRef<HTMLDivElement>(null);
  const faceRef = useRef<HTMLDivElement>(null);
  const shadowContactRef = useRef<HTMLDivElement>(null);
  const shadowAmbientRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const buildTimeline = () => {
    if (!carrierRef.current || !bodyRef.current) return null;

    const carrier = carrierRef.current;
    const body = bodyRef.current;
    const face = faceRef.current;
    const shadowContact = shadowContactRef.current;
    const shadowAmbient = shadowAmbientRef.current;

    const tl = gsap.timeline({
      paused: !autoPlay,
      onComplete,
    });

    // 1. PENDULO CON FLEXION DE GOMA (Skew e inercia hidrodinamica)
    tl.set(carrier, { x: 110, y: -280 })
      .set(body, { rotation: 180, skewX: 0, transformOrigin: 'top center', scaleX: 1, scaleY: 1 })
      .set(face, { y: 0 })
      .set(shadowContact, { scaleX: 0.3, opacity: 0.08 })
      .set(shadowAmbient, { scaleX: 0.3, opacity: 0.05 })

      // Oscilacion hacia la izquierda: la inercia estira la masa y curva la cola
      .to(carrier, { x: -55, duration: 0.65, ease: 'sine.inOut' })
      .to(body, {
        rotation: 160,
        skewX: 14,
        scaleY: 1.06,
        scaleX: 0.94,
        duration: 0.65,
        ease: 'sine.inOut',
      }, '<')

      // Retorno pendular: latigazo inverso hacia la derecha
      .to(carrier, { x: 0, duration: 0.55, ease: 'sine.inOut' })
      .to(body, {
        rotation: 198,
        skewX: -16,
        scaleY: 1.08,
        scaleX: 0.92,
        duration: 0.55,
        ease: 'sine.inOut',
      }, '<')

      // 2. DESPRENDIMIENTO Y CAIDA LIBRE TIPO GOTA / CHICLE
      .set(body, { transformOrigin: 'center center' })
      .to(carrier, { y: 0, duration: 0.38, ease: 'power3.in' })
      .to(body, {
        rotation: 360,
        skewX: 0,
        duration: 0.38,
        ease: 'power1.inOut',
      }, '<')
      // Estiramiento vertical en el aire tipo gota que cae
      .to(body, {
        scaleY: 1.28,
        scaleX: 0.78,
        duration: 0.16,
        ease: 'power2.in',
      }, '-=0.16')
      .to(shadowContact, { scaleX: 0.85, opacity: 0.28, duration: 0.18, ease: 'power2.in' }, '-=0.18')

      // 3. IMPACTO CON EL PISO Y OLEAJE DE FLAN / LIQUIDO (Harmonic Wobble)
      .set(body, { transformOrigin: 'bottom center' })

      // Contacto violento: splash y desparrame lateral
      .to(body, {
        scaleY: 0.52,
        scaleX: 1.55,
        duration: 0.06,
        ease: 'power2.out',
      })
      .to(shadowContact, { scaleX: 1.55, opacity: 0.58, duration: 0.06 }, '<')
      .to(shadowAmbient, { scaleX: 1.4, opacity: 0.32, duration: 0.06 }, '<')
      // Retraso de inercia en la cara (sigue bajando despues de la base)
      .to(face, { y: 10, duration: 0.08, ease: 'power2.out' }, '<0.01')

      // Onda 1: rebote alto y torsion elástica
      .to(body, {
        scaleY: 1.22,
        scaleX: 0.84,
        skewX: -5,
        duration: 0.12,
        ease: 'power1.out',
      })
      .to(face, { y: -6, duration: 0.12, ease: 'power1.out' }, '<')
      .to(shadowContact, { scaleX: 0.85, opacity: 0.25, duration: 0.12 }, '<')

      // Onda 2: compresion secundaria amortiguada
      .to(body, {
        scaleY: 0.88,
        scaleX: 1.12,
        skewX: 3.5,
        duration: 0.11,
        ease: 'sine.inOut',
      })
      .to(face, { y: 2, duration: 0.11, ease: 'sine.inOut' }, '<')
      .to(shadowContact, { scaleX: 1.15, opacity: 0.42, duration: 0.11 }, '<')

      // Onda 3: micro-rebote armonico
      .to(body, {
        scaleY: 1.05,
        scaleX: 0.96,
        skewX: -1.5,
        duration: 0.11,
        ease: 'sine.inOut',
      })
      .to(face, { y: -1, duration: 0.11, ease: 'sine.inOut' }, '<')
      .to(shadowContact, { scaleX: 0.96, opacity: 0.32, duration: 0.11 }, '<')

      // Asentamiento al punto neutral
      .to(body, {
        scaleY: 1.0,
        scaleX: 1.0,
        skewX: 0,
        duration: 0.2,
        ease: 'power2.out',
      })
      .to(face, { y: 0, duration: 0.2, ease: 'power2.out' }, '<')
      .to(shadowContact, { scaleX: 1.0, opacity: 0.38, duration: 0.2, ease: 'power2.out' }, '<')
      .to(shadowAmbient, { scaleX: 1.0, opacity: 0.22, duration: 0.2, ease: 'power2.out' }, '<')

      // 4. RESPIRACION ORGANICA EN REPOSO (Idle vivo)
      .to(body, {
        scaleY: 1.025,
        scaleX: 0.975,
        duration: 1.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

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
        <div ref={bodyRef} className={styles.bodyMotion}>
          <CuteCharacterFucsia showShadows={false} faceRef={faceRef} />
        </div>
      </div>
    </div>
  );
});

CuteCharacterFucsiaAnimated.displayName = 'CuteCharacterFucsiaAnimated';
