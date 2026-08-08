/**
 * Import a program's course structure and credit distribution from the
 * university's "Programs and Course Curriculum" spreadsheet.
 *
 *   npx tsx --env-file=.env scripts/import-curriculum.ts <xlsx path> <degree code>
 *
 * The parsing lives in src/lib/curriculum-import.ts, shared with the admin
 * screen's upload, so a curriculum imported here and one uploaded through the
 * panel are read the same way.
 *
 * Re-running replaces the curriculum for that program: the department's file
 * is authoritative, not whatever happens to be in the table.
 */
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import {
  parseCurriculumWorkbook,
  totalCourses,
  totalCredits,
} from '../src/lib/curriculum-import';

const [, , xlsxPath, degreeCode] = process.argv;

if (!xlsxPath || !degreeCode) {
  console.error(
    'usage: npx tsx --env-file=.env scripts/import-curriculum.ts <xlsx path> <degree code>',
  );
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const program = await prisma.program.findFirst({
    where: { degreeCode: { equals: degreeCode, mode: 'insensitive' } },
    select: { id: true, programName: true, degreeCode: true },
  });
  if (!program) throw new Error(`no program with degree code "${degreeCode}"`);

  const { semesters, creditRows } = parseCurriculumWorkbook(
    readFileSync(xlsxPath),
    program.degreeCode,
  );

  await prisma.programCurriculum.upsert({
    where: { programId: program.id },
    update: { semesters, creditRows },
    create: { programId: program.id, semesters, creditRows },
  });

  console.log(program.programName);
  for (const semester of semesters) {
    const credits = semester.courses.reduce((n, c) => n + (c.credits ?? 0), 0);
    console.log(
      `  ${semester.name.padEnd(24)} ${String(semester.courses.length).padStart(2)} courses · ${credits} credits`,
    );
  }
  console.log(
    `  ${'total'.padEnd(24)} ${totalCourses(semesters)} courses · ${totalCredits(semesters)} credits`,
  );
  console.log(`  credit distribution rows: ${creditRows.length}`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
