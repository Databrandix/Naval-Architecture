'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { newsCreateSchema, newsUpdateSchema } from '@/lib/validation';

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

// ParagraphsEditor serializes via repeated hidden inputs of the same
// name; FormData.getAll returns them in order. Empty strings are
// dropped so Zod's .min(1) per-entry rule doesn't reject legitimate
// rows where admin left a trailing blank.
function getParagraphs(fd: FormData, key: string): string[] {
  return fd.getAll(key)
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

// KeyValueListEditor serializes the whole array as ONE JSON-encoded
// hidden input. Defensive parse — returns [] on malformed.
function parseKeyValueArray(fd: FormData, key: string): unknown {
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

// News content lives on /news, /news/[slug], and the homepage
// NewsSection (top 5 by publishedAt). Every mutation invalidates all.
function revalidateNewsSurfaces(slug?: string) {
  revalidatePath('/news');
  if (slug) revalidatePath(`/news/${slug}`);
  revalidatePath('/');
  revalidatePath('/admin/news');
  revalidatePath('/admin');
}

function readNewsRow(formData: FormData) {
  return {
    slug:          getStr(formData, 'slug'),
    title:         getStr(formData, 'title'),
    shortTitle:    getStr(formData, 'shortTitle'),
    category:      getStr(formData, 'category'),
    publishedAt:   getStr(formData, 'publishedAt'),
    displayDate:   emptyToNull(formData.get('displayDate')),
    summary:       getStr(formData, 'summary'),
    coverUrl:      getStr(formData, 'coverUrl'),
    coverPublicId: emptyToNull(formData.get('coverPublicId')),
    body:          getParagraphs(formData, 'body'),
    meta:          parseKeyValueArray(formData, 'meta'),
  };
}

export async function createNewsAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const raw = readNewsRow(formData);
  const parsed = newsCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; '),
    };
  }

  try {
    await prisma.news.create({
      data: {
        ...parsed.data,
        body: parsed.data.body as Prisma.InputJsonValue,
        meta: parsed.data.meta as unknown as Prisma.InputJsonValue,
      },
    });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2002') {
      return { ok: false, error: `slug "${parsed.data.slug}" is already in use` };
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidateNewsSurfaces(parsed.data.slug);
  redirect('/admin/news');
}

export async function updateNewsAction(
  id: string,
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const raw = readNewsRow(formData);
  const parsed = newsUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; '),
    };
  }

  try {
    await prisma.news.update({
      where: { id },
      data: {
        ...parsed.data,
        body: parsed.data.body as Prisma.InputJsonValue,
        meta: parsed.data.meta as unknown as Prisma.InputJsonValue,
      },
    });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2025') return { ok: false, error: 'News article not found' };
    if (code === 'P2002') return { ok: false, error: 'slug already in use' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidateNewsSurfaces(parsed.data.slug);
  revalidatePath(`/admin/news/${id}`);
  return { ok: true };
}

export async function deleteNewsAction(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  let slug: string | null = null;
  try {
    const existing = await prisma.news.findUnique({ where: { id }, select: { slug: true } });
    slug = existing?.slug ?? null;
    await prisma.news.delete({ where: { id } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'News article not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateNewsSurfaces(slug ?? undefined);
  return { ok: true };
}
