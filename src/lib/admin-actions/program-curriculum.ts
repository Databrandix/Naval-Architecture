'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { parseCurriculumWorkbook } from '@/lib/curriculum-import';

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

/** Guards against a 40 MB "spreadsheet" being read into memory before it fails. */
const MAX_WORKBOOK_BYTES = 5 * 1024 * 1024;

const SPREADSHEET_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

async function requireAuth(): Promise<ActionResult | null> {
  const session = await getSession();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };
  return null;
}

function revalidateCurriculumSurfaces(slug: string) {
  revalidatePath(`/programs/${slug}`);
  revalidatePath('/admin/program-curriculum');
  revalidatePath(`/admin/program-curriculum/${slug}`);
}

async function programBySlug(slug: string) {
  return prisma.program.findFirst({
    where: { degreeCode: { equals: slug, mode: 'insensitive' } },
    select: { id: true, degreeCode: true, programName: true },
  });
}

/**
 * Replace a programme's curriculum from the department's own spreadsheet.
 *
 * Uploading the file the department sends is the workflow that actually
 * happens; hand-entering sixty-odd courses is not. The file is parsed and
 * discarded — only the courses it describes are stored.
 */
export async function replaceCurriculumFromWorkbook(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const unauthorised = await requireAuth();
  if (unauthorised) return unauthorised;

  const slug = String(formData.get('slug') ?? '').trim();
  const file = formData.get('workbook');

  if (!slug) return { ok: false, error: 'No programme was named.' };
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Choose a curriculum spreadsheet to upload.' };
  }
  if (file.size > MAX_WORKBOOK_BYTES) {
    return { ok: false, error: 'That file is larger than 5 MB — check it is the curriculum spreadsheet.' };
  }
  if (file.type && !SPREADSHEET_TYPES.includes(file.type) && !file.name.endsWith('.xlsx')) {
    return { ok: false, error: 'That is not an .xlsx spreadsheet.' };
  }

  const program = await programBySlug(slug);
  if (!program) return { ok: false, error: 'No programme with that degree code.' };

  let parsed;
  try {
    parsed = parseCurriculumWorkbook(Buffer.from(await file.arrayBuffer()), program.degreeCode);
  } catch (error) {
    /* The message names the sheet or column that was wrong, which is the only
       thing that helps somebody fix their file. */
    return { ok: false, error: error instanceof Error ? error.message : 'That file could not be read.' };
  }

  await prisma.programCurriculum.upsert({
    where: { programId: program.id },
    update: { semesters: parsed.semesters, creditRows: parsed.creditRows },
    create: {
      programId: program.id,
      semesters: parsed.semesters,
      creditRows: parsed.creditRows,
    },
  });

  revalidateCurriculumSurfaces(program.degreeCode.toLowerCase());

  const courses = parsed.semesters.reduce((n, s) => n + s.courses.length, 0);
  return {
    ok: true,
    message: `Replaced with ${courses} courses across ${parsed.semesters.length} semesters.`,
  };
}

/** Point the page's download at a PDF, or clear it. */
export async function setCurriculumPdf(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const unauthorised = await requireAuth();
  if (unauthorised) return unauthorised;

  const slug = String(formData.get('slug') ?? '').trim();
  const pdfUrl = String(formData.get('pdfUrl') ?? '').trim();
  const pdfFileName = String(formData.get('pdfFileName') ?? '').trim();

  const program = await programBySlug(slug);
  if (!program) return { ok: false, error: 'No programme with that degree code.' };

  const curriculum = await prisma.programCurriculum.findUnique({
    where: { programId: program.id },
    select: { id: true },
  });
  if (!curriculum) return { ok: false, error: 'Upload a curriculum before attaching a PDF to it.' };

  await prisma.programCurriculum.update({
    where: { id: curriculum.id },
    data: {
      pdfUrl: pdfUrl || null,
      pdfFileName: pdfUrl ? pdfFileName || pdfUrl.split('/').pop() || null : null,
    },
  });

  revalidateCurriculumSurfaces(program.degreeCode.toLowerCase());
  return { ok: true, message: pdfUrl ? 'Download link saved.' : 'Download removed from the page.' };
}

/** Remove the curriculum entirely — the section disappears from the page. */
export async function deleteCurriculum(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const unauthorised = await requireAuth();
  if (unauthorised) return unauthorised;

  const slug = String(formData.get('slug') ?? '').trim();
  const program = await programBySlug(slug);
  if (!program) return { ok: false, error: 'No programme with that degree code.' };

  await prisma.programCurriculum.deleteMany({ where: { programId: program.id } });
  revalidateCurriculumSurfaces(program.degreeCode.toLowerCase());
  return { ok: true, message: 'Curriculum removed.' };
}
