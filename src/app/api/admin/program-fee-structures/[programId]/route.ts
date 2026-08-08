import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson, ApiError } from '@/lib/auth-server';
import { programFeeStructureUpdateSchema } from '@/lib/validation';

type RouteContext = { params: Promise<{ programId: string }> };

export const GET = withErrorHandling(async (_request, context: RouteContext) => {
  await requireUser();
  const { programId } = await context.params;
  const item = await prisma.programFeeStructure.findUnique({ where: { programId } });
  if (!item) throw new ApiError(404, 'Program fee structure not found');
  return NextResponse.json({ item });
});

export const PUT = withErrorHandling(async (request, context: RouteContext) => {
  await requireUser();
  const { programId } = await context.params;
  const body = await readJson(request);
  // Allow client to omit programId in body — URL is canonical.
  const bodyObj = (typeof body === 'object' && body !== null) ? body as Record<string, unknown> : {};
  const parsed = programFeeStructureUpdateSchema.parse({ ...bodyObj, programId });

  const program = await prisma.program.findUnique({ where: { id: programId }, select: { id: true } });
  if (!program) throw new ApiError(404, 'Program not found');

  const data = {
    programId,
    introOverline: parsed.introOverline,
    introHeading:  parsed.introHeading,
    introBody:     parsed.introBody,
    overviewStats: parsed.overviewStats as unknown as Prisma.InputJsonValue,
    shifts:        parsed.shifts        as unknown as Prisma.InputJsonValue,
    policies:      parsed.policies      as unknown as Prisma.InputJsonValue,
  };
  const item = await prisma.programFeeStructure.upsert({
    where:  { programId },
    create: data,
    update: data,
  });
  return NextResponse.json({ item });
});

export const DELETE = withErrorHandling(async (_request, context: RouteContext) => {
  await requireUser();
  const { programId } = await context.params;
  try {
    await prisma.programFeeStructure.delete({ where: { programId } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') throw new ApiError(404, 'Fee structure not found');
    throw e;
  }
});
