import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/adminAuth';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE_PATH = path.join(DATA_DIR, 'afinapp_db.json');

export async function GET(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json({ error: 'No autorizado como administrador.' }, { status: 401 });
  }

  try {
    if (!fs.existsSync(DB_FILE_PATH)) {
      return NextResponse.json({ error: 'Base de datos no inicializada.' }, { status: 404 });
    }

    const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    const data = JSON.parse(raw);

    return NextResponse.json({
      success: true,
      exportedAt: new Date().toISOString(),
      backup: data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json({ error: 'No autorizado como administrador.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const backupData = body.backup || body;

    if (!backupData || !Array.isArray(backupData.users)) {
      return NextResponse.json(
        { error: 'Archivo de copia de seguridad invalido. Falta lista de usuarios.' },
        { status: 400 }
      );
    }

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(backupData, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Copia de seguridad restaurada exitosamente.',
      usersCount: backupData.users.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
