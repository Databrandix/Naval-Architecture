/**
 * Import research and publications from the department's
 * "Research and Publications" spreadsheet.
 *
 *   npx tsx --env-file=.env scripts/import-research.ts <xlsx path>
 *
 * The sheet is one row per publication, with the researcher repeated down the
 * rows. It carries far more than the page shows — indexing, funding, keywords,
 * corresponding-author flags — and the columns that matter to a reader are the
 * title, who wrote it, where it appeared, when, and how to reach it.
 *
 * Sorted newest first, because a publication list read by a prospective student
 * or an external assessor is answering "what is this department doing now".
 *
 * Safe to run again: it replaces the whole list, which is what a re-exported
 * spreadsheet means.
 */
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const [, , xlsxPath] = process.argv;
if (!xlsxPath) {
  console.error('usage: npx tsx --env-file=.env scripts/import-research.ts <xlsx path>');
  process.exit(1);
}

const prisma = new PrismaClient();

const COLUMN = {
  researcher: 'Researcher Name',
  title: 'Publication Title',
  type: 'Publication Type (Journal/Conference/Book/etc.)',
  year: 'Publication Year',
  doi: 'DOI',
  url: 'URL/Link',
  publisher: 'Journal/Conference/Publisher Name',
  volume: 'Volume/Issue/Pages',
  coAuthors: 'Co-authors',
} as const;

const text = (v: unknown): string => String(v ?? '').replace(/\r/g, '').trim();

function parseYear(value: unknown): number | null {
  /* Years arrive as numbers, as strings, and occasionally as a range like
     "2011-2012" — the first four-digit number in the cell is the one meant. */
  const match = text(value).match(/\d{4}/);
  if (!match) return null;
  const year = Number(match[0]);
  return year >= 1900 && year <= 2100 ? year : null;
}

/** "K. H. Chowdhury" plus whoever else the sheet lists, as one credit line. */
function authorLine(row: Record<string, unknown>): string {
  const researcher = text(row[COLUMN.researcher]);
  const coAuthors = text(row[COLUMN.coAuthors]);
  if (!coAuthors) return researcher;
  return `${researcher}, ${coAuthors}`;
}

/**
 * The line under the title: what kind of publication it is and where it
 * appeared. The publisher cell is often a full sentence ("Keynote Speech
 * delivered in the Seminar held on 23 Jan, 2021 at IEB Auditorium…"), so it is
 * used as written rather than dressed up.
 */
function areaLine(row: Record<string, unknown>): string {
  const parts = [text(row[COLUMN.type]), text(row[COLUMN.publisher]), text(row[COLUMN.volume])].filter(
    Boolean,
  );
  return parts.join(' · ') || 'Publication';
}

function linksFor(row: Record<string, unknown>): { label: string; value: string }[] {
  const links: { label: string; value: string }[] = [];

  const doi = text(row[COLUMN.doi]);
  if (doi) {
    /* A bare DOI is not clickable; the resolver makes it one, and a DOI that
       already arrives as a URL is left alone. */
    links.push({ label: 'DOI', value: doi.startsWith('http') ? doi : `https://doi.org/${doi}` });
  }

  const url = text(row[COLUMN.url]);
  if (url) links.push({ label: 'Link', value: url });

  return links;
}

async function main() {
  const workbook = XLSX.read(readFileSync(xlsxPath));
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    workbook.Sheets['Research_Publications'],
    { defval: '' },
  );

  const papers = rows
    .filter((row) => text(row[COLUMN.title]))
    .map((row) => ({
      title: text(row[COLUMN.title]),
      authors: authorLine(row),
      area: areaLine(row),
      publicationYear: parseYear(row[COLUMN.year]),
      date: parseYear(row[COLUMN.year])?.toString() ?? null,
      links: linksFor(row),
    }))
    /* Newest first; anything without a year sinks to the bottom rather than
       being dropped — an undated publication still happened. */
    .sort((a, b) => (b.publicationYear ?? 0) - (a.publicationYear ?? 0));

  await prisma.researchPaper.deleteMany();
  await prisma.researchPaper.createMany({
    data: papers.map((paper, index) => ({ ...paper, displayOrder: index + 1 })),
  });

  const byType = new Map<string, number>();
  for (const row of rows) {
    const type = text(row[COLUMN.type]) || 'Unclassified';
    byType.set(type, (byType.get(type) ?? 0) + 1);
  }

  const years = papers.map((p) => p.publicationYear).filter((y): y is number => y !== null);
  const undated = papers.length - years.length;
  const withLinks = papers.filter((p) => p.links.length > 0).length;

  console.log(`${papers.length} publications, ${Math.min(...years)}–${Math.max(...years)}`);
  for (const [type, count] of [...byType].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(3)}  ${type}`);
  }
  if (undated) console.log(`\n${undated} without a year — listed last`);
  console.log(`${withLinks} with a DOI or link`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
