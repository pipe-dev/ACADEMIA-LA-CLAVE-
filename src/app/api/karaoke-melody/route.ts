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
