import { NextResponse } from 'next/server';
import { d1Db, DuelType } from '@/lib/d1Client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      challengerCode,
      opponentCode,
      targetNote,
      challengerScore,
      opponentScore,
      winnerCode,
      xpAwarded,
      duelType
    } = body;

    if (!challengerCode || !opponentCode || !targetNote) {
      return NextResponse.json({ error: 'Faltan datos obligatorios del duelo' }, { status: 400 });
    }

    const duelRecordId = `duel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const effectiveType: DuelType = duelType || 'pitch_duel';

    await d1Db.recordDuel({
      id: duelRecordId,
      duel_type: effectiveType,
      challenger_code: challengerCode,
      opponent_code: opponentCode,
      target_note: targetNote,
      challenger_score: Number(challengerScore) || 0,
      opponent_score: Number(opponentScore) || 0,
      winner_code: winnerCode || challengerCode,
      xp_awarded: Number(xpAwarded) || 50,
      created_at: new Date().toISOString()
    });

    const headToHead = await d1Db.getHeadToHead(challengerCode, opponentCode);

    return NextResponse.json({
      success: true,
      duelId: duelRecordId,
      headToHead
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
