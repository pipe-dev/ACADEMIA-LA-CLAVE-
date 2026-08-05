# Plan de Arquitectura: "El Cartero Inmortal" (Goteo en Segundo Plano)

## Problema
Propuse una solución donde podías apagar la computadora para enviar la campaña, pero luego construí una donde tenías que dejar la pestaña del navegador abierta. Esto causó confusión y no cumple la promesa original.

## La Solución Definitiva (El Cartero Inmortal)
Vamos a combinar lo mejor de tus 3 herramientas gratuitas para que la campaña masiva a 600 lotes corra en piloto automático, con tu PC apagada:

1. **Vercel (Next.js):** Tiene la llave maestra para enviar las notificaciones a Firebase. (Ya lo configuramos).
2. **Google Sheets:** Será el "Tablero de Memoria" que recuerda en qué lote va la campaña (ej. Lote 45).
3. **Google Apps Script:** Será el "Cron Job" (El reloj automático). Un gatillo despertará cada 1 minuto, leerá el Tablero de Memoria, y le dirá a Vercel: *"¡Hey Vercel! Dispara el Lote 45"*. 

Con esto, tú lanzas la campaña desde tu celular o PC, cierras todo, y Google Apps Script se encarga de despertar a Vercel cada minuto durante 10 horas.

## Cambios a Realizar

### 1. En Google Sheets
- Crear una nueva pestaña llamada `Campana_Push`.
- Celdas a usar: Título, Mensaje, Lote_Actual, Estado (Activa/Inactiva).

### 2. En Google Apps Script
- Añadir una función `procesarColaPush()` que lee la pestaña `Campana_Push`.
- Si el Estado es "Activa", hace un simple llamado HTTP (Fetch) a la ruta de Next.js (`/api/notifications/send`) pasándole el lote actual.
- Suma +1 al Lote_Actual en el Excel. Si llega a 600, cambia el Estado a "Inactiva".
- Configuraremos un "Activador" (Trigger) para que `procesarColaPush()` corra 1 vez por minuto.

### 3. En Next.js
- Editar `/admin/notificaciones` para que el botón de "Goteo Extremo" simplemente vaya a tu Google Sheets y ponga el Estado en "Activa". ¡Luego puedes cerrar la página de inmediato!

## User Review Required
¿Estás de acuerdo con este plan para dejar el "Goteo Extremo" funcionando 100% en la nube y que así puedas apagar tu computadora tranquilo? Si me das luz verde, te paso el código de Apps Script y conecto el panel.
