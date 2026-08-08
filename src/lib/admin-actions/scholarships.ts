'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import {
  scholarshipCreateSchema,
  scholarshipUpdateSchema,
} from '@/lib/validation';

export type ActionResult = { ok: true } | { ok: false; error: string };

function getStr(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === 'string' ? v.trim() : '';
}
function getBool(fd: FormData, key: string): boolean {
  return fd.get(key) === 'on';
}
async function requireAuth(): Promise<ActionResult | null> {
  const session = await getSession();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };
  return null;
}

function revalidateScholarshipSurfaces() {
  revalidatePath('/admission/waiver-scholarship');
  revalidatePath('/admin/scholarships');
  revalidatePath('/admin');
  revalidatePath('/', 'layout');
}

function readScholarshipRow(formData: FormData) {
  return {
    slug:        getStr(formData, 'slug'),
    name:        getStr(formData, 'name'),
    credits:     getStr(formData, 'credits'),
    base:        getStr(formData, 'base'),
    perfect:     getStr(formData, 'perfect'),
    near:        getStr(formData, 'near'),
    isHighlight: getBool(formData, 'isHighlight'),
  };
}

export async function createScholarshipAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const parsed = scholarshipCreateSchema.safeParse(readScholarshipRow(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ') };
  }

  const last = await prisma.scholarship.findFirst({ orderBy: { displayOrder: 'desc' }, select: { displayOrder: true } });
  const displayOrder = (last?.displayOrder ?? -1) + 1;

  try {
    await prisma.scholarship.create({ data: { ...parsed.data, displayOrder } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2002') {
      return { ok: false, error: `slug "${parsed.data.slug}" is already in use` };
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateScholarshipSurfaces();
  redirect('/admin/scholarships');
}

export async function updateScholarshipAction(
  id: string,
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const parsed = scholarshipUpdateSchema.safeParse(readScholarshipRow(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ') };
  }

  try {
    await prisma.scholarship.update({ where: { id }, data: parsed.data });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2025') return { ok: false, error: 'Scholarship not found' };
    if (code === 'P2002') return { ok: false, error: 'slug already in use' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateScholarshipSurfaces();
  revalidatePath(`/admin/scholarships/${id}`);
  return { ok: true };
}

export async function deleteScholarshipAction(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    await prisma.scholarship.delete({ where: { id } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Scholarship not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateScholarshipSurfaces();
  return { ok: true };
}

export async function reorderScholarshipsAction(ids: string[]): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const existing = await prisma.scholarship.findMany({ select: { id: true } });
  const existingIds = new Set(existing.map((r) => r.id));
  if (ids.length !== existingIds.size || !ids.every((id) => existingIds.has(id))) {
    return { ok: false, error: 'Reorder list must include exactly the existing scholarships' };
  }
  try {
    await prisma.$transaction(
      ids.map((id, index) => prisma.scholarship.update({ where: { id }, data: { displayOrder: index } })),
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateScholarshipSurfaces();
  return { ok: true };
}
