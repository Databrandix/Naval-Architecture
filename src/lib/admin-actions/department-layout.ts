'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import {
  departmentLayoutCreateSchema,
  departmentLayoutUpdateSchema,
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
async function requireAuth(): Promise<ActionResult | null> {
  const session = await getSession();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };
  return null;
}

function revalidateSurfaces() {
  revalidatePath('/about/department-layout');
  revalidatePath('/admin/department-layout');
  revalidatePath('/admin');
  revalidatePath('/', 'layout');
}

function readRow(formData: FormData) {
  const coverUrl = getStr(formData, 'coverUrl') || '/assets/site-school-1024x576.webp';
  return {
    slug:          getStr(formData, 'slug'),
    title:         getStr(formData, 'title'),
    shortTitle:    getStr(formData, 'shortTitle'),
    coverUrl,
    coverPublicId: emptyToNull(formData.get('coverPublicId')),
    pdfUrl:        emptyToNull(formData.get('pdfUrl')),
    pdfPublicId:   emptyToNull(formData.get('pdfPublicId')),
    pdfFileName:   emptyToNull(formData.get('pdfFileName')),
  };
}

export async function createDepartmentLayoutAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const parsed = departmentLayoutCreateSchema.safeParse(readRow(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ') };
  }
  const last = await prisma.departmentLayout.findFirst({ orderBy: { displayOrder: 'desc' }, select: { displayOrder: true } });
  const displayOrder = (last?.displayOrder ?? -1) + 1;
  try {
    await prisma.departmentLayout.create({ data: { ...parsed.data, displayOrder } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2002') {
      return { ok: false, error: `slug "${parsed.data.slug}" is already in use` };
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateSurfaces();
  redirect('/admin/department-layout');
}

export async function updateDepartmentLayoutAction(
  id: string,
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const parsed = departmentLayoutUpdateSchema.safeParse(readRow(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ') };
  }
  try {
    await prisma.departmentLayout.update({ where: { id }, data: parsed.data });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2025') return { ok: false, error: 'Department layout not found' };
    if (code === 'P2002') return { ok: false, error: 'slug already in use' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateSurfaces();
  revalidatePath(`/admin/department-layout/${id}`);
  return { ok: true };
}

export async function deleteDepartmentLayoutAction(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    await prisma.departmentLayout.delete({ where: { id } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Department layout not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateSurfaces();
  return { ok: true };
}

export async function reorderDepartmentLayoutsAction(ids: string[]): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const existing = await prisma.departmentLayout.findMany({ select: { id: true } });
  const existingIds = new Set(existing.map((r) => r.id));
  if (ids.length !== existingIds.size || !ids.every((id) => existingIds.has(id))) {
    return { ok: false, error: 'Reorder list must include exactly the existing department layouts' };
  }
  try {
    await prisma.$transaction(
      ids.map((id, index) => prisma.departmentLayout.update({ where: { id }, data: { displayOrder: index } })),
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateSurfaces();
  return { ok: true };
}
