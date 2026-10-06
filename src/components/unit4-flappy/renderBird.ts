// src/components/unit4-flappy/renderBird.ts

import { BirdState, FloorCaches, Phase, WinState } from './unit4Types';
import { BIRD_R, BIRD_X, floorY } from './unit4Config';

export interface BirdPalette {
  tail?: string;
  bodyGrad?: CanvasGradient | string | null;
  belly?: string;
  wingGrad?: CanvasGradient | string | null;
  wingBorder?: string;
  billGrad?: CanvasGradient | string | null;
  billBorder?: string;
  feather?: string;
  eyePupil?: string;
  eyebrow?: string;
}

export interface BirdRenderOptions {
  palette?: BirdPalette;
  isGhost?: boolean;
  ghostAlpha?: number;
  label?: string;
  xOffset?: number;
  customX?: number;
}

// Generador de paleta alternativa (Amatista / Violeta Neón / Turquesa) para rivales o fantasmas
export const buildRivalBirdPalette = (
  ctx: CanvasRenderingContext2D,
  height: number
): BirdPalette => {
  const r = BIRD_R(height);

  // Cuerpo: Degradado radial amatista a violeta profundo
  const body = ctx.createRadialGradient(
    -r * 0.18,
    -r * 0.3,
    r * 0.08,
    -r * 0.05,
    -r * 0.1,
    r * 1.15
  );
  body.addColorStop(0, '#f5d0fe');
  body.addColorStop(0.22, '#e879f9');
  body.addColorStop(0.55, '#c026d3');
  body.addColorStop(0.85, '#9333ea');
  body.addColorStop(1, '#6b21a8');

  // Ala: Degradado púrpura eléctrico
  const wing = ctx.createLinearGradient(-r * 0.3, 0, r * 0.4, 0);
  wing.addColorStop(0, '#d946ef');
  wing.addColorStop(0.5, '#a855f7');
  wing.addColorStop(1, '#7e22ce');

  // Pico: Cian eléctrico brillante
  const bill = ctx.createLinearGradient(0, -r * 0.1, r * 0.4, r * 0.1);
  bill.addColorStop(0, '#38bdf8');
  bill.addColorStop(0.6, '#06b6d4');
  bill.addColorStop(1, '#0284c7');

  return {
    tail: '#d946ef',
    bodyGrad: body,
    belly: '#fdf4ff',
    wingGrad: wing,
    wingBorder: 'rgba(76,29,149,0.7)',
    billGrad: bill,
    billBorder: 'rgba(12,74,110,0.8)',
    feather: '#e879f9',
    eyePupil: '#0f172a',
    eyebrow: '#7e22ce',
  };
};

export const drawBird = (
  ctx: CanvasRenderingContext2D,
  bird: BirdState,
  win: WinState | null,
  phase: Phase,
  caches: FloorCaches,
  width: number,
  height: number,
  options?: BirdRenderOptions
) => {
  const r = BIRD_R(height);
  const inWin = win !== null;
  const baseX = inWin ? win.x : BIRD_X(width);
  const x = (options?.customX ?? baseX) + (options?.xOffset ?? 0);
  const y = bird.birdY;
  const wingAmp = inWin
    ? Math.PI * 2.2
    : phase === 'playing'
      ? Math.PI * 1.6
      : Math.PI * 0.9;
  const wingPhase = Math.sin(bird.wingT * 6) * wingAmp;

  ctx.save();
  if (options?.isGhost) {
    ctx.globalAlpha = (options.ghostAlpha ?? 0.65) * (inWin ? win.alpha : 1);
  } else if (inWin) {
    ctx.globalAlpha = win.alpha;
  }

  ctx.translate(x, y);
  ctx.rotate(bird.rot);

  ctx.save();
  const s = 0.85 * (inWin && win ? win.scale : 1);
  const face = inWin && win ? win.facing : 1;
  ctx.scale(face * s, s);

  // Cola
  ctx.fillStyle = options?.palette?.tail || '#fbd52d';
  ctx.beginPath();
  ctx.moveTo(-r * 0.72, -r * 0.02);
  ctx.quadraticCurveTo(-r * 1.15, -r * 0.15, -r * 1.02, -r * 0.45);
  ctx.quadraticCurveTo(-r * 0.85, -r * 0.3, -r * 0.62, -r * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-r * 0.66, r * 0.12);
  ctx.quadraticCurveTo(-r * 1.05, r * 0.05, -r * 0.96, -r * 0.22);
  ctx.quadraticCurveTo(-r * 0.8, -r * 0.1, -r * 0.58, -r * 0.04);
  ctx.closePath();
  ctx.fill();

  // Cuerpo + cabeza
  ctx.fillStyle = options?.palette?.bodyGrad || caches.birdBodyGrad || '#ffdf4d';
  ctx.beginPath();
  ctx.ellipse(-r * 0.12, r * 0.02, r * 0.9, r * 0.82, -0.06, 0, Math.PI * 2);
  ctx.moveTo(r * 0.44 + r * 0.52, -r * 0.42);
  ctx.arc(r * 0.44, -r * 0.42, r * 0.52, 0, Math.PI * 2);
  ctx.fill();

  // Panza
  ctx.fillStyle = options?.palette?.belly || '#fff3d6';
  ctx.beginPath();
  ctx.ellipse(r * 0.18, r * 0.24, r * 0.5, r * 0.42, -0.08, 0, Math.PI * 2);
  ctx.fill();

  // Ala
  ctx.save();
  ctx.translate(-r * 0.02, r * 0.1);
  ctx.rotate(-0.35 + wingPhase * 0.5);
  ctx.fillStyle = options?.palette?.wingGrad || caches.birdWingGrad || '#f2bc2e';
  ctx.beginPath();
  ctx.ellipse(r * 0.05, 0, r * 0.62, r * 0.34, -0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = options?.palette?.wingBorder || 'rgba(122,76,6,0.5)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.42, -r * 0.05);
  ctx.quadraticCurveTo(-r * 0.15, r * 0.05, r * 0.25, r * 0.02);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-r * 0.4, r * 0.14);
  ctx.quadraticCurveTo(-r * 0.12, r * 0.24, r * 0.3, r * 0.2);
  ctx.stroke();
  ctx.restore();

  // Ojo
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(r * 0.52, -r * 0.46, r * 0.21, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = options?.palette?.eyePupil || '#1e1b4b';
  ctx.beginPath();
  ctx.arc(r * 0.56, -r * 0.44, r * 0.115, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(r * 0.59, -r * 0.49, r * 0.045, 0, Math.PI * 2);
  ctx.fill();
  if (phase === 'playing') {
    ctx.strokeStyle = options?.palette?.eyebrow || '#ca8a04';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(r * 0.36, -r * 0.56);
    ctx.lineTo(r * 0.7, -r * 0.5);
    ctx.stroke();
  }

  // Pico
  ctx.save();
  ctx.translate(r * 0.72, -r * 0.26);
  ctx.rotate(-0.12);
  ctx.fillStyle = options?.palette?.billGrad || caches.birdBillGrad || '#f97316';
  ctx.beginPath();
  ctx.moveTo(-r * 0.1, -r * 0.07);
  ctx.quadraticCurveTo(r * 0.26, -r * 0.12, r * 0.34, -r * 0.03);
  ctx.quadraticCurveTo(r * 0.4, r * 0.035, r * 0.24, r * 0.09);
  ctx.quadraticCurveTo(r * 0.03, r * 0.12, -r * 0.1, r * 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = options?.palette?.billBorder || 'rgba(150,50,0,0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-r * 0.04, r * 0.05);
  ctx.quadraticCurveTo(r * 0.13, r * 0.08, r * 0.28, r * 0.01);
  ctx.stroke();
  ctx.fillStyle = 'rgba(150,50,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(r * 0.04, -r * 0.035, r * 0.07, r * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Plumita
  ctx.fillStyle = options?.palette?.feather || '#fbd52d';
  ctx.beginPath();
  ctx.moveTo(r * 0.62, -r * 0.88);
  ctx.quadraticCurveTo(r * 0.78, -r * 1.0, r * 0.55, -r * 1.0);
  ctx.quadraticCurveTo(r * 0.5, -r * 0.93, r * 0.55, -r * 0.86);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
  ctx.restore();

  // Etiqueta flotante identificadora (Nombre del jugador o Amigo Fantasma)
  if (options?.label) {
    ctx.save();
    if (options.isGhost) {
      ctx.globalAlpha = (options.ghostAlpha ?? 0.65) * 0.95;
    }
    ctx.font = 'bold 10px sans-serif';
    const textW = ctx.measureText(options.label).width;
    const badgeW = textW + 14;
    const badgeH = 16;
    const badgeX = x - badgeW / 2;
    const badgeY = y - r * 1.45 - (options.isGhost ? 6 : 4);

    ctx.fillStyle = options.isGhost ? 'rgba(76,29,149,0.85)' : 'rgba(15,23,42,0.85)';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 8);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(options.label, x, badgeY + badgeH / 2);
    ctx.restore();
  }

  // Estrellitas de aturdimiento
  if (inWin && (win.stage === 'shake' || win.stage === 'down')) {
    const t = performance.now() / 1000;
    for (let i = 0; i < 3; i++) {
      const a = t * 2.2 + (i * Math.PI * 2) / 3;
      const sx = x + Math.cos(a) * r * 1.3;
      const sy = y - r * 1.3 + Math.sin(a) * r * 0.45;
      ctx.save();
      ctx.globalAlpha = win.alpha;
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const rr = k % 2 === 0 ? r * 0.3 : r * 0.135;
        const ang = -Math.PI / 2 + (k * Math.PI) / 5;
        const px = sx + Math.cos(ang) * rr;
        const py = sy + Math.sin(ang) * rr;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = '#fde047';
      ctx.strokeStyle = 'rgba(180,83,9,0.6)';
      ctx.lineWidth = 1.2;
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  // Sombra de contacto en el suelo
  const fy = floorY(height);
  const proximity = Math.max(0, Math.min(1, 1 - (fy - y) / (height * 0.4)));
  if (proximity > 0.02 && (!inWin || win.alpha > 0.25)) {
    ctx.save();
    ctx.globalAlpha = proximity * 0.45 * (options?.isGhost ? (options.ghostAlpha ?? 0.65) : 1);
    ctx.fillStyle = 'rgba(15,23,42,1)';
    ctx.beginPath();
    ctx.ellipse(
      x,
      fy + r * 0.2,
      r * (0.6 + proximity * 0.5),
      r * (0.12 + proximity * 0.08),
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
  }
};
