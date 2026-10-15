# Especificacion de Diseno: Redisenio de Pantalla de Acceso (Login) - AfinApp

## 1. Contexto y Objetivos
La pantalla de inicio de sesion (`src/app/login/page.tsx`) presentaba una interfaz generica, oscura y con poca identidad visual de la academia.
El objetivo es elevar la experiencia visual a un estandar de "Academia Vocal Premium" mediante:
1. Identidad de marca refinada con el isotipo oficial (`/icons/Logo_afinapp.png`) y resplandor sutil.
2. Contenedor de vidrio esmerilado (glassmorphism con borde verde esmeralda y desenfoque profundo).
3. Visibilidad de contrasenia alternable mediante icono de ojo (`Eye`/`EyeOff`).
4. Recordatorio de acceso opcional ("Recordar mi acceso en este dispositivo") almacenado de forma segura en `localStorage`.
5. Canal de atencion rapida mediante enlace a WhatsApp para recuperacion de clave o renovacion de membresia.
6. Adaptacion nativa a dispositivos moviles (PWA) respetando las variables de area segura (`--safe-top`, `--safe-bottom`, notches e islas dinamicas).

## 2. Decisiones de Diseno y Estilo
- **Fondo de Escenario:** Degradado suave `from-[#071322] via-[#0b1c30] to-[#041a18]` con orbes radiales desenfocados en esmeralda y dorado tenue.
- **Tarjeta Principal:**
  - Capa de vidrio: `bg-[#0b1c30]/70 backdrop-blur-2xl border border-emerald-500/25 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_40px_rgba(16,185,129,0.12)] rounded-3xl`.
  - Maximo ancho 420px, centrado tanto vertical como horizontalmente con paddings dinamicos de entorno seguro.
- **Insignia Superior:**
  - Badge de estado: "Academia Vocal La Clave - Acceso de Alumnos" con icono `ShieldCheck` en tono esmeralda.
- **Campos de Formulario:**
  - Estudiante / Usuario: Input de texto con icono `User` y foco estilizado con anillo esmeralda.
  - Clave de Acceso: Input de clave con icono `KeyRound` a la izquierda y boton toggle de visibilidad a la derecha (`Eye` / `EyeOff`).
  - Opcion de recordar: Checkbox estilizado con etiqueta discreta para persistir el nombre de usuario.
- **Accion Principal:**
  - Boton de ingreso: Gradiente solido `from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400`, sombra luminosa y estado de carga deshabilitado con spinner.
- **Zona de Soporte:**
  - Enlace inferior con icono `MessageCircle`: "Soporte de Academia via WhatsApp" apuntando al canal oficial de atencion.

## 3. Manejo de Estado y Persistencia
- Clave de almacenamiento para usuario recordado: `afinapp_remembered_username`.
- Si existe al montar el componente, se autocompleta el campo `username` y se marca la casilla `rememberMe`.
- Si el usuario desmarca la casilla al iniciar sesion, se elimina la clave de `localStorage`.
- Los avisos de sesion (`sessionNotice`) por parametros `reason=expired`, `blocked` o `ended` se mantienen con diseno de advertencia ambar de alto contraste.

## 4. Restricciones del Sistema
- Archivo unico con conteo de lineas menor a 500 lineas.
- Cero emojis en codigo y textos.
- Ausencia total de iconos no autorizados (prohibido `Sparkles`).
