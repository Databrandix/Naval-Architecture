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

function revalidateLayoutSurfaces() {
  revalidatePath('/about/department-layout');
  revalidatePath('/admin/office-locations');
}

const str = (fd: FormData, key: string) => String(fd.get(key) ?? '').trim();

/** Add an office, or update one when an id comes with the form. */
export async function saveOfficeLocation(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const unauthorised = await requireAuth();
  if (unauthorised) return unauthorised;

  const id = str(formData, 'id');
  const name = str(formData, 'name');
  const level = str(formData, 'level');
  const building = str(formData, 'building');
  const isDepartment = formData.get('isDepartment') === 'on';

  if (!name) return { ok: false, error: 'An office needs a name.' };
  if (!level) return { ok: false, error: 'Say which level it is on — that is what people come here for.' };

  if (id) {
    await prisma.officeLocation.update({
      where: { id },
      data: { name, level, building, isDepartment },
    });
    revalidateLayoutSurfaces();
    return { ok: true, message: `${name} updated.` };
  }

  /* New offices go to the end of the list; reordering is the arrows below. */
  const last = await prisma.officeLocation.findFirst({
    orderBy: { displayOrder: 'desc' },
    select: { displayOrder: true },
  });

  await prisma.officeLocation.create({
    data: { name, level, building, isDepartment, displayOrder: (last?.displayOrder ?? 0) + 1 },
  });

  revalidateLayoutSurfaces();
  return { ok: true, message: `${name} added.` };
}

export async function deleteOfficeLocation(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const unauthorised = await requireAuth();
  if (unauthorised) return unauthorised;

  const id = str(formData, 'id');
  if (!id) return { ok: false, error: 'No office was named.' };

  const office = await prisma.officeLocation.delete({ where: { id } });
  revalidateLayoutSurfaces();
  return { ok: true, message: `${office.name} removed.` };
}

/**
 * Move an office one place up or down.
 *
 * The two rows swap displayOrder inside a transaction: written one at a time,
 * a failure between the two writes would leave both offices claiming the same
 * position, and the list order would then depend on which row the database
 * happened to return first.
 */
export async function moveOfficeLocation(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const unauthorised = await requireAuth();
  if (unauthorised) return unauthorised;

  const id = str(formData, 'id');
  const direction = str(formData, 'direction') === 'up' ? 'up' : 'down';

  const office = await prisma.officeLocation.findUnique({ where: { id } });
  if (!office) return { ok: false, error: 'That office no longer exists.' };

  const neighbour = await prisma.officeLocation.findFirst({
    where:
      direction === 'up'
        ? { displayOrder: { lt: office.displayOrder } }
        : { displayOrder: { gt: office.displayOrder } },
    orderBy: { displayOrder: direction === 'up' ? 'desc' : 'asc' },
  });

  if (!neighbour) return { ok: true, message: 'Already at the end of the list.' };

  await prisma.$transaction([
    prisma.officeLocation.update({ where: { id: office.id }, data: { displayOrder: neighbour.displayOrder } }),
    prisma.officeLocation.update({ where: { id: neighbour.id }, data: { displayOrder: office.displayOrder } }),
  ]);

  revalidateLayoutSurfaces();
  return { ok: true, message: `${office.name} moved ${direction}.` };
}
