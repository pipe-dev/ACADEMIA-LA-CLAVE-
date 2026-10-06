import { NextRequest } from 'next/server';

const MASTER_ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin_master_clave_laclave_2026!';

export function verifyAdminRequest(request: NextRequest): boolean {
  const headerKey = request.headers.get('x-admin-key');
  if (headerKey && headerKey.trim() === MASTER_ADMIN_SECRET.trim()) {
    return true;
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    if (token === MASTER_ADMIN_SECRET.trim()) {
      return true;
    }
  }

  return false;
}
