import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/securityService';
import { getCorsHeaders, getAdminSecret } from '@/lib/adminAuth';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request.headers);
    const rateLimit = checkRateLimit(`admin_verify_${clientIp}`, 10, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Demasiados intentos fallidos. Acceso temporalmente bloqueado.' },
        { status: 429, headers: getCorsHeaders() }
      );
    }

    const body = await request.json().catch(() => ({}));
    const key = body.adminKey || request.headers.get('x-admin-key');
    const secret = getAdminSecret();

    if (!secret || !key || key.trim() !== secret) {
      return NextResponse.json(
        { error: 'Clave maestra de administrador invalida.' },
        { status: 401, headers: getCorsHeaders() }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Acceso de administrador autorizado.',
      },
      { headers: getCorsHeaders() }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error en validacion de administrador.' },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}
