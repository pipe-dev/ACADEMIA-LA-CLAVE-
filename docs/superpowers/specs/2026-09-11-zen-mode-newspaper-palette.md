# Especificación: Modo Zen Periódico Mate (Monocromático Grises + Amarillo Imprenta)

## 1. Visión y Propósito
El Modo Zen pasa de su tono marrón anterior a un estilo editorial monocromático de periódico tradicional de imprenta (*Newsprint Editorial*). Está concebido para el descanso ocular absoluto: elimina toda luz azul estridente, elimina blancos deslumbrantes y utiliza una escala de grises carbón mate combinada con un amarillo cálido de rotativa como único acento.

## 2. Parámetros de Color
- Fondo base: `#161719` (Gris carbón mate).
- Tarjetas y contenedores: `#1f2125` / `#26292f`.
- Bordes de división: `#2e3138` / `#363a42`.
- Textos: `#f0ebe1` (titulares), `#ded9cf` (lectura), `#99958d` (metadatos).
- Acento de prensa: `#e5b83b` / `#d8a728` (amarillo imprenta mate).
- Botones primarios: Fondo `#e5b83b`, texto oscuro `#161719`, sombra `#b3881b`.
- Imágenes: Filtro de imprenta analógica `grayscale(80%) contrast(95%) brightness(90%)`.

## 3. Comportamiento
- El Modo Zen es permanentemente oscuro.
- Se oculta el control de modo claro/oscuro cuando Zen está activo para evitar inconsistencias.
