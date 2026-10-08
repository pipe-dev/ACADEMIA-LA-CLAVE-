# Especificación Técnica: Animación de Entrada de Fucsia (GSAP Timeline)

## 1. Resumen y Objetivos
Implementar la coreografía de animación de entrada del personaje Fucsia inspirada en la física táctil de arcilla/cartoon de referencia. La animación debe ejecutarse con fluidez total (60-120 FPS sin repintados ni saltos de diseño) mediante transformaciones de GPU aisladas en capa de composición.

## 2. Arquitectura de Composición y Aislamiento GPU

### 2.1 Aislamiento de Capa (Zero-Paint)
El cuerpo del personaje mantiene sus gradientes y sombras volumétricas intactas:
```css
.fuchsia-char {
  will-change: transform;
  transform: translateZ(0);
  backface-visibility: hidden;
}
```

### 2.2 Desacoplamiento en Dos Contenedores
Para evitar colisiones entre el origen de giro del péndulo (techo) y el origen de deformación del impacto (suelo), se estructura la jerarquía DOM:
1. **`fucsia-motion-carrier` (Contenedor externo)**:
   - Responsabilidad: Traslación espacial de trayectoria pura (`x`, `y`).
2. **`fucsia-motion-body` (Contenedor interno)**:
   - Responsabilidad: Rotación angular (`rotation`) y deformaciones orgánicas (`scaleX`, `scaleY`).
3. **`fucsia-shadow-carrier`**:
   - Sincroniza la escala y opacidad de las sombras de suelo (`.shadow-contact` y `.shadow-ambient`) en relación con la elevación del personaje.

## 3. Coreografía y Parámetros del Timeline GSAP

Duración total aproximada: **2.3 segundos**.

```javascript
const tl = gsap.timeline({ defaults: { ease: "power1.inOut" } });

// Estado inicial: fuera de escena arriba a la derecha, invertido 180 deg
tl.set(".fucsia-motion-carrier", { x: 110, y: -280 })
  .set(".fucsia-motion-body", { rotation: 180, transformOrigin: "top center", scaleX: 1, scaleY: 1 })
  .set(".shadow-contact", { scaleX: 0.3, opacity: 0.08 })
  .set(".shadow-ambient", { scaleX: 0.3, opacity: 0.05 })

// FASE 1: Balanceo pendular de entrada (derecha a izquierda)
  .to(".fucsia-motion-carrier", { x: -50, duration: 0.65, ease: "sine.inOut" })
  .to(".fucsia-motion-body", { rotation: 162, duration: 0.65, ease: "sine.inOut" }, "<")

// FASE 2: Retorno pendular y preparación de soltado (izquierda a derecha)
  .to(".fucsia-motion-carrier", { x: 0, duration: 0.55, ease: "sine.inOut" })
  .to(".fucsia-motion-body", { rotation: 195, duration: 0.55, ease: "sine.inOut" }, "<")

// FASE 3: Desprendimiento, caída balística acelerada y estiramiento en aire
  .set(".fucsia-motion-body", { transformOrigin: "center center" })
  .to(".fucsia-motion-carrier", { y: 0, duration: 0.40, ease: "power3.in" })
  .to(".fucsia-motion-body", { rotation: 360, duration: 0.40, ease: "power1.inOut" }, "<")
  .to(".fucsia-motion-body", { scaleY: 1.14, scaleX: 0.88, duration: 0.14, ease: "power2.in" }, "-=0.14")
  .to(".shadow-contact", { scaleX: 0.8, opacity: 0.25, duration: 0.20, ease: "power2.in" }, "-=0.20")

// FASE 4: Contacto en suelo, Squash elástico y disipación procedural
  .set(".fucsia-motion-body", { transformOrigin: "bottom center" })
  .to(".fucsia-motion-body", { scaleY: 0.76, scaleX: 1.22, duration: 0.08, ease: "power2.out" })
  .to(".shadow-contact", { scaleX: 1.25, opacity: 0.45, duration: 0.08, ease: "power2.out" }, "<")
  .to(".shadow-ambient", { scaleX: 1.15, opacity: 0.22, duration: 0.08, ease: "power2.out" }, "<")
  .to(".fucsia-motion-body", { scaleY: 1.0, scaleX: 1.0, duration: 0.48, ease: "elastic.out(1.2, 0.35)" })
  .to(".shadow-contact", { scaleX: 1.0, opacity: 0.35, duration: 0.48, ease: "power2.out" }, "<")
  .to(".shadow-ambient", { scaleX: 1.0, opacity: 0.22, duration: 0.48, ease: "power2.out" }, "<");
```

## 4. Integración y Controles de Prueba

1. **Ubicación del Componente**:
   - Se creará un componente envoltorio de animación o hook dedicado `src/components/sandbox/CuteCharacterFucsiaAnimated.tsx` que aloje el timeline y la referencia DOM, dejando [CuteCharacterFucsia.tsx](file:///c:/Users/dani3/OneDrive/Escritorio/games/LaClave/AfinApp/src/components/sandbox/CuteCharacterFucsia.tsx) estático sin contaminar.
2. **Replay Trigger**:
   - En la página de sandbox [cutelogin](file:///c:/Users/dani3/OneDrive/Escritorio/games/LaClave/AfinApp/src/app/sandbox/cutelogin/page.tsx), se añadirá un control limpio para reproducir o reiniciar el timeline cuando el usuario desee calibrar la física.
3. **Reglas de Calidad y Rendimiento**:
   - Cero animaciones sobre `top`, `left`, `width`, `height`, `margin` o `box-shadow`.
   - Cero emojis en código y textos.
   - Archivos estrictamente por debajo de las 500 líneas.
