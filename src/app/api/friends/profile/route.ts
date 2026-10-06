import { NextResponse } from 'next/server';
import { d1Db } from '@/lib/d1Client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.code || !body.name) {
      return NextResponse.json({ error: 'code y name son requeridos' }, { status: 400 });
    }

    const singer = await d1Db.upsertSinger({
      code: body.code,
      name: body.name,
      avatar_url: body.avatarUrl,
      level: body.level,
      level_title: body.levelTitle,
      streak: body.streak,
      xp_this_week: body.xpThisWeek,
      total_xp: body.totalXp,
      vocal_range: body.vocalRange,
      status_text: body.statusText,
      stability_score: body.stabilityScore,
      lessons_completed: body.lessonsCompleted,
      practice_minutes: body.practiceMinutes,
      badges_count: body.badgesCount
    });

    return NextResponse.json({ success: true, singer });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
