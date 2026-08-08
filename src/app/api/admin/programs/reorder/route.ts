import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  requireUser,
  withErrorHandling,
  readJson,
  ApiError,
} from '@/lib/auth-server';
import { reorderSchema } from '@/lib/validation';

// POST /api/admin/programs/reorder
//
//   Body: { ids: string[] }
//
//   The order of the array becomes the new displayOrder values
//   (0-based). Operation runs in a transaction: either every row
//   updates or none. Refuses if the id-set doesn't exactly match
//   the existing programs (to avoid silently dropping a row from
//   the order).
//
export const POST = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const { ids } = reorderSchema.parse(body);

  const existing = await prisma.program.findMany({ select: { id: true } });
  const existingSet = new Set(existing.map((p) => p.id));
  const incomingSet = new Set(ids);

  if (existingSet.size !== incomingSet.size) {
    throw new ApiError(
      400,
      `Reorder must include exactly the existing programs (${existingSet.size}); received ${incomingSet.size}.`,
    );
  }
  for (const id of ids) {
    if (!existingSet.has(id)) {
      throw new ApiError(400, `Unknown program id in reorder list: ${id}`);
    }
  }

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.program.update({ where: { id }, data: { displayOrder: index } }),
    ),
  );

  const programs = await prisma.program.findMany({
    orderBy: { displayOrder: 'asc' },
  });
  return NextResponse.json({ programs });
});
