import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson } from '@/lib/auth-server';
import { noticeCreateSchema } from '@/lib/validation';

export const GET = withErrorHandling(async () => {
  await requireUser();
  const notices = await prisma.notice.findMany({ orderBy: { publishedAt: 'desc' } });
  return NextResponse.json({ notices });
});

export const POST = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const parsed = noticeCreateSchema.parse(body);
  const created = await prisma.notice.create({ data: parsed });
  return NextResponse.json({ notice: created }, { status: 201 });
});
