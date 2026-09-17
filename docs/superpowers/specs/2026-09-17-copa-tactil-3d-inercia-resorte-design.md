# Copa de Cristal 3D - Reactividad Táctil, Inercia, Resorte Elástico y Acústica Cristalina

## 1. Visión General
Permitir que el usuario interactúe físicamente con la copa de cristal 3D mediante toques y arrastre táctil (en pantallas táctiles o ratón).
Combina:
- **Opción A:** Giro libre 3D con inercia física + reanudación suave a la órbita 360° + sonido acústico al toque.
- **Opción C:** Física de resorte (*spring-back*) con amortiguación elástica al soltar la inclinación o sacarla de su centro.
- **Mecánica Intacta:** El canto sostenido por 4.5s sigue siendo el **único** método para fracturar y estallar la copa.

---

## 2. Modelo de Interacción y Física Táctil (Híbrido A + C)

### A. Arrastre Directo (Pointer Drag)
- **Eventos:** `onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerCancel` sobre el contenedor de la copa, con `touch-action: none`.
- **Sensibilidad:**
  - Eje X del puntero $\to$ `rotateY` de la copa (rotación azimutal directa 1:1).
  - Eje Y del puntero $\to$ `rotateX` de la copa (inclinación cenital, con límite elástico entre -22° y +22°).
- **Cáusticas y Sombra en Tiempo Real:** Los reflejos del cristal y la sombra de base acompañan dinámicamente la rotación impuesta por los dedos.

### B. Al Soltar el Dedo (Inercia + Resorte Elástico)
- **Si hubo impulso rápido (*flick* en Y):** La copa continúa girando con inercia angular real (fricción con factor de amortiguamiento $\approx 0.94$).
- **Efecto Resorte (*Spring-Back* en X/Z):** La inclinación vertical regresa al centro mediante oscilador armónico amortiguado ($F = -k \cdot x - c \cdot v$), produciendo un rebote elástico suave y natural.
- **Retorno a la Órbita:** Una vez que la velocidad de inercia se estabiliza, la copa se sincroniza suavemente de vuelta a la órbita continua 360° sin saltos.

### C. Toque / Golpe Rápido (*Tap / Ping*)
- **Detección:** Desplazamiento $< 6\text{px}$ y tiempo de contacto $< 250\text{ms}$.
- **Acústica Sintetizada (Web Audio API):**
  - Tono fundamental cristalino puro (2637 Hz, Mi7) con sobretono armónico (5274 Hz).
  - Decaimiento exponencial sedoso de 1.8 segundos, emulando la campana de una copa de cristal fino al ser golpeada con la uña.
- **Vibración Elástica:** Micro-oscilación de alta frecuencia en el cáliz ($\pm 2.5^\circ$ disipándose en 400ms) que acompaña físicamente al sonido del cristal.

---

## 3. Arquitectura de Componentes y Estado
- **Archivo afectado:** `src/components/Unit2CelebrationModal.tsx`
- **Estados React / Refs:**
  - `isDragging: boolean` (controla si está activa la manipulación táctil o la animación CSS).
  - `touchStateRef`: almacena coordenadas actuales, previas, velocidad angular y timestamp para cálculo de inercia sin re-renders innecesarios.
  - `requestAnimationFrame` loop para inercia y rebote de resorte.
- **AudioContext Helper:** Función interna pura `playCrystalChime()` que reutiliza o instancia un `AudioContext` nativo y sintetiza la campana de cristal.

---

## 4. Criterios de Aceptación y Pruebas
1. Arrastrar con el dedo en móvil o ratón en desktop hace girar la copa en 3D en tiempo real de forma inmediata y suave.
2. Al soltar con impulso, la copa sigue rotando por inercia y amortigua su inclinación con rebote elástico antes de continuar su órbita.
3. Al dar un toque rápido (tap), suena el "tinggg" cristalino y la copa vibra sutilmente.
4. Cantar una nota aguda sostenida por 4.5 segundos avanza la barra de tensión, genera las fracturas (30%, 60%, 85%) y hace estallar la copa en mil pedazos tal como está diseñado.
