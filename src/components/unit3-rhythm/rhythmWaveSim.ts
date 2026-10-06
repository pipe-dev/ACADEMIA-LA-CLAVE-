// src/components/unit3-rhythm/rhythmWaveSim.ts
// Motor fisico y generador de esferas para Duelo de Tambor (< 180 lineas)

import { ActiveSphere } from './types';
import { playBassDrum } from './rhythmAudio';

export interface DrumGeometry {
  canvasWidth: number;
  canvasHeight: number;
  drumW: number;
  drumH: number;
  drumCenterY: number;
  drumRadiusX: number;
  drumRadiusY: number;
  drumSurfaceY: number;
}

export function getDrumGeometry(width?: number, height?: number): DrumGeometry {
  const canvasWidth = width ?? (typeof window !== 'undefined' ? window.innerWidth : 430);
  const canvasHeight = height ?? (typeof window !== 'undefined' ? window.innerHeight : 932);
  const drumW = canvasWidth * 1.22;
  const drumH = drumW * (681 / 1024);
  const drumY = canvasHeight - drumH + 42;
  const drumCenterY = drumY + drumH * 0.44;
  const drumRadiusX = drumW * 0.417;
  const drumRadiusY = drumH * 0.284;
  const drumSurfaceY = drumCenterY - drumRadiusY * 0.12;

  return {
    canvasWidth,
    canvasHeight,
    drumW,
    drumH,
    drumCenterY,
    drumRadiusX,
    drumRadiusY,
    drumSurfaceY,
  };
}

export function createDuelSphere(
  type: 'purple' | 'golden',
  lane: 'left' | 'right' | 'center',
  geo: DrumGeometry,
  halfFlightTime = 460
): ActiveSphere {
  const isGolden = type === 'golden';
  const now = performance.now();
  const { canvasWidth, canvasHeight, drumCenterY, drumRadiusY } = geo;

  let startX = canvasWidth * 0.5;
  let depthOffset = 0;

  if (lane === 'left') {
    startX = canvasWidth * 0.36 + (Math.random() - 0.5) * 36;
    depthOffset = (0.15 + Math.random() * 0.25) * drumRadiusY;
  } else if (lane === 'right') {
    startX = canvasWidth * 0.64 + (Math.random() - 0.5) * 36;
    depthOffset = (-0.15 - Math.random() * 0.25) * drumRadiusY;
  } else {
    startX = canvasWidth * 0.5 + (Math.random() - 0.5) * 40;
    depthOffset = (Math.random() - 0.5) * 0.3 * drumRadiusY;
  }

  const initialSurfaceY = drumCenterY + depthOffset;
  const startY = initialSurfaceY;
  const peakRatio = isGolden
    ? 0.10 + Math.random() * 0.04
    : lane === 'left'
    ? 0.14 + Math.random() * 0.05
    : 0.18 + Math.random() * 0.05;
  const peakY = canvasHeight * peakRatio;

  const tApex = halfFlightTime / 1000;
  const deltaY = startY - peakY;
  const g = (2 * deltaY) / (tApex * tApex);
  const vy0 = -g * tApex;

  return {
    id: Date.now() + Math.random(),
    type,
    x: startX,
    y: startY,
    surfaceY: initialSurfaceY,
    radius: isGolden ? 42 : 32,
    vx:
      lane === 'left'
        ? 25 + Math.random() * 30
        : lane === 'right'
        ? -(25 + Math.random() * 30)
        : (Math.random() - 0.5) * 40,
    vy: vy0,
    g,
    isCut: false,
    birthTime: now,
    peakTime: now + halfFlightTime,
    bounceCount: 0,
    seed: Math.random() * 1e9,
  };
}

export function updateDuelSpheresPhysics(
  spheres: ActiveSphere[],
  dt: number,
  geo: DrumGeometry,
  onDrumBounce?: () => void
): void {
  const { canvasWidth, canvasHeight, drumCenterY, drumRadiusX, drumRadiusY, drumSurfaceY } = geo;

  spheres.forEach((sphere) => {
    if (sphere.isCut) return;

    sphere.vy += sphere.g * dt;
    sphere.y += sphere.vy * dt;
    sphere.x += sphere.vx * dt;

    // Rebote lateral en paredes de la pantalla
    const margin = 44;
    if (sphere.x <= margin) {
      sphere.x = margin;
      sphere.vx = Math.abs(sphere.vx) || 50;
    } else if (sphere.x >= canvasWidth - margin) {
      sphere.x = canvasWidth - margin;
      sphere.vx = -(Math.abs(sphere.vx) || 50);
    }

    // Rebote elastico perpetuo sobre la membrana del tambor
    const currentSurfaceY = sphere.surfaceY ?? drumSurfaceY;
    if (sphere.y >= currentSurfaceY && sphere.vy > 0) {
      sphere.y = currentSurfaceY;
      sphere.bounceCount += 1;

      const randomPeakRatio =
        sphere.type === 'golden'
          ? 0.10 + Math.random() * 0.08
          : 0.13 + Math.random() * 0.12;
      const peakY = canvasHeight * randomPeakRatio;
      const deltaY = currentSurfaceY - peakY;
      sphere.vy = -Math.sqrt(Math.max(10, 2 * sphere.g * deltaY));

      // Calculo de profundidad 2.5D en la elipse del parche
      const dxRatio = Math.min(0.85, Math.abs(sphere.x - canvasWidth * 0.5) / (drumRadiusX || 1));
      const safeYRange = Math.sqrt(Math.max(0.1, 1 - dxRatio * dxRatio)) * drumRadiusY * 0.62;
      const nextOffset = (Math.random() * 2 - 1) * safeYRange;
      sphere.surfaceY = drumCenterY + nextOffset;

      const roll = Math.random();
      if (roll < 0.35) {
        sphere.vx = -(sphere.vx || 30);
      } else if (roll < 0.7) {
        sphere.vx = (sphere.x < canvasWidth * 0.5 ? 1 : -1) * (30 + Math.random() * 35);
      }

      playBassDrum(sphere.type === 'golden');
      if (onDrumBounce) onDrumBounce();
    }
  });
}
