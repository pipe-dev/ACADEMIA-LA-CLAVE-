import { NextResponse } from 'next/server';
import { d1Db, SingerRow } from '@/lib/d1Client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const codes: string[] = Array.isArray(body.codes) ? body.codes : [];

    if (codes.length === 0) {
      return NextResponse.json({ friends: [] });
    }

    const rows = await d1Db.getSingersByCodes(codes);

    const friends = rows.map((singer: SingerRow) => ({
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
    }));

    return NextResponse.json({ success: true, friends });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
