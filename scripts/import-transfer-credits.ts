/**
 * Copies the credit-transfer policy from the Mechanical Engineering site.
 *
 * The policy is Sonargaon University's, not any one department's — the same
 * rules, limits, fee, and document list apply to every faculty. Rather than
 * retype it and risk a transcription error in a page students act on, this
 * reads the row straight out of the ME database and writes it here.
 *
 * The source database is read-only to this script. Run:
 *
 *   ME_DATABASE_URL=<connection string> \
 *     npx tsx --env-file=.env scripts/import-transfer-credits.ts
 */

import { PrismaClient } from '@prisma/client';
import { DepartmentRenamer, sourceDatabaseUrl } from './department-rename';

const prisma = new PrismaClient();
const source = new PrismaClient({ datasourceUrl: sourceDatabaseUrl() });
const rename = new DepartmentRenamer();

async function main() {
  const row = await source.admissionTransferCredits.findUnique({
    where: { id: 'singleton' },
  });

  if (!row) {
    throw new Error('The source database has no admission_transfer_credits row.');
  }

  const data = {
    intro: rename.text(row.intro),
    minimumGradeBullets: rename.deep(row.minimumGradeBullets) as never,
    limitMaxLabel: rename.text(row.limitMaxLabel),
    limitMaxValue: rename.text(row.limitMaxValue),
    limitMaxSubtitle: rename.text(row.limitMaxSubtitle),
    limitFeeLabel: rename.text(row.limitFeeLabel),
    limitFeeValue: rename.text(row.limitFeeValue),
    limitFeeSubtitle: rename.text(row.limitFeeSubtitle),
    documentsIntroText: rename.text(row.documentsIntroText),
    documents: rename.deep(row.documents) as never,
    summaryKicker: rename.text(row.summaryKicker),
    summaryHeading: rename.text(row.summaryHeading),
    summaryRows: rename.deep(row.summaryRows) as never,
  };

  await prisma.admissionTransferCredits.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', ...data },
    update: data,
  });

  console.log('Credit transfer policy imported.');
  console.log(`  bullets:   ${(data.minimumGradeBullets as unknown[]).length}`);
  console.log(`  documents: ${(data.documents as unknown[]).length}`);
  console.log(`  summary:   ${(data.summaryRows as unknown[]).length} rows`);
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
