'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { newsLandingUpdateSchema } from '@/lib/validation';

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

export async function updateNewsLandingAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };

  const raw = {
    heroTitle:         getStr(formData, 'heroTitle'),
    heroSubtitle:      emptyToNull(formData.get('heroSubtitle')),
    heroOverline:      emptyToNull(formData.get('heroOverline')),
    heroImageUrl:      getStr(formData, 'heroImageUrl'),
    heroImagePublicId: emptyToNull(formData.get('heroImagePublicId')),
    heroImageVerticalPercent: formData.get('heroImageVerticalPercent') ?? undefined,
    introBody:         emptyToNull(formData.get('introBody')),
  };

  const parsed = newsLandingUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; '),
    };
  }

  const data = {
    ...parsed.data,
    introBody: parsed.data.introBody ? sanitizeHtml(parsed.data.introBody) : null,
  };

  try {
    await prisma.newsLanding.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...data },
      update: data,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidatePath('/admin/news-landing');
  revalidatePath('/admin');
  revalidatePath('/news');
  return { ok: true };
}
