import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson } from '@/lib/auth-server';
import { alumniCreateSchema } from '@/lib/validation';

export const GET = withErrorHandling(async () => {
  await requireUser();
  const alumni = await prisma.alumni.findMany({ orderBy: { displayOrder: 'asc' } });
  return NextResponse.json({ alumni });
});

export const POST = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const parsed = alumniCreateSchema.parse(body);
  const last = await prisma.alumni.findFirst({
    orderBy: { displayOrder: 'desc' },
    select: { displayOrder: true },
  });
  const displayOrder = (last?.displayOrder ?? -1) + 1;
  const alumni = await prisma.alumni.create({ data: { ...parsed, displayOrder } });
  return NextResponse.json({ alumni }, { status: 201 });
});
