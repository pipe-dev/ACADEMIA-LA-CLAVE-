// src/components/unit3-rhythm/drumPhysics.ts

import { ActiveSphere, SeveredPiece, SlicePoint, StarSpark } from './types';

export const createDimpleParticles = (impactX: number, impactY: number) => {
  const colors = ['#38bdf8', '#fbbf24', '#c084fc', '#4ade80', '#fb923c', '#ffffff'];
  return Array.from({ length: 14 }).map(() => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.9;
    const speed = 1.4 + Math.random() * 3.6;
    return {
      x: impactX + (Math.random() - 0.5) * 14,
      y: impactY + (Math.random() - 0.5) * 6,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 2.2 + Math.random() * 2.8,
      alpha: 1.0,
    };
  });
};

export const createSparks = (
  x: number,
  y: number,
  color: string,
  count = 30
): StarSpark[] => {
  const newSparks: StarSpark[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3.0 + Math.random() * 8.0;
    newSparks.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2.0,
      alpha: 1.0,
      color: Math.random() > 0.3 ? color : '#ffffff',
      size: 1.5 + Math.random() * 3.5,
    });
  }
  return newSparks;
};

export const createSeveredPieces = (
  sphere: ActiveSphere,
  cutAngle: number
): { p1: SeveredPiece; p2: SeveredPiece } => {
  const p1: SeveredPiece = {
    id: Date.now() + Math.random(),
    type: sphere.type,
    x: sphere.x,
    y: sphere.y,
    vx: -2.6 - Math.random() * 1.2,
    vy: -2.8 - Math.random() * 1.2,
    cutAngle,
    pieceSide: 'top',
    rotation: 0,
    vRot: -0.04 - Math.random() * 0.02,
    alpha: 1.0,
    bouncesLeft: 2,
  };

  const p2: SeveredPiece = {
    id: Date.now() + Math.random() + 1,
    type: sphere.type,
    x: sphere.x,
    y: sphere.y,
    vx: 2.6 + Math.random() * 1.2,
    vy: -2.8 - Math.random() * 1.2,
    cutAngle,
    pieceSide: 'bottom',
    rotation: 0,
    vRot: 0.04 + Math.random() * 0.02,
    alpha: 1.0,
    bouncesLeft: 2,
  };

  return { p1, p2 };
};

export const updateSeveredPieces = (
  severedPieces: SeveredPiece[],
  pieceRefs: (HTMLDivElement | null)[],
  triggerDrumImpact: (x: number, y: number) => void,
  drumSurfaceY: number,
  width: number,
  height: number,
  speedFactor: number
) => {
  for (let pIdx = 0; pIdx < 8; pIdx++) {
    const piece = severedPieces[pIdx];
    const pieceEl = pieceRefs[pIdx];
    if (!pieceEl) continue;

    if (piece && piece.alpha > 0.02 && piece.y < height + 100) {
      const pieceGravity = 0.22 * speedFactor;
      piece.vy += pieceGravity;
      piece.x += piece.vx * speedFactor;
      piece.y += piece.vy * speedFactor;
      piece.rotation += piece.vRot * speedFactor;

      const contactY = drumSurfaceY - 6;

      if (piece.y >= contactY && piece.vy > 0) {
        if (piece.bouncesLeft === 2) {
          piece.y = contactY;
          piece.vy = -4.8 * speedFactor;
          piece.vx = (piece.vx > 0 ? 1 : -1) * (Math.abs(piece.vx) * 1.15 + 0.4);
          piece.bouncesLeft = 1;
          triggerDrumImpact(piece.x, drumSurfaceY);
        } else if (piece.bouncesLeft === 1) {
          piece.y = contactY;
          piece.vy = -3.8 * speedFactor;
          piece.vx = (piece.vx > 0 ? 1 : -1) * (Math.abs(piece.vx) + 2.8);
          piece.bouncesLeft = 0;
          triggerDrumImpact(piece.x, drumSurfaceY);
        }
      }

      if (piece.bouncesLeft === 0) {
        if (piece.x < 35 || piece.x > width - 35 || piece.y > drumSurfaceY) {
          piece.alpha = Math.max(0, piece.alpha - 0.02 * speedFactor);
        }
      }

      pieceEl.style.display = 'block';
      pieceEl.style.opacity = `${piece.alpha}`;

      const clip =
        piece.pieceSide === 'top'
          ? 'polygon(-25% -25%, 125% -25%, 125% 50%, -25% 50%)'
          : 'polygon(-25% 50%, 125% 50%, 125% 125%, -25% 125%)';
      pieceEl.style.clipPath = clip;

      const totalRotation = piece.cutAngle + piece.rotation;
      pieceEl.style.transform = `translate3d(${piece.x - 40}px, ${piece.y - 40}px, 0) rotate(${totalRotation}rad)`;
    } else {
      pieceEl.style.display = 'none';
    }
  }
};

export const updateIntactSpheresDOM = (
  spheres: ActiveSphere[],
  sphereDomRefs: (HTMLDivElement | null)[],
  spinRefs: (HTMLDivElement | null)[],
  sphereSpinRef: Map<number, number>,
  lastBounceCounts: Map<number, number>,
  triggerDrumImpact: (x: number, y: number) => void,
  drumSurfaceY: number,
  drumCenterY: number,
  drumRadiusY: number,
  dt: number,
  speedFactor: number
) => {
  for (let sIdx = 0; sIdx < 3; sIdx++) {
    const domEl = sphereDomRefs[sIdx];
    if (domEl) domEl.style.display = 'none';
  }

  spheres.forEach((sphere, sIdx) => {
    if (sIdx >= 3) return;
    const domEl = sphereDomRefs[sIdx];

    if (!sphere.isCut) {
      const currentSurfaceY = sphere.surfaceY ?? drumSurfaceY;

      const lastBounce = lastBounceCounts.get(sphere.id) ?? -1;
      if (sphere.bounceCount !== lastBounce) {
        lastBounceCounts.set(sphere.id, sphere.bounceCount);
        triggerDrumImpact(sphere.x, currentSurfaceY);
      }

      const altitude = Math.max(0, currentSurfaceY - sphere.y);

      let scaleX = 1;
      let scaleY = 1;

      if (altitude < 18) {
        const compression = Math.max(0, 1 - altitude / 18);
        scaleX = 1 + 0.05 * compression;
        scaleY = 1 - 0.08 * compression;
      } else if (altitude < 70 && sphere.vy < -150) {
        scaleX = 0.98;
        scaleY = 1.03;
      }

      const depthRatio = (currentSurfaceY - drumCenterY) / (drumRadiusY || 1);
      const perspectiveScale = Math.max(0.84, Math.min(1.16, 1.0 + depthRatio * 0.24));

      if (domEl) {
        domEl.style.display = 'block';
        domEl.style.transform = `translate3d(${sphere.x - 40}px, ${sphere.y - 40}px, 0) scale(${scaleX * perspectiveScale}, ${scaleY * perspectiveScale})`;
        domEl.style.transformOrigin = '50% 100%';
      }

      let spin = sphereSpinRef.get(sphere.id) ?? 0;
      spin += (sphere.vx / (sphere.radius || 40)) * dt * speedFactor;
      sphereSpinRef.set(sphere.id, spin);
      const spinEl = spinRefs[sIdx];
      if (spinEl) spinEl.style.transform = `rotate(${spin}rad)`;
    }
  });
};

export const checkSpheresSwipe = (
  spheres: ActiveSphere[],
  ptA: SlicePoint,
  ptB: SlicePoint
): { sphere: ActiveSphere; cutX: number; cutY: number; cutAngle: number } | null => {
  const dx = ptB.x - ptA.x;
  const dy = ptB.y - ptA.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 4) return null;
  const cutAngle = Math.atan2(dy, dx);

  for (const sphere of spheres) {
    if (sphere.isCut) continue;
    const u = Math.max(
      0,
      Math.min(1, ((sphere.x - ptA.x) * dx + (sphere.y - ptA.y) * dy) / (dist * dist))
    );
    const nearestX = ptA.x + u * dx;
    const nearestY = ptA.y + u * dy;
    if (Math.hypot(sphere.x - nearestX, sphere.y - nearestY) <= 56) {
      return { sphere, cutX: nearestX, cutY: nearestY, cutAngle };
    }
  }
  return null;
};

export const checkTrophySwipe = (
  trophyReveal: { x: number; y: number } | null,
  trophyRevealTime: number,
  ptA: SlicePoint,
  ptB: SlicePoint
): { cutX: number; cutY: number; cutAngle: number } | null => {
  if (!trophyReveal || performance.now() - trophyRevealTime <= 1100) return null;
  const dx = ptB.x - ptA.x;
  const dy = ptB.y - ptA.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 4) return null;
  const uT = Math.max(
    0,
    Math.min(1, ((trophyReveal.x - ptA.x) * dx + (trophyReveal.y - ptA.y) * dy) / (dist * dist))
  );
  const nearestX = ptA.x + uT * dx;
  const nearestY = ptA.y + uT * dy;
  if (Math.hypot(trophyReveal.x - nearestX, trophyReveal.y - nearestY) <= 60) {
    return { cutX: nearestX, cutY: nearestY, cutAngle: Math.atan2(dy, dx) };
  }
  return null;
};

