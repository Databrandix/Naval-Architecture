'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { busRouteCreateSchema, busRouteUpdateSchema } from '@/lib/validation';

export type ActionResult = { ok: true } | { ok: false; error: string };

function getStr(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === 'string' ? v.trim() : '';
}
// Times come from a textarea — one entry per line. Empty lines
// dropped server-side so admin trailing whitespace is tolerated.
// Simpler than a dedicated client-side list editor for the
// modest input shape (~1-3 time strings per route).
function parseNewlineList(fd: FormData, key: string): string[] {
  const raw = fd.get(key);
  if (typeof raw !== 'string') return [];
  return raw
    .split(/\r?\n/)
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}
async function requireAuth(): Promise<ActionResult | null> {
  const session = await getSession();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };
  return null;
}

function revalidateBusRouteSurfaces() {
  revalidatePath('/transport-service');
  revalidatePath('/admin/bus-routes');
  revalidatePath('/admin');
  revalidatePath('/', 'layout');
}

function readBusRouteRow(formData: FormData) {
  return {
    slug:           getStr(formData, 'slug'),
    routeName:      getStr(formData, 'routeName'),
    busNumber:      getStr(formData, 'busNumber'),
    contact:        getStr(formData, 'contact'),
    departureTimes: parseNewlineList(formData,'departureTimes'),
    returnTimes:    parseNewlineList(formData,'returnTimes'),
  };
}

export async function createBusRouteAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const parsed = busRouteCreateSchema.safeParse(readBusRouteRow(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ') };
  }

  const last = await prisma.busRoute.findFirst({ orderBy: { displayOrder: 'desc' }, select: { displayOrder: true } });
  const displayOrder = (last?.displayOrder ?? -1) + 1;

  try {
    await prisma.busRoute.create({ data: { ...parsed.data, displayOrder } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2002') {
      return { ok: false, error: `slug "${parsed.data.slug}" is already in use` };
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateBusRouteSurfaces();
  redirect('/admin/bus-routes');
}

export async function updateBusRouteAction(
  id: string,
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const parsed = busRouteUpdateSchema.safeParse(readBusRouteRow(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ') };
  }

  try {
    await prisma.busRoute.update({ where: { id }, data: parsed.data });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2025') return { ok: false, error: 'Bus route not found' };
    if (code === 'P2002') return { ok: false, error: 'slug already in use' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateBusRouteSurfaces();
  revalidatePath(`/admin/bus-routes/${id}`);
  return { ok: true };
}

export async function deleteBusRouteAction(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    await prisma.busRoute.delete({ where: { id } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'Bus route not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateBusRouteSurfaces();
  return { ok: true };
}

export async function reorderBusRoutesAction(ids: string[]): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const existing = await prisma.busRoute.findMany({ select: { id: true } });
  const existingIds = new Set(existing.map((r) => r.id));
  if (ids.length !== existingIds.size || !ids.every((id) => existingIds.has(id))) {
    return { ok: false, error: 'Reorder list must include exactly the existing bus routes' };
  }
  try {
    await prisma.$transaction(
      ids.map((id, index) => prisma.busRoute.update({ where: { id }, data: { displayOrder: index } })),
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateBusRouteSurfaces();
  return { ok: true };
}
