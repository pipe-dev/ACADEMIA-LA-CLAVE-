import React, { useState, useEffect, useRef, useMemo } from 'react';
import { audioService } from '../utils/audioService';

interface Unit2CelebrationModalProps {
  isOpen: boolean;
  onContinue: () => void;
}

// Synthesizes a high-impact acoustic glass fracture and crystalline ringing sound
const playGlassShatterSound = () => {
  try {
    const ctx = audioService.getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    // 1. Initial Explosive Fracture Transient (Filtered High-Pass Noise Burst)
    const bufferSize = Math.floor(ctx.sampleRate * 0.16);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.03));
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const hpFilter = ctx.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.setValueAtTime(3200, now);
    hpFilter.frequency.exponentialRampToValueAtTime(1600, now + 0.14);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.75, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    noiseSource.connect(hpFilter);
    hpFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSource.start(now);

    // 2. High-Q Crystalline Shimmering Ringing Overtones (Micro-fragments chiming)
    const harmonicPings = [3600, 4920, 6400, 8150, 9800, 11600, 13200];
    harmonicPings.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';

      const jitter = (Math.random() - 0.5) * 180;
      osc.frequency.setValueAtTime(freq + jitter, now);
      osc.frequency.exponentialRampToValueAtTime((freq + jitter) * 0.85, now + 0.65);

      const delay = Math.random() * 0.035;
      const duration = 0.22 + Math.random() * 0.45;
      const initialVol = 0.045 + Math.random() * 0.05;

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.setValueAtTime(initialVol, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + duration + 0.05);
    });
  } catch (err) {
    console.warn("Glass shatter audio error:", err);
  }
};

// Synthesizes a high-resonance crystal wine glass acoustic chime (E7 / 2637 Hz)
const playCrystalChime = () => {
  try {
    const ctx = audioService.getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    // Fundamental crystal tone (E7 ~ 2637 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2637, now);
    osc1.frequency.exponentialRampToValueAtTime(2632, now + 1.8);
    gain1.gain.setValueAtTime(0.28, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    // Harmonic overtone (octave: 5274 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(5274, now);
    gain2.gain.setValueAtTime(0.08, now);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

    // High crystalline sparkle (7911 Hz)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(7911, now);
    gain3.gain.setValueAtTime(0.03, now);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    osc1.connect(gain1);
    osc2.connect(gain2);
    osc3.connect(gain3);
    gain1.connect(ctx.destination);
    gain2.connect(ctx.destination);
    gain3.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    osc1.stop(now + 1.8);
    osc2.stop(now + 0.9);
    osc3.stop(now + 0.4);
  } catch (err) {
    console.warn("Crystal chime audio error:", err);
  }
};

// Calculates the smooth, curved specular highlight path matching the original glass contour
// u = -1: exact left highlight; u = 0: center vertical line; u = +1: exact right highlight
const getGlarePath = (u: number) => {
  const x0 = 100 + 36 * u;
  const x1 = 100 + 40 * u;
  const x2 = 100 + 43 * u;
  const x3 = 100 + 24 * u;
  const x4 = 100 + 5 * u;
  return `M ${x0.toFixed(1)},40 C ${x1.toFixed(1)},80 ${x2.toFixed(1)},125 ${x3.toFixed(1)},155 C ${((x3 + x4) / 2).toFixed(1)},168 ${x4.toFixed(1)},175 ${x4.toFixed(1)},182`;
};

// Helper to convert detected frequency in Hz to musical note name (e.g. 440 -> La4)
const hzToNoteName = (hz: number): string => {
  if (hz <= 0) return '';
  const noteNamesEs = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
  const midi = Math.round(69 + 12 * Math.log2(hz / 440));
  const noteIdx = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${noteNamesEs[noteIdx]}${octave}`;
};

// Data model for 1,000 crystal glass shards & micro-fragments
interface Shard {
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

export const Unit2CelebrationModal: React.FC<Unit2CelebrationModalProps> = ({ isOpen, onContinue }) => {
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isShattered, setIsShattered] = useState(false);
  const [detectedPitch, setDetectedPitch] = useState<number | null>(null);
  const reqRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const lastVoiceTimeRef = useRef<number>(0);
  const consecutiveVoiceFramesRef = useRef<number>(0);
  const isActiveRef = useRef<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shardAnimRef = useRef<number | null>(null);

  // --- 2.5D Touch Interactivity (Surface rotation only, no parallax) ---
  const [isInteracting, setIsInteracting] = useState(false);
  const [surfaceAngle, setSurfaceAngle] = useState(0); // Continuous 360° cylindrical surface angle
  const [isJiggling, setIsJiggling] = useState(false);
  const [tapCount, setTapCount] = useState(0);

  // Physics refs
  const surfaceAngleRef = useRef(0);
  const surfaceVelRef = useRef(0); // Angular velocity of surface spin

  const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isDraggingRef = useRef(false);
  const jiggleTimeoutRef = useRef<NodeJS.Timeout>();

  // Unified 2.5D continuous perspective projection math
  // Smoothly swaps positions of white highlights and gray refractions across boca, base, body & stem
  const {
    frontWeight,
    backWeight,
    mouthFrontOpacity,
    mouthBackOpacity,
    mouthFrontWidth,
    mouthBackWidth,
    footFrontOpacity,
    footBackOpacity,
    footFrontWidth,
    footBackWidth,
    whitePath,
    grayPath,
    stemX,
  } = useMemo(() => {
    const rad = (surfaceAngle * Math.PI) / 180;
    const cosA = Math.cos(rad);
    // frontWeight: 1.0 at 0° (facing front), 0.0 at 180° (facing back)
    const fw = (1 + cosA) / 2;
    const bw = 1 - fw;

    // Mouth rim modulation (swaps white & gray between front arc and back arc)
    const mfOp = 0.22 + 0.63 * fw;
    const mbOp = 0.22 + 0.63 * bw;
    const mfW = 1.2 + 0.5 * fw;
    const mbW = 1.2 + 0.5 * bw;

    // Foot base modulation (swaps white & gray between front crescent and back crescent)
    const ffOp = 0.22 + 0.63 * fw;
    const fbOp = 0.22 + 0.63 * bw;
    const ffW = 1.2 + 0.6 * fw;
    const fbW = 1.2 + 0.6 * bw;

    // Body flank curves (swaps white glare and gray refraction between left and right)
    const uW = -cosA;
    const uG = cosA;

    return {
      frontWeight: fw,
      backWeight: bw,
      mouthFrontOpacity: mfOp,
      mouthBackOpacity: mbOp,
      mouthFrontWidth: mfW,
      mouthBackWidth: mbW,
      footFrontOpacity: ffOp,
      footBackOpacity: fbOp,
      footFrontWidth: ffW,
      footBackWidth: fbW,
      whitePath: getGlarePath(uW),
      grayPath: getGlarePath(uG),
      stemX: 100 + 2.0 * uG,
    };
  }, [surfaceAngle]);

  useEffect(() => {
    return () => {
      if (jiggleTimeoutRef.current) clearTimeout(jiggleTimeoutRef.current);
    };
  }, []);

  // Unified 60fps animation & physics loop (Handles idle continuous spin, fling momentum)
  useEffect(() => {
    if (!isOpen) return;

    let animId: number;

    const loop = () => {
      if (!isDraggingRef.current) {
        // Surface spin: momentum inertia vs ambient slow idle rotation (~18 deg/sec)
        if (Math.abs(surfaceVelRef.current) > 0.05) {
          surfaceAngleRef.current += surfaceVelRef.current;
          surfaceVelRef.current *= 0.94;
        } else {
          surfaceAngleRef.current += 0.30;
        }

        // Bounded angle in [0, 360)
        surfaceAngleRef.current = ((surfaceAngleRef.current % 360) + 360) % 360;

        if (isInteracting && Math.abs(surfaceVelRef.current) < 0.05) {
          setIsInteracting(false);
        }

        setSurfaceAngle(surfaceAngleRef.current);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, isInteracting]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    isDraggingRef.current = true;
    setIsInteracting(true);

    const now = performance.now();
    pointerStartRef.current = { x: e.clientX, y: e.clientY, time: now };
    lastPointerRef.current = { x: e.clientX, y: e.clientY, time: now };
    surfaceVelRef.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !lastPointerRef.current) return;

    const now = performance.now();
    const dt = Math.max(1, now - lastPointerRef.current.time);
    const dx = e.clientX - lastPointerRef.current.x;

    // Surface spin tracks horizontal drag smoothly (line swap mechanism)
    surfaceVelRef.current = (dx / dt) * 16;
    surfaceAngleRef.current = ((surfaceAngleRef.current + dx * 0.9) % 360 + 360) % 360;

    lastPointerRef.current = { x: e.clientX, y: e.clientY, time: now };
    setSurfaceAngle(surfaceAngleRef.current);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}

    const now = performance.now();
    const start = pointerStartRef.current;

    // Check tap: displacement < 20px and duration < 380ms
    if (start) {
      const dist = Math.hypot(e.clientX - start.x, e.clientY - start.y);
      const duration = now - start.time;
      if (dist < 20 && duration < 380) {
        playCrystalChime();
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(12); } catch (_) {}
        }
        setTapCount(c => c + 1);
        setIsJiggling(true);
        if (jiggleTimeoutRef.current) clearTimeout(jiggleTimeoutRef.current);
        jiggleTimeoutRef.current = setTimeout(() => setIsJiggling(false), 450);

        // Auto-activate microphone on first tap if not already active
        if (!isActiveRef.current) {
          handleStart();
        }

        // Tapping the glass adds structural tension (+10% per strike)
        setProgress(prev => {
          if (prev >= 100) return prev;
          const next = Math.min(100, prev + 10);
          if (next >= 100) {
            setIsShattered(true);
            audioService.stopMicrophone();
            playGlassShatterSound();
            audioService.play3StarFanfare();
          }
          return next;
        });
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      setProgress(0);
      setIsShattered(false);
      setIsActive(false);
      isActiveRef.current = false;
      consecutiveVoiceFramesRef.current = 0;
      setDetectedPitch(null);
      lastTimeRef.current = performance.now();
      lastVoiceTimeRef.current = performance.now();
      // Auto-start microphone since opening the modal is a direct user gesture
      handleStart();
    } else {
      audioService.stopMicrophone();
      isActiveRef.current = false;
      consecutiveVoiceFramesRef.current = 0;
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      audioService.stopMicrophone();
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, []);

  // --- 1,000 Crystal Shards Physics Simulation ("Mil Añicos") ---
  useEffect(() => {
    if (!isOpen || !isShattered) {
      if (shardAnimRef.current) {
        cancelAnimationFrame(shardAnimRef.current);
        shardAnimRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

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

      // 360-degree explosive dispersal
      const angle = Math.random() * Math.PI * 2;
      let speed: number;
      if (type === 'dust') {
        speed = 4 + Math.random() * 26;
      } else if (type === 'needle') {
        speed = 4 + Math.random() * 22;
      } else {
        const isLarge = i < 45;
        speed = isLarge ? (2 + Math.random() * 10) : (3.5 + Math.random() * 18);
      }

      // Explosive upward & outward burst
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

      // Crystal palette: Pure diamond white, Ice cyan, Glacial blue, Electric prism
      const colorRand = Math.random();
      let r = 224, g = 242, b = 254, baseAlpha = 0.45;
      if (colorRand < 0.35) {
        r = 255; g = 255; b = 255; baseAlpha = 0.55; // Diamond white
      } else if (colorRand < 0.7) {
        r = 186; g = 230; b = 253; baseAlpha = 0.42; // Ice cyan
      } else {
        r = 125; g = 211; b = 252; baseAlpha = 0.38; // Electric prism
      }

      // Lifespan: ~3.5 to 5.2 seconds
      const decay = 0.003 + Math.random() * 0.0035;

      if (type === 'polygon') {
        const isLarge = i < 45;
        const scale = isLarge 
          ? (13 + Math.random() * 14) 
          : (i < 200 ? 6.5 + Math.random() * 7 : 3 + Math.random() * 4);

        const numVertices = Math.random() < 0.7 ? 3 : 4;
        const points: [number, number][] = [];
        for (let v = 0; v < numVertices; v++) {
          const vAngle = (v / numVertices) * Math.PI * 2 + (Math.random() - 0.5) * 0.75;
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

    let shockwaveRadius = 0;
    let flashAlpha = 0.9;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Initial Shockwave Flash & Expanding Acoustic Wave
      if (flashAlpha > 0.01) {
        ctx.fillStyle = `rgba(224, 242, 254, ${(flashAlpha * 0.28).toFixed(3)})`;
        ctx.fillRect(0, 0, width, height);
        flashAlpha *= 0.87;
      }

      if (shockwaveRadius < Math.max(width, height) * 0.8) {
        shockwaveRadius += 20;
        const ringAlpha = Math.max(0, 1 - shockwaveRadius / (Math.max(width, height) * 0.75));
        if (ringAlpha > 0.01) {
          ctx.beginPath();
          ctx.arc(cx, cy, shockwaveRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${(ringAlpha * 0.65).toFixed(3)})`;
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
      }

      let activeCount = 0;

      // 2. Render all 1,000 shards with real 3D tumbling physics
      for (let i = 0; i < shards.length; i++) {
        const s = shards[i];
        if (s.alpha <= 0.005 || s.y > height + 80) continue;
        activeCount++;

        // Air drag
        const drag = s.type === 'dust' ? 0.965 : (s.type === 'needle' ? 0.978 : 0.984);
        s.vx *= drag;
        s.vy *= drag;

        // Gravity
        const gravity = s.type === 'dust' ? 0.26 : (s.type === 'needle' ? 0.46 : 0.52);
        s.vy += gravity;

        // Displace
        s.x += s.vx;
        s.y += s.vy;

        // 3D rotations
        s.rotZ += s.dRotZ;
        s.rotX += s.dRotX;
        s.rotY += s.dRotY;
        s.glintPhase += s.glintSpeed;

        // Gradual fade
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

          // Specular glint when facet aligns with camera/light
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

          // Internal refraction facet line on larger crystal fragments
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
          // Diamond micro-sparkle dust
          const dustAlpha = Math.min(1, s.alpha * (0.6 + 0.4 * Math.sin(s.glintPhase)));
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
        shardAnimRef.current = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    shardAnimRef.current = requestAnimationFrame(render);

    return () => {
      if (shardAnimRef.current) {
        cancelAnimationFrame(shardAnimRef.current);
        shardAnimRef.current = null;
      }
      ctx.clearRect(0, 0, width, height);
    };
  }, [isOpen, isShattered]);

  const handleStart = async () => {
    lastTimeRef.current = performance.now();
    lastVoiceTimeRef.current = performance.now();
    consecutiveVoiceFramesRef.current = 0;
    
    const success = await audioService.startMicrophone((pitchHz, vol) => {
      const now = performance.now();
      const dt = Math.min(100, now - lastTimeRef.current);
      lastTimeRef.current = now;

      // --- Human Vocal Filtering Pipeline ---
      // 1. Fundamental Pitch in Human Vocal Singing Range (75 Hz to 1400 Hz):
      //    Ambient room noise, fan hum, typing, and turbulent breathing have NO periodic pitch (pitchHz === -1).
      const hasVocalPitch = pitchHz >= 75 && pitchHz <= 1400;

      // 2. Volume threshold: must exceed the ambient room noise floor (vol >= 0.009).
      //    Ambient room silence is ~0.001 - 0.005. Human singing into device is ~0.012 - 0.25.
      const hasVocalVolume = vol >= 0.009;

      // 3. Candidate vocal frame: requires both musical harmonic pitch and voice volume.
      const isVocalCandidate = hasVocalPitch && hasVocalVolume;

      // 4. Temporal Debounce (Continuity Filter):
      //    Human singing sustains a vowel across consecutive frames.
      //    Transient noise spikes (coughs, desk taps, mouse clicks) last only 1 frame (~30ms).
      if (isVocalCandidate) {
        consecutiveVoiceFramesRef.current = Math.min(8, consecutiveVoiceFramesRef.current + 1);
      } else {
        consecutiveVoiceFramesRef.current = Math.max(0, consecutiveVoiceFramesRef.current - 1);
      }

      // Voice is confirmed when sustained for at least 2 consecutive frames (~60ms)
      const isVoiceDetected = consecutiveVoiceFramesRef.current >= 2;

      if (isVoiceDetected && hasVocalPitch) {
        lastVoiceTimeRef.current = now;
        setDetectedPitch(Math.round(pitchHz));
      } else if (now - lastVoiceTimeRef.current > 600) {
        setDetectedPitch(null);
      }

      setProgress(prev => {
        if (prev >= 100) return prev; // Stop processing if shattered

        let newProg = prev;
        if (isVoiceDetected) {
          // Acoustic resonance physics:
          // Higher frequencies (> 350 Hz) create stronger sympathetic resonance in crystal glass!
          const pitchBonus = pitchHz > 350 ? 1.3 : 1.0;
          const loudnessBonus = vol > 0.025 ? 1.3 : 1.0;
          // Fills in ~2.2s of solid singing
          newProg += (dt / 2200) * 100 * pitchBonus * loudnessBonus;
        }
        // Progress holds steady when pausing to breathe (no frustrating drain)

        newProg = Math.max(0, Math.min(100, newProg));

        if (newProg >= 100) {
          setIsShattered(true);
          audioService.stopMicrophone();
          playGlassShatterSound();
          audioService.play3StarFanfare();
        }
        return newProg;
      });
    });

    if (success) {
      setIsActive(true);
      isActiveRef.current = true;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0b1828] overflow-hidden select-none">
      {/* Technical Grid Background from AfinadorView */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1b2b3f_1px,transparent_1px),linear-gradient(to_bottom,#1b2b3f_1px,transparent_1px)] bg-[size:24px_24px] bg-center opacity-60 pointer-events-none" />

      {/* Subtle Central Glow Behind Glass */}
      <div className="absolute w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none -translate-y-6" />

      {/* 1,000 Crystal Glass Shards Simulation Canvas (Mil Añicos) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-30"
      />

      {!isShattered ? (
        <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6">
          <h2 className="text-white font-heading font-black text-2xl sm:text-3xl mb-4 text-center drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] leading-tight tracking-wide">
            Rompe la copa con tu nota más aguda
          </h2>
          
          {/* Progress / Tension Bar */}
          <div className="w-full h-4 bg-slate-900/90 border border-cyan-500/30 rounded-full overflow-hidden mb-6 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8),_0_0_15px_rgba(6,182,212,0.2)] p-0.5 relative">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 via-sky-300 to-white rounded-full transition-all duration-75 shadow-[0_0_15px_rgba(34,211,238,0.9)]"
              style={{ width: `${Math.max(progress > 0 ? 3 : 0, progress)}%` }}
            />
          </div>

          {/* Crystal Wine Glass Container with Progressive Cracking & Direct Touch Interaction */}
          <div 
            className={`relative flex flex-col items-center select-none my-1 cursor-grab active:cursor-grabbing touch-none ${progress > 60 ? 'animate-shake' : ''}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* Vibrating Tremor Wrapper - key={tapCount} forces animation restart on EVERY consecutive tap */}
            <div 
              key={tapCount}
              className={`w-full flex items-center justify-center ${isJiggling ? 'animate-crystal-ping' : ''}`}
              style={{ transformOrigin: '50% 90%' }}
            >
              <svg
                viewBox="0 0 200 310"
                className="w-[260px] h-[403px] sm:w-[285px] sm:h-[442px] overflow-visible filter drop-shadow-[0_25px_50px_rgba(0,0,0,0.9)]"
              >
              <defs>
                {/* Floor Drop Shadow Blur */}
                <filter id="floorShadowBlur" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="6" />
                </filter>
                
                {/* Soft Glass Caustic Filters */}
                <filter id="subtleBlur" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="0.7" />
                </filter>
                <filter id="silkyRefraction" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="1.4" />
                </filter>
                <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="2.0" />
                </filter>
                <filter id="diffuseGlow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="3.8" />
                </filter>

                {/* Interior Clip Path for Background Refraction / Optical Distortion */}
                <clipPath id="bowlInteriorClip">
                  <path
                    d="M 58,32 
                       C 54,80 50,135 74,168 
                       C 86,183 95,188 97,192 
                       L 103,192 
                       C 105,188 114,183 126,168 
                       C 150,135 146,80 142,32 
                       A 42 8.5 0 0 1 58 32 Z"
                  />
                </clipPath>

                {/* Soft Volumetric Glass Body Gradient */}
                <linearGradient id="glassBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.30" />
                  <stop offset="18%" stopColor="#cffafe" stopOpacity="0.10" />
                  <stop offset="48%" stopColor="#ffffff" stopOpacity="0.03" />
                  <stop offset="72%" stopColor="#0891b2" stopOpacity="0.08" />
                  <stop offset="92%" stopColor="#38bdf8" stopOpacity="0.14" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.22" />
                </linearGradient>

                {/* Seamless Crystal Meniscus Gradient (No harsh lines) */}
                <linearGradient id="solidCrystalCore" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.0" />
                  <stop offset="35%" stopColor="#38bdf8" stopOpacity="0.12" />
                  <stop offset="70%" stopColor="#0284c7" stopOpacity="0.20" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.32" />
                </linearGradient>

                {/* Soft Primary Left Studio Glare (Feathered edges) */}
                <linearGradient id="primaryLeftGlare" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                  <stop offset="25%" stopColor="#e0f2fe" stopOpacity="0.70" />
                  <stop offset="65%" stopColor="#bae6fd" stopOpacity="0.30" />
                  <stop offset="90%" stopColor="#ffffff" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>

                {/* Soft Diffuse Ambient Glare */}
                <linearGradient id="softAmbientGlare" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
                  <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>

                {/* Right Edge Soft Rim Refraction */}
                <linearGradient id="rightEdgeGlare" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
                  <stop offset="35%" stopColor="#38bdf8" stopOpacity="0.25" />
                  <stop offset="80%" stopColor="#ffffff" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                </linearGradient>

                {/* Soft 3D Cylindrical Stem Shader */}
                <linearGradient id="stemShader" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#082f49" stopOpacity="0.35" />
                  <stop offset="25%" stopColor="#ffffff" stopOpacity="0.70" />
                  <stop offset="50%" stopColor="#bae6fd" stopOpacity="0.35" />
                  <stop offset="78%" stopColor="#0369a1" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#082f49" stopOpacity="0.45" />
                </linearGradient>

                {/* Soft Beveled Base Radial Gradient */}
                <radialGradient id="baseBevelGrad" cx="50%" cy="30%" r="65%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
                  <stop offset="40%" stopColor="#0284c7" stopOpacity="0.16" />
                  <stop offset="75%" stopColor="#0b172a" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.75" />
                </radialGradient>

                {/* Crack Glow Filter */}
                <filter id="crackGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* 1. Floor Ambient Occlusion Shadow */}
              <g>
                <ellipse
                  cx="100"
                  cy="282"
                  rx="65"
                  ry="13"
                  fill="#000000"
                  opacity="0.8"
                  filter="url(#floorShadowBlur)"
                />
                <ellipse
                  cx="100"
                  cy="280"
                  rx="44"
                  ry="8"
                  fill="#022a30"
                  opacity="0.55"
                  filter="url(#floorShadowBlur)"
                />
              </g>

              {/* CRYSTAL GLASS VESSEL */}
              <g>
                {/* 2. OPTICAL BACKGROUND REFRACTION */}
                <g clipPath="url(#bowlInteriorClip)">
                  {/* Dense background occlusion */}
                  <rect x="40" y="20" width="120" height="180" fill="#0b1828" opacity="0.94" />
                  {/* Soft crystal cavity depth */}
                  <rect x="40" y="20" width="120" height="180" fill="url(#glassBodyGrad)" opacity="0.40" />

                  {/* Refracted Background Grid */}
                  <g className="animate-refraction-angle-shift" filter="url(#silkyRefraction)">
                    {/* Verticals bent by cylindrical crystal volume (Matching #1b2b3f background grid) */}
                    <g stroke="#1b2b3f" strokeWidth="1" opacity="0.80">
                      <path d="M 52,60 C 48,95 54,135 72,165" fill="none" />
                      <path d="M 76,32 C 66,75 64,125 84,175" fill="none" />
                      <path d="M 100,32 L 100,185" fill="none" strokeWidth="1.1" />
                      <path d="M 124,32 C 134,75 136,125 116,175" fill="none" />
                      <path d="M 148,60 C 152,95 146,135 128,165" fill="none" />
                    </g>
                    {/* Subtle crystal dispersion / chromatic sheen on refracted verticals */}
                    <g stroke="rgba(56, 189, 248, 0.22)" strokeWidth="0.8" opacity="0.55">
                      <path d="M 76,32 C 66,75 64,125 84,175" fill="none" />
                      <path d="M 124,32 C 134,75 136,125 116,175" fill="none" />
                    </g>

                    {/* Horizontals bowed downward by spherical lens curvature (Connecting to background grid lines at edges) */}
                    <g stroke="#1b2b3f" strokeWidth="1" opacity="0.80">
                      <path d="M 57,56 Q 100,66 143,56" fill="none" />
                      <path d="M 53,80 Q 100,94 147,80" fill="none" />
                      <path d="M 53,104 Q 100,122 147,104" fill="none" strokeWidth="1.1" />
                      <path d="M 56,128 Q 100,148 144,128" fill="none" />
                      <path d="M 65,152 Q 100,170 135,152" fill="none" />
                    </g>
                    {/* Subtle crystal dispersion edge on refracted horizontals */}
                    <g stroke="rgba(56, 189, 248, 0.20)" strokeWidth="0.8" opacity="0.55">
                      <path d="M 53,80 Q 100,94 147,80" fill="none" />
                      <path d="M 53,104 Q 100,122 147,104" fill="none" />
                      <path d="M 56,128 Q 100,148 144,128" fill="none" />
                    </g>
                  </g>
                </g>

                {/* 3. Solid Crystal Meniscus (Seamlessly blended, zero harsh outlines) */}
                <path
                  d="M 74,152 
                     C 85,168 93,178 97,192 
                     L 103,192 
                     C 107,178 115,168 126,152 
                     C 114,160 105,163 100,163 
                     C 95,163 86,160 74,152 Z"
                  fill="url(#solidCrystalCore)"
                  stroke="none"
                  filter="url(#subtleBlur)"
                />

                {/* 4. Internal Resonance Liquid / Sound Aura */}
                <g clipPath="url(#bowlInteriorClip)">
                  <path
                    d="M 62,95 C 60,135 75,165 97,184 L 103,184 C 125,165 140,135 138,95 C 125,100 110,102 100,102 C 90,102 75,100 62,95 Z"
                    fill="url(#glassBodyGrad)"
                    className="transition-all duration-150"
                    filter="url(#subtleBlur)"
                    style={{
                      opacity: Math.min(0.80, 0.10 + (progress / 100) * 0.70),
                      transform: `scale(${1 + (progress / 100) * 0.04})`,
                      transformOrigin: '100px 184px'
                    }}
                  />
                </g>

                {/* 5. Main Crystal Bowl Outer Volume */}
                <path
                  d="M 58,32 
                     C 54,80 50,135 74,168 
                     C 86,183 95,188 97,192 
                     L 103,192 
                     C 105,188 114,183 126,168 
                     C 150,135 146,80 142,32 
                     A 42 8.5 0 0 1 58 32 Z"
                  fill="url(#glassBodyGrad)"
                />

                {/* 6. Soft Refractive Edge Glow (Replaces harsh wireframe lines) */}
                <path
                  d="M 58,32 
                     C 54,80 50,135 74,168 
                     C 86,183 95,188 97,192 
                     L 103,192 
                     C 105,188 114,183 126,168 
                     C 150,135 146,80 142,32"
                  fill="none"
                  stroke="rgba(255,255,255,0.22)"
                  strokeWidth="1.2"
                  filter="url(#subtleBlur)"
                />

                {/* 7 & 8. Top Rim (La Boca) - Smooth 3D Swapping of White & Gray Arcs */}
                {/* Subtle base ellipse */}
                <ellipse
                  cx="100"
                  cy="32"
                  rx="42"
                  ry="8.5"
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="1"
                />

                {/* Back Arc (Atrás): Starts gray at 0°, becomes white at 180° */}
                <path
                  d="M 58,32 A 42 8.5 0 0 1 142 32"
                  fill="none"
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  filter="url(#softGlow)"
                  opacity={backWeight}
                />
                <path
                  d="M 58,32 A 42 8.5 0 0 1 142 32"
                  fill="none"
                  stroke={`rgba(255,255,255,${mouthBackOpacity.toFixed(2)})`}
                  strokeWidth={mouthBackWidth.toFixed(2)}
                  strokeLinecap="round"
                  filter={backWeight < 0.3 ? "url(#subtleBlur)" : undefined}
                />

                {/* Front Arc (Adelante): Starts white at 0°, becomes gray at 180° */}
                <path
                  d="M 58,32 A 42 8.5 0 0 0 142 32"
                  fill="none"
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  filter="url(#softGlow)"
                  opacity={frontWeight}
                />
                <path
                  d="M 58,32 A 42 8.5 0 0 0 142 32"
                  fill="none"
                  stroke={`rgba(255,255,255,${mouthFrontOpacity.toFixed(2)})`}
                  strokeWidth={mouthFrontWidth.toFixed(2)}
                  strokeLinecap="round"
                  filter={frontWeight < 0.3 ? "url(#subtleBlur)" : undefined}
                />

                {/* 9. Dynamic Specular Caustic Glare (Clipped inside bowl) */}
                <g clipPath="url(#bowlInteriorClip)">
                  {/* Wide ambient bloom */}
                  <path
                    d={whitePath}
                    fill="none"
                    stroke="url(#softAmbientGlare)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    opacity={0.40}
                    filter="url(#diffuseGlow)"
                  />
                  {/* Mid-feathered glare strip */}
                  <path
                    d={whitePath}
                    fill="none"
                    stroke="url(#primaryLeftGlare)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    opacity={0.80}
                    filter="url(#subtleBlur)"
                  />
                  {/* Soft core highlight */}
                  <path
                    d={whitePath}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    opacity={0.75}
                  />
                </g>

                {/* 10. Opposite Side Soft Rim Ambient Refraction (Clipped inside bowl) */}
                <g clipPath="url(#bowlInteriorClip)">
                  <path
                    d={grayPath}
                    fill="none"
                    stroke="url(#rightEdgeGlare)"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    filter="url(#subtleBlur)"
                    opacity={0.85}
                  />
                </g>

                {/* 11. Fluted Crystal Stem with Smooth Parabolic Blend */}
                <path
                  d="M 94,188 
                     C 96,192 97,196 97,202 
                     L 97,252 
                     C 97,258 92,264 84,270 
                     L 116,270 
                     C 108,264 103,258 103,252 
                     L 103,202 
                     C 103,196 104,192 106,188 
                     Z"
                  fill="url(#stemShader)"
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth="0.8"
                />
                {/* Stem Center Soft Specular Highlight (Glides dynamically with cylindrical rotation) */}
                <line
                  x1={stemX.toFixed(1)}
                  y1="192"
                  x2={stemX.toFixed(1)}
                  y2="260"
                  stroke="rgba(255,255,255,0.75)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  filter="url(#subtleBlur)"
                />

                {/* 12. Soft Beveled Crystal Foot Base - Smooth 3D Swapping of White & Gray Crescent Arcs */}
                {/* Foot Disc Volume */}
                <ellipse
                  cx="100"
                  cy="274"
                  rx="48"
                  ry="10.5"
                  fill="url(#baseBevelGrad)"
                  stroke="rgba(255,255,255,0.20)"
                  strokeWidth="1.0"
                />
                {/* Foot Inner Bevel Refraction */}
                <ellipse
                  cx="100"
                  cy="271"
                  rx="38"
                  ry="7.5"
                  fill="none"
                  stroke="rgba(255,255,255,0.22)"
                  strokeWidth="1"
                  filter="url(#subtleBlur)"
                />

                {/* Foot Back Arc: Starts gray at 0°, becomes white at 180° */}
                <path
                  d="M 57,274 A 47 10.3 0 0 1 143 274"
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  filter="url(#softGlow)"
                  opacity={backWeight}
                />
                <path
                  d="M 57,274 A 47 10.3 0 0 1 143 274"
                  fill="none"
                  stroke={`rgba(255,255,255,${footBackOpacity.toFixed(2)})`}
                  strokeWidth={footBackWidth.toFixed(2)}
                  strokeLinecap="round"
                />

                {/* Foot Front Arc: Starts white at 0°, becomes gray at 180° */}
                <path
                  d="M 56,275 A 48 10.5 0 0 0 144 275"
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  filter="url(#softGlow)"
                  opacity={frontWeight}
                />
                <path
                  d="M 57,275 A 47 10.3 0 0 0 143 275"
                  fill="none"
                  stroke={`rgba(255,255,255,${footFrontOpacity.toFixed(2)})`}
                  strokeWidth={footFrontWidth.toFixed(2)}
                  strokeLinecap="round"
                />

                {/* 13 & 14. INTERNAL ACOUSTIC RESONANCE WAVES & PROGRESSIVE FRACTURE CRACKS (Strictly contained inside bowl) */}
                <g clipPath="url(#bowlInteriorClip)">
                  {/* Internal Sound Resonance Waves */}
                  {isActive && (
                    <>
                      <ellipse
                        cx="100"
                        cy="32"
                        rx={38 + (progress % 10)}
                        ry={7.5 + (progress % 2.5)}
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth="1.6"
                        className="opacity-60 animate-ping pointer-events-none"
                        style={{ animationDuration: '1.1s' }}
                      />
                      <circle
                        cx="100"
                        cy="120"
                        r={12 + progress * 0.35}
                        fill="none"
                        stroke="#7dd3fc"
                        strokeWidth="1.2"
                        className="opacity-40 animate-pulse pointer-events-none"
                      />
                    </>
                  )}

                  {/* Phase 1: Hairline Fractures (> 30% progress) */}
                  {progress >= 30 && (
                    <g filter="url(#crackGlow)" className="animate-fadeIn">
                      <path
                        d="M 100,105 L 95,118 L 103,132 L 97,146 M 95,118 L 84,124 L 76,134"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M 100,105 L 95,118 L 103,132 L 97,146 M 95,118 L 84,124 L 76,134"
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  )}

                  {/* Phase 2: Spreading Spiderweb Cracks (> 60% progress) */}
                  {progress >= 60 && (
                    <g filter="url(#crackGlow)" className="animate-fadeIn">
                      <path
                        d="M 103,132 L 115,138 L 124,130 L 132,142 M 115,138 L 112,154 L 104,166"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M 103,132 L 115,138 L 124,130 L 132,142 M 115,138 L 112,154 L 104,166"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M 95,82 L 100,105 L 108,90 L 116,74"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </g>
                  )}

                  {/* Phase 3: Critical Structural Failure Fractures (> 85% progress) */}
                  {progress >= 85 && (
                    <g filter="url(#crackGlow)">
                      <path
                        d="M 76,134 L 70,146 L 76,158 M 100,42 L 96,62 L 86,76 M 134,44 L 128,66 L 122,78 L 128,98"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M 76,134 L 70,146 L 76,158 M 100,42 L 96,62 L 86,76 M 134,44 L 128,66 L 122,78 L 128,98"
                        fill="none"
                        stroke="#e0f2fe"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Glowing core sparks */}
                      <circle cx="103" cy="132" r="3.5" fill="#ffffff" className="animate-ping" />
                      <circle cx="95" cy="118" r="3" fill="#38bdf8" />
                    </g>
                  )}
                </g>
              </g>
            </svg>
            </div>
          </div>

          {!isActive ? (
            <div className="mt-6 sm:mt-8 flex flex-col items-center gap-2">
              <button 
                onClick={handleStart} 
                className="px-8 py-3.5 sm:py-4 rounded-full font-heading font-black text-base uppercase tracking-wider text-white bg-[#00b4d8] hover:bg-[#0096c7] shadow-[0_5px_0_0_#0077b6] active:translate-y-1 active:shadow-[0_1px_0_0_#0077b6] transition-all cursor-pointer flex items-center gap-2"
              >
                <span>🎤 Activar Micrófono</span>
              </button>
              <span className="text-slate-400 text-xs font-medium text-center">
                (O dale toques a la copa con el dedo para romperla)
              </span>
            </div>
          ) : (
            <div className="mt-6 sm:mt-8 flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                </span>
                <span className="text-cyan-300 font-bold text-sm tracking-wide">
                  {detectedPitch 
                    ? `¡Voz captada: ${hzToNoteName(detectedPitch)} (${detectedPitch} Hz)! Rompiendo...` 
                    : '¡Canta ahora con tu voz más aguda!'}
                </span>
              </div>
              <span className="text-slate-300 text-xs font-semibold tracking-wide">
                {progress > 0 ? `Tensión Acústica: ${Math.round(progress)}%` : 'Esperando tu voz o toques con el dedo...'}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="relative z-40 flex flex-col items-center justify-center animate-fade-in px-4">
          <div className="relative z-50 flex flex-col items-center justify-center w-full max-w-sm">
            <div className="w-full p-1 sm:p-[5px] rounded-full bg-[#0f172a] shadow-[inset_0_4px_6px_-2px_rgba(0,0,0,0.7)] border border-slate-800">
              <div className="w-full p-1.5 flex flex-col items-center justify-center rounded-full bg-[#090d16] shadow-[inset_0_16px_20px_-4px_rgba(0,0,0,0.8),_inset_0_-2px_4px_rgba(255,255,255,0.05)] border border-slate-900">
                <button
                  onClick={onContinue}
                  className="w-full flex items-center justify-center px-6 py-4 rounded-full transition-all duration-75 relative border border-transparent btn-3d bg-[#4648d4] text-white shadow-[0px_4px_0px_0px_rgba(30,30,120,1)] hover:brightness-110 active:translate-y-[2px] active:shadow-[0px_2px_0px_0px_rgba(30,30,120,1)] group cursor-pointer"
                >
                  <div className="flex flex-col items-center text-center gap-0.5">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-indigo-200 drop-shadow-sm leading-tight">
                      UNIDAD 3
                    </span>
                    <span className="text-base sm:text-lg font-black text-white drop-shadow-md leading-tight">
                      CONTINUAR A LA UNIDAD 3
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
