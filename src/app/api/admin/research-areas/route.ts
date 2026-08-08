import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  requireUser,
  withErrorHandling,
  readJson,
} from '@/lib/auth-server';
import { researchAreaCreateSchema } from '@/lib/validation';

// GET /api/admin/research-areas
export const GET = withErrorHandling(async () => {
  await requireUser();
  const areas = await prisma.researchArea.findMany({
    orderBy: { displayOrder: 'asc' },
  });
  return NextResponse.json({ researchAreas: areas });
});

// POST /api/admin/research-areas
export const POST = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const parsed = researchAreaCreateSchema.parse(body);

  let displayOrder = parsed.displayOrder;
  if (displayOrder === undefined) {
    const last = await prisma.researchArea.findFirst({
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true },
    });
    displayOrder = (last?.displayOrder ?? -1) + 1;
  }

  // Mutually-exclusive icon sources (refine already enforces "exactly
  // one"); normalize the unused side to null.
  const usesUpload = !!parsed.iconPublicId && !!parsed.iconUrl;

  const area = await prisma.researchArea.create({
    data: {
      iconName:     usesUpload ? null : parsed.iconName!,
      iconPublicId: usesUpload ? parsed.iconPublicId! : null,
      iconUrl:      usesUpload ? parsed.iconUrl!      : null,
      areaName:     parsed.areaName,
      description:  parsed.description ?? null,
      displayOrder,
    },
  });
  return NextResponse.json({ researchArea: area }, { status: 201 });
});
