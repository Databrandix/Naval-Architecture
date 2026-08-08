'use server';

import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { admissionRequirementsUpdateSchema } from '@/lib/validation';

export type ActionResult = { ok: true } | { ok: false; error: string };

function getStr(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === 'string' ? v.trim() : '';
}
function getParagraphs(fd: FormData, key: string): string[] {
  return fd.getAll(key)
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}
function parseJsonArray(fd: FormData, key: string): unknown {
  const raw = fd.get(key);
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function requireAuth(): Promise<ActionResult | null> {
  const session = await getSession();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };
  return null;
}

export async function updateAdmissionRequirementsAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const raw = {
    intro:                     getStr(formData, 'intro'),
    undergraduateRequirements: getParagraphs(formData, 'undergraduateRequirements'),
    additionalNotes:           getParagraphs(formData, 'additionalNotes'),
    diplomaRequirements:       getParagraphs(formData, 'diplomaRequirements'),
    combinedGpaBody:           getStr(formData, 'combinedGpaBody'),
    diplomaQuickCriteria:      parseJsonArray(formData, 'diplomaQuickCriteria'),
  };

  const parsed = admissionRequirementsUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ') };
  }

  const data = {
    intro:                     parsed.data.intro,
    undergraduateRequirements: parsed.data.undergraduateRequirements as unknown as Prisma.InputJsonValue,
    additionalNotes:           parsed.data.additionalNotes           as unknown as Prisma.InputJsonValue,
    diplomaRequirements:       parsed.data.diplomaRequirements       as unknown as Prisma.InputJsonValue,
    // Phase 19 CP19.5 — sanitize HTML-allowed `combinedGpaBody`.
    combinedGpaBody:           sanitizeHtml(parsed.data.combinedGpaBody),
    diplomaQuickCriteria:      parsed.data.diplomaQuickCriteria      as unknown as Prisma.InputJsonValue,
  };

  try {
    await prisma.admissionRequirements.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...data },
      update: data,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidatePath('/admission/requirements');
  revalidatePath('/admin/admission-requirements');
  revalidatePath('/admin');
  revalidatePath('/', 'layout');
  return { ok: true };
}
