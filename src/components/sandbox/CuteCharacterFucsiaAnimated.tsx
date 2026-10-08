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

    // 1. PENDULO CON FLEXION DE GOMA (Skew contrario a la trayectoria)
    tl.set(carrier, { x: 110, y: -280 })
      .set(body, { rotation: 180, skewX: 0, transformOrigin: 'top center', scaleX: 1, scaleY: 1 })
      .set(face, { y: 0 })
      .set(shadowContact, { scaleX: 0.3, opacity: 0.08 })
      .set(shadowAmbient, { scaleX: 0.3, opacity: 0.05 })

      // Oscilacion hacia la izquierda: latigazo de inercia (skewX opuesto)
      .to(carrier, { x: -50, duration: 0.65, ease: 'sine.inOut' })
      .to(body, {
        rotation: 162,
        skewX: 12, // Se arquea como latigo por inercia
        duration: 0.65,
        ease: 'sine.inOut',
      }, '<')

      // Retorno pendular: latigazo inverso hacia la derecha
      .to(carrier, { x: 0, duration: 0.55, ease: 'sine.inOut' })
      .to(body, {
        rotation: 195,
        skewX: -14, // Se dobla en sentido contrario
        duration: 0.55,
        ease: 'sine.inOut',
      }, '<')

      // 2. DESPRENDIMIENTO Y ESTIRAMIENTO TIPO CHICLE
      .set(body, { transformOrigin: 'center center' })
      .to(carrier, { y: 0, duration: 0.38, ease: 'power3.in' })
      .to(body, {
        rotation: 360,
        skewX: 0,
        duration: 0.38,
        ease: 'power1.inOut',
      }, '<')
      // Estiramiento vertical alargado en la caida libre (chicle)
      .to(body, {
        scaleY: 1.24,
        scaleX: 0.82,
        duration: 0.14,
        ease: 'power2.in',
      }, '-=0.14')
      .to(shadowContact, { scaleX: 0.8, opacity: 0.25, duration: 0.18, ease: 'power2.in' }, '-=0.18')

      // 3. IMPACTO Y WOBBLE DE GELATINA (Secuencia armonica)
      .set(body, { transformOrigin: 'bottom center' })
      // Compresion inicial violenta
      .to(body, {
        scaleY: 0.62,
        scaleX: 1.34,
        duration: 0.07,
        ease: 'power2.out',
      })
      .to(shadowContact, { scaleX: 1.4, opacity: 0.5, duration: 0.07 }, '<')
      .to(shadowAmbient, { scaleX: 1.3, opacity: 0.3, duration: 0.07 }, '<')
      // Inercia retardada de los ojos que se hunden una fraccion despues
      .to(face, { y: 8, duration: 0.07, ease: 'power2.out' }, '<0.02')

      // Rebote hacia arriba (la gelatina se dispara y torsiona)
      .to(body, {
        scaleY: 1.16,
        scaleX: 0.88,
        skewX: 4,
        duration: 0.12,
        ease: 'power1.out',
      })
      .to(face, { y: -4, duration: 0.12, ease: 'power1.out' }, '<')

      // Asentamiento elastico procedural con micro-temblor
      .to(body, {
        scaleY: 1.0,
        scaleX: 1.0,
        skewX: 0,
        duration: 0.5,
        ease: 'elastic.out(1.5, 0.25)', // Ondulacion cerrada y viscosa
      })
      .to(face, { y: 0, duration: 0.45, ease: 'elastic.out(1.2, 0.3)' }, '<0.03')
      .to(shadowContact, { scaleX: 1.0, opacity: 0.35, duration: 0.5, ease: 'power2.out' }, '<')
      .to(shadowAmbient, { scaleX: 1.0, opacity: 0.22, duration: 0.5, ease: 'power2.out' }, '<');

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
