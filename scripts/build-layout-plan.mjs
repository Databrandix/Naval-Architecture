/**
 * The Layout Plan page: its downloadable plan, its cover, and its place in
 * the About menu.
 *
 *   node --env-file=.env scripts/build-layout-plan.mjs
 *
 * /about/department-layout already listed every office against its level. It
 * was reachable only from search — no menu pointed at it — and it offered
 * nothing to take away. This gives it both: a PDF of the same directory, and
 * an About > Layout Plan entry.
 *
 * The PDF is generated from the database, so what a visitor downloads is what
 * the page shows. Re-run it after changing an office row.
 *
 * pdfkit and sharp are devDependencies: the files are built here, written
 * into public/assets, and served statically. Nothing is generated at request
 * time, and nothing depends on Cloudinary — PDF delivery is disabled on the
 * account, which is why the syllabus and prospectus are bundled files too.
 *
 * Safe to run again: it overwrites both files, updates the one layout row,
 * and leaves the menu alone if the entry is already there.
 */
import { createWriteStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NAVY = '#2b3175';
const MAGENTA = '#cc1579';
const INK = '#1f2333';
const MUTED = '#6b6f85';
const RULE = '#dcdfeb';
const BAND = '#f2f3f9';

const PAGE_MARGIN = 48;

const SLUG = 'department-layout-plan';
const PDF_FILE = 'layout-plan-name.pdf';
const COVER_FILE = 'layout-plan-name-cover.jpg';

/** XML-escape — an office name with an ampersand would break the cover SVG. */
const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Trim to fit a fixed-width line, since SVG text does not wrap. */
const clip = (s, max) => (s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`);

function officeTable(doc, offices) {
  const left = PAGE_MARGIN;
  const width = doc.page.width - PAGE_MARGIN * 2;
  const levelW = 150;
  const nameW = width - levelW;

  let y = doc.y;
  doc.rect(left, y, width, 18).fill(BAND);
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(MUTED);
  doc.text('OFFICE', left + 8, y + 5.5, { width: nameW - 16 });
  doc.text('LEVEL', left + nameW, y + 5.5, { width: levelW - 8, align: 'right' });
  y += 18;

  for (const office of offices) {
    const nameHeight = doc
      .font(office.isDepartment ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(9.5)
      .heightOfString(office.name, { width: nameW - 16 });
    const rowHeight = Math.max(nameHeight + 11, 22);

    if (y + rowHeight > doc.page.height - PAGE_MARGIN) {
      doc.addPage();
      y = PAGE_MARGIN;
    }

    doc.moveTo(left, y).lineTo(left + width, y).lineWidth(0.5).strokeColor(RULE).stroke();

    doc
      .font(office.isDepartment ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(9.5)
      .fillColor(office.isDepartment ? NAVY : INK)
      .text(office.name, left + 8, y + 6, { width: nameW - 16 });
    doc
      .font('Helvetica')
      .fontSize(9.5)
      .fillColor(MUTED)
      .text(office.level, left + nameW, y + 6, { width: levelW - 8, align: 'right' });

    y += rowHeight;
  }

  doc.moveTo(left, y).lineTo(left + width, y).lineWidth(0.5).strokeColor(RULE).stroke();
  doc.y = y + 16;
}

function sectionHeading(doc, text) {
  doc.moveDown(0.9);
  /* x is reset explicitly: the table leaves the cursor in the last column, and
     pdfkit measures the next block from wherever x happens to be. */
  doc.font('Helvetica-Bold').fontSize(12).fillColor(NAVY).text(text, PAGE_MARGIN, doc.y, {
    width: doc.page.width - PAGE_MARGIN * 2,
  });
  doc.moveDown(0.3);
  const y = doc.y;
  doc.moveTo(PAGE_MARGIN, y).lineTo(doc.page.width - PAGE_MARGIN, y).lineWidth(1).strokeColor(MAGENTA).stroke();
  doc.moveDown(0.6);
}

/**
 * The card on the page wants a cover image. Every other cover on this site is
 * a photograph of a real document's first page; this document has no printed
 * original, so the cover is drawn to look like the plan it fronts — the
 * heading, the address, and the first rows of the table — rather than
 * pretending to be a scan of something that was never printed.
 */
async function buildCover(dept, offices, outputPath) {
  /* Department offices lead, as they do in the table and in the PDF — the
     cover should preview the document it fronts, not a different ordering. */
  const ordered = [...offices].sort(
    (a, b) => Number(b.isDepartment) - Number(a.isDepartment) || a.displayOrder - b.displayOrder,
  );
  const preview = ordered.slice(0, 9);
  const rows = preview
    .map((office, i) => {
      const y = 300 + i * 34;
      const weight = office.isDepartment ? '600' : '400';
      const fill = office.isDepartment ? NAVY : INK;
      return `
    <line x1="56" y1="${y - 20}" x2="544" y2="${y - 20}" stroke="${RULE}" stroke-width="1"/>
    <text x="56" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="15" font-weight="${weight}" fill="${fill}">${esc(clip(office.name, 46))}</text>
    <text x="544" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="14" fill="${MUTED}" text-anchor="end">${esc(office.level)}</text>`;
    })
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
  <rect width="600" height="800" fill="#ffffff"/>
  <rect width="600" height="10" fill="${NAVY}"/>
  <text x="56" y="96" font-family="Helvetica, Arial, sans-serif" font-size="13" font-weight="700" letter-spacing="2" fill="${MAGENTA}">SONARGAON UNIVERSITY</text>
  <text x="56" y="126" font-family="Helvetica, Arial, sans-serif" font-size="15" fill="${MUTED}">${esc(clip(dept.name, 62))}</text>
  <text x="56" y="196" font-family="Helvetica, Arial, sans-serif" font-size="40" font-weight="700" fill="${NAVY}">Layout Plan</text>
  <line x1="56" y1="222" x2="200" y2="222" stroke="${MAGENTA}" stroke-width="3"/>
  <text x="56" y="256" font-family="Helvetica, Arial, sans-serif" font-size="14" fill="${MUTED}">${offices.length} offices · 147/I, Green Road, Panthapath, Dhaka-1215</text>
  ${rows}
  <line x1="56" y1="${300 + preview.length * 34 - 20}" x2="544" y2="${300 + preview.length * 34 - 20}" stroke="${RULE}" stroke-width="1"/>
  <text x="56" y="${300 + preview.length * 34 + 14}" font-family="Helvetica, Arial, sans-serif" font-size="13" fill="${MUTED}">and ${offices.length - preview.length} more…</text>
  <rect y="790" width="600" height="10" fill="${MAGENTA}"/>
</svg>`;

  await writeFile(outputPath, await sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toBuffer());
}

/** Put Layout Plan in the About menu, after the entries already there. */
async function addMenuEntry(href) {
  const about = await prisma.mainNavGroup.findFirst({ where: { name: 'About' } });
  if (!about) {
    console.log('  no About menu group — skipped the menu entry');
    return;
  }

  const existing = await prisma.mainNavItem.findFirst({
    where: { groupId: about.id, href },
  });
  if (existing) {
    console.log(`  menu: "${existing.name}" already points at ${href}`);
    return;
  }

  const last = await prisma.mainNavItem.findFirst({
    where: { groupId: about.id },
    orderBy: { displayOrder: 'desc' },
  });
  await prisma.mainNavItem.create({
    data: {
      groupId: about.id,
      name: 'Layout Plan',
      href,
      displayOrder: (last?.displayOrder ?? 0) + 1,
    },
  });
  console.log('  menu: added About → Layout Plan');
}

async function main() {
  const [dept, offices] = await Promise.all([
    prisma.departmentIdentity.findUnique({ where: { id: 'singleton' } }),
    prisma.officeLocation.findMany({ orderBy: { displayOrder: 'asc' } }),
  ]);

  if (offices.length === 0) {
    throw new Error('no office locations — run scripts/import-office-locations.ts first');
  }

  const departmental = offices.filter((o) => o.isDepartment);
  const rest = offices.filter((o) => !o.isDepartment);

  const assets = path.join(process.cwd(), 'public', 'assets');
  await mkdir(assets, { recursive: true });

  // ── The PDF ─────────────────────────────────────────────────────
  const doc = new PDFDocument({
    size: 'A4',
    margin: PAGE_MARGIN,
    info: { Title: `${dept?.name ?? 'Department'} — Layout Plan` },
  });
  const stream = createWriteStream(path.join(assets, PDF_FILE));
  doc.pipe(stream);

  doc.font('Helvetica-Bold').fontSize(9).fillColor(MAGENTA).text('SONARGAON UNIVERSITY', { characterSpacing: 1.2 });
  doc.moveDown(0.2);
  doc.font('Helvetica').fontSize(10).fillColor(MUTED).text(dept?.name ?? '');
  doc.moveDown(0.8);
  doc.font('Helvetica-Bold').fontSize(21).fillColor(NAVY).text('Layout Plan');
  doc.moveDown(0.3);
  /* The address is identical on every row of the source, so it is stated once
     here rather than twenty-two times inside the table. */
  doc
    .font('Helvetica')
    .fontSize(9.5)
    .fillColor(MUTED)
    .text(`${offices.length} offices · 147/I, Green Road, Panthapath, Dhaka-1215`);

  if (departmental.length > 0) {
    sectionHeading(doc, 'This department');
    officeTable(doc, departmental);
    sectionHeading(doc, 'University offices');
    officeTable(doc, rest);
  } else {
    sectionHeading(doc, 'Where to find each office');
    officeTable(doc, offices);
  }

  doc.end();
  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  // ── The cover ───────────────────────────────────────────────────
  await buildCover(dept ?? { name: '' }, offices, path.join(assets, COVER_FILE));

  // ── The row and the menu ────────────────────────────────────────
  const row = {
    title: `${dept?.name ?? 'Department'} — Layout Plan`,
    shortTitle: 'Layout Plan',
    coverUrl: `/assets/${COVER_FILE}`,
    pdfUrl: `/assets/${PDF_FILE}`,
    pdfFileName: 'SU-NAME-Layout-Plan.pdf',
    displayOrder: 1,
  };
  await prisma.departmentLayout.upsert({
    where: { slug: SLUG },
    create: { slug: SLUG, ...row },
    update: row,
  });

  await addMenuEntry('/about/department-layout');

  console.log(`wrote public/assets/${PDF_FILE} and public/assets/${COVER_FILE}`);
  console.log(`  ${departmental.length} department offices, ${rest.length} university offices`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
