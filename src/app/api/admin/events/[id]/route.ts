import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson, ApiError } from '@/lib/auth-server';
import { eventUpdateSchema } from '@/lib/validation';

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_request, context: RouteContext) => {
  await requireUser();
  const { id } = await context.params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw new ApiError(404, 'Event not found');
  return NextResponse.json({ event });
});

export const PUT = withErrorHandling(async (request, context: RouteContext) => {
  await requireUser();
  const { id } = await context.params;
  const body = await readJson(request);
  const parsed = eventUpdateSchema.parse(body);
  try {
    const event = await prisma.event.update({
      where: { id },
      data: {
        ...parsed,
        description: parsed.description as Prisma.InputJsonValue,
        details: parsed.details as unknown as Prisma.InputJsonValue,
      },
    });
    return NextResponse.json({ event });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') throw new ApiError(404, 'Event not found');
    throw e;
  }
});

export const DELETE = withErrorHandling(async (_request, context: RouteContext) => {
  await requireUser();
  const { id } = await context.params;
  try {
    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') throw new ApiError(404, 'Event not found');
    throw e;
  }
});
