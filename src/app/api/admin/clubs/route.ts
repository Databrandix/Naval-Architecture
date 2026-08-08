import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson } from '@/lib/auth-server';
import { clubCreateSchema } from '@/lib/validation';

export const GET = withErrorHandling(async () => {
  await requireUser();
  const clubs = await prisma.club.findMany({ orderBy: { displayOrder: 'asc' } });
  return NextResponse.json({ clubs });
});

export const POST = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const parsed = clubCreateSchema.parse(body);
  const last = await prisma.club.findFirst({ orderBy: { displayOrder: 'desc' }, select: { displayOrder: true } });
  const displayOrder = (last?.displayOrder ?? -1) + 1;
  const club = await prisma.club.create({ data: { ...parsed, displayOrder } });
  return NextResponse.json({ club }, { status: 201 });
});
