'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { departmentUpdateSchema } from '@/lib/validation';

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

export async function updateDepartmentAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };

  const raw = {
    name:               getStr(formData, 'name'),
    shortCode:          getStr(formData, 'shortCode'),
    facultyName:        getStr(formData, 'facultyName'),
    primaryColor:       getStr(formData, 'primaryColor'),
    accentColor:        getStr(formData, 'accentColor'),
    buttonColor:        getStr(formData, 'buttonColor'),
    logoUrl:            getStr(formData, 'logoUrl'),
    logoPublicId:       emptyToNull(formData.get('logoPublicId')),
    breadcrumbLabel:    getStr(formData, 'breadcrumbLabel'),
    heroImage1Url:             getStr(formData, 'heroImage1Url'),
    heroImage1PublicId:        emptyToNull(formData.get('heroImage1PublicId')),
    heroImage1Alt:             emptyToNull(formData.get('heroImage1Alt')),
    heroImage1VerticalPercent: formData.get('heroImage1VerticalPercent') ?? undefined,
    heroImage2Url:             getStr(formData, 'heroImage2Url'),
    heroImage2PublicId:        emptyToNull(formData.get('heroImage2PublicId')),
    heroImage2Alt:             emptyToNull(formData.get('heroImage2Alt')),
    heroImage2VerticalPercent: formData.get('heroImage2VerticalPercent') ?? undefined,
    heroImage3Url:             getStr(formData, 'heroImage3Url'),
    heroImage3PublicId:        emptyToNull(formData.get('heroImage3PublicId')),
    heroImage3Alt:             emptyToNull(formData.get('heroImage3Alt')),
    heroImage3VerticalPercent: formData.get('heroImage3VerticalPercent') ?? undefined,
  };

  const parsed = departmentUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; '),
    };
  }

  try {
    await prisma.departmentIdentity.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...parsed.data },
      update: parsed.data,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidatePath('/admin/department-identity');
  revalidatePath('/admin');
  // Public surfaces: brand colors (via CSS vars on <html>) + hero
  // images on the homepage are read from this row. 'layout' scope
  // invalidates every route that uses the root layout.
  revalidatePath('/', 'layout');
  return { ok: true };
}
