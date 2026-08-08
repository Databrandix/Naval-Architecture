'use server';

import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { contactPageContentUpdateSchema } from '@/lib/validation';

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
    return null; // signal parse error to Zod (will fail array validation)
  }
}

export async function updateContactPageContentAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };

  const cards = parseJsonArray(formData, 'quickContactCards');
  if (cards === null) {
    return { ok: false, error: 'quickContactCards: invalid JSON' };
  }

  const raw = {
    heroTitle:           getStr(formData, 'heroTitle'),
    heroOverline:        emptyToNull(formData.get('heroOverline')),
    heroImageUrl:        getStr(formData, 'heroImageUrl'),
    heroImagePublicId:   emptyToNull(formData.get('heroImagePublicId')),
    heroImageVerticalPercent: formData.get('heroImageVerticalPercent') ?? undefined,
    introBody:           getStr(formData, 'introBody'),
    quickContactHeading: getStr(formData, 'quickContactHeading'),
    formHeading:         getStr(formData, 'formHeading'),
    formSubheading:      getStr(formData, 'formSubheading'),
    campusesHeading:     getStr(formData, 'campusesHeading'),
    responseTimeNote:    getStr(formData, 'responseTimeNote'),
    quickContactCards:   cards,
  };

  const parsed = contactPageContentUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; '),
    };
  }

  // Phase 19 CP19.5 — sanitize HTML-allowed `introBody` before persisting.
  const data = {
    ...parsed.data,
    introBody: sanitizeHtml(parsed.data.introBody),
    quickContactCards: parsed.data.quickContactCards as unknown as Prisma.InputJsonValue,
  };

  try {
    await prisma.contactPageContent.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...data },
      update: data,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidatePath('/admin/contact-page');
  revalidatePath('/admin');
  revalidatePath('/contact');
  revalidatePath('/', 'layout');
  return { ok: true };
}
