# Diseño Técnico: Anillo de Tensión Circular (Aura Shield) en Afinador

**Fecha:** 2026-09-12  
**Estado:** Propuesta Aprobada para Planificación  
**Ubicación:** docs/superpowers/specs/2026-09-12-aura-shield-tension-ring-design.md  

---

## 1. Contexto y Problema

En la vista de niveles del afinador vocal (AfinadorView.tsx), la inclusión de la barra rectangular de Tug-of-War (fuerza de precisión y riesgo de vidas) ocupaba un bloque independiente de **~85px de altura vertical**.

En dispositivos móviles (viewports de 667px a 844px de alto), esta altura adicional desbordaba el contenedor principal, empujando la mitad inferior del **Teclado Vocal** (teclas blancas y negras del piano táctil) detrás del menú inferior de navegación (BottomNav), forzando al usuario a realizar scroll vertical constante durante los ejercicios.

---

## 2. Objetivos de Diseño

1. **Cero Scroll en Móvil**: La cabecera, visualizador de tono (esfera 3D + partículas + ecualizador), medidor de tensión de vidas y teclado de referencia deben coexistir simultáneamente en la pantalla sin desborde.
2. **Aura Shield Concéntrico**: Reemplazar la barra rectangular por un anillo SVG concéntrico de alta fidelidad que rodea directamente a la esfera 3D central.
3. **Micro-Badges Flotantes Emergentes en los Extremos**:
   - Icono de **Victoria 🏆**: Aparece suavemente a la derecha solo cuando la tensión se aproxima a la meta (>= 75%).
   - Icono de **Alerta de Vida ❤️ (-1 Vida)**: Aparece a la izquierda solo cuando la tensión cae a zona de peligro (<= 30%).
   - En la zona neutral (30% a 75%), ambos permanecen ocultos para máxima limpieza visual.
4. **Píldora de Estado Pura**: Mantener la píldora inferior exclusivamente para orientación técnica vocal (¡AFINACIÓN PERFECTA!, Muy grueso ↑, Muy delgado ↓, Escuchando voz...), sin saturarla con números porcentuales.

---

## 3. Arquitectura Visual y Componentes

### 3.1. Anillo SVG Concéntrico (Aura Shield Ring)
- **Contenedor**: Envolvente concéntrico alrededor de la esfera 3D (w-22 h-22).
- **Dimensiones**: SVG w-28 h-28 o w-[116px] h-[116px] centrado con position: absolute respecto a la esfera.
- **Pista Base (Track)**:
  - Círculo guía de radio r = 52 con trazo fino de 3.5px translúcido (stroke-slate-200/50 o stroke-white/10).
- **Arco Dinámico de Tensión**:
  - strokeDasharray: Circunferencia completa 2 * pi * 52 ≈ 326.7px.
  - strokeDashoffset: Mapeado según tugOfWarProgress (0% a 100%).
  - **Color / Gradiente Dinámico**:
    - >= 50%: Gradiente de esmeralda neón a verde cian (#10b981 -> #06b6d4).
    - < 50%: Gradiente de ámbar a carmesí de alerta (#f59e0b -> #f43f5e).
    - < 20%: Resplandor pulsante (danger glow) alertando la proximidad de pérdida de vida.

### 3.2. Micro-Badges Emergentes (Aparición Contextual)
Utilizando AnimatePresence de Motion (motion/react):

1. **Badge Victoria (Derecha)**:
   - **Condición**: tugOfWarProgress >= 75 en modo 'niveles'.
   - **Render**: Píldora compacta verde esmeralda con Trophy (🏆) y texto Victoria.
   - **Animación**: Entrada suave en escala y opacidad (scale: [0.8, 1], opacity: [0, 1]).
2. **Badge Peligro (Izquierda)**:
   - **Condición**: tugOfWarProgress <= 30 en modo 'niveles'.
   - **Render**: Píldora compacta carmesí con Heart pulsante (❤️) y texto -1 Vida.
   - **Animación**: Entrada en alerta (scale: [0.8, 1], opacity: [0, 1]).

### 3.3. Píldora Inferior de Estado
- Permanece intacta y legible:
  - isPitchMatched: ¡AFINACIÓN PERFECTA! (verde con check animado).
  - pitchDiff > 0: Muy grueso ↑ Sube el tono / Muy delgado ↓ Baja el tono (ámbar/rojo con icono guía).
  - Silencio: Escuchando voz... / Toca para activar micrófono y afinar.

---

## 4. Recuperación de Espacio y Altura Móvil

| Elemento | Antes | Ahora con Aura Shield | Ahorro |
|---|---|---|---|
| Tarjeta independiente Tug-of-War | ~85px | **0px** (eliminada) | **-85px** |
| Anillo de Tensión | 0px | **0px** (envuelve la esfera existente) | **0px** |
| Posición del Teclado Vocal | Desplazado fuera de pantalla | **Completamente visible sobre BottomNav** | **Óptimo** |

---

## 5. Casos Límite y Manejo de Errores

1. **Modo Libre**:
   - El anillo de tensión y los micro-badges no se renderizan (la esfera permanece con su estilo regular del modo libre).
2. **Calentamiento**:
   - Es zona segura: el anillo puede renderizarse como un halo dorado/esmeralda completo continuo o quedar oculto, ya que no hay penalización de vidas.
3. **Llegada al 100%**:
   - Se dispara la secuencia de victoria (handleLevelVictory), confeti y avance de nivel o nota.
4. **Llegada al 0%**:
   - Se congela el audio, suena defeatSound, se descuenta 1 vida y se despliega el modal de nivel fallado (isLevelFailed).

---

## 6. Plan de Verificación

- **Verificación Visual en Móvil**:
  - Probar en la URL de Cloudflare desde smartphone.
  - Verificar que el Teclado Vocal táctil (teclas blancas y negras) esté 100% visible sin necesidad de scroll.
- **Verificación de Comportamiento Dinámico**:
  - Afinar una nota correcta: comprobar expansión del anillo en verde y aparición del badge 🏆 al llegar a >= 75%.
  - Desafinar una nota: comprobar retroceso del anillo en rojo y aparición del badge ❤️ (-1 Vida) al caer a <= 30%.
  - Mantenerse en equilibrio (35% a 70%): verificar que los micro-badges permanezcan limpios y ocultos.
- **Chequeo de Tipos y Pruebas**:
  - npx tsc --noEmit sin errores.
  - npx tsx src/utils/__tests__/livesEngine.test.ts pasando 100%.

