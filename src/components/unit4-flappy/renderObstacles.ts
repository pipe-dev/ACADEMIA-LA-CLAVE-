// src/components/unit4-flappy/renderObstacles.ts

import { Obstacle } from './unit4Types';
import { PIPE_BODY_W, PIPE_CAP_W, PIPE_CAP_H, floorY } from './unit4Config';
import { drawTrophyPedestal } from './renderTrophy';

/**
 * Traza un rectángulo con esquinas suavemente redondeadas en el contexto 2D.
 * Utiliza ctx.roundRect si está disponible de forma nativa o fallback geométrico
 * ortogonal exacto sin generar distorsiones diagonales.
 */
const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.arcTo(x + w, y, x + w, y + radius, radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
    ctx.lineTo(x + radius, y + h);
    ctx.arcTo(x, y + h, x, y + h - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
  }
};

// Gradientes de tubo memoizados: se creaban 2 por tubo POR FRAME (hasta 8/frame).
// Los gradientes se aplican con la matriz de dibujo, así que se cachean en
// coordenadas locales [0..w] y se reutilizan con translate.
let gradCtx: CanvasRenderingContext2D | null = null;
let gradKey = -1;
let bodyGrad: CanvasGradient | null = null;
let capGrad: CanvasGradient | null = null;

const addPipeStops = (g: CanvasGradient) => {
  g.addColorStop(0, '#42782b');
  g.addColorStop(0.1, '#78d858');
  g.addColorStop(0.2, '#9df578');
  g.addColorStop(0.4, '#5bbd42');
  g.addColorStop(0.75, '#3e942f');
  g.addColorStop(0.92, '#23631c');
  g.addColorStop(1, '#164211');
};

const ensurePipeGrads = (ctx: CanvasRenderingContext2D, height: number) => {
  const key = Math.round(height);
  if (ctx === gradCtx && key === gradKey && bodyGrad && capGrad) return;
  gradCtx = ctx;
  gradKey = key;
  bodyGrad = ctx.createLinearGradient(0, 0, PIPE_BODY_W(height), 0);
  addPipeStops(bodyGrad);
  capGrad = ctx.createLinearGradient(0, 0, PIPE_CAP_W(height), 0);
  addPipeStops(capGrad);
};

export const drawObstacle = (
  ctx: CanvasRenderingContext2D,
  ob: Obstacle,
  height: number
) => {
  ob.alpha = Math.min(1, ob.alpha + 0.06);
  if (ob.trophy) {
    drawTrophyPedestal(ctx, ob, height);
    return;
  }

  ensurePipeGrads(ctx, height);

  const capW = PIPE_CAP_W(height);
  const capH = PIPE_CAP_H(height);
  const bodyW = ob.w;
  const capX = ob.x;
  const bodyX = ob.x + (capW - bodyW) / 2;
  const isBottom = ob.type === 'bottom';
  const fy = floorY(height);

  // La posición Y del reborde/boca (cap)
  const capY = isBottom ? ob.gapY - capH : ob.gapY;

  // El cuerpo del tubo se solapa ligeramente (2px) bajo el collar
  const bodyTop = isBottom ? ob.gapY - 2 : 0;
  const bodyBottom = isBottom ? fy + 10 : ob.gapY + 2;

  ctx.save();
  ctx.globalAlpha = ob.alpha;

  // 1. Sombra de contacto en el suelo para el tubo inferior
  if (isBottom) {
    ctx.fillStyle = 'rgba(15,23,42,0.28)';
    ctx.beginPath();
    ctx.ellipse(capX + capW / 2, fy + 4, bodyW * 0.65, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Cuerpo del tubo (cilindro verde sombreado), en coordenadas locales
  const drawPipeBody = (x: number, y: number, w: number, h: number) => {
    if (h <= 0) return;
    ctx.fillStyle = bodyGrad as CanvasGradient;
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = 'rgba(255,255,255,0.38)';
    ctx.lineWidth = Math.max(1.5, w * 0.035);
    ctx.beginPath();
    ctx.moveTo(x + w * 0.16, y);
    ctx.lineTo(x + w * 0.16, y + h);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = Math.max(1.5, w * 0.03);
    ctx.beginPath();
    ctx.moveTo(x + w * 0.86, y);
    ctx.lineTo(x + w * 0.86, y + h);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(14,46,14,0.95)';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x, y, w, h);
  };

  ctx.save();
  ctx.translate(bodyX, 0);
  drawPipeBody(0, bodyTop, bodyW, bodyBottom - bodyTop);
  ctx.restore();

  // 3. Sombra proyectada del reborde (overhang) sobre el cuerpo del tubo
  const overhangH = Math.max(4, capH * 0.22);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  if (isBottom) {
    ctx.fillRect(bodyX, capY + capH, bodyW, overhangH);
  } else {
    ctx.fillRect(bodyX, capY - overhangH, bodyW, overhangH);
  }

  // 4. Collar / reborde de la entrada (Cap) en coordenadas locales
  ctx.save();
  ctx.translate(capX, 0);
  drawRoundedRect(ctx, 0, capY, capW, capH, 4);
  ctx.fillStyle = capGrad as CanvasGradient;
  ctx.fill();
  ctx.strokeStyle = 'rgba(14,46,14,0.95)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // 5. Detalles de la entrada y reflejos en el collar
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(capW * 0.16, capY + 3, Math.max(2, capW * 0.07), capH - 6);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(capW * 0.86, capY + 3, Math.max(2, capW * 0.06), capH - 6);

  // 6. Profundidad en la boca / entrada de la tubería (Rim Interior Depth)
  const mouthH = Math.max(3, capH * 0.18);
  ctx.fillStyle = 'rgba(10,32,10,0.48)';
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1.2;
  if (isBottom) {
    ctx.fillRect(3, capY + 1.5, capW - 6, mouthH);
    ctx.beginPath();
    ctx.moveTo(4, capY + 1.5);
    ctx.lineTo(capW - 4, capY + 1.5);
    ctx.stroke();
  } else {
    ctx.fillRect(3, capY + capH - mouthH - 1.5, capW - 6, mouthH);
    ctx.beginPath();
    ctx.moveTo(4, capY + capH - 1.5);
    ctx.lineTo(capW - 4, capY + capH - 1.5);
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore();
};
