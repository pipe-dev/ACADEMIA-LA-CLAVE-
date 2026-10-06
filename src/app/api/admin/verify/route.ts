import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/securityService';

const MASTER_ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin_master_clave_laclave_2026!';

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request.headers);
    const rateLimit = checkRateLimit(`admin_verify_${clientIp}`, 10, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Demasiados intentos fallidos. Acceso temporalmente bloqueado.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const key = body.adminKey || request.headers.get('x-admin-key');

    if (!key || key.trim() !== MASTER_ADMIN_SECRET.trim()) {
      return NextResponse.json(
        { error: 'Clave maestra de administrador invalida.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Acceso de administrador autorizado.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error en validacion de administrador.' },
      { status: 500 }
    );
  }
}
