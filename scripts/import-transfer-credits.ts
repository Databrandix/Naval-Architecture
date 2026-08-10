/**
 * Copies the credit-transfer policy from the Mechanical Engineering site.
 *
 * The policy is Sonargaon University's, not any one department's — the same
 * rules, limits, fee, and document list apply to every faculty. Rather than
 * retype it and risk a transcription error in a page students act on, this
 * reads the row straight out of the ME database and writes it here.
 *
 * The source database is read-only to this script. Point ME_DATABASE_URL at
 * it and run:
 *
 *   npx tsx --env-file=.env scripts/import-transfer-credits.ts
 *
 * Any wording that names the source department is rewritten to this one on
 * the way through; the run prints every substitution it makes so a mention
 * that needs a human decision is visible rather than silently reworded.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SOURCE_URL = process.env.ME_DATABASE_URL;
if (!SOURCE_URL) {
  // Deliberately not defaulted — a connection string is a credential, and one
  // written into the repository is a leaked credential.
  throw new Error(
    'Set ME_DATABASE_URL to the Mechanical Engineering connection string before running this.',
  );
}

const source = new PrismaClient({ datasourceUrl: SOURCE_URL });

/** Mentions of the source department, longest form first so the short
 *  code does not eat the middle of the full name. */
const RENAMES: [RegExp, string][] = [
  [/Department of Mechanical Engineering/g, 'Department of Naval Architecture and Marine Engineering'],
  [/Mechanical Engineering/g, 'Naval Architecture and Marine Engineering'],
  [/\bME\b/g, 'NAME'],
];

const substitutions: string[] = [];

function rename(value: string): string {
  let out = value;
  for (const [pattern, replacement] of RENAMES) {
    // `.test()` on a /g regex is stateful — build a fresh one per check.
    if (new RegExp(pattern.source).test(out)) {
      substitutions.push(`${pattern.source} → ${replacement}`);
      out = out.replace(pattern, replacement);
    }
  }
  return out;
}

/** Walks strings anywhere in a Json column and renames them in place. */
function renameDeep(value: unknown): unknown {
  if (typeof value === 'string') return rename(value);
  if (Array.isArray(value)) return value.map(renameDeep);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, renameDeep(v)]),
    );
  }
  return value;
}

async function main() {
  const row = await source.admissionTransferCredits.findUnique({
    where: { id: 'singleton' },
  });

  if (!row) {
    throw new Error('The source database has no admission_transfer_credits row.');
  }

  const { id: _id, updatedAt: _updatedAt, ...content } = row;

  const data = {
    intro: rename(content.intro),
    minimumGradeBullets: renameDeep(content.minimumGradeBullets) as never,
    limitMaxLabel: rename(content.limitMaxLabel),
    limitMaxValue: rename(content.limitMaxValue),
    limitMaxSubtitle: rename(content.limitMaxSubtitle),
    limitFeeLabel: rename(content.limitFeeLabel),
    limitFeeValue: rename(content.limitFeeValue),
    limitFeeSubtitle: rename(content.limitFeeSubtitle),
    documentsIntroText: rename(content.documentsIntroText),
    documents: renameDeep(content.documents) as never,
    summaryKicker: rename(content.summaryKicker),
    summaryHeading: rename(content.summaryHeading),
    summaryRows: renameDeep(content.summaryRows) as never,
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
  if (substitutions.length === 0) {
    console.log('  no department names appeared in the source text');
  } else {
    console.log(`  renamed:   ${substitutions.length}`);
    for (const s of new Set(substitutions)) console.log(`    ${s}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.all([prisma.$disconnect(), source.$disconnect()]);
  });
