'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { sanitizeHtmlArray } from '@/lib/sanitize-html';
import { aboutOverviewUpdateSchema } from '@/lib/validation';

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

export async function updateAboutOverviewAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };

  // paragraphs come in as multiple hidden inputs with the same name —
  // read via getAll, drop empty strings (user may have left a row blank)
  const paragraphs = formData
    .getAll('paragraphs')
    .filter((v): v is string => typeof v === 'string')
    .map((p) => p.trim())
    .filter(Boolean);

  const raw = {
    heroTitle:         getStr(formData, 'heroTitle'),
    heroSubtitle:      emptyToNull(formData.get('heroSubtitle')),
    heroOverline:      emptyToNull(formData.get('heroOverline')),
    heroImageUrl:      getStr(formData, 'heroImageUrl'),
    heroImagePublicId: emptyToNull(formData.get('heroImagePublicId')),
    heroImageVerticalPercent: formData.get('heroImageVerticalPercent') ?? undefined,
    paragraphs,
  };

  const parsed = aboutOverviewUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; '),
    };
  }

  // Phase 19 CP19.5 — sanitize HTML-allowed paragraphs before persisting.
  const data = {
    ...parsed.data,
    paragraphs: sanitizeHtmlArray(parsed.data.paragraphs),
  };

  try {
    await prisma.aboutOverview.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...data },
      update: data,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidatePath('/admin/about-overview');
  revalidatePath('/admin');
  revalidatePath('/about/overview');
  return { ok: true };
}
