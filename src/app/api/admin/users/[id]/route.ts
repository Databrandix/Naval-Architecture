import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  requireSuperAdmin,
  withErrorHandling,
  readJson,
  ApiError,
  assertSuperAdminFloorAfterRemovingTarget,
} from '@/lib/auth-server';
import { userUpdateSchema } from '@/lib/validation';

type RouteContext = { params: Promise<{ id: string }> };

const PUBLIC_USER_FIELDS = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

// GET /api/admin/users/:id  — super_admin only
export const GET = withErrorHandling(async (_request, context: RouteContext) => {
  await requireSuperAdmin();
  const { id } = await context.params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: PUBLIC_USER_FIELDS,
  });
  if (!user) throw new ApiError(404, 'User not found');
  return NextResponse.json({ user });
});

// PUT /api/admin/users/:id
//   super_admin only. Partial update: name, role, isActive.
//
//   Safety rules:
//     - If target is currently an active super_admin AND the change
//       would remove them from the active-super_admin set
//       (role → admin, OR isActive → false), assert the floor.
//     - Deactivation also revokes all of the target's sessions so
//       they lose access immediately.
//
export const PUT = withErrorHandling(async (request, context: RouteContext) => {
  await requireSuperAdmin();
  const { id } = await context.params;
  const body = await readJson(request);
  const data = userUpdateSchema.parse(body);

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, isActive: true },
  });
  if (!target) throw new ApiError(404, 'User not found');

  // Was target an active super_admin BEFORE this change?
  const wasActiveSuper = target.role === 'super_admin' && target.isActive;

  // Will the change demote / deactivate them?
  const willBeSuper =
    data.role !== undefined ? data.role === 'super_admin' : target.role === 'super_admin';
  const willBeActive =
    data.isActive !== undefined ? data.isActive : target.isActive;
  const willBeActiveSuper = willBeSuper && willBeActive;

  if (wasActiveSuper && !willBeActiveSuper) {
    await assertSuperAdminFloorAfterRemovingTarget(id);
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: PUBLIC_USER_FIELDS,
  });

  // If we just deactivated the user, kill their sessions so loss of
  // access is immediate.
  if (target.isActive && data.isActive === false) {
    await prisma.session.deleteMany({ where: { userId: id } });
  }

  return NextResponse.json({ user: updated });
});

// DELETE /api/admin/users/:id  — super_admin only
//   Sessions and Accounts cascade-delete via the schema relations.
//   Safety: blocks if target is the last active super_admin.
export const DELETE = withErrorHandling(async (_request, context: RouteContext) => {
  await requireSuperAdmin();
  const { id } = await context.params;

  const target = await prisma.user.findUnique({
    where: { id },
    select: { role: true, isActive: true },
  });
  if (!target) throw new ApiError(404, 'User not found');

  if (target.role === 'super_admin' && target.isActive) {
    await assertSuperAdminFloorAfterRemovingTarget(id);
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
