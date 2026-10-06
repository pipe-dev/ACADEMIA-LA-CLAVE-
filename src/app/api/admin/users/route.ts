import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest, getCorsHeaders } from '@/lib/adminAuth';
import { userDb, computeUserEffectiveStatus } from '@/lib/userDb';
import { sanitizeString, sanitizeEmail, sanitizeAccessKey } from '@/lib/securityService';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}

export async function GET(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json({ error: 'No autorizado como administrador.' }, { status: 401, headers: getCorsHeaders() });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || undefined;

    const rawUsers = await userDb.listUsers(search);

    let activeCount = 0;
    let expiredCount = 0;
    let blockedCount = 0;

    const usersWithMeta = await Promise.all(
      rawUsers.map(async (u) => {
        const computed = computeUserEffectiveStatus(u);
        if (computed.status === 'active') activeCount++;
        else if (computed.status === 'expired') expiredCount++;
        else if (computed.status === 'blocked') blockedCount++;

        const progress = await userDb.getUserProgress(u.id);

        return {
          ...u,
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
        };
      })
    );

    return NextResponse.json({
      success: true,
      users: usersWithMeta,
      stats: {
        total: rawUsers.length,
        active: activeCount,
        expired: expiredCount,
        blocked: blockedCount,
      },
    }, { headers: getCorsHeaders() });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error al listar usuarios.' },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json({ error: 'No autorizado como administrador.' }, { status: 401, headers: getCorsHeaders() });
  }

  try {
    const body = await request.json();
    const { name, email, access_key, daysDuration, notes } = body;

    const cleanName = sanitizeString(name, 80);
    const cleanEmail = sanitizeEmail(email);

    if (!cleanName) {
      return NextResponse.json({ error: 'El nombre es requerido.' }, { status: 400, headers: getCorsHeaders() });
    }
    if (!cleanEmail) {
      return NextResponse.json({ error: 'El correo electronico es invalido o requerido.' }, { status: 400, headers: getCorsHeaders() });
    }

    const existing = await userDb.getUserByEmail(cleanEmail);
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un alumno registrado con este correo electronico.' },
        { status: 409, headers: getCorsHeaders() }
      );
    }

    let finalKey = sanitizeAccessKey(access_key);
    if (!finalKey) {
      finalKey = `CANT-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const cleanNotes = sanitizeString(notes, 300);

    const created = await userDb.createUser({
      name: cleanName,
      email: cleanEmail,
      access_key: finalKey,
      daysDuration: typeof daysDuration === 'number' && daysDuration > 0 ? daysDuration : 30,
      notes: cleanNotes,
      role: 'student',
    });

    const computed = computeUserEffectiveStatus(created);

    return NextResponse.json({
      success: true,
      user: {
        ...created,
        effectiveStatus: computed.status,
        daysRemaining: computed.daysRemaining,
      },
    }, { headers: getCorsHeaders() });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error al crear alumno.' },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}
