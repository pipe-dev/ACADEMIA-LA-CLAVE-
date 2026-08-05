import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function POST(req: Request) {
  try {
    const { title, body, lote } = await req.json();

    if (!title || !body || !lote) {
      return NextResponse.json(
        { error: 'Faltan parámetros (title, body o lote)' },
        { status: 400 }
      );
    }

    const topicName = lote === 'ALL' ? 'all_users' : `lote_${lote}`;

    const message = {
      notification: {
        title,
        body,
      },
      topic: topicName,
    };

    // Enviar el mensaje al Topic específico
    const response = await getMessaging().send(message);

    return NextResponse.json({
      success: true,
      messageId: response,
      topic: topicName
    });
  } catch (error: any) {
    console.error('Error al enviar campaña Push:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
