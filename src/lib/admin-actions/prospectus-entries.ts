'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import {
  prospectusEntryCreateSchema,
  prospectusEntryUpdateSchema,
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

function revalidateProspectusSurfaces() {
  revalidatePath('/admission/prospectus');
  revalidatePath('/admin/prospectus-entries');
  revalidatePath('/admin');
  revalidatePath('/', 'layout');
}

function readProspectusRow(formData: FormData) {
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
  };
}

export async function createProspectusEntryAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const parsed = prospectusEntryCreateSchema.safeParse(readProspectusRow(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ') };
  }

  const last = await prisma.prospectusEntry.findFirst({ orderBy: { displayOrder: 'desc' }, select: { displayOrder: true } });
  const displayOrder = (last?.displayOrder ?? -1) + 1;

  try {
    await prisma.prospectusEntry.create({ data: { ...parsed.data, displayOrder } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2002') {
      return { ok: false, error: `slug "${parsed.data.slug}" is already in use` };
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateProspectusSurfaces();
  redirect('/admin/prospectus-entries');
}

export async function updateProspectusEntryAction(
  id: string,
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const parsed = prospectusEntryUpdateSchema.safeParse(readProspectusRow(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ') };
  }

  try {
    await prisma.prospectusEntry.update({ where: { id }, data: parsed.data });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2025') return { ok: false, error: 'Prospectus entry not found' };
    if (code === 'P2002') return { ok: false, error: 'slug already in use' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateProspectusSurfaces();
  revalidatePath(`/admin/prospectus-entries/${id}`);
  return { ok: true };
}

export async function deleteProspectusEntryAction(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    await prisma.prospectusEntry.delete({ where: { id } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Prospectus entry not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateProspectusSurfaces();
  return { ok: true };
}

export async function reorderProspectusEntriesAction(ids: string[]): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const existing = await prisma.prospectusEntry.findMany({ select: { id: true } });
  const existingIds = new Set(existing.map((r) => r.id));
  if (ids.length !== existingIds.size || !ids.every((id) => existingIds.has(id))) {
    return { ok: false, error: 'Reorder list must include exactly the existing prospectus entries' };
  }
  try {
    await prisma.$transaction(
      ids.map((id, index) => prisma.prospectusEntry.update({ where: { id }, data: { displayOrder: index } })),
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateProspectusSurfaces();
  return { ok: true };
}
