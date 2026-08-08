'use server';

import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { waiverScholarshipLandingUpdateSchema } from '@/lib/validation';

export type ActionResult = { ok: true } | { ok: false; error: string };

function getStr(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === 'string' ? v.trim() : '';
}
function getParagraphs(fd: FormData, key: string): string[] {
  return fd.getAll(key)
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}
function parseJsonArray(fd: FormData, key: string): unknown {
  const raw = fd.get(key);
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
async function requireAuth(): Promise<ActionResult | null> {
  const session = await getSession();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };
  return null;
}

export async function updateWaiverScholarshipLandingAction(
  _prev: ActionResult | { ok: null },
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const raw = {
    intro:              getStr(formData, 'intro'),
    part1Kicker:        getStr(formData, 'part1Kicker'),
    part1Heading:       getStr(formData, 'part1Heading'),
    summaryHeading:     getStr(formData, 'summaryHeading'),
    summarySubheading:  getStr(formData, 'summarySubheading'),
    summaryRows:        parseJsonArray(formData, 'summaryRows'),
    summaryFooterNote:  getStr(formData, 'summaryFooterNote'),
    part2Kicker:        getStr(formData, 'part2Kicker'),
    part2Heading:       getStr(formData, 'part2Heading'),
    part2Intro:         getStr(formData, 'part2Intro'),
    keyTakeawaysKicker: getStr(formData, 'keyTakeawaysKicker'),
    keyTakeaways:       getParagraphs(formData, 'keyTakeaways'),
  };

  const parsed = waiverScholarshipLandingUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ') };
  }

  const data = {
    ...parsed.data,
    summaryRows:  parsed.data.summaryRows  as unknown as Prisma.InputJsonValue,
    keyTakeaways: parsed.data.keyTakeaways as unknown as Prisma.InputJsonValue,
  };

  try {
    await prisma.waiverScholarshipLanding.upsert({
      where:  { id: 'singleton' },
      create: { id: 'singleton', ...data },
      update: data,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Database error' };
  }

  revalidatePath('/admission/waiver-scholarship');
  revalidatePath('/admin/waiver-scholarship-landing');
  revalidatePath('/admin');
  revalidatePath('/', 'layout');
  return { ok: true };
}
