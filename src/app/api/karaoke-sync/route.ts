import { NextResponse } from 'next/server';

// Memoria colectiva temporal en RAM como fallback
const crowdsourcedOffsets = new Map<string, number>();

// Reemplazar con la URL web de tu Google Apps Script desplegado
const APPS_SCRIPT_URL = process.env.LICENSE_APPS_SCRIPT_URL || "";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ error: "Falta el videoId" }, { status: 400 });
  }

  // Si tenemos configurado Google Sheets (Apps Script)
  if (APPS_SCRIPT_URL) {
    try {
      const res = await fetch(`${APPS_SCRIPT_URL}?action=getOffset&videoId=${videoId}`);
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ videoId, offset: data.offset || 0 });
      }
    } catch (e) {
      console.error("Error leyendo de Google Sheets", e);
    }
  }

  // Fallback a memoria local
  const offset = crowdsourcedOffsets.get(videoId) || 0;
  return NextResponse.json({ videoId, offset });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { videoId, offset } = body;

    if (!videoId || typeof offset !== 'number') {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    // Si tenemos configurado Google Sheets (Apps Script)
    if (APPS_SCRIPT_URL) {
      try {
        await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'setOffset', videoId, offset }),
        });
      } catch (e) {
        console.error("Error guardando en Google Sheets", e);
      }
    }

    // Guardar en fallback local
    crowdsourcedOffsets.set(videoId, offset);
    console.log(`[CROWDSOURCE] Offset para ${videoId} guardado: ${offset}s`);

    return NextResponse.json({ success: true, videoId, offset });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
