/**
 * Import the department layout — where each office sits in the building —
 * from the university's Layout Plan document.
 *
 *   npx tsx --env-file=.env scripts/import-office-locations.ts <docx path>
 *
 * The document is a Word table: office name in one cell, its level and
 * building in the next. A .docx is a zip, so the table is read straight out of
 * word/document.xml rather than through a converter — one dependency fewer for
 * a file the university sends once a year.
 *
 * Safe to run again: it replaces the list.
 */
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import AdmZip from 'adm-zip';

const [, , docxPath] = process.argv;
if (!docxPath) {
  console.error('usage: npx tsx --env-file=.env scripts/import-office-locations.ts <docx path>');
  process.exit(1);
}

const prisma = new PrismaClient();

/** Word splits a sentence across runs whenever formatting changes; join them. */
function cellText(cellXml: string): string {
  return [...cellXml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
    .map((match) => match[1])
    .join('')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/** A paragraph break inside a cell separates the level from the building. */
function cellLines(cellXml: string): string[] {
  return cellXml
    .split(/<w:p[ >]/)
    .slice(1)
    .map((paragraph) => cellText(paragraph))
    .filter(Boolean);
}

function tableRows(documentXml: string): { name: string; lines: string[] }[] {
  const rows = documentXml.split(/<w:tr[ >]/).slice(1);

  return rows
    .map((row) => {
      const cells = row.split(/<w:tc[ >]/).slice(1);
      if (cells.length < 2) return null;
      /* "Office of the Head," and "Department of NAME" are two paragraphs in
         one cell, the first already ending in a comma — joining with another
         gives "Head,, Department". */
      const name = cellLines(cells[0])
        .join(', ')
        .replace(/,\s*,/g, ',')
        .replace(/\s+,/g, ',');
      const lines = cellLines(cells[1]);
      return name && lines.length > 0 ? { name, lines } : null;
    })
    .filter((row): row is { name: string; lines: string[] } => row !== null);
}

/** "Level: 05, Sonargaon University" → "Level 05". */
function tidyLevel(line: string): string {
  return line
    .replace(/,\s*Sonargaon University\s*$/i, '')
    .replace(/^Level:\s*/i, 'Level ')
    .trim();
}

function tidyBuilding(line: string): string {
  return line.replace(/^Building:\s*/i, '').replace(/\s*,\s*/g, ', ').trim();
}

async function main() {
  const documentXml = new AdmZip(readFileSync(docxPath)).readAsText('word/document.xml');
  const rows = tableRows(documentXml);

  const dept = await prisma.departmentIdentity.findUnique({
    where: { id: 'singleton' },
    select: { shortCode: true },
  });
  const shortCode = dept?.shortCode ?? '';

  /* The header row repeats the column titles; drop it rather than storing an
     office called "Name of the Office". */
  const offices = rows
    .filter((row) => !/^name of the office$/i.test(row.name))
    .map((row, index) => ({
      name: row.name,
      level: tidyLevel(row.lines[0] ?? ''),
      building: tidyBuilding(row.lines[1] ?? row.lines[0] ?? ''),
      /* The department's own offices are flagged so the page can lead with
         them — a student on this page is usually looking for one of those. */
      isDepartment: shortCode ? new RegExp(`\\b${shortCode}\\b`, 'i').test(row.name) : false,
      displayOrder: index + 1,
    }))
    .filter((office) => office.name && office.level);

  await prisma.officeLocation.deleteMany();
  await prisma.officeLocation.createMany({ data: offices });

  const departmental = offices.filter((o) => o.isDepartment);
  console.log(`${offices.length} offices`);
  for (const office of offices) {
    console.log(`  ${office.isDepartment ? '★' : ' '} ${office.name.padEnd(46)} ${office.level}`);
  }
  console.log(`\n${departmental.length} belong to the department`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
