'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { eventCreateSchema, eventUpdateSchema } from '@/lib/validation';

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

// <input type="date"> / <input type="datetime-local"> POSTs an empty
// string when admin clears the field — null lets Zod's nullable() pass.
function getDateOrNull(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== 'string' || !v.trim()) return null;
  return v;
}

function getParagraphs(fd: FormData, key: string): string[] {
  return fd.getAll(key)
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

function parseKeyValueArray(fd: FormData, key: string): unknown {
  const raw = fd.get(key);
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Checkbox emits 'on' when checked, absent otherwise.
function getBool(fd: FormData, key: string): boolean {
  return fd.get(key) === 'on';
}

async function requireAuth(): Promise<ActionResult | null> {
  const session = await getSession();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };
  return null;
}

// Event content lives on /student-society/events, /[slug], and the
// homepage EventsSection (top 3 by createdAt — see CP6.3 for exact
// sort). Every mutation invalidates all surfaces.
function revalidateEventSurfaces(slug?: string) {
  revalidatePath('/student-society/events');
  if (slug) revalidatePath(`/student-society/events/${slug}`);
  revalidatePath('/');
  revalidatePath('/admin/events');
  revalidatePath('/admin');
}

function readEventRow(formData: FormData) {
  return {
    slug:          getStr(formData, 'slug'),
    title:         getStr(formData, 'title'),
    shortTitle:    getStr(formData, 'shortTitle'),
    category:      getStr(formData, 'category'),
    status:        getStr(formData, 'status'),
    eventDate:     getDateOrNull(formData, 'eventDate'),
    displayDate:   emptyToNull(formData.get('displayDate')),
    time:          emptyToNull(formData.get('time')),
    venue:         emptyToNull(formData.get('venue')),
    imageUrl:      getStr(formData, 'imageUrl'),
    imagePublicId: emptyToNull(formData.get('imagePublicId')),
    summary:       getStr(formData, 'summary'),
    description:   getParagraphs(formData, 'description'),
    focus:         getStr(formData, 'focus'),
    details:       parseKeyValueArray(formData, 'details'),
    ctaLabel:      emptyToNull(formData.get('ctaLabel')),
    ctaHref:       emptyToNull(formData.get('ctaHref')),
    ctaExternal:   getBool(formData, 'ctaExternal'),
  };
}

export async function createEventAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const raw = readEventRow(formData);
  const parsed = eventCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; '),
    };
  }

  try {
    await prisma.event.create({
      data: {
        ...parsed.data,
        description: parsed.data.description as Prisma.InputJsonValue,
        details: parsed.data.details as unknown as Prisma.InputJsonValue,
      },
    });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2002') {
      return { ok: false, error: `slug "${parsed.data.slug}" is already in use` };
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidateEventSurfaces(parsed.data.slug);
  redirect('/admin/events');
}

export async function updateEventAction(
  id: string,
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const raw = readEventRow(formData);
  const parsed = eventUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; '),
    };
  }

  try {
    await prisma.event.update({
      where: { id },
      data: {
        ...parsed.data,
        description: parsed.data.description as Prisma.InputJsonValue,
        details: parsed.data.details as unknown as Prisma.InputJsonValue,
      },
    });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2025') return { ok: false, error: 'Event not found' };
    if (code === 'P2002') return { ok: false, error: 'slug already in use' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidateEventSurfaces(parsed.data.slug);
  revalidatePath(`/admin/events/${id}`);
  return { ok: true };
}

export async function deleteEventAction(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  let slug: string | null = null;
  try {
    const existing = await prisma.event.findUnique({ where: { id }, select: { slug: true } });
    slug = existing?.slug ?? null;
    await prisma.event.delete({ where: { id } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Event not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateEventSurfaces(slug ?? undefined);
  return { ok: true };
}
