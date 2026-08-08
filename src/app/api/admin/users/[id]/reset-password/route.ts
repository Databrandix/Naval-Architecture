import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  requireSuperAdmin,
  withErrorHandling,
  readJson,
  ApiError,
} from '@/lib/auth-server';
import { resetPasswordSchema } from '@/lib/validation';

const BCRYPT_ROUNDS = 12;

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/admin/users/:id/reset-password
//   super_admin only. Sets a new password on the target user's
//   credential account and revokes every session for that user
//   (forces a re-login with the new password).
export const POST = withErrorHandling(async (request, context: RouteContext) => {
  await requireSuperAdmin();
  const { id } = await context.params;
  const body = await readJson(request);
  const { newPassword } = resetPasswordSchema.parse(body);

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, accounts: { where: { providerId: 'credential' } } },
  });
  if (!target) throw new ApiError(404, 'User not found');
  if (target.accounts.length === 0) {
    throw new ApiError(500, 'User has no credential account (data corruption?)');
  }

  const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await prisma.$transaction([
    prisma.account.update({
      where: { id: target.accounts[0].id },
      data: { password: hash },
    }),
    prisma.session.deleteMany({ where: { userId: id } }),
  ]);

  return NextResponse.json({ ok: true });
});
