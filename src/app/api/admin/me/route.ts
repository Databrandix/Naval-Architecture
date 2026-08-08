import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling } from '@/lib/auth-server';

// GET /api/admin/me
//   Returns the current authenticated user (with role + isActive flag
//   pulled fresh from DB; the session payload alone can be slightly
//   stale on role/active changes).
//
//   401 if not authenticated.
//
export const GET = withErrorHandling(async () => {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
  if (!user) {
    return NextResponse.json({ error: 'User no longer exists' }, { status: 401 });
  }
  return NextResponse.json({ user });
});
