import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson } from '@/lib/auth-server';
import { aboutOverviewUpdateSchema } from '@/lib/validation';

export const GET = withErrorHandling(async () => {
  await requireUser();
  const row = await prisma.aboutOverview.findUnique({ where: { id: 'singleton' } });
  return NextResponse.json({ aboutOverview: row });
});

export const PUT = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const data = aboutOverviewUpdateSchema.parse(body);
  const row = await prisma.aboutOverview.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', ...data },
    update: data,
  });
  return NextResponse.json({ aboutOverview: row });
});
