import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson, ApiError } from '@/lib/auth-server';
import { admissionNoticeUpdateSchema } from '@/lib/validation';

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_request, context: RouteContext) => {
  await requireUser();
  const { id } = await context.params;
  const item = await prisma.admissionNotice.findUnique({ where: { id } });
  if (!item) throw new ApiError(404, 'Admission notice not found');
  return NextResponse.json({ item });
});

export const PUT = withErrorHandling(async (request, context: RouteContext) => {
  await requireUser();
  const { id } = await context.params;
  const body = await readJson(request);
  const data = admissionNoticeUpdateSchema.parse(body);
  try {
    const item = await prisma.admissionNotice.update({
      where: { id },
      data: {
        ...data,
        bodyParagraphs: data.bodyParagraphs as Prisma.InputJsonValue,
        ccList:         data.ccList         as Prisma.InputJsonValue,
      },
    });
    return NextResponse.json({ item });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') throw new ApiError(404, 'Admission notice not found');
    throw e;
  }
});

export const DELETE = withErrorHandling(async (_request, context: RouteContext) => {
  await requireUser();
  const { id } = await context.params;
  try {
    await prisma.admissionNotice.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') throw new ApiError(404, 'Admission notice not found');
    throw e;
  }
});
