import { NextRequest, NextResponse } from 'next/server';
import { signJwt, getJwtSecret } from '@/lib/jwt';
import { userDb, computeUserEffectiveStatus } from '@/lib/userDb';
import { checkRateLimit, getClientIp, sanitizeEmail, timingSafeEqualString } from '@/lib/securityService';

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request.headers);
    const rateLimit = checkRateLimit(`login_${clientIp}`, 15, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Demasiados intentos de acceso. Espera 1 minuto antes de reintentar.' },
        { status: 429 }
      );
    }

    const { username, key } = await request.json();

    const cleanUsername = sanitizeEmail(username);
    const cleanKey = (key || '').trim();

    if (!cleanUsername || !cleanKey) {
      return NextResponse.json(
        { error: 'Usuario y clave de acceso requeridos.' },
        { status: 400 }
      );
    }

    // 1. Look up user in centralized database (Cloudflare D1)
    let user = await userDb.getUserByEmail(cleanUsername);

    // If not found by email, check by name
    if (!user) {
      user = await userDb.getUserByName(cleanUsername);
    }

    // If not found by email or name, check if key is the master group key or matched
    if (!user && (cleanUsername.toLowerCase() === 'grupoiglesia' || cleanKey.toLowerCase() === 'grupoiglesia')) {
      user = await userDb.getUserByKey('grupoiglesia');
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado o credenciales incorrectas.', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    // 2. Prioritize checking blocked and expired status
    const statusInfo = computeUserEffectiveStatus(user);

    if (statusInfo.isBlocked) {
      return NextResponse.json(
        {
          error: 'Esta cuenta ha sido bloqueada o suspendida por administración. Por favor contacta a la academia para reactivar tu acceso.',
          code: 'ACCOUNT_BLOCKED',
          reason: 'blocked',
        },
        { status: 403 }
      );
    }

    if (statusInfo.isExpired || statusInfo.daysRemaining <= 0) {
      const formattedExpiry = user.expires_at ? new Date(user.expires_at).toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }) : 'fecha no especificada';
      return NextResponse.json(
        {
          error: `Tu periodo de membresía ha expirado (venció el ${formattedExpiry}). Por favor contacta a la academia para renovar tus días de acceso.`,
          code: 'ACCOUNT_EXPIRED',
          reason: 'expired',
          expiresAt: user.expires_at,
        },
        { status: 403 }
      );
    }

    const userKeyNormalized = (user.access_key || '').trim().toUpperCase();
    const inputKeyNormalized = cleanKey.trim().toUpperCase();

    if (!timingSafeEqualString(userKeyNormalized, inputKeyNormalized)) {
      return NextResponse.json(
        { error: 'Clave de acceso incorrecta para este usuario.', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    // Update last login asynchronously without delaying the response
    userDb.updateUser(user.id, { last_login_at: new Date().toISOString() }).catch((err) => {
      console.warn('Could not update last_login_at:', err);
    });

    const tokenExp = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days
    const tokenPayload = {
      sub: user.email,
      userId: user.id,
      role: user.role,
      exp: tokenExp,
      expiresAt: user.expires_at,
    };

    const token = await signJwt(tokenPayload, getJwtSecret());

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        expiresAt: user.expires_at,
        daysRemaining: statusInfo.daysRemaining,
        role: user.role,
      },
    });

    const proto = request.headers.get('x-forwarded-proto') || request.nextUrl.protocol.replace(':', '');
    const isHttps = proto === 'https' || process.env.NODE_ENV === 'production';

    // Hardened secure cookie
    response.cookies.set('afinapp_session', token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Ha ocurrido un error interno del servidor.' },
      { status: 500 }
    );
  }
}
