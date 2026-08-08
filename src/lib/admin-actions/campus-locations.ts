'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import {
  campusLocationCreateSchema,
  campusLocationUpdateSchema,
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

function revalidateCampusSurfaces() {
  revalidatePath('/contact');
  revalidatePath('/admin/campus-locations');
  revalidatePath('/admin');
  revalidatePath('/', 'layout');
}

function readCampusRow(formData: FormData) {
  return {
    slug:    getStr(formData, 'slug'),
    name:    getStr(formData, 'name'),
    tag:     emptyToNull(formData.get('tag')),
    address: getStr(formData, 'address'),
    phone:   emptyToNull(formData.get('phone')),
    email:   getStr(formData, 'email'),
    mapsUrl: emptyToNull(formData.get('mapsUrl')),
  };
}

export async function createCampusLocationAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const parsed = campusLocationCreateSchema.safeParse(readCampusRow(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ') };
  }

  const last = await prisma.campusLocation.findFirst({
    orderBy: { displayOrder: 'desc' },
    select: { displayOrder: true },
  });
  const displayOrder = (last?.displayOrder ?? -1) + 1;

  try {
    await prisma.campusLocation.create({ data: { ...parsed.data, displayOrder } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2002') {
      return { ok: false, error: `slug "${parsed.data.slug}" is already in use` };
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateCampusSurfaces();
  redirect('/admin/campus-locations');
}

export async function updateCampusLocationAction(
  id: string,
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const parsed = campusLocationUpdateSchema.safeParse(readCampusRow(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ') };
  }

  try {
    await prisma.campusLocation.update({ where: { id }, data: parsed.data });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2025') return { ok: false, error: 'Campus location not found' };
    if (code === 'P2002') return { ok: false, error: 'slug already in use' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateCampusSurfaces();
  revalidatePath(`/admin/campus-locations/${id}`);
  return { ok: true };
}

export async function deleteCampusLocationAction(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    await prisma.campusLocation.delete({ where: { id } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Campus location not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateCampusSurfaces();
  return { ok: true };
}

export async function reorderCampusLocationsAction(ids: string[]): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const existing = await prisma.campusLocation.findMany({ select: { id: true } });
  const existingIds = new Set(existing.map((r) => r.id));
  if (ids.length !== existingIds.size || !ids.every((id) => existingIds.has(id))) {
    return { ok: false, error: 'Reorder list must include exactly the existing campus locations' };
  }
  try {
    await prisma.$transaction(
      ids.map((id, index) => prisma.campusLocation.update({ where: { id }, data: { displayOrder: index } })),
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateCampusSurfaces();
  return { ok: true };
}
