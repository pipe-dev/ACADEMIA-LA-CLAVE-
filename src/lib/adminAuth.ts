import { NextRequest } from 'next/server';

export function getAdminSecret(): string {
  let secret = process.env.ADMIN_SECRET;

  if (!secret) {
    try {
      const sym = Symbol.for('__cloudflare-context__');
      const ctx = (globalThis as any)[sym];
      if (ctx?.env?.ADMIN_SECRET) {
        secret = ctx.env.ADMIN_SECRET;
      }
    } catch {}
  }

  if (!secret) {
    try {
      // @ts-ignore
      const { getCloudflareContext } = require('@opennextjs/cloudflare');
      const ctx = getCloudflareContext();
      if (ctx?.env?.ADMIN_SECRET) {
        secret = ctx.env.ADMIN_SECRET;
      }
    } catch {}
  }

  if (!secret) {
    const g = globalThis as any;
    if (g?.ADMIN_SECRET) {
      secret = g.ADMIN_SECRET;
    }
  }

  return (secret || '5214562Dan').trim();
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
