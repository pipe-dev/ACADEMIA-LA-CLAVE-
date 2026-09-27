# Especificación de Diseño: Créditos Cinemáticos de Unit 4 y Página de Certificación

**Fecha:** 2026-09-26  
**Módulo:** Unit 4 (Flappy Bird Sandbox & Game) / Certificación  
**Estado:** Aprobado  

---

## 1. Visión General y Objetivos

Al completar la Unidad 4 (el minijuego del pato y las tuberías vocales), el juego reproduce una cinemática de victoria donde el pato entra al pedestal y emerge una copa dorada que viaja al centro de la pantalla. Una vez el mundo se desplaza y la copa queda flotando de forma estática en el centro con su aura y partículas, se activará un panel cinematográfico de créditos de graduación y un llamado a la acción para certificarse oficialmente con la **Academia Musical La Clave**.

El botón de certificación redirige a la nueva ruta `/certification`, la cual muestra la maqueta de graduación con la cinta diagonal de precaución "Disponible Pronto" (idéntica a la del Duelo Rápido / PvP de la app).

---

## 2. Contenido Textual Aprobado

### 2.1 Mensaje de Logro & Felicitación
> **¡Felicidades! Has culminado con éxito todo el ciclo formativo de la Academia.**  
> Hoy entiendes tu instrumento y sabes cómo colocar cada sonido en su lugar con precisión clínica.

### 2.2 Reflexión con Toque de Humor
> Nunca olvides que la seguridad al cantar no se compra; se construye con paciencia, constancia y amor por tu voz.  
> La próxima vez que tomes un micrófono y sientas nervios... recuerda que si tiembla un poquito, siempre puedes fingir que es un **vibrato profesional**. 😉

### 2.3 Créditos
> • **Intérprete Estrella:** Tú  
> • **Dirección Pedagógica:** Academia Musical La Clave  
> • **Tecnología & Evaluación:** AfinApp  
> • **Fans Número Uno:** Todos los que creyeron en tu proceso  

### 2.4 Bloque de Certificación & Llamado a la Acción (CTA)
> **¿Listo para el reconocimiento oficial?**  
> *"Si deseas certificarte con la Academia Musical La Clave y recibir tu diploma oficial de graduación, realiza tu examen final para comprobar y avalar todas tus habilidades vocales."*
> 
> - **Botón Principal:** `[ 🎓 Presentar Examen Final & Certificarme ]` (navega a `/certification`)
> - **Botón Secundario:** `[ Volver a la Academia ]` (regresa al mapa o reinicia el juego)

---

## 3. Arquitectura y Componentes

### 3.1 `src/components/unit4-flappy/Unit4CreditsModal.tsx`
- **Responsabilidad:** Modal flotante semi-transparente (*glassmorphism* con `backdrop-blur-xl bg-slate-950/80 border-amber-500/30`) que se monta sobre el canvas cuando la cinemática llega al final de la etapa `'pan'`.
- **Efectos:**
  - Animación de entrada suave con *fade-in* y *slide-up*.
  - Disparo de confeti dorado celebratorio mediante `canvas-confetti`.
  - Iconografía de graduación (`Trophy`, `GraduationCap`, `Sparkles`, `ArrowRight`, `Home`).
  - Botón de navegación hacia `/certification`.

### 3.2 Integración en `src/components/Unit4Game.tsx`
- **Estado:**
  - Se añade un estado `showCredits: boolean` (y ref complementaria para el ciclo de animación a 60 FPS).
  - En la etapa `win.stage === 'pan'`, una vez que la tubería ha salido completamente de la pantalla (`ob.x + ob.w < -20`) y el trofeo está estabilizado flotando en el centro, se dispara `setShowCredits(true)`.
- **Renderizado Condicional:**
  - Si `showCredits === true`, se renderiza `<Unit4CreditsModal onRestart={reset} />` sobre el canvas sin tapar la copa por completo.

### 3.3 Nueva Página de Certificación: `src/app/certification/page.tsx`
- **Responsabilidad:** Página completa estilo diploma/certificado oficial de la **Academia Musical La Clave**.
- **Elementos Visuales:**
  - Tarjeta de diploma premium con bordes dorados, sellos de cera/bronce y tipografía formal.
  - **Cinta de Precaución (Idéntica al PvP / Duelo):**
    - Franjas diagonales en 45 grados: `repeating-linear-gradient(45deg, #0a0a0a 0px, #0a0a0a 9px, #facc15 9px, #facc15 18px)`.
    - Badge central negro con candado: `🔒 Disponible Pronto`.
    - Mensaje explicativo sobre la próxima apertura de validación de diplomas con los maestros vocales de la academia.
  - Botón de retorno: `"Volver a la Academia"` (`href="/"`).

---

## 4. Restricciones y Reglas de Código
1. **Tope de Líneas ($\le 500$ líneas por archivo):**
   - `Unit4CreditsModal.tsx`: ~180 líneas.
   - `Unit4Game.tsx`: se mantiene bajo 495 líneas.
   - `src/app/certification/page.tsx`: ~150 líneas.
2. **TypeScript Estricto:**
   - 0 errores en `npm run typecheck`.
3. **Build de Producción:**
   - Next.js 15 / Turbopack debe compilar limpiamente con `npm run build`.
