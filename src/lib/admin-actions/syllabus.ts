'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { syllabusCreateSchema, syllabusUpdateSchema } from '@/lib/validation';

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
async function requireAuth(): Promise<ActionResult | null> {
  const session = await getSession();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };
  return null;
}

function revalidateSyllabusSurfaces() {
  revalidatePath('/student-society/syllabus');
  revalidatePath('/admin/syllabus');
  revalidatePath('/admin');
  revalidatePath('/', 'layout');
}

function readSyllabusRow(formData: FormData) {
  return {
    slug:          getStr(formData, 'slug'),
    title:         getStr(formData, 'title'),
    shortTitle:    getStr(formData, 'shortTitle'),
    department:    getStr(formData, 'department'),
    level:         getStr(formData, 'level'),
    coverUrl:      getStr(formData, 'coverUrl'),
    coverPublicId: emptyToNull(formData.get('coverPublicId')),
    pdfUrl:        emptyToNull(formData.get('pdfUrl')),
    pdfPublicId:   emptyToNull(formData.get('pdfPublicId')),
    pdfFileName:   emptyToNull(formData.get('pdfFileName')),
    summary:       getStr(formData, 'summary'),
  };
}

export async function createSyllabusAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const parsed = syllabusCreateSchema.safeParse(readSyllabusRow(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ') };
  }

  const last = await prisma.syllabus.findFirst({ orderBy: { displayOrder: 'desc' }, select: { displayOrder: true } });
  const displayOrder = (last?.displayOrder ?? -1) + 1;

  try {
    await prisma.syllabus.create({ data: { ...parsed.data, displayOrder } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2002') {
      return { ok: false, error: `slug "${parsed.data.slug}" is already in use` };
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateSyllabusSurfaces();
  redirect('/admin/syllabus');
}

export async function updateSyllabusAction(
  id: string,
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const parsed = syllabusUpdateSchema.safeParse(readSyllabusRow(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ') };
  }

  try {
    await prisma.syllabus.update({ where: { id }, data: parsed.data });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2025') return { ok: false, error: 'Syllabus not found' };
    if (code === 'P2002') return { ok: false, error: 'slug already in use' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateSyllabusSurfaces();
  revalidatePath(`/admin/syllabus/${id}`);
  return { ok: true };
}

export async function deleteSyllabusAction(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    await prisma.syllabus.delete({ where: { id } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Syllabus not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateSyllabusSurfaces();
  return { ok: true };
}

export async function reorderSyllabusAction(ids: string[]): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const existing = await prisma.syllabus.findMany({ select: { id: true } });
  const existingIds = new Set(existing.map((r) => r.id));
  if (ids.length !== existingIds.size || !ids.every((id) => existingIds.has(id))) {
    return { ok: false, error: 'Reorder list must include exactly the existing syllabi' };
  }
  try {
    await prisma.$transaction(
      ids.map((id, index) => prisma.syllabus.update({ where: { id }, data: { displayOrder: index } })),
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateSyllabusSurfaces();
  return { ok: true };
}
