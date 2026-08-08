import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson, ApiError } from '@/lib/auth-server';
import { reorderSchema } from '@/lib/validation';

export const POST = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const { ids } = reorderSchema.parse(body);
  const existing = await prisma.admissionNotice.findMany({ select: { id: true } });
  const set = new Set(existing.map((r) => r.id));
  if (set.size !== ids.length || !ids.every((id) => set.has(id))) {
    throw new ApiError(400, `Reorder must include exactly the existing admission notices (${set.size}).`);
  }
  await prisma.$transaction(
    ids.map((id, index) => prisma.admissionNotice.update({ where: { id }, data: { displayOrder: index } })),
  );
  const items = await prisma.admissionNotice.findMany({ orderBy: { displayOrder: 'asc' } });
  return NextResponse.json({ items });
});
