'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

async function requireAuth(): Promise<ActionResult | null> {
  const session = await getSession();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };
  return null;
}

function revalidateCharterSurfaces() {
  revalidatePath('/student-society/service-charter');
  revalidatePath('/admin/service-charter');
}

const str = (fd: FormData, key: string) => String(fd.get(key) ?? '').trim();

/**
 * Add or update one service.
 *
 * Steps arrive as one textarea, a line each, because that is how somebody
 * describes a process — three separate inputs would fix the number at three,
 * which is only what this department's printed table happened to hold.
 */
export async function saveServiceCharterEntry(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const unauthorised = await requireAuth();
  if (unauthorised) return unauthorised;

  const id = str(formData, 'id');
  const title = str(formData, 'title');
  const responsible = str(formData, 'responsible');
  const serial = Number.parseInt(str(formData, 'serial'), 10);

  const steps = str(formData, 'steps')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (!title) return { ok: false, error: 'A service needs a title.' };
  if (steps.length === 0) return { ok: false, error: 'Give at least one step — a student is here to find out what to do.' };

  if (id) {
    await prisma.serviceCharterEntry.update({
      where: { id },
      data: { title, steps, responsible, ...(Number.isFinite(serial) ? { serial } : {}) },
    });
    revalidateCharterSurfaces();
    return { ok: true, message: `${title} updated.` };
  }

  const last = await prisma.serviceCharterEntry.findFirst({
    orderBy: { displayOrder: 'desc' },
    select: { displayOrder: true, serial: true },
  });

  await prisma.serviceCharterEntry.create({
    data: {
      title,
      steps,
      responsible,
      serial: Number.isFinite(serial) ? serial : (last?.serial ?? 0) + 1,
      displayOrder: (last?.displayOrder ?? 0) + 1,
    },
  });

  revalidateCharterSurfaces();
  return { ok: true, message: `${title} added.` };
}

export async function deleteServiceCharterEntry(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const unauthorised = await requireAuth();
  if (unauthorised) return unauthorised;

  const id = str(formData, 'id');
  if (!id) return { ok: false, error: 'No service was named.' };

  const entry = await prisma.serviceCharterEntry.delete({ where: { id } });
  revalidateCharterSurfaces();
  return { ok: true, message: `${entry.title} removed.` };
}

/** Move a service one place up or down; the two rows swap in a transaction. */
export async function moveServiceCharterEntry(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const unauthorised = await requireAuth();
  if (unauthorised) return unauthorised;

  const id = str(formData, 'id');
  const direction = str(formData, 'direction') === 'up' ? 'up' : 'down';

  const entry = await prisma.serviceCharterEntry.findUnique({ where: { id } });
  if (!entry) return { ok: false, error: 'That service no longer exists.' };

  const neighbour = await prisma.serviceCharterEntry.findFirst({
    where:
      direction === 'up'
        ? { displayOrder: { lt: entry.displayOrder } }
        : { displayOrder: { gt: entry.displayOrder } },
    orderBy: { displayOrder: direction === 'up' ? 'desc' : 'asc' },
  });

  if (!neighbour) return { ok: true, message: 'Already at the end of the list.' };

  await prisma.$transaction([
    prisma.serviceCharterEntry.update({ where: { id: entry.id }, data: { displayOrder: neighbour.displayOrder } }),
    prisma.serviceCharterEntry.update({ where: { id: neighbour.id }, data: { displayOrder: entry.displayOrder } }),
  ]);

  revalidateCharterSurfaces();
  return { ok: true, message: `${entry.title} moved ${direction}.` };
}
