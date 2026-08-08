import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson } from '@/lib/auth-server';
import { newsCreateSchema } from '@/lib/validation';

export const GET = withErrorHandling(async () => {
  await requireUser();
  const news = await prisma.news.findMany({ orderBy: { publishedAt: 'desc' } });
  return NextResponse.json({ news });
});

export const POST = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const parsed = newsCreateSchema.parse(body);
  const created = await prisma.news.create({
    data: {
      ...parsed,
      body: parsed.body as Prisma.InputJsonValue,
      meta: parsed.meta as unknown as Prisma.InputJsonValue,
    },
  });
  return NextResponse.json({ news: created }, { status: 201 });
});
