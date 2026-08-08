import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  requireUser,
  withErrorHandling,
  readJson,
} from '@/lib/auth-server';
import { departmentUpdateSchema } from '@/lib/validation';

// GET /api/admin/department
//   Returns the singleton department identity. Any authenticated
//   admin or super_admin can read.
export const GET = withErrorHandling(async () => {
  await requireUser();
  const row = await prisma.departmentIdentity.findUnique({
    where: { id: 'singleton' },
  });
  return NextResponse.json({ department: row });
});

// PUT /api/admin/department
//   Upserts the singleton. Any authenticated admin or super_admin
//   may update. Body must validate against departmentUpdateSchema.
export const PUT = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const data = departmentUpdateSchema.parse(body);

  const row = await prisma.departmentIdentity.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', ...data },
    update: data,
  });
  return NextResponse.json({ department: row });
});
