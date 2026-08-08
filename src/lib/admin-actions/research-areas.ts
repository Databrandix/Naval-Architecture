'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import {
  researchAreaCreateSchema,
  researchAreaUpdateSchema,
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

// Icon dual-mode normalization:
//   The Zod refine on researchAreaCreateSchema / researchAreaUpdateSchema
//   requires EXACTLY ONE source (iconName XOR (iconPublicId + iconUrl)).
//   The form hides the unused branch's inputs; we read whichever is non-empty.
function readIcon(formData: FormData) {
  const iconName     = emptyToNull(formData.get('iconName'));
  const iconPublicId = emptyToNull(formData.get('iconPublicId'));
  const iconUrl      = emptyToNull(formData.get('iconUrl'));
  return { iconName, iconPublicId, iconUrl };
}

// Featured slot — at most one ResearchArea should have isFeatured=true.
// When the incoming row sets isFeatured=true and another row already
// holds it, the other row is demoted inside the same transaction so a
// transient "two featured" window never exists.
function readFeatured(formData: FormData) {
  return {
    isFeatured:            formData.get('isFeatured') === 'on',
    featuredHeading:       emptyToNull(formData.get('featuredHeading')),
    featuredImageUrl:      emptyToNull(formData.get('featuredImageUrl')),
    featuredImagePublicId: emptyToNull(formData.get('featuredImagePublicId')),
    featuredDescription:   emptyToNull(formData.get('featuredDescription')),
    featuredCtaHref:       emptyToNull(formData.get('featuredCtaHref')),
  };
}

export async function createResearchAreaAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const icon = readIcon(formData);
  const featured = readFeatured(formData);
  const raw = {
    ...icon,
    ...featured,
    areaName:    getStr(formData, 'areaName'),
    description: emptyToNull(formData.get('description')),
  };

  const parsed = researchAreaCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; '),
    };
  }

  const last = await prisma.researchArea.findFirst({
    orderBy: { displayOrder: 'desc' },
    select: { displayOrder: true },
  });
  const displayOrder = (last?.displayOrder ?? -1) + 1;

  const usesUpload = !!parsed.data.iconPublicId && !!parsed.data.iconUrl;

  try {
    await prisma.$transaction(async (tx) => {
      // Demote any existing featured row when this new row claims it.
      if (parsed.data.isFeatured) {
        await tx.researchArea.updateMany({
          where: { isFeatured: true },
          data:  { isFeatured: false },
        });
      }
      await tx.researchArea.create({
        data: {
          areaName:     parsed.data.areaName,
          description:  parsed.data.description ?? null,
          displayOrder,
          iconName:     usesUpload ? null : parsed.data.iconName!,
          iconPublicId: usesUpload ? parsed.data.iconPublicId! : null,
          iconUrl:      usesUpload ? parsed.data.iconUrl!      : null,
          isFeatured:            parsed.data.isFeatured ?? false,
          featuredHeading:       parsed.data.featuredHeading ?? null,
          featuredImageUrl:      parsed.data.featuredImageUrl ?? null,
          featuredImagePublicId: parsed.data.featuredImagePublicId ?? null,
          featuredDescription:   parsed.data.featuredDescription ?? null,
          featuredCtaHref:       parsed.data.featuredCtaHref ?? null,
        },
      });
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidatePath('/admin/research-areas');
  revalidatePath('/admin');
  // Public surface: homepage MajorResearchSection. Must run BEFORE
  // redirect() — redirect() throws and anything after is
  // unreachable.
  revalidatePath('/');
  redirect('/admin/research-areas');
}

export async function updateResearchAreaAction(
  id: string,
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const icon = readIcon(formData);
  const featured = readFeatured(formData);
  const raw = {
    ...icon,
    ...featured,
    areaName:    getStr(formData, 'areaName'),
    description: emptyToNull(formData.get('description')),
  };

  const parsed = researchAreaUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; '),
    };
  }

  // Normalize: when iconPublicId+iconUrl are set, force iconName=null
  const usesUpload = !!parsed.data.iconPublicId && !!parsed.data.iconUrl;
  const data: Record<string, unknown> = {};
  if (parsed.data.areaName    !== undefined) data.areaName    = parsed.data.areaName;
  if (parsed.data.description !== undefined) data.description = parsed.data.description;
  data.iconName     = usesUpload ? null : parsed.data.iconName ?? null;
  data.iconPublicId = usesUpload ? parsed.data.iconPublicId! : null;
  data.iconUrl      = usesUpload ? parsed.data.iconUrl!      : null;
  data.isFeatured            = parsed.data.isFeatured ?? false;
  data.featuredHeading       = parsed.data.featuredHeading ?? null;
  data.featuredImageUrl      = parsed.data.featuredImageUrl ?? null;
  data.featuredImagePublicId = parsed.data.featuredImagePublicId ?? null;
  data.featuredDescription   = parsed.data.featuredDescription ?? null;
  data.featuredCtaHref       = parsed.data.featuredCtaHref ?? null;

  try {
    await prisma.$transaction(async (tx) => {
      // Demote any other featured row when this row claims it.
      if (parsed.data.isFeatured) {
        await tx.researchArea.updateMany({
          where: { isFeatured: true, id: { not: id } },
          data:  { isFeatured: false },
        });
      }
      await tx.researchArea.update({ where: { id }, data });
    });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') {
      return { ok: false, error: 'Research area not found' };
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidatePath('/admin/research-areas');
  revalidatePath(`/admin/research-areas/${id}`);
  revalidatePath('/admin');
  revalidatePath('/');
  return { ok: true };
}

export async function deleteResearchAreaAction(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    await prisma.researchArea.delete({ where: { id } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') {
      return { ok: false, error: 'Research area not found' };
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidatePath('/admin/research-areas');
  revalidatePath('/admin');
  revalidatePath('/');
  return { ok: true };
}

export async function reorderResearchAreasAction(ids: string[]): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const existing = await prisma.researchArea.findMany({ select: { id: true } });
  const existingIds = new Set(existing.map((r) => r.id));
  if (ids.length !== existingIds.size || !ids.every((id) => existingIds.has(id))) {
    return { ok: false, error: 'Reorder list must include exactly the existing research areas' };
  }

  try {
    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.researchArea.update({ where: { id }, data: { displayOrder: index } }),
      ),
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidatePath('/admin/research-areas');
  revalidatePath('/');
  return { ok: true };
}
