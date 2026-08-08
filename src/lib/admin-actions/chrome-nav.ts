'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import {
  type ActionResult,
  getStr,
  emptyToNull,
  readBoolCheckbox,
  readLinkRow,
  validateLinkRow,
} from './_link-actions';

export type { ActionResult };

async function requireAuth(): Promise<ActionResult | null> {
  const session = await getSession();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };
  return null;
}

// All chrome surfaces (Navbar) live on the root layout, so any chrome
// mutation invalidates every public route via 'layout' scope.
function revalidateChrome() {
  revalidatePath('/', 'layout');
  revalidatePath('/admin/nav');
  revalidatePath('/admin');
}

// ─────────────────────────────────────────────────────────────────
//  TopLink
// ─────────────────────────────────────────────────────────────────

export async function createTopLinkAction(formData: FormData): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const row = readLinkRow(formData);
  const invalid = validateLinkRow(row);
  if (invalid) return invalid;
  const last = await prisma.topLink.findFirst({ orderBy: { displayOrder: 'desc' }, select: { displayOrder: true } });
  const displayOrder = (last?.displayOrder ?? -1) + 1;
  try {
    await prisma.topLink.create({ data: { ...row, displayOrder } });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateChrome();
  return { ok: true };
}

export async function updateTopLinkAction(id: string, formData: FormData): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const row = readLinkRow(formData);
  const invalid = validateLinkRow(row);
  if (invalid) return invalid;
  try {
    await prisma.topLink.update({ where: { id }, data: row });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Top link not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateChrome();
  return { ok: true };
}

export async function deleteTopLinkAction(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    await prisma.topLink.delete({ where: { id } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Top link not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateChrome();
  return { ok: true };
}

export async function reorderTopLinksAction(ids: string[]): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const existing = await prisma.topLink.findMany({ select: { id: true } });
  const existingIds = new Set(existing.map((r) => r.id));
  if (ids.length !== existingIds.size || !ids.every((id) => existingIds.has(id))) {
    return { ok: false, error: 'Reorder list must include exactly the existing rows' };
  }
  try {
    await prisma.$transaction(
      ids.map((id, index) => prisma.topLink.update({ where: { id }, data: { displayOrder: index } })),
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateChrome();
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────
//  QuickAccessItem (LinkRow + iconName)
// ─────────────────────────────────────────────────────────────────

function readQuickAccessRow(fd: FormData) {
  const link = readLinkRow(fd);
  return { ...link, iconName: getStr(fd, 'iconName') };
}

function validateQuickAccessRow(row: ReturnType<typeof readQuickAccessRow>): ActionResult | null {
  const invalid = validateLinkRow(row);
  if (invalid) return invalid;
  if (!row.iconName) return { ok: false, error: 'Lucide icon name is required' };
  return null;
}

export async function createQuickAccessAction(formData: FormData): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const row = readQuickAccessRow(formData);
  const invalid = validateQuickAccessRow(row);
  if (invalid) return invalid;
  const last = await prisma.quickAccessItem.findFirst({ orderBy: { displayOrder: 'desc' }, select: { displayOrder: true } });
  const displayOrder = (last?.displayOrder ?? -1) + 1;
  try {
    await prisma.quickAccessItem.create({ data: { ...row, displayOrder } });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateChrome();
  return { ok: true };
}

export async function updateQuickAccessAction(id: string, formData: FormData): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const row = readQuickAccessRow(formData);
  const invalid = validateQuickAccessRow(row);
  if (invalid) return invalid;
  try {
    await prisma.quickAccessItem.update({ where: { id }, data: row });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Quick access item not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateChrome();
  return { ok: true };
}

export async function deleteQuickAccessAction(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    await prisma.quickAccessItem.delete({ where: { id } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Quick access item not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateChrome();
  return { ok: true };
}

export async function reorderQuickAccessAction(ids: string[]): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const existing = await prisma.quickAccessItem.findMany({ select: { id: true } });
  const existingIds = new Set(existing.map((r) => r.id));
  if (ids.length !== existingIds.size || !ids.every((id) => existingIds.has(id))) {
    return { ok: false, error: 'Reorder list must include exactly the existing rows' };
  }
  try {
    await prisma.$transaction(
      ids.map((id, index) => prisma.quickAccessItem.update({ where: { id }, data: { displayOrder: index } })),
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateChrome();
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────
//  MainNavGroup
// ─────────────────────────────────────────────────────────────────

function readGroupRow(fd: FormData) {
  return {
    name:        getStr(fd, 'name'),
    href:        emptyToNull(fd.get('href')),
    hasDropdown: readBoolCheckbox(fd, 'hasDropdown'),
    title:       emptyToNull(fd.get('title')),
  };
}

function validateGroupRow(row: ReturnType<typeof readGroupRow>): ActionResult | null {
  if (!row.name) return { ok: false, error: 'Group name is required' };
  if (!row.hasDropdown && !row.href) {
    return { ok: false, error: 'Plain link groups (no dropdown) must have an href' };
  }
  return null;
}

export async function createMainNavGroupAction(formData: FormData): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const row = readGroupRow(formData);
  const invalid = validateGroupRow(row);
  if (invalid) return invalid;
  const last = await prisma.mainNavGroup.findFirst({ orderBy: { displayOrder: 'desc' }, select: { displayOrder: true } });
  const displayOrder = (last?.displayOrder ?? -1) + 1;
  try {
    await prisma.mainNavGroup.create({ data: { ...row, displayOrder } });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateChrome();
  return { ok: true };
}

export async function updateMainNavGroupAction(id: string, formData: FormData): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const row = readGroupRow(formData);
  const invalid = validateGroupRow(row);
  if (invalid) return invalid;
  try {
    await prisma.mainNavGroup.update({ where: { id }, data: row });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Nav group not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateChrome();
  return { ok: true };
}

export async function deleteMainNavGroupAction(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    // Cascade on the FK drops children automatically.
    await prisma.mainNavGroup.delete({ where: { id } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Nav group not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateChrome();
  return { ok: true };
}

export async function reorderMainNavGroupsAction(ids: string[]): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const existing = await prisma.mainNavGroup.findMany({ select: { id: true } });
  const existingIds = new Set(existing.map((r) => r.id));
  if (ids.length !== existingIds.size || !ids.every((id) => existingIds.has(id))) {
    return { ok: false, error: 'Reorder list must include exactly the existing groups' };
  }
  try {
    await prisma.$transaction(
      ids.map((id, index) => prisma.mainNavGroup.update({ where: { id }, data: { displayOrder: index } })),
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateChrome();
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────
//  MainNavItem  (nested under MainNavGroup)
// ─────────────────────────────────────────────────────────────────

function readItemRow(fd: FormData) {
  return {
    name:       getStr(fd, 'name'),
    href:       getStr(fd, 'href'),
    isExternal: readBoolCheckbox(fd, 'isExternal'),
    isDisabled: readBoolCheckbox(fd, 'isDisabled'),
  };
}

function validateItemRow(row: ReturnType<typeof readItemRow>): ActionResult | null {
  if (!row.name) return { ok: false, error: 'Item name is required' };
  if (!row.href) return { ok: false, error: 'Item href is required' };
  return null;
}

export async function createMainNavItemAction(groupId: string, formData: FormData): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const row = readItemRow(formData);
  const invalid = validateItemRow(row);
  if (invalid) return invalid;
  const last = await prisma.mainNavItem.findFirst({
    where: { groupId },
    orderBy: { displayOrder: 'desc' },
    select: { displayOrder: true },
  });
  const displayOrder = (last?.displayOrder ?? -1) + 1;
  try {
    await prisma.mainNavItem.create({ data: { ...row, groupId, displayOrder } });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateChrome();
  return { ok: true };
}

export async function updateMainNavItemAction(id: string, formData: FormData): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const row = readItemRow(formData);
  const invalid = validateItemRow(row);
  if (invalid) return invalid;
  try {
    await prisma.mainNavItem.update({ where: { id }, data: row });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Nav item not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateChrome();
  return { ok: true };
}

export async function deleteMainNavItemAction(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    await prisma.mainNavItem.delete({ where: { id } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Nav item not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateChrome();
  return { ok: true };
}

export async function reorderMainNavItemsAction(groupId: string, ids: string[]): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const existing = await prisma.mainNavItem.findMany({ where: { groupId }, select: { id: true } });
  const existingIds = new Set(existing.map((r) => r.id));
  if (ids.length !== existingIds.size || !ids.every((id) => existingIds.has(id))) {
    return { ok: false, error: 'Reorder list must include exactly the existing items in this group' };
  }
  try {
    await prisma.$transaction(
      ids.map((id, index) => prisma.mainNavItem.update({ where: { id }, data: { displayOrder: index } })),
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateChrome();
  return { ok: true };
}
