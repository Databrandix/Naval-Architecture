import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson } from '@/lib/auth-server';
import { labCreateSchema } from '@/lib/validation';

export const GET = withErrorHandling(async () => {
  await requireUser();
  const labs = await prisma.lab.findMany({ orderBy: { displayOrder: 'asc' } });
  return NextResponse.json({ labs });
});

export const POST = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const parsed = labCreateSchema.parse(body);

  let displayOrder = parsed.displayOrder;
  if (displayOrder === undefined) {
    const last = await prisma.lab.findFirst({
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true },
    });
    displayOrder = (last?.displayOrder ?? -1) + 1;
  }

  const lab = await prisma.lab.create({
    data: { ...parsed, displayOrder },
  });
  return NextResponse.json({ lab }, { status: 201 });
});
