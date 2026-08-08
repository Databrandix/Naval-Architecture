import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson } from '@/lib/auth-server';
import { eventCreateSchema } from '@/lib/validation';

export const GET = withErrorHandling(async () => {
  await requireUser();
  const events = await prisma.event.findMany({
    orderBy: [{ eventDate: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
  });
  return NextResponse.json({ events });
});

export const POST = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const parsed = eventCreateSchema.parse(body);
  const created = await prisma.event.create({
    data: {
      ...parsed,
      description: parsed.description as Prisma.InputJsonValue,
      details: parsed.details as unknown as Prisma.InputJsonValue,
    },
  });
  return NextResponse.json({ event: created }, { status: 201 });
});
