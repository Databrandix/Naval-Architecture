'use server';

import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { aboutEeeClubUpdateSchema } from '@/lib/validation';

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

// stats + activities arrive as a single JSON-encoded hidden input each
// (the editor components serialize the array client-side).
function parseJsonArray(fd: FormData, key: string): unknown {
  const raw = fd.get(key);
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function updateAboutEeeClubAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };

  const raw = {
    heroTitle:                getStr(formData, 'heroTitle'),
    heroOverline:             emptyToNull(formData.get('heroOverline')),
    heroImageUrl:             getStr(formData, 'heroImageUrl'),
    heroImagePublicId:        emptyToNull(formData.get('heroImagePublicId')),
    heroImageVerticalPercent: formData.get('heroImageVerticalPercent') ?? undefined,
    introOverline:            emptyToNull(formData.get('introOverline')),
    introHeading:             getStr(formData, 'introHeading'),
    introBody1:               getStr(formData, 'introBody1'),
    introBody2:               getStr(formData, 'introBody2'),
    introImageUrl:            getStr(formData, 'introImageUrl'),
    introImagePublicId:       emptyToNull(formData.get('introImagePublicId')),
    stats:                    parseJsonArray(formData, 'stats'),
    activitiesOverline:       emptyToNull(formData.get('activitiesOverline')),
    activitiesHeading:        getStr(formData, 'activitiesHeading'),
    activities:               parseJsonArray(formData, 'activities'),
    networkOverline:          emptyToNull(formData.get('networkOverline')),
    networkHeading:           getStr(formData, 'networkHeading'),
    networkBody:              getStr(formData, 'networkBody'),
    networkPrimaryCtaLabel:   getStr(formData, 'networkPrimaryCtaLabel'),
    networkPrimaryCtaHref:    getStr(formData, 'networkPrimaryCtaHref'),
    networkSecondaryCtaLabel: emptyToNull(formData.get('networkSecondaryCtaLabel')),
    networkSecondaryCtaHref:  emptyToNull(formData.get('networkSecondaryCtaHref')),
  };

  const parsed = aboutEeeClubUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; '),
    };
  }

  // Cast Json fields for Prisma — stats + activities are validated as
  // arrays-of-objects by Zod but Prisma's input type is the generic
  // InputJsonValue (same pattern as the Faculty Json columns).
  // Phase 19 CP19.5 — sanitize HTML-allowed `introHeading` (the only
  // dangerouslySetInnerHTML render in this entity per CP19.5.1
  // inventory; other text fields go through React auto-escape).
  const data = {
    ...parsed.data,
    introHeading: sanitizeHtml(parsed.data.introHeading),
    stats:        parsed.data.stats as Prisma.InputJsonValue,
    activities:   parsed.data.activities as Prisma.InputJsonValue,
  };

  try {
    await prisma.aboutEeeClub.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...data },
      update: data,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidatePath('/admin/about-eee-club');
  revalidatePath('/admin');
  revalidatePath('/about/eee-club');
  return { ok: true };
}
