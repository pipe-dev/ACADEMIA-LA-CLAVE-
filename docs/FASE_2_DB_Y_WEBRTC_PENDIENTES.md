# Documentacion de Fase 2: Estado Actual, Pendientes y Hoja de Ruta (Cloudflare D1 & WebRTC)

Fecha de registro: 6 de Octubre de 2026
Objetivo: Registro detallado de la infraestructura construida y la lista de tareas pendientes para llevar la base de datos (Cloudflare D1) y el motor WebRTC P2P a produccion total a costo cero ($0.00/mes hasta 100k usuarios).

---

## 1. Estado Actual (Lo Construido y Verificado)

### 1.1 Base de Datos y APIs
- **d1/schema.sql** (61 lineas): Esquema relacional SQL completo para Cloudflare D1 con tablas `singers`, `friendships`, `duel_records` (con columna `duel_type`), y `duel_rooms`.
- **src/lib/d1Client.ts** (221 lineas): Adaptador universal con persistencia en memoria y fallback local para desarrollo y pruebas offline.
- **Rutas API Edge en Next.js**:
  - `POST /api/friends/profile`: Registro y actualizacion de cantantes.
  - `POST /api/friends/search`: Busqueda de amigos por codigo.
  - `POST /api/friends/ranking`: Refresco masivo de clasificacion semanal.
  - `POST /api/friends/duel`: Registro de resultados y balance cara a cara.
  - `GET/POST /api/duel/room`: Senalizacion SDP para emparejamiento WebRTC.
- **src/utils/friendsSyncService.ts** (204 lineas): Servicio offline-first con sincronizacion en segundo plano y almacenamiento en `localStorage`.

### 1.2 WebRTC P2P (Duelos en Tiempo Real)
- **src/utils/p2pDuelService.ts** (250 lineas): Motor de comunicacion directa por `RTCDataChannel` usando servidores STUN de Google (`stun:stun.l.google.com:19302`).
- **src/components/duelo-rapido/dueloTypes.ts** (69 lineas): Protocolo tipado de paquetes (`P2PPitchPacket`, `P2PRhythmPacket`, `P2PSkyRunPacket`, `P2PFinishPacket`).
- **src/components/duelo-rapido/useDuelEngine.ts** (407 lineas): Orquestador del duelo conectado a `p2pDuelService`.
- **src/components/duelo-rapido/DuelSetupView.tsx** (153 lineas): Interfaz con seleccion de modalidad (P2P En Vivo, Fantasma, Local).
- **src/components/duelo-rapido/DuelSingingView.tsx** (128 lineas): Pantalla de canto sin icono Sparkles.
- **src/components/DueloRapidoModal.tsx** (176 lineas): Modal con estado visual de conexion P2P y sala.

---

## 2. Tareas Pendientes para Cerrar la Fase 2 al 100%

### Modulo A: Despliegue de Base de Datos Real en Cloudflare D1

1. **Configuracion de Wrangler y Bindings:**
   - Crear archivo `wrangler.toml` en la raiz del proyecto con la declaracion de D1:
     ```toml
     name = "afinapp"
     compatibility_date = "2026-03-01"

     [[d1_databases]]
     binding = "AFINAPP_DB"
     database_name = "afinapp-db"
     database_id = "<DATABASE_ID_OBTENIDO_DE_CLOUDFLARE>"
     ```
   - Ejecutar los comandos de aprovisionamiento en la cuenta de Cloudflare:
     - `npx wrangler login`
     - `npx wrangler d1 create afinapp-db`
     - `npx wrangler d1 execute afinapp-db --file=./d1/schema.sql`

2. **Implementar Cliente D1 de Produccion en `src/lib/d1Client.ts`:**
   - Detectar si existe el binding nativo `env.AFINAPP_DB` o las credenciales Cloudflare REST API (`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_DATABASE_ID`, `CLOUDFLARE_API_TOKEN`).
   - Reemplazar las operaciones del `Map` en memoria por llamadas SQL preparadas (`d1.prepare(...).bind(...).run()` o llamada HTTP a la API REST de Cloudflare D1) cuando dichas variables esten presentes.
   - Mantener el fallback en memoria para entornos locales sin internet o desarrollo rapido.

3. **Script de Semilla (Seed) para Amigos Demo:**
   - Crear un script SQL o endpoint de mantenimiento (`npm run d1:seed`) que inserte perfiles base en la base de datos de produccion para que los nuevos usuarios siempre tengan rivales en el ranking.

---

### Modulo B: Perfeccionamiento del Motor WebRTC P2P

1. **Soporte Completo de ICE Candidates Continuos:**
   - Actualmente el SDP Offer y Answer contienen los candidates iniciales recogidos antes de enviar la senal.
   - En redes celulares 4G/5G con NAT estricto, implementar un canal de intercambio continuo de ICE Candidates a traves de `/api/duel/room?action=candidate` para garantizar 99.9% de exito de conexion P2P.
   - Opcional: Anadir configuracion de servidor TURN gratuito (ej. OpenRelay / Metered) como respaldo en caso de bloqueo extremo por firewall corporativo o carrier.

2. **Sincronizacion de Inicio (Countdown P2P):**
   - Transmitir un paquete de sincronizacion temporal `{ type: 'sync_countdown', startAt: Date.now() + 3000 }` cuando el DataChannel pase a estado `open`.
   - Garantizar que el temporizador de canto de ambos jugadores arranque exactamente en el mismo milisegundo.

3. **Manejo de Desconexion Abrupta:**
   - Escuchar los eventos `onclose` y `onerror` del `RTCDataChannel` y `connectionStateChange` del `RTCPeerConnection`.
   - Si el rival cierra la aplicacion o pierde senal, mostrar pantalla amigable: "El rival se desconecto de la sesion", preservando las vidas y registrando el resultado sin penalizaciones injustas.

4. **Visualizacion Dual en Pantalla (`DuelSingingView.tsx`):**
   - Renderizar dos agujas/indicadores en simultaneo durante `realtime_p2p`:
     - Indicador principal: El tono y estabilidad del usuario local.
     - Indicador secundario (avatar y barra lateral): El tono en vivo del rival transmitido por el paquete `P2PPitchPacket`.

---

### Modulo C: Extension a Nuevas Disciplinas Competitivas

1. **Duelo de Ritmo (Motor de la Unidad 3):**
   - Conectar los eventos de golpe de `DrumCanvas.tsx` / `drumPhysics.ts` al paquete `P2PRhythmPacket`.
   - Comparar el timing en milisegundos de cada golpe y la precision de las figuras ritmicas.

2. **Carrera Celeste Flappy (Motor de la Unidad 4):**
   - Conectar la posicion vertical de `Unit4Game.tsx` al paquete `P2PSkyRunPacket`.
   - Proyectar el avatar del rival volando con opacidad suave en el fondo de la pantalla mientras ambos esquivan obstaculos con la voz.

3. **Cinematicas de Victoria Cara a Cara:**
   - Integrar componentes de animacion de celebracion (adaptados de `Unit3Celebration` y `Unit4SkyCelebration`) en la pantalla de resultados `DuelResultsView.tsx`.

---

## 3. Criterios de Validacion y Calidad

- **Limite de Lineas:** Ningun archivo debe superar las 500 lineas de codigo.
- **Iconografia:** Prohibicion estricta del icono `Sparkles`. Usar unicamente iconos semanticos y utilitarios (`Swords`, `Trophy`, `Flame`, `Zap`, `Check`, `Activity`).
- **Cero Emojis:** Prohibicion total de emojis en codigo, mensajes de error, documentacion y commits.
- **Costo Garantizado:** 100% gratuito ($0.00) en niveles de uso de hasta 100,000 usuarios activos.
