'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { faqCreateSchema, faqUpdateSchema } from '@/lib/validation';

export type ActionResult = { ok: true } | { ok: false; error: string };

function getStr(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === 'string' ? v.trim() : '';
}
async function requireAuth(): Promise<ActionResult | null> {
  const session = await getSession();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };
  return null;
}

function revalidateFaqSurfaces() {
  revalidatePath('/student-society/faq');
  revalidatePath('/admin/faqs');
  revalidatePath('/admin');
  revalidatePath('/', 'layout');
}

function readFaqRow(formData: FormData) {
  return {
    category: getStr(formData, 'category'),
    question: getStr(formData, 'question'),
    answer:   getStr(formData, 'answer'),
  };
}

export async function createFaqAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const parsed = faqCreateSchema.safeParse(readFaqRow(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ') };
  }

  const last = await prisma.faq.findFirst({ orderBy: { displayOrder: 'desc' }, select: { displayOrder: true } });
  const displayOrder = (last?.displayOrder ?? -1) + 1;

  try {
    await prisma.faq.create({ data: { ...parsed.data, displayOrder } });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateFaqSurfaces();
  redirect('/admin/faqs');
}

export async function updateFaqAction(
  id: string,
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const parsed = faqUpdateSchema.safeParse(readFaqRow(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ') };
  }

  try {
    await prisma.faq.update({ where: { id }, data: parsed.data });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'FAQ not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateFaqSurfaces();
  revalidatePath(`/admin/faqs/${id}`);
  return { ok: true };
}

export async function deleteFaqAction(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    await prisma.faq.delete({ where: { id } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') return { ok: false, error: 'FAQ not found' };
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateFaqSurfaces();
  return { ok: true };
}

export async function reorderFaqsAction(ids: string[]): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;
  const existing = await prisma.faq.findMany({ select: { id: true } });
  const existingIds = new Set(existing.map((r) => r.id));
  if (ids.length !== existingIds.size || !ids.every((id) => existingIds.has(id))) {
    return { ok: false, error: 'Reorder list must include exactly the existing FAQs' };
  }
  try {
    await prisma.$transaction(
      ids.map((id, index) => prisma.faq.update({ where: { id }, data: { displayOrder: index } })),
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }
  revalidateFaqSurfaces();
  return { ok: true };
}
