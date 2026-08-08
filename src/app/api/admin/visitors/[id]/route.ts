import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson, ApiError } from '@/lib/auth-server';
import { visitorUpdateSchema } from '@/lib/validation';

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_request, context: RouteContext) => {
  await requireUser();
  const { id } = await context.params;
  const visitor = await prisma.visitor.findUnique({ where: { id } });
  if (!visitor) throw new ApiError(404, 'Visitor not found');
  return NextResponse.json({ visitor });
});

export const PUT = withErrorHandling(async (request, context: RouteContext) => {
  await requireUser();
  const { id } = await context.params;
  const body = await readJson(request);
  const parsed = visitorUpdateSchema.parse(body);
  try {
    const visitor = await prisma.visitor.update({
      where: { id },
      data: { ...parsed, quote: parsed.quote as Prisma.InputJsonValue },
    });
    return NextResponse.json({ visitor });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') throw new ApiError(404, 'Visitor not found');
    throw e;
  }
});

export const DELETE = withErrorHandling(async (_request, context: RouteContext) => {
  await requireUser();
  const { id } = await context.params;
  try {
    await prisma.visitor.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') throw new ApiError(404, 'Visitor not found');
    throw e;
  }
});
