/**
 * Render the department's service charter as a PDF.
 *
 *   node --env-file=.env scripts/build-service-charter-pdf.mjs
 *
 * Built from the charter rows, so what a student downloads is what the page
 * shows. Run it again after editing a service in the admin panel — nothing
 * regenerates this on its own, and until it is re-run the download will be
 * the previous wording.
 *
 * pdfkit is a devDependency: the file is written into public/assets and
 * served statically. Nothing generates PDFs at request time.
 *
 * The name carries a hash of the contents because Next.js serves public/ as
 * `immutable` for a year — a rebuild at the same path would never reach
 * anyone who had already opened the old one. The path is written to
 * src/generated/documents.json, which the page imports, so the two cannot
 * drift apart.
 */
import { createHash } from 'node:crypto';
import { createWriteStream, existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NAVY = '#2b3175';
const MAGENTA = '#cc1579';
const INK = '#1f2333';
const MUTED = '#6b6f85';
const RULE = '#dcdfeb';

const PAGE_MARGIN = 48;
const STEM = 'service-charter-name';
const MANIFEST = path.join(process.cwd(), 'src', 'generated', 'documents.json');

/** Windows ships a Bengali face; a charter that names a room in Bengali would
 *  otherwise come out as mojibake, as the curriculum once did. */
const BENGALI_FONT_CANDIDATES = [
  process.env.BENGALI_FONT_PATH,
  'C:/Windows/Fonts/Shonar.ttf',
  'C:/Windows/Fonts/vrinda.ttf',
  '/usr/share/fonts/truetype/lohit-bengali/Lohit-Bengali.ttf',
].filter(Boolean);

const BENGALI = /[\u0980-\u09FF]/;
const hasBengali = (text) => BENGALI.test(text);

/**
 * The built-in PDF fonts encode WinAnsi and nothing else. The charter uses a
 * few characters outside it \u2014 an arrow between the steps of a process, most
 * of all \u2014 and pdfkit renders those as noise rather than failing: "Course
 * Offering \u2192 Follow the Notice Board" came out as "Course Offering !' Follow
 * the Notice Board". Curly quotes and dashes are inside WinAnsi and are left
 * alone.
 */
const OUTSIDE_WINANSI = [
  [/[\u2192\u27A1\u21D2]/g, '->'],
  [/[\u2190\u21D0]/g, '<-'],
  [/[\u2022\u25CF\u25AA]/g, '-'],
  [/[\u2713\u2714]/g, '-'],
  [/\u2026/g, '...'],
];

function ascii(text) {
  let out = String(text ?? '');
  for (const [pattern, replacement] of OUTSIDE_WINANSI) out = out.replace(pattern, replacement);
  return out;
}

function bodyFont(doc, text, { bold = false } = {}) {
  if (hasBengali(text)) return doc.font('Bengali');
  return doc.font(bold ? 'Helvetica-Bold' : 'Helvetica');
}

/** The source packs name, role, phone, email and room into one cell. */
function responsibleLines(responsible) {
  return responsible
    .split(/\s*(?=Contact No:|e-mail:|Room no:)/i)
    .map((line) => line.trim())
    .filter(Boolean);
}

function ensureRoom(doc, needed) {
  if (doc.y + needed > doc.page.height - PAGE_MARGIN) doc.addPage();
}

function entry(doc, service) {
  const left = PAGE_MARGIN;
  const width = doc.page.width - PAGE_MARGIN * 2;
  const steps = Array.isArray(service.steps)
    ? service.steps.filter((s) => typeof s === 'string' && s.trim() !== '')
    : [];

  ensureRoom(doc, 90);

  const serialW = 22;
  const titleW = width - serialW;
  const titleTop = doc.y;

  doc.font('Helvetica-Bold').fontSize(10).fillColor(MAGENTA).text(`${service.serial}.`, left, titleTop, { width: serialW });
  bodyFont(doc, service.title, { bold: true })
    .fontSize(10.5)
    .fillColor(NAVY)
    .text(ascii(service.title), left + serialW, titleTop, { width: titleW });
  doc.moveDown(0.45);

  steps.forEach((step, index) => {
    ensureRoom(doc, 34);
    const y = doc.y;
    const marker = steps.length > 1 ? `${index + 1}` : '›';
    doc.font('Helvetica-Bold').fontSize(8).fillColor(MUTED).text(marker, left + serialW, y + 1, { width: 14 });
    bodyFont(doc, step)
      .fontSize(9.5)
      .fillColor(INK)
      .text(ascii(step), left + serialW + 16, y, { width: titleW - 16 });
    doc.moveDown(0.25);
  });

  if (service.responsible) {
    doc.moveDown(0.2);
    for (const line of responsibleLines(service.responsible)) {
      ensureRoom(doc, 16);
      bodyFont(doc, line)
        .fontSize(8.5)
        .fillColor(MUTED)
        .text(ascii(line), left + serialW + 16, doc.y, { width: titleW - 16 });
    }
  }

  doc.moveDown(0.6);
  ensureRoom(doc, 12);
  const y = doc.y;
  doc.moveTo(left, y).lineTo(left + width, y).lineWidth(0.5).strokeColor(RULE).stroke();
  doc.moveDown(0.6);
}

/** Drop earlier builds so public/assets does not silt up. */
async function pruneOlder(dir, stem, keep) {
  const pattern = new RegExp(`^${stem}(-[0-9a-f]{8})?\\.pdf$`);
  for (const name of await readdir(dir)) {
    if (name !== keep && pattern.test(name)) {
      await unlink(path.join(dir, name));
      console.log(`  removed stale ${name}`);
    }
  }
}

async function main() {
  const [dept, services] = await Promise.all([
    prisma.departmentIdentity.findUnique({ where: { id: 'singleton' } }),
    prisma.serviceCharterEntry.findMany({ orderBy: { displayOrder: 'asc' } }),
  ]);

  if (services.length === 0) {
    throw new Error('no service charter entries — run scripts/import-service-charter.ts first');
  }

  const assets = path.join(process.cwd(), 'public', 'assets');
  await mkdir(assets, { recursive: true });
  const working = path.join(assets, `${STEM}.building.pdf`);

  const doc = new PDFDocument({
    size: 'A4',
    margin: PAGE_MARGIN,
    info: { Title: `${dept?.name ?? 'Department'} — Service Charter` },
  });

  const everything = services
    .map((s) => `${s.title} ${JSON.stringify(s.steps)} ${s.responsible}`)
    .join(' ');
  if (hasBengali(everything)) {
    const fontPath = BENGALI_FONT_CANDIDATES.find((p) => existsSync(p));
    if (!fontPath) {
      throw new Error(
        'this charter contains Bengali and no Bengali font was found. Set BENGALI_FONT_PATH ' +
          `to a font that covers the script — tried: ${BENGALI_FONT_CANDIDATES.join(', ')}`,
      );
    }
    doc.registerFont('Bengali', fontPath);
    console.log(`Bengali text will use ${fontPath}`);
  }

  const stream = createWriteStream(working);
  doc.pipe(stream);

  doc.font('Helvetica-Bold').fontSize(9).fillColor(MAGENTA).text('SONARGAON UNIVERSITY', { characterSpacing: 1.2 });
  doc.moveDown(0.2);
  doc.font('Helvetica').fontSize(10).fillColor(MUTED).text(dept?.name ?? '');
  doc.moveDown(0.8);
  doc.font('Helvetica-Bold').fontSize(21).fillColor(NAVY).text('Service Charter');
  doc.moveDown(0.3);
  doc
    .font('Helvetica')
    .fontSize(9.5)
    .fillColor(MUTED)
    .text(
      `${services.length} services · what to do, in what order, and who to ask`,
    );
  doc.moveDown(0.9);

  let y = doc.y;
  doc.moveTo(PAGE_MARGIN, y).lineTo(doc.page.width - PAGE_MARGIN, y).lineWidth(1).strokeColor(MAGENTA).stroke();
  doc.moveDown(0.8);

  for (const service of services) entry(doc, service);

  doc.end();
  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  const hash = createHash('sha256').update(await readFile(working)).digest('hex').slice(0, 8);
  const fileName = `${STEM}-${hash}.pdf`;
  const relativePath = `/assets/${fileName}`;
  await rename(working, path.join(assets, fileName));
  await pruneOlder(assets, STEM, fileName);

  await mkdir(path.dirname(MANIFEST), { recursive: true });
  const manifest = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, 'utf8')) : {};
  manifest.serviceCharter = { url: relativePath, fileName: `${STEM}.pdf` };
  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(`wrote public${relativePath}`);
  console.log(`  ${services.length} services, path recorded in src/generated/documents.json`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
