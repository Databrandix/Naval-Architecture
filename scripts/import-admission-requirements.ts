/**
 * Copies the admission eligibility rules from the Mechanical Engineering site.
 *
 * Entry requirements are set by the university and its Admission Committee,
 * not by a department: the same GPA floors, the same equivalence rules, the
 * same diploma route. The one engineering-specific clause — Physics,
 * Chemistry, and Mathematics at HSC / A-Level — applies to this programme
 * exactly as it does to the source's.
 *
 *   ME_DATABASE_URL=<connection string> \
 *     npx tsx --env-file=.env scripts/import-admission-requirements.ts
 */

import { PrismaClient } from '@prisma/client';
import { DepartmentRenamer, sourceDatabaseUrl } from './department-rename';

const prisma = new PrismaClient();
const source = new PrismaClient({ datasourceUrl: sourceDatabaseUrl() });
const rename = new DepartmentRenamer();

async function main() {
  const row = await source.admissionRequirements.findUnique({
    where: { id: 'singleton' },
  });

  if (!row) {
    throw new Error('The source database has no admission_requirements row.');
  }

  const data = {
    intro: rename.text(row.intro),
    undergraduateRequirements: rename.deep(row.undergraduateRequirements) as never,
    additionalNotes: rename.deep(row.additionalNotes) as never,
    diplomaRequirements: rename.deep(row.diplomaRequirements) as never,
    combinedGpaBody: rename.text(row.combinedGpaBody),
    diplomaQuickCriteria: rename.deep(row.diplomaQuickCriteria) as never,
  };

  await prisma.admissionRequirements.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', ...data },
    update: data,
  });

  console.log('Admission requirements imported.');
  console.log(`  undergraduate: ${(data.undergraduateRequirements as unknown[]).length}`);
  console.log(`  notes:         ${(data.additionalNotes as unknown[]).length}`);
  console.log(`  diploma:       ${(data.diplomaRequirements as unknown[]).length}`);
  console.log(`  criteria:      ${(data.diplomaQuickCriteria as unknown[]).length}`);
  rename.report();
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.all([prisma.$disconnect(), source.$disconnect()]);
  });
