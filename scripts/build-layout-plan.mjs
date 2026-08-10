/**
 * The Layout Plan page: the department's own plan, its cover, and its place
 * in the About menu.
 *
 *   node --env-file=.env scripts/build-layout-plan.mjs <path to the plan PDF>
 *
 * /about/department-layout already listed every office against its level. It
 * was reachable only from search — no menu pointed at it — and it offered
 * nothing to take away. This gives it both.
 *
 * The download is the department's own signed document, copied in as a
 * bundled asset. An earlier version of this script generated the PDF from
 * the office rows, which guaranteed the page and the download agreed; the
 * department's document is the authority, so that guarantee is gone. If an
 * office row is edited in the admin panel, the page will say one thing and
 * the PDF another until the department issues a new plan — check the
 * document before editing a row.
 *
 * sharp is a devDependency: the cover is built here, written into
 * public/assets, and served statically. Nothing runs at request time, and
 * nothing depends on Cloudinary — PDF delivery is disabled on the account,
 * which is why the syllabus and prospectus are bundled files too.
 *
 * Safe to run again: it overwrites both files, updates the one layout row,
 * and leaves the menu alone if the entry is already there.
 */
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { PrismaClient } from '@prisma/client';

const [, , pdfArg] = process.argv;
if (!pdfArg) {
  console.error('usage: node --env-file=.env scripts/build-layout-plan.mjs <path to the plan PDF>');
  process.exit(1);
}
if (!existsSync(pdfArg)) {
  console.error(`No such file: ${pdfArg}`);
  process.exit(1);
}

const prisma = new PrismaClient();

const NAVY = '#2b3175';
const MAGENTA = '#cc1579';
const INK = '#1f2333';
const MUTED = '#6b6f85';
const RULE = '#dcdfeb';

const SLUG = 'department-layout-plan';

/**
 * Both files carry a hash of their own contents in the name.
 *
 * Next.js serves everything under public/ with `Cache-Control: max-age=1y,
 * immutable`. A browser takes `immutable` at its word: it will not ask
 * whether the file changed, not even on a reload. Replacing a document at
 * the same path therefore reaches nobody who had already opened the old one
 * — which is exactly what happened the first time this plan was replaced.
 * A new document means a new name, so the URL a visitor has cached is simply
 * no longer the one the page links to.
 */
const PDF_STEM = 'layout-plan-name';
const COVER_STEM = 'layout-plan-name-cover';

const digest = (buffer) => createHash('sha256').update(buffer).digest('hex').slice(0, 8);

/** Drop earlier builds of this asset so public/assets does not silt up. */
async function pruneOlder(dir, stem, keep) {
  const pattern = new RegExp(`^${stem}(-[0-9a-f]{8})?\\.[a-z]+$`);
  for (const name of await readdir(dir)) {
    if (name !== keep && pattern.test(name)) {
      await unlink(path.join(dir, name));
      console.log(`  removed stale ${name}`);
    }
  }
}

/** XML-escape — an office name with an ampersand would break the cover SVG. */
const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Trim to fit a fixed-width line, since SVG text does not wrap. */
const clip = (s, max) => (s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`);

/**
 * The card on the page wants a cover image. Every other cover on this site is
 * a photograph of a real document's first page; rasterising a PDF needs
 * tooling this project does not carry, so the cover is drawn from the same
 * office rows the document lists — a preview of what is inside, not an
 * imitation of a scan.
 */
async function buildCover(dept, offices) {
  /* Department offices lead, as they do in the table on the page — someone
     opening a department's plan is looking for the department first. */
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

  return sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toBuffer();
}

/** Put Layout Plan in the About menu, after the entries already there. */
async function addMenuEntry(href) {
  const about = await prisma.mainNavGroup.findFirst({ where: { name: 'About' } });
  if (!about) {
    console.log('  no About menu group — skipped the menu entry');
    return;
  }

  const existing = await prisma.mainNavItem.findFirst({ where: { groupId: about.id, href } });
  if (existing) {
    console.log(`  menu: "${existing.name}" already points at ${href}`);
    return;
  }

  const last = await prisma.mainNavItem.findFirst({
    where: { groupId: about.id },
    orderBy: { displayOrder: 'desc' },
  });
  await prisma.mainNavItem.create({
    data: { groupId: about.id, name: 'Layout Plan', href, displayOrder: (last?.displayOrder ?? 0) + 1 },
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

  const assets = path.join(process.cwd(), 'public', 'assets');
  await mkdir(assets, { recursive: true });

  const pdf = await readFile(pdfArg);
  const pdfFile = `${PDF_STEM}-${digest(pdf)}.pdf`;
  await writeFile(path.join(assets, pdfFile), pdf);
  await pruneOlder(assets, PDF_STEM, pdfFile);

  const cover = await buildCover(dept ?? { name: '' }, offices);
  const coverFile = `${COVER_STEM}-${digest(cover)}.jpg`;
  await writeFile(path.join(assets, coverFile), cover);
  await pruneOlder(assets, COVER_STEM, coverFile);

  const row = {
    title: `${dept?.name ?? 'Department'} — Layout Plan`,
    shortTitle: 'Departmental Layout Plan',
    coverUrl: `/assets/${coverFile}`,
    pdfUrl: `/assets/${pdfFile}`,
    /* What the browser saves it as — stable and readable, unlike the URL. */
    pdfFileName: 'SU-NAME-Layout-Plan.pdf',
    displayOrder: 1,
  };
  await prisma.departmentLayout.upsert({
    where: { slug: SLUG },
    create: { slug: SLUG, ...row },
    update: row,
  });

  await addMenuEntry('/about/department-layout');

  console.log(`copied ${path.basename(pdfArg)} → public/assets/${pdfFile}`);
  console.log(`wrote public/assets/${coverFile} previewing ${offices.length} offices`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
