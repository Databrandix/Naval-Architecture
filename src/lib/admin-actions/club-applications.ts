'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { departmentClubApplicationStatusUpdateSchema } from '@/lib/validation';

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAuth(): Promise<ActionResult | null> {
  const session = await getSession();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };
  return null;
}

function revalidateSurfaces() {
  revalidatePath('/admin/club-applications');
  revalidatePath('/admin');
}

export async function updateDepartmentClubApplicationStatusAction(
  id: string,
  rawStatus: string,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const parsed = departmentClubApplicationStatusUpdateSchema.safeParse({ status: rawStatus });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Invalid status (expected pending, approved, or rejected).',
    };
  }

  try {
    await prisma.departmentClubApplication.update({
      where: { id },
      data: { status: parsed.data.status },
    });
  } catch (e: unknown) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2025'
    ) {
      return { ok: false, error: 'Application not found' };
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidateSurfaces();
  return { ok: true };
}

export async function deleteDepartmentClubApplicationAction(
  id: string,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    await prisma.departmentClubApplication.delete({ where: { id } });
  } catch (e: unknown) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2025'
    ) {
      return { ok: false, error: 'Application not found' };
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidateSurfaces();
  return { ok: true };
}
