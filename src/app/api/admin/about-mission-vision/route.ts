import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson } from '@/lib/auth-server';
import { aboutMissionVisionUpdateSchema } from '@/lib/validation';

export const GET = withErrorHandling(async () => {
  await requireUser();
  const row = await prisma.aboutMissionVision.findUnique({ where: { id: 'singleton' } });
  return NextResponse.json({ aboutMissionVision: row });
});

export const PUT = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const data = aboutMissionVisionUpdateSchema.parse(body);
  const row = await prisma.aboutMissionVision.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', ...data },
    update: data,
  });
  return NextResponse.json({ aboutMissionVision: row });
});
