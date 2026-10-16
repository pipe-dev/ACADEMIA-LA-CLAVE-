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
      if (updates.name !== undefined) sanitizedUpdates.name = sanitizeString(updates.name, 80);
      if (updates.notes !== undefined) sanitizedUpdates.notes = sanitizeString(updates.notes, 500);
      if (updates.email !== undefined) sanitizedUpdates.email = sanitizeEmail(updates.email);
      if (updates.access_key !== undefined) sanitizedUpdates.access_key = sanitizeAccessKey(updates.access_key);
      if (updates.status !== undefined && (updates.status === 'active' || updates.status === 'blocked')) {
        sanitizedUpdates.status = updates.status;
      }
      if (updates.role !== undefined && (updates.role === 'student' || updates.role === 'admin')) {
        sanitizedUpdates.role = updates.role;
      }

      // Sumatoria acumulativa de dias cuando hay dias restantes
      if (typeof updates.addDays === 'number' && updates.addDays > 0) {
        const currentExpiry = new Date(user.expires_at).getTime();
        const now = Date.now();
        const baseTime = currentExpiry > now ? currentExpiry : now;
        sanitizedUpdates.expires_at = new Date(
          baseTime + updates.addDays * 24 * 60 * 60 * 1000
        ).toISOString();
        sanitizedUpdates.status = 'active';
      } else if (updates.expires_at) {
        sanitizedUpdates.expires_at = new Date(updates.expires_at).toISOString();
      }

      updated = await userDb.updateUser(id, sanitizedUpdates);

      // Edicion de nivel, XP y racha de gamificacion
      if (
        updates.level !== undefined ||
        updates.xp !== undefined ||
        updates.streak !== undefined
      ) {
        const existingProgress = await userDb.getUserProgress(user.id);
        await userDb.saveUserProgress({
          userId: user.id,
          userEmail: sanitizedUpdates.email || user.email,
          level: updates.level !== undefined ? Math.max(1, Number(updates.level)) : (existingProgress?.level ?? 1),
          xp: updates.xp !== undefined ? Math.max(0, Number(updates.xp)) : (existingProgress?.xp ?? 0),
          streak: updates.streak !== undefined ? Math.max(0, Number(updates.streak)) : (existingProgress?.streak ?? 0),
          progressData: existingProgress?.progress_data || '{}',
        });
      }
    }

    if (!updated) {
      return NextResponse.json({ error: 'No se pudo actualizar el usuario.' }, { status: 500, headers: getCorsHeaders() });
    }

    const computed = computeUserEffectiveStatus(updated);
    const progress = await userDb.getUserProgress(updated.id);

    return NextResponse.json({
      success: true,
      user: {
        ...updated,
        effectiveStatus: computed.status,
        daysRemaining: computed.daysRemaining,
        progress: progress
          ? {
              xp: progress.xp,
              level: progress.level,
              streak: progress.streak,
              updatedAt: progress.updated_at,
            }
          : null,
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
