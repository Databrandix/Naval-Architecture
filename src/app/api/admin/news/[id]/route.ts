import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson, ApiError } from '@/lib/auth-server';
import { newsUpdateSchema } from '@/lib/validation';

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_request, context: RouteContext) => {
  await requireUser();
  const { id } = await context.params;
  const news = await prisma.news.findUnique({ where: { id } });
  if (!news) throw new ApiError(404, 'News article not found');
  return NextResponse.json({ news });
});

export const PUT = withErrorHandling(async (request, context: RouteContext) => {
  await requireUser();
  const { id } = await context.params;
  const body = await readJson(request);
  const parsed = newsUpdateSchema.parse(body);
  try {
    const news = await prisma.news.update({
      where: { id },
      data: {
        ...parsed,
        body: parsed.body as Prisma.InputJsonValue,
        meta: parsed.meta as unknown as Prisma.InputJsonValue,
      },
    });
    return NextResponse.json({ news });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') throw new ApiError(404, 'News article not found');
    throw e;
  }
});

export const DELETE = withErrorHandling(async (_request, context: RouteContext) => {
  await requireUser();
  const { id } = await context.params;
  try {
    await prisma.news.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') throw new ApiError(404, 'News article not found');
    throw e;
  }
});
