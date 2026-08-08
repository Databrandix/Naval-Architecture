import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson } from '@/lib/auth-server';
import { busRouteCreateSchema } from '@/lib/validation';

export const GET = withErrorHandling(async () => {
  await requireUser();
  const routes = await prisma.busRoute.findMany({ orderBy: { displayOrder: 'asc' } });
  return NextResponse.json({ routes });
});

export const POST = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const parsed = busRouteCreateSchema.parse(body);
  const last = await prisma.busRoute.findFirst({ orderBy: { displayOrder: 'desc' }, select: { displayOrder: true } });
  const displayOrder = (last?.displayOrder ?? -1) + 1;
  const route = await prisma.busRoute.create({ data: { ...parsed, displayOrder } });
  return NextResponse.json({ route }, { status: 201 });
});
