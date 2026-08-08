import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  requireUser,
  withErrorHandling,
  readJson,
  ApiError,
} from '@/lib/auth-server';
import { programCreateSchema } from '@/lib/validation';

// GET /api/admin/programs
//   List all programs ordered by displayOrder asc.
export const GET = withErrorHandling(async () => {
  await requireUser();
  const programs = await prisma.program.findMany({
    orderBy: { displayOrder: 'asc' },
  });
  return NextResponse.json({ programs });
});

// POST /api/admin/programs
//   Create a new program. If displayOrder is omitted, auto-append
//   (max existing + 1).
export const POST = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const parsed = programCreateSchema.parse(body);

  let displayOrder = parsed.displayOrder;
  if (displayOrder === undefined) {
    const last = await prisma.program.findFirst({
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true },
    });
    displayOrder = (last?.displayOrder ?? -1) + 1;
  }

  try {
    const program = await prisma.program.create({
      data: {
        programName:     parsed.programName,
        degreeCode:      parsed.degreeCode,
        duration:        parsed.duration,
        description:     parsed.description,
        displayOrder,
        imageUrl:        parsed.imageUrl ?? null,
        imagePublicId:   parsed.imagePublicId ?? null,
        specializations: parsed.specializations,
        cta:             parsed.cta ?? null,
      },
    });
    return NextResponse.json({ program }, { status: 201 });
  } catch (e: unknown) {
    // Prisma P2002 = unique constraint violation (degreeCode is @unique)
    if (
      typeof e === 'object' &&
      e !== null &&
      'code' in e &&
      (e as { code: string }).code === 'P2002'
    ) {
      throw new ApiError(409, `degreeCode "${parsed.degreeCode}" already in use`);
    }
    throw e;
  }
});
