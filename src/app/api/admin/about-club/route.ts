import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson } from '@/lib/auth-server';
import { aboutDepartmentClubUpdateSchema } from '@/lib/validation';

export const GET = withErrorHandling(async () => {
  await requireUser();
  const row = await prisma.aboutDepartmentClub.findUnique({ where: { id: 'singleton' } });
  return NextResponse.json({ aboutDepartmentClub: row });
});

export const PUT = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const parsed = aboutDepartmentClubUpdateSchema.parse(body);
  const data = {
    ...parsed,
    stats:      parsed.stats as Prisma.InputJsonValue,
    activities: parsed.activities as Prisma.InputJsonValue,
  };
  const row = await prisma.aboutDepartmentClub.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', ...data },
    update: data,
  });
  return NextResponse.json({ aboutDepartmentClub: row });
});
