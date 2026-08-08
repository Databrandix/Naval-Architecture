import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson } from '@/lib/auth-server';
import { waiverScholarshipLandingUpdateSchema } from '@/lib/validation';

export const GET = withErrorHandling(async () => {
  await requireUser();
  const item = await prisma.waiverScholarshipLanding.findUnique({ where: { id: 'singleton' } });
  return NextResponse.json({ item });
});

export const PUT = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const parsed = waiverScholarshipLandingUpdateSchema.parse(body);
  const data = {
    ...parsed,
    summaryRows:  parsed.summaryRows  as unknown as Prisma.InputJsonValue,
    keyTakeaways: parsed.keyTakeaways as unknown as Prisma.InputJsonValue,
  };
  const item = await prisma.waiverScholarshipLanding.upsert({
    where:  { id: 'singleton' },
    create: { id: 'singleton', ...data },
    update: data,
  });
  return NextResponse.json({ item });
});
