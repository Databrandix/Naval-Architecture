import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson } from '@/lib/auth-server';
import { laboratoryFacilityLandingUpdateSchema } from '@/lib/validation';

export const GET = withErrorHandling(async () => {
  await requireUser();
  const row = await prisma.laboratoryFacilityLanding.findUnique({ where: { id: 'singleton' } });
  return NextResponse.json({ laboratoryFacilityLanding: row });
});

export const PUT = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const parsed = laboratoryFacilityLandingUpdateSchema.parse(body);
  const data = {
    ...parsed,
    features: parsed.features as Prisma.InputJsonValue,
  };
  const row = await prisma.laboratoryFacilityLanding.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', ...data },
    update: data,
  });
  return NextResponse.json({ laboratoryFacilityLanding: row });
});
