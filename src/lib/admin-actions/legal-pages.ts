'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { legalPagesUpdateSchema } from '@/lib/validation';

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

// Sections come from SectionsEditor as a serialized JSON string in a
// single hidden input. Parse defensively — Zod does the real
// validation against legalSectionsSchema afterwards.
function parseSectionsJson(v: FormDataEntryValue | null): unknown {
  if (typeof v !== 'string' || !v.trim()) return [];
  try {
    return JSON.parse(v);
  } catch {
    return [];
  }
}

// Phase 17 — one form, two pages. Single upsert touches the combined
// LegalPagesContent singleton; revalidate both public routes so the
// new copy is live on next request.
export async function updateLegalPagesContentAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };

  const raw = {
    privacyHeroTitle:                getStr(formData, 'privacyHeroTitle'),
    privacyHeroOverline:             emptyToNull(formData.get('privacyHeroOverline')),
    privacyHeroImageUrl:             getStr(formData, 'privacyHeroImageUrl'),
    privacyHeroImagePublicId:        emptyToNull(formData.get('privacyHeroImagePublicId')),
    privacyHeroImageVerticalPercent: formData.get('privacyHeroImageVerticalPercent') ?? undefined,
    privacySections:                 parseSectionsJson(formData.get('privacySections')),

    termsHeroTitle:                  getStr(formData, 'termsHeroTitle'),
    termsHeroOverline:               emptyToNull(formData.get('termsHeroOverline')),
    termsHeroImageUrl:               getStr(formData, 'termsHeroImageUrl'),
    termsHeroImagePublicId:          emptyToNull(formData.get('termsHeroImagePublicId')),
    termsHeroImageVerticalPercent:   formData.get('termsHeroImageVerticalPercent') ?? undefined,
    termsSections:                   parseSectionsJson(formData.get('termsSections')),
  };

  const parsed = legalPagesUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; '),
    };
  }

  // Zod-validated sections are plain objects → cast to Prisma.InputJsonValue
  // for the Json columns. Prisma's create/update typings are strict.
  const data = {
    ...parsed.data,
    privacySections: parsed.data.privacySections as Prisma.InputJsonValue,
    termsSections:   parsed.data.termsSections   as Prisma.InputJsonValue,
  };

  try {
    await prisma.legalPagesContent.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...data },
      update: data,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidatePath('/admin/legal-pages');
  revalidatePath('/admin');
  revalidatePath('/privacy-policy');
  revalidatePath('/terms-and-conditions');
  return { ok: true };
}
