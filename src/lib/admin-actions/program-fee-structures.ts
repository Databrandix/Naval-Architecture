'use server';

import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { programFeeStructureUpdateSchema } from '@/lib/validation';

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

function revalidateFeeSurfaces() {
  revalidatePath('/admission/tuition-fees');
  revalidatePath('/admin/program-fee-structures');
  revalidatePath('/admin');
  revalidatePath('/', 'layout');
}

// Upsert keyed by programId — admin form lives at
// /admin/program-fee-structures/[programId], so the same action
// handles both "create fee structure for this program" and "update
// existing fee structure for this program". 1:1 relationship makes
// this safe.
export async function upsertProgramFeeStructureAction(
  programId: string,
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const raw = {
    programId,
    introOverline: getStr(formData, 'introOverline'),
    introHeading:  getStr(formData, 'introHeading'),
    introBody:     getStr(formData, 'introBody'),
    overviewStats: parseJsonArray(formData, 'overviewStats'),
    shifts:        parseJsonArray(formData, 'shifts'),
    policies:      parseJsonArray(formData, 'policies'),
  };

  const parsed = programFeeStructureUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ') };
  }

  // Phase 19 CP19.5 — sanitize HTML-allowed `policies[].text`. Schema-
  // validated shape is { iconName, title, text }[]; only `text` is
  // rendered via dangerouslySetInnerHTML on the public page.
  const cleanPolicies = (parsed.data.policies as Array<{ text?: unknown } & Record<string, unknown>>).map((p) => ({
    ...p,
    text: typeof p.text === 'string' ? sanitizeHtml(p.text) : p.text,
  }));
  const data = {
    programId,
    introOverline: parsed.data.introOverline,
    introHeading:  parsed.data.introHeading,
    introBody:     parsed.data.introBody,
    overviewStats: parsed.data.overviewStats as unknown as Prisma.InputJsonValue,
    shifts:        parsed.data.shifts        as unknown as Prisma.InputJsonValue,
    policies:      cleanPolicies             as unknown as Prisma.InputJsonValue,
  };

  // Verify program exists (defensive — admin shouldn't be able to
  // reach the route with a bad id, but URL tampering is cheap).
  const program = await prisma.program.findUnique({ where: { id: programId }, select: { id: true } });
  if (!program) return { ok: false, error: 'Program not found' };

  try {
    await prisma.programFeeStructure.upsert({
      where:  { programId },
      create: data,
      update: data,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateFeeSurfaces();
  return { ok: true };
}

export async function deleteProgramFeeStructureAction(programId: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    await prisma.programFeeStructure.delete({ where: { programId } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Fee structure not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateFeeSurfaces();
  return { ok: true };
}
