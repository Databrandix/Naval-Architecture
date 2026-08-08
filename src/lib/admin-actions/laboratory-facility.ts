'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { sanitizeHtml } from '@/lib/sanitize-html';
import {
  laboratoryFacilityLandingUpdateSchema,
  laboratoryLabCreateSchema,
  laboratoryLabUpdateSchema,
} from '@/lib/validation';

export type ActionResult = { ok: true } | { ok: false; error: string };

function getStr(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

function emptyToNull(v: FormDataEntryValue | null): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
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

// LaboratoryFacility content lives only on /about/laboratory-facility
// (no homepage cross-reference — that's System 1's concern).
function revalidateLab2Surfaces() {
  revalidatePath('/about/laboratory-facility');
  revalidatePath('/admin/laboratory-facility');
  revalidatePath('/admin');
}

// ─────────────────────────────────────────────────────────────────
//  LaboratoryFacilityLanding — singleton upsert
// ─────────────────────────────────────────────────────────────────

export async function updateLaboratoryFacilityLandingAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const raw = {
    heroTitle:         getStr(formData, 'heroTitle'),
    heroOverline:      emptyToNull(formData.get('heroOverline')),
    heroImageUrl:      getStr(formData, 'heroImageUrl'),
    heroImagePublicId: emptyToNull(formData.get('heroImagePublicId')),
    heroImageVerticalPercent: formData.get('heroImageVerticalPercent') ?? undefined,
    introBody:         getStr(formData, 'introBody'),
    featuresOverline:  emptyToNull(formData.get('featuresOverline')),
    featuresHeading:   getStr(formData, 'featuresHeading'),
    features:          parseJsonArray(formData, 'features'),
  };

  const parsed = laboratoryFacilityLandingUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; '),
    };
  }

  // Phase 19 CP19.5 — sanitize HTML-allowed `introBody`.
  const data = {
    ...parsed.data,
    introBody: sanitizeHtml(parsed.data.introBody),
    features:  parsed.data.features as Prisma.InputJsonValue,
  };

  try {
    await prisma.laboratoryFacilityLanding.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...data },
      update: data,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidateLab2Surfaces();
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────
//  LaboratoryLab — multi-row CRUD + reorder
// ─────────────────────────────────────────────────────────────────

function readLab2Row(formData: FormData) {
  return {
    iconName:    getStr(formData, 'iconName'),
    title:       getStr(formData, 'title'),
    description: getStr(formData, 'description'),
    keyLabel:    getStr(formData, 'keyLabel'),
    keyItems:    getStr(formData, 'keyItems'),
    focus:       getStr(formData, 'focus'),
  };
}

export async function createLaboratoryLabAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const raw = readLab2Row(formData);
  const parsed = laboratoryLabCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; '),
    };
  }

  const last = await prisma.laboratoryLab.findFirst({
    orderBy: { displayOrder: 'desc' },
    select: { displayOrder: true },
  });
  const displayOrder = (last?.displayOrder ?? -1) + 1;

  try {
    await prisma.laboratoryLab.create({
      data: { ...parsed.data, displayOrder },
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidateLab2Surfaces();
  redirect('/admin/laboratory-facility');
}

export async function updateLaboratoryLabAction(
  id: string,
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const raw = readLab2Row(formData);
  const parsed = laboratoryLabUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; '),
    };
  }

  try {
    await prisma.laboratoryLab.update({ where: { id }, data: parsed.data });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Laboratory not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidateLab2Surfaces();
  revalidatePath(`/admin/laboratory-facility/labs/${id}`);
  return { ok: true };
}

export async function deleteLaboratoryLabAction(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    await prisma.laboratoryLab.delete({ where: { id } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Laboratory not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateLab2Surfaces();
  return { ok: true };
}

export async function reorderLaboratoryLabsAction(ids: string[]): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const existing = await prisma.laboratoryLab.findMany({ select: { id: true } });
  const existingIds = new Set(existing.map((r) => r.id));
  if (ids.length !== existingIds.size || !ids.every((id) => existingIds.has(id))) {
    return { ok: false, error: 'Reorder list must include exactly the existing laboratories' };
  }
  try {
    await prisma.$transaction(
      ids.map((id, index) => prisma.laboratoryLab.update({ where: { id }, data: { displayOrder: index } })),
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateLab2Surfaces();
  return { ok: true };
}
