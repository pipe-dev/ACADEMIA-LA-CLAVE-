// src/components/unit4-flappy/renderEnvironment.ts

import { Bush, FloorBlade, FloorCaches, FloorSpeck } from './unit4Types';
import { BIRD_R, floorY } from './unit4Config';
import { wobAt } from './unit4Physics';

// Gradientes de arbusto memoizados: antes se creaba 1 por arbusto POR FRAME.
// Se crean en coordenadas locales y se aplican bajo la matriz de cada arbusto.
let bushGradCtx: CanvasRenderingContext2D | null = null;
let bushGrads: (CanvasGradient | null)[] | null = null;

const makeBushGrad = (
  ctx: CanvasRenderingContext2D,
  stops: [number, string][]
) => {
  const g = ctx.createLinearGradient(0, -72, 0, 34);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
};

const ensureBushGrads = (ctx: CanvasRenderingContext2D) => {
  if (bushGradCtx === ctx && bushGrads) return;
  bushGradCtx = ctx;
  bushGrads = [
    makeBushGrad(ctx, [[0, '#3f6212'], [0.5, '#365314'], [1, '#1a2e05']]),
    makeBushGrad(ctx, [[0, '#84cc16'], [0.5, '#4d7c0f'], [1, '#365314']]),
    makeBushGrad(ctx, [[0, '#65a30d'], [0.5, '#3f6212'], [1, '#1a2e05']]),
  ];
};

export const buildCaches = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): FloorCaches => {
  const fy0 = floorY(height);
  const gh = height * 0.034;
  const soilTop0 = fy0 + gh;

  // Suelo: gradientes verticales (anclados al alto de la pantalla)
  const floorSoilGrad = ctx.createLinearGradient(0, soilTop0, 0, height);
  floorSoilGrad.addColorStop(0, '#92400e');
  floorSoilGrad.addColorStop(0.35, '#78350f');
  floorSoilGrad.addColorStop(1, '#451a03');

  const floorGrassGrad = ctx.createLinearGradient(0, fy0, 0, soilTop0);
  floorGrassGrad.addColorStop(0, '#84cc16');
  floorGrassGrad.addColorStop(0.4, '#4d7c0f');
  floorGrassGrad.addColorStop(1, '#365314');

  // Patrón determinista de motas de tierra (se recicla con el scroll)
  let seed = 1234;
  const rnd2 = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const floorSpecks: FloorSpeck[] = [];
  const speckCount = Math.min(120, Math.floor(width / 4));
  for (let i = 0; i < speckCount; i++) {
    floorSpecks.push({
      fx: rnd2() * width,
      fy: soilTop0 + 4 + rnd2() * Math.max(8, height - soilTop0 - 10),
      w: 2 + rnd2() * 3,
      h: 1 + rnd2() * 2,
      dark: rnd2() > 0.5,
    });
  }

  // Briznas de pasto (misma estética, sin PRNG por fotograma)
  seed = 9876;
  const blades = Math.max(12, Math.floor(width / 26));
  const floorBlades: FloorBlade[] = [];
  for (let i = 0; i < blades; i++) {
    const tone = rnd2() > 0.5 ? '#84cc16' : '#4d7c0f';
    floorBlades.push({
      bx0: ((i + 1) / (blades + 1)) * width + (rnd2() - 0.5) * 18,
      len: 3 + rnd2() * 7,
      lean0: (rnd2() - 0.5) * 8,
      sway: 2 + rnd2() * 5,
      tone,
    });
  }

  // Gradientes del pato (coordenadas locales → son reutilizables)
  const r = BIRD_R(height);
  const body = ctx.createRadialGradient(
    -r * 0.18,
    -r * 0.3,
    r * 0.08,
    -r * 0.05,
    -r * 0.1,
    r * 1.15
  );
  body.addColorStop(0, '#fff6b0');
  body.addColorStop(0.22, '#ffdf4d');
  body.addColorStop(0.55, '#f9c514');
  body.addColorStop(0.85, '#e6a706');
  body.addColorStop(1, '#c98a04');
  const birdBodyGrad = body;

  const wing = ctx.createLinearGradient(0, -r * 0.4, 0, r * 0.4);
  wing.addColorStop(0, '#fce58a');
  wing.addColorStop(0.5, '#f2bc2e');
  wing.addColorStop(1, '#b37c06');
  const birdWingGrad = wing;

  const bill = ctx.createLinearGradient(0, -r * 0.1, 0, r * 0.14);
  bill.addColorStop(0, '#ffa02e');
  bill.addColorStop(0.55, '#f97316');
  bill.addColorStop(1, '#d9480f');
  const birdBillGrad = bill;

  return {
    floorSoilGrad,
    floorGrassGrad,
    birdBodyGrad,
    birdWingGrad,
    birdBillGrad,
    floorSpecks,
    floorBlades,
  };
};

export const drawFloor = (
  ctx: CanvasRenderingContext2D,
  caches: FloorCaches,
  groundScroll: number,
  width: number,
  height: number,
  t: number
) => {
  const fy = floorY(height);
  const gh = height * 0.034;
  const soilTop = fy + gh;

  // Tierra
  ctx.fillStyle = caches.floorSoilGrad || '#78350f';
  ctx.fillRect(0, soilTop, width, height - soilTop);

  // Motas de tierra (agrupadas por color para cambiar fillStyle solo 2 veces)
  ctx.fillStyle = 'rgba(69,26,3,0.55)';
  for (const s of caches.floorSpecks) {
    if (!s.dark) continue;
    const sx = ((s.fx + groundScroll * 0.8) % width + width) % width;
    ctx.fillRect(sx, s.fy, s.w, s.h);
  }
  ctx.fillStyle = 'rgba(120,53,15,0.55)';
  for (const s of caches.floorSpecks) {
    if (s.dark) continue;
    const sx = ((s.fx + groundScroll * 0.8) % width + width) % width;
    ctx.fillRect(sx, s.fy, s.w, s.h);
  }

  // Pasto verde irregular
  ctx.beginPath();
  ctx.moveTo(0, fy);
  const step = 12;
  for (let x = 0; x <= width; x += step) {
    ctx.lineTo(x, fy + wobAt(x, t, width, groundScroll));
  }
  ctx.lineTo(width, soilTop);
  ctx.lineTo(0, soilTop);
  ctx.closePath();
  ctx.fillStyle = caches.floorGrassGrad || '#4d7c0f';
  ctx.fill();

  // Briznas de pasto
  ctx.lineCap = 'round';
  ctx.lineWidth = 2;
  for (const b of caches.floorBlades) {
    const bx = ((b.bx0 + groundScroll) % width + width) % width;
    const baseY = fy + wobAt(bx, t, width, groundScroll);
    const tipY = baseY - b.len;
    const lean = b.lean0 + Math.sin(t * 1.6 + bx * 0.05) * b.sway;
    ctx.strokeStyle = b.tone;
    ctx.beginPath();
    ctx.moveTo(bx, baseY);
    ctx.quadraticCurveTo(
      bx + lean,
      (baseY + tipY) / 2,
      bx + lean * 2,
      tipY
    );
    ctx.stroke();
  }
};

export const drawBush = (
  ctx: CanvasRenderingContext2D,
  b: Bush,
  height: number
) => {
  const fy = floorY(height);
  const gh = height * 0.034;
  const bx = b.x;
  const baseY = fy + gh * 0.75;
  const s = b.scale;

  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.12)';
  ctx.beginPath();
  ctx.ellipse(bx, baseY + 2, 100 * s, 7 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(bx, baseY - 34 * s);
  ctx.scale(s * b.sx, s);
  ensureBushGrads(ctx);
  const gi = b.dark ? 0 : b.seed % 2 === 0 ? 1 : 2;
  ctx.fillStyle = (bushGrads && bushGrads[gi]) || '#4d7c0f';
  ctx.beginPath();
  ctx.arc(0, 0, 32, Math.PI * 0.5, Math.PI * 1.5);
  ctx.arc(28, -22, 38, Math.PI * 1.0, Math.PI * 1.85);
  ctx.arc(75, -28, 44, Math.PI * 1.15, Math.PI * 1.95);
  ctx.arc(122, -18, 36, Math.PI * 1.25, Math.PI * 2.0);
  ctx.arc(148, 4, 30, Math.PI * 1.6, Math.PI * 0.5);
  ctx.lineTo(-32, 32);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.beginPath();
  ctx.arc(70, -32, 30, Math.PI * 1.2, Math.PI * 1.8);
  ctx.fill();
  ctx.restore();
};

export const drawScore = (
  ctx: CanvasRenderingContext2D,
  score: number,
  width: number,
  height: number
) => {
  const big = height * 0.13;
  ctx.save();
  ctx.font = `900 ${big}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = big * 0.12;
  ctx.strokeStyle = 'rgba(69,26,3,0.9)';
  ctx.strokeText(String(score), width / 2, height * 0.17);
  ctx.fillStyle = '#fffbeb';
  ctx.fillText(String(score), width / 2, height * 0.17);
  ctx.restore();
};
