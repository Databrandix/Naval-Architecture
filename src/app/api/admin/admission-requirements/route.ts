import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson } from '@/lib/auth-server';
import { admissionRequirementsUpdateSchema } from '@/lib/validation';

export const GET = withErrorHandling(async () => {
  await requireUser();
  const item = await prisma.admissionRequirements.findUnique({ where: { id: 'singleton' } });
  return NextResponse.json({ item });
});

export const PUT = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const parsed = admissionRequirementsUpdateSchema.parse(body);
  const data = {
    intro:                     parsed.intro,
    undergraduateRequirements: parsed.undergraduateRequirements as unknown as Prisma.InputJsonValue,
    additionalNotes:           parsed.additionalNotes           as unknown as Prisma.InputJsonValue,
    diplomaRequirements:       parsed.diplomaRequirements       as unknown as Prisma.InputJsonValue,
    combinedGpaBody:           parsed.combinedGpaBody,
    diplomaQuickCriteria:      parsed.diplomaQuickCriteria      as unknown as Prisma.InputJsonValue,
  };
  const item = await prisma.admissionRequirements.upsert({
    where:  { id: 'singleton' },
    create: { id: 'singleton', ...data },
    update: data,
  });
  return NextResponse.json({ item });
});
