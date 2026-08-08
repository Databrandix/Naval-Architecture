import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson } from '@/lib/auth-server';
import { admissionTransferCreditsUpdateSchema } from '@/lib/validation';

export const GET = withErrorHandling(async () => {
  await requireUser();
  const item = await prisma.admissionTransferCredits.findUnique({ where: { id: 'singleton' } });
  return NextResponse.json({ item });
});

export const PUT = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const parsed = admissionTransferCreditsUpdateSchema.parse(body);
  const data = {
    ...parsed,
    minimumGradeBullets: parsed.minimumGradeBullets as unknown as Prisma.InputJsonValue,
    documents:           parsed.documents           as unknown as Prisma.InputJsonValue,
    summaryRows:         parsed.summaryRows         as unknown as Prisma.InputJsonValue,
  };
  const item = await prisma.admissionTransferCredits.upsert({
    where:  { id: 'singleton' },
    create: { id: 'singleton', ...data },
    update: data,
  });
  return NextResponse.json({ item });
});
