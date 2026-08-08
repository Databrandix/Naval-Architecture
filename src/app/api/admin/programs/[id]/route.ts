import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  requireUser,
  withErrorHandling,
  readJson,
  ApiError,
} from '@/lib/auth-server';
import { programUpdateSchema } from '@/lib/validation';

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/admin/programs/:id
export const GET = withErrorHandling(async (_request, context: RouteContext) => {
  await requireUser();
  const { id } = await context.params;
  const program = await prisma.program.findUnique({ where: { id } });
  if (!program) throw new ApiError(404, 'Program not found');
  return NextResponse.json({ program });
});

// PUT /api/admin/programs/:id
//   Partial update — only the fields provided are changed.
export const PUT = withErrorHandling(async (request, context: RouteContext) => {
  await requireUser();
  const { id } = await context.params;
  const body = await readJson(request);
  const data = programUpdateSchema.parse(body);

  try {
    const program = await prisma.program.update({
      where: { id },
      data,
    });
    return NextResponse.json({ program });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2025') throw new ApiError(404, 'Program not found');
    if (code === 'P2002') throw new ApiError(409, 'degreeCode already in use');
    throw e;
  }
});

// DELETE /api/admin/programs/:id
export const DELETE = withErrorHandling(async (_request, context: RouteContext) => {
  await requireUser();
  const { id } = await context.params;
  try {
    await prisma.program.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') {
      throw new ApiError(404, 'Program not found');
    }
    throw e;
  }
});
