import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling } from '@/lib/auth-server';

export const GET = withErrorHandling(async () => {
  await requireUser();
  // Return every Program with its fee structure (if any) — useful for
  // the admin list page that shows "configured / not configured" per
  // program.
  const programs = await prisma.program.findMany({
    orderBy: { displayOrder: 'asc' },
    select: {
      id: true,
      programName: true,
      degreeCode: true,
      feeStructure: true,
    },
  });
  return NextResponse.json({ programs });
});
