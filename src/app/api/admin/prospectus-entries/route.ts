import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson } from '@/lib/auth-server';
import { prospectusEntryCreateSchema } from '@/lib/validation';

export const GET = withErrorHandling(async () => {
  await requireUser();
  const items = await prisma.prospectusEntry.findMany({ orderBy: { displayOrder: 'asc' } });
  return NextResponse.json({ items });
});

export const POST = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const parsed = prospectusEntryCreateSchema.parse(body);
  const last = await prisma.prospectusEntry.findFirst({ orderBy: { displayOrder: 'desc' }, select: { displayOrder: true } });
  const displayOrder = (last?.displayOrder ?? -1) + 1;
  const item = await prisma.prospectusEntry.create({ data: { ...parsed, displayOrder } });
  return NextResponse.json({ item }, { status: 201 });
});
