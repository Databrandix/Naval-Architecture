import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

// Two jobs:
//   1. Set an `x-pathname` request header on every page request so
//      server components (root layout) can make pathname-aware
//      rendering decisions — replaces the client-side usePathname
//      guards that were prone to SSR/client hydration mismatches.
//   2. Gate /admin/* behind a session cookie (cheap edge check;
//      full session validation in the (authed) layout).
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pass the current pathname to the React server tree via a header.
  const reqHeaders = new Headers(request.headers);
  reqHeaders.set('x-pathname', pathname);

  // /admin/* — auth-gated, with the exception of /admin/login and
  // /admin/logout which must always be reachable.
  const isAdminRoute =
    pathname === '/admin' || pathname.startsWith('/admin/');
  const isAdminPublic =
    pathname === '/admin/login' || pathname === '/admin/logout';

  if (isAdminRoute && !isAdminPublic) {
    const sessionCookie = getSessionCookie(request);
    if (!sessionCookie) {
      const url = new URL('/admin/login', request.url);
      if (pathname !== '/admin') {
        url.searchParams.set('redirect', pathname);
      }
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next({ request: { headers: reqHeaders } });
}

// Match every page route. Skip Next.js internals, API routes, and
// static assets — middleware only needs to run on requests that
// will render React (so the layout can read x-pathname).
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|assets/).*)',
  ],
};
