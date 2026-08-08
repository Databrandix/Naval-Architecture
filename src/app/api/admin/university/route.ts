import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  requireUser,
  withErrorHandling,
  readJson,
} from '@/lib/auth-server';
import { universityUpdateSchema } from '@/lib/validation';

// GET /api/admin/university
export const GET = withErrorHandling(async () => {
  await requireUser();
  const row = await prisma.universityIdentity.findUnique({
    where: { id: 'singleton' },
  });
  return NextResponse.json({ university: row });
});

// PUT /api/admin/university
export const PUT = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const data = universityUpdateSchema.parse(body);

  const row = await prisma.universityIdentity.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', ...data },
    update: data,
  });
  return NextResponse.json({ university: row });
});
