import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/jwt';
import { userDb } from '@/lib/userDb';
import { checkRateLimit } from '@/lib/securityService';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_keep_it_secure_key_123!';

async function getAuthUser(request: NextRequest) {
  const cookie = request.cookies.get('afinapp_session')?.value;
  if (!cookie) return null;
  const payload = await verifyJwt(cookie, JWT_SECRET);
  if (!payload || !payload.sub) return null;
  return userDb.getUserByEmail(payload.sub);
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
    }

    const progress = await userDb.getUserProgress(user.id);
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      progress: progress || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
    }

    const rate = checkRateLimit(`progress_${user.id}`, 60, 60000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas sincronizaciones seguidas. Operacion pausada brevemente.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { xp, level, streak, progressData } = body;

    const rawData = typeof progressData === 'string' ? progressData : JSON.stringify(progressData || {});
    // Enforce max 500KB payload to prevent bombing (Pillar 4)
    if (rawData.length > 500000) {
      return NextResponse.json({ error: 'Datos de progreso exceden el limite maximo permitido.' }, { status: 413 });
    }

    const saved = await userDb.saveUserProgress({
      userId: user.id,
      userEmail: user.email,
      xp: typeof xp === 'number' ? xp : 0,
      level: typeof level === 'number' ? level : 1,
      streak: typeof streak === 'number' ? streak : 0,
      progressData: typeof progressData === 'string' ? progressData : JSON.stringify(progressData || {}),
    });

    return NextResponse.json({
      success: true,
      progress: saved,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
