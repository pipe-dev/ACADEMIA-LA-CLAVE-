# Especificacion de Diseno: Formulario de Login en Vidrio Esmerilado (Glassmorphism)

**Fecha:** 2026-10-13  
**Estado:** Aprobado por el usuario  
**Ubicacion del documento:** docs/superpowers/specs/2026-10-13-cute-login-glassmorphism-form-card-design.md  

---

## 1. Resumen y Objetivos

El objetivo de este diseno es transformar la columna derecha del formulario de acceso en `/sandbox/cutelogin` de una superficie blanca opaca a una tarjeta de vidrio esmerilado translúcido (*glassmorphism*), permitiendo ver el cielo azul y el flujo de nubes animadas de la Unidad 4 en segundo plano:

1. **Estetica Premium Glassmorphism:** Fondo blanco translúcido (`bg-white/60` con `backdrop-blur-xl` y `backdrop-saturate-150`), integrando sutiles reflejos de luz y bordes de cristal.
2. **Contraste y Legibilidad Estricta:** Titulares, etiquetas e inputs con tonos definidos (`#0f172a` y `#334155`) que garantizan lectura clara independientemente de las nubes que se desplacen por detrás.
3. **Preservacion del Escenario de los Blobs:** El lado izquierdo mantiene su superficie sólida (`bg-[#e9e9e9]`) para conservar el anclaje físico, peso visual y sombras de contacto de los 4 personajes gelatinosos.
4. **Ocultamiento de la Caravana de Entrada:** El nivel de desenfoque y opacidad oculta a los personajes que esperan en `X >= 700px` antes de su primer salto hacia la izquierda.

---

## 2. Modificaciones de Estilo y Clases CSS

### 2.1. Contenedor Principal de la Tarjeta (`CuteLoginPage`)
- Archivo: `src/app/sandbox/cutelogin/page.tsx`
- El contenedor exterior pasa de un fondo blanco plano a un contenedor transparente con borde de cristal ligero y sombra volumetrica:
  ```tsx
  className="... bg-white/30 backdrop-blur-md border border-white/40 shadow-[0_25px_60px_rgba(15,23,42,0.25)] ..."
  ```

### 2.2. Columna Derecha (Formulario de Acceso)
- La columna del formulario adopta el vidrio esmerilado:
  ```tsx
  className="min-w-0 relative flex flex-col justify-center px-4 py-4 sm:py-14 sm:px-14 bg-white/60 backdrop-blur-xl backdrop-saturate-150 z-20 border-l border-white/40"
  ```
- Los campos de texto mantienen bordes de línea claros (`border-slate-400/60 focus:border-slate-900`).
- El botón principal conserva su tono sólido oscuro (`#111827`) para mantener la jerarquía de la llamada a la acción.

---

## 3. Criterios de Aceptacion y Verificacion

1. **Compilacion:** 0 errores en `npx tsc --noEmit`.
2. **Respuesta HTTP:** Codigo 200 en servidor local y tunel Cloudflare.
3. **Cero regresiones:** Las animaciones de salto, toques ASMR y la respuesta responsiva en moviles y escritorio se mantienen intactas.
