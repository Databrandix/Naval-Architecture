'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { journeyCTAContentUpdateSchema } from '@/lib/validation';

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
function getBool(fd: FormData, key: string): boolean {
  return fd.get(key) === 'on';
}

export async function updateJourneyCTAContentAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };

  const raw = {
    heroImageUrl:         getStr(formData, 'heroImageUrl'),
    heroImagePublicId:    emptyToNull(formData.get('heroImagePublicId')),
    heroImageVerticalPercent: formData.get('heroImageVerticalPercent') ?? undefined,
    heading:              getStr(formData, 'heading'),
    body:                 getStr(formData, 'body'),
    primaryCtaLabel:      getStr(formData, 'primaryCtaLabel'),
    primaryCtaHref:       getStr(formData, 'primaryCtaHref'),
    primaryCtaExternal:   getBool(formData, 'primaryCtaExternal'),
    secondaryCtaLabel:    getStr(formData, 'secondaryCtaLabel'),
    secondaryCtaHref:     getStr(formData, 'secondaryCtaHref'),
    secondaryCtaExternal: getBool(formData, 'secondaryCtaExternal'),
  };

  const parsed = journeyCTAContentUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; '),
    };
  }

  // Phase 19 CP19.5 — sanitize HTML-allowed `body` before persisting.
  const data = { ...parsed.data, body: sanitizeHtml(parsed.data.body) };

  try {
    await prisma.journeyCTAContent.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...data },
      update: data,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidatePath('/admin/journey-cta');
  revalidatePath('/admin');
  // The JourneyCTASection renders on every public page via the root
  // layout — invalidate at layout scope so all public routes pick up
  // the new copy on next request.
  revalidatePath('/', 'layout');
  return { ok: true };
}
