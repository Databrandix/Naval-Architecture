import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson, ApiError } from '@/lib/auth-server';
import { reorderSchema } from '@/lib/validation';

export const POST = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const { ids } = reorderSchema.parse(body);

  const existing = await prisma.galleryImage.findMany({ select: { id: true } });
  const existingSet = new Set(existing.map((r) => r.id));
  if (existingSet.size !== ids.length || !ids.every((id) => existingSet.has(id))) {
    throw new ApiError(400, `Reorder must include exactly the existing gallery images (${existingSet.size}).`);
  }

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.galleryImage.update({ where: { id }, data: { displayOrder: index } }),
    ),
  );
  const images = await prisma.galleryImage.findMany({ orderBy: { displayOrder: 'asc' } });
  return NextResponse.json({ images });
});
