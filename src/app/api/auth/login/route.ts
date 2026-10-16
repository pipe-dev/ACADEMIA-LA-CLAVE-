import { NextRequest, NextResponse } from 'next/server';
import { signJwt } from '@/lib/jwt';
import { userDb, computeUserEffectiveStatus } from '@/lib/userDb';
import { checkRateLimit, getClientIp, sanitizeEmail } from '@/lib/securityService';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_keep_it_secure_key_123!';
const APPS_SCRIPT_URL = process.env.LICENSE_APPS_SCRIPT_URL;
const SHARED_SECRET = process.env.LICENSE_SHARED_SECRET;

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request.headers);
    const rateLimit = checkRateLimit(`login_${clientIp}`, 10, 60000);
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

    // 1. Look up user in centralized database
    let user = await userDb.getUserByEmail(cleanUsername);

    // If not found by email, check if key is the master group key or matched
    if (!user && cleanKey === 'grupoiglesia') {
      user = await userDb.getUserByKey('grupoiglesia');
    }

    // 2. If user exists in DB, verify key and subscription status (case-insensitive for convenience)
    if (user) {
      const userKeyNormalized = (user.access_key || '').trim().toUpperCase();
      const inputKeyNormalized = cleanKey.trim().toUpperCase();
      const isMasterGroup = cleanKey.trim().toLowerCase() === 'grupoiglesia';

      if (userKeyNormalized !== inputKeyNormalized && !isMasterGroup) {
        return NextResponse.json(
          { error: 'Clave de acceso incorrecta para este usuario.', code: 'INVALID_CREDENTIALS' },
          { status: 401 }
        );
      }

      const statusInfo = computeUserEffectiveStatus(user);

      if (statusInfo.isBlocked) {
        return NextResponse.json(
          {
            error: 'Tu cuenta ha sido bloqueada o suspendida por administración. Por favor contacta a la academia para reactivar tu acceso.',
            code: 'ACCOUNT_BLOCKED',
          },
          { status: 403 }
        );
      }

      if (statusInfo.isExpired) {
        const formattedExpiry = new Date(user.expires_at).toLocaleDateString('es-CO', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        return NextResponse.json(
          {
            error: `Tu periodo de membresía ha expirado (venció el ${formattedExpiry}). Por favor contacta a la academia para renovar tus días de acceso.`,
            code: 'ACCOUNT_EXPIRED',
            expiresAt: user.expires_at,
          },
          { status: 403 }
        );
      }

      // Update last login
      await userDb.updateUser(user.id, { last_login_at: new Date().toISOString() });
    } else {
      // 3. Fallback: Check Apps Script for legacy licenses and auto-migrate to database
      let legacyValid = false;
      let legacyExpiresAt: string | null = null;

      if (APPS_SCRIPT_URL) {
        try {
          const gasRes = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: cleanUsername,
              key: cleanKey,
              secret: SHARED_SECRET,
            }),
            signal: AbortSignal.timeout(6000),
          });

          if (gasRes.ok) {
            const data = await gasRes.json();
            if (data.success && data.expiresAt) {
              legacyValid = true;
              legacyExpiresAt = data.expiresAt;
            }
          }
        } catch (e) {
          console.warn('Fallback Apps Script check error:', e);
        }
      }

      if (legacyValid && legacyExpiresAt) {
        // Auto-provision user into database
        const expiryDate = new Date(legacyExpiresAt);
        const daysLeft = Math.max(1, Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
        user = await userDb.createUser({
          name: cleanUsername.split('@')[0],
          email: cleanUsername,
          access_key: cleanKey,
          daysDuration: daysLeft,
          notes: 'Migrado automaticamente desde Apps Script',
          role: 'student',
        });
      } else {
        return NextResponse.json(
          { error: 'Credenciales incorrectas o licencia inexistente.' },
          { status: 401 }
        );
      }
    }

    const statusInfo = computeUserEffectiveStatus(user);

    if (statusInfo.isBlocked) {
      return NextResponse.json(
        {
          error: 'Tu cuenta ha sido bloqueada o suspendida por administración. Por favor contacta a la academia para reactivar tu acceso.',
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

    const tokenExp = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days
    const tokenPayload = {
      sub: user.email,
      userId: user.id,
      role: user.role,
      exp: tokenExp,
      expiresAt: user.expires_at,
    };

    const token = await signJwt(tokenPayload, JWT_SECRET);

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

    // Hardened secure cookie
    response.cookies.set('afinapp_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
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
