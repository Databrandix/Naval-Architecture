'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { universityUpdateSchema } from '@/lib/validation';

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

function splitLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function updateUniversityAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };

  const raw = {
    name:          getStr(formData, 'name'),
    address:       getStr(formData, 'address'),
    phones:        splitLines(getStr(formData, 'phones')),
    emails:        splitLines(getStr(formData, 'emails')),
    facebookUrl:   emptyToNull(formData.get('facebookUrl')),
    instagramUrl:  emptyToNull(formData.get('instagramUrl')),
    youtubeUrl:    emptyToNull(formData.get('youtubeUrl')),
    linkedinUrl:   emptyToNull(formData.get('linkedinUrl')),
    xUrl:          emptyToNull(formData.get('xUrl')),
    tiktokUrl:     emptyToNull(formData.get('tiktokUrl')),
    whatsappUrl:   emptyToNull(formData.get('whatsappUrl')),
    threadsUrl:    emptyToNull(formData.get('threadsUrl')),
    erpUrl:        emptyToNull(formData.get('erpUrl')),
    applyUrl:      emptyToNull(formData.get('applyUrl')),
    libraryUrl:    emptyToNull(formData.get('libraryUrl')),
    iqacUrl:       emptyToNull(formData.get('iqacUrl')),
    careerUrl:     emptyToNull(formData.get('careerUrl')),
    noticeUrl:     emptyToNull(formData.get('noticeUrl')),
    copyrightText: getStr(formData, 'copyrightText'),
    mapEmbedUrl:   emptyToNull(formData.get('mapEmbedUrl')),
    logoUrl:       getStr(formData, 'logoUrl'),
    logoPublicId:  emptyToNull(formData.get('logoPublicId')),
    // Phase 9 — contact form recipient. Empty input → null.
    contactSubmissionEmail: emptyToNull(formData.get('contactSubmissionEmail')),
  };

  const parsed = universityUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; '),
    };
  }

  try {
    await prisma.universityIdentity.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...parsed.data },
      update: parsed.data,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidatePath('/admin/university-identity');
  revalidatePath('/admin');
  // Public surfaces: Navbar (logo + ERP/apply URLs) and Footer
  // (everything) read from this row. 'layout' scope invalidates
  // every route that uses the root layout.
  revalidatePath('/', 'layout');
  return { ok: true };
}
