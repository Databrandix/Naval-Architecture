import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson } from '@/lib/auth-server';
import { researchPaperCreateSchema } from '@/lib/validation';

export const GET = withErrorHandling(async () => {
  await requireUser();
  const papers = await prisma.researchPaper.findMany({ orderBy: { displayOrder: 'asc' } });
  return NextResponse.json({ papers });
});

export const POST = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const parsed = researchPaperCreateSchema.parse(body);
  const last = await prisma.researchPaper.findFirst({ orderBy: { displayOrder: 'desc' }, select: { displayOrder: true } });
  const displayOrder = (last?.displayOrder ?? -1) + 1;
  const paper = await prisma.researchPaper.create({ data: { ...parsed, displayOrder } });
  return NextResponse.json({ paper }, { status: 201 });
});
