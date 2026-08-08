import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson } from '@/lib/auth-server';
import { syllabusCreateSchema } from '@/lib/validation';

export const GET = withErrorHandling(async () => {
  await requireUser();
  const items = await prisma.syllabus.findMany({ orderBy: { displayOrder: 'asc' } });
  return NextResponse.json({ items });
});

export const POST = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const parsed = syllabusCreateSchema.parse(body);
  const last = await prisma.syllabus.findFirst({ orderBy: { displayOrder: 'desc' }, select: { displayOrder: true } });
  const displayOrder = (last?.displayOrder ?? -1) + 1;
  const item = await prisma.syllabus.create({ data: { ...parsed, displayOrder } });
  return NextResponse.json({ item }, { status: 201 });
});
