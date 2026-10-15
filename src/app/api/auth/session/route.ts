import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/jwt';
import { userDb, computeUserEffectiveStatus } from '@/lib/userDb';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_keep_it_secure_key_123!';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('afinapp_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false, reason: 'no_session' }, { status: 401 });
    }

    const payload = await verifyJwt(sessionCookie, JWT_SECRET);
    if (!payload || !payload.sub) {
      const res = NextResponse.json({ authenticated: false, reason: 'invalid_token' }, { status: 401 });
      res.cookies.delete('afinapp_session');
      return res;
    }

    const user = await userDb.getUserByEmail(payload.sub);
    if (!user) {
      const res = NextResponse.json({ authenticated: false, reason: 'user_not_found' }, { status: 401 });
      res.cookies.delete('afinapp_session');
      return res;
    }

    const statusInfo = computeUserEffectiveStatus(user);

    if (statusInfo.isBlocked) {
      const res = NextResponse.json({
        authenticated: false,
        reason: 'blocked',
        message: 'Tu cuenta ha sido suspendida por la administracion.',
      }, { status: 403 });
      res.cookies.delete('afinapp_session');
      return res;
    }

    if (statusInfo.isExpired) {
      const res = NextResponse.json({
        authenticated: false,
        reason: 'expired',
        message: 'Tu suscripcion ha finalizado. Renueva para continuar.',
      }, { status: 403 });
      res.cookies.delete('afinapp_session');
      return res;
    }

    return NextResponse.json({
      authenticated: true,
      serverTime: new Date().toISOString(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        expiresAt: user.expires_at,
        daysRemaining: statusInfo.daysRemaining,
        role: user.role,
      },
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  } catch (err: any) {
    console.error('Session check error:', err);
    return NextResponse.json(
      { authenticated: false, reason: 'error', error: err.message },
      { status: 500 }
    );
  }
}
