import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwt } from './lib/jwt';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_keep_it_secure_key_123!';

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');
  return res;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public assets and API bypass
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/admin.html') ||
    pathname.startsWith('/sounds') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/workbox') ||
    pathname.includes('.') // Static files like favicon.ico, manifest.json
  ) {
    return applySecurityHeaders(NextResponse.next());
  }

  // 2. Legacy multi-page route aliases redirect cleanly to SPA root /
  if (
    pathname.startsWith('/clases') ||
    pathname.startsWith('/afinador') ||
    pathname.startsWith('/progreso')
  ) {
    return applySecurityHeaders(NextResponse.redirect(new URL('/', request.url)));
  }

  const sessionCookie = request.cookies.get('afinapp_session')?.value;
  let sessionPayload = null;

  if (sessionCookie) {
    sessionPayload = await verifyJwt(sessionCookie, JWT_SECRET);
  }

  // 3. Login page handling
  if (pathname.startsWith('/login')) {
    if (sessionPayload && sessionPayload.sub) {
      // Already authenticated, redirect to app root
      return applySecurityHeaders(NextResponse.redirect(new URL('/', request.url)));
    }
    return applySecurityHeaders(NextResponse.next());
  }

  // 4. Protected main app routes (root /)
  if (!sessionPayload || !sessionPayload.sub) {
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    // Remove invalid cookie if present
    if (sessionCookie) {
      response.cookies.delete('afinapp_session');
    }
    return applySecurityHeaders(response);
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
