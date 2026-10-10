# Especificación de Diseño: Transición Deslizante a Registro en Modo Oscuro (Enfoque C)

Fecha: 2026-10-10  
Estado: En revisión  
Ubicación del archivo: docs/superpowers/specs/2026-10-10-cutelogin-slide-register-dark-mode-design.md  

---

## 1. Resumen y Objetivos

El objetivo de esta especificación es implementar la transición interactiva al pulsar el botón **"Regístrate"** en la pantalla de autenticación (`src/app/sandbox/cutelogin/page.tsx`):

1. **Deslizamiento Lateral de Cobertura (Enfoque C):**
   - El panel del formulario se desliza de derecha a izquierda cubriendo completamente el escenario de los 4 blobs gelatinosos.
   - La transición utiliza una curva física de aceleración y desaceleración fluida (`cubic-bezier(0.16, 1, 0.3, 1)` de 600ms) sin saltos visuales ni parpadeos.
2. **Modo Oscuro Sofisticado:**
   - Durante el deslizamiento, el panel del formulario cambia a una paleta nocturna de alta gama (fondo pizarra oscuro `#0f172a` / `#111827`, textos blancos nítidos, bordes sutiles `border-slate-800` y detalles en gris perla).
   - El fondo exterior general de la pantalla (`main`) se mantiene en el tono neutro actual (`bg-[#e5e9ee]`), maximizando el contraste y el protagonismo de la tarjeta.
3. **Formulario de Registro Minimalista:**
   - Tres campos principales con tipografía clara y espaciosa:
     - **Nombre**
     - **Correo**
     - **Contraseña**
   - Botón principal de llamada a la acción: **"Crear cuenta"** (con estilo luminoso invertido sobre el fondo oscuro).
4. **Panel Derecho Descubierto (Ambiental):**
   - El espacio descubierto en el lado derecho adopta el fondo oscuro complementario con tipografía minimalista de bienvenida (*"Únete a AfinApp"*).
   - **Sin botón de retorno para destapar los blobs**, respetando la indicación del usuario para las siguientes interacciones planeadas sobre los blobs cubiertos.
5. **Efecto de Audio Táctil de Deslizamiento:**
   - Adición de un micro-sonido ASMR de deslizamiento suave (`playSlideTransition` en `useJellyAsmrAudio.ts`) basado en ruido rosa filtrado y barrido resonante muy sutil.

---

## 2. Arquitectura de Componentes y Estado

### 2.1. Estado en `src/app/sandbox/cutelogin/page.tsx`

```typescript
// Modo activo de la tarjeta
const [isRegisterMode, setIsRegisterMode] = useState(false);

// Campos de registro
const [regName, setRegName] = useState('');
const [regEmail, setRegEmail] = useState('');
const [regPassword, setRegPassword] = useState('');
const [showRegPassword, setShowRegPassword] = useState(false);
```

### 2.2. Estructura de Capas de la Tarjeta

La tarjeta contenedora (`max-w-[960px]`) mantiene su relación de aspecto dividida:
- **Capa Base Izquierda (z-10):**
  - Fondo `#e9e9e9`.
  - Aloja el escenario `<CuteCharactersStatic>` con los 4 personajes.
  - Cuando el panel desliza sobre ellos, quedan protegidos debajo sin desmontarse (manteniendo sus estados de animación intactos).
- **Capa Base Derecha (z-10):**
  - Fondo `#0f172a` (oscuro).
  - Revelada automáticamente cuando el formulario se desplaza a la izquierda.
  - Muestra el texto ambiental de bienvenida y estética de marca nocturna.
- **Capa Deslizante Superior (z-30):**
  - Panel dinámico con `transition: transform 600ms cubic-bezier(0.16, 1, 0.3, 1), background-color 450ms ease`.
  - En modo Login (`!isRegisterMode`): ubicado en el lado derecho (`transform: translateX(0%)`), fondo blanco (`bg-white`).
  - En modo Registro (`isRegisterMode`): trasladado a la izquierda (`transform: translateX(-100%)`), fondo oscuro (`bg-[#0f172a]`), cubriendo exactamente el 100% de la zona de los personajes.

---

## 3. Diseño Visual y Tipografía

### 3.1. Formulario de Registro (Modo Oscuro)
- **Título:** `¡Crea tu cuenta!` en `text-xl sm:text-4xl font-extrabold text-white`.
- **Subtítulo:** `Comienza tu viaje musical` en `text-xs sm:text-base text-slate-400`.
- **Campos de Entrada:**
  - Etiquetas: `text-xs sm:text-sm font-semibold text-slate-300`.
  - Inputs: `border-b border-slate-700 focus:border-white text-white placeholder-slate-500 py-1.5 sm:py-2.5 text-[16px] sm:text-base`.
  - Icono de contraseña: ojo/ojo tachado en `text-slate-400 hover:text-white`.
- **Botón "Crear cuenta":**
  - `bg-white hover:bg-slate-200 text-slate-950 font-bold h-10 sm:h-12 rounded-full shadow-lg`.

### 3.2. Panel Derecho Ambiental Descubierto
- Fondo: `#0f172a` con borde divisorio sutil `border-l border-slate-800`.
- Contenido:
  - Marca o isotipo sutil.
  - Frase minimalista: *"El afinador inteligente para tu voz"*.
  - Indicador de estado de registro.

---

## 4. Sonido ASMR de Deslizamiento

En `src/utils/useJellyAsmrAudio.ts`:
- Función `playSlideTransition()`:
  - Micro-deslizamiento acústico suave: barrido de ruido rosa filtrado por paso-banda (1200 Hz $\to$ 400 Hz) con decaimiento exponencial de 240 ms y volumen muy bajo (0.05).
  - Aporta sensación tangible de compuerta o superficie deslizándose suavemente.

---

## 5. Plan de Pruebas y Criterios de Aceptación

1. **Compilación y Tipado:** `npm run typecheck` con cero advertencias y cero errores.
2. **Acción de Registro:** Al pulsar "Regístrate", el formulario se desliza hacia la izquierda con una animación limpia de 600 ms cubriendo a los blobs.
3. **Modo Oscuro:** Los colores del formulario cambian fluidamente a la paleta oscura elegante.
4. **Persistencia de Blobs:** Los blobs no se descalibran ni arrojan errores mientras permanecen cubiertos.
5. **No interferencia:** No se añade ningún botón en el panel derecho para destapar a los blobs.
