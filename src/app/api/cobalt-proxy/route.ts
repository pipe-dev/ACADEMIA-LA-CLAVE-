import { NextResponse } from 'next/server';

/**
 * Proxy liviano para Cobalt API.
 * El navegador no puede llamar a Cobalt directamente por CORS,
 * así que este endpoint solo pasa el JSON (~1KB).
 * El archivo de audio NUNCA pasa por aquí.
 */
export async function POST(request: Request) {
  try {
    const { videoId } = await request.json();

    if (!videoId) {
      return NextResponse.json({ error: "Falta el videoId" }, { status: 400 });
    }

    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Intentar con múltiples instancias de Cobalt
    const cobaltInstances = [
      "https://api.cobalt.tools",
      "https://cobalt-api.kwiatekmiki.com",
      "https://cobalt.canine.tools",
    ];

    for (const instance of cobaltInstances) {
      try {
        const res = await fetch(`${instance}/`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: youtubeUrl,
            downloadMode: "audio",
            audioFormat: "mp3",
          }),
        });

        if (res.ok) {
          const data = await res.json();
          // Cobalt v7+ retorna { status: "tunnel"/"redirect", url: "..." }
          if (data.url) {
            return NextResponse.json({ url: data.url, status: data.status });
          }
        }
      } catch (e) {
        continue; // Probar siguiente instancia
      }
    }

    return NextResponse.json({ error: "Ninguna instancia de Cobalt respondió." }, { status: 502 });
  } catch (e) {
    return NextResponse.json({ error: "Error interno del proxy." }, { status: 500 });
  }
}
