/**
 * Render a program's course structure and credit distribution as a PDF, and
 * point the program's curriculum row at it.
 *
 *   node --env-file=.env scripts/build-curriculum-pdf.mjs <degree code>
 *
 * The PDF is generated from the database, not from the spreadsheet, so what a
 * visitor downloads is what the page shows. Run it again after re-importing a
 * curriculum.
 *
 * pdfkit is a devDependency: the file is built here, written into
 * public/assets, and served as a static file. Nothing generates PDFs at
 * request time.
 */
import { createWriteStream, existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import { PrismaClient } from '@prisma/client';

const [, , degreeCodeArg] = process.argv;
if (!degreeCodeArg) {
  console.error('usage: node --env-file=.env scripts/build-curriculum-pdf.mjs <degree code>');
  process.exit(1);
}

const prisma = new PrismaClient();

const NAVY = '#2b3175';
const MAGENTA = '#cc1579';
const INK = '#1f2333';
const MUTED = '#6b6f85';
const RULE = '#dcdfeb';
const BAND = '#f2f3f9';

const PAGE_MARGIN = 48;

/**
 * Two courses in this curriculum are titled in Bengali, and the built-in PDF
 * fonts carry no Bengali glyphs — they came out as mojibake. Nirmala UI ships
 * with Windows and covers the script; when it is not there the titles would be
 * unreadable, so the build stops rather than publishing a broken PDF.
 */
const BENGALI_FONT_CANDIDATES = [
  process.env.BENGALI_FONT_PATH,
  'C:/Windows/Fonts/Shonar.ttf',
  'C:/Windows/Fonts/vrinda.ttf',
  '/usr/share/fonts/truetype/lohit-bengali/Lohit-Bengali.ttf',
  '/System/Library/Fonts/Supplemental/Bangla MN.ttc',
].filter(Boolean);

const BENGALI = /[\u0980-\u09FF]/;

const hasBengali = (text) => BENGALI.test(text);

function bodyFont(doc, text, { bold = false } = {}) {
  if (hasBengali(text)) return doc.font('Bengali');
  return doc.font(bold ? 'Helvetica-Bold' : 'Helvetica');
}

const formatCredits = (value) =>
  value === null || value === undefined ? '—' : Number.isInteger(value) ? String(value) : value.toFixed(1);

function creditsOf(courses) {
  return courses.reduce((sum, c) => sum + (c.credits ?? 0), 0);
}

/** Start a new page when the next block would not fit on this one. */
function ensureRoom(doc, needed) {
  if (doc.y + needed > doc.page.height - PAGE_MARGIN) doc.addPage();
}

function heading(doc, text) {
  ensureRoom(doc, 60);
  doc.moveDown(0.8);
  /* x has to be reset explicitly: the table helpers leave the cursor in the
     last column, and pdfkit measures the next text block from wherever x
     happens to be — which wrapped this heading into a narrow column. */
  doc.font('Helvetica-Bold').fontSize(13).fillColor(NAVY).text(text, PAGE_MARGIN, doc.y, {
    width: doc.page.width - PAGE_MARGIN * 2,
  });
  doc.moveDown(0.35);
  const y = doc.y;
  doc.moveTo(PAGE_MARGIN, y).lineTo(doc.page.width - PAGE_MARGIN, y).lineWidth(1).strokeColor(MAGENTA).stroke();
  doc.moveDown(0.6);
}

function courseTable(doc, semester) {
  const left = PAGE_MARGIN;
  const width = doc.page.width - PAGE_MARGIN * 2;
  const codeW = 78;
  const creditW = 58;
  const titleW = width - codeW - creditW;

  ensureRoom(doc, 70);

  doc.font('Helvetica-Bold').fontSize(10.5).fillColor(INK).text(semester.name, left, doc.y);
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(MUTED)
    .text(
      `${semester.courses.length} courses · ${formatCredits(creditsOf(semester.courses))} credits`,
      left,
      doc.y + 1,
    );
  doc.moveDown(0.5);

  // Header band
  let y = doc.y;
  doc.rect(left, y, width, 17).fill(BAND);
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(MUTED);
  doc.text('CODE', left + 6, y + 5, { width: codeW });
  doc.text('COURSE', left + codeW + 6, y + 5, { width: titleW });
  doc.text('CREDITS', left + codeW + titleW, y + 5, { width: creditW - 6, align: 'right' });
  y += 17;

  for (const course of semester.courses) {
    const titleHeight = bodyFont(doc, course.title)
      .fontSize(9)
      .heightOfString(course.title, { width: titleW - 12 });
    const rowHeight = Math.max(titleHeight + 10, 20);

    if (y + rowHeight > doc.page.height - PAGE_MARGIN) {
      doc.addPage();
      y = PAGE_MARGIN;
    }

    doc.moveTo(left, y).lineTo(left + width, y).lineWidth(0.5).strokeColor(RULE).stroke();

    doc.font('Helvetica').fontSize(8.5).fillColor(NAVY).text(course.code, left + 6, y + 6, { width: codeW - 6 });
    bodyFont(doc, course.title)
      .fontSize(9)
      .fillColor(INK)
      .text(course.title, left + codeW + 6, y + 5, { width: titleW - 12 });
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(INK)
      .text(formatCredits(course.credits), left + codeW + titleW, y + 5, { width: creditW - 6, align: 'right' });

    y += rowHeight;
  }

  doc.moveTo(left, y).lineTo(left + width, y).lineWidth(0.5).strokeColor(RULE).stroke();
  doc.y = y + 14;
}

function creditTable(doc, rows) {
  const left = PAGE_MARGIN;
  const width = doc.page.width - PAGE_MARGIN * 2;
  const columns = ['Semester', 'Core', 'Elective', 'Lab', 'Project', 'Total', 'Cumulative'];
  const semesterW = width - 6 * 62;
  const widths = [semesterW, 62, 62, 62, 62, 62, 62];

  ensureRoom(doc, 40 + rows.length * 18);

  let y = doc.y;
  doc.rect(left, y, width, 18).fill(BAND);
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(MUTED);
  let x = left;
  columns.forEach((label, i) => {
    doc.text(label.toUpperCase(), x + 6, y + 5.5, {
      width: widths[i] - 12,
      align: i === 0 ? 'left' : 'right',
    });
    x += widths[i];
  });
  y += 18;

  for (const row of rows) {
    if (y + 18 > doc.page.height - PAGE_MARGIN) {
      doc.addPage();
      y = PAGE_MARGIN;
    }
    doc.moveTo(left, y).lineTo(left + width, y).lineWidth(0.5).strokeColor(RULE).stroke();

    const cells = [
      row.semester,
      formatCredits(row.core),
      formatCredits(row.elective),
      formatCredits(row.lab),
      formatCredits(row.project),
      formatCredits(row.total),
      formatCredits(row.cumulative),
    ];

    x = left;
    cells.forEach((cell, i) => {
      doc
        .font(i === 5 ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(8.5)
        .fillColor(i === 5 ? NAVY : INK)
        .text(cell, x + 6, y + 5, { width: widths[i] - 12, align: i === 0 ? 'left' : 'right' });
      x += widths[i];
    });
    y += 18;
  }

  doc.moveTo(left, y).lineTo(left + width, y).lineWidth(0.5).strokeColor(RULE).stroke();
  doc.y = y + 10;
}

async function main() {
  const program = await prisma.program.findFirst({
    where: { degreeCode: { equals: degreeCodeArg, mode: 'insensitive' } },
    select: { id: true, programName: true, degreeCode: true, curriculum: true },
  });
  if (!program) throw new Error(`no program with degree code "${degreeCodeArg}"`);
  if (!program.curriculum) throw new Error('this program has no curriculum yet — run import-curriculum.mjs first');

  const dept = await prisma.departmentIdentity.findUnique({ where: { id: 'singleton' } });
  const semesters = program.curriculum.semesters ?? [];
  const creditRows = program.curriculum.creditRows ?? [];

  const slug = program.degreeCode.toLowerCase();
  const fileName = `${slug}-course-structure.pdf`;
  const relativePath = `/assets/${fileName}`;
  const outputPath = path.join(process.cwd(), 'public', 'assets', fileName);
  await mkdir(path.dirname(outputPath), { recursive: true });

  const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN, info: { Title: `${program.programName} — Course Structure` } });

  const needsBengali = semesters.some((s) => s.courses.some((c) => hasBengali(c.title)));
  if (needsBengali) {
    const fontPath = BENGALI_FONT_CANDIDATES.find((p) => existsSync(p));
    if (!fontPath) {
      throw new Error(
        'this curriculum has Bengali course titles and no Bengali font was found. Set BENGALI_FONT_PATH ' +
          `to a font that covers the script — tried: ${BENGALI_FONT_CANDIDATES.join(', ')}`,
      );
    }
    doc.registerFont('Bengali', fontPath);
    console.log(`Bengali titles will use ${fontPath}`);
  }

  const stream = createWriteStream(outputPath);
  doc.pipe(stream);

  // Cover block
  doc.font('Helvetica-Bold').fontSize(9).fillColor(MAGENTA).text('SONARGAON UNIVERSITY', { characterSpacing: 1.2 });
  doc.moveDown(0.2);
  doc.font('Helvetica').fontSize(10).fillColor(MUTED).text(dept?.name ?? '');
  doc.moveDown(0.8);
  doc.font('Helvetica-Bold').fontSize(19).fillColor(NAVY).text(program.programName);
  doc.moveDown(0.3);

  const totalCourses = semesters.reduce((n, s) => n + s.courses.length, 0);
  const totalCredits = creditRows.length
    ? creditRows[creditRows.length - 1].cumulative
    : semesters.reduce((n, s) => n + creditsOf(s.courses), 0);
  doc
    .font('Helvetica')
    .fontSize(9.5)
    .fillColor(MUTED)
    .text(`${totalCourses} courses · ${semesters.length} semesters · ${formatCredits(totalCredits)} credits`);

  heading(doc, 'Course Structure');
  for (const semester of semesters) courseTable(doc, semester);

  if (creditRows.length) {
    heading(doc, 'Credit Distribution');
    creditTable(doc, creditRows);
  }

  doc.end();
  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  await prisma.programCurriculum.update({
    where: { programId: program.id },
    data: { pdfUrl: relativePath, pdfFileName: fileName },
  });

  console.log(`wrote public${relativePath}`);
  console.log(`  ${totalCourses} courses, ${semesters.length} semesters, ${creditRows.length} credit rows`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
