'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import {
  type ActionResult,
  readLinkRow,
  validateLinkRow,
} from './_link-actions';

export type { ActionResult };

async function requireAuth(): Promise<ActionResult | null> {
  const session = await getSession();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };
  return null;
}

// Footer lives on the root layout — invalidate everywhere.
function revalidateFooter() {
  revalidatePath('/', 'layout');
  revalidatePath('/admin/footer-links');
  revalidatePath('/admin');
}

// Four footer link tables share identical shape; concrete-per-delegate
// functions because Prisma model delegates can't be merged into a
// callable union (each model has its own typed input shape).
// The boilerplate duplication is the price of full type safety.

// ─────────────────────────────────────────────────────────────────
//  Useful Links
// ─────────────────────────────────────────────────────────────────

export async function createFooterUsefulLinkAction(formData: FormData): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const row = readLinkRow(formData);
  const invalid = validateLinkRow(row);
  if (invalid) return invalid;
  const last = await prisma.footerUsefulLink.findFirst({ orderBy: { displayOrder: 'desc' }, select: { displayOrder: true } });
  try {
    await prisma.footerUsefulLink.create({ data: { ...row, displayOrder: (last?.displayOrder ?? -1) + 1 } });
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Database error' }; }
  revalidateFooter();
  return { ok: true };
}

export async function updateFooterUsefulLinkAction(id: string, formData: FormData): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const row = readLinkRow(formData);
  const invalid = validateLinkRow(row);
  if (invalid) return invalid;
  try {
    await prisma.footerUsefulLink.update({ where: { id }, data: row });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Footer link not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateFooter();
  return { ok: true };
}

export async function deleteFooterUsefulLinkAction(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    await prisma.footerUsefulLink.delete({ where: { id } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Footer link not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateFooter();
  return { ok: true };
}

export async function reorderFooterUsefulLinksAction(ids: string[]): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const existing = await prisma.footerUsefulLink.findMany({ select: { id: true } });
  const existingIds = new Set(existing.map((r) => r.id));
  if (ids.length !== existingIds.size || !ids.every((id) => existingIds.has(id))) {
    return { ok: false, error: 'Reorder list must include exactly the existing rows' };
  }
  try {
    await prisma.$transaction(
      ids.map((id, index) => prisma.footerUsefulLink.update({ where: { id }, data: { displayOrder: index } })),
    );
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Database error' }; }
  revalidateFooter();
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────
//  Get in Touch
// ─────────────────────────────────────────────────────────────────

export async function createFooterGetInTouchLinkAction(formData: FormData): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const row = readLinkRow(formData);
  const invalid = validateLinkRow(row);
  if (invalid) return invalid;
  const last = await prisma.footerGetInTouchLink.findFirst({ orderBy: { displayOrder: 'desc' }, select: { displayOrder: true } });
  try {
    await prisma.footerGetInTouchLink.create({ data: { ...row, displayOrder: (last?.displayOrder ?? -1) + 1 } });
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Database error' }; }
  revalidateFooter();
  return { ok: true };
}

export async function updateFooterGetInTouchLinkAction(id: string, formData: FormData): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const row = readLinkRow(formData);
  const invalid = validateLinkRow(row);
  if (invalid) return invalid;
  try {
    await prisma.footerGetInTouchLink.update({ where: { id }, data: row });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Footer link not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateFooter();
  return { ok: true };
}

export async function deleteFooterGetInTouchLinkAction(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    await prisma.footerGetInTouchLink.delete({ where: { id } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Footer link not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateFooter();
  return { ok: true };
}

export async function reorderFooterGetInTouchLinksAction(ids: string[]): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const existing = await prisma.footerGetInTouchLink.findMany({ select: { id: true } });
  const existingIds = new Set(existing.map((r) => r.id));
  if (ids.length !== existingIds.size || !ids.every((id) => existingIds.has(id))) {
    return { ok: false, error: 'Reorder list must include exactly the existing rows' };
  }
  try {
    await prisma.$transaction(
      ids.map((id, index) => prisma.footerGetInTouchLink.update({ where: { id }, data: { displayOrder: index } })),
    );
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Database error' }; }
  revalidateFooter();
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────
//  Quick Links
// ─────────────────────────────────────────────────────────────────

export async function createFooterQuickLinkAction(formData: FormData): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const row = readLinkRow(formData);
  const invalid = validateLinkRow(row);
  if (invalid) return invalid;
  const last = await prisma.footerQuickLink.findFirst({ orderBy: { displayOrder: 'desc' }, select: { displayOrder: true } });
  try {
    await prisma.footerQuickLink.create({ data: { ...row, displayOrder: (last?.displayOrder ?? -1) + 1 } });
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Database error' }; }
  revalidateFooter();
  return { ok: true };
}

export async function updateFooterQuickLinkAction(id: string, formData: FormData): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const row = readLinkRow(formData);
  const invalid = validateLinkRow(row);
  if (invalid) return invalid;
  try {
    await prisma.footerQuickLink.update({ where: { id }, data: row });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Footer link not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateFooter();
  return { ok: true };
}

export async function deleteFooterQuickLinkAction(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    await prisma.footerQuickLink.delete({ where: { id } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Footer link not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateFooter();
  return { ok: true };
}

export async function reorderFooterQuickLinksAction(ids: string[]): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const existing = await prisma.footerQuickLink.findMany({ select: { id: true } });
  const existingIds = new Set(existing.map((r) => r.id));
  if (ids.length !== existingIds.size || !ids.every((id) => existingIds.has(id))) {
    return { ok: false, error: 'Reorder list must include exactly the existing rows' };
  }
  try {
    await prisma.$transaction(
      ids.map((id, index) => prisma.footerQuickLink.update({ where: { id }, data: { displayOrder: index } })),
    );
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Database error' }; }
  revalidateFooter();
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────
//  Legal Links
// ─────────────────────────────────────────────────────────────────

export async function createFooterLegalLinkAction(formData: FormData): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const row = readLinkRow(formData);
  const invalid = validateLinkRow(row);
  if (invalid) return invalid;
  const last = await prisma.footerLegalLink.findFirst({ orderBy: { displayOrder: 'desc' }, select: { displayOrder: true } });
  try {
    await prisma.footerLegalLink.create({ data: { ...row, displayOrder: (last?.displayOrder ?? -1) + 1 } });
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Database error' }; }
  revalidateFooter();
  return { ok: true };
}

export async function updateFooterLegalLinkAction(id: string, formData: FormData): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const row = readLinkRow(formData);
  const invalid = validateLinkRow(row);
  if (invalid) return invalid;
  try {
    await prisma.footerLegalLink.update({ where: { id }, data: row });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Footer link not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateFooter();
  return { ok: true };
}

export async function deleteFooterLegalLinkAction(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    await prisma.footerLegalLink.delete({ where: { id } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Footer link not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateFooter();
  return { ok: true };
}

export async function reorderFooterLegalLinksAction(ids: string[]): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const existing = await prisma.footerLegalLink.findMany({ select: { id: true } });
  const existingIds = new Set(existing.map((r) => r.id));
  if (ids.length !== existingIds.size || !ids.every((id) => existingIds.has(id))) {
    return { ok: false, error: 'Reorder list must include exactly the existing rows' };
  }
  try {
    await prisma.$transaction(
      ids.map((id, index) => prisma.footerLegalLink.update({ where: { id }, data: { displayOrder: index } })),
    );
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Database error' }; }
  revalidateFooter();
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────
//  Campus Links
// ─────────────────────────────────────────────────────────────────

export async function createFooterCampusLinkAction(formData: FormData): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const row = readLinkRow(formData);
  const invalid = validateLinkRow(row);
  if (invalid) return invalid;
  const last = await prisma.footerCampusLink.findFirst({ orderBy: { displayOrder: 'desc' }, select: { displayOrder: true } });
  try {
    await prisma.footerCampusLink.create({ data: { ...row, displayOrder: (last?.displayOrder ?? -1) + 1 } });
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Database error' }; }
  revalidateFooter();
  return { ok: true };
}

export async function updateFooterCampusLinkAction(id: string, formData: FormData): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const row = readLinkRow(formData);
  const invalid = validateLinkRow(row);
  if (invalid) return invalid;
  try {
    await prisma.footerCampusLink.update({ where: { id }, data: row });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Footer link not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateFooter();
  return { ok: true };
}

export async function deleteFooterCampusLinkAction(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    await prisma.footerCampusLink.delete({ where: { id } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Footer link not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateFooter();
  return { ok: true };
}

export async function reorderFooterCampusLinksAction(ids: string[]): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const existing = await prisma.footerCampusLink.findMany({ select: { id: true } });
  const existingIds = new Set(existing.map((r) => r.id));
  if (ids.length !== existingIds.size || !ids.every((id) => existingIds.has(id))) {
    return { ok: false, error: 'Reorder list must include exactly the existing rows' };
  }
  try {
    await prisma.$transaction(
      ids.map((id, index) => prisma.footerCampusLink.update({ where: { id }, data: { displayOrder: index } })),
    );
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Database error' }; }
  revalidateFooter();
  return { ok: true };
}
