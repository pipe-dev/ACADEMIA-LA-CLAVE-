import { NextResponse } from 'next/server';
import { d1Db } from '@/lib/d1Client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const code = (body.code || '').trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ error: 'Codigo de amigo requerido' }, { status: 400 });
    }

    const singer = await d1Db.getSinger(code);

    if (!singer) {
      return NextResponse.json({ found: false, message: 'Cantante no encontrado con ese codigo' });
    }

    return NextResponse.json({
      found: true,
      singer: {
        id: `friend_${singer.code}`,
        code: singer.code,
        name: singer.name,
        avatar: singer.avatar_url,
        level: singer.level,
        levelTitle: singer.level_title,
        streak: singer.streak,
        xpThisWeek: singer.xp_this_week,
        totalXp: singer.total_xp,
        vocalRange: singer.vocal_range,
        statusText: singer.status_text,
        stabilityScore: singer.stability_score,
        lessonsCompleted: singer.lessons_completed,
        practiceMinutes: singer.practice_minutes,
        badgesCount: singer.badges_count,
        isOnline: true
      }
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
