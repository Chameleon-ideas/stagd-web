import { NextResponse, NextRequest } from 'next/server';

/*
OLD IMPLEMENTATION (kept intentionally):

import { NextResponse, NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authorized = request.cookies.get('authorized')?.value === 'true';

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/login') ||
    pathname.includes('.') ||
    authorized
  ) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
*/

// NEW (Next 16): middleware convention renamed to proxy.
// Legacy password-gate stays disabled so Supabase auth routes can work.
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
