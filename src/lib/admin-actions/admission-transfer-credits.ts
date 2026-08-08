'use server';

import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { admissionTransferCreditsUpdateSchema } from '@/lib/validation';

export type ActionResult = { ok: true } | { ok: false; error: string };

function getStr(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === 'string' ? v.trim() : '';
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

export async function updateAdmissionTransferCreditsAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const raw = {
    intro:               getStr(formData, 'intro'),
    minimumGradeBullets: parseJsonArray(formData, 'minimumGradeBullets'),
    limitMaxLabel:       getStr(formData, 'limitMaxLabel'),
    limitMaxValue:       getStr(formData, 'limitMaxValue'),
    limitMaxSubtitle:    getStr(formData, 'limitMaxSubtitle'),
    limitFeeLabel:       getStr(formData, 'limitFeeLabel'),
    limitFeeValue:       getStr(formData, 'limitFeeValue'),
    limitFeeSubtitle:    getStr(formData, 'limitFeeSubtitle'),
    documentsIntroText:  getStr(formData, 'documentsIntroText'),
    documents:           parseJsonArray(formData, 'documents'),
    summaryKicker:       getStr(formData, 'summaryKicker'),
    summaryHeading:      getStr(formData, 'summaryHeading'),
    summaryRows:         parseJsonArray(formData, 'summaryRows'),
  };

  const parsed = admissionTransferCreditsUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ') };
  }

  // Phase 19 CP19.5 — sanitize HTML-allowed bullet bodies. Schema
  // validates shape as { heading, body }[]; only `body` reaches a
  // dangerouslySetInnerHTML render on the public page.
  const cleanBullets = (parsed.data.minimumGradeBullets as Array<{ body?: unknown } & Record<string, unknown>>).map((b) => ({
    ...b,
    body: typeof b.body === 'string' ? sanitizeHtml(b.body) : b.body,
  }));
  const data = {
    ...parsed.data,
    minimumGradeBullets: cleanBullets             as unknown as Prisma.InputJsonValue,
    documents:           parsed.data.documents    as unknown as Prisma.InputJsonValue,
    summaryRows:         parsed.data.summaryRows  as unknown as Prisma.InputJsonValue,
  };

  try {
    await prisma.admissionTransferCredits.upsert({
      where:  { id: 'singleton' },
      create: { id: 'singleton', ...data },
      update: data,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidatePath('/admission/transfer-credits');
  revalidatePath('/admin/admission-transfer-credits');
  revalidatePath('/admin');
  revalidatePath('/', 'layout');
  return { ok: true };
}
