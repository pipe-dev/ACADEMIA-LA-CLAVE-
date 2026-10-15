# Especificacion de Diseno: Efectos de Sonido de Burbujas Jugosas y Plops de Gelatina

**Fecha:** 2026-10-13  
**Estado:** Aprobado  
**Objetivo:** Disenar e implementar efectos de sonido procedurales en Web Audio API inspirados en burbujas jugosas y plops de gelatina organica (Enfoque 2) para los 3 saltos de entrada de los personajes en `/sandbox/cutelogin`, sin anadir botones adicionales a la interfaz.

---

## 1. Concepto Acústico (Burbuja Minnaert y Pop de Gelatina)

En lugar de frecuencias sub-graves inaudibles en altavoces de movil, se sintetizan frecuencias medias-altas (entre 320 Hz y 780 Hz) con resonancia esferica natural:

- **Evolucion del tono (Chirp ascendente de burbuja):** En cada salto, el oscilador parte de una frecuencia base y realiza una curva ascendente de 15 ms a 25 ms seguida de una resonancia amortiguada pura.
- **Transiente de impacto jugoso:** 3 ms a 4 ms de ruido rosa filtrado por paso bajo para otorgar la sensacion fisica de gelatina mojada o masa suave al chocar contra el suelo.
- **Micro-variacion por salto:**
  - *Salto 1 (Aparicion desde atras):* Tono ligeramente mas profundo (`0.92x`).
  - *Salto 2 (Avance central):* Tono medio jugoso (`1.00x`).
  - *Salto 3 (Aterrizaje final en reposo):* Pop mas redondeado y brillante (`1.10x`).

---

## 2. Perfiles Acusticos por Personaje

Cada personaje posee su propia afinacion y tamano aparente:

| Personaje | Frecuencia Base | Rango de Barrido | Sensacion Timbrica |
| :--- | :--- | :--- | :--- |
| **Morado** | 340 Hz | 260 Hz -> 390 Hz | Gota profunda y elastica |
| **Fucsia** | 480 Hz | 370 Hz -> 550 Hz | Burbuja jugosa y brillante |
| **Amarillo** | 680 Hz | 520 Hz -> 780 Hz | Pop alegre y chispeante |
| **Naranja** | 410 Hz | 310 Hz -> 470 Hz | Plop rebotante y acolchado |

---

## 3. Desbloqueo Automatico de Audio (Autoplay Policy)

Para solventar las restricciones de navegadores modernos (Safari iOS y Chrome) sin anadir ningun boton a la vista:
- Se registra un listener pasivo global en `window` para eventos `pointerdown` y `keydown`.
- Al primer contacto del usuario con la pantalla (o al seleccionar un campo de texto), el `AudioContext` se reactiva instantaneamente (`ctx.resume()`).
- Si el contexto ya estaba desbloqueado o permitido por la sesion, los sonidos se reproducen sincronizados con la caravana inicial.

---

## 4. Criterios de Aceptacion y Verificacion

1. **Compilacion:** 0 errores en `tsc --noEmit`.
2. **Audio:** Los sonidos se escuchan nitidos en altavoces de movil y auriculares sin distorsion ni clics digitales.
3. **Interfaz intacta:** Sin botones adicionales de reinicio; pureza total del formulario de login.
4. **Respuesta HTTP:** Código 200 en servidor local y túnel Cloudflare.
