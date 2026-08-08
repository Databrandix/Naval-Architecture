/**
 * Import a program's course structure and credit distribution from the
 * university's "Programs and Course Curriculum" spreadsheet.
 *
 *   node --env-file=.env scripts/import-curriculum.mjs <xlsx path> <degree code>
 *
 * The spreadsheet writes a semester name once per block and leaves the cell
 * empty on the rows beneath it — merged cells read that way. Every row after
 * the first would otherwise land under an empty semester, so the name is
 * carried down explicitly.
 *
 * Re-running replaces the curriculum for that program. It is the department's
 * own file that is authoritative, not what happens to be in the table.
 */
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import XLSX from 'xlsx';

const [, , xlsxPath, degreeCode] = process.argv;

if (!xlsxPath || !degreeCode) {
  console.error('usage: node --env-file=.env scripts/import-curriculum.mjs <xlsx path> <degree code>');
  process.exit(1);
}

const prisma = new PrismaClient();

function sheet(workbook, name) {
  const ws = workbook.Sheets[name];
  if (!ws) throw new Error(`sheet "${name}" not found — sheets are: ${workbook.SheetNames.join(', ')}`);
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}

/** Carry a merged-cell value down the rows it spans. */
function fillDown(rows, column) {
  let last = '';
  for (const row of rows) {
    if (String(row[column]).trim()) last = String(row[column]).trim();
    else row[column] = last;
  }
  return rows;
}

const number = (v) => (v === '' || v === null ? null : Number(v));
const text = (v) => String(v ?? '').trim();

function buildSemesters(rows) {
  const withSemester = fillDown(
    rows.filter((r) => text(r['Course Code'])),
    'Semester',
  );

  const order = [];
  const bySemester = new Map();

  for (const row of withSemester) {
    const name = text(row.Semester);
    if (!bySemester.has(name)) {
      bySemester.set(name, []);
      order.push(name);
    }
    bySemester.get(name).push({
      code: text(row['Course Code']),
      title: text(row['Course Title']),
      type: text(row['Course Type (Core/Elective)']),
      credits: number(row.Credits),
      prerequisite: text(row['Prerequisite (If any)']) || null,
      remarks: text(row.Remarks) || null,
    });
  }

  return order.map((name) => ({ name, courses: bySemester.get(name) }));
}

function buildCreditRows(rows) {
  return rows
    .filter((r) => text(r.Semester))
    .map((r) => ({
      semester: text(r.Semester),
      total: number(r['Total Credits (Semester)']),
      core: number(r['Core Credits']),
      elective: number(r['Elective Credits']),
      lab: number(r['Lab Credits']),
      project: number(r['Project/Thesis Credits']),
      cumulative: number(r['Cumulative Credits']),
    }));
}

async function main() {
  const workbook = XLSX.read(readFileSync(xlsxPath));

  const semesters = buildSemesters(sheet(workbook, 'Course_Structure'));
  const creditRows = buildCreditRows(sheet(workbook, 'Credit_Distribution'));

  const program = await prisma.program.findFirst({
    where: { degreeCode: { equals: degreeCode, mode: 'insensitive' } },
    select: { id: true, programName: true },
  });
  if (!program) throw new Error(`no program with degree code "${degreeCode}"`);

  await prisma.programCurriculum.upsert({
    where: { programId: program.id },
    update: { semesters, creditRows },
    create: { programId: program.id, semesters, creditRows },
  });

  const courseCount = semesters.reduce((n, s) => n + s.courses.length, 0);
  const credits = semesters.reduce(
    (n, s) => n + s.courses.reduce((m, c) => m + (c.credits ?? 0), 0),
    0,
  );

  console.log(program.programName);
  for (const s of semesters) {
    const c = s.courses.reduce((n, x) => n + (x.credits ?? 0), 0);
    console.log(`  ${s.name.padEnd(24)} ${String(s.courses.length).padStart(2)} courses · ${c} credits`);
  }
  console.log(`  ${'total'.padEnd(24)} ${courseCount} courses · ${credits} credits`);
  console.log(`  credit distribution rows: ${creditRows.length}`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
