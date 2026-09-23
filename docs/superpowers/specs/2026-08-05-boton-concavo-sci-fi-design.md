# Diseño: Botón Activo Cóncavo Sci-Fi (Academia)

## Objetivo
Transformar el nodo actual (activo) de la Academia en un botón que simule perspectiva 3D desde el frente, una superficie cóncava (hundida) en la parte superior, y un núcleo que emite luz (Sci-Fi / Neón).

## Especificaciones de Iluminación y CSS

### 1. Perspectiva (Vista Frontal hacia Arriba)
Para engañar al ojo y hacerle creer que el espectador está "frente" al botón y no viéndolo desde arriba (Top-Down):
- **Borde Frontal Grueso:** Utilizaremos un `box-shadow` sólido muy extenso hacia abajo (ej. `0px 10px 0px 0px rgba(x)`) para simular la pared frontal del cilindro del botón.
- **Forma Ovalada (Opcional visualmente):** Aunque el contenedor sea circular (`rounded-full`), las sombras internas y externas aplastarán visualmente el centro superior, dando una ligera ilusión óptica de perspectiva isométrica.

### 2. Superficie Cóncava (Hundimiento Superior)
Un botón convexo (normal) capta la luz en su cresta. Un botón **cóncavo** (como un cuenco) captura la luz en el fondo de la curvatura y proyecta sombra en el borde interior superior (porque la luz viene de arriba).
- **Sombra interior superior (Oscura):** `inset 0px 8px 10px rgba(0,0,0,0.6)` simulará que el labio superior hace sombra sobre el hundimiento.
- **Reflejo interior inferior (Claro):** `inset 0px -6px 8px rgba(255,255,255,0.5)` simulará que la luz golpea la pendiente ascendente en la parte baja del cuenco.
- **Anillo Metálico Exterior (Bisel):** Un borde rígido luminoso `ring-2 ring-indigo-300` envolverá el botón, actuando como la estructura metálica exterior del cuenco.

### 3. Núcleo Emisor (Sci-Fi Glow)
- **Gradiente Invertido:** Usaremos un `bg-radial-gradient` o un gradiente vertical que sea más brillante en el centro/abajo y oscuro en los bordes altos.
- **Aura Exterior:** Añadiremos un resplandor ambiental morado vibrante (`drop-shadow` difuminado extra) proyectándose sobre la interfaz.

## Componentes a Modificar
- `src/components/AcademiaView.tsx`: Exclusivamente los estilos (`className`) aplicados al estado `isCurrent` del botón mapeado.

## Transición a Implementación
No se requieren dependencias adicionales. Todo se logrará con clases nativas de Tailwind y variables de caja.
