import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Replace escaped newlines with actual newlines
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function POST(req: Request) {
  try {
    const { token, lote } = await req.json();

    if (!token || !lote) {
      return NextResponse.json(
        { error: 'Faltan parámetros (token o lote)' },
        { status: 400 }
      );
    }

    const topicName = `lote_${lote}`;

    // Suscribir el token al topic (Lote) aleatorio
    await getMessaging().subscribeToTopic(token, topicName);
    
    // Suscribir también a la lista general para envíos rápidos (beta)
    await getMessaging().subscribeToTopic(token, 'all_users');

    return NextResponse.json({
      success: true,
      message: `Token suscrito exitosamente al topic: ${topicName} y all_users`,
    });
  } catch (error: any) {
    console.error('Error al suscribir a FCM Topic:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
