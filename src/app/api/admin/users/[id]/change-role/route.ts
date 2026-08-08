import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  requireSuperAdmin,
  withErrorHandling,
  readJson,
  ApiError,
  assertSuperAdminFloorAfterRemovingTarget,
} from '@/lib/auth-server';
import { changeRoleSchema } from '@/lib/validation';

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/admin/users/:id/change-role
//   super_admin only. Body: { role: "super_admin" | "admin" }.
//
//   Safety: demoting from super_admin → admin is blocked if the
//   target is the last active super_admin. Promotion is unconditional.
//
export const POST = withErrorHandling(async (request, context: RouteContext) => {
  await requireSuperAdmin();
  const { id } = await context.params;
  const body = await readJson(request);
  const { role: newRole } = changeRoleSchema.parse(body);

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, isActive: true },
  });
  if (!target) throw new ApiError(404, 'User not found');

  const wasActiveSuper = target.role === 'super_admin' && target.isActive;
  const willBeSuper = newRole === 'super_admin';

  if (wasActiveSuper && !willBeSuper) {
    await assertSuperAdminFloorAfterRemovingTarget(id);
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role: newRole },
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
  return NextResponse.json({ user });
});
