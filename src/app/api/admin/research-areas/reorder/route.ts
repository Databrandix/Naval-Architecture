import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  requireUser,
  withErrorHandling,
  readJson,
  ApiError,
} from '@/lib/auth-server';
import { reorderSchema } from '@/lib/validation';

// POST /api/admin/research-areas/reorder
export const POST = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const { ids } = reorderSchema.parse(body);

  const existing = await prisma.researchArea.findMany({ select: { id: true } });
  const existingSet = new Set(existing.map((r) => r.id));
  const incomingSet = new Set(ids);

  if (existingSet.size !== incomingSet.size) {
    throw new ApiError(
      400,
      `Reorder must include exactly the existing research areas (${existingSet.size}); received ${incomingSet.size}.`,
    );
  }
  for (const id of ids) {
    if (!existingSet.has(id)) {
      throw new ApiError(400, `Unknown research area id in reorder list: ${id}`);
    }
  }

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.researchArea.update({ where: { id }, data: { displayOrder: index } }),
    ),
  );

  const researchAreas = await prisma.researchArea.findMany({
    orderBy: { displayOrder: 'asc' },
  });
  return NextResponse.json({ researchAreas });
});
