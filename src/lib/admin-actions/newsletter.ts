'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { newsletterPageUpdateSchema } from '@/lib/validation';

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

export async function updateNewsletterPageAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const raw = {
    heroTitle:                getStr(formData, 'heroTitle'),
    heroSubtitle:             emptyToNull(formData.get('heroSubtitle')),
    heroOverline:             emptyToNull(formData.get('heroOverline')),
    heroImageUrl:             getStr(formData, 'heroImageUrl'),
    heroImagePublicId:        emptyToNull(formData.get('heroImagePublicId')),
    heroImageVerticalPercent: formData.get('heroImageVerticalPercent') ?? undefined,
    introBody:                getStr(formData, 'introBody'),
    advantagesOverline:       emptyToNull(formData.get('advantagesOverline')),
    advantagesHeading:        getStr(formData, 'advantagesHeading'),
    advantages:               parseJsonArray(formData, 'advantages'),
    ctaHeading:               getStr(formData, 'ctaHeading'),
    ctaBody:                  emptyToNull(formData.get('ctaBody')),
    ctaButtonLabel:           getStr(formData, 'ctaButtonLabel'),
    emailPlaceholder:         getStr(formData, 'emailPlaceholder'),
    privacyNote:              emptyToNull(formData.get('privacyNote')),
  };

  const parsed = newsletterPageUpdateSchema.safeParse(raw);
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
    // introBody allows HTML (sanitized at write time, J1 pattern).
    introBody: sanitizeHtml(parsed.data.introBody),
    advantages: parsed.data.advantages as unknown as Prisma.InputJsonValue,
  };

  try {
    await prisma.newsletterPage.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...data },
      update: data,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidatePath('/newsletter');
  revalidatePath('/admin/newsletter');
  revalidatePath('/admin');
  return { ok: true };
}

export async function deleteNewsletterSubscriberAction(
  id: string,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    await prisma.newsletterSubscriber.delete({ where: { id } });
  } catch (e: unknown) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2025'
    ) {
      return { ok: false, error: 'Subscriber not found' };
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidatePath('/admin/newsletter-subscribers');
  revalidatePath('/admin');
  return { ok: true };
}
