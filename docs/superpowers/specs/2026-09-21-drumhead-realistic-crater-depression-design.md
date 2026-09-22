# Especificación de Diseño: Deformación y Cráter Físico Real en Parche de Bombo (Unidad 3)

## 1. Objetivo y Alcance

Perfeccionar la física visual del impacto de las esferas sobre la membrana del tambor de concierto en `DrumCanvas.tsx`:
1. **Eliminación de artefactos no físicos**: Retirar el haz/cono translúcido vertical ascendente que parecía una sombra o reflector invertido.
2. **Conservación de partículas de celebración**: Mantener los confetis/fragmentos multicolores estelares que se desprenden al rebotar.
3. **Cráter de membrana hiperrealista en 3D**: Simular la deformación cóncava elástica en el punto de contacto usando oclusión ambiental, iluminación direccional y tensión de parche percusivo.

---

## 2. Detalles Técnicos del Cráter 3D

### 2.1 Eliminación del Haz Cónico
- Suprimir el trazado del polígono trapezoidal con `beamGrad` (`ctx.moveTo(dimple.x - 6, craterY)...`).
- Conservar el bucle de renderizado de `dimple.particles` (cian, amarillo, morado, verde, naranja) con su física balística y desvanecimiento.

### 2.2 Anatomía del Cráter Físico
Al producirse el impacto en las coordenadas $(x, y)$ de la membrana elíptica:
- **Aspect Ratio en Perspectiva**: Mantener la proporción geométrica elíptica del parche: `aspectY = drumRadiusY / drumRadiusX` (~0.34).
- **Pared Superior Cóncava (Sombra de Profundidad)**:
  - Gradiente radial con centro ligeramente desplazado hacia el cuadrante superior: simula la pared del cráter que queda en sombra respecto a la luz cenital.
  - Colores: `rgba(42, 22, 10, alpha * 0.75)` a `rgba(70, 42, 20, alpha * 0.35)` a `transparent`.
- **Fondo de Impacto y Oclusión Central**:
  - Punto elíptico más denso y focalizado en la base donde la esfera hunde la membrana.
- **Pared Frontal Inferior (Catch-Light / Brillo de Reborde)**:
  - Arco en la base inferior del cráter con brillo sutil `rgba(255, 255, 245, alpha * 0.45)` simulando la curvatura del cuero tensado recibiendo la luz de frente.
- **Anillo de Tensión Radial Elástica**:
  - Delgada elipse concéntrica que dibuja la onda de tensión en el cuero perimetral.

### 2.3 Curva Temporal de Retroceso Elástico (Lifespan)
- Duración reducida a **450ms** (en lugar de 1200ms).
- Función de desvanecimiento con amortiguación rápida:
  - $0\text{ a }80\text{ms}$: Hundimiento rápido al $100\%$ de profundidad.
  - $80\text{ a }450\text{ms}$: Retorno elástico con amortiguación suave a la forma plana.

---

## 3. Verificación
1. Probar en `http://localhost:9002/sandbox/unit3`.
2. Verificar que al rebotar la esfera:
   - Ya no aparezca el haz/cono vertical.
   - Los fragmentos de colores salgan disparados libremente.
   - Se perciba claramente un hundimiento cóncavo tridimensional natural en el cuero.
   - Las sombras oscuras originales de las esferas se mantengan intactas.
