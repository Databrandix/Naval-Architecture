import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson, ApiError } from '@/lib/auth-server';
import { laboratoryLabUpdateSchema } from '@/lib/validation';

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_request, context: RouteContext) => {
  await requireUser();
  const { id } = await context.params;
  const lab = await prisma.laboratoryLab.findUnique({ where: { id } });
  if (!lab) throw new ApiError(404, 'Laboratory not found');
  return NextResponse.json({ laboratoryLab: lab });
});

export const PUT = withErrorHandling(async (request, context: RouteContext) => {
  await requireUser();
  const { id } = await context.params;
  const body = await readJson(request);
  const data = laboratoryLabUpdateSchema.parse(body);
  try {
    const lab = await prisma.laboratoryLab.update({ where: { id }, data });
    return NextResponse.json({ laboratoryLab: lab });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') throw new ApiError(404, 'Laboratory not found');
    throw e;
  }
});

export const DELETE = withErrorHandling(async (_request, context: RouteContext) => {
  await requireUser();
  const { id } = await context.params;
  try {
    await prisma.laboratoryLab.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') throw new ApiError(404, 'Laboratory not found');
    throw e;
  }
});
