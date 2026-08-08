/**
 * Import the department's service charter — what a student wants done, the
 * steps, and who is responsible.
 *
 *   npx tsx --env-file=.env scripts/import-service-charter.ts <xlsx path>
 *
 * The sheet is a printed table read by row position rather than by column
 * name: its header row is two rows down, "Process Flow" spans three merged
 * columns, and the merge leaves the second and third empty on most rows. So
 * the columns are taken by index — 0 serial, 1 title, 2-4 steps, 5 responsible.
 *
 * Safe to run again: it replaces the charter.
 */
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const [, , xlsxPath] = process.argv;
if (!xlsxPath) {
  console.error('usage: npx tsx --env-file=.env scripts/import-service-charter.ts <xlsx path>');
  process.exit(1);
}

const prisma = new PrismaClient();

const SHEET = 'Service Charter';
const STEP_COLUMNS = [2, 3, 4];
const RESPONSIBLE_COLUMN = 5;

/** Collapse the newlines Word leaves inside a cell without gluing words together. */
const text = (v: unknown): string =>
  String(v ?? '')
    .replace(/\r/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

/**
 * A step cell often starts with its own number — "→1. Accounts Clearance".
 * The page numbers the steps itself, so the prefix would be printed twice.
 */
const stripStepNumber = (step: string): string =>
  step.replace(/^[→\-\s]*\d+\.\s*/, '').replace(/^→\s*/, '').trim();

async function main() {
  const workbook = XLSX.read(readFileSync(xlsxPath));
  const sheet = workbook.Sheets[SHEET];
  if (!sheet) {
    throw new Error(`no "${SHEET}" sheet — the workbook has: ${workbook.SheetNames.join(', ')}`);
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false });

  const entries = rows
    /* A charter row starts with its serial number; the title banner and the
       header row do not. */
    .filter((row) => typeof row[0] === 'number' && text(row[1]))
    .map((row, index) => ({
      serial: row[0] as number,
      title: text(row[1]),
      steps: STEP_COLUMNS.map((column) => stripStepNumber(text(row[column]))).filter(Boolean),
      responsible: text(row[RESPONSIBLE_COLUMN]),
      displayOrder: index + 1,
    }))
    .filter((entry) => entry.steps.length > 0);

  await prisma.serviceCharterEntry.deleteMany();
  await prisma.serviceCharterEntry.createMany({ data: entries });

  console.log(`${entries.length} services`);
  for (const entry of entries) {
    console.log(`  ${String(entry.serial).padStart(2)}. ${entry.title.slice(0, 56).padEnd(58)} ${entry.steps.length} step(s)`);
  }

  const withoutOwner = entries.filter((entry) => !entry.responsible);
  if (withoutOwner.length > 0) {
    console.log(`\n${withoutOwner.length} without a named person:`);
    for (const entry of withoutOwner) console.log(`  ${entry.title.slice(0, 70)}`);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
