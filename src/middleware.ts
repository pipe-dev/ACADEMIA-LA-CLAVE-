import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwt } from './lib/jwt';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_keep_it_secure_key_123!';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedPath = 
    pathname.startsWith('/clases') || 
    pathname.startsWith('/afinador') || 
    pathname.startsWith('/progreso');

  if (isProtectedPath) {
    const sessionCookie = request.cookies.get('afinapp_session')?.value;

    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const payload = await verifyJwt(sessionCookie, JWT_SECRET);
    if (!payload) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('afinapp_session');
      return response;
    }
  }

  if (pathname.startsWith('/login')) {
    const sessionCookie = request.cookies.get('afinapp_session')?.value;
    if (sessionCookie) {
      const payload = await verifyJwt(sessionCookie, JWT_SECRET);
      if (payload) {
        return NextResponse.redirect(new URL('/clases', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/clases/:path*',
    '/afinador/:path*',
    '/progreso/:path*',
    '/login',
  ],
};
