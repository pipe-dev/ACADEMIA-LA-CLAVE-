import { NextRequest } from 'next/server';

export function getAdminSecret(): string {
  return (process.env.ADMIN_SECRET || '').trim();
}

export function verifyAdminRequest(request: NextRequest): boolean {
  const secret = getAdminSecret();
  if (!secret) {
    return false;
  }

  const headerKey = request.headers.get('x-admin-key');
  if (headerKey && headerKey.trim() === secret) {
    return true;
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    if (token === secret) {
      return true;
    }
  }

  return false;
}

export function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-key',
  };
}
