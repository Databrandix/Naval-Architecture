import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession, withErrorHandling, ApiError } from '@/lib/auth-server';

// GET /api/admin/dashboard
//   Returns:
//     - programsCount             (visible to any authenticated admin)
//     - researchAreasCount        (   "                              )
//     - adminUsersCount           (super_admin only — null otherwise)
//     - previousLoginAt           (current user's previous login time,
//                                  i.e. the createdAt of their session
//                                  immediately before the active one;
//                                  null on first-ever login)
//
//   The "previous login" is derived from session.createdAt history,
//   so it represents an actual sign-in event rather than the freshly
//   bumped lastLoginAt column on user.
//
export const GET = withErrorHandling(async () => {
  const session = await getSession();
  if (!session?.user || !session?.session) {
    throw new ApiError(401, 'Not authenticated');
  }
  const isSuperAdmin = session.user.role === 'super_admin';

  const [programsCount, researchAreasCount, facultyCount, adminUsersCount, previousSession] =
    await Promise.all([
      prisma.program.count(),
      prisma.researchArea.count(),
      prisma.faculty.count(),
      isSuperAdmin ? prisma.user.count() : Promise.resolve(null),
      prisma.session.findFirst({
        where: {
          userId: session.user.id,
          createdAt: { lt: session.session.createdAt },
        },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

  return NextResponse.json({
    programsCount,
    researchAreasCount,
    facultyCount,
    adminUsersCount,                          // null when caller isn't super_admin
    previousLoginAt: previousSession?.createdAt ?? null,
    currentUser: {
      id:    session.user.id,
      name:  session.user.name,
      email: session.user.email,
      role:  session.user.role,
    },
  });
});
