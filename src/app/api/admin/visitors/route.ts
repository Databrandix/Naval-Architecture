import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson } from '@/lib/auth-server';
import { visitorCreateSchema } from '@/lib/validation';

export const GET = withErrorHandling(async () => {
  await requireUser();
  const visitors = await prisma.visitor.findMany({ orderBy: { displayOrder: 'asc' } });
  return NextResponse.json({ visitors });
});

export const POST = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const parsed = visitorCreateSchema.parse(body);
  const last = await prisma.visitor.findFirst({ orderBy: { displayOrder: 'desc' }, select: { displayOrder: true } });
  const displayOrder = (last?.displayOrder ?? -1) + 1;
  const visitor = await prisma.visitor.create({
    data: {
      ...parsed,
      quote: parsed.quote as Prisma.InputJsonValue,
      displayOrder,
    },
  });
  return NextResponse.json({ visitor }, { status: 201 });
});
