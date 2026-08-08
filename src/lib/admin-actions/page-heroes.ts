'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { pageHeroUpdateSchema } from '@/lib/validation';

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

export async function updatePageHeroAction(
  id: string,
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const raw = {
    heroTitle:                getStr(formData, 'heroTitle'),
    heroSubtitle:             emptyToNull(formData.get('heroSubtitle')),
    heroOverline:             emptyToNull(formData.get('heroOverline')),
    heroImageUrl:             getStr(formData, 'heroImageUrl'),
    heroImagePublicId:        emptyToNull(formData.get('heroImagePublicId')),
    heroImageVerticalPercent: formData.get('heroImageVerticalPercent') ?? undefined,
  };

  const parsed = pageHeroUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; '),
    };
  }

  // We need the publicPath to revalidate that specific route; read it
  // off the row alongside the update so admin sees the change reflect
  // on the public page without a full site rebuild.
  let publicPath: string | null = null;
  try {
    const updated = await prisma.pageHero.update({
      where: { id },
      data: parsed.data,
      select: { publicPath: true },
    });
    publicPath = updated.publicPath;
  } catch (e: unknown) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2025'
    ) {
      return { ok: false, error: 'Page hero not found' };
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  if (publicPath) revalidatePath(publicPath);
  revalidatePath('/admin/page-heroes');
  revalidatePath(`/admin/page-heroes/${id}`);
  revalidatePath('/admin');
  return { ok: true };
}
