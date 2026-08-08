'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { researchPaperCreateSchema, researchPaperUpdateSchema } from '@/lib/validation';

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
function getIntOrNull(fd: FormData, key: string): number | null {
  const v = fd.get(key);
  if (typeof v !== 'string' || !v.trim()) return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}
async function requireAuth(): Promise<ActionResult | null> {
  const session = await getSession();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };
  return null;
}

function revalidateResearchPaperSurfaces() {
  revalidatePath('/research');
  revalidatePath('/admin/research-papers');
  revalidatePath('/admin');
  revalidatePath('/', 'layout');
}

function readResearchPaperRow(formData: FormData) {
  let links: { label: string; value: string }[] = [];
  try { links = JSON.parse(getStr(formData, 'links') || '[]'); } catch { /* keep [] */ }

  return {
    title:           getStr(formData, 'title'),
    authors:         getStr(formData, 'authors'),
    area:            getStr(formData, 'area'),
    date:            emptyToNull(formData.get('date')),
    publicationYear: getIntOrNull(formData, 'publicationYear'),
    links,
  };
}

export async function createResearchPaperAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const parsed = researchPaperCreateSchema.safeParse(readResearchPaperRow(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ') };
  }

  const last = await prisma.researchPaper.findFirst({ orderBy: { displayOrder: 'desc' }, select: { displayOrder: true } });
  const displayOrder = (last?.displayOrder ?? -1) + 1;

  try {
    await prisma.researchPaper.create({ data: { ...parsed.data, displayOrder } });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateResearchPaperSurfaces();
  redirect('/admin/research-papers');
}

export async function updateResearchPaperAction(
  id: string,
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const parsed = researchPaperUpdateSchema.safeParse(readResearchPaperRow(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ') };
  }

  try {
    await prisma.researchPaper.update({ where: { id }, data: parsed.data });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Research paper not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateResearchPaperSurfaces();
  revalidatePath(`/admin/research-papers/${id}`);
  return { ok: true };
}

export async function deleteResearchPaperAction(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    await prisma.researchPaper.delete({ where: { id } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Research paper not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateResearchPaperSurfaces();
  return { ok: true };
}

export async function reorderResearchPapersAction(ids: string[]): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const existing = await prisma.researchPaper.findMany({ select: { id: true } });
  const existingIds = new Set(existing.map((r) => r.id));
  if (ids.length !== existingIds.size || !ids.every((id) => existingIds.has(id))) {
    return { ok: false, error: 'Reorder list must include exactly the existing research papers' };
  }
  try {
    await prisma.$transaction(
      ids.map((id, index) => prisma.researchPaper.update({ where: { id }, data: { displayOrder: index } })),
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateResearchPaperSurfaces();
  return { ok: true };
}
