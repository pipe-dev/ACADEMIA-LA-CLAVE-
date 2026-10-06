import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/adminAuth';
import { userDb, computeUserEffectiveStatus } from '@/lib/userDb';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json({ error: 'No autorizado como administrador.' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { action, days, ...updates } = body;

    const user = await userDb.getUserById(id);
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }

    let updated = null;

    if (action === 'renew') {
      const additionalDays = typeof days === 'number' && days > 0 ? days : 30;
      updated = await userDb.renewUser(id, additionalDays);
    } else if (action === 'toggle_block') {
      updated = await userDb.toggleUserBlock(id);
    } else if (action === 'update') {
      updated = await userDb.updateUser(id, updates);
    } else {
      updated = await userDb.updateUser(id, updates);
    }

    if (!updated) {
      return NextResponse.json({ error: 'No se pudo actualizar el usuario.' }, { status: 500 });
    }

    const computed = computeUserEffectiveStatus(updated);

    return NextResponse.json({
      success: true,
      user: {
        ...updated,
        effectiveStatus: computed.status,
        daysRemaining: computed.daysRemaining,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error al actualizar usuario.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json({ error: 'No autorizado como administrador.' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const user = await userDb.getUserById(id);
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }

    await userDb.deleteUser(id);

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado exitosamente.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error al eliminar usuario.' },
      { status: 500 }
    );
  }
}
