import { NextResponse } from 'next/server';

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
      const res = await fetch(`${APPS_SCRIPT_URL}?action=getMelody&videoId=${videoId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.error) {
          return NextResponse.json({ error: data.error }, { status: 500 });
        }
        return NextResponse.json(data);
      } else {
        return NextResponse.json({ error: "Error en Apps Script" }, { status: res.status });
      }
    } catch (e) {
      console.error("Error leyendo melodía de Google Sheets", e);
      return NextResponse.json({ error: "Error de red" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "API no configurada" }, { status: 500 });
}

export async function POST(request: Request) {
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json({ error: "API no configurada" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { videoId, notes } = body;

    if (!videoId || !notes) {
      return NextResponse.json({ error: "Faltan datos (videoId o notes)" }, { status: 400 });
    }

    const payload = {
      action: 'saveMelody',
      videoId,
      notes,
    };

    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    } else {
      return NextResponse.json({ error: "Error guardando melodía en Apps Script" }, { status: res.status });
    }
  } catch (e) {
    console.error("Error guardando melodía en Google Sheets:", e);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
