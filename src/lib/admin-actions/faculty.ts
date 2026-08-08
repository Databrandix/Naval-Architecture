'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { sanitizeHtmlArray } from '@/lib/sanitize-html';
import {
  facultyCreateSchema,
  facultyUpdateSchema,
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

function parseJsonOrNull(v: FormDataEntryValue | null): unknown {
  if (typeof v !== 'string' || v.trim() === '') return null;
  try {
    const parsed = JSON.parse(v);
    // Squash visually-empty payloads back to null so the DB stores nothing.
    if (parsed === null) return null;
    if (Array.isArray(parsed) && parsed.length === 0) return null;
    if (typeof parsed === 'string' && parsed.trim() === '') return null;
    return parsed;
  } catch {
    return null;
  }
}

async function requireAuth(): Promise<ActionResult | null> {
  const session = await getSession();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };
  return null;
}

function zodErr(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
): string {
  return issues
    .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('; ');
}

function extractFromFormData(formData: FormData) {
  const email = emptyToNull(formData.get('email'));
  return {
    slug:           getStr(formData, 'slug'),
    name:           getStr(formData, 'name'),
    designation:    getStr(formData, 'designation'),
    secondaryTitle: emptyToNull(formData.get('secondaryTitle')),
    badge:          emptyToNull(formData.get('badge')),
    type:           getStr(formData, 'type'),
    photoUrl:       emptyToNull(formData.get('photoUrl')),
    photoPublicId:  emptyToNull(formData.get('photoPublicId')),
    email,
    phone:          emptyToNull(formData.get('phone')),
    suId:           emptyToNull(formData.get('suId')),
    officeAddress:  emptyToNull(formData.get('officeAddress')),
    personalInfo:          parseJsonOrNull(formData.get('personalInfo')),
    academicQualification: parseJsonOrNull(formData.get('academicQualification')),
    trainingExperience:    parseJsonOrNull(formData.get('trainingExperience')),
    teachingArea:          parseJsonOrNull(formData.get('teachingArea')),
    publications:          parseJsonOrNull(formData.get('publications')),
    research:              parseJsonOrNull(formData.get('research')),
    awards:                parseJsonOrNull(formData.get('awards')),
    membership:            parseJsonOrNull(formData.get('membership')),
    previousEmployment:    parseJsonOrNull(formData.get('previousEmployment')),
    isDean: formData.get('isDean') === 'on',
    isHead: formData.get('isHead') === 'on',
    messageOverline:          emptyToNull(formData.get('messageOverline')),
    messageHeading:           emptyToNull(formData.get('messageHeading')),
    messageParagraphs:        formData
      .getAll('messageParagraphs')
      .filter((v): v is string => typeof v === 'string')
      .map((v) => v.trim())
      .filter((v) => v.length > 0),
    messagePhotoUrl:          emptyToNull(formData.get('messagePhotoUrl')),
    messagePhotoPublicId:     emptyToNull(formData.get('messagePhotoPublicId')),
    messageTitleLine1:        emptyToNull(formData.get('messageTitleLine1')),
    messageTitleLine2:        emptyToNull(formData.get('messageTitleLine2')),
    messageHeroImageUrl:             emptyToNull(formData.get('messageHeroImageUrl')),
    messageHeroImagePublicId:        emptyToNull(formData.get('messageHeroImagePublicId')),
    messageHeroImageVerticalPercent: formData.get('messageHeroImageVerticalPercent') ?? undefined,
  };
}

// Prisma Json field input: an actual value, or Prisma.JsonNull for SQL NULL.
function asJson(v: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return v == null ? Prisma.JsonNull : (v as Prisma.InputJsonValue);
}

function buildFacultyData(parsed: ReturnType<typeof facultyCreateSchema.parse>) {
  return {
    slug:           parsed.slug,
    name:           parsed.name,
    designation:    parsed.designation,
    secondaryTitle: parsed.secondaryTitle ?? null,
    badge:          parsed.badge ?? null,
    type:           parsed.type,
    photoUrl:       parsed.photoUrl ?? null,
    photoPublicId:  parsed.photoPublicId ?? null,
    email:          parsed.email && parsed.email !== '' ? parsed.email : null,
    phone:          parsed.phone ?? null,
    suId:           parsed.suId ?? null,
    officeAddress:  parsed.officeAddress ?? null,
    personalInfo:          asJson(parsed.personalInfo),
    academicQualification: asJson(parsed.academicQualification),
    trainingExperience:    asJson(parsed.trainingExperience),
    teachingArea:          asJson(parsed.teachingArea),
    publications:          asJson(parsed.publications),
    research:              asJson(parsed.research),
    awards:                asJson(parsed.awards),
    membership:            asJson(parsed.membership),
    previousEmployment:    asJson(parsed.previousEmployment),
    isDean:                parsed.isDean ?? false,
    isHead:                parsed.isHead ?? false,
    messageOverline:       parsed.messageOverline ?? null,
    messageHeading:        parsed.messageHeading ?? null,
    // Phase 19 CP19.5 — sanitize HTML-allowed paragraphs before persisting.
    messageParagraphs:     sanitizeHtmlArray(parsed.messageParagraphs ?? []),
    messagePhotoUrl:       parsed.messagePhotoUrl ?? null,
    messagePhotoPublicId:  parsed.messagePhotoPublicId ?? null,
    messageTitleLine1:     parsed.messageTitleLine1 ?? null,
    messageTitleLine2:     parsed.messageTitleLine2 ?? null,
    messageHeroImageUrl:             parsed.messageHeroImageUrl ?? null,
    messageHeroImagePublicId:        parsed.messageHeroImagePublicId ?? null,
    messageHeroImageVerticalPercent: parsed.messageHeroImageVerticalPercent,
  };
}

function revalidateFacultySurfaces(opts: {
  touchesDean: boolean;
  touchesHead: boolean;
}) {
  // Admin surfaces always need the bump.
  revalidatePath('/admin/faculty');
  revalidatePath('/admin');
  // Public surfaces wired in CP2.3 — bump regardless so wiring lands clean.
  revalidatePath('/faculty-member');
  revalidatePath('/faculty-member/[slug]', 'page');
  if (opts.touchesDean) revalidatePath('/about/deans-message');
  if (opts.touchesHead) revalidatePath('/about/message-from-head');
}

// ─────────────────────────────────────────────────────────────────
//  CREATE
// ─────────────────────────────────────────────────────────────────
export async function createFacultyAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const raw = extractFromFormData(formData);
  const parsed = facultyCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: zodErr(parsed.error.issues) };
  }

  // Auto-append displayOrder
  const last = await prisma.faculty.findFirst({
    orderBy: { displayOrder: 'desc' },
    select: { displayOrder: true },
  });
  const displayOrder = (last?.displayOrder ?? -1) + 1;

  try {
    await prisma.$transaction(async (tx) => {
      // Atomic Dean/Head swap — auto-unset the previous holder (decision D)
      if (parsed.data.isDean) {
        await tx.faculty.updateMany({
          where: { isDean: true },
          data: { isDean: false },
        });
      }
      if (parsed.data.isHead) {
        await tx.faculty.updateMany({
          where: { isHead: true },
          data: { isHead: false },
        });
      }
      await tx.faculty.create({
        data: { ...buildFacultyData(parsed.data), displayOrder },
      });
    });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2002') {
      return { ok: false, error: `Slug "${parsed.data.slug}" is already in use` };
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidateFacultySurfaces({
    touchesDean: parsed.data.isDean ?? false,
    touchesHead: parsed.data.isHead ?? false,
  });
  redirect('/admin/faculty');
}

// ─────────────────────────────────────────────────────────────────
//  UPDATE
// ─────────────────────────────────────────────────────────────────
export async function updateFacultyAction(
  id: string,
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const raw = extractFromFormData(formData);
  // Use the SAME schema as create — the form always sends a complete record.
  const parsed = facultyCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: zodErr(parsed.error.issues) };
  }

  // Need to know prior state to decide which public pages to revalidate.
  const prior = await prisma.faculty.findUnique({
    where: { id },
    select: { isDean: true, isHead: true },
  });
  if (!prior) return { ok: false, error: 'Faculty not found' };

  try {
    await prisma.$transaction(async (tx) => {
      if (parsed.data.isDean) {
        await tx.faculty.updateMany({
          where: { isDean: true, id: { not: id } },
          data: { isDean: false },
        });
      }
      if (parsed.data.isHead) {
        await tx.faculty.updateMany({
          where: { isHead: true, id: { not: id } },
          data: { isHead: false },
        });
      }
      await tx.faculty.update({
        where: { id },
        data: buildFacultyData(parsed.data),
      });
    });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2025') return { ok: false, error: 'Faculty not found' };
    if (code === 'P2002') return { ok: false, error: 'Slug already in use' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidateFacultySurfaces({
    touchesDean: prior.isDean || (parsed.data.isDean ?? false),
    touchesHead: prior.isHead || (parsed.data.isHead ?? false),
  });
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────
//  DELETE
// ─────────────────────────────────────────────────────────────────
export async function deleteFacultyAction(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const target = await prisma.faculty.findUnique({
    where: { id },
    select: { isDean: true, isHead: true },
  });
  if (!target) return { ok: false, error: 'Faculty not found' };

  try {
    await prisma.faculty.delete({ where: { id } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') {
      return { ok: false, error: 'Faculty not found' };
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidateFacultySurfaces({
    touchesDean: target.isDean,
    touchesHead: target.isHead,
  });
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────
//  REORDER — receives the full id-set in the new order; the admin
//  UI only enables drag-reorder when the filter is "All".
// ─────────────────────────────────────────────────────────────────
export async function reorderFacultyAction(ids: string[]): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string' || !id)) {
    return { ok: false, error: 'Invalid reorder payload' };
  }

  const existing = await prisma.faculty.findMany({ select: { id: true } });
  const existingIds = new Set(existing.map((f) => f.id));
  if (ids.length !== existingIds.size || !ids.every((id) => existingIds.has(id))) {
    return {
      ok: false,
      error: 'Reorder list must include exactly the existing faculty rows',
    };
  }

  try {
    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.faculty.update({ where: { id }, data: { displayOrder: index } }),
      ),
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidatePath('/admin/faculty');
  revalidatePath('/faculty-member');
  return { ok: true };
}
