'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { sanitizeHtml } from '@/lib/sanitize-html';
import {
  labFacilityLandingUpdateSchema,
  labCreateSchema,
  labUpdateSchema,
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

// Lab content lives on /about/lab-facility AND the homepage
// ResearchLabsSection (Decision B override). Every Lab mutation
// invalidates both surfaces.
function revalidateLabSurfaces() {
  revalidatePath('/about/lab-facility');
  revalidatePath('/');
  revalidatePath('/admin/lab-facility');
  revalidatePath('/admin');
}

// ─────────────────────────────────────────────────────────────────
//  LabFacilityLanding — singleton upsert
// ─────────────────────────────────────────────────────────────────

export async function updateLabFacilityLandingAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const raw = {
    heroTitle:         getStr(formData, 'heroTitle'),
    heroOverline:      emptyToNull(formData.get('heroOverline')),
    heroImageUrl:      getStr(formData, 'heroImageUrl'),
    heroImagePublicId: emptyToNull(formData.get('heroImagePublicId')),
    heroImageVerticalPercent: formData.get('heroImageVerticalPercent') ?? undefined,
    introBody:         getStr(formData, 'introBody'),
  };

  const parsed = labFacilityLandingUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; '),
    };
  }

  // Phase 19 CP19.5 — sanitize HTML-allowed `introBody`.
  const data = { ...parsed.data, introBody: sanitizeHtml(parsed.data.introBody) };

  try {
    await prisma.labFacilityLanding.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...data },
      update: data,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidateLabSurfaces();
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────
//  Lab — multi-row CRUD + reorder
// ─────────────────────────────────────────────────────────────────

// Gallery + galleryPublicIds arrive as one JSON-encoded hidden
// input each (the GalleryEditor component serializes the paired
// arrays client-side). Parse defensively.
function parseStringArray(fd: FormData, key: string): string[] {
  const raw = fd.get(key);
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === 'string');
  } catch {
    return [];
  }
}

function readLabRow(formData: FormData) {
  return {
    slug:              getStr(formData, 'slug'),
    name:              getStr(formData, 'name'),
    tagline:           getStr(formData, 'tagline'),
    description:       getStr(formData, 'description'),
    heroImageUrl:      emptyToNull(formData.get('heroImageUrl')),
    heroImagePublicId: emptyToNull(formData.get('heroImagePublicId')),
    gallery:           parseStringArray(formData, 'gallery'),
    galleryPublicIds:  parseStringArray(formData, 'galleryPublicIds'),
  };
}

export async function createLabAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const raw = readLabRow(formData);
  const parsed = labCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; '),
    };
  }

  const last = await prisma.lab.findFirst({
    orderBy: { displayOrder: 'desc' },
    select: { displayOrder: true },
  });
  const displayOrder = (last?.displayOrder ?? -1) + 1;

  try {
    await prisma.lab.create({
      data: {
        slug:              parsed.data.slug,
        name:              parsed.data.name,
        tagline:           parsed.data.tagline,
        description:       parsed.data.description,
        heroImageUrl:      parsed.data.heroImageUrl ?? null,
        heroImagePublicId: parsed.data.heroImagePublicId ?? null,
        gallery:           parsed.data.gallery,
        galleryPublicIds:  parsed.data.galleryPublicIds,
        displayOrder,
      },
    });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2002') {
      return { ok: false, error: `slug "${parsed.data.slug}" is already in use` };
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidateLabSurfaces();
  redirect('/admin/lab-facility');
}

export async function updateLabAction(
  id: string,
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const raw = readLabRow(formData);
  const parsed = labUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; '),
    };
  }

  try {
    await prisma.lab.update({ where: { id }, data: parsed.data });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2025') return { ok: false, error: 'Lab not found' };
    if (code === 'P2002') return { ok: false, error: 'slug already in use' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidateLabSurfaces();
  revalidatePath(`/admin/lab-facility/labs/${id}`);
  return { ok: true };
}

export async function deleteLabAction(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    await prisma.lab.delete({ where: { id } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Lab not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateLabSurfaces();
  return { ok: true };
}

export async function reorderLabsAction(ids: string[]): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const existing = await prisma.lab.findMany({ select: { id: true } });
  const existingIds = new Set(existing.map((r) => r.id));
  if (ids.length !== existingIds.size || !ids.every((id) => existingIds.has(id))) {
    return { ok: false, error: 'Reorder list must include exactly the existing labs' };
  }
  try {
    await prisma.$transaction(
      ids.map((id, index) => prisma.lab.update({ where: { id }, data: { displayOrder: index } })),
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateLabSurfaces();
  return { ok: true };
}
