// src/components/unit3-rhythm/drumRenderers.ts

import { DrumDimple, DrumWave, SlicePoint, StarSpark, ActiveSphere } from './types';

export const renderAmbientBackground = (
  ctx: CanvasRenderingContext2D,
  bgSceneRef: React.MutableRefObject<HTMLCanvasElement | null>,
  sceneKeyRef: React.MutableRefObject<string>,
  width: number,
  height: number,
  dpr: number,
  drumCenterX: number,
  drumCenterY: number,
  drumRadiusY: number
) => {
  const sceneKey = `${width}x${height}@${dpr}`;
  if (sceneKeyRef.current !== sceneKey) {
    sceneKeyRef.current = sceneKey;

    bgSceneRef.current = document.createElement('canvas');
    bgSceneRef.current.width = Math.floor(width * dpr);
    bgSceneRef.current.height = Math.floor(height * dpr);
    const bctx = bgSceneRef.current.getContext('2d');
    if (bctx) {
      bctx.scale(dpr, dpr);
      const ambientGlow = bctx.createRadialGradient(
        drumCenterX,
        drumCenterY - drumRadiusY * 0.5,
        20,
        drumCenterX,
        drumCenterY - drumRadiusY * 0.2,
        width * 0.75
      );
      ambientGlow.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
      ambientGlow.addColorStop(0.5, 'rgba(124, 58, 237, 0.08)');
      ambientGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      bctx.fillStyle = ambientGlow;
      bctx.fillRect(0, 0, width, height);
    }
  }

  if (bgSceneRef.current) {
    ctx.drawImage(bgSceneRef.current, 0, 0, width, height);
  }
};

export const renderDrum = (
  ctx: CanvasRenderingContext2D,
  drumImg: HTMLImageElement | null,
  drumCenterX: number,
  drumCenterY: number,
  drumRadiusX: number,
  drumRadiusY: number,
  drumW: number,
  drumH: number,
  drumY: number,
  skinDisplacement: number,
  easedParallaxX: number,
  easedParallaxY: number,
  easedTilt: number
) => {
  if (!drumImg || !drumImg.complete) return;

  ctx.save();
  ctx.translate(drumCenterX + easedParallaxX, drumCenterY + easedParallaxY);
  ctx.rotate(easedTilt);

  // Sombra base del tambor
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(
    0,
    drumRadiusY * 0.54,
    drumRadiusX * 0.98,
    drumRadiusY * 0.68,
    0,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = 'rgba(15, 23, 42, 0.42)';
  ctx.fill();
  ctx.restore();

  const localX = -drumW * 0.5;
  const localY = drumY - drumCenterY + skinDisplacement * 0.25;
  ctx.drawImage(drumImg, localX, localY, drumW, drumH);
  ctx.restore();

  // Brillo especular dinámico que sigue el toque táctil
  if (Math.abs(easedParallaxX) > 0.2 || Math.abs(easedParallaxY) > 0.2) {
    ctx.save();
    const specX = drumCenterX + easedParallaxX * 2.2;
    const specY = drumCenterY + easedParallaxY * 2.4;
    const specGlow = ctx.createRadialGradient(
      specX,
      specY,
      4,
      specX,
      specY,
      drumRadiusX * 0.85
    );
    specGlow.addColorStop(0, 'rgba(255, 255, 255, 0.10)');
    specGlow.addColorStop(0.4, 'rgba(147, 197, 253, 0.05)');
    specGlow.addColorStop(1, 'rgba(147, 197, 253, 0)');
    ctx.fillStyle = specGlow;
    ctx.beginPath();
    ctx.ellipse(
      drumCenterX + easedParallaxX,
      drumCenterY + easedParallaxY,
      drumRadiusX,
      drumRadiusY,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
  }
};

export const renderDimples = (
  ctx: CanvasRenderingContext2D,
  dimplesRef: React.MutableRefObject<DrumDimple[]>,
  now: number,
  speedFactor: number,
  skinDisplacement: number,
  easedParallaxX: number,
  drumRadiusX: number,
  drumRadiusY: number
) => {
  const currentDimples: DrumDimple[] = [];
  const aspectY = drumRadiusY / drumRadiusX;

  dimplesRef.current.forEach((dimple) => {
    const age = now - dimple.birthTime;
    const maxAge = 480;
    if (age < maxAge) {
      const progress = age / maxAge;
      const depthFactor = Math.max(0, (1 - progress) * Math.cos(progress * Math.PI * 0.7));
      dimple.alpha = depthFactor;
      const currentRadius = 12 + (dimple.maxRadius - 12) * Math.sin(progress * Math.PI * 0.5);
      currentDimples.push(dimple);

      ctx.save();
      const craterY = dimple.y + skinDisplacement * 0.5;
      const craterX = dimple.x + easedParallaxX;

      if (depthFactor > 0.02) {
        // A. Sombra interior
        const shadowOffsetY = -currentRadius * aspectY * 0.35;
        const innerShadowGrad = ctx.createRadialGradient(
          craterX,
          craterY + shadowOffsetY,
          1,
          craterX,
          craterY,
          currentRadius
        );
        innerShadowGrad.addColorStop(0.0, `rgba(28, 14, 6, ${0.82 * depthFactor})`);
        innerShadowGrad.addColorStop(0.42, `rgba(58, 32, 14, ${0.52 * depthFactor})`);
        innerShadowGrad.addColorStop(0.80, `rgba(100, 68, 38, ${0.20 * depthFactor})`);
        innerShadowGrad.addColorStop(1.0, 'rgba(100, 68, 38, 0)');

        ctx.beginPath();
        ctx.ellipse(
          craterX,
          craterY,
          currentRadius,
          currentRadius * aspectY,
          0,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = innerShadowGrad;
        ctx.fill();

        // B. Punto de impacto central
        const focalRadius = currentRadius * 0.38;
        const focalGrad = ctx.createRadialGradient(
          craterX,
          craterY,
          0,
          craterX,
          craterY,
          focalRadius
        );
        focalGrad.addColorStop(0.0, `rgba(16, 8, 3, ${0.90 * depthFactor})`);
        focalGrad.addColorStop(0.65, `rgba(32, 16, 7, ${0.45 * depthFactor})`);
        focalGrad.addColorStop(1.0, 'rgba(32, 16, 7, 0)');

        ctx.beginPath();
        ctx.ellipse(
          craterX,
          craterY,
          focalRadius,
          focalRadius * aspectY,
          0,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = focalGrad;
        ctx.fill();

        // C. Borde de brillo especular
        ctx.beginPath();
        ctx.ellipse(
          craterX,
          craterY + 1.2,
          currentRadius * 0.92,
          currentRadius * 0.92 * aspectY,
          0,
          Math.PI * 0.12,
          Math.PI * 0.88
        );
        ctx.strokeStyle = `rgba(255, 252, 240, ${0.60 * depthFactor})`;
        ctx.lineWidth = 1.6 * depthFactor;
        ctx.stroke();

        // D. Anillo exterior de tensión
        ctx.beginPath();
        ctx.ellipse(
          craterX,
          craterY,
          currentRadius * 1.14,
          currentRadius * 1.14 * aspectY,
          0,
          0,
          Math.PI * 2
        );
        ctx.strokeStyle = `rgba(165, 130, 95, ${0.22 * depthFactor})`;
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }

      // E. Partículas ascendentes de celebración
      dimple.particles.forEach((p) => {
        p.x += p.vx * speedFactor;
        p.y += p.vy * speedFactor;
        p.vy -= 0.04 * speedFactor;
        p.alpha = Math.max(0, p.alpha - 0.024 * speedFactor);

        if (p.alpha > 0.05) {
          ctx.save();
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha * 0.35;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      ctx.restore();
    }
  });
  dimplesRef.current = currentDimples;
};

export const renderShockwaves = (
  ctx: CanvasRenderingContext2D,
  wavesRef: React.MutableRefObject<DrumWave[]>,
  speedFactor: number,
  easedParallaxX: number,
  skinDisplacement: number,
  drumRadiusX: number,
  drumRadiusY: number
) => {
  const aliveWaves: DrumWave[] = [];
  wavesRef.current.forEach((wave) => {
    wave.radius += 4.5 * speedFactor;
    wave.alpha -= 0.025 * speedFactor;

    if (wave.alpha > 0.05 && wave.radius < wave.maxRadius) {
      aliveWaves.push(wave);
      const waveX = wave.x + easedParallaxX;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(
        waveX,
        wave.y + skinDisplacement * 0.5,
        wave.radius,
        wave.radius * (drumRadiusY / drumRadiusX),
        0,
        0,
        Math.PI * 2
      );
      ctx.strokeStyle = `rgba(251, 191, 36, ${wave.alpha * 0.65})`;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();
    }
  });
  wavesRef.current = aliveWaves;
};

export const renderBeatDots = (
  ctx: CanvasRenderingContext2D,
  drumCenterX: number,
  drumCenterY: number,
  drumRadiusY: number,
  completedBeats: number
) => {
  const dotSpacing = 32;
  const dotStartX = drumCenterX - dotSpacing * 1.5;
  const dotY = drumCenterY - drumRadiusY - 26;

  for (let i = 0; i < 4; i++) {
    const dotX = dotStartX + i * dotSpacing;
    const isLit = completedBeats > i;
    const isCurrent = completedBeats === i;

    ctx.save();
    ctx.beginPath();
    ctx.arc(dotX, dotY, isLit || isCurrent ? 5.5 : 4, 0, Math.PI * 2);

    if (isLit) {
      ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
      ctx.beginPath();
      ctx.arc(dotX, dotY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(dotX, dotY, 5.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (isCurrent) {
      ctx.fillStyle = 'rgba(251, 191, 36, 0.22)';
      ctx.beginPath();
      ctx.arc(dotX, dotY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(251, 191, 36, 0.6)';
      ctx.beginPath();
      ctx.arc(dotX, dotY, 5.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
};

export const renderSphereShadows = (
  ctx: CanvasRenderingContext2D,
  spheres: ActiveSphere[],
  height: number,
  drumCenterY: number,
  drumRadiusY: number,
  skinDisplacement: number
) => {
  spheres.forEach((sphere) => {
    if (sphere.isCut) return;
    const currentSurfaceY = sphere.surfaceY ?? drumCenterY;
    const altitude = Math.max(0, currentSurfaceY - sphere.y);

    let scaleX = 1;
    if (altitude < 18) {
      const compression = Math.max(0, 1 - altitude / 18);
      scaleX = 1 + 0.05 * compression;
    } else if (altitude < 70 && sphere.vy < -150) {
      scaleX = 0.98;
    }

    const depthRatio = (currentSurfaceY - drumCenterY) / (drumRadiusY || 1);
    const perspectiveScale = Math.max(0.84, Math.min(1.16, 1.0 + depthRatio * 0.24));

    const shadowScale = Math.max(0.35, (1 - altitude / (height * 0.6)) * scaleX * perspectiveScale);
    const shadowAlpha = Math.max(0.06, 0.32 * shadowScale);

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(
      sphere.x,
      currentSurfaceY + skinDisplacement * 0.5,
      sphere.radius * shadowScale,
      sphere.radius * shadowScale * 0.35,
      0,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = `rgba(15, 23, 42, ${shadowAlpha * 1.5})`;
    ctx.fill();
    ctx.restore();
  });
};

export const renderSparks = (
  ctx: CanvasRenderingContext2D,
  sparksRef: React.MutableRefObject<StarSpark[]>,
  speedFactor: number,
  height: number
) => {
  const aliveSparks: StarSpark[] = [];
  sparksRef.current.forEach((spark) => {
    spark.x += spark.vx * speedFactor;
    spark.y += spark.vy * speedFactor;
    spark.vy += 0.2 * speedFactor;
    spark.alpha -= 0.028 * speedFactor;

    if (spark.alpha > 0.05 && spark.y < height) {
      aliveSparks.push(spark);
      ctx.save();
      ctx.fillStyle = spark.color;
      ctx.globalAlpha = spark.alpha * 0.35;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.size * 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = spark.alpha;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  });
  sparksRef.current = aliveSparks;
};

export const renderBladeTrail = (
  ctx: CanvasRenderingContext2D,
  pointerTrailRef: React.MutableRefObject<SlicePoint[]>,
  now: number
) => {
  const trail = pointerTrailRef.current;
  const validTrail = trail.filter((pt) => now - pt.time < 120);
  pointerTrailRef.current = validTrail;

  if (validTrail.length >= 2) {
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 1; i < validTrail.length; i++) {
      const ptA = validTrail[i - 1];
      const ptB = validTrail[i];
      const age = now - ptB.time;
      const factor = Math.max(0, 1 - age / 120);

      ctx.strokeStyle = `rgba(251, 191, 36, ${factor * 0.28})`;
      ctx.lineWidth = 15.0 * factor;
      ctx.beginPath();
      ctx.moveTo(ptA.x, ptA.y);
      ctx.lineTo(ptB.x, ptB.y);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 255, 255, ${factor * 0.95})`;
      ctx.lineWidth = 3.8 * factor;
      ctx.beginPath();
      ctx.moveTo(ptA.x, ptA.y);
      ctx.lineTo(ptB.x, ptB.y);
      ctx.stroke();

      ctx.strokeStyle = `rgba(251, 191, 36, ${factor * 0.55})`;
      ctx.lineWidth = 9.0 * factor;
      ctx.beginPath();
      ctx.moveTo(ptA.x, ptA.y);
      ctx.lineTo(ptB.x, ptB.y);
      ctx.stroke();
    }
    ctx.restore();
  }
};
