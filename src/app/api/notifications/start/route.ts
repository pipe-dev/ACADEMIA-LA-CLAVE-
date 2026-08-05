import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { title, body } = await req.json();

    if (!title || !body) {
      return NextResponse.json(
        { error: 'Faltan parámetros (title o body)' },
        { status: 400 }
      );
    }

    const appsScriptUrl = process.env.LICENSE_APPS_SCRIPT_URL;

    if (!appsScriptUrl) {
      return NextResponse.json(
        { error: 'Falta configurar LICENSE_APPS_SCRIPT_URL en .env.local' },
        { status: 500 }
      );
    }

    // Payload que espera tu Apps Script en la ruta de campañas
    const payload = {
      action: "start_campaign",
      title,
      body,
      secret: process.env.LICENSE_SHARED_SECRET
    };

    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Fallo al conectar con Google Apps Script");
    }

    return NextResponse.json({
      success: true,
      message: "Campaña registrada en Google Sheets exitosamente"
    });

  } catch (error: any) {
    console.error('Error al iniciar campaña:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
