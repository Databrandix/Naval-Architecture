import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson, ApiError } from '@/lib/auth-server';
import { transportLandingUpdateSchema } from '@/lib/validation';

export const GET = withErrorHandling(async () => {
  await requireUser();
  const landing = await prisma.transportLanding.findUnique({ where: { id: 'singleton' } });
  if (!landing) throw new ApiError(404, 'TransportLanding singleton not seeded');
  return NextResponse.json({ landing });
});

export const PUT = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const parsed = transportLandingUpdateSchema.parse(body);
  const data = {
    ...parsed,
    instructions: parsed.instructions as unknown as Prisma.InputJsonValue,
  };
  const landing = await prisma.transportLanding.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', ...data },
    update: data,
  });
  return NextResponse.json({ landing });
});
