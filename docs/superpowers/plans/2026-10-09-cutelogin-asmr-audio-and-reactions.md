# Plan de Implementación: Motor de Audio ASMR Procedural y Micro-Animaciones para CuteLogin Blobs

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar un motor de audio ASMR procedural con Web Audio API moderna y micro-animaciones orgánicas (parpadeo autónomo y reacciones contextuales del formulario) para los cuatro blobs en `/sandbox/cutelogin`.

**Architecture:** Módulo desacoplado `useJellyAsmrAudio.ts` que sintetiza efectos visco-táctiles y gotas líquidas con `AudioContext` lazily initialized. Integración reactiva en `CuteCharactersStatic.tsx` mediante temporizadores de parpadeo biológico y eventos contextuales del formulario (`page.tsx`) acelerados por CSS GPU sin re-renders en ráfaga.

**Tech Stack:** Next.js 15, React 19, TypeScript, Web Audio API, Tailwind CSS, CSS Modules.

## Global Constraints
- Cero archivos de audio externos (todo sintetizado proceduralmente en tiempo real).
- Cero emojis en código, commits y mensajes.
- Mantener estrictamente intacta la coordenada base de Amarillo (`left: 440`) y su inclinación máxima (`-11.5deg`, `4.8deg`, `18px`).
- Mantener la retirada progresiva calibrada a 5 caracteres (`retreatRatio = Math.max(0, 1 - passwordLength / 5)`).
- Cada tarea debe verificarse con `npm run typecheck` antes de confirmarse.

---

### Task 1: Motor de Audio ASMR Procedural (`useJellyAsmrAudio.ts`)

**Files:**
- Create: `src/utils/useJellyAsmrAudio.ts`

**Interfaces:**
- Produces:
  ```typescript
  export type CharacterId = 'morado' | 'fucsia' | 'amarillo' | 'naranja';

  export interface UseJellyAsmrAudioReturn {
    playSquish: (character: CharacterId, intensity?: number, stretch?: number) => void;
    playDroplet: (character: CharacterId, pitchMultiplier?: number) => void;
    playWinkPop: () => void;
    playValidationChime: () => void;
  }
  ```

- [ ] **Step 1: Crear `src/utils/useJellyAsmrAudio.ts` con síntesis Web Audio API**

```typescript
'use client';

import {useCallback, useRef} from 'react';

export type CharacterId = 'morado' | 'fucsia' | 'amarillo' | 'naranja';

const CHARACTER_PROFILES: Record<
  CharacterId,
  {baseFreq: number; filterQ: number; decay: number}
> = {
  morado: {baseFreq: 180, filterQ: 4.5, decay: 0.16},
  fucsia: {baseFreq: 520, filterQ: 3.2, decay: 0.12},
  amarillo: {baseFreq: 400, filterQ: 3.8, decay: 0.14},
  naranja: {baseFreq: 220, filterQ: 4.0, decay: 0.15},
};

export function useJellyAsmrAudio() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as {webkitAudioContext: typeof AudioContext})
          .webkitAudioContext;
      if (!AudioCtx) return null;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  const playSquish = useCallback(
    (character: CharacterId, intensity = 1, stretch = 0) => {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const profile = CHARACTER_PROFILES[character];
        const clampedIntensity = Math.max(0.2, Math.min(intensity, 2.5));
        const stretchBonus = Math.max(-0.4, Math.min(stretch, 1.2));

        // 1. Oscilador principal en barrido descendente
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'triangle';

        const startFreq = profile.baseFreq * (1 + stretchBonus * 0.4);
        const endFreq = Math.max(60, startFreq * 0.45);
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(
          endFreq,
          now + profile.decay * 0.9
        );

        // 2. Filtro paso-bajo resonante simulando viscosidad
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.setValueAtTime(profile.filterQ, now);
        filter.frequency.setValueAtTime(1400 * clampedIntensity, now);
        filter.frequency.exponentialRampToValueAtTime(
          200,
          now + profile.decay
        );

        // 3. Envolvente de volumen orgánico
        const peakGain = 0.18 * Math.min(clampedIntensity, 1.5);
        oscGain.gain.setValueAtTime(0.001, now);
        oscGain.gain.linearRampToValueAtTime(peakGain, now + 0.02);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + profile.decay);

        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + profile.decay + 0.05);

        setTimeout(() => {
          try {
            osc.disconnect();
            filter.disconnect();
            oscGain.disconnect();
          } catch {}
        }, (profile.decay + 0.1) * 1000);
      } catch {}
    },
    [getAudioContext]
  );

  const playDroplet = useCallback(
    (character: CharacterId, pitchMultiplier = 1) => {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const profile = CHARACTER_PROFILES[character];
        const dur = 0.07;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';

        const startF = profile.baseFreq * 2.2 * pitchMultiplier;
        const endF = Math.max(90, startF * 0.28);
        osc.frequency.setValueAtTime(startF, now);
        osc.frequency.exponentialRampToValueAtTime(endF, now + dur);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.14, now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + dur + 0.02);

        setTimeout(() => {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch {}
        }, (dur + 0.05) * 1000);
      } catch {}
    },
    [getAudioContext]
  );

  const playWinkPop = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.05);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {}
  }, [getAudioContext]);

  const playValidationChime = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const chords = [523.25, 659.25, 783.99]; // Acorde mayor C5 - E5 - G5 líquido
      chords.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const delay = idx * 0.04;
        const dur = 0.18;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * 0.9, now + delay);
        osc.frequency.exponentialRampToValueAtTime(freq, now + delay + 0.03);

        gain.gain.setValueAtTime(0.0001, now + delay);
        gain.gain.linearRampToValueAtTime(0.07, now + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + dur + 0.02);
      });
    } catch {}
  }, [getAudioContext]);

  return {
    playSquish,
    playDroplet,
    playWinkPop,
    playValidationChime,
  };
}
```

- [ ] **Step 2: Verificar tipado de TypeScript**

Run: `npm run typecheck`
Expected: código de salida 0 sin errores.

- [ ] **Step 3: Commit de Task 1**

```bash
git add src/utils/useJellyAsmrAudio.ts
git commit -m "feat(audio): add procedural ASMR Web Audio API hook for tactile blobs"
```

---

### Task 2: Keyframes CSS para Parpadeo Biológico y Guiño

**Files:**
- Modify: `src/components/sandbox/CuteCharacterMorado.module.css`
- Modify: `src/components/sandbox/CuteCharacterFucsia.module.css`
- Modify: `src/components/sandbox/CuteCharacterAmarillo.module.css`
- Modify: `src/components/sandbox/CuteCharacterNaranja.module.css`

- [ ] **Step 1: Añadir clases `.blink` a `CuteCharacterMorado.module.css`**

Añadir al final del archivo:
```css
/* Parpadeo biológico autónomo */
.eye.blink {
  animation: eyeBlink 130ms cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes eyeBlink {
  0%, 100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(0.08);
  }
}
```

- [ ] **Step 2: Añadir clases `.blink` a `CuteCharacterFucsia.module.css`**

Añadir al final del archivo:
```css
/* Parpadeo biológico autónomo */
.eye.blink {
  animation: eyeBlink 130ms cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes eyeBlink {
  0%, 100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(0.08);
  }
}
```

- [ ] **Step 3: Añadir clases `.blink` y `.wink-left` a `CuteCharacterAmarillo.module.css`**

Añadir al final del archivo:
```css
/* Parpadeo biológico autónomo */
.eye-left.blink,
.eye-right.blink {
  animation: eyeBlink 130ms cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes eyeBlink {
  0%, 100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(0.08);
  }
}

/* Guiño cómplice al alternar checkbox Recordarme */
.eye-left.wink {
  animation: eyeWink 260ms cubic-bezier(0.25, 1, 0.5, 1);
}

@keyframes eyeWink {
  0%, 100% {
    transform: scaleY(1);
  }
  40%, 65% {
    transform: scaleY(0.06);
  }
}
```

- [ ] **Step 4: Añadir clases `.blink` a `CuteCharacterNaranja.module.css`**

Añadir al final del archivo:
```css
/* Parpadeo biológico autónomo */
.eye.blink {
  animation: eyeBlink 130ms cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes eyeBlink {
  0%, 100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(0.08);
  }
}
```

- [ ] **Step 5: Verificar componentes de personajes para recibir prop `blink` y `wink`**

En los archivos de personajes correspondientes (`CharacterMorado.tsx`, `CharacterFucsia.tsx`, `CharacterAmarillo.tsx`, `CharacterNaranja.tsx`), permitir pasar `blink?: boolean` (y en Amarillo `wink?: boolean`) para anexar la clase CSS al ojo.

- [ ] **Step 6: Verificar tipado de TypeScript**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 7: Commit de Task 2**

```bash
git add src/components/sandbox/CuteCharacter*.module.css src/components/sandbox/characters/
git commit -m "style(cutelogin): add CSS blink and wink keyframes for lifelike idle behaviors"
```

---

### Task 3: Integración de Ciclos de Parpadeo y Sonidos ASMR en `CuteCharactersStatic.tsx`

**Files:**
- Modify: `src/components/sandbox/CuteCharactersStatic.tsx`

- [ ] **Step 1: Extender `CuteCharactersStaticProps` con props contextuales**

```typescript
export interface CuteCharactersStaticProps {
  className?: string;
  excited?: boolean;
  shy?: boolean;
  reveal?: boolean;
  error?: boolean;
  typing?: boolean;
  typingProgress?: number;
  animateFucsia?: boolean;
  fucsiaRef?: React.Ref<CuteCharacterFucsiaAnimatedRef>;
  passwordLength?: number;
  emailValid?: boolean;
  submitHovered?: boolean;
  rememberChecked?: boolean;
}
```

- [ ] **Step 2: Implementar temporizadores de parpadeo asíncrono y gestor de sonidos**

En `CuteCharactersStatic.tsx`:
- Importar `useJellyAsmrAudio`.
- Inicializar `const {playSquish, playDroplet, playWinkPop, playValidationChime} = useJellyAsmrAudio();`.
- Añadir estados booleanos de parpadeo independientes (`blinkMorado`, `blinkFucsia`, `blinkAmarillo`, `blinkNaranja`) y `winkAmarillo`.
- Crear `useEffect` con temporizadores estocásticos de 3.5s - 6.5s por personaje que activan el blink por 140 ms, suspendidos cuando `effShy === 1`.
- Conectar `playValidationChime()` cuando `emailValid` pasa de false a true.
- Conectar `playWinkPop()` y activar `winkAmarillo` cuando `rememberChecked` cambia de valor.
- Vincular `handleRippleTrigger` con `playDroplet`.
- Vincular `onTouchPress` con `playSquish`.

- [ ] **Step 3: Verificar tipado de TypeScript**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit de Task 3**

```bash
git add src/components/sandbox/CuteCharactersStatic.tsx
git commit -m "feat(cutelogin): integrate ASMR audio triggers, organic blinking, and contextual reactions in CuteCharactersStatic"
```

---

### Task 4: Conexión del Formulario en `src/app/sandbox/cutelogin/page.tsx`

**Files:**
- Modify: `src/app/sandbox/cutelogin/page.tsx`

- [ ] **Step 1: Calcular `emailValid` y estado de hover en botón**

En `src/app/sandbox/cutelogin/page.tsx`:
- Crear estado `const [submitHovered, setSubmitHovered] = useState(false);`.
- Computar `const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);`.
- Pasar a `<CuteCharactersStatic>`:
  ```tsx
  <CuteCharactersStatic
    excited={emailFocused}
    shy={isPasswordActive}
    reveal={showPassword}
    passwordLength={password.length}
    emailValid={isEmailValid}
    submitHovered={submitHovered}
    rememberChecked={rememberMe}
    error={wrong}
    typing={emailFocused && email.length > 0}
    typingProgress={Math.min(email.length / 7, 1)}
    className="w-full max-w-[560px]"
  />
  ```
- En el botón de login, añadir `onMouseEnter={() => setSubmitHovered(true)}`, `onMouseLeave={() => setSubmitHovered(false)}`, `onFocus={() => setSubmitHovered(true)}`, `onBlur={() => setSubmitHovered(false)}`.

- [ ] **Step 2: Verificar tipado de TypeScript**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit de Task 4**

```bash
git add src/app/sandbox/cutelogin/page.tsx
git commit -m "feat(cutelogin): bind form validation, submit hover, and remember me toggle to blob reactions"
```

---

### Task 5: Verificación Funcional Integral

- [ ] **Step 1: Ejecutar verificación de tipos completa**

Run: `npm run typecheck`
Expected: código de salida 0.

- [ ] **Step 2: Validar en navegador en vivo**

Run: `powershell -Command "Invoke-WebRequest -Uri 'http://localhost:9002/sandbox/cutelogin' -UseBasicParsing | Select-Object -ExpandProperty StatusCode"`
Expected: 200.

- [ ] **Step 3: Checklist manual de verificación**
1. Al tocar y arrastrar a Morado, Fucsia, Amarillo o Naranja, se escucha sonido viscoso y de gota con Web Audio API.
2. Cada personaje parpadea de forma independiente cada 3.5 a 6.5 segundos mientras están despiertos.
3. Al enfocar contraseña (oculta), se suspende el parpadeo y duermen con Zzz.
4. Al destapar el ojo, se acercan fluidamente y se retiran progresivamente al escribir 5 caracteres.
5. Al escribir un correo válido (con `@` y `.`), suena un chime suave y asienten.
6. Al marcar "Recordarme", Amarillo guiña el ojo con un pop acuático.
7. Al hacer hover en el botón de login, dirigen su mirada hacia él.
