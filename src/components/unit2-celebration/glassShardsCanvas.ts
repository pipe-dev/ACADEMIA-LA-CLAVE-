// src/components/unit2-celebration/glassShardsCanvas.ts

export interface Shard {
  type: 'polygon' | 'needle' | 'dust';
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotZ: number;
  dRotZ: number;
  rotX: number;
  dRotX: number;
  rotY: number;
  dRotY: number;
  scale: number;
  alpha: number;
  decay: number;
  r: number;
  g: number;
  b: number;
  baseAlpha: number;
  points?: [number, number][];
  length?: number;
  width?: number;
  glintPhase: number;
  glintSpeed: number;
}

export const create1000Shards = (width: number, height: number): Shard[] => {
  const TOTAL_SHARDS = 1000;
  const shards: Shard[] = [];
  const cx = width * 0.5;
  const cy = height * 0.44; // Acoustic center of the crystal wine glass

  for (let i = 0; i < TOTAL_SHARDS; i++) {
    let type: 'polygon' | 'needle' | 'dust';
    if (i < 400) {
      type = 'polygon';
    } else if (i < 750) {
      type = 'needle';
    } else {
      type = 'dust';
    }

    const angle = Math.random() * Math.PI * 2;
    let speed: number;
    if (type === 'dust') {
      speed = 4 + Math.random() * 26;
    } else if (type === 'needle') {
      speed = 4 + Math.random() * 22;
    } else {
      const isLarge = i < 45;
      speed = isLarge ? 2 + Math.random() * 10 : 3.5 + Math.random() * 18;
    }

    const upBias = 2 + Math.random() * 7;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - upBias;

    const initOffset = Math.random() * 24;
    const x = cx + Math.cos(angle) * initOffset;
    const y = cy + Math.sin(angle) * initOffset;

    const rotZ = Math.random() * Math.PI * 2;
    const dRotZ = (Math.random() - 0.5) * 0.25;
    const rotX = Math.random() * Math.PI * 2;
    const dRotX = (Math.random() - 0.5) * 0.3;
    const rotY = Math.random() * Math.PI * 2;
    const dRotY = (Math.random() - 0.5) * 0.3;

    const glintPhase = Math.random() * Math.PI * 2;
    const glintSpeed = 0.08 + Math.random() * 0.16;

    const colorRand = Math.random();
    let r = 224,
      g = 242,
      b = 254,
      baseAlpha = 0.45;
    if (colorRand < 0.35) {
      r = 255;
      g = 255;
      b = 255;
      baseAlpha = 0.55;
    } else if (colorRand < 0.7) {
      r = 186;
      g = 230;
      b = 253;
      baseAlpha = 0.42;
    } else {
      r = 125;
      g = 211;
      b = 252;
      baseAlpha = 0.38;
    }

    const decay = 0.003 + Math.random() * 0.0035;

    if (type === 'polygon') {
      const isLarge = i < 45;
      const scale = isLarge
        ? 13 + Math.random() * 14
        : i < 200
          ? 6.5 + Math.random() * 7
          : 3 + Math.random() * 4;

      const numVertices = Math.random() < 0.7 ? 3 : 4;
      const points: [number, number][] = [];
      for (let v = 0; v < numVertices; v++) {
        const vAngle =
          (v / numVertices) * Math.PI * 2 + (Math.random() - 0.5) * 0.75;
        const vDist = scale * (0.45 + Math.random() * 0.75);
        points.push([Math.cos(vAngle) * vDist, Math.sin(vAngle) * vDist]);
      }

      shards.push({
        type: 'polygon',
        x,
        y,
        vx,
        vy,
        rotZ,
        dRotZ,
        rotX,
        dRotX,
        rotY,
        dRotY,
        scale,
        alpha: 1.0,
        decay,
        r,
        g,
        b,
        baseAlpha,
        points,
        glintPhase,
        glintSpeed,
      });
    } else if (type === 'needle') {
      const length = 9 + Math.random() * 18;
      const sWidth = 1.2 + Math.random() * 1.5;
      shards.push({
        type: 'needle',
        x,
        y,
        vx,
        vy,
        rotZ,
        dRotZ,
        rotX,
        dRotX,
        rotY,
        dRotY,
        scale: length,
        length,
        width: sWidth,
        alpha: 1.0,
        decay: decay * 1.1,
        r: 240,
        g: 249,
        b: 255,
        baseAlpha: 0.85,
        glintPhase,
        glintSpeed,
      });
    } else {
      const scale = 1.0 + Math.random() * 2.2;
      shards.push({
        type: 'dust',
        x,
        y,
        vx,
        vy,
        rotZ,
        dRotZ,
        rotX,
        dRotX,
        rotY,
        dRotY,
        scale,
        alpha: 1.0,
        decay: decay * 1.3,
        r: 255,
        g: 255,
        b: 255,
        baseAlpha: 0.9,
        glintPhase,
        glintSpeed,
      });
    }
  }

  return shards;
};

export const startShardsSimulation = (
  canvas: HTMLCanvasElement,
  onComplete?: () => void
): (() => void) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  const shards = create1000Shards(width, height);
  const cx = width * 0.5;
  const cy = height * 0.44;

  let shockwaveRadius = 0;
  let flashAlpha = 0.9;
  let animId: number | null = null;

  const render = () => {
    ctx.clearRect(0, 0, width, height);

    if (flashAlpha > 0.01) {
      ctx.fillStyle = `rgba(224, 242, 254, ${(flashAlpha * 0.28).toFixed(3)})`;
      ctx.fillRect(0, 0, width, height);
      flashAlpha *= 0.87;
    }

    if (shockwaveRadius < Math.max(width, height) * 0.8) {
      shockwaveRadius += 20;
      const ringAlpha = Math.max(
        0,
        1 - shockwaveRadius / (Math.max(width, height) * 0.75)
      );
      if (ringAlpha > 0.01) {
        ctx.beginPath();
        ctx.arc(cx, cy, shockwaveRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${(ringAlpha * 0.65).toFixed(3)})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
    }

    let activeCount = 0;

    for (let i = 0; i < shards.length; i++) {
      const s = shards[i];
      if (s.alpha <= 0.005 || s.y > height + 80) continue;
      activeCount++;

      const drag =
        s.type === 'dust' ? 0.965 : s.type === 'needle' ? 0.978 : 0.984;
      s.vx *= drag;
      s.vy *= drag;

      const gravity =
        s.type === 'dust' ? 0.26 : s.type === 'needle' ? 0.46 : 0.52;
      s.vy += gravity;

      s.x += s.vx;
      s.y += s.vy;

      s.rotZ += s.dRotZ;
      s.rotX += s.dRotX;
      s.rotY += s.dRotY;
      s.glintPhase += s.glintSpeed;

      s.alpha = Math.max(0, s.alpha - s.decay);

      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rotZ);

      if (s.type === 'polygon' && s.points) {
        const cosY = Math.cos(s.rotY);
        const cosX = Math.cos(s.rotX);
        const scaleX = Math.abs(cosY) < 0.06 ? 0.06 : cosY;
        const scaleY = Math.abs(cosX) < 0.06 ? 0.06 : cosX;
        ctx.scale(scaleX, scaleY);

        ctx.beginPath();
        ctx.moveTo(s.points[0][0], s.points[0][1]);
        for (let p = 1; p < s.points.length; p++) {
          ctx.lineTo(s.points[p][0], s.points[p][1]);
        }
        ctx.closePath();

        const glintVal = Math.cos(s.rotX) * Math.sin(s.rotY);
        const isGlinting = glintVal > 0.82;

        if (isGlinting) {
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, s.alpha * 1.3).toFixed(2)})`;
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 10;
        } else {
          ctx.fillStyle = `rgba(${s.r}, ${s.g}, ${s.b}, ${(s.alpha * s.baseAlpha).toFixed(3)})`;
          ctx.shadowBlur = 0;
        }
        ctx.fill();

        ctx.strokeStyle = isGlinting
          ? `rgba(255, 255, 255, ${s.alpha.toFixed(2)})`
          : `rgba(255, 255, 255, ${(s.alpha * 0.92).toFixed(3)})`;
        ctx.lineWidth = isGlinting ? 1.4 : 0.9;
        ctx.stroke();

        if (s.scale > 11 && s.points.length >= 3) {
          ctx.beginPath();
          ctx.moveTo(s.points[0][0], s.points[0][1]);
          ctx.lineTo(s.points[2][0], s.points[2][1]);
          ctx.strokeStyle = `rgba(255, 255, 255, ${(s.alpha * 0.45).toFixed(3)})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      } else if (s.type === 'needle' && s.length && s.width) {
        const cosY = Math.cos(s.rotY);
        const scaleX = Math.abs(cosY) < 0.1 ? 0.1 : cosY;
        ctx.scale(scaleX, 1);

        const hL = s.length / 2;
        const hW = s.width / 2;

        ctx.beginPath();
        ctx.moveTo(0, -hL);
        ctx.lineTo(hW, 0);
        ctx.lineTo(0, hL);
        ctx.lineTo(-hW, 0);
        ctx.closePath();

        ctx.fillStyle = `rgba(255, 255, 255, ${(s.alpha * 0.9).toFixed(3)})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(186, 230, 253, ${(s.alpha * 0.75).toFixed(3)})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      } else {
        const dustAlpha = Math.min(
          1,
          s.alpha * (0.6 + 0.4 * Math.sin(s.glintPhase))
        );
        ctx.beginPath();
        ctx.arc(0, 0, s.scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${dustAlpha.toFixed(3)})`;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 4;
        ctx.fill();
      }

      ctx.restore();
    }

    if (activeCount > 0) {
      animId = requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, width, height);
      if (onComplete) onComplete();
    }
  };

  animId = requestAnimationFrame(render);

  return () => {
    if (animId) cancelAnimationFrame(animId);
    ctx.clearRect(0, 0, width, height);
  };
};
