import { NextResponse } from 'next/server';
import { d1Db, DuelRoomRow, DuelType } from '@/lib/d1Client';

// Crear sala con SDP Offer, unirse con SDP Answer o consultar estado
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. Crear Sala de Duelo
    if (action === 'create') {
      const { challengerCode, opponentCode, targetNote, offerSdp, duelType } = body;
      if (!challengerCode || !targetNote || !offerSdp) {
        return NextResponse.json({ error: 'challengerCode, targetNote y offerSdp son requeridos' }, { status: 400 });
      }

      const roomId = `room_${Math.floor(1000 + Math.random() * 9000)}`;
      const effectiveType: DuelType = duelType || 'pitch_duel';

      const room: DuelRoomRow = {
        room_id: roomId,
        duel_type: effectiveType,
        challenger_code: challengerCode,
        opponent_code: opponentCode,
        target_note: targetNote,
        offer_sdp: offerSdp,
        status: 'waiting',
        created_at: Date.now()
      };

      await d1Db.createDuelRoom(room);
      return NextResponse.json({ success: true, roomId, room });
    }

    // 2. Unirse a Sala y responder con SDP Answer
    if (action === 'join') {
      const { roomId, opponentCode, answerSdp } = body;
      if (!roomId || !answerSdp) {
        return NextResponse.json({ error: 'roomId y answerSdp son requeridos' }, { status: 400 });
      }

      const room = await d1Db.getDuelRoom(roomId);
      if (!room) {
        return NextResponse.json({ error: 'Sala no encontrada o expirada' }, { status: 404 });
      }

      const updated = await d1Db.updateDuelRoom(roomId, {
        opponent_code: opponentCode || room.opponent_code,
        answer_sdp: answerSdp,
        status: 'connected'
      });

      return NextResponse.json({ success: true, room: updated });
    }

    return NextResponse.json({ error: 'Accion no valida' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Consultar sala (polling de senalizacion)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json({ error: 'roomId requerido' }, { status: 400 });
    }

    const room = await d1Db.getDuelRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, room });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
