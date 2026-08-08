'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { alumniCreateSchema, alumniUpdateSchema } from '@/lib/validation';

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

// Alumni rows feed both /student-society/alumni AND the global
// search index (rendered on every public page via the root layout).
// 'layout' scope invalidation refreshes search across all pages.
function revalidateAlumniSurfaces() {
  revalidatePath('/student-society/alumni');
  revalidatePath('/admin/alumni');
  revalidatePath('/admin');
  revalidatePath('/', 'layout');
}

function readAlumniRow(formData: FormData) {
  return {
    slug:          getStr(formData, 'slug'),
    studentId:     getStr(formData, 'studentId'),
    name:          getStr(formData, 'name'),
    department:    getStr(formData, 'department'),
    designation:   getStr(formData, 'designation'),
    company:       getStr(formData, 'company'),
    photoUrl:      emptyToNull(formData.get('photoUrl')),
    photoPublicId: emptyToNull(formData.get('photoPublicId')),
  };
}

export async function createAlumniAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const raw = readAlumniRow(formData);
  const parsed = alumniCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; '),
    };
  }

  const last = await prisma.alumni.findFirst({ orderBy: { displayOrder: 'desc' }, select: { displayOrder: true } });
  const displayOrder = (last?.displayOrder ?? -1) + 1;

  try {
    await prisma.alumni.create({ data: { ...parsed.data, displayOrder } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2002') {
      return { ok: false, error: `slug "${parsed.data.slug}" is already in use` };
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidateAlumniSurfaces();
  redirect('/admin/alumni');
}

export async function updateAlumniAction(
  id: string,
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const raw = readAlumniRow(formData);
  const parsed = alumniUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; '),
    };
  }

  try {
    await prisma.alumni.update({ where: { id }, data: parsed.data });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2025') return { ok: false, error: 'Alumni not found' };
    if (code === 'P2002') return { ok: false, error: 'slug already in use' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidateAlumniSurfaces();
  revalidatePath(`/admin/alumni/${id}`);
  return { ok: true };
}

export async function deleteAlumniAction(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    await prisma.alumni.delete({ where: { id } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Alumni not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateAlumniSurfaces();
  return { ok: true };
}

export async function reorderAlumniAction(ids: string[]): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const existing = await prisma.alumni.findMany({ select: { id: true } });
  const existingIds = new Set(existing.map((r) => r.id));
  if (ids.length !== existingIds.size || !ids.every((id) => existingIds.has(id))) {
    return { ok: false, error: 'Reorder list must include exactly the existing alumni' };
  }
  try {
    await prisma.$transaction(
      ids.map((id, index) => prisma.alumni.update({ where: { id }, data: { displayOrder: index } })),
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateAlumniSurfaces();
  return { ok: true };
}
