import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { auth } from '@/lib/auth';

// GET /admin/logout
//   Revokes the current session row, clears the Better Auth cookie,
//   and redirects to /admin/login. Reached either by the sidebar's
//   client fetch (POST /api/auth/sign-out, which clears cookie via
//   Better Auth's response) or by a direct browser visit to this URL.
export async function GET(request: Request) {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    /* session may already be invalid or revoked; proceed to clear cookie */
  }
  const cookieStore = await cookies();
  cookieStore.delete('better-auth.session_token');
  return NextResponse.redirect(new URL('/admin/login', request.url));
}
