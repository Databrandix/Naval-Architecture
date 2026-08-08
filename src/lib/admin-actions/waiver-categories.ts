'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import {
  waiverCategoryCreateSchema,
  waiverCategoryUpdateSchema,
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

function revalidateWaiverCategorySurfaces() {
  revalidatePath('/admission/waiver-scholarship');
  revalidatePath('/admin/waiver-categories');
  revalidatePath('/admin');
  revalidatePath('/', 'layout');
}

function readWaiverCategoryRow(formData: FormData) {
  return {
    slug:     getStr(formData, 'slug'),
    iconName: getStr(formData, 'iconName'),
    title:    getStr(formData, 'title'),
    items:    parseJsonArray(formData, 'items'),
    note:     emptyToNull(formData.get('note')),
  };
}

export async function createWaiverCategoryAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const parsed = waiverCategoryCreateSchema.safeParse(readWaiverCategoryRow(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ') };
  }

  const last = await prisma.waiverCategory.findFirst({ orderBy: { displayOrder: 'desc' }, select: { displayOrder: true } });
  const displayOrder = (last?.displayOrder ?? -1) + 1;

  try {
    await prisma.waiverCategory.create({
      data: {
        ...parsed.data,
        items: parsed.data.items as unknown as Prisma.InputJsonValue,
        displayOrder,
      },
    });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2002') {
      return { ok: false, error: `slug "${parsed.data.slug}" is already in use` };
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateWaiverCategorySurfaces();
  redirect('/admin/waiver-categories');
}

export async function updateWaiverCategoryAction(
  id: string,
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const parsed = waiverCategoryUpdateSchema.safeParse(readWaiverCategoryRow(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ') };
  }

  try {
    await prisma.waiverCategory.update({
      where: { id },
      data: {
        ...parsed.data,
        items: parsed.data.items as unknown as Prisma.InputJsonValue,
      },
    });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2025') return { ok: false, error: 'Waiver category not found' };
    if (code === 'P2002') return { ok: false, error: 'slug already in use' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateWaiverCategorySurfaces();
  revalidatePath(`/admin/waiver-categories/${id}`);
  return { ok: true };
}

export async function deleteWaiverCategoryAction(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    await prisma.waiverCategory.delete({ where: { id } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Waiver category not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateWaiverCategorySurfaces();
  return { ok: true };
}

export async function reorderWaiverCategoriesAction(ids: string[]): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const existing = await prisma.waiverCategory.findMany({ select: { id: true } });
  const existingIds = new Set(existing.map((r) => r.id));
  if (ids.length !== existingIds.size || !ids.every((id) => existingIds.has(id))) {
    return { ok: false, error: 'Reorder list must include exactly the existing waiver categories' };
  }
  try {
    await prisma.$transaction(
      ids.map((id, index) => prisma.waiverCategory.update({ where: { id }, data: { displayOrder: index } })),
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateWaiverCategorySurfaces();
  return { ok: true };
}
