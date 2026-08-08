import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson } from '@/lib/auth-server';
import { waiverCategoryCreateSchema } from '@/lib/validation';

export const GET = withErrorHandling(async () => {
  await requireUser();
  const items = await prisma.waiverCategory.findMany({ orderBy: { displayOrder: 'asc' } });
  return NextResponse.json({ items });
});

export const POST = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const parsed = waiverCategoryCreateSchema.parse(body);
  const last = await prisma.waiverCategory.findFirst({ orderBy: { displayOrder: 'desc' }, select: { displayOrder: true } });
  const displayOrder = (last?.displayOrder ?? -1) + 1;
  const item = await prisma.waiverCategory.create({
    data: {
      ...parsed,
      items: parsed.items as unknown as Prisma.InputJsonValue,
      displayOrder,
    },
  });
  return NextResponse.json({ item }, { status: 201 });
});
