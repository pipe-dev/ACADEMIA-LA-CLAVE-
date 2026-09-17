# Copa de Cristal 2.5D - Reactividad Táctil Fisiológica (Anti-Sticker)

## 1. Problema Identificado
En la iteración previa, aplicar `rotateY` descontrolado (más de 30°-70°) sobre un contenedor SVG plano provocó una contracción geométrica horizontal (`cos(θ)`), haciendo que la copa se comprimiera en una tira delgada de 20px (efecto "sticker de papel").

## 2. Solución 2.5D Física
En la física óptica real, una copa de vino es una superficie de revolución axial simétrica. Al rotar sobre su eje vertical, **su contorno 2D exterior no cambia de ancho**.

### Componentes de la Interacción:
1. **Silueta Protegida (100% Volumen Permanente):**
   - El contenedor SVG no sufre rotaciones en Y que sobrepasen un rango sutil ($\pm 5^\circ$). Nunca se colapsa.
2. **Rotación Cilíndrica de Superficie (360° Infinita):**
   - El arrastre horizontal del dedo incrementa un ángulo de giro superficial continuo $\theta \in [-\infty, +\infty]$.
   - La posición horizontal de las cáusticas especulares y la refracción interior se modula periódicamente con $\sin(\theta)$ y $\cos(\theta)$, de modo que el brillo viaja por la curvatura del vidrio, se desvanece en los horizontes laterales y reaparece por el reverso.
3. **Bamboleo Físico Elástico (Tilt X / Z):**
   - Inclinación vertical del dedo $\to$ `rotateX` acotado rígidamente a $[-10^\circ, +10^\circ]$ con resistencia elástica.
   - Balanceo lateral sutil $\to$ `rotateZ` acotado a $[-3^\circ, +3^\circ]$.
   - Al soltar el dedo, un oscilador armónico amortiguado ($F = -0.12x - 0.82v$) devuelve la copa a su centro de reposo.
4. **Sombra Anclada a la Base:**
   - La sombra en el suelo permanece anclada en el origen $(100, 282)$, modulando solo una sutil compresión de escala según la inclinación $X$, sin desplazarse lateralmente.
5. **Acústica de Cristal:**
   - Se mantiene la síntesis Web Audio API (2637 Hz fundamental + 5274 Hz armónico) en toques breves (< 250ms), con micro-jiggle elástico.
6. **Mecánica Vocal Intacta:**
   - El reconocimiento de voz sostenida por 4.5s sigue siendo el único mecanismo de quiebre y estallido.
