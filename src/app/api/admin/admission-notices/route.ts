import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson } from '@/lib/auth-server';
import { admissionNoticeCreateSchema } from '@/lib/validation';

export const GET = withErrorHandling(async () => {
  await requireUser();
  const items = await prisma.admissionNotice.findMany({ orderBy: { displayOrder: 'asc' } });
  return NextResponse.json({ items });
});

export const POST = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const parsed = admissionNoticeCreateSchema.parse(body);
  const last = await prisma.admissionNotice.findFirst({ orderBy: { displayOrder: 'desc' }, select: { displayOrder: true } });
  const displayOrder = (last?.displayOrder ?? -1) + 1;
  const item = await prisma.admissionNotice.create({
    data: {
      ...parsed,
      bodyParagraphs: parsed.bodyParagraphs as Prisma.InputJsonValue,
      ccList:         parsed.ccList         as Prisma.InputJsonValue,
      displayOrder,
    },
  });
  return NextResponse.json({ item }, { status: 201 });
});
