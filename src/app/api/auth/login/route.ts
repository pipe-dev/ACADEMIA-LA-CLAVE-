import { NextRequest, NextResponse } from 'next/server';
import { signJwt } from '@/lib/jwt';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_keep_it_secure_key_123!';
const APPS_SCRIPT_URL = process.env.LICENSE_APPS_SCRIPT_URL;
const SHARED_SECRET = process.env.LICENSE_SHARED_SECRET;

export async function POST(request: NextRequest) {
  try {
    const { username, key } = await request.json();

    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanKey = (key || '').trim();

    if (!cleanUsername || !cleanKey) {
      return NextResponse.json({ error: 'Usuario y clave de acceso requeridos.' }, { status: 400 });
    }

    let isValid = false;
    let expiresAt: string | null = null;
    let errorMsg = 'Credenciales incorrectas o licencia expirada.';

    // Safe Fallback for local testing if Apps Script is not configured yet
    if (!APPS_SCRIPT_URL) {
      console.warn("WARNING: LICENSE_APPS_SCRIPT_URL is not defined in environment. Using local dev fallback credentials (demo@canto.com / clave123).");
      if (cleanUsername === 'demo@canto.com' && cleanKey === 'clave123') {
        isValid = true;
        const date = new Date();
        date.setDate(date.getDate() + 30);
        expiresAt = date.toISOString();
      } else {
        errorMsg = 'Servidor de licencias no configurado. Usa demo@canto.com y clave123.';
      }
    } else {
      // Query Google Apps Script Web App
      try {
        const response = await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: cleanUsername,
            key: cleanKey,
            secret: SHARED_SECRET
          }),
          // Timeout limit of 8 seconds
          signal: AbortSignal.timeout(8000)
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData.success) {
            isValid = true;
            expiresAt = resData.expiresAt;
          } else {
            errorMsg = resData.error || errorMsg;
          }
        } else {
          errorMsg = `Error en el servidor de licencias. Estado: ${response.status}`;
        }
      } catch (err) {
        console.error("Apps Script request failed:", err);
        errorMsg = 'No se pudo conectar con el servidor de licencias. Intente de nuevo más tarde.';
      }
    }

    if (!isValid || !expiresAt) {
      return NextResponse.json({ error: errorMsg }, { status: 401 });
    }

    // Generate JWT token (30 days validity)
    const tokenExp = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days
    const tokenPayload = {
      sub: cleanUsername,
      exp: tokenExp,
      expiresAt: expiresAt
    };

    const token = await signJwt(tokenPayload, JWT_SECRET);

    // Set cookie
    const response = NextResponse.json({ success: true, expiresAt });
    
    // Cookie parameters (Secure, HttpOnly, SameSite=Lax, Path=/)
    response.cookies.set('afinapp_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 // 30 days in seconds
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Ha ocurrido un error interno del servidor.' }, { status: 500 });
  }
}
