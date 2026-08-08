'use server';

import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { transportLandingUpdateSchema } from '@/lib/validation';

export type ActionResult = { ok: true } | { ok: false; error: string };

function getStr(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

// instructions arrives as one JSON-encoded hidden input (matches the
// Phase 4 ActivitiesEditor / Phase 5 FeaturesEditor pattern). Parse
// defensively, Zod re-validates the shape downstream.
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

export async function updateTransportLandingAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const raw = {
    introBody:     getStr(formData, 'introBody'),
    bannerHeading: getStr(formData, 'bannerHeading'),
    bannerBody:    getStr(formData, 'bannerBody'),
    instructions:  parseJsonArray(formData, 'instructions'),
  };

  const parsed = transportLandingUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ') };
  }

  // Phase 19 CP19.5 — sanitize bannerBody (HTML-allowed) and each
  // instruction's `description` (HTML-allowed) before persisting.
  const cleanInstructions = parsed.data.instructions.map((row) => ({
    ...row,
    description: sanitizeHtml(row.description),
  }));
  const data = {
    ...parsed.data,
    bannerBody: sanitizeHtml(parsed.data.bannerBody),
    instructions: cleanInstructions as unknown as Prisma.InputJsonValue,
  };

  try {
    await prisma.transportLanding.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...data },
      update: data,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidatePath('/transport-service');
  revalidatePath('/admin/transport-landing');
  revalidatePath('/admin');
  return { ok: true };
}
