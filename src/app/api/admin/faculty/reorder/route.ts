import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  requireUser,
  withErrorHandling,
  readJson,
  ApiError,
} from '@/lib/auth-server';
import { reorderSchema } from '@/lib/validation';

// POST /api/admin/faculty/reorder
//
//   Body: { ids: string[] } — must include exactly the existing
//   faculty id-set; index in the array becomes the new displayOrder.
//   Admin UI only enables drag-reorder when the type filter is "All".
//
export const POST = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const { ids } = reorderSchema.parse(body);

  const existing = await prisma.faculty.findMany({ select: { id: true } });
  const existingSet = new Set(existing.map((f) => f.id));
  const incomingSet = new Set(ids);

  if (existingSet.size !== incomingSet.size) {
    throw new ApiError(
      400,
      `Reorder must include exactly the existing faculty (${existingSet.size}); received ${incomingSet.size}.`,
    );
  }
  for (const id of ids) {
    if (!existingSet.has(id)) {
      throw new ApiError(400, `Unknown faculty id in reorder list: ${id}`);
    }
  }

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.faculty.update({ where: { id }, data: { displayOrder: index } }),
    ),
  );

  const faculty = await prisma.faculty.findMany({
    orderBy: { displayOrder: 'asc' },
  });
  return NextResponse.json({ faculty });
});
