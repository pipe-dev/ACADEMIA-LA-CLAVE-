// src/components/unit4-flappy/renderTrophy.ts

import { Meteor, Obstacle, WinState } from './unit4Types';
import {
  CENTER_SCALE,
  CENTER_Y,
  METEOR_R,
  PEDESTAL_H,
  floorY,
} from './unit4Config';

export const drawTrophyPedestal = (
  ctx: CanvasRenderingContext2D,
  ob: Obstacle,
  height: number
) => {
  const wPx = ob.w;
  const topY = floorY(height) - PEDESTAL_H(height);
  const cx = ob.x + wPx / 2;
  const fy = floorY(height);

  ctx.save();
  ctx.globalAlpha = ob.alpha;

  // Sombra de contacto
  ctx.fillStyle = 'rgba(15,23,42,0.28)';
  ctx.beginPath();
  ctx.ellipse(cx, fy + 4, wPx * 0.55, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Columna dorada
  const cg = ctx.createLinearGradient(ob.x, 0, ob.x + wPx, 0);
  cg.addColorStop(0, '#c9a227');
  cg.addColorStop(0.18, '#f6e27a');
  cg.addColorStop(0.5, '#e0bb54');
  cg.addColorStop(0.85, '#b88623');
  cg.addColorStop(1, '#8f6a14');
  ctx.fillStyle = cg;
  // Columna ENTERRADA: desciende bajo el pasto hasta el fondo para que la
  // base no se vea flotando sobre el suelo.
  ctx.fillRect(ob.x, topY, wPx, height - topY);

  // Estrías horizontales
  ctx.strokeStyle = 'rgba(120,84,10,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let y = topY + height * 0.06; y < fy; y += height * 0.07) {
    ctx.moveTo(ob.x + 2, y);
    ctx.lineTo(ob.x + wPx - 2, y);
  }
  ctx.stroke();

  // Montículo de tierra en la base: parece excavada/enterrada en el suelo
  const moundY = fy + height * 0.012;
  const mg = ctx.createLinearGradient(0, fy - height * 0.035, 0, fy + height * 0.02);
  mg.addColorStop(0, '#5b8f2b');
  mg.addColorStop(0.6, '#3d2a09');
  mg.addColorStop(1, '#241404');
  ctx.fillStyle = mg;
  ctx.beginPath();
  ctx.ellipse(cx, moundY, wPx * 0.62, height * 0.035, 0, Math.PI, Math.PI * 2);
  ctx.fill();

  // Hueco de entrada (túnel)
  const hw = height * 0.075;
  const holeTop = fy - height * 0.14;
  const holeArch = fy - height * 0.2;
  ctx.fillStyle = '#3a2508';
  ctx.beginPath();
  ctx.moveTo(cx - hw, fy);
  ctx.lineTo(cx - hw, holeTop);
  ctx.quadraticCurveTo(cx, holeArch, cx + hw, holeTop);
  ctx.lineTo(cx + hw, fy);
  ctx.closePath();
  ctx.fill();

  const holeInner = ctx.createRadialGradient(
    cx,
    holeTop + (fy - holeTop) * 0.35,
    height * 0.01,
    cx,
    holeTop + (fy - holeTop) * 0.35,
    hw * 1.4
  );
  holeInner.addColorStop(0, '#170d03');
  holeInner.addColorStop(1, '#3a2508');
  ctx.fillStyle = holeInner;
  ctx.beginPath();
  ctx.moveTo(cx - hw, fy);
  ctx.lineTo(cx - hw, holeTop);
  ctx.quadraticCurveTo(cx, holeArch, cx + hw, holeTop);
  ctx.lineTo(cx + hw, fy);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,235,150,0.55)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - hw, fy);
  ctx.lineTo(cx - hw, holeTop);
  ctx.quadraticCurveTo(cx, holeArch, cx + hw, holeTop);
  ctx.lineTo(cx + hw, fy);
  ctx.stroke();

  // Hueco superior
  const mR = height * 0.05;
  const mY = topY + height * 0.006;
  const mInner = ctx.createRadialGradient(
    cx,
    mY + height * 0.01,
    2,
    cx,
    mY + height * 0.01,
    mR * 1.4
  );
  mInner.addColorStop(0, '#170d03');
  mInner.addColorStop(0.8, '#3a2508');
  mInner.addColorStop(1, '#5a3c12');
  ctx.fillStyle = mInner;
  ctx.beginPath();
  ctx.ellipse(cx, mY, mR, height * 0.02, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#fbea9a';
  ctx.lineWidth = height * 0.0065;
  ctx.beginPath();
  ctx.ellipse(cx, mY - height * 0.001, mR, height * 0.0195, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(122,90,13,0.8)';
  ctx.lineWidth = height * 0.002;
  ctx.beginPath();
  ctx.ellipse(
    cx,
    mY - height * 0.002,
    mR + height * 0.007,
    height * 0.022,
    0,
    0,
    Math.PI * 2
  );
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,246,192,0.5)';
  ctx.lineWidth = height * 0.0035;
  ctx.beginPath();
  ctx.arc(
    cx,
    mY + height * 0.034,
    mR * 0.6,
    Math.PI * 0.18,
    Math.PI * 0.82
  );
  ctx.stroke();

  ctx.restore();
};

export const drawTrophyAt = (
  ctx: CanvasRenderingContext2D,
  cxT: number,
  baseY: number,
  s: number,
  alpha: number,
  height: number
) => {
  const hh = height * s;
  const fl = baseY;
  const cTop = fl - hh * 0.02;
  const tw = hh * 0.062;
  const rimY = cTop - hh * 0.115;
  const bodyH = hh * 0.06;
  const bbY = rimY + bodyH;

  ctx.save();
  ctx.globalAlpha = alpha;

  const gSide = ctx.createLinearGradient(cxT - tw, 0, cxT + tw, 0);
  gSide.addColorStop(0, '#8a6510');
  gSide.addColorStop(0.12, '#d9a11e');
  gSide.addColorStop(0.22, '#fff3b0');
  gSide.addColorStop(0.45, '#f6d151');
  gSide.addColorStop(0.7, '#e0b133');
  gSide.addColorStop(0.88, '#c18b16');
  gSide.addColorStop(1, '#7a5a0d');

  const cupPath = () => {
    ctx.beginPath();
    ctx.moveTo(cxT - tw, rimY);
    ctx.bezierCurveTo(
      cxT - tw - hh * 0.004,
      rimY + bodyH * 0.5,
      cxT - tw * 0.72,
      rimY + bodyH * 0.78,
      cxT - tw * 0.5,
      rimY + bodyH * 0.95
    );
    ctx.quadraticCurveTo(
      cxT,
      rimY + bodyH * 1.04,
      cxT + tw * 0.5,
      rimY + bodyH * 0.95
    );
    ctx.bezierCurveTo(
      cxT + tw * 0.72,
      rimY + bodyH * 0.78,
      cxT + tw + hh * 0.004,
      rimY + bodyH * 0.5,
      cxT + tw,
      rimY
    );
    ctx.closePath();
  };
  ctx.fillStyle = gSide;
  cupPath();
  ctx.fill();

  ctx.fillStyle = '#6b440b';
  ctx.beginPath();
  ctx.ellipse(cxT, rimY + hh * 0.014, tw * 0.86, hh * 0.015, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8a5a10';
  ctx.beginPath();
  ctx.ellipse(cxT, rimY + hh * 0.004, tw * 0.94, hh * 0.011, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff6c0';
  ctx.lineWidth = hh * 0.005;
  ctx.beginPath();
  ctx.ellipse(cxT, rimY + hh * 0.001, tw, hh * 0.0145, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(122,90,13,0.85)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(cxT, rimY + hh * 0.006, tw, hh * 0.018, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Brillo panza
  ctx.save();
  cupPath();
  ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.ellipse(
    cxT - tw * 0.34,
    rimY + bodyH * 0.34,
    tw * 0.13,
    bodyH * 0.22,
    -0.08,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.restore();

  // Asas
  ctx.lineCap = 'round';
  const handle = (dir: 1 | -1) => {
    ctx.strokeStyle = '#d9a11e';
    ctx.lineWidth = hh * 0.0065;
    ctx.beginPath();
    ctx.moveTo(cxT + dir * (tw - hh * 0.006), rimY + hh * 0.012);
    ctx.bezierCurveTo(
      cxT + dir * (tw + hh * 0.042),
      rimY + hh * 0.02,
      cxT + dir * (tw + hh * 0.05),
      rimY + hh * 0.045,
      cxT + dir * tw * 0.52,
      rimY + hh * 0.05
    );
    ctx.bezierCurveTo(
      cxT + dir * tw * 0.72,
      rimY + hh * 0.058,
      cxT + dir * tw * 0.84,
      rimY + hh * 0.05,
      cxT + dir * tw * 0.72,
      rimY + hh * 0.03
    );
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,240,176,0.55)';
    ctx.lineWidth = hh * 0.0022;
    ctx.beginPath();
    ctx.moveTo(cxT + dir * (tw - hh * 0.004), rimY + hh * 0.014);
    ctx.bezierCurveTo(
      cxT + dir * (tw + hh * 0.042),
      rimY + hh * 0.022,
      cxT + dir * (tw + hh * 0.05),
      rimY + hh * 0.044,
      cxT + dir * tw * 0.54,
      rimY + hh * 0.049
    );
    ctx.stroke();
  };
  handle(1);
  handle(-1);

  // Base
  ctx.fillStyle = gSide;
  ctx.fillRect(cxT - hh * 0.013, bbY, hh * 0.026, hh * 0.016);
  ctx.beginPath();
  ctx.arc(cxT, bbY + hh * 0.028, hh * 0.018, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cxT, bbY + hh * 0.042, hh * 0.012, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.arc(cxT - hh * 0.006, bbY + hh * 0.023, hh * 0.0045, 0, Math.PI * 2);
  ctx.fill();

  const gBase = ctx.createLinearGradient(
    cxT,
    cTop - hh * 0.02,
    cxT,
    cTop + hh * 0.014
  );
  gBase.addColorStop(0, '#f2c94c');
  gBase.addColorStop(0.6, '#d9a11e');
  gBase.addColorStop(1, '#8a6510');
  ctx.fillStyle = gBase;
  ctx.beginPath();
  ctx.moveTo(cxT - hh * 0.02, bbY + hh * 0.04);
  ctx.quadraticCurveTo(
    cxT - hh * 0.05,
    bbY + hh * 0.05,
    cxT - hh * 0.042,
    cTop - hh * 0.006
  );
  ctx.lineTo(cxT + hh * 0.042, cTop - hh * 0.006);
  ctx.quadraticCurveTo(
    cxT + hh * 0.05,
    bbY + hh * 0.05,
    cxT + hh * 0.02,
    bbY + hh * 0.04
  );
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cxT, cTop - hh * 0.004, hh * 0.046, hh * 0.011, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cxT, cTop + hh * 0.006, hh * 0.066, hh * 0.014, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(122,90,13,0.7)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(cxT, cTop + hh * 0.006, hh * 0.066, hh * 0.014, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(60,35,5,0.35)';
  ctx.beginPath();
  ctx.ellipse(cxT, cTop + hh * 0.017, hh * 0.075, hh * 0.008, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
};

export const drawTrophyOutOfPipe = (
  ctx: CanvasRenderingContext2D,
  win: WinState,
  width: number,
  height: number
) => {
  const cx0 = win.ex;
  const topY = floorY(height) - PEDESTAL_H(height);
  const hiddenY = topY + height * 0.06;
  const restY = topY - height * 0.03;
  const p = win.trophy;
  const bob =
    (win.stage === 'hold' ||
      win.stage === 'center' ||
      win.stage === 'pan') &&
    p >= 1
      ? Math.sin(performance.now() * 0.004) * height * 0.004
      : 0;
  const alpha = Math.min(1, p * 2.2);

  let cxT = cx0;
  let baseY: number;
  let s = win.tScale || 1;
  let clipToMouth = true;
  if (win.stage === 'center' || win.stage === 'pan') {
    const e = win.tx;
    cxT = cx0 + (width / 2 - cx0) * e;
    baseY = restY + (CENTER_Y(height) - restY) * e + bob;
    s = 1 + (CENTER_SCALE - 1) * e;
    clipToMouth = false;
  } else {
    baseY = hiddenY + (restY - hiddenY) * Math.min(1, p) + bob;
  }

  const hh = height * s;
  const fl = baseY;
  const cTop = fl - hh * 0.02;
  const gRimY = cTop - hh * 0.115;
  const gBodyH = hh * 0.06;
  const gcy = gRimY + gBodyH * 0.45;
  const gR = hh * 0.26;
  ctx.save();
  ctx.globalAlpha = alpha * 0.85;
  const glowT = ctx.createRadialGradient(cxT, gcy, 2, cxT, gcy, gR);
  glowT.addColorStop(0, 'rgba(253,224,71,0.4)');
  glowT.addColorStop(0.55, 'rgba(253,224,71,0.2)');
  glowT.addColorStop(1, 'rgba(253,224,71,0)');
  ctx.fillStyle = glowT;
  ctx.beginPath();
  ctx.arc(cxT, gcy, gR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (clipToMouth) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, width, topY + height * 0.004);
    ctx.clip();
    drawTrophyAt(ctx, cxT, baseY, s, alpha, height);
    ctx.restore();
  } else {
    drawTrophyAt(ctx, cxT, baseY, s, alpha, height);
  }
};

export const drawMeteor = (
  ctx: CanvasRenderingContext2D,
  m: Meteor,
  now: number,
  height: number
) => {
  const pulse = 0.75 + 0.25 * Math.sin(now * 0.09);
  const r = METEOR_R(height);
  const glowR = r * (1.35 + pulse * 0.3);
  ctx.save();

  // Estela de fuego arriba del meteorito (cae hacia abajo)
  const trailH = height * 0.34;
  const trail = ctx.createLinearGradient(0, m.y - trailH, 0, m.y);
  trail.addColorStop(0, 'rgba(255,90,0,0)');
  trail.addColorStop(0.5, 'rgba(255,90,0,0.25)');
  trail.addColorStop(1, 'rgba(255,140,20,0.6)');
  ctx.fillStyle = trail;
  ctx.fillRect(m.x - height * 0.014, m.y - trailH, height * 0.028, trailH);

  // Bola de fuego
  const g = ctx.createRadialGradient(m.x, m.y, 1, m.x, m.y, glowR);
  g.addColorStop(0, '#fff7c2');
  g.addColorStop(0.35, '#ffd166');
  g.addColorStop(0.72, '#f97316');
  g.addColorStop(1, 'rgba(185,28,28,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(m.x, m.y, glowR, 0, Math.PI * 2);
  ctx.fill();

  // Núcleo
  ctx.fillStyle = '#fffbe6';
  ctx.beginPath();
  ctx.arc(m.x, m.y, r * 0.55, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
};
