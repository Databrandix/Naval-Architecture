import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson } from '@/lib/auth-server';
import { galleryImageCreateSchema } from '@/lib/validation';

export const GET = withErrorHandling(async () => {
  await requireUser();
  const images = await prisma.galleryImage.findMany({ orderBy: { displayOrder: 'asc' } });
  return NextResponse.json({ images });
});

export const POST = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const parsed = galleryImageCreateSchema.parse(body);

  let displayOrder = parsed.displayOrder;
  if (displayOrder === undefined) {
    const last = await prisma.galleryImage.findFirst({
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true },
    });
    displayOrder = (last?.displayOrder ?? -1) + 1;
  }

  const image = await prisma.galleryImage.create({
    data: { ...parsed, displayOrder },
  });
  return NextResponse.json({ image }, { status: 201 });
});
