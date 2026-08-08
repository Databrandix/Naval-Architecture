import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  requireUser,
  withErrorHandling,
  readJson,
  ApiError,
} from '@/lib/auth-server';
import { researchAreaUpdateSchema } from '@/lib/validation';

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/admin/research-areas/:id
export const GET = withErrorHandling(async (_request, context: RouteContext) => {
  await requireUser();
  const { id } = await context.params;
  const area = await prisma.researchArea.findUnique({ where: { id } });
  if (!area) throw new ApiError(404, 'Research area not found');
  return NextResponse.json({ researchArea: area });
});

// PUT /api/admin/research-areas/:id
//   Partial update. If icon-source fields are changed, the unused
//   side is normalized to null (so a Lucide icon never coexists
//   with a Cloudinary image on the same row).
export const PUT = withErrorHandling(async (request, context: RouteContext) => {
  await requireUser();
  const { id } = await context.params;
  const body = await readJson(request);
  const parsed = researchAreaUpdateSchema.parse(body);

  const data: Record<string, unknown> = {};
  if (parsed.areaName     !== undefined) data.areaName     = parsed.areaName;
  if (parsed.description  !== undefined) data.description  = parsed.description;
  if (parsed.displayOrder !== undefined) data.displayOrder = parsed.displayOrder;

  // Icon: only touch if at least one icon-source field was provided.
  const iconTouched =
    parsed.iconName !== undefined ||
    parsed.iconPublicId !== undefined ||
    parsed.iconUrl !== undefined;
  if (iconTouched) {
    const usesUpload = !!parsed.iconPublicId && !!parsed.iconUrl;
    data.iconName     = usesUpload ? null : (parsed.iconName ?? null);
    data.iconPublicId = usesUpload ? parsed.iconPublicId! : null;
    data.iconUrl      = usesUpload ? parsed.iconUrl!      : null;
  }

  try {
    const area = await prisma.researchArea.update({ where: { id }, data });
    return NextResponse.json({ researchArea: area });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') {
      throw new ApiError(404, 'Research area not found');
    }
    throw e;
  }
});

// DELETE /api/admin/research-areas/:id
export const DELETE = withErrorHandling(async (_request, context: RouteContext) => {
  await requireUser();
  const { id } = await context.params;
  try {
    await prisma.researchArea.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') {
      throw new ApiError(404, 'Research area not found');
    }
    throw e;
  }
});
