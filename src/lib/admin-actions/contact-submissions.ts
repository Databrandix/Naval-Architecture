'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { contactStatusEnum } from '@/lib/validation';

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAuth(): Promise<ActionResult | null> {
  const session = await getSession();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };
  return null;
}

function revalidateSubmissionSurfaces() {
  revalidatePath('/admin/contact-submissions');
  revalidatePath('/admin');
  // Sidebar badge count is rendered in the (authed) layout — layout
  // scope invalidation makes the count refresh on next nav.
  revalidatePath('/', 'layout');
}

export async function updateContactSubmissionStatusAction(
  id: string,
  status: string,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const parsed = contactStatusEnum.safeParse(status);
  if (!parsed.success) return { ok: false, error: 'Invalid status' };

  try {
    await prisma.contactSubmission.update({
      where: { id },
      data: { status: parsed.data },
    });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') {
      return { ok: false, error: 'Submission not found' };
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateSubmissionSurfaces();
  revalidatePath(`/admin/contact-submissions/${id}`);
  return { ok: true };
}

export async function deleteContactSubmissionAction(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    await prisma.contactSubmission.delete({ where: { id } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') {
      return { ok: false, error: 'Submission not found' };
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateSubmissionSurfaces();
  return { ok: true };
}
