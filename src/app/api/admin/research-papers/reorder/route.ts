import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson, ApiError } from '@/lib/auth-server';
import { reorderSchema } from '@/lib/validation';

export const POST = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const { ids } = reorderSchema.parse(body);
  const existing = await prisma.researchPaper.findMany({ select: { id: true } });
  const set = new Set(existing.map((r) => r.id));
  if (set.size !== ids.length || !ids.every((id) => set.has(id))) {
    throw new ApiError(400, `Reorder must include exactly the existing research papers (${set.size}).`);
  }
  await prisma.$transaction(
    ids.map((id, index) => prisma.researchPaper.update({ where: { id }, data: { displayOrder: index } })),
  );
  const papers = await prisma.researchPaper.findMany({ orderBy: { displayOrder: 'asc' } });
  return NextResponse.json({ papers });
});
