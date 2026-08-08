'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { noticeCreateSchema, noticeUpdateSchema } from '@/lib/validation';

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

// fileType is set by ImageUploader's onChange.meta.fileType (string).
// Empty / missing means no attachment yet — coerce to null. 'image'
// and 'pdf' pass through unchanged (Zod enforces the enum).
function getFileType(fd: FormData): 'image' | 'pdf' | null {
  const v = fd.get('fileType');
  if (typeof v !== 'string') return null;
  const t = v.trim();
  if (t === 'image' || t === 'pdf') return t;
  return null;
}

async function requireAuth(): Promise<ActionResult | null> {
  const session = await getSession();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };
  return null;
}

// Notice content lives on /student-society/notice-board AND the
// homepage NoticesSection (top 5 by publishedAt). Every mutation
// invalidates both surfaces. No /[slug] detail page (notice file
// is the artifact).
function revalidateNoticeSurfaces() {
  revalidatePath('/student-society/notice-board');
  revalidatePath('/');
  revalidatePath('/admin/notices');
  revalidatePath('/admin');
}

function readNoticeRow(formData: FormData) {
  return {
    slug:         getStr(formData, 'slug'),
    title:        getStr(formData, 'title'),
    category:     getStr(formData, 'category'),
    department:   getStr(formData, 'department'),
    publishedAt:  getStr(formData, 'publishedAt'),
    displayDate:  emptyToNull(formData.get('displayDate')),
    description:  getStr(formData, 'description'),
    fileUrl:      emptyToNull(formData.get('fileUrl')),
    filePublicId: emptyToNull(formData.get('filePublicId')),
    fileType:     getFileType(formData),
    fileName:     emptyToNull(formData.get('fileName')),
  };
}

export async function createNoticeAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const raw = readNoticeRow(formData);
  const parsed = noticeCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; '),
    };
  }

  try {
    await prisma.notice.create({ data: parsed.data });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2002') {
      return { ok: false, error: `slug "${parsed.data.slug}" is already in use` };
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidateNoticeSurfaces();
  redirect('/admin/notices');
}

export async function updateNoticeAction(
  id: string,
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const raw = readNoticeRow(formData);
  const parsed = noticeUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; '),
    };
  }

  try {
    await prisma.notice.update({ where: { id }, data: parsed.data });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2025') return { ok: false, error: 'Notice not found' };
    if (code === 'P2002') return { ok: false, error: 'slug already in use' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidateNoticeSurfaces();
  revalidatePath(`/admin/notices/${id}`);
  return { ok: true };
}

export async function deleteNoticeAction(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    await prisma.notice.delete({ where: { id } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Notice not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateNoticeSurfaces();
  return { ok: true };
}
