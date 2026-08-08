import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson } from '@/lib/auth-server';
import { labFacilityLandingUpdateSchema } from '@/lib/validation';

export const GET = withErrorHandling(async () => {
  await requireUser();
  const row = await prisma.labFacilityLanding.findUnique({ where: { id: 'singleton' } });
  return NextResponse.json({ labFacilityLanding: row });
});

export const PUT = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const data = labFacilityLandingUpdateSchema.parse(body);
  const row = await prisma.labFacilityLanding.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', ...data },
    update: data,
  });
  return NextResponse.json({ labFacilityLanding: row });
});
