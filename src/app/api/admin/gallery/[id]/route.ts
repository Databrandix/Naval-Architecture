import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson, ApiError } from '@/lib/auth-server';
import { galleryImageUpdateSchema } from '@/lib/validation';

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_request, context: RouteContext) => {
  await requireUser();
  const { id } = await context.params;
  const image = await prisma.galleryImage.findUnique({ where: { id } });
  if (!image) throw new ApiError(404, 'Gallery image not found');
  return NextResponse.json({ image });
});

export const PUT = withErrorHandling(async (request, context: RouteContext) => {
  await requireUser();
  const { id } = await context.params;
  const body = await readJson(request);
  const data = galleryImageUpdateSchema.parse(body);
  try {
    const image = await prisma.galleryImage.update({ where: { id }, data });
    return NextResponse.json({ image });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') throw new ApiError(404, 'Gallery image not found');
    throw e;
  }
});

export const DELETE = withErrorHandling(async (_request, context: RouteContext) => {
  await requireUser();
  const { id } = await context.params;
  try {
    await prisma.galleryImage.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') throw new ApiError(404, 'Gallery image not found');
    throw e;
  }
});
