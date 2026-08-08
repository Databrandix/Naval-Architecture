'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { sanitizeHtmlArray } from '@/lib/sanitize-html';
import {
  admissionNoticeCreateSchema,
  admissionNoticeUpdateSchema,
} from '@/lib/validation';

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
function getParagraphs(fd: FormData, key: string): string[] {
  return fd.getAll(key)
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}
function getBool(fd: FormData, key: string): boolean {
  return fd.get(key) === 'on';
}
async function requireAuth(): Promise<ActionResult | null> {
  const session = await getSession();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };
  return null;
}

// /admission/notice renders the latest isActive=true notice and is
// linked from search-index; every mutation invalidates both.
function revalidateAdmissionNoticeSurfaces() {
  revalidatePath('/admission/notice');
  revalidatePath('/admin/admission-notices');
  revalidatePath('/admin');
  revalidatePath('/', 'layout');
}

function readAdmissionNoticeRow(formData: FormData) {
  return {
    slug:                 getStr(formData, 'slug'),
    title:                getStr(formData, 'title'),
    refNo:                getStr(formData, 'refNo'),
    subject:              getStr(formData, 'subject'),
    publishedAt:          getStr(formData, 'publishedAt'),
    displayDate:          emptyToNull(formData.get('displayDate')),
    headerOverline:       getStr(formData, 'headerOverline'),
    bodyParagraphs:       getParagraphs(formData, 'bodyParagraphs'),
    signatoryPreamble:    emptyToNull(formData.get('signatoryPreamble')),
    signatoryName:        getStr(formData, 'signatoryName'),
    signatoryDesignation: getStr(formData, 'signatoryDesignation'),
    ccLabel:              getStr(formData, 'ccLabel'),
    ccList:               getParagraphs(formData, 'ccList'),
    heroImageUrl:         emptyToNull(formData.get('heroImageUrl')),
    heroImagePublicId:    emptyToNull(formData.get('heroImagePublicId')),
    fileUrl:              emptyToNull(formData.get('fileUrl')),
    filePublicId:         emptyToNull(formData.get('filePublicId')),
    fileName:             emptyToNull(formData.get('fileName')),
    isActive:             getBool(formData, 'isActive'),
  };
}

export async function createAdmissionNoticeAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const parsed = admissionNoticeCreateSchema.safeParse(readAdmissionNoticeRow(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ') };
  }

  const last = await prisma.admissionNotice.findFirst({ orderBy: { displayOrder: 'desc' }, select: { displayOrder: true } });
  const displayOrder = (last?.displayOrder ?? -1) + 1;

  try {
    await prisma.admissionNotice.create({
      data: {
        ...parsed.data,
        // Phase 19 CP19.5 — sanitize HTML-allowed paragraphs.
        bodyParagraphs: sanitizeHtmlArray(parsed.data.bodyParagraphs) as unknown as Prisma.InputJsonValue,
        ccList:         parsed.data.ccList         as Prisma.InputJsonValue,
        displayOrder,
      },
    });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2002') {
      return { ok: false, error: `slug "${parsed.data.slug}" is already in use` };
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateAdmissionNoticeSurfaces();
  redirect('/admin/admission-notices');
}

export async function updateAdmissionNoticeAction(
  id: string,
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const parsed = admissionNoticeUpdateSchema.safeParse(readAdmissionNoticeRow(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ') };
  }

  try {
    await prisma.admissionNotice.update({
      where: { id },
      data: {
        ...parsed.data,
        // Phase 19 CP19.5 — sanitize HTML-allowed paragraphs.
        bodyParagraphs: sanitizeHtmlArray(parsed.data.bodyParagraphs) as unknown as Prisma.InputJsonValue,
        ccList:         parsed.data.ccList         as Prisma.InputJsonValue,
      },
    });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2025') return { ok: false, error: 'Admission notice not found' };
    if (code === 'P2002') return { ok: false, error: 'slug already in use' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateAdmissionNoticeSurfaces();
  revalidatePath(`/admin/admission-notices/${id}`);
  return { ok: true };
}

export async function deleteAdmissionNoticeAction(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    await prisma.admissionNotice.delete({ where: { id } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Admission notice not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateAdmissionNoticeSurfaces();
  return { ok: true };
}

export async function reorderAdmissionNoticesAction(ids: string[]): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const existing = await prisma.admissionNotice.findMany({ select: { id: true } });
  const existingIds = new Set(existing.map((r) => r.id));
  if (ids.length !== existingIds.size || !ids.every((id) => existingIds.has(id))) {
    return { ok: false, error: 'Reorder list must include exactly the existing admission notices' };
  }
  try {
    await prisma.$transaction(
      ids.map((id, index) => prisma.admissionNotice.update({ where: { id }, data: { displayOrder: index } })),
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateAdmissionNoticeSurfaces();
  return { ok: true };
}
