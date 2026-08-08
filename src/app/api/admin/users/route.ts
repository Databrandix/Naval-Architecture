import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  requireSuperAdmin,
  withErrorHandling,
  readJson,
  ApiError,
} from '@/lib/auth-server';
import { userCreateSchema } from '@/lib/validation';

const BCRYPT_ROUNDS = 12;

// GET /api/admin/users
//   super_admin only. Lists every admin user.
export const GET = withErrorHandling(async () => {
  await requireSuperAdmin();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
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
  return NextResponse.json({ users });
});

// POST /api/admin/users
//   super_admin only. Creates a new admin account.
//   Hashes the password with bcryptjs and writes the credential
//   Account row (Better Auth's storage convention).
export const POST = withErrorHandling(async (request) => {
  await requireSuperAdmin();
  const body = await readJson(request);
  const parsed = userCreateSchema.parse(body);
  const email = parsed.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(409, 'A user with this email already exists');
  }

  const hash = await bcrypt.hash(parsed.password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email,
      name: parsed.name,
      role: parsed.role,
      isActive: true,
    },
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

  await prisma.account.create({
    data: {
      userId: user.id,
      providerId: 'credential',
      accountId: user.id,
      password: hash,
    },
  });

  return NextResponse.json({ user }, { status: 201 });
});
