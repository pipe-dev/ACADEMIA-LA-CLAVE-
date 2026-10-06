import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest, getCorsHeaders } from '@/lib/adminAuth';
import { userDb, computeUserEffectiveStatus } from '@/lib/userDb';
import { sanitizeString, sanitizeEmail, sanitizeAccessKey } from '@/lib/securityService';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json({ error: 'No autorizado como administrador.' }, { status: 401, headers: getCorsHeaders() });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { action, days, ...updates } = body;

    const user = await userDb.getUserById(id);
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404, headers: getCorsHeaders() });
    }

    let updated = null;

    if (action === 'renew') {
      const additionalDays = typeof days === 'number' && days > 0 ? days : 30;
      updated = await userDb.renewUser(id, additionalDays);
    } else if (action === 'toggle_block') {
      updated = await userDb.toggleUserBlock(id);
    } else {
      const sanitizedUpdates: Record<string, any> = {};
      if (updates.name) sanitizedUpdates.name = sanitizeString(updates.name, 80);
      if (updates.notes) sanitizedUpdates.notes = sanitizeString(updates.notes, 300);
      if (updates.email) sanitizedUpdates.email = sanitizeEmail(updates.email);
      if (updates.access_key) sanitizedUpdates.access_key = sanitizeAccessKey(updates.access_key);
      if (updates.expires_at) sanitizedUpdates.expires_at = updates.expires_at;
      if (updates.status) sanitizedUpdates.status = updates.status;
      updated = await userDb.updateUser(id, sanitizedUpdates);
    }

    if (!updated) {
      return NextResponse.json({ error: 'No se pudo actualizar el usuario.' }, { status: 500, headers: getCorsHeaders() });
    }

    const computed = computeUserEffectiveStatus(updated);

    return NextResponse.json({
      success: true,
      user: {
        ...updated,
        effectiveStatus: computed.status,
        daysRemaining: computed.daysRemaining,
      },
    }, { headers: getCorsHeaders() });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error al actualizar usuario.' },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json({ error: 'No autorizado como administrador.' }, { status: 401, headers: getCorsHeaders() });
  }

  try {
    const { id } = await context.params;
    const user = await userDb.getUserById(id);
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404, headers: getCorsHeaders() });
    }

    await userDb.deleteUser(id);

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado exitosamente.',
    }, { headers: getCorsHeaders() });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error al eliminar usuario.' },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}
