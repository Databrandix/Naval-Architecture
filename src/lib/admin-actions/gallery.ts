'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import {
  galleryImageCreateSchema,
  galleryImageUpdateSchema,
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

function getInt(fd: FormData, key: string): number | undefined {
  const v = fd.get(key);
  if (typeof v !== 'string' || !v.trim()) return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

async function requireAuth(): Promise<ActionResult | null> {
  const session = await getSession();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };
  return null;
}

// Gallery has no homepage cross-reference; only /gallery + the admin
// surfaces need invalidation.
function revalidateGallerySurfaces() {
  revalidatePath('/gallery');
  revalidatePath('/admin/gallery');
  revalidatePath('/admin');
}

function readGalleryRow(formData: FormData) {
  return {
    imageUrl:      getStr(formData, 'imageUrl'),
    imagePublicId: emptyToNull(formData.get('imagePublicId')),
    alt:           getStr(formData, 'alt'),
    width:         getInt(formData, 'width') ?? 0,
    height:        getInt(formData, 'height') ?? 0,
  };
}

export async function createGalleryImageAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const raw = readGalleryRow(formData);
  const parsed = galleryImageCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; '),
    };
  }

  const last = await prisma.galleryImage.findFirst({
    orderBy: { displayOrder: 'desc' },
    select: { displayOrder: true },
  });
  const displayOrder = (last?.displayOrder ?? -1) + 1;

  try {
    await prisma.galleryImage.create({
      data: { ...parsed.data, displayOrder },
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidateGallerySurfaces();
  redirect('/admin/gallery');
}

export async function updateGalleryImageAction(
  id: string,
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const raw = readGalleryRow(formData);
  const parsed = galleryImageUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; '),
    };
  }

  try {
    await prisma.galleryImage.update({ where: { id }, data: parsed.data });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') {
      return { ok: false, error: 'Gallery image not found' };
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidateGallerySurfaces();
  revalidatePath(`/admin/gallery/${id}`);
  return { ok: true };
}

export async function deleteGalleryImageAction(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    await prisma.galleryImage.delete({ where: { id } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') {
      return { ok: false, error: 'Gallery image not found' };
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateGallerySurfaces();
  return { ok: true };
}

export async function reorderGalleryImagesAction(ids: string[]): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const existing = await prisma.galleryImage.findMany({ select: { id: true } });
  const existingIds = new Set(existing.map((r) => r.id));
  if (ids.length !== existingIds.size || !ids.every((id) => existingIds.has(id))) {
    return { ok: false, error: 'Reorder list must include exactly the existing gallery images' };
  }
  try {
    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.galleryImage.update({ where: { id }, data: { displayOrder: index } }),
      ),
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateGallerySurfaces();
  return { ok: true };
}
